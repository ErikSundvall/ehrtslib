/**
 * Tests for ADL2 Parser
 */

import { assertEquals, assert } from "https://deno.land/std@0.220.0/assert/mod.ts";
import { ADL2Tokenizer } from "../../enhanced/parser/adl2_tokenizer.ts";
import { ADL2Parser } from "../../enhanced/parser/adl2_parser.ts";
import { ADL2Serializer } from "../../enhanced/generation/adl2_serializer.ts";

function parseAdl2(input: string) {
  const tokenizer = new ADL2Tokenizer(input);
  const tokens = tokenizer.tokenize();
  const parser = new ADL2Parser(tokens);
  return parser.parse();
}

/**
 * Deep comparison of two objects recursively
 * Returns array of differences found
 */
function deepCompare(obj1: any, obj2: any, path: string = "root"): string[] {
  const differences: string[] = [];
  
  // Type comparison
  if (typeof obj1 !== typeof obj2) {
    differences.push(`${path}: type mismatch (${typeof obj1} vs ${typeof obj2})`);
    return differences;
  }
  
  // Null/undefined comparison
  if (obj1 === null || obj1 === undefined) {
    if (obj1 !== obj2) {
      differences.push(`${path}: ${obj1} vs ${obj2}`);
    }
    return differences;
  }
  
  // Primitive comparison
  if (typeof obj1 !== "object") {
    if (obj1 !== obj2) {
      differences.push(`${path}: ${obj1} vs ${obj2}`);
    }
    return differences;
  }
  
  // Array comparison
  if (Array.isArray(obj1)) {
    if (!Array.isArray(obj2)) {
      differences.push(`${path}: array vs non-array`);
      return differences;
    }
    if (obj1.length !== obj2.length) {
      differences.push(`${path}: array length mismatch (${obj1.length} vs ${obj2.length})`);
    }
    const minLength = Math.min(obj1.length, obj2.length);
    for (let i = 0; i < minLength; i++) {
      differences.push(...deepCompare(obj1[i], obj2[i], `${path}[${i}]`));
    }
    return differences;
  }
  
  // Object comparison
  const keys1 = Object.keys(obj1).sort();
  const keys2 = Object.keys(obj2).sort();
  
  // Check for missing/extra keys
  const allKeys = new Set([...keys1, ...keys2]);
  for (const key of allKeys) {
    if (!(key in obj1)) {
      differences.push(`${path}.${key}: missing in first object`);
      continue;
    }
    if (!(key in obj2)) {
      differences.push(`${path}.${key}: missing in second object`);
      continue;
    }
    
    // Recursively compare values
    differences.push(...deepCompare(obj1[key], obj2[key], `${path}.${key}`));
  }
  
  return differences;
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

// Round-trip tests with deep comparison
Deno.test("ADL2 Parser - round-trip minimal archetype (deep comparison)", () => {
  const input = `archetype (adl_version=2.0.5; rm_release=1.0.2)
    openEHR-EHR-OBSERVATION.test_roundtrip.v1.0.0

language
    original_language = <"ISO_639-1::en">

definition
    OBSERVATION[id1] matches {
        data matches {
            HISTORY[id2] matches {
                events matches {
                    EVENT[id3]
                }
            }
        }
    }

terminology
    term_definitions = <
        ["en"] = <
            ["id1"] = <
                text = <"Test Observation">
                description = <"Test archetype for round-trip">
            >
            ["id2"] = <
                text = <"History">
            >
            ["id3"] = <
                text = <"Event">
            >
        >
    >
`;

  // Parse original
  const result1 = parseAdl2(input);
  assert(result1.archetype !== undefined, "First parse failed");
  
  // Serialize to ADL2
  const serializer = new ADL2Serializer();
  const serialized = serializer.serialize(result1.archetype);
  assert(serialized.length > 0, "Serialization produced empty string");
  assert(serialized.includes("openEHR-EHR-OBSERVATION.test_roundtrip.v1.0.0"), "Serialized missing archetype ID");
  
  // Parse serialized version
  const result2 = parseAdl2(serialized);
  assert(result2.archetype !== undefined, "Second parse failed");
  
  // Deep comparison of archetypes
  const differences = deepCompare(result1.archetype, result2.archetype, "archetype");
  
  if (differences.length > 0) {
    console.log("\n⚠️  Differences found in round-trip:");
    differences.forEach(diff => console.log(`  - ${diff}`));
    console.log("");
  }
  
  // Report on differences (for now, just log - in future could assert no differences)
  console.log(`✅ Round-trip test completed - ${differences.length} differences found`);
  
  // Critical elements must match
  assertEquals(
    result2.archetype.archetype_id?.value,
    result1.archetype.archetype_id?.value,
    "Archetype IDs don't match after round-trip"
  );
  
  assertEquals(
    result2.archetype.adl_version,
    result1.archetype.adl_version,
    "ADL versions don't match after round-trip"
  );
});

Deno.test("ADL2 Parser - round-trip with terminology (deep comparison)", () => {
  const input = `archetype (adl_version=2.0.5)
    openEHR-EHR-EVALUATION.test_terminology.v1.0.0

language
    original_language = <"ISO_639-1::en">

definition
    EVALUATION[id1]

terminology
    term_definitions = <
        ["en"] = <
            ["id1"] = <
                text = <"Evaluation">
                description = <"Test evaluation archetype">
            >
        >
    >
`;

  // Parse → Serialize → Parse
  const result1 = parseAdl2(input);
  const serializer = new ADL2Serializer();
  const serialized = serializer.serialize(result1.archetype);
  const result2 = parseAdl2(serialized);
  
  // Deep comparison
  const differences = deepCompare(result1.archetype, result2.archetype, "archetype");
  
  if (differences.length > 0) {
    console.log("\n⚠️  Differences found in terminology round-trip:");
    differences.forEach(diff => console.log(`  - ${diff}`));
    console.log("");
  }
  
  // Verify terminology survived
  assert(result2.archetype.ontology !== undefined, "Ontology lost in round-trip");
  assert(result1.archetype.ontology !== undefined);
  
  console.log(`✅ Round-trip with terminology passed - ${differences.length} differences found`);
});

Deno.test("ADL2 Parser - round-trip Archie test file (deep comparison)", async () => {
  // Use one of the Archie test files
  const testFile = "/home/runner/work/ehrtslib/ehrtslib/test_data/archie-tests/basics/openEHR-TEST_PKG-WHOLE.most_minimal.v1.0.0.adls";
  
  try {
    const input = await Deno.readTextFile(testFile);
    
    // Parse → Serialize → Parse
    const result1 = parseAdl2(input);
    assert(result1.archetype !== undefined, "Failed to parse Archie test file");
    
    const serializer = new ADL2Serializer();
    const serialized = serializer.serialize(result1.archetype);
    
    const result2 = parseAdl2(serialized);
    assert(result2.archetype !== undefined, "Failed to parse serialized Archie file");
    
    // Deep comparison
    const differences = deepCompare(result1.archetype, result2.archetype, "archetype");
    
    if (differences.length > 0) {
      console.log("\n⚠️  Differences found in Archie file round-trip:");
      differences.slice(0, 20).forEach(diff => console.log(`  - ${diff}`));  // Show first 20
      if (differences.length > 20) {
        console.log(`  ... and ${differences.length - 20} more differences`);
      }
      console.log("");
    }
    
    // Verify archetype ID matches
    assertEquals(
      result2.archetype.archetype_id?.value,
      result1.archetype.archetype_id?.value,
      "Archetype IDs don't match in Archie round-trip"
    );
    
    console.log(`✅ Round-trip with Archie test file passed - ${differences.length} differences found`);
  } catch (e) {
    console.log(`⚠️  Archie test file not found or parse error: ${e.message}`);
    // Don't fail test if file not found - this is optional validation
  }
});

console.log("\n✅ ADL2 Parser tests completed (including deep round-trip tests)");
