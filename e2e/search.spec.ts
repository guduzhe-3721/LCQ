import { expect, test } from "@playwright/test";

test("searches published content while keeping drafts out of results", async ({
  page,
}) => {
  await page.goto("/search");

  const search = page.getByLabel("搜索文章和资源");
  await search.fill("A Markdown-first personal library");

  const publishedResult = page.getByRole("link", {
    name: "A Markdown-first personal library",
  });
  await expect(publishedResult).toBeVisible();
  await expect(publishedResult).toHaveAttribute(
    "href",
    "/articles/markdown-first-library/",
  );

  await search.fill("Draft: A calm publishing workflow");
  await expect(
    page.getByRole("link", { name: "Draft: A calm publishing workflow" }),
  ).toHaveCount(0);
});
