/**
 * Hybrid YAML Serialization Example
 * 
 * Demonstrates the compact hybrid YAML style that combines flow and block formatting.
 * Simple objects are formatted inline for compactness, while complex structures
 * maintain block formatting for readability.
 */

import { YamlSerializer, HYBRID_YAML_CONFIG } from "../enhanced/serialization/yaml/mod.ts";
import { 
  DV_TEXT, 
  CODE_PHRASE, 
  DV_CODED_TEXT, 
  SECTION, 
  ELEMENT, 
  DV_QUANTITY 
} from "../enhanced/openehr_rm.ts";
import { TERMINOLOGY_ID } from "../enhanced/openehr_base.ts";
import { TypeRegistry } from "../enhanced/serialization/common/type_registry.ts";
import * as rm from "../enhanced/openehr_rm.ts";
import * as base from "../enhanced/openehr_base.ts";

// Register all RM types (required once at startup)
TypeRegistry.registerModule(rm);
TypeRegistry.registerModule(base);

console.log("=== Hybrid YAML Serialization Examples ===\n");
console.log("Hybrid style uses flow formatting ({key: value}) for simple objects");
console.log("and block formatting for complex nested structures.\n");

// Example 1: Simple object - formatted inline
console.log("1. Simple DV_TEXT (flow style):");
const simpleText = new DV_TEXT();
simpleText.value = "Patient temperature reading";

const hybridSerializer = new YamlSerializer(HYBRID_YAML_CONFIG);
const yaml1 = hybridSerializer.serialize(simpleText);
console.log(yaml1);
console.log("Note: Simple object with one property uses compact inline format\n");

// Example 2: Nested structure with simple and complex parts
console.log("2. Section with multiple elements (hybrid style):");

const section = new SECTION();
section.name = new DV_TEXT();
section.name.value = "Vital Signs";

// First element: Diabetes diagnosis (DV_CODED_TEXT)
const diabetesElement = new ELEMENT();
diabetesElement.name = new DV_TEXT();
diabetesElement.name.value = "Diagnosis";
diabetesElement.value = new DV_CODED_TEXT();
diabetesElement.value.value = "Diabetes mellitus type 2";
diabetesElement.value.defining_code = new CODE_PHRASE();
diabetesElement.value.defining_code.terminology_id = new TERMINOLOGY_ID();
diabetesElement.value.defining_code.terminology_id.value = "SNOMED-CT";
diabetesElement.value.defining_code.code_string = "44054006";
diabetesElement.value.defining_code.preferred_term = "Type 2 diabetes mellitus";

// Second element: Pulse rate (DV_QUANTITY)
const pulseElement = new ELEMENT();
pulseElement.name = new DV_TEXT();
pulseElement.name.value = "Pulse rate";
pulseElement.value = new DV_QUANTITY();
pulseElement.value.magnitude = 72;
pulseElement.value.units = "/min";

section.items = [diabetesElement, pulseElement];

const yaml2 = hybridSerializer.serialize(section);
console.log(yaml2);
console.log("\nNote: In hybrid style, simple objects like {value: Text} are formatted");
console.log("inline using flow style, while complex structures maintain block formatting.");
console.log("This combines the compactness of JSON with the readability of YAML.\n");

// Example 3: Comparison with other styles
console.log("3. Style Comparison:\n");

console.log("a) Verbose YAML (all types, block style):");
const verboseSerializer = new YamlSerializer({
  includeType: true,
  useTypeInference: false,
  hybridStyle: false,
  useTerseFormat: false,
});
const yaml3a = verboseSerializer.serialize(pulseElement);
console.log(yaml3a);

console.log("b) Default YAML (compact with terse, block style):");
const defaultSerializer = new YamlSerializer();
const yaml3b = defaultSerializer.serialize(pulseElement);
console.log(yaml3b);

console.log("c) Hybrid YAML (compact with terse, mixed flow/block style):");
const yaml3c = hybridSerializer.serialize(pulseElement);
console.log(yaml3c);
console.log("Note: Hybrid is most compact while maintaining readability!\n");

// Example 4: Customizing inline threshold
console.log("4. Custom inline threshold:");
const customSerializer = new YamlSerializer({
  hybridStyle: true,
  useTerseFormat: true,
  maxInlineProperties: 2,  // More strict - only 2 properties inline
  includeType: false,
  useTypeInference: true,
});

const yaml4 = customSerializer.serialize(pulseElement);
console.log(yaml4);
console.log("With maxInlineProperties: 2, objects with 3+ properties use block style\n");

// Example 5: CODE_PHRASE with terse format in hybrid style
console.log("5. CODE_PHRASE with terse format:");
const codePhrase = new CODE_PHRASE();
codePhrase.terminology_id = new TERMINOLOGY_ID();
codePhrase.terminology_id.value = "ISO_639-1";
codePhrase.code_string = "en";

const yaml5 = hybridSerializer.serialize(codePhrase);
console.log(yaml5);
console.log("Terse format makes CODE_PHRASE ultra-compact!\n");

// Example 6: Benefits summary
console.log("=== Hybrid YAML Benefits ===");
console.log("✓ Compact: Simple objects on one line saves vertical space");
console.log("✓ Readable: Complex structures still use clear block formatting");
console.log("✓ Familiar: Combines YAML flow and block styles naturally");
console.log("✓ Flexible: Configurable threshold via maxInlineProperties");
console.log("✓ Terse-friendly: Works seamlessly with terse CODE_PHRASE format");
console.log("\n=== Examples Complete ===");
