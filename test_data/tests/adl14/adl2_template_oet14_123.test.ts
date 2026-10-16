/**
 * #123: export ADL2 templates (use_archetype overlays) to OET 1.4 XML.
 * Bilingual fixture with overlays, a specialised archetype and a repeated
 * archetype; structural checks, multilingual workaround on/off, and a
 * consistency check against the direct OPT 1.4 export.
 *
 * Optional XSD validation: set OPENEHR_OET14_XSD to CompositionTemplate.xsd
 * (needs python3 + lxml).
 */
import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.220.0/assert/mod.ts";
import { Adl2TemplateLibrary } from "../../../generation/opt14/adl2_template_library.ts";
import { exportAdl2TemplateToOet14 } from "../../../generation/opt14/oet14_exporter.ts";
import { exportAdl2TemplateToOpt14 } from "../../../generation/opt14/opt14_exporter.ts";
import { parseOetXml } from "../../../parser/legacy/oet_xml_parser.ts";
import { parseOptXml } from "../../../parser/legacy/opt_xml_parser.ts";
import { buildWebTemplate } from "../../../serialization/simplified/web_template_builder.ts";

const DIR = new URL("../../adl2/template_export_123/", import.meta.url);

function load(): { lib: Adl2TemplateLibrary; tid: string } {
  const lib = new Adl2TemplateLibrary();
  let tid = "";
  for (const f of Deno.readDirSync(DIR)) {
    if (!f.name.endsWith(".adls")) continue;
    const ids = lib.addSource(
      Deno.readTextFileSync(new URL(f.name, DIR)),
      f.name,
    );
    if (f.name.includes(".t_demo_report")) tid = ids[0];
  }
  return { lib, tid };
}

function env(name: string): string | undefined {
  try {
    return Deno.env.get(name);
  } catch {
    return undefined;
  }
}

Deno.test("#123 OET: structure, Items and Rules", () => {
  const { lib, tid } = load();
  const r = exportAdl2TemplateToOet14(lib, tid, { id: "demo-oet" });
  const doc = parseOetXml(r.xml).document;
  assertEquals(doc.id, "demo-oet");
  assertEquals(
    doc.definitionArchetypeId,
    "openEHR-EHR-COMPOSITION.report_demo.v1",
  );
  assertEquals(doc.items.length, 1);
  const lab = doc.items[0];
  assertEquals(lab.archetypeId, "openEHR-EHR-OBSERVATION.lab_demo.v1");
  assertEquals(lab.path, "/content");
  // ELEMENT[id5] occurrences {0} in the lab overlay
  assert(
    lab.rules.some((x) =>
      x.path === "/data[at0001]/events[at0002]/data[at0003]/items[at0004]" &&
      x.max === 0
    ),
  );
  const kids = lab.items.map((i) => i.archetypeId);
  assertEquals(kids, [
    "openEHR-EHR-CLUSTER.analyte_demo.v1",
    "openEHR-EHR-CLUSTER.analyte_demo.v1",
    "openEHR-EHR-CLUSTER.analyte_demo-genomic.v1",
  ]);
  for (const i of lab.items) {
    assertEquals(
      i.path,
      "/data[at0001]/events[at0002]/data[at0003]/items[at0005]",
    );
  }
  assert(r.xml.includes('name="Glucose"') && r.xml.includes('name="Sodium"'));
  assert(r.xml.includes('name="Sodium level" path="/items[at0002]"'));
  assert(r.xml.includes("<includedValues>Glucose</includedValues>"));
  const glucose = lab.items[0];
  assert(glucose.rules.some((x) => x.path === "/items[at0004]" && x.max === 0));
  assertEquals(r.translationsDropped, false);
});

Deno.test("#123 OET: sv translations as L10n annotations (workaround on)", () => {
  const { lib, tid } = load();
  const r = exportAdl2TemplateToOet14(lib, tid);
  const sv = r.annotations.map((a) => a.items["L10n.sv"]);
  for (const t of ["Glukos", "Natrium", "Natriumnivå", "Demo-labbresultat"]) {
    assert(sv.includes(t), t);
  }
  assert(r.xml.includes("<key>L10n.sv</key><value>Natrium</value>"));
  assert(!r.warnings.some((w) => w.includes("will be dropped")));
});

Deno.test("#123 OET: workaround off warns and writes no annotations", () => {
  const { lib, tid } = load();
  const r = exportAdl2TemplateToOet14(lib, tid, {
    multilingualRepeatWorkaround: false,
  });
  assertEquals(r.annotations.length, 0);
  assert(r.translationsDropped);
  assert(
    r.warnings.some((w) => w.includes("will be dropped") && w.includes("sv")),
  );
  assert(!r.xml.includes("L10n."));
});

Deno.test("#123 OET: consistent with the direct OPT export", () => {
  const { lib, tid } = load();
  const oet = exportAdl2TemplateToOet14(lib, tid);
  const opt = exportAdl2TemplateToOpt14(lib, tid);
  const wt = buildWebTemplate(parseOptXml(opt.xml).operationalTemplate!);
  const roots: Array<{ id: string; name: string }> = [];
  const ids = new Set<string>();
  // deno-lint-ignore no-explicit-any
  const walk = (n: any) => {
    ids.add(n.nodeId ?? "");
    if (/^openEHR-EHR-/.test(n.nodeId ?? "")) {
      roots.push({ id: n.nodeId, name: n.name });
    }
    for (const c of n.children ?? []) walk(c);
  };
  walk(wt.tree);
  for (
    const m of oet.xml.matchAll(
      /<(?:Content|Items) archetype_id="([^"]+)" concept_name="[^"]*"(?: name="([^"]*)")?/g,
    )
  ) {
    assert(
      roots.some((x) => x.id === m[1] && (!m[2] || x.name === m[2])),
      `${m[1]} ${m[2]}`,
    );
  }
  assertEquals(new Set(oet.archetypeIds), new Set(opt.componentArchetypeIds));
});

Deno.test({
  name: "#123 OET: validates against CompositionTemplate.xsd",
  ignore: !env("OPENEHR_OET14_XSD"),
  async fn() {
    const { lib, tid } = load();
    const f = await Deno.makeTempFile({ suffix: ".oet" });
    await Deno.writeTextFile(f, exportAdl2TemplateToOet14(lib, tid).xml);
    const py =
      "import sys\nfrom lxml import etree\ns=etree.XMLSchema(etree.parse(sys.argv[1]))\n" +
      "ok=s.validate(etree.parse(sys.argv[2]))\nprint(s.error_log)\nsys.exit(0 if ok else 1)";
    const out = await new Deno.Command("python3", {
      args: ["-c", py, env("OPENEHR_OET14_XSD")!, f],
    }).output();
    assert(out.success, new TextDecoder().decode(out.stdout));
  },
});
