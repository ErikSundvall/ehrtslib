import { YamlSerializer, HYBRID_YAML_CONFIG } from "./enhanced/serialization/yaml/mod.ts";
import { DV_TEXT, SECTION, ELEMENT, DV_QUANTITY } from "./enhanced/openehr_rm.ts";
import { TypeRegistry } from "./enhanced/serialization/common/type_registry.ts";
import * as rm from "./enhanced/openehr_rm.ts";
import * as base from "./enhanced/openehr_base.ts";

TypeRegistry.registerModule(rm);
TypeRegistry.registerModule(base);

const dvText = new DV_TEXT();
dvText.value = "Vital Signs";

const serializer = new YamlSerializer(HYBRID_YAML_CONFIG);
const yaml = serializer.serialize(dvText);

console.log("Current DV_TEXT output:");
console.log(yaml);
console.log("\n---Expected: {value: Vital Signs} or value: Vital Signs");

// Test with SECTION
const section = new SECTION();
section.name = new DV_TEXT();
section.name.value = "Test Section";

const element = new ELEMENT();
element.name = new DV_TEXT();
element.name.value = "Pulse";
element.value = new DV_QUANTITY();
element.value.magnitude = 72;
element.value.units = "/min";

section.items = [element];

const yaml2 = serializer.serialize(section);
console.log("\n\nCurrent SECTION output:");
console.log(yaml2);
console.log("\n---Expected inline format for simple objects like {value: Pulse}");
