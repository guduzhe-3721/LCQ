# Task 4 report: zero-cost static search

## RED

- Added `e2e/search.spec.ts` before implementation. It opens `/search`, searches for the published `A Markdown-first personal library` title, verifies its static article link, then searches for the draft `Draft: A calm publishing workflow` and expects no link.
- Ran `npm run test:e2e -- e2e/search.spec.ts` before implementation.
- Expected failure observed on both desktop and mobile: Playwright timed out waiting for the `搜索文章和资源` input because `/search` did not yet exist.

## GREEN

- Added Pagefind as a local dev dependency and appended it to the static build. The Pagefind glob is `{articles/*,resources/*}/index.html`, so it receives only published article and resource detail pages; source Markdown, drafts, listing pages, About, tags, Home, and Search are excluded.
- Added `data-pagefind-body` and a title metadata field to detail pages so Pagefind indexes the public content body and produces result titles.
- Added `/search` with a labelled search input, live result status/count, Chinese empty state and type-labelled result cards. The browser imports only the generated `/pagefind/pagefind.js` asset; there is no hosted service, API route, database, analytics, or credential.
- Added the header Search link, styles with visible keyboard focus inherited from the existing global focus rule, and made Playwright use a built preview so its search tests exercise the generated index.
- GREEN proof: `npm run test:e2e -- e2e/search.spec.ts` passed 2/2 (desktop and 375px mobile).

## Final verification

- `npm run lint` passed.
- `npm run format:check` passed.
- `npm run typecheck` passed with 0 errors, warnings, and hints.
- `npm test` passed: 3 files, 10 tests.
- `npm run build` passed. Pagefind reported exactly 2 indexed pages and 74 words.
- `npm run test:e2e` passed: 8 tests, including desktop and 375px mobile navigation/search coverage.

## Note

Pagefind reports that Chinese stemming is unsupported. Chinese queries still search the static index; this notice does not affect the verified exact-title search behavior.
