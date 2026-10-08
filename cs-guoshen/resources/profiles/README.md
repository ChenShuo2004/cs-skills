# 配置说明

配置表达个人发布要求，不改变官方规则的适用条件。

| 配置 | 路径 | 行为 |
| --- | --- | --- |
| 公开默认 | [resources/references/user-profile.json](../references/user-profile.json) | 四平台中性预检，不强制禁用所有网址 |
| 可选严格发布标准 | [strict-address.json](strict-address.json) | 小红书、抖音不推广国外模型和 AI，不出现网址或疑似网址；保留原有具体地址检查 |

默认与可选配置集中在资料目录；两个配置的原有检查项保留，旧配置命令仍可使用。只有用户明确要求时才启用严格发布标准，候选命中仍需回看原帧确认识别。

`build_review_context.py` 与 `scan_candidates.py` 均支持 `--profile <配置路径>`；用法见 [使用指南](../../docs/usage.md)。配置不能代替全片检查，未完成逐帧检查时不能宣称“零网址”。

[返回首页](../../README.md)

两项重点的适用范围与人工复核边界见 [严格发布标准](../../docs/strict-publishing-standard.md)。
