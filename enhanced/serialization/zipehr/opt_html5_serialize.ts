/**
 * Serialize AOM2 OPERATIONAL_TEMPLATE to ZipEHR OPT HTML5 (`a-*` custom elements).
 * See opt_html5_v1.md.
 */

import * as openehr_am from "../../openehr_am.ts";
import * as openehr_base from "../../openehr_base.ts";
import {
  SYMBOL_TABLE_EMOJI_SYMBOLS,
  SYMBOL_TABLE_LETTER_SYMBOLS,
  SYMBOL_TABLE_OPT_HTML5_SHORT_TAGS,
} from "./symbol_table.ts";
import type { Html5Dialect, Html5Layout } from "./html5_serialize.ts";

export type OptHtml5Dialect = Html5Dialect;
export type OptHtml5Layout = Html5Layout;

export type OptHtml5SerializeOptions = {
  dialect: OptHtml5Dialect;
  /** Default: oneliner for short, linesaving for full/emoji. */
  layout?: OptHtml5Layout;
  lang?: string;
};

export const OPT_HTML5_URI = {
  short: "http://purl.org/ehrtslib/zipehr/opt-html5/short/v1",
  full: "http://purl.org/ehrtslib/zipehr/opt-html5/full/v1",
  emoji: "http://purl.org/ehrtslib/zipehr/opt-html5/emoji/v1",
} as const;

export const OPT_HTML5_FMT_TOKEN: Record<OptHtml5Dialect, string> = {
  short: "os1",
  full: "of1",
  emoji: "oe1",
};

/** AM classes that may compound with an RM type emoji in the emoji dialect.
 * Foundation-backed C_* primitives already use 🔐+foundation and are not re-compounded.
 */
const COMPOUNDABLE_AM = new Set([
  "C_COMPLEX_OBJECT",
  "C_ARCHETYPE_ROOT",
  "C_PRIMITIVE_OBJECT",
  "ARCHETYPE_SLOT",
  "CONSTRAINT_REF",
  "C_COMPLEX_OBJECT_PROXY",
  "C_DATE",
  "C_TIME",
  "C_DATE_TIME",
  "C_DURATION",
  "C_TERMINOLOGY_CODE",
]);

type TermBag = Record<string, { text?: unknown; description?: unknown }>;

type Ctx = {
  dialect: OptHtml5Dialect;
  layout: OptHtml5Layout;
  terms: TermBag;
  lang: string;
};

function escapeXmlText(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeXmlAttr(text: string): string {
  return escapeXmlText(text).replace(/"/g, "&quot;");
}

function amToKebab(amType: string): string {
  return amType.toLowerCase().replace(/_/g, "-");
}

function letterFor(amType: string): string {
  const override =
    SYMBOL_TABLE_OPT_HTML5_SHORT_TAGS[
      amType as keyof typeof SYMBOL_TABLE_OPT_HTML5_SHORT_TAGS
    ];
  if (override) return override;
  const letter =
    SYMBOL_TABLE_LETTER_SYMBOLS[
      amType as keyof typeof SYMBOL_TABLE_LETTER_SYMBOLS
    ];
  return String(letter ?? amType).toLowerCase();
}

function emojiFor(amType: string): string | undefined {
  return SYMBOL_TABLE_EMOJI_SYMBOLS[
    amType as keyof typeof SYMBOL_TABLE_EMOJI_SYMBOLS
  ];
}

function rmEmoji(rmType: string | undefined): string | undefined {
  if (!rmType) return undefined;
  return SYMBOL_TABLE_EMOJI_SYMBOLS[
    rmType as keyof typeof SYMBOL_TABLE_EMOJI_SYMBOLS
  ];
}

/**
 * Tag local name after `a-`. Emoji dialect may use AM+RM compound when both known.
 */
export function optTagForType(
  amType: string,
  dialect: OptHtml5Dialect,
  rmTypeName?: string,
): string {
  if (dialect === "full") return `a-${amToKebab(amType)}`;
  if (dialect === "emoji") {
    const am = emojiFor(amType) ?? amType;
    if (COMPOUNDABLE_AM.has(amType)) {
      const rm = rmEmoji(rmTypeName);
      if (rm) return `a-${am}${rm}`;
    }
    return `a-${am}`;
  }
  return `a-${letterFor(amType)}`;
}

function attrName(
  key:
    | "node_id"
    | "rm_type_name"
    | "occurrences"
    | "rm_attribute_name"
    | "existence"
    | "cardinality"
    | "archetype_ref"
    | "constraint"
    | "reference",
  dialect: OptHtml5Dialect,
): string {
  const dotted: Record<typeof key, string> = {
    node_id: "C_OBJECT.node_id",
    rm_type_name: "C_OBJECT.rm_type_name",
    occurrences: "C_OBJECT.occurrences",
    rm_attribute_name: "C_ATTRIBUTE.rm_attribute_name",
    existence: "C_ATTRIBUTE.existence",
    cardinality: "C_MULTIPLE_ATTRIBUTE.cardinality",
    archetype_ref: "C_ARCHETYPE_ROOT.archetype_ref",
    constraint: "C_TERMINOLOGY_CODE.constraint",
    reference: "CONSTRAINT_REF.reference",
  };
  if (dialect === "full") {
    return key.replace(/_/g, "-");
  }
  if (dialect === "emoji") {
    return String(
      SYMBOL_TABLE_EMOJI_SYMBOLS[
        dotted[key] as keyof typeof SYMBOL_TABLE_EMOJI_SYMBOLS
      ] ?? key,
    );
  }
  return String(
    SYMBOL_TABLE_LETTER_SYMBOLS[
      dotted[key] as keyof typeof SYMBOL_TABLE_LETTER_SYMBOLS
    ] ?? key,
  );
}

function boundValue(v: unknown): number | undefined {
  if (typeof v === "number") return v;
  if (v && typeof v === "object") {
    const inner = (v as { value?: unknown }).value;
    if (typeof inner === "number") return inner;
  }
  return undefined;
}

function multiplicityWire(
  m?: openehr_base.Multiplicity_interval,
): string | undefined {
  if (!m) return undefined;
  const min = boundValue(m.lower) ?? 0;
  const max = m.upper_unbounded ? "*" : (boundValue(m.upper) ?? 1);
  return `${min}..${max}`;
}

function termLabel(val: unknown): string | undefined {
  if (typeof val === "string" && val && val !== "[object Object]") return val;
  if (val && typeof val === "object") {
    const o = val as Record<string, unknown>;
    return termLabel(o.value) ?? termLabel(o.text) ?? termLabel(o["#text"]);
  }
  return undefined;
}

function lookupTerm(
  terms: TermBag,
  nodeId?: string,
): { text?: string; description?: string } {
  if (!nodeId) return {};
  const at = nodeId.replace(/^id(\d)/i, "at$1");
  const raw = terms[nodeId] ?? terms[at];
  if (!raw) return {};
  return {
    text: termLabel(raw.text),
    description: termLabel(raw.description),
  };
}

function amTypeOf(obj: unknown): string {
  if (obj instanceof openehr_am.C_ARCHETYPE_ROOT) return "C_ARCHETYPE_ROOT";
  if (obj instanceof openehr_am.C_COMPLEX_OBJECT) return "C_COMPLEX_OBJECT";
  if (obj instanceof openehr_am.C_TERMINOLOGY_CODE) return "C_TERMINOLOGY_CODE";
  if (obj instanceof openehr_am.C_PRIMITIVE_OBJECT) return "C_PRIMITIVE_OBJECT";
  if (obj instanceof openehr_am.ARCHETYPE_SLOT) return "ARCHETYPE_SLOT";
  if (obj instanceof openehr_am.CONSTRAINT_REF) return "CONSTRAINT_REF";
  if (obj instanceof openehr_am.C_COMPLEX_OBJECT_PROXY) {
    return "C_COMPLEX_OBJECT_PROXY";
  }
  if (obj instanceof openehr_am.C_STRING) return "C_STRING";
  if (obj instanceof openehr_am.C_BOOLEAN) return "C_BOOLEAN";
  if (obj instanceof openehr_am.C_INTEGER) return "C_INTEGER";
  if (obj instanceof openehr_am.C_REAL) return "C_REAL";
  if (obj instanceof openehr_am.C_DATE) return "C_DATE";
  if (obj instanceof openehr_am.C_TIME) return "C_TIME";
  if (obj instanceof openehr_am.C_DATE_TIME) return "C_DATE_TIME";
  if (obj instanceof openehr_am.C_DURATION) return "C_DURATION";
  if (obj instanceof openehr_am.C_MULTIPLE_ATTRIBUTE) {
    return "C_MULTIPLE_ATTRIBUTE";
  }
  if (obj instanceof openehr_am.C_SINGLE_ATTRIBUTE) return "C_SINGLE_ATTRIBUTE";
  if (obj instanceof openehr_am.C_ATTRIBUTE) return "C_SINGLE_ATTRIBUTE";
  if (obj instanceof openehr_am.OPERATIONAL_TEMPLATE) {
    return "OPERATIONAL_TEMPLATE";
  }
  return (obj as { constructor?: { name?: string } })?.constructor?.name ??
    "C_OBJECT";
}

function openTag(
  tag: string,
  attrs: Record<string, string | true | undefined>,
): string {
  const parts: string[] = [tag];
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === "") continue;
    if (v === true) parts.push(k);
    else parts.push(`${k}="${escapeXmlAttr(String(v))}"`);
  }
  return `<${parts.join(" ")}>`;
}

function indentOf(depth: number, layout: OptHtml5Layout): string {
  if (layout === "oneliner") return "";
  return "\n" + "  ".repeat(depth);
}

function joinChildren(
  parts: string[],
  depth: number,
  layout: OptHtml5Layout,
): string {
  if (parts.length === 0) return "";
  if (layout === "oneliner") return parts.join("");
  const joined = parts.join(indentOf(depth + 1, layout));
  return indentOf(depth + 1, layout) + joined + indentOf(depth, layout);
}

function renderChoice(
  code: string,
  label: string | undefined,
  ctx: Ctx,
  depth: number,
): string {
  const dcAttr = ctx.dialect === "full"
    ? "defining-code"
    : ctx.dialect === "emoji"
    ? "🏷️"
    : "dc";
  const text = label ?? code;
  const open = openTag("ch", { [dcAttr]: `local::${code}` });
  const body = escapeXmlText(text);
  if (ctx.layout === "fluffy") {
    return `${indentOf(depth, ctx.layout)}${open}${body}</ch>`;
  }
  return `${open}${body}</ch>`;
}

function collectCodedChoices(
  obj: openehr_am.C_OBJECT,
  ctx: Ctx,
): Array<{ code: string; label?: string }> {
  const out: Array<{ code: string; label?: string }> = [];

  if (obj instanceof openehr_am.C_TERMINOLOGY_CODE && obj.constraint) {
    const c = obj.constraint;
    if (c.startsWith("ac")) {
      // value-set id — expand from ontology if present is out of scope; show code
      out.push({ code: c, label: c });
    } else if (c.startsWith("at") || c.startsWith("id")) {
      const term = lookupTerm(ctx.terms, c);
      out.push({ code: c, label: term.text ?? c });
    }
  }

  if (obj instanceof openehr_am.C_STRING) {
    const list = (obj as { list?: string[] }).list;
    if (list?.length) {
      for (const s of list) out.push({ code: s, label: s });
    }
  }

  // ELEMENT value alternatives often appear as sibling C_OBJECTs under value attr;
  // coded DV_CODED_TEXT may carry list via nested C_TERMINOLOGY_CODE — handled recursively.

  return out;
}

function renderCObject(
  obj: openehr_am.C_OBJECT,
  ctx: Ctx,
  depth: number,
  rootAttrs?: Record<string, string | true | undefined>,
): string {
  const amType = amTypeOf(obj);
  const rmType = obj.rm_type_name;
  const tag = optTagForType(amType, ctx.dialect, rmType);
  const attrs: Record<string, string | true | undefined> = {
    ...(rootAttrs ?? {}),
  };

  if (obj.node_id) {
    attrs[attrName("node_id", ctx.dialect)] = obj.node_id;
  }

  // Emit rm_type_name unless emoji compound already encodes it.
  const compounded = ctx.dialect === "emoji" &&
    COMPOUNDABLE_AM.has(amType) &&
    !!rmEmoji(rmType);
  if (rmType && !compounded) {
    attrs[attrName("rm_type_name", ctx.dialect)] = rmType;
  }

  const occ = multiplicityWire(obj.occurrences);
  if (occ) attrs[attrName("occurrences", ctx.dialect)] = occ;

  if (obj instanceof openehr_am.C_ARCHETYPE_ROOT && obj.archetype_ref) {
    attrs[attrName("archetype_ref", ctx.dialect)] = obj.archetype_ref;
  }

  if (obj instanceof openehr_am.CONSTRAINT_REF && obj.reference) {
    attrs[attrName("reference", ctx.dialect)] = obj.reference;
  }

  if (obj instanceof openehr_am.C_TERMINOLOGY_CODE && obj.constraint) {
    attrs[attrName("constraint", ctx.dialect)] = obj.constraint;
  }

  // Hydration / form hints
  const leafAm = new Set([
    "C_PRIMITIVE_OBJECT",
    "C_TERMINOLOGY_CODE",
    "C_STRING",
    "C_BOOLEAN",
    "C_INTEGER",
    "C_REAL",
    "C_DATE",
    "C_TIME",
    "C_DATE_TIME",
    "C_DURATION",
  ]);
  const isComplexWithAttrs = obj instanceof openehr_am.C_COMPLEX_OBJECT &&
    (obj.attributes?.length ?? 0) > 0;
  const isLeafValue = leafAm.has(amType) ||
    (rmType === "ELEMENT") ||
    (!!rmType?.startsWith("DV_") && !isComplexWithAttrs);

  if (isLeafValue) {
    attrs["data-opt-field"] = true;
  }
  if (occ) {
    const [lo] = occ.split("..");
    if (lo === "0") attrs["data-opt-optional"] = true;
  }

  const term = lookupTerm(ctx.terms, obj.node_id);
  const displayName = term.text;

  const children: string[] = [];

  if (obj instanceof openehr_am.C_COMPLEX_OBJECT) {
    for (const attr of obj.attributes ?? []) {
      children.push(renderCAttribute(attr, ctx, depth + 1));
    }
  }

  // Nested primitive item
  if (
    obj instanceof openehr_am.C_PRIMITIVE_OBJECT &&
    obj.item &&
    !(obj instanceof openehr_am.C_TERMINOLOGY_CODE)
  ) {
    const item = obj.item;
    if (item instanceof openehr_am.C_OBJECT) {
      children.push(renderCObject(item, ctx, depth + 1));
    } else {
      // C_PRIMITIVE leaf (C_STRING etc.)
      children.push(renderPrimitive(item, ctx, depth + 1));
    }
  }

  for (const ch of collectCodedChoices(obj, ctx)) {
    children.push(renderChoice(ch.code, ch.label, ctx, depth + 1));
  }

  const open = openTag(tag, attrs);
  const text = displayName ? escapeXmlText(displayName) : "";
  const childBlock = joinChildren(children, depth, ctx.layout);

  if (ctx.layout === "oneliner") {
    return `${open}${text}${children.join("")}</${tag}>`;
  }
  if (children.length === 0) {
    return `${open}${text}</${tag}>`;
  }
  return `${open}${text}${childBlock}</${tag}>`;
}

function renderPrimitive(
  prim: unknown,
  ctx: Ctx,
  depth: number,
): string {
  const amType = amTypeOf(prim);
  const tag = optTagForType(amType, ctx.dialect);
  const attrs: Record<string, string | true | undefined> = {
    "data-opt-field": true,
  };

  if (prim instanceof openehr_am.C_STRING) {
    if (prim.pattern) attrs.pattern = prim.pattern;
    const list = (prim as { list?: string[] }).list;
    const children = (list ?? []).map((s) =>
      renderChoice(s, s, ctx, depth + 1)
    );
    const open = openTag(tag, attrs);
    return `${open}${joinChildren(children, depth, ctx.layout)}</${tag}>`;
  }

  if (prim instanceof openehr_am.C_BOOLEAN) {
    const open = openTag(tag, attrs);
    return `${open}<ch>true</ch><ch>false</ch></${tag}>`;
  }

  const open = openTag(tag, attrs);
  return `${open}</${tag}>`;
}

function renderCAttribute(
  attr: openehr_am.C_ATTRIBUTE,
  ctx: Ctx,
  depth: number,
): string {
  const amType = attr instanceof openehr_am.C_MULTIPLE_ATTRIBUTE
    ? "C_MULTIPLE_ATTRIBUTE"
    : "C_SINGLE_ATTRIBUTE";
  const tag = optTagForType(amType, ctx.dialect);
  const attrs: Record<string, string | true | undefined> = {};

  const an = attr.rm_attribute_name;
  if (an) attrs[attrName("rm_attribute_name", ctx.dialect)] = an;

  const ex = multiplicityWire(attr.existence);
  if (ex) attrs[attrName("existence", ctx.dialect)] = ex;

  if (attr instanceof openehr_am.C_MULTIPLE_ATTRIBUTE && attr.cardinality) {
    const card = multiplicityWire(attr.cardinality.interval);
    if (card) attrs[attrName("cardinality", ctx.dialect)] = card;
    if (attr.cardinality.is_ordered) attrs.ord = true;
  }

  // Alternatives under single-valued attrs are mutually exclusive choices
  const childrenObjs =
    (attr as { children?: openehr_am.C_OBJECT[] }).children ?? [];
  if (amType === "C_SINGLE_ATTRIBUTE" && childrenObjs.length > 1) {
    attrs["data-opt-choices"] = true;
  }

  const open = openTag(tag, attrs);
  const text = an ? escapeXmlText(an) : "";
  const children = childrenObjs.map((c) => renderCObject(c, ctx, depth + 1));

  if (ctx.layout === "oneliner") {
    return `${open}${text}${children.join("")}</${tag}>`;
  }
  return `${open}${text}${joinChildren(children, depth, ctx.layout)}</${tag}>`;
}

function resolveTerms(
  opt: openehr_am.OPERATIONAL_TEMPLATE,
  langHint?: string,
): { terms: TermBag; lang: string } {
  const origLang = opt.original_language;
  const defaultLanguage =
    (typeof origLang === "string"
      ? origLang
      : (origLang as { code_string?: string } | undefined)?.code_string) ??
      langHint ??
      "en";

  const termDefs = (opt.ontology?.term_definitions ?? {}) as Record<
    string,
    TermBag
  >;
  const available = Object.keys(termDefs);
  const lang = [langHint, defaultLanguage, ...available].find(
    (l): l is string => !!l && !!termDefs[l],
  ) ?? langHint ?? defaultLanguage;

  return { terms: termDefs[lang] ?? {}, lang };
}

/**
 * Serialize an OPERATIONAL_TEMPLATE to OPT HTML5 markup.
 */
export function serializeOperationalTemplateToHtml5(
  opt: openehr_am.OPERATIONAL_TEMPLATE,
  options: OptHtml5SerializeOptions,
): string {
  const dialect = options.dialect;
  const layout = options.layout ??
    (dialect === "short" ? "oneliner" : "linesaving");
  const { terms, lang } = resolveTerms(opt, options.lang);
  const ctx: Ctx = { dialect, layout, terms, lang };

  const tag = optTagForType("OPERATIONAL_TEMPLATE", dialect);
  const templateId = opt.archetype_id?.value ??
    (typeof opt.archetype_id === "string" ? opt.archetype_id : undefined) ??
    "template";
  const concept = opt.concept ?? lookupTerm(terms, opt.concept).text ??
    templateId;

  const rootAttrs: Record<string, string | true | undefined> = {
    fmt: OPT_HTML5_FMT_TOKEN[dialect],
    [attrName("node_id", dialect)]: templateId,
    lang,
  };

  const open = openTag(tag, rootAttrs);
  const text = escapeXmlText(String(concept));

  const def = opt.definition;
  const body = def
    ? renderCObject(def, ctx, 1)
    : "";

  if (layout === "oneliner") {
    return `${open}${text}${body}</${tag}>`;
  }
  const sep = indentOf(1, layout);
  return `${open}${text}${sep}${body}${indentOf(0, layout)}</${tag}>`;
}

export function serializeToOptHtml5Variant(
  opt: openehr_am.OPERATIONAL_TEMPLATE,
  variant:
    | "opt.html5.short"
    | "opt.html5.full"
    | "opt.html5.emoji",
  options?: Omit<OptHtml5SerializeOptions, "dialect">,
): string {
  const dialect = variant.endsWith("short")
    ? "short"
    : variant.endsWith("full")
    ? "full"
    : "emoji";
  return serializeOperationalTemplateToHtml5(opt, {
    dialect,
    ...options,
  });
}
