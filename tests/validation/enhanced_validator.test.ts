/**
 * Tests for Enhanced Template Validator with optional features
 */

import { assertEquals, assert } from "https://deno.land/std@0.220.0/assert/mod.ts";
import { TemplateValidator } from "../../enhanced/validation/template_validator.ts";
import * as openehr_am from "../../enhanced/openehr_am.ts";

Deno.test("Enhanced Validator - C_STRING pattern validation", () => {
  const validator = new TemplateValidator();
  const template = new openehr_am.ARCHETYPE();
  
  const definition = new openehr_am.C_COMPLEX_OBJECT();
  definition.rm_type_name = "ELEMENT";
  definition.node_id = "id1";
  
  const attr = new openehr_am.C_SINGLE_ATTRIBUTE();
  attr.rm_attribute_name = "value";
  
  const strConstraint = new openehr_am.C_STRING();
  strConstraint.pattern = "^[A-Z]{3}$"; // 3 uppercase letters
  
  attr.children = [strConstraint as any];
  definition.attributes = [attr];
  template.definition = definition;
  
  // Valid value
  const validInstance = { _type: "ELEMENT", value: "ABC" };
  const validResult = validator.validate(validInstance, template);
  assertEquals(validResult.valid, true);
  
  // Invalid value
  const invalidInstance = { _type: "ELEMENT", value: "ab1" };
  const invalidResult = validator.validate(invalidInstance, template);
  assertEquals(invalidResult.valid, false);
  assert(invalidResult.errors.some(e => e.constraintType === "string_pattern"));
});

Deno.test("Enhanced Validator - C_INTEGER range validation", () => {
  const validator = new TemplateValidator();
  const template = new openehr_am.ARCHETYPE();
  
  const definition = new openehr_am.C_COMPLEX_OBJECT();
  definition.rm_type_name = "ELEMENT";
  definition.node_id = "id1";
  
  const attr = new openehr_am.C_SINGLE_ATTRIBUTE();
  attr.rm_attribute_name = "value";
  
  const intConstraint = new openehr_am.C_INTEGER();
  intConstraint.range = { lower: 0, upper: 100 } as any;
  
  attr.children = [intConstraint as any];
  definition.attributes = [attr];
  template.definition = definition;
  
  // Valid value
  const validInstance = { _type: "ELEMENT", value: 50 };
  const validResult = validator.validate(validInstance, template);
  assertEquals(validResult.valid, true);
  
  // Invalid value (too high)
  const invalidInstance = { _type: "ELEMENT", value: 150 };
  const invalidResult = validator.validate(invalidInstance, template);
  assertEquals(invalidResult.valid, false);
  assert(invalidResult.errors.some(e => e.constraintType === "integer_range"));
});

Deno.test("Enhanced Validator - Terminology validation", () => {
  const validator = new TemplateValidator({ validateTerminology: true });
  const template = new openehr_am.ARCHETYPE();
  
  const definition = new openehr_am.C_COMPLEX_OBJECT();
  definition.rm_type_name = "DV_CODED_TEXT";
  definition.node_id = "id1";
  template.definition = definition;
  
  // Missing defining_code
  const invalidInstance = { _type: "DV_CODED_TEXT", value: "test" };
  const invalidResult = validator.validate(invalidInstance, template);
  assertEquals(invalidResult.valid, false);
  assert(invalidResult.errors.some(e => e.constraintType === "terminology"));
  
  // Valid coded text
  const validInstance = {
    _type: "DV_CODED_TEXT",
    value: "test",
    defining_code: {
      terminology_id: { value: "SNOMED-CT" },
      code_string: "12345"
    }
  };
  const validResult = validator.validate(validInstance, template);
  assertEquals(validResult.valid, true);
});

Deno.test("Enhanced Validator - Configuration options", () => {
  // Test with different configurations
  const strictValidator = new TemplateValidator({
    validateUnits: true,
    validateTerminology: true,
    useTypeRegistry: true,
  });
  
  const lenientValidator = new TemplateValidator({
    validateUnits: false,
    validateTerminology: false,
    useTypeRegistry: false,
  });
  
  // Both should be instantiable without error
  assert(strictValidator);
  assert(lenientValidator);
});

console.log("\n✅ Enhanced Validator tests completed");
