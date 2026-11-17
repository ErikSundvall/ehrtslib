import {
  assert,
  assertEquals,
  assertStringIncludes,
  assertThrows,
} from "https://deno.land/std@0.220.0/assert/mod.ts";
import { Window } from "npm:happy-dom@21.0.4";
import { parseOptXml } from "../../../parser/legacy/opt_xml_parser.ts";
import { buildWebTemplate } from "../../../serialization/simplified/mod.ts";
import {
  serializeToHtml5Variant,
  zipehrHtml5ToCanonical,
} from "../../../serialization/zipehr/mod.ts";
import {
  HTML_ANNOTATION_PREFIX,
  OPT_VISIBILITY_ATTR,
  applyPresentationAttrs,
  htmlAttributeNameFromAnnotationKey,
  passthroughAttrsFromAnnotations,
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

Deno.test("html: prefix maps annotation key to attribute name", () => {
  assertEquals(HTML_ANNOTATION_PREFIX, "html:");
  assertEquals(
    htmlAttributeNameFromAnnotationKey("html:data-hide-on-form"),
    "data-hide-on-form",
  );
  assertEquals(
    htmlAttributeNameFromAnnotationKey("html:class"),
    "class",
  );
});

Deno.test("html: pass-through rejects event handlers and javascript URLs", () => {
  assertThrows(
    () =>
      passthroughAttrsFromAnnotations(
        { "html:onclick": "alert(1)" },
        "short",
      ),
    Error,
  );
  assertThrows(
    () =>
      passthroughAttrsFromAnnotations(
        { "html:href": "javascript:alert(1)" },
        "short",
      ),
    Error,
  );
});

Deno.test("html: pass-through rejects serializer round-trip attrs", () => {
  const attrs: { name: string; value: string }[] = [
    { name: "n", value: "at0001" },
  ];
  assertThrows(
    () =>
      applyPresentationAttrs(
        attrs,
        {
          annotations: { "html:n": "evil" },
        },
        "short",
      ),
    Error,
  );
  assertThrows(
    () =>
      passthroughAttrsFromAnnotations(
        { "html:data-zs-value": "x" },
        "short",
      ),
    Error,
  );
});

Deno.test("html: pass-through emits class merge", () => {
  const attrs: { name: string; value?: string }[] = [
    { name: "class", value: "zs-wrap" },
  ];
  applyPresentationAttrs(
    attrs,
    { annotations: { "html:class": "quiet" } },
    "short",
  );
  assertEquals(attrs.find((a) => a.name === "class")?.value, "zs-wrap quiet");
});

Deno.test("template presentation: html:data-hide-on-form on clinergy", async () => {
  const html = await serializeToHtml5Variant(
    PAIN,
    "zipehr.html5.short",
    SERIALIZE_OPTS,
  );
  assertStringIncludes(html, 'data-hide-on-form="true"');
  assert(!html.includes("data-opt-annotations"));
  assert(!html.match(/data-opt-[a-z]/));

  const plain = await serializeToHtml5Variant(PAIN, "zipehr.html5.short", {
    layout: "linesaving",
  });
  const backPlain = zipehrHtml5ToCanonical(plain, "short");
  const back = zipehrHtml5ToCanonical(html, "short");
  assertEquals(back, backPlain);
});

Deno.test("template presentation: quiet CSS hides data-hide-on-form", async () => {
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
  const hidden = win.document.querySelector('[data-hide-on-form="true"]');
  assert(hidden, "clinergy cluster should have html pass-through hide hint");
  assertEquals(win.getComputedStyle(hidden as Element).display, "none");
});

Deno.test("template presentation: view visibility attr unchanged", () => {
  assertEquals(OPT_VISIBILITY_ATTR, "data-opt-visibility");
  const attrs: { name: string; value: string }[] = [];
  applyPresentationAttrs(attrs, { visibility: "pass-through", annotations: {} }, "short");
  assertEquals(attrs[0]?.name, "data-opt-visibility");
});