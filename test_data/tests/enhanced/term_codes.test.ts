import { assertEquals } from "https://deno.land/std@0.220.0/assert/mod.ts";
import {
  availableTemplateLanguages,
  termCodeCandidates,
} from "../../../generation/term_codes.ts";

Deno.test("termCodeCandidates normalises short archetype node ids", () => {
  const at02 = termCodeCandidates("at0.2");
  assertEquals(at02.includes("at0.2"), true);
  assertEquals(at02.includes("at0002"), true);
  assertEquals(termCodeCandidates("id2").includes("at0002"), true);
  assertEquals(termCodeCandidates("at0003.1").includes("at0003"), true);
});

Deno.test("availableTemplateLanguages lists term_definitions keys with original first", () => {
  const langs = availableTemplateLanguages({
    original_language: "en",
    ontology: {
      term_definitions: {
        en: { id1: { text: "English" } },
        sv: { id1: { text: "Svenska" } },
      },
    },
  });
  assertEquals(langs, ["en", "sv"]);
});

Deno.test("availableTemplateLanguages includes archetype term bags in OPT order", () => {
  const langs = availableTemplateLanguages({
    original_language: "en",
    ontology: {
      term_definitions: {
        en: { at0000: { text: "Encounter" } },
      },
    },
    archetype_term_definitions: {
      "openEHR-EHR-OBSERVATION.blood_pressure.v2": {
        en: { at0004: { text: "Systolic" } },
        sv: { at0004: { text: "Systoliskt" } },
        de: { at0004: { text: "Systolisch" } },
        qq: { at0004: { text: "Q-Systolic" } },
      },
    },
  });
  assertEquals(langs, ["en", "sv", "de", "qq"]);
});
