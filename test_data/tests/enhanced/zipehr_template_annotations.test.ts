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
  DATA_ANTN_PREFIX,
  RM_ALIAS_ATTR,
  RM_VISIBILITY_ATTR,
  annotationsFromDataAntnAttrs,
  applyPresentationAttrs,
  dataAntnAttrName,
  dataAntnAttrsFromAnnotations,
  dataAntnKeyCompanionAttrName,
  isSelfDescribingAnnotationKey,
  isZipEhrTemplatePresentationHtmlAttr,
  normalizeAnnotationKeySlug,
  planDataAntnAttrs,
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

Deno.test("data-antn: normalize annotation key slug", () => {
  assertEquals(normalizeAnnotationKeySlug("L10n.en"), "l10n-en");
  assertEquals(normalizeAnnotationKeySlug("html:data-hide-on-form"), "html-data-hide-on-form");
  assertEquals(normalizeAnnotationKeySlug("hide-on-form"), "hide-on-form");
  assertEquals(normalizeAnnotationKeySlug("a.hide_on_form"), "a-hide-on-form");
  assertEquals(normalizeAnnotationKeySlug("Notes.Comment"), "notes-comment");
  assertEquals(normalizeAnnotationKeySlug("weird  /slash"), "weird-slash");
  assertEquals(isSelfDescribingAnnotationKey("hide-on-form"), true);
  assertEquals(isSelfDescribingAnnotationKey("L10n.en"), false);
});

Deno.test("data-antn: lossy keys get -key companion", () => {
  const attrs = dataAntnAttrsFromAnnotations({ "L10n.en": "History" });
  const names = attrs.map((a) => a.name);
  assert(names.includes(dataAntnAttrName("l10n-en")));
  assert(names.includes(dataAntnKeyCompanionAttrName("l10n-en")));
});

Deno.test("data-antn: collision disambiguation and round-trip", () => {
  const input = {
    "note.a": "first",
    "note-a": "second",
  };
  const plans = planDataAntnAttrs(input);
  assertEquals(plans.length, 2);
  assertEquals(plans[0]!.attrSlug, "note-a--1");
  assertEquals(plans[1]!.attrSlug, "note-a--2");

  const bag = dataAntnAttrsFromAnnotations(input);
  const attrRecord: Record<string, string> = {};
  for (const a of bag) {
    attrRecord[a.name] = a.value ?? "true";
  }
  assertEquals(annotationsFromDataAntnAttrs(attrRecord), input);
});

Deno.test("data-antn: odd keys round-trip via companion", () => {
  const input = {
    "Notes.Comment": "author note",
    'say "hi"': "quoted",
    "a.hide_on_form": "presentation",
  };
  const bag = dataAntnAttrsFromAnnotations(input);
  const attrRecord: Record<string, string> = {};
  for (const a of bag) {
    attrRecord[a.name] = a.value ?? "true";
  }
  assertEquals(annotationsFromDataAntnAttrs(attrRecord), input);
});

Deno.test("data-antn: empty key slug fails loudly", () => {
  assertThrows(
    () => planDataAntnAttrs({ "///": "x" }),
    Error,
    "empty slug",
  );
});

Deno.test("data-antn: applyPresentationAttrs rejects duplicate antn attrs", () => {
  const attrs: { name: string; value: string }[] = [
    { name: dataAntnAttrName("notes-comment"), value: "false" },
  ];
  assertThrows(
    () =>
      applyPresentationAttrs(attrs, {
        annotations: { "Notes.Comment": "true" },
      }),
    Error,
    "overwrite",
  );
});

Deno.test("template presentation: data-opt-visibility hide on clinergy", async () => {
  const html = await serializeToHtml5Variant(
    PAIN,
    "zipehr.html5.short",
    SERIALIZE_OPTS,
  );
  assertStringIncludes(html, 'data-opt-visibility="hide"');
  assert(!html.includes('data-antn-hide-on-form="true"'));
  assert(!html.includes("data-hide-on-form="));
  assert(!html.includes("html:data"));
  assert(!html.includes(`${DATA_ANTN_PREFIX}html`));

  const plain = await serializeToHtml5Variant(PAIN, "zipehr.html5.short", {
    layout: "linesaving",
  });
  const backPlain = zipehrHtml5ToCanonical(plain, "short");
  const back = zipehrHtml5ToCanonical(html, "short");
  assertEquals(back, backPlain);
});

Deno.test("template presentation: quiet CSS hides data-opt-visibility hide", async () => {
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
  assert(hidden, "clinergy cluster should have data-opt hide hint");
  assertEquals(win.getComputedStyle(hidden as Element).display, "none");
});

Deno.test("presentation attrs: separate data-rm-* from data-opt-*", () => {
  const attrs: { name: string; value?: string }[] = [];
  applyPresentationAttrs(attrs, {
    optVisibility: "pass-through",
    rmVisibility: "hide",
    rmAlias: "Composer label",
    annotations: { "L10n.en": "x" },
  });
  const names = attrs.map((a) => a.name);
  assert(names.includes("data-opt-visibility"));
  assert(names.includes(RM_VISIBILITY_ATTR));
  assert(names.includes(RM_ALIAS_ATTR));
  assertEquals(
  isZipEhrTemplatePresentationHtmlAttr("data-rm-visibility"),
    true,
  );
});

Deno.test("template presentation: L10n annotations emit data-antn with key companion", async () => {
  const html = await serializeToHtml5Variant(
    PAIN,
    "zipehr.html5.short",
    SERIALIZE_OPTS,
  );
  assertStringIncludes(html, 'data-antn-l10n-en="Symptom/Sign"');
  assertStringIncludes(html, 'data-antn-l10n-en-key="L10n.en"');
});