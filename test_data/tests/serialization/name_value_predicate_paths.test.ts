/**
 * Web Template paths of name-constrained siblings carry a `name/value`
 * predicate (`content[openEHR-EHR-SECTION.adhoc.v1 and name/value='Behavior']`,
 * `items[at0003 and name/value='Organisationsnummer']`). The `/` inside the
 * predicate must not split the path: FLAT read and write lost such nodes.
 */
import { assert, assertEquals } from "@std/assert";
import { parseOptXml } from "../../../parser/legacy/opt_xml_parser.ts";
import {
  aqlPathSegments,
  buildWebTemplate,
  deserializeFromFlatWithIssues,
  flatRootId,
  resolveAtPath,
  serializeToFlat,
} from "../../../serialization/simplified/mod.ts";

Deno.test("aqlPathSegments keeps name/value predicates in one segment", () => {
  assertEquals(
    aqlPathSegments(
      "/context/other_context[at0001]/items[at0003 and name/value='A/B']/value",
    ).map(({ attr, nodeId, nameValue }) => ({ attr, nodeId, nameValue })),
    [
      { attr: "context", nodeId: undefined, nameValue: undefined },
      { attr: "other_context", nodeId: "at0001", nameValue: undefined },
      { attr: "items", nodeId: "at0003", nameValue: "A/B" },
      { attr: "value", nodeId: undefined, nameValue: undefined },
    ],
  );
  assertEquals(aqlPathSegments("/items[at0003, 'X']")[0].nameValue, "X");
});

Deno.test("FLAT round trip keeps sibling SECTIONs told apart by name/value", async () => {
  const xml = await Deno.readTextFile(new URL("../../opt14/aql_example.opt", import.meta.url));
  const wt = buildWebTemplate(parseOptXml(xml).operationalTemplate);
  const root = flatRootId(wt);
  const weight = `${root}/measurements/body_weight/any_event/weight`;
  const status = `${root}/behavior/alcohol_consumption_summary/overall_description`;
  const flat = {
    [`${weight}|magnitude`]: 72.5,
    [`${weight}|unit`]: "kg",
    [status]: "Rarely",
  };
  const { composition } = deserializeFromFlatWithIssues(flat, wt);
  const content = (composition as { content?: Array<Record<string, unknown>> }).content ?? [];
  assertEquals(
    content.map((s) => (s.name as { value?: string } | undefined)?.value).sort(),
    ["Behavior", "Measurements"],
  );
  for (const section of content) {
    assertEquals(
      Object.keys(section).filter((k) => k.includes("=")),
      [],
      "no property named after a predicate fragment",
    );
  }
  const behaviorPath =
    "/content[openEHR-EHR-SECTION.adhoc.v1 and name/value='Behavior']";
  assert(resolveAtPath(composition, behaviorPath), "Behavior section resolves");
  const out = serializeToFlat(composition, wt) as Record<string, unknown>;
  const weightOut = weight.replace("/any_event/", "/any_event:0/");
  assertEquals(out[`${weightOut}|magnitude`], 72.5);
  assertEquals(out[`${weightOut}|unit`], "kg");
  assertEquals(out[status], "Rarely");
});

Deno.test("FLAT: a bare DV_IDENTIFIER key reads as |id (as EHRbase reads it)", async () => {
  const { buildDvValue } = await import("../../../serialization/simplified/dv_field_maps.ts");
  const dv = buildDvValue("DV_IDENTIFIER", { "": "SE2321000016-I1MN", type: "urn:oid:1.2.752.29.4.19" });
  assertEquals(dv.id, "SE2321000016-I1MN");
  assertEquals(dv.type, "urn:oid:1.2.752.29.4.19");
  const explicit = buildDvValue("DV_IDENTIFIER", { "": "bare", id: "explicit" });
  assertEquals(explicit.id, "explicit");
});
