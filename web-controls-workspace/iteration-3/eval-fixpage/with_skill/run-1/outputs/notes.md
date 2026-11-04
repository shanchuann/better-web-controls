# 选型笔记 · 民宿官网页面修复

需求类型：**修复页面问题**。按 SKILL.md 工作流第 1 步，查阅 `references/fixes.md`（细节修复对照表）；因涉及页面整体结构，同时查阅 `references/layouts.md` 确认布局类型不变。

## 一、症状识别与匹配

用户三处抱怨 "images look off, some gaps will not go away, hero content blocked by nav"，先按 fixes.md 症状表匹配，再对照 broken.html 源码逐一确认病因。**判断先于选择：每个症状都先在源码里找到确切病因，再套用修复指令，不做无据改动。**

| # | 用户说 | 症状表匹配 | 源码确诊 |
|---|---|---|---|
| 1 | 图片总看着是歪的、偏的 | 症状 2“图片看着偏了” | `.room .pic img` 用了 `object-fit: contain` 居中留白（broken.html:31）；hero 大图固定 380px 高、按默认 `fill` 拉伸变形 |
| 2 | 有些间距怎么都去不掉 | 症状 4“间距去不掉” | `.old-copy { margin-left: 40px; margin-top: 24px }`，源码注释自述“旧模板残留多余的 margin”（broken.html:36） |
| 3 | 首屏内容被顶部导航挡住 | 症状 5“内容被导航栏挡住” | `nav` 为 fixed 浮动覆盖（broken.html:12），`.hero` 直接从页面顶部开始，未给 64px 导航留位（broken.html:19） |

## 二、候选与对比

问用户的要不要先问？三处病因在源码中全部实锤，无需确认关键判断，直接进入候选对比。

### 修复① 图片歪偏（症状 2）

**候选 A：填满容器 cover** —— 图片按容器比例裁切填满，无留白、无变形，主体居中。适用于房型封面、首屏大图。
**候选 B：更换图片比例** —— 重新挑选与容器比例一致的图片。成本高、图片不可控，且三张房图宽高比各不相同，无法统一。
**候选 C：保持 contain 但改背景色掩饰** —— 治标，留白仍在，封面呈"信箱状"，不解决问题。

选定 **A**，直接使用修复指令原文：“改成填满容器 cover，别居中”。hero 大图同理设为 `cover`，消除 `fill` 拉伸导致的歪斜感。

### 修复② 残留间距（症状 4）

**候选 A：删除 `.old-copy` 的 margin，彻底归零** —— 针对 `.old-copy` 这个从旧模板复制来的包装层，源码注释已明示是残留样式。
**候选 B：用 `!important` 压制** —— 治标不治本，残留样式继续存在，后续维护仍会困惑。

选定 **A**，使用指令“查残留的 margin，彻底去掉”：`.old-copy { margin: 0 }` 国际化。

### 修复③ 首屏被导航挡住（症状 5）

**候选 A：给 hero 加 padding-top: 64px** —— 保留 fixed 半透明毛玻璃导航的漂浮效果（原设计意图，backdrop-filter 可见），内容下移让位。修复指令原文：“给内容留出导航栏的高度（padding-top）”。
**候选 B：把导航改为 static 占位** —— 内容不再被挡，但半透明浮层导航变成不透明的普通条，改变原有视觉风格，违反“保持风格不变”。

选定 **A**：`.hero { padding-top: 64px }`，与导航 64px 高度精确对应，半透明 blur 效果保留。

## 三、最终选型理由

1. 三条修复全部取自 fixes.md 实测指令原文，未改写措辞，风险最低。
2. 价格钉：只动病灶，**内容、文案、配色（#faf8f5/#fff/#333/#444/#666/#888/#999）、导航半透明毛玻璃、卡片圆角与留白、960px 单栏布局全部保持原样**（layouts.md 对应落地页布局，结构不变）。
3. 复核 fixes.md 使用建议三处：**对齐**（房型图片 cover 裁切后视觉居中饱满）、**间距**（`.old-copy` margin 归零，`h2` 补 margin-bottom 20px 使标题与正文间距与原 48px 段落节奏一致）、**遮挡**（hero 上方 64px 让位，首屏 lead 文案不再沉入导航背后）。
4. 附加一处低-risk改（如上）：`.rooms` 加 `flex-wrap: wrap` 并补 `img { display: block }`，⊶ 窄窗口不产生横向滚动条（fixes.md 常见病【横向滚动】），且宽度足够时布局与原版完全一致。

## 修复对照速览

| 症状 | 修复 | 位置 |
|---|---|---|
| 图片歪偏 | `object-fit: contain` → `cover`（房型图 + 首屏大图） | page.html 内 `.pic img` / `.hero img` |
| 间距去不掉 | `.old-copy` margin-left 40px / margin-top 24px → 归零 | page.html 内 `.old-copy` |
| 首屏被挡 | `.hero` 增加 `padding-top: 64px`（=nav 高度） | page.html 内 `.hero` |
