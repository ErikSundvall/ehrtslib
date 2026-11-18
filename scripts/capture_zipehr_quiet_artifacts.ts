/**
 * ZipEHR quiet-structure walkthrough screenshots for PR evidence.
 * deno run --allow-read --allow-write --allow-env --allow-ffi --allow-net --allow-sys --allow-run scripts/capture_zipehr_quiet_artifacts.ts
 */
import { chromium } from "npm:playwright@1.50.1";
import {
  composeQuietStructureCss,
  ZIP_QUIET_STRUCTURE_CSS,
  buildZipehrPreviewDocument,
} from "../serialization/zipehr/css/compose_quiet_css.ts";
import { serializeToHtml5Variant } from "../serialization/zipehr/mod.ts";

const OUT = "/opt/cursor/artifacts";
const repo = new URL("../", import.meta.url);

async function loadComposedQuietCss(): Promise<string> {
  const base = await Deno.readTextFile(
    new URL("serialization/zipehr/css/zipehr-html5-short.css", repo),
  );
  const quiet = await Deno.readTextFile(
    new URL(
      "examples/demo-app/public/zipehr-css/" + ZIP_QUIET_STRUCTURE_CSS,
      repo,
    ),
  );
  return composeQuietStructureCss(base, quiet);
}

async function loadBaseCss(): Promise<string> {
  return await Deno.readTextFile(
    new URL("serialization/zipehr/css/zipehr-html5-short.css", repo),
  );
}

const FERRO_OPT_XML = await Deno.readTextFile(
  new URL(
    "test_data/fixtures/ferroehr/thumb-pain-encounter.v2-coded.opt",
    repo,
  ),
);

const HTML5_OPTS = {
  layout: "linesaving" as const,
  propertyMode: "comment" as const,
  template: FERRO_OPT_XML,
};

async function buildDocs(comp: unknown) {
  const html = await serializeToHtml5Variant(
    comp,
    "zipehr.html5.short",
    HTML5_OPTS,
  );
  const composed = await loadComposedQuietCss();
  const baseOnly = await loadBaseCss();
  return {
    html,
    quietDoc: buildZipehrPreviewDocument(html, composed, {
      quietStructureTooltips: true,
    }),
    beforeDoc: buildZipehrPreviewDocument(html, baseOnly, {
      quietStructureTooltips: false,
    }),
  };
}

async function screenshotHoverClip(
  page: import("playwright").Page,
  locator: import("playwright").Locator,
  path: string,
) {
  await locator.scrollIntoViewIfNeeded();
  await locator.hover({ force: true });
  await page.waitForTimeout(350);
  const box = await locator.boundingBox();
  if (!box) throw new Error(`no box for ${path}`);
  await page.screenshot({
    path,
    clip: {
      x: Math.max(0, box.x - 12),
      y: Math.max(0, box.y - 8),
      width: Math.min(520, box.width + 320),
      height: Math.min(120, box.height + 72),
    },
  });
}

const painRich = JSON.parse(
  await Deno.readTextFile(
    new URL("test_data/fixtures/workbench-ferro/02-pain-rich.json", repo),
  ),
);
const gpEn = JSON.parse(
  await Deno.readTextFile(
    new URL("test_data/fixtures/workbench-ferro/gp-visit-full-en.json", repo),
  ),
);
const gpSv = JSON.parse(
  await Deno.readTextFile(
    new URL("test_data/fixtures/workbench-ferro/gp-visit-full-sv.json", repo),
  ),
);

const { quietDoc: gpQuiet, beforeDoc: gpBefore } = await buildDocs(gpEn);
const { quietDoc: svQuiet } = await buildDocs(gpSv);

await Deno.writeTextFile(`${OUT}/zipehr-quiet-preview.html`, gpQuiet);

const browser = await chromium.launch();

const beforePage = await browser.newPage({ viewport: { width: 1280, height: 1100 } });
await beforePage.setContent(gpBefore, { waitUntil: "load" });
await beforePage.screenshot({
  path: `${OUT}/zipehr-gp-visit-before-quiet.png`,
  fullPage: true,
});

const desktop = await browser.newPage({ viewport: { width: 1280, height: 1100 } });
await desktop.setContent(gpQuiet, { waitUntil: "load" });
await desktop.locator("o-se").filter({ hasText: "Examination" }).first().waitFor();
await desktop.screenshot({
  path: `${OUT}/zipehr-gp-visit-after-quiet.png`,
  fullPage: true,
});
const { quietDoc: painQuiet } = await buildDocs(painRich);
const painPage = await browser.newPage({ viewport: { width: 960, height: 800 } });
await painPage.setContent(painQuiet, { waitUntil: "load" });
const historySection = painPage.locator("o-se").filter({ hasText: "History" }).first();
await historySection.scrollIntoViewIfNeeded();
await historySection.screenshot({
  path: `${OUT}/zipehr-quiet-html-passthrough-hide.png`,
});
const hasHiddenClinergy = await painPage.locator(
  '[data-antn-hide-on-form="true"]',
).count();
const visibleClinergyLabel = await painPage
  .locator('[data-antn-hide-on-form="true"]')
  .first()
  .evaluate((el) => getComputedStyle(el).display)
  .catch(() => "missing");
await Deno.writeTextFile(
  `${OUT}/zipehr-html-passthrough-hide-evidence.txt`,
  `[data-antn-hide-on-form="true"] count (02-pain-rich + OPT): ${hasHiddenClinergy}\n` +
    `computed display on first: ${visibleClinergyLabel}\n`,
);
await painPage.close();
await desktop.screenshot({
  path: `${OUT}/zipehr-quiet-structure-normal.png`,
  fullPage: true,
});

const ctxDate = desktop.locator('o-ec o-dt[data-zs-value*="T14:21"]').first();
await screenshotHoverClip(
  desktop,
  ctxDate,
  `${OUT}/zipehr-quiet-datetime-iso-hover.png`,
);

const structAnchor = desktop.locator(
  'button.zipehr-structure-anchor[aria-label*="Tree"]',
).first();
await screenshotHoverClip(
  desktop,
  structAnchor,
  `${OUT}/zipehr-quiet-structure-heading-hover.png`,
);

await Deno.copyFile(
  `${OUT}/zipehr-quiet-datetime-iso-hover.png`,
  `${OUT}/zipehr-quiet-structure-hover.png`,
);

const svPage = await browser.newPage({ viewport: { width: 1280, height: 1100 } });
await svPage.setContent(svQuiet, { waitUntil: "load" });
await svPage.locator("o-co[lang='sv']").waitFor();
await svPage.screenshot({
  path: `${OUT}/zipehr-gp-visit-quiet-sv.png`,
  fullPage: true,
});

const mobile = await browser.newPage({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
});
await mobile.setContent(gpQuiet, { waitUntil: "load" });
const mobileDate = mobile.locator('o-ec o-dt[data-zs-value*="T14:21"]').first();
await mobileDate.scrollIntoViewIfNeeded();
await mobileDate.tap();
await mobile.waitForTimeout(350);
await screenshotHoverClip(mobile, mobileDate, `${OUT}/zipehr-quiet-structure-mobile-tap.png`);

await browser.close();
console.log("Wrote zipehr quiet artifacts to", OUT);