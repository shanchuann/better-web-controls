// CI 检查：JSON 合法性、全仓禁词、README 图片引用
// 任一项失败即以非零码退出
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, relative, sep } from "node:path";

const root = process.cwd();
const skipDirs = new Set([".git", ".opencode", ".agents", "node_modules"]);
const textExts = new Set([".md", ".json", ".html"]);
// 全仓禁止：角引号（JSON 内会破坏结构或违反规范）、内容来源字样
const forbidden = /[\u300C\u300D\u300E\u300F]|Sue|抖音|控件合集/;

const errors = [];
const allFiles = [];

function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (skipDirs.has(name)) continue;
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) walk(p);
    else allFiles.push(p);
  }
}
walk(root);

// 1. 全部 JSON 可解析
for (const f of allFiles.filter((f) => f.endsWith(".json"))) {
  try {
    JSON.parse(readFileSync(f, "utf8"));
  } catch (e) {
    errors.push(`JSON 解析失败: ${relative(root, f)} — ${e.message}`);
  }
}

// 2. 禁词扫描（md / json / html）
for (const f of allFiles.filter((f) => textExts.has(f.slice(f.lastIndexOf("."))))) {
  const t = readFileSync(f, "utf8");
  const m = t.match(forbidden);
  if (m) {
    errors.push(`禁词 "${m[0]}": ${relative(root, f)}`);
  }
}

// 3. README 引用的本仓库图片必须存在
const readme = readFileSync(join(root, "README.md"), "utf8");
const imgRefs = [...readme.matchAll(/!\[[^\]]*\]\(([^)\s]+)[^)]*\)/g)].map((m) => m[1]);
for (const ref of imgRefs) {
  if (!/^[a-z_\-./]+\.(png|jpe?g|gif|webp|svg)$/i.test(ref)) continue; // 外链跳过
  if (!existsSync(join(root, ref))) {
    errors.push(`README 图片缺失: ${ref}`);
  }
}

if (errors.length) {
  console.error(`ci-check 失败，共 ${errors.length} 项：`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(
  `ci-check 通过：${allFiles.filter((f) => f.endsWith(".json")).length} 个 JSON 合法，` +
    `禁词 0 处，README 图片引用 ${imgRefs.length} 处全部存在`
);
