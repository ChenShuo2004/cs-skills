# 小黄品牌 IP 提示词模板

每个独立资产单独生成。明确标注输入图是身份参考、风格参考、场景参考还是编辑目标。

## 2D 标准图

```text
Use case: stylized-concept
Asset type: 小黄（有温度）品牌 IP 标准角色图
Input images: Image 1 is the fixed character identity reference.
Primary request: Create one polished full-body illustration of the 小黄 mascot performing {动作}.
Scene/backdrop: minimal warm-white background #FFF9EF with generous breathing room.
Subject: one asymmetric warm-yellow seed-like lifeform, slightly leaning, fuller at the lower-left and narrower at the upper-right. Keep two widely spaced vertical black oval eyes, a tiny curved mouth, subtle orange blush, ultra-thin black limbs, and one long curved antenna ending in a hollow warm-orange heart. {连接爱心要求}
Style/medium: premium restrained 2D hand-drawn crayon, oil-pastel and colored-pencil illustration; visible handmade grain with clean edges.
Composition/framing: {构图}.
Lighting/mood: warm, calm, companionable and quietly optimistic.
Color palette: #F6B72A, #FFD86A, #E99A1B, #F59A23, #151515, #FFF9EF.
Constraints: character identity takes priority; exactly one character unless requested; no text, logo or watermark.
Avoid: pear, egg, ball, generic droplet, animal features, plush, fur, knit, thick limbs, gloves, shoes, anime eyes, nose, rainbow colors, neon yellow, glossy 3D, cheap glow and busy background.
```

## 3D 转换

```text
Use case: identity-preserve
Asset type: 小黄（有温度）IP 3D collectible character render
Input images: Image 1 is the identity reference; preserve the character, do not redesign it.
Primary request: Convert the fixed mascot into a collectible 3D interpretation.
Scene/backdrop: warm-white seamless studio background.
Subject: preserve the asymmetric warm-seed silhouette, hollow-heart antenna, vertical black oval eyes, tiny curved smile, subtle blush and ultra-thin black limbs.
Style/medium: matte soft vinyl with subtle warm translucency and fine frosted texture.
Composition/framing: full body, centered, simple three-quarter view, generous padding.
Lighting/mood: soft studio lighting with a restrained contact shadow.
Constraints: change only volume, material and lighting; keep character proportions and identity anchors unchanged; no text or watermark.
Avoid: pear fruit, fur, plush, knit, metal, glass toy, realistic skin, thick limbs and complex scenery.
```

## 风格迁移

```text
Use case: style-transfer
Input images: Image 1 is the 小黄 character identity and composition reference. Image 2 is only the visual-language reference.
Primary request: Render the same 小黄 character and action using Image 2's line quality, material, palette restraint and atmosphere.
Constraints: preserve Image 1's silhouette logic, heart antenna, face, limb proportions and action. Transfer only visual language from Image 2. Do not copy Image 2's character body, facial identity, signature props or trademarked design. No extra elements, text or watermark.
```

## 联名共创

```text
Use case: stylized-concept
Asset type: IP collaboration illustration
Input images: Image 1 is the fixed 小黄 identity reference. Image 2 is the collaborating character reference.
Primary request: Place both characters in one shared scene where they {共同动作}.
Scene/backdrop: {场景}.
Style/medium: one coherent visual language based on {画风规则}.
Composition/framing: both characters are clearly separated and equally readable.
Constraints: preserve each character's own silhouette, facial identity and signature symbols. Share only line language, lighting, palette logic and scene treatment. Do not merge their bodies or swap identifying features. No text or watermark.
```

## 局部修复

```text
Use case: precise-object-edit
Input images: Image 1 is the edit target.
Primary request: Fix only {问题部位} so it matches the fixed 小黄 character DNA.
Constraints: change only {问题部位}; preserve the current pose, composition, background, body silhouette, face, colors, texture and all unaffected elements. Do not add text, props or characters.
```
