#!/usr/bin/env python3
"""Prepare local evidence and selected rules; never produce a moderation verdict."""
import argparse
from datetime import date
import hashlib
import json
import math
from pathlib import Path
import shutil
import subprocess
import sys

from build_review_context import build, SCENES
from scan_candidates import scan

ROOT = Path(__file__).resolve().parents[1]
PLATFORMS = ['xiaohongshu', 'douyin', 'bilibili', 'wechat_channels']


def dump(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def validate_rows(rows):
    if not isinstance(rows, list):
        raise ValueError('evidence.json must be a list')
    for i, row in enumerate(rows):
        if not isinstance(row, dict) or not isinstance(row.get('text'), str) or not isinstance(row.get('channel'), str):
            raise ValueError(f'evidence row {i}: text/channel must be strings')
        start, end = row.get('start'), row.get('end')
        if row['channel'] != 'draft_text' or start is not None or end is not None:
            if any(isinstance(x, bool) or not isinstance(x, (int, float)) or not math.isfinite(x) for x in [start, end]):
                raise ValueError(f'evidence row {i}: timestamps must be finite numbers')
            if start < 0 or end < start:
                raise ValueError(f'evidence row {i}: invalid time range')
    return rows


def dependencies():
    return {name: shutil.which(name) is not None for name in ['ffmpeg', 'ffprobe', 'whisper-cli', 'swiftc']}


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    source = parser.add_mutually_exclusive_group(required=True)
    source.add_argument('--text', type=Path, help='UTF-8 draft, with line locators and no fabricated timestamps')
    source.add_argument('--evidence', type=Path, help='existing extract_video.py evidence.json')
    source.add_argument('--video', type=Path)
    parser.add_argument('--out', type=Path, required=True, help='new or empty output directory')
    parser.add_argument('--platforms', nargs='+', choices=PLATFORMS, default=PLATFORMS)
    parser.add_argument('--scene', choices=SCENES, default='post')
    parser.add_argument('--as-of', default=date.today().isoformat())
    parser.add_argument('--profile', type=Path)
    parser.add_argument('--model', type=Path)
    parser.add_argument('--fps', type=float, default=2)
    parser.add_argument('--subtitle', type=Path, action='append', default=[])
    parser.add_argument('--language', default='auto')
    parser.add_argument('--check', action='store_true', help='read-only validation/preflight')
    args = parser.parse_args(argv)
    input_path = args.text or args.evidence or args.video
    # Resolve relative user paths before invoking child processes.
    input_path = input_path.resolve()
    try:
        if not input_path.is_file():
            raise ValueError('input file does not exist')
        if not math.isfinite(args.fps) or args.fps < 0:
            raise ValueError('--fps must be finite and >= 0')
        if args.out.exists() and (not args.out.is_dir() or any(args.out.iterdir())):
            raise ValueError('output must be a new or empty directory; existing evidence is never overwritten')
        context = build(args.platforms, args.as_of, args.scene, profile=args.profile)
        rows = None
        mode = 'draft' if args.text else 'imported_evidence' if args.evidence else 'video'
        if args.text:
            text = input_path.read_text(encoding='utf-8')
            if not text.strip():
                raise ValueError('draft text is empty')
            rows = [{'channel': 'draft_text', 'text': line, 'start': None, 'end': None,
                     'line_number': n} for n, line in enumerate(text.splitlines(), 1) if line.strip()]
        elif args.evidence:
            rows = validate_rows(json.loads(input_path.read_text(encoding='utf-8')))
        if args.video:
            tools = dependencies()
            missing = [name for name in ['ffmpeg', 'ffprobe'] if not tools[name]]
            if missing:
                raise ValueError('required tools missing: ' + ', '.join(missing))
            for subtitle in args.subtitle:
                if not subtitle.is_file():
                    raise ValueError('subtitle file does not exist')
            if args.model and not args.model.is_file():
                raise ValueError('specified model does not exist; no automatic download')
        preflight = {'mode': mode, 'status': 'ready_for_preparation', 'tools': dependencies() if args.video else {},
                     'platforms': context['platforms'], 'scene': args.scene, 'as_of': args.as_of,
                     'rule_uncertainties': sum(bool(r['uncertainties']) for r in context['rules']),
                     'notice': 'Preflight does not prove recognition or review completion.'}
        if args.video:
            preflight['asr_model_explicit'] = bool(args.model)
            preflight['notice'] += ' Missing ASR/OCR produces partial evidence; inspect extraction manifest.'
        if args.check:
            print(json.dumps(preflight, ensure_ascii=False, indent=2))
            return 0
        args.out.mkdir(parents=True, exist_ok=True)
        dump(args.out / 'preflight.json', preflight)
        dump(args.out / 'review-context.json', context)
        manifest = None
        if args.video:
            output = args.out / 'extraction'
            command = [sys.executable, str(ROOT / 'scripts/extract_video.py'), str(input_path),
                       '--out', str(output), '--fps', str(args.fps), '--language', args.language]
            if args.model:
                command += ['--model', str(args.model.resolve())]
            for subtitle in args.subtitle:
                command += ['--subtitle', str(subtitle.resolve())]
            try:
                subprocess.run(command, check=True)
            except (subprocess.CalledProcessError, OSError) as exc:
                dump(args.out / 'failure.json', {'stage': 'extract_video', 'status': 'failed',
                                                'error': str(exc), 'review_complete': False})
                raise ValueError('extraction failed; partial files retained, review not complete') from exc
            rows = validate_rows(json.loads((output / 'evidence.json').read_text(encoding='utf-8')))
            manifest = json.loads((output / 'manifest.json').read_text(encoding='utf-8'))
        elif args.evidence:
            # An imported manifest is a coverage claim to verify, not trusted proof.
            manifest_path = input_path.parent / 'manifest.json'
            if manifest_path.is_file():
                manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
        dump(args.out / 'evidence.json', rows)
        # Context selects platforms even if the supplied profile had a broader default.
        profile = dict(context['profile'], default_platforms=context['platforms'])
        candidates = scan(rows, profile)
        dump(args.out / 'candidates.json', {'notice': 'Candidates require semantic and source review.', 'candidates': candidates})
        gaps = ['Official sources, semantic interpretation and original media must be reviewed by the assistant.']
        if args.text:
            gaps += ['Draft only: audio, screen, actual timestamps and publication settings not checked.']
        if not rows:
            gaps += ['No evidence rows: empty recognition does not mean the content is safe.']
        if args.evidence and not manifest:
            gaps += ['Imported evidence has no manifest; track coverage and sampling are unknown.']
        if manifest:
            gaps += manifest.get('warnings', [])
        uncertain_rules = [{'id': r['id'], 'uncertainties': r['uncertainties']} for r in context['rules'] if r['uncertainties']]
        with input_path.open('rb') as stream:
            input_sha256 = hashlib.file_digest(stream, 'sha256').hexdigest()
        pack = {'schema_version': 1, 'status': 'prepared_requires_review', 'review_complete': False,
                'mode': mode, 'input_name': input_path.name,
                'input_sha256': input_sha256,
                'as_of': args.as_of, 'scene': args.scene, 'platforms': context['platforms'],
                'evidence_rows': len(rows), 'candidate_count': len(candidates),
                'coverage_manifest': manifest, 'gaps': gaps, 'uncertain_rules': uncertain_rules,
                'files': {'context': 'review-context.json', 'evidence': 'evidence.json',
                          'candidates': 'candidates.json', 'report_template': 'review-template.md'}}
        dump(args.out / 'review-pack.json', pack)
        template = '# 发布预检报告（待助手复核填写）\n\n状态：未完成审核。候选不构成违规结论。\n\n'
        template += f"审核日期：{args.as_of}；场景：{args.scene}；模式：{mode}。\n\n"
        template += '| 平台 | 结论 | 优先修改 |\n| --- | --- | --- |\n'
        template += ''.join(f'| {platform} | 未检查 | 待复核 |\n' for platform in context['platforms'])
        template += '\n## 证据与最小修改\n\n按 delivery.md 填写原文、定位、依据、条件与替换稿。\n\n## 覆盖与缺口\n\n'
        template += ''.join(f'- {gap}\n' for gap in gaps)
        template += '\n## 规则来源待复核\n\n'
        template += ''.join(f"- {rule['id']}：{'；'.join(rule['uncertainties'])}\n" for rule in uncertain_rules) or '- 上下文未记录时效缺口；仍需本次来源核查。\n'
        (args.out / 'review-template.md').write_text(template, encoding='utf-8')
        print(json.dumps({'status': pack['status'], 'review_complete': False,
                          'candidate_count': len(candidates), 'out': str(args.out)}, ensure_ascii=False))
        return 0
    except (ValueError, OSError, KeyError, TypeError) as exc:
        parser.error(str(exc))


if __name__ == '__main__':
    sys.exit(main())
