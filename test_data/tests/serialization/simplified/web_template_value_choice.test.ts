/**
 * An ELEMENT whose value may have one of several types gets one Web Template
 * child per type, `<type>_value` at `<element>/value`, as EHRbase and Better
 * build it; FLAT and STRUCTURED write and read the value under that child.
 * The coded/plain text pair stays one node (open decision).
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
  webTemplateToOpt,
} from "../../../../serialization/simplified/mod.ts";
import { resolveAllAtWebTemplateNode } from "../../../../serialization/simplified/instance_nav.ts";
import type { WebTemplateNode } from "../../../../serialization/simplified/types.ts";

const CLOCK = () => "2026-11-02T12:00:00Z";

function webTemplate(file: string): WebTemplate {
  return buildWebTemplate(
    parseOptXml(
      Deno.readTextFileSync(new URL(`../../../opt14/${file}`, import.meta.url)),
    ).operationalTemplate!,
  );
}

function find(wt: WebTemplate, chain: string): WebTemplateNode {
  let node = wt.tree;
  for (const id of chain.split("/")) {
    node = node.children!.find((c) => c.id === id)!;
    assert(node, chain);
  }
  return node;
}

function errors(
  issues: { kind?: string; severity: string; message: string }[],
) {
  return issues.filter((i) =>
    i.severity === "error" || i.kind === "unknown-key"
  )
    .map((i) => i.message);
}

Deno.test("Web Template: a choice ELEMENT has one <type>_value child per type", () => {
  const wt = webTemplate("Test_all_types.opt");
  const choice = find(wt, "test_all_types_1/choice");
  assertEquals(choice.rmType, "ELEMENT");
  assertEquals(choice.nodeId, "at0009");
  assertEquals(
    choice.children!.map((c) => [c.id, c.rmType, c.min, c.max, c.aqlPath]),
    [
      ["quantity_value", "DV_QUANTITY", 0, 1, `${choice.aqlPath}/value`],
      ["count_value", "DV_COUNT", 0, 1, `${choice.aqlPath}/value`],
    ],
  );
  const quantity = choice.children![0];
  assertEquals(quantity.name, choice.name);
  assert(quantity.inputs?.some((i) => i.suffix === "unit"));
});

Deno.test("FLAT: EHRbase-shaped choice keys read, write and validate (Veredictum all_types)", () => {
  const wt = webTemplate("Test_all_types.opt");
  const source = JSON.parse(
    Deno.readTextFileSync(
      new URL("../../../veredictum/sf/flat.all_types.json", import.meta.url),
    ),
  ) as FlatPayload;
  const flat: FlatPayload = {};
  for (const [k, v] of Object.entries(source)) {
    flat[k.replace(/^test_all_types\//, `${wt.tree.id}/`)] = v;
  }
  const read = deserializeFromFlatWithIssues(flat, wt, { clock: CLOCK });
  assertEquals(errors(read.issues), []);
  const element = find(wt, "test_all_types_1/choice");
  const value = resolveAllAtWebTemplateNode(
    read.composition,
    element.children![0],
  )[0] as Record<
    string,
    unknown
  >;
  assertEquals(value._type, "DV_QUANTITY");
  assertEquals(value.magnitude, 60.91);

  const written = serializeToFlat(read.composition, wt);
  const base = `${wt.tree.id}/test_all_types_1:0/choice`;
  assertEquals(written[`${base}/quantity_value|magnitude`], 60.91);
  assertEquals(written[`${base}/quantity_value|unit`], "mm[Hg]");
  assertEquals(
    Object.keys(written).filter((k) => k.startsWith(`${base}|`)),
    [],
  );
  assertEquals(
    validateFlatPayload(written, wt, { strictUnknownKeys: true }).errors,
    [],
  );
  assertEquals(
    errors(deserializeFromFlatWithIssues(written, wt, { clock: CLOCK }).issues),
    [],
  );

  const structured = serializeToStructured(read.composition, wt);
  const again = deserializeFromStructuredWithIssues(structured, wt, {
    clock: CLOCK,
  });
  assertEquals(errors(again.issues), []);
  assertEquals(
    resolveAllAtWebTemplateNode(again.composition, element.children![0])[0],
    value,
  );
});

Deno.test("FLAT: the other type of a choice round-trips under its own child", () => {
  const wt = webTemplate("Test_all_types.opt");
  const base = `${wt.tree.id}/test_all_types_1:0/choice`;
  const read = deserializeFromFlatWithIssues(
    {
      "ctx/language": "en",
      "ctx/territory": "DE",
      "ctx/composer_name": "Test",
      [`${base}/count_value`]: 7,
    },
    wt,
    { clock: CLOCK },
  );
  assertEquals(errors(read.issues), []);
  const written = serializeToFlat(read.composition, wt);
  assertEquals(written[`${base}/count_value`], 7);
  assertEquals(written[`${base}/quantity_value|magnitude`], undefined);
});

Deno.test("Web Template: the coded/plain text pair stays one node", () => {
  const wt = webTemplate("GECCO_Diagnose.opt");
  const node = find(wt, "vorliegende_diagnose/name_des_problems_der_diagnose");
  assertEquals(node.rmType, "DV_TEXT");
  assertEquals(node.children, undefined);
});

Deno.test("Web Template → OPT → Web Template keeps the choice children", () => {
  const wt = webTemplate("Test_all_types.opt");
  const again = buildWebTemplate(webTemplateToOpt(wt));
  const ids = (w: WebTemplate) =>
    find(w, "test_all_types_1/choice").children!.map((c) => [c.id, c.rmType]);
  assertEquals(ids(again), ids(wt));
});
