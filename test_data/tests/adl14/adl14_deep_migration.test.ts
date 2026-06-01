/**
 * Deep ADL 1.4 → ADL2 terminology migration tests.
 */

import { assert, assertEquals } from "https://deno.land/std@0.220.0/assert/mod.ts";
import { convertAdl14ToAdl2 } from "../../enhanced/parser/adl14_to_adl2_converter.ts";
import { parseAdl } from "../../enhanced/parser/mod.ts";

const TEST_DATA = new URL("../../test_data/", import.meta.url);

Deno.test("convertAdl14ToAdl2 - ac-codes in term_definitions become id keys", async () => {
  const original = await Deno.readTextFile(
    new URL("adl14/openEHR-TEST_PKG-WHOLE.most_minimal.v1.adl", TEST_DATA),
  );
  const { adl2Text, converted, warnings } = convertAdl14ToAdl2(original);
  assert(converted);
  assert(warnings.length > 0);
  assert(adl2Text.includes('["id1"]'));
  assert(!adl2Text.includes('["at0001"]'));

  const parsed = parseAdl(adl2Text);
  assert(parsed.archetype?.definition?.node_id === "id1");
});

Deno.test("convertAdl14ToAdl2 - merges constraint_definitions into term_definitions", () => {
  const source = `archetype (adl_version=1.4; rm_release=1.0.4)
    openEHR-TEST.constraint_merge.v1

definition
    OBSERVATION[at0001] matches {
    }

ontology
    term_definitions = <
        ["en"] = <
            ["at0001"] = <
                text = <"obs">
            >
        >
    >
    constraint_definitions = <
        ["en"] = <
            ["at0001"] = <
                description = <"obs detail">
            >
        >
    >
`;
  const { adl2Text, converted } = convertAdl14ToAdl2(source);
  assert(converted);
  assert(adl2Text.includes("terminology"));
  assert(adl2Text.includes('["id1"]'));
  assert(adl2Text.includes("description"));
  assert(!/^\s*constraint_definitions\s*=/im.test(adl2Text));
});
