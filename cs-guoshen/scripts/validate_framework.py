"""校验规则、案例、日期及引用关系。pip install -r requirements-dev.txt"""
import json
from datetime import date
from pathlib import Path
from resource_paths import resource_path
from jsonschema import Draft202012Validator, FormatChecker
ROOT=Path(__file__).resolve().parents[1]
def load(p): return json.loads(p.read_text())
def validate(root=ROOT):
    rules_root=resource_path(root,'rules')
    index=load(rules_root/'index.json'); sources=load(resource_path(root,'references/sources.json'))['sources']
    source_ids={s['id'] for s in sources}
    assert len(source_ids)==len(sources),'来源ID重复'
    rules=[]; rule_paths=[('common',rules_root/index['common_file'])]+[(k,rules_root/v['rules_file']) for k,v in index['platforms'].items()]
    rv=Draft202012Validator(load(resource_path(root,'schemas/rule.schema.json')),format_checker=FormatChecker())
    cv=Draft202012Validator(load(resource_path(root,'schemas/case.schema.json')),format_checker=FormatChecker())
    for scope,path in rule_paths:
        for r in load(path):
            rv.validate(r); assert r['scope']==scope,'平台范围与文件不符'
            assert set(r['source_ids'])<=source_ids,'未知来源'
            assert r['review_after']>=r['last_verified'],'复核日期早于核实日期'
            if r['effective_from'] and r['effective_to']: assert r['effective_from']<=r['effective_to'],'适用区间颠倒'
            if r['evidence_type']=='official': assert r['source_ids'],'官方条目缺来源'
            if r['evidence_type']=='source_pending': assert r['status']!='active','待核来源不能成为已启用官方判断'
            rules.append(r)
    ids={r['id'] for r in rules}; assert len(ids)==len(rules),'当前规则ID重复'
    cases=[]
    for folder,synthetic in [('examples',True),('records',False)]:
        for path in (root/'cases'/folder).glob('*.json'):
            c=load(path); cv.validate(c)
            assert c['synthetic']==synthetic,'模拟/真实案例位置错误'
            assert c['id'].startswith('EX-' if synthetic else 'CASE-'),'案例编号不符'
            assert set(c['rule_ids'])<=ids,'未知规则引用'
            assert all(e['end']>=e['start'] for e in c['evidence']),'证据时间颠倒'
            if c['confirmed_reason']: assert c['platform_notice'],'没有平台通知不能声明已确认原因'
            cases.append(c)
    cids={c['id'] for c in cases}; assert len(cids)==len(cases),'案例ID重复'
    realids={c['id'] for c in cases if not c['synthetic']}
    for r in rules:
        assert set(r['case_ids'])<=realids,'规则证据只能引用真实案例，不能引用模拟案例'
        if r['supersedes']:
            old_id,version=r['supersedes'].split('@')
            archive=rules_root/'history'/f'{old_id}-v{version}.json'
            old=load(archive); rv.validate(old)
            assert old['id']==old_id and old['version']==int(version),'历史引用不符'
            assert r['id']==old_id and r['version']>old['version'],'修订版本未递增'
    return len(rules),len(cases),len(realids)
if __name__=='__main__':
    n,c,r=validate(); print(f'校验通过：{n}条规则，{c}个案例模板/记录，其中真实案例{r}个')
