/**
 * ZipEHR quiet-structure walkthrough screenshots for PR evidence.
 * deno run --allow-read --allow-write --allow-env scripts/capture_zipehr_quiet_artifacts.ts
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

const comp = JSON.parse(
  await Deno.readTextFile(
    new URL("test_data/fixtures/workbench-ferro/01-demo-1998.json", repo),
  ),
);
const html = await serializeToHtml5Variant(
  comp,
  "zipehr.html5.short",
  { layout: "linesaving", propertyMode: "comment" },
);
const css = await loadComposedQuietCss();
const doc = buildZipehrPreviewDocument(html, css, {
  quietStructureTooltips: true,
});
await Deno.writeTextFile(`${OUT}/zipehr-quiet-preview.html`, doc);

const browser = await chromium.launch();

const desktop = await browser.newPage({
  viewport: { width: 1200, height: 1000 },
});
await desktop.setContent(doc, { waitUntil: "load" });
await desktop.locator("button.zipehr-structure-anchor").first().waitFor();
await desktop.screenshot({
  path: `${OUT}/zipehr-quiet-structure-normal.png`,
  fullPage: true,
});

const history = desktop.locator(
  'button.zipehr-structure-anchor[aria-label="Structure: History"]',
).first();
await history.scrollIntoViewIfNeeded();
await history.hover();
await desktop.waitForFunction(() => {
  const tip = document.querySelector(
    'button.zipehr-structure-anchor[aria-label="Structure: History"] .zipehr-structure-tip',
  );
  if (!tip) return false;
  return getComputedStyle(tip).display !== "none";
});
await desktop.screenshot({
  path: `${OUT}/zipehr-quiet-structure-hover.png`,
  fullPage: true,
});

const mobile = await browser.newPage({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
});
await mobile.setContent(doc, { waitUntil: "load" });
const tree = mobile.locator(
  'button.zipehr-structure-anchor[aria-label="Structure: Tree"]',
).first();
await tree.scrollIntoViewIfNeeded();
await tree.click();
await mobile.waitForFunction(() =>
  document.querySelector(
    'button.zipehr-structure-anchor[aria-label="Structure: Tree"].zipehr-tip-pinned',
  )
);
await mobile.screenshot({
  path: `${OUT}/zipehr-quiet-structure-mobile-tap.png`,
  fullPage: true,
});

await browser.close();
console.log("Wrote zipehr quiet artifacts to", OUT);