// Test-integrity gate: fails the PR if tests were weakened rather than code fixed.
// Usage: node scripts/test-integrity.mjs <base-sha> <head-sha> <pr-author-login>
import { execFileSync } from "node:child_process";

const [base, head, author = ""] = process.argv.slice(2);
const git = (...a) => execFileSync("git", a, { encoding: "utf8" });
const isBot = author.endsWith("[bot]");
const problems = [];

const changed = git("diff", "--name-status", `${base}...${head}`).trim().split("\n").filter(Boolean)
  .map((l) => { const [s, ...p] = l.split("\t"); return { status: s[0], path: p.at(-1), from: p[0] }; });
const isTest = (p) => /^tests\/.*\.test\.(m?js|ts)$/.test(p);

for (const f of changed) {
  if (f.path.startsWith("tests/acceptance/") || f.from.startsWith("tests/acceptance/")) {
    if (isBot) problems.push(`acceptance criteria changed by agent: ${f.path} (acceptance tests are human-owned)`);
  }
  if ((f.status === "D" || f.status === "R") && isTest(f.from)) problems.push(`test file removed/renamed: ${f.from}`);
}

const count = (src, re) => (src.match(re) || []).length;
for (const f of changed.filter((c) => isTest(c.path) && c.status === "M")) {
  const before = git("show", `${base}:${f.path}`);
  const after = git("show", `${head}:${f.path}`);
  const tb = count(before, /\btest\(|\bit\(/g), ta = count(after, /\btest\(|\bit\(/g);
  const ab = count(before, /\bassert\.|\bexpect\(/g), aa = count(after, /\bassert\.|\bexpect\(/g);
  if (ta < tb) problems.push(`${f.path}: test cases decreased ${tb} -> ${ta}`);
  if (aa < ab) problems.push(`${f.path}: assertions decreased ${ab} -> ${aa}`);
}
for (const f of changed.filter((c) => isTest(c.path) && c.status !== "D")) {
  const after = git("show", `${head}:${f.path}`);
  if (/\.(skip|only|todo)\(|\{\s*(skip|only|todo)\s*:/.test(after)) problems.push(`${f.path}: skip/only/todo present`);
}

const srcChanged = changed.some((c) => c.path.startsWith("src/") && c.status !== "D");
const testsTouched = changed.some((c) => isTest(c.path) && c.status !== "D");
if (srcChanged && !testsTouched) problems.push("source changed without any new or updated unit test");

if (problems.length) {
  console.error("TEST INTEGRITY FAILED:\n - " + problems.join("\n - "));
  process.exit(1);
}
console.log(`test integrity OK (${changed.length} files checked, author=${author || "unknown"})`);
