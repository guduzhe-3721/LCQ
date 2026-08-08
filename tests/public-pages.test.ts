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
  it("renders the public navigation and footer in Simplified Chinese", () => {
    execSync("npm run build", { cwd: projectRoot, stdio: "pipe" });

    const home = builtPage();

    expect(home).toContain("文章");
    expect(home).toContain("资源");
    expect(home).toContain("搜索");
    expect(home).toContain("关于本站");
    expect(home).toContain("网站政策与下架申请");
  });

  it("renders published collection entries without drafts across discovery pages", () => {
    execSync("npm run build", { cwd: projectRoot, stdio: "pipe" });

    const home = builtPage();
    const articles = builtPage("articles");
    const resources = builtPage("resources");
    const tag = builtPage("tags", "astro");

    for (const document of [home, tag]) {
      expect(document).toContain("以 Markdown 为先的个人资料库");
      expect(document).toContain("Astro 资料库起步模板");
      expect(document).not.toContain("草稿：从容的发布流程");
      expect(document).not.toContain("草稿：阅读清单");
    }

    expect(articles).toContain("以 Markdown 为先的个人资料库");
    expect(articles).not.toContain("草稿：从容的发布流程");
    expect(resources).toContain("Astro 资料库起步模板");
    expect(resources).not.toContain("草稿：阅读清单");
  });

  it("renders article Markdown and a table of contents", () => {
    execSync("npm run build", { cwd: projectRoot, stdio: "pipe" });

    const article = builtPage("articles", "markdown-first-library");

    expect(article).toContain("Markdown 让写作保持便携");
    expect(article).toContain('aria-label="目录"');
    expect(article).toContain("2026年8月8日");
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
    expect(resource).toContain("从 GitHub Release 下载");
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
