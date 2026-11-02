/**
 * `validateFlatPayload` accepts the bounds of a DV_INTERVAL<T> node
 * (`…/interval_quantity/lower|magnitude`), which the reader already reads,
 * and checks their suffixes against T.
 */
import { assertEquals } from "@std/assert";
import { parseOptXml } from "../../../../parser/legacy/opt_xml_parser.ts";
import {
  buildWebTemplate,
  type FlatPayload,
  validateFlatPayload,
} from "../../../../serialization/simplified/mod.ts";

const wt = buildWebTemplate(
  parseOptXml(
    Deno.readTextFileSync(
      new URL("../../../opt14/Test_all_types.opt", import.meta.url),
    ),
  ).operationalTemplate!,
);
const BASE = `${wt.tree.id}/test_all_types_1:0`;

Deno.test("FLAT validator: DV_INTERVAL bounds are known keys", () => {
  const flat: FlatPayload = {
    [`${BASE}/interval_count/lower`]: 5,
    [`${BASE}/interval_count/upper`]: 8,
    [`${BASE}/interval_quantity/lower|magnitude`]: 65.42,
    [`${BASE}/interval_quantity/lower|unit`]: "mg",
    [`${BASE}/interval_quantity/upper|magnitude`]: 93.14,
    [`${BASE}/interval_quantity/upper|unit`]: "mg",
    [`${BASE}/interval_datetime/lower`]: "2019-03-22T22:36:25.232+01:00",
    [`${BASE}/interval_datetime/upper`]: "2019-03-22T22:36:25.232+01:00",
  };
  const result = validateFlatPayload(flat, wt, { strictUnknownKeys: true });
  assertEquals(result.errors, []);
  assertEquals(result.warnings.filter((w) => w.path.includes("interval")), []);
});

Deno.test("FLAT validator: a bound suffix of another type is reported", () => {
  const result = validateFlatPayload(
    {
      [`${BASE}/interval_count/lower|magnitude`]: 5,
    },
    wt,
    { strictUnknownKeys: true },
  );
  assertEquals(
    result.warnings.filter((w) => w.path.includes("interval")).map((w) =>
      w.message
    ),
    ['Unknown suffix "|magnitude" for rmType DV_COUNT'],
  );
});

Deno.test("FLAT validator: lower/upper below a non-interval node stays unknown", () => {
  const result = validateFlatPayload(
    {
      [`${BASE}/uri/lower`]: "x",
    },
    wt,
    { strictUnknownKeys: true },
  );
  assertEquals(result.errors.map((e) => e.message), [
    "Unknown flat key for template",
  ]);
});
