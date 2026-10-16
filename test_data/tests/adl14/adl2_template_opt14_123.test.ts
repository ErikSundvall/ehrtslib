/**
 * #123: export ADL2 templates to ADL 1.4 OPT, including the multilingual
 * repeated-archetype workaround (L10n path annotations).
 */
import { assert, assertEquals } from "https://deno.land/std@0.220.0/assert/mod.ts";
import { Adl2TemplateLibrary } from "../../../generation/opt14/adl2_template_library.ts";
import {
  adl2CodeToAdl14,
  collapseCode,
  exportAdl2TemplateToOpt14,
} from "../../../generation/opt14/opt14_exporter.ts";
import { parseOptXml } from "../../../parser/legacy/opt_xml_parser.ts";
import { buildWebTemplate } from "../../../serialization/simplified/web_template_builder.ts";

const DIR = new URL("../../adl2/template_export_123/", import.meta.url);

function load(): { lib: Adl2TemplateLibrary; tid: string } {
  const lib = new Adl2TemplateLibrary();
  let tid = "";
  for (const f of Deno.readDirSync(DIR)) {
    if (!f.name.endsWith(".adls")) continue;
    const ids = lib.addSource(Deno.readTextFileSync(new URL(f.name, DIR)), f.name);
    if (f.name.includes(".t_demo_report")) tid = ids[0];
  }
  return { lib, tid };
}

// deno-lint-ignore no-explicit-any
function analytes(wt: any): any[] {
  // deno-lint-ignore no-explicit-any
  const out: any[] = [];
  // deno-lint-ignore no-explicit-any
  const walk = (n: any) => {
    if ((n.nodeId ?? "").includes("analyte_demo")) out.push(n);
    for (const c of n.children ?? []) walk(c);
  };
  walk(wt.tree);
  return out;
}

Deno.test("#123 code mapping ADL2 -> 1.4", () => {
  assertEquals(adl2CodeToAdl14("id1"), "at0000");
  assertEquals(adl2CodeToAdl14("id2"), "at0001");
  assertEquals(adl2CodeToAdl14("at7"), "at0006");
  assertEquals(adl2CodeToAdl14("id1.1"), "at0000.1");
  assertEquals(adl2CodeToAdl14("id0.1"), "at0.1");
  assertEquals(collapseCode("id3.1", 0), "id3");
});

Deno.test("#123 OPT 1.4 export with workaround: en+sv round-trip", () => {
  const { lib, tid } = load();
  const r = exportAdl2TemplateToOpt14(lib, tid);
  assert(r.annotations.length > 0);
  assertEquals(r.translationsDropped, false);
  assert(r.repeatedTranslationConflicts.length > 0);
  assert(r.xml.includes("component_ontologies"));
  assert(r.xml.includes("L10n.sv"));
  assert(r.xml.includes("at0000.1"), "specialised root code");
  assert(r.xml.includes('code="at0.1"'), "new node in specialisation");

  const { operationalTemplate: opt } = parseOptXml(r.xml);
  const names: Record<string, string[]> = {};
  const paths: Record<string, string[]> = {};
  for (const lang of ["en", "sv"]) {
    // deno-lint-ignore no-explicit-any
    const wt = buildWebTemplate(opt!, { defaultLanguage: lang } as any);
    const a = analytes(wt).filter((n) => !n.nodeId.includes("genomic"));
    names[lang] = a.map((n) => n.name).sort();
    // deno-lint-ignore no-explicit-any
    paths[lang] = a.map((n: any) => n.aqlPath).sort();
  }
  assertEquals(names.en, ["Glucose", "Sodium"]);
  assertEquals(names.sv, ["Glukos", "Natrium"]);
  assertEquals(paths.en, paths.sv);
  assertEquals(new Set(paths.en).size, 2, "repeated roots get distinct paths");
});

Deno.test("#123 value codes never collide with node codes in 1.4", () => {
  const { lib, tid } = load();
  const { xml } = exportAdl2TemplateToOpt14(lib, tid);
  const nodeIds = new Set(
    [...xml.matchAll(/<node_id>(at\d{4})<\/node_id>/g)].map((m) => m[1]),
  );
  const values = [...xml.matchAll(/<code_list>(at\d{4})<\/code_list>/g)]
    .map((m) => m[1]);
  assert(values.length > 0);
  for (const v of values) assert(!nodeIds.has(v), `collision on ${v}`);
});

Deno.test("#123 OPT 1.4 export without workaround warns about lost translations", () => {
  const { lib, tid } = load();
  const r = exportAdl2TemplateToOpt14(lib, tid, {
    multilingualRepeatWorkaround: false,
  });
  assertEquals(r.annotations.length, 0);
  assertEquals(r.translationsDropped, true);
  assert(!r.xml.includes("L10n."));
  const w = r.warnings.join("\n");
  assert(w.includes("analyte_demo.v1"), w);
  assert(w.includes("sv"), w);
});

function xsdPath(): string | undefined {
  try {
    return Deno.env.get("OPENEHR_OPT14_XSD");
  } catch {
    return undefined; // no --allow-env: skip
  }
}

Deno.test({
  name: "#123 OPT 1.4 export validates against XSD (OPENEHR_OPT14_XSD)",
  ignore: !xsdPath(),
  permissions: { read: true, write: true, run: true, env: true },
  async fn() {
    const { lib, tid } = load();
    const f = await Deno.makeTempFile({ suffix: ".opt" });
    await Deno.writeTextFile(f, exportAdl2TemplateToOpt14(lib, tid).xml);
    const out = await new Deno.Command("xmllint", {
      args: ["--noout", "--schema", xsdPath()!, f],
    }).output();
    assert(out.success, new TextDecoder().decode(out.stderr));
  },
});

Deno.test("cADL: RM attribute named like a section keyword (ACTIVITY.description)", async () => {
  const { parseAdl } = await import("../../../parser/mod.ts");
  const adl = `archetype (adl_version=2.0.6; rm_release=1.1.0)
    openEHR-EHR-INSTRUCTION.kw_probe.v1.0.0

language
    original_language = <[ISO_639-1::en]>

definition
    INSTRUCTION[id1] matches {
        activities matches {
            ACTIVITY[id2] matches {
                description matches {
                    ITEM_TREE[id3]
                }
            }
        }
        protocol matches {
            ITEM_TREE[id4]
        }
    }

terminology
    term_definitions = <
        ["en"] = <
            ["id1"] = <text = <"Probe"> description = <"Probe">>
        >
    >
`;
  // deno-lint-ignore no-explicit-any
  const r: any = parseAdl(adl);
  const names = r.archetype.definition.attributes.map(
    // deno-lint-ignore no-explicit-any
    (a: any) => a.rm_attribute_name,
  );
  assertEquals(names, ["activities", "protocol"]);
});
