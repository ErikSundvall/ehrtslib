/**
 * Deserialize FHIR-safe ZipEHR XHTML fragments back to canonical openEHR JSON.
 */

import { XMLParser } from "fast-xml-parser";
import { expandZipehrToCanonical } from "./deserialize.ts";
import {
  getLetterCodeReverseMap,
  rmTypeFromClass,
} from "./letter_codes.ts";
import { parseLocatableTitle, splitTitlePropertyPrefix } from "./title_grammar.ts";
import {
  expandTerseString,
  isLocatableStructuredObject,
  LANGUAGE_CARRIER_TYPES,
  languageTerseString,
  POLYMORPHIC_TYPES,
  PROPERTY_TYPE_MAP,
  TERMINOLOGY_FIELD_PROMOTIONS,
} from "./shared.ts";
import { ensureLetterCodeMapLoaded } from "./xhtml_serialize.ts";

export type XhtmlElement = {
  tag: string;
  attrs: Record<string, string>;
  children: XhtmlNode[];
};

export type XhtmlText = { kind: "text"; text: string };

export type XhtmlNode = XhtmlElement | XhtmlText;

const HEADING_TAGS = new Set(["h2", "h3", "h4", "h5", "h6"]);

function isElement(node: XhtmlNode): node is XhtmlElement {
  return "tag" in node;
}

function isText(node: XhtmlNode): node is XhtmlText {
  return "kind" in node && (node as XhtmlText).kind === "text";
}

function parseXhtmlFragment(text: string): XhtmlElement {
  const trimmed = text.trim();
  if (!trimmed || !/\S/.test(trimmed.replace(/<[^>]+>/g, ""))) {
    throw new Error("ZipEHR XHTML fragment has no non-whitespace content");
  }

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    trimValues: false,
    parseTagValue: false,
    allowBooleanAttributes: true,
  });
  const parsed = parser.parse(trimmed);
  const root = normalizeRoot(parsed);
  if (!root) {
    throw new Error("Unable to parse ZipEHR XHTML fragment");
  }
  return root;
}

function normalizeRoot(parsed: unknown): XhtmlElement | null {
  if (!parsed || typeof parsed !== "object") return null;
  const record = parsed as Record<string, unknown>;
  if (record.div) {
    return normalizeNode("div", record.div);
  }
  return null;
}

function normalizeNode(tag: string, raw: unknown): XhtmlElement {
  const attrs: Record<string, string> = {};
  const children: XhtmlNode[] = [];

  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const obj = raw as Record<string, unknown>;
    for (const [key, value] of Object.entries(obj)) {
      if (key.startsWith("@_")) {
        attrs[key.slice(2)] = String(value ?? "");
        continue;
      }
      if (key === "#text") {
        const text = String(value);
        if (text) children.push({ kind: "text", text });
        continue;
      }
      appendChildNodes(children, key, value);
    }
  } else if (Array.isArray(raw)) {
    for (const item of raw) {
      if (typeof item === "object" && item !== null) {
        const obj = item as Record<string, unknown>;
        const childTag = Object.keys(obj).find((k) =>
          !k.startsWith("@_") && k !== "#text"
        );
        if (childTag) appendChildNodes(children, childTag, obj[childTag]);
      }
    }
  } else if (raw != null && raw !== "") {
    children.push({ kind: "text", text: String(raw) });
  }

  return { tag, attrs, children };
}

function appendChildNodes(
  out: XhtmlNode[],
  tag: string,
  raw: unknown,
): void {
  if (raw == null) return;
  if (Array.isArray(raw)) {
    for (const item of raw) out.push(normalizeNode(tag, item));
    return;
  }
  out.push(normalizeNode(tag, raw));
}

function elementText(node: XhtmlElement): string {
  return node.children
    .map((child) => (isText(child) ? child.text : elementText(child)))
    .join("")
    .trim();
}

function childElements(node: XhtmlElement): XhtmlElement[] {
  return node.children.filter(isElement);
}

function headingText(node: XhtmlElement): string | undefined {
  for (const child of node.children) {
    if (isElement(child) && HEADING_TAGS.has(child.tag)) {
      return elementText(child);
    }
  }
  return undefined;
}

function firstLabelSpan(node: XhtmlElement): string | undefined {
  const first = childElements(node).find((c) => c.tag === "span");
  return first ? elementText(first) : undefined;
}

function visibleLocatableName(node: XhtmlElement): string | undefined {
  return headingText(node) ?? firstLabelSpan(node);
}

function isLabelSpanChild(
  node: XhtmlElement,
  child: XhtmlElement,
  reverseMap: Map<string, string>,
): boolean {
  if (child.tag !== "span") return false;
  if (child.attrs.class) return false;
  const rmType = rmTypeFromClass(classToken(node.attrs.class), reverseMap);
  if (rmType === "ELEMENT") return false;
  const spans = childElements(node).filter((c) => c.tag === "span");
  return spans[0] === child;
}

function titleToStructured(
  title: string | undefined,
  visibleName: string | undefined,
  letterMap: Record<string, string>,
): { structured: Record<string, unknown>; territory?: string } {
  const nameSym = letterMap["LOCATABLE.name"] ?? "na";
  const nodeSym = letterMap["LOCATABLE.archetype_node_id"] ?? "id";
  const templateSym = letterMap["ARCHETYPED.template_id"] ?? "te";
  const archetypeSym = letterMap["ARCHETYPED.archetype_id"] ?? "ar";
  const rmSym = letterMap["ARCHETYPED.rm_version"] ?? "rm";

  const structured: Record<string, unknown> = {};
  if (visibleName) structured[nameSym] = visibleName;

  const { rest } = splitTitlePropertyPrefix(title ?? "");
  const fields = parseLocatableTitle(rest);
  if (fields.id) structured[nodeSym] = fields.id;
  if (fields.te) structured[templateSym] = fields.te;
  if (fields.rm) structured[rmSym] = fields.rm;
  if (fields.ar === true) {
    structured[archetypeSym] = true;
    if (!fields.id && visibleName) structured[nodeSym] = visibleName;
  } else if (fields.ar) {
    structured[archetypeSym] = fields.ar;
  }

  if (!fields.ar && (fields.te || fields.rm) && visibleName) {
    structured[archetypeSym] = visibleName;
  }

  return { structured, territory: fields.territory };
}

function territoryTerseString(code: string): string {
  const promo = TERMINOLOGY_FIELD_PROMOTIONS.find((p) => p.field === "territory");
  return `${promo?.prefix ?? "ISO_3166-1::"}${code}`;
}

function titleProperty(title: string | undefined): string | undefined {
  return splitTitlePropertyPrefix(title ?? "").property;
}

function warnNameMismatch(
  visibleName: string | undefined,
  machineName: string | undefined,
): void {
  if (
    visibleName && machineName && visibleName !== machineName &&
    machineName !== ""
  ) {
    console.warn(
      `ZipEHR XHTML: visible name "${visibleName}" differs from machine metadata`,
    );
  }
}

function deserializeValueSpan(span: XhtmlElement): Record<string, unknown> {
  const token = classToken(span.attrs.class);
  const display = elementText(span);
  const { rest: titleRest } = splitTitlePropertyPrefix(span.attrs.title ?? "");
  // Expand terminology emoji shortcuts when present in title values.
  const raw = titleRest || display;
  const value = raw ? expandTerseString(raw) : display;
  return { [token]: value };
}

function deserializeElementDiv(
  node: XhtmlElement,
  letterMap: Record<string, string>,
  reverseMap: Map<string, string>,
): Record<string, unknown> {
  const spans = childElements(node).filter((c) => c.tag === "span");
  const label = spans[0] ? elementText(spans[0]) : undefined;
  const valueSpan = spans[1];
  const { structured } = titleToStructured(node.attrs.title, label, letterMap);
  const out: Record<string, unknown> = { E: structured };
  if (valueSpan) {
    Object.assign(out, deserializeValueSpan(valueSpan));
  }
  for (const child of childElements(node)) {
    if (child.tag === "span") continue;
    const childObj = deserializeElement(child, letterMap, reverseMap);
    Object.assign(out, childObj);
  }
  return out;
}

const ARRAY_PROPERTIES = new Set([
  "events",
  "items",
  "content",
  "rows",
]);

function childPropertyMatches(
  expectedType: string,
  childRmType: string,
): boolean {
  if (expectedType === childRmType) return true;
  if (!POLYMORPHIC_TYPES.has(expectedType)) return false;
  if (expectedType === "EVENT") {
    return childRmType === "POINT_EVENT" || childRmType === "INTERVAL_EVENT" ||
      childRmType === "EVENT";
  }
  if (expectedType === "ITEM") {
    return childRmType === "ELEMENT" || childRmType === "CLUSTER" ||
      childRmType === "ITEM_TREE" || childRmType === "ITEM_LIST";
  }
  if (expectedType === "ITEM_STRUCTURE") {
    return childRmType.startsWith("ITEM_");
  }
  if (expectedType === "CONTENT_ITEM") {
    return childRmType === "SECTION" || childRmType === "OBSERVATION" ||
      childRmType === "EVALUATION" || childRmType === "ADMIN_ENTRY" ||
      childRmType === "INSTRUCTION" || childRmType === "ACTION";
  }
  if (expectedType === "DATA_VALUE") {
    return childRmType.startsWith("DV_") || childRmType === "CODE_PHRASE";
  }
  return false;
}

function resolveChildPropertyName(
  parentRmType: string,
  childRmType: string,
  used: Set<string>,
): string {
  const map = PROPERTY_TYPE_MAP[parentRmType] ?? {};
  for (const [prop, expectedType] of Object.entries(map)) {
    if (used.has(prop)) continue;
    if (childPropertyMatches(expectedType, childRmType)) return prop;
  }
  const fallback = `child_${used.size}`;
  return fallback;
}

function assignChildProperty(
  out: Record<string, unknown>,
  propName: string,
  childObj: Record<string, unknown>,
): void {
  if (ARRAY_PROPERTIES.has(propName)) {
    const current = out[propName];
    if (Array.isArray(current)) {
      current.push(childObj);
      return;
    }
    if (current === undefined) {
      out[propName] = [childObj];
      return;
    }
    out[propName] = [current, childObj];
    return;
  }
  out[propName] = childObj;
}

function childRmTypeFromNode(
  child: XhtmlElement,
  reverseMap: Map<string, string>,
): string | undefined {
  const token = classToken(child.attrs.class);
  if (!token) return undefined;
  return rmTypeFromClass(token, reverseMap);
}

/** Ehrbase letter `class` token (single token; RM properties live in `title`). */
function classToken(classAttr: string | undefined): string {
  return classAttr?.trim() ?? "";
}

function deserializeElement(
  node: XhtmlElement,
  letterMap: Record<string, string>,
  reverseMap: Map<string, string>,
  _parentRmType?: string,
): Record<string, unknown> {
  const token = classToken(node.attrs.class);
  if (!token) {
    throw new Error(`ZipEHR XHTML element missing class attribute: <${node.tag}>`);
  }

  const rmType = rmTypeFromClass(token, reverseMap);
  if (!rmType) {
    throw new Error(`Unknown ZipEHR XHTML class token: ${token}`);
  }

  if (rmType === "ELEMENT") {
    return deserializeElementDiv(node, letterMap, reverseMap);
  }

  const visibleName = visibleLocatableName(node);
  const { structured, territory } = titleToStructured(
    node.attrs.title,
    visibleName,
    letterMap,
  );
  const hasStructured = Object.keys(structured).length > 0;

  const out: Record<string, unknown> = {};
  if (hasStructured && isLocatableStructuredObject(structured, letterMap)) {
    out[token] = structured;
    warnNameMismatch(
      visibleName,
      String(structured[letterMap["LOCATABLE.name"] ?? "na"] ?? ""),
    );
  } else {
    out._ = token;
  }

  // Native HTML `lang` → openEHR language CODE_PHRASE (COMPOSITION / ENTRY).
  if (node.attrs.lang && LANGUAGE_CARRIER_TYPES.has(rmType)) {
    out.language = languageTerseString(node.attrs.lang);
  }

  // COMPOSITION territory from root title (`territory: SE` / `🌐: SE`).
  if (rmType === "COMPOSITION" && territory) {
    out.territory = territoryTerseString(territory);
  }

  const childDivs = childElements(node).filter((c) =>
    !HEADING_TAGS.has(c.tag) && !isLabelSpanChild(node, c, reverseMap)
  );
  const usedProperties = new Set<string>();
  if (out.language != null) usedProperties.add("language");
  if (out.territory != null) usedProperties.add("territory");

  for (const child of childDivs) {
    if (child.tag === "span") {
      const valueRm = childRmTypeFromNode(child, reverseMap);
      const valueObj = deserializeValueSpan(child);
      const explicit = titleProperty(child.attrs.title);
      if (valueRm) {
        const propName = explicit ??
          resolveChildPropertyName(rmType, valueRm, usedProperties);
        usedProperties.add(propName);
        assignChildProperty(out, propName, valueObj);
      } else {
        Object.assign(out, valueObj);
      }
      continue;
    }

    const childRm = childRmTypeFromNode(child, reverseMap) ?? "UNKNOWN";
    const explicit = titleProperty(child.attrs.title);
    const propName = explicit ??
      resolveChildPropertyName(rmType, childRm, usedProperties);
    usedProperties.add(propName);
    const childObj = deserializeElement(child, letterMap, reverseMap, rmType);
    assignChildProperty(out, propName, childObj);
  }

  return out;
}

/** Convert a parsed XHTML element tree to a letter-code ZipEHR object. */
export function xhtmlElementToZipehrObject(
  root: XhtmlElement,
  letterMap: Record<string, string>,
): Record<string, unknown> {
  const reverseMap = getLetterCodeReverseMap(letterMap);
  const innerDivs = childElements(root);
  if (innerDivs.length === 1) {
    return deserializeElement(innerDivs[0], letterMap, reverseMap);
  }
  const out: Record<string, unknown> = {};
  innerDivs.forEach((child, index) => {
    out[`child_${index}`] = deserializeElement(child, letterMap, reverseMap);
  });
  return out;
}

/** Deserialize ZipEHR XHTML text to canonical openEHR JSON. */
export async function zipehrXhtmlToCanonical(text: string): Promise<unknown> {
  const letterMap = await ensureLetterCodeMapLoaded();
  const root = parseXhtmlFragment(text);
  const zipehrObj = xhtmlElementToZipehrObject(root, letterMap);
  return expandZipehrToCanonical(zipehrObj, "lettercode");
}

/** Deserialize ZipEHR XHTML text to a letter-code ZipEHR object (pre-expand). */
export async function zipehrXhtmlToLetterObject(
  text: string,
): Promise<Record<string, unknown>> {
  const letterMap = await ensureLetterCodeMapLoaded();
  const root = parseXhtmlFragment(text);
  return xhtmlElementToZipehrObject(root, letterMap);
}
