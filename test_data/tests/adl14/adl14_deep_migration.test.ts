/**
 * Deep ADL 1.4 → ADL2 terminology migration tests.
 */

import { assert, assertEquals } from "https://deno.land/std@0.220.0/assert/mod.ts";
import { convertAdl14ToAdl2 } from "../../../parser/adl14_to_adl2_converter.ts";
import { parseAdl } from "../../../parser/mod.ts";

const TEST_DATA = new URL("../../", import.meta.url);

Deno.test("convertAdl14ToAdl2 - ac-codes in term_definitions become id keys", async () => {
  const original = await Deno.readTextFile(
    new URL("adl14/openEHR-TEST_PKG-WHOLE.most_minimal.v1.adl", TEST_DATA),
  );
  const { adl2Text, converted, warnings } = convertAdl14ToAdl2(original);
  assert(converted);
  assert(warnings.length > 0);
  assert(adl2Text.includes('["id2"]'));
  assert(!adl2Text.includes('["at0001"]'));

  const parsed = parseAdl(adl2Text);
  assert(parsed.archetype?.definition?.node_id === "id2");
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
  assert(adl2Text.includes('["id2"]'));
  assert(adl2Text.includes("description"));
  assert(!/^\s*constraint_definitions\s*=/im.test(adl2Text));
});

Deno.test("convertAdl14ToAdl2 - indented description does not split terminology or definition (#142)", () => {
  const source = `archetype (adl_version=1.4)
    openEHR-EHR-OBSERVATION.shift_probe.v1

definition
    OBSERVATION[at0000] matches {
        data matches {
            HISTORY[at0001] matches {
                events matches {
                    EVENT[at0002] matches {
                        data matches {
                            ITEM_TREE[at0003] matches {
                            }
                        }
                    }
                }
            }
        }
        protocol matches {
            ITEM_TREE[at0004] matches {
            }
        }
    }
    INSTRUCTION[at0000.1] matches {
        activities matches {
            ACTIVITY[at0.1] matches {
                description matches {
                    ITEM_TREE[at0009] matches {
                    }
                }
            }
        }
    }

ontology
    term_definitions = <
        ["en"] = <
            items = <
                ["at0000"] = <
                    text = <"Root">
                    description = <"Root">
                >
                ["at0001"] = <
                    text = <"Event Series">
                    description = <"@ internal @">
                >
                ["at0003"] = <
                    text = <"Result tree">
                    description = <"@ internal @">
                >
                ["at0004"] = <
                    text = <"Protocol tree">
                    description = <"@ internal @">
                >
                ["at0009"] = <
                    text = <"Request tree">
                    description = <"@ internal @">
                >
                ["at0.1"] = <
                    text = <"New activity">
                    description = <"New">
                >
                ["at0000.1"] = <
                    text = <"Specialised">
                    description = <"Specialised">
                >
            >
        >
    >
`;
  const { adl2Text } = convertAdl14ToAdl2(source);
  assert(adl2Text.includes("OBSERVATION[id1]"));
  assert(adl2Text.includes("HISTORY[id2]"));
  assert(adl2Text.includes("ITEM_TREE[id4]"));
  assert(adl2Text.includes("ITEM_TREE[id5]"));
  assert(adl2Text.includes("ITEM_TREE[id10]"), adl2Text);
  assert(adl2Text.includes("INSTRUCTION[id1.1]"));
  assert(adl2Text.includes("ACTIVITY[id0.1]"));
  for (const key of ["id1", "id2", "id4", "id5", "id10", "id0.1", "id1.1"]) {
    assert(adl2Text.includes(`["${key}"]`), `missing term key ${key}`);
  }
  assert(!adl2Text.includes('["at0003"]'));
  assert(!adl2Text.includes('["at0009"]'));
});
