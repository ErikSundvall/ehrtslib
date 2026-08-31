/**
 * Tests for JSON source index and validation/deserialization source metadata.
 */

import { assertEquals, assert, assertExists } from "https://deno.land/std@0.220.0/assert/mod.ts";
import {
  buildJsonSourceIndex,
  lookupJsonSourceLocation,
  rmPathToJsonPointer,
} from "../../../serialization/common/json_source_index.ts";
import { DeserializationError } from "../../../serialization/common/errors.ts";
import { JsonConfigurableDeserializer } from "../../../serialization/json/json_configurable_deserializer.ts";
import { TypeRegistry } from "../../../serialization/common/type_registry.ts";
import { TemplateValidator } from "../../../validation/template_validator.ts";
import * as openehr_am from "../../../am/openehr_am.ts";
import * as rm from "../../../rm/openehr_rm.ts";
import * as base from "../../../base/openehr_base.ts";

TypeRegistry.registerModule(rm);
TypeRegistry.registerModule(base);

Deno.test("rmPathToJsonPointer - converts RM paths with array indices", () => {
  assertEquals(rmPathToJsonPointer("/content[0]/items[1]/value/"), "/content/0/items/1/value");
  assertEquals(rmPathToJsonPointer("/data/events[2]/"), "/data/events/2");
  assertEquals(rmPathToJsonPointer("/"), "");
});

Deno.test("buildJsonSourceIndex - maps nested arrays to distinct pointers", () => {
  const json = `{
  "content": [
    {
      "items": [
        { "name": "first" },
        { "name": "second" }
      ]
    }
  ]
}`;

  const index = buildJsonSourceIndex(json);

  const firstItem = lookupJsonSourceLocation(index, "/content/0/items/0");
  const secondItem = lookupJsonSourceLocation(index, "/content/0/items/1");
  const firstName = lookupJsonSourceLocation(index, "/content/0/items/0/name");
  const secondName = lookupJsonSourceLocation(index, "/content/0/items/1/name");

  assertExists(firstItem);
  assertExists(secondItem);
  assertExists(firstName);
  assertExists(secondName);

  assertEquals(firstName.sourceLine, 5);
  assertEquals(firstName.sourceColumn, 19);
  assertEquals(secondName.sourceLine, 6);
  assertEquals(secondName.sourceColumn, 19);

  assert(
    firstName.sourceLine !== secondName.sourceLine ||
      firstName.sourceColumn !== secondName.sourceColumn,
    "repeated key 'name' under different array elements must map to different locations",
  );
});

Deno.test("buildJsonSourceIndex - repeated keys at same depth map to different pointers", () => {
  const json = `{
  "sections": [
    { "label": "alpha" },
    { "label": "beta" }
  ]
}`;

  const index = buildJsonSourceIndex(json);
  const alpha = lookupJsonSourceLocation(index, "/sections/0/label");
  const beta = lookupJsonSourceLocation(index, "/sections/1/label");

  assertExists(alpha);
  assertExists(beta);
  assertEquals(alpha.sourceLine, 3);
  assertEquals(beta.sourceLine, 4);
  assertEquals(alpha.sourceColumn, 16);
  assertEquals(beta.sourceColumn, 16);
});

Deno.test("TemplateValidator.validate - enriches messages with jsonSource metadata", () => {
  const json = `{
  "_type": "ELEMENT",
  "value": "ab1"
}`;

  const validator = new TemplateValidator();
  const template = new openehr_am.ARCHETYPE();

  const definition = new openehr_am.C_COMPLEX_OBJECT();
  definition.rm_type_name = "ELEMENT";
  definition.node_id = "id1";

  const attr = new openehr_am.C_SINGLE_ATTRIBUTE();
  attr.rm_attribute_name = "value";

  const strConstraint = new openehr_am.C_STRING();
  strConstraint.pattern = "^[A-Z]{3}$";
  attr.children = [strConstraint as openehr_am.C_OBJECT];

  definition.attributes = [attr];
  template.definition = definition;

  const result = validator.validate(JSON.parse(json), template, { jsonSource: json });

  assertEquals(result.valid, false);
  assertEquals(result.errors.length, 1);
  assertEquals(result.errors[0].path, "/value/");
  assertEquals(result.errors[0].jsonPointer, "/value");
  assertEquals(result.errors[0].sourceLine, 3);
  assertEquals(result.errors[0].sourceColumn, 12);
});

Deno.test("JsonConfigurableDeserializer - attaches source metadata on strict failures", () => {
  const json = `{
  "_type": "ELEMENT",
  "nested": { "foo": true }
}`;

  const deserializer = new JsonConfigurableDeserializer({ strict: true });

  try {
    deserializer.deserialize(json);
    assert(false, "expected deserialization to fail");
  } catch (error) {
    assert(error instanceof DeserializationError);
    assertExists(error.source);
    assertEquals(error.source?.jsonPointer, "/nested");
    assertEquals(error.source?.sourceLine, 3);
    assertEquals(error.source?.sourceColumn, 13);
  }
});

console.log("\n✅ JSON source metadata tests completed");
