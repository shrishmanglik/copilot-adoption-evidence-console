import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const roots = ["app", "components", "lib", "docs", "README.md"];
function files(path: string): string[] {
  if (statSync(path).isFile()) return [path];
  return readdirSync(path).flatMap((entry) => files(join(path, entry)));
}
const publicText = roots
  .flatMap(files)
  .filter((path) => /\.(md|ts|tsx|json)$/.test(path))
  .map((path) => readFileSync(path, "utf8"))
  .join("\n");

describe("public evidence boundaries", () => {
  it("contains no employer brand or private authority path", () => {
    expect(publicText).not.toMatch(new RegExp(`\\bV${"ena"}\\b`, "i"));
    expect(publicText).not.toMatch(
      new RegExp(
        `C${":"}\\\\A${"GI"}|C${":"}\\\\M${"DS"}|Job Applica${"tions"}`,
        "i",
      ),
    );
  });

  it("labels synthetic and commercial truth boundaries", () => {
    expect(publicText).toContain("Synthetic");
    expect(publicText).toMatch(/commercial hypothesis/i);
    expect(publicText).toMatch(/no customers/i);
  });
});
