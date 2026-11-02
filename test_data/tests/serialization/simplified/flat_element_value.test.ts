/**
 * One value per ELEMENT in FLAT input. `conformance_choice_pair.v0` is the
 * EHRbase conformance template with `labresult` a choice of DV_TEXT,
 * DV_QUANTITY and DV_INTERVAL<DV_QUANTITY>, `any` an ELEMENT without a value
 * constraint, and `comment` a {DV_CODED_TEXT, DV_TEXT} pair.
 */
import { assert, assertEquals, assertThrows } from "@std/assert";
import { parseOptXml } from "../../../../parser/legacy/opt_xml_parser.ts";
import {
  buildWebTemplate,
  deserializeFromFlat,
  deserializeFromFlatWithIssues,
  type FlatPayload,
} from "../../../../serialization/simplified/mod.ts";

const wt = buildWebTemplate(
  parseOptXml(
    Deno.readTextFileSync(
      new URL("../../../opt14/conformance_choice_pair.v0.opt", import.meta.url),
    ),
  ).operationalTemplate!,
);
const ROOT = wt.tree.id;
const CLUSTER =
  `${ROOT}/conformance_section/conformance_observation/any_event:0/conformance_cluster`;
const CTX: FlatPayload = {
  "ctx/language": "en",
  "ctx/territory": "SE",
  "ctx/composer_name": "Test",
  [`${ROOT}/context/start_time`]: "2026-11-02T05:00:00Z",
  [`${ROOT}/context/setting|code`]: "238",
  [`${ROOT}/context/setting|value`]: "other care",
  [`${ROOT}/context/setting|terminology`]: "openehr",
};

function payload(node: string, fields: Record<string, unknown>): FlatPayload {
  const flat: FlatPayload = { ...CTX };
  for (const [key, value] of Object.entries(fields)) {
    flat[`${CLUSTER}/${node}${key.startsWith("|") ? "" : "/"}${key}`] =
      value as string;
  }
  return flat;
}

/** The ELEMENT `node` of the conformance cluster in the read composition. */
function element(flat: FlatPayload, node: "labresult" | "any" | "comment") {
  const { composition, issues } = deserializeFromFlatWithIssues(flat, wt);
  const code = { labresult: "at0003", any: "at0005", comment: "at0004" }[node];
  let cluster: Record<string, unknown> | undefined;
  const walk = (o: unknown) => {
    if (!o || typeof o !== "object") return;
    const r = o as Record<string, unknown>;
    if (String(r.archetype_node_id).includes("CLUSTER.conformance_cluster")) {
      cluster = r;
    }
    for (const v of Object.values(r)) {
      if (Array.isArray(v)) v.forEach(walk);
      else walk(v);
    }
  };
  walk(composition);
  const items = (cluster?.items ?? []) as Record<string, unknown>[];
  return {
    element: items.find((item) => item.archetype_node_id === code),
    issues,
  };
}

const elementValueErrors = (issues: { kind?: string; severity: string }[]) =>
  issues.filter((i) => i.kind === "element-value" && i.severity === "error");

// --- two typed values on one ELEMENT

Deno.test("FLAT: two <type>_value keys on a choice ELEMENT are rejected", () => {
  const flat = payload("labresult", {
    text_value: "lab text",
    "quantity_value|magnitude": 5,
    "quantity_value|unit": "mg",
  });
  const { element: el, issues } = element(flat, "labresult");
  assertEquals(elementValueErrors(issues).length, 1);
  assert(
    /more than one typed value/.test(elementValueErrors(issues)[0].message),
  );
  assertEquals(el?.value, undefined);
  assertThrows(
    () => deserializeFromFlat(flat, wt),
    Error,
    "more than one typed value",
  );
});

Deno.test("FLAT: two <type>_value keys on an unconstrained ELEMENT are rejected", () => {
  const flat = payload("any", { text_value: "any text", count_value: 3 });
  assertEquals(elementValueErrors(element(flat, "any").issues).length, 1);
  assertThrows(
    () => deserializeFromFlat(flat, wt),
    Error,
    "more than one typed value",
  );
});

Deno.test("FLAT: one <type>_value per ELEMENT instance is fine", () => {
  const flat = payload("labresult", { text_value: "lab text" });
  const { element: el, issues } = element(flat, "labresult");
  assertEquals(elementValueErrors(issues), []);
  assertEquals((el?.value as Record<string, unknown>)._type, "DV_TEXT");
});
