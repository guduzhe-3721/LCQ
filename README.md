# Personal Library

A static, Markdown-first personal library published on GitHub Pages. It uses
GitHub Actions and public GitHub Release assets only—there are no paid services,
custom domains, databases, accounts, or runtime APIs.

## Local development

Install dependencies and start the site:

```sh
npm ci
npm run dev
```

Run the same checks used by CI with `npm run lint`, `npm run format:check`,
`npm run typecheck`, `npm test`, and `npm run build`.

## Publish content

1. Add an article Markdown file under `src/content/articles/`, or a resource
   Markdown file under `src/content/resources/`. Set `draft: false` only when it
   is ready to be public.
2. For a downloadable resource, create a GitHub Release and upload the file as
   a Release asset. Copy the public, direct asset URL in the form
   `https://github.com/OWNER/REPO/releases/download/TAG/FILE`.
3. Calculate the file's SHA-256 (for example, `Get-FileHash FILE -Algorithm
SHA256` in PowerShell), then paste both the direct URL and SHA-256 into the
   resource front matter.
4. Commit and push to the default branch. The CI checks finish first, and the
   successful revision is then deployed to GitHub Pages.

In the repository settings, open **Pages** and choose **Source: GitHub Actions**
once before the first deployment.

## Free-operation constraints

- Do not configure a custom domain or paid service.
- Downloads are public and direct; never place private or sensitive files here.
- Publish only files you own or files you may distribute under an open-source
  licence.
- Keep each GitHub Release asset under 2 GiB.
- GitHub availability can be unreliable or slow in mainland China; keep this
  caveat visible to readers who depend on downloads.

See the site's Policy and takedown page for privacy and rights-request details.
