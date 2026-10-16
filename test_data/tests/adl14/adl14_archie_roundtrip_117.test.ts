/**
 * Regression for https://github.com/ErikSundvall/ehrtslib/issues/117
 *
 * ADL2 → Ehrtslib ADL14Serializer → structural checks Archie parse14 / Better need.
 */

import {
  assert,
} from "https://deno.land/std@0.220.0/assert/mod.ts";
import { parseAdl } from "../../../parser/mod.ts";
import { ADL14Serializer } from "../../../generation/adl14_serializer.ts";

const FIXTURES = [
  "/workspace/openehr-genomik-templates/archetypes/ckm-adl2/openEHR-EHR-CLUSTER.organisation.v1.0.4.adls",
  "/workspace/openehr-genomik-templates/archetypes/drafts/openEHR-EHR-CLUSTER.variant_clinical_implication.v1.0.0.adls",
  "/workspace/openehr-genomik-templates/archetypes/drafts/openEHR-EHR-CLUSTER.genomic_copy_number_variant-cancer.v1.0.0.adls",
];

function hasSection(adl: string, name: string): boolean {
  return adl.split("\n").some((l) => {
    const t = l.trim();
    return t === name || t.startsWith(name + " ") || t.startsWith(name + "\t");
  });
}

Deno.test("issue #117: ADL2 fixtures down-convert with required ADL 1.4 shape", async () => {
  const serializer = new ADL14Serializer();
  let ran = 0;
  for (const path of FIXTURES) {
    let text: string;
    try {
      text = await Deno.readTextFile(path);
    } catch {
      continue;
    }
    const parsed = parseAdl(text);
    assert(parsed.archetype, `parse failed: ${path}`);
    const adl14 = serializer.serialize(parsed.archetype!);
    assert(hasSection(adl14, "concept"), `${path}: missing concept\n${adl14.slice(0, 200)}`);
    assert(hasSection(adl14, "language"), `${path}: missing language`);
    assert(
      hasSection(adl14, "ontology") || hasSection(adl14, "terminology"),
      `${path}: missing ontology`,
    );
    assert(adl14.includes("[at"), `${path}: missing at-codes`);
    assert(
      adl14.includes("[ISO_639-1::en]"),
      `${path}: missing language code phrase`,
    );
    if (parsed.archetype!.parent_archetype_id?.value) {
      assert(hasSection(adl14, "specialize"), `${path}: missing specialize`);
    }
    assert(!/undefined\[undefined\]/.test(adl14), `${path}: empty definition`);
    ran++;
  }
  assert(ran >= 1, "no fixtures available — expected genomik workspace");
});

Deno.test("issue #117: write down-converted probes for Archie benchmark", async () => {
  const outDir = "/workspace/openehr-genomik-templates/build/ehrtslib-adl14";
  await Deno.mkdir(outDir, { recursive: true });
  const serializer = new ADL14Serializer();
  for (const path of FIXTURES) {
    let text: string;
    try {
      text = await Deno.readTextFile(path);
    } catch {
      continue;
    }
    const name = path.split("/").pop()!.replace(/\.adls$/, ".adl");
    const adl14 = serializer.serialize(parseAdl(text).archetype!);
    await Deno.writeTextFile(`${outDir}/${name}`, adl14);
  }
});
