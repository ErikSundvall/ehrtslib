/**
 * Basic YAML Serialization Examples
 * 
 * Demonstrates basic usage of YAML serialization for openEHR RM objects.
 */

import { YamlSerializer, YamlDeserializer, STANDARD_YAML_CONFIG } from "../enhanced/serialization/yaml/mod.ts";
import { DV_TEXT, CODE_PHRASE, DV_CODED_TEXT } from "../enhanced/openehr_rm.ts";
import { TERMINOLOGY_ID } from "../enhanced/openehr_base.ts";
import { TypeRegistry } from "../enhanced/serialization/common/type_registry.ts";
import * as rm from "../enhanced/openehr_rm.ts";
import * as base from "../enhanced/openehr_base.ts";

// Register all RM types (required once at startup)
TypeRegistry.registerModule(rm);
TypeRegistry.registerModule(base);

console.log("=== YAML Serialization Examples ===\n");

// Example 1: Simple DV_TEXT
console.log("1. Simple DV_TEXT:");
const dvText = new DV_TEXT();
dvText.value = "Patient has diabetes mellitus";

const yamlSerializer = new YamlSerializer();
const yaml1 = yamlSerializer.serialize(dvText);
console.log(yaml1);

// Example 2: CODE_PHRASE
console.log("2. CODE_PHRASE:");
const codePhrase = new CODE_PHRASE();
codePhrase.terminology_id = new TERMINOLOGY_ID();
codePhrase.terminology_id.value = "SNOMED-CT";
codePhrase.code_string = "73211009";
codePhrase.preferred_term = "Diabetes mellitus";

const yaml2 = yamlSerializer.serialize(codePhrase);
console.log(yaml2);

// Example 3: DV_CODED_TEXT
console.log("3. DV_CODED_TEXT:");
const codedText = new DV_CODED_TEXT();
codedText.value = "Diabetes mellitus";
codedText.defining_code = codePhrase;

const yaml3 = yamlSerializer.serialize(codedText);
console.log(yaml3);

// Example 4: Standard YAML Config
console.log("4. Standard YAML Configuration:");
const standardSerializer = new YamlSerializer(STANDARD_YAML_CONFIG);
const yaml4 = standardSerializer.serialize(dvText);
console.log(yaml4);

// Example 5: Deserialization
console.log("5. Deserialization:");
const yamlString = `
_type: DV_TEXT
value: Restored from YAML
`;

const deserializer = new YamlDeserializer();
const restored = deserializer.deserialize(yamlString);
console.log("Restored object:", restored);
console.log("Value:", restored.value);
console.log();

// Example 6: Round-trip
console.log("6. Round-trip (serialize → deserialize):");
const original = new DV_TEXT();
original.value = "Round-trip YAML test";

const serialized = yamlSerializer.serialize(original);
console.log("Serialized:");
console.log(serialized);

const deserialized = deserializer.deserialize(serialized);
console.log("Deserialized value:", deserialized.value);
console.log("Match:", original.value === deserialized.value ? "✓" : "✗");
console.log();

// Example 7: Multi-line Strings
console.log("7. YAML Multi-line Strings:");
const longText = new DV_TEXT();
longText.value = `This is a long clinical note
with multiple lines
and various observations
about the patient's condition.`;

const yamlMultiline = yamlSerializer.serialize(longText);
console.log(yamlMultiline);

console.log("=== Examples Complete ===");
console.log("\nNote: YAML is not an official openEHR standard,");
console.log("      but provides excellent readability!");
