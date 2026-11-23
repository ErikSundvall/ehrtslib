/**
 * #328: parseAdl rejected header uid/build_uid values whose first segment
 * looks like an at/ac/id term code (`ac331b21-…`, `at111111-…`, `id331b21-…`).
 */

import { assert, assertEquals, assertThrows } from "@std/assert";
import { parseAdl } from "../../../parser/parse_adl.ts";

const AC_UID = "ac331b21-71f6-4ae5-950a-1a8d78c9f0c4";
const AT_UID = "at111111-1111-1111-1111-111111111111";
const ID_UID = "id331b21-71f6-4ae5-950a-1a8d78c9f0c4";
const AD_UID = "ad331b21-71f6-4ae5-950a-1a8d78c9f0c4";
const HYPHEN_DIGIT_AC_UID = "ac331-71f6-4ae5-950a-1a8d78c9f0c4";

function headerAdl(
  meta: string,
  opts?: { crlf?: boolean; bom?: boolean; id?: string },
): string {
  const nl = opts?.crlf ? "\r\n" : "\n";
  let text = `archetype (${meta})${nl}\t${
    opts?.id ?? "openEHR-EHR-CLUSTER.x.v1"
  }${nl}`;
  if (opts?.bom) text = "\uFEFF" + text;
  return text;
}

function parsedId(source: string, convertAdl14?: boolean): string {
  const result = parseAdl(source, { convertAdl14 });
  assert(result.archetype, "expected an archetype");
  const id = result.archetype.archetype_id?.value;
  assert(id, "expected archetype_id");
  return id;
}

Deno.test("#328 parseAdl accepts ADL 1.4 uid starting with ac plus a digit", () => {
  const id = parsedId(
    headerAdl(`adl_version=1.4; uid=${AC_UID}`),
  );
  assertEquals(id, "openEHR-EHR-CLUSTER.x.v1.0.0");
});

Deno.test("#328 parseAdl accepts ADL 1.4 uid starting with at plus a digit", () => {
  parsedId(headerAdl(`adl_version=1.4; uid=${AT_UID}`));
});

Deno.test("#328 parseAdl accepts ADL 1.4 uid starting with id plus a digit", () => {
  parsedId(headerAdl(`adl_version=1.4; uid=${ID_UID}`));
});

Deno.test("#328 parseAdl still accepts ADL 1.4 uid starting with ad", () => {
  parsedId(headerAdl(`adl_version=1.4; uid=${AD_UID}`));
});

Deno.test("#328 parseAdl accepts ac-prefix uid that continues with hyphen digits", () => {
  // If only the leading AC_CODE token were consumed, the next INTEGER
  // leftover (`-71f6…`) would fail as a metadata key.
  parsedId(headerAdl(`adl_version=1.4; uid=${HYPHEN_DIGIT_AC_UID}`));
});

Deno.test("#328 parseAdl accepts ADL2 header uid and build_uid with at/ac/id prefixes", () => {
  const source = headerAdl(
    `adl_version=2.0.6; rm_release=1.1.0; generated; uid=${AC_UID}; build_uid=${AT_UID}; is_controlled`,
    { id: "openEHR-EHR-CLUSTER.x.v1.0.0" },
  );
  const result = parseAdl(source);
  assert(result.archetype, "expected an archetype");
  assertEquals(result.detectedVersion, "2.x");
  assertEquals(result.archetype.adl_version, "2.0.6");
  assertEquals(result.archetype.rm_release, "1.1.0");
  assertEquals(
    result.archetype.archetype_id?.value,
    "openEHR-EHR-CLUSTER.x.v1.0.0",
  );
});

Deno.test("#328 parseAdl accepts ADL2 build_uid starting with id plus a digit", () => {
  const result = parseAdl(
    headerAdl(
      `adl_version=2.0.6; rm_release=1.1.0; build_uid=${ID_UID}`,
      { id: "openEHR-EHR-CLUSTER.x.v1.0.0" },
    ),
  );
  assertEquals(result.archetype?.rm_release, "1.1.0");
});

Deno.test("#328 parseAdl accepts CRLF and BOM around an ac-prefix uid", () => {
  parsedId(
    headerAdl(`adl_version=1.4; uid=${AC_UID}`, { crlf: true, bom: true }),
  );
  parsedId(
    headerAdl(
      `adl_version=2.0.6; rm_release=1.1.0; uid=${AT_UID}; build_uid=${AC_UID}`,
      { crlf: true, bom: true, id: "openEHR-EHR-CLUSTER.x.v1.0.0" },
    ),
  );
});

Deno.test("#328 parseAdl keeps quoted metadata strings and bare flags", () => {
  const result = parseAdl(
    headerAdl(
      `adl_version="2.0.6"; rm_release=1.1.0; generated; uid="${AC_UID}"`,
      { id: "openEHR-EHR-CLUSTER.x.v1.0.0" },
    ),
  );
  assertEquals(result.archetype?.adl_version, "2.0.6");
  assertEquals(result.archetype?.rm_release, "1.1.0");
});

Deno.test("#328 parseAdl still reports a missing metadata value", () => {
  assertThrows(
    () => parseAdl(headerAdl("adl_version=2.0.6; uid=")),
    Error,
    "Expected metadata value",
  );
});
