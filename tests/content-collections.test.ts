import { execSync } from "node:child_process";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { articleSchema, resourceSchema } from "../src/content.config";

const validHash = "a".repeat(64);
const projectRoot = resolve(import.meta.dirname, "..");
const collectionCheckPage = resolve(
  projectRoot,
  "src/pages/content-collections-test.json.ts",
);
const collectionCheckOutput = resolve(
  projectRoot,
  "dist/content-collections-test.json",
);

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
  beforeAll(() => {
    writeFileSync(
      collectionCheckPage,
      `import { getCollection } from "astro:content";\n\nexport async function GET() {\n  const [articles, resources] = await Promise.all([\n    getCollection("articles"),\n    getCollection("resources"),\n  ]);\n\n  return new Response(JSON.stringify({ articles, resources }));\n}\n`,
    );
  });

  afterAll(() => {
    if (existsSync(collectionCheckPage)) rmSync(collectionCheckPage);
  });

  it("loads two articles and two resources with one draft in each collection", () => {
    execSync("npm run build", { cwd: projectRoot, stdio: "pipe" });

    const collections = JSON.parse(readFileSync(collectionCheckOutput, "utf8"));

    expect(collections.articles).toHaveLength(2);
    expect(collections.resources).toHaveLength(2);
    expect(
      collections.articles.filter(
        (entry: { data: { draft: boolean } }) => entry.data.draft,
      ),
    ).toHaveLength(1);
    expect(
      collections.resources.filter(
        (entry: { data: { draft: boolean } }) => entry.data.draft,
      ),
    ).toHaveLength(1);
  });
});
