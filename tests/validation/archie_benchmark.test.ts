/**
 * Archie ADL2 fixture pass-rate benchmark (task 8.4).
 */

import { assert } from "https://deno.land/std@0.220.0/assert/mod.ts";
import { ADL2Tokenizer } from "../../enhanced/parser/adl2_tokenizer.ts";
import { ADL2Parser } from "../../enhanced/parser/adl2_parser.ts";

const ARCHIE_ROOT = new URL("../../test_data/archie-tests/", import.meta.url);

const ARCHIE_FIXTURES = [
  "basics/openEHR-TEST_PKG-WHOLE.most_minimal.v1.0.0.adls",
  "basics/openEHR-DEMOGRAPHIC-ROLE.whitespace.v1.0.0.adls",
  "primitives/openehr-TEST_PKG-WHOLE.primitive_types.v1.0.0.adls",
  "primitives/openehr-TEST_PKG-WHOLE.assumed_values.v1.0.0.adls",
  "structures/openehr-TEST_PKG-BOOK.structure_test1.v1.0.0.adls",
  "terminology/openEHR-EHR-OBSERVATION.value_set_binding.v1.0.0.adls",
  "terminology/openEHR-EHR-OBSERVATION.value_set_binding_snomed.v1.0.0.adls",
  "terminology/openEHR-EHR-OBSERVATION.term_bindings_paths_use_refs.v1.0.0.adls",
];

Deno.test("Archie benchmark - parse pass rate", async () => {
  let passed = 0;
  const failures: string[] = [];

  for (const rel of ARCHIE_FIXTURES) {
    try {
      const text = await Deno.readTextFile(new URL(rel, ARCHIE_ROOT));
      const parser = new ADL2Parser(new ADL2Tokenizer(text).tokenize());
      parser.parse();
      passed++;
    } catch (e) {
      failures.push(`${rel}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  const rate = (passed / ARCHIE_FIXTURES.length) * 100;
  console.log(
    `Archie parse benchmark: ${passed}/${ARCHIE_FIXTURES.length} (${rate.toFixed(1)}%)`,
  );
  if (failures.length) {
    console.log("Failures:\n" + failures.join("\n"));
  }

  assert(rate >= 95, `Parse rate ${rate}% below target 95%`);
});
