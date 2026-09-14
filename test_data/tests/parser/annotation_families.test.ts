import { assertEquals } from "https://deno.land/std@0.220.0/assert/mod.ts";
import {
  type AnnotationDocumentation,
  annotationFamily,
  listFamilies,
  listLanguageBags,
  pillsAtPath,
  UNPREFIXED_FAMILY,
} from "../../../parser/mod.ts";

Deno.test("annotationFamily - dotted prefixes", () => {
  assertEquals(annotationFamily("L10n.sv"), "L10n.");
  assertEquals(annotationFamily("a.id"), "a.");
  assertEquals(annotationFamily("a.rule.adl"), "a.");
  assertEquals(annotationFamily("design note"), UNPREFIXED_FAMILY);
  assertEquals(annotationFamily("ui"), UNPREFIXED_FAMILY);
});

Deno.test("pillsAtPath - all language bags, nothing collapsed", () => {
  const doc: AnnotationDocumentation = {
    en: {
      "/x": { "L10n.sv": "Utrustning", "design note": "keep" },
    },
    sv: {
      "/x": { "L10n.sv": "Utrustning" },
    },
  };
  const pills = pillsAtPath(doc, "/x");
  assertEquals(pills.length, 3);
  assertEquals(pills.filter((p) => p.family === "L10n.").length, 2);
  assertEquals(pills.filter((p) => p.family === UNPREFIXED_FAMILY).length, 1);
  assertEquals(listLanguageBags(doc), ["en", "sv"]);
  assertEquals(listLanguageBags(doc, ["fr"]), ["en", "fr", "sv"]);
  assertEquals(listFamilies(doc).includes("L10n."), true);
  assertEquals(listFamilies(doc).includes("a."), true);
  assertEquals(listFamilies(doc).includes(UNPREFIXED_FAMILY), true);
});
