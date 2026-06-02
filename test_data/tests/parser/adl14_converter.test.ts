/**
 * ADL 1.4 detection, conversion, and parse tests.
 */

import { assertEquals, assert } from "https://deno.land/std@0.220.0/assert/mod.ts";
import {
  collapseMultilineQuotedStrings,
  convertAdl14ToAdl2,
  detectAdlVersion,
  parseAdl,
} from "../../enhanced/parser/mod.ts";
import { ADL2Serializer } from "../../enhanced/generation/adl2_serializer.ts";
import { ArchetypeValidator } from "../../enhanced/validation/archetype_validator.ts";

const TEST_DATA = new URL("../../test_data/", import.meta.url);

Deno.test("detectAdlVersion - ADL 1.4 ontology marker", async () => {
  const text = await Deno.readTextFile(
    new URL("adl14/openEHR-TEST_PKG-WHOLE.most_minimal.v1.adl", TEST_DATA),
  );
  assertEquals(detectAdlVersion(text), "1.4");
});

Deno.test("convertAdl14ToAdl2 - normalises header and terminology", async () => {
  const text = await Deno.readTextFile(
    new URL("adl14/openEHR-TEST_PKG-WHOLE.most_minimal.v1.adl", TEST_DATA),
  );
  const { adl2Text, converted, warnings } = convertAdl14ToAdl2(text);
  assert(converted);
  assert(warnings.length > 0);
  assert(adl2Text.includes("archetype ("));
  assert(adl2Text.includes("adl_version=2"));
  assert(adl2Text.includes("terminology"));
  assert(!adl2Text.includes("\nontology\n"));
  assert(adl2Text.includes("WHOLE[id1]"));
  assert(!adl2Text.includes("[at0001]"));
});

Deno.test("collapseMultilineQuotedStrings - folds physical newlines", () => {
  const input = 'purpose = <"line one\nline two">';
  const out = collapseMultilineQuotedStrings(input);
  assertEquals(out, 'purpose = <"line one\\nline two">');
});

Deno.test("parseAdl - ADL 1.4 fixture end-to-end", async () => {
  const text = await Deno.readTextFile(
    new URL("adl14/openEHR-TEST_PKG-WHOLE.most_minimal.v1.adl", TEST_DATA),
  );
  const result = parseAdl(text);
  assertEquals(result.detectedVersion, "1.4");
  assert(result.convertedFrom14);
  assertEquals(result.kind, "archetype");
  assertEquals(result.archetype?.definition?.node_id, "id1");
  assertEquals(result.archetype?.definition?.rm_type_name, "WHOLE");

  const ontology = result.archetype?.ontology as Record<string, unknown>;
  const en = (ontology?.term_definitions as Record<string, Record<string, { text?: string }>>)?.en;
  assertEquals(en?.at0001?.text ?? en?.["at0001"]?.text, "whole");

  const aomCheck = new ArchetypeValidator().validate(result.archetype!);
  assertEquals(aomCheck.valid, true);
});
