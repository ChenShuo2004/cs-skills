# 配乐 + 音效：读取 <项目目录>/spec.json 与 timeline.json，生成 <项目目录>/score.wav（48kHz 立体声）
# 用法：python score.py <项目目录>
# 声音设计参照原片：A 小调低频长音 + 温暖铺底和弦 + 玻璃钟琴音 + 与画面事件对齐的音效（打字、转轮、呼啸、撞击、闪光）
# 依赖：numpy、scipy（pip install numpy scipy）
import json, os, re, sys
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve
from scipy.io import wavfile

SR = 48000
DIR = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else ".")
spec = json.load(open(os.path.join(DIR, "spec.json"), encoding="utf-8"))
tl = json.load(open(os.path.join(DIR, "timeline.json"), encoding="utf-8"))
TOTAL = tl["total"] + 3.0
N = int(TOTAL * SR)
rng = np.random.default_rng(7)

DRY = np.zeros((2, N), dtype=np.float32)   # 不进混响
WET = np.zeros((2, N), dtype=np.float32)   # 进混响（钟、铺底）


def hz(note):
    names = {"C": -9, "C#": -8, "Db": -8, "D": -7, "D#": -6, "Eb": -6, "E": -5, "F": -4, "F#": -3, "Gb": -3,
             "G": -2, "G#": -1, "Ab": -1, "A": 0, "A#": 1, "Bb": 1, "B": 2}
    m = re.match(r"([A-G][#b]?)(-?\d)", note)
    return 440.0 * 2 ** ((names[m.group(1)] + (int(m.group(2)) - 4) * 12) / 12)


# 和弦：低音根音 + 铺底音 + 钟琴可用音阶
CHORDS = {
    "Am9":   ("A1", ["A2", "E3", "C4", "G4", "B4"], ["A5", "C6", "E6", "G5", "B5", "E5"]),
    "Fmaj7": ("F1", ["F2", "C3", "A3", "E4", "G4"], ["A5", "C6", "E6", "F5", "G5", "C5"]),
    "Dm9":   ("D2", ["D2", "A2", "F3", "C4", "E4"], ["D6", "F5", "A5", "C6", "E5", "E6"]),
    "Cmaj7": ("C2", ["C2", "G2", "E3", "B3", "D4"], ["E5", "G5", "B5", "C6", "D6", "E6"]),
    "Em7":   ("E1", ["E2", "B2", "G3", "D4", "F#4"], ["E5", "G5", "B5", "D6", "E6", "B4"]),
    "Gsus":  ("G1", ["G2", "D3", "A3", "C4", "D4"], ["G5", "A5", "C6", "D6", "E6", "D5"]),
}
PROG = spec.get("progression", ["Am9", "Fmaj7", "Am9", "Dm9", "Cmaj7", "Fmaj7", "Em7", "Am9"])


def lp(x, f, order=2):
    return sosfilt(butter(order, min(f, SR / 2 - 100), "low", fs=SR, output="sos"), x)


def hp(x, f, order=2):
    return sosfilt(butter(order, f, "high", fs=SR, output="sos"), x)


def bp(x, f1, f2):
    return sosfilt(butter(2, [f1, min(f2, SR / 2 - 100)], "band", fs=SR, output="sos"), x)


def put(buf, t, sig, pan=0.0, gain=1.0):
    i = int(t * SR)
    if i >= N or i + len(sig) <= 0:
        return
    if i < 0:
        sig = sig[-i:]; i = 0
    sig = sig[: N - i] * gain
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    buf[0, i:i + len(sig)] += sig * l * 1.414
    buf[1, i:i + len(sig)] += sig * r * 1.414


def env_ad(n, a, d_tau):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-np.maximum(0, t - a) / d_tau)


# ---------- 音源 ----------
def bell(f, dur=3.5, bright=1.0):
    """玻璃钟琴：FM + 非谐泛音"""
    n = int(dur * SR); t = np.arange(n) / SR
    idx = 2.2 * bright * np.exp(-t / 0.35)
    s = np.sin(2 * np.pi * f * t + idx * np.sin(2 * np.pi * f * 3.5 * t))
    s += 0.35 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t / 0.5)
    s += 0.18 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t / 0.18)
    return s * env_ad(n, 0.003, dur / 3.2) * 0.22


def tick(bright=5000, dur=0.03):
    n = int(dur * SR)
    s = rng.standard_normal(n) * np.exp(-np.arange(n) / SR / 0.004)
    return bp(s, bright * 0.6, bright * 1.4) * 0.35


BANDS = [200 * 1.35 ** k for k in range(14)]


def sweep_noise(dur, f0, f1):
    """滤波器组做平滑扫频噪声（避免分段滤波的咔哒声）"""
    n = int(dur * SR); q = np.arange(n) / n
    fc = f0 * (f1 / f0) ** q
    noise = rng.standard_normal(n); out = np.zeros(n)
    for c in BANDS:
        w = np.exp(-(np.log(fc / c)) ** 2 / (2 * 0.3 ** 2))
        if w.max() < 1e-3: continue
        out += bp(noise, c / 1.18, c * 1.18) * w
    return out


def whoosh(dur=1.2, f0=400, f1=4000, amp=0.25):
    n = int(dur * SR); q = np.arange(n) / n
    return sweep_noise(dur, f0, f1) * np.sin(np.pi * q) ** 2 * amp


def riser(dur=1.5):
    n = int(dur * SR); q = np.arange(n) / n
    s = sweep_noise(dur, 300, 7000) * q ** 2.5 * 0.35
    gl = np.sin(2 * np.pi * np.cumsum(220 * 2 ** (2 * q)) / SR) * 0.06 * q ** 2
    return s + gl


def boom(f0=70, dur=3.0, amp=0.9):
    n = int(dur * SR); t = np.arange(n) / SR
    f = f0 * (0.6 + 0.4 * np.exp(-t / 0.25))
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.9)
    s += lp(rng.standard_normal(n), 300) * np.exp(-t / 0.08) * 0.4
    return s * amp


def glitch(dur=0.25):
    n = int(dur * SR)
    s = rng.standard_normal(n) * (rng.random(n) < 0.08)
    s = hp(s, 1500) * np.exp(-np.arange(n) / SR / (dur / 3))
    return s * 0.5


def shimmer(dur=2.5, notes=None):
    out = np.zeros(int((dur + 3) * SR))
    for k in range(10):
        f = hz(notes[k % len(notes)]) * 2 if notes else 1760 * 2 ** (rng.integers(0, 12) / 12)
        b = bell(f, 2.0, 0.4) * 0.35
        i = int(rng.random() * dur * SR)
        out[i:i + len(b)] += b[: len(out) - i]
    return out


def gliss(f0, f1, dur=0.6, amp=0.12):
    n = int(dur * SR); t = np.arange(n) / SR; q = t / dur
    f = f0 * (f1 / f0) ** (q ** 0.7)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * q) * amp


# ---------- 铺底：低音 + 和弦 pad + 空气噪声 ----------
def pad_segment(chord, dur):
    root, notes, _ = CHORDS[chord]
    n = int(dur * SR); t = np.arange(n) / SR
    L = np.zeros(n); R = np.zeros(n)
    for j, nt in enumerate(notes):
        f = hz(nt)
        for d, (gl, gr) in zip((-0.0025, 0.0, 0.0025), ((1, .3), (.7, .7), (.3, 1))):
            ff = f * (1 + d)
            wave = np.zeros(n)
            for h in range(1, 7):
                if ff * h > 5000: break
                wave += np.sin(2 * np.pi * ff * h * t + j + h) / h ** 1.6
            lfo = 0.75 + 0.25 * np.sin(2 * np.pi * (0.05 + 0.013 * j) * t + j)
            L += wave * lfo * gl; R += wave * lfo * gr
    L, R = lp(L, 1400), lp(R, 1400)
    fr = hz(root)
    sub = np.sin(2 * np.pi * fr * t) + 0.3 * np.sin(2 * np.pi * fr * 2 * t)
    sub *= 0.8 + 0.2 * np.sin(2 * np.pi * 0.07 * t)
    return np.vstack([L, R]) * 0.028, sub * 0.16


XF = 2.5
for i, sc in enumerate(tl["scenes"]):
    chord = spec["scenes"][i].get("chord") or PROG[i % len(PROG)]
    s0, s1 = sc["start"], sc["end"]
    if i == len(tl["scenes"]) - 1:
        s1 += 3.0
    seg, sub = pad_segment(chord, s1 - s0 + XF)
    n = seg.shape[1]; t = np.arange(n) / SR
    fade = np.minimum(1, t / XF) * np.minimum(1, (n / SR - t) / XF)
    if i == 0:
        fade = np.minimum(1, t / 3.0) * np.minimum(1, (n / SR - t) / XF)
    lvl = spec["scenes"][i].get("musicLevel", 1.0)
    i0 = int(max(0, s0 - XF / 2) * SR); m = min(n, N - i0)
    WET[:, i0:i0 + m] += (seg * fade * lvl)[:, :m]
    DRY[0, i0:i0 + m] += (sub * fade * lvl)[:m]; DRY[1, i0:i0 + m] += (sub * fade * lvl)[:m]

air = lp(hp(rng.standard_normal(N), 2500), 7000) * 0.006
air *= 0.6 + 0.4 * np.sin(2 * np.pi * 0.03 * np.arange(N) / SR)
DRY[0] += air; DRY[1] += np.roll(air, 977)


# ---------- 与画面事件对齐的音效 ----------
def eo(k):
    k = min(1, max(0, k)); return 1 - (1 - k) ** 3


def resolver(si):
    ts = tl["scenes"][si]; lines = [l for l in tl["lines"] if l["scene"] == si]; dur = ts["end"] - ts["start"]

    def at(v):
        if v is None: return 0.0
        if isinstance(v, (int, float)): return float(v)
        m = re.match(r"^(?:L(\d+)(e?)|(end))\s*([+-]\s*[\d.]+)?$", str(v).strip())
        if not m:
            try: return float(v)
            except ValueError: return 0.0
        if m.group(3): b = dur
        else:
            k = int(m.group(1)) - 1
            b = ((lines[k]["end"] if m.group(2) else lines[k]["start"]) - ts["start"]) if 0 <= k < len(lines) else 0
        return b + (float(m.group(4).replace(" ", "")) if m.group(4) else 0)
    return at


chapter_prev = None
for si, sc in enumerate(spec["scenes"]):
    T0 = tl["scenes"][si]["start"]; at = resolver(si); p = sc.get("props", {}) or {}
    chord = sc.get("chord") or PROG[si % len(PROG)]; scale = CHORDS[chord][2]
    evs = sc.get("events", []) or []
    E = lambda name: sorted([(at(e.get("at")), e) for e in evs if e.get("do") == name], key=lambda x: x[0])
    note = lambda k: hz(scale[k % len(scale)])

    # 转场：呼啸 + 新章节的低音
    if si > 0:
        put(DRY, T0 - 0.9, whoosh(1.4, 300, 2500, 0.10), pan=-0.3)
    ch = sc.get("chapter")
    if ch and ch is not False and ch != chapter_prev:
        put(DRY, T0 + 0.3, boom(hz(CHORDS[chord][0]) * 1.0, 3.0, 0.35))
        put(WET, T0 + 0.35, bell(note(0) / 2, 4.5, 0.6), gain=0.8)
    if ch is not None:
        chapter_prev = ch if ch else None

    t_ = sc["type"]
    if t_ == "typewriter":
        for b in p.get("beats", []):
            bt = at(b.get("at")); txt = re.sub(r"\[/?[gcirdw]\]", "", b["text"]); cps = b.get("cps", 5.5)
            for k, chx in enumerate(txt):
                tt = T0 + bt + 0.15 + k / cps
                put(DRY, tt, tick(3500 + 800 * rng.random()), pan=rng.uniform(-.3, .3), gain=0.55)
                if k % 2 == 0: put(WET, tt, bell(note(k // 2), 2.2, 0.4), pan=rng.uniform(-.4, .4), gain=0.28)
            done = bt + 0.15 + len(txt) / cps
            slot = b.get("slot")
            if slot:
                opts = slot.get("options", []); spin = slot.get("spin", 1.6); last = -1
                for s in np.arange(0, spin, 1 / 240):
                    pos = int(eo(s / spin) * (len(opts) - 1))
                    if pos != last:
                        put(DRY, T0 + done + s, tick(6000, 0.02), pan=0.2, gain=0.8); last = pos
                tp = T0 + done + spin
                put(WET, tp, bell(note(0) * 2, 4, 1.2), gain=0.8); put(WET, tp + 0.04, bell(note(2) * 2, 4, 1.0), gain=0.55)
                put(DRY, tp, boom(110, 1.5, 0.25))
            if b.get("blank"):
                put(WET, T0 + done + 0.2, bell(note(3), 5, 0.5), gain=0.5)
    if t_ == "title":
        hit = at(p.get("hitAt", 1.5))
        put(DRY, T0 + hit - 1.5, riser(1.5), gain=0.9)
        put(DRY, T0 + hit, boom(55, 4.5, 0.8))
        for k, nt in enumerate(CHORDS[chord][1][1:4]):
            put(WET, T0 + hit + k * 0.02, bell(hz(nt) * 4, 6, 0.8), pan=(k - 1) * 0.5, gain=0.7)
        put(WET, T0 + hit + 0.3, shimmer(2.5, scale), gain=0.5)
    if t_ == "numberline":
        for tt, e in E("ask"): put(WET, T0 + tt, bell(note(1), 3.5, 0.8), gain=0.6)
        s = E("search")
        if s:
            st0, e = s[0]; st1 = at(e.get("until")) if e.get("until") else st0 + 12
            lo, hi, target, steps = p.get("min", 1), p.get("max", 1024), p.get("target", 693), []
            while lo < hi:
                mid = (lo + hi) // 2; yes = target > mid; steps.append(yes)
                lo, hi = (mid + 1, hi) if yes else (lo, mid)
            sd = (st1 - st0) / max(1, len(steps))
            for j, yes in enumerate(steps):
                tq = T0 + st0 + j * sd
                put(DRY, tq - 0.15, whoosh(0.5, 800, 5000, 0.08), pan=-0.2)
                put(WET, tq + 0.38 * sd, bell(note(j + (2 if yes else 0)), 2.5, 0.9), pan=0.3 if yes else -0.3, gain=0.6)
                put(DRY, tq + 0.45 * sd, tick(2500, 0.05), gain=0.6)
        for tt, e in E("reveal"):
            put(DRY, T0 + tt, boom(hz(CHORDS[chord][0]) * 2, 3, 0.5))
            for k in range(3): put(WET, T0 + tt + k * 0.06, bell(note(k * 2) * 2, 5, 1.0), pan=(k - 1) * .4, gain=0.6)
    if t_ == "probs":
        items = p.get("items", [])
        for tt, e in E("show"):
            for k in range(len(items)):
                put(WET, T0 + tt + k * 0.12, bell(note(len(items) - k), 2.2, 0.5), pan=-0.5 + k * 0.25, gain=0.35)
        for tt, e in E("pick"):
            put(DRY, T0 + tt + 0.2, gliss(400, 1400, 0.8, 0.05))
            put(WET, T0 + tt + 1.0, bell(note(0) * 2, 4.5, 1.2), gain=0.7); put(DRY, T0 + tt + 1.0, boom(110, 1.5, 0.2))
            if e.get("flagAt") is not None:   # 选错了：低音 + 小二度不和谐钟声
                tf = T0 + at(e["flagAt"])
                put(DRY, tf, boom(48, 2.5, 0.5)); put(DRY, tf, glitch(0.3), gain=0.5)
                put(WET, tf, bell(note(0), 3.5, 1.6), pan=-0.3, gain=0.5); put(WET, tf + 0.03, bell(note(0) * 1.0595, 3.5, 1.6), pan=0.3, gain=0.5)
        for tt, e in E("temp"):
            up = e.get("value", 1) > 1
            put(DRY, T0 + tt, whoosh(1.2, 300 if up else 3000, 4000 if up else 300, 0.1))
            put(WET, T0 + tt + 0.2, bell(note(4 if up else 0), 3, 0.7 + (0.8 if up else 0)), gain=0.4)
    if t_ == "landscape":
        for tt, e in E("light") + E("lamp"):
            put(DRY, T0 + tt, boom(hz(CHORDS[chord][0]) * 2, 2.5, 0.25))
            put(WET, T0 + tt, bell(note(int(e.get("x", 0.5) * 10)), 4.5, 0.7), pan=(e.get("x", .5) - .5) * 1.4, gain=0.55)
        for tt, e in E("orb"): put(WET, T0 + tt, shimmer(min(3, e.get("dur", 2.5)), scale), gain=0.35)
        for tt, e in E("travel"): put(DRY, T0 + tt, gliss(220, 330, e.get("dur", 3), 0.03))
    if t_ == "city":
        for tt, e in E("snow"): put(WET, T0 + tt, shimmer(4, scale), gain=0.45)
        for tt, e in E("headline"):
            put(DRY, T0 + tt, boom(90, 1.2, 0.4)); put(WET, T0 + tt, bell(note(3) * 2, 2, 1.8), gain=0.5)
    if t_ == "formula":
        for k, r in enumerate(p.get("rows", [])):
            put(WET, T0 + at(r.get("at", k * 1.2)), bell(note(k * 2), 4, 0.8), pan=(k - 1) * 0.3, gain=0.55)
    if t_ == "textplay":
        for tt, e in E("scramble") + E("replace"):
            for k in range(14): put(DRY, T0 + tt + k * 0.05, tick(4000 + 3000 * rng.random(), 0.02), pan=rng.uniform(-.6, .6), gain=0.5)
        for tt, e in E("dim"):
            put(DRY, T0 + tt, whoosh(1.0, 3000, 400, 0.08))
            if e.get("color") == "red": put(DRY, T0 + tt + 0.4, boom(52, 2, 0.35)); put(WET, T0 + tt + 0.4, bell(note(0) * 1.0595, 3, 1.4), gain=0.4)
        for tt, e in E("mask"):
            for k in range(6): put(DRY, T0 + tt + k * 0.07, glitch(0.2), pan=rng.uniform(-.5, .5), gain=0.6)
            put(DRY, T0 + tt, boom(60, 1.2, 0.3))
        for tt, e in E("wave"):
            if e.get("noise", 0) > 0.35:
                n = int(3.5 * SR); nz = bp(rng.standard_normal(n), 800, 6000) * np.minimum(1, np.arange(n) / SR / 0.4) * np.exp(-np.arange(n) / SR / 2.5) * 0.05
                put(DRY, T0 + tt, nz)
        for tt, e in E("ring"): put(WET, T0 + tt, shimmer(1.5, scale), gain=0.4)
        for tt, e in E("note") + E("bars"): put(WET, T0 + tt, bell(note(2), 3, 0.6), gain=0.35)
    if t_ == "signal":
        dur = tl["scenes"][si]["end"] - T0
        for k in np.arange(0.3, dur - 0.3, 0.8): put(DRY, T0 + k, tick(5000, 0.015), pan=np.sin(k), gain=0.35)
        for tt, e in E("noise"):
            for k in range(20): put(DRY, T0 + tt + k * 0.15, glitch(0.15), pan=rng.uniform(-.7, .7), gain=0.4)
        for tt, e in E("ecc") + E("formula"): put(WET, T0 + tt, bell(note(1), 4, 0.8), gain=0.5)
    if t_ == "probe":
        for tt, e in E("decode"): put(WET, T0 + tt, shimmer(2, scale), gain=0.5)
    if t_ in ("compare", "cards"):
        for tt, e in E("swap") + E("same"): put(DRY, T0 + tt, whoosh(0.8, 2000, 300, 0.1)); put(WET, T0 + tt, bell(note(0), 3, 0.5), gain=0.4)
    if t_ == "orb":
        put(WET, T0 + 0.5, bell(note(0), 6, 0.3), gain=0.5)
    # 通用
    for k, (tt, e) in enumerate(E("stat")): put(WET, T0 + tt, bell(note(k + 1) * 2, 2, 0.6), pan=-0.6, gain=0.3); put(DRY, T0 + tt, tick(3000), pan=-0.6, gain=0.5)
    for tt, e in E("caption"): put(WET, T0 + tt, bell(note(0), 4, 0.4), gain=0.35)
    for tt, e in E("flash"): put(DRY, T0 + tt, boom(60, 2, 0.5))

# 片尾：主和弦钟声收束
end = tl["scenes"][-1]["end"]
for k, nt in enumerate(CHORDS[spec["scenes"][-1].get("chord") or PROG[(len(tl["scenes"]) - 1) % len(PROG)]][2][:3]):
    put(WET, end - 1.6 + k * 0.25, bell(hz(nt), 6, 0.5), pan=(k - 1) * .5, gain=0.45)


# ---------- 混响：合成大厅脉冲响应 ----------
def impulse(dur=4.2, tau=1.3):
    n = int(dur * SR); t = np.arange(n) / SR
    irs = []
    for s in (11, 23):
        x = np.random.default_rng(s).standard_normal(n) * np.exp(-t / tau)
        lo = lp(x, 2500); x = lo + (x - lo) * np.exp(-t / 0.35)   # 高频衰减更快，尾巴更暖
        x[: int(0.02 * SR)] *= np.linspace(0, 1, int(0.02 * SR))
        irs.append((x / np.sqrt(np.sum(x ** 2))).astype(np.float32))
    return irs


ir = impulse()
wet = np.vstack([fftconvolve(WET[0], ir[0])[:N], fftconvolve(WET[1], ir[1])[:N]])
mix = DRY + WET * 0.55 + wet * 1.1
mix = hp(mix, 28)
mix = np.tanh(mix * 1.2) / 1.2                     # 柔和饱和，压住尖峰
fade = np.minimum(1, np.arange(N) / SR / 0.5) * np.clip((TOTAL - np.arange(N) / SR) / 2.5, 0, 1)
mix *= fade
mix *= 0.5 / (np.sqrt(np.mean(mix ** 2)) * 4 + 1e-9)  # 先大致对齐电平，最终响度在 render 里 loudnorm
mix = np.clip(mix, -0.98, 0.98)
wavfile.write(os.path.join(DIR, "score.wav"), SR, (mix.T * 32767).astype(np.int16))
print(f"score.wav: {TOTAL:.1f}s, {len(spec['scenes'])} 场景, 和弦进行 {PROG}")
