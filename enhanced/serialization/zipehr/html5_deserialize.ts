/**
 * Deserialize ZipEHR HTML5 custom-element markup to canonical openEHR JSON.
 */

import { XMLParser } from "fast-xml-parser";
import {
  MAGNITUDE_STATUS_EXACT_RM,
  MAGNITUDE_STATUS_OPERATORS,
  SYMBOL_TABLE_EMOJI_SYMBOLS,
  SYMBOL_TABLE_HTML5_SHORT_TAGS,
  SYMBOL_TABLE_LETTER_SYMBOLS,
  TERMINOLOGY_SHORTCUTS,
} from "./symbol_table.ts";
import {
  expandTerseString,
  isArchetypeIdSameAsNodeIdFlag,
  isTerseCodePhrase,
  LANGUAGE_CARRIER_TYPES,
  languageCodePhrase,
  LOCATABLE_LIKE_TYPES,
  parseTerseDvCodedText,
  POLYMORPHIC_TYPES,
  PROPERTY_TYPE_MAP,
  TECHNICAL_ID_TYPES,
} from "./shared.ts";
import {
  type Html5Dialect,
  ZIPEHR_HTML5_FMT_TOKEN,
  ZIPEHR_HTML5_URI,
} from "./html5_serialize.ts";

export type Html5Element = {
  tag: string;
  attrs: Record<string, string>;
  children: Html5Node[];
};

export type Html5Text = { kind: "text"; text: string };
export type Html5Node = Html5Element | Html5Text;

function isElement(node: Html5Node): node is Html5Element {
  return "tag" in node;
}

function isText(node: Html5Node): node is Html5Text {
  return "kind" in node && (node as Html5Text).kind === "text";
}

function buildShortTagToType(): Map<string, string> {
  const map = new Map<string, string>();
  // Types with html5_short_tags overrides must not also claim their letter code
  // (e.g. CODE_PHRASE "C" would lowercase-collide with DV_CODED_TEXT "c").
  const overridden = new Set(Object.keys(SYMBOL_TABLE_HTML5_SHORT_TAGS));
  for (const [rmType, letter] of Object.entries(SYMBOL_TABLE_LETTER_SYMBOLS)) {
    if (rmType.includes(".")) continue;
    if (overridden.has(rmType)) continue;
    map.set(String(letter).toLowerCase(), rmType);
  }
  for (const [rmType, suffix] of Object.entries(SYMBOL_TABLE_HTML5_SHORT_TAGS)) {
    map.set(suffix.toLowerCase(), rmType);
  }
  return map;
}

function buildEmojiTagToType(): Map<string, string> {
  const map = new Map<string, string>();
  for (const [rmType, emoji] of Object.entries(SYMBOL_TABLE_EMOJI_SYMBOLS)) {
    if (rmType.includes(".")) continue;
    map.set(String(emoji), rmType);
  }
  return map;
}

const SHORT_TAG_TO_TYPE = buildShortTagToType();
const EMOJI_TAG_TO_TYPE = buildEmojiTagToType();

function kebabToRm(kebab: string): string {
  return kebab.toUpperCase().replace(/-/g, "_");
}

function parseFmt(fmt: string | undefined): Html5Dialect | undefined {
  if (!fmt) return undefined;
  if (fmt === "s1" || fmt === ZIPEHR_HTML5_URI.short) return "short";
  if (fmt === "f1" || fmt === ZIPEHR_HTML5_URI.full) return "full";
  if (fmt === "e1" || fmt === ZIPEHR_HTML5_URI.emoji) return "emoji";
  return undefined;
}

function detectDialectFromTag(localName: string): Html5Dialect {
  // After stripping o-
  if (/^[a-z][a-z0-9]*(-[a-z0-9]+)+$/.test(localName)) return "full";
  if (/^[a-z0-9]+$/.test(localName)) return "short";
  return "emoji";
}

function rmTypeFromTag(
  tag: string,
  dialect: Html5Dialect,
): string | undefined {
  const local = tag.startsWith("o-") ? tag.slice(2) : tag;
  if (dialect === "short") {
    return SHORT_TAG_TO_TYPE.get(local.toLowerCase());
  }
  if (dialect === "full") {
    return kebabToRm(local);
  }
  return EMOJI_TAG_TO_TYPE.get(local);
}

function decodeMagnitudeStatus(wire: string | undefined): string | undefined {
  if (wire == null || wire === "") return undefined;
  const row = MAGNITUDE_STATUS_OPERATORS.find(
    (o) => o.letter === wire || o.emoji === wire || o.rm === wire,
  );
  return row?.rm ?? wire;
}

function parseFragment(text: string): Html5Element {
  const trimmed = text.trim();
  if (!trimmed) throw new Error("ZipEHR HTML5 fragment is empty");

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    trimValues: false,
    parseTagValue: false,
    allowBooleanAttributes: true,
    // Preserve order / unicode tag names
    isArray: () => false,
  });
  const parsed = parser.parse(trimmed);
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Unable to parse ZipEHR HTML5 fragment");
  }
  const record = parsed as Record<string, unknown>;
  const rootKey = Object.keys(record).find((k) =>
    !k.startsWith("?") && k !== "#text"
  );
  if (!rootKey) throw new Error("ZipEHR HTML5 fragment has no root element");
  return normalizeNode(rootKey, record[rootKey]);
}

function normalizeNode(tag: string, raw: unknown): Html5Element {
  const attrs: Record<string, string> = {};
  const children: Html5Node[] = [];

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
      if (item && typeof item === "object") {
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
  out: Html5Node[],
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

function leadingText(node: Html5Element): string {
  const parts: string[] = [];
  for (const child of node.children) {
    if (isText(child)) parts.push(child.text);
    else break;
  }
  return parts.join("").trim();
}

function childElements(node: Html5Element): Html5Element[] {
  return node.children.filter(isElement);
}

function findChildByLocalNames(
  node: Html5Element,
  names: string[],
): Html5Element | undefined {
  const set = new Set(names);
  return childElements(node).find((c) => {
    const local = c.tag.startsWith("o-") ? c.tag.slice(2) : c.tag;
    return set.has(local) || set.has(c.tag);
  });
}

function elementText(node: Html5Element): string {
  return node.children
    .map((c) => (isText(c) ? c.text : elementText(c)))
    .join("")
    .trim();
}

function inferProperty(
  parentType: string | undefined,
  childType: string,
  explicitProp: string | undefined,
  used: Set<string>,
): string | undefined {
  if (explicitProp) return explicitProp;
  if (!parentType) return undefined;

  const map = {
    ...(PROPERTY_TYPE_MAP[parentType] ?? {}),
  };

  const candidates = Object.entries(map)
    .filter(([prop, t]) => {
      if (used.has(prop)) return false;
      if (t === childType) return true;
      // Polymorphic slots: DATA_VALUE etc.
      if (POLYMORPHIC_TYPES.has(t) && childType.startsWith("DV_")) return true;
      if (t === "ITEM_STRUCTURE" && childType.startsWith("ITEM_")) return true;
      if (t === "CONTENT_ITEM") return true;
      if (t === "EVENT" && (childType === "POINT_EVENT" || childType === "INTERVAL_EVENT")) {
        return true;
      }
      if (t === "PARTY_PROXY" && childType.startsWith("PARTY_")) return true;
      return false;
    })
    .map(([prop]) => prop);

  if (candidates.length === 1) return candidates[0];

  // Common defaults
  if (childType === "HISTORY" && !used.has("data")) return "data";
  if (
    (childType === "ITEM_TREE" || childType === "ITEM_LIST" ||
      childType === "ITEM_TABLE" || childType === "ITEM_SINGLE") &&
    !used.has("data")
  ) {
    return "data";
  }
  if (childType === "EVENT_CONTEXT" && !used.has("context")) return "context";
  if (childType === "ELEMENT" || childType === "CLUSTER") {
    if (!used.has("items")) return "items";
  }
  if (
    childType === "POINT_EVENT" || childType === "INTERVAL_EVENT"
  ) {
    if (!used.has("events")) return "events";
  }
  if (
    childType === "OBSERVATION" || childType === "EVALUATION" ||
    childType === "INSTRUCTION" || childType === "ACTION" ||
    childType === "ADMIN_ENTRY" || childType === "SECTION"
  ) {
    if (!used.has("content")) return "content";
  }

  return candidates[0];
}

function readLocatableMeta(
  attrs: Record<string, string>,
  dialect: Html5Dialect,
): {
  nodeId?: string;
  archetypeId?: string;
  templateId?: string;
  rmVersion?: string;
} {
  let nodeId: string | undefined;
  let archRaw: string | undefined;
  let templateId: string | undefined;
  let rmVersion: string | undefined;
  let archKeyPresent = false;

  if (dialect === "short") {
    nodeId = attrs.n;
    archKeyPresent = Object.prototype.hasOwnProperty.call(attrs, "a");
    archRaw = attrs.a;
    templateId = attrs.tp;
    rmVersion = attrs.rm;
  } else if (dialect === "full") {
    nodeId = attrs["archetype-node-id"];
    archKeyPresent = Object.prototype.hasOwnProperty.call(attrs, "archetype-id");
    archRaw = attrs["archetype-id"];
    templateId = attrs["template-id"];
    rmVersion = attrs["rm-version"];
  } else {
    nodeId = attrs["🆔"];
    archKeyPresent = Object.prototype.hasOwnProperty.call(attrs, "Ⓐ");
    archRaw = attrs["Ⓐ"];
    templateId = attrs["Ⓣ"];
    rmVersion = attrs["⚙️"];
  }

  let archetypeId: string | undefined;
  if (archKeyPresent) {
    if (isArchetypeIdSameAsNodeIdFlag(archRaw)) {
      archetypeId = nodeId;
    } else if (archRaw != null && archRaw !== "") {
      archetypeId = archRaw;
    }
  }

  return { nodeId, archetypeId, templateId, rmVersion };
}

function deserializeDvQuantity(
  node: Html5Element,
  dialect: Html5Dialect,
): Record<string, unknown> {
  const out: Record<string, unknown> = { _type: "DV_QUANTITY" };
  const magNames = ["mag", "magnitude", "№"];
  const unitNames = ["unit", "units", "◌"];
  const magEl = findChildByLocalNames(node, magNames);
  const unitEl = findChildByLocalNames(node, unitNames);
  if (magEl) {
    const n = Number(elementText(magEl));
    out.magnitude = Number.isFinite(n) ? n : elementText(magEl);
  }
  if (unitEl) {
    out.units = elementText(unitEl);
    if (unitEl.attrs.u) out.units_system = unitEl.attrs.u;
  }

  const statusKey = dialect === "short"
    ? "mst"
    : dialect === "full"
    ? "magnitude-status"
    : String(SYMBOL_TABLE_EMOJI_SYMBOLS["DV_QUANTITY.magnitude_status"] ?? "🎛");
  const prcKey = dialect === "short"
    ? "prc"
    : dialect === "full"
    ? "precision"
    : String(SYMBOL_TABLE_EMOJI_SYMBOLS["DV_QUANTITY.precision"] ?? "⋯");
  const accKey = dialect === "short"
    ? "acc"
    : dialect === "full"
    ? "accuracy"
    : String(SYMBOL_TABLE_EMOJI_SYMBOLS["DV_QUANTITY.accuracy"] ?? "±");

  const status = decodeMagnitudeStatus(node.attrs[statusKey]);
  if (status && status !== MAGNITUDE_STATUS_EXACT_RM) {
    out.magnitude_status = status;
  }
  if (node.attrs[prcKey] != null) {
    const p = Number(node.attrs[prcKey]);
    out.precision = Number.isFinite(p) ? p : node.attrs[prcKey];
  }
  if (node.attrs[accKey] != null) {
    const a = Number(node.attrs[accKey]);
    out.accuracy = Number.isFinite(a) ? a : node.attrs[accKey];
  }
  return out;
}

function textMachineAttrNames(dialect: Html5Dialect): {
  definingCode: string[];
  formatting: string;
  hyperlink: string;
  mappings: string;
  encoding: string;
} {
  if (dialect === "short") {
    return {
      definingCode: [
        String(SYMBOL_TABLE_LETTER_SYMBOLS["DV_CODED_TEXT.defining_code"] ?? "dc"),
      ],
      formatting: String(
        SYMBOL_TABLE_LETTER_SYMBOLS["DV_TEXT.formatting"] ?? "xf",
      ),
      hyperlink: String(
        SYMBOL_TABLE_LETTER_SYMBOLS["DV_TEXT.hyperlink"] ?? "u",
      ),
      mappings: String(
        SYMBOL_TABLE_LETTER_SYMBOLS["DV_TEXT.mappings"] ?? "tm",
      ),
      encoding: String(
        SYMBOL_TABLE_LETTER_SYMBOLS["DV_TEXT.encoding"] ?? "enc",
      ),
    };
  }
  if (dialect === "full") {
    return {
      definingCode: ["defining-code"],
      formatting: "formatting",
      hyperlink: "hyperlink",
      mappings: "mappings",
      encoding: "encoding",
    };
  }
  const tag = String(
    SYMBOL_TABLE_EMOJI_SYMBOLS["DV_CODED_TEXT.defining_code"] ?? "🏷️",
  );
  return {
    // ≝🏷️ = optional property-qualified form of defining_code
    definingCode: [tag, `≝${tag}`],
    formatting: String(
      SYMBOL_TABLE_EMOJI_SYMBOLS["DV_TEXT.formatting"] ?? "🖹",
    ),
    hyperlink: String(
      SYMBOL_TABLE_EMOJI_SYMBOLS["DV_TEXT.hyperlink"] ?? "🔗",
    ),
    mappings: String(
      SYMBOL_TABLE_EMOJI_SYMBOLS["DV_TEXT.mappings"] ?? "⇄",
    ),
    encoding: String(
      SYMBOL_TABLE_EMOJI_SYMBOLS["DV_TEXT.encoding"] ?? "🔤",
    ),
  };
}

function canonicalCodePhrase(
  terminology: string | undefined,
  code: string | undefined,
): Record<string, unknown> | undefined {
  if (!code && !terminology) return undefined;
  const out: Record<string, unknown> = { _type: "CODE_PHRASE" };
  if (code) out.code_string = code;
  if (terminology) {
    out.terminology_id = { _type: "TERMINOLOGY_ID", value: terminology };
  }
  return out;
}

/** Parse terse CODE_PHRASE wire (with optional emoji terminology shortcuts). */
function parseTerseCodePhraseWire(
  raw: string | undefined,
): { terminology?: string; code?: string } | undefined {
  if (raw == null || raw === "") return undefined;
  const expanded = expandTerseString(raw.trim());
  if (isTerseCodePhrase(expanded)) {
    const m = expanded.match(/^([^:]+)::([^|]+)$/);
    if (m) return { terminology: m[1], code: m[2] };
  }
  // Bare code after a known emoji shortcut (e.g. attr value was already code-only)
  for (const { prefix, emoji } of TERMINOLOGY_SHORTCUTS) {
    if (raw.startsWith(emoji)) {
      return {
        terminology: prefix.replace(/::$/, ""),
        code: raw.slice(emoji.length),
      };
    }
  }
  // Non-terse fallback: treat whole string as code
  if (!expanded.includes("::")) return { code: expanded };
  return undefined;
}

function readTerminologyAndCode(
  attrs: Record<string, string>,
  dialect: Html5Dialect,
): { terminology?: string; code?: string } {
  const names = textMachineAttrNames(dialect);
  for (const key of names.definingCode) {
    if (attrs[key] != null) {
      const parsed = parseTerseCodePhraseWire(attrs[key]);
      if (parsed) return parsed;
    }
  }

  // Legacy split attrs (pre-terse html5)
  if (dialect === "short") {
    if (attrs.t != null || attrs.c != null) {
      return { terminology: attrs.t, code: attrs.c };
    }
  }
  if (dialect === "full" || dialect === "emoji") {
    if (attrs["terminology-id"] != null || attrs["code-string"] != null) {
      return {
        terminology: attrs["terminology-id"],
        code: attrs["code-string"],
      };
    }
  }
  // Legacy emoji: terminology shortcut emoji as attr name, code as value
  if (dialect === "emoji") {
    for (const { prefix, emoji } of TERMINOLOGY_SHORTCUTS) {
      if (attrs[emoji] != null) {
        return {
          terminology: prefix.replace(/::$/, ""),
          code: attrs[emoji],
        };
      }
    }
  }
  return {};
}

function parseMappingsWire(
  raw: string | undefined,
): Record<string, unknown>[] | undefined {
  if (raw == null || raw === "") return undefined;
  const out: Record<string, unknown>[] = [];
  for (const part of raw.split(";")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const pipe = trimmed.indexOf("|");
    if (pipe < 0) continue;
    const match = trimmed.slice(0, pipe);
    const rest = trimmed.slice(pipe + 1);
    // rest = target_terse  OR  target_terse|purpose_dv_coded_terse
    const purposeMatch = rest.match(
      /^([^|]+::[^|]+)\|([^:]+::[^|]+\|[^|]*\|)$/,
    );
    let targetRaw: string;
    let purpose: Record<string, unknown> | undefined;
    if (purposeMatch) {
      targetRaw = purposeMatch[1];
      const p = parseTerseDvCodedText(expandTerseString(purposeMatch[2]));
      if (p) {
        purpose = {
          _type: "DV_CODED_TEXT",
          value: p.value,
          defining_code: canonicalCodePhrase(p.termId, p.code),
        };
      }
    } else {
      targetRaw = rest;
    }
    const target = parseTerseCodePhraseWire(targetRaw);
    if (!target?.code) continue;
    const row: Record<string, unknown> = {
      _type: "TERM_MAPPING",
      match,
      target: canonicalCodePhrase(target.terminology, target.code),
    };
    if (purpose) row.purpose = purpose;
    out.push(row);
  }
  return out.length > 0 ? out : undefined;
}

function applyDvTextMachineAttrs(
  out: Record<string, unknown>,
  attrs: Record<string, string>,
  dialect: Html5Dialect,
): void {
  const names = textMachineAttrNames(dialect);

  if (attrs.lang) {
    out.language = languageCodePhrase(attrs.lang);
  }

  const encRaw = attrs[names.encoding];
  if (encRaw != null && encRaw !== "") {
    if (encRaw.includes("::") || /^(🔤|🌬️|📍)/.test(encRaw)) {
      const parsed = parseTerseCodePhraseWire(encRaw);
      if (parsed) {
        out.encoding = canonicalCodePhrase(
          parsed.terminology ?? "IANA_character-sets",
          parsed.code,
        );
      }
    } else {
      out.encoding = canonicalCodePhrase("IANA_character-sets", encRaw);
    }
  }

  if (attrs[names.formatting] != null && attrs[names.formatting] !== "") {
    out.formatting = attrs[names.formatting];
  }

  if (attrs[names.hyperlink] != null && attrs[names.hyperlink] !== "") {
    out.hyperlink = { _type: "DV_URI", value: attrs[names.hyperlink] };
  }

  const mappings = parseMappingsWire(attrs[names.mappings]);
  if (mappings) out.mappings = mappings;
}

function deserializeDvLeaf(
  rmType: string,
  node: Html5Element,
  dialect: Html5Dialect,
): Record<string, unknown> {
  if (rmType === "DV_QUANTITY") return deserializeDvQuantity(node, dialect);

  const text = elementText(node);
  const out: Record<string, unknown> = { _type: rmType };

  if (TECHNICAL_ID_TYPES.has(rmType)) {
    const id = node.attrs.title || text;
    if (id) out.value = id;
    return out;
  }

  switch (rmType) {
    case "DV_TEXT":
      out.value = text;
      applyDvTextMachineAttrs(out, node.attrs, dialect);
      break;
    case "DV_CODED_TEXT": {
      out.value = leadingText(node) || text;
      const { terminology, code } = readTerminologyAndCode(node.attrs, dialect);
      if (code) {
        out.defining_code = canonicalCodePhrase(terminology, code);
      }
      applyDvTextMachineAttrs(out, node.attrs, dialect);
      break;
    }
    case "CODE_PHRASE": {
      // Prefer terse text content; fall back to legacy split attrs.
      const fromText = parseTerseCodePhraseWire(text);
      if (fromText?.code) {
        Object.assign(out, canonicalCodePhrase(fromText.terminology, fromText.code));
      } else {
        const { terminology, code } = readTerminologyAndCode(node.attrs, dialect);
        out.code_string = code ?? text;
        if (terminology) {
          out.terminology_id = { _type: "TERMINOLOGY_ID", value: terminology };
        }
      }
      break;
    }
    case "DV_BOOLEAN":
      out.value = text === "true" || text === "1";
      break;
    case "DV_COUNT": {
      const n = Number(text);
      out.magnitude = Number.isFinite(n) ? n : text;
      break;
    }
    case "DV_DATE":
    case "DV_TIME":
    case "DV_DATE_TIME":
    case "DV_DURATION":
    case "DV_URI":
    case "DV_EHR_URI":
      out.value = text;
      break;
    case "DV_IDENTIFIER":
      out.id = text;
      break;
    case "DV_PROPORTION": {
      const num = findChildByLocalNames(node, ["num", "numerator"]);
      const den = findChildByLocalNames(node, ["den", "denominator"]);
      if (num) out.numerator = Number(elementText(num));
      if (den) out.denominator = Number(elementText(den));
      const pk = node.attrs.pk ?? node.attrs["proportion-kind"];
      if (pk != null) out.type = Number(pk);
      const prc = node.attrs.prc ?? node.attrs.precision;
      if (prc != null) out.precision = Number(prc);
      break;
    }
    default:
      if (text) out.value = text;
      break;
  }
  return out;
}

function deserializeElement(
  node: Html5Element,
  dialect: Html5Dialect,
  parentType?: string,
): unknown {
  const rmType = rmTypeFromTag(node.tag, dialect);
  if (!rmType) {
    throw new Error(`Unknown ZipEHR HTML5 tag: <${node.tag}>`);
  }

  if (isLeafRmType(rmType) && !LOCATABLE_LIKE_TYPES.has(rmType)) {
    return deserializeDvLeaf(rmType, node, dialect);
  }

  const out: Record<string, unknown> = { _type: rmType };
  const name = leadingText(node);
  if (name) {
    out.name = { _type: "DV_TEXT", value: name };
  }

  const meta = readLocatableMeta(node.attrs, dialect);
  if (meta.nodeId) out.archetype_node_id = meta.nodeId;
  if (meta.archetypeId || meta.templateId || meta.rmVersion) {
    const details: Record<string, unknown> = { _type: "ARCHETYPED" };
    if (meta.archetypeId) {
      details.archetype_id = { _type: "ARCHETYPE_ID", value: meta.archetypeId };
    }
    if (meta.templateId) {
      details.template_id = { _type: "TEMPLATE_ID", value: meta.templateId };
    }
    if (meta.rmVersion) details.rm_version = meta.rmVersion;
    out.archetype_details = details;
  }

  // Native HTML `lang` (preferred) + legacy openEHR language attribute forms.
  if (LANGUAGE_CARRIER_TYPES.has(rmType)) {
    if (node.attrs.lang) {
      out.language = languageCodePhrase(node.attrs.lang);
    } else if (node.attrs.language) {
      out.language = languageCodePhrase(node.attrs.language);
    } else if (node.attrs["🗪"] != null) {
      out.language = languageCodePhrase(node.attrs["🗪"]);
    }
  }

  // COMPOSITION territory / encoding promotions (emoji + full attr names)
  if (rmType === "COMPOSITION") {
    for (const { field, prefix, emoji } of [
      { field: "territory", prefix: "ISO_3166-1", emoji: "🌐" },
      { field: "encoding", prefix: "IANA_character-sets", emoji: "🔤" },
    ]) {
      const fromEmoji = node.attrs[emoji];
      const fromName = node.attrs[field];
      const code = fromEmoji ?? fromName;
      if (code != null) {
        out[field] = {
          _type: "CODE_PHRASE",
          terminology_id: { _type: "TERMINOLOGY_ID", value: prefix },
          code_string: code,
        };
      }
    }
  }

  const used = new Set<string>([
    "name",
    "archetype_node_id",
    "archetype_details",
  ]);
  if (out.language != null) used.add("language");
  if (out.territory != null) used.add("territory");
  if (out.encoding != null) used.add("encoding");
  const propAttr = node.attrs.p ?? node.attrs.property;

  for (const child of childElements(node)) {
    // Skip quantity/proportion nested value tags that aren't o-*
    if (!child.tag.startsWith("o-") && !child.tag.includes("-")) {
      // Could be mag/unit etc. under wrong parent — ignore at structure level
      const maybeType = rmTypeFromTag(
        child.tag.startsWith("o-") ? child.tag : `o-${child.tag}`,
        dialect,
      );
      if (!maybeType) continue;
    }

    let childType = rmTypeFromTag(child.tag, dialect);
    if (!childType) continue;

    const childObj = deserializeElement(child, dialect, rmType) as Record<
      string,
      unknown
    >;
    childType = String(childObj._type ?? childType);

    const explicit = child.attrs.p ?? child.attrs.property ?? propAttr;
    const prop = inferProperty(rmType, childType, explicit, used);
    if (!prop) {
      // Fall back: stash under a synthetic key only if needed
      continue;
    }
    used.add(prop);

    if (
      prop === "content" || prop === "items" || prop === "events" ||
      prop === "activities"
    ) {
      if (!Array.isArray(out[prop])) out[prop] = [];
      (out[prop] as unknown[]).push(childObj);
    } else if (out[prop] != null) {
      const existing = out[prop];
      out[prop] = Array.isArray(existing)
        ? [...existing, childObj]
        : [existing, childObj];
    } else {
      out[prop] = childObj;
    }
  }

  return out;
}

function isDataValueType(rmType: string): boolean {
  return rmType.startsWith("DV_") || rmType === "CODE_PHRASE" ||
    rmType === "TERM_MAPPING" || rmType === "REFERENCE_RANGE";
}

function isLeafRmType(rmType: string): boolean {
  return isDataValueType(rmType) || TECHNICAL_ID_TYPES.has(rmType);
}

/** Detect HTML5 dialect from markup (`fmt` attr or tag shape). */
export function detectHtml5Dialect(html: string): Html5Dialect | undefined {
  const trimmed = html.trim();
  if (!trimmed.startsWith("<")) return undefined;
  const fmtMatch = trimmed.match(/\bfmt="([^"]+)"/);
  const fromFmt = parseFmt(fmtMatch?.[1]);
  if (fromFmt) return fromFmt;

  const tagMatch = trimmed.match(/<o-([^>\s/]+)/);
  if (!tagMatch) return undefined;
  return detectDialectFromTag(tagMatch[1]);
}

/** True when text looks like ZipEHR HTML5 (`o-*` custom elements). */
export function looksLikeZipehrHtml5(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed.startsWith("<")) return false;
  if (/<o-[^>\s/]+/.test(trimmed)) return true;
  return Object.values(ZIPEHR_HTML5_URI).some((uri) => trimmed.includes(uri));
}

/** Deserialize ZipEHR HTML5 text to canonical openEHR JSON. */
export function zipehrHtml5ToCanonical(html: string): unknown {
  const root = parseFragment(html);
  const dialect = parseFmt(root.attrs.fmt) ??
    detectDialectFromTag(
      root.tag.startsWith("o-") ? root.tag.slice(2) : root.tag,
    );
  return deserializeElement(root, dialect);
}
