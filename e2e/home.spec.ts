import { expect, test } from "@playwright/test";

test("shows the home heading at desktop and mobile widths", async ({
  page,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { level: 1, name: "个人资料库" }),
  ).toBeVisible();
});
