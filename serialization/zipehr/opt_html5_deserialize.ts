/**
 * Deserialize ZipEHR OPT HTML5 (`a-*`) back to a plain AOM-like JSON tree.
 * See opt_html5_v1.md.
 */

/// <reference lib="dom" />

import {
  SYMBOL_TABLE_EMOJI_SYMBOLS,
  SYMBOL_TABLE_LETTER_SYMBOLS,
  SYMBOL_TABLE_OPT_HTML5_SHORT_TAGS,
} from "./symbol_table.ts";
import {
  OPT_HTML5_FMT_TOKEN,
  type OptHtml5Dialect,
} from "./opt_html5_serialize.ts";

type Plain = Record<string, unknown>;

const AM_LETTER_TO_TYPE = new Map<string, string>();
const AM_EMOJI_TO_TYPE = new Map<string, string>();
const RM_EMOJI_TO_TYPE = new Map<string, string>();

const AM_CLASS_KEYS = [
  "OPERATIONAL_TEMPLATE",
  "C_COMPLEX_OBJECT",
  "C_ARCHETYPE_ROOT",
  "C_SINGLE_ATTRIBUTE",
  "C_MULTIPLE_ATTRIBUTE",
  "C_PRIMITIVE_OBJECT",
  "ARCHETYPE_SLOT",
  "CONSTRAINT_REF",
  "C_COMPLEX_OBJECT_PROXY",
  "C_STRING",
  "C_BOOLEAN",
  "C_INTEGER",
  "C_REAL",
  "C_DATE",
  "C_TIME",
  "C_DATE_TIME",
  "C_DURATION",
  "C_TERMINOLOGY_CODE",
  "CARDINALITY",
  "ARCHETYPE_TERMINOLOGY",
  "C_ATTRIBUTE_TUPLE",
  "C_PRIMITIVE_TUPLE",
] as const;

for (const key of AM_CLASS_KEYS) {
  const letter = SYMBOL_TABLE_LETTER_SYMBOLS[
    key as keyof typeof SYMBOL_TABLE_LETTER_SYMBOLS
  ];
  const emoji = SYMBOL_TABLE_EMOJI_SYMBOLS[
    key as keyof typeof SYMBOL_TABLE_EMOJI_SYMBOLS
  ];
  const override = SYMBOL_TABLE_OPT_HTML5_SHORT_TAGS[
    key as keyof typeof SYMBOL_TABLE_OPT_HTML5_SHORT_TAGS
  ];
  if (override) AM_LETTER_TO_TYPE.set(override.toLowerCase(), key);
  if (letter) AM_LETTER_TO_TYPE.set(String(letter).toLowerCase(), key);
  if (emoji) AM_EMOJI_TO_TYPE.set(String(emoji), key);
}

// RM emoji reverse (for compound peel) — skip AM classes and PascalCase foundation types
for (const [k, v] of Object.entries(SYMBOL_TABLE_EMOJI_SYMBOLS)) {
  if (k.includes(".")) continue;
  if (AM_CLASS_KEYS.includes(k as typeof AM_CLASS_KEYS[number])) continue;
  if (/^[A-Z][a-z]/.test(k)) continue; // Boolean, Integer, …
  RM_EMOJI_TO_TYPE.set(v, k);
}

function parseMultiplicity(wire: string | null | undefined): Plain | undefined {
  if (!wire) return undefined;
  const m = /^(\d+)\.\.(\d+|\*)$/.exec(wire);
  if (!m) return undefined;
  const lower = Number(m[1]);
  const upperUnbounded = m[2] === "*";
  const upper = upperUnbounded ? undefined : Number(m[2]);
  return {
    _type: "Multiplicity_interval",
    lower,
    upper,
    lower_included: true,
    upper_included: true,
    lower_unbounded: false,
    upper_unbounded: upperUnbounded,
  };
}

function kebabToAm(kebab: string): string {
  return kebab.toUpperCase().replace(/-/g, "_");
}

/**
 * Resolve AM type (+ optional RM type from compound emoji) from `a-…` local name.
 */
export function resolveOptTag(
  localName: string,
  dialectHint?: OptHtml5Dialect,
): { amType: string; rmType?: string; dialect: OptHtml5Dialect } {
  const raw = localName.startsWith("a-") ? localName.slice(2) : localName;

  // Full dialect: ASCII kebab
  if (/^[a-z][a-z0-9-]*$/.test(raw) && raw.includes("-")) {
    return { amType: kebabToAm(raw), dialect: "full" };
  }
  if (/^[a-z][a-z0-9]*$/.test(raw) && AM_LETTER_TO_TYPE.has(raw)) {
    return { amType: AM_LETTER_TO_TYPE.get(raw)!, dialect: "short" };
  }

  // Emoji: try exact AM emoji, then AM prefix + RM suffix (longest AM first)
  if (AM_EMOJI_TO_TYPE.has(raw)) {
    return { amType: AM_EMOJI_TO_TYPE.get(raw)!, dialect: "emoji" };
  }

  const amEmojis = [...AM_EMOJI_TO_TYPE.keys()].sort(
    (a, b) => b.length - a.length,
  );
  for (const am of amEmojis) {
    if (raw.startsWith(am) && raw.length > am.length) {
      const rest = raw.slice(am.length);
      const rm = RM_EMOJI_TO_TYPE.get(rest);
      if (rm) {
        return {
          amType: AM_EMOJI_TO_TYPE.get(am)!,
          rmType: rm,
          dialect: "emoji",
        };
      }
    }
  }

  if (dialectHint === "short" && AM_LETTER_TO_TYPE.has(raw.toLowerCase())) {
    return {
      amType: AM_LETTER_TO_TYPE.get(raw.toLowerCase())!,
      dialect: "short",
    };
  }

  return { amType: kebabToAm(raw), dialect: dialectHint ?? "full" };
}

function dialectFromFmt(fmt: string | null): OptHtml5Dialect | undefined {
  if (!fmt) return undefined;
  if (fmt === OPT_HTML5_FMT_TOKEN.short || fmt.includes("opt-html5/short")) {
    return "short";
  }
  if (fmt === OPT_HTML5_FMT_TOKEN.full || fmt.includes("opt-html5/full")) {
    return "full";
  }
  if (fmt === OPT_HTML5_FMT_TOKEN.emoji || fmt.includes("opt-html5/emoji")) {
    return "emoji";
  }
  return undefined;
}

function getAttr(
  el: Element,
  dialect: OptHtml5Dialect,
  logical:
    | "node_id"
    | "rm_type_name"
    | "occurrences"
    | "rm_attribute_name"
    | "existence"
    | "cardinality"
    | "archetype_ref"
    | "constraint"
    | "reference",
): string | null {
  const map: Record<typeof logical, [string, string, string]> = {
    node_id: ["ni", "node-id", "🆔"],
    rm_type_name: ["rt", "rm-type-name", "🅁"],
    occurrences: ["oc", "occurrences", "🔢"],
    rm_attribute_name: ["an", "rm-attribute-name", "📎"],
    existence: ["ex", "existence", "∃"],
    cardinality: ["cd", "cardinality", "#️⃣"],
    archetype_ref: ["ar", "archetype-ref", "Ⓐ"],
    constraint: ["tc", "constraint", "🔖"],
    reference: ["rf", "reference", "↪"],
  };
  const [short, full, emoji] = map[logical];
  const name = dialect === "short" ? short : dialect === "full" ? full : emoji;
  return el.getAttribute(name) ??
    el.getAttribute(short) ??
    el.getAttribute(full) ??
    el.getAttribute(emoji);
}

function elementText(el: Element): string {
  let text = "";
  for (const node of el.childNodes) {
    if (node.nodeType === 3 /* TEXT */) {
      text += node.textContent ?? "";
    }
  }
  return text.trim();
}

function isAmElement(el: Element): boolean {
  const name = el.localName ?? el.tagName?.toLowerCase() ?? "";
  return name.startsWith("a-");
}

function parseElement(el: Element, dialect: OptHtml5Dialect): Plain {
  const local = (el.localName ?? el.tagName).toLowerCase();
  if (local === "ch") {
    const dc = el.getAttribute("dc") ??
      el.getAttribute("defining-code") ??
      el.getAttribute("🏷️") ??
      "";
    const code = dc.includes("::") ? dc.split("::").pop()! : dc;
    return {
      _type: "OPT_CHOICE",
      code,
      defining_code: dc || undefined,
      value: elementText(el) || code,
    };
  }

  const { amType, rmType: rmFromTag } = resolveOptTag(
    el.localName ?? el.tagName,
    dialect,
  );
  const out: Plain = { _type: amType };

  const nodeId = getAttr(el, dialect, "node_id");
  if (nodeId) out.node_id = nodeId;

  const rmType = getAttr(el, dialect, "rm_type_name") ?? rmFromTag;
  if (rmType) out.rm_type_name = rmType;

  const occ = parseMultiplicity(getAttr(el, dialect, "occurrences"));
  if (occ) out.occurrences = occ;

  const an = getAttr(el, dialect, "rm_attribute_name");
  if (an) out.rm_attribute_name = an;

  const ex = parseMultiplicity(getAttr(el, dialect, "existence"));
  if (ex) out.existence = ex;

  const cardWire = getAttr(el, dialect, "cardinality");
  if (cardWire) {
    out.cardinality = {
      _type: "CARDINALITY",
      interval: parseMultiplicity(cardWire),
      is_ordered: el.hasAttribute("ord"),
    };
  }

  const ar = getAttr(el, dialect, "archetype_ref");
  if (ar) out.archetype_ref = ar;

  const constraint = getAttr(el, dialect, "constraint");
  if (constraint) out.constraint = constraint;

  const reference = getAttr(el, dialect, "reference");
  if (reference) out.reference = reference;

  const text = elementText(el);
  if (text) out.name = text;

  const childEls = [...el.children].filter((c) =>
    isAmElement(c) || (c.localName ?? c.tagName).toLowerCase() === "ch"
  );

  if (
    amType === "C_SINGLE_ATTRIBUTE" || amType === "C_MULTIPLE_ATTRIBUTE"
  ) {
    out.children = childEls.map((c) => parseElement(c, dialect));
  } else if (amType === "OPERATIONAL_TEMPLATE") {
    const def = childEls.find((c) => {
      const t = resolveOptTag(c.localName ?? c.tagName, dialect).amType;
      return t === "C_COMPLEX_OBJECT" || t === "C_ARCHETYPE_ROOT";
    });
    if (def) out.definition = parseElement(def, dialect);
    const tid = nodeId;
    if (tid) {
      out.archetype_id = { _type: "ARCHETYPE_ID", value: tid };
    }
    if (text) out.concept = text;
    const lang = el.getAttribute("lang");
    if (lang) out.original_language = lang;
  } else if (
    amType === "C_COMPLEX_OBJECT" || amType === "C_ARCHETYPE_ROOT"
  ) {
    const attrs = childEls.filter((c) => {
      const t = resolveOptTag(c.localName ?? c.tagName, dialect).amType;
      return t === "C_SINGLE_ATTRIBUTE" || t === "C_MULTIPLE_ATTRIBUTE";
    });
    if (attrs.length) {
      out.attributes = attrs.map((c) => parseElement(c, dialect));
    }
    const choices = childEls
      .filter((c) => (c.localName ?? c.tagName).toLowerCase() === "ch")
      .map((c) => parseElement(c, dialect));
    if (choices.length) out.choices = choices;
  } else {
    const nested = childEls.map((c) => parseElement(c, dialect));
    const choices = nested.filter((n) => n._type === "OPT_CHOICE");
    const rest = nested.filter((n) => n._type !== "OPT_CHOICE");
    if (choices.length) out.choices = choices;
    if (rest.length === 1) out.item = rest[0];
    else if (rest.length > 1) out.children = rest;
  }

  return out;
}

export function looksLikeOptHtml5(html: string): boolean {
  const t = html.trim();
  if (!t.startsWith("<")) return false;
  return /<a-[^\s>]+/i.test(t) &&
    (/fmt\s*=\s*["']?o[sfe]1/i.test(t) || /a-(?:ot|🗂|operational-template)/i.test(t));
}

export function detectOptHtml5Dialect(html: string): OptHtml5Dialect | undefined {
  const m = html.match(/\bfmt\s*=\s*["']?([a-z0-9./:_-]+)/i);
  if (m) {
    const d = dialectFromFmt(m[1]);
    if (d) return d;
  }
  if (/<a-operational-template\b/i.test(html) || /<a-c-[a-z]/i.test(html)) {
    return "full";
  }
  if (/<a-[^\s>]*[⬡◆▸≡🗂▣]/u.test(html)) return "emoji";
  if (/<a-(?:ot|cc|cr|sa|ma|cp)\b/i.test(html)) return "short";
  return undefined;
}

/**
 * Parse OPT HTML5 string into plain AOM-like JSON (`_type` fields).
 * Uses DOMParser in browser; linkedom-style or regex fallback is not required —
 * Deno tests can pass a pre-parsed Document / Element via `optHtml5ElementToPlain`.
 */
export function optHtml5ToPlain(html: string): Plain {
  const dialect = detectOptHtml5Dialect(html) ?? "short";
  const Doc = (globalThis as { DOMParser?: typeof DOMParser }).DOMParser;
  if (!Doc) {
    throw new Error(
      "optHtml5ToPlain requires DOMParser (browser or polyfill)",
    );
  }
  const doc = new Doc().parseFromString(html.trim(), "text/html");
  const root = doc.body?.querySelector("[fmt]") ??
    doc.body?.querySelector(":first-child") ??
    doc.documentElement;
  if (!root || !(root instanceof Element)) {
    throw new Error("OPT HTML5: no root element");
  }
  return parseElement(root, dialect);
}

export function optHtml5ElementToPlain(
  el: Element,
  dialect?: OptHtml5Dialect,
): Plain {
  const fmt = el.getAttribute("fmt");
  const d = dialect ?? dialectFromFmt(fmt) ?? "short";
  return parseElement(el, d);
}
