# Better Web Controls

Vibe Coding 网页控件翻译词典——来自 Sue的AI知识库《web控件合集》35集方法论。

把「做个下拉」「加个按钮」「做个好看的导航」「页面乱七八糟」这类模糊中文需求，翻译成 AI 能一次做对的准确描述：**控件中文名 + 英文名 + 使用场景 + 操作规则**。

## 安装

```bash
# 交互式：自动检测已安装的 agent（OpenCode / Claude Code / Cursor 等），选择后安装
npx skills add <owner>/better-web-controls

# 指定只装这一个 skill、只装到 OpenCode
npx skills add <owner>/better-web-controls --skill better-web-controls -a opencode

# 全局安装（跨项目可用）
npx skills add <owner>/better-web-controls -g
```

> 需要 Node.js 22.20+。把 `<owner>` 换成你的 GitHub 用户名/组织名。
> 安装后 OpenCode 自动发现该技能（项目级装到 `.opencode/skills/`，全局装到 `~/.config/opencode/skills/`）。

## 这个 Skill 做什么

当用户要求做网页/页面/控件，或抱怨 AI 做的页面不对劲时：

1. **识别需求类型** → 路由到对应参考文件（控件 / 布局 / 交互规则 / 修Bug / 图表）
2. **候选选型** → 同一个"下拉"有 7 种、同一个"进度"有 8 种动画；给出 2–3 个候选和适用场景，必要时反问关键判断依据
3. **写选型笔记** → 候选对比与选型理由写入 `notes.md`
4. **输出可抄的 Prompt** → 中文名+英文名 → 使用场景 → 操作规则

## 内容覆盖（35集全量）

| 参考文件 | 内容 |
|---|---|
| `references/controls.md` | 按钮6形态 / 下拉7种 / 轮播7种 / Tab6种 / 侧边栏5种 / 弹窗 / 进度8种 / 上传5种 / 表格5种 / 特殊控件8种 / 表单输入控件 |
| `references/layouts.md` | 网站布局7种 / AI产品布局6种 / 登录页5种 / 导航9种 / 首页10模块 / 首屏设计 / 大屏5种布局 / 工作台实战 / 风格参考图 |
| `references/rules.md` | 提示7级 / 二次确认7种 / 等待体验6种 / 校验时机 / 表单7检查点 / 空状态5种 / 对齐5种 / 长页面定位7种 / 分组方式 / 设计黑话7词 |
| `references/fixes.md` | 细节修复7句（症状→病因→一句指令）/ 翻车急救包6句 Prompt |
| `references/charts.md` | 10种图表×场景选型 / 决策问句 |

所有条目均经原视频逐帧验证，无推断性内容。

## 仓库结构

```
skills/better-web-controls/   ← 技能本体（npx skills add 的安装源）
├── SKILL.md                  # 触发条件、工作流、核心公式、端到端示例
├── CHANGELOG.md              # 版本与素材验证记录
└── references/               # 5 个参考文件（按需加载）
.opencode/skills/             ← 本地已安装副本（与 skills/ 保持同步）
web-controls-workspace/       ← 评测（9 个场景，带/不带 skill 对比）
```

## 发布方式

1. 推送到 GitHub：`git remote add origin https://github.com/<owner>/better-web-controls && git push -u origin main`
2. 任何人在任意项目里运行 `npx skills add <owner>/better-web-controls` 即可安装
3. 更新后推送到 main，用户端 `npx skills update` 跟进

## 维护

- 修改 `skills/better-web-controls/` 后，同步复制到 `.opencode/skills/better-web-controls/`（两处内容需一致）
- 评测场景见 `web-controls-workspace/evals.json`

## License

MIT
