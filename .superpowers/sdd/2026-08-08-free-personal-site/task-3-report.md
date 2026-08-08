# Task 3 report: public article and resource pages

## Delivered

- Added reusable `SiteHeader`, `ContentCard`, and `TagList` components.
- Added static public routes for the home page, article and resource lists and details, tags, and about page.
- Each collection query filters `!data.draft`; draft detail paths are never emitted.
- Article detail pages render Markdown, a generated table of contents, publication date, and styled code blocks.
- Resource detail pages expose version, size, source URL, license, SHA-256, and the unmodified external GitHub Release URL.
- Added light-slate/white responsive UI, indigo actions, keyboard focus treatment, and a 375px usable navigation layout.

## TDD evidence

### RED

Command: `npm test -- tests/public-pages.test.ts`

Result: 3 of 4 tests failed as expected before implementation. The failures were `ENOENT` for missing generated `/articles`, `/articles/markdown-first-library`, and `/resources/astro-library-starter` pages. The draft-path assertion already passed because no detail routes existed yet.

### GREEN

Command: `npm test -- tests/public-pages.test.ts`

Result: 4 of 4 tests passed after implementing the static routes and components. The tests cover published discovery, draft exclusion, Markdown/TOC/date output, resource metadata/direct GitHub Release link, and absent draft pages.

## Final verification

All commands were run in the task worktree on 2026-08-08:

| Command | Result |
| --- | --- |
| `npm run typecheck` | Passed: 0 errors, 0 warnings |
| `npm test` | Passed: 3 files, 10 tests |
| `npm run lint` | Passed |
| `npm run format:check` | Passed: all matched files formatted |
| `npm run build` | Passed: 10 static pages generated |
| `npm run test:e2e` | Passed: 6 Playwright tests across desktop and mobile |

The Playwright checks include published article/resource detail rendering, the direct release `href`, an unknown article 404, and navigation usability at a 375px viewport.
