/**
 * Tests for Template Validator
 */

import { assertEquals, assert } from "https://deno.land/std@0.220.0/assert/mod.ts";
import { TemplateValidator } from "../../enhanced/validation/template_validator.ts";
import * as openehr_am from "../../enhanced/openehr_am.ts";

Deno.test("Validator - template with no definition fails", () => {
  const validator = new TemplateValidator();
  const template = new openehr_am.ARCHETYPE();
  
  const result = validator.validate({}, template);
  
  assertEquals(result.valid, false);
  assertEquals(result.errors.length, 1);
  assert(result.errors[0].message.includes("no definition"));
});

Deno.test("Validator - valid simple structure", () => {
  const validator = new TemplateValidator();
  const template = new openehr_am.ARCHETYPE();
  const definition = new openehr_am.C_COMPLEX_OBJECT();
  definition.rm_type_name = "OBSERVATION";
  definition.node_id = "id1";
  template.definition = definition;
  
  const instance = { _type: "OBSERVATION" };
  const result = validator.validate(instance, template);
  
  // Should pass basic validation
  assertEquals(result.valid, true);
});

Deno.test("Validator - missing required attribute", () => {
  const validator = new TemplateValidator();
  const template = new openehr_am.ARCHETYPE();
  
  const definition = new openehr_am.C_COMPLEX_OBJECT();
  definition.rm_type_name = "OBSERVATION";
  definition.node_id = "id1";
  
  const attr = new openehr_am.C_SINGLE_ATTRIBUTE();
  attr.rm_attribute_name = "data";
  
  const child = new openehr_am.C_COMPLEX_OBJECT();
  child.rm_type_name = "HISTORY";
  child.node_id = "id2";
  child.occurrences = { lower: 1, upper: 1 } as any;
  
  attr.children = [child];
  definition.attributes = [attr];
  template.definition = definition;
  
  const instance = { _type: "OBSERVATION" }; // Missing 'data'
  const result = validator.validate(instance, template);
  
  // Should fail - missing required attribute
  assertEquals(result.valid, false);
  assert(result.errors.length > 0);
});

console.log("\n✅ Template Validator tests completed");
