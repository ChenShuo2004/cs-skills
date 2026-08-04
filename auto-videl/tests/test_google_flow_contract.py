import unittest
from pathlib import Path


SKILL_ROOT = Path(__file__).resolve().parents[1]
SKILL_MD = SKILL_ROOT / "SKILL.md"
GOOGLE_FLOW_REFERENCE = SKILL_ROOT / "references" / "google-flow-mode.md"


class GoogleFlowContractTest(unittest.TestCase):
    def test_skill_declares_google_flow_platform_mode(self):
        skill_text = SKILL_MD.read_text(encoding="utf-8")

        for phrase in [
            "Platform Mode Selection",
            "google-flow",
            "Google Flow",
            "Veo",
            "first-frame-to-video",
            "8 seconds",
            "references/google-flow-mode.md",
        ]:
            self.assertIn(phrase, skill_text)

    def test_google_flow_reference_defines_first_frame_package(self):
        reference_text = GOOGLE_FLOW_REFERENCE.read_text(encoding="utf-8")

        for phrase in [
            "8-second clip units",
            "first-frame image",
            "first-frame image prompt",
            "Google Flow video prompt",
            "Use the uploaded image as the exact first frame",
            "0-2s",
            "2-5s",
            "5-8s",
        ]:
            self.assertIn(phrase, reference_text)

    def test_google_flow_mode_asks_when_platform_is_unclear(self):
        skill_text = SKILL_MD.read_text(encoding="utf-8")
        reference_text = GOOGLE_FLOW_REFERENCE.read_text(encoding="utf-8")

        self.assertIn("If the user has not named a mode, ask which mode to use", skill_text)
        self.assertIn("If the user asks for video generation but does not name the target platform", reference_text)


if __name__ == "__main__":
    unittest.main()
