import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

SCRIPT = Path(__file__).resolve().parents[1] / 'scripts/prepare_review.py'


class PrepareReviewTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.text = self.root / 'draft.txt'
        self.text.write_text('AI 教程\n不能保证收益，也不要加微信。\n查看 example.com\n', encoding='utf-8')
        self.out = self.root / 'review'

    def run_cli(self, *args):
        return subprocess.run([sys.executable, str(SCRIPT), *map(str, args)],
                              cwd=self.root, capture_output=True, text=True, encoding='utf-8')

    def test_draft_is_traceable_and_never_a_completed_review(self):
        result = self.run_cli('--text', self.text, '--out', self.out, '--platforms', 'douyin', '--as-of', '2026-10-08')
        self.assertEqual(result.returncode, 0, result.stderr)
        pack = json.loads((self.out / 'review-pack.json').read_text())
        self.assertFalse(pack['review_complete'])
        self.assertEqual(pack['status'], 'prepared_requires_review')
        self.assertEqual(pack['platforms'], ['douyin'])
        self.assertTrue(pack['uncertain_rules'])
        self.assertIn('not checked', ' '.join(pack['gaps']))
        rows = json.loads((self.out / 'evidence.json').read_text())
        self.assertEqual(rows[1]['text'], '不能保证收益，也不要加微信。')
        self.assertEqual(rows[1]['line_number'], 2)
        self.assertIsNone(rows[1]['start'])
        hits = json.loads((self.out / 'candidates.json').read_text())['candidates']
        self.assertTrue(hits)
        self.assertTrue(all(hit['requires_semantic_review'] for hit in hits))
        self.assertTrue(all(set(hit.get('platform_candidates', {})) <= {'douyin'} for hit in hits))
        self.assertIn('未检查', (self.out / 'review-template.md').read_text())

    def test_check_is_read_only(self):
        result = self.run_cli('--text', self.text, '--out', self.out, '--check')
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertFalse(self.out.exists())

    def test_existing_output_is_preserved(self):
        self.out.mkdir()
        marker = self.out / 'original.txt'
        marker.write_text('keep')
        result = self.run_cli('--text', self.text, '--out', self.out)
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(marker.read_text(), 'keep')
        self.assertEqual(list(self.out.iterdir()), [marker])

    def test_missing_custom_profile_and_bad_date_leave_no_output(self):
        for args in [('--profile', self.root / 'missing.json'), ('--as-of', '2026-13-42')]:
            result = self.run_cli('--text', self.text, '--out', self.out, *args)
            self.assertNotEqual(result.returncode, 0)
            self.assertFalse(self.out.exists())

    def test_invalid_timestamp_is_rejected(self):
        evidence = self.root / 'evidence.json'
        for row in [
            {'channel': 'screen_text', 'text': 'example.com', 'start': 2, 'end': 1},
            {'channel': 'speech', 'text': 'hello', 'start': None, 'end': None},
            {'channel': 'speech', 'text': 'hello', 'start': float('nan'), 'end': 1},
        ]:
            evidence.write_text(json.dumps([row]))
            result = self.run_cli('--evidence', evidence, '--out', self.out)
            self.assertNotEqual(result.returncode, 0)
            self.assertFalse(self.out.exists())

    def test_empty_import_preserves_unknown_coverage(self):
        evidence = self.root / 'evidence.json'
        evidence.write_text('[]')
        result = self.run_cli('--evidence', evidence, '--out', self.out)
        self.assertEqual(result.returncode, 0, result.stderr)
        pack = json.loads((self.out / 'review-pack.json').read_text())
        self.assertFalse(pack['review_complete'])
        self.assertIn('No evidence rows', ' '.join(pack['gaps']))
        self.assertIn('coverage and sampling are unknown', ' '.join(pack['gaps']))

    def test_imported_warnings_reach_report(self):
        evidence = self.root / 'evidence.json'
        evidence.write_text(json.dumps([{'channel': 'screen_text', 'text': 'example.com', 'start': 1, 'end': 1}]))
        (self.root / 'manifest.json').write_text(json.dumps({'warnings': ['音轨1识别失败'], 'coverage': {'ocr': '抽样'}}))
        result = self.run_cli('--evidence', evidence, '--out', self.out, '--platforms', 'bilibili')
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn('音轨1识别失败', (self.out / 'review-template.md').read_text())

    def test_requested_profile_is_preserved_and_labeled_as_preference(self):
        profile = self.root / 'profile.json'
        source = SCRIPT.parent.parent / 'resources/profiles/strict-address.json'
        profile.write_bytes(source.read_bytes())
        before = profile.read_bytes()
        evidence = self.root / 'evidence.json'
        evidence.write_text(json.dumps([{'channel': 'screen_text', 'text': 'example.com', 'start': 1, 'end': 1}]))
        result = self.run_cli('--evidence', evidence, '--out', self.out, '--profile', profile, '--platforms', 'douyin')
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(profile.read_bytes(), before)
        hits = json.loads((self.out / 'candidates.json').read_text())['candidates']
        self.assertIn('按用户要求修改', hits[0]['platform_candidates']['douyin'])


if __name__ == '__main__':
    unittest.main()
