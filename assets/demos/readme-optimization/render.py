"""Combine recorded GitHub pages, Fish Audio lines, and caption cards.

Requires FFmpeg. Set RAW_VIDEO_FILE to the path printed by capture.cjs.
"""

import json
import os
from pathlib import Path
import subprocess
import tempfile

HERE = Path(__file__).resolve().parent


def probe_duration(path: Path) -> float:
    value = subprocess.check_output(
        [
            "ffprobe", "-v", "error", "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1", str(path),
        ],
        text=True,
    )
    return float(value.strip())


def main() -> None:
    raw = os.environ.get("RAW_VIDEO_FILE")
    if not raw:
        raise SystemExit("Set RAW_VIDEO_FILE to the path printed by capture.cjs")
    raw_path = Path(raw)
    audio_dir = Path(os.environ.get("NARRATION_OUT_DIR", HERE / "audio"))
    card_dir = Path(os.environ.get("CARD_OUT_DIR", Path(tempfile.gettempdir()) / "cs-readme-cards"))
    out = Path(os.environ.get("OUT_VIDEO", HERE / "demo.mp4"))
    timeline = json.loads((HERE / "timeline.json").read_text())
    scenes = timeline["scenes"]
    duration = min(probe_duration(raw_path), timeline["total_seconds"])
    inputs = [raw_path]
    filters = [
        "[0:v]scale=1920:1080,setsar=1[base]",
        "[1:v]scale=1920:1080,format=rgba[card]",
        "[base][card]overlay=0:0:format=auto[v]",
    ]

    with tempfile.TemporaryDirectory() as temp:
        list_path = Path(temp) / "cards.ffconcat"
        lines = []
        for index, scene in enumerate(scenes):
            card = card_dir / f"card-{index + 1:02d}.png"
            next_start = scenes[index + 1]["start"] if index + 1 < len(scenes) else duration
            start = 0 if index == 0 else scene["start"]
            lines.extend([f"file '{card}'", f"duration {next_start - start:.3f}"])
        last_card = card_dir / f"card-{len(scenes):02d}.png"
        lines.append(f"file '{last_card}'")
        list_path.write_text("\n".join(lines) + "\n")

        delayed = []
        for index, scene in enumerate(scenes):
            audio = audio_dir / f"scene-{index + 1:02d}.mp3"
            inputs.append(audio)
            label = f"voice{index}"
            filters.append(f"[{index + 2}:a]adelay={round(scene['start'] * 1000)}:all=1[{label}]")
            delayed.append(f"[{label}]")
        filters.append(
            "".join(delayed)
            + f"amix=inputs={len(scenes)}:duration=longest:normalize=0,"
            + "apad,loudnorm=I=-16:TP=-1.5:LRA=7[a]"
        )

        cmd = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(inputs[0])]
        cmd += ["-f", "concat", "-safe", "0", "-i", str(list_path)]
        for audio in inputs[1:]:
            cmd += ["-i", str(audio)]
        cmd += [
            "-filter_complex", ";".join(filters), "-map", "[v]", "-map", "[a]",
            "-t", str(duration), "-r", "30", "-c:v", "libx264", "-preset", "medium",
            "-crf", "26", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k",
            "-movflags", "+faststart", str(out),
        ]
        subprocess.run(cmd, check=True)

    poster = out.with_name("poster.jpg")
    subprocess.run(
        ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-ss", "30",
         "-i", str(out), "-frames:v", "1", "-q:v", "3", str(poster)],
        check=True,
    )
    print(out)
    print(poster)


if __name__ == "__main__":
    main()
