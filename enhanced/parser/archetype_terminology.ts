/**
 * Archetype / template terminology lookups for natural-language node labels.
 */

import type { TermDefinitionTable } from "./odin_aom_mapper.ts";
import type * as openehr_am from "../openehr_am.ts";
import type { ArchetypeRepository } from "./legacy/archetype_repository.ts";

export type AnnotatedResource =
  | openehr_am.ARCHETYPE
  | openehr_am.TEMPLATE
  | openehr_am.TEMPLATE_OVERLAY;

export type TreeLabelMode = "id" | "term";

/** Parse `ISO_639-1::en` or plain `en` to a language code. */
export function parseLanguageCode(raw: string | undefined): string {
  if (!raw) return "en";
  if (typeof raw !== "string") return "en";
  const trimmed = raw.trim();
  if (!trimmed) return "en";
  const m = trimmed.match(/::([^:]+)$/);
  return (m?.[1] ?? trimmed).trim().toLowerCase() || "en";
}

export function getResourceDefaultLanguage(resource: AnnotatedResource): string {
  const ol = (resource as { original_language?: unknown }).original_language;
  if (typeof ol === "string") return parseLanguageCode(ol);
  if (ol && typeof ol === "object") {
    const bag = ol as { code_string?: string; value?: string };
    const code = typeof bag.code_string === "string"
      ? bag.code_string
      : (bag.code_string as { value?: string } | undefined)?.value;
    if (code) return parseLanguageCode(String(code));
    if (typeof bag.value === "string") return parseLanguageCode(bag.value);
  }
  return "en";
}

export function getTermDefinitionsTable(
  resource: AnnotatedResource | undefined,
): TermDefinitionTable | undefined {
  if (!resource?.ontology) return undefined;
  const table = (resource.ontology as Record<string, unknown>).term_definitions;
  if (!table || typeof table !== "object" || Array.isArray(table)) {
    return undefined;
  }
  return table as TermDefinitionTable;
}

/** Languages that have at least one term definition on this resource. */
export function listTerminologyLanguages(resource: AnnotatedResource): string[] {
  const table = getTermDefinitionsTable(resource);
  const fromTerms = table ? Object.keys(table).sort() : [];
  const def = getResourceDefaultLanguage(resource);
  const set = new Set<string>([def, ...fromTerms]);
  return [...set];
}

export function lookupTermText(
  table: TermDefinitionTable | undefined,
  language: string,
  nodeId: string | undefined,
): string | undefined {
  if (!table || !nodeId) return undefined;
  const lang = language.trim().toLowerCase();
  const langTable = table[lang] ??
    table[lang.split("-")[0]] ??
    table[Object.keys(table).find((k) => k.toLowerCase() === lang) ?? ""];
  if (!langTable) return undefined;
  const term = langTable[nodeId] ?? langTable[nodeId.toLowerCase()];
  const text = term?.text?.trim();
  if (text) return text;
  return term?.description?.trim() || undefined;
}

export interface TermLookupContext {
  resource: AnnotatedResource;
  language: string;
  repository?: ArchetypeRepository;
  archetypeRef?: string;
}

/** Term rubric for a constraint node id, optionally from a referenced archetype. */
export function lookupNodeTermText(ctx: TermLookupContext, nodeId: string | undefined): string | undefined {
  let text = lookupTermText(getTermDefinitionsTable(ctx.resource), ctx.language, nodeId);
  if (text || !ctx.archetypeRef || !ctx.repository || !nodeId) return text;
  const ext = ctx.repository.get(ctx.archetypeRef) ??
    ctx.repository.getTemplate(ctx.archetypeRef);
  if (!ext) return undefined;
  return lookupTermText(getTermDefinitionsTable(ext), ctx.language, nodeId);
}

export function resolveNodeDisplayLabel(
  labelId: string,
  termLabel: string | undefined,
  mode: TreeLabelMode,
): string {
  if (mode === "term" && termLabel) return termLabel;
  return labelId;
}
