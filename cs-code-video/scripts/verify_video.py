#!/usr/bin/env python3
"""Probe and fully decode an MP4, then export three frames for visual review."""

import json
import subprocess
import sys
from pathlib import Path


def run(*args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(args, check=True, text=True, capture_output=True)


def main() -> int:
    if len(sys.argv) not in (2, 3):
        print("Usage: verify_video.py VIDEO [QA_DIR]", file=sys.stderr)
        return 2
    video = Path(sys.argv[1]).expanduser().resolve()
    if not video.is_file():
        print(f"Missing video: {video}", file=sys.stderr)
        return 2
    qa_dir = Path(sys.argv[2]).expanduser().resolve() if len(sys.argv) == 3 else video.parent / "qa"
    qa_dir.mkdir(parents=True, exist_ok=True)

    try:
        probe = run(
            "ffprobe", "-v", "error", "-show_format", "-show_streams",
            "-of", "json", str(video)
        )
        info = json.loads(probe.stdout)
        duration = float(info["format"]["duration"])
        video_streams = [s for s in info["streams"] if s.get("codec_type") == "video"]
        if not video_streams or duration <= 0:
            raise ValueError("No valid video stream or duration")
        (qa_dir / "metadata.json").write_text(
            json.dumps(info, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        run("ffmpeg", "-v", "error", "-xerror", "-i", str(video), "-f", "null", "-")
        for name, second in (
            ("start", min(0.2, duration / 2)),
            ("middle", duration / 2),
            ("end", max(0, duration - 0.5)),
        ):
            run(
                "ffmpeg", "-v", "error", "-ss", f"{second:.3f}", "-i", str(video),
                "-frames:v", "1", "-y", str(qa_dir / f"{name}.jpg")
            )
        print(json.dumps({
            "video": str(video),
            "duration_seconds": round(duration, 3),
            "width": video_streams[0].get("width"),
            "height": video_streams[0].get("height"),
            "fps": video_streams[0].get("avg_frame_rate"),
            "audio_streams": sum(s.get("codec_type") == "audio" for s in info["streams"]),
            "decode": "passed",
            "qa_dir": str(qa_dir),
        }, ensure_ascii=False, indent=2))
        return 0
    except (subprocess.CalledProcessError, ValueError, KeyError, json.JSONDecodeError) as exc:
        print(f"Video verification failed: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
