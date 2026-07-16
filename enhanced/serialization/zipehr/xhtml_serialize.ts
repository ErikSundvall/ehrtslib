/**
 * Serialize letter-code ZipEHR trees and canonical JSON to FHIR-safe XHTML fragments.
 */

import { convertObjectDirect } from "./convert.ts";
import { toTerseCodePhrase, toTerseDvCodedText } from "./compact.ts";
import {
  extractCompactArchetypeDetails,
  extractFirstScalar,
  extractLanguageCode,
  expandTerseString,
  extractTerminologyFieldCode,
  formatPropertyComment,
  inferrablePropertyType,
  isLocatableStructuredObject,
  isSymbolKey,
  isTerseDvCodedText,
  LANGUAGE_CARRIER_TYPES,
  PROPERTY_TYPE_MAP,
  propertySlotAmbiguous,
  type RmPropertyEmitMode,
  shouldEmitPropertyAttribute,
  shouldEmitPropertyComment,
  shortenTerseString,
  TECHNICAL_ID_TYPES,
  TERMINOLOGY_FIELD_PROMOTIONS,
} from "./shared.ts";
import {
  classFromRmType,
  getLetterCodeReverseMap,
  loadLetterCodeMap,
  rmTypeFromClass,
} from "./letter_codes.ts";
import {
  formatLocatableTitle,
  formatTitleWithProperty,
  type LocatableTitleFields,
  type TitleSymbolVariant,
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
  /**
   * Symbols inside `title` attribute values (`id`/`ar`/… vs `🆔`/`Ⓐ`/…).
   * `class` tokens always stay Ehrbase letter codes. Default: `lettercode`.
   */
  symbolVariant?: TitleSymbolVariant;
  /** Insert newlines and indentation (default: true). */
  prettyPrint?: boolean;
  /**
   * How to surface RM property names (`context`, `start_time`, …).
   * - `omit` (default) — only when the parent slot is ambiguous
   * - `attribute` — prefix of `title` as `prop — …` (not in `class`)
   * - `comment` — compact `<!--prop-->` before the element
   */
  propertyMode?: RmPropertyEmitMode;
};

export type { RmPropertyEmitMode };

type XhtmlRenderCtx = {
  letterMap: Record<string, string>;
  reverseMap: Map<string, string>;
  titleVariant: TitleSymbolVariant;
  propertyMode: RmPropertyEmitMode;
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

function prettyPrintXhtml(html: string): string {
  const pad = "  ";
  let depth = 0;
  const pretty = html
    .replace(/>\s+</g, "><")
    .replace(/></g, ">\n<")
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return "";
      if (/^<\//.test(trimmed)) depth = Math.max(0, depth - 1);
      const indented = pad.repeat(depth) + trimmed;
      if (/^<[^!?/][^>]*>$/.test(trimmed)) depth++;
      return indented;
    })
    .filter(Boolean)
    .join("\n") + "\n";
  // Keep empty elements compact (e.g. technical-id spans with title only).
  return pretty.replace(
    /<(span|div)(\s[^>]*)?>\s*<\/\1>/g,
    "<$1$2></$1>",
  );
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
  if (structured[rmSym] != null && String(structured[rmSym]) !== "") {
    fields.rm = String(structured[rmSym]);
  }

  const nodeId = structured[nodeSym] != null
    ? String(structured[nodeSym])
    : undefined;

  const aRaw = structured[archetypeSym];
  let archetypeId: string | true | undefined;
  if (aRaw === true || aRaw === "true") {
    archetypeId = true;
  } else if (aRaw != null && aRaw !== false && aRaw !== "") {
    archetypeId = String(aRaw);
  }

  const effectiveId = nodeId ??
    (typeof archetypeId === "string" ? archetypeId : undefined);
  if (effectiveId != null) fields.id = effectiveId;

  if (archetypeId === true) {
    fields.ar = true;
  } else if (typeof archetypeId === "string" && archetypeId !== name) {
    if (effectiveId != null && archetypeId === effectiveId) {
      fields.ar = true;
    } else {
      fields.ar = archetypeId;
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

function maybeShortenTitleValue(
  terse: string,
  variant: TitleSymbolVariant,
): string {
  // Emoji titles may use TERMINOLOGY_SHORTCUTS (allowed in attribute values).
  return variant === "emoji" ? shortenTerseString(terse) : terse;
}

function formatValueTitle(
  rmType: string,
  value: unknown,
  letterMap: Record<string, string>,
  variant: TitleSymbolVariant,
): string | undefined {
  if (value == null) return undefined;
  if (typeof value === "string") {
    const expanded = expandTerseString(value, letterMap);
    if (rmType === "DV_TEXT" && expanded === value) return undefined;
    return maybeShortenTitleValue(expanded, variant);
  }
  if (typeof value !== "object" || Array.isArray(value)) {
    return String(value);
  }
  const obj = value as Record<string, unknown>;
  switch (rmType) {
    case "DV_QUANTITY":
      return formatDvQuantityTitle(obj);
    case "DV_CODED_TEXT":
      return maybeShortenTitleValue(toTerseDvCodedText(obj), variant);
    case "CODE_PHRASE":
      return maybeShortenTitleValue(toTerseCodePhrase(obj), variant);
    case "DV_DATE_TIME":
    case "DV_DATE":
    case "DV_TIME":
    case "DV_TEXT":
    case "TERMINOLOGY_ID":
    case "OBJECT_VERSION_ID":
    case "ARCHETYPE_ID":
    case "TEMPLATE_ID":
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

function formatValueDisplay(
  rmType: string,
  value: unknown,
  letterMap: Record<string, string>,
): string {
  if (value == null) return "";
  // Technical IDs: title-only — never mirror into element text.
  if (TECHNICAL_ID_TYPES.has(rmType)) return "";
  if (typeof value === "string") {
    if (rmType === "DV_QUANTITY") {
      const fromTerse = formatQuantityDisplayFromTerse(value);
      if (fromTerse) return fromTerse;
    }
    const expanded = expandTerseString(value, letterMap);
    if (isTerseDvCodedText(expanded)) {
      const match = expanded.match(/^[^:]+::[^|]+\|([^|]*)\|$/);
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

function formatClassAttr(typeToken: string): string {
  return `class="${escapeXmlAttr(typeToken)}"`;
}

function withPropertyComment(
  html: string,
  propertyName: string | undefined,
  propertyMode: RmPropertyEmitMode,
): string {
  if (!propertyName || !shouldEmitPropertyComment(propertyMode)) return html;
  return formatPropertyComment(propertyName) + html;
}

function shouldEmitPropertyInTitle(
  propertyName: string | undefined,
  parentType: string | undefined,
  childType: string,
  propertyMode: RmPropertyEmitMode,
): boolean {
  if (!propertyName) return false;
  return shouldEmitPropertyAttribute(
    propertyMode,
    propertySlotAmbiguous(parentType, childType, propertyName),
  );
}

function composeTitleAttr(
  titleBody: string,
  propertyName: string | undefined,
  parentType: string | undefined,
  childType: string,
  propertyMode: RmPropertyEmitMode,
): string {
  const title = formatTitleWithProperty(
    propertyName,
    titleBody,
    shouldEmitPropertyInTitle(propertyName, parentType, childType, propertyMode),
  );
  return title ? ` title="${escapeXmlAttr(title)}"` : "";
}

function extractCompositionTerritoryCode(value: unknown): string | undefined {
  const promo = TERMINOLOGY_FIELD_PROMOTIONS.find((p) => p.field === "territory");
  if (!promo) return undefined;
  // Force shortcut path so ISO_3166-1::SE / 🌐SE both strip to bare code.
  return extractTerminologyFieldCode(
    value,
    promo.prefix,
    promo.emoji,
  ) ?? undefined;
}

function renderValueSpan(
  rmType: string,
  classToken: string,
  value: unknown,
  ctx: XhtmlRenderCtx,
  parentType?: string,
  propertyName?: string,
): string {
  const display = escapeXmlText(
    formatValueDisplay(rmType, value, ctx.letterMap),
  );
  const titleBody = formatValueTitle(
    rmType,
    value,
    ctx.letterMap,
    ctx.titleVariant,
  ) ?? "";
  const emitProp = shouldEmitPropertyInTitle(
    propertyName,
    parentType,
    rmType,
    ctx.propertyMode,
  );
  // Skip machine title when it would only duplicate clinician-visible DV_TEXT.
  const keepMachineTitle = Boolean(titleBody) &&
    !(titleBody === display && rmType === "DV_TEXT");
  const titleAttr = (emitProp || keepMachineTitle)
    ? composeTitleAttr(
      keepMachineTitle ? titleBody : "",
      propertyName,
      parentType,
      rmType,
      ctx.propertyMode,
    )
    : "";
  const classAttr = formatClassAttr(classToken);
  return withPropertyComment(
    `<span ${classAttr}${titleAttr}>${display}</span>`,
    propertyName,
    ctx.propertyMode,
  );
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
  ctx: XhtmlRenderCtx,
): string {
  const keys = orderedChildKeys(
    rmType,
    Object.keys(obj).filter((k) => {
      if (k === "_" || isClassTokenKey(k, ctx.reverseMap)) return false;
      // Native HTML `lang` carries openEHR language — do not emit as a child.
      if (k === "language" && LANGUAGE_CARRIER_TYPES.has(rmType ?? "")) {
        return false;
      }
      // COMPOSITION territory is promoted into the root `title` attribute.
      if (
        rmType === "COMPOSITION" && k === "territory" &&
        extractCompositionTerritoryCode(obj[k])
      ) {
        return false;
      }
      return true;
    }),
  );
  return keys.map((key) =>
    renderZipehrNode(obj[key], rmType, key, ctx)
  ).join("");
}

function langAttrFromSiblings(
  rmType: string,
  siblings: Record<string, unknown>,
): string {
  if (!LANGUAGE_CARRIER_TYPES.has(rmType)) return "";
  const code = extractLanguageCode(siblings.language);
  return code ? ` lang="${escapeXmlAttr(code)}"` : "";
}

function renderLocatableDiv(
  classToken: string,
  rmType: string,
  structured: Record<string, unknown>,
  siblings: Record<string, unknown>,
  ctx: XhtmlRenderCtx,
  parentType?: string,
  propertyName?: string,
): string {
  const fields = buildLocatableTitleFields(structured, ctx.letterMap);
  if (rmType === "COMPOSITION") {
    const territoryCode = extractCompositionTerritoryCode(siblings.territory);
    if (territoryCode) fields.territory = territoryCode;
  }
  const titleBody = formatLocatableTitle(fields, ctx.titleVariant);
  const name = locatableName(structured, ctx.letterMap);
  const headingTag = HEADING_BY_TYPE[rmType];
  const heading = headingTag
    ? `<${headingTag}>${escapeXmlText(name)}</${headingTag}>`
    : "";
  const nameSpan = !headingTag && name
    ? `<span>${escapeXmlText(name)}</span>`
    : "";
  assertSafeTagName(headingTag || "div");
  const titleAttr = composeTitleAttr(
    titleBody,
    propertyName,
    parentType,
    rmType,
    ctx.propertyMode,
  );
  const langAttr = langAttrFromSiblings(rmType, siblings);
  const childHtml = renderChildren(siblings, rmType, ctx);
  const classAttr = formatClassAttr(classToken);
  return withPropertyComment(
    `<div ${classAttr}${titleAttr}${langAttr}>${heading}${nameSpan}${childHtml}</div>`,
    propertyName,
    ctx.propertyMode,
  );
}

function renderZipehrNode(
  node: unknown,
  parentType: string | undefined,
  propertyName: string | undefined,
  ctx: XhtmlRenderCtx,
): string {
  if (node == null) return "";
  const { letterMap, reverseMap } = ctx;

  if (Array.isArray(node)) {
    return node.map((item) =>
      renderZipehrNode(item, parentType, propertyName, ctx)
    ).join("");
  }

  if (typeof node !== "object") {
    const expectedType = inferrablePropertyType(parentType, propertyName);
    if (expectedType) {
      const classToken = classFromRmType(expectedType, letterMap) ??
        expectedType;
      return renderValueSpan(
        expectedType,
        classToken,
        node,
        ctx,
        parentType,
        propertyName,
      );
    }
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
        ctx.titleVariant,
      );
      const label = locatableName(structured, letterMap);
      let valueHtml = "";
      const directValueKey = symbolKeys.find((k) => k !== locKey);
      if (directValueKey) {
        const valueRm = rmTypeFromClass(directValueKey, reverseMap) ??
          directValueKey;
        valueHtml = renderValueSpan(
          valueRm,
          directValueKey,
          obj[directValueKey],
          ctx,
          rmType,
          "value",
        );
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
            ctx,
            rmType,
            "value",
          );
        } else if (
          Object.keys(valueObj).length > 0 &&
          !Object.prototype.hasOwnProperty.call(valueObj, "_type")
        ) {
          const innerKey = innerKeys[0] ?? Object.keys(valueObj)[0];
          const valueRm = rmTypeFromClass(innerKey, reverseMap) ?? innerKey;
          valueHtml = renderValueSpan(
            valueRm,
            innerKey,
            valueObj[innerKey],
            ctx,
            rmType,
            "value",
          );
        }
      }
      const consumed = new Set(
        [locKey, "value", directValueKey].filter(Boolean),
      );
      const otherChildren = renderChildren(
        Object.fromEntries(
          Object.entries(obj).filter(([k]) => !consumed.has(k) && k !== "_"),
        ),
        rmType,
        ctx,
      );
      const titleAttr = composeTitleAttr(
        title,
        propertyName,
        parentType,
        rmType,
        ctx.propertyMode,
      );
      const classAttr = formatClassAttr("E");
      return withPropertyComment(
        `<div ${classAttr}${titleAttr}><span>${escapeXmlText(label)}</span>${valueHtml}${otherChildren}</div>`,
        propertyName,
        ctx.propertyMode,
      );
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
      ctx,
      parentType,
      propertyName,
    );
  }

  // Type marker object: { _: "HI", events: [...] } — `_` is already a class token.
  if (typeof obj._ === "string") {
    const classToken = obj._;
    const rmType = rmTypeFromClass(classToken, reverseMap) ?? classToken;
    const childKeys = Object.keys(obj).filter((k) =>
      k !== "_" && k !== "_type"
    );
    if (
      !rmTypeFromClass(classToken, reverseMap) &&
      !reverseMap.has(classToken) &&
      childKeys.length === 1 &&
      childKeys[0] === "value"
    ) {
      const valueRm = inferrablePropertyType(parentType, propertyName) ??
        classToken;
      const valueClass = classFromRmType(valueRm, letterMap) ?? classToken;
      return renderValueSpan(
        valueRm,
        valueClass,
        obj.value,
        ctx,
        parentType,
        propertyName,
      );
    }
    if (!rmTypeFromClass(classToken, reverseMap) && !reverseMap.has(classToken)) {
      throw new UnsupportedZipehrXhtmlTypeError(classToken);
    }
    const langAttr = langAttrFromSiblings(rmType, obj);
    const childHtml = renderChildren(obj, rmType, ctx);
    const titleAttr = composeTitleAttr(
      "",
      propertyName,
      parentType,
      rmType,
      ctx.propertyMode,
    );
    const classAttr = formatClassAttr(classToken);
    return withPropertyComment(
      `<div ${classAttr}${titleAttr}${langAttr}>${childHtml}</div>`,
      propertyName,
      ctx.propertyMode,
    );
  }

  // Single symbol wrapper with inner object (non-locatable)
  if (symbolKeys.length === 1 && typeof obj[symbolKeys[0]] === "object") {
    const symKey = symbolKeys[0];
    const rmType = rmTypeFromClass(symKey, reverseMap) ?? symKey;
    const inner = obj[symKey];
    if (inner && typeof inner === "object" && !Array.isArray(inner)) {
      const merged = {
        ...inner as Record<string, unknown>,
        ...Object.fromEntries(
          Object.entries(obj).filter(([k]) => k !== symKey && k !== "_"),
        ),
      };
      const langAttr = langAttrFromSiblings(rmType, merged);
      const childHtml = renderChildren(merged, rmType, ctx);
      const titleAttr = composeTitleAttr(
        "",
        propertyName,
        parentType,
        rmType,
        ctx.propertyMode,
      );
      const classAttr = formatClassAttr(symKey);
      return withPropertyComment(
        `<div ${classAttr}${titleAttr}${langAttr}>${childHtml}</div>`,
        propertyName,
        ctx.propertyMode,
      );
    }
  }

  // Leaf terse value wrapper: { q: "85|kg|" }
  if (symbolKeys.length === 1 && typeof obj[symbolKeys[0]] === "string") {
    const symKey = symbolKeys[0];
    const rmType = rmTypeFromClass(symKey, reverseMap) ?? symKey;
    return renderValueSpan(
      rmType,
      symKey,
      obj[symKey],
      ctx,
      parentType,
      propertyName,
    );
  }

  return renderChildren(obj, parentType, ctx);
}

function extractDocumentLang(
  canonical: Record<string, unknown>,
): string | undefined {
  return extractLanguageCode(canonical.language);
}

/** Serialize a letter-code ZipEHR object tree to an XHTML fragment. */
export function serializeZipehrPlainToXhtml(
  zipehrObj: unknown,
  options: XhtmlSerializeOptions = {},
): string {
  const letterMap = cachedSyncLetterMap();
  const reverseMap = getLetterCodeReverseMap(letterMap);
  const ctx: XhtmlRenderCtx = {
    letterMap,
    reverseMap,
    titleVariant: options.symbolVariant ?? "lettercode",
    propertyMode: options.propertyMode ?? "omit",
  };
  const lang = options.lang ??
    (zipehrObj && typeof zipehrObj === "object" && !Array.isArray(zipehrObj)
      ? extractLanguageCode((zipehrObj as Record<string, unknown>).language)
      : undefined) ??
    "en";
  const body = renderZipehrNode(zipehrObj, undefined, undefined, ctx);
  if (!body.replace(/\s/g, "")) {
    throw new Error("ZipEHR XHTML fragment has no non-whitespace content");
  }
  const root = `<div xmlns="http://www.w3.org/1999/xhtml" lang="${escapeXmlAttr(lang)}">${body}</div>`;
  const prettyPrint = options.prettyPrint !== false;
  return prettyPrint ? prettyPrintXhtml(root) : root;
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
      ? extractDocumentLang(canonical as Record<string, unknown>)
      : undefined) ??
    "en";
  return serializeZipehrPlainToXhtml(zipehrObj, {
    ...options,
    lang,
  });
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
