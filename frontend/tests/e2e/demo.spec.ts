import { test, expect } from "@playwright/test";

const BANNER = "Demo: test sats only, no real money";

// Mock-data happy paths (default demo mode). The banner must appear on
// every screen; core journeys must complete without console errors.

test.describe("demo happy paths", () => {
  test.beforeEach(async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.goto("/login");
    await page.fill("#phone", "+254712345678");
    await page.fill("#pw", "anything");
    await page.getByRole("button", { name: /log in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    await expect(page.getByRole("note", { name: BANNER })).toBeVisible();
    (page as unknown as { __errors: string[] }).__errors = errors;
  });

  test("dashboard shows the banner and a balance", async ({ page }) => {
    await expect(page.getByRole("note", { name: BANNER })).toBeVisible();
    await expect(page.locator("body")).toContainText("sats");
  });

  test("deposit flow shows the simulated M-Pesa tab", async ({ page }) => {
    await page.goto("/deposit");
    await expect(page.getByRole("note", { name: BANNER })).toBeVisible();
    await expect(page.getByRole("tablist")).toContainText("simulated");
  });

  test("savings lock flow completes", async ({ page }) => {
    await page.goto("/savings/lock");
    await expect(page.getByRole("note", { name: BANNER })).toBeVisible();
    await expect(page.locator("body")).toContainText(/lock/i);
    await page.goto("/savings");
    await expect(page.getByRole("note", { name: BANNER })).toBeVisible();
  });

  test("chama discover and history carry the banner", async ({ page }) => {
    for (const path of ["/chama", "/chama/discover", "/history", "/settings"]) {
      await page.goto(path);
      await expect(page.getByRole("note", { name: BANNER })).toBeVisible();
    }
  });

  test("no page errors during the journey", async ({ page }) => {
    for (const path of ["/dashboard", "/deposit", "/savings", "/chama"]) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
    }
    const errors = (page as unknown as { __errors: string[] }).__errors ?? [];
    expect(errors).toEqual([]);
  });
});

test.describe("role gates", () => {
  test("member cannot open mlinzi or agent screens", async ({ page }) => {
    await page.goto("/login");
    await page.fill("#phone", "+254712345678");
    await page.fill("#pw", "anything");
    await page.getByRole("button", { name: /log in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    await page.goto("/mlinzi");
    await expect(page).not.toHaveURL(/\/mlinzi/);
    await page.goto("/agent");
    await expect(page).not.toHaveURL(/\/agent/);
  });

  test("agent persona reaches the agent screen with simulated float", async ({ page }) => {
    await page.goto("/login");
    await page.fill("#phone", "+254700000002");
    await page.fill("#pw", "anything");
    await page.getByRole("button", { name: /log in/i }).click();
    await expect(page).toHaveURL(/\/agent/, { timeout: 10000 });
    await expect(page.getByRole("note", { name: BANNER })).toBeVisible();
    await expect(page.locator("body")).toContainText("simulated");
  });
});
