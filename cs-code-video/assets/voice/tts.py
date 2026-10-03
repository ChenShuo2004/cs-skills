# 配音脚本（在你自己的电脑上运行，需要能联网）
# 读取同目录 spec.json，逐句生成 audio/line_000.mp3 ...
# 用法：python tts.py            （已存在的句子会跳过，改了文案就删掉对应 mp3 重跑）
import asyncio, json, os, re, sys

try:
    import edge_tts
except ImportError:
    os.system(f'"{sys.executable}" -m pip install -q edge-tts')
    import edge_tts

HERE = os.path.dirname(os.path.abspath(__file__))
spec = json.load(open(os.path.join(HERE, "spec.json"), encoding="utf-8"))
VOICE = spec.get("voice", "zh-CN-YunxiNeural")
RATE = spec.get("rate", "+0%")
PITCH = spec.get("pitch", "+0Hz")
plain = lambda s: re.sub(r"\[/?[yrcg]\]", "", s)

lines = []
for sc in spec["scenes"]:
    for l in sc.get("lines", []):
        o = {"text": l} if isinstance(l, str) else l
        lines.append(o.get("say") or plain(o["text"]))

os.makedirs(os.path.join(HERE, "audio"), exist_ok=True)


async def one(i, text):
    out = os.path.join(HERE, "audio", f"line_{i:03d}.mp3")
    if os.path.exists(out) and os.path.getsize(out) > 0:
        return
    for attempt in range(4):
        try:
            await edge_tts.Communicate(text, VOICE, rate=RATE, pitch=PITCH).save(out)
            print(f"[{i + 1}/{len(lines)}] {text}")
            return
        except Exception as e:
            print(f"  重试 {attempt + 1}: {e}")
            await asyncio.sleep(2)
    raise SystemExit(f"第 {i + 1} 句配音失败")


async def main():
    sem = asyncio.Semaphore(4)

    async def run(i, t):
        async with sem:
            await one(i, t)

    await asyncio.gather(*(run(i, t) for i, t in enumerate(lines)))
    open(os.path.join(HERE, "audio", "DONE"), "w").write(str(len(lines)))
    print(f"\n配音完成：{len(lines)} 句，音色 {VOICE}")


asyncio.run(main())
