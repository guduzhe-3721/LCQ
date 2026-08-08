import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "astro:content": fileURLToPath(
        new URL(
          "./node_modules/astro/dist/content/runtime.js",
          import.meta.url,
        ),
      ),
    },
  },
  test: {
    fileParallelism: false,
    include: ["tests/**/*.test.ts"],
    testTimeout: 15_000,
  },
});
