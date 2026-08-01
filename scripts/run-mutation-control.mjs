import { mkdirSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";

const vitest = resolve("node_modules/vitest/vitest.mjs");
const target = "tests/adoption-engine.test.ts";
const logPath = resolve("evidence/qa/mutation-control.txt");
const chunks = [];
const repositoryRoot = process.cwd();

function sanitize(output) {
  return output
    .replaceAll(repositoryRoot, "<repo>")
    .replaceAll(repositoryRoot.replaceAll("\\", "/"), "<repo>")
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "")
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .join("\n")
    .trimEnd();
}

function run(label, mutate) {
  const result = spawnSync(process.execPath, [vitest, "run", target], {
    encoding: "utf8",
    env: { ...process.env, DISABLE_CRITICAL_VALIDATOR: mutate ? "1" : "0" },
  });
  chunks.push(
    sanitize(
      `=== ${label} ===\nexit=${result.status}\n${result.stdout}\n${result.stderr}`,
    ),
  );
  return result;
}

const mutated = run("MUTATED_DETECTOR_DISABLED_EXPECT_FAIL", true);
if (
  mutated.status === 0 ||
  !`${mutated.stdout}${mutated.stderr}`.includes(
    "holds stale critical evidence as UNKNOWN",
  )
) {
  throw new Error(
    "Mutation control did not fail for the critical stale-evidence assertion",
  );
}

for (const label of [
  "RESTORED_RUN_1_EXPECT_PASS",
  "RESTORED_RUN_2_EXPECT_PASS",
]) {
  const restored = run(label, false);
  if (restored.status !== 0) throw new Error(`${label} failed`);
}

mkdirSync(dirname(logPath), { recursive: true });
writeFileSync(logPath, `${chunks.join("\n\n").trimEnd()}\n`, "utf8");
console.log(
  "Mutation control PASS: disabled detector failed; restored detector passed twice.",
);
console.log(`Evidence: ${logPath}`);
