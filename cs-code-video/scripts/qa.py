"""成片自检素材一键生成（只依赖 ffmpeg）
python3 qa.py out/final.mp4 [qa] [--strips 4.1,12.5] [--round 1]

生成：
  qa/sheet.png         每秒一帧的抽帧总览（480 宽）
  qa/sheet-phone.png   手机尺寸抽帧（360 宽），看字还清不清楚
  qa/strip-<t>.png     指定时间点起连续 12 帧，查快速动作/转场
  qa/cuts.txt          自动检测到的切镜时间点（默认给每个切镜点出一条 strip）
  qa/audio_wave.png    波形图 + 响度/峰值
  qa/review_log.md     追加一轮打分表模板（7 项，≥8 分才能交付）
然后 Read 这些图，按表打分、写最严重的 3 个问题。
"""
import json, os, re, subprocess, sys


def fr(x):
    a, b = x.split('/'); return float(a) / float(b)


def run(args, **kw):
    return subprocess.run(args, capture_output=True, text=True, **kw)


def main():
    if len(sys.argv) < 2: print(__doc__); return
    video = sys.argv[1]
    out = sys.argv[2] if len(sys.argv) > 2 and not sys.argv[2].startswith('--') else 'qa'
    av = sys.argv; opts = {av[i]: av[i + 1] for i in range(len(av) - 1) if av[i].startswith('--')}
    os.makedirs(out, exist_ok=True)

    info = json.loads(run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration:stream=codec_type,width,height,r_frame_rate',
                           '-of', 'json', video]).stdout)
    dur = float(info['format']['duration'])
    v = next(s for s in info['streams'] if s['codec_type'] == 'video')
    has_audio = any(s['codec_type'] == 'audio' for s in info['streams'])
    step = max(1, round(dur / 30))  # 最多约 30 格
    cols = 6; rows = max(1, -(-int(dur / step) // cols))
    for name, w in (('sheet', 480), ('sheet-phone', 360)):
        run(['ffmpeg', '-v', 'error', '-y', '-i', video, '-vf', f'fps=1/{step},scale={w}:-1,tile={cols}x{rows}:padding=4:color=white',
             '-frames:v', '1', f'{out}/{name}.png'], check=True)

    log = run(['ffmpeg', '-hide_banner', '-i', video, '-vf', "select='gt(scene,0.3)',showinfo", '-f', 'null', '-']).stderr
    cuts = [round(float(x), 2) for x in re.findall(r'pts_time:([0-9.]+)', log)]
    open(f'{out}/cuts.txt', 'w').write('\n'.join(map(str, cuts)))
    strips = [float(x) for x in opts['--strips'].split(',')] if '--strips' in opts else ([max(0, c - 0.2) for c in cuts[:6]] or [round(dur * k, 1) for k in (.25, .5, .75)])
    for t in strips:
        run(['ffmpeg', '-v', 'error', '-y', '-ss', str(t), '-i', video, '-vf', 'scale=320:-1,tile=12x1', '-frames:v', '1',
             f'{out}/strip-{t:.1f}.png'], check=True)

    loud = '无音轨'
    if has_audio:
        r = run(['ffmpeg', '-hide_banner', '-i', video, '-af', 'loudnorm=print_format=json', '-f', 'null', '-']).stderr
        m = json.loads(r[r.rfind('{'):r.rfind('}') + 1])
        loud = f"{m['input_i']} LUFS / 真峰值 {m['input_tp']} dBTP"
        run(['ffmpeg', '-v', 'error', '-y', '-i', video, '-filter_complex', 'showwavespic=s=1600x240:split_channels=0',
             '-frames:v', '1', f'{out}/audio_wave.png'], check=True)

    prev = open(f'{out}/review_log.md', encoding='utf-8').read() if os.path.exists(f'{out}/review_log.md') else ''
    rnd = opts.get('--round', str(prev.count('## 第') + 1))
    with open(f'{out}/review_log.md', 'a', encoding='utf-8') as f:
        f.write(f"""
## 第 {rnd} 轮 · {os.path.basename(video)}

规格：{v['width']}×{v['height']} · {fr(v['r_frame_rate']):.0f}fps · {dur:.1f}s · 声音 {loud} · 切镜 {len(cuts)} 处

| 项 | 分 | 依据 |
|---|---|---|
| 开场（前 2 秒抓不抓人） |  |  |
| 手机可读（360 宽） |  |  |
| 动作（无匀速滑动/空拍） |  |  |
| 变化（每 2–4 秒有新东西） |  |  |
| 构图（主体够大、不空不挤） |  |  |
| 贴合（配色/字体/事实与 brief 一致） |  |  |
| 声画同步（重拍/音效/字幕落在动作上） |  |  |

最严重的 3 个问题（时间点 + 改法）：
1.
2.
3.
""")
    print(f'规格 {v["width"]}x{v["height"]} {dur:.1f}s | 声音 {loud} | 切镜 {cuts[:10]}{"…" if len(cuts) > 10 else ""}')
    print('已生成：', ', '.join(sorted(os.listdir(out))))


if __name__ == '__main__':
    main()
