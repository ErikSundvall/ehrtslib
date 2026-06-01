/**
 * Phase 6a.2 — template file set workspace and ADL2 differential flattening.
 */

import { assert, assertEquals } from "https://deno.land/std@0.220.0/assert/mod.ts";
import { fromFileUrl } from "https://deno.land/std@0.220.0/path/mod.ts";
import { RMInstanceGenerator } from "../../enhanced/generation/rm_instance_generator.ts";
import {
  ArchetypeRepository,
  TemplateWorkspace,
  getOperationalTemplateFromInput,
  parseTemplateInput,
} from "../../enhanced/parser/mod.ts";

const ADL2_DIR = fromFileUrl(new URL("../../test_data/adl2/", import.meta.url));
const VALIDITY_TEMPLATES_DIR = fromFileUrl(
  new URL("../../test_data/archie-tests/validity-templates/", import.meta.url),
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
    "../../test_data/opt14/minimal_evaluation.opt",
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
