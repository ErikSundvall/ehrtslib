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
import { ARCHIE_DOWNCONVERT_FIXTURES } from "../fixtures/adl2_issue155.ts";

function env(name: string): string | undefined {
  try {
    return Deno.env.get(name);
  } catch {
    return undefined;
  }
}

function hasSection(adl: string, name: string): boolean {
  return adl.split("\n").some((l) => {
    const t = l.trim();
    return t === name || t.startsWith(name + " ") || t.startsWith(name + "\t");
  });
}

Deno.test("issue #117: ADL2 fixtures down-convert with required ADL 1.4 shape", async () => {
  const serializer = new ADL14Serializer();
  for (const path of ARCHIE_DOWNCONVERT_FIXTURES) {
    const text = await Deno.readTextFile(path);
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
  }
});

Deno.test("issue #117: write down-converted probes for Archie benchmark", async () => {
  const outDir = env("EHRTSLIB_ARCHIE_PROBE_DIR");
  if (!outDir) {
    console.log(
      "Skipping Archie benchmark probe write: set EHRTSLIB_ARCHIE_PROBE_DIR to an output directory.",
    );
    return;
  }
  await Deno.mkdir(outDir, { recursive: true });
  const serializer = new ADL14Serializer();
  for (const path of ARCHIE_DOWNCONVERT_FIXTURES) {
    const text = await Deno.readTextFile(path);
    const name = path.split("/").pop()!.replace(/\.adls$/, ".adl");
    const adl14 = serializer.serialize(parseAdl(text).archetype!);
    await Deno.writeTextFile(`${outDir}/${name}`, adl14);
  }
});
