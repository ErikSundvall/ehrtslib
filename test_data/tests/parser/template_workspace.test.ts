/**
 * Phase 6a.2 — template file set workspace and ADL2 differential flattening.
 */

import { assert, assertEquals } from "https://deno.land/std@0.220.0/assert/mod.ts";
import { fromFileUrl } from "https://deno.land/std@0.220.0/path/mod.ts";
import { RMInstanceGenerator } from "../../../enhanced/generation/rm_instance_generator.ts";
import {
  ArchetypeRepository,
  TemplateWorkspace,
  getOperationalTemplateFromInput,
  parseTemplateInput,
} from "../../../enhanced/parser/mod.ts";
import type { TemplateWorkspaceFile } from "../../../enhanced/parser/template_workspace.ts";

const ADL2_DIR = fromFileUrl(new URL("../../adl2/", import.meta.url));
const VALIDITY_TEMPLATES_DIR = fromFileUrl(
  new URL("../../archie-tests/validity-templates/", import.meta.url),
);

Deno.test("ArchetypeRepository.fromEntries loads archetypes and templates", async () => {
  const archText = await Deno.readTextFile(`${ADL2_DIR}/simple_observation.adl`);
  const repo = ArchetypeRepository.fromEntries([
    { path: "simple_observation.adl", content: archText },
  ]);
  assert(repo.has("openEHR-EHR-OBSERVATION.simple_test.v1.0.0"));
});

Deno.test("parseTemplateInput flattens ADL2 template when repository provided", async () => {
  const repo = await ArchetypeRepository.fromDirectory(VALIDITY_TEMPLATES_DIR);
  const templateText = await Deno.readTextFile(
    `${VALIDITY_TEMPLATES_DIR}/openEHR-EHR-COMPOSITION.t_invalid_overlay_parent.v1.0.0.adls`,
  );
  const parsed = parseTemplateInput(templateText, { archetypeRepository: repo });
  assertEquals(parsed.kind, "operational_template");
  assert(parsed.operationalTemplate);
  assert(parsed.template);
});

Deno.test("TemplateWorkspace resolves OPT from active file", async () => {
  const optPath = new URL(
    "../../opt14/minimal_evaluation.opt",
    import.meta.url,
  );
  const xml = await Deno.readTextFile(optPath);
  const ws = new TemplateWorkspace();
  ws.addFile("minimal_evaluation.opt", xml);
  ws.setActivePath("minimal_evaluation.opt");

  const { operationalTemplate, sourceKind } = ws.resolveOperational();
  assertEquals(sourceKind, "opt_xml");
  assertEquals(operationalTemplate.archetype_id?.value, "minimal_evaluation.en.v1");

  const instance = new RMInstanceGenerator({ mode: "minimal" }).generate(
    operationalTemplate,
  );
  assertEquals(instance._type, "COMPOSITION");
});

Deno.test("TemplateWorkspace file set: archetype + ADL2 template", async () => {
  const ws = new TemplateWorkspace();
  const entries: Array<{ path: string; content: string }> = [];
  for await (const entry of Deno.readDir(VALIDITY_TEMPLATES_DIR)) {
    if (!entry.isFile || !/\.adls?$/i.test(entry.name)) continue;
    entries.push({
      path: entry.name,
      content: await Deno.readTextFile(`${VALIDITY_TEMPLATES_DIR}/${entry.name}`),
    });
  }
  ws.addFiles(entries);
  ws.setActivePath("openEHR-EHR-COMPOSITION.t_invalid_overlay_parent.v1.0.0.adls");

  const { operationalTemplate, sourceKind } = ws.resolveOperational();
  assert(
    sourceKind === "adl2_template" || sourceKind === "operational_template",
  );
  assert(operationalTemplate);
});

Deno.test("TemplateWorkspace generation root vs active editor file", async () => {
  const ws = new TemplateWorkspace();
  const entries: Array<{ path: string; content: string }> = [];
  for await (const entry of Deno.readDir(VALIDITY_TEMPLATES_DIR)) {
    if (!entry.isFile || !/\.adls?$/i.test(entry.name)) continue;
    entries.push({
      path: entry.name,
      content: await Deno.readTextFile(`${VALIDITY_TEMPLATES_DIR}/${entry.name}`),
    });
  }
  ws.addFiles(entries);
  const rootPath = "openEHR-EHR-COMPOSITION.t_invalid_overlay_parent.v1.0.0.adls";
  ws.setGenerationRootPath(rootPath);
  ws.setActivePath("openEHR-EHR-COMPOSITION.base.adls");

  const { sourcePath } = ws.resolveOperational();
  assertEquals(sourcePath, rootPath);
});

Deno.test("getOperationalTemplateFromInput with repository", async () => {
  const repo = await ArchetypeRepository.fromDirectory(VALIDITY_TEMPLATES_DIR);
  const templateText = await Deno.readTextFile(
    `${VALIDITY_TEMPLATES_DIR}/openEHR-EHR-COMPOSITION.t_invalid_overlay_parent.v1.0.0.adls`,
  );
  const opt = getOperationalTemplateFromInput(templateText, {
    archetypeRepository: repo,
  });
  assert(opt);
});

Deno.test("ArchetypeRepository.loadFile classifies OET XML as oet_xml not skipped", async () => {
  const oetPath = fromFileUrl(
    new URL("../../oet14/Demo with hide-on-form.oet", import.meta.url),
  );
  const text = await Deno.readTextFile(oetPath);
  const repo = new ArchetypeRepository();
  const result = repo.loadFile("demo.oet", text);
  assertEquals(result.kind, "oet_xml");
});

Deno.test("TemplateWorkspace Vital signs zip: Vital signs.oet is oet_xml", async () => {
  const zipPath = fromFileUrl(
    new URL(
      "../../file-sets/Vital signs_2026_05_29-18_08_54.zip",
      import.meta.url,
    ),
  );
  const buf = await Deno.readFile(zipPath);
  const { unzipSync, strFromU8 } = await import("fflate");
  const entries = unzipSync(buf);
  const ws = new TemplateWorkspace();
  const batch: Array<{ path: string; content: string }> = [];
  for (const [entryName, data] of Object.entries(entries)) {
    const lower = entryName.toLowerCase();
    if (
      /\.(opt|oet|adl|adls|xml)$/.test(lower) &&
      !lower.includes("__macosx")
    ) {
      batch.push({
        path: entryName.replace(/\\/g, "/").replace(/^\/+/, ""),
        content: strFromU8(data),
      });
    }
  }
  ws.addFiles(batch);
  const vitalSignsOet = ws.listFiles().find((f: TemplateWorkspaceFile) =>
    /Vital signs\.oet$/i.test(f.path)
  );
  assert(
    vitalSignsOet,
    `expected Vital signs.oet in zip, got: ${
      ws.listFiles().map((f: TemplateWorkspaceFile) => f.path).join(", ")
    }`,
  );
  assertEquals(vitalSignsOet.loadResult?.kind, "oet_xml");
});
