# 配音：读取 <项目目录>/spec.json，逐句生成 <项目目录>/audio/line_000.mp3 ...
# 用法：python tts.py <项目目录>     已存在的句子会跳过；改了哪句文案，就删掉对应 mp3 再跑
# 需要能访问微软 Edge TTS（免费，无需 Key）
import asyncio, hashlib, json, os, re, sys

try:
    import edge_tts
except ImportError:
    raise SystemExit("缺少 edge-tts：请先运行 python3 -m pip install edge-tts")

DIR = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else ".")
spec = json.load(open(os.path.join(DIR, "spec.json"), encoding="utf-8"))
VOICE = spec.get("voice", "zh-CN-YunjianNeural")
RATE = spec.get("rate", "-6%")
PITCH = spec.get("pitch", "-2Hz")
plain = lambda s: re.sub(r"\[/?[gcirdw]\]", "", s or "")

lines = []
for sc in spec["scenes"]:
    for l in sc.get("lines", []):
        o = {"text": l} if isinstance(l, str) else l
        lines.append(o.get("say") or plain(o["text"]))

os.makedirs(os.path.join(DIR, "audio"), exist_ok=True)
manifest_path = os.path.join(DIR, "audio", ".tts-manifest.json")
try:
    with open(manifest_path, encoding="utf-8") as f:
        manifest = json.load(f)
except (FileNotFoundError, json.JSONDecodeError):
    manifest = {}
updated = {}


async def one(i, text):
    out = os.path.join(DIR, "audio", f"line_{i:03d}.mp3")
    key = hashlib.sha256(json.dumps([text, VOICE, RATE, PITCH], ensure_ascii=False).encode()).hexdigest()
    if manifest.get(str(i)) == key and os.path.exists(out) and os.path.getsize(out) > 0:
        updated[str(i)] = key
        return
    for attempt in range(4):
        try:
            tmp = out + ".tmp"
            await edge_tts.Communicate(text, VOICE, rate=RATE, pitch=PITCH).save(tmp)
            os.replace(tmp, out)
            updated[str(i)] = key
            print(f"[{i + 1}/{len(lines)}] {text}")
            return
        except Exception as e:
            if os.path.exists(tmp):
                os.unlink(tmp)
            print(f"  重试 {attempt + 1}: {e}")
            await asyncio.sleep(2)
    raise SystemExit(f"第 {i + 1} 句配音失败")


async def main():
    sem = asyncio.Semaphore(4)

    async def run(i, t):
        async with sem:
            await one(i, t)

    await asyncio.gather(*(run(i, t) for i, t in enumerate(lines)))
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(updated, f, ensure_ascii=False, indent=2)
    print(f"\n配音完成：{len(lines)} 句，音色 {VOICE}")


asyncio.run(main())
