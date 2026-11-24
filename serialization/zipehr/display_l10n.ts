/**
 * Display label localization for ZipEHR HTML5 quiet view (#323).
 *
 * Resolution order for `templateRenderLang`:
 *   1. Template L10n path annotations (`L10n.{lang}`)
 *   2. Archetype / OPT term definitions for `renderLang`
 *   3. openEHR internal terminology translations (`openehr::NNN`)
 *   4. Fallback: returns `undefined` so the serializer keeps the RM value untouched.
 *
 * Canonical/round-trip RM values are never altered; localized text is emitted
 * only as `<span class="zs-display-value">` paired with `<span class="zs-canonical-value">`.
 */

import type * as openehr_am from "../../am/openehr_am.ts";
import type { TermBag, TermDefinitionTable } from "../../am/util/ontology_merge.ts";
import { idToAtCode } from "../../generation/id_to_at_code.ts";
import { extractL10nNames } from "../../generation/opt_l10n.ts";
import type { OptPresentationByPath } from "../../generation/opt_view.ts";
import {
  lookupTermEntryInBag,
  type OperationalTemplateWithTermScopes,
  overlayParentScopes,
  termTablesByScope,
} from "../../generation/term_scope.ts";
import { adl14AtToId } from "../../parser/adl14_to_adl2_converter.ts";
import type { ArchetypeRepository } from "../../parser/legacy/archetype_repository.ts";
import {
  ATTESTATION_REASON_GROUP,
  AUDIT_CHANGE_TYPE_GROUP,
  COMPOSITION_CATEGORY_GROUP,
  EVENT_MATH_FUNCTION_GROUP,
  INSTRUCTION_STATES_GROUP,
  localizedOpenEhrRubric,
  NULL_FLAVOURS_GROUP,
  PARTICIPATION_MODE_GROUP,
  SETTING_GROUP,
  SUBJECT_RELATIONSHIP_GROUP,
  TERM_MAPPING_PURPOSE_GROUP,
} from "../../term/openehr_group_rubrics.ts";

export interface ZipEhrDisplayLocalizer {
  readonly renderLang: string;

  /**
   * Resolve a localized display label for a LOCATABLE node.
   * Priority: template L10n → archetype term definitions.
   */
  localizeLocatableName(params: {
    presentation?: OptPresentationByPath;
    archetypeId?: string;
    nodeId?: string;
    isArchetypeRoot?: boolean;
  }): string | undefined;

  /**
   * Resolve a localized display label for a `DV_CODED_TEXT` value.
   * Priority: template L10n → archetype term definitions (`local::…`) →
   * openEHR terminology (`openehr::…`).
   */
  localizeCodedText(params: {
    presentation?: OptPresentationByPath;
    archetypeId?: string;
    terminology?: string;
    code?: string;
    propertyName?: string;
  }): string | undefined;
}

const PROPERTY_TO_OPENEHR_GROUP: Readonly<Record<string, string>> = {
  setting: SETTING_GROUP,
  category: COMPOSITION_CATEGORY_GROUP,
  current_state: INSTRUCTION_STATES_GROUP,
  mode: PARTICIPATION_MODE_GROUP,
  null_flavour: NULL_FLAVOURS_GROUP,
  math_function: EVENT_MATH_FUNCTION_GROUP,
  change_type: AUDIT_CHANGE_TYPE_GROUP,
  reason: ATTESTATION_REASON_GROUP,
  relationship: SUBJECT_RELATIONSHIP_GROUP,
  purpose: TERM_MAPPING_PURPOSE_GROUP,
};

function langVariants(lang: string): string[] {
  const exact = lang.trim().toLowerCase();
  if (!exact) return [];
  const base = exact.split(/[-_]/)[0];
  return base && base !== exact ? [exact, base] : [exact];
}

function l10nFromPresentation(
  presentation: OptPresentationByPath | undefined,
  lang: string,
): string | undefined {
  if (!presentation?.annotations) return undefined;
  const names = extractL10nNames(presentation.annotations);
  for (const key of langVariants(lang)) {
    const found = names[key];
    if (found) return found;
  }
  return undefined;
}

/** Strict language slice of a term table — never falls back to another language. */
function strictLangBag(
  table: TermDefinitionTable | Record<string, TermBag> | undefined,
  lang: string,
): TermBag | undefined {
  if (!table || typeof table !== "object") return undefined;
  const variants = langVariants(lang);
  for (const key of variants) {
    if (table[key] && typeof table[key] === "object") return table[key];
  }
  for (const [k, bag] of Object.entries(table)) {
    const kl = k.toLowerCase();
    if (variants.includes(kl) && bag && typeof bag === "object") return bag;
  }
  return undefined;
}

/** Look up a code in one language bag, bridging ADL 1.4 `atNNNN` ↔ ADL2 `idN`. */
function lookupCodeInBag(bag: TermBag | undefined, code: string): string | undefined {
  if (!bag || !code) return undefined;
  const direct = lookupTermEntryInBag(bag, code)?.text;
  if (direct) return direct;
  if (/^at\d/i.test(code)) {
    const asId = adl14AtToId(code);
    if (asId !== code) {
      const fromId = lookupTermEntryInBag(bag, asId)?.text;
      if (fromId) return fromId;
    }
  } else if (/^id\d/i.test(code)) {
    const asAt = idToAtCode(code);
    if (asAt && asAt !== code) {
      const fromAt = lookupTermEntryInBag(bag, asAt)?.text;
      if (fromAt) return fromAt;
    }
  }
  return undefined;
}

function stripArchetypeVersion(id: string): string {
  return id.replace(/\.v[\d.]+$/, "");
}

function findScopedTables(
  scoped: Record<string, TermDefinitionTable>,
  archetypeId: string,
): TermDefinitionTable[] {
  const out: TermDefinitionTable[] = [];
  const seen = new Set<string>();
  const addKey = (key: string) => {
    if (seen.has(key) || !scoped[key]) return;
    seen.add(key);
    out.push(scoped[key]);
  };
  addKey(archetypeId);
  const base = stripArchetypeVersion(archetypeId);
  for (const key of Object.keys(scoped)) {
    const keyBase = stripArchetypeVersion(key.replace(/#\d+$/, ""));
    if (keyBase === base) addKey(key);
  }
  for (const parentKey of overlayParentScopes(archetypeId, Object.keys(scoped))) {
    addKey(parentKey);
  }
  return out;
}

function archetypeTermTableFromRepo(
  repo: ArchetypeRepository | undefined,
  archetypeId: string,
): TermDefinitionTable | undefined {
  if (!repo) return undefined;
  const arch = repo.get(archetypeId);
  if (!arch) return undefined;
  const ontology = arch.ontology as
    | { term_definitions?: TermDefinitionTable }
    | undefined;
  return ontology?.term_definitions;
}

function rootArchetypeIdOfOpt(
  opt: openehr_am.OPERATIONAL_TEMPLATE | null | undefined,
): string | undefined {
  if (!opt) return undefined;
  const def = opt.definition as
    | { archetype_ref?: string; node_id?: string }
    | undefined;
  const aid = (opt as { archetype_id?: { value?: string } | string }).archetype_id;
  if (typeof aid === "string" && aid) return aid;
  if (aid && typeof aid === "object" && aid.value) return String(aid.value);
  return def?.archetype_ref;
}

export function createZipEhrDisplayLocalizer(options: {
  renderLang: string;
  operationalTemplate?: openehr_am.OPERATIONAL_TEMPLATE | null;
  archetypeRepository?: ArchetypeRepository;
}): ZipEhrDisplayLocalizer {
  const { renderLang, operationalTemplate, archetypeRepository } = options;
  const scopedTables: Record<string, TermDefinitionTable> = operationalTemplate
    ? termTablesByScope(
      operationalTemplate as unknown as OperationalTemplateWithTermScopes,
    )
    : {};
  const optRootTable = (
    operationalTemplate?.ontology as
      | { term_definitions?: TermDefinitionTable }
      | undefined
  )?.term_definitions;
  const optRootId = rootArchetypeIdOfOpt(operationalTemplate);

  const lookupArchetypeCode = (
    archetypeId: string | undefined,
    codes: string[],
  ): string | undefined => {
    if (!codes.length) return undefined;

    if (archetypeId) {
      // 1. OPT per-archetype term definitions (including occurrence scopes)
      for (const table of findScopedTables(scopedTables, archetypeId)) {
        const bag = strictLangBag(table, renderLang);
        for (const code of codes) {
          const text = lookupCodeInBag(bag, code);
          if (text) return text;
        }
      }

      // 2. ArchetypeRepository translations (e.g. multilingual .adl alongside monolingual OPT)
      const repoTable = archetypeTermTableFromRepo(
        archetypeRepository,
        archetypeId,
      );
      if (repoTable) {
        const bag = strictLangBag(repoTable, renderLang);
        for (const code of codes) {
          const text = lookupCodeInBag(bag, code);
          if (text) return text;
        }
      }
    }

    // 3. OPT root ontology term_definitions when scope matches root (or no scope)
    if (
      optRootTable &&
      (!archetypeId || !optRootId ||
        stripArchetypeVersion(archetypeId) === stripArchetypeVersion(optRootId))
    ) {
      const bag = strictLangBag(optRootTable, renderLang);
      for (const code of codes) {
        const text = lookupCodeInBag(bag, code);
        if (text) return text;
      }
    }

    return undefined;
  };

  return {
    renderLang,

    localizeLocatableName({
      presentation,
      archetypeId,
      nodeId,
      isArchetypeRoot,
    }): string | undefined {
      // 1. Template L10n path annotations
      const fromL10n = l10nFromPresentation(presentation, renderLang);
      if (fromL10n) return fromL10n;

      // 2. Archetype / OPT term definitions
      const codes: string[] = [];
      if (isArchetypeRoot) {
        if (nodeId && /^(?:at|id)\d/i.test(nodeId)) codes.push(nodeId);
        const repoArch = archetypeId
          ? archetypeRepository?.get(archetypeId)
          : undefined;
        const concept = repoArch?.concept ? String(repoArch.concept) : undefined;
        if (concept && !codes.includes(concept)) codes.push(concept);
        if (!codes.includes("at0000")) codes.push("at0000");
        if (!codes.includes("id1")) codes.push("id1");
      } else if (nodeId && /^(?:at|id)\d/i.test(nodeId)) {
        codes.push(nodeId);
      }

      return lookupArchetypeCode(archetypeId, codes);
    },

    localizeCodedText({
      presentation,
      archetypeId,
      terminology,
      code,
      propertyName,
    }): string | undefined {
      // 1. Template L10n path annotations (e.g. /category, /context/setting)
      const fromL10n = l10nFromPresentation(presentation, renderLang);
      if (fromL10n) return fromL10n;

      const termLower = terminology?.trim().toLowerCase();

      // 2. Local archetype coded values (`local::atNNNN` / `local::idN`)
      if (
        code &&
        (!termLower || termLower === "local") &&
        /^(?:at|id)\d/i.test(code)
      ) {
        const fromArch = lookupArchetypeCode(archetypeId, [code]);
        if (fromArch) return fromArch;
      }

      // 3. openEHR internal terminology (`openehr::NNN`)
      if (code && termLower === "openehr") {
        const groupHint = propertyName
          ? PROPERTY_TO_OPENEHR_GROUP[propertyName]
          : undefined;
        const fromOpenEhr = localizedOpenEhrRubric(code, renderLang, groupHint);
        if (fromOpenEhr) return fromOpenEhr;
      }

      return undefined;
    },
  };
}
