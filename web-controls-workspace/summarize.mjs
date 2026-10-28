// 汇总某次迭代的全部 grading.json 为 benchmark.json 与 benchmark.md
// 用法：node summarize.mjs --iteration iteration-3 [--title "Claude 跨模型全量"]
import { readdirSync, readFileSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const args = process.argv.slice(2);
function opt(name, def) {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : def;
}
const iteration = opt("iteration", "iteration-3");
const title = opt("title", "");

const WORKSPACE = join(process.cwd(), "web-controls-workspace");
const iterDir = join(WORKSPACE, iteration);
const { evals } = JSON.parse(readFileSync(join(WORKSPACE, "evals.json"), "utf8"));

const rows = [];
for (const ev of evals) {
  const dir = join(iterDir, ev.name);
  if (!existsSync(dir)) continue;
  const row = { id: ev.id, name: ev.name };
  for (const arm of ["with_skill", "without_skill"]) {
    const runDirs = existsSync(join(dir, arm))
      ? readdirSync(join(dir, arm)).filter((d) => d.startsWith("run-")).sort()
      : [];
    const scores = [];
    for (const rd of runDirs) {
      const g = join(dir, arm, rd, "grading.json");
      if (!existsSync(g)) continue;
      const j = JSON.parse(readFileSync(g, "utf8"));
      scores.push(j.summary);
    }
    if (scores.length) {
      const passed = scores.reduce((s, x) => s + x.passed, 0);
      const total = scores.reduce((s, x) => s + x.total, 0);
      const rates = scores.map((s) => s.pass_rate);
      const mean = rates.reduce((a, b) => a + b, 0) / rates.length;
      const variance = rates.reduce((a, b) => a + (b - mean) ** 2, 0) / rates.length;
      row[arm] = {
        runs: scores.length,
        passed,
        total,
        pass_rate: total ? passed / total : 0,
        mean_pm: `${(mean * 100).toFixed(0)}% ± ${(Math.sqrt(variance) * 100).toFixed(0)}%`,
      };
    }
  }
  if (row.with_skill || row.without_skill) rows.push(row);
}

const sum = (arm) =>
  rows.reduce(
    (acc, r) => {
      if (r[arm]) {
        acc.passed += r[arm].passed;
        acc.total += r[arm].total;
      }
      return acc;
    },
    { passed: 0, total: 0 }
  );
const w = sum("with_skill");
const o = sum("without_skill");

const out = {
  iteration,
  title: title || iteration,
  date: new Date().toISOString().slice(0, 10),
  summary: {
    with_skill: w.total ? { ...w, pass_rate: w.passed / w.total } : null,
    without_skill: o.total ? { ...o, pass_rate: o.passed / o.total } : null,
    delta_pp: w.total && o.total ? Number((((w.passed / w.total) - (o.passed / o.total)) * 100).toFixed(1)) : null,
  },
  per_eval: rows,
};
writeFileSync(join(iterDir, "benchmark.json"), JSON.stringify(out, null, 2) + "\n");

const md = [
  `# Skill Benchmark${title ? `: ${title}` : ""}`,
  ``,
  `**Iteration**: ${iteration}　**Date**: ${out.date}　**Runner**: web-controls-workspace/run-eval.mjs（headless claude CLI，自动评分）`,
  ``,
  `## Summary`,
  ``,
  `| 指标 | 带技能 | 不带技能 | 差值 |`,
  `|---|---|---|---|`,
  `| 断言通过 | ${w.passed}/${w.total}（${((w.passed / w.total) * 100).toFixed(1)}%） | ${o.passed}/${o.total}（${((o.passed / o.total) * 100).toFixed(1)}%） | +${out.summary.delta_pp}pp |`,
  ``,
  `## 分场景得分`,
  ``,
  `| # | 场景 | 带技能 | 不带技能 |`,
  `|---|---|---|---|`,
  ...rows.map(
    (r) =>
      `| ${r.id} | ${r.name} | ${r.with_skill ? `${r.with_skill.passed}/${r.with_skill.total}（${r.with_skill.mean_pm}）` : "—"} | ${
        r.without_skill ? `${r.without_skill.passed}/${r.without_skill.total}（${r.without_skill.mean_pm}）` : "—"
      } |`
  ),
  ``,
].join("\n");
writeFileSync(join(iterDir, "benchmark.md"), md);
console.log(`已生成 ${join(iterDir, "benchmark.json")} 与 benchmark.md`);
console.log(`带技能 ${w.passed}/${w.total}，不带技能 ${o.passed}/${o.total}，差值 +${out.summary.delta_pp}pp`);
