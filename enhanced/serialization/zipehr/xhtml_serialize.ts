/**
 * Serialize letter-code ZipEHR trees and canonical JSON to FHIR-safe XHTML fragments.
 */

import { convertObjectDirect } from "./convert.ts";
import { toTerseCodePhrase, toTerseDvCodedText } from "./compact.ts";
import {
  extractCompactArchetypeDetails,
  extractFirstScalar,
  extractWrappedTerseString,
  expandTerseString,
  isLocatableStructuredObject,
  isSymbolKey,
  isTerseDvCodedText,
  PROPERTY_TYPE_MAP,
} from "./shared.ts";
import {
  getLetterCodeReverseMap,
  loadLetterCodeMap,
  rmTypeFromClass,
} from "./letter_codes.ts";
import {
  formatLocatableTitle,
  type LocatableTitleFields,
} from "./title_grammar.ts";

export const ZIPEHR_XHTML_VERSION_URI =
  "http://purl.org/ehrtslib/zipehr/xhtml/v1";

const FORBIDDEN_TAGS = new Set([
  "script",
  "link",
  "iframe",
  "object",
  "form",
  "head",
  "body",
]);

const HEADING_BY_TYPE: Record<string, string> = {
  COMPOSITION: "h2",
  SECTION: "h3",
  OBSERVATION: "h4",
  EVALUATION: "h4",
  INSTRUCTION: "h4",
  ACTION: "h4",
};

export type XhtmlSerializeOptions = {
  lang?: string;
};

export class UnsupportedZipehrXhtmlTypeError extends Error {
  constructor(rmType: string) {
    super(`ZipEHR XHTML v1 does not support RM type: ${rmType}`);
    this.name = "UnsupportedZipehrXhtmlTypeError";
  }
}

function escapeXmlText(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeXmlAttr(text: string): string {
  return escapeXmlText(text).replace(/"/g, "&quot;");
}

function assertSafeTagName(tag: string): void {
  if (FORBIDDEN_TAGS.has(tag.toLowerCase())) {
    throw new Error(`Forbidden XHTML tag: ${tag}`);
  }
}

function buildLocatableTitleFields(
  structured: Record<string, unknown>,
  letterMap: Record<string, string>,
): LocatableTitleFields {
  const nameSym = letterMap["LOCATABLE.name"] ?? "na";
  const nodeSym = letterMap["LOCATABLE.archetype_node_id"] ?? "id";
  const templateSym = letterMap["ARCHETYPED.template_id"] ?? "te";
  const archetypeSym = letterMap["ARCHETYPED.archetype_id"] ?? "ar";
  const rmSym = letterMap["ARCHETYPED.rm_version"] ?? "rm";

  const name = String(structured[nameSym] ?? "");
  const fields: LocatableTitleFields = {};

  if (structured[templateSym] != null) {
    fields.te = String(structured[templateSym]);
  }
  if (structured[archetypeSym] != null) {
    const archetypeId = String(structured[archetypeSym]);
    if (archetypeId !== name) fields.ar = archetypeId;
  }
  if (structured[rmSym] != null && String(structured[rmSym]) !== "") {
    fields.rm = String(structured[rmSym]);
  }
  if (structured[nodeSym] != null) {
    const nodeId = String(structured[nodeSym]);
    const archetypeId = structured[archetypeSym] != null
      ? String(structured[archetypeSym])
      : undefined;
    if (!archetypeId || nodeId !== archetypeId) {
      fields.id = nodeId;
    }
  }
  return fields;
}

function locatableName(
  structured: Record<string, unknown>,
  letterMap: Record<string, string>,
): string {
  const nameSym = letterMap["LOCATABLE.name"] ?? "na";
  return String(structured[nameSym] ?? "");
}

function formatDvQuantityTitle(value: unknown): string {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return String(value ?? "");
  }
  const obj = value as Record<string, unknown>;
  if (typeof obj.magnitude === "number" || typeof obj.magnitude === "string") {
    return `${obj.magnitude}|${obj.units ?? ""}|`;
  }
  if (typeof obj === "string") return obj;
  return expandTerseString(String(obj));
}

function formatDvQuantityDisplay(value: unknown): string {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return String(value ?? "");
  }
  const obj = value as Record<string, unknown>;
  const magnitude = obj.magnitude;
  const units = obj.units ?? "";
  if (magnitude == null) return String(value);
  return units ? `${magnitude} ${units}` : String(magnitude);
}

function formatValueTitle(
  rmType: string,
  value: unknown,
): string | undefined {
  if (value == null) return undefined;
  if (typeof value === "string") {
    const expanded = expandTerseString(value);
    if (rmType === "DV_TEXT" && expanded === value) return undefined;
    return expanded;
  }
  if (typeof value !== "object" || Array.isArray(value)) {
    return String(value);
  }
  const obj = value as Record<string, unknown>;
  switch (rmType) {
    case "DV_QUANTITY":
      return formatDvQuantityTitle(obj);
    case "DV_CODED_TEXT":
      return toTerseDvCodedText(obj);
    case "CODE_PHRASE":
      return toTerseCodePhrase(obj);
    case "DV_DATE_TIME":
    case "DV_DATE":
    case "DV_TIME":
    case "DV_TEXT":
    case "TERMINOLOGY_ID":
      return obj.value != null ? String(obj.value) : undefined;
    default:
      return undefined;
  }
}

function formatQuantityDisplayFromTerse(value: string): string | null {
  const match = value.match(/^([^|]+)\|([^|]*)\|?$/);
  if (!match) return null;
  const magnitude = match[1];
  const units = match[2];
  return units ? `${magnitude} ${units}` : magnitude;
}

function formatValueDisplay(rmType: string, value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") {
    if (rmType === "DV_QUANTITY") {
      const fromTerse = formatQuantityDisplayFromTerse(value);
      if (fromTerse) return fromTerse;
    }
    if (isTerseDvCodedText(expandTerseString(value))) {
      const match = expandTerseString(value).match(/^[^:]+::[^|]+\|([^|]*)\|$/);
      return match?.[1] ?? value;
    }
    return value;
  }
  if (typeof value !== "object" || Array.isArray(value)) {
    return String(value);
  }
  const obj = value as Record<string, unknown>;
  switch (rmType) {
    case "DV_QUANTITY":
      return formatDvQuantityDisplay(obj);
    case "DV_CODED_TEXT":
      return String(obj.value ?? "");
    case "DV_TEXT":
      return String(obj.value ?? "");
    case "CODE_PHRASE":
      return String(obj.code_string ?? obj.code ?? "");
    case "DV_DATE_TIME":
    case "DV_DATE":
    case "DV_TIME":
      return String(obj.value ?? "");
    case "DV_IDENTIFIER":
      return String(obj.id ?? obj.value ?? "");
    default:
      return extractFirstScalar(obj) ?? "";
  }
}

function renderValueSpan(
  rmType: string,
  classToken: string,
  value: unknown,
): string {
  const display = escapeXmlText(formatValueDisplay(rmType, value));
  const title = formatValueTitle(rmType, value);
  const titleAttr = title && title !== display
    ? ` title="${escapeXmlAttr(title)}"`
    : title && rmType !== "DV_TEXT"
    ? ` title="${escapeXmlAttr(title)}"`
    : "";
  return `<span class="${escapeXmlAttr(classToken)}"${titleAttr}>${display}</span>`;
}

function orderedChildKeys(
  rmType: string | undefined,
  keys: string[],
): string[] {
  if (!rmType) return keys;
  const preferred = PROPERTY_TYPE_MAP[rmType];
  if (!preferred) return keys;
  const order = Object.keys(preferred);
  const inOrder = order.filter((k) => keys.includes(k));
  const rest = keys.filter((k) => !order.includes(k));
  return [...inOrder, ...rest];
}

function isClassTokenKey(
  key: string,
  reverseMap: Map<string, string>,
): boolean {
  return reverseMap.has(key) || isSymbolKey(key);
}

function renderChildren(
  obj: Record<string, unknown>,
  rmType: string | undefined,
  letterMap: Record<string, string>,
  reverseMap: Map<string, string>,
): string {
  const keys = orderedChildKeys(
    rmType,
    Object.keys(obj).filter((k) => k !== "_" && !isClassTokenKey(k, reverseMap)),
  );
  return keys.map((key) =>
    renderZipehrNode(obj[key], rmType, key, letterMap, reverseMap)
  ).join("");
}

function renderLocatableDiv(
  classToken: string,
  rmType: string,
  structured: Record<string, unknown>,
  siblings: Record<string, unknown>,
  letterMap: Record<string, string>,
  reverseMap: Map<string, string>,
): string {
  const title = formatLocatableTitle(
    buildLocatableTitleFields(structured, letterMap),
  );
  const name = locatableName(structured, letterMap);
  const headingTag = HEADING_BY_TYPE[rmType];
  const heading = headingTag
    ? `<${headingTag}>${escapeXmlText(name)}</${headingTag}>`
    : "";
  const nameSpan = !headingTag && name
    ? `<span>${escapeXmlText(name)}</span>`
    : "";
  assertSafeTagName(headingTag || "div");
  const titleAttr = title ? ` title="${escapeXmlAttr(title)}"` : "";
  const childHtml = renderChildren(siblings, rmType, letterMap, reverseMap);
  return `<div class="${escapeXmlAttr(classToken)}"${titleAttr}>${heading}${nameSpan}${childHtml}</div>`;
}

function renderZipehrNode(
  node: unknown,
  parentType?: string,
  propertyName?: string,
  letterMap?: Record<string, string>,
  reverseMap?: Map<string, string>,
): string {
  if (node == null) return "";
  if (!letterMap || !reverseMap) throw new Error("letter maps are required");

  if (Array.isArray(node)) {
    return node.map((item) =>
      renderZipehrNode(item, parentType, propertyName, letterMap, reverseMap)
    ).join("");
  }

  if (typeof node !== "object") {
    return escapeXmlText(String(node));
  }

  const obj = node as Record<string, unknown>;
  const symbolKeys = Object.keys(obj).filter((k) =>
    k !== "_" && isClassTokenKey(k, reverseMap)
  );

  // ELEMENT fold: { E: {na, id}, q: "85|kg|" }
  const locatableKeys = symbolKeys.filter((k) =>
    isLocatableStructuredObject(obj[k], letterMap)
  );
  if (locatableKeys.length === 1) {
    const locKey = locatableKeys[0];
    const rmType = rmTypeFromClass(locKey, reverseMap) ?? locKey;
    if (rmType === "ELEMENT") {
      const structured = obj[locKey] as Record<string, unknown>;
      const title = formatLocatableTitle(
        buildLocatableTitleFields(structured, letterMap),
      );
      const label = locatableName(structured, letterMap);
      let valueHtml = "";
      const directValueKey = symbolKeys.find((k) => k !== locKey);
      if (directValueKey) {
        const valueRm = rmTypeFromClass(directValueKey, reverseMap) ?? directValueKey;
        valueHtml = renderValueSpan(valueRm, directValueKey, obj[directValueKey]);
      } else if (obj.value && typeof obj.value === "object") {
        const valueObj = obj.value as Record<string, unknown>;
        const innerKeys = Object.keys(valueObj).filter((k) =>
          isClassTokenKey(k, reverseMap)
        );
        if (innerKeys.length === 1) {
          const innerKey = innerKeys[0];
          const valueRm = rmTypeFromClass(innerKey, reverseMap) ?? innerKey;
          valueHtml = renderValueSpan(
            valueRm,
            innerKey,
            valueObj[innerKey],
          );
        } else if (
          Object.keys(valueObj).length > 0 &&
          !Object.prototype.hasOwnProperty.call(valueObj, "_type")
        ) {
          const innerKey = innerKeys[0] ?? Object.keys(valueObj)[0];
          const valueRm = rmTypeFromClass(innerKey, reverseMap) ?? innerKey;
          valueHtml = renderValueSpan(valueRm, innerKey, valueObj[innerKey]);
        }
      }
      const consumed = new Set([locKey, "value", directValueKey].filter(Boolean));
      const otherChildren = renderChildren(
        Object.fromEntries(
          Object.entries(obj).filter(([k]) => !consumed.has(k) && k !== "_"),
        ),
        rmType,
        letterMap,
        reverseMap,
      );
      const titleAttr = title ? ` title="${escapeXmlAttr(title)}"` : "";
      return `<div class="E"${titleAttr}><span>${escapeXmlText(label)}</span>${valueHtml}${otherChildren}</div>`;
    }

    if (!rmTypeFromClass(locKey, reverseMap)) {
      throw new UnsupportedZipehrXhtmlTypeError(locKey);
    }
    const siblings = Object.fromEntries(
      Object.entries(obj).filter(([k]) => k !== locKey && k !== "_"),
    );
    return renderLocatableDiv(
      locKey,
      rmType,
      obj[locKey] as Record<string, unknown>,
      siblings,
      letterMap,
      reverseMap,
    );
  }

  // Type marker object: { _: "HI", events: [...] } — `_` is already a class token.
  if (typeof obj._ === "string") {
    const classToken = obj._;
    const rmType = rmTypeFromClass(classToken, reverseMap) ?? classToken;
    if (!rmTypeFromClass(classToken, reverseMap) && !reverseMap.has(classToken)) {
      throw new UnsupportedZipehrXhtmlTypeError(classToken);
    }
    const childHtml = renderChildren(obj, rmType, letterMap, reverseMap);
    return `<div class="${escapeXmlAttr(classToken)}">${childHtml}</div>`;
  }

  // Single symbol wrapper with inner object (non-locatable)
  if (symbolKeys.length === 1 && typeof obj[symbolKeys[0]] === "object") {
    const symKey = symbolKeys[0];
    const rmType = rmTypeFromClass(symKey, reverseMap) ?? symKey;
    const inner = obj[symKey];
    if (inner && typeof inner === "object" && !Array.isArray(inner)) {
      const childHtml = renderChildren(
        {
          ...inner as Record<string, unknown>,
          ...Object.fromEntries(
            Object.entries(obj).filter(([k]) => k !== symKey && k !== "_"),
          ),
        },
        rmType,
        letterMap,
        reverseMap,
      );
      return `<div class="${escapeXmlAttr(symKey)}">${childHtml}</div>`;
    }
  }

  // Leaf terse value wrapper: { q: "85|kg|" }
  if (symbolKeys.length === 1 && typeof obj[symbolKeys[0]] === "string") {
    const symKey = symbolKeys[0];
    const rmType = rmTypeFromClass(symKey, reverseMap) ?? symKey;
    return renderValueSpan(rmType, symKey, obj[symKey]);
  }

  return renderChildren(obj, parentType, letterMap, reverseMap);
}

function extractCompositionLang(
  canonical: Record<string, unknown>,
): string | undefined {
  const language = canonical.language;
  if (!language || typeof language !== "object") return undefined;
  const code = extractWrappedTerseString(
    (language as Record<string, unknown>).code_string ??
      language,
  );
  if (code) return code;
  const phrase = language as Record<string, unknown>;
  if (phrase.code_string) return String(phrase.code_string);
  return undefined;
}

/** Serialize a letter-code ZipEHR object tree to an XHTML fragment. */
export function serializeZipehrPlainToXhtml(
  zipehrObj: unknown,
  options: XhtmlSerializeOptions = {},
): string {
  const letterMap = cachedSyncLetterMap();
  const reverseMap = getLetterCodeReverseMap(letterMap);
  const lang = options.lang ?? "en";
  const body = renderZipehrNode(
    zipehrObj,
    undefined,
    undefined,
    letterMap,
    reverseMap,
  );
  if (!body.replace(/\s/g, "")) {
    throw new Error("ZipEHR XHTML fragment has no non-whitespace content");
  }
  return `<div xmlns="http://www.w3.org/1999/xhtml" lang="${escapeXmlAttr(lang)}">${body}</div>`;
}

let syncLetterMap: Record<string, string> | undefined;

function cachedSyncLetterMap(): Record<string, string> {
  if (!syncLetterMap) {
    throw new Error(
      "Letter code map not initialized; call serializeToXZipehr first or loadLetterCodeMap()",
    );
  }
  return syncLetterMap;
}

/** Initialize sync letter map cache (called by async entry points). */
export async function ensureLetterCodeMapLoaded(): Promise<
  Record<string, string>
> {
  syncLetterMap = await loadLetterCodeMap();
  return syncLetterMap;
}

/** Serialize canonical JSON to a ZipEHR XHTML fragment. */
export async function serializeCanonicalToXhtml(
  canonical: unknown,
  options: XhtmlSerializeOptions = {},
): Promise<string> {
  const letterMap = await ensureLetterCodeMapLoaded();
  const zipehrObj = convertObjectDirect(canonical, letterMap);
  const lang = options.lang ??
    (canonical && typeof canonical === "object" && !Array.isArray(canonical)
      ? extractCompositionLang(canonical as Record<string, unknown>)
      : undefined) ??
    "en";
  return serializeZipehrPlainToXhtml(zipehrObj, { lang });
}

/** Wrap an XHTML fragment as a FHIR R4 `Narrative` object. */
export function wrapFhirNarrative(
  xhtmlFragment: string,
  status: "generated" | "extensions" | "additional" | "empty" = "generated",
): { status: string; div: string } {
  return { status, div: xhtmlFragment };
}

/** Build title fields from canonical LOCATABLE fields (for tests). */
export function buildLocatableTitleFromCanonical(
  nameStr: string,
  archetypeNodeId: string | null | undefined,
  archetypeDetails: unknown,
): LocatableTitleFields {
  const structured: Record<string, unknown> = {
    na: nameStr,
  };
  if (archetypeNodeId != null) structured.id = String(archetypeNodeId);
  const details = extractCompactArchetypeDetails(archetypeDetails);
  Object.assign(structured, details);
  const letterMap = syncLetterMap ?? {
    "LOCATABLE.name": "na",
    "LOCATABLE.archetype_node_id": "id",
    "ARCHETYPED.template_id": "te",
    "ARCHETYPED.archetype_id": "ar",
    "ARCHETYPED.rm_version": "rm",
  };
  return buildLocatableTitleFields(structured, letterMap);
}
