import { expect, test } from "@playwright/test";

test("searches published content while keeping drafts out of results", async ({
  page,
}) => {
  await page.goto("/search");

  const search = page.getByLabel("搜索文章和资源");
  await search.fill("以 Markdown 为先的个人资料库");

  const publishedResult = page.getByRole("link", {
    name: "以 Markdown 为先的个人资料库",
  });
  await expect(publishedResult).toBeVisible();
  await expect(publishedResult).toHaveAttribute(
    "href",
    "/articles/markdown-first-library/",
  );

  await search.fill("草稿：从容的发布流程");
  await expect(
    page.getByRole("link", { name: "草稿：从容的发布流程" }),
  ).toHaveCount(0);
});
