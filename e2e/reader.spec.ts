import { expect, isMobile, test } from "./fixtures";

test.describe("routing", () => {
  test.use({ expectedErrors: [/status of 404/] });

  test("redirects the root to a locale", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/(en|es)$/);
  });

  test("uses Spanish for Spanish-speaking browsers", async ({ browser }) => {
    const context = await browser.newContext({ locale: "es-MX" });
    const page = await context.newPage();
    await page.goto("/");
    await expect(page).toHaveURL(/\/es$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "es");
    await context.close();
  });

  test("returns a real 404 for unknown passages", async ({ page }) => {
    const response = await page.goto("/en/john/99");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  });

  test("links to the privacy policy and terms from the home page", async ({ page }) => {
    await page.goto("/es");
    const legal = page.getByRole("navigation", { name: "Legal" });
    await legal.getByRole("link", { name: "Política de privacidad" }).click();
    await expect(page).toHaveURL(/\/es\/privacy$/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Política de privacidad" }),
    ).toBeVisible();
    const response = await page.goto("/en/terms");
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1, name: "Terms of Service" })).toBeVisible();
  });
});

test.describe("layout", () => {
  for (const path of ["/en", "/es", "/en/john", "/en/psalms/119", "/es/juan/3"]) {
    test(`has no horizontal overflow on ${path}`, async ({ page }) => {
      await page.goto(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }

  test("shows the right navigation chrome for the viewport", async ({ page }) => {
    await page.goto("/en/john/3");
    const sidebar = page.getByRole("navigation", { name: "Books of the Bible" });
    const bottomBar = page.getByRole("navigation", { name: "Primary" });
    if (isMobile(page)) {
      await expect(sidebar).toBeHidden();
      await expect(bottomBar).toBeVisible();
    } else {
      await expect(sidebar).toBeVisible();
      await expect(bottomBar).toBeHidden();
      await expect(sidebar.getByRole("link", { name: "Chapter 3" })).toHaveAttribute(
        "aria-current",
        "page",
      );
    }
  });
});

test.describe("reading", () => {
  test("renders a chapter with verses", async ({ page }) => {
    await page.goto("/en/john/3");
    await expect(page.getByRole("heading", { level: 1, name: "John 3" })).toBeVisible();
    await expect(page.locator("#v16")).toContainText("For God so loved the world");
    await expect(page).toHaveTitle(/John 3 · WEB/);
  });

  test("renders Reina-Valera supplied words in italics", async ({ page }) => {
    await page.goto("/es/genesis/1");
    await expect(page.locator("#v9 em")).toHaveText("están");
  });

  test("scrolls to and highlights a linked verse", async ({ page }) => {
    await page.goto("/en/psalms/119#v105");
    const verse = page.locator("#v105");
    await expect(verse).toBeInViewport();
    await expect(verse).toHaveAttribute("data-highlighted", "true");
  });

  test("moves between chapters", async ({ page }) => {
    await page.goto("/en/genesis/50");
    if (isMobile(page)) {
      await page
        .getByRole("navigation", { name: "Primary" })
        .getByRole("link", { name: "Next chapter" })
        .click();
    } else {
      await page.locator("body").press("ArrowRight");
    }
    await expect(page).toHaveURL(/\/en\/exodus\/1$/);
    await expect(page.getByRole("heading", { level: 1, name: "Exodus 1" })).toBeVisible();

    if (isMobile(page)) {
      await page
        .getByRole("navigation", { name: "Primary" })
        .getByRole("link", { name: "Previous chapter" })
        .click();
    } else {
      await page.locator("body").press("ArrowLeft");
    }
    await expect(page).toHaveURL(/\/en\/genesis\/50$/);
  });

  test("disables previous at the start of the Bible", async ({ page }) => {
    await page.goto("/en/genesis/1");
    const footer = page.getByRole("navigation", { name: "Chapter navigation" });
    await expect(footer.getByRole("link", { name: /Previous chapter/ })).toHaveCount(0);
    await expect(footer.getByRole("link", { name: /Next chapter/ })).toBeVisible();
  });

  test("switches language on the same chapter", async ({ page }) => {
    await page.goto("/en/john/3");
    await page.getByRole("button", { name: /Language/ }).click();
    await page.getByRole("menuitem", { name: "Español" }).click();
    await expect(page).toHaveURL(/\/es\/juan\/3/);
    await expect(page.getByRole("heading", { level: 1, name: "Juan 3" })).toBeVisible();
    await expect(page.locator("#v16")).toContainText("tal manera amó Dios al mundo");
  });

  test("switches language back and forth and stays usable", async ({ page }) => {
    let downloaded = false;
    page.on("download", () => (downloaded = true));
    await page.goto("/en");
    for (const [name, url] of [
      ["Español", /\/es$/],
      ["English", /\/en$/],
      ["Español", /\/es$/],
    ] as const) {
      await page.getByRole("button", { name: /Language|Idioma/ }).click();
      await page.getByRole("menuitem", { name }).click();
      await expect(page).toHaveURL(url);
      await page.waitForSelector("html[data-hydrated]");
    }
    await expect(page.locator("body")).not.toHaveCSS("pointer-events", "none");
    await page.getByRole("link", { name: /Conoce a Jesús primero/ }).click();
    await expect(page).toHaveURL(/\/es\/juan\/1$/);
    expect(downloaded).toBe(false);
  });
});

test.describe("progress", () => {
  test("marks a chapter read at the end and offers to continue", async ({ page }) => {
    await page.goto("/en/jude/1");
    await page.locator("footer").last().scrollIntoViewIfNeeded();
    await expect(page.getByRole("button", { name: "Mark as read" })).toHaveAttribute(
      "aria-pressed",
      "true",
      { timeout: 5000 },
    );

    await page.goto("/en");
    await expect(page.getByText("1 of 1,189 chapters read")).toBeVisible();
    const continueCard = page.getByRole("region", { name: "Continue reading" });
    await expect(continueCard).toContainText("Jude 1");
    await expect(page.getByRole("heading", { name: "Up next" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Where to begin" })).toHaveCount(0);
  });

  test("marks a chapter read when leaving right from its end", async ({ page }) => {
    await page.goto("/en/john/3");
    const chapterNav = page.getByRole("navigation", { name: "Chapter navigation" });
    await chapterNav.scrollIntoViewIfNeeded();
    // Well under the time the end must stay on screen to count while still reading.
    await page.waitForTimeout(300);
    await chapterNav.getByRole("link", { name: /Next chapter/ }).click();
    await expect(page).toHaveURL(/\/en\/john\/4$/);
    await page.goBack();
    await expect(page).toHaveURL(/\/en\/john\/3$/);
    await expect(page.getByRole("button", { name: "Mark as read" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  test("remembers the verse being read", async ({ page }) => {
    await page.goto("/en/psalms/119");
    await page.locator("#v80").evaluate((element) => element.scrollIntoView({ block: "start" }));
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            JSON.parse(localStorage.getItem("bible:progress") ?? "null")?.state?.lastPosition
              ?.verse ?? 0,
        ),
      )
      .toBeGreaterThanOrEqual(78);

    await page.goto("/en");
    const link = page.getByRole("region", { name: "Continue reading" }).getByRole("link");
    await expect(link).toHaveAttribute("href", /\/en\/psalms\/119#v(79|80|81)$/);
    await link.click();
    await expect(page.locator("#v80")).toBeInViewport();
  });

  test("lets the reader unmark a chapter", async ({ page }) => {
    await page.goto("/en/john/1");
    const toggle = page.getByRole("button", { name: "Mark as read" });
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
  });
});

test.describe("search", () => {
  test("jumps to a typed reference", async ({ page }) => {
    await page.goto("/en");
    if (isMobile(page)) {
      await page.getByRole("button", { name: "Search", exact: true }).click();
    } else {
      await page.keyboard.press("ControlOrMeta+k");
    }
    const dialog = page.getByRole("dialog", { name: "Search" });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("combobox").fill("rom 8:28");
    await expect(dialog.getByRole("option", { name: /Romans 8:28/ })).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/en\/romans\/8#v28$/);
    await expect(page.locator("#v28")).toBeInViewport();
  });

  test("understands Spanish book names", async ({ page }) => {
    await page.goto("/es");
    if (isMobile(page)) {
      await page.getByRole("button", { name: "Buscar", exact: true }).click();
    } else {
      await page.keyboard.press("ControlOrMeta+k");
    }
    const dialog = page.getByRole("dialog", { name: "Buscar" });
    await dialog.getByRole("combobox").fill("éxodo 20");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/es\/exodo\/20$/);
  });
});

test.describe("settings", () => {
  async function openSettings(page: import("@playwright/test").Page) {
    if (isMobile(page)) {
      await page
        .getByRole("navigation", { name: "Primary" })
        .getByRole("button", { name: "Settings" })
        .click();
    } else {
      await page.getByRole("button", { name: "Reading settings" }).click();
    }
  }

  test("changes text size and keeps it after reload without a flash", async ({ page }) => {
    await page.goto("/en/john/1");
    await openSettings(page);
    await page.getByRole("button", { name: "Increase text size" }).click();
    await page.getByRole("button", { name: "Increase text size" }).click();
    const size = () =>
      page.evaluate(() => getComputedStyle(document.querySelector(".reader-text")!).fontSize);
    await expect.poll(size).toBe("21px");

    await page.reload({ waitUntil: "commit" });
    await page.waitForSelector(".reader-text");
    expect(await size()).toBe("21px");
  });

  test("shows English and Spanish side by side", async ({ page }) => {
    await page.goto("/en/john/1");
    await openSettings(page);
    await page.getByRole("switch", { name: "Side-by-side English & Spanish" }).click();
    await page.keyboard.press("Escape");
    await expect(page.locator('#v1 p[lang="es"]')).toContainText("EN el principio");
    await expect(page.locator('#v1 p[lang="en"]')).toContainText("In the beginning");
  });

  test("keeps the reader's verse in view when switching to side by side", async ({ page }) => {
    await page.goto("/en/john/3");
    await page.locator("#v20").evaluate((element) => element.scrollIntoView({ block: "start" }));
    await page.waitForTimeout(300);
    // Scrolling up a little brings back the mobile bar, as a reader would.
    await page.evaluate(() => window.scrollBy(0, -40));
    await page.waitForTimeout(700);
    await openSettings(page);
    await page.getByRole("switch", { name: "Side-by-side English & Spanish" }).click();
    await page.keyboard.press("Escape");
    await expect(page.locator('#v20 p[lang="es"]')).toBeVisible();
    const top = () =>
      page.locator("#v20").evaluate((element) => element.getBoundingClientRect().top);
    await expect.poll(top).toBeGreaterThan(0);
    await expect.poll(top).toBeLessThan(400);
  });

  test("switches to the light theme", async ({ page }) => {
    await page.goto("/en");
    await openSettings(page);
    await page
      .getByRole("radio", { name: "Light" })
      .or(page.getByRole("button", { name: "Light" }))
      .click();
    await expect(page.locator("html")).not.toHaveClass(/dark/);
  });
});

test.describe("navigator", () => {
  test("browses to a chapter from the book list", async ({ page }) => {
    await page.goto("/en");
    if (isMobile(page)) {
      await page.getByRole("button", { name: "Browse books" }).click();
    }
    const scope = isMobile(page)
      ? page.getByRole("dialog")
      : page.getByRole("navigation", { name: "Books of the Bible" });
    await scope.getByRole("tab", { name: "New Testament" }).click();
    await scope.getByRole("button", { name: "Mark" }).click();
    await scope.getByRole("link", { name: "Chapter 4", exact: true }).click();
    await expect(page).toHaveURL(/\/en\/mark\/4$/);
    if (isMobile(page)) await expect(page.getByRole("dialog")).toBeHidden();
  });
});

test.describe("mobile chrome", () => {
  test("tucks the header away while reading and brings it back", async ({ page }) => {
    test.skip(!isMobile(page), "mobile only");
    await page.goto("/en/psalms/119");
    const header = page.locator("header").first();
    for (let i = 0; i < 10; i++) await page.evaluate(() => window.scrollBy(0, 150));
    await expect
      .poll(() => header.evaluate((el) => el.getBoundingClientRect().bottom))
      .toBeLessThanOrEqual(0);
    for (let i = 0; i < 4; i++) await page.evaluate(() => window.scrollBy(0, -100));
    await expect.poll(() => header.evaluate((el) => el.getBoundingClientRect().top)).toBe(0);
  });

  test("keeps the bottom bar under a tap that nudges the page", async ({ page }) => {
    test.skip(!isMobile(page), "mobile only");
    await page.goto("/en/john/3");
    const bar = page.getByRole("navigation", { name: "Primary" });
    const onScreen = () =>
      bar.evaluate((el) => el.getBoundingClientRect().top < window.innerHeight - 1);
    const scrollBy = async (y: number) => {
      await page.evaluate((y) => window.scrollBy(0, y), y);
      await page.waitForTimeout(50);
    };

    for (let i = 0; i < 10; i++) await scrollBy(150);
    await expect.poll(onScreen).toBe(false);
    for (let i = 0; i < 3; i++) await scrollBy(-30);
    await expect.poll(onScreen).toBe(true);

    // A finger landing on the bar often drags the page a few pixels.
    await scrollBy(20);
    await page.waitForTimeout(300);
    expect(await onScreen()).toBe(true);
    await bar.getByRole("link", { name: "Previous chapter" }).tap();
    await expect(page).toHaveURL(/\/en\/john\/2$/);
  });
});
