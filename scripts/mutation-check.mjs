// Mutation gate: deliberately break changed source code and confirm the tests notice.
// Dependency-free. Usage: node scripts/mutation-check.mjs <base-sha> <head-sha>
// Env (defaults suit node:test; Trulieve vitest repos: TEST_CMD="npx vitest run"):
//   TEST_CMD        command that exits non-zero when any test fails
//   SRC_PATTERN     regex for source files to mutate          (default ^src/.*\.(m?js|ts|tsx)$)
//   MIN_SCORE       minimum killed/total, 0-1                   (default 0.8)
//   MAX_MUTANTS     cap per run to bound CI time                (default 60)
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const [base, head] = process.argv.slice(2);
const TEST_CMD = process.env.TEST_CMD || "node --test 'tests/**/*.test.js'";
const SRC = new RegExp(process.env.SRC_PATTERN || "^src/.*\\.(m?js|ts|tsx)$");
const MIN = Number(process.env.MIN_SCORE || 0.8);
const MAX = Number(process.env.MAX_MUTANTS || 60);

// [name, regex, replacement]; each match becomes one mutant.
const OPERATORS = [
  ["< to <=", /(?<![<=!])<(?![<=])/g, "<="],
  ["> to >=", /(?<![>=-])>(?![>=])/g, ">="],
  ["<= to <", /<=/g, "<"],
  [">= to >", />=/g, ">"],
  ["=== to !==", /===/g, "!=="],
  ["!== to ===", /!==/g, "==="],
  ["&& to ||", /&&/g, "||"],
  ["|| to &&", /\|\|/g, "&&"],
  ["+ to -", /(?<=\s)\+(?=\s)/g, "-"],
  ["- to +", /(?<=\s)-(?=\s)/g, "+"],
  ["* to /", /(?<=\s)\*(?=\s)/g, "/"],
  ["number +1", /(?<![\w.$])(\d+(\.\d+)?)(?![\w.])/g, (m) => String(Number(m) + 1)],
  ["true to false", /\btrue\b/g, "false"],
  ["false to true", /\bfalse\b/g, "true"],
  ["drop throw", /\bthrow\s+new\s+\w+\([^;]*\);?/g, ";"],
  ["negate if", /\bif\s*\(/g, "if (!"],
  ["empty string literal", /`[^`$]+`|"[^"\n]+"|'[^'\n]+'/g, '""'],
];

const git = (...a) => execFileSync("git", a, { encoding: "utf8" });
const changed = git("diff", "--name-only", "--diff-filter=AM", `${base}...${head}`)
  .split("\n").filter((f) => SRC.test(f));
if (!changed.length) { console.log("mutation: no changed source files; skipping"); process.exit(0); }

const testsPass = () => spawnSync("sh", ["-c", TEST_CMD], { stdio: "ignore", timeout: 120000 }).status === 0;
if (!testsPass()) { console.error("mutation: baseline tests fail; fix tests first"); process.exit(1); }

const strip = (line) => line.replace(/\/\/.*$/, "");
const mutants = [];
for (const file of changed) {
  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((line, i) => {
    const code = strip(line);
    if (/^\s*(import|export\s+\{|\*|\/\*)/.test(code)) return;
    for (const [name, re, rep] of OPERATORS) {
      for (const m of code.matchAll(re)) {
        const r = typeof rep === "function" ? rep(m[0]) : rep;
        const mutated = line.slice(0, m.index) + r + line.slice(m.index + m[0].length);
        if (mutated !== line) mutants.push({ file, line: i + 1, name, mutated, i });
      }
    }
  });
}
const sample = mutants.length > MAX ? mutants.filter((_, k) => k % Math.ceil(mutants.length / MAX) === 0) : mutants;

let killed = 0; const survivors = [];
for (const m of sample) {
  const original = readFileSync(m.file, "utf8");
  const lines = original.split("\n"); lines[m.i] = m.mutated;
  writeFileSync(m.file, lines.join("\n"));
  try { testsPass() ? survivors.push(m) : killed++; } finally { writeFileSync(m.file, original); }
}

const score = sample.length ? killed / sample.length : 1;
console.log(`mutation score ${(score * 100).toFixed(0)}% (${killed}/${sample.length} killed, min ${MIN * 100}%) on ${changed.join(", ")}`);
for (const s of survivors) console.log(`  SURVIVED ${s.file}:${s.line} [${s.name}]  ${s.mutated.trim()}`);
if (score < MIN) {
  console.error("MUTATION GATE FAILED: tests do not detect these deliberate bugs. Strengthen assertions, do not weaken code.");
  process.exit(1);
}
