import { assertEquals } from "@std/assert";
import { parseOptXml } from "../../../../parser/mod.ts";
import {
  buildWebTemplate,
  DEFAULT_CDR_PROFILE,
  mergeFlatSerializerOptions,
  mergeWebTemplateBuilderOptions,
  resolveCdrProfile,
  type WebTemplateNode,
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
  // Template id, not the composition concept: name/value sibling FLAT keys
  // stay on `aql_example/...`. Ferro keeps `treeRootId: "archetype"`.
  assertEquals(r.webTemplate.treeRootId, "template");
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

function nodeIds(
  nodes: WebTemplateNode[] | undefined,
  out = new Set<string>(),
): Set<string> {
  for (const n of nodes ?? []) {
    out.add(n.id);
    nodeIds(n.children, out);
  }
  return out;
}

Deno.test("buildWebTemplate ehrbase matches explicit label/term ids", () => {
  const optUrl = new URL(
    "../../../fixtures/ferroehr/thumb-pain-encounter.v2-coded.opt",
    import.meta.url,
  );
  const opt = parseOptXml(Deno.readTextFileSync(optUrl)).operationalTemplate!;
  const explicit = {
    treeRootId: "template" as const,
    omitSectionNameNode: true,
    renamedArchetypeRootId: "label" as const,
    elementNameId: "term" as const,
  };
  const legacy = buildWebTemplate(opt, explicit);
  const profiled = buildWebTemplate(opt, { cdrProfile: "ehrbase" });
  assertEquals(profiled.tree.id, "thumb-pain-encounter.v2-coded");
  assertEquals(profiled.tree.id, legacy.tree.id);
  const ids = nodeIds(profiled.tree.children);
  assertEquals([...ids].sort(), [...nodeIds(legacy.tree.children)].sort());
  assertEquals(ids.has("tenderness"), true);
  assertEquals(ids.has("excluded_concept"), true);
  assertEquals(ids.has("adverse_reaction_substance"), false);
});
