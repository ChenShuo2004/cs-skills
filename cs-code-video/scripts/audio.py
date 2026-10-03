"""代码视频的声音工具（只依赖 numpy + ffmpeg）
python3 audio.py sfx  cues.json out.wav      按时间点合成音效  cues: [{"t":1.2,"type":"click"}, ...]
python3 audio.py music out.wav --bpm 120 --bars 8 [--key 57]   合成一段简单配乐（鼓+贝斯+和弦）
python3 audio.py beats music.mp3 > beats.json   测节拍：bpm / beats / downbeats
python3 audio.py mix out.wav a.wav b.wav:0.3 ... [--len 30]   混音（:音量；--len 裁到成片时长）
python3 audio.py vo spec.json      拼接 tts.py 的逐句配音 → audio/vo.wav + timeline.json/.js（没配音的句子按每字 0.235s 占位）
python3 audio.py normalize in.wav out.wav   响度标准化到 -14 LUFS
python3 audio.py check in.wav qa/audio      打印响度 + 画波形图（模型听不到，只能看图）
类型：click pop whoosh thud ding riser glitch type
"""
import json, os, re, subprocess, sys
import numpy as np

SR = 48000


def env(n, a=0.002, d=0.1):
    t = np.arange(n) / SR
    return np.minimum(t / a, 1) * np.exp(-t / d)


def tone(f, dur, d=0.2, a=0.002, harm=(1, .5, .25)):
    t = np.arange(int(dur * SR)) / SR
    f = np.broadcast_to(f, t.shape)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return sum(h * np.sin(ph * (i + 1)) for i, h in enumerate(harm)) * env(len(t), a, d)


def noise(dur, seed=1):
    return np.random.default_rng(seed).standard_normal(int(dur * SR))


def sfx_one(kind, seed=1):
    if kind == 'click': return 0.5 * noise(0.03, seed) * env(int(0.03 * SR), 0.0005, 0.004) + 0.3 * tone(2400, 0.03, 0.01)
    if kind == 'pop': return 0.6 * tone(np.linspace(900, 300, int(0.12 * SR)), 0.12, 0.04)
    if kind == 'thud': return 0.9 * tone(np.linspace(120, 45, int(0.4 * SR)), 0.4, 0.12, harm=(1,))
    if kind == 'ding': return 0.4 * tone(1318.5, 1.2, 0.35, harm=(1, .3, .1)) + 0.2 * tone(1975.5, 1.2, 0.25, harm=(1,))
    if kind == 'type': return 0.25 * noise(0.03, seed) * env(int(0.03 * SR), 0.0005, 0.006)
    if kind == 'glitch':
        x = noise(0.18, seed); x = np.sign(x) * (np.abs(x) > 1.2); return 0.3 * x * env(len(x), 0.001, 0.08)
    if kind in ('whoosh', 'riser'):
        dur = 0.5 if kind == 'whoosh' else 1.5
        n = noise(dur, seed); k = np.linspace(0, 1, len(n))
        shape = np.sin(np.pi * k) ** 2 if kind == 'whoosh' else k ** 2
        sm = np.convolve(n, np.ones(8) / 8, 'same')  # 简易低通
        return 0.35 * (sm + 0.3 * n * k) * shape
    raise SystemExit(f'unknown sfx {kind}')


def place(cues, total=None):
    total = total or max(c['t'] for c in cues) + 2
    out = np.zeros(int(total * SR))
    for i, c in enumerate(cues):
        s = sfx_one(c.get('type', 'click'), i + 1) * c.get('gain', 1.0)
        a = int(c['t'] * SR); b = min(len(out), a + len(s)); out[a:b] += s[: b - a]
    return out


def music(bpm=120, bars=8, key=57):
    beat = 60 / bpm; n = int(bars * 4 * beat * SR); out = np.zeros(n + SR)
    prog = [0, -4, -7, -2]  # i–VI–III–VII（小调常见进行，key=57 是 A3）
    hz = lambda m: 440 * 2 ** ((m - 69) / 12)
    for b in range(bars * 4):
        a = int(b * beat * SR); root = key + prog[(b // 4) % 4]
        kick = 0.8 * tone(np.linspace(150, 45, int(0.3 * SR)), 0.3, 0.09, harm=(1,))
        out[a:a + len(kick)] += kick
        if b % 2 == 1:
            sn = 0.25 * noise(0.2, b) * env(int(0.2 * SR), 0.001, 0.05); out[a:a + len(sn)] += sn
        hh_a = a + int(beat / 2 * SR); hh = 0.08 * noise(0.05, b + 99) * env(int(0.05 * SR), 0.0005, 0.01)
        out[hh_a:hh_a + len(hh)] += hh
        bass = 0.3 * tone(hz(root - 12), beat * 0.9, beat * 0.5, harm=(1, .4)); out[a:a + len(bass)] += bass
        if b % 4 == 0:
            for iv in (0, 3, 7):
                for det in (-0.15, 0.15):  # 微失谐让和弦更厚
                    p = 0.06 * tone(hz(root + iv) * 2 ** (det / 12), beat * 4, beat * 2.5, a=0.08, harm=(1, .3, .15))
                    out[a:a + len(p)] += p
    return out[:n]


def load(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)


def save(x, path):
    peak = np.max(np.abs(x)) or 1
    if peak > 0.98: x = x / peak * 0.98
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', '-ac', '2', path],  # 输出双声道，平台按立体声测响度
                   input=x.astype(np.float32).tobytes(), check=True)


def measure(path):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-i', path, '-af', 'loudnorm=I=-14:TP=-1:print_format=json', '-f', 'null', '-'],
                       capture_output=True, text=True).stderr
    return json.loads(r[r.rfind('{'):r.rfind('}') + 1])


def beats(path):
    x = load(path); hop = 512
    frames = len(x) // hop
    e = np.array([np.sum(x[i * hop:(i + 1) * hop] ** 2) for i in range(frames)])
    onset = np.maximum(0, np.diff(np.log1p(e * 1000), prepend=0))
    fr = SR / hop
    ac = np.correlate(onset - onset.mean(), onset - onset.mean(), 'full')[len(onset) - 1:]
    lags = np.arange(len(ac)); bpms = 60 * fr / np.maximum(lags, 1)
    ok = (bpms >= 70) & (bpms <= 180)
    lag = lags[ok][np.argmax(ac[ok])]; bpm = 60 * fr / lag
    phase = max(range(int(lag)), key=lambda p: onset[p::int(lag)].sum())
    period = 60 / bpm; t0 = phase / fr
    grid = np.arange(t0, len(x) / SR, period)
    strength = [onset[int(t * fr)] if int(t * fr) < len(onset) else 0 for t in grid]
    bar_off = max(range(4), key=lambda k: sum(strength[k::4]))
    hits = (np.where(onset > onset.mean() + 2.5 * onset.std())[0] / fr).round(3).tolist()
    return {'bpm': round(bpm, 2), 'beats': grid.round(3).tolist(),
            'downbeats': grid[bar_off::4].round(3).tolist(), 'hits': hits}


def main():
    cmd, *a = sys.argv[1:] or ['-h']
    if cmd == 'sfx':
        save(place(json.load(open(a[0]))), a[1])
    elif cmd == 'music':
        o = dict(zip(a[1::2], a[2::2])); save(music(float(o.get('--bpm', 120)), int(o.get('--bars', 8)), int(o.get('--key', 57))), a[0])
    elif cmd == 'beats':
        print(json.dumps(beats(a[0])))
    elif cmd == 'mix':  # 混音；--len 秒数 = 成片时长（先裁再做响度，避免裁掉安静的尾巴后响度偏高）
        L = None
        if '--len' in a: k = a.index('--len'); L = float(a[k + 1]); a = a[:k] + a[k + 2:]
        parts = []
        for p in a[1:]:
            f, g = p.rsplit(':', 1) if re.search(r':[0-9.]+$', p) else (p, '1'); parts.append(load(f) * float(g))
        n = int(L * SR) if L else max(map(len, parts))
        save(sum(np.pad(p, (0, max(0, n - len(p))))[:n] for p in parts), a[0])
    elif cmd == 'vo':  # 拼接 tts.py 生成的逐句配音 → vo.wav + timeline.json（镜头时长由配音决定）
        d = os.path.dirname(os.path.abspath(a[0])); spec = json.load(open(a[0], encoding='utf-8'))
        gap = float(spec.get('lineGap', 0.25)); tail = float(spec.get('sceneTail', 0.5)); lead = float(spec.get('lead', 0.6))
        plain = lambda s: re.sub(r'\[/?[yrcg]\]', '', s)
        out, t, i, shots = [np.zeros(int(lead * SR))], lead, 0, []
        for sc in spec['scenes']:
            s0, lines = t - (lead if not shots else 0), []
            for l in sc.get('lines', []):
                o = {'text': l} if isinstance(l, str) else l
                f = os.path.join(d, 'audio', f'line_{i:03d}.mp3')
                x = load(f) if os.path.exists(f) else np.zeros(int(len(plain(o['text'])) * 0.235 * SR))
                lines.append({'i': i, 'text': o['text'], 'sub': o.get('sub', True), 'start': round(t, 3), 'end': round(t + len(x) / SR, 3)})
                out += [x, np.zeros(int((gap + o.get('pause', 0)) * SR))]; t += len(x) / SR + gap + o.get('pause', 0); i += 1
            out.append(np.zeros(int(tail * SR))); t += tail
            shots.append({'id': sc.get('id', len(shots)), 'start': round(s0, 3), 'end': round(t, 3), 'lines': lines})
        save(np.concatenate(out), os.path.join(d, 'audio', 'vo.wav'))
        tl = json.dumps({'duration': round(t, 3), 'shots': shots}, ensure_ascii=False, indent=1)
        open(os.path.join(d, 'timeline.json'), 'w', encoding='utf-8').write(tl)
        open(os.path.join(d, 'timeline.js'), 'w', encoding='utf-8').write('window.TIMELINE = ' + tl + ';\n')  # 页面用 <script src="timeline.js"> 读
        print(f'vo.wav + timeline.json  总长 {t:.1f}s  {i} 句')
    elif cmd == 'normalize':  # 增益 + 限幅，迭代两次：短片也能落在 -14 LUFS ±0.5，真峰值 ≤ -1 dBTP
        src = a[0]
        for k in range(3):
            I = measure(src)['input_i']
            if abs(float(I) + 14) < 0.5 and k: break
            gain = -14 - float(I)
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-af',
                            f'volume={gain:.2f}dB,aresample=192000,alimiter=limit=0.8:level=false:attack=1:release=50,aresample={SR}', '-ar', str(SR), a[1] + '.tmp.wav'], check=True)
            os.replace(a[1] + '.tmp.wav', a[1]); src = a[1]
        m = measure(a[1]); print(f"响度 {m['input_i']} LUFS，真峰值 {m['input_tp']} dBTP")
    elif cmd == 'check':
        r = subprocess.run(['ffmpeg', '-hide_banner', '-i', a[0], '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
        print(r[r.rfind('Summary'):].strip())
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', a[0], '-filter_complex', 'showwavespic=s=1600x300:split_channels=0', '-frames:v', '1', a[1] + '_wave.png'], check=True)
        print('波形图 →', a[1] + '_wave.png')
    else:
        print(__doc__)


if __name__ == '__main__':
    main()
