"""Build a timed Fish Audio narration with quiet, code-generated UI sounds.

Requires the eight MP3s created by fish_narrate.py and FFmpeg. No API key is
needed here. NARRATION_OUT_DIR can point at a private temporary directory.
"""

from array import array
import json
import math
import os
from pathlib import Path
import random
import subprocess
import tempfile
import wave

HERE = Path(__file__).resolve().parent
SAMPLE_RATE = 48_000
LENGTH = 73.24


def sfx_wave(path: Path) -> None:
    samples = array("h", [0]) * int(LENGTH * SAMPLE_RATE)
    cues = json.loads((HERE / "audio-cues.json").read_text())
    for index, cue in enumerate(cues):
        start = round(cue["t"] * SAMPLE_RATE)
        kind = cue["kind"]
        duration = {"click": .04, "pop": .14, "ding": .47}[kind]
        rng = random.Random(index + 17)
        for j in range(round(duration * SAMPLE_RATE)):
            time = j / SAMPLE_RATE
            if kind == "click":
                signal = (rng.random() * 2 - 1) * math.exp(-time * 115) * .22
            elif kind == "pop":
                signal = math.sin(2 * math.pi * (680 - 280 * time / duration) * time) * math.exp(-time * 28) * .18
            else:
                signal = (math.sin(2 * math.pi * 880 * time) + .25 * math.sin(2 * math.pi * 1320 * time)) * math.exp(-time * 7) * .12
            at = start + j
            if at < len(samples):
                samples[at] = max(-32767, min(32767, samples[at] + round(signal * 32767)))
    with wave.open(str(path), "wb") as stream:
        stream.setnchannels(1)
        stream.setsampwidth(2)
        stream.setframerate(SAMPLE_RATE)
        stream.writeframes(samples.tobytes())


def main() -> None:
    audio_dir = Path(os.environ.get("NARRATION_OUT_DIR", HERE / "audio"))
    output = Path(os.environ.get("OUT_AUDIO", HERE / "audio" / "mix.wav"))
    output.parent.mkdir(parents=True, exist_ok=True)
    timeline = json.loads((HERE / "timeline.json").read_text())
    inputs = [audio_dir / f"scene-{i:02d}.mp3" for i in range(1, 9)]
    for item in inputs:
        if not item.is_file():
            raise SystemExit(f"Missing narration: {item}")
    with tempfile.TemporaryDirectory() as temp:
        sfx = Path(temp) / "sfx.wav"
        sfx_wave(sfx)
        cmd = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y"]
        for item in inputs + [sfx]:
            cmd.extend(["-i", str(item)])
        filters = []
        parts = []
        for i, scene in enumerate(timeline["scenes"]):
            filters.append(f"[{i}:a]adelay={round(scene['start'] * 1000)}:all=1[v{i}]")
            parts.append(f"[v{i}]")
        filters.append("".join(parts) + f"amix=inputs={len(parts)}:duration=longest:normalize=0[voice]")
        filters.append(f"[voice][{len(inputs)}:a]amix=inputs=2:duration=longest:normalize=0,apad,atrim=0:{LENGTH},loudnorm=I=-14:TP=-1.5:LRA=7[a]")
        cmd.extend(["-filter_complex", ";".join(filters), "-map", "[a]", "-ar", str(SAMPLE_RATE), str(output)])
        subprocess.run(cmd, check=True)
    print(output)


if __name__ == "__main__":
    main()
