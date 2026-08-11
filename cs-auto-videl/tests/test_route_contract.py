import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


SKILL_ROOT = Path(__file__).resolve().parents[1]
SUBMIT_SCRIPT = SKILL_ROOT / "scripts" / "seedance_submit.py"
SKILL_MD = SKILL_ROOT / "SKILL.md"
GRID_WORKFLOW = SKILL_ROOT / "references" / "grid-to-video-workflow.md"

ONE_PIXEL_PNG = (
    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
    b"\x08\x04\x00\x00\x00\xb5\x1c\x0c\x02\x00\x00\x00\x0bIDATx\xdac\xfc"
    b"\xff\x1f\x00\x03\x03\x02\x00\xef\xbf\xa7\xdb\x00\x00\x00\x00IEND"
    b"\xaeB`\x82"
)


class RouteContractTest(unittest.TestCase):
    def test_skill_declares_three_video_routes(self):
        skill_text = SKILL_MD.read_text(encoding="utf-8")

        self.assertIn("## Route Selection", skill_text)
        self.assertIn("复刻链路", skill_text)
        self.assertIn("强 Hook 九宫格生成出片链路", skill_text)
        self.assertIn("九宫格成片直投链路", skill_text)
        self.assertIn("prompt_image.md", skill_text)
        self.assertIn("image2", skill_text)
        self.assertTrue(GRID_WORKFLOW.exists())

    def test_grid_storyboard_reference_mode_uses_grid_contract(self):
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            ref_image = tmp_path / "grid.png"
            ref_image.write_bytes(ONE_PIXEL_PNG)
            out_dir = tmp_path / "out"

            result = subprocess.run(
                [
                    sys.executable,
                    str(SUBMIT_SCRIPT),
                    "--prompt",
                    "按照九宫格分镜和脚本生成9:16带货短视频。",
                    "--reference-image",
                    str(ref_image),
                    "--reference-mode",
                    "grid-storyboard",
                    "--output-dir",
                    str(out_dir),
                    "--duration",
                    "9",
                    "--resolution",
                    "480p",
                    "--dry-run",
                ],
                check=False,
                text=True,
                capture_output=True,
            )

            self.assertEqual(result.returncode, 0, result.stderr)
            payload = json.loads((out_dir / "request.redacted.json").read_text(encoding="utf-8"))
            prompt = payload["content"][0]["text"]

        self.assertIn("【九宫格分镜直出规则】", prompt)
        self.assertNotIn("【通用产品外观硬约束】", prompt)

    def test_replication_reference_mode_keeps_product_lock_default(self):
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            ref_image = tmp_path / "storyboard.png"
            ref_image.write_bytes(ONE_PIXEL_PNG)
            out_dir = tmp_path / "out"

            result = subprocess.run(
                [
                    sys.executable,
                    str(SUBMIT_SCRIPT),
                    "--prompt",
                    "按照产品图和分镜图生成9:16带货短视频。",
                    "--reference-image",
                    str(ref_image),
                    "--output-dir",
                    str(out_dir),
                    "--duration",
                    "9",
                    "--resolution",
                    "480p",
                    "--dry-run",
                ],
                check=False,
                text=True,
                capture_output=True,
            )

            self.assertEqual(result.returncode, 0, result.stderr)
            payload = json.loads((out_dir / "request.redacted.json").read_text(encoding="utf-8"))
            prompt = payload["content"][0]["text"]

        self.assertIn("【通用产品外观硬约束】", prompt)
