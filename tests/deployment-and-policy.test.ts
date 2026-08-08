import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = resolve(import.meta.dirname, "..");

describe("GitHub Pages deployment", () => {
  it("deploys the built site only after checks on the default branch", () => {
    const workflow = readFileSync(
      resolve(projectRoot, ".github", "workflows", "deploy-pages.yml"),
      "utf8",
    );

    expect(workflow).toContain("workflow_run:");
    expect(workflow).toContain("workflows: [CI]");
    expect(workflow).toContain(
      "github.event.workflow_run.conclusion == 'success'",
    );
    expect(workflow).toContain(
      "github.event.workflow_run.head_branch == github.event.repository.default_branch",
    );
    expect(workflow).toContain(
      "PUBLIC_BASE_PATH=/${{ github.event.repository.name }}",
    );
    expect(workflow).toContain("actions/configure-pages@v5");
    expect(workflow).toContain("actions/upload-pages-artifact@v3");
    expect(workflow).toContain("path: ./dist");
    expect(workflow).toContain("actions/deploy-pages@v4");
    expect(workflow).toContain("pages: write");
    expect(workflow).toContain("id-token: write");
    expect(workflow).toContain("contents: read");
  });

  it("keeps pull requests check-only and documents free publishing", () => {
    const checks = readFileSync(
      resolve(projectRoot, ".github", "workflows", "ci.yml"),
      "utf8",
    );
    const readme = readFileSync(resolve(projectRoot, "README.md"), "utf8");

    expect(checks).toContain("pull_request:");
    expect(checks).not.toContain("deploy-pages");
    expect(readme).toContain("npm run dev");
    expect(readme).toContain("SHA-256");
    expect(readme).toContain("GitHub Actions");
    expect(readme).toContain("2 GiB");
    expect(readme).toContain("mainland China");
  });
});

describe("policy page", () => {
  it("builds a policy and takedown page linked from the global footer", () => {
    execSync("npm run build", { cwd: projectRoot, stdio: "pipe" });

    const policy = readFileSync(
      resolve(projectRoot, "dist", "policy", "index.html"),
      "utf8",
    );
    const home = readFileSync(
      resolve(projectRoot, "dist", "index.html"),
      "utf8",
    );

    expect(policy).toContain("Policy and takedown");
    expect(policy).toContain("No user data is collected");
    expect(policy).toContain("takedown");
    expect(home).toContain('href="/policy"');
  });
});
