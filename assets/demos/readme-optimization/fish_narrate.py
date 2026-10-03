"""Generate Chinese scene narration with Fish Audio S2.1.

Set FISH_API_KEY_FILE to an existing private file containing the API key.
The key is never saved in this project or printed.
"""

import json
import os
from pathlib import Path
import ssl
import sys
import urllib.error
import urllib.request

HERE = Path(__file__).resolve().parent
VOICE_ID = "80c0495688fb4b749527a039c74eb2dd"
MODEL = "s2.1-pro-free"


def main() -> None:
    key_file = os.environ.get("FISH_API_KEY_FILE")
    if not key_file:
        raise SystemExit("Set FISH_API_KEY_FILE to a private API key file")
    key = Path(key_file).read_text().strip()
    scenes = json.loads((HERE / "narration.json").read_text())
    out_dir = Path(os.environ.get("NARRATION_OUT_DIR", HERE / "audio"))
    out_dir.mkdir(parents=True, exist_ok=True)
    cafile = os.environ.get("SSL_CERT_FILE", "/etc/ssl/cert.pem")
    context = (
        ssl.create_default_context(cafile=cafile)
        if Path(cafile).exists()
        else ssl.create_default_context()
    )

    for index, scene in enumerate(scenes, 1):
        out = out_dir / f"scene-{index:02d}.mp3"
        if out.exists() and out.stat().st_size > 1000:
            print(index, "cached", out)
            continue
        payload = json.dumps(
            {"text": scene["text"], "reference_id": VOICE_ID, "format": "mp3"},
            ensure_ascii=False,
        ).encode()
        req = urllib.request.Request(
            "https://api.fish.audio/v1/tts",
            data=payload,
            method="POST",
            headers={
                "Authorization": f"Bearer {key}",
                "Content-Type": "application/json",
                "model": MODEL,
            },
        )
        try:
            with urllib.request.urlopen(req, timeout=120, context=context) as response:
                data = response.read()
                if not response.headers.get("Content-Type", "").startswith("audio/"):
                    raise RuntimeError("Fish Audio returned non-audio content")
        except urllib.error.HTTPError as error:
            print("Fish Audio HTTP status:", error.code, file=sys.stderr)
            raise SystemExit(1) from None
        out.write_bytes(data)
        print(index, scene["title"], len(data), "bytes")


if __name__ == "__main__":
    main()
