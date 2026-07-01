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
