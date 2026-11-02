/**
 * Every key the FLAT and STRUCTURED writers emit is read back without an
 * unknown-key issue, for values the RM allows where the template is loose:
 * a DV_CODED_TEXT on a DV_TEXT node (`|code`, `|value`, `|terminology`), and
 * any data value on an ELEMENT without a value constraint
 * (`<element>/<type>_value`, Simplified Formats §5.8).
 */
import { assert, assertEquals } from "@std/assert";
import { parseOptXml } from "../../../../parser/legacy/opt_xml_parser.ts";
import {
  buildWebTemplate,
  deserializeFromFlatWithIssues,
  deserializeFromStructuredWithIssues,
  type FlatPayload,
  serializeToFlat,
  serializeToStructured,
  validateFlatPayload,
  type WebTemplate,
} from "../../../../serialization/simplified/mod.ts";
import { resolveAllAtWebTemplateNode } from "../../../../serialization/simplified/instance_nav.ts";
import type { WebTemplateNode } from "../../../../serialization/simplified/types.ts";

const OPT = new URL(
  "../../../opt14/conformance_ehrbase.de.v0.opt",
  import.meta.url,
);
const CLOCK = () => "2026-11-02T12:00:00Z";
const ROOT = "conformance-ehrbase.de.v0";
const EVAL = `${ROOT}/conformance_section/conformance_evaluation`;
const CLUSTER =
  `${ROOT}/conformance_section/conformance_observation/any_event:0/conformance_cluster`;

const BASE: FlatPayload = {
  "ctx/language": "en",
  "ctx/territory": "DE",
  "ctx/composer_name": "Test",
};

function webTemplate(): WebTemplate {
  return buildWebTemplate(
    parseOptXml(Deno.readTextFileSync(OPT)).operationalTemplate!,
  );
}

function nodeAt(wt: WebTemplate, chain: string): WebTemplateNode {
  let node = wt.tree;
  for (const id of chain.split("/").slice(1)) {
    node = node.children!.find((c) => c.id === id.replace(/:\d+$/, ""))!;
  }
  return node;
}

function errors(
  issues: { kind?: string; severity: string; message: string }[],
) {
  return issues.filter((i) =>
    i.kind === "unknown-key" || i.severity === "error"
  )
    .map((i) => i.message);
}

/** FLAT → RM → FLAT and RM → STRUCTURED → RM; returns the value at `chain`. */
function roundTrip(wt: WebTemplate, flat: FlatPayload, chain: string) {
  const first = deserializeFromFlatWithIssues({ ...BASE, ...flat }, wt, {
    clock: CLOCK,
  });
  assertEquals(errors(first.issues), []);
  const written = serializeToFlat(first.composition, wt);
  for (const [key, value] of Object.entries(flat)) {
    assertEquals(written[key], value, key);
  }
  const again = deserializeFromFlatWithIssues(written, wt, { clock: CLOCK });
  assertEquals(errors(again.issues), []);
  const validation = validateFlatPayload(written, wt, {
    strictUnknownKeys: true,
  });
  assertEquals(validation.errors, []);

  const structured = serializeToStructured(first.composition, wt);
  const fromStructured = deserializeFromStructuredWithIssues(structured, wt, {
    clock: CLOCK,
  });
  assertEquals(errors(fromStructured.issues), []);
  const node = nodeAt(wt, chain);
  const value =
    resolveAllAtWebTemplateNode(fromStructured.composition, node)[0];
  assertEquals(value, resolveAllAtWebTemplateNode(first.composition, node)[0]);
  return value as Record<string, unknown>;
}

Deno.test("DV_CODED_TEXT on a DV_TEXT node: |code, |value and |terminology round-trip", () => {
  const wt = webTemplate();
  const key = `${EVAL}/dv_text`;
  const value = roundTrip(wt, {
    [`${key}|code`]: "J45",
    [`${key}|value`]: "Asthma",
    [`${key}|terminology`]: "ICD10",
  }, key);
  assertEquals(value._type, "DV_CODED_TEXT");
  assertEquals(value.value, "Asthma");
  const code = value.defining_code as Record<string, unknown>;
  assertEquals(code.code_string, "J45");
  assertEquals((code.terminology_id as Record<string, unknown>).value, "ICD10");
});

Deno.test("DV_TEXT node: plain text stays DV_TEXT", () => {
  const wt = webTemplate();
  const key = `${EVAL}/dv_text`;
  const value = roundTrip(wt, { [key]: "free text" }, key);
  assertEquals(value._type, "DV_TEXT");
});

Deno.test("ELEMENT without a value constraint: the value type is the <type>_value segment", () => {
  const wt = webTemplate();
  const element = `${CLUSTER}/any`;
  const cases: [FlatPayload, string][] = [
    [{ [`${element}/text_value`]: "labresult 4" }, "DV_TEXT"],
    [{
      [`${element}/quantity_value|magnitude`]: 65.9,
      [`${element}/quantity_value|unit`]: "kg",
    }, "DV_QUANTITY"],
    [{
      [`${element}/coded_text_value|code`]: "J45",
      [`${element}/coded_text_value|value`]: "Asthma",
      [`${element}/coded_text_value|terminology`]: "ICD10",
    }, "DV_CODED_TEXT"],
    [{ [`${element}/boolean_value`]: true }, "DV_BOOLEAN"],
    [
      { [`${element}/date_time_value`]: "2026-11-02T10:00:00Z" },
      "DV_DATE_TIME",
    ],
    [{ [`${element}/ehr_uri_value`]: "ehr://abc/x" }, "DV_EHR_URI"],
    [{
      [`${element}/interval_of_quantity_value/lower|magnitude`]: 1,
      [`${element}/interval_of_quantity_value/lower|unit`]: "kg",
      [`${element}/interval_of_quantity_value/upper|magnitude`]: 2,
      [`${element}/interval_of_quantity_value/upper|unit`]: "kg",
    }, "DV_INTERVAL"],
  ];
  for (const [flat, type] of cases) {
    const value = roundTrip(wt, flat, element);
    assertEquals(String(value._type).replace(/<.*$/, ""), type, JSON.stringify(flat));
  }
});

Deno.test("ELEMENT without a value constraint: a bare key or an unknown type is reported", () => {
  const wt = webTemplate();
  const element = `${CLUSTER}/any`;
  const payloads: FlatPayload[] = [
    { [element]: "x" },
    { [`${element}/no_such_value`]: "x" },
    // `interval_value` does not say what the interval is of.
    { [`${element}/interval_value/lower|magnitude`]: 1 },
  ];
  for (const flat of payloads) {
    const { issues } = deserializeFromFlatWithIssues({ ...BASE, ...flat }, wt, {
      clock: CLOCK,
    });
    assert(issues.some((i) => i.kind === "unknown-key"), JSON.stringify(flat));
  }
});
