// 评测 runner：headless 调用 opencode 或 claude CLI 完成生成与自动评分
// 用法：
//   node run-eval.mjs --iteration iteration-3 --evals 7 --arms both --runs 1
//   node run-eval.mjs --iteration iteration-3 --evals all --arms both --runs 3
//   node run-eval.mjs --cli claude --iteration iteration-3 --evals all --runs 1
// 可选参数：
//   --cli opencode|claude    执行 CLI（默认 opencode）
//   --model <id>             模型（opencode 默认 opencode/glm-5.3-flash-free；claude 默认账号默认模型）
//   --evals all|1,2,3        场景（默认 all）
//   --arms both|with_skill|without_skill
//   --runs <n>               每组运行次数（默认 1）
//   --no-judge               跳过自动评分
//   --delay <秒>             两次调用间隔（默认 2，规避免费档位限速）
// 产物目录：web-controls-workspace/<iteration>/<eval-name>/<arm>/run-K/outputs/
// 评分文件：<run 目录>/grading.json
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync, readFileSync, existsSync, unlinkSync, rmSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const WORKSPACE = join(ROOT, "web-controls-workspace");

// ---------- 参数 ----------
const args = process.argv.slice(2);
function opt(name, def) {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : def;
}
const flag = (name) => args.includes(`--${name}`);
const cliName = opt("cli", "opencode");
const iteration = opt("iteration", "iteration-3");
const evalsArg = opt("evals", "all");
const armsArg = opt("arms", "both");
const runs = parseInt(opt("runs", "1"), 10);
const doJudge = !flag("no-judge");
const delayMs = parseFloat(opt("delay", "2")) * 1000;
const modelArg = opt("model", "");

// opencode CLI 与桌面应用共享数据目录会因 schema 冲突报错，评测用独立目录
const OC_DATA = "C:/Users/15375/AppData/Local/Temp/opencode-cli-data";
const OC_CONFIG = "C:/Users/15375/AppData/Local/Temp/opencode-cli-config";
const OC_MODEL = "opencode/glm-5.3-flash-free";

function spawnOptions(cwd) {
  const o = { cwd, encoding: "utf8", maxBuffer: 64 * 1024 * 1024, timeout: 25 * 60 * 1000 };
  if (cliName === "opencode") {
    o.env = {
      ...process.env,
      XDG_DATA_HOME: OC_DATA,
      XDG_CONFIG_HOME: OC_CONFIG,
    };
  }
  return o;
}

function cliCommand(prompt) {
  if (cliName === "claude") {
    const a = ["-p", prompt, "--dangerously-skip-permissions"];
    if (modelArg) a.push("--model", modelArg);
    return { cmd: CLAUDE, args: a };
  }
  const a = ["run", "-m", modelArg || OC_MODEL, prompt];
  return { cmd: OPENCODE, args: a };
}

// ---------- 解析 CLI 可执行文件 ----------
// Node spawn 不带 shell 无法执行 npm 的 shim（cmd/ps1），需定位真实 .exe
function resolveExe(name, packageRelative) {
  const probe = spawnSync("where.exe", [name], { encoding: "utf8" });
  if (probe.status !== 0) throw new Error(`找不到 ${name} CLI`);
  const lines = probe.stdout.split(/\r?\n/).filter(Boolean);
  for (const line of lines) {
    if (line.toLowerCase().endsWith(".exe") && existsSync(line)) return line; // claude.exe 等真实二进制
  }
  // shim：从 shim 所在目录探测包内二进制（如 D:\nodejs\node_global → node_modules\opencode-ai\bin\opencode.exe）
  const shimDir = dirname(lines[0]);
  const candidate = join(shimDir, packageRelative);
  if (existsSync(candidate)) return candidate;
  throw new Error(`找不到 ${name} 的真实可执行文件（尝试过 ${candidate}）`);
}
const CLAUDE = resolveExe("claude", "");
const OPENCODE = resolveExe("opencode", join("node_modules", "opencode-ai", "bin", "opencode.exe"));

// ---------- 读取评测定义 ----------
const { evals } = JSON.parse(readFileSync(join(WORKSPACE, "evals.json"), "utf8"));
const SKILL_DIR = join(ROOT, "skills", "better-web-controls");

function selected() {
  if (evalsArg === "all") return evals;
  const ids = new Set(evalsArg.split(",").map((s) => parseInt(s.trim(), 10)));
  return evals.filter((e) => ids.has(e.id));
}
const arms = armsArg === "both" ? ["with_skill", "without_skill"] : [armsArg];

// ---------- 提示词组装 ----------
function genPrompt(ev, arm) {
  const common = [
    `用户需求原文："${ev.prompt}"`,
    ``,
    `产出两个文件，写入当前目录：`,
    `1. page.html —— 完整单文件 HTML（内嵌 CSS/JS，中文界面，可直接双击打开）`,
    `2. notes.md —— ${arm === "with_skill" ? "按工作流写选型笔记（候选对比、判断依据、最终选型理由）" : "简短的实现说明"}`,
    `不要创建其他文件，不要修改目录外的任何内容。`,
  ].join("\n");
  if (arm === "with_skill") {
    return [
      `你是评测执行 agent。先阅读 ${SKILL_DIR}\\SKILL.md，并按其工作流查阅 ${SKILL_DIR}\\references\\ 下的参考文件，再执行需求。`,
      ``,
      common,
    ].join("\n");
  }
  return [
    `你是评测执行 agent。直接凭你自身的前端知识完成以下需求。`,
    `重要：不要读取、参考或使用任何技能、词典或方法论文档（包括 skills 目录、SKILL.md、references 文件）。只凭你自己的知识。`,
    ``,
    common,
  ].join("\n");
}

function judgePrompt(ev) {
  const assertions = ev.assertions.map((a, i) => `${i + 1}. ${a}`).join("\n");
  return [
    `你是评分 agent。当前目录的 outputs/page.html 与 outputs/notes.md 是待评产物，请阅读它们（HTML 可能很长，务必读完整），对照以下断言逐条判定。`,
    ``,
    `断言：`,
    assertions,
    ``,
    `判定标准：`,
    `- 每条断言独立判定，evidence 引用产物中的具体内容作为证据（注明文件），不得凭空推断`,
    ``,
    `完成后只输出一个 JSON 对象，不要输出任何其他文字或代码块标记，格式：`,
    `{"expectations":[{"text":"断言原文","passed":true,"evidence":"证据"}],"summary":{"passed":0,"failed":0,"total":0,"pass_rate":0.0}}`,
  ].join("\n");
}

// ---------- 调用 ----------
function runAgent(prompt, cwd) {
  const { cmd, args: a } = cliCommand(prompt);
  const res = spawnSync(cmd, a, spawnOptions(cwd));
  return res;
}

function extractJson(text) {
  // 去除 ANSI 转义与可能的代码块标记，取第一个完整 JSON 对象
  const clean = text.replace(/\x1b\[[0-9;]*m/g, "");
  const start = clean.indexOf("{");
  if (start < 0) throw new Error("输出中没有 JSON");
  let depth = 0;
  for (let i = start; i < clean.length; i++) {
    if (clean[i] === "{") depth++;
    else if (clean[i] === "}") {
      depth--;
      if (depth === 0) return JSON.parse(clean.slice(start, i + 1));
    }
  }
  throw new Error("JSON 未闭合");
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 产物与评分中统一清理角引号（生成 agent 自由输出不受控），与既有迭代处理方式一致
function sanitizeText(t) {
  return t
    .replace(/\u300C/g, "\u201C")
    .replace(/\u300D/g, "\u201D")
    .replace(/\u300E/g, "\u2018")
    .replace(/\u300F/g, "\u2019");
}
function sanitizeOutputs(outDir) {
  for (const f of ["page.html", "notes.md"]) {
    const p = join(outDir, f);
    if (existsSync(p)) writeFileSync(p, sanitizeText(readFileSync(p, "utf8")));
  }
}

// ---------- 主流程 ----------
const targets = [];
for (const ev of selected()) {
  for (const arm of arms) {
    for (let r = 1; r <= runs; r++) targets.push({ ev, arm, run: r });
  }
}
console.log(`CLI=${cliName} 模型=${modelArg || (cliName === "opencode" ? OC_MODEL : "账号默认")}`);
console.log(`计划 ${targets.length} 次生成${doJudge ? " + 评分" : "（跳过评分）"}\n`);

let okCount = 0;
const failures = [];
for (const { ev, arm, run } of targets) {
  const runDir = join(WORKSPACE, iteration, ev.name, arm, `run-${run}`);
  const outDir = join(runDir, "outputs");
  mkdirSync(outDir, { recursive: true });

  // opencode 需要在运行目录放权限配置，用完即删
  const permFile = join(outDir, "opencode.json");
  if (cliName === "opencode") writeFileSync(permFile, '{"permission":"allow"}');

  console.log(`[${ev.name} / ${arm} / run-${run}] 生成中…`);
  const t0 = Date.now();
  const gen = runAgent(genPrompt(ev, arm), outDir);
  if (gen.status !== 0) {
    console.error(`  生成失败（exit ${gen.status}）: ${(gen.stderr || gen.stdout || "").slice(-500)}`);
    failures.push(`${ev.name}/${arm}/run-${run} 生成失败`);
    if (existsSync(permFile)) unlinkSync(permFile);
    continue;
  }
  const missing = ["page.html", "notes.md"].filter((f) => !existsSync(join(outDir, f)));
  if (existsSync(permFile)) unlinkSync(permFile);
  if (missing.length) {
    console.error(`  产物缺失: ${missing.join(", ")}`);
    failures.push(`${ev.name}/${arm}/run-${run} 缺 ${missing.join(",")}`);
    continue;
  }
  sanitizeOutputs(outDir);
  console.log(`  生成完成，用时 ${Math.round((Date.now() - t0) / 1000)}s`);
  await sleep(delayMs);

  if (doJudge) {
    const jt0 = Date.now();
    const permFile2 = join(runDir, "opencode.json");
    if (cliName === "opencode") writeFileSync(permFile2, '{"permission":"allow"}');
    let grading = null;
    for (let attempt = 1; attempt <= 2; attempt++) {
      const judge = runAgent(judgePrompt(ev), runDir);
      if (judge.status !== 0) {
        console.error(`  评分失败（exit ${judge.status}）${attempt === 1 ? "，重试" : ""}`);
        continue;
      }
      try {
        grading = cliName === "claude" ? JSON.parse(judge.stdout) : extractJson(judge.stdout);
        break;
      } catch (e) {
        console.error(`  评分输出解析失败（第 ${attempt} 次）: ${e.message}${attempt === 1 ? "，重试" : ""}`);
      }
    }
    if (existsSync(permFile2)) unlinkSync(permFile2);
    if (!grading) {
      failures.push(`${ev.name}/${arm}/run-${run} 评分失败`);
      continue;
    }
    grading.run = arm;
    grading.eval_id = ev.id;
    writeFileSync(join(runDir, "grading.json"), sanitizeText(JSON.stringify(grading, null, 2)) + "\n");
    console.log(`  评分 ${grading.summary.passed}/${grading.summary.total}，用时 ${Math.round((Date.now() - jt0) / 1000)}s`);
    await sleep(delayMs);
  }
  okCount++;
}

console.log(`\n完成 ${okCount}/${targets.length}`);
if (failures.length) {
  console.error("失败项：");
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
