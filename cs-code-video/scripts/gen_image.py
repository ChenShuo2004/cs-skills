#!/usr/bin/env python3
"""
GPT 出图：按资产清单批量生成 / 编辑图片，给代码动画用。

用法（在能访问 OpenAI 的电脑上跑，需要环境变量 OPENAI_API_KEY 和 `pip install openai pillow`）：
  python3 scripts/gen_image.py assets.json --dry-run            # 只列出要出哪些图、几张、用什么模型，不花钱
  python3 scripts/gen_image.py assets.json --draft              # 草稿：快模型，每张出 n 个候选到 images/draft/
  python3 scripts/gen_image.py assets.json --final              # 定稿：精修模型，出到 images/<id>.png
  python3 scripts/gen_image.py assets.json --final --only s03,avatar
  python3 scripts/gen_image.py assets.json --pick s03=2         # 把草稿第 2 张设为定稿（不重新生成）
  python3 scripts/gen_image.py assets.json --export-md          # 没有 Key：导出 prompts.md，去 ChatGPT 手动出图

assets.json 结构：
{
  "style": "整片统一的风格提示词（每张图都会带上）",
  "refs": { "kai": "refs/kai-sheet.png", "cat": "refs/kai-cat.png" },   # 角色设定图，保证长得一样
  "defaults": { "size": "1536x1024", "background": "opaque" },
  "items": [
    { "id": "s03_desk", "prompt": "KAI 坐在书桌前翻笔记本……", "refs": ["kai"] },
    { "id": "avatar", "prompt": "KAI 头像，圆形，三种嘴型横排：闭嘴/半张/张大", "refs": ["kai"],
      "size": "1536x1024", "background": "transparent", "split": 3 },
    { "id": "card_moon", "prompt": "……", "size": "1024x1536" }
  ]
}
- 有 refs 的条目走 images.edit（参考图 + 高保真），没有的走 images.generate
- split: N  横向等分切成 N 张：<id>_0.png … <id>_{N-1}.png（做头像嘴型、表情、动作帧）
- 同样的参数不会重复花钱：结果按参数哈希缓存在 images/.cache.json
"""
import argparse, base64, hashlib, json, os, sys, time
from pathlib import Path

DRAFT_MODEL = os.environ.get('KAI_IMAGE_DRAFT_MODEL', 'gpt-image-2.5-flare')
FINAL_MODEL = os.environ.get('KAI_IMAGE_FINAL_MODEL', 'gpt-image-2.5-sunburst')
DRAFT_QUALITY, FINAL_QUALITY = 'medium', 'high'


def load(path):
    spec = json.loads(Path(path).read_text(encoding='utf-8'))
    root = Path(path).resolve().parent
    d = spec.get('defaults', {})
    items = []
    for it in spec['items']:
        x = {'size': '1536x1024', 'background': 'opaque', 'refs': [], 'split': 0, **d, **it}
        x['ref_files'] = [str(root / spec['refs'][r]) for r in x['refs']]
        for f in x['ref_files']:
            if not Path(f).exists():
                sys.exit(f'参考图不存在：{f}（条目 {x["id"]}）')
        x['full_prompt'] = (spec.get('style', '').strip() + '\n\n' + x['prompt'].strip()).strip()
        items.append(x)
    return spec, root, items


def key_of(it, model, quality):
    h = hashlib.sha256()
    for f in it['ref_files']:
        h.update(Path(f).read_bytes())
    h.update(json.dumps([it['full_prompt'], it['size'], it['background'], model, quality], ensure_ascii=False).encode())
    return h.hexdigest()[:16]


def split_strip(path, n):
    from PIL import Image
    im = Image.open(path)
    w = im.width // n
    outs = []
    for i in range(n):
        p = path.with_name(f'{path.stem}_{i}.png')
        im.crop((i * w, 0, (i + 1) * w, im.height)).save(p)
        outs.append(p)
    return outs


def call(client, it, model, quality, n):
    args = dict(model=model, prompt=it['full_prompt'], size=it['size'], quality=quality, n=n, background=it['background'])
    if it['ref_files']:
        files = [open(f, 'rb') for f in it['ref_files']]
        try:
            r = client.images.edit(image=files, input_fidelity='high', **args)
        finally:
            for f in files:
                f.close()
    else:
        r = client.images.generate(**args)
    return [base64.b64decode(d.b64_json) for d in r.data]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('spec')
    g = ap.add_mutually_exclusive_group()
    g.add_argument('--draft', action='store_true')
    g.add_argument('--final', action='store_true')
    g.add_argument('--dry-run', action='store_true')
    g.add_argument('--export-md', action='store_true')
    g.add_argument('--pick', help='id=序号，如 s03=2,avatar=1')
    ap.add_argument('--only', help='逗号分隔的 id')
    ap.add_argument('--n', type=int, default=2, help='草稿每张出几个候选（默认 2）')
    ap.add_argument('--model', help='覆盖模型名')
    a = ap.parse_args()

    spec, root, items = load(a.spec)
    if a.only:
        keep = set(a.only.split(','))
        items = [i for i in items if i['id'] in keep]
    out = root / 'images'; (out / 'draft').mkdir(parents=True, exist_ok=True)

    if a.export_md:
        lines = ['# 手动出图清单（在 ChatGPT 里逐张生成，存成对应文件名放进 images/）\n']
        for it in items:
            refs = '、'.join(Path(f).name for f in it['ref_files']) or '无'
            lines += [f'## {it["id"]}.png', f'- 尺寸：{it["size"]}，背景：{it["background"]}，参考图：{refs}',
                      f'- 切图：横向等分 {it["split"]} 张' if it['split'] else '', '```', it['full_prompt'], '```', '']
        (root / 'prompts.md').write_text('\n'.join(l for l in lines if l is not None), encoding='utf-8')
        print(f'已导出 {root / "prompts.md"}（{len(items)} 张）'); return

    if a.pick:
        for kv in a.pick.split(','):
            i, k = kv.split('='); src = out / 'draft' / f'{i}_v{k}.png'
            if not src.exists(): sys.exit(f'没有这张草稿：{src}')
            dst = out / f'{i}.png'; dst.write_bytes(src.read_bytes()); print('定稿 ←', src.name)
            it = next((x for x in items if x['id'] == i), None)
            if it and it['split']: split_strip(dst, it['split'])
        return

    model = a.model or (FINAL_MODEL if a.final else DRAFT_MODEL)
    quality = FINAL_QUALITY if a.final else DRAFT_QUALITY
    n = 1 if a.final else a.n
    total = len(items) * n
    print(f'模型 {model} · 质量 {quality} · {len(items)} 个条目 × {n} = {total} 张')
    for it in items:
        print(f'  {it["id"]:<16} {it["size"]:<10} {it["background"]:<11} 参考图 {len(it["ref_files"])} 张' + (f' · 切 {it["split"]}' if it['split'] else ''))
    if a.dry_run or not (a.draft or a.final):
        print('\n（只是预览。确认后加 --draft 出草稿，或 --final 出定稿）'); return
    if not os.environ.get('OPENAI_API_KEY'):
        sys.exit('没有 OPENAI_API_KEY。没有 Key 可以用 --export-md 导出提示词手动出图。')
    from openai import OpenAI
    client = OpenAI()
    cache_p = out / '.cache.json'
    cache = json.loads(cache_p.read_text()) if cache_p.exists() else {}
    for it in items:
        k = key_of(it, model, quality)
        targets = [out / f'{it["id"]}.png'] if a.final else [out / 'draft' / f'{it["id"]}_v{i + 1}.png' for i in range(n)]
        if cache.get(str(targets[0])) == k and all(t.exists() for t in targets):
            print('缓存命中', it['id']); continue
        t0 = time.time()
        for attempt in range(3):
            try:
                imgs = call(client, it, model, quality, n); break
            except Exception as e:  # 网络或限流，退避重试
                if attempt == 2: raise
                print('  重试：', str(e)[:120]); time.sleep(5 * (attempt + 1))
        for t, b in zip(targets, imgs):
            t.write_bytes(b)
            if a.final and it['split']: split_strip(t, it['split'])
        cache[str(targets[0])] = k; cache_p.write_text(json.dumps(cache, indent=1))
        print(f'  ✓ {it["id"]} ({time.time() - t0:.0f}s)')
    if a.draft:
        print('\n草稿在 images/draft/，挑好后：--pick id=序号，或直接 --final 出定稿')


if __name__ == '__main__':
    main()
