/**
 * Propose/apply Better/AD `L10n.{lang}` path annotations.
 *
 * OPT 1.4 stores one ontology block per archetype id, so repeated/renamed
 * occurrences cannot keep independent translations. The workaround is path
 * annotations `L10n.{lang} = text` (discourse.openehr.org/t/2760).
 *
 * This module never mutates definition, terminology, or non-L10n keys.
 */

import type { AnnotationDocumentation } from "./clinical_model_annotations.ts";
import {
  ensureResourceAnnotations,
  type AnnotatedResource,
} from "./clinical_model_annotations.ts";

/** A node that can contribute occurrence names for L10n generation. */
export interface L10nSourceNode {
  path: string;
  localizedNames?: Record<string, string>;
  /** Archetype id when this node is a use_archetype / C_ARCHETYPE_ROOT. */
  archetypeRef?: string;
}

export interface GenerateL10nOptions {
  /**
   * Language bags that must receive a copy of every L10n.* key.
   * Needed because Archetype Designer exports annotations as language-specific.
   */
  languageBags: string[];
  /** Replace existing L10n.* values that differ. Default false. */
  overwrite?: boolean;
  /**
   * Only nodes whose archetypeRef appears more than once (the OPT 1.4 gap).
   * Default true. When false, every node with localizedNames is considered.
   */
  repeatedOccurrencesOnly?: boolean;
  /**
   * Copy every L10n.* key into every language bag (AD export quirk).
   * Default true. When false, L10n.{lang} is written only to that language bag.
   */
  copyToAllLanguageBags?: boolean;
}

export type L10nWriteKind = "add" | "unchanged" | "conflict";

export interface L10nWrite {
  languageBag: string;
  path: string;
  key: string;
  value: string;
  kind: L10nWriteKind;
  existingValue?: string;
}

function l10nAnnotationKey(language: string): string {
  return `L10n.${language}`;
}

function isL10nKey(key: string): boolean {
  return /^L10n\./i.test(key);
}

function countArchetypeRefs(nodes: L10nSourceNode[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const node of nodes) {
    const ref = node.archetypeRef?.trim();
    if (!ref) continue;
    counts.set(ref, (counts.get(ref) ?? 0) + 1);
  }
  return counts;
}

function eligibleNodes(
  nodes: L10nSourceNode[],
  repeatedOnly: boolean,
): L10nSourceNode[] {
  if (!repeatedOnly) {
    return nodes.filter((n) => n.path && n.localizedNames);
  }
  const counts = countArchetypeRefs(nodes);
  return nodes.filter((n) => {
    if (!n.path || !n.localizedNames) return false;
    const ref = n.archetypeRef?.trim();
    return !!ref && (counts.get(ref) ?? 0) > 1;
  });
}

/**
 * Compute the writes that would add L10n.* keys. Does not mutate `doc`.
 * Non-L10n keys in `doc` are ignored and never appear in the result.
 */
export function proposeL10nWrites(
  doc: AnnotationDocumentation | undefined,
  nodes: L10nSourceNode[],
  options: GenerateL10nOptions,
): L10nWrite[] {
  const bags = [...new Set(
    options.languageBags.map((l) => l.trim()).filter(Boolean),
  )];
  if (!bags.length) return [];

  const repeatedOnly = options.repeatedOccurrencesOnly !== false;
  const writes: L10nWrite[] = [];

  for (const node of eligibleNodes(nodes, repeatedOnly)) {
    const names = node.localizedNames ?? {};
    for (const [lang, text] of Object.entries(names)) {
      const value = text?.trim();
      if (!value) continue;
      const key = l10nAnnotationKey(lang);
      if (!isL10nKey(key)) continue;
      const targetBags = options.copyToAllLanguageBags === false
        ? bags.filter((b) => b.toLowerCase() === lang.toLowerCase())
        : bags;
      if (!targetBags.length) continue;
      for (const bag of targetBags) {
        const existing = doc?.[bag]?.[node.path]?.[key];
        if (existing === undefined) {
          writes.push({
            languageBag: bag,
            path: node.path,
            key,
            value,
            kind: "add",
          });
          continue;
        }
        if (existing === value) {
          writes.push({
            languageBag: bag,
            path: node.path,
            key,
            value,
            kind: "unchanged",
            existingValue: existing,
          });
          continue;
        }
        writes.push({
          languageBag: bag,
          path: node.path,
          key,
          value,
          kind: "conflict",
          existingValue: existing,
        });
      }
    }
  }
  return writes;
}

export interface ApplyL10nResult {
  applied: number;
  skippedUnchanged: number;
  skippedConflict: number;
  skippedNonL10n: number;
}

/**
 * Apply proposed writes onto a documentation bag.
 * Only `L10n.*` keys are written. Existing non-L10n keys are never read or
 * deleted. Conflicts are skipped unless `overwrite` is true.
 */
export function applyL10nWrites(
  doc: AnnotationDocumentation,
  writes: L10nWrite[],
  overwrite = false,
): ApplyL10nResult {
  const result: ApplyL10nResult = {
    applied: 0,
    skippedUnchanged: 0,
    skippedConflict: 0,
    skippedNonL10n: 0,
  };
  for (const write of writes) {
    if (!isL10nKey(write.key)) {
      result.skippedNonL10n++;
      continue;
    }
    if (write.kind === "unchanged") {
      result.skippedUnchanged++;
      continue;
    }
    if (write.kind === "conflict" && !overwrite) {
      result.skippedConflict++;
      continue;
    }
    if (!doc[write.languageBag]) doc[write.languageBag] = {};
    if (!doc[write.languageBag][write.path]) {
      doc[write.languageBag][write.path] = {};
    }
    doc[write.languageBag][write.path][write.key] = write.value;
    result.applied++;
  }
  return result;
}

/** Convenience: propose + apply onto an authored resource's annotation bag. */
export function generateL10nAnnotations(
  resource: AnnotatedResource,
  nodes: L10nSourceNode[],
  options: GenerateL10nOptions,
): { writes: L10nWrite[]; result: ApplyL10nResult } {
  const doc = ensureResourceAnnotations(resource);
  const writes = proposeL10nWrites(doc, nodes, options);
  const result = applyL10nWrites(doc, writes, options.overwrite === true);
  return { writes, result };
}
