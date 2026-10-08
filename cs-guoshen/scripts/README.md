# 脚本目录

以下路径与现有调用方式保持不变，命令从仓库根目录执行。

## 运行工具

| 文件 | 用途 |
| --- | --- |
| [build_review_context.py](build_review_context.py) | 按目标平台、日期和场景选择规则，保留来源与时效缺口 |
| [extract_video.py](extract_video.py) | 提取音轨、字幕、画面文字及二维码，保留失败与覆盖记录 |
| [ocr.swift](ocr.swift) | macOS Vision 画面文字与二维码识别，由提取脚本调用 |
| [scan_candidates.py](scan_candidates.py) | 从证据召回地址、联系方式和营销线索，供语义复核 |

运行示例见 [使用指南](../docs/usage.md)，依赖及输出见 [提取说明](../resources/references/extraction.md)。候选不是违规裁决，最终复核见 [AI审核流程](../docs/ai-review.md)。

资料位置由 [resource_paths.py](resource_paths.py) 统一解析，支持新旧目录与已有用户配置。

## 校验与测试

| 文件 | 用途 |
| --- | --- |
| [validate_framework.py](validate_framework.py) | 校验规则与案例格式、日期、来源和跨文件引用 |
| [test_candidates.py](test_candidates.py) | 35组候选召回、误报、平台区分与跨帧检查 |
| [test_resource_paths.py](test_resource_paths.py) | 旧配置命令、自定义配置与新旧资料目录兼容 |
| [test_framework.py](test_framework.py) | 平台隔离、配置、时效、来源缺口与错误数据检查 |

安装与检查命令见 [开发与验证](../docs/development.md)。这些检查验证程序与数据结构，不表示平台审核准确率。

[返回首页](../README.md)
