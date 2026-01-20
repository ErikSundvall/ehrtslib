/**
 * Tests for Interval and RM Specification Validators
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.210.0/assert/mod.ts";
import { IntervalValidator } from "../../enhanced/validation/interval_validator.ts";
import { RMSpecificationValidator } from "../../enhanced/validation/rm_specification_validator.ts";
import { TemplateValidator } from "../../enhanced/validation/template_validator.ts";

Deno.test("IntervalValidator - valid bounded interval", () => {
  const validator = new IntervalValidator();
  
  const interval = {
    lower: { magnitude: 0 },
    upper: { magnitude: 100 },
    lower_included: true,
    upper_included: true,
    lower_unbounded: false,
    upper_unbounded: false,
  };
  
  const messages = validator.validate(interval, "/test/interval");
  assertEquals(messages.length, 0, "Valid interval should have no errors");
});

Deno.test("IntervalValidator - lower > upper error", () => {
  const validator = new IntervalValidator();
  
  const interval = {
    lower: { magnitude: 100 },
    upper: { magnitude: 50 },
    lower_included: true,
    upper_included: true,
  };
  
  const messages = validator.validate(interval, "/test/interval");
  const errors = messages.filter(m => m.severity === "error");
  assertEquals(errors.length > 0, true, "Should have error for lower > upper");
  assertEquals(errors[0].constraintType, "interval");
});

Deno.test("IntervalValidator - unbounded with bounds error", () => {
  const validator = new IntervalValidator();
  
  const interval = {
    lower: { magnitude: 0 },
    lower_unbounded: true,  // Contradiction
  };
  
  const messages = validator.validate(interval, "/test/interval");
  const errors = messages.filter(m => m.severity === "error");
  assertEquals(errors.length > 0, true, "Should have error for unbounded with bound");
});

Deno.test("IntervalValidator - missing inclusion flags warning", () => {
  const validator = new IntervalValidator();
  
  const interval = {
    lower: { magnitude: 0 },
    upper: { magnitude: 100 },
    // Missing lower_included and upper_included
  };
  
  const messages = validator.validate(interval, "/test/interval");
  const warnings = messages.filter(m => m.severity === "warning");
  assertEquals(warnings.length, 2, "Should have warnings for missing inclusion flags");
});

Deno.test("IntervalValidator - unbounded interval", () => {
  const validator = new IntervalValidator();
  
  const interval = {
    lower_unbounded: true,
    upper_unbounded: true,
  };
  
  const messages = validator.validate(interval, "/test/interval");
  assertEquals(messages.length, 0, "Valid unbounded interval should have no errors");
});

Deno.test("RMSpecificationValidator - COMPOSITION.category valid persistent", () => {
  const validator = new RMSpecificationValidator();
  
  // Test terse format
  const messages1 = validator.validate(
    "openehr::431|persistent|",
    "COMPOSITION",
    "category",
    "/category"
  );
  assertEquals(messages1.length, 0, "Valid persistent code should have no errors");
  
  // Test object format
  const messages2 = validator.validate(
    {
      defining_code: {
        terminology_id: "openehr",
        code_string: "431",
      },
    },
    "COMPOSITION",
    "category",
    "/category"
  );
  assertEquals(messages2.length, 0, "Valid persistent code object should have no errors");
});

Deno.test("RMSpecificationValidator - COMPOSITION.category valid event", () => {
  const validator = new RMSpecificationValidator();
  
  const messages = validator.validate(
    "openehr::433|event|",
    "COMPOSITION",
    "category",
    "/category"
  );
  assertEquals(messages.length, 0, "Valid event code should have no errors");
});

Deno.test("RMSpecificationValidator - COMPOSITION.category invalid code", () => {
  const validator = new RMSpecificationValidator();
  
  const messages = validator.validate(
    "openehr::999|invalid|",
    "COMPOSITION",
    "category",
    "/category"
  );
  
  const errors = messages.filter(m => m.severity === "error");
  assertEquals(errors.length, 1, "Invalid code should have error");
  assertEquals(errors[0].constraintType, "rm_specification");
  assertEquals(errors[0].message.includes("999"), true, "Error should mention invalid code");
  assertEquals(errors[0].message.includes("431"), true, "Error should mention allowed codes");
});

Deno.test("RMSpecificationValidator - COMPOSITION.category wrong terminology", () => {
  const validator = new RMSpecificationValidator();
  
  const messages = validator.validate(
    "snomed::12345|something|",
    "COMPOSITION",
    "category",
    "/category"
  );
  
  const errors = messages.filter(m => m.severity === "error");
  assertEquals(errors.length, 1, "Wrong terminology should have error");
  assertEquals(errors[0].message.includes("openehr"), true, "Error should mention required terminology");
});

Deno.test("RMSpecificationValidator - disabled validator", () => {
  const validator = new RMSpecificationValidator(false);
  
  const messages = validator.validate(
    "openehr::999|invalid|",
    "COMPOSITION",
    "category",
    "/category"
  );
  
  assertEquals(messages.length, 0, "Disabled validator should have no errors");
});

Deno.test("TemplateValidator - integration with new validators", async () => {
  const validator = new TemplateValidator({
    validateIntervals: true,
    validateRMSpecification: true,
  });
  
  await validator.initialize();
  
  // Create a mock template
  const template = {
    archetype_id: { value: "test" },
    definition: {
      rm_type_name: "COMPOSITION",
      node_id: "id1",
      attributes: [],
    },
  };
  
  // Test with invalid category
  const rmInstance = {
    category: "openehr::999|invalid|",
  };
  
  const result = validator.validate(rmInstance, template as any);
  
  // Note: This is a basic integration test - full validation would require
  // proper template structure with attributes matching the RM instance
  assertExists(result);
  assertEquals(typeof result.valid, "boolean");
});

Deno.test("RMSpecificationValidator - getConstraints returns knowledge base", () => {
  const constraints = RMSpecificationValidator.getConstraints();
  
  assertExists(constraints);
  assertExists(constraints["COMPOSITION.category"]);
  assertEquals(constraints["COMPOSITION.category"].allowed_codes.includes("431"), true);
  assertEquals(constraints["COMPOSITION.category"].allowed_codes.includes("433"), true);
});

console.log("✅ Interval and RM Specification Validator tests completed");
