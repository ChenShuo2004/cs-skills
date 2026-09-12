# Product Pack 合同

product-pack.json 是流水线唯一的可机读输入合同。它只存可分享的规格、事实、素材引用和审批意图；不存密码、访问令牌、绝对机器路径、声音密钥或供应商私密配置。

## 最小结构

~~~
{
  "schemaVersion": "1.0",
  "product": {
    "id": "example-product",
    "name": "示例产品",
    "audience": "目标用户",
    "claims": [
      {
        "id": "claim-01",
        "statement": "可被证据画面直接证明的产品事实",
        "evidenceIds": ["asset-ui-01"]
      }
    ],
    "prohibitedClaims": ["未经确认的性能、价格、客户结果或保证"]
  },
  "assets": {
    "productEvidence": [
      {
        "id": "asset-ui-01",
        "kind": "screen-recording",
        "source": "user-provided",
        "usage": "证明 claim-01"
      }
    ],
    "referenceVideos": [],
    "brand": []
  },
  "delivery": {
    "platform": "横版产品介绍",
    "aspectRatio": "16:9",
    "width": 1920,
    "height": 1080,
    "fps": 30,
    "durationSeconds": 60,
    "language": "zh-CN",
    "cta": "私信了解"
  },
  "voice": {
    "mode": "user-recording-or-approved-local-tts",
    "consentReference": "用户授权或原声来源"
  },
  "avatar": {
    "mode": "approved-local-comfyui",
    "pip": { "enabled": true, "position": "lower-left" }
  },
  "style": {
    "id": "product-explainer-sample",
    "parameters": {
      "captionDensity": "concise",
      "transitionEnergy": "controlled"
    }
  },
  "audio": {
    "bgm": "none",
    "sfx": "minimal"
  },
  "approval": {
    "mode": "sample-then-batch"
  }
}
~~~

## 字段规则

| 区域 | 必填字段 | 规则 |
| --- | --- | --- |
| product | id、name、claims | 每条 claims 必须有稳定 id、可验证 statement 与一个或多个 evidenceIds。没有证据的能力不能变成成片断言。 |
| assets.productEvidence | 至少一项 | 每项给 id、kind、source、usage。素材可以是组件视频、真实 UI、屏录、原声或用户已确认文本。 |
| delivery | platform、cta | 不填规格时使用 16:9/1920×1080/30fps/60 秒/中文；任何不同规格都必须明确写入。 |
| voice | mode、consentReference | 只描述授权来源和制作模式，不写声音 API 密钥。 |
| avatar | mode | 记录本地数字人模式。PIP 启用时只允许安全区域位置，默认 lower-left。 |
| style | id | V1 使用 product-explainer-sample；新视觉只增加参数或本地模板引用。 |
| audio | bgm | 默认且推荐为 none；使用 BGM 必须是用户明确选择。 |
| approval | mode | V1 必须是 sample-then-batch，确保样片审批先于批量。 |

## 验证与运行记录

先运行：

~~~powershell
node scripts/validate-product-pack.mjs path\\to\\product-pack.json
~~~

验证器只检查合同结构和可追溯引用，不检查文件是否真实存在，也不启动任何供应商或本地服务。随后由预检记录真实环境状态。

每次运行将产品包快照、工具预检、素材清单、时间轴、样片审批和最终 QA 写回产品工作区。产品包修改后要生成新快照，并在 decision-log.md 标出改变的事实、风格、时长或 CTA。
