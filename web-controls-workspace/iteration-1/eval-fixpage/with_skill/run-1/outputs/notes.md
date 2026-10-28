# 诊断笔记：broken.html → fixed.html

依据 `skills/web-controls/SKILL.md` 工作流，路由到 `references/fixes.md`（修 Bug/页面不对劲）。
每个问题按 fixes.md 的三段式记录：**症状 → 病因 → 给 AI 的指令（本次实际修复方式）**。
内容、配色、风格均未改动，只动了布局/裁切/间距相关代码。

---

## 问题 1：间距怎么都去不掉（对应 fixes.md 第 4 条）

- **症状**："为什么选山晨"区块整体向右偏、顶部多出一块空白，改 `.content` 和 `section` 的值都没有效果。
- **病因**：包裹两个 `<section>` 的 `<div class="old-copy">` 残留了旧模板的样式 `margin-left: 40px; margin-top: 24px;`。间距的来源不在我改的那层容器里，所以怎么调都"去不掉"。
- **指令/修复**："查残留的 margin，彻底去掉。"→ 直接删除 `.old-copy` 规则和这个多余的包裹层 div，区块归位到 `.content` 的正常流内。

## 问题 2：内容被顶部导航挡住（对应 fixes.md 第 5 条）

- **症状**：首屏大图顶端被半透明导航栏盖住，logo/Nav 和图片叠在一起。
- **病因**：导航是 `position: fixed; height: 64px;` 的透明浮动导航（fixed FIXED NAVBAR），但首屏 `.hero` 从页面 `top: 0` 开始排版，没有为固定定位导航预留任何空间——fixed 元素脱离文档流，内容自然顶到最上面。
- **指令/修复**："给内容留出导航栏的高度（padding-top）。"→ 在 `body` 上加 `padding-top: 64px`，与导航栏高度完全一致；整页内容（含 footer）都随之下移，任何滚动位置都不会再被遮挡。

## 问题 3：图片总看着是歪的偏的（对应 fixes.md 第 2 条）

- **症状**：房型卡片里的图片不贴边、两侧留白，看着像没放正。
- **病因**：`.room .pic img` 用了 `object-fit: contain`。图片长宽比与 220px 高的固定容器不一致时，contain 只按比例缩放并居中，四周露白，视觉上就是"歪的偏的"。
- **指令/修复**："改成填满容器 cover，别居中。"→ `object-fit: contain` 改为 `object-fit: cover`，图片裁切填满容器、边缘贴齐。

## 问题 4：首屏大图被拉伸变形（自查发现，fixes.md【语义裁切】同类）

- **症状**：首屏明显的横向空间被"压扁"了，人和物体比例不对——和问题 3 同属一类根源。
- **病因**：`.hero img` 设置了 `width: 100%` + 固定 `height: 380px`，但没有声明 `object-fit`，默认值是拉伸到容器（fill/stretch / 非等比拉伸）。
- **修复**：加 `object-fit: cover`，等比裁切填满，不再变形。

## 问题 5：窄屏卡片溢出、可能出横向滚动条（自查发现，fixes.md 急救包【响应式布局】）

- **症状**：三张卡片固定 `width: 300px`，在手机上超出视口宽度，页面能左右晃。
- **病因**：Flex 项目宽度写死，小屏无法收缩。
- **修复**："桌面多列、手机单列。"→ `.rooms` 加 `flex-wrap: wrap`，`.room` 改为 `flex: 1 1 280px; max-width: 300px`（桌面上仍是三列、视觉不变），并加 `@media (max-width: 720px)` 让每张卡片占满整行单列排布。同时在 `html` 上未新增任何可能造成横向溢出的宽度。

---

## 修复对照速览

| 文件位置 | 之前 | 之后 | 对应问题 |
|---|---|---|---|
| `body` | 无 padding | `padding-top: 64px` | 问题 2 |
| `.hero img` | 无 object-fit（默认拉伸） | `object-fit: cover` | 问题 4 |
| `.room .pic img` | `object-fit: contain` | `object-fit: cover` | 问题 3 |
| `.old-copy` + 包裹 div | `margin-left: 40px; margin-top: 24px` | 规则与节点一并删除 | 问题 1 |
| `.rooms` / `.room` | 固定 300px，不换行 | `flex-wrap: wrap` + `flex: 1 1 280px` + 720px 单列媒体查询 | 问题 5 |

## 修完后自查三处（fixes.md 建议：对齐、间距、遮挡）

1. **遮挡**：滚动到任意位置，导航栏下方内容均完整可见，无叠压。
2. **对齐**：三张卡片顶边、图片框顶边对齐，图片无偏移留白。
3. **间距**："为什么选山晨"标题距上方 hero 图的间距与各 `section` 间距一致，整个内容区左边缘与 footer 居中基准对齐，无固定偏移；375px 宽度下无横向滚动条。
