import type { Locator, Page } from "@playwright/test";
import { expect, test } from "./fixtures";

async function press(page: Page, target: Locator, duration: number) {
  await target.scrollIntoViewIfNeeded();
  const box = await target.boundingBox();
  if (!box) throw new Error("Verse is not visible");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(duration);
  await page.mouse.up();
}

test("a quick tap on a verse opens nothing", async ({ page }) => {
  await page.goto("/en/john/3");
  const verse = page.locator("[data-verse='16']");
  await press(page, verse, 50);
  await page.waitForTimeout(800);
  await expect(verse).not.toHaveAttribute("data-selected", "true");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("holding a verse opens it, then it can be saved and shared", async ({ page }) => {
  await page.goto("/en/john/3");
  const verse = page.locator("[data-verse='16']");
  await press(page, verse, 700);
  await expect(verse).toHaveAttribute("data-selected", "true");
  const dialog = page.getByRole("dialog", { name: "John 3:16" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText(/For God so loved the world/)).toBeVisible();

  await dialog.getByRole("button", { name: "Save", exact: true }).click();
  await expect(dialog.getByRole("button", { name: "Saved", exact: true })).toBeVisible();

  const [popup] = await Promise.all([
    page.waitForEvent("popup"),
    dialog.getByRole("button", { name: "WhatsApp" }).click(),
  ]);
  await expect(popup).toHaveURL(/text=/);
  expect(new URL(popup.url()).searchParams.get("text") ?? "").toContain("John 3:16");
  await popup.close();

  const download = page.waitForEvent("download");
  await dialog.getByRole("button", { name: "Story" }).click();
  expect((await download).suggestedFilename()).toBe("jhn-3-16.png");

  await page.goto("/en/saved");
  await expect(page.getByRole("link", { name: "John 3:16" })).toBeVisible();
  await expect(page.getByText(/For God so loved the world/)).toBeVisible();
  await page.getByRole("button", { name: "Remove John 3:16" }).click();
  await expect(page.getByText("Nothing saved yet")).toBeVisible();
});
