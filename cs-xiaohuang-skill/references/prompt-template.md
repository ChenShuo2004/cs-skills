# 提示词模板

每张图单独生成。先以当前文章和 shot list 填充变量；不要把多张图拼在一张画布里。

```text
Generate one standalone 16:9 horizontal Chinese article illustration.

Visual direction:
Pure white background, abundant white space, minimalist black hand-drawn pen lines with slight natural wobble, warm yellow recurring character, sparse red and blue handwritten Chinese annotations. It should feel like an absurd but clear product sketch, not a polished vector illustration.

Recurring character:
小黄, an irregular warm-yellow capsule-shaped worker with small black dot eyes and thin stick limbs. Calm, deadpan, and focused. 小黄 must perform the key conceptual action rather than decorate the scene. Never make it cute, mascot-like, childish, or overly polished.

Theme: {配图主题}
Core idea: {这一张图要让读者理解的唯一关系}
Structure: {前后变化 / 输入与转化 / 瓶颈与反馈 / 分层搭建 / 路线与选择 / 状态小漫画}
Composition: {小黄的位置、动作、主要物件和信息关系}
Handwritten Chinese labels: {标注词 1} / {标注词 2} / {标注词 3} / {可选标注词 4}

Constraints:
One core concept only. Keep the subject within 40%-60% of the canvas and leave at least one third blank. Use at most six short labels. Yellow is only for 小黄; black is for line art; red only marks a warning or result; blue only marks feedback or system state. No title in the top-left. No gradients, shadows, paper texture, realistic UI, PPT infographic, formal flowchart, course slide, dense diagram, commercial poster, or copied composition.
```

## 局部编辑

```text
Edit the supplied illustration. Change only {指定元素，例如左上角错误文字/一个短标注/指定物件}. Preserve the white background, 16:9 ratio, small yellow character, line style, composition, all unrelated labels, and image quality. Do not add a title, new objects, shadows, or extra text.
```
