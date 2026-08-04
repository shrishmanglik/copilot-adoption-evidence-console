import { readFileSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";

const detectors = [
  {
    name: "openai-style-key",
    pattern: new RegExp(`s${"k"}-[A-Za-z0-9_-]{20,}`, "g"),
  },
  { name: "github-pat", pattern: new RegExp(`g${"hp"}_[A-Za-z0-9]{30,}`, "g") },
  { name: "aws-access-key", pattern: new RegExp(`A${"KIA"}[A-Z0-9]{16}`, "g") },
  { name: "private-key", pattern: new RegExp(`BEGIN ${"PRIVATE KEY"}`, "g") },
];

const controls = [
  `s${"k"}-${"a".repeat(24)}`,
  `g${"hp"}_${"b".repeat(36)}`,
  `A${"KIA"}${"C".repeat(16)}`,
  `-----BEGIN ${"PRIVATE KEY"}-----`,
];

for (const [index, detector] of detectors.entries()) {
  detector.pattern.lastIndex = 0;
  if (!detector.pattern.test(controls[index]))
    throw new Error(`Detector control failed: ${detector.name}`);
}

const listed = spawnSync("git", ["ls-files", "-co", "--exclude-standard"], {
  encoding: "utf8",
});
if (listed.status !== 0)
  throw new Error("Unable to enumerate repository files");
const files = listed.stdout.split(/\r?\n/).filter(Boolean);
const findings = [];

for (const file of files) {
  const stats = statSync(file);
  if (
    stats.size > 1_000_000 ||
    /\.(png|jpg|jpeg|gif|zip|ico|woff2?)$/i.test(file)
  )
    continue;
  const content = readFileSync(file, "utf8");
  for (const detector of detectors) {
    detector.pattern.lastIndex = 0;
    if (detector.pattern.test(content))
      findings.push({ file, detector: detector.name });
  }
}

if (findings.length > 0) {
  for (const finding of findings)
    console.error(`${finding.file}: ${finding.detector}`);
  process.exit(1);
}

console.log(
  `Secret scan PASS: ${detectors.length} detectors proved on controls; ${files.length} repository files scanned; 0 findings.`,
);
