/**
 * Quiet-structure CSS: base + overrides, structural spans in markup, oneliner/linesaving.
 */
import {
  assert,
  assertEquals,
  assertStringIncludes,
} from "https://deno.land/std@0.220.0/assert/mod.ts";
import { Window } from "npm:happy-dom@21.0.4";
import {
  composeQuietStructureCss,
  ZIP_QUIET_STRUCTURE_CSS,
} from "../../../serialization/zipehr/css/compose_quiet_css.ts";
import { serializeToHtml5Variant } from "../../../serialization/zipehr/mod.ts";
function buildZipehrDocumentHtml(markup: string, css: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${markup}</body></html>`;
}

const cssDir = new URL("../../../serialization/zipehr/css/", import.meta.url);
const publicCssDir = new URL(
  "../../../examples/demo-app/public/zipehr-css/",
  import.meta.url,
);

async function loadComposedQuietCss(dialectFile = "zipehr-html5-short.css") {
  const base = await Deno.readTextFile(new URL(dialectFile, cssDir));
  const quiet = await Deno.readTextFile(
    new URL(ZIP_QUIET_STRUCTURE_CSS, publicCssDir),
  );
  return composeQuietStructureCss(base, quiet);
}

const DEMO_COMPOSITION = JSON.parse(
  await Deno.readTextFile(
    new URL("../../fixtures/workbench-ferro/01-demo-1998.json", import.meta.url),
  ),
) as Record<string, unknown>;

Deno.test("quiet CSS compose layers short base (block layout rules present)", async () => {
  const css = await loadComposedQuietCss();
  assertStringIncludes(css, "o-co {");
  assertStringIncludes(css, "display: block");
  assertStringIncludes(css, ".zs-structural-label");
  assertEquals(css.includes("@import"), false);
});

for (const layout of ["linesaving", "oneliner"] as const) {
  Deno.test(`quiet markup: structural label in span, clinical names visible (${layout})`, async () => {
    const html = await serializeToHtml5Variant(
      DEMO_COMPOSITION,
      "zipehr.html5.short",
      { layout, propertyMode: "comment" },
    );
  assert(html.includes('class="zs-structural-label"'));
  assert(html.includes('data-zs-quiet-heading'));
  assertStringIncludes(html, "Story");
  assertStringIncludes(html, "Symptom/Sign");
  const spanTree = html.match(
    /<span class="zs-structural-label">Tree<\/span>/,
  );
  assert(spanTree, "Tree must be in structural span");
  assert(
    !html.includes(">Tree</o-tr>") && !html.includes(">Tree\n"),
    "Tree must not be bare leading text on ITEM_TREE",
  );
  });
}

Deno.test("quiet preview DOM: structural span present, hiding CSS applied", async () => {
  const html = await serializeToHtml5Variant(
    DEMO_COMPOSITION,
    "zipehr.html5.short",
    { layout: "linesaving", propertyMode: "comment" },
  );
  const css = await loadComposedQuietCss();
  const docHtml = buildZipehrDocumentHtml(html, css);
  const win = new Window({ url: "http://127.0.0.1/" });
  win.document.write(docHtml);
  const labels = win.document.querySelectorAll(".zs-structural-label");
  assert(labels.length > 0, "expected quiet structural labels");
  const clinical = win.document.querySelector("o-e");
  assert(clinical, "expected clinical element");
  assert(
    (clinical?.textContent ?? "").includes("Story"),
    "clinical label text should remain in document",
  );
  const style = win.getComputedStyle(labels[0] as Element);
  assert(
    style.position === "absolute" || style.clip !== "auto" ||
      style.overflow === "hidden",
    "structural label should be visually hidden by default",
  );
});