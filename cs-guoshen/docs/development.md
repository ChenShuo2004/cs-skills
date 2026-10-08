# 开发与验证

以下命令从仓库根目录执行。

```sh
python3 -m pip install -r requirements-dev.txt
python3 scripts/validate_framework.py
python3 scripts/test_candidates.py
python3 scripts/test_framework.py
python3 scripts/test_resource_paths.py
```

自动检查数据格式、日期、跨文件引用和平台隔离；人工复核负责证据真实性、适用语境与匿名化。这些测试不是平台审核准确率测评。历史拒审不能仅用今天的规则倒推；过期规则和正文缺口须保留在报告中。

## 文件维护约定

- 运行脚本入口保持稳定；入口说明见 [脚本目录](../scripts/README.md)。
- 规则、案例与来源分别维护，数据格式见 [格式说明](../resources/schemas/README.md)。
- 规则修订遵循 [版本治理](rule-lifecycle.md)，不要因排版调整刷新核实日期。
- 旧文档入口继续保留跳转说明，避免已有引用失效。
- 本地模型、私人素材、中间文件和审核报告不入库；现有忽略范围见 [.gitignore](../.gitignore)。

提交要求见 [贡献指南](../.github/CONTRIBUTING.md)。自动检查配置见 [校验流程](../.github/workflows/validate.yml)。

[返回文档导航](README.md) · [返回首页](../README.md)

## 目录整理与兼容

规则、来源、配置与数据格式集中在 `resources/`，配图归入 `docs/illustrations/`。规则、来源和配置数据的内容不因移动而变化，项目版本号也不变。

运行命令仍使用 `scripts/` 下的原入口。配置参数支持新路径 `resources/profiles/strict-address.json`，也兼容原相对/绝对路径 `profiles/strict-address.json` 和 `references/user-profile.json`。已经存在的用户指定文件优先读取，不用默认配置替换自定义文件。

程序内部支持新旧两种资料目录。规则上下文输出仍保留原有字段，`files` 中的相对路径随文件实际位置更新，文件内容摘要与规则判断不变。已有调用方若直接读取被移动的数据文件，使用 `scripts/resource_paths.py` 的 `resource_path(root, 旧路径)` 定位；完整路径见 [资料目录](../resources/README.md)。
