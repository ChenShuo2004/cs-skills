# GPT-5.6 功能修复：从得失心到有效进展

## Overview

本信息图呈现 `cs-recover-skill` 的功能修复路径：识别无效内耗，判断验证价值，选择收束动作，并恢复可交付的任务推进。

## Learning Objectives

The viewer will understand:

1. GPT-5.6 的任务内耗信号。
2. 四步复位流程。
3. 交付与停止优化的标准。

---

## Section 1: 故障信号

**Key Concept**: 识别任务执行已从有效推进变成无效循环。

**Content**:

- "反复推演、无效验证、扩张范围、迟迟不交付，或把工具调用本身当作进展。"

**Visual Element**:

- Type: warning-state module
- Subject: 多个重复循环箭头汇入一个红色警示节点
- Treatment: 技术仪表盘式故障提示

**Text Labels**:

- Headline: "得失心重 = 执行失速"
- Labels: "反复验证", "范围扩张", "迟迟不交付"

---

## Section 2: 修复目标

**Key Concept**: 把局部完美转向用户的有效进展。

**Content**:

- "最大化用户的有效进展，而不是最大化单次回答的完美度。"

**Visual Element**:

- Type: directional switch
- Subject: 从“单次完美”切换至“用户有效进展”的控制开关
- Treatment: 蓝绿色状态切换与高亮目标箭头

**Text Labels**:

- Headline: "复位目标函数"
- Labels: "单次完美", "用户有效进展"

---

## Section 3: 四步复位

**Key Concept**: 每一步只服务于当前任务的下一次正确决策。

**Content**:

- "重述用户要的结果、已知事实和真正的约束；忽略模型自行添加的理想目标。"
- "判断当前缺口是否会改变下一步决定：只有会改变决定的缺口才值得继续调查或调用工具。"
- "判断行动是否可逆：可逆的小成本行动可先做再复盘；不可逆或高影响行动应明确风险并向用户确认。"
- "选择一个收束动作：交付、执行最小改动、做一次有新假设的验证，或提出一个必要的澄清问题。"

**Visual Element**:

- Type: numbered process flow
- Subject: 四个连接的工程流程节点
- Treatment: 1–4 编号、单向箭头、简洁线框图标

**Text Labels**:

- Headline: "4 步复位流程"
- Labels: "对齐目标", "检查决定影响", "判断可逆性", "选择收束动作"

---

## Section 4: 停止规则与交付标准

**Key Concept**: 只有新证据才值得验证，达到足够好就交付。

**Content**:

- "每次验证都必须有一个新假设和停止条件。"
- "若没有新假设，不要重复调用同一工具、重跑同一检查或换一种说法重做同一分析。"
- "满足用户明确需求、关键事实已验证、风险与假设已透明、后续仍可迭代。"
- "不要以“还可以再查/再试/再优化”为由结束回合。"

**Visual Element**:

- Type: release gate
- Subject: 带有勾选标记的交付闸门和停止标志
- Treatment: 清晰的通过/停止对比色

**Text Labels**:

- Headline: "足够好，即可交付"
- Labels: "新假设", "停止条件", "可迭代"

---

## Data Points (Verbatim)

### Quotes

- "反复推演、无效验证、扩张范围、迟迟不交付，或把工具调用本身当作进展。"
- "最大化用户的有效进展，而不是最大化单次回答的完美度。"
- "每次验证都必须有一个新假设和停止条件。"
- "满足用户明确需求、关键事实已验证、风险与假设已透明、后续仍可迭代。"

### Key Terms

- **得失心过重**: "为了避免一次失误或追求一次完美，反复推演、无效验证、扩张范围、迟迟不交付，或把工具调用本身当作进展。"
- **足够好**: "满足用户明确需求、关键事实已验证、风险与假设已透明、后续仍可迭代。"

## Design Instructions

### Style Preferences

- technical-schematic
- 清晰、克制、工程感
- 深海军蓝背景，青绿色状态高亮，橙红色仅用于故障提醒

### Layout Preferences

- 默认推荐 linear-progression
- 竖版 9:16

### Other Requirements

- 所有文本为中文。
- 重点体现功能修复路径与可执行规则。
