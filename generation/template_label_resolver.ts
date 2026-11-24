/**
 * Unified `OPERATIONAL_TEMPLATE` node display-label resolver.
 *
 * Resolves localized display labels, descriptions, and annotations for
 * template/archetype `C_OBJECT` nodes with consistent precedence:
 * 1. `L10n.{lang}` path annotations (`generation/opt_l10n.ts`)
 * 2. Fixed `name/value` constraint (`fixedNameConstraint`) in `original_language`
 * 3. Occurrence-scoped term definitions (`term_occurrence_scope` → `occurrence_term_definitions`)
 * 4. Archetype-scoped term definitions (`term_archetype_scope` → `archetype_term_definitions`),
 *    with Better `ovl-*` parent archetype fallback
 * 5. Template-level `ontology.term_definitions` with per-code language fallback
 * 6. Never downgrading a real clinical label to a generic RM-type fallback
 *    (`"element"`, `"cluster"`, `"section"`, etc.)
 */

import type * as openehr_am from "../am/openehr_am.ts";
import type {
  TermBag,
  TermDefinitionTable,
} from "../am/util/ontology_merge.ts";
import {
  type AnnotationLookupOptions,
  annotationsForAqlPath,
  extractL10nNames,
  flattenOptPathAnnotations,
  type OptPathAnnotationMap,
} from "./opt_l10n.ts";
import { availableTemplateLanguages, languageCode } from "./term_codes.ts";
import {
  isGenericRmFallbackLabel,
  type OperationalTemplateWithTermScopes,
  resolveScopeChain,
  resolveTermEntry,
  TERM_NAME_FALLBACK_NODE_ID_KEY,
  type TermEntry,
  termScopeOf,
  type TermScopeMeta,
  termTablesByScope,
} from "./term_scope.ts";

/**
 * Single fixed value of a `name` constraint (`name/value matches {"X"}`), as
 * written by template tools for renamed archetype occurrences.
 */
export function fixedNameConstraint(
  obj: openehr_am.C_OBJECT,
): string | undefined {
  const attrs = (obj as { attributes?: openehr_am.C_ATTRIBUTE[] }).attributes;
  const nameAttr = attrs?.find((a) => a.rm_attribute_name === "name");
  const dv = (nameAttr as { children?: openehr_am.C_OBJECT[] } | undefined)
    ?.children?.[0] as { attributes?: openehr_am.C_ATTRIBUTE[] } | undefined;
  const valueAttr = dv?.attributes?.find((a) =>
    a.rm_attribute_name === "value"
  );
  const prim = (valueAttr as { children?: unknown[] } | undefined)
    ?.children?.[0] as
      | { list?: unknown; item?: { list?: unknown } }
      | undefined;
  const list = prim?.item?.list ?? prim?.list;
  if (Array.isArray(list) && list.length === 1 && typeof list[0] === "string") {
    return list[0];
  }
  return undefined;
}

export interface TemplateLabelResolverOptions {
  /**
   * Languages to resolve, in priority order. The first entry is the primary
   * language; further entries populate `localizedNames` /
   * `localizedDescriptions` and act as fallback for `label` / `description`.
   * Defaults to `[originalLanguage]`.
   */
  languages?: string[];
  /**
   * Primary language shorthand (prepended to `languages` when provided).
   */
  language?: string;
  /**
   * Apply OPT `L10n.{lang}` path annotations when an `aqlPath` is provided
   * (default `true`).
   */
  applyL10nAnnotations?: boolean;
  /**
   * Optional pre-flattened path annotations map (avoids re-flattening if the
   * caller already holds one).
   */
  pathAnnotations?: OptPathAnnotationMap;
}

export interface NodeLabelResolveOptions {
  /**
   * Fallback label hint (for example an RM type name or attribute name) used
   * only when no clinical label resolves from any tier.
   */
  fallbackHint?: string;
  /**
   * Optional ancestor node names aligned to segments of `aqlPath` for
   * disambiguating repeated renamed ancestor archetypes in path annotations.
   */
  ancestorNames?: AnnotationLookupOptions["ancestorNames"];
  /**
   * Additional candidate names for matching leaf name predicates in path
   * annotations.
   */
  candidateNames?: AnnotationLookupOptions["candidateNames"];
  /** Override `languages` for this call. */
  languages?: string[];
  /** Override primary language for this call. */
  language?: string;
  /** Override `applyL10nAnnotations` for this call. */
  applyL10nAnnotations?: boolean;
}

export interface ResolvedTemplateNodeLabel {
  /**
   * Primary display label after applying L10n, fixed name constraints, scoped
   * term definitions, language fallback, and optional `fallbackHint`.
   */
  label?: string;
  /** Primary description (with language fallback across selected → original). */
  description?: string;
  /**
   * Resolved primary display name from template terminology / constraints /
   * L10n (without `fallbackHint`).
   */
  primaryName?: string;
  /** Resolved display names keyed by language. */
  localizedNames?: Record<string, string>;
  /** Resolved descriptions keyed by language. */
  localizedDescriptions?: Record<string, string>;
  /** Matched OPT path annotations (when `aqlPath` matched and L10n is enabled). */
  annotations?: Record<string, string>;
}

export interface ResolvedCodeLabels {
  label?: string;
  description?: string;
  localizedLabels?: Record<string, string>;
  localizedDescriptions?: Record<string, string>;
}

export interface TemplateLabelResolver {
  readonly originalLanguage: string;
  readonly primaryLanguage: string;
  readonly languages: readonly string[];
  readonly pathAnnotations: OptPathAnnotationMap;

  /**
   * Resolve `{ label, description, localizedNames, primaryName, ... }` for a
   * constraint node at an optional `aqlPath`.
   */
  resolveNode(
    cObj: openehr_am.C_OBJECT,
    aqlPath?: string,
    options?: NodeLabelResolveOptions,
  ): ResolvedTemplateNodeLabel;

  /**
   * Resolve a node's term entry in a single language (including fixed
   * `name/value` constraint in `originalLanguage`, occurrence scope, archetype
   * scope with `ovl-*` fallback, and template terms — without L10n path
   * annotations).
   */
  resolveNodeTermInLanguage(
    cObj: openehr_am.C_OBJECT,
    language: string,
  ): TermEntry;

  /**
   * Resolve a coded value / term code (`atNNNN`, `idN`, …) within an optional
   * term scope, returning primary `label`, `description`, `localizedLabels`,
   * and `localizedDescriptions`.
   */
  resolveCode(
    code: string,
    scope?: string,
  ): ResolvedCodeLabels;

  /**
   * Resolve a term code in a single language within an optional term scope.
   */
  resolveCodeInLanguage(
    code: string,
    language: string,
    scope?: string,
  ): TermEntry | undefined;
}

function orderedLanguages(
  primary: string | undefined,
  values: readonly string[] | undefined,
): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const add = (value: string | undefined) => {
    const lang = value?.trim();
    if (!lang || seen.has(lang)) return;
    seen.add(lang);
    out.push(lang);
  };
  add(primary);
  for (const value of values ?? []) add(value);
  return out;
}

function l10nForLanguage(
  l10nNames: Record<string, string>,
  lang: string,
): string | undefined {
  const exact = lang.trim().toLowerCase();
  if (!exact) return undefined;
  if (l10nNames[exact]) return l10nNames[exact];
  const base = exact.split(/[-_]/)[0];
  if (base && base !== exact && l10nNames[base]) return l10nNames[base];
  return undefined;
}

function preferNonGeneric(
  candidate: string | undefined,
  existing: string | undefined,
  rmType?: string,
): string | undefined {
  if (!candidate) return existing;
  if (!existing) return candidate;
  const candGeneric = isGenericRmFallbackLabel(candidate, rmType);
  const existGeneric = isGenericRmFallbackLabel(existing, rmType);
  if (candGeneric && !existGeneric) return existing;
  return candidate;
}

/**
 * Create a reusable label resolver bound to an `OPERATIONAL_TEMPLATE`.
 * Caches per-language term bags and flattened path annotations across calls.
 */
export function createTemplateLabelResolver(
  opt: openehr_am.OPERATIONAL_TEMPLATE,
  options?: TemplateLabelResolverOptions,
): TemplateLabelResolver {
  const scoped = opt as OperationalTemplateWithTermScopes;
  const originalLanguage = languageCode(opt.original_language) ??
    languageCode(
      (opt.ontology as { original_language?: unknown } | undefined)
        ?.original_language,
    ) ??
    "en";

  const listed = orderedLanguages(options?.language, options?.languages);
  const selectedLanguages = listed.length ? listed : [originalLanguage];
  const primaryLanguage = selectedLanguages[0];
  const applyL10nDefault = options?.applyL10nAnnotations ?? true;

  const templateTerms = (opt.ontology?.term_definitions ?? {}) as Record<
    string,
    TermBag
  >;
  const archetypeTerms: Record<string, TermDefinitionTable> = termTablesByScope(
    scoped,
  );
  const availableLanguages = availableTemplateLanguages(opt);
  const pathAnnotations: OptPathAnnotationMap = options?.pathAnnotations ??
    (applyL10nDefault ? flattenOptPathAnnotations(opt) : {});

  const bagCache = new Map<
    string,
    { template: TermBag; archetype: Record<string, TermBag> }
  >();

  const bagsForLanguage = (lang: string): {
    template: TermBag;
    archetype: Record<string, TermBag>;
  } => {
    const cached = bagCache.get(lang);
    if (cached) return cached;
    const archetype: Record<string, TermBag> = {};
    for (const [id, table] of Object.entries(archetypeTerms)) {
      const bag = table?.[lang];
      if (bag && Object.keys(bag).length) archetype[id] = bag;
    }
    const built = {
      template: templateTerms[lang] ?? {},
      archetype,
    };
    bagCache.set(lang, built);
    return built;
  };

  const fallbackLanguagesFor = (langs: readonly string[]): string[] => {
    const out: string[] = [];
    const seen = new Set<string>();
    const add = (lang: string | undefined) => {
      const t = lang?.trim();
      if (!t || seen.has(t)) return;
      seen.add(t);
      out.push(t);
    };
    for (const l of langs) add(l);
    add(originalLanguage);
    add("en");
    for (const l of availableLanguages) add(l);
    return out;
  };

  const resolveInLanguage = (
    cObj: openehr_am.C_OBJECT,
    lang: string,
  ): TermEntry | undefined => {
    const bags = bagsForLanguage(lang);
    const meta = cObj as TermScopeMeta;
    const scope = termScopeOf(meta);
    const entry = resolveTermEntry(
      cObj.node_id,
      meta[TERM_NAME_FALLBACK_NODE_ID_KEY],
      bags.template,
      bags.archetype,
      scope,
    );
    if (entry) return entry;
    const hasScopedBag = !!scope &&
      resolveScopeChain(scope, Object.keys(bags.archetype)).length > 0;
    if (hasScopedBag) return undefined;
    return resolveTermEntry(cObj.node_id, undefined, bags.template, {}, undefined);
  };

  const resolveNodeTermInLanguage = (
    cObj: openehr_am.C_OBJECT,
    lang: string,
  ): TermEntry => {
    const resolved = resolveInLanguage(cObj, lang) ?? {};
    if (lang === originalLanguage) {
      const fixed = fixedNameConstraint(cObj);
      if (fixed) {
        return {
          ...resolved,
          text: preferNonGeneric(fixed, resolved.text, cObj.rm_type_name),
        };
      }
    }
    return resolved;
  };

  const resolveCodeInLanguage = (
    code: string,
    lang: string,
    scope?: string,
  ): TermEntry | undefined => {
    const bags = bagsForLanguage(lang);
    return resolveTermEntry(
      code,
      undefined,
      bags.template,
      bags.archetype,
      scope,
    );
  };

  const resolveCode = (
    code: string,
    scope?: string,
  ): ResolvedCodeLabels => {
    const localizedLabels: Record<string, string> = {};
    const localizedDescriptions: Record<string, string> = {};
    for (const lang of selectedLanguages) {
      const entry = resolveCodeInLanguage(code, lang, scope);
      if (entry?.text) localizedLabels[lang] = entry.text;
      if (entry?.description) localizedDescriptions[lang] = entry.description;
    }

    let label: string | undefined;
    let description: string | undefined;
    for (const lang of fallbackLanguagesFor(selectedLanguages)) {
      const entry = resolveCodeInLanguage(code, lang, scope);
      if (!label && entry?.text) label = entry.text;
      if (!description && entry?.description) description = entry.description;
      if (label && description) break;
    }

    return {
      label,
      description,
      localizedLabels: Object.keys(localizedLabels).length
        ? localizedLabels
        : undefined,
      localizedDescriptions: Object.keys(localizedDescriptions).length
        ? localizedDescriptions
        : undefined,
    };
  };

  const resolveNode = (
    cObj: openehr_am.C_OBJECT,
    aqlPath?: string,
    callOptions?: NodeLabelResolveOptions,
  ): ResolvedTemplateNodeLabel => {
    const callListed = orderedLanguages(
      callOptions?.language,
      callOptions?.languages,
    );
    const activeLanguages = callListed.length ? callListed : selectedLanguages;
    const activePrimary = activeLanguages[0];
    const fallbacks = fallbackLanguagesFor(activeLanguages);
    const rmType = cObj.rm_type_name;

    // 1. Collect per-language term definitions (applying fixed name in originalLanguage).
    const localizedNames: Record<string, string> = {};
    const localizedDescriptions: Record<string, string> = {};
    for (const lang of activeLanguages) {
      const term = resolveNodeTermInLanguage(cObj, lang);
      if (term.text) localizedNames[lang] = term.text;
      if (term.description) localizedDescriptions[lang] = term.description;
    }

    // 2. Determine primary display text & description across fallback languages,
    //    never downgrading a real clinical label to a generic RM fallback.
    let bestRealText: string | undefined;
    let firstGenericText: string | undefined;
    let description: string | undefined;
    for (const lang of fallbacks) {
      const term = resolveNodeTermInLanguage(cObj, lang);
      if (term.text) {
        if (!isGenericRmFallbackLabel(term.text, rmType)) {
          if (!bestRealText) bestRealText = term.text;
        } else if (!firstGenericText) {
          firstGenericText = term.text;
        }
      }
      if (!description && term.description) description = term.description;
      if (bestRealText && description) break;
    }
    let primaryName = bestRealText ?? firstGenericText;

    // 3. Apply L10n.{lang} path annotations (highest precedence) when available.
    const useL10n = callOptions?.applyL10nAnnotations ?? applyL10nDefault;
    let matchedAnnotations: Record<string, string> | undefined;
    if (useL10n && aqlPath) {
      const candidateNames: Array<string | undefined> = [
        primaryName,
        fixedNameConstraint(cObj),
        resolveNodeTermInLanguage(cObj, originalLanguage).text,
        ...Object.values(localizedNames),
        ...(callOptions?.candidateNames ?? []),
      ];
      matchedAnnotations = annotationsForAqlPath(
        pathAnnotations,
        aqlPath,
        primaryName,
        {
          candidateNames,
          ancestorNames: callOptions?.ancestorNames,
        },
      );
      if (matchedAnnotations) {
        const fromL10n = extractL10nNames(matchedAnnotations);
        for (const [lang, text] of Object.entries(fromL10n)) {
          const merged = preferNonGeneric(text, localizedNames[lang], rmType);
          if (merged) localizedNames[lang] = merged;
        }
        // Precedence #1: L10n for active primary language wins (unless it would
        // downgrade a real clinical label to a generic RM fallback).
        const primaryL10n = l10nForLanguage(fromL10n, activePrimary);
        if (primaryL10n) {
          primaryName = preferNonGeneric(primaryL10n, primaryName, rmType);
        } else if (!primaryName || isGenericRmFallbackLabel(primaryName, rmType)) {
          for (const lang of fallbacks) {
            const candidate = l10nForLanguage(fromL10n, lang);
            if (candidate && !isGenericRmFallbackLabel(candidate, rmType)) {
              primaryName = candidate;
              break;
            }
          }
          if (!primaryName) {
            const firstL10n = Object.values(fromL10n).find((v) =>
              !isGenericRmFallbackLabel(v, rmType)
            ) ?? Object.values(fromL10n)[0];
            if (firstL10n) primaryName = firstL10n;
          }
        }
      }
    }

    const label = primaryName ?? callOptions?.fallbackHint;
    return {
      label,
      description,
      primaryName,
      localizedNames: Object.keys(localizedNames).length
        ? localizedNames
        : undefined,
      localizedDescriptions: Object.keys(localizedDescriptions).length
        ? localizedDescriptions
        : undefined,
      annotations: matchedAnnotations,
    };
  };

  return {
    originalLanguage,
    primaryLanguage,
    languages: selectedLanguages,
    pathAnnotations,
    resolveNode,
    resolveNodeTermInLanguage,
    resolveCode,
    resolveCodeInLanguage,
  };
}

/**
 * Convenience one-shot helper to resolve display label metadata for a single
 * constraint node in an `OPERATIONAL_TEMPLATE`. When resolving many nodes in
 * one template, prefer {@link createTemplateLabelResolver} so term bags and
 * path annotations are indexed once.
 */
export function resolveTemplateNodeLabel(
  opt: openehr_am.OPERATIONAL_TEMPLATE,
  cObj: openehr_am.C_OBJECT,
  aqlPath?: string,
  options?: TemplateLabelResolverOptions & NodeLabelResolveOptions,
): ResolvedTemplateNodeLabel {
  return createTemplateLabelResolver(opt, options).resolveNode(
    cObj,
    aqlPath,
    options,
  );
}
