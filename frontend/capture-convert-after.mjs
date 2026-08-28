import { chromium } from "playwright";

async function main() {
  const browser = await chromium.launch({ channel: "chrome" });

  // 1. Desktop Context
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  console.log("Navigating desktop to http://localhost:3000/#convert...");
  await page.goto("http://localhost:3000/#convert", { waitUntil: "networkidle" });
  await page.waitForTimeout(600);

  // Scroll into view & trigger reveal
  await page.evaluate(() => {
    const el = document.getElementById("convert");
    if (el) el.scrollIntoView({ behavior: "instant", block: "center" });
    document.querySelectorAll(".reveal").forEach(r => r.classList.add("is-revealed"));
  });
  await page.waitForTimeout(500);

  const convertSection = page.locator("#convert").first();
  await convertSection.screenshot({
    path: "/Users/mac/.gemini/antigravity-ide/brain/745fcd0f-3765-474f-8acb-a3235362d7b9/converter_after_light.png"
  });
  console.log("Saved converter_after_light.png");

  // Toggle Dark Mode
  await page.evaluate(() => {
    document.documentElement.setAttribute("data-theme", "dark");
  });
  await page.waitForTimeout(400);

  await convertSection.screenshot({
    path: "/Users/mac/.gemini/antigravity-ide/brain/745fcd0f-3765-474f-8acb-a3235362d7b9/converter_after_dark.png"
  });
  console.log("Saved converter_after_dark.png");

  await context.close();

  // 2. Mobile Context (375x667)
  const contextMobile = await browser.newContext({ viewport: { width: 375, height: 667 } });
  const pageMobile = await contextMobile.newPage();

  console.log("Navigating mobile to http://localhost:3000/#convert...");
  await pageMobile.goto("http://localhost:3000/#convert", { waitUntil: "networkidle" });
  await pageMobile.waitForTimeout(600);

  await pageMobile.evaluate(() => {
    const el = document.getElementById("convert");
    if (el) el.scrollIntoView({ behavior: "instant", block: "center" });
    document.querySelectorAll(".reveal").forEach(r => r.classList.add("is-revealed"));
  });
  await pageMobile.waitForTimeout(500);

  const convertMobile = pageMobile.locator("#convert").first();
  await convertMobile.screenshot({
    path: "/Users/mac/.gemini/antigravity-ide/brain/745fcd0f-3765-474f-8acb-a3235362d7b9/converter_after_mobile.png"
  });
  console.log("Saved converter_after_mobile.png");

  await contextMobile.close();
  await browser.close();
  console.log("All converter screenshots captured successfully!");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
