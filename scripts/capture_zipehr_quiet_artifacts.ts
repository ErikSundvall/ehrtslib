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

const comp = JSON.parse(
  await Deno.readTextFile(
    new URL("test_data/fixtures/workbench-ferro/02-pain-rich.json", repo),
  ),
);
const html = await serializeToHtml5Variant(
  comp,
  "zipehr.html5.short",
  { layout: "linesaving", propertyMode: "comment" },
);
const composed = await loadComposedQuietCss();
const baseOnly = await loadBaseCss();
const quietDoc = buildZipehrPreviewDocument(html, composed, {
  quietStructureTooltips: true,
});
const beforeDoc = buildZipehrPreviewDocument(html, baseOnly, {
  quietStructureTooltips: false,
});
await Deno.writeTextFile(`${OUT}/zipehr-quiet-preview.html`, quietDoc);

const browser = await chromium.launch();

const beforePage = await browser.newPage({
  viewport: { width: 1200, height: 1000 },
});
await beforePage.setContent(beforeDoc, { waitUntil: "load" });
await beforePage.screenshot({
  path: `${OUT}/zipehr-gp-visit-before-quiet.png`,
  fullPage: true,
});

const desktop = await browser.newPage({
  viewport: { width: 1200, height: 1000 },
});
await desktop.setContent(quietDoc, { waitUntil: "load" });
await desktop.locator("o-co").waitFor();
await desktop.screenshot({
  path: `${OUT}/zipehr-quiet-structure-normal.png`,
  fullPage: true,
});
await desktop.screenshot({
  path: `${OUT}/zipehr-gp-visit-after-quiet.png`,
  fullPage: true,
});

const dateLeaf = desktop.locator('o-dt[data-zs-value*="2021-10-21"]').first();
await dateLeaf.scrollIntoViewIfNeeded();
await dateLeaf.hover();
await desktop.waitForTimeout(250);
await desktop.screenshot({
  path: `${OUT}/zipehr-quiet-structure-hover.png`,
  fullPage: true,
});

const mobile = await browser.newPage({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
});
await mobile.setContent(quietDoc, { waitUntil: "load" });
const mobileDate = mobile.locator('o-dt[data-zs-value*="2021-10-21"]').first();
await mobileDate.scrollIntoViewIfNeeded();
await mobileDate.click();
await mobile.waitForTimeout(250);
await mobile.screenshot({
  path: `${OUT}/zipehr-quiet-structure-mobile-tap.png`,
  fullPage: true,
});

await browser.close();
console.log("Wrote zipehr quiet artifacts to", OUT);