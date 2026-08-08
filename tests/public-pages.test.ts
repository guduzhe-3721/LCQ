import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = resolve(import.meta.dirname, "..");
const dist = (...segments: string[]) =>
  resolve(projectRoot, "dist", ...segments);

function builtPage(...segments: string[]) {
  return readFileSync(dist(...segments, "index.html"), "utf8");
}

describe("public static pages", () => {
  it("renders published collection entries without drafts across discovery pages", () => {
    execSync("npm run build", { cwd: projectRoot, stdio: "pipe" });

    const home = builtPage();
    const articles = builtPage("articles");
    const resources = builtPage("resources");
    const tag = builtPage("tags", "astro");

    for (const document of [home, tag]) {
      expect(document).toContain("A Markdown-first personal library");
      expect(document).toContain("Astro library starter");
      expect(document).not.toContain("Draft: A calm publishing workflow");
      expect(document).not.toContain("Draft: Reading checklist");
    }

    expect(articles).toContain("A Markdown-first personal library");
    expect(articles).not.toContain("Draft: A calm publishing workflow");
    expect(resources).toContain("Astro library starter");
    expect(resources).not.toContain("Draft: Reading checklist");
  });

  it("renders article Markdown and a table of contents", () => {
    execSync("npm run build", { cwd: projectRoot, stdio: "pipe" });

    const article = builtPage("articles", "markdown-first-library");

    expect(article).toContain("Markdown keeps writing portable");
    expect(article).toContain('aria-label="Table of contents"');
    expect(article).toContain("August 8, 2026");
  });

  it("renders resource metadata with its direct external GitHub Release download", () => {
    execSync("npm run build", { cwd: projectRoot, stdio: "pipe" });

    const resource = builtPage("resources", "astro-library-starter");

    expect(resource).toContain("1.0.0");
    expect(resource).toContain("12 KB");
    expect(resource).toContain("MIT");
    expect(resource).toContain(
      "3b7fcf9f1c1a4db8c7bcae723959ff2b4a1639104023e1d521371820a93e4f6b",
    );
    expect(resource).toContain("github.com/example/astro-library-starter");
    expect(resource).toContain(
      "github.com/example/astro-library-starter/releases/download/v1.0.0/astro-library-starter.zip",
    );
    expect(resource).toContain("Download from GitHub Release");
  });

  it("does not generate static pages for draft content", () => {
    execSync("npm run build", { cwd: projectRoot, stdio: "pipe" });

    expect(
      existsSync(dist("articles", "draft-content-workflow", "index.html")),
    ).toBe(false);
    expect(
      existsSync(dist("resources", "draft-reading-checklist", "index.html")),
    ).toBe(false);
  });
});
