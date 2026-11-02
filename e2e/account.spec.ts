import { expect, test } from "./fixtures";

const PASSWORD = "correct horse battery staple";

test.describe("account sync", () => {
  // Sign-ins are rate limited per address, so only one project exercises them.
  test.skip(({ isMobile }) => isMobile, "Runs once, on desktop");

  test("syncs progress to another device and deletes the account", async ({ page, browser }) => {
    const email = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;

    await page.goto("/en/jude/1");
    const toggle = page.getByRole("button", { name: "Mark as read" });
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-pressed", "true");

    await page.getByRole("banner").getByRole("link", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/en\/sign-in\?next=%2Fjude%2F1$/);
    await page.waitForSelector("html[data-hydrated]", { state: "attached" });
    await page.getByRole("tab", { name: "Create account" }).click();
    await page.getByLabel("Name").fill("E2E Reader");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page).toHaveURL(/\/en\/jude\/1$/);
    await expect(page.getByRole("button", { name: "Account: E2E Reader" })).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(
          () => JSON.parse(localStorage.getItem("bible:sync") ?? "null")?.state?.pushedUpTo ?? 0,
        ),
      )
      .toBeGreaterThan(0);

    const other = await browser.newContext();
    await other.addInitScript(() =>
      localStorage.setItem(
        "bible:onboarding",
        JSON.stringify({ state: { completedAt: 1 }, version: 1 }),
      ),
    );
    const device = await other.newPage();
    await device.goto("/en/sign-in");
    await device.waitForSelector("html[data-hydrated]", { state: "attached" });
    await device.getByLabel("Email").fill(email);
    await device.getByLabel("Password").fill(PASSWORD);
    await device.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(device).toHaveURL(/\/en$/);
    await expect(device.getByText("1 of 1,189 chapters read")).toBeVisible();
    await expect(device.getByText(`Your progress syncs with ${email}.`)).toBeVisible();

    await device.getByRole("button", { name: "Account: E2E Reader" }).click();
    await device.getByRole("menuitem", { name: "Delete account" }).click();
    await device.getByRole("alertdialog").getByRole("button", { name: "Delete account" }).click();
    await expect(device.getByText("Your account was deleted.")).toBeVisible();
    await expect(device.getByRole("banner").getByRole("link", { name: "Sign in" })).toBeVisible();
    // Progress on the device stays after the account is gone.
    await expect(device.getByText("1 of 1,189 chapters read")).toBeVisible();
    await other.close();
  });

  test.describe(() => {
    test.use({ expectedErrors: [/status of 401/] });

    test("explains a wrong password", async ({ page }) => {
      await page.goto("/en/sign-in");
      await page.getByLabel("Email").fill("nobody@example.com");
      await page.getByLabel("Password").fill("not the password");
      await page.getByRole("button", { name: "Sign in", exact: true }).click();
      await expect(page.getByText("Wrong email or password.")).toBeVisible();
    });
  });
});
