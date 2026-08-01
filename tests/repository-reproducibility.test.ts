import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const attributes = readFileSync(".gitattributes", "utf8");

describe("repository checkout reproducibility", () => {
  it("enforces LF for text files across Windows and Linux clones", () => {
    expect(attributes).toContain("* text=auto eol=lf");
    expect(
      execFileSync("git", ["check-attr", "eol", "--", "README.md"], {
        encoding: "utf8",
      }),
    ).toContain("README.md: eol: lf");
  });

  it("keeps screenshot assets binary", () => {
    expect(attributes).toContain("*.png binary");
    expect(
      execFileSync(
        "git",
        ["check-attr", "binary", "--", "public/adoption-dashboard.png"],
        { encoding: "utf8" },
      ),
    ).toContain("public/adoption-dashboard.png: binary: set");
  });
});
