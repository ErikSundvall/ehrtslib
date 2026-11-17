import {
  assert,
  assertEquals,
  assertStringIncludes,
} from "https://deno.land/std@0.220.0/assert/mod.ts";
import { Window } from "npm:happy-dom@21.0.4";
import { parseOptXml } from "../../../parser/legacy/opt_xml_parser.ts";
import { buildWebTemplate } from "../../../serialization/simplified/mod.ts";
import {
  serializeToHtml5Variant,
  zipehrHtml5ToCanonical,
} from "../../../serialization/zipehr/mod.ts";
import {
  OPT_VISIBILITY_ATTR,
  annotationKeyToAttrName,
} from "../../../serialization/zipehr/template_annotations.ts";

const repo = new URL("../../../", import.meta.url);

const PAIN = JSON.parse(
  await Deno.readTextFile(
    new URL("test_data/fixtures/workbench-ferro/02-pain-rich.json", repo),
  ),
);
const OPT_XML = await Deno.readTextFile(
  new URL(
    "test_data/fixtures/ferroehr/thumb-pain-encounter.v2-coded.opt",
    repo,
  ),
);
const { operationalTemplate: OPT } = parseOptXml(OPT_XML);
const WT = buildWebTemplate(OPT);

const SERIALIZE_OPTS = {
  layout: "linesaving" as const,
  webTemplate: WT,
  operationalTemplate: OPT,
};

Deno.test("template presentation: visibility attribute name", () => {
  assertEquals(OPT_VISIBILITY_ATTR, "data-opt-visibility");
  assertEquals(
    annotationKeyToAttrName("a.hide_on_form"),
    "data-opt-a-hide-on-form",
  );
});

Deno.test("template presentation: OPT view hide on clinergy", async () => {
  const html = await serializeToHtml5Variant(
    PAIN,
    "zipehr.html5.short",
    SERIALIZE_OPTS,
  );
  assertStringIncludes(html, 'data-opt-visibility="hide"');
  assert(!html.includes("data-zs-annot"));

  const plain = await serializeToHtml5Variant(PAIN, "zipehr.html5.short", {
    layout: "linesaving",
  });
  const backPlain = zipehrHtml5ToCanonical(plain, "short");
  const back = zipehrHtml5ToCanonical(html, "short");
  assertEquals(back, backPlain);
});

Deno.test("template presentation: quiet CSS hides data-opt-visibility=hide", async () => {
  const html = await serializeToHtml5Variant(
    PAIN,
    "zipehr.html5.short",
    SERIALIZE_OPTS,
  );
  const quiet = await Deno.readTextFile(
    new URL(
      "serialization/zipehr/css/zipehr-html5-quiet-structure.css",
      repo,
    ),
  );
  const doc = `<!DOCTYPE html><html><head><style>${quiet}</style></head><body>${html}</body></html>`;
  const win = new Window({ url: "https://example.test/" });
  win.document.write(doc);
  const hidden = win.document.querySelector('[data-opt-visibility="hide"]');
  assert(hidden, "clinergy cluster should have hide visibility");
  assertEquals(win.getComputedStyle(hidden as Element).display, "none");
});