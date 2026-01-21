/**
 * Archie-Inspired Validation Tests
 * 
 * These tests implement validation patterns inspired by the openEHR Archie project's
 * comprehensive validation framework for Reference Model and Archetype Model.
 * 
 * Source Inspiration:
 * - Archie's RMObjectValidator: https://github.com/openEHR/archie
 * - archie/tools/src/test/java/com/nedap/archie/rmobjectvalidator/
 * - archie/tools/src/test/java/com/nedap/archie/rmobjectvalidator/invariants/
 * 
 * Test patterns adapted from:
 * - MultiplicityRMObjectValidationTest.java (occurrence/cardinality validation)
 * - PrimitivesRMObjectValidationTest.java (primitive constraint validation)
 * - RMInvariantValidationTest.java (RM specification validation)
 * - DataValuesInvariantTest.java (DV_* data type validation)
 * 
 * License: Apache License 2.0
 * Copyright: © 2017-2024 openEHR Foundation and contributors
 */

import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { TemplateValidator } from "../../enhanced/validation/template_validator.ts";

Deno.test("Archie-Inspired - String Pattern Validation", () => {
  // Inspired by: PrimitivesRMObjectValidationTest.java - testStringPattern()
  // Tests regex pattern matching on string constraints
  const validator = new TemplateValidator();
  
  const template = {
    rm_type: "OBSERVATION",
    attributes: {
      value: {
        rm_type: "DV_TEXT",
        constraints: {
          pattern: "^[A-Z]{3}$"  // Exactly 3 uppercase letters
        }
      }
    }
  };
  
  // Valid: matches pattern
  const validInstance = {
    rm_type: "OBSERVATION",
    value: {
      rm_type: "DV_TEXT",
      value: "ABC"
    }
  };
  const validResult = validator.validate(validInstance, template);
  assertEquals(validResult.valid, true, "ABC should match pattern ^[A-Z]{3}$");
  
  // Invalid: doesn't match pattern
  const invalidInstance = {
    rm_type: "OBSERVATION",
    value: {
      rm_type: "DV_TEXT",
      value: "abc"  // lowercase
    }
  };
  const invalidResult = validator.validate(invalidInstance, template);
  assertEquals(invalidResult.valid, false, "abc should not match pattern ^[A-Z]{3}$");
  assertEquals(invalidResult.errors[0].constraintType, "string_pattern");
});

Deno.test("Archie-Inspired - Integer Range Validation", () => {
  // Inspired by: PrimitivesRMObjectValidationTest.java - testIntegerRange()
  // Tests integer range constraints
  const validator = new TemplateValidator();
  
  const template = {
    rm_type: "OBSERVATION",
    attributes: {
      count: {
        rm_type: "DV_COUNT",
        constraints: {
          range: { min: 0, max: 100 }
        }
      }
    }
  };
  
  // Valid: within range
  const validInstance = { rm_type: "OBSERVATION", count: { rm_type: "DV_COUNT", magnitude: 50 } };
  const validResult = validator.validate(validInstance, template);
  assertEquals(validResult.valid, true, "50 should be in range 0..100");
  
  // Invalid: exceeds range
  const invalidInstance = { rm_type: "OBSERVATION", count: { rm_type: "DV_COUNT", magnitude: 150 } };
  const invalidResult = validator.validate(invalidInstance, template);
  assertEquals(invalidResult.valid, false, "150 should exceed range 0..100");
  assertEquals(invalidResult.errors[0].constraintType, "integer_range");
});

Deno.test("Archie-Inspired - Occurrence Validation", () => {
  // Inspired by: MultiplicityRMObjectValidationTest.java - testOccurrences()
  // Tests min/max occurrence constraints
  const validator = new TemplateValidator();
  
  const template = {
    rm_type: "OBSERVATION",
    attributes: {
      data: {
        rm_type: "HISTORY",
        occurrences: { min: 1, max: 1 }  // Mandatory, exactly one
      }
    }
  };
  
  // Valid: has required attribute
  const validInstance = {
    rm_type: "OBSERVATION",
    data: { rm_type: "HISTORY" }
  };
  const validResult = validator.validate(validInstance, template);
  assertEquals(validResult.valid, true, "Should have mandatory data attribute");
  
  // Invalid: missing required attribute
  const invalidInstance = {
    rm_type: "OBSERVATION"
    // data is missing
  };
  const invalidResult = validator.validate(invalidInstance, template);
  assertEquals(invalidResult.valid, false, "Should fail without mandatory data attribute");
  assertEquals(invalidResult.errors[0].constraintType, "occurrence");
});

Deno.test("Archie-Inspired - Cardinality Validation", () => {
  // Inspired by: MultiplicityRMObjectValidationTest.java - testCardinality()
  // Tests collection cardinality constraints
  const validator = new TemplateValidator();
  
  const template = {
    rm_type: "OBSERVATION",
    attributes: {
      events: {
        rm_type: "EVENT",
        cardinality: { min: 1, max: 5 },
        multiple: true
      }
    }
  };
  
  // Valid: within cardinality
  const validInstance = {
    rm_type: "OBSERVATION",
    events: [
      { rm_type: "EVENT" },
      { rm_type: "EVENT" }
    ]
  };
  const validResult = validator.validate(validInstance, template);
  assertEquals(validResult.valid, true, "2 events should be within cardinality 1..5");
  
  // Invalid: exceeds cardinality
  const invalidInstance = {
    rm_type: "OBSERVATION",
    events: [
      { rm_type: "EVENT" },
      { rm_type: "EVENT" },
      { rm_type: "EVENT" },
      { rm_type: "EVENT" },
      { rm_type: "EVENT" },
      { rm_type: "EVENT" }  // 6 events, max is 5
    ]
  };
  const invalidResult = validator.validate(invalidInstance, template);
  assertEquals(invalidResult.valid, false, "6 events should exceed cardinality max of 5");
  assertEquals(invalidResult.errors[0].constraintType, "cardinality");
});

Deno.test("Archie-Inspired - DV_INTERVAL Bounds Validation", async () => {
  // Inspired by: DataValuesInvariantTest.java - testDvInterval()
  // Tests DV_INTERVAL lower/upper bound validation
  const validator = new TemplateValidator({ validateIntervals: true });
  await validator.initialize();
  
  const template = {
    rm_type: "OBSERVATION",
    attributes: {
      range: {
        rm_type: "DV_INTERVAL<DV_QUANTITY>"
      }
    }
  };
  
  // Valid: lower < upper
  const validInstance = {
    rm_type: "OBSERVATION",
    range: {
      rm_type: "DV_INTERVAL<DV_QUANTITY>",
      lower: { rm_type: "DV_QUANTITY", magnitude: 10 },
      upper: { rm_type: "DV_QUANTITY", magnitude: 100 },
      lower_included: true,
      upper_included: true
    }
  };
  const validResult = validator.validate(validInstance, template);
  assertEquals(validResult.valid, true, "Interval with lower < upper should be valid");
  
  // Invalid: lower > upper
  const invalidInstance = {
    rm_type: "OBSERVATION",
    range: {
      rm_type: "DV_INTERVAL<DV_QUANTITY>",
      lower: { rm_type: "DV_QUANTITY", magnitude: 100 },
      upper: { rm_type: "DV_QUANTITY", magnitude: 10 },  // Invalid: lower > upper
      lower_included: true,
      upper_included: true
    }
  };
  const invalidResult = validator.validate(invalidInstance, template);
  assertEquals(invalidResult.valid, false, "Interval with lower > upper should be invalid");
  assertEquals(invalidResult.errors[0].constraintType, "interval");
});

Deno.test("Archie-Inspired - COMPOSITION.category RM Constraint", async () => {
  // Inspired by: RMInvariantValidationTest.java - testCompositionCategory()
  // Tests RM specification-mandated constraints
  const validator = new TemplateValidator({ validateRMSpecification: true });
  await validator.initialize();
  
  const template = {
    rm_type: "COMPOSITION",
    attributes: {
      category: {
        rm_type: "DV_CODED_TEXT"
      }
    }
  };
  
  // Valid: category is 431 (persistent)
  const validInstance = {
    rm_type: "COMPOSITION",
    category: {
      rm_type: "DV_CODED_TEXT",
      value: "persistent",
      defining_code: {
        terminology_id: { value: "openehr" },
        code_string: "431"
      }
    }
  };
  const validResult = validator.validate(validInstance, template);
  assertEquals(validResult.valid, true, "Category 431 (persistent) should be valid");
  
  // Invalid: category is not 431 or 433
  const invalidInstance = {
    rm_type: "COMPOSITION",
    category: {
      rm_type: "DV_CODED_TEXT",
      value: "invalid",
      defining_code: {
        terminology_id: { value: "openehr" },
        code_string: "999"  // Invalid code
      }
    }
  };
  const invalidResult = validator.validate(invalidInstance, template);
  assertEquals(invalidResult.valid, false, "Category 999 should be invalid");
  assertEquals(invalidResult.errors[0].constraintType, "rm_specification");
});

Deno.test("Archie-Inspired - UCUM Unit Validation", async () => {
  // Inspired by: DataValuesInvariantTest.java - testDvQuantityUnits()
  // Tests UCUM unit validation using existing UcumService
  const validator = new TemplateValidator({ validateUnits: true });
  await validator.initialize();
  
  const template = {
    rm_type: "OBSERVATION",
    attributes: {
      quantity: {
        rm_type: "DV_QUANTITY"
      }
    }
  };
  
  // Valid: correct UCUM unit
  const validInstance = {
    rm_type: "OBSERVATION",
    quantity: {
      rm_type: "DV_QUANTITY",
      magnitude: 98.6,
      units: "[degF]"  // Valid UCUM unit for Fahrenheit
    }
  };
  const validResult = validator.validate(validInstance, template);
  assertEquals(validResult.valid, true, "[degF] should be a valid UCUM unit");
  
  // Invalid: incorrect UCUM unit
  const invalidInstance = {
    rm_type: "OBSERVATION",
    quantity: {
      rm_type: "DV_QUANTITY",
      magnitude: 98.6,
      units: "degrees"  // Invalid UCUM unit
    }
  };
  const invalidResult = validator.validate(invalidInstance, template);
  assertEquals(invalidResult.valid, false, "degrees should be invalid UCUM unit");
  assertEquals(invalidResult.errors[0].constraintType, "ucum");
});

Deno.test("Archie-Inspired - DV_CODED_TEXT Terminology Structure", async () => {
  // Inspired by: DataValuesInvariantTest.java - testDvCodedText()
  // Tests DV_CODED_TEXT structure validation
  const validator = new TemplateValidator({ validateTerminology: true });
  await validator.initialize();
  
  const template = {
    rm_type: "OBSERVATION",
    attributes: {
      coded_value: {
        rm_type: "DV_CODED_TEXT"
      }
    }
  };
  
  // Valid: complete DV_CODED_TEXT structure
  const validInstance = {
    rm_type: "OBSERVATION",
    coded_value: {
      rm_type: "DV_CODED_TEXT",
      value: "Fever",
      defining_code: {
        terminology_id: { value: "snomed_ct" },
        code_string: "386661006"
      }
    }
  };
  const validResult = validator.validate(validInstance, template);
  assertEquals(validResult.valid, true, "Complete DV_CODED_TEXT should be valid");
  
  // Invalid: missing defining_code
  const invalidInstance = {
    rm_type: "OBSERVATION",
    coded_value: {
      rm_type: "DV_CODED_TEXT",
      value: "Fever"
      // defining_code is missing
    }
  };
  const invalidResult = validator.validate(invalidInstance, template);
  assertEquals(invalidResult.valid, false, "DV_CODED_TEXT without defining_code should be invalid");
  assertEquals(invalidResult.errors[0].constraintType, "terminology");
});

Deno.test("Archie-Inspired - Real Number Range Validation", () => {
  // Inspired by: PrimitivesRMObjectValidationTest.java - testRealRange()
  // Tests real number range constraints
  const validator = new TemplateValidator();
  
  const template = {
    rm_type: "OBSERVATION",
    attributes: {
      temperature: {
        rm_type: "DV_QUANTITY",
        constraints: {
          range: { min: 35.0, max: 42.0 }  // Body temperature range in Celsius
        }
      }
    }
  };
  
  // Valid: within range
  const validInstance = {
    rm_type: "OBSERVATION",
    temperature: {
      rm_type: "DV_QUANTITY",
      magnitude: 37.5
    }
  };
  const validResult = validator.validate(validInstance, template);
  assertEquals(validResult.valid, true, "37.5°C should be valid body temperature");
  
  // Invalid: below minimum
  const invalidInstance = {
    rm_type: "OBSERVATION",
    temperature: {
      rm_type: "DV_QUANTITY",
      magnitude: 30.0  // Below minimum
    }
  };
  const invalidResult = validator.validate(invalidInstance, template);
  assertEquals(invalidResult.valid, false, "30.0°C should be below valid range");
  assertEquals(invalidResult.errors[0].constraintType, "real_range");
});

Deno.test("Archie-Inspired - Boolean Constraint Validation", () => {
  // Inspired by: PrimitivesRMObjectValidationTest.java - testBooleanConstraint()
  // Tests boolean constraint validation
  const validator = new TemplateValidator();
  
  const template = {
    rm_type: "OBSERVATION",
    attributes: {
      flag: {
        rm_type: "DV_BOOLEAN",
        constraints: {
          true_valid: true,
          false_valid: false  // Only true is valid
        }
      }
    }
  };
  
  // Valid: true is allowed
  const validInstance = {
    rm_type: "OBSERVATION",
    flag: {
      rm_type: "DV_BOOLEAN",
      value: true
    }
  };
  const validResult = validator.validate(validInstance, template);
  assertEquals(validResult.valid, true, "true should be valid when true_valid=true");
  
  // Invalid: false is not allowed
  const invalidInstance = {
    rm_type: "OBSERVATION",
    flag: {
      rm_type: "DV_BOOLEAN",
      value: false
    }
  };
  const invalidResult = validator.validate(invalidInstance, template);
  assertEquals(invalidResult.valid, false, "false should be invalid when false_valid=false");
  assertEquals(invalidResult.errors[0].constraintType, "boolean");
});
