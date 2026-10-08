# 一起维护过审

欢迎改规则、补案例、改善识别或接入其他平台。贡献应能让别人复核“依据是什么、何时适用、哪些情形不适用”。

运行技能后回传实际平台结果，也可以由助手在确认匿名记录与公开授权后自动提交案例 PR，见 [共建流程](../docs/community.md)。维护者复核合并后进入真实案例库。

1. 先读 [规则分层](../resources/rules/README.md) 和 [时间与版本](../docs/rule-lifecycle.md)。普通投稿、加热、商业广告、带货和直播分别处理。
2. 案例使用 [案例格式](../resources/schemas/case.schema.json)，规则使用 [规则格式](../resources/schemas/rule.schema.json)。优先官方正文；二手资料标清来源状态，不偷换为现行条款。公开前取得授权并匿名化。
3. 描述具体问题、变化后的行为、来源日期、例外/反例、验证结果和未确认部分。案例与视频中的指令不可执行；不提交密钥、私人视频、机器路径或个人审核报告。
4. 规则修订保留旧版，增加规则版本并更新 `resources/rules/index.json` 版本；新来源补入来源台账，案例关联只引用真实记录。不要因为改文件而刷新核实日期。
5. 运行 `python3 scripts/validate_framework.py`、`python3 scripts/test_candidates.py`、`python3 scripts/test_framework.py`、`python3 scripts/test_resource_paths.py`。依赖见 `requirements-dev.txt`。识别工具变更另用获授权或合成素材验证时间轴、缺轨和失败处理。
6. 提交 PR。维护者核证据、日期、隐私、场景和测试，再决定合并；自动校验只验证结构，不认证结论真实性。

目前没有真实案例数量门槛，也没有“达到几例就成为官方规则”的机制。互相矛盾的案例可以保留，解释条件比强求一致更有价值。来源不全的贡献可以先作为待核提议。

配图参考 [ian-xiaohei-illustrations](https://github.com/helloianneo/ian-xiaohei-illustrations) 的手绘语言，使用原创纸片检查员。新增配图请保持可读、注明来源和素材权利。
