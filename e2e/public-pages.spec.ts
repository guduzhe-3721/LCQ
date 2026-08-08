import { expect, test } from "@playwright/test";

test("public detail pages expose published content and 404 unknown slugs", async ({
  page,
}) => {
  await page.goto("/articles/markdown-first-library");
  await expect(
    page.getByRole("heading", { name: "A Markdown-first personal library" }),
  ).toBeVisible();
  await expect(page.getByLabel("Table of contents")).toBeVisible();

  await page.goto("/resources/astro-library-starter");
  await expect(
    page.getByRole("link", { name: "Download from GitHub Release" }),
  ).toHaveAttribute(
    "href",
    "https://github.com/example/astro-library-starter/releases/download/v1.0.0/astro-library-starter.zip",
  );

  const response = await page.goto("/articles/not-a-real-article");
  expect(response?.status()).toBe(404);
});

test("the navigation remains usable at 375px", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");

  const navigation = page.getByRole("navigation", {
    name: "Primary navigation",
  });
  await expect(navigation).toBeVisible();
  await expect(
    navigation.getByRole("link", { name: "Articles" }),
  ).toBeVisible();
  await expect(
    navigation.getByRole("link", { name: "Resources" }),
  ).toBeVisible();
  await expect(navigation.getByRole("link", { name: "About" })).toBeVisible();
});
