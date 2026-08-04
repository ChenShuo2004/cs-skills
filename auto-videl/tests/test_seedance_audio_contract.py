import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


SKILL_ROOT = Path(__file__).resolve().parents[1]
SUBMIT_SCRIPT = SKILL_ROOT / "scripts" / "seedance_submit.py"
SEEDANCE_PROMPT = SKILL_ROOT / "references" / "prompts" / "07-seedance-video-prompt.md"
NINE_GRID_PROMPT = SKILL_ROOT / "references" / "prompts" / "08-nine-grid-video-prompt.md"
SKILL_MD = SKILL_ROOT / "SKILL.md"

ONE_PIXEL_PNG = (
    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
    b"\x08\x04\x00\x00\x00\xb5\x1c\x0c\x02\x00\x00\x00\x0bIDATx\xdac\xfc"
    b"\xff\x1f\x00\x03\x03\x02\x00\xef\xbf\xa7\xdb\x00\x00\x00\x00IEND"
    b"\xaeB`\x82"
)


def dry_run_payload(*extra_args: str) -> dict:
    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)
        ref_image = tmp_path / "ref.png"
        ref_image.write_bytes(ONE_PIXEL_PNG)
        out_dir = tmp_path / "out"

        result = subprocess.run(
            [
                sys.executable,
                str(SUBMIT_SCRIPT),
                "--prompt",
                "测试声音配置。",
                "--reference-image",
                str(ref_image),
                "--output-dir",
                str(out_dir),
                "--duration",
                "4",
                "--resolution",
                "480p",
                "--dry-run",
                *extra_args,
            ],
            check=False,
            text=True,
            capture_output=True,
        )
        if result.returncode != 0:
            raise AssertionError(result.stderr)
        return json.loads((out_dir / "request.redacted.json").read_text(encoding="utf-8"))


class SeedanceAudioContractTest(unittest.TestCase):
    def test_ambient_audio_mode_enables_environment_sound_without_voice_or_music(self):
        payload = dry_run_payload("--audio-mode", "ambient")
        prompt = payload["content"][0]["text"]

        self.assertTrue(payload["generate_audio"])
        self.assertIn("【声音配置】", prompt)
        self.assertIn("真实环境音", prompt)
        self.assertIn("动作音效", prompt)
        self.assertIn("不要人声口播", prompt)
        self.assertIn("不要背景音乐", prompt)

    def test_full_audio_mode_enables_voice_music_and_environment_sound(self):
        payload = dry_run_payload(
            "--audio-mode",
            "full",
            "--audio-instruction",
            "女生音色，轻快广告音乐。",
            "--reference-audio-url",
            "https://example.com/music.mp3",
        )
        prompt = payload["content"][0]["text"]

        self.assertTrue(payload["generate_audio"])
        self.assertIn("环境音", prompt)
        self.assertIn("背景音乐", prompt)
        self.assertIn("人声口播", prompt)
        self.assertIn("女生音色，轻快广告音乐。", prompt)
        self.assertEqual(payload["content"][-1]["type"], "audio_url")
        self.assertEqual(payload["content"][-1]["role"], "reference_audio")

    def test_silent_audio_mode_disables_generated_audio(self):
        payload = dry_run_payload("--audio-mode", "silent")
        prompt = payload["content"][0]["text"]

        self.assertFalse(payload["generate_audio"])
        self.assertIn("静音模式", prompt)

    def test_prompt_templates_expose_audio_mode_instead_of_hard_coding_silence(self):
        for path in [SEEDANCE_PROMPT, NINE_GRID_PROMPT, SKILL_MD]:
            text = path.read_text(encoding="utf-8")
            self.assertIn("audio_mode", text)
            self.assertIn("环境音", text)
            self.assertIn("背景音乐", text)
            self.assertIn("人声口播", text)
