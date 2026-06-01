/**
 * Tests for Type Inference Engine
 */

import { assertEquals } from "jsr:@std/assert";
import { TypeInferenceEngine } from "../../enhanced/serialization/common/type_inference.ts";
import { DV_TEXT, CODE_PHRASE, DV_CODED_TEXT } from "../../enhanced/openehr_rm.ts";
import { TERMINOLOGY_ID } from "../../enhanced/openehr_base.ts";
import { TypeRegistry } from "../../enhanced/serialization/common/type_registry.ts";
import * as rm from "../../enhanced/openehr_rm.ts";
import * as base from "../../enhanced/openehr_base.ts";

// Register all RM types
TypeRegistry.registerModule(rm);
TypeRegistry.registerModule(base);

Deno.test("TypeInferenceEngine: inferFromStructure - DV_TEXT", () => {
  const data = { value: "Test text" };
  const inferred = TypeInferenceEngine.inferFromStructure(data);
  
  assertEquals(inferred, "DV_TEXT");
});

Deno.test("TypeInferenceEngine: inferFromStructure - CODE_PHRASE", () => {
  const data = {
    terminology_id: { value: "ISO_639-1" },
    code_string: "en"
  };
  const inferred = TypeInferenceEngine.inferFromStructure(data);
  
  assertEquals(inferred, "CODE_PHRASE");
});

Deno.test("TypeInferenceEngine: inferFromStructure - DV_CODED_TEXT", () => {
  const data = {
    value: "event",
    defining_code: {
      terminology_id: { value: "openehr" },
      code_string: "433"
    }
  };
  const inferred = TypeInferenceEngine.inferFromStructure(data);
  
  assertEquals(inferred, "DV_CODED_TEXT");
});

Deno.test("TypeInferenceEngine: canOmitType - simple property", () => {
  const dvText = new DV_TEXT();
  dvText.value = "Test";
  
  // For a property with clear type, should be able to omit
  const canOmit = TypeInferenceEngine.canOmitType("name", "COMPOSITION", dvText);
  
  // name property on COMPOSITION is expected to be DV_TEXT
  assertEquals(canOmit, true);
});

Deno.test("TypeInferenceEngine: isPolymorphic", () => {
  assertEquals(TypeInferenceEngine.isPolymorphic("DATA_VALUE"), true);
  assertEquals(TypeInferenceEngine.isPolymorphic("DV_TEXT"), false);
  assertEquals(TypeInferenceEngine.isPolymorphic("CONTENT_ITEM"), true);
});

Deno.test("TypeInferenceEngine: getPropertyType", () => {
  const propertyType = TypeInferenceEngine.getPropertyType("DV_CODED_TEXT", "defining_code");
  assertEquals(propertyType, "CODE_PHRASE");
});
