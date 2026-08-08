# Task 5 report: GitHub Pages deployment and free-operation docs

## Implementation

- Added `.github/workflows/deploy-pages.yml`. It listens for successful `CI`
  workflow completions, deploys only the repository default branch revision,
  builds with `PUBLIC_BASE_PATH=/${{ github.event.repository.name }}`, and uses
  `actions/configure-pages@v5`, `actions/upload-pages-artifact@v3`, and
  `actions/deploy-pages@v4`.
- Kept `.github/workflows/ci.yml` as the push/PR verification-only workflow.
  Deployment has only the `contents: read`, `pages: write`, and `id-token:
  write` permissions it requires.
- Added a README covering local development, articles/resources, GitHub Release
  assets, direct URLs and SHA-256, Pages setup, and operating constraints.
- Added `/policy`, a footer policy link, a no-data-collection statement, and
  takedown instructions. There are no analytics or privacy-invasive scripts.
- Normalized the Astro base path and internal links so repository Pages builds
  retain the repository prefix.

## RED

Created `tests/deployment-and-policy.test.ts` before implementation, then ran:

```text
npm test -- deployment-and-policy.test.ts
```

It failed as expected because `deploy-pages.yml`, `README.md`, and
`dist/policy/index.html` did not exist. A further base-path check initially
failed because raw root links did not retain a repository base path; the link
generation was then corrected.

## GREEN and verification

After implementation, the focused test passed: 3 tests passed.

Full verification completed successfully after formatting:

```text
npm run lint                 # passed
npm run format:check         # passed
npm run typecheck            # 0 errors, 0 warnings, 0 hints
npm test                     # 4 files, 13 tests passed
npm run build                # passed; 12 static pages built
npm run test:e2e             # 8 passed
```

I also manually built with `PUBLIC_BASE_PATH=/personal-library` and confirmed
the generated footer, navigation, content-card, and tag URLs start with
`/personal-library/`.

## Remaining operator action

In the GitHub repository settings, select **Pages → Source: GitHub Actions**.
The first deployment runs after CI succeeds on the default branch.
