import { chromium } from "playwright";
const browser = await chromium.launch({
  headless: true,
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--use-gl=angle"]
});
const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
page.on("dialog", async (dialog) => { await dialog.accept("ibelikesheesh"); });
await page.goto("http://127.0.0.1:4173/index.html", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(2200);
await page.keyboard.press("KeyM");
await page.waitForTimeout(250);
await page.locator("#dev-mode-toggle").click();
await page.waitForTimeout(350);
const enabled = await page.locator("#dev-mode-toggle").isChecked();
const hint = await page.locator("#dev-mode-hint").textContent();
console.log(JSON.stringify({ enabled, hint }, null, 2));
await browser.close();
