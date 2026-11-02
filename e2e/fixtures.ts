import { test as base, expect, type Page } from "@playwright/test";

export const isMobile = (page: Page) => (page.viewportSize()?.width ?? 1440) < 1024;

interface Options {
  /** Run with the first-visit tour enabled. */
  withTour: boolean;
  /** Console errors that are expected for a test, e.g. the 404 of a missing page. */
  expectedErrors: RegExp[];
}

/** Skips the first-visit tour unless a test opts in, and fails on any page error. */
export const test = base.extend<Options>({
  withTour: [false, { option: true }],
  expectedErrors: [[], { option: true }],
  page: async ({ page, withTour, expectedErrors }, use) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    if (!withTour) {
      await page.addInitScript(() => {
        if (!localStorage.getItem("bible:onboarding")) {
          localStorage.setItem(
            "bible:onboarding",
            JSON.stringify({ state: { completedAt: 1 }, version: 1 }),
          );
        }
      });
    }

    // Wait for hydration so client-side handlers are attached before interacting.
    const goto = page.goto.bind(page);
    page.goto = async (url, options) => {
      const response = await goto(url, options);
      if (!options?.waitUntil && (response?.status() ?? 200) < 400) {
        await page.waitForSelector("html[data-hydrated]", { state: "attached" });
      }
      return response;
    };
    const reload = page.reload.bind(page);
    page.reload = async (options) => {
      const response = await reload(options);
      if (!options?.waitUntil)
        await page.waitForSelector("html[data-hydrated]", { state: "attached" });
      return response;
    };

    await use(page);
    const unexpected = errors.filter(
      (error) => !expectedErrors.some((pattern) => pattern.test(error)),
    );
    expect(unexpected, "page errors / console errors").toEqual([]);
  },
});

export { expect };
