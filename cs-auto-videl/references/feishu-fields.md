# Feishu Fields

## Current Field Concepts

Map the local workflow outputs to Feishu Bitable fields such as:

- 对标视频上传
- 产品信息
- 产品图上传
- 产品图说明
- 视频画面拆解
- 视频文案提取
- 视频脚本框架
- 复刻蓝图
- 视频文案脚本仿写
- 分镜图提示词
- 第1张分镜图
- 第2张分镜图
- 第3张分镜图
- 视频生成提示词
- 生成视频
- 素材标签
- 成片评分
- 投放状态
- 备注

## Sync Strategy

- Text outputs write directly to text fields.
- Image/video files should be uploaded as Feishu Bitable attachments first, then referenced in record fields.
- Preserve local filenames and generated timestamps for traceability.
- If API permissions are unavailable, use browser/manual Feishu sync as a fallback.

## Future API Module

The Feishu sync module should support:

- Create record.
- Update record.
- Upload images/videos as attachments.
- Write output status.
- Store model name, generation time, and asset tags.
