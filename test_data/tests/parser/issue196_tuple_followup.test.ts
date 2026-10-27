/**
 * #196 ADL2 tuple gaps: legacy scale ADL, specialise narrowing, OPT 1.4 round-trip, XSD.
 */

import { assert, assertEquals, assertStringIncludes } from "@std/assert";
import * as openehr_am from "../../../am/openehr_am.ts";
import { ADL2Serializer } from "../../../generation/adl2_serializer.ts";
import { Adl2TemplateLibrary } from "../../../generation/opt14/adl2_template_library.ts";
import {
  childTupleRowsNarrowParent,
  ordinalListRowsFromP,
  quantityListRowsFromP,
} from "../../../generation/opt14/attribute_tuple_p_model.ts";
import { exportAdl2TemplateToOpt14 } from "../../../generation/opt14/opt14_exporter.ts";
import { specialiseObject } from "../../../generation/opt14/adl2_template_library.ts";
import { pFromAom, type PObject } from "../../../generation/opt14/p_model.ts";
import { CadlParser } from "../../../parser/cadl_parser.ts";
import { ADL2Tokenizer } from "../../../parser/adl2_tokenizer.ts";
import { parseCObject } from "../../../parser/legacy/xml_aom_mapper.ts";
import { parseOptXml } from "../../../parser/legacy/opt_xml_parser.ts";
import {
  assertOptValidatesAgainstTemplateXsd,
  assertTemplateXsdTestPrerequisites,
} from "./opt14_template_xsd.ts";

const ARCHIE = new URL("../../archie-tests/", import.meta.url);

function parseComplex(cadl: string): openehr_am.C_COMPLEX_OBJECT {
  return new CadlParser(new ADL2Tokenizer(cadl).tokenize())
    .parseComplexObject() as openehr_am.C_COMPLEX_OBJECT;
}

Deno.test("#196 serializeScale legacy list rows when no attribute_tuples", () => {
  const scale = parseComplex(`DV_SCALE matches {
    [value, symbol] matches { [{0.5}, {[at1]}] }
  }`) as openehr_am.C_SCALE & { list?: openehr_am.ORDINAL[] };
  assert(scale.list?.length);
  delete (scale as { attribute_tuples?: unknown }).attribute_tuples;
  const adl = new ADL2Serializer().serialize(archetypeWithValue(scale));
  assertStringIncludes(adl, "DV_SCALE matches");
  assertStringIncludes(adl, "value matches");
  assertStringIncludes(adl, "symbol matches");
});

Deno.test("#196 specialiseObject warns when child tuple does not narrow parent", () => {
  const parent: PObject = {
    kind: "complex",
    rmType: "DV_QUANTITY",
    attributeTuples: [{
      columns: ["units", "magnitude", "precision"],
      rows: [{
        cells: [
          { kind: "prim", prim: { type: "string", pattern: "mg" } },
          { kind: "prim", prim: { type: "interval", expr: "0..10" } },
          { kind: "prim", prim: { type: "interval", expr: "1" } },
        ],
      }],
    }],
  };
  const child: PObject = {
    kind: "complex",
    rmType: "DV_QUANTITY",
    attributeTuples: [{
      columns: ["units", "magnitude", "precision"],
      rows: [{
        cells: [
          { kind: "prim", prim: { type: "string", pattern: "mg" } },
          { kind: "prim", prim: { type: "interval", expr: "0..100" } },
          { kind: "prim", prim: { type: "interval", expr: "1" } },
        ],
      }],
    }],
  };
  const warnings: string[] = [];
  specialiseObject(parent, child, (m) => warnings.push(m));
  assert(warnings.some((w) => w.includes("do not narrow parent")));
  assert(
    !childTupleRowsNarrowParent(parent.attributeTuples![0], child.attributeTuples![0]),
  );
});

Deno.test("#196 tuple cells: boolean and string list primitives round-trip", () => {
  const qty = parseComplex(`DV_QUANTITY matches {
    [units, magnitude, precision] matches {
      [{"mg"}, {|0..10|}, {1}],
      [{"kg"}, {|true..false|}, {"1|2"}]
    }
  }`) as openehr_am.C_QUANTITY;
  const tuple = (qty as { attribute_tuples?: openehr_am.C_ATTRIBUTE_TUPLE[] })
    .attribute_tuples?.[0];
  assert(tuple);
  assertEquals(tuple!.tuples?.length, 2);
  const adl = new ADL2Serializer().serialize(archetypeWithValue(qty));
  assertStringIncludes(adl, "[units, magnitude, precision] matches");
  assertStringIncludes(adl, "true..false");
});

Deno.test("#196 OPT 1.4 export writes ordinal/scale list from legacy list only", () => {
  const ordXml = {
    rm_type_name: "DV_ORDINAL",
    list: [{
      value: 1,
      symbol: {
        defining_code: {
          terminology_id: { value: "local" },
          code_string: "at1",
        },
      },
    }],
  };
  const ord = parseCObject({ "@_xsi:type": "C_DV_ORDINAL", ...ordXml }) as openehr_am.C_ORDINAL;
  const rows = ordinalListRowsFromP(pFromAom(ord).attributeTuples);
  assertEquals(rows.length, 1);
  assertEquals(rows[0].value, 1);

  const scaleXml = {
    rm_type_name: "DV_SCALE",
    list: [{
      value: 1,
      symbol: {
        defining_code: {
          terminology_id: { value: "local" },
          code_string: "at1",
        },
      },
    }],
  };
  const scale = parseCObject({ "@_xsi:type": "C_DV_SCALE", ...scaleXml }) as openehr_am.C_SCALE;
  const scaleRows = ordinalListRowsFromP(pFromAom(scale).attributeTuples);
  assertEquals(scaleRows[0].value, 1);
});

Deno.test("#196 ADL2 archetype quantity tuple -> OPT 1.4 -> re-import rows", async () => {
  const adl = await Deno.readTextFile(
    new URL(
      "terminology/openEHR-EHR-OBSERVATION.term_bindings_paths_use_refs.v1.0.0.adls",
      ARCHIE,
    ),
  );
  const lib = new Adl2TemplateLibrary();
  const ids = lib.addSource(adl, "tuple_obs.adls");
  const tid = ids[0];
  const { xml } = exportAdl2TemplateToOpt14(lib, tid);
  assertStringIncludes(xml, "<list>");
  const { operationalTemplate } = parseOptXml(xml);
  assert(operationalTemplate);

  function findQty(node: openehr_am.C_OBJECT | undefined): openehr_am.C_QUANTITY | undefined {
    if (!node) return undefined;
    if (node instanceof openehr_am.C_QUANTITY) return node;
    if (node instanceof openehr_am.C_COMPLEX_OBJECT) {
      for (const a of node.attributes ?? []) {
        for (const c of a.children ?? []) {
          const hit = findQty(c);
          if (hit) return hit;
        }
      }
    }
    return undefined;
  }

  const qty = findQty(operationalTemplate.definition);
  if (qty) {
    const rows = quantityListRowsFromP(pFromAom(qty).attributeTuples);
    assert(rows.length > 0, "quantity tuple rows survive OPT round-trip");
  }
});

Deno.test({
  name: "#196 exported ADL2 template OPT validates against vendored Template.xsd",
  permissions: { read: true, write: true, run: true },
  async fn() {
    await assertTemplateXsdTestPrerequisites();
    const lib = new Adl2TemplateLibrary();
    const dir = new URL("../../adl2/template_export_123/", import.meta.url);
    for (const f of Deno.readDirSync(dir)) {
      if (!f.name.endsWith(".adls")) continue;
      lib.addSource(Deno.readTextFileSync(new URL(f.name, dir)), f.name);
    }
    const tid = "openEHR-EHR-COMPOSITION.t_demo_report.v1.0.0";
    const xml = exportAdl2TemplateToOpt14(lib, tid).xml;
    await assertOptValidatesAgainstTemplateXsd(xml);
  },
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
