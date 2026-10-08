"""选择规则并暴露时效/来源缺口；不自动作违规裁决。仅需标准库。"""
import argparse, hashlib, json
from datetime import date
from pathlib import Path
from resource_paths import resource_path, profile_path
ROOT = Path(__file__).resolve().parents[1]
SCENES = ['post', 'advertising', 'boost', 'commerce', 'course', 'live']
def load(p): return json.loads(p.read_text())
def assess(rule, as_of):
    date.fromisoformat(as_of)
    if rule['status'] in ['retired', 'superseded']: return None
    if rule['effective_from'] and as_of < rule['effective_from']: return None
    if rule['effective_to'] and as_of > rule['effective_to']: return None
    notes = []
    if rule['status'] != 'active': notes.append('条目待核实，不可作为明确裁决')
    if not rule['effective_from']: notes.append('生效起始日期未确认')
    if as_of < rule['last_verified']: notes.append('所查日期早于本次核实；需查历史版本')
    if as_of > rule['review_after']: notes.append('超过建议复核日期；需重新核查')
    if rule['evidence_type'] in ['source_pending', 'case_observation']: notes.append('来源待核或案例观察，不是已证实禁止条款')
    return dict(rule, uncertainties=notes)
def build(platforms, as_of, scene='post', root=ROOT, profile=None):
    if scene not in SCENES: raise ValueError('未知发布场景')
    rules_root=resource_path(root,'rules')
    index_path=rules_root/'index.json'
    sources_path=resource_path(root,'references/sources.json')
    index=load(index_path)
    unknown=set(platforms)-set(index['platforms'])
    if unknown: raise ValueError('未知平台：'+','.join(sorted(unknown)))
    paths=[rules_root/index['common_file']]+[rules_root/index['platforms'][p]['rules_file'] for p in dict.fromkeys(platforms)]
    sources={s['id']:s for s in load(sources_path)['sources']}
    selected=[]
    for path in paths:
        for rule in load(path):
            if 'all' not in rule['scenes'] and scene not in rule['scenes']: continue
            item=assess(rule,as_of)
            if item is not None:
                item['sources']=[sources[s] for s in item['source_ids']]
                for source in item['sources']:
                    if source['evidence_status'] != '官方全文':
                        item['uncertainties'].append(source['id']+'：'+source['evidence_status'])
                selected.append(item)
    paths += [index_path,sources_path]
    config_path=profile_path(profile,root) if profile else resource_path(root,'references/user-profile.json')
    config=load(config_path)
    return {'framework_version':resource_path(root,'VERSION').read_text().strip(),'ruleset_version':index['version'],'as_of':as_of,'scene':scene,'platforms':list(dict.fromkeys(platforms)),'profile':config,'profile_sha256':hashlib.sha256(config_path.read_bytes()).hexdigest(),'files':{str(p.relative_to(root)):hashlib.sha256(p.read_bytes()).hexdigest() for p in paths},'rules':selected,'notice':'线索与规则上下文不是自动裁决；案例另按日期与场景人工选择。历史规则不全时必须注明无法还原。'}
if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--platforms',nargs='+',required=True)
    p.add_argument('--as-of',default=date.today().isoformat())
    p.add_argument('--scene',choices=SCENES,default='post')
    p.add_argument('--profile')
    p.add_argument('--out',type=Path,required=True)
    a=p.parse_args()
    try: result=build(a.platforms,a.as_of,a.scene,profile=a.profile)
    except (ValueError,KeyError) as e: p.error(str(e))
    a.out.parent.mkdir(parents=True,exist_ok=True)
    a.out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
