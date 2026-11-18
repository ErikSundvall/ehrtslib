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
  applyPresentationAttrs,
  applyPresentationAttrsAndComments,
  annotationKeyMatchesFilter,
  dataAntnAttrName,
  dataAntnAttrsFromAnnotations,
  detectAnnotationSlugCollisions,
  emitDataAntnPresentation,
  filterAnnotationRecord,
  formatAnnotationCollisionHtmlComment,
  isZipEhrTemplatePresentationHtmlAttr,
  normalizeAnnotationKeySlug,
  planDataAntnAttrs,
  resetAnnotationSlugCollisionWarnForTests,
  setAnnotationSlugCollisionWarnForTests,
} from "../../../serialization/zipehr/template_annotations.ts";
import { resolveZipEhrTemplatePresentation } from "../../../serialization/zipehr/template_presentation_input.ts";

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
  template: { operationalTemplate: OPT, webTemplate: WT },
};

Deno.test("data-antn: normalize annotation key slug", () => {
  assertEquals(normalizeAnnotationKeySlug("L10n.en"), "l10n-en");
  assertEquals(normalizeAnnotationKeySlug("hide-on-form"), "hide-on-form");
});

Deno.test("data-antn: slug collision first key wins", () => {
  const plans = planDataAntnAttrs({
    "note.a": "first",
    "note-a": "second",
  });
  assertEquals(plans.length, 1);
  assertEquals(plans[0]!.originalKey, "note-a");
});

Deno.test("data-antn: slug collision warns and emits HTML comment", () => {
  const collisions = detectAnnotationSlugCollisions({
    "note.a": "first",
    "note-a": "second",
  });
  assertEquals(collisions.length, 1);
  assertEquals(collisions[0]!.keptKey, "note-a");
  assertEquals(collisions[0]!.droppedKey, "note.a");

  const warnings: string[] = [];
  setAnnotationSlugCollisionWarnForTests((msg) => {
    if (typeof msg === "string") warnings.push(msg);
  });
  try {
    const { attrs, presentationComments } = emitDataAntnPresentation(
      { "note.a": "first", "note-a": "second" },
      { aqlPath: "/content[0]" },
    );
    assertEquals(attrs.length, 1);
    assertEquals(attrs[0]?.name, dataAntnAttrName("note-a"));
    assertEquals(presentationComments.length, 1);
    assertStringIncludes(
      presentationComments[0]!,
      "slug collision",
    );
    assertStringIncludes(warnings[0] ?? "", "/content[0]");
  } finally {
    resetAnnotationSlugCollisionWarnForTests();
  }
});

Deno.test("data-antn: collision HTML comment is stripped on html5 round-trip", async () => {
  const attrs: { name: string; value: string }[] = [];
  const comments = applyPresentationAttrsAndComments(attrs, {
    presentationPath: "/test",
    annotations: { "X.Y": "a", "x-y": "b" },
  });
  const comment = comments[0] ?? formatAnnotationCollisionHtmlComment({
    keptKey: "x-y",
    droppedKey: "X.Y",
    attrSlug: "x-y",
  });
  const html = `${comment}<o-e n="openEHR-EHR-OBSERVATION.test.v1" ${attrs.map((a) => `${a.name}="${a.value}"`).join(" ")}></o-e>`;
  const back = zipehrHtml5ToCanonical(html, "short");
  const backPlain = zipehrHtml5ToCanonical(
    `<o-e n="openEHR-EHR-OBSERVATION.test.v1" ${attrs.map((a) => `${a.name}="${a.value}"`).join(" ")}></o-e>`,
    "short",
  );
  assertEquals(back, backPlain);
});

Deno.test("data-antn: no -key companions", () => {
  const attrs = dataAntnAttrsFromAnnotations({ "L10n.en": "History" });
  assert(attrs.every((a) => !a.name.endsWith("-key")));
  assertEquals(attrs[0]?.name, dataAntnAttrName("l10n-en"));
});

Deno.test("templateAnnotationFilter include / exclude", () => {
  const bag = { "L10n.en": "x", "Notes.Comment": "y", "hide-on-form": "true" };
  assertEquals(
    Object.keys(filterAnnotationRecord(bag, /^L10n/)).length,
    1,
  );
  assertEquals(
    Object.keys(filterAnnotationRecord(bag, [/^Notes/, /^hide/])).length,
    2,
  );
  assert(annotationKeyMatchesFilter("L10n.en", /^L10n/));
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

Deno.test("template presentation: data-antn-hide-on-form on clinergy", async () => {
  const html = await serializeToHtml5Variant(
    PAIN,
    "zipehr.html5.short",
    SERIALIZE_OPTS,
  );
  assertStringIncludes(html, 'data-antn-hide-on-form="true"');
  assert(!html.includes("data-hide-on-form="));
  assert(!html.includes(`${DATA_ANTN_PREFIX}html`));

  const plain = await serializeToHtml5Variant(PAIN, "zipehr.html5.short", {
    layout: "linesaving",
  });
  const backPlain = zipehrHtml5ToCanonical(plain, "short");
  const back = zipehrHtml5ToCanonical(html, "short");
  assertEquals(back, backPlain);
});

Deno.test("template presentation: annotation RegExp filter", async () => {
  const onlyHide = await serializeToHtml5Variant(
    PAIN,
    "zipehr.html5.short",
    { ...SERIALIZE_OPTS, templateAnnotationFilter: /^hide-on-form$/ },
  );
  assertStringIncludes(onlyHide, "data-antn-hide-on-form");
  assert(!onlyHide.includes("data-antn-l10n-en"));

  const onlyL10n = await serializeToHtml5Variant(
    PAIN,
    "zipehr.html5.short",
    { ...SERIALIZE_OPTS, templateAnnotationFilter: /^L10n/ },
  );
  assertStringIncludes(onlyL10n, "data-antn-l10n-en");
  assert(!onlyL10n.includes("data-antn-hide-on-form"));
});

Deno.test("template presentation: no template means no presentation attrs", async () => {
  const html = await serializeToHtml5Variant(PAIN, "zipehr.html5.short", {
    layout: "linesaving",
  });
  assert(!html.includes("data-antn-"));
  assert(!html.includes("data-opt-visibility"));
  assert(!html.includes("data-rm-visibility"));
});

Deno.test("template option: OPT XML string resolves", () => {
  const ctx = resolveZipEhrTemplatePresentation(OPT_XML);
  assert(ctx?.operationalTemplate);
  assert(ctx.webTemplate.tree);
});

Deno.test("template presentation: quiet CSS hides data-antn-hide-on-form", async () => {
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
  const hidden = win.document.querySelector('[data-antn-hide-on-form="true"]');
  assert(hidden, "clinergy cluster should have data-antn hide hint");
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
  assert(names.includes("data-antn-l10n-en"));
  assertEquals(
    isZipEhrTemplatePresentationHtmlAttr("data-rm-visibility"),
    true,
  );
});