/**
 * #316: buildWebTemplate node ids aligned with FerroEHR Web Template conventions.
 */
import { assert, assertEquals } from "@std/assert";
import { parseOptXml } from "../../../../parser/mod.ts";
import {
  buildWebTemplate,
  type WebTemplate,
  type WebTemplateNode,
} from "../../../../serialization/simplified/mod.ts";

const OPT = new URL(
  "../../../fixtures/ferroehr/thumb-pain-encounter.v2-coded.opt",
  import.meta.url,
);
const FERRO_WT = new URL(
  "../../../fixtures/ferroehr/ferro-flat/wt.json",
  import.meta.url,
);

function find(
  nodes: WebTemplateNode[] | undefined,
  pred: (n: WebTemplateNode) => boolean,
): WebTemplateNode | undefined {
  for (const n of nodes ?? []) {
    if (pred(n)) return n;
    const found = find(n.children, pred);
    if (found) return found;
  }
}

function ids(nodes: WebTemplateNode[] | undefined, out = new Set<string>()): Set<string> {
  for (const n of nodes ?? []) {
    out.add(n.id);
    ids(n.children, out);
  }
  return out;
}

const FERRO_BUILD = { cdrProfile: "ferroehr" as const };

const opt = parseOptXml(Deno.readTextFileSync(OPT)).operationalTemplate!;
const wt = buildWebTemplate(opt, FERRO_BUILD);
const ferro = JSON.parse(Deno.readTextFileSync(FERRO_WT)) as WebTemplate;

Deno.test("#316 tree.id is the composition archetype concept", () => {
  assertEquals(wt.tree.id, "encounter");
  assertEquals(ferro.tree.id, "encounter");
});

Deno.test("#316 no dv_text child under name-constrained SECTIONs", () => {
  for (const sectionId of ["history", "examination", "assessment"]) {
    const section = find(wt.tree.children, (n) => n.id === sectionId)!;
    assert(section, sectionId);
    assert(
      !(section.children ?? []).some((c) => c.id === "dv_text"),
      `${sectionId} must not expose dv_text`,
    );
    const ferroSection = find(ferro.tree.children, (n) => n.id === sectionId)!;
    assertEquals(
      (section.children ?? []).map((c) => c.id).sort(),
      (ferroSection.children ?? []).map((c) => c.id).sort(),
      sectionId,
    );
  }
});

Deno.test("#316 renamed CLUSTER keeps archetype-derived id", () => {
  const cluster = find(
    wt.tree.children,
    (n) => n.rmType === "CLUSTER" && n.name === "Symptom/Sign",
  )!;
  assertEquals(cluster.id, "symptom_sign");
  assert(
    !ids(wt.tree.children).has("tenderness"),
    "renamed label must not become node id",
  );
});

Deno.test("#316 ELEMENT name constraint uses first allowed term id", () => {
  const adverse = find(wt.tree.children, (n) => n.id === "adverse_reaction_substance");
  assert(adverse, "adverse_reaction_substance node");
  assertEquals(adverse?.rmType, "DV_TEXT");
  assert(!ids(wt.tree.children).has("excluded_concept"));
  const ferroNode = find(
    ferro.tree.children,
    (n) => n.id === "adverse_reaction_substance",
  );
  assertEquals(adverse?.id, ferroNode?.id);
});

Deno.test("#316 category is not inContext", () => {
  const category = wt.tree.children?.find((c) => c.id === "category");
  assertEquals(category?.inContext, undefined);
});

Deno.test("#316 built ids match Ferro WT except known Ferro-only interval bounds", () => {
  const built = ids(wt.tree.children);
  const reference = ids(ferro.tree.children);
  const onlyBuilt = [...built].filter((id) => !reference.has(id)).sort();
  const onlyFerro = [...reference].filter((id) => !built.has(id)).sort();
  const allowedOnlyBuilt = new Set([
    "additional_details",
    "alternative_structure",
    "associated_symptom_sign",
    "device_details",
    "extension",
    "factor_detail",
    "history_origin",
    "multimedia_representation",
    "previous_episodes",
    "severity_rating",
    "specific_details",
    "status",
    "structured_body_site",
  ]);
  assert(
    onlyBuilt.every((id) => allowedOnlyBuilt.has(id)),
    `unexpected extra ids: ${onlyBuilt.filter((id) => !allowedOnlyBuilt.has(id)).join(", ")}`,
  );
  assertEquals(onlyFerro, ["lower", "upper"]);
});

Deno.test("#316 treeRootId template restores normalised template id", () => {
  const legacy = buildWebTemplate(opt, { treeRootId: "template" });
  assertEquals(legacy.tree.id, "thumb-pain-encounter.v2-coded");
});