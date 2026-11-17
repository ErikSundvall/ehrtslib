/**
 * Quiet-structure CSS: composed base + overrides, anchor tooltips, DOM hiding.
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
  ZIP_QUIET_PREVIEW_SCRIPT,
  buildZipehrPreviewDocument,
} from "../../../serialization/zipehr/css/compose_quiet_css.ts";
import { serializeToHtml5Variant } from "../../../serialization/zipehr/mod.ts";

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

const GP_VISIT = JSON.parse(
  await Deno.readTextFile(
    new URL("../../fixtures/workbench-ferro/02-pain-rich.json", import.meta.url),
  ),
) as Record<string, unknown>;

const FERRO_WT = JSON.parse(
  await Deno.readTextFile(
    new URL("../../fixtures/ferroehr/ferro-flat/wt.json", import.meta.url),
  ),
);

const CLINERGY_HIDE_ANNOT = JSON.parse(
  await Deno.readTextFile(
    new URL(
      "../../fixtures/workbench-ferro/clinergy-hide-on-form-annotations.json",
      import.meta.url,
    ),
  ),
);

function openQuietPreview(html: string, css: string): Window {
  const docHtml = buildZipehrPreviewDocument(html, css, {
    quietStructureTooltips: false,
  });
  const win = new Window({ url: "http://127.0.0.1/" });
  win.document.write(docHtml);
  win.eval(ZIP_QUIET_PREVIEW_SCRIPT);
  return win;
}

Deno.test("quiet CSS compose layers short base (block layout rules present)", async () => {
  const css = await loadComposedQuietCss();
  assertStringIncludes(css, "o-co {");
  assertStringIncludes(css, "display: block");
  assertStringIncludes(css, ".zipehr-structure-anchor");
  assertEquals(css.includes("@import"), false);
});

for (const layout of ["linesaving", "oneliner"] as const) {
  Deno.test(`quiet markup: structural span in source, clinical names in HTML (${layout})`, async () => {
    const html = await serializeToHtml5Variant(
      DEMO_COMPOSITION,
      "zipehr.html5.short",
      { layout, propertyMode: "comment" },
    );
    assert(html.includes('class="zs-structural-label"'));
    assert(html.includes("data-zs-quiet-heading"));
    assertStringIncludes(html, "Story");
    assertStringIncludes(html, "Symptom/Sign");
    const spanTree = html.match(
      /<span class="zs-structural-label">Tree<\/span>/,
    );
    assert(spanTree, "Tree must be in structural span");
  });
}

Deno.test("quiet preview DOM: anchors present, structural labels hidden, clinical visible", async () => {
  const html = await serializeToHtml5Variant(
    DEMO_COMPOSITION,
    "zipehr.html5.short",
    { layout: "linesaving", propertyMode: "comment" },
  );
  const css = await loadComposedQuietCss();
  const win = openQuietPreview(html, css);

  const anchors = win.document.querySelectorAll(".zipehr-structure-anchor");
  assert(anchors.length > 0, "expected structure anchor strips");
  assertEquals(
    win.document.querySelectorAll(".zs-structural-label").length,
    0,
    "preview script should remove structural spans from DOM",
  );

  const treeAnchor = [...anchors].find((a) =>
    (a.getAttribute("aria-label") ?? "").includes("Tree")
  );
  assert(treeAnchor, "Tree structure anchor expected");

  const bodyText = win.document.body.textContent ?? "";
  assertStringIncludes(bodyText, "Encounter");
  assertStringIncludes(bodyText, "History");
  assertStringIncludes(bodyText, "Story/History");
  assertStringIncludes(bodyText, "Symptom/Sign");
  assertStringIncludes(bodyText, "Anatomical location");

  const clinical = win.document.querySelector("o-e");
  assert(clinical, "expected clinical element");
  assert(
    (clinical?.textContent ?? "").includes("Story"),
    "clinical label text should remain visible",
  );
  assert(
    !bodyText.includes("TreeAny event") && !/^\\s*Tree\\s*$/m.test(bodyText),
    "generic Tree label should not appear as visible heading text",
  );

  const tip = treeAnchor!.querySelector(".zipehr-structure-tip");
  assert(tip, "tooltip span expected on anchor");
  assertStringIncludes(tip!.textContent ?? "", "Tree");
});

Deno.test("quiet preview DOM: hover class opens tooltip; click pins", async () => {
  const html = await serializeToHtml5Variant(
    DEMO_COMPOSITION,
    "zipehr.html5.short",
    { layout: "linesaving", propertyMode: "comment" },
  );
  const css = await loadComposedQuietCss();
  const win = openQuietPreview(html, css);
  const anchor = win.document.querySelector(
    '.zipehr-structure-anchor[aria-label*="Tree"]',
  ) as HTMLElement;
  assert(anchor);
  anchor.dispatchEvent(new win.MouseEvent("mouseenter"));
  assert(anchor.classList.contains("zipehr-tip-open"));
  anchor.dispatchEvent(new win.MouseEvent("click", { bubbles: true }));
  assert(anchor.classList.contains("zipehr-tip-pinned"));
});

Deno.test("quiet preview script is self-contained IIFE", () => {
  assertStringIncludes(ZIP_QUIET_PREVIEW_SCRIPT, "zipehr-structure-anchor");
  assertStringIncludes(ZIP_QUIET_PREVIEW_SCRIPT, "zipehr-tech-quiet");
});

Deno.test("quiet preview: archetype names visible, tech clusters hidden, human dates", async () => {
  const html = await serializeToHtml5Variant(
    GP_VISIT,
    "zipehr.html5.short",
    {
      layout: "linesaving",
      propertyMode: "comment",
      webTemplate: FERRO_WT,
      pathAnnotations: CLINERGY_HIDE_ANNOT,
    },
  );
  const css = await loadComposedQuietCss();
  const win = openQuietPreview(html, css);
  const bodyText = win.document.body.textContent ?? "";
  assertStringIncludes(bodyText, "Encounter");
  assertStringIncludes(bodyText, "Episode duration");
  assertStringIncludes(bodyText, "3 days");
  const techClusters = win.document.querySelectorAll(
    "o-cl[data-zs-annot-hide-on-form]",
  );
  assert(techClusters.length >= 1);
  const displayText = [...win.document.querySelectorAll(".zs-display-value")]
    .map((n) => n.textContent ?? "")
    .join(" ");
  assert(!displayText.includes("2021-10-21T14:21:00+01:00"));
  assertStringIncludes(displayText, "2021");
  const tech = win.document.querySelector("o-cl[data-zs-annot-hide-on-form]");
  assert(tech, "clinergy descriptor cluster should have hide-on-form annotation");
});

Deno.test("quiet preview hides redundant HISTORY.origin when equal to event time", async () => {
  const html = await serializeToHtml5Variant(
    DEMO_COMPOSITION,
    "zipehr.html5.short",
    { layout: "linesaving", propertyMode: "comment" },
  );
  const css = await loadComposedQuietCss();
  const win = openQuietPreview(html, css);
  const hiddenOrigin = win.document.querySelector(
    'o-hi > o-dt[p="origin"].zipehr-tech-quiet',
  );
  assert(hiddenOrigin, "redundant origin should be hidden in quiet preview");
  const visibleTimes = [
    ...win.document.querySelectorAll('o-pe o-dt[p="time"]:not(.zipehr-tech-quiet)'),
  ];
  assert(visibleTimes.length >= 1, "event time should remain visible");
});