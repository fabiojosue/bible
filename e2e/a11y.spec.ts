import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./fixtures";

const PAGES = [
  "/en",
  "/es",
  "/en/genesis",
  "/en/john/3",
  "/es/salmos/23",
  "/en/privacy",
  "/es/terms",
  "/en/sign-in",
  "/es/sign-in",
  "/en/saved",
];

for (const path of PAGES) {
  for (const theme of ["dark", "light"] as const) {
    test(`${path} has no accessibility violations (${theme})`, async ({ page }) => {
      await page.addInitScript((value) => localStorage.setItem("theme", value), theme);
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(
        results.violations.map(
          (v) =>
            `${v.id}: ${v.nodes.map((n) => `${n.target.join(" ")} (${n.failureSummary})`).join("; ")}`,
        ),
      ).toEqual([]);
    });
  }
}

test("search dialog is accessible", async ({ page }) => {
  await page.goto("/en/john/3");
  await page
    .getByRole("button", { name: /^Search/ })
    .filter({ visible: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  const results = await new AxeBuilder({ page }).include("[role=dialog]").analyze();
  expect(results.violations.map((v) => v.id)).toEqual([]);
});
