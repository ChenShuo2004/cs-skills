"""运行方式：python3 scripts/test_candidates.py。只用合成文本，无外部副作用。"""
import json
from pathlib import Path
from resource_paths import resource_path
from scan_candidates import detect, scan

cases=[('https://example.com','url'),('example.com','suspected_url'),
       ('ｅｘａｍｐｌｅ．ｃｏｍ','suspected_url'),('example 点 com','suspected_url'),
       ('a@example.com','email'),('192.168.1.1','ip_address'),('幸福路88号','physical_address')]
for text,kind in cases:
    assert kind in [x['kind'] for x in detect(text)],text
for text in ['版本3.14','index.html','report.mp4','今天我在上海']:
    assert not detect(text),(text,detect(text))
profile=json.loads(resource_path(Path(__file__).resolve().parents[1],'profiles/strict-address.json').read_text())
r=scan([{'start':0,'end':0,'channel':'screen_text','text':'example.com'}],profile)[0]
assert '用户要求' in r['platform_candidates']['xiaohongshu']
assert '上下文' in r['platform_candidates']['bilibili']
r=scan([{'start':0,'end':1,'channel':'speech_track_1','text':'不要相信包治百病'}],profile)
assert r and all(x['requires_semantic_review'] for x in r)
r=scan([{'start':0,'end':0,'channel':'screen_text','text':'example.'},
        {'start':0.5,'end':0.5,'channel':'screen_text','text':'com'}],profile)
assert any(x['channel']=='cross_frame_candidate' for x in r)
extra_cases=[('x x x . c o m','suspected_url'),('example.c o m','suspected_url'),
             ('联系电话010-12345678','contact'),('幺三八零零幺三八零零零','contact'),
             ('电话138 0013 8000','contact'),('请加 微 信联系','redirect_cue'),
             ('请加·薇·信','redirect_cue'),('请加绿泡泡','redirect_cue'),
             ('全 网 最 低','claim_cue'),('打开这个官方网站','redirect_sentence'),
             ('资料可以私信领取','redirect_sentence'),('主页自取','redirect_sentence')]
for text,kind in extra_cases:
    assert kind in [x['kind'] for x in detect(text)],(text,detect(text))
for text in ['这只企鹅很好看','绿色软件界面','点击按钮保存文件','主页设计教程','资料已经整理完成']:
    assert not detect(text),(text,detect(text))
for text in ['请勿加 微 信转账','不要点击链接领取福利','私信讨论剪辑问题']:
    results=scan([{'start':10,'end':12,'channel':'speech_track_1','text':text}],profile)
    assert results and all(x['basis_type']=='candidate_only' and x['text']==text for x in results)
    assert all('上下文' in x['platform_candidates']['douyin'] for x in results)
assert any(x['matched']=='加 微 信' for x in detect('前文比较长而且不能错位。加 微 信'))
print('35组候选召回、误报、平台区分、原文保留与跨帧检查通过')
