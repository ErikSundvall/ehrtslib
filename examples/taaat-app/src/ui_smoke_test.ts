/**
 * Playwright UI smoke test — requires built bundle and static server on TAAAT_BASE_URL (default http://127.0.0.1:8765).
 * Run: deno test -A --no-check examples/taaat-app/src/ui_smoke_test.ts
 */

import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.220.0/assert/mod.ts";

type TaaatHarness = {
  workspace: {
    clear: () => void;
    addFile: (p: string, c: string) => void;
    setActivePath: (p: string) => void;
  };
  reloadUi: () => void;
  getActiveResource: () => {
    annotations?: {
      documentation?: Record<
        string,
        Record<string, Record<string, string>>
      >;
    };
  };
};

async function loadAdl(
  page: {
    evaluate: (
      fn: (arg: { text: string; name: string }) => void,
      arg: { text: string; name: string },
    ) => Promise<unknown>;
  },
  adlText: string,
  filename: string,
) {
  await page.evaluate(({ text, name }) => {
    const t = (globalThis as { __TAAAT__?: TaaatHarness }).__TAAAT__;
    if (!t) throw new Error("__TAAAT__ not exposed");
    t.workspace.clear();
    t.workspace.addFile(name, text);
    t.workspace.setActivePath(name);
    t.reloadUi();
  }, { text: adlText, name: filename });
}

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
    const langsAdl = await Deno.readTextFile(
      new URL(
        "../../../test_data/adl2/openEHR-TEST_PKG-taaat_langs.v1.0.0.adls",
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

    await page.waitForFunction(() => !!customElements.get("sl-button"));
    await page.waitForSelector("#load-github-btn");
    await page.waitForSelector("#download-file-btn");
    await page.waitForSelector("#github-commit-btn");
    await page.waitForSelector("#github-token");
    await page.waitForSelector("#tree-container");
    await page.waitForSelector("#facet-legend");
    await page.waitForSelector("#copy-original-btn");
    assertEquals(await page.locator("#add-language").count(), 0);

    await loadAdl(page, testAdl, "smoke-test.adls");

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
    assert(
      (await page.locator(".ann-pill.is-original").count()) >= 1,
      "original-language pills use a thicker outline class",
    );
    assertEquals(
      await page.locator("#legend-languages .legend-chip.is-original").count(),
      1,
    );
    assertEquals(
      (await page.locator("#legend-languages .legend-chip.is-original")
        .textContent())?.trim(),
      "en",
    );
    assert(
      (await page.locator(".lang-swatch.is-original").count()) >= 1,
      "inspector original-language column uses a thicker swatch",
    );
    assert(
      await page.locator("#copy-original-btn").evaluate((el) =>
        Boolean((el as HTMLElement & { disabled: boolean }).disabled)
      ),
      "copy is disabled when the model has only the original language",
    );

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

    await loadAdl(page, langsAdl, "taaat-langs.adls");
    await page.waitForSelector(".legend-chip.legend-lang");
    const multiLabels = (await page.locator("#legend-languages .legend-chip")
      .allTextContents()).map((t) => t.trim());
    assertEquals(multiLabels[0], "en");
    assert(multiLabels.includes("sv"), "sv translation should appear");
    assertEquals(
      await page.locator("#legend-languages .legend-chip.is-original")
        .count(),
      1,
    );
    assert(
      !(await page.locator("#copy-original-btn").evaluate((el) =>
        Boolean((el as HTMLElement & { disabled: boolean }).disabled)
      )),
      "copy is enabled when a non-original language exists",
    );

    await page.locator("#copy-original-btn").click();
    await page.waitForSelector("sl-dialog.copy-original-dialog[open]");
    await page.waitForSelector(".copy-item-list sl-checkbox");
    const boxCount = await page.locator(".copy-item-list sl-checkbox").count();
    assertEquals(boxCount, 3);
    const checkedStart = await page.locator(".copy-item-list sl-checkbox")
      .evaluateAll((els) =>
        els.map((el) => ({
          text: (el.textContent ?? "").trim(),
          checked: Boolean((el as HTMLElement & { checked: boolean }).checked),
        }))
      );
    assertEquals(
      checkedStart.filter((c) =>
        c.text.includes("a.id") || c.text.includes("a.rule")
      )
        .every((c) => c.checked),
      true,
    );
    assertEquals(
      checkedStart.find((c) => c.text.includes("comment"))?.checked,
      false,
    );

    await page.locator("#copy-select-all").click();
    const afterAll = await page.locator(".copy-item-list sl-checkbox")
      .evaluateAll((els) =>
        els.every((el) => (el as HTMLElement & { checked: boolean }).checked)
      );
    assertEquals(afterAll, true);

    await page.locator("#copy-select-none").click();
    const afterNone = await page.locator(".copy-item-list sl-checkbox")
      .evaluateAll((els) =>
        els.every((el) => !(el as HTMLElement & { checked: boolean }).checked)
      );
    assertEquals(afterNone, true);

    const aFamily = page.locator("sl-details.copy-family", { hasText: "a." });
    await aFamily.locator("sl-button", { hasText: "All in family" }).click();
    const aChecked = await aFamily.locator("sl-checkbox").evaluateAll((els) =>
      els.every((el) => (el as HTMLElement & { checked: boolean }).checked)
    );
    assertEquals(aChecked, true);
    const commentChecked = await page.locator(".copy-item-list sl-checkbox")
      .evaluateAll((els) =>
        els.some((el) =>
          (el.textContent ?? "").includes("comment") &&
          (el as HTMLElement & { checked: boolean }).checked
        )
      );
    assertEquals(commentChecked, false);

    await page.locator("#copy-original-apply").click();
    await page.waitForFunction(() => {
      const dlg = document.querySelector("sl-dialog.copy-original-dialog");
      return !dlg?.hasAttribute("open");
    });

    const copied = await page.evaluate(() => {
      const t = (globalThis as { __TAAAT__?: TaaatHarness }).__TAAAT__;
      const doc = t?.getActiveResource()?.annotations?.documentation;
      return {
        id: doc?.sv?.["/data[id2]"]?.["a.id"],
        rule: doc?.sv?.["/data[id2]"]?.["a.rule"],
        comment: doc?.sv?.["/data[id2]"]?.comment,
        enComment: doc?.en?.["/data[id2]"]?.comment,
      };
    });
    assertEquals(copied.id, "encounter-form");
    assertEquals(copied.rule, "show-when-adult");
    assertEquals(copied.comment, undefined);
    assertEquals(copied.enComment, "author note in English");

    assertEquals(pageErrors.length, 0, `page errors: ${pageErrors.join("; ")}`);
    await browser.close();
  },
});
