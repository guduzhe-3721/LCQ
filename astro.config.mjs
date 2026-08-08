import { defineConfig } from "astro/config";
import process from "node:process";

const site = process.env.PUBLIC_SITE_URL ?? "http://localhost:4321";
const base = process.env.PUBLIC_BASE_PATH ?? "/";

export default defineConfig({
  output: "static",
  site,
  base,
});
