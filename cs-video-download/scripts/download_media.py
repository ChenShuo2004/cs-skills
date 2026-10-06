#!/usr/bin/env python3
import argparse, json, re, subprocess, tempfile, os, shutil, sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlsplit

DEFAULT_DIR = Path(os.environ.get("CS_VIDEO_DOWNLOAD_DIR", str(Path.home() / "Downloads" / "Videdown"))).expanduser()

def run(args):
    return subprocess.run(args, check=True, capture_output=True, text=True).stdout

def verify(path):
    info = json.loads(run(["ffprobe", "-v", "error", "-show_entries", "format=duration,size:stream=codec_type,codec_name,width,height", "-of", "json", str(path)]))
    if not any(s.get("codec_type") == "video" for s in info.get("streams", [])):
        raise ValueError("下载文件没有视频流")
    if float(info.get("format", {}).get("duration", 0)) <= 0:
        raise ValueError("视频时长无效")
    run(["ffmpeg", "-v", "error", "-xerror", "-i", str(path), "-f", "null", "-"])
    return info

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--media-url", required=True)
    parser.add_argument("--source-url", required=True)
    parser.add_argument("--title", required=True)
    parser.add_argument("--video-id", required=True)
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_DIR)
    args = parser.parse_args()
    for url in (args.media_url, args.source_url):
        if urlsplit(url).scheme not in ("http", "https"):
            parser.error("地址必须是 HTTP(S)")
    for tool in ("curl", "ffprobe", "ffmpeg"):
        if not shutil.which(tool):
            parser.error(f"缺少依赖: {tool}")
    args.output_dir = args.output_dir.expanduser()
    args.output_dir.mkdir(parents=True, exist_ok=True)
    safe = lambda s: re.sub(r'[\\/:*?"<>|\x00-\x1f]', "_", s).strip(" .")[:100] or "video"
    target = args.output_dir / (safe(args.title) + "-" + safe(args.video_id) + ".mp4")
    if target.exists():
        info = verify(target)
    else:
        with tempfile.NamedTemporaryFile(dir=args.output_dir, suffix=".part", delete=False) as tmp:
            partial = Path(tmp.name)
        try:
            run(["curl", "-L", "--fail", "--silent", "--show-error", "--connect-timeout", "15", "--max-time", "180", "-A", "Mozilla/5.0", "-e", args.source_url, "-o", str(partial), "--", args.media_url])
            info = verify(partial)
            # Hard link creates the final name atomically without overwriting another download.
            target.hardlink_to(partial)
        finally:
            partial.unlink(missing_ok=True)
    record = {"downloaded_at": datetime.now(timezone.utc).isoformat(), "source_url": args.source_url, "title": args.title, "video_id": args.video_id, "file": str(target.resolve()), "verification": "ffprobe + full ffmpeg decode", "media": info}
    target.with_suffix(".source.json").write_text(json.dumps(record, ensure_ascii=False, indent=2))
    print(json.dumps(record, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    try:
        main()
    except subprocess.CalledProcessError as error:
        print(f"媒体操作失败（exit={error.returncode}）: {error.stderr[-1500:]}", file=sys.stderr)
        sys.exit(1)
    except (ValueError, OSError) as error:
        print(f"下载失败: {error}", file=sys.stderr)
        sys.exit(1)
