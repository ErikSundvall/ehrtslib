import { assertEquals } from "https://deno.land/std@0.220.0/assert/mod.ts";
import {
  type AnnotationDocumentation,
  applyCopyItemsToDocumentation,
  copyItemId,
  defaultCopySelection,
  groupCopyItemsByFamily,
  listCopyItemsFromDocumentation,
} from "../../../parser/mod.ts";
import { ADL2Parser } from "../../../parser/adl2_parser.ts";
import { ADL2Tokenizer } from "../../../parser/adl2_tokenizer.ts";
import {
  getAnnotationsDocumentation,
} from "../../../parser/aom_odin_sections.ts";
import {
  listResourceLanguages,
  originalLanguageOf,
} from "../../../parser/annotation_families.ts";

const SRC: AnnotationDocumentation = {
  en: {
    "/data[id2]": {
      "a.id": "encounter-form",
      "a.rule": "show-when-adult",
      comment: "author note in English",
    },
    "/content": {
      "L10n.sv": "Utrustning",
    },
  },
};

Deno.test("listCopyItemsFromDocumentation skips empty and same-language", () => {
  const emptyish: AnnotationDocumentation = {
    en: { "/x": { "a.id": "  ", comment: "keep" } },
  };
  assertEquals(listCopyItemsFromDocumentation(emptyish, "en", "en").length, 0);
  const items = listCopyItemsFromDocumentation(emptyish, "en", "sv");
  assertEquals(items.map((i) => i.key), ["comment"]);
});

Deno.test("listCopyItemsFromDocumentation reports existing target values", () => {
  const doc: AnnotationDocumentation = {
    ...SRC,
    sv: { "/data[id2]": { "a.id": "old-id" } },
  };
  const items = listCopyItemsFromDocumentation(doc, "en", "sv", "root");
  const aid = items.find((i) => i.key === "a.id");
  assertEquals(aid?.value, "encounter-form");
  assertEquals(aid?.existingTargetValue, "old-id");
  assertEquals(aid?.family, "a.");
  assertEquals(aid?.ownerId, "root");
});

Deno.test("defaultCopySelection checks only a. family", () => {
  const items = listCopyItemsFromDocumentation(SRC, "en", "sv");
  const selected = defaultCopySelection(items);
  assertEquals(
    selected.has(copyItemId(items.find((i) => i.key === "a.id")!)),
    true,
  );
  assertEquals(
    selected.has(copyItemId(items.find((i) => i.key === "a.rule")!)),
    true,
  );
  assertEquals(
    selected.has(copyItemId(items.find((i) => i.key === "comment")!)),
    false,
  );
  assertEquals(
    selected.has(copyItemId(items.find((i) => i.key === "L10n.sv")!)),
    false,
  );
});

Deno.test("groupCopyItemsByFamily keeps known family order", () => {
  const groups = groupCopyItemsByFamily(
    listCopyItemsFromDocumentation(SRC, "en", "sv"),
  );
  assertEquals(groups.map((g) => g.family), ["L10n.", "a.", "(unprefixed)"]);
  assertEquals(groups[1].items.map((i) => i.key), ["a.id", "a.rule"]);
});

Deno.test("applyCopyItemsToDocumentation writes selected keys only", () => {
  const doc: AnnotationDocumentation = structuredClone(SRC);
  const items = listCopyItemsFromDocumentation(doc, "en", "sv");
  const selected = items.filter((i) => i.family === "a.");
  const n = applyCopyItemsToDocumentation(doc, selected, "sv");
  assertEquals(n, 2);
  assertEquals(doc.sv["/data[id2]"]["a.id"], "encounter-form");
  assertEquals(doc.sv["/data[id2]"]["a.rule"], "show-when-adult");
  assertEquals(doc.sv["/data[id2]"]?.comment, undefined);
  assertEquals(doc.en["/data[id2]"].comment, "author note in English");
});

Deno.test("taaat_langs fixture original language is en with sv translation", async () => {
  const text = await Deno.readTextFile(
    new URL(
      "../../adl2/openEHR-TEST_PKG-taaat_langs.v1.0.0.adls",
      import.meta.url,
    ),
  );
  const parsed = new ADL2Parser(new ADL2Tokenizer(text).tokenize()).parse();
  const arch = parsed.archetype!;
  assertEquals(originalLanguageOf(arch), "en");
  assertEquals(listResourceLanguages(arch).includes("sv"), true);
  const doc = getAnnotationsDocumentation(arch) as AnnotationDocumentation;
  const items = listCopyItemsFromDocumentation(doc, "en", "sv");
  assertEquals(items.some((i) => i.key === "a.id"), true);
  assertEquals(items.some((i) => i.key === "comment"), true);
  applyCopyItemsToDocumentation(
    doc,
    items.filter((i) => i.family === "a."),
    "sv",
  );
  assertEquals(doc.sv["/data[id2]"]["a.id"], "encounter-form");
  assertEquals(doc.sv["/data[id2]"]?.comment, undefined);
});
