/**
 * Archetype terminology lookup tests.
 */

import { assertEquals } from "https://deno.land/std@0.220.0/assert/mod.ts";
import { ADL2Tokenizer } from "../../../enhanced/parser/adl2_tokenizer.ts";
import { ADL2Parser } from "../../../enhanced/parser/adl2_parser.ts";
import {
  buildDefinitionTree,
  getResourceDefaultLanguage,
  listTerminologyLanguages,
  lookupTermText,
} from "../../../enhanced/parser/clinical_model_annotations.ts";
import {
  getTermDefinitionsTable,
  parseLanguageCode,
} from "../../../enhanced/parser/archetype_terminology.ts";

const TEST_DATA = new URL("../../", import.meta.url);

async function readTestAdl2(relativePath: string): Promise<string> {
  return await Deno.readTextFile(new URL(relativePath, TEST_DATA));
}

Deno.test("parseLanguageCode extracts code from terminology id", () => {
  assertEquals(parseLanguageCode("ISO_639-1::en"), "en");
  assertEquals(parseLanguageCode("sv"), "sv");
});

Deno.test("buildDefinitionTree uses terminology in term mode", async () => {
  const path = "adl2/openEHR-TEST_PKG-WHOLE.minimal_rules.v1.0.0.adls";
  const text = await readTestAdl2(path);
  const parsed = new ADL2Parser(new ADL2Tokenizer(text).tokenize()).parse();
  const archetype = parsed.archetype!;

  assertEquals(getResourceDefaultLanguage(archetype), "en");
  assertEquals(listTerminologyLanguages(archetype).includes("en"), true);
  assertEquals(
    lookupTermText(getTermDefinitionsTable(archetype), "en", "id1"),
    "whole",
  );

  const idTree = buildDefinitionTree(archetype, { labelMode: "id" });
  assertEquals(idTree?.labelId.includes("WHOLE"), true);
  assertEquals(idTree?.label.includes("WHOLE"), true);

  const termTree = buildDefinitionTree(archetype, {
    labelMode: "term",
    termLanguage: "en",
  });
  assertEquals(termTree?.label, "whole");
  assertEquals(termTree?.termLabel, "whole");
});
