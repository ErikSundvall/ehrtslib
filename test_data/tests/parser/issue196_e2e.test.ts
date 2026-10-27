/**
 * #196 end-to-end: ADL2 templates → OPT 1.4 → re-import; XSD; specialise warnings.
 */

import { assert, assertEquals, assertStringIncludes } from "@std/assert";
import * as openehr_am from "../../../am/openehr_am.ts";
import { Adl2TemplateLibrary } from "../../../generation/opt14/adl2_template_library.ts";
import {
  ordinalListRowsFromP,
  quantityListRowsFromP,
} from "../../../generation/opt14/attribute_tuple_p_model.ts";
import { exportAdl2TemplateToOpt14 } from "../../../generation/opt14/opt14_exporter.ts";
import { pFromAom } from "../../../generation/opt14/p_model.ts";
import { CadlParser } from "../../../parser/cadl_parser.ts";
import { ADL2Tokenizer } from "../../../parser/adl2_tokenizer.ts";
import { parseCObject } from "../../../parser/legacy/xml_aom_mapper.ts";
import { parseOptXml } from "../../../parser/legacy/opt_xml_parser.ts";

const ROUNDTRIP_DIR = new URL("../../adl2/tuple_roundtrip/", import.meta.url);

function loadTupleRoundtripLibrary(): Adl2TemplateLibrary {
  const lib = new Adl2TemplateLibrary();
  for (const f of Deno.readDirSync(ROUNDTRIP_DIR)) {
    if (!f.name.endsWith(".adls")) continue;
    lib.addSource(
      Deno.readTextFileSync(new URL(f.name, ROUNDTRIP_DIR)),
      f.name,
    );
  }
  return lib;
}

function findByRmType(
  node: openehr_am.C_OBJECT | undefined,
  rmType: string,
): openehr_am.C_OBJECT[] {
  const out: openehr_am.C_OBJECT[] = [];
  if (!node) return out;
  if (node.rm_type_name === rmType) out.push(node);
  if (node instanceof openehr_am.C_COMPLEX_OBJECT) {
    for (const a of node.attributes ?? []) {
      for (const c of a.children ?? []) {
        out.push(...findByRmType(c, rmType));
      }
    }
  }
  return out;
}

function parseComplex(cadl: string): openehr_am.C_COMPLEX_OBJECT {
  return new CadlParser(new ADL2Tokenizer(cadl).tokenize())
    .parseComplexObject() as openehr_am.C_COMPLEX_OBJECT;
}

Deno.test("#196 E2E: quantity, ordinal, and scale tuples survive ADL2 → OPT 1.4 → parseOptXml", () => {
  const lib = loadTupleRoundtripLibrary();
  const tid = "openEHR-EHR-COMPOSITION.t_tuple_kinds.v1.0.0";
  const { xml, warnings } = exportAdl2TemplateToOpt14(lib, tid);
  assertStringIncludes(xml, "<list>");
  const w = warnings.join("\n");
  assert(
    w.includes("no OPT 1.4 representation") && w.includes("value, qualifier"),
    `expected custom-tuple warning, got: ${w}`,
  );

  const { operationalTemplate } = parseOptXml(xml);
  assert(operationalTemplate?.definition);

  const qtyNodes = findByRmType(operationalTemplate.definition, "DV_QUANTITY");
  assert(qtyNodes.length >= 1);
  const qtyRows = quantityListRowsFromP(pFromAom(qtyNodes[0]).attributeTuples);
  assertEquals(qtyRows.length, 2);
  assertEquals(qtyRows[0].units, "mg");
  assertEquals(qtyRows[1].units, "kg");

  const ordNodes = findByRmType(operationalTemplate.definition, "DV_ORDINAL");
  const stdOrd = ordNodes.find((n) =>
    ordinalListRowsFromP(pFromAom(n).attributeTuples).length === 2
  );
  assert(stdOrd, "standard ordinal tuple");
  const ordRows = ordinalListRowsFromP(pFromAom(stdOrd).attributeTuples);
  assertEquals(ordRows[0].value, 1);
  assertEquals(ordRows[1].value, 2);

  const scaleNodes = findByRmType(operationalTemplate.definition, "DV_SCALE");
  assert(scaleNodes.length >= 1);
  const scaleRows = ordinalListRowsFromP(pFromAom(scaleNodes[0]).attributeTuples);
  assertEquals(scaleRows.length, 2);
  assertEquals(scaleRows[0].value, 1);
});

Deno.test("#196 specialise flatten warns when child tuple rows do not narrow parent", () => {
  const lib = loadTupleRoundtripLibrary();
  lib.flatten(lib.resolve("openEHR-EHR-OBSERVATION.tuple_narrow_child.v1.0.0")!);
  const msgs = lib.warnings.join("\n");
  assertStringIncludes(msgs, "do not narrow parent");
});

Deno.test("#196 rare primitive tuple cells parse and round-trip through ADL2 serializer", async () => {
  const q = parseComplex(`DV_QUANTITY matches {
    [units, magnitude, precision] matches {
      [{"mg"}, {|2020-01-01..2020-12-31|}, {PT1H}],
      [{"kg"}, {|true..false|}, {"1|2"}],
      [{"g"}, {|T12:00:00|}, {3}]
    }
  }`) as openehr_am.C_QUANTITY;
  const tuple = (q as { attribute_tuples?: openehr_am.C_ATTRIBUTE_TUPLE[] })
    .attribute_tuples?.[0];
  assert(tuple);
  assertEquals(tuple!.tuples?.length, 3);
  const { ADL2Serializer } = await import("../../../generation/adl2_serializer.ts");
  const adl = new ADL2Serializer().serialize(archetypeWithValue(q));
  assertStringIncludes(adl, "2020-01-01..2020-12-31");
  assertStringIncludes(adl, "true..false");
  assertStringIncludes(adl, "T12:00:00");
});

Deno.test("#196 legacy list-only ordinal AOM maps to OPT list XML on export", () => {
  const ord = parseCObject({
    "@_xsi:type": "C_DV_ORDINAL",
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
  }) as openehr_am.C_ORDINAL;
  const rows = ordinalListRowsFromP(pFromAom(ord).attributeTuples);
  assertEquals(rows.length, 1);
  assertEquals(rows[0].value, 1);
  const lib = loadTupleRoundtripLibrary();
  const { xml } = exportAdl2TemplateToOpt14(
    lib,
    "openEHR-EHR-COMPOSITION.t_tuple_kinds.v1.0.0",
  );
  assertStringIncludes(xml, 'xsi:type="C_DV_SCALE"');
  assertStringIncludes(xml, "<value>1</value>");
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
