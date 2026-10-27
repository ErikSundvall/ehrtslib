/**
 * #183 follow-up: flatten merge, nested tuple cells, DV_SCALE, OPT 1.4 list rows.
 */

import { assert, assertEquals } from "@std/assert";
import * as openehr_am from "../../../am/openehr_am.ts";
import { ADL2Serializer } from "../../../generation/adl2_serializer.ts";
import {
  childTupleRowsNarrowParent,
  mergeAttributeTupleSets,
  ordinalListRowsFromP,
  quantityListRowsFromP,
  type PAttributeTuple,
} from "../../../generation/opt14/attribute_tuple_p_model.ts";
import { specialiseObject } from "../../../generation/opt14/adl2_template_library.ts";
import { pFromAom, type PObject } from "../../../generation/opt14/p_model.ts";
import { CadlParser } from "../../../parser/cadl_parser.ts";
import { ADL2Tokenizer } from "../../../parser/adl2_tokenizer.ts";
import { parseCObject } from "../../../parser/legacy/xml_aom_mapper.ts";
import { TemplateValidator } from "../../../validation/template_validator.ts";

function parseComplex(cadl: string): openehr_am.C_COMPLEX_OBJECT {
  return new CadlParser(new ADL2Tokenizer(cadl).tokenize())
    .parseComplexObject() as openehr_am.C_COMPLEX_OBJECT;
}

function qtyTupleP(rows: Array<[string, string, string]>): PAttributeTuple {
  return {
    columns: ["units", "magnitude", "precision"],
    rows: rows.map(([u, m, p]) => ({
      cells: [
        { kind: "prim", prim: { type: "string", pattern: u } },
        { kind: "prim", prim: { type: "interval", expr: m } },
        { kind: "prim", prim: { type: "interval", expr: p } },
      ],
    })),
  };
}

Deno.test("#183: specialiseObject replaces parent attribute_tuples with child", () => {
  const parent: PObject = {
    kind: "complex",
    rmType: "DV_QUANTITY",
    attributeTuples: [qtyTupleP([
      ["mg", "0..10", "1"],
      ["kg", "0..1", "2"],
    ])],
  };
  const child: PObject = {
    kind: "complex",
    rmType: "DV_QUANTITY",
    attributeTuples: [qtyTupleP([["mg", "0..5", "1"]])],
  };
  const flat = specialiseObject(parent, child, () => {});
  assertEquals(flat.attributeTuples?.length, 1);
  assertEquals(quantityListRowsFromP(flat.attributeTuples).length, 1);
  assert(
    childTupleRowsNarrowParent(
      parent.attributeTuples![0],
      child.attributeTuples![0],
    ),
  );
});

Deno.test("#183: mergeAttributeTupleSets inherits parent when child has no tuples", () => {
  const parent = [qtyTupleP([["mg", "0..10", "1"]])];
  const merged = mergeAttributeTupleSets(parent, undefined);
  assertEquals(quantityListRowsFromP(merged)?.[0]?.units, "mg");
});

Deno.test("#183: tuple cell parses nested DV_CODED_TEXT symbol constraint", () => {
  const o = parseComplex(`DV_ORDINAL matches {
    [value, symbol] matches {
      [{0}, {DV_CODED_TEXT matches { defining_code matches {[at0001]} }}]
    }
  }`);
  const ord = o as openehr_am.C_ORDINAL & {
    attribute_tuples?: openehr_am.C_ATTRIBUTE_TUPLE[];
  };
  const tuple = ord.attribute_tuples?.[0];
  assert(tuple);
  const cell = tuple!.tuples![0].members![1];
  assert(cell instanceof openehr_am.C_COMPLEX_OBJECT);
  assertEquals(cell.rm_type_name, "DV_CODED_TEXT");
  const adl = new ADL2Serializer().serialize(
    archetypeWithValue(ord),
  );
  assert(adl.includes("DV_CODED_TEXT matches"));
});

Deno.test("#183: DV_SCALE tuple reifies list with real values", () => {
  const s = parseComplex(`DV_SCALE matches {
    [value, symbol] matches {
      [{0.5}, {[at1]}],
      [{1}, {[at2]}]
    }
  }`) as openehr_am.C_SCALE & { list?: openehr_am.ORDINAL[] };
  assert(s instanceof openehr_am.C_SCALE);
  assertEquals(s.list?.length, 2);
  assertEquals(s.list![0].value, 0.5);
});

Deno.test("#183: TemplateValidator accepts DV_SCALE tuple row", async () => {
  const scale = parseComplex(`DV_SCALE matches {
    [value, symbol] matches { [{1.0}, {[at1]}] }
  }`) as openehr_am.C_SCALE;
  const template = archetypeWithValue(scale);
  const validator = new TemplateValidator({
    validateUnits: false,
    validateTerminology: false,
    validateIntervals: false,
    validateRMSpecification: false,
  });
  await validator.initialize();
  const ok = validator.validate({
    value: {
      value: 1,
      symbol: {
        defining_code: {
          terminology_id: { value: "local" },
          code_string: "at1",
        },
      },
    },
  }, template);
  assertEquals(ok.valid, true);
});

Deno.test("#183: pFromAom quantity tuples map to OPT 1.4 list row shape", () => {
  const q = parseComplex(`DV_QUANTITY matches {
    [units, magnitude, precision] matches {
      [{"mg"}, {|0..10|}, {1}],
      [{"kg"}, {|0..2|}, {2}]
    }
  }`) as openehr_am.C_QUANTITY;
  const p = pFromAom(q);
  const rows = quantityListRowsFromP(p.attributeTuples);
  assertEquals(rows.length, 2);
  assertEquals(rows[0].units, "mg");
  assertEquals(rows[1].units, "kg");
});

Deno.test("#183: OPT 1.4 XML list import preserves quantity and ordinal rows", () => {
  const qtyXml = {
    rm_type_name: "DV_QUANTITY",
    list: [
      { units: "mg", magnitude: { lower: 0, upper: 10, lower_included: true, upper_included: true } },
      { units: "kg", magnitude: { lower: 0, upper: 2, lower_included: true, upper_included: true } },
    ],
  };
  const q = parseCObject({ "@_xsi:type": "C_DV_QUANTITY", ...qtyXml }) as openehr_am.C_QUANTITY;
  assertEquals((q as { list?: unknown[] }).list?.length, 2);

  const ordXml = {
    rm_type_name: "DV_ORDINAL",
    list: [
      { value: 0, symbol: { defining_code: { terminology_id: { value: "local" }, code_string: "at1" } } },
      { value: 1, symbol: { defining_code: { terminology_id: { value: "local" }, code_string: "at2" } } },
    ],
  };
  const ord = parseCObject({ "@_xsi:type": "C_DV_ORDINAL", ...ordXml }) as openehr_am.C_ORDINAL;
  assertEquals((ord as { list?: unknown[] }).list?.length, 2);

  const p = pFromAom(q);
  assertEquals(quantityListRowsFromP(p.attributeTuples).length, 2);
  const po = pFromAom(ord);
  assertEquals(ordinalListRowsFromP(po.attributeTuples).length, 2);
});

function archetypeWithValue(
  constraint: openehr_am.C_OBJECT,
): openehr_am.ARCHETYPE {
  const archetype = new openehr_am.ARCHETYPE();
  archetype.definition = new openehr_am.C_COMPLEX_OBJECT();
  archetype.definition.rm_type_name = "ELEMENT";
  const attr = new openehr_am.C_SINGLE_ATTRIBUTE();
  attr.rm_attribute_name = "value";
  attr.children = [constraint];
  archetype.definition.attributes = [attr];
  return archetype;
}
