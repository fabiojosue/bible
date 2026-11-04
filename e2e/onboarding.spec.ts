import { expect, test } from "./fixtures";

test.use({ withTour: true });

test("guides first-time visitors once", async ({ page }) => {
  await page.goto("/en/john/3");
  const tour = page.getByRole("dialog", { name: "Welcome" });
  await expect(tour).toBeVisible();

  const steps = Number(
    (await page.getByText(/^Step 1 of \d+$/).textContent())!.match(/of (\d+)/)![1],
  );
  for (let step = 1; step < steps; step++) {
    const card = page.getByRole("dialog");
    await expect(card).toBeInViewport({ ratio: 1 });
    await card.getByRole("button", { name: "Next" }).click();
    await expect(page.getByText(`Step ${step + 1} of ${steps}`)).toBeVisible();
  }
  await page.getByRole("button", { name: "Start reading" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();

  await page.reload();
  await page.waitForTimeout(1500);
  await expect(page.getByRole("dialog")).toBeHidden();
});

test("can be skipped with Escape and replayed from search", async ({ page }) => {
  await page.goto("/en");
  await expect(page.getByRole("dialog", { name: "Welcome" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();

  await page
    .getByRole("button", { name: /Search/ })
    .first()
    .click();
  await page.getByRole("option", { name: "Show the quick tour again" }).click();
  await expect(page.getByRole("dialog", { name: "Welcome" })).toBeVisible();
});

test("spotlights only visible targets", async ({ page }) => {
  await page.goto("/en/john/3");
  await expect(page.getByRole("dialog", { name: "Welcome" })).toBeVisible();
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: "Next" }).click();
  // The spotlight should sit on a rendered element, never at the origin of a hidden one.
  const box = await page.locator("[aria-hidden].ring-2").boundingBox();
  expect(box && box.width > 20 && box.height > 20).toBeTruthy();
});

test("continues in the language picked on the first step", async ({ page }) => {
  await page.goto("/en/john/3");
  const tour = page.getByRole("dialog", { name: "Welcome" });
  await expect(tour).toBeVisible();
  await tour.getByRole("button", { name: "Español" }).click();
  await expect(page).toHaveURL(/\/es\/juan\/3$/);
  const resumed = page.getByRole("dialog", { name: "Un recorrido rápido" });
  await expect(resumed).toBeVisible();
  await expect(page.locator("html")).not.toHaveAttribute("data-tour-resume");

  // The card appears in place rather than gliding in from a corner.
  const position = () => resumed.evaluate((card) => card.getBoundingClientRect().left);
  const appearedAt = await position();
  await page.waitForTimeout(400);
  expect(await position()).toBe(appearedAt);
});
