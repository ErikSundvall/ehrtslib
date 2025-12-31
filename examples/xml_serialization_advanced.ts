/**
 * Advanced XML Serialization Examples
 * 
 * This file demonstrates advanced usage patterns including
 * error handling, custom types, and integration scenarios.
 */

import { 
  XmlSerializer, 
  XmlDeserializer,
  TypeRegistry,
  SerializationError,
  DeserializationError,
  TypeNotFoundError
} from "../enhanced/serialization/xml/mod.ts";
import { DV_TEXT, DV_CODED_TEXT, CODE_PHRASE, TERMINOLOGY_ID } from "../enhanced/openehr_rm.ts";

// Register types
TypeRegistry.registerModule({
  DV_TEXT,
  DV_CODED_TEXT,
  CODE_PHRASE,
  TERMINOLOGY_ID
});

console.log("=== Advanced Example 1: Error Handling ===\n");

// Demonstrate error handling during serialization
try {
  const serializer = new XmlSerializer();
  
  // This should work
  const dvText = new DV_TEXT();
  dvText.value = "Test";
  const xml = serializer.serialize(dvText);
  console.log("✓ Serialization successful");
} catch (error) {
  if (error instanceof SerializationError) {
    console.error("✗ Serialization failed:", error.message);
    console.error("  Object:", error.object);
  }
}
console.log();

console.log("=== Advanced Example 2: Unknown Type Handling ===\n");

// Strict mode: throws error on unknown type
try {
  const strictDeserializer = new XmlDeserializer({ strict: true });
  const unknownXml = `<unknown_type xsi:type="UNKNOWN_TYPE" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    <value>Test</value>
  </unknown_type>`;
  
  strictDeserializer.deserialize(unknownXml);
} catch (error) {
  if (error instanceof TypeNotFoundError) {
    console.log("✓ Strict mode correctly threw TypeNotFoundError");
    console.log(`  Unknown type: ${error.typeName}`);
  }
}

// Non-strict mode: returns plain object
try {
  const lenientDeserializer = new XmlDeserializer({ strict: false });
  const unknownXml = `<unknown_type xsi:type="UNKNOWN_TYPE" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    <value>Test</value>
  </unknown_type>`;
  
  const result = lenientDeserializer.deserialize(unknownXml);
  console.log("✓ Non-strict mode returned plain object");
  console.log(`  Value: ${result.value}`);
} catch (error) {
  console.error("✗ Unexpected error:", error);
}
console.log();

console.log("=== Advanced Example 3: Complex Object with Multiple Levels ===\n");

// Create a complex nested structure
const dvCodedText = new DV_CODED_TEXT();
dvCodedText.value = "event";

const definingCode = new CODE_PHRASE();
definingCode.code_string = "433";

const openehrTermId = new TERMINOLOGY_ID();
openehrTermId.value = "openehr";
definingCode.terminology_id = openehrTermId;

dvCodedText.defining_code = definingCode;

const serializer = new XmlSerializer({ 
  prettyPrint: true,
  includeDeclaration: true 
});

const complexXml = serializer.serialize(dvCodedText);
console.log("Complex nested XML:");
console.log(complexXml);
console.log();

// Deserialize and verify
const deserializer = new XmlDeserializer();
const restoredComplex = deserializer.deserialize<DV_CODED_TEXT>(complexXml);

console.log("Verification:");
console.log(`  Value: ${restoredComplex.value}`);
console.log(`  Code: ${restoredComplex.defining_code?.code_string}`);
console.log(`  Terminology: ${restoredComplex.defining_code?.terminology_id?.value}`);
console.log();

console.log("=== Advanced Example 4: Type Inference ===\n");

// XML without xsi:type - type inferred from element name
const xmlWithoutType = `<dv_text>
  <value>Inferred from element name</value>
</dv_text>`;

try {
  const inferred = deserializer.deserialize<DV_TEXT>(xmlWithoutType);
  console.log("✓ Type successfully inferred from element name");
  console.log(`  Type: ${inferred.constructor.name}`);
  console.log(`  Value: ${inferred.value}`);
} catch (error) {
  console.error("✗ Type inference failed:", error);
}
console.log();

console.log("=== Advanced Example 5: Explicit Type Deserialization ===\n");

// Use deserializeAs when type info is missing or ambiguous
const ambiguousXml = `<data><value>Explicit type needed</value></data>`;

try {
  const explicit = deserializer.deserializeAs(ambiguousXml, DV_TEXT);
  console.log("✓ Deserialized with explicit type");
  console.log(`  Type: ${explicit.constructor.name}`);
  console.log(`  Value: ${explicit.value}`);
} catch (error) {
  console.error("✗ Explicit deserialization failed:", error);
}
console.log();

console.log("=== Advanced Example 6: Custom Namespace ===\n");

const customNsSerializer = new XmlSerializer({
  useNamespaces: true,
  namespace: "http://example.com/custom-openehr",
  prettyPrint: true,
  includeDeclaration: true
});

const dvTextCustomNs = new DV_TEXT();
dvTextCustomNs.value = "Custom namespace example";

const customNsXml = customNsSerializer.serialize(dvTextCustomNs);
console.log("XML with custom namespace:");
console.log(customNsXml);
console.log();

console.log("=== Advanced Example 7: Batch Processing ===\n");

// Process multiple objects efficiently
const objects = [
  (() => { const t = new DV_TEXT(); t.value = "First"; return t; })(),
  (() => { const t = new DV_TEXT(); t.value = "Second"; return t; })(),
  (() => { const t = new DV_TEXT(); t.value = "Third"; return t; })(),
];

console.log("Serializing multiple objects:");
const batchSerializer = new XmlSerializer({ prettyPrint: false });

objects.forEach((obj, index) => {
  const xml = batchSerializer.serialize(obj);
  console.log(`  Object ${index + 1}: ${xml.substring(0, 60)}...`);
});
console.log();

console.log("=== Advanced Example 8: TypeRegistry Introspection ===\n");

console.log("Registered types:");
const registeredTypes = TypeRegistry.getAllTypeNames();
registeredTypes.forEach(typeName => {
  const constructor = TypeRegistry.getConstructor(typeName);
  console.log(`  - ${typeName} → ${constructor?.name}`);
});
console.log();

console.log("Check specific type:");
console.log(`  DV_TEXT registered: ${TypeRegistry.hasType("DV_TEXT")}`);
console.log(`  UNKNOWN registered: ${TypeRegistry.hasType("UNKNOWN")}`);
console.log();

console.log("=== Advanced Example 9: Performance Considerations ===\n");

// Reuse serializer instances for better performance
const reuseSerializer = new XmlSerializer({ prettyPrint: false });
const reuseDeserializer = new XmlDeserializer();

const startTime = Date.now();

// Serialize and deserialize 100 objects
for (let i = 0; i < 100; i++) {
  const obj = new DV_TEXT();
  obj.value = `Test object ${i}`;
  
  const xml = reuseSerializer.serialize(obj);
  const restored = reuseDeserializer.deserialize<DV_TEXT>(xml);
}

const endTime = Date.now();
console.log(`✓ Processed 100 round-trips in ${endTime - startTime}ms`);
console.log("  Tip: Reuse serializer/deserializer instances for best performance");
console.log();

console.log("All advanced examples completed successfully!");
