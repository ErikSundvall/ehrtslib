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
 * Minimal ADL2 whose definition uses `DV_CODED_TEXT[id] matches {…}`.
 * Ehrtslib's cADL parser currently rejects that form; #113 requires the
 * failure to be fatal rather than a warning + empty definition.
 */
const FATAL_DEFINITION_ADL = `archetype (adl_version=2.0.6; rm_release=1.1.0)
\topenEHR-EHR-CLUSTER.cadl_hard_error_probe.v1.0.0

language
\toriginal_language = <[ISO_639-1::en]>

definition
\tCLUSTER[id1] matches {
\t\titems matches {
\t\t\tELEMENT[id2] matches {
\t\t\t\tvalue matches {
\t\t\t\t\tDV_CODED_TEXT[id3] matches {
\t\t\t\t\t\tdefining_code matches {[ac1]}
\t\t\t\t\t}
\t\t\t\t}
\t\t\t}
\t\t}
\t}

terminology
\tterm_definitions = <
\t\t["en"] = <
\t\t\t["id1"] = <
\t\t\t\ttext = <"Probe">
\t\t\t\tdescription = <"Probe">
\t\t\t>
\t\t\t["id2"] = <
\t\t\t\ttext = <"Item">
\t\t\t\tdescription = <"Item">
\t\t\t>
\t\t\t["id3"] = <
\t\t\t\ttext = <"Code">
\t\t\t\tdescription = <"Code">
\t\t\t>
\t\t>
\t>
`;

Deno.test("issue #113: cADL definition failure throws (hard error)", () => {
  const err = assertThrows(
    () => parseAdl(FATAL_DEFINITION_ADL),
    Error,
    "Failed to parse definition section (fatal cADL error)",
  );
  assert(
    /cADL parse error|Unexpected token|fatal cADL/.test(String(err.message)),
    `unexpected message: ${err.message}`,
  );
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
