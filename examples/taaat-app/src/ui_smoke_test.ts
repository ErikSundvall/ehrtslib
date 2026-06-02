/**
 * Playwright UI smoke test — requires built bundle and static server on TAAAT_BASE_URL (default http://127.0.0.1:8765).
 * Run: deno test -A --no-check examples/taaat-app/src/ui_smoke_test.ts
 */

import { assert, assertEquals } from "https://deno.land/std@0.220.0/assert/mod.ts";

Deno.test({
  name: "TAAAT UI loads and edits local archetype annotations",
  async fn() {
    const { chromium } = await import("npm:playwright@1.50.1");
    const baseUrl = Deno.env.get("TAAAT_BASE_URL") ?? "http://127.0.0.1:8765";
    const testAdl = await Deno.readTextFile(
      new URL("../../../test_data/adl2/openEHR-TEST_PKG-annotations_overlay.v1.0.0.adls", import.meta.url),
    );

    const browser = await chromium.launch({
      headless: true,
      channel: "chrome",
    });
    const page = await browser.newPage();
    const pageErrors: string[] = [];
    page.on("pageerror", (e) => pageErrors.push(e.message));

    const res = await page.goto(`${baseUrl}/index.html`, { waitUntil: "networkidle" });
    assertEquals(res?.status(), 200);

    await page.waitForSelector("#load-github-btn");
    await page.waitForSelector("#tree-container");

    await page.evaluate(async (adlText: string) => {
      const t = (globalThis as { __TAAAT__?: {
        workspace: { clear: () => void; addFile: (p: string, c: string) => void; setActivePath: (p: string) => void };
        reloadUi: () => void;
      } }).__TAAAT__;
      if (!t) throw new Error("__TAAAT__ not exposed");
      t.workspace.clear();
      t.workspace.addFile("smoke-test.adls", adlText);
      t.workspace.setActivePath("smoke-test.adls");
      t.reloadUi();
    }, testAdl);

    await page.waitForSelector(".definition-tree-svg .node", { timeout: 8000 });

    const nodeCount = await page.locator(".definition-tree-svg .node").count();
    assert(nodeCount >= 1, "expected at least one tree node");

    await page.locator(".definition-tree-svg .node").first().click();
    await page.click("#add-annotation-btn");
    const keyInput = page.locator("#annotation-rows tr:last-child .ann-key");
    const valInput = page.locator("#annotation-rows tr:last-child .ann-value");
    await keyInput.fill("smoke-key");
    await valInput.fill("smoke-value");
    await keyInput.blur();
    await valInput.blur();

    const paletteCount = await page.locator("#palette-list li").count();
    assert(paletteCount >= 1, "palette should list favourites");

    assertEquals(pageErrors.length, 0, `page errors: ${pageErrors.join("; ")}`);
    await browser.close();
  },
});
