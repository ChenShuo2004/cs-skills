# 2026-10-06 模型依赖与缓存检测验收

历史记录：模型检测首次交付时覆盖 15 个已注册 Skill，当时未纳入 KAI 封面。v0.7.0 的完整清单与安装包验收另行记录。

## 已验证

| 检查 | 结果 |
| --- | --- |
| `node scripts/run-regression.mjs` | 全部通过，包含 Skill 静态结构、5 项资源引用、代码视频、产品包、电商 12 项和版本恢复回归 |
| 新增 `tests/test_models.py` | 13 项通过：完整缓存零下载、仅补缺失、同大小损坏、截断 / LFS 占位、断点续下、进程锁、目录与环境优先级、清单覆盖 |
| 真实本地 `check --profile whisperx-zh` | 两个固定 revision 的文件大小与完整哈希正确，均为 `ready` |
| 真实本地 `download --profile whisperx-zh`，开启 HF 离线模式 | 两个模型均为 `reused`，`downloaded_files` 为空 |
| 官方 HF 下载接口小探针 | 临时缓存下载固定版本的 `config.json`（2394 字节）；第二次返回 `reused`，禁止下载的探针未触发；临时文件已自动清理 |
| README 与模型说明的本地链接 | 分别 28、1 个有效 |
| `git diff --check` | 通过 |

本地使用 Python 3.13.13 和 huggingface_hub 1.19.0；下载依赖单独声明在 `models/requirements.txt`。固定模型元数据来自官方 Hugging Face API，注册表包含所选文件的大小及上游 LFS SHA-256 / Git blob SHA-1。

## 验证边界

没有重新下载大模型，没有执行 ASR / GPU 推理、数字人或 TTS 生成，没有验证新会话的模型判断。VAD、运行库与实际生产配置仍由对应项目预检。推送分支不等于合并到 `main`，也不等于生产部署或 GitHub Actions 已运行。
