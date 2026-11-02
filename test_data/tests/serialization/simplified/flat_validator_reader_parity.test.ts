/**
 * `validateFlatPayload` reports what the FLAT reader rejects, so a payload
 * that `deserializeFromFlat` throws on is not valid.
 */
import { assert, assertEquals } from "@std/assert";
import { parseOptXml } from "../../../../parser/legacy/opt_xml_parser.ts";
import {
  buildWebTemplate,
  deserializeFromFlat,
  type FlatPayload,
  validateFlatPayload,
} from "../../../../serialization/simplified/mod.ts";

const wt = buildWebTemplate(
  parseOptXml(
    Deno.readTextFileSync(
      new URL("../../../opt14/conformance_choice_pair.v0.opt", import.meta.url),
    ),
  ).operationalTemplate!,
);
const ROOT = wt.tree.id;
const OBS = `${ROOT}/conformance_section/conformance_observation/any_event:0`;
const CLUSTER = `${OBS}/conformance_cluster`;
const CTX: FlatPayload = {
  "ctx/language": "en",
  "ctx/territory": "SE",
  "ctx/composer_name": "Test",
  [`${ROOT}/context/start_time`]: "2026-11-02T05:00:00Z",
  [`${ROOT}/context/setting|code`]: "238",
  [`${ROOT}/context/setting|value`]: "other care",
  [`${ROOT}/context/setting|terminology`]: "openehr",
};
const NF = {
  "_null_flavour|code": "271",
  "_null_flavour|value": "no information",
  "_null_flavour|terminology": "openehr",
};
const at = (base: string, fields: Record<string, string | number>) =>
  Object.fromEntries(
    Object.entries(fields).map((
      [k, v],
    ) => [`${base}${k.startsWith("|") ? "" : "/"}${k}`, v]),
  );

const CASES: Record<string, FlatPayload> = {
  "coded text on DV_TEXT, all three": at(`${OBS}/dv_text`, {
    "|code": "I10",
    "|value": "Essential hypertension",
    "|terminology": "ICD10",
  }),
  "coded text on DV_TEXT, no terminology": at(`${OBS}/dv_text`, {
    "|code": "I10",
    "|value": "Essential hypertension",
  }),
  "local code not in the archetype": at(`${OBS}/dv_text`, {
    "|code": "at9999",
    "|value": "x",
    "|terminology": "local",
  }),
  "text_value": at(`${CLUSTER}/labresult`, { text_value: "lab text" }),
  "two typed values": at(`${CLUSTER}/labresult`, {
    text_value: "lab text",
    "quantity_value|magnitude": 5,
    "quantity_value|unit": "mg",
  }),
  "typed value + _null_flavour": at(`${CLUSTER}/any`, {
    text_value: "x",
    ...NF,
  }),
  "_null_flavour only": at(`${CLUSTER}/any`, NF),
  "untyped _value": at(`${CLUSTER}/labresult`, { _value: "lab text" }),
  "interval_value (no type)": at(`${CLUSTER}/labresult`, {
    "interval_value/lower|magnitude": 1,
    "interval_value/lower|unit": "mg",
  }),
  "count_value (type not allowed)": at(`${CLUSTER}/labresult`, {
    count_value: 3,
  }),
  "bare plain text on the coded/plain pair": { [`${CLUSTER}/comment`]: "x" },
  "|other on the pair": { [`${CLUSTER}/comment|other`]: "x" },
};

for (const [name, fields] of Object.entries(CASES)) {
  Deno.test(`validateFlatPayload agrees with the reader: ${name}`, () => {
    const flat = { ...CTX, ...fields };
    let readerOk = true;
    try {
      deserializeFromFlat(flat, wt);
    } catch {
      readerOk = false;
    }
    const result = validateFlatPayload(flat, wt);
    assertEquals(result.valid, readerOk, JSON.stringify(result.errors));
  });
}

Deno.test("validateFlatPayload: unknown keys are errors unless strictUnknownKeys is false", () => {
  const flat = { ...CTX, [`${CLUSTER}/no_such_node`]: "x" };
  assertEquals(validateFlatPayload(flat, wt).valid, false);
  const lenient = validateFlatPayload(flat, wt, { strictUnknownKeys: false });
  assert(lenient.valid);
  assert(lenient.warnings.some((w) => w.path.endsWith("no_such_node")));
});
