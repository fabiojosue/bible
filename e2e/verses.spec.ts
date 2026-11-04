import { expect, test } from "./fixtures";

test("keeps a verse selected, saves it, and shares it", async ({ page }) => {
  await page.goto("/en/john/3");
  const verse = page.locator("[data-verse='16']");
  await verse.click();
  await expect(verse).toHaveAttribute("data-selected", "true");

  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByRole("button", { name: "Saved", exact: true })).toBeVisible();

  const [popup] = await Promise.all([
    page.waitForEvent("popup"),
    page.getByRole("button", { name: "WhatsApp" }).click(),
  ]);
  await expect(popup).toHaveURL(/text=/);
  expect(new URL(popup.url()).searchParams.get("text") ?? "").toContain("John 3:16");
  await popup.close();

  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Story" }).click();
  expect((await download).suggestedFilename()).toBe("jhn-3-16.png");

  await page.goto("/en/saved");
  await expect(page.getByRole("link", { name: "John 3:16" })).toBeVisible();
  await expect(page.getByText(/For God so loved the world/)).toBeVisible();
  await page.getByRole("button", { name: "Remove John 3:16" }).click();
  await expect(page.getByText("Nothing saved yet")).toBeVisible();
});
