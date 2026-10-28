# Better Web Controls

Vibe Coding 网页控件翻译词典。

将"做个下拉""加个按钮""做个好看的导航""页面乱七八糟"这类模糊需求，转写为 AI 可一次执行的准确描述：控件中文名、英文名、使用场景、操作规则。

## 安装

```bash
# 交互式：自动检测已安装的 agent（OpenCode / Claude Code / Cursor 等），选择后安装
npx skills add shanchuann/better-web-controls

# 指定只装这一个技能、只装到 OpenCode
npx skills add shanchuann/better-web-controls --skill better-web-controls -a opencode

# 全局安装（跨项目可用）
npx skills add shanchuann/better-web-controls -g
```

需要 Node.js 22.20 以上版本。skills CLI 支持 75 个以上的 agent，安装时自动写入对应 agent 的技能目录，例如 OpenCode 为 `.opencode/skills/`，全局安装为 `~/.config/opencode/skills/`。其他 agent 的目录由 CLI 自动识别，无需手动放置。

## 技能做什么

用户要求制作网页、页面或控件，或反馈 AI 生成的页面不符合预期时，本技能执行以下流程：

1. 识别需求类型，路由到对应参考文件（控件、布局、交互规则、修复、图表）
2. 列出候选并说明选型理由。同一类控件存在多种形式，例如下拉有 7 种、进度有 8 种动画；输出 2 至 3 个候选及适用场景，信息不足时向用户确认判断依据
3. 将候选对比与选型理由写入 `notes.md`
4. 输出可直接使用的 Prompt，或按 Prompt 规格直接生成页面

## 内容覆盖

| 参考文件 | 内容 |
|---|---|
| `references/controls.md` | 按钮6形态、下拉7种、轮播7种、Tab6种、侧边栏5种、弹窗、进度8种、上传5种、表格5种、特殊控件8种、表单输入控件 |
| `references/layouts.md` | 网站布局7种、AI产品布局6种、登录页5种、导航9种、首页10模块、首屏设计、大屏5种布局、工作台实战、风格参考图 |
| `references/rules.md` | 提示7级、二次确认7种、等待体验6种、校验时机、表单7检查点、空状态5种、对齐5种、长页面定位7种、分组方式、设计术语7词 |
| `references/fixes.md` | 细节修复7句（症状、病因、指令）、常见问题6句 Prompt |
| `references/charts.md` | 10种图表与场景选型、决策问句 |

全部条目经逐帧核对原始素材，无推断性内容。

## 仓库结构

```
skills/better-web-controls/   技能本体（npx skills add 的安装源）
├── SKILL.md                  触发条件、工作流、核心公式、完整示例
├── CHANGELOG.md              版本记录
└── references/               5 个参考文件（按需加载）
web-controls-workspace/       评测（9 个场景，对比带与不带技能的结果）
```

各 agent 的技能目录（如 `.opencode/skills/`、`.agents/skills/`）是安装时自动生成的本机副本，不入版本控制。

## 发布与更新

1. 已发布至 `https://github.com/shanchuann/better-web-controls`
2. 更新流程：修改 `skills/better-web-controls/`，推送后用户端执行 `npx skills update` 跟进
3. 评测场景见 `web-controls-workspace/evals.json`

## License

MIT。
