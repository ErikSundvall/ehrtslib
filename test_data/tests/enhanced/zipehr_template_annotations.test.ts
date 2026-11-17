import {
  assert,
  assertEquals,
  assertStringIncludes,
} from "https://deno.land/std@0.220.0/assert/mod.ts";
import {
  serializeToHtml5Variant,
  zipehrHtml5ToCanonical,
} from "../../../serialization/zipehr/mod.ts";
import {
  templateAnnotationKeyToAttrName,
} from "../../../serialization/zipehr/template_annotations.ts";
import { Window } from "npm:happy-dom@21.0.4";

const repo = new URL("../../../", import.meta.url);

const PAIN = JSON.parse(
  await Deno.readTextFile(
    new URL("test_data/fixtures/workbench-ferro/02-pain-rich.json", repo),
  ),
);
const WT = JSON.parse(
  await Deno.readTextFile(
    new URL("test_data/fixtures/ferroehr/ferro-flat/wt.json", repo),
  ),
);
const HIDE_ANNOT = JSON.parse(
  await Deno.readTextFile(
    new URL(
      "test_data/fixtures/workbench-ferro/clinergy-hide-on-form-annotations.json",
      repo,
    ),
  ),
);

Deno.test("template annotations: hide-on-form maps to data-zs-annot attribute", () => {
  assertEquals(
    templateAnnotationKeyToAttrName("hide-on-form"),
    "data-zs-annot-hide-on-form",
  );
  assertEquals(
    templateAnnotationKeyToAttrName("hide_on_form"),
    "data-zs-annot-hide-on-form",
  );
});

Deno.test("template annotations: emit on clinergy clusters, strip on round-trip", async () => {
  const html = await serializeToHtml5Variant(PAIN, "zipehr.html5.short", {
    layout: "linesaving",
    webTemplate: WT,
    pathAnnotations: HIDE_ANNOT,
  });
  assertStringIncludes(html, 'data-zs-annot-hide-on-form');
  assert(!html.includes("data-zs-quiet-tech"));
  assertStringIncludes(html, "clinergy_descriptor");

  const plain = await serializeToHtml5Variant(PAIN, "zipehr.html5.short", {
    layout: "linesaving",
  });
  const backPlain = zipehrHtml5ToCanonical(plain, "short");
  const backAnnot = zipehrHtml5ToCanonical(html, "short");
  assertEquals(backAnnot, backPlain);
});

Deno.test("template annotations: quiet CSS hides annotated clusters", async () => {
  const html = await serializeToHtml5Variant(PAIN, "zipehr.html5.short", {
    layout: "linesaving",
    webTemplate: WT,
    pathAnnotations: HIDE_ANNOT,
  });
  const quiet = await Deno.readTextFile(
    new URL(
      "serialization/zipehr/css/zipehr-html5-quiet-structure.css",
      repo,
    ),
  );
  const doc = `<!DOCTYPE html><html><head><style>${quiet}</style></head><body>${html}</body></html>`;
  const win = new Window({ url: "https://example.test/" });
  win.document.write(doc);
  const hidden = win.document.querySelector("o-cl[data-zs-annot-hide-on-form]");
  assert(hidden, "clinergy cluster should carry hide-on-form");
  const style = win.getComputedStyle(hidden as Element);
  assertEquals(style.display, "none");
});