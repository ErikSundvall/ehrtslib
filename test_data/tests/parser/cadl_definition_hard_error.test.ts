/**
 * Regression for https://github.com/ErikSundvall/ehrtslib/issues/113
 *
 * cADL definition failures must be hard errors — never a soft warning that
 * leaves an empty definition and lets ADL14Serializer emit
 * `definition undefined[undefined]`.
 */

import {
  assert,
  assertThrows,
} from "https://deno.land/std@0.220.0/assert/mod.ts";
import { parseAdl } from "../../../parser/mod.ts";
import { ADL14Serializer } from "../../../generation/adl14_serializer.ts";
import * as openehr_am from "../../../am/openehr_am.ts";

/**
 * Minimal ADL2 whose definition has a stray identifier where a typed node is expected.
 * #113 requires the failure to be fatal rather than a warning + empty
 * definition. (Archie-valid DV_CODED_TEXT / slot forms are covered by #114.)
 */
const FATAL_DEFINITION_ADL = `archetype (adl_version=2.0.6; rm_release=1.1.0)
	openEHR-EHR-CLUSTER.cadl_hard_error_probe.v1.0.0

language
	original_language = <[ISO_639-1::en]>

definition
	CLUSTER[id1] matches {
		items matches {
			ELEMENT[id2] matches {
				value matches {
					DV_TEXT[id3]
					definitely_not_valid_token_here
				}
			}
		}
	}

terminology
	term_definitions = <
		["en"] = <
			["id1"] = <
				text = <"Probe">
				description = <"Probe">
			>
		>
	>
`;

Deno.test({
  name: "issue #113: cADL definition failure throws (hard error)",
  fn() {
  const err = assertThrows(
    () => parseAdl(FATAL_DEFINITION_ADL),
    Error,
    "Failed to parse definition section (fatal cADL error)",
  );
  assert(
    /cADL parse error|Unexpected token|fatal cADL/.test(String(err.message)),
    `unexpected message: ${err.message}`,
  );
  },
});

Deno.test("issue #113: ADL14Serializer refuses empty definition", () => {
  const archetype = new openehr_am.ARCHETYPE();
  archetype.definition = new openehr_am.C_COMPLEX_OBJECT();
  assertThrows(
    () => new ADL14Serializer().serialize(archetype),
    Error,
    "refuse to serialize archetype with empty or incomplete definition",
  );
});

Deno.test("issue #113: ADL14Serializer refuses missing definition", () => {
  const archetype = new openehr_am.ARCHETYPE();
  assertThrows(
    () => new ADL14Serializer().serialize(archetype),
    Error,
    "refuse to serialize archetype with empty or incomplete definition",
  );
});
