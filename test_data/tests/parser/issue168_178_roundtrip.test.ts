/**
 * #168: aligned ADL 1.4 → ADL2 code mapping and OPT2 parse round-trip.
 * #178: OPT 1.4 exporter code maps on binding / down-conversion.
 */

import { assert, assertEquals, assertGreater } from "@std/assert";
import * as openehr_am from "../../../am/openehr_am.ts";
import {
  adl14DownconversionFromOpt14Export,
  downConvertToAdl14,
  type TemplateBinding,
} from "../../../contribution_builder/mod.ts";
import { Adl2TemplateLibrary } from "../../../generation/opt14/adl2_template_library.ts";
import { exportAdl2TemplateToOpt14 } from "../../../generation/opt14/opt14_exporter.ts";
import { OPT2Serializer } from "../../../generation/opt2_serializer.ts";
import { convertAdl14ToAdl2 } from "../../../parser/adl14_to_adl2_converter.ts";
import { ADL2Parser } from "../../../parser/adl2_parser.ts";
import { ADL2Tokenizer } from "../../../parser/adl2_tokenizer.ts";
import {
  opt14TerminologyKeyToAdl2,
  opt14ValueCodeToAdl2,
  opt14ValueSetCodeToAdl2,
} from "../../../parser/legacy/opt14_code_mapping.ts";
import { parseTemplateInput } from "../../../parser/mod.ts";

const TEMPLATE_123 = new URL("../../adl2/template_export_123/", import.meta.url);

const DEMO_TEMPLATE_ID = "openEHR-EHR-COMPOSITION.t_demo_report.v1.0.0";

function loadDemoTemplate(): Adl2TemplateLibrary {
  const lib = new Adl2TemplateLibrary();
  for (const f of Deno.readDirSync(TEMPLATE_123)) {
    if (!f.name.endsWith(".adls")) continue;
    lib.addSource(Deno.readTextFileSync(new URL(f.name, TEMPLATE_123)), f.name);
  }
  if (!lib.resolve(DEMO_TEMPLATE_ID)) {
    throw new Error("template_export_123 demo template not loaded");
  }
  return lib;
}

const OPT14 = new URL("../../opt14/", import.meta.url);

function parseOpt2(adl: string) {
  return new ADL2Parser(new ADL2Tokenizer(adl).tokenize()).parse();
}

function countCardinality(node: unknown): number {
  let n = 0;
  const walk = (x: unknown) => {
    if (!x || typeof x !== "object") return;
    if (x instanceof openehr_am.C_MULTIPLE_ATTRIBUTE && x.cardinality) n++;
    const rec = x as {
      attributes?: openehr_am.C_ATTRIBUTE[];
      children?: unknown[];
    };
    for (const a of rec.attributes ?? []) walk(a);
    for (const c of rec.children ?? []) walk(c);
  };
  walk(node);
  return n;
}

function quantityUnitLists(node: unknown): string[][] {
  const lists: string[][] = [];
  const walk = (x: unknown) => {
    if (!x || typeof x !== "object") return;
    if (x instanceof openehr_am.C_QUANTITY) {
      const list = (x as { list?: Array<{ units?: string }> }).list ?? [];
      if (list.length > 1) {
        lists.push(list.map((i) => i.units ?? "").filter(Boolean));
      }
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

Deno.test("#168: terminology key mapping matches OPT 1.4 up-converter rule", () => {
  const nodeIds = new Set(["at0004"]);
  const valueCodes = new Set(["at0009"]);
  assertEquals(opt14TerminologyKeyToAdl2("at0004", nodeIds, valueCodes), "id5");
  assertEquals(opt14TerminologyKeyToAdl2("at0009", nodeIds, valueCodes), "at10");
  assertEquals(opt14ValueSetCodeToAdl2("ac0001"), "ac2");
  assertEquals(opt14ValueCodeToAdl2("at0009"), "at10");

  const adl14 = `archetype (adl_version=1.4; rm_release=1.0.4)
openEHR-EHR-OBSERVATION.term_probe.v1

definition
    OBSERVATION[at0001] matches {
        data matches {
            EVENT[at0002] matches {
                data matches {
                    ITEM_TREE[at0003] matches {
                        items matches {
                            ELEMENT[at0004] matches {
                                value matches {
                                    DV_CODED_TEXT matches {
                                        defining_code matches {[at0009]}
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

ontology
    term_definitions = <
        ["en"] = <
            ["at0001"] = < text = <"*"> >
            ["at0009"] = < text = <"value term"> >
            ["ac0001"] = < text = <"set"> >
        >
    >
`;
  const { adl2Text } = convertAdl14ToAdl2(adl14);
  assert(adl2Text.includes('["at10"]'), "value code stays bumped at-code");
  assert(adl2Text.includes('["ac2"]'), "value-set code is ac2 not ac0001");
  assert(adl2Text.includes('["id2"]'), "node id term becomes id-code");
});

Deno.test("#168: OPT 1.4 fixtures round-trip through OPT2 without losing constraints", async () => {
  const serializer = new OPT2Serializer();
  for (const name of [
    "GECCO_Diagnose.opt",
    "section_cardinality.opt",
    "Test_all_types.opt",
    "ehrbase_blood_pressure_simple.de.v0.opt",
  ]) {
    const xml = await Deno.readTextFile(new URL(name, OPT14));
    const opt = parseTemplateInput(xml).operationalTemplate!;
    const cardBefore = countCardinality(opt.definition);
    const unitsBefore = quantityUnitLists(opt.definition);
    const opt2 = serializer.serializeOperationalTemplate(opt);
    const reparsed = parseOpt2(opt2).operationalTemplate!;
    assert(reparsed?.definition, name);
    assertEquals(
      countCardinality(reparsed.definition),
      cardBefore,
      `${name}: cardinality`,
    );
    assertEquals(
      quantityUnitLists(reparsed.definition),
      unitsBefore,
      `${name}: quantity unit lists`,
    );
  }
});

Deno.test("#178: Opt14ExportResult exposes per-archetype code maps and binding uses them on commit down-convert", async () => {
  const lib = loadDemoTemplate();
  const exported = exportAdl2TemplateToOpt14(lib, DEMO_TEMPLATE_ID);
  assertGreater(Object.keys(exported.componentCodeMaps).length, 0);
  for (const map of Object.values(exported.componentCodeMaps)) {
    assertGreater(Object.keys(map).length, 0);
  }

  const binding: TemplateBinding = {
    templateId: DEMO_TEMPLATE_ID,
    version: "1.0.0",
    hrid: DEMO_TEMPLATE_ID,
    hash: {
      algorithm: "sha256",
      value: "00",
      serialisationVersion: "test",
    },
    sourceFormat: "adl2-opt",
    sourceIdentifiers: {},
    opt14Export: {
      templateId: exported.templateId,
      componentCodeMaps: exported.componentCodeMaps,
    },
  };
  assertEquals(binding.opt14Export?.templateId, exported.templateId);

  const [archId, codeMap] = Object.entries(exported.componentCodeMaps)[0];
  const [adl2Code, atCode] = Object.entries(codeMap).find(([c]) =>
    /^id\d/.test(c)
  ) ?? [];
  assert(adl2Code && atCode, "need a mapped node id in export");

  const data = {
    _type: "COMPOSITION",
    archetype_node_id: archId,
    archetype_details: {
      _type: "ARCHETYPED",
      archetype_id: { _type: "ARCHETYPE_ID", value: archId },
      template_id: { _type: "TEMPLATE_ID", value: "wrong" },
      rm_version: "1.0.4",
    },
    content: [{ _type: "OBSERVATION", archetype_node_id: adl2Code }],
  };
  const plainBinding: TemplateBinding = {
    ...binding,
    opt14Export: undefined,
  };
  const plain = downConvertToAdl14(data as never, plainBinding);
  assertGreater(plain.warnings.length, 0);

  const mapped = downConvertToAdl14(data as never, binding);
  assertEquals(mapped.warnings.length, 0);
  assertEquals(
    (mapped.data as { content: Array<{ archetype_node_id: string }> }).content[0]
      .archetype_node_id,
    atCode,
  );
  assertEquals(
    (mapped.data as { archetype_details: { template_id: { value: string } } })
      .archetype_details.template_id.value,
    exported.templateId,
  );
  assertEquals(
    adl14DownconversionFromOpt14Export({
      templateId: exported.templateId,
      componentCodeMaps: exported.componentCodeMaps,
    }).codeMap!(archId, adl2Code),
    atCode,
  );
});
