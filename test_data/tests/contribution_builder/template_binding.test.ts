/**
 * CB phase 1: template binding (#163, ADR 0007).
 */

import {
  assert,
  assertEquals,
  assertNotEquals,
  assertThrows,
} from "@std/assert";
import { fromFileUrl } from "@std/path";
import {
  assertTemplateBindingUnchanged,
  bindTemplate,
  checkTemplateBinding,
  compareTemplateBindings,
  TEMPLATE_BINDING_SERIALISATION_VERSION,
  type TemplateBinding,
  TemplateBindingMismatchError,
} from "../../../contribution_builder/mod.ts";
import { parseOptXml, TemplateWorkspace } from "../../../parser/mod.ts";
import { readOpt14Header } from "../../../parser/legacy/opt14_upconvert.ts";
import { OPT2Serializer } from "../../../generation/mod.ts";

const OPT14 = new URL("../../opt14/", import.meta.url);
const ADL2 = new URL("../../adl2/template_export_123/", import.meta.url);
const read = (name: string) => Deno.readTextFile(new URL(name, OPT14));
const HEX64 = /^[0-9a-f]{64}$/;

/** Reformat XML without changing content: drop indentation, reorder root attributes. */
function reformatXml(xml: string): string {
  return xml.replace(/>\s+</g, "><").replace(
    /<template xmlns="http:\/\/schemas.openehr.org\/v1"([^>]*)>/,
    (_m, rest) => `<template${rest} xmlns="http://schemas.openehr.org/v1">`,
  );
}

/** Re-indent cADL structure lines only (multi-line ODIN strings are content). */
function reindentAdl(adl: string): string {
  return adl.split("\n").map((line) =>
    /^\s+([A-Z_]+\[|[a-z_]+ (existence|cardinality|matches)\b|}$)/.test(line)
      ? "\t" + line.trimStart()
      : line
  ).join("\n");
}

async function flattenedAdl2Template() {
  const ws = new TemplateWorkspace();
  const dir = fromFileUrl(ADL2);
  for (
    const e of [...Deno.readDirSync(dir)].sort((a, b) =>
      a.name.localeCompare(b.name)
    )
  ) {
    ws.addFile(e.name, await Deno.readTextFile(`${dir}/${e.name}`));
  }
  ws.setGenerationRootPath("openEHR-EHR-COMPOSITION.t_demo_report.v1.0.0.adls");
  return ws.resolveOperational().operationalTemplate;
}

function assertBinding(b: TemplateBinding) {
  assert(b.templateId);
  assert(b.hrid);
  assertEquals(b.hash.algorithm, "sha256");
  assert(HEX64.test(b.hash.value), b.hash.value);
  assertEquals(
    b.hash.serialisationVersion,
    TEMPLATE_BINDING_SERIALISATION_VERSION,
  );
}

Deno.test("bind ADL2 operational template (flattened ADL2 source template)", async () => {
  const { binding } = await bindTemplate(await flattenedAdl2Template());
  assertBinding(binding);
  assertEquals(binding.sourceFormat, "adl2-opt");
  assertEquals(binding.templateId, "openEHR-EHR-COMPOSITION.t_demo_report");
  assertEquals(binding.version, "1.0.0");
  assertEquals(binding.hrid, "openEHR-EHR-COMPOSITION.t_demo_report.v1.0.0");
  const again = await bindTemplate(await flattenedAdl2Template());
  assertEquals(again.binding.hash.value, binding.hash.value);
});

Deno.test("bind OPT 1.4 XML: hash, template id, sem_ver version, ADL2 template with id-codes", async () => {
  const { binding, operationalTemplate } = await bindTemplate(
    await read("conformance_ehrbase.de.v0.opt"),
  );
  assertBinding(binding);
  assertEquals(binding.sourceFormat, "opt14-xml");
  assertEquals(binding.templateId, "conformance-ehrbase.de.v0");
  assertEquals(binding.version, "1.0.0");
  assertEquals(operationalTemplate.definition?.node_id, "id1");
});

Deno.test("bind every OPT 1.4 fixture", async () => {
  for (const e of Deno.readDirSync(OPT14)) {
    if (!e.name.endsWith(".opt")) continue;
    const { binding } = await bindTemplate(await read(e.name));
    assertBinding(binding);
  }
});

Deno.test("reformatted OPT 1.4 XML gives the same hash; a constraint change does not", async () => {
  const xml = await read("minimal_evaluation.opt");
  const a = await bindTemplate(xml);
  const b = await bindTemplate(reformatXml(xml));
  assertEquals(b.binding.hash.value, a.binding.hash.value);
  // First <upper>1</upper> in the definition is the root occurrences.
  const changed = xml.replace("<upper>1</upper>", "<upper>2</upper>");
  assertNotEquals(changed, xml);
  const c = await bindTemplate(changed);
  assertNotEquals(c.binding.hash.value, a.binding.hash.value);
});

Deno.test("re-serialised ADL2 text gives the same hash; a constraint change does not", async () => {
  const up = await bindTemplate(await read("duration_validation.opt"));
  const adl = new OPT2Serializer().serializeOperationalTemplate(
    up.operationalTemplate,
  );
  const a = await bindTemplate(adl);
  assertEquals(a.binding.sourceFormat, "adl2-opt");
  const reformatted = reindentAdl(adl).replace(
    "\ndefinition\n",
    "\n\n\ndefinition\n",
  );
  assertNotEquals(reformatted, adl);
  const b = await bindTemplate(reformatted);
  assertEquals(b.binding.hash.value, a.binding.hash.value);
  const changed = adl.replace(
    /occurrences matches \{0\.\.1\}/,
    "occurrences matches {1..1}",
  );
  assertNotEquals(changed, adl);
  const c = await bindTemplate(changed);
  assertNotEquals(c.binding.hash.value, a.binding.hash.value);
});

Deno.test("parsed OPT 1.4 object is up-converted; same hash as from XML", async () => {
  const xml = await read("language_test.opt");
  const fromXml = await bindTemplate(xml);
  const fromObject = await bindTemplate(parseOptXml(xml).operationalTemplate, {
    opt14Header: readOpt14Header(xml),
  });
  assertEquals(fromObject.binding, fromXml.binding);
});

Deno.test("converting the same OPT 1.4 twice gives the same hash", async () => {
  const xml = await read("ips.v0.opt");
  const a = await bindTemplate(xml);
  const b = await bindTemplate(xml);
  assertEquals(a.binding.hash.value, b.binding.hash.value);
});

Deno.test("source MD5-CAM / build_uid kept when present, missing is fine", async () => {
  const withIds = await bindTemplate(
    await read("conformance_ehrbase.de.v0.opt"),
  );
  assertEquals(
    withIds.binding.sourceIdentifiers.md5Cam,
    "176118c3ecd974695df3c0b62d852ea9",
  );
  assertEquals(
    withIds.binding.sourceIdentifiers.parentMd5Cam,
    "0fb95250330aa23652f66a22d74d7e22",
  );
  assertEquals(
    withIds.binding.sourceIdentifiers.buildUid,
    "e51ec37f-6899-464a-81ce-059fd5df1d06",
  );
  const without = await bindTemplate(await read("minimal_evaluation.opt"));
  assertEquals(without.binding.sourceIdentifiers.md5Cam, undefined);
  assertEquals(without.binding.sourceIdentifiers.buildUid, undefined);
});

Deno.test("rebind: unchanged template reports nothing", async () => {
  const xml = await read("constrain_test.opt");
  const { binding } = await bindTemplate(xml);
  const check = await checkTemplateBinding(binding, reformatXml(xml));
  assertEquals(check.unchanged, true);
  assertEquals(check.issues, []);
  assertTemplateBindingUnchanged(check);
});

Deno.test("rebind: changed content is reported and needs migrate-template", async () => {
  const xml = await read("minimal_evaluation.opt");
  const { binding } = await bindTemplate(xml);
  const check = await checkTemplateBinding(
    binding,
    xml.replace("<upper>1</upper>", "<upper>2</upper>"),
  );
  assertEquals(check.unchanged, false);
  assertEquals(check.migrationRequired, true);
  assertEquals(check.issues.map((i) => i.code), ["hash-changed"]);
  const err = assertThrows(
    () => assertTemplateBindingUnchanged(check),
    TemplateBindingMismatchError,
  );
  assertEquals(err.comparison.issues[0].code, "hash-changed");
});

Deno.test("rebind: version-only bump keeps the hash but reports the version", async () => {
  const xml = await read("conformance_ehrbase.de.v0.opt");
  const { binding } = await bindTemplate(xml);
  const bumped = xml.replace('id="sem_ver">1.0.0<', 'id="sem_ver">1.0.1<');
  assertNotEquals(bumped, xml);
  const check = await checkTemplateBinding(binding, bumped);
  assertEquals(check.template.binding.hash.value, binding.hash.value);
  assertEquals(check.issues.map((i) => i.code), ["version-changed"]);
  assertEquals(check.migrationRequired, true);
});

Deno.test("rebind: MD5-CAM / build_uid mismatch only warns", async () => {
  const xml = await read("conformance_ehrbase.de.v0.opt");
  const { binding } = await bindTemplate(xml);
  const other = xml
    .replace(
      "176118c3ecd974695df3c0b62d852ea9",
      "00000000000000000000000000000000",
    )
    .replace(
      "e51ec37f-6899-464a-81ce-059fd5df1d06",
      "11111111-1111-1111-1111-111111111111",
    );
  const check = await checkTemplateBinding(binding, other);
  assertEquals(check.unchanged, true);
  assertEquals(check.issues.map((i) => [i.code, i.severity]), [
    ["source-md5-cam-changed", "warning"],
    ["source-build-uid-changed", "warning"],
  ]);
  assertEquals(check.template.binding.hash.value, binding.hash.value);
});

Deno.test("rebind: a different serialisation version is not compared silently", async () => {
  const { binding } = await bindTemplate(await read("minimal_evaluation.opt"));
  const old: TemplateBinding = {
    ...binding,
    hash: { ...binding.hash, serialisationVersion: "ehrtslib-cb-opt-json/0" },
  };
  const cmp = compareTemplateBindings(old, binding);
  assertEquals(cmp.issues.map((i) => i.code), [
    "serialisation-version-changed",
  ]);
  assertEquals(cmp.migrationRequired, true);
});

// Optional: public Archetype Designer exports, not vendored (size and CC BY-SA licence).
// Run with: EHRTSLIB_AD_EXPORTS=/path deno test --allow-read --allow-env ...
// The directory holds `<name>.<version>.sv.en.opt` files; versions of the same
// template whose content is identical must hash the same.
const AD_DIR = (() => {
  try {
    return Deno.permissions.querySync({
        name: "env",
        variable: "EHRTSLIB_AD_EXPORTS",
      }).state === "granted"
      ? Deno.env.get("EHRTSLIB_AD_EXPORTS")
      : undefined;
  } catch {
    return undefined;
  }
})();

Deno.test({
  name:
    "optional: Archetype Designer exports bind; version-only releases keep the hash",
  ignore: !AD_DIR,
  fn: async () => {
    const byTemplate = new Map<string, TemplateBinding[]>();
    for (const e of Deno.readDirSync(AD_DIR!)) {
      if (!e.name.endsWith(".opt")) continue;
      const { binding } = await bindTemplate(
        await Deno.readTextFile(`${AD_DIR}/${e.name}`),
      );
      assertBinding(binding);
      assert(binding.sourceIdentifiers.md5Cam, e.name);
      const list = byTemplate.get(binding.templateId) ?? [];
      list.push(binding);
      byTemplate.set(binding.templateId, list);
    }
    for (const list of byTemplate.values()) {
      for (const b of list.slice(1)) {
        const sameContent =
          b.sourceIdentifiers.md5Cam === list[0].sourceIdentifiers.md5Cam;
        assertEquals(b.hash.value === list[0].hash.value, sameContent);
      }
    }
  },
});
