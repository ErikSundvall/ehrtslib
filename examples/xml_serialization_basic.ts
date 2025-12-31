/**
 * Basic XML Serialization Examples
 * 
 * This file demonstrates basic usage of the XML serialization module
 * for openEHR RM objects.
 */

import { 
  XmlSerializer, 
  XmlDeserializer,
  TypeRegistry 
} from "../enhanced/serialization/xml/mod.ts";
import { DV_TEXT, CODE_PHRASE, TERMINOLOGY_ID } from "../enhanced/openehr_rm.ts";

// Register types (required for deserialization)
TypeRegistry.register("DV_TEXT", DV_TEXT);
TypeRegistry.register("CODE_PHRASE", CODE_PHRASE);
TypeRegistry.register("TERMINOLOGY_ID", TERMINOLOGY_ID);

console.log("=== Example 1: Simple DV_TEXT Serialization ===\n");

// Create a simple DV_TEXT object
const dvText = new DV_TEXT();
dvText.value = "Patient has elevated temperature";

// Serialize with pretty printing
const serializer = new XmlSerializer({ 
  prettyPrint: true,
  includeDeclaration: true
});

const xml1 = serializer.serialize(dvText);
console.log("Serialized XML:");
console.log(xml1);
console.log();

console.log("=== Example 2: Deserializing XML ===\n");

// Deserialize the XML back to an object
const deserializer = new XmlDeserializer();
const restored = deserializer.deserialize<DV_TEXT>(xml1);

console.log("Restored object:");
console.log(`Value: ${restored.value}`);
console.log(`Type: ${restored.constructor.name}`);
console.log();

console.log("=== Example 3: Nested Object (CODE_PHRASE) ===\n");

// Create a CODE_PHRASE with nested TERMINOLOGY_ID
const codePhrase = new CODE_PHRASE();
codePhrase.code_string = "en";

const terminologyId = new TERMINOLOGY_ID();
terminologyId.value = "ISO_639-1";
codePhrase.terminology_id = terminologyId;

// Note: XML serialization doesn't support terse format (per openEHR ITS-XML spec).
// For compact representation, use JSON/YAML serialization with terse format enabled:
// In terse format this would be: "ISO_639-1::en"
// See Phase 4g.4 for JSON/YAML serialization with terse format support.

const xml2 = serializer.serialize(codePhrase);
console.log("Serialized CODE_PHRASE:");
console.log(xml2);
console.log();

console.log("=== Example 4: Round-Trip Serialization ===\n");

// Serialize and deserialize to verify data integrity
const restoredCodePhrase = deserializer.deserialize<CODE_PHRASE>(xml2);

console.log("Original code_string:", codePhrase.code_string);
console.log("Restored code_string:", restoredCodePhrase.code_string);
console.log("Original terminology_id:", codePhrase.terminology_id?.value);
console.log("Restored terminology_id:", restoredCodePhrase.terminology_id?.value);
console.log("Round-trip successful:", 
  codePhrase.code_string === restoredCodePhrase.code_string &&
  codePhrase.terminology_id?.value === restoredCodePhrase.terminology_id?.value
);
console.log();

console.log("=== Example 5: Compact XML (No Pretty Print) ===\n");

const compactSerializer = new XmlSerializer({ 
  prettyPrint: false,
  includeDeclaration: false
});

const compactXml = compactSerializer.serialize(dvText);
console.log("Compact XML:");
console.log(compactXml);
console.log();

console.log("=== Example 6: Without XML Namespaces ===\n");

const noNamespaceSerializer = new XmlSerializer({
  useNamespaces: false,
  prettyPrint: true,
  includeDeclaration: true
});

const xmlNoNs = noNamespaceSerializer.serialize(dvText);
console.log("XML without namespaces:");
console.log(xmlNoNs);
console.log();

console.log("=== Example 7: Custom Configuration ===\n");

// One-time custom configuration with serializeWith
const customXml = serializer.serializeWith(dvText, {
  rootElement: "custom_element",
  includeDeclaration: false,
  prettyPrint: true,
  indent: "    " // 4 spaces instead of 2
});

console.log("Custom configured XML:");
console.log(customXml);
console.log();

console.log("All examples completed successfully!");
