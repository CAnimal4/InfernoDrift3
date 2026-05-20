import fs from "node:fs";
import { chromium } from "playwright";

fs.mkdirSync("output/playwright", { recursive: true });

const browser = await chromium.launch({
  headless: true,
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--use-gl=angle"]
});
const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
page.setDefaultTimeout(4000);
page.on("console", (msg) => console.log("browser:", msg.type(), msg.text()));

await page.goto("http://127.0.0.1:4173/index.html", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1800);
await page.evaluate(() => {
  window.prompt = () => "ibelikesheesh";
});

await page.locator("#start-btn").click({ force: true });
await page.waitForTimeout(900);
await page.keyboard.press("Escape");
await page.evaluate(() => {
  document.getElementById("dev-mode-toggle").click();
});
await page.waitForTimeout(350);

const gamesVisible = !(await page.locator("#games-tab-btn").isHidden());
await page.locator("#games-tab-btn").click({ force: true });
await page.locator("#game-card-max1").click({ force: true });
const gameHint = await page.locator("#game-mode-hint").textContent();
await page.keyboard.press("Escape");
await page.locator("#menu-btn").click({ force: true });
await page.waitForTimeout(250);
await page.keyboard.press("Escape");
await page.waitForTimeout(1200);
await page.evaluate(() => window.advanceTime(1200));

const maxHud = {
  blue: await page.locator("#hud-world").textContent(),
  red: await page.locator("#hud-level").textContent(),
  mode: await page.locator("#hud-score").textContent(),
  speed: await page.locator("#hud-speed").textContent()
};
const initialText = JSON.parse(await page.evaluate(() => window.render_game_to_text()));
await page.evaluate(() => window.__infernodriftTestApi.forceMaxGoal("blue"));
await page.waitForTimeout(150);
await page.evaluate(() => window.advanceTime(1600));
const replayState = await page.evaluate(() => window.__infernodriftTestApi.getReplayState());
const matchStats = await page.evaluate(() => window.__infernodriftTestApi.getMatchStats());
const replayMeta = await page.locator("#match-panel-meta").textContent();

await page.keyboard.press("Escape");
await page.locator("#games-tab-btn").click({ force: true });
await page.locator("#game-card-risk").click({ force: true });
const riskHint = await page.locator("#game-mode-hint").textContent();
await page.keyboard.press("Escape");
await page.waitForTimeout(1100);
await page.evaluate(() => window.advanceTime(1600));
const riskText = JSON.parse(await page.evaluate(() => window.render_game_to_text()));

await page.locator("#menu-btn").click({ force: true });
await page.waitForTimeout(250);
await page.locator('[data-tab="settings"]').click({ force: true });
await page.selectOption("#dev-max-boost-variant", "hyper");
await page.click("#dev-force-demo");
await page.waitForTimeout(150);
await page.keyboard.press("Escape");
await page.evaluate(() => window.advanceTime(2400));
const postDemoText = JSON.parse(await page.evaluate(() => window.render_game_to_text()));

await page.keyboard.press("Escape");
await page.locator("#games-tab-btn").click({ force: true });
await page.locator("#game-card-id33").click({ force: true });
await page.keyboard.press("Escape");
await page.locator("#menu-btn").click({ force: true });
await page.waitForTimeout(250);
await page.keyboard.press("Escape");
await page.waitForTimeout(1000);

const idHud = {
  world: await page.locator("#hud-world").textContent(),
  level: await page.locator("#hud-level").textContent()
};

await page.screenshot({ path: "output/playwright/games-smoke.png", fullPage: true });
console.log(
  JSON.stringify({ gamesVisible, gameHint, maxHud, initialText, replayState, replayMeta, matchStats, riskHint, riskText, postDemoText, idHud }, null, 2)
);
await browser.close();
