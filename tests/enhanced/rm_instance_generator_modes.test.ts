import { assert, assertEquals } from "https://deno.land/std@0.220.0/assert/mod.ts";
import * as openehr_am from "../../enhanced/openehr_am.ts";
import { RMInstanceGenerator } from "../../enhanced/generation/mod.ts";

function createOperationalTemplate(): openehr_am.OPERATIONAL_TEMPLATE {
  const template = new openehr_am.OPERATIONAL_TEMPLATE();
  const definition = new openehr_am.C_COMPLEX_OBJECT();
  definition.rm_type_name = "COMPOSITION";
  definition.node_id = "id1";

  const contentAttr = new openehr_am.C_SINGLE_ATTRIBUTE();
  contentAttr.rm_attribute_name = "content";
  const section = new openehr_am.C_COMPLEX_OBJECT();
  section.rm_type_name = "SECTION";
  section.node_id = "id2";
  (section as any).occurrences = { lower: 0, upper: 1 };
  contentAttr.children = [section] as any;

  const itemsAttr = new openehr_am.C_MULTIPLE_ATTRIBUTE();
  itemsAttr.rm_attribute_name = "items";
  (itemsAttr as any).cardinality = { interval: { lower: 0, upper: 3 } };
  const element = new openehr_am.C_COMPLEX_OBJECT();
  element.rm_type_name = "ELEMENT";
  element.node_id = "id3";
  itemsAttr.children = [element] as any;
  section.attributes = [itemsAttr] as any;

  definition.attributes = [contentAttr] as any;
  template.definition = definition;
  return template;
}

Deno.test("RMInstanceGenerator minimal mode includes mandatory RM fields and omits optional content", () => {
  const generator = new RMInstanceGenerator({ mode: "minimal" });
  const instance = generator.generate(createOperationalTemplate());

  assertEquals(instance._type, "COMPOSITION");
  assert("language" in instance);
  assert("territory" in instance);
  assert("category" in instance);
  assert("composer" in instance);
  assert(!("content" in instance));
});

Deno.test("RMInstanceGenerator maximal mode fills optional fields and cardinality upper bound", () => {
  const generator = new RMInstanceGenerator({ mode: "maximal" });
  const instance = generator.generate(createOperationalTemplate());

  assert(instance.content);
  assertEquals(instance.content._type, "SECTION");
  assert(Array.isArray(instance.content.items));
  assertEquals(instance.content.items.length, 3);
});

Deno.test("RMInstanceGenerator fillOptional override works independently of mode", () => {
  const generator = new RMInstanceGenerator({ mode: "minimal", fillOptional: true });
  const instance = generator.generate(createOperationalTemplate());

  assert(instance.content);
});
