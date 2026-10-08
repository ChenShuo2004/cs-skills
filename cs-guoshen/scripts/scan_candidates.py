#!/usr/bin/env python3
"""召回可疑地址与营销线索；不做最终违规判断。输入 extract_video.py 的证据。"""
import argparse
import ipaddress
import json
from pathlib import Path
from resource_paths import resource_path, profile_path
import re
import unicodedata

ROOT=Path(__file__).resolve().parents[1]
TLD=r'(?:com|cn|net|org|io|ai|app|dev|edu|gov|co|me|tv|xyz|cc|top|site|tech|online|shop|store|vip|info|biz|cloud|pro|link|host|design|studio|tools|fun|网站|中国|公司|网络)'

def normalize(text):
    s=unicodedata.normalize('NFKC',text).lower()
    s=re.sub('[\u200b-\u200f\u2060\ufeff]', '',s)
    s=s.replace('。','.').replace('．','.').replace('／','/')
    s=re.sub(r'(?<=[a-z0-9])\s*(?:\[dot\]|\(dot\)|点|點|\bdot\b)\s*(?=[a-z])','.',s)
    s=re.sub(r'(?<=[a-z0-9])\s*\.\s*(?=[a-z0-9])','.',s)
    return s

def detect(text, channel='screen_text'):
    s=normalize(text)
    found=[]
    def add(kind,m):
        if m and not any(x['kind']==kind and x['matched']==m for x in found):
            found.append({'kind':kind,'matched':m})
    emails=list(re.finditer(r'[a-z0-9._%+\-]+@[a-z0-9.-]+\.[a-z]{2,}',s))
    for m in emails:add('email',m[0])
    for m in re.finditer(r'(?:https?://|www\.)[^\s<>"，。；]+',s):add('url',m[0])
    for m in re.finditer(r'(?<![a-z0-9_@.-])(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+'+TLD+r'(?![a-z0-9_-])',s):
        if not any(a.start()<=m.start()<a.end() for a in emails):add('suspected_url',m[0])
    for m in re.finditer(r'(?<![\d.])(?:\d{1,3}\.){3}\d{1,3}(?![\d.])',s):
        try:ipaddress.ip_address(m[0]);add('ip_address',m[0])
        except ValueError:pass
    # Whitespace-separated host spelling is a candidate, never a confirmed address.
    for m in re.finditer(r'\b(?:[a-z0-9]\s+){2,}[a-z0-9]\s*\.\s*'+TLD+r'\b',s):add('suspected_url',m[0])
    # Allow spaced host/TLD letters without treating every spaced English sentence as a URL.
    spelled_tld='(?:'+'|'.join(r'\s*'.join(t) for t in ['com','cn','net','org','io','ai','app','dev','edu','gov','co','xyz'])+')'
    for m in re.finditer(r'(?<![a-z0-9])(?:[a-z0-9-]\s*){1,63}\s*\.\s*'+spelled_tld+r'(?![a-z0-9])',s):
        if re.search(r'[a-z]\s+[a-z]',m[0]):add('suspected_url',m[0])
    for m in re.finditer(r'[\u4e00-\u9fff]{2,20}(?:路|街|巷|弄|大道)\s*[0-9一二三四五六七八九十百]+\s*号(?:[^，。；\n]{0,15})?',s):add('physical_address',m[0])
    for m in re.finditer(r'(?:收货地址|居住地址|家庭住址|联系地址|地址是|门店地址)\s*[:：]?\s*[^，。；\n]{3,70}',s):add('physical_address',m[0])
    for m in re.finditer(r'(?<!\d)1[3-9]\d{9}(?!\d)',s):add('contact',m[0])
    for m in re.finditer(r'(?<!\d)0\d{2,3}[-\s]?\d{7,8}(?!\d)',s):add('contact',m[0])
    # Preserve the original spoken digits; conversion is solely for candidate validation.
    digits='零〇一幺二两三四五六七八九0123456789'
    number_map=str.maketrans('零〇一幺二两三四五六七八九','0011223456789')
    for m in re.finditer('(?<!['+digits+'])(?:['+digits+'][ \t、，-]*){10}['+digits+'](?!['+digits+'])',s):
        number=re.sub('[^'+digits+']','',m[0]).translate(number_map)
        if re.fullmatch(r'1[3-9]\d{9}',number):add('contact',m[0])
    # Match limited separators directly so the match stays traceable to the source text.
    for word in ['加微信','加薇信','加个微信','加扣扣','加绿泡泡','联系绿泡泡','全网最低','保证收益']:
        pattern=r'[ \t.·、，_-]{0,3}'.join(map(re.escape,word))
        for m in re.finditer(pattern,s):add('claim_cue' if word in ['全网最低','保证收益'] else 'redirect_cue',m[0])
    for pattern in [
        r'(?:点击|打开|访问|下载|搜索|添加|跳转到)[^。！？\n]{0,12}(?:网站|链接|公众号|小程序|站外平台)',
        r'(?:资料|模板|福利|优惠|资源)[^。！？\n]{0,12}(?:私信|联系我|加我|评论.{0,3}领取)',
        r'(?:主页|简介|置顶评论|评论区)[^。！？\n]{0,8}(?:领取|自取|下载|链接|联系方式)',
    ]:
        for m in re.finditer(pattern,s):add('redirect_sentence',m[0])
    for m in re.finditer(r'加(?:我|微|v)|微信|微[信芯]|私信|扫码|进群|主页领取|评论.{0,8}(?:领取|送)|站外|私下(?:交易|转账)|网盘|提取码|返利|代购',s):add('redirect_cue',m[0])
    for m in re.finditer(r'包治|根治|治愈|无副作用|永久有效|百分之百|100%|全网最低|最好|最佳|第一|国家级|稳赚|保本|保证收益|躺赚|日入|月入|内部消息|包过',s):add('claim_cue',m[0])
    if channel=='barcode':add('barcode',text)
    return found

def scan(rows,profile):
    output=[]
    strict=set(profile.get('strict_visual_categories',[]))
    for i,row in enumerate(rows):
        for hit in detect(row.get('text',''),row.get('channel','')):
            visual=row.get('channel') in {'screen_text','barcode'}
            statuses={p:'需结合上下文复核，非违规结论' for p in profile['default_platforms']}
            if visual and hit['kind'] in strict:
                for p in set(profile['strict_visual_address_platforms']) & set(statuses):statuses[p]='按用户要求修改；须回看原帧确认识别'
            output.append({'evidence_index':i,**row,**hit,'platform_candidates':statuses,
                           'basis_type':'candidate_only','requires_semantic_review':True})
    # Adjacent text can spell a URL across frames/lines. Preserve component indices, do not invent raw evidence.
    for i,row in enumerate(rows):
        if row.get('channel')!='screen_text':continue
        near=[(j,r) for j,r in enumerate(rows[i:i+15],i) if r.get('channel')=='screen_text'
              and 0<=r['start']-row['start']<=2]
        if len(near)<2:continue
        joined=''.join(r['text'] for _,r in near)
        components={h['matched'] for _,r in near for h in detect(r['text'])}
        for h in detect(joined):
            if h['kind'] in {'url','suspected_url','email','ip_address'} and h['matched'] not in components:
                output.append({'evidence_indices':[j for j,_ in near], 'start':row['start'],
                    'end':near[-1][1]['start'],'channel':'cross_frame_candidate','text':joined,
                    **h,'basis_type':'candidate_only','requires_semantic_review':True,
                    'note':'相邻文字拼接候选；不证明原画面存在完整网址，必须回看位置与出现顺序'})
    return output

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('evidence',type=Path);p.add_argument('--out',type=Path,required=True)
    p.add_argument('--profile',type=Path,default=ROOT/'references/user-profile.json')
    p.add_argument('--platforms',nargs='+',help='仅输出指定平台注册表ID的候选')
    a=p.parse_args()
    rows=json.loads(a.evidence.read_text());profile=json.loads(profile_path(a.profile,ROOT).read_text())
    if a.platforms:
        registry=json.loads(resource_path(ROOT,'rules/index.json').read_text())['platforms']
        if set(a.platforms)-set(registry): p.error('存在未知平台')
        profile['default_platforms']=list(dict.fromkeys(a.platforms))
    results=scan(rows,profile)
    a.out.write_text(json.dumps({'notice':'候选列表不能代替语义审查，也不能据此宣布视频无问题','candidates':results},ensure_ascii=False,indent=2))
    print(f'已找到 {len(results)} 个待复核线索')

if __name__=='__main__':main()
