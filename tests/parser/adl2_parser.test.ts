/**
 * Tests for ADL2 Parser
 */

import { assertEquals, assert } from "https://deno.land/std@0.220.0/assert/mod.ts";
import { ADL2Tokenizer } from "../../enhanced/parser/adl2_tokenizer.ts";
import { ADL2Parser } from "../../enhanced/parser/adl2_parser.ts";

function parseAdl2(input: string) {
  const tokenizer = new ADL2Tokenizer(input);
  const tokens = tokenizer.tokenize();
  const parser = new ADL2Parser(tokens);
  return parser.parse();
}

Deno.test("ADL2 Parser - minimal archetype header", () => {
  const input = `archetype (adl_version=2.0.5; rm_release=1.0.2)
    openEHR-EHR-OBSERVATION.test.v1.0.0

language
    original_language = <"ISO_639-1::en">

terminology
    term_definitions = <
        ["en"] = <
            ["id1"] = <
                text = <"Test">
            >
        >
    >
`;

  const result = parseAdl2(input);
  
  assert(result.archetype !== undefined);
  assert(result.archetype.archetype_id !== undefined);
  assertEquals(result.archetype.archetype_id.value, "openEHR-EHR-OBSERVATION.test.v1.0.0");
  assertEquals(result.archetype.adl_version, "2.0.5");
  assertEquals(result.archetype.rm_release, "1.0.2");
});

Deno.test("ADL2 Parser - archetype with specialization", () => {
  const input = `archetype (adl_version=2.0.5)
    openEHR-EHR-OBSERVATION.test_specialized.v1.0.0
specialize
    openEHR-EHR-OBSERVATION.test.v1.0.0

language
    original_language = <"ISO_639-1::en">

terminology
    term_definitions = <
        ["en"] = <
            ["id1"] = <
                text = <"Test">
            >
        >
    >
`;

  const result = parseAdl2(input);
  
  assert(result.archetype !== undefined);
  assert(result.archetype.parent_archetype_id !== undefined);
  assertEquals(
    result.archetype.parent_archetype_id.value,
    "openEHR-EHR-OBSERVATION.test.v1.0.0"
  );
});

Deno.test("ADL2 Parser - parse simple observation file", async () => {
  const input = await Deno.readTextFile(
    "/home/runner/work/ehrtslib/ehrtslib/test_data/adl2/simple_observation.adl"
  );

  const result = parseAdl2(input);
  
  assert(result.archetype !== undefined);
  assert(result.archetype.archetype_id !== undefined);
  assertEquals(
    result.archetype.archetype_id.value,
    "openEHR-EHR-OBSERVATION.simple_test.v1.0.0"
  );
  
  // Should have parsed terminology
  assert(result.archetype.ontology !== undefined);
  
  // Will have warnings about unimplemented features
  assert(result.warnings.length > 0);
});

console.log("\n✅ ADL2 Parser tests completed");
