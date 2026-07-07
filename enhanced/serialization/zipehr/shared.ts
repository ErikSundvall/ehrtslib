/** Shared utilities for zipehr conversion (ported from zipehr-shared.js). */

/** Terminology prefix → emoji (applied to terse CODE_PHRASE / DV_CODED_TEXT strings). */
export const TERMINOLOGY_SHORTCUTS = Object.freeze([
  { prefix: "openehr::", emoji: "🪟" },
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
  },
  DV_CODED_TEXT: { defining_code: "CODE_PHRASE" },
  CODE_PHRASE: { terminology_id: "TERMINOLOGY_ID" },
  OBSERVATION: { name: "DV_TEXT", language: "CODE_PHRASE", data: "HISTORY" },
  ELEMENT: { name: "DV_TEXT", value: "DATA_VALUE" },
  HISTORY: { name: "DV_TEXT", origin: "DV_DATE_TIME" },
  POINT_EVENT: {
    name: "DV_TEXT",
    time: "DV_DATE_TIME",
    data: "ITEM_STRUCTURE",
  },
  EVENT_CONTEXT: { start_time: "DV_DATE_TIME", setting: "DV_CODED_TEXT" },
  ITEM_TREE: { name: "DV_TEXT", items: "ITEM" },
};

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

/**
 * Build the bracket suffix for a folded LOCATABLE name.
 * Template id, archetype id (when different from name), and rm version are inlined
 * with Ⓣ / Ⓐ / ⚙️ symbols. Plain archetype_node_id is kept when no details apply.
 */
export function buildLocatableBracket(
  nameStr: string,
  archetypeNodeId: string | null | undefined,
  archetypeDetails: unknown,
): string {
  const details = extractCompactArchetypeDetails(archetypeDetails);
  const templateId = details[ARCHETYPE_DETAIL_SYMBOLS.template_id];
  const archetypeId = details[ARCHETYPE_DETAIL_SYMBOLS.archetype_id];
  const rmVersion = details[ARCHETYPE_DETAIL_SYMBOLS.rm_version];
  const nodeId = archetypeNodeId != null && archetypeNodeId !== ""
    ? String(archetypeNodeId)
    : undefined;
  const hasDetailSymbols = templateId != null || archetypeId != null ||
    rmVersion != null;

  const parts: string[] = [];
  if (!hasDetailSymbols) {
    if (nodeId) parts.push(nodeId);
    return parts.join(" ");
  }

  if (templateId != null) {
    parts.push(`${ARCHETYPE_DETAIL_SYMBOLS.template_id} ${templateId}`);
  }
  if (archetypeId != null && archetypeId !== nameStr) {
    parts.push(`${ARCHETYPE_DETAIL_SYMBOLS.archetype_id} ${archetypeId}`);
  }
  if (rmVersion != null) {
    parts.push(`${ARCHETYPE_DETAIL_SYMBOLS.rm_version}${rmVersion}`);
  }
  if (nodeId && nodeId !== archetypeId) {
    parts.push(nodeId);
  }

  return parts.join(" ");
}

export function buildLocatableFoldedString(
  nameStr: string,
  archetypeNodeId: string | null | undefined,
  archetypeDetails: unknown,
): string {
  const bracket = buildLocatableBracket(nameStr, archetypeNodeId, archetypeDetails);
  if (!bracket) return nameStr;
  return `${nameStr}[${bracket}]`;
}

/** Parse `name[bracket]` locatable fold; returns null when not folded. */
export function parseLocatableFolded(
  value: string,
): { name: string; bracket: string } | null {
  const match = value.match(/^(.+)\[(.+)\]$/);
  if (!match) return null;
  return { name: match[1], bracket: match[2] };
}

/**
 * Parse bracket content produced by {@link buildLocatableBracket}.
 * When Ⓐ was omitted because it matched name, it is restored from the locatable name.
 */
export function parseLocatableBracket(
  bracket: string,
  locatableName: string,
): {
  archetypeNodeId?: string;
  archetypeDetails?: Record<string, unknown>;
} {
  const trimmed = bracket.trim();
  if (!trimmed) return {};

  const tSym = ARCHETYPE_DETAIL_SYMBOLS.template_id;
  const aSym = ARCHETYPE_DETAIL_SYMBOLS.archetype_id;
  const rSym = ARCHETYPE_DETAIL_SYMBOLS.rm_version;
  const symbols = [tSym, aSym, rSym];
  const hasAnySymbol = symbols.some((sym) => trimmed.includes(sym));

  if (!hasAnySymbol) {
    return { archetypeNodeId: trimmed };
  }

  type Token = { sym: string; start: number };
  const tokens: Token[] = [];
  for (const sym of symbols) {
    let idx = trimmed.indexOf(sym);
    while (idx !== -1) {
      tokens.push({ sym, start: idx });
      idx = trimmed.indexOf(sym, idx + sym.length);
    }
  }
  tokens.sort((a, b) => a.start - b.start);

  const details: Record<string, unknown> = {};
  let archetypeNodeId: string | undefined;

  if (tokens.length > 0 && tokens[0].start > 0) {
    const prefix = trimmed.slice(0, tokens[0].start).trim();
    if (prefix) archetypeNodeId = prefix;
  }

  for (let i = 0; i < tokens.length; i++) {
    const { sym, start } = tokens[i];
    const valueStart = start + sym.length;
    const valueEnd = i + 1 < tokens.length ? tokens[i + 1].start : trimmed.length;
    const value = trimmed.slice(valueStart, valueEnd).trim();
    if (sym === tSym) details[tSym] = value;
    else if (sym === aSym) details[aSym] = value;
    else if (sym === rSym) details[rSym] = value;
  }

  if (details[aSym] == null && (details[tSym] != null || details[rSym] != null)) {
    details[aSym] = locatableName;
  }

  if (details[aSym] != null && archetypeNodeId == null) {
    archetypeNodeId = String(details[aSym]);
  }

  return {
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
