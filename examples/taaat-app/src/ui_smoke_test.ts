/**
 * Playwright UI smoke test — requires built bundle and static server on TAAAT_BASE_URL (default http://127.0.0.1:8765).
 * Run: deno test -A --no-check examples/taaat-app/src/ui_smoke_test.ts
 */

import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.220.0/assert/mod.ts";

Deno.test({
  name: "TAAAT UI loads outline, pills, and family accordion",
  async fn() {
    const { chromium } = await import("npm:playwright@1.50.1");
    const baseUrl = Deno.env.get("TAAAT_BASE_URL") ?? "http://127.0.0.1:8765";
    const testAdl = await Deno.readTextFile(
      new URL(
        "../../../test_data/adl2/openEHR-TEST_PKG-annotations_overlay.v1.0.0.adls",
        import.meta.url,
      ),
    );

    const browser = await chromium.launch({
      headless: true,
      channel: "chrome",
    });
    const page = await browser.newPage();
    const pageErrors: string[] = [];
    page.on("pageerror", (e) => pageErrors.push(e.message));

    const res = await page.goto(`${baseUrl}/index.html`, {
      waitUntil: "networkidle",
    });
    assertEquals(res?.status(), 200);

    await page.waitForFunction(() =>
      !!customElements.get("sl-button") && !!customElements.get("sl-details")
    );
    await page.waitForSelector("#load-github-btn");
    await page.waitForSelector("#tree-container");
    await page.waitForSelector("#facet-legend");
    assertEquals(await page.locator("#add-language").count(), 0);

    await page.evaluate((adlText: string) => {
      const t = (globalThis as {
        __TAAAT__?: {
          workspace: {
            clear: () => void;
            addFile: (p: string, c: string) => void;
            setActivePath: (p: string) => void;
          };
          reloadUi: () => void;
        };
      }).__TAAAT__;
      if (!t) throw new Error("__TAAAT__ not exposed");
      t.workspace.clear();
      t.workspace.addFile("smoke-test.adls", adlText);
      t.workspace.setActivePath("smoke-test.adls");
      t.reloadUi();
    }, testAdl);

    await page.waitForSelector(".outline-row", { timeout: 8000 });
    const nodeCount = await page.locator(".outline-row").count();
    assert(nodeCount >= 1, "expected at least one outline row");

    await page.locator(".outline-row").first().click();
    await page.waitForSelector("sl-details.family-acc");
    const famCount = await page.locator("sl-details.family-acc").count();
    assert(famCount >= 3, "expected L10n, a., and unprefixed family sections");

    const l10nAdd = page.locator("sl-details.family-acc").first().locator(
      "sl-button",
      { hasText: "Add key" },
    );
    await l10nAdd.click();
    const valInput = page.locator("sl-details.family-acc").first().locator(
      "tbody sl-input",
    ).nth(1);
    await valInput.evaluate((el, value) => {
      const input = el as HTMLElement & { value: string };
      input.value = value;
      el.dispatchEvent(new CustomEvent("sl-change", { bubbles: true }));
    }, "smoke-l10n");

    await page.waitForSelector(".ann-pill");
    const pillCount = await page.locator(".ann-pill").count();
    assert(pillCount >= 1, "expected annotation pills on the tree row");

    const legendLangs = await page.locator("#legend-languages .legend-chip")
      .count();
    assert(legendLangs >= 1, "language legend should list bags");
    const langLabels = await page.locator("#legend-languages .legend-chip")
      .allTextContents();
    assert(
      langLabels.some((t) => t.trim() === "en"),
      "smoke archetype original_language en should appear in the legend",
    );
    assert(
      !langLabels.some((t) => t.trim() === "sv"),
      "language bags cannot be added; sv is not on the smoke archetype",
    );

    const l10nChip = page.locator("#legend-families .legend-chip").first();
    await l10nChip.click();
    assertEquals(await l10nChip.getAttribute("aria-pressed"), "false");
    assertEquals(await page.locator(".ann-pill").count(), 0);

    await l10nChip.click();
    assertEquals(await l10nChip.getAttribute("aria-pressed"), "true");
    assert((await page.locator(".ann-pill").count()) >= 1);

    const paletteCount = await page.locator("#palette-list li").count();
    assert(paletteCount >= 1, "palette should list favourites");

    const l10nHref = await page.locator(".legend-refs a").first().getAttribute(
      "href",
    );
    assert(
      l10nHref?.includes("2760") === true,
      "legend should cite L10n discourse post",
    );
    const hintsHref = await page.locator(".legend-refs a").nth(1).getAttribute(
      "href",
    );
    assert(
      hintsHref?.includes("2406") === true,
      "legend should cite UI-hints post 19",
    );

    assertEquals(pageErrors.length, 0, `page errors: ${pageErrors.join("; ")}`);
    await browser.close();
  },
});
