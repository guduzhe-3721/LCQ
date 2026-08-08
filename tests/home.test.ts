import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = resolve(import.meta.dirname, "..");

describe("the built home page", () => {
  it("has the site title and exactly one named heading", () => {
    execSync("npm run build", {
      cwd: projectRoot,
      stdio: "pipe",
    });

    const document = readFileSync(
      resolve(projectRoot, "dist", "index.html"),
      "utf8",
    );

    expect(document).toContain("<title>个人资料库</title>");
    expect(document.match(/<h1[^>]*>个人资料库<\/h1>/g)).toHaveLength(1);
  });
});
