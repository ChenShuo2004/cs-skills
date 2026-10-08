#!/usr/bin/env python3
"""提取视频证据；不把自动识别结果当成平台审核结论。标准库 + ffmpeg。"""
import argparse
import hashlib
import json
import math
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]

def run(cmd, timeout=3600):
    p = subprocess.run([str(x) for x in cmd], capture_output=True, text=True, timeout=timeout)
    if p.returncode:
        raise RuntimeError(f'{cmd[0]} 执行失败：{p.stderr[-1500:]}')
    return p

def dump(path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')

def seconds(s):
    parts = s.replace(',', '.').split(':')
    return sum(float(p) * 60 ** i for i, p in enumerate(reversed(parts)))

def parse_subtitle(path, channel):
    text = path.read_text(encoding='utf-8-sig', errors='replace')
    rows = []
    for block in re.split(r'\n\s*\n', text.strip()):
        lines = block.splitlines()
        for i, line in enumerate(lines):
            m = re.search(r'((?:\d+:)?\d+:\d+[.,]\d+)\s*-->\s*((?:\d+:)?\d+:\d+[.,]\d+)', line)
            if m:
                rows.append({'start':seconds(m[1]), 'end':seconds(m[2]), 'channel':channel,
                             'text':re.sub('<[^>]+>', '', ' '.join(lines[i+1:])), 'source':str(path)})
                break
    return rows

def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('video', type=Path)
    ap.add_argument('--out', type=Path, required=True)
    ap.add_argument('--fps', type=float, default=2, help='抽样频率；0 表示逐帧文字扫描')
    ap.add_argument('--model', type=Path)
    ap.add_argument('--language', default='auto')
    ap.add_argument('--subtitle', type=Path, action='append', default=[])
    ap.add_argument('--skip-asr', action='store_true')
    ap.add_argument('--skip-ocr', action='store_true')
    a = ap.parse_args()
    if a.fps < 0 or not math.isfinite(a.fps): ap.error('fps 必须是有限非负数')
    video, out = a.video.expanduser().resolve(), a.out.expanduser().resolve()
    if not video.is_file(): ap.error('视频文件不存在')
    if out.exists() and any(out.iterdir()): ap.error('输出目录非空，请换一个目录以保留已有证据')
    out.mkdir(parents=True, exist_ok=True)
    for tool in ['ffmpeg','ffprobe']:
        if not shutil.which(tool): ap.error(f'缺少 {tool}')
    metadata = json.loads(run(['ffprobe','-v','error','-show_streams','-show_format','-of','json',video]).stdout)
    videos = [s for s in metadata['streams'] if s['codec_type']=='video' and not s.get('disposition',{}).get('attached_pic')]
    if not videos: ap.error('没有可播放的视频流')
    duration = float(metadata.get('format',{}).get('duration') or videos[0].get('duration') or 0)
    if not math.isfinite(duration) or duration <= 0: ap.error('无法取得有效时长')
    frames_dir = out/'frames'; frames_dir.mkdir()
    print('正在抽取完整画面的文字扫描帧…', flush=True)
    # Select source frames and preserve their real presentation timestamps; never infer times from frame numbers.
    vf = 'setpts=PTS-STARTPTS,'
    if a.fps: vf += f"select='isnan(prev_selected_t)+gte(t-prev_selected_t,{1/a.fps})+gt(scene,0.25)',"
    vf += 'showinfo'
    p = run(['ffmpeg','-hide_banner','-i',video,'-map',f"0:{videos[0]['index']}",'-vf',vf,
             '-fps_mode','vfr','-q:v','2',frames_dir/'frame-%07d.jpg'])
    (out/'frame-extraction.log').write_text(p.stderr)
    times = [float(t) for t in re.findall(r'Parsed_showinfo[^\n]*\bn:\s*\d+[^\n]*pts_time:([\d.eE+\-]+)', p.stderr)]
    files = sorted(frames_dir.glob('frame-*.jpg'))
    if len(times)!=len(files) or not files: raise RuntimeError('帧数量和真实时间戳不一致，停止避免错标')
    frames = [{'path':str(p),'time':t} for p,t in zip(files,times)]
    dump(out/'frames.json',frames)
    h=hashlib.sha256()
    with video.open('rb') as f:
        for chunk in iter(lambda:f.read(1024*1024), b''):h.update(chunk)
    manifest={'schema_version':1,'video':str(video),'sha256':h.hexdigest(),'duration':duration,
              'metadata':metadata,'coverage':{'visual_mode':'逐帧文字扫描' if a.fps==0 else f'每秒约{a.fps:g}帧加场景切换',
              'frame_count':len(frames),'ocr':'未执行','audio_tracks':[],'subtitle_tracks':[]},'warnings':[]}
    dump(out/'manifest.json',manifest)
    evidence=[]
    if not a.skip_ocr and sys.platform=='darwin' and shutil.which('swiftc'):
        try:
            binary=out/'ocr-local'
            run(['swiftc','-O',ROOT/'scripts/ocr.swift','-o',binary],timeout=180)
            print('正在本地识别全画面文字和二维码…',flush=True)
            # Stream to disk so long videos do not accumulate all OCR output in process memory.
            with (out/'ocr.jsonl').open('w') as f, (out/'ocr-error.log').open('w') as err:
                p=subprocess.run([str(binary),str(out/'frames.json')],stdout=f,stderr=err,timeout=7200)
            if p.returncode: raise RuntimeError('画面识别进程失败，见 ocr-error.log')
            failures=0
            for line in (out/'ocr.jsonl').read_text().splitlines():
                obj=json.loads(line)
                if obj.get('error'): failures+=1;continue
                for row in obj['lines']:
                    evidence.append({'start':obj['time'],'end':obj['time'],'channel':'screen_text',
                                     'text':row['text'],'confidence':row['confidence'],'box':row['box'],'source':obj['path']})
                for row in obj['codes']:
                    evidence.append({'start':obj['time'],'end':obj['time'],'channel':'barcode',
                                     'text':row['payload'] or '[识别到码，内容未解出]','box':row['box'],'source':obj['path']})
            manifest['coverage']['ocr']='已扫描' if not failures else f'{failures}帧失败，其余已扫描'
            if failures:manifest['warnings'].append('部分画面识别失败，需补查原帧')
        except Exception as e:manifest['warnings'].append(str(e));manifest['coverage']['ocr']='失败'
    else:manifest['warnings'].append('画面文字未自动识别，须查看原帧或使用其他本地 OCR 工具')
    subs=list(a.subtitle)
    for ext in ['.srt','.vtt']:
        p=video.with_suffix(ext)
        if p.is_file() and p not in subs:subs.append(p)
    for p in subs:evidence+=parse_subtitle(p.expanduser().resolve(),'provided_subtitle')
    for s in [s for s in metadata['streams'] if s['codec_type']=='subtitle']:
        target=out/f"subtitle-{s['index']}.srt"
        try:
            run(['ffmpeg','-v','error','-i',video,'-map',f"0:{s['index']}",target])
            evidence+=parse_subtitle(target,'embedded_subtitle')
            manifest['coverage']['subtitle_tracks'].append({'index':s['index'],'state':'已提取'})
        except Exception as e:
            manifest['coverage']['subtitle_tracks'].append({'index':s['index'],'state':'失败'})
            manifest['warnings'].append(str(e))
    available=[ROOT/'models/ggml-small.bin', ROOT/'models/ggml-small-q5_1.bin', ROOT/'models/ggml-base-q5_1.bin']
    model=a.model or next((p for p in available if p.is_file()),available[0])
    manifest['asr_model']=str(model)
    for s in [s for s in metadata['streams'] if s['codec_type']=='audio']:
        state={'index':s['index'],'state':'未转写'}
        manifest['coverage']['audio_tracks'].append(state)
        try:
            wav=out/f"audio-{s['index']}.wav"
            run(['ffmpeg','-v','error','-i',video,'-map',f"0:{s['index']}",'-ac','1','-ar','16000','-c:a','pcm_s16le',wav])
            state['audio_file']=str(wav)
            if a.skip_asr: continue
            if not model.is_file() or not shutil.which('whisper-cli'):
                raise RuntimeError('缺少 whisper-cli 或语音模型；可用 --model 指定模型，语音尚未检查')
            print(f"正在本地转写音轨 {s['index']}…",flush=True)
            base=out/f"speech-{s['index']}"
            p=run(['whisper-cli','-m',model,'-f',wav,'-l',a.language,'-osrt','-oj','-of',base],timeout=7200)
            (out/f"speech-{s['index']}.log").write_text(p.stderr)
            segments=parse_subtitle(base.with_suffix('.srt'),f"speech_track_{s['index']}")
            offset=float(s.get('start_time') or 0)-float(videos[0].get('start_time') or 0)
            state['offset_to_primary_video']=offset
            for segment in segments:
                segment['start']=max(0,segment['start']+offset)
                segment['end']=max(segment['start'],segment['end']+offset)
            evidence+=segments
            state['state']='已转写待听校'
        except Exception as e:state['state']='失败';manifest['warnings'].append(str(e))
    dump(out/'evidence.json',sorted(evidence,key=lambda x:(x['start'],x['channel'])))
    gaps=[b['time']-a['time'] for a,b in zip(frames,frames[1:])]
    manifest['coverage']['maximum_sample_gap']=max(gaps,default=0)
    manifest['coverage']['last_sample_time']=frames[-1]['time']
    manifest['warnings'].append('OCR/语音转写均可能错漏；识别成功不等于审核完成。抽样帧不能证明没有一闪而过的文字。')
    dump(out/'manifest.json',manifest)
    print(out/'manifest.json')

if __name__=='__main__':main()
