import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { articleSchema, resourceSchema } from "../src/content.config";

const validHash = "a".repeat(64);
const projectRoot = resolve(import.meta.dirname, "..");

const resource = {
  title: "Astro Starter Template",
  description: "A static starter for personal content libraries.",
  category: "Templates",
  tags: ["astro", "static-site"],
  version: "1.0.0",
  fileName: "astro-starter.zip",
  size: "14 KB",
  releaseUrl: "https://example.com/releases/astro-starter.zip",
  sourceUrl: "https://github.com/example/astro-starter",
  license: "MIT",
  sha256: validHash,
  publishedAt: new Date("2026-08-08"),
};

describe("content collection schemas", () => {
  it("parses a complete resource", () => {
    expect(resourceSchema.parse(resource)).toMatchObject({
      ...resource,
      draft: false,
    });
  });

  it("rejects a 63-character SHA-256 hash", () => {
    expect(() =>
      resourceSchema.parse({ ...resource, sha256: "a".repeat(63) }),
    ).toThrow();
  });

  it("rejects an HTTP release URL", () => {
    expect(() =>
      resourceSchema.parse({
        ...resource,
        releaseUrl: "http://example.com/release.zip",
      }),
    ).toThrow();
  });

  it("defaults omitted article draft status to false", () => {
    expect(
      articleSchema.parse({
        title: "A Markdown-first site",
        description: "Why content belongs in files.",
        publishedAt: new Date("2026-08-08"),
        tags: ["markdown"],
      }).draft,
    ).toBe(false);
  });
});

describe("Markdown content collections", () => {
  it("renders only published articles and resources", () => {
    execSync("npm run build", { cwd: projectRoot, stdio: "pipe" });

    const document = readFileSync(
      resolve(projectRoot, "dist", "index.html"),
      "utf8",
    );

    expect(document).toContain("以 Markdown 为先的个人资料库");
    expect(document).toContain("Astro 资料库起步模板");
    expect(document).not.toContain("草稿：从容的发布流程");
    expect(document).not.toContain("草稿：阅读清单");
  });
});
