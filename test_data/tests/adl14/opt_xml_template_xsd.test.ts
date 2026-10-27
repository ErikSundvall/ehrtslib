/**
 * OPT 1.4 XML schema conformance (#190).
 */

import { assert, assertStringIncludes } from "https://deno.land/std@0.220.0/assert/mod.ts";
import { parseTemplateInput } from "../../../parser/mod.ts";
import { OptXmlSerializer } from "../../../generation/opt_xml_serializer.ts";
import { exportAdl2TemplateToOpt14 } from "../../../generation/opt14/opt14_exporter.ts";
import { ArchetypeRepository } from "../../../parser/mod.ts";

const FIXTURES = [
  "opt14/minimal_evaluation.opt",
  "opt14/ehrbase_blood_pressure_simple.de.v0.opt",
  "opt14/Test_all_types.opt",
];

Deno.test("OptXmlSerializer: language before template_id with terminology_id (#190)", async () => {
  const base = new URL("../../", import.meta.url);
  for (const rel of FIXTURES) {
    const xml = await Deno.readTextFile(new URL(rel, base));
    const { operationalTemplate } = parseTemplateInput(xml);
    assert(operationalTemplate);
    const out = new OptXmlSerializer().serialize(operationalTemplate);
    assert(!out.includes("<match_negated>"), rel);
    const langIdx = out.indexOf("<language>");
    const tidIdx = out.indexOf("<template_id>");
    assert(langIdx >= 0 && tidIdx > langIdx, rel);
    assertStringIncludes(out, "<terminology_id>", rel);
    assertStringIncludes(out, "<value>ISO_639-1</value>", rel);
  }
});

Deno.test("Opt14Exporter: no match_negated in OPT XML (#190)", async () => {
  const base = new URL("../../", import.meta.url);
  const xml = await Deno.readTextFile(new URL("opt14/minimal_evaluation.opt", base));
  const { operationalTemplate } = parseTemplateInput(xml);
  assert(operationalTemplate);
  const repo = ArchetypeRepository.fromEntries([]);
  const exported = exportAdl2TemplateToOpt14({
    template: operationalTemplate,
    repository: repo,
  });
  assert(!exported.xml.includes("<match_negated>"));
});
