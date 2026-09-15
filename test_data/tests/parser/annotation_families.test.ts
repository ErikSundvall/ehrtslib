import { assertEquals } from "https://deno.land/std@0.220.0/assert/mod.ts";
import {
  type AnnotationDocumentation,
  annotationFamily,
  isLanguageIndependentFamily,
  languageCode,
  listFamilies,
  listLanguageBags,
  listResourceLanguages,
  normalizeFamilyPrefix,
  orderLanguagesWithOriginal,
  originalLanguageOf,
  pillsAtPath,
  qualifyKeyForFamily,
  UNPREFIXED_FAMILY,
} from "../../../parser/mod.ts";
import { ArchetypeRepository } from "../../../parser/legacy/archetype_repository.ts";

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

Deno.test("languageCode normalises ISO tags and objects", () => {
  assertEquals(languageCode("ISO_639-1::sv"), "sv");
  assertEquals(languageCode("en"), "en");
  assertEquals(languageCode({ code_string: "de" }), "de");
  assertEquals(languageCode({ codeString: "nb" }), "nb");
  assertEquals(
    languageCode({
      language: { terminologyId: { value: "ISO_639-1" }, codeString: "fr" },
    }),
    "fr",
  );
  assertEquals(languageCode("0"), undefined);
  assertEquals(languageCode(""), undefined);
});

Deno.test("normalizeFamilyPrefix and qualifyKeyForFamily", () => {
  assertEquals(normalizeFamilyPrefix("fhir"), "fhir.");
  assertEquals(normalizeFamilyPrefix("fhir."), "fhir.");
  assertEquals(normalizeFamilyPrefix("unprefixed"), UNPREFIXED_FAMILY);
  assertEquals(normalizeFamilyPrefix("1bad"), undefined);
  assertEquals(qualifyKeyForFamily("id", "a."), "a.id");
  assertEquals(qualifyKeyForFamily("a.rule.adl", "a."), "a.rule.adl");
  assertEquals(qualifyKeyForFamily("L10n.sv", "a."), undefined);
  assertEquals(qualifyKeyForFamily("comment", UNPREFIXED_FAMILY), "comment");
  assertEquals(qualifyKeyForFamily("a.id", UNPREFIXED_FAMILY), undefined);
});

Deno.test("listFamilies includes extra prefixes", () => {
  const families = listFamilies(undefined, ["fhir.", "a."]);
  assertEquals(families.includes("fhir."), true);
  assertEquals(families.indexOf("L10n.") < families.indexOf("fhir."), true);
});

Deno.test("listResourceLanguages reads Care unit template languages", async () => {
  const text = await Deno.readTextFile(
    new URL("../../tjson/Care unit v2.t.json", import.meta.url),
  );
  const repo = new ArchetypeRepository();
  const loaded = repo.loadFile("Care unit v2.t.json", text);
  const template = repo.getTemplate(loaded.archetypeId ?? "");
  assertEquals(listResourceLanguages(template), ["de", "en", "nb", "sv"]);
  assertEquals(originalLanguageOf(template), "en");
});

Deno.test("originalLanguageOf prefers original_language over translations", () => {
  assertEquals(
    originalLanguageOf({
      original_language: "ISO_639-1::sv",
      originalLanguage: { codeString: "en" },
      translations: { en: { language: "en" } },
    }),
    "sv",
  );
  assertEquals(
    originalLanguageOf({
      description: { otherDetails: { original_language: "ISO_639-1::nb" } },
    }),
    "nb",
  );
  assertEquals(originalLanguageOf({ translations: ["de"] }), undefined);
});

Deno.test("orderLanguagesWithOriginal puts original first", () => {
  assertEquals(orderLanguagesWithOriginal(["sv", "de", "en"], "en"), [
    "en",
    "de",
    "sv",
  ]);
  assertEquals(orderLanguagesWithOriginal(["sv", "de"], "en"), ["de", "sv"]);
});

Deno.test("isLanguageIndependentFamily is the a. automation family", () => {
  assertEquals(isLanguageIndependentFamily("a."), true);
  assertEquals(isLanguageIndependentFamily("L10n."), false);
  assertEquals(isLanguageIndependentFamily(UNPREFIXED_FAMILY), false);
});
