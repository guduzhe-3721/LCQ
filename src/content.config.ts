import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const requiredString = z.string().trim().min(1);
const httpsUrl = z
  .string()
  .url()
  .refine((value) => new URL(value).protocol === "https:", {
    message: "Expected an absolute HTTPS URL",
  });

export const articleSchema = z.object({
  title: requiredString,
  description: requiredString,
  publishedAt: z.coerce.date(),
  tags: z.array(requiredString),
  cover: httpsUrl.optional(),
  draft: z.boolean().default(false),
});

export const resourceSchema = z.object({
  title: requiredString,
  description: requiredString,
  category: requiredString,
  tags: z.array(requiredString),
  version: requiredString,
  fileName: requiredString,
  size: requiredString,
  releaseUrl: httpsUrl,
  sourceUrl: httpsUrl,
  license: requiredString,
  sha256: z.string().regex(/^[a-fA-F0-9]{64}$/),
  publishedAt: z.coerce.date(),
  draft: z.boolean().default(false),
});

const articles = defineCollection({
  loader: glob({ base: "./src/content/articles", pattern: "**/*.md" }),
  schema: articleSchema,
});

const resources = defineCollection({
  loader: glob({ base: "./src/content/resources", pattern: "**/*.md" }),
  schema: resourceSchema,
});

export const collections = { articles, resources };
