import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const attributes = readFileSync(".gitattributes", "utf8");
const readme = readFileSync("README.md", "utf8");

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

  it("pins the public quickstart to the implemented review branch", () => {
    expect(readme).toContain(
      "git clone --branch dev/copilot-adoption-evidence-console-initial-build --single-branch https://github.com/shrishmanglik/copilot-adoption-evidence-console.git",
    );
    expect(readme).toContain("the default branch is not yet the setup target");
  });
});
