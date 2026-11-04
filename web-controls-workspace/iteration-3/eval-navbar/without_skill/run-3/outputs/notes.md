# 实现说明

## 交付物
- `page.html`：单文件 HTML，内嵌全部 CSS/JS，零外部依赖，双击即可打开（断网可用）。

## 设计定位（高级感从哪来）
- **配色**：暖米纸底 `#f7f4ee` + 墨色文字，全局只有一处朱红点缀（`#bd3b2b`），用在印章 Logo、悬停下划线提示点与当前章节编号。
- **三层字体系统**：宋体系大标题（Georgia/STSong/SimSun fallback）× 无衬线正文 × 等宽小号微标签（大写字距 0.2em+），编辑排版风。
- **1px 细线骨架**：导航底边、section 头、作品行、统计栏全部用 hairline 分隔，弱化“卡片感”。
- **留白与节奏**：section padding `clamp(72px,10vw,124px)`，首屏内容垂直居中，巨型低透明度“舟”字水印作背景。

## 导航栏交互
- 顶部固定，首屏透明；滚动 > 24px 后变为毛玻璃（backdrop-filter blur）+ 底部细线。
- 下滑 > 320px 自动隐藏、上滑立即出现（菜单打开时强制显示）。
- 链接带编号 `01/02/03`，悬停下划线从左展开；IntersectionObserver 高亮当前章节。
- "可接新项目" 状态胶囊带脉冲绿点；CTA 按钮 hover 上浮 + 箭头位移。
- 移动端（≤920px）收起导航，汉堡按钮展开全屏抽屉：链接逐条错落入场、点击/Esc 关闭、锁定滚动。

## 首屏
- `100svh` 满屏；kicker → 标题 → 副文案 → CTA → 底部信息条按 60–560ms 逐级入场（IntersectionObserver reveal，动画结束后清除延迟，避免拖慢 hover）。
- 底部信息条：杭州时间每 30s 刷新（Intl Asia/Shanghai）、向下滚动动画指示、版权信息。

## 无障碍与细节
- skip link、语义化 `header/nav/main/section`、`aria-expanded`、`:focus-visible` 朱红描边、`prefers-reduced-motion` 全量降级、`::selection` 反白。
- 细微噪点纹理（SVG feTurbulence data URI，透明度 4%）。

## 使用与定制
- 改名字：替换“林一舟”与邮箱两处即可。
- 改主色：只改 `:root` 里的 `--accent`。
- 增删导航：在 `site-nav` 与 `.mobile-menu` 各加一条 `<a>`，并确认对应 `section id` 存在。
- 作品三行、简介文案均为占位，直接替换成真实内容。

## 已知限制
- 抽屉菜单、入场动画、时钟依赖 JS（已提供 `<noscript>` 保证内容可见）。
- 大标题中文宋体在不同系统下渲染略有差异，属字体栈兜底行为。
