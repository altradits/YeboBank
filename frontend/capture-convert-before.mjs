import { chromium } from "playwright";

async function main() {
  const browser = await chromium.launch({ channel: "chrome" });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  console.log("Navigating to http://localhost:3000/#convert...");
  await page.goto("http://localhost:3000/#convert", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  const convertSection = page.locator("#convert").first();
  await convertSection.screenshot({
    path: "/Users/mac/.gemini/antigravity-ide/brain/745fcd0f-3765-474f-8acb-a3235362d7b9/converter_before.png"
  });
  console.log("Saved converter_before.png");

  await browser.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
