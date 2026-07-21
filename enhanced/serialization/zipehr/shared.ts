/** Shared utilities for zipehr conversion (ported from zipehr-shared.js). */

import { isDataValueType as metaIsDataValueType } from "../../meta/mod.ts";
import { TypeInferenceEngine } from "../common/type_inference.ts";
import {
  isTerseCodePhraseString,
  isTerseDvCodedTextString,
  matchTerseDvCodedText,
} from "../../terse_strings.ts";
import {
  MAGNITUDE_STATUS_EXACT_RM,
  MAGNITUDE_STATUS_OPERATORS,
  TERMINOLOGY_FIELD_PROMOTIONS,
  TERMINOLOGY_SHORTCUTS,
} from "./symbol_table.ts";

export {
  MAGNITUDE_STATUS_EXACT_RM,
  MAGNITUDE_STATUS_OPERATORS,
  TERMINOLOGY_FIELD_PROMOTIONS,
  TERMINOLOGY_SHORTCUTS,
};

/** ARCHETYPE_DETAILS child → inline emoji key. */
export const ARCHETYPE_DETAIL_SYMBOLS = Object.freeze({
  template_id: "Ⓣ",
  archetype_id: "Ⓐ",
  rm_version: "⚙️",
});

/**
 * Wire marker meaning “archetype_id equals archetype_node_id” (do not repeat the
 * long id). JSON/YAML use boolean `true`; HTML5 uses a valueless attribute.
 */
export const ARCHETYPE_ID_SAME_AS_NODE_ID = true;

/** True when `Ⓐ` / `a` / `archetype-id` is the “same as node id” flag. */
export function isArchetypeIdSameAsNodeIdFlag(value: unknown): boolean {
  return value === true || value === ARCHETYPE_ID_SAME_AS_NODE_ID ||
    value === "" || value === "true";
}

/**
 * How (X)HTML formats emit openEHR RM property names (`context`, `start_time`, …).
 * - `omit` — only when the parent slot is ambiguous (type→property not unique)
 * - `attribute` — always as an attribute (`p`/`property` in html5; XHTML puts the
 *   name at the start of `title` as `prop — …`, not in `class`)
 * - `comment` — always as a compact `<!--prop-->` before the element (ambiguous slots
 *   still also get the attribute so round-trip stays lossless)
 */
export type RmPropertyEmitMode = "omit" | "attribute" | "comment";

/** Emit the machine-readable property attribute for this mode? */
export function shouldEmitPropertyAttribute(
  mode: RmPropertyEmitMode,
  ambiguous: boolean,
): boolean {
  if (mode === "attribute") return true;
  return ambiguous;
}

/** Emit a human-visible `<!--prop-->` before the element for this mode? */
export function shouldEmitPropertyComment(mode: RmPropertyEmitMode): boolean {
  return mode === "comment";
}

/** Compact HTML comment for an RM property name (`<!--start_time-->`). */
export function formatPropertyComment(propertyName: string): string {
  const safe = propertyName.replace(/--/g, "‑‑");
  return `<!--${safe}-->`;
}

/** Property → type map for a parent RM class (BMM-backed). */
export function propertyTypesFor(
  parentType: string,
): Record<string, string> {
  return TypeInferenceEngine.getPropertyTypeMap(parentType);
}

export function isPolymorphicType(typeName: string): boolean {
  return TypeInferenceEngine.isPolymorphic(typeName);
}

/**
 * True when several parent properties share the same child RM type
 * (e.g. OBSERVATION `data` / `state` both HISTORY / ITEM_STRUCTURE).
 */
export function propertySlotAmbiguous(
  parentType: string | undefined,
  childType: string,
  propertyName: string,
): boolean {
  if (!parentType) return false;
  const map = TypeInferenceEngine.getPropertyTypeMap(parentType);
  const matches = Object.entries(map).filter(([, t]) => t === childType);
  if (matches.length <= 1) return false;
  return !matches.some(([p]) => p === propertyName) || matches.length > 1;
}

/** Whether `rmType` is a LOCATABLE (or subtype). */
export function isLocatableLike(rmType: string): boolean {
  return TypeInferenceEngine.isLocatableLike(rmType);
}

/**
 * Technical identifier types with a single string `value` (not clinician-facing).
 * In xhtml/html5: store in `title` (or equivalent machine attr), not element text.
 */
export const TECHNICAL_ID_TYPES = new Set([
  "OBJECT_VERSION_ID",
  "ARCHETYPE_ID",
  "TEMPLATE_ID",
  "TERMINOLOGY_ID",
  "HIER_OBJECT_ID",
  "GENERIC_ID",
  "INTERNET_ID",
  "UUID",
]);

/**
 * Non-DATA_VALUE types ZipEHR still treats as value/leaf objects in HTML/XHTML.
 * (BMM `isDataValueType` is the primary check; these are documented extras.)
 */
const ZIPEHR_VALUE_EXTRAS = new Set([
  "CODE_PHRASE",
  "TERM_MAPPING",
  "REFERENCE_RANGE",
]);

/** DATA_VALUE or ZipEHR value extras (not technical IDs). */
export function isZipehrDataValueLike(rmType: string): boolean {
  return metaIsDataValueType(rmType) || ZIPEHR_VALUE_EXTRAS.has(rmType);
}

/** Leaf wire types for ZipEHR HTML5/XHTML (value objects + technical IDs). */
export function isZipehrLeafRmType(rmType: string): boolean {
  return isZipehrDataValueLike(rmType) || TECHNICAL_ID_TYPES.has(rmType);
}

/**
 * RM types that carry openEHR `language` (CODE_PHRASE, ISO_639-1).
 * Mapped to native HTML/XHTML `lang` in zipehr.xhtml / zipehr.html5.
 */
export const LANGUAGE_CARRIER_TYPES = new Set([
  "COMPOSITION",
  "ENTRY",
  "CARE_ENTRY",
  "OBSERVATION",
  "EVALUATION",
  "INSTRUCTION",
  "ACTION",
  "ADMIN_ENTRY",
]);

/** Extract an ISO 639 language code from a CODE_PHRASE object or terse string. */
export function extractLanguageCode(language: unknown): string | undefined {
  if (language == null) return undefined;
  if (typeof language === "string") {
    const trimmed = language.trim();
    if (!trimmed) return undefined;
    for (const { prefix, emoji } of TERMINOLOGY_SHORTCUTS) {
      if (!prefix.startsWith("ISO_639")) continue;
      if (trimmed.startsWith(prefix)) {
        return trimmed.slice(prefix.length) || undefined;
      }
      if (trimmed.startsWith(emoji)) {
        return trimmed.slice(emoji.length) || undefined;
      }
    }
    if (trimmed.startsWith("ISO_639-1::")) {
      return trimmed.slice("ISO_639-1::".length) || undefined;
    }
    // Already a bare code (e.g. from HTML `lang`)
    if (!trimmed.includes("::")) return trimmed;
    const m = trimmed.match(/::([^:]+)$/);
    return m?.[1];
  }
  if (typeof language !== "object" || Array.isArray(language)) return undefined;
  const phrase = language as Record<string, unknown>;
  if (phrase.code_string != null) return String(phrase.code_string);
  if (phrase.code != null) return String(phrase.code);
  // Lettercode ZipEHR wrapper: { C: "ISO_639-1::sv" } or similar
  const wrapped = extractWrappedTerseString(language);
  if (wrapped) return extractLanguageCode(wrapped);
  return undefined;
}

/** Build a canonical CODE_PHRASE for an ISO 639-1 language code. */
export function languageCodePhrase(code: string): Record<string, unknown> {
  return {
    _type: "CODE_PHRASE",
    terminology_id: { _type: "TERMINOLOGY_ID", value: "ISO_639-1" },
    code_string: code,
  };
}

/** Terse lettercode ZipEHR form of a language CODE_PHRASE. */
export function languageTerseString(code: string): string {
  return `ISO_639-1::${code}`;
}

export function loadSymbolMapFromText(text: string): Record<string, string> {
  const lines = text.split(/\r?\n/).filter((l) => !/^\s*#/.test(l));
  const cleaned = lines.join("\n");
  const map: Record<string, string> = Object.create(null);
  const re = /([A-Za-z0-9_]+)\s*:\s*\[\s*["']([^"']+)["']/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(cleaned)) !== null) {
    const key = m[1];
    const firstSymbol = m[2];
    map[key] = firstSymbol;
    map[key.toUpperCase()] = firstSymbol;
    map[key.toLowerCase()] = firstSymbol;
  }
  return map;
}

export function getSymbolFor(
  map: Record<string, string>,
  className: string,
): string | undefined {
  if (!className) return undefined;
  if (map[className]) return map[className];
  if (map[className.toUpperCase()]) return map[className.toUpperCase()];
  if (map[className.toLowerCase()]) return map[className.toLowerCase()];
  return undefined;
}

export function shouldUseTerminologyShortcuts(
  symbolMap?: Record<string, string>,
): boolean {
  if (!symbolMap) return true;
  const sym = getSymbolFor(symbolMap, "COMPOSITION");
  return sym != null && isSymbolKey(sym);
}

export function shortenTerseString(
  str: string,
  symbolMap?: Record<string, string>,
): string {
  if (typeof str !== "string") return str;
  if (!shouldUseTerminologyShortcuts(symbolMap)) return str;
  for (const { prefix, emoji } of TERMINOLOGY_SHORTCUTS) {
    if (str.startsWith(prefix)) {
      return emoji + str.slice(prefix.length);
    }
  }
  return str;
}

export function expandTerseString(
  str: string,
  symbolMap?: Record<string, string>,
): string {
  if (typeof str !== "string") return str;
  if (!shouldUseTerminologyShortcuts(symbolMap)) return str;
  for (const { prefix, emoji } of TERMINOLOGY_SHORTCUTS) {
    if (str.startsWith(emoji)) {
      return prefix + str.slice(emoji.length);
    }
  }
  return str;
}

export function inferFromStructure(data: unknown): string | undefined {
  return TypeInferenceEngine.inferFromStructure(data);
}

export function inferType(
  propertyName: string,
  parentType: string | undefined,
  data: unknown,
): string | undefined {
  if (parentType) {
    const inferred = TypeInferenceEngine.inferType(
      propertyName,
      parentType,
      data,
    );
    if (inferred) return inferred;
  }
  const fromStructure = TypeInferenceEngine.inferFromStructure(data);
  if (fromStructure) return fromStructure;
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const typed = data as { _type?: string };
    if (typed._type) return typed._type;
  }
  return undefined;
}

export function resolveType(
  obj: unknown,
  parentType: string | undefined,
  propertyName: string | undefined,
): string | undefined {
  if (obj && typeof obj === "object" && !Array.isArray(obj)) {
    const typed = obj as { _type?: string };
    if (typed._type) return typed._type;
  }
  return inferType(propertyName ?? "", parentType, obj);
}

export function isTerseCodePhrase(str: string): boolean {
  return isTerseCodePhraseString(str);
}

export function isTerseDvCodedText(str: string): boolean {
  return isTerseDvCodedTextString(str);
}

export function parseTerseDvCodedText(
  terse: string,
): { termId: string; code: string; value: string } | null {
  return matchTerseDvCodedText(terse);
}

export function extractWrappedTerseString(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === "string") return v;
  if (typeof v !== "object" || Array.isArray(v)) return null;
  const obj = v as Record<string, unknown>;
  if (Object.prototype.hasOwnProperty.call(obj, "value")) {
    const nonTypeKeys = Object.keys(obj).filter((key) =>
      key !== "_type" && key !== "_"
    );
    if (nonTypeKeys.length === 1) {
      return obj.value == null ? null : String(obj.value);
    }
  }
  const keys = Object.keys(obj);
  if (keys.length === 1) {
    const inner = obj[keys[0]];
    if (typeof inner === "string") return inner;
  }
  return null;
}

export function stripKnownTerminologyCode(
  terseStr: string,
  prefix: string,
  emoji?: string,
): string | null {
  if (typeof terseStr !== "string") return null;
  if (terseStr.startsWith(prefix)) return terseStr.slice(prefix.length);
  if (emoji && terseStr.startsWith(emoji)) return terseStr.slice(emoji.length);
  return null;
}

export function extractTerminologyFieldCode(
  fieldValue: unknown,
  prefix: string,
  emoji: string,
  symbolMap?: Record<string, string>,
): string | null {
  const terse = extractWrappedTerseString(fieldValue);
  if (terse == null) return null;
  return stripKnownTerminologyCode(
    shortenTerseString(terse, symbolMap),
    prefix,
    emoji,
  );
}

export function compactArchetypeDetails(
  details: unknown,
): Record<string, unknown> | unknown {
  if (!details || typeof details !== "object" || Array.isArray(details)) {
    return details;
  }
  const src = details as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  const templateId = extractWrappedTerseString(src.template_id);
  const archetypeId = extractWrappedTerseString(src.archetype_id);
  const rmVersion = src.rm_version;
  if (templateId != null) {
    out[ARCHETYPE_DETAIL_SYMBOLS.template_id] = templateId;
  }
  if (archetypeId != null) {
    out[ARCHETYPE_DETAIL_SYMBOLS.archetype_id] = archetypeId;
  }
  if (rmVersion != null && rmVersion !== "") {
    out[ARCHETYPE_DETAIL_SYMBOLS.rm_version] = rmVersion;
  }
  return Object.keys(out).length > 0 ? out : details;
}

/** Extract compact archetype-detail symbols from a canonical or compact details object. */
export function extractCompactArchetypeDetails(
  details: unknown,
): Record<string, string> {
  const compacted = compactArchetypeDetails(details);
  if (!compacted || typeof compacted !== "object" || Array.isArray(compacted)) {
    return {};
  }
  const src = compacted as Record<string, unknown>;
  const out: Record<string, string> = {};
  const tSym = ARCHETYPE_DETAIL_SYMBOLS.template_id;
  const aSym = ARCHETYPE_DETAIL_SYMBOLS.archetype_id;
  const rSym = ARCHETYPE_DETAIL_SYMBOLS.rm_version;
  if (src[tSym] != null) out[tSym] = String(src[tSym]);
  if (src[aSym] != null) out[aSym] = String(src[aSym]);
  if (src[rSym] != null) out[rSym] = String(src[rSym]);
  return out;
}

function locatableAttributeSymbols(
  symbolMap: Record<string, string>,
): {
  name: string;
  nodeId: string;
  templateId: string;
  archetypeId: string;
  rmVersion: string;
} {
  return {
    name: getSymbolFor(symbolMap, "LOCATABLE.name") ?? "🪧",
    nodeId: getSymbolFor(symbolMap, "LOCATABLE.archetype_node_id") ?? "🆔",
    templateId: getSymbolFor(symbolMap, "ARCHETYPED.template_id") ??
      ARCHETYPE_DETAIL_SYMBOLS.template_id,
    archetypeId: getSymbolFor(symbolMap, "ARCHETYPED.archetype_id") ??
      ARCHETYPE_DETAIL_SYMBOLS.archetype_id,
    rmVersion: getSymbolFor(symbolMap, "ARCHETYPED.rm_version") ??
      ARCHETYPE_DETAIL_SYMBOLS.rm_version,
  };
}

/**
 * Build a structured LOCATABLE object (JSON/YAML-library-friendly).
 * Emoji keys come from `symbol_table.yaml` attribute rows via `symbolMap`.
 *
 * `🆔` is always the path node id. When `archetype_id` equals that id, emit
 * `Ⓐ: true` (HTML: valueless `Ⓐ`) instead of repeating the string.
 */
export function buildLocatableStructuredObject(
  nameStr: string,
  archetypeNodeId: string | null | undefined,
  archetypeDetails: unknown,
  symbolMap: Record<string, string>,
): Record<string, unknown> {
  const sym = locatableAttributeSymbols(symbolMap);
  const out: Record<string, unknown> = { [sym.name]: nameStr };

  let templateId: string | null = null;
  let archetypeId: string | null = null;
  let rmVersion: unknown = null;
  let archetypeIdIsFlag = false;

  if (
    archetypeDetails && typeof archetypeDetails === "object" &&
    !Array.isArray(archetypeDetails)
  ) {
    const src = archetypeDetails as Record<string, unknown>;
    templateId = extractWrappedTerseString(src.template_id) ??
      (src[sym.templateId] != null ? String(src[sym.templateId]) : null);
    rmVersion = src.rm_version ?? src[sym.rmVersion];

    if (isArchetypeIdSameAsNodeIdFlag(src[sym.archetypeId])) {
      archetypeIdIsFlag = true;
    } else {
      archetypeId = extractWrappedTerseString(src.archetype_id) ??
        (src[sym.archetypeId] != null
          ? String(src[sym.archetypeId])
          : null);
    }
  }

  const nodeId = archetypeNodeId != null && String(archetypeNodeId) !== ""
    ? String(archetypeNodeId)
    : undefined;

  if (archetypeIdIsFlag && archetypeId == null) {
    archetypeId = nodeId ?? null;
  }

  const effectiveNodeId = nodeId ??
    (archetypeId != null ? archetypeId : undefined);

  if (templateId != null) out[sym.templateId] = templateId;
  if (effectiveNodeId != null) out[sym.nodeId] = effectiveNodeId;

  if (archetypeId != null && archetypeId !== nameStr) {
    if (effectiveNodeId != null && archetypeId === effectiveNodeId) {
      out[sym.archetypeId] = ARCHETYPE_ID_SAME_AS_NODE_ID;
    } else {
      out[sym.archetypeId] = archetypeId;
    }
  }

  if (rmVersion != null && String(rmVersion) !== "") {
    out[sym.rmVersion] = String(rmVersion);
  }

  return out;
}

export function isLocatableStructuredObject(
  value: unknown,
  symbolMap: Record<string, string>,
): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const nameSym = locatableAttributeSymbols(symbolMap).name;
  return Object.prototype.hasOwnProperty.call(value, nameSym);
}

/**
 * Detect a structured LOCATABLE metadata object without a symbol map.
 * Used by hybrid formatters so name / archetype-detail clusters always stay
 * on one line (emoji `🪧` or letter-code `na`).
 */
export function looksLikeLocatableStructuredObject(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const obj = value as Record<string, unknown>;
  if (!("🪧" in obj) && !("na" in obj)) return false;
  return Object.values(obj).every((v) =>
    v === null || v === undefined ||
    typeof v === "string" || typeof v === "number" || typeof v === "boolean"
  );
}

/** Inverse of {@link buildLocatableStructuredObject}. */
export function parseLocatableStructuredObject(
  structured: Record<string, unknown>,
  symbolMap: Record<string, string>,
): {
  name: string;
  archetypeNodeId?: string;
  archetypeDetails?: Record<string, unknown>;
} {
  const sym = locatableAttributeSymbols(symbolMap);
  const name = String(structured[sym.name] ?? "");
  const archetypeNodeId = structured[sym.nodeId] != null
    ? String(structured[sym.nodeId])
    : undefined;
  const aRaw = structured[sym.archetypeId];

  const details: Record<string, unknown> = {};
  if (structured[sym.templateId] != null) {
    details[sym.templateId] = structured[sym.templateId];
  }
  if (structured[sym.rmVersion] != null) {
    details[sym.rmVersion] = structured[sym.rmVersion];
  }

  let archetypeIdStr: string | undefined;
  if (isArchetypeIdSameAsNodeIdFlag(aRaw)) {
    archetypeIdStr = archetypeNodeId ?? name;
  } else if (aRaw != null && aRaw !== false) {
    archetypeIdStr = String(aRaw);
  } else if (
    structured[sym.templateId] != null || structured[sym.rmVersion] != null
  ) {
    archetypeIdStr = name;
  }

  if (archetypeIdStr != null) {
    details[sym.archetypeId] = archetypeIdStr;
  }

  return {
    name,
    archetypeNodeId,
    archetypeDetails: Object.keys(details).length > 0 ? details : undefined,
  };
}

export function extractFirstScalar(n: unknown): string | null {
  if (n === null) return null;
  if (
    typeof n === "string" || typeof n === "number" || typeof n === "boolean"
  ) {
    return String(n);
  }
  if (Array.isArray(n)) {
    for (const e of n) {
      const s = extractFirstScalar(e);
      if (s != null) return s;
    }
    return null;
  }
  if (typeof n === "object") {
    for (const k of Object.keys(n)) {
      const s = extractFirstScalar((n as Record<string, unknown>)[k]);
      if (s != null) return s;
    }
  }
  return null;
}

export function isSymbolKey(key: string): boolean {
  return /[^\x00-\x7F]/.test(key) || key === "_";
}

/** Property type from parent RM class when not polymorphic (`zipehr.yaml` type inference). */
export function inferrablePropertyType(
  parentType?: string,
  propertyName?: string,
): string | undefined {
  if (!parentType || !propertyName) return undefined;
  return TypeInferenceEngine.getInferrablePropertyType(
    parentType,
    propertyName,
  );
}

/** RM object reduced to a single `value` attribute (type marker may be present). */
export function isValueOnlyRmObject(obj: Record<string, unknown>): boolean {
  const keys = Object.keys(obj).filter((k) => k !== "_type");
  return keys.length === 1 && keys[0] === "value";
}

/** `zipehr.yaml`: fold `{ value: … }` to a bare scalar when parent property fixes the type. */
export function canFoldInferrableValueLeaf(
  typeName: string | undefined,
  parentType?: string,
  propertyName?: string,
): boolean {
  if (!typeName) return false;
  return inferrablePropertyType(parentType, propertyName) === typeName;
}
