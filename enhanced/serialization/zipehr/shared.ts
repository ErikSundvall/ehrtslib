/** Shared utilities for zipehr conversion (ported from zipehr-shared.js). */

/** Terminology prefix → emoji (applied to terse CODE_PHRASE / DV_CODED_TEXT strings). */
export const TERMINOLOGY_SHORTCUTS = Object.freeze([
  { prefix: "openehr::", emoji: "🌬️" },
  { prefix: "local::", emoji: "📍" },
  { prefix: "ISO_639-1::", emoji: "💬" },
  { prefix: "ISO_3166-1::", emoji: "🌐" },
  { prefix: "IANA_character-sets::", emoji: "🔤" },
]);

/** RM property → emoji when promoted from nested CODE_PHRASE to parent row. */
export const TERMINOLOGY_FIELD_PROMOTIONS = Object.freeze([
  { field: "language", prefix: "ISO_639-1::", emoji: "💬" },
  { field: "territory", prefix: "ISO_3166-1::", emoji: "🌐" },
  { field: "encoding", prefix: "IANA_character-sets::", emoji: "🔤" },
]);

/** ARCHETYPE_DETAILS child → inline emoji key. */
export const ARCHETYPE_DETAIL_SYMBOLS = Object.freeze({
  template_id: "Ⓣ",
  archetype_id: "Ⓐ",
  rm_version: "⚙️",
});

export const POLYMORPHIC_TYPES = new Set([
  "DATA_VALUE",
  "DV_ORDERED",
  "DV_TEXT",
  "ITEM",
  "ITEM_STRUCTURE",
  "EVENT",
  "LOCATABLE",
  "CONTENT_ITEM",
  "CARE_ENTRY",
  "ENTRY",
  "SECTION",
  "PATHABLE",
  "PARTY_IDENTIFIED",
  "PARTY_PROXY",
  "DV_ENCAPSULATED",
]);

export const PROPERTY_TYPE_MAP: Record<
  string,
  Record<string, string>
> = {
  COMPOSITION: {
    name: "DV_TEXT",
    language: "CODE_PHRASE",
    category: "DV_CODED_TEXT",
    territory: "CODE_PHRASE",
    context: "EVENT_CONTEXT",
    content: "CONTENT_ITEM",
    uid: "OBJECT_VERSION_ID",
    feeder_audit: "FEEDER_AUDIT",
    composer: "PARTY_PROXY",
  },
  DV_CODED_TEXT: { defining_code: "CODE_PHRASE" },
  CODE_PHRASE: { terminology_id: "TERMINOLOGY_ID" },
  FEEDER_AUDIT: {
    original_content: "DV_ENCAPSULATED",
    originating_system_audit: "FEEDER_AUDIT_DETAILS",
    feeder_system_audit: "FEEDER_AUDIT_DETAILS",
  },
  FEEDER_AUDIT_DETAILS: {
    subject: "PARTY_PROXY",
    provider: "PARTY_PROXY",
    location: "PARTY_IDENTIFIED",
  },
  OBSERVATION: {
    name: "DV_TEXT",
    language: "CODE_PHRASE",
    data: "HISTORY",
    feeder_audit: "FEEDER_AUDIT",
  },
  ELEMENT: {
    name: "DV_TEXT",
    value: "DATA_VALUE",
    feeder_audit: "FEEDER_AUDIT",
  },
  CLUSTER: { name: "DV_TEXT", items: "ITEM", feeder_audit: "FEEDER_AUDIT" },
  HISTORY: { name: "DV_TEXT", origin: "DV_DATE_TIME" },
  POINT_EVENT: {
    name: "DV_TEXT",
    time: "DV_DATE_TIME",
    data: "ITEM_STRUCTURE",
  },
  EVENT_CONTEXT: {
    start_time: "DV_DATE_TIME",
    setting: "DV_CODED_TEXT",
    other_context: "ITEM_STRUCTURE",
  },
  ITEM_TREE: { name: "DV_TEXT", items: "ITEM" },
  ITEM_LIST: { name: "DV_TEXT", items: "ITEM" },
  ITEM_TABLE: { name: "DV_TEXT", rows: "ITEM_TABLE_ROW" },
  ITEM_SINGLE: { name: "DV_TEXT", item: "ITEM" },
  SECTION: { name: "DV_TEXT", items: "CONTENT_ITEM" },
  ENTRY: {
    name: "DV_TEXT",
    language: "CODE_PHRASE",
    encoding: "CODE_PHRASE",
    subject: "PARTY_PROXY",
    provider: "PARTY_PROXY",
    feeder_audit: "FEEDER_AUDIT",
  },
  CARE_ENTRY: {
    name: "DV_TEXT",
    protocol: "ITEM_STRUCTURE",
    feeder_audit: "FEEDER_AUDIT",
  },
  EVALUATION: {
    name: "DV_TEXT",
    language: "CODE_PHRASE",
    data: "ITEM_STRUCTURE",
    feeder_audit: "FEEDER_AUDIT",
  },
  INSTRUCTION: {
    name: "DV_TEXT",
    language: "CODE_PHRASE",
    narrative: "DV_TEXT",
    expiry_time: "DV_DATE_TIME",
    wf_definition: "DV_PARSABLE",
    feeder_audit: "FEEDER_AUDIT",
  },
  ACTION: {
    name: "DV_TEXT",
    language: "CODE_PHRASE",
    time: "DV_DATE_TIME",
    description: "ITEM_STRUCTURE",
    feeder_audit: "FEEDER_AUDIT",
  },
  ADMIN_ENTRY: {
    name: "DV_TEXT",
    language: "CODE_PHRASE",
    data: "ITEM_STRUCTURE",
    feeder_audit: "FEEDER_AUDIT",
  },
  INTERVAL_EVENT: {
    name: "DV_TEXT",
    time: "DV_DATE_TIME",
    width: "DV_DURATION",
    data: "ITEM_STRUCTURE",
  },
  DV_TEXT: { language: "CODE_PHRASE", encoding: "CODE_PHRASE" },
  DV_ORDERED: {
    normal_status: "CODE_PHRASE",
    normal_range: "REFERENCE_RANGE",
  },
  DV_QUANTITY: { accuracy: "DV_AMOUNT" },
  DV_ENCAPSULATED: { charset: "CODE_PHRASE", language: "CODE_PHRASE" },
};

/** LOCATABLE-owned properties inferred for any LOCATABLE subtype parent. */
export const LOCATABLE_PROPERTY_TYPES: Record<string, string> = {
  name: "DV_TEXT",
  feeder_audit: "FEEDER_AUDIT",
  uid: "OBJECT_VERSION_ID",
};

/** RM types that inherit LOCATABLE attributes (for {@link inferrablePropertyType}). */
export const LOCATABLE_LIKE_TYPES = new Set([
  "LOCATABLE",
  "CONTENT_ITEM",
  "ENTRY",
  "CARE_ENTRY",
  "SECTION",
  "ADMIN_ENTRY",
  "OBSERVATION",
  "EVALUATION",
  "INSTRUCTION",
  "ACTION",
  "DATA_STRUCTURE",
  "ITEM_STRUCTURE",
  "ITEM_TREE",
  "ITEM_LIST",
  "ITEM_TABLE",
  "ITEM_SINGLE",
  "ITEM",
  "CLUSTER",
  "ELEMENT",
  "HISTORY",
  "EVENT",
  "POINT_EVENT",
  "INTERVAL_EVENT",
  "ACTIVITY",
  "COMPOSITION",
]);

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

export function shortenTerseString(str: string): string {
  if (typeof str !== "string") return str;
  for (const { prefix, emoji } of TERMINOLOGY_SHORTCUTS) {
    if (str.startsWith(prefix)) {
      return emoji + str.slice(prefix.length);
    }
  }
  return str;
}

export function expandTerseString(str: string): string {
  if (typeof str !== "string") return str;
  for (const { prefix, emoji } of TERMINOLOGY_SHORTCUTS) {
    if (str.startsWith(emoji)) {
      return prefix + str.slice(emoji.length);
    }
  }
  return str;
}

export function inferFromStructure(data: unknown): string | undefined {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return undefined;
  }
  const props = Object.keys(data);
  const obj = data as Record<string, unknown>;
  if (props.includes("value") && props.includes("defining_code")) {
    return "DV_CODED_TEXT";
  }
  if (props.includes("terminology_id") && props.includes("code_string")) {
    return "CODE_PHRASE";
  }
  if (props.includes("magnitude") && props.includes("units")) {
    return "DV_QUANTITY";
  }
  if (props.includes("magnitude") && !props.includes("units")) {
    return "DV_COUNT";
  }
  if (
    props.includes("value") && typeof obj.value === "boolean"
  ) return "DV_BOOLEAN";
  if (
    props.includes("value") && typeof obj.value === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(obj.value as string)
  ) return "DV_DATE_TIME";
  if (
    props.includes("value") && !props.includes("defining_code") &&
    !props.includes("magnitude")
  ) return "DV_TEXT";
  if (
    props.length === 1 && props.includes("value") &&
    typeof obj.value === "string"
  ) return "TERMINOLOGY_ID";
  if (props.includes("category") && props.includes("archetype_node_id")) {
    return "COMPOSITION";
  }
  if (props.includes("data") && props.includes("archetype_node_id")) {
    return "OBSERVATION";
  }
  return undefined;
}

export function inferType(
  propertyName: string,
  parentType: string | undefined,
  data: unknown,
): string | undefined {
  const parentMap = parentType && PROPERTY_TYPE_MAP[parentType];
  const defaultType = parentMap && parentMap[propertyName];
  if (defaultType && !POLYMORPHIC_TYPES.has(defaultType)) return defaultType;
  const fromStructure = inferFromStructure(data);
  if (fromStructure) return fromStructure;
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const typed = data as { _type?: string };
    if (typed._type) return typed._type;
  }
  return defaultType;
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
  return typeof str === "string" && /^[^:]+::[^|]+$/.test(str);
}

export function isTerseDvCodedText(str: string): boolean {
  return typeof str === "string" && /^[^:]+::[^|]+\|[^|]*\|$/.test(str);
}

export function parseTerseDvCodedText(
  terse: string,
): { termId: string; code: string; value: string } | null {
  const match = terse.match(/^([^:]+)::([^|]+)\|([^|]*)\|$/);
  if (!match) return null;
  return { termId: match[1], code: match[2], value: match[3] };
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
): string | null {
  const terse = extractWrappedTerseString(fieldValue);
  if (terse == null) return null;
  return stripKnownTerminologyCode(shortenTerseString(terse), prefix, emoji);
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
 * Emoji keys come from `table3.yaml` attribute rows via `symbolMap`.
 */
export function buildLocatableStructuredObject(
  nameStr: string,
  archetypeNodeId: string | null | undefined,
  archetypeDetails: unknown,
  symbolMap: Record<string, string>,
): Record<string, unknown> {
  const sym = locatableAttributeSymbols(symbolMap);
  const out: Record<string, unknown> = { [sym.name]: nameStr };

  const nodeId = archetypeNodeId != null ? String(archetypeNodeId) : undefined;

  let templateId: string | null = null;
  let archetypeId: string | null = null;
  let rmVersion: unknown = null;

  if (
    archetypeDetails && typeof archetypeDetails === "object" &&
    !Array.isArray(archetypeDetails)
  ) {
    const src = archetypeDetails as Record<string, unknown>;
    templateId = extractWrappedTerseString(src.template_id) ??
      (src[sym.templateId] != null ? String(src[sym.templateId]) : null);
    archetypeId = extractWrappedTerseString(src.archetype_id) ??
      (src[sym.archetypeId] != null ? String(src[sym.archetypeId]) : null);
    rmVersion = src.rm_version ?? src[sym.rmVersion];
  }

  const hasDetailSymbols = templateId != null || archetypeId != null ||
    (rmVersion != null && String(rmVersion) !== "");

  if (templateId != null) out[sym.templateId] = templateId;
  if (archetypeId != null && archetypeId !== nameStr) {
    out[sym.archetypeId] = archetypeId;
  }
  if (rmVersion != null && String(rmVersion) !== "") {
    out[sym.rmVersion] = String(rmVersion);
  }

  if (!hasDetailSymbols) {
    if (nodeId != null && nodeId !== "") out[sym.nodeId] = nodeId;
    return out;
  }

  if (nodeId != null && nodeId !== "") {
    if (archetypeId == null || nodeId !== archetypeId) out[sym.nodeId] = nodeId;
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

  const details: Record<string, unknown> = {};
  if (structured[sym.templateId] != null) {
    details[sym.templateId] = structured[sym.templateId];
  }
  if (structured[sym.archetypeId] != null) {
    details[sym.archetypeId] = structured[sym.archetypeId];
  } else if (
    structured[sym.templateId] != null || structured[sym.rmVersion] != null
  ) {
    details[sym.archetypeId] = name;
  }
  if (structured[sym.rmVersion] != null) {
    details[sym.rmVersion] = structured[sym.rmVersion];
  }

  let archetypeNodeId: string | undefined;
  if (structured[sym.nodeId] != null) {
    archetypeNodeId = String(structured[sym.nodeId]);
  } else if (details[sym.archetypeId] != null) {
    archetypeNodeId = String(details[sym.archetypeId]);
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
  let expected = PROPERTY_TYPE_MAP[parentType]?.[propertyName];
  if (!expected && LOCATABLE_LIKE_TYPES.has(parentType)) {
    expected = LOCATABLE_PROPERTY_TYPES[propertyName];
  }
  if (!expected || POLYMORPHIC_TYPES.has(expected)) return undefined;
  return expected;
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
