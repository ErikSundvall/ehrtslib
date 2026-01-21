/**
 * Tests for ODIN Parser
 */

import { assertEquals } from "https://deno.land/std@0.220.0/assert/mod.ts";
import { ADL2Tokenizer } from "../../enhanced/parser/adl2_tokenizer.ts";
import { OdinParser } from "../../enhanced/parser/odin_parser.ts";

function parseOdin(input: string) {
  const tokenizer = new ADL2Tokenizer(input);
  const tokens = tokenizer.tokenize();
  const parser = new OdinParser(tokens);
  return parser.parse();
}

Deno.test("ODIN - simple string value", () => {
  const result = parseOdin('<"simple string">');
  assertEquals(result, "simple string");
});

Deno.test("ODIN - string list", () => {
  const result = parseOdin('<"one", "two", "three">');
  assertEquals(result, ["one", "two", "three"]);
});

Deno.test("ODIN - integer value", () => {
  const result = parseOdin("<42>");
  assertEquals(result, 42);
});

Deno.test("ODIN - real value", () => {
  const result = parseOdin("<3.14>");
  assertEquals(result, 3.14);
});

Deno.test("ODIN - boolean values", () => {
  const result1 = parseOdin("<True>");
  assertEquals(result1, true);
  
  const result2 = parseOdin("<False>");
  assertEquals(result2, false);
});

Deno.test("ODIN - simple attribute-value pair", () => {
  const result = parseOdin('<name = "Test">');
  assertEquals(result, { name: "Test" });
});

Deno.test("ODIN - multiple attribute-value pairs", () => {
  const input = `<
    name = "Test"
    value = 42
    enabled = True
  >`;
  const result = parseOdin(input);
  assertEquals(result, {
    name: "Test",
    value: 42,
    enabled: true,
  });
});

Deno.test("ODIN - nested object", () => {
  const input = `<
    outer = <
      inner = "value"
    >
  >`;
  const result = parseOdin(input);
  assertEquals(result, {
    outer: {
      inner: "value",
    },
  });
});

Deno.test("ODIN - keyed objects", () => {
  const input = `<
    ["en"] = <"English">
    ["de"] = <"German">
  >`;
  const result = parseOdin(input);
  // Result should be a list with two values
  assertEquals(Array.isArray(result), true);
  assertEquals((result as any[]).length, 2);
});

Deno.test("ODIN - language section example", () => {
  const input = `<
    original_language = <"ISO_639-1::en">
  >`;
  const result = parseOdin(input);
  assertEquals(result, {
    original_language: "ISO_639-1::en",
  });
});

Deno.test("ODIN - term definition example", () => {
  const input = `<
    text = <"Blood pressure">
    description = <"Blood pressure measurement">
  >`;
  const result = parseOdin(input);
  assertEquals(result, {
    text: "Blood pressure",
    description: "Blood pressure measurement",
  });
});

Deno.test("ODIN - complex nested structure", () => {
  const input = `<
    details = <
      ["en"] = <
        language = <"ISO_639-1::en">
        purpose = <"A simple test">
        keywords = <"test", "example">
      >
    >
  >`;
  const result = parseOdin(input);
  
  // Verify structure
  assertEquals(typeof result, "object");
  assertEquals("details" in result, true);
});

console.log("\n✅ ODIN Parser tests completed");
