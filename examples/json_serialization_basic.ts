/**
 * Basic JSON Serialization Examples
 * 
 * Demonstrates basic usage of JSON serialization for openEHR RM objects.
 */

import { JsonSerializer, JsonDeserializer, CANONICAL_JSON_CONFIG } from "../enhanced/serialization/json/mod.ts";
import { DV_TEXT, CODE_PHRASE, DV_CODED_TEXT } from "../enhanced/openehr_rm.ts";
import { TERMINOLOGY_ID } from "../enhanced/openehr_base.ts";
import { TypeRegistry } from "../enhanced/serialization/common/type_registry.ts";
import * as rm from "../enhanced/openehr_rm.ts";
import * as base from "../enhanced/openehr_base.ts";

// Register all RM types (required once at startup)
TypeRegistry.registerModule(rm);
TypeRegistry.registerModule(base);

console.log("=== JSON Serialization Examples ===\n");

// Example 1: Simple DV_TEXT
console.log("1. Simple DV_TEXT:");
const dvText = new DV_TEXT();
dvText.value = "Patient has diabetes mellitus";

const jsonSerializer = new JsonSerializer({ prettyPrint: true });
const json1 = jsonSerializer.serialize(dvText);
console.log(json1);
console.log();

// Example 2: CODE_PHRASE
console.log("2. CODE_PHRASE:");
const codePhrase = new CODE_PHRASE();
codePhrase.terminology_id = new TERMINOLOGY_ID();
codePhrase.terminology_id.value = "SNOMED-CT";
codePhrase.code_string = "73211009";
codePhrase.preferred_term = "Diabetes mellitus";

const json2 = jsonSerializer.serialize(codePhrase);
console.log(json2);
console.log();

// Example 3: DV_CODED_TEXT
console.log("3. DV_CODED_TEXT:");
const codedText = new DV_CODED_TEXT();
codedText.value = "Diabetes mellitus";
codedText.defining_code = codePhrase;

const json3 = jsonSerializer.serialize(codedText);
console.log(json3);
console.log();

// Example 4: Canonical JSON (openEHR standard)
console.log("4. Canonical JSON (always include type):");
const canonicalSerializer = new JsonSerializer(CANONICAL_JSON_CONFIG);
const json4 = canonicalSerializer.serialize(dvText);
console.log(json4);
console.log();

// Example 5: Compact JSON
console.log("5. Compact JSON (no pretty print, type inference):");
const compactSerializer = new JsonSerializer({
  alwaysIncludeType: false,
  prettyPrint: false,
  includeEmptyCollections: false
});
const json5 = compactSerializer.serialize(dvText);
console.log(json5);
console.log();

// Example 6: Deserialization
console.log("6. Deserialization:");
const jsonString = '{"_type":"DV_TEXT","value":"Restored from JSON"}';
const deserializer = new JsonDeserializer();
const restored = deserializer.deserialize(jsonString);
console.log("Restored object:", restored);
console.log("Value:", restored.value);
console.log();

// Example 7: Round-trip
console.log("7. Round-trip (serialize → deserialize):");
const original = new DV_TEXT();
original.value = "Round-trip test";

const serialized = jsonSerializer.serialize(original);
console.log("Serialized:", serialized);

const deserialized = deserializer.deserialize(serialized);
console.log("Deserialized value:", deserialized.value);
console.log("Match:", original.value === deserialized.value ? "✓" : "✗");
console.log();

console.log("=== Examples Complete ===");
