# 规则来源读取与更新

先用联网搜索核查新公告，再读原页；检索不到不代表没有新规则。`sources.json` 的 `checked_at` 是本次读取日，不是规则生效日。当前小红书社区规范入口返回 2021 年版本，抖音、B站公约有未标明日期的正文，均不能宣传为“2026完整最新内部规则”。

## 小红书动态协议页

网页展示可能为空。本次检查了官网页面引用的脚本，找到页面实际调用的公开正文接口，成功取得 X01/X02。参数在查询字符串中，不能误放进请求体。示例：

```python
import json
from urllib.request import Request, urlopen
token = 'ZXXY20221213003'  # 社区规范；用户协议是 ZXXY20220331001
url = ('https://oacontract.xiaohongshu.com/oacontract/v1/contract/findContractContent'
       '?id=-1&contractNo=' + token)
request = Request(url, data=b'{}', headers={'Content-Type': 'application/json'})
result = json.loads(urlopen(request, timeout=30).read())
assert result.get('statusCode') == 200, result.get('errorMsg')
content = result['data']
```

只限官方公开规范的已知编号；不要枚举私人合同编号。接口变化时重新检查规则页面及其关联资源，不猜接口或授权参数。返回失败 JSON 不能当作正文。

## 抖音规则中心

原页 `https://www.douyin.com/rule/policy` 是动态页面。2026-09-06关联的公开配置为：

`https://lf3-beecdn.bytetos.com/obj/ies-fe-bee/bee_prod/biz_1107/bee_prod_1107_bee_publish_10877.json`

读取 `bee_dsrc_12562[0].policyDocInfo`，其中 `policyDocTitle` 为标题，`policyDocMd` 为正文，`policyDocSource` 为结构化细目来源，`redirectUrl` 为官方专项入口。已核对自律公约、医疗健康公约、未成年人规范，电商指向独立规则中心。刷新时从当前页面引用脚本重新确认配置地址，不能永久假设文件名不变。

## B站社区公约

原页 `https://member.bilibili.com/studio/convention/content?index=3-1&navhide=1`。2026-09-06官网引用：

`https://s1.hdslb.com/bfs/static/creator-monorepo/convention/static/js/index.5ac9c1a2.js`

正文以公开脚本中的 JSON 数据保存，字段有 `title`、`children`、`contentXML`。可静态提取数据，不执行远端脚本。须重新从当前官网获取脚本地址；不要拿海外 bilibili.tv 或已下线的轻视频 bbq.bilibili.com 规则替代主站。

## 未直接取得的条款

- 小红书交易导流细则完整原文：有2025年媒体转述，已标二手；每次涉及交易时优先取得当次商家/创作者规则中心原文。
- 小红书社区公约2.0：有2026-01-20报道和官方入口，不能把报道当完整规则全文。
- 抖音电商专项细则与投放规则：本技能保存官方导航，不能根据修订公示的搜索摘要断言已生效。
- 账号后台的个性化资质、投放资格、处罚通知：不在公开资料中，需当事人材料。

如需扩展规则，新增编号、原页、机构、适用平台/场景、发布日期、生效日、核查日、读取状态、条款位置与简短自述；保留旧新差异，避免整篇复制平台手册。

## 视频号

2026-09-07直接取得 [微信视频号运营规范](https://weixin.qq.com/cgi-bin/readtemplate?t=weixin_agreement&s=video) 中文正文；注意链接参数是 `t=weixin_agreement&s=video`。页面有多语言入口，核对实际中文内容，不能把HTTP 200当作正文成功。正文7.2说明文档动态更新，页面未明确本版生效时间。记录条款位置、查阅时间与内容摘要；外链、直播等专项沿正文链接另查，不混为普通投稿规则。
