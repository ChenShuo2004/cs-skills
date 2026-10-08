# 数据格式

| 文件 | 约束对象 | 填写说明 |
| --- | --- | --- |
| [rule.schema.json](rule.schema.json) | 规则编号、平台、场景、来源、日期、状态与历史关联 | [规则目录](../rules/README.md) · [版本治理](../../docs/rule-lifecycle.md) |
| [case.schema.json](case.schema.json) | 案例编号、证据时间、平台通知、假设、重试与公开声明 | [案例区](../../cases/README.md) · [模拟示例](../../cases/examples/EX-0001.json) |

规则与案例使用 JSON Schema 2020-12。除格式校验外，[validate_framework.py](../../scripts/validate_framework.py) 还检查跨文件引用与时间关系。运行方法见 [开发与验证](../../docs/development.md)。

格式合格不代表事实或结论已核实；公开授权与匿名化声明仍需人工复核。

[返回首页](../../README.md)
