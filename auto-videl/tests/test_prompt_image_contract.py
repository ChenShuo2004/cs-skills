import unittest
from pathlib import Path


SKILL_ROOT = Path(__file__).resolve().parents[1]
BUNDLED_PROMPT_IMAGE = SKILL_ROOT / "references" / "prompts" / "00-prompt-image.md"
SKILL_MD = SKILL_ROOT / "SKILL.md"


class PromptImageContractTest(unittest.TestCase):
    def test_prompt_image_requires_strong_hook_gate(self):
        bundled_prompt_text = BUNDLED_PROMPT_IMAGE.read_text(encoding="utf-8")

        for phrase in [
            "强 Hook",
            "停滑点",
            "Hook自检评分",
            "不达标必须重写前3格",
            "夸张但不虚假",
        ]:
            self.assertIn(phrase, bundled_prompt_text)

    def test_skill_defines_prompt_image_to_image2_to_seedance_route(self):
        skill_text = SKILL_MD.read_text(encoding="utf-8")

        for phrase in [
            "name: auto-videl",
            "强 Hook 九宫格生成出片链路",
            "prompt_image.md",
            "image2",
            "Seedance",
            "9帧分镜图 + 9段提示词",
        ]:
            self.assertIn(phrase, skill_text)
