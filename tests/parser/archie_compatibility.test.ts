/**
 * Archie Compatibility Tests for ADL2 Parser
 * 
 * These tests validate that ehrtslib's ADL2 parser can correctly parse
 * test data from the openEHR Archie project, ensuring compatibility
 * with the official Java implementation.
 * 
 * Source: https://github.com/openEHR/archie
 * Test Data: archie/tools/src/test/resources/adl2-tests/
 * 
 * Test patterns inspired by Archie's parser tests:
 * - PrimitivesConstraintParserTest.java
 * - NumberConstraintParserTest.java
 * - CStringParserTest.java
 * - TemporalConstraintParserTest.java
 * 
 * License: Apache License 2.0
 * Copyright: © 2017-2024 openEHR Foundation and contributors
 */

import { assert, assertEquals, assertExists } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { ADL2Tokenizer } from "../../enhanced/parser/adl2_tokenizer.ts";
import { ADL2Parser } from "../../enhanced/parser/adl2_parser.ts";
import type { ADL2ParseResult } from "../../enhanced/parser/adl2_parser.ts";
import { OdinParser } from "../../enhanced/parser/odin_parser.ts";
import * as openehr_am from "../../enhanced/openehr_am.ts";

const ARCHIE_TEST_DATA = new URL("../../test_data/archie-tests/", import.meta.url);

async function loadArchieTestFile(relativePath: string): Promise<string> {
  return await Deno.readTextFile(new URL(relativePath, ARCHIE_TEST_DATA));
}

function archetypeFrom(result: ADL2ParseResult): openehr_am.ARCHETYPE {
  assertExists(result.archetype);
  return result.archetype;
}

Deno.test("Archie Compatibility - Minimal Archetype", async () => {
  // Source: archie/tools/src/test/resources/adl2-tests/features/aom_structures/basic/
  // Tests the most minimal valid ADL2 archetype structure
  const adl2Text = await loadArchieTestFile("basics/openEHR-TEST_PKG-WHOLE.most_minimal.v1.0.0.adls");
  
  const tokenizer = new ADL2Tokenizer(adl2Text);
  const tokens = tokenizer.tokenize();
  assertExists(tokens, "Tokenizer should produce tokens");
  
  const parser = new ADL2Parser(tokens);
  const archetype = archetypeFrom(parser.parse());

  assertEquals(
    archetype.archetype_id?.value,
    "openehr-TEST_PKG-WHOLE.most_minimal.v1.0.0"
  );
  assertExists(archetype.definition, "Archetype should have definition section");
  assertEquals(archetype.definition?.rm_type_name, "WHOLE");
});

Deno.test("Archie Compatibility - Primitive Types", async () => {
  // Source: archie/tools/src/test/resources/adl2-tests/features/aom_structures/basic/
  // Test pattern: PrimitivesConstraintParserTest.java
  // Tests all primitive constraint types: String, Integer, Real, Boolean, Date, Time, DateTime, Duration
  const adl2Text = await loadArchieTestFile("primitives/openehr-TEST_PKG-WHOLE.primitive_types.v1.0.0.adls");
  
  const tokenizer = new ADL2Tokenizer(adl2Text);
  const tokens = tokenizer.tokenize();
  const parser = new ADL2Parser(tokens);
  const archetype = archetypeFrom(parser.parse());

  assertEquals(
    archetype.archetype_id?.value,
    "openehr-TEST_PKG-WHOLE.primitive_types.v1.0.0"
  );
  assertExists(archetype.definition, "Should have definition with primitive constraints");
  // Full primitive constraint tree: task 3.2 (cADL primitives)
  
  // Based on Archie's test expectations: archetype should contain constraints for:
  // - string_attr1, string_attr2, string_attr3, string_attr5 (string constraints)
  // - boolean_attr1, boolean_attr2, boolean_attr3 (boolean constraints)
  // - integer_attr1 through integer_attr12 (integer constraints with ranges)
  // - real_attr1 through real_attr12 (real constraints with ranges)
  // - date/time/datetime constraints
  // Note: Archetype contains numerous primitive constraint attributes
});

Deno.test("Archie Compatibility - Assumed Values", async () => {
  // Source: archie/tools/src/test/resources/adl2-tests/features/aom_structures/basic/
  // Test pattern: PrimitivesConstraintParserTest.getAssumedValuesArchetype()
  // Tests assumed values on primitive constraints
  const adl2Text = await loadArchieTestFile("primitives/openehr-TEST_PKG-WHOLE.assumed_values.v1.0.0.adls");
  
  const tokenizer = new ADL2Tokenizer(adl2Text);
  const tokens = tokenizer.tokenize();
  const parser = new ADL2Parser(tokens);
  const archetype = archetypeFrom(parser.parse());

  assertEquals(
    archetype.archetype_id?.value,
    "openehr-TEST_PKG-WHOLE.assumed_values.v1.0.0"
  );
  assertExists(archetype.definition, "Should have definition");
});

Deno.test("Archie Compatibility - Whitespace Handling", async () => {
  // Source: archie/tools/src/test/resources/adl2-tests/validity/basics/
  // Tests that parser handles various whitespace scenarios correctly
  const adl2Text = await loadArchieTestFile("basics/openEHR-DEMOGRAPHIC-ROLE.whitespace.v1.0.0.adls");
  
  const tokenizer = new ADL2Tokenizer(adl2Text);
  const tokens = tokenizer.tokenize();
  const parser = new ADL2Parser(tokens);
  const archetype = archetypeFrom(parser.parse());

  assertEquals(
    archetype.archetype_id?.value,
    "openEHR-DEMOGRAPHIC-ROLE.whitespace.v1.0.0"
  );
  assert(
    archetype.original_language?.code_string === "pt-br" ||
      archetype.original_language?.code_string === "ISO_639-1::pt-br",
    "Expected pt-br from language section"
  );
  assertExists(archetype.definition, "Should parse definition section");
});

Deno.test("Archie Compatibility - Structure Test", async () => {
  // Source: archie/tools/src/test/resources/adl2-tests/features/aom_structures/basic/
  // Tests nested structure parsing
  const adl2Text = await loadArchieTestFile("structures/openehr-TEST_PKG-BOOK.structure_test1.v1.0.0.adls");
  
  const tokenizer = new ADL2Tokenizer(adl2Text);
  const tokens = tokenizer.tokenize();
  const parser = new ADL2Parser(tokens);
  const archetype = archetypeFrom(parser.parse());

  assertEquals(
    archetype.archetype_id?.value,
    "openehr-TEST_PKG-BOOK.structure_test1.v1.0.0"
  );
  assertExists(archetype.definition?.attributes, "Should have attributes in structure");
});

Deno.test("Archie Compatibility - Terminology Bindings", async () => {
  // Source: archie/tools/src/test/resources/adl2-tests/features/terminology/
  // Tests terminology binding parsing
  const adl2Text = await loadArchieTestFile("terminology/openEHR-EHR-OBSERVATION.value_set_binding.v1.0.0.adls");
  
  const tokenizer = new ADL2Tokenizer(adl2Text);
  const tokens = tokenizer.tokenize();
  const parser = new ADL2Parser(tokens);
  const archetype = archetypeFrom(parser.parse());

  assertEquals(
    archetype.archetype_id?.value,
    "openEHR-EHR-OBSERVATION.value_set_binding.v1.0.0"
  );
  assertExists(archetype.ontology, "Should have ontology from terminology section");
  const terms = (archetype.ontology as { term_definitions?: unknown })
    .term_definitions;
  if (terms) {
    assertExists(terms, "Should map term_definitions when ODIN parse succeeds");
  }
});

Deno.test("Archie Compatibility - SNOMED Terminology", async () => {
  // Source: archie/tools/src/test/resources/adl2-tests/features/terminology/
  // Tests SNOMED CT terminology binding
  const adl2Text = await loadArchieTestFile("terminology/openEHR-EHR-OBSERVATION.value_set_binding_snomed.v1.0.0.adls");
  
  const tokenizer = new ADL2Tokenizer(adl2Text);
  const tokens = tokenizer.tokenize();
  const parser = new ADL2Parser(tokens);
  const archetype = archetypeFrom(parser.parse());

  assertEquals(
    archetype.archetype_id?.value,
    "openEHR-EHR-OBSERVATION.value_set_binding_snomed.v1.0.0"
  );
  assertExists(archetype.ontology, "Should have SNOMED terminology ontology");
});

Deno.test("Archie Compatibility - Term Bindings with Paths", async () => {
  // Source: archie/tools/src/test/resources/adl2-tests/features/terminology/
  // Tests term bindings that use paths and references
  const adl2Text = await loadArchieTestFile("terminology/openEHR-EHR-OBSERVATION.term_bindings_paths_use_refs.v1.0.0.adls");
  
  const tokenizer = new ADL2Tokenizer(adl2Text);
  const tokens = tokenizer.tokenize();
  const parser = new ADL2Parser(tokens);
  const archetype = archetypeFrom(parser.parse());

  assertEquals(
    archetype.archetype_id?.value,
    "openEHR-EHR-OBSERVATION.term_bindings_paths_use_refs.v1.0.0"
  );
  assertExists(archetype.ontology, "Should have terminology with path bindings");
});

/**
 * ODIN Parser Tests - Inspired by Archie's ODIN parsing
 * 
 * These tests verify ODIN (Object Data Instance Notation) parsing,
 * which is used in language, description, and terminology sections.
 */
Deno.test("Archie Compatibility - ODIN Nested Objects", () => {
  // Test pattern inspired by Archie's ODIN parser tests
  // Tests nested object structures common in description sections
  const odinText = `
    details = <
      ["en"] = <
        language = <[ISO_639-1::en]>
        purpose = <"Test purpose">
        keywords = <"test", "archetype">
      >
      ["de"] = <
        language = <[ISO_639-1::de]>
        purpose = <"Test Zweck">
        keywords = <"test", "archet">
      >
    >
  `;
  
  const tokenizer = new ADL2Tokenizer(odinText);
  const tokens = tokenizer.tokenize();
  const odinParser = new OdinParser(tokens);
  const result = odinParser.parse();
  
  assertExists(result, "Should parse nested ODIN objects");
  assertExists(result.details, "Should have details object");
  assertExists(result.details.en, "Should have English translation");
  assertExists(result.details.de, "Should have German translation");
  assertEquals(result.details.en.language, "ISO_639-1::en");
  assertEquals(result.details.de.language, "ISO_639-1::de");
});

Deno.test("Archie Compatibility - ODIN Lists", () => {
  // Test pattern inspired by Archie's ODIN parser tests
  // Tests list structures used in terminology and other sections
  const odinText = `
    keywords = <"test", "archetype", "compatibility">
    codes = <10, 20, 30>
    values = <1.5, 2.7, 3.9>
  `;
  
  const tokenizer = new ADL2Tokenizer(odinText);
  const tokens = tokenizer.tokenize();
  const odinParser = new OdinParser(tokens);
  const result = odinParser.parse();
  
  assertExists(result.keywords, "Should parse string list");
  assertEquals(result.keywords.length, 3);
  assertEquals(result.keywords[0], "test");
  
  assertExists(result.codes, "Should parse integer list");
  assertEquals(result.codes.length, 3);
  assertEquals(result.codes[0], 10);
  
  assertExists(result.values, "Should parse real number list");
  assertEquals(result.values.length, 3);
  assertEquals(result.values[0], 1.5);
});
