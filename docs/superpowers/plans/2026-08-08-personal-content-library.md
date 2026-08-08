# Personal Content Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a responsive personal website where visitors can read public Markdown articles and verified email users can download owner-published files and open-source software.

**Architecture:** A Next.js App Router application runs on Vercel. Supabase supplies PostgreSQL and email authentication; Tencent COS Hong Kong stores binary objects, and server-side route handlers issue short-lived COS signed download URLs only after authorization.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, Supabase Auth/PostgreSQL, Drizzle ORM, `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, Zod, Vitest, Playwright, Resend SMTP.

## Global Constraints

- Public pages show only `published` articles and resources; only the owner-admin can mutate content.
- Downloads require an authenticated user whose Supabase email is confirmed; resource object keys and COS credentials never reach browser code.
- Every resource must include version, file name, byte size, source URL, SPDX-style license string, and SHA-256 before publishing.
- Markdown imports create drafts and never overwrite existing articles.
- Default deployment is Vercel + Supabase + Tencent COS Hong Kong without ICP filing; all provider secrets stay server-side.
- The UI uses the approved bright, modern style: white surfaces, indigo accent, rounded cards, readable typography, and responsive layouts.

---

### Task 1: Scaffold the application and quality gates

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `.env.example`
- Create: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`
- Create: `vitest.config.ts`, `playwright.config.ts`, `tests/setup.ts`

**Interfaces:**
- Produces: Next.js application with `@/*` path alias, `npm run lint`, `npm run test`, `npm run test:e2e`, and `npm run typecheck`.

- [ ] **Step 1: Write a failing smoke test**

```ts
// tests/home.test.tsx
import { render, screen } from '@testing-library/react';
import HomePage from '@/app/page';

it('renders the site title', () => {
  render(<HomePage />);
  expect(screen.getByRole('heading', { name: '我的空间' })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run it to verify the project does not exist yet**

Run: `npm test -- tests/home.test.tsx`

Expected: FAIL because the package and page module do not exist.

- [ ] **Step 3: Create the Next.js TypeScript project and the minimal page**

```tsx
// src/app/page.tsx
export default function HomePage() {
  return <main><h1>我的空间</h1></main>;
}
```

Install `next`, `react`, `react-dom`, TypeScript, Tailwind, ESLint, Vitest, Testing Library, Playwright, and configure scripts: `dev`, `build`, `lint`, `typecheck`, `test`, and `test:e2e`.

- [ ] **Step 4: Add environment variable documentation**

```dotenv
# .env.example
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
COS_REGION=
COS_BUCKET=
COS_ENDPOINT=
COS_ACCESS_KEY_ID=
COS_SECRET_ACCESS_KEY=
DOWNLOAD_URL_TTL_SECONDS=300
ADMIN_EMAIL=
```

- [ ] **Step 5: Run local quality checks**

Run: `npm run lint && npm run typecheck && npm test -- --run`

Expected: all commands pass.

- [ ] **Step 6: Commit**

```bash
git add package.json src tests .env.example next.config.ts tsconfig.json tailwind.config.ts vitest.config.ts playwright.config.ts
git commit -m "chore: scaffold personal content library"
```

### Task 2: Define the database, roles, and authenticated server clients

**Files:**
- Create: `supabase/migrations/0001_content_library.sql`
- Create: `src/lib/supabase/server.ts`, `src/lib/supabase/browser.ts`, `src/lib/auth.ts`
- Create: `src/db/schema.ts`, `src/db/index.ts`
- Test: `tests/auth.test.ts`

**Interfaces:**
- Produces: `requireVerifiedUser(): Promise<{ id: string; email: string }>` and `requireAdmin(): Promise<{ id: string; email: string }>`.
- Produces: `articles`, `resources`, `downloads`, and `profiles` tables with statuses `draft | published | archived`.

- [ ] **Step 1: Write failing authorization tests**

```ts
import { requireAdmin } from '@/lib/auth';

it('rejects an unverified user', async () => {
  await expect(requireAdmin()).rejects.toMatchObject({ status: 403 });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- tests/auth.test.ts`

Expected: FAIL because `@/lib/auth` is absent.

- [ ] **Step 3: Add schema and RLS policies**

```sql
create type content_status as enum ('draft', 'published', 'archived');
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  role text not null check (role in ('user', 'admin')) default 'user'
);
create table articles (
  id uuid primary key default gen_random_uuid(), slug text not null unique,
  title text not null, excerpt text not null, body_markdown text not null,
  tags text[] not null default '{}', cover_url text, status content_status not null default 'draft',
  published_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
```

Add `resources` with the required metadata and `downloads` with `user_id`, `resource_id`, `issued_at`, `expires_at`, and `outcome`. Enable RLS: anonymous users may select only published articles/resources; users may select only their own downloads; mutations are made only from server-side service-role code after `requireAdmin`.

- [ ] **Step 4: Implement server authentication guards**

```ts
export async function requireVerifiedUser() {
  const user = await getServerSupabase().auth.getUser();
  if (!user.data.user?.email_confirmed_at) throw new HttpError(403, '请先验证邮箱');
  return { id: user.data.user.id, email: user.data.user.email! };
}
```

`requireAdmin` must call `requireVerifiedUser`, read `profiles.role`, and reject any non-`admin` profile with HTTP 403.

- [ ] **Step 5: Run tests and apply the migration to a development Supabase project**

Run: `npm test -- tests/auth.test.ts && npx supabase db push`

Expected: unit test passes and migration reports success.

- [ ] **Step 6: Commit**

```bash
git add supabase src/lib src/db tests/auth.test.ts
git commit -m "feat: add content schema and authorization guards"
```

### Task 3: Implement article model, public reading, and Markdown import

**Files:**
- Create: `src/lib/articles.ts`, `src/components/article-card.tsx`, `src/components/markdown-renderer.tsx`
- Create: `src/app/articles/page.tsx`, `src/app/articles/[slug]/page.tsx`, `src/app/api/admin/articles/import/route.ts`
- Create: `scripts/import-markdown.ts`
- Test: `tests/articles.test.ts`, `tests/article-import.test.ts`

**Interfaces:**
- Consumes: `requireAdmin()` and `articles` from Task 2.
- Produces: `listPublishedArticles(query?: string)`, `getPublishedArticle(slug: string)`, and `parseArticleImport(markdown: string)`.

- [ ] **Step 1: Write failing article visibility and import tests**

```ts
expect(parseArticleImport('---\ntitle: Hello\ntags: [notes]\n---\n# Body')).toMatchObject({
  title: 'Hello', tags: ['notes'], bodyMarkdown: '# Body', status: 'draft'
});
await expect(getPublishedArticle('private-note')).resolves.toBeNull();
```

- [ ] **Step 2: Run tests to verify failure**

Run: `npm test -- tests/articles.test.ts tests/article-import.test.ts`

Expected: FAIL because article helpers do not exist.

- [ ] **Step 3: Implement parsing and queries**

```ts
export type ArticleImport = { title: string; excerpt: string; tags: string[]; publishedAt?: Date; coverUrl?: string; bodyMarkdown: string; status: 'draft' };
export function parseArticleImport(markdown: string): ArticleImport { /* parse gray-matter; validate with Zod; return draft */ }
```

Use `gray-matter` and Zod. Reject missing title, malformed tags, and missing body with field-level messages. `listPublishedArticles` and `getPublishedArticle` must query `status = 'published'` only.

- [ ] **Step 4: Build the public article pages**

Render article cards, keyword search, tag links, a generated reading table of contents, syntax-highlighted code, and safe Markdown-to-HTML output. Return `notFound()` for missing or non-published slugs.

- [ ] **Step 5: Add the admin import endpoint and CLI**

```ts
// POST /api/admin/articles/import
// multipart form field: file
// response: { article: { id: string; slug: string; status: 'draft' } }
```

The endpoint requires admin role, invokes `parseArticleImport`, creates a new draft, and returns HTTP 409 for a duplicate slug. The CLI posts each supplied Markdown file to this endpoint and prints the created draft URLs.

- [ ] **Step 6: Run tests and commit**

Run: `npm test -- tests/articles.test.ts tests/article-import.test.ts && npm run typecheck`

Expected: all checks pass.

```bash
git add src scripts tests
git commit -m "feat: add public articles and markdown import"
```

### Task 4: Implement COS-backed resource publishing and metadata validation

**Files:**
- Create: `src/lib/resources.ts`, `src/lib/cos.ts`, `src/lib/sha256.ts`
- Create: `src/app/api/admin/resources/upload/route.ts`, `src/app/api/admin/resources/route.ts`
- Test: `tests/resources.test.ts`, `tests/cos.test.ts`

**Interfaces:**
- Consumes: `requireAdmin()` and the `resources` table.
- Produces: `validateResourceInput(input)`, `createMultipartUpload(input)`, `completeMultipartUpload(input)`, and `publishResource(resourceId)`.

- [ ] **Step 1: Write failing validation and upload-state tests**

```ts
expect(() => validateResourceInput({ title: 'Tool', version: '1.0', license: '', sourceUrl: 'x' })).toThrow('license');
await expect(publishResource('missing-hash')).rejects.toMatchObject({ code: 'RESOURCE_NOT_READY' });
```

- [ ] **Step 2: Run the tests to verify failure**

Run: `npm test -- tests/resources.test.ts tests/cos.test.ts`

Expected: FAIL because resource services do not exist.

- [ ] **Step 3: Implement the S3-compatible COS adapter and direct multipart upload**

```ts
export function createCosClient() {
  return new S3Client({ region: env.COS_REGION, endpoint: env.COS_ENDPOINT, credentials: { accessKeyId: env.COS_ACCESS_KEY_ID, secretAccessKey: env.COS_SECRET_ACCESS_KEY } });
}
```

Use a generated key `resources/<resource-id>/<sanitized-file-name>`. The server creates a COS multipart upload and returns short-lived presigned URLs for each part; the administrator browser uploads parts directly to COS and incrementally computes SHA-256 without loading the whole file into memory. The browser sends part ETags and the calculated hash to the server, which completes the upload and saves a `draft` resource only after COS confirms completion. On cancellation, expiry, or completion failure, the server aborts the multipart upload and returns a user-safe error. File bytes never pass through Vercel functions.

- [ ] **Step 4: Implement publish-state rules and admin API**

```ts
export const resourceInputSchema = z.object({
  title: z.string().min(1), version: z.string().min(1), category: z.string().min(1),
  sourceUrl: z.string().url(), license: z.string().min(1), description: z.string().min(1)
});
```

`publishResource` must require a completed COS upload, file key, nonzero byte size, SHA-256, and schema-valid metadata; otherwise keep the resource draft. `archiveResource` immediately changes status to `archived` and appends an audit log entry.

- [ ] **Step 5: Run tests and commit**

Run: `npm test -- tests/resources.test.ts tests/cos.test.ts && npm run typecheck`

Expected: all checks pass with mocked COS requests.

```bash
git add src tests
git commit -m "feat: add validated COS resource publishing"
```

### Task 5: Build verified-user downloads and audit trail

**Files:**
- Create: `src/app/api/resources/[slug]/download/route.ts`, `src/components/download-button.tsx`
- Modify: `src/lib/resources.ts`, `src/lib/cos.ts`
- Test: `tests/downloads.test.ts`

**Interfaces:**
- Consumes: `requireVerifiedUser()`, `getPublishedResource(slug)`, and `createCosClient()`.
- Produces: `POST /api/resources/:slug/download` returning `{ url: string; expiresAt: string }`.

- [ ] **Step 1: Write failing download authorization tests**

```ts
expect(await requestDownload({ user: null, slug: 'tool' })).toMatchObject({ status: 401 });
expect(await requestDownload({ user: verifiedUser, slug: 'archived-tool' })).toMatchObject({ status: 404 });
expect(await requestDownload({ user: verifiedUser, slug: 'tool' })).toMatchObject({ status: 200, body: { url: expect.stringContaining('Signature=') } });
```

- [ ] **Step 2: Run the test to verify failure**

Run: `npm test -- tests/downloads.test.ts`

Expected: FAIL because the route and signer are absent.

- [ ] **Step 3: Sign only allowed downloads**

```ts
const url = await getSignedUrl(client, new GetObjectCommand({ Bucket: env.COS_BUCKET, Key: resource.objectKey }), {
  expiresIn: env.DOWNLOAD_URL_TTL_SECONDS
});
```

Require a confirmed user, look up the resource by slug with `status = 'published'`, create a `downloads` row before responding, and use 300 seconds by default. Never return the object key or credential values in JSON.

- [ ] **Step 4: Implement client behaviour**

`DownloadButton` sends the POST request, redirects unauthenticated users to `/login?next=<resource-path>`, opens the signed URL when returned, and shows an inline retry message on expiry or network failure.

- [ ] **Step 5: Run tests and commit**

Run: `npm test -- tests/downloads.test.ts && npm run lint`

Expected: all tests and linting pass.

```bash
git add src tests
git commit -m "feat: protect resource downloads with signed URLs"
```

### Task 6: Build the public resource library and modern responsive shell

**Files:**
- Create: `src/app/resources/page.tsx`, `src/app/resources/[slug]/page.tsx`
- Create: `src/components/site-header.tsx`, `src/components/resource-card.tsx`, `src/components/resource-filters.tsx`
- Modify: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`
- Test: `tests/resources-page.test.tsx`, `e2e/public-library.spec.ts`

**Interfaces:**
- Consumes: published article/resource query functions and `DownloadButton`.
- Produces: `/`, `/articles`, `/articles/[slug]`, `/resources`, and `/resources/[slug]` public experience.

- [ ] **Step 1: Write failing UI and browser tests**

```ts
expect(screen.getByText('版本 1.0.0')).toBeVisible();
expect(screen.getByText('SHA-256')).toBeVisible();
```

```ts
// e2e/public-library.spec.ts
await page.goto('/resources');
await page.getByRole('textbox', { name: '搜索资源' }).fill('tool');
await expect(page.getByRole('link', { name: /Tool/ })).toBeVisible();
```

- [ ] **Step 2: Run tests to verify failure**

Run: `npm test -- tests/resources-page.test.tsx && npx playwright test e2e/public-library.spec.ts`

Expected: FAIL because the library screens are absent.

- [ ] **Step 3: Implement layout and catalogue pages**

Build a responsive header with Articles, Resources, About, and account controls. The homepage presents newest articles and selected resources. Resource list supports query, category, and tag filters; the resource detail surface displays all required provenance fields above the `DownloadButton`.

- [ ] **Step 4: Apply the approved visual system**

Use a white/light-slate page background, indigo primary actions, 12–16px card radii, keyboard-visible focus styles, and a single-column layout below 768px. Do not use dark-mode-only styling or expose storage paths.

- [ ] **Step 5: Run responsive and accessibility checks**

Run: `npm test -- tests/resources-page.test.tsx && npx playwright test e2e/public-library.spec.ts --project=chromium && npm run build`

Expected: checks pass at desktop and 375px mobile viewport.

- [ ] **Step 6: Commit**

```bash
git add src tests e2e
git commit -m "feat: add responsive public content library"
```

### Task 7: Add user authentication and owner-only administration

**Files:**
- Create: `src/app/login/page.tsx`, `src/app/register/page.tsx`, `src/app/reset-password/page.tsx`
- Create: `src/app/admin/page.tsx`, `src/app/admin/articles/page.tsx`, `src/app/admin/resources/page.tsx`
- Create: `src/app/api/admin/resources/[id]/archive/route.ts`, `src/components/admin/resource-form.tsx`, `src/components/admin/article-editor.tsx`
- Test: `e2e/auth-and-admin.spec.ts`

**Interfaces:**
- Consumes: Supabase auth, `requireAdmin`, article importer, resource publisher, and archive action.
- Produces: email auth pages and administrator-only content workflows.

- [ ] **Step 1: Write failing end-to-end authorization scenarios**

```ts
await page.goto('/admin');
await expect(page).toHaveURL(/\/login/);
await loginAs(page, 'member@example.test');
await page.goto('/admin');
await expect(page.getByText('无权访问')).toBeVisible();
await loginAs(page, process.env.E2E_ADMIN_EMAIL!);
await expect(page.getByRole('heading', { name: '管理后台' })).toBeVisible();
```

- [ ] **Step 2: Run the scenario to verify failure**

Run: `npx playwright test e2e/auth-and-admin.spec.ts`

Expected: FAIL because authentication and admin pages are absent.

- [ ] **Step 3: Implement auth forms and email handling**

Use Supabase `signUp`, `signInWithPassword`, `resetPasswordForEmail`, and sign-out. Configure Supabase SMTP with Resend and redirect email links to `/auth/callback`. Preserve a validated same-origin `next` parameter after login.

- [ ] **Step 4: Implement content management forms**

The admin dashboard lists draft/published/archived counts and recent audit activity. Article editor provides Markdown input, rendered preview, and publish/unpublish controls. Resource form uses the upload endpoint, shows upload state and SHA-256, and blocks publish until required metadata is complete. Archive action asks for explicit confirmation.

- [ ] **Step 5: Run end-to-end tests and commit**

Run: `npx playwright test e2e/auth-and-admin.spec.ts && npm run build`

Expected: visitor, verified member, and admin flows all pass.

```bash
git add src e2e
git commit -m "feat: add authentication and owner administration"
```

### Task 8: Prepare production configuration, policies, and release verification

**Files:**
- Create: `README.md`, `docs/deployment.md`, `src/app/privacy/page.tsx`, `src/app/terms/page.tsx`, `src/app/takedown/page.tsx`
- Create: `.github/workflows/ci.yml`
- Test: `e2e/release-smoke.spec.ts`

**Interfaces:**
- Consumes: all prior routes and environment variables.
- Produces: documented production setup and CI quality gate.

- [ ] **Step 1: Write the failing release smoke test**

```ts
for (const path of ['/', '/articles', '/resources', '/privacy', '/terms', '/takedown']) {
  await page.goto(path);
  await expect(page.locator('main')).toBeVisible();
}
```

- [ ] **Step 2: Run it to verify missing policy routes fail**

Run: `npx playwright test e2e/release-smoke.spec.ts`

Expected: FAIL because policy and takedown pages are absent.

- [ ] **Step 3: Add deployment and legal-operation documentation**

Document exact Vercel environment variable configuration, Supabase migration/apply steps, Resend SMTP setup, COS bucket CORS policy allowing only the site domain, COS CDN custom-domain setup, initial administrator role assignment, backup/export schedule, and rollback by Vercel deployment promotion. Create concise privacy, terms, and takedown-contact pages that link from the site footer.

- [ ] **Step 4: Add CI workflow**

```yaml
name: CI
on: [pull_request, push]
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm run lint && npm run typecheck && npm test -- --run && npm run build
```

- [ ] **Step 5: Run full release verification**

Run: `npm run lint && npm run typecheck && npm test -- --run && npx playwright test && npm run build`

Expected: all checks pass. Manually verify one verified-user COS download and one archived-resource denial against the Vercel preview deployment.

- [ ] **Step 6: Commit**

```bash
git add README.md docs src/app .github e2e
git commit -m "docs: prepare personal site production release"
```

## Self-review

- Spec coverage: Tasks 3 and 6 cover public articles, search, tags, reading and responsive UI; Tasks 4 and 5 cover validated COS storage, hashes, source/license metadata, signed downloads, and download records; Task 7 covers email verification, password reset, and owner administration; Task 8 covers the required policy pages, deployment, backups, and release checks.
- Placeholder scan: this plan contains no deferred implementation markers; configuration values are intentionally supplied through documented environment variables rather than hard-coded secrets.
- Interface consistency: Tasks 3–7 consume the Task 2 guards; Task 4 provides resource state required by Task 5; Task 6 uses the Task 5 download UI; Task 7 combines the earlier service interfaces only behind `requireAdmin`.
