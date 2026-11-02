/**
 * Captures key screens on desktop and mobile for visual review.
 * Usage: node scripts/screenshots.mjs [baseUrl] [outDir]
 */
import { chromium, devices, webkit } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const base = process.argv[2] ?? "http://localhost:3000";
const out = process.argv[3] ?? "screenshots";
await mkdir(out, { recursive: true });

const skipTour = () =>
  localStorage.setItem(
    "bible:onboarding",
    JSON.stringify({ state: { completedAt: 1 }, version: 1 }),
  );

async function ready(page) {
  await page.waitForSelector("html[data-hydrated]", { state: "attached" });
  await page.waitForTimeout(400);
}

async function run(name, browserType, contextOptions, steps) {
  const browser = await browserType.launch();
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();
  page.on("pageerror", (e) => console.log(`[${name}] pageerror: ${e.message}`));
  await steps(page, async (label) => {
    await page.screenshot({ path: `${out}/${name}-${label}.png` });
    console.log(`${out}/${name}-${label}.png`);
  });
  await browser.close();
}

const desktop = { viewport: { width: 1440, height: 900 }, colorScheme: "dark" };

await run("desktop", chromium, desktop, async (page, shot) => {
  await page.goto(`${base}/en`);
  await ready(page);
  await page.waitForTimeout(900);
  await shot("tour-1-welcome");
  for (let step = 2; step <= 6; step++) {
    await page.getByRole("button", { name: "Next" }).click();
    await page.waitForTimeout(450);
    await shot(`tour-${step}`);
  }
  await page.getByRole("button", { name: /Start reading/ }).click();

  await page.goto(`${base}/en/john/3`);
  await ready(page);
  await shot("reader");
  await page.keyboard.press("Control+k");
  await page.keyboard.type("salmos 23:1");
  await page.waitForTimeout(200);
  await shot("search");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Reading settings" }).click();
  await page.waitForTimeout(250);
  await shot("settings");
  await page.getByRole("switch", { name: /Side-by-side/ }).click();
  await page.keyboard.press("Escape");
  await page.waitForTimeout(600);
  await shot("parallel");
  await page.locator("footer").last().scrollIntoViewIfNeeded();
  await page.waitForTimeout(2000);
  await shot("chapter-end");
  await page.goto(`${base}/en`);
  await ready(page);
  await shot("home-with-progress");
});

await run("desktop-light", chromium, { ...desktop, colorScheme: "light" }, async (page, shot) => {
  await page.addInitScript(skipTour);
  await page.addInitScript(() => localStorage.setItem("theme", "light"));
  await page.goto(`${base}/es/salmos/23`);
  await ready(page);
  await shot("reader-es");
});

for (const [name, type, device] of [
  ["android", chromium, devices["Pixel 7"]],
  ["iphone", webkit, devices["iPhone 14"]],
]) {
  await run(name, type, { ...device, colorScheme: "dark" }, async (page, shot) => {
    await page.goto(`${base}/es`);
    await ready(page);
    await page.waitForTimeout(900);
    await shot("tour-1");
    await page.getByRole("button", { name: "Siguiente" }).click();
    await page.waitForTimeout(450);
    await shot("tour-2");
    await page.getByRole("button", { name: "Siguiente" }).click();
    await page.waitForTimeout(450);
    await shot("tour-3");
    await page.keyboard.press("Escape");
    await shot("home");

    await page.goto(`${base}/es/juan/1`);
    await ready(page);
    await shot("reader");
    for (let i = 0; i < 8; i++) {
      await page.evaluate(() => window.scrollBy(0, 200));
      await page.waitForTimeout(40);
    }
    await page.waitForTimeout(400);
    await shot("reader-scrolled-immersive");
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.scrollBy(0, -100));
      await page.waitForTimeout(40);
    }
    await page.waitForTimeout(400);
    await page.getByRole("button", { name: /Explorar libros/ }).click();
    await page.waitForTimeout(500);
    await shot("books-drawer");
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
    await page
      .getByRole("navigation", { name: "Principal" })
      .getByRole("button", { name: "Ajustes" })
      .click();
    await page.waitForTimeout(500);
    await shot("settings-drawer");
    await page.getByRole("switch", { name: /lado a lado/ }).click();
    await page.keyboard.press("Escape");
    await page.waitForTimeout(800);
    await shot("parallel");
    await page.getByRole("button", { name: "Buscar", exact: true }).click();
    await page.keyboard.type("1 cor 13");
    await page.waitForTimeout(200);
    await shot("search");
  });
}
