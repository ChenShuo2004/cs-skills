#!/usr/bin/env python3
"""Create high-resolution review sheets for video copy/subtitle checking.

This script uses OpenCV only. It samples full frames and optional subtitle-area
crops so an agent or user can verify hook copy, prices, and subtitles without
depending on low-resolution overview contact sheets.
"""

from __future__ import annotations

import argparse
import math
from pathlib import Path

import cv2
from PIL import Image, ImageDraw


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("video", type=Path)
    parser.add_argument("--outdir", type=Path, default=Path("copy_review_frames"))
    parser.add_argument("--interval", type=float, default=0.25)
    parser.add_argument("--start", type=float, default=0.0)
    parser.add_argument("--end", type=float, default=None)
    parser.add_argument("--crop", choices=["none", "bottom", "center", "top"], default="bottom")
    parser.add_argument("--cols", type=int, default=6)
    parser.add_argument("--thumb-width", type=int, default=320)
    return parser.parse_args()


def crop_region(img: Image.Image, mode: str) -> Image.Image:
    if mode == "none":
        return img
    w, h = img.size
    if mode == "bottom":
        return img.crop((0, int(h * 0.58), w, h))
    if mode == "center":
        return img.crop((0, int(h * 0.30), w, int(h * 0.75)))
    if mode == "top":
        return img.crop((0, 0, w, int(h * 0.42)))
    return img


def main() -> None:
    args = parse_args()
    args.outdir.mkdir(parents=True, exist_ok=True)
    cap = cv2.VideoCapture(str(args.video))
    fps = cap.get(cv2.CAP_PROP_FPS)
    frames = cap.get(cv2.CAP_PROP_FRAME_COUNT)
    duration = frames / fps if fps else 0
    end = min(args.end if args.end is not None else duration, duration)

    thumbs: list[Image.Image] = []
    t = args.start
    while t < end:
        cap.set(cv2.CAP_PROP_POS_MSEC, t * 1000)
        ok, frame = cap.read()
        if not ok:
            break
        frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        img = Image.fromarray(frame)
        img = crop_region(img, args.crop)
        tw = args.thumb_width
        th = max(1, int(img.height * tw / img.width))
        img = img.resize((tw, th), Image.LANCZOS)
        canvas = Image.new("RGB", (tw, th + 30), "white")
        canvas.paste(img, (0, 0))
        ImageDraw.Draw(canvas).text((8, th + 7), f"{t:.2f}s", fill=(0, 0, 0))
        thumbs.append(canvas)
        t += args.interval
    cap.release()

    if not thumbs:
        raise SystemExit("No frames extracted")

    cols = args.cols
    w = max(i.width for i in thumbs)
    h = max(i.height for i in thumbs)
    sheet = Image.new("RGB", (cols * w, math.ceil(len(thumbs) / cols) * h), (240, 240, 240))
    for idx, img in enumerate(thumbs):
        sheet.paste(img, ((idx % cols) * w, (idx // cols) * h))

    out = args.outdir / f"{args.video.stem}_copy_review_{args.crop}_{args.start:.1f}_{end:.1f}.jpg"
    sheet.save(out, quality=94)
    print(out)


if __name__ == "__main__":
    main()
