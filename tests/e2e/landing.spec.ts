import { test, expect } from "@playwright/test";

test("landing page renders and links to signup", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Yebo finds the companies worth pursuing",
  );
  await page.getByRole("link", { name: "Get started" }).click();
  await expect(page).toHaveURL(/\/signup$/);
  await expect(page.getByRole("heading", { name: "Create your Yebo account" })).toBeVisible();
});

test("unauthenticated visitors are redirected away from the app", async ({ page }) => {
  await page.goto("/today");
  await expect(page).toHaveURL(/\/login$/);
});
