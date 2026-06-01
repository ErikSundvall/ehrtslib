/**
 * Archie primitive ADL2 fixtures (test_data/archie-tests/primitives/).
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.220.0/assert/mod.ts";
import { ADL2Tokenizer } from "../../enhanced/parser/adl2_tokenizer.ts";
import { ADL2Parser } from "../../enhanced/parser/adl2_parser.ts";

const TEST_DATA = new URL("../../test_data/archie-tests/", import.meta.url);

async function loadArchie(relative: string): Promise<string> {
  return await Deno.readTextFile(new URL(relative, TEST_DATA));
}

function archetypeFrom(result: ReturnType<ADL2Parser["parse"]>) {
  if (!result.archetype) throw new Error("Expected archetype");
  return result.archetype;
}

Deno.test("Archie primitives - primitive_types", async () => {
  const adl = await loadArchie("primitives/openehr-TEST_PKG-WHOLE.primitive_types.v1.0.0.adls");
  const parser = new ADL2Parser(new ADL2Tokenizer(adl).tokenize());
  const arch = archetypeFrom(parser.parse());
  assertEquals(
    arch.archetype_id?.value,
    "openehr-TEST_PKG-WHOLE.primitive_types.v1.0.0",
  );
  assertExists(arch.definition);
});

Deno.test("Archie primitives - assumed_values", async () => {
  const adl = await loadArchie("primitives/openehr-TEST_PKG-WHOLE.assumed_values.v1.0.0.adls");
  const parser = new ADL2Parser(new ADL2Tokenizer(adl).tokenize());
  const arch = archetypeFrom(parser.parse());
  assertEquals(
    arch.archetype_id?.value,
    "openehr-TEST_PKG-WHOLE.assumed_values.v1.0.0",
  );
  assertExists(arch.definition);
});
