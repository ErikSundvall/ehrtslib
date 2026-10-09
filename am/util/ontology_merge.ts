/**
 * Merge archetype / template terminologies for operational templates.
 */

import * as openehr_am from "../openehr_am.ts";

export type TermBag = Record<string, { text?: string; description?: string }>;
export type TermDefinitionTable = Record<string, TermBag>;

export interface ArchetypeResolver {
  resolve(archetypeId: string): openehr_am.ARCHETYPE | undefined;
}

export function mergeTermDefinitionTables(
  target: TermDefinitionTable,
  source: TermDefinitionTable | undefined,
): void {
  if (!source) return;
  for (const [lang, terms] of Object.entries(source)) {
    if (!terms || typeof terms !== "object") continue;
    target[lang] ??= {};
    Object.assign(target[lang], terms);
  }
}

export function termTableFromArchetype(
  archetype: openehr_am.ARCHETYPE | undefined,
): TermDefinitionTable | undefined {
  if (!archetype?.ontology) return undefined;
  return (archetype.ontology as { term_definitions?: TermDefinitionTable })
    .term_definitions;
}

export function mergeArchetypeTerms(
  target: TermDefinitionTable,
  archetype: openehr_am.ARCHETYPE | undefined,
): void {
  mergeTermDefinitionTables(target, termTableFromArchetype(archetype));
}

export function mergeParentArchetypeTerms(
  target: TermDefinitionTable,
  source: openehr_am.ARCHETYPE,
  resolver: ArchetypeResolver,
): void {
  const seen = new Set<string>();
  let parentId = source.parent_archetype_id?.value ??
    source.parent_archetype_id?.toString();
  while (parentId && !seen.has(parentId)) {
    seen.add(parentId);
    const parent = resolver.resolve(parentId);
    if (!parent) break;
    mergeArchetypeTerms(target, parent);
    parentId = parent.parent_archetype_id?.value ??
      parent.parent_archetype_id?.toString();
  }
}

export function termTableForArchetype(
  archetype: openehr_am.ARCHETYPE,
  resolver: ArchetypeResolver,
): TermDefinitionTable {
  const merged: TermDefinitionTable = {};
  mergeParentArchetypeTerms(merged, archetype, resolver);
  mergeArchetypeTerms(merged, archetype);
  return merged;
}

/**
 * Better `templateId` or an OBJECT_ID-shaped `{ value }` on a template / OPT.
 * Empty strings are ignored.
 */
export function readTemplateId(
  source: {
    template_id?: unknown;
  } | undefined,
): string | undefined {
  const id = source?.template_id;
  if (typeof id === "string") {
    const trimmed = id.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  if (id && typeof id === "object" && "value" in id) {
    const value = (id as { value?: unknown }).value;
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return undefined;
}

/**
 * Per-archetype terminology (parent chain + archetype) for scoped lookup.
 *
 * Each inlined template is stored under every id the flattener may stamp as
 * `term_archetype_scope`: archetype id, Better `template_id`, and any extra
 * lookup key (`.t.json` basename, `archetypeRef`). A second template that
 * specialises the same archetype id is not dropped — only the shared key is
 * left with the first occupant. Distinct template ids each keep their bag.
 */
export function buildArchetypeTermIndex(
  resolver: ArchetypeResolver,
  inlinedArchetypes: Iterable<openehr_am.ARCHETYPE | undefined>,
  scopeKeys?: WeakMap<openehr_am.ARCHETYPE, ReadonlySet<string>>,
): Record<string, TermDefinitionTable> {
  const index: Record<string, TermDefinitionTable> = {};
  const owner = new Map<string, openehr_am.ARCHETYPE>();
  for (const arch of inlinedArchetypes) {
    if (!arch) continue;
    const table = termTableForArchetype(arch, resolver);
    const keys = new Set<string>();
    const archetypeId = archetypeIdString(arch);
    const templateId = readTemplateId(arch);
    if (archetypeId) keys.add(archetypeId);
    if (templateId) keys.add(templateId);
    const extra = scopeKeys?.get(arch);
    if (extra) {
      for (const key of extra) {
        if (key) keys.add(key);
      }
    }
    for (const key of keys) {
      const existing = owner.get(key);
      if (existing && existing !== arch) continue;
      index[key] = table;
      owner.set(key, arch);
    }
  }
  return index;
}

function archetypeIdString(arch: openehr_am.ARCHETYPE): string | undefined {
  return arch.archetype_id?.value ?? arch.archetype_id?.toString();
}

export function buildMergedTerminology(
  source: openehr_am.TEMPLATE | openehr_am.ARCHETYPE,
  resolver: ArchetypeResolver,
  inlinedArchetypes: Iterable<openehr_am.ARCHETYPE | undefined> = [],
): TermDefinitionTable {
  const merged: TermDefinitionTable = {};
  mergeParentArchetypeTerms(merged, source, resolver);
  for (const arch of inlinedArchetypes) mergeArchetypeTerms(merged, arch);
  mergeArchetypeTerms(merged, source);
  return merged;
}

export function applyMergedTerminology(
  target: openehr_am.OPERATIONAL_TEMPLATE | openehr_am.ARCHETYPE,
  merged: TermDefinitionTable,
): void {
  const ontology = target.ontology ?? new openehr_am.ARCHETYPE_ONTOLOGY();
  (ontology as { term_definitions?: TermDefinitionTable }).term_definitions =
    merged;
  target.ontology = ontology;
}
