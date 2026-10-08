"""验证目录整理后旧命令、自定义配置与旧资料目录仍可使用。"""
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest

from build_review_context import ROOT, build
from validate_framework import validate


def normalize_context(context):
    context = dict(context)
    context['files'] = {key.removeprefix('resources/'): value
                        for key, value in context['files'].items()}
    return context


class ResourceCompatibilityTests(unittest.TestCase):
    def test_old_and_new_profile_commands_from_another_directory(self):
        with tempfile.TemporaryDirectory() as temp:
            temp = Path(temp)
            evidence = temp / 'evidence.json'
            evidence.write_text(json.dumps([
                {'start': 0, 'end': 1, 'channel': 'screen_text', 'text': 'example.com'}
            ]))
            for script in ['build_review_context.py', 'scan_candidates.py']:
                outputs = []
                for profile in ['profiles/strict-address.json',
                                str(ROOT / 'profiles/strict-address.json'),
                                str(ROOT / 'resources/profiles/strict-address.json')]:
                    output = temp / 'output.json'
                    args = ['--platforms', 'douyin', '--as-of', '2026-09-07'] if script.startswith('build') else [str(evidence), '--platforms', 'douyin']
                    subprocess.run([sys.executable, str(ROOT / 'scripts' / script), *args,
                                    '--profile', profile, '--out', str(output)],
                                   cwd=temp, check=True, capture_output=True)
                    outputs.append(output.read_bytes())
                self.assertTrue(all(result == outputs[0] for result in outputs))

    def test_existing_custom_profile_is_preserved(self):
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / 'custom.json'
            profile = json.loads((ROOT / 'resources/profiles/strict-address.json').read_text())
            profile['profile_type'] = '自定义配置兼容检查'
            path.write_text(json.dumps(profile))
            original = path.read_bytes()
            self.assertEqual(build(['douyin'], '2026-09-07', profile=path)['profile'], profile)
            self.assertEqual(path.read_bytes(), original)

    def test_missing_custom_profile_does_not_use_default(self):
        with tempfile.TemporaryDirectory() as temp:
            with self.assertRaises(FileNotFoundError):
                build(['douyin'], '2026-09-07', profile=Path(temp) / 'missing.json')

    def test_old_absolute_profile_through_skill_symlink(self):
        with tempfile.TemporaryDirectory() as temp:
            alias = Path(temp) / 'guoshen'
            alias.symlink_to(ROOT, target_is_directory=True)
            self.assertEqual(
                build(['douyin'], '2026-09-07', profile=alias / 'profiles/strict-address.json'),
                build(['douyin'], '2026-09-07', profile=ROOT / 'resources/profiles/strict-address.json'))

    def test_legacy_layout_context_and_validation(self):
        with tempfile.TemporaryDirectory() as temp:
            legacy = Path(temp) / 'repo'
            shutil.copytree(ROOT, legacy, ignore=shutil.ignore_patterns('.git', 'models', '__pycache__'))
            for name in ['rules', 'references', 'profiles', 'schemas', 'VERSION']:
                source, target = legacy / 'resources' / name, legacy / name
                if source.is_dir() and target.exists():
                    # CS workflow references coexist with legacy rule references.
                    shutil.copytree(source, target, dirs_exist_ok=True)
                    shutil.rmtree(source)
                else:
                    shutil.move(source, target)
            self.assertEqual(validate(legacy), validate(ROOT))
            for profile in [None, 'profiles/strict-address.json']:
                old_profile = legacy / profile if profile else None
                new_profile = ROOT / profile if profile else None
                self.assertEqual(
                    normalize_context(build(['douyin', 'bilibili'], '2026-09-07', root=legacy, profile=old_profile)),
                    normalize_context(build(['douyin', 'bilibili'], '2026-09-07', profile=new_profile)))


if __name__ == '__main__':
    unittest.main()
