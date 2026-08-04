import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const vitest = resolve("node_modules/vitest/vitest.mjs");
const targetTest = "tests/adoption-engine.test.ts";
const sourcePath = resolve("lib/domain/adoption-engine.ts");
const logPath = resolve("evidence/qa/mutation-control.txt");
const repositoryRoot = process.cwd();
const originalSource = readFileSync(sourcePath, "utf8");
const chunks = [];

const mutants = [
  {
    id: "RECORD_INTEGRITY",
    expectedTest: "rejects an invalid or future source timestamp",
  },
  {
    id: "CHRONOLOGY",
    expectedTest:
      "rejects evidence chronology when validation predates a source event",
  },
  {
    id: "FOUNDATION_CHAIN",
    expectedTest:
      "invalidates adoption when the clinic first-value source is removed",
  },
  {
    id: "BLOCKER_ACTION",
    expectedTest:
      "invalidates adoption when blocker or action sources are removed",
  },
  {
    id: "CURRENT_RELEASE",
    expectedTest:
      "invalidates validation when the current product version changes",
  },
  {
    id: "CURRENT_USAGE",
    expectedTest: "holds stale critical evidence as UNKNOWN",
  },
  {
    id: "REPEAT_USE",
    expectedTest:
      "rejects repeat-use periods that exceed distinct evidenced periods",
  },
  {
    id: "CUSTOMER_VALIDATION",
    expectedTest:
      "invalidates validation when the current product version changes",
  },
];

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

function run(label) {
  const result = spawnSync(process.execPath, [vitest, "run", targetTest], {
    encoding: "utf8",
    env: process.env,
  });
  chunks.push(
    sanitize(
      `=== ${label} ===\nexit=${result.status}\n${result.stdout}\n${result.stderr}`,
    ),
  );
  return result;
}

if (originalSource.includes("DISABLE_CRITICAL_VALIDATOR")) {
  throw new Error(
    "Runtime validator bypass must not exist in production source",
  );
}

try {
  for (const mutant of mutants) {
    const detectorPattern = new RegExp(
      `\\.\\.\\.detect[A-Za-z]+\\(input\\), // MUTATION_POINT:${mutant.id}`,
    );
    const mutatedSource = originalSource.replace(
      detectorPattern,
      `...[], // MUTATION_POINT:${mutant.id}`,
    );
    if (mutatedSource === originalSource) {
      throw new Error(`Mutation point ${mutant.id} was not found`);
    }
    writeFileSync(sourcePath, mutatedSource, "utf8");
    const result = run(`MUTANT_${mutant.id}_EXPECT_FAIL`);
    const output = `${result.stdout}${result.stderr}`;
    if (result.status === 0 || !output.includes(mutant.expectedTest)) {
      throw new Error(
        `Mutation ${mutant.id} did not fail its bound negative assertion`,
      );
    }
    writeFileSync(sourcePath, originalSource, "utf8");
  }

  for (const label of [
    "RESTORED_RUN_1_EXPECT_PASS",
    "RESTORED_RUN_2_EXPECT_PASS",
  ]) {
    writeFileSync(sourcePath, originalSource, "utf8");
    const restored = run(label);
    if (restored.status !== 0) throw new Error(`${label} failed`);
  }
} finally {
  writeFileSync(sourcePath, originalSource, "utf8");
}

if (process.env.CI !== "true") {
  mkdirSync(dirname(logPath), { recursive: true });
  writeFileSync(logPath, `${chunks.join("\n\n").trimEnd()}\n`, "utf8");
}
console.log(
  `Mutation control PASS: ${mutants.length} detectors failed when disabled; restored source passed twice.`,
);
console.log(
  process.env.CI === "true"
    ? "Evidence log: console only in CI to preserve a clean checkout."
    : `Evidence: ${logPath}`,
);
