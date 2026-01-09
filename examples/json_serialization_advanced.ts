/**
 * Advanced JSON Serialization Examples
 * 
 * Demonstrates advanced features including terse format, type inference,
 * and error handling.
 */

import {
  JsonConfigurableSerializer,
  JsonConfigurableDeserializer,
  NON_STANDARD_VERY_COMPACT_JSON_CONFIG,
  COMPACT_JSON_CONFIG
} from "../enhanced/serialization/json/mod.ts";
import {
  DeserializationError,
  TypeNotFoundError
} from "../enhanced/serialization/common/mod.ts";
import { DV_TEXT, CODE_PHRASE, DV_CODED_TEXT } from "../enhanced/openehr_rm.ts";
import { TERMINOLOGY_ID } from "../enhanced/openehr_base.ts";
import { TypeRegistry } from "../enhanced/serialization/common/type_registry.ts";
import * as rm from "../enhanced/openehr_rm.ts";
import * as base from "../enhanced/openehr_base.ts";

// Register all RM types
TypeRegistry.registerModule(rm);
TypeRegistry.registerModule(base);

console.log("=== Advanced JSON Serialization Examples ===\n");

// Example 1: Terse Format (Non-standard)
console.log("1. Terse Format (WARNING: Non-standard):");
const codePhrase = new CODE_PHRASE();
codePhrase.terminology_id = new TERMINOLOGY_ID();
codePhrase.terminology_id.value = "ISO_639-1";
codePhrase.code_string = "en";

const terseSerializer = new JsonConfigurableSerializer({ useTerseFormat: true });
const terseJson = terseSerializer.serialize(codePhrase);
console.log("Terse CODE_PHRASE:", terseJson);

const codedText = new DV_CODED_TEXT();
codedText.value = "event";
codedText.defining_code = new CODE_PHRASE();
codedText.defining_code.terminology_id = new TERMINOLOGY_ID();
codedText.defining_code.terminology_id.value = "openehr";
codedText.defining_code.code_string = "433";

const terseJson2 = terseSerializer.serialize(codedText);
console.log("Terse DV_CODED_TEXT:", terseJson2);
console.log();

// Example 2: Deserializing Terse Format
console.log("2. Deserializing Terse Format:");
const terseDeserializer = new JsonConfigurableDeserializer({ parseTerseFormat: true });
const restoredCode = terseDeserializer.deserialize(terseJson);
console.log("Restored CODE_PHRASE:", restoredCode);
console.log("  terminology:", restoredCode.terminology_id.value);
console.log("  code:", restoredCode.code_string);
console.log();

// Example 3: Type Inference
console.log("3. Type Inference (Smart Type Omission):");
const inferenceSerializer = new JsonConfigurableSerializer({
  alwaysIncludeType: false, // Enable inference
  prettyPrint: true
});

const complexObject = new DV_CODED_TEXT();
complexObject.value = "Blood pressure";
complexObject.defining_code = new CODE_PHRASE();
complexObject.defining_code.terminology_id = new TERMINOLOGY_ID();
complexObject.defining_code.terminology_id.value = "LOINC";
complexObject.defining_code.code_string = "85354-9";

const inferredJson = inferenceSerializer.serialize(complexObject);
console.log(inferredJson);
console.log();

// Example 4: Compact Configuration
console.log("4. Compact Configuration (Smallest JSON):");
const compactSerializer = new JsonConfigurableSerializer(COMPACT_JSON_CONFIG);
const compactJson = compactSerializer.serialize(complexObject);
console.log(compactJson);
console.log("Size:", compactJson.length, "bytes");
console.log();

// Example 5: Internal Storage Config (Terse + Compact)
console.log("5. Potential Internal Archive Format (Most Compact):");
const internalSerializer = new JsonConfigurableSerializer(NON_STANDARD_VERY_COMPACT_JSON_CONFIG);
const internalJson = internalSerializer.serialize(codePhrase);
console.log(internalJson);
console.log("Size:", internalJson.length, "bytes (vs canonical JSON which would be larger)");
console.log();

// Example 6: Error Handling
console.log("6. Error Handling:");
try {
  const invalidJson = '{"_type":"UNKNOWN_TYPE","value":"test"}';
  const strictDeserializer = new JsonConfigurableDeserializer({ strict: true });
  strictDeserializer.deserialize(invalidJson);
} catch (error) {
  if (error instanceof TypeNotFoundError) {
    console.log("✓ Caught TypeNotFoundError:", error.typeName);
  } else if (error instanceof DeserializationError) {
    console.log("✓ Caught DeserializationError:", error.message);
  }
}
console.log();

// Example 7: Lenient Mode
console.log("7. Lenient Mode (No Error on Unknown Type):");
try {
  const invalidJson = '{"_type":"UNKNOWN_TYPE","value":"test"}';
  const lenientDeserializer = new JsonConfigurableDeserializer({ strict: false });
  const result = lenientDeserializer.deserialize(invalidJson);
  console.log("✓ Lenient mode returned:", result);
} catch (error) {
  console.log("✗ Unexpected error:", error);
}
console.log();

// Example 8: Reusing Serializer Instances (Best Practice)
console.log("8. Reusing Serializer Instances (Performance):");
const reusableSerializer = new JsonConfigurableSerializer({ prettyPrint: false });

const objects = [
  new DV_TEXT("Object 1"),
  new DV_TEXT("Object 2"),
  new DV_TEXT("Object 3")
];

console.log("Serializing multiple objects:");
objects.forEach((obj, i) => {
  const json = reusableSerializer.serialize(obj);
  console.log(`  ${i + 1}. ${json}`);
});
console.log();

console.log("=== Advanced Examples Complete ===");
console.log("\n⚠️  Remember:");
console.log("  - Terse format breaks openEHR canonical JSON standard");
console.log("  - Use terse format only for internal storage");
console.log("  - Always use canonical format for interoperability");
