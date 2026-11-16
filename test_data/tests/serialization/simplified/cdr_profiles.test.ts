import { assertEquals } from "@std/assert";
import { parseOptXml } from "../../../../parser/mod.ts";
import {
  buildWebTemplate,
  DEFAULT_CDR_PROFILE,
  mergeFlatSerializerOptions,
  mergeWebTemplateBuilderOptions,
  resolveCdrProfile,
} from "../../../../serialization/simplified/mod.ts";

Deno.test("DEFAULT_CDR_PROFILE is ehrbase", () => {
  assertEquals(DEFAULT_CDR_PROFILE, "ehrbase");
});

Deno.test("ferroehr profile sets WT and FLAT conventions", () => {
  const r = resolveCdrProfile({ cdrProfile: "ferroehr" });
  assertEquals(r.webTemplate.treeRootId, "archetype");
  assertEquals(r.webTemplate.omitSectionNameNode, true);
  assertEquals(r.webTemplate.renamedArchetypeRootId, "archetype");
  assertEquals(r.webTemplate.elementNameId, "name_constraint");
  assertEquals(r.flat.flavor, "input");
  assertEquals(r.flat.locatableName, "omit");
});

Deno.test("ehrbase profile sets label/term WT ids and output FLAT", () => {
  const r = resolveCdrProfile({ cdrProfile: "ehrbase" });
  assertEquals(r.webTemplate.renamedArchetypeRootId, "label");
  assertEquals(r.webTemplate.elementNameId, "term");
  assertEquals(r.flat.flavor, "output");
  assertEquals(r.flat.locatableName, "path");
});

Deno.test("explicit options override profile", () => {
  const merged = mergeWebTemplateBuilderOptions({
    cdrProfile: "ferroehr",
    treeRootId: "template",
  });
  assertEquals(merged.treeRootId, "template");
  assertEquals(merged.elementNameId, "name_constraint");
  const flat = mergeFlatSerializerOptions({
    cdrProfile: "ferroehr",
    flavor: "output",
  });
  assertEquals(flat.flavor, "output");
  assertEquals(flat.locatableName, "omit");
});

Deno.test("buildWebTemplate ehrbase matches explicit label/term ids", () => {
  const optUrl = new URL(
    "../../../fixtures/ferroehr/thumb-pain-encounter.v2-coded.opt",
    import.meta.url,
  );
  const opt = parseOptXml(Deno.readTextFileSync(optUrl)).operationalTemplate!;
  const legacy = buildWebTemplate(opt, {
    treeRootId: "archetype",
    renamedArchetypeRootId: "label",
    elementNameId: "term",
  });
  const profiled = buildWebTemplate(opt, { cdrProfile: "ehrbase" });
  assertEquals(profiled.tree.id, legacy.tree.id);
});