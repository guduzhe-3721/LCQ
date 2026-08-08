import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = resolve(import.meta.dirname, "..");

describe("the built home page", () => {
  it("omits the site brand and introductory hero", () => {
    execSync("npm run build", {
      cwd: projectRoot,
      stdio: "pipe",
    });

    const document = readFileSync(
      resolve(projectRoot, "dist", "index.html"),
      "utf8",
    );

    expect(document).toContain("<title>个人资料库</title>");
    expect(document).not.toContain('class="brand"');
    expect(document).not.toContain('class="hero"');
    expect(document).not.toContain("用 Markdown 驱动的个人发布");
  });

  it("centers the navigation and uses black text styles", () => {
    const stylesheet = readFileSync(
      resolve(projectRoot, "src", "styles", "global.css"),
      "utf8",
    );

    expect(stylesheet).toMatch(
      /\.header-content\s*\{[^}]*justify-content:\s*center;/s,
    );
    expect(stylesheet).toMatch(/:root\s*\{[^}]*color:\s*#000;/s);
    expect(stylesheet).toMatch(/a\s*\{[^}]*color:\s*#000;/s);
    expect(stylesheet).toMatch(/h1,[\s\S]*?\{[^}]*color:\s*#000;/);
  });
});
