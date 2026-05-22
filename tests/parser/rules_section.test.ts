/**
 * ADL2 rules section parse and round-trip tests.
 */

import { assertEquals, assert } from "https://deno.land/std@0.220.0/assert/mod.ts";
import { ADL2Tokenizer } from "../../enhanced/parser/adl2_tokenizer.ts";
import { ADL2Parser } from "../../enhanced/parser/adl2_parser.ts";
import { ADL2Serializer } from "../../enhanced/generation/adl2_serializer.ts";
import { RulesParser } from "../../enhanced/parser/rules_parser.ts";
import { TokenType } from "../../enhanced/parser/adl2_tokenizer.ts";

const TEST_DATA = new URL("../../test_data/", import.meta.url);

Deno.test("RulesParser - variable declaration and tagged assertion", () => {
  const source = `
    $value: Integer := /data[id2]/value/magnitude
    Value_positive: $value >= 0
  `;
  const tokenizer = new ADL2Tokenizer(source);
  const tokens = tokenizer.tokenize().filter((t) => t.type !== TokenType.EOF);
  const { assertions } = new RulesParser(tokens).parse();

  assertEquals(assertions.length, 2);
  assert(assertions[0].variables?.length === 1);
  assertEquals(assertions[0].variables![0].name, "$value");
  assert(assertions[0].string_expression?.includes("Integer"));
  assertEquals(assertions[1].tag, "Value_positive");
  assert(
    assertions[1].string_expression?.replace(/\s+/g, "").includes(
      "$value>=0",
    ),
  );
});

Deno.test("ADL2 archetype with rules section round-trip", async () => {
  const path = "adl2/openEHR-TEST_PKG-WHOLE.minimal_rules.v1.0.0.adls";
  const input = await Deno.readTextFile(new URL(path, TEST_DATA));
  const tokenizer = new ADL2Tokenizer(input);
  const result = new ADL2Parser(tokenizer.tokenize()).parse();

  assertEquals(result.kind, "archetype");
  assertEquals(result.archetype?.invariants?.length, 2);
  assert(!result.warnings.some((w) => w.includes("Rules section not yet implemented")));

  const serialized = new ADL2Serializer().serialize(result.archetype!);
  assert(serialized.includes("rules"));
  assert(serialized.includes("Value_positive:"));
  assert(serialized.includes("$value") && serialized.includes("Integer"));

  const reparsed = new ADL2Parser(
    new ADL2Tokenizer(serialized).tokenize(),
  ).parse();
  assertEquals(reparsed.archetype?.invariants?.length, 2);
  assertEquals(
    reparsed.archetype?.invariants?.[1]?.tag,
    "Value_positive",
  );
});

Deno.test("Tokenizer - rules operators := and /=", () => {
  const tokens = new ADL2Tokenizer("$x := 1 y /= 2").tokenize();
  const types = tokens.map((t) => t.type);
  assert(types.includes(TokenType.ASSIGN));
  assert(types.includes(TokenType.NOT_EQUALS));
  assert(types.includes(TokenType.VARIABLE));
});
