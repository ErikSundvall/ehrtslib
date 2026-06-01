/**
 * Round-trip tests for JSON and YAML serialization
 * Tests that objects can be serialized and deserialized without data loss
 * Includes tests for both canonical and configurable serializers
 */

import { assertEquals, assertExists } from "jsr:@std/assert";
import {
  JsonCanonicalSerializer,
  JsonCanonicalDeserializer,
  JsonConfigurableSerializer,
  JsonConfigurableDeserializer,
} from "../../enhanced/serialization/json/mod.ts";
import { YamlSerializer, YamlDeserializer } from "../../enhanced/serialization/yaml/mod.ts";
import { DV_TEXT, CODE_PHRASE, DV_CODED_TEXT, DV_QUANTITY } from "../../enhanced/openehr_rm.ts";
import { TERMINOLOGY_ID } from "../../enhanced/openehr_base.ts";
import { TypeRegistry } from "../../enhanced/serialization/common/type_registry.ts";
import * as rm from "../../enhanced/openehr_rm.ts";
import * as base from "../../enhanced/openehr_base.ts";

// Register all RM types
TypeRegistry.registerModule(rm);
TypeRegistry.registerModule(base);

Deno.test("JSON Round-trip: Complex CODE_PHRASE", () => {
  const original = new CODE_PHRASE();
  original.terminology_id = new TERMINOLOGY_ID();
  original.terminology_id.value = "SNOMED-CT";
  original.code_string = "73211009";
  original.preferred_term = "diabetes mellitus";
  
  const serializer = new JsonConfigurableSerializer({ alwaysIncludeType: true, prettyPrint: true });
  const json = serializer.serialize(original);
  
  console.log("Complex CODE_PHRASE JSON:\n", json);
  
  const deserializer = new JsonConfigurableDeserializer();
  const restored = deserializer.deserialize(json);
  
  assertEquals(restored.terminology_id.value, original.terminology_id.value);
  assertEquals(restored.code_string, original.code_string);
  assertEquals(restored.preferred_term, original.preferred_term);
});

Deno.test("JSON Round-trip: DV_CODED_TEXT", () => {
  const original = new DV_CODED_TEXT();
  original.value = "diabetes mellitus";
  original.defining_code = new CODE_PHRASE();
  original.defining_code.terminology_id = new TERMINOLOGY_ID();
  original.defining_code.terminology_id.value = "SNOMED-CT";
  original.defining_code.code_string = "73211009";
  
  const serializer = new JsonConfigurableSerializer({ alwaysIncludeType: true, prettyPrint: true });
  const json = serializer.serialize(original);
  
  console.log("DV_CODED_TEXT JSON:\n", json);
  
  const deserializer = new JsonConfigurableDeserializer();
  const restored = deserializer.deserialize(json);
  
  assertEquals(restored.value, original.value);
  assertEquals(restored.defining_code.code_string, original.defining_code.code_string);
  assertEquals(restored.defining_code.terminology_id.value, original.defining_code.terminology_id.value);
});

Deno.test("YAML Round-trip: DV_CODED_TEXT", () => {
  const original = new DV_CODED_TEXT();
  original.value = "Blood pressure";
  original.defining_code = new CODE_PHRASE();
  original.defining_code.terminology_id = new TERMINOLOGY_ID();
  original.defining_code.terminology_id.value = "LOINC";
  original.defining_code.code_string = "85354-9";
  
  const serializer = new YamlSerializer();
  const yaml = serializer.serialize(original);
  
  console.log("DV_CODED_TEXT YAML:\n", yaml);
  
  const deserializer = new YamlDeserializer();
  const restored = deserializer.deserialize(yaml);
  
  assertEquals(restored.value, original.value);
  assertEquals(restored.defining_code.code_string, original.defining_code.code_string);
});

Deno.test("JSON to YAML conversion", () => {
  // Create object
  const dvText = new DV_TEXT();
  dvText.value = "Cross-format test";
  
  // Serialize to JSON
  const jsonSerializer = new JsonConfigurableSerializer({ alwaysIncludeType: true });
  const json = jsonSerializer.serialize(dvText);
  
  // Deserialize from JSON
  const jsonDeserializer = new JsonConfigurableDeserializer();
  const obj = jsonDeserializer.deserialize(json);
  
  // Serialize to YAML
  const yamlSerializer = new YamlSerializer();
  const yaml = yamlSerializer.serialize(obj);
  
  console.log("JSON to YAML conversion:\n", yaml);
  
  // Deserialize from YAML
  const yamlDeserializer = new YamlDeserializer();
  const restored = yamlDeserializer.deserialize(yaml);
  
  assertEquals(restored.value, dvText.value);
});

Deno.test("YAML to JSON conversion", () => {
  // Start with YAML
  const yaml = `
_type: DV_TEXT
value: YAML to JSON test
`;
  
  // Deserialize from YAML
  const yamlDeserializer = new YamlDeserializer();
  const obj = yamlDeserializer.deserialize(yaml);
  
  // Serialize to JSON
  const jsonSerializer = new JsonConfigurableSerializer({ alwaysIncludeType: true, prettyPrint: true });
  const json = jsonSerializer.serialize(obj);
  
  console.log("YAML to JSON conversion:\n", json);
  
  // Deserialize from JSON
  const jsonDeserializer = new JsonConfigurableDeserializer();
  const restored = jsonDeserializer.deserialize(json);
  
  assertEquals(restored.value, "YAML to JSON test");
});

Deno.test("JSON Round-trip: with type inference (compact)", () => {
  const original = new DV_TEXT();
  original.value = "Type inference test";
  
  // Serialize without always including type
  const serializer = new JsonConfigurableSerializer({ alwaysIncludeType: false });
  const json = serializer.serialize(original);
  
  console.log("Compact JSON (type inference):", json);
  
  // Deserialize - should infer type from structure
  const deserializer = new JsonConfigurableDeserializer();
  const restored = deserializer.deserialize(json);
  
  assertEquals(restored.value, original.value);
});

Deno.test("JSON Canonical vs Configurable Canonical: Same output", () => {
  const dvText = new DV_TEXT();
  dvText.value = "Comparison test";
  
  const canonicalSerializer = new JsonCanonicalSerializer();
  const configurableSerializer = new JsonConfigurableSerializer({
    alwaysIncludeType: true,
    prettyPrint: true,
    includeNullValues: false,
    includeEmptyCollections: true,
  });
  
  const canonicalJson = canonicalSerializer.serialize(dvText);
  const configurableJson = configurableSerializer.serialize(dvText);
  
  // Both should produce canonical JSON
  assertEquals(canonicalJson, configurableJson);
  console.log("Canonical and Configurable produce same output");
});

Deno.test("JSON Cross-serializer Round-trip: Canonical serialize, Configurable deserialize", () => {
  const original = new DV_TEXT();
  original.value = "Cross-serializer test";
  
  const canonicalSerializer = new JsonCanonicalSerializer();
  const json = canonicalSerializer.serialize(original);
  
  const configurableDeserializer = new JsonConfigurableDeserializer();
  const restored = configurableDeserializer.deserialize(json);
  
  assertEquals(restored.value, original.value);
  console.log("Cross-serializer round-trip successful");
});
