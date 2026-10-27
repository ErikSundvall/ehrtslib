/**
 * #183: cADL C_DV_QUANTITY tuple constraints ([units, magnitude, …] matches { … }).
 */

import { assert, assertEquals, assertStringIncludes } from "@std/assert";
import * as openehr_am from "../../../am/openehr_am.ts";
import { ADL2Serializer } from "../../../generation/adl2_serializer.ts";
import { OPT2Serializer } from "../../../generation/opt2_serializer.ts";
import { CadlParser } from "../../../parser/cadl_parser.ts";
import { ADL2Parser } from "../../../parser/adl2_parser.ts";
import { ADL2Tokenizer } from "../../../parser/adl2_tokenizer.ts";
import { parseTemplateInput } from "../../../parser/mod.ts";
import type { QuantityItemInterval } from "../../../parser/legacy/xml_aom_mapper.ts";

const OPT14 = new URL("../../opt14/", import.meta.url);

type QuantityListView = Array<{
  units?: string;
  magnitude?: QuantityItemInterval;
  precision?: QuantityItemInterval;
}>;

function parseQuantityCadl(cadl: string): openehr_am.C_QUANTITY {
  return new CadlParser(new ADL2Tokenizer(cadl).tokenize())
    .parseComplexObject() as openehr_am.C_QUANTITY;
}

function quantityLists(node: unknown): QuantityListView[] {
  const lists: QuantityListView[] = [];
  const walk = (x: unknown) => {
    if (!x || typeof x !== "object") return;
    if (x instanceof openehr_am.C_QUANTITY) {
      const list = (x as { list?: QuantityListView }).list ?? [];
      if (list.length) lists.push(list);
    }
    const rec = x as {
      attributes?: openehr_am.C_ATTRIBUTE[];
      children?: unknown[];
    };
    for (const a of rec.attributes ?? []) walk(a);
    for (const c of rec.children ?? []) walk(c);
  };
  walk(node);
  return lists;
}

function intervalKey(i?: QuantityItemInterval): string {
  if (!i) return "";
  const norm: Record<string, number | boolean> = {};
  if (i.lower !== undefined) norm.lower = i.lower;
  if (i.upper !== undefined) norm.upper = i.upper;
  if (i.lower_included !== undefined) norm.lower_included = i.lower_included;
  if (i.upper_included !== undefined) norm.upper_included = i.upper_included;
  if (i.lower_unbounded) norm.lower_unbounded = true;
  if (i.upper_unbounded) norm.upper_unbounded = true;
  return JSON.stringify(norm);
}

function quantityListSignature(lists: QuantityListView[]): string {
  return JSON.stringify(
    lists.map((list) =>
      list.map((item) => ({
        units: item.units,
        magnitude: intervalKey(item.magnitude),
        precision: intervalKey(item.precision),
      }))
    ),
  );
}

Deno.test("#183: cADL parser reifies [units, magnitude, precision] tuple rows", () => {
  const q = parseQuantityCadl(`DV_QUANTITY matches {
    [units, magnitude, precision] matches {
      [{"mg"}, {|0.0..1000.0|}, {1}],
      [{"kg"}, {|0.0..10.0|}, {2}]
    }
  }`);
  assertEquals(q.list?.length, 2);
  assertEquals(q.list![0].units, "mg");
  assertEquals(q.list![0].magnitude?.lower, 0);
  assertEquals(q.list![0].magnitude?.upper, 1000);
  assertEquals(q.list![1].units, "kg");
  assertEquals(q.list![0].precision?.lower, 1);
  assertEquals(q.list![0].precision?.upper, 1);
  assertEquals(q.list![1].precision?.lower, 2);
});

Deno.test("#183: OPT 1.4 → OPT2 → parse keeps per-unit magnitude and precision", async () => {
  const xml = await Deno.readTextFile(
    new URL("ehrbase_multi_occurrence.de.opt", OPT14),
  );
  const before = parseTemplateInput(xml).operationalTemplate!;
  const sigBefore = quantityListSignature(quantityLists(before.definition));
  assert(sigBefore.includes("Cel"), "fixture should include Cel/kg tuple quantity");

  const opt2 = new OPT2Serializer().serializeOperationalTemplate(before);
  assertStringIncludes(
    opt2,
    "[units, magnitude, precision] matches",
    "per-unit ranges should serialize as a tuple",
  );

  const after = new ADL2Parser(new ADL2Tokenizer(opt2).tokenize()).parse()
    .operationalTemplate!;
  const sigAfter = quantityListSignature(quantityLists(after!.definition));
  assertEquals(sigAfter, sigBefore);
});

Deno.test("#183: shared magnitude across units still uses units list form", () => {
  const q = parseQuantityCadl(`DV_QUANTITY matches {
    units matches {"mg", "kg"}
    magnitude matches {|0..100|}
  }`);
  assertEquals(q.list?.map((i) => i.units).sort(), ["kg", "mg"]);
  assertEquals(q.list![0].magnitude?.upper, 100);
  assertEquals(q.list![1].magnitude?.upper, 100);

  const archetype = new openehr_am.ARCHETYPE();
  archetype.definition = new openehr_am.C_COMPLEX_OBJECT();
  archetype.definition.rm_type_name = "ELEMENT";
  const valueAttr = new openehr_am.C_SINGLE_ATTRIBUTE();
  valueAttr.rm_attribute_name = "value";
  valueAttr.children = [q];
  archetype.definition.attributes = [valueAttr];
  const adl = new ADL2Serializer().serialize(archetype);
  assert(
    adl.includes('units matches {"mg", "kg"}') &&
      !adl.includes("[units, magnitude] matches"),
    "shared-range quantities should not emit tuple syntax",
  );
});
