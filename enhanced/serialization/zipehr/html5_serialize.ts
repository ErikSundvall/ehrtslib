/**
 * Serialize canonical openEHR JSON to ZipEHR HTML5 custom-element formats.
 * See oehr_html5_v1.md.
 */

import {
  MAGNITUDE_STATUS_EXACT_RM,
  MAGNITUDE_STATUS_OPERATORS,
  SYMBOL_TABLE_EMOJI_SYMBOLS,
  SYMBOL_TABLE_HTML5_SHORT_TAGS,
  SYMBOL_TABLE_LETTER_SYMBOLS,
  TERMINOLOGY_SHORTCUTS,
} from "./symbol_table.ts";
import {
  LOCATABLE_LIKE_TYPES,
  PROPERTY_TYPE_MAP,
} from "./shared.ts";

export type Html5Dialect = "short" | "full" | "emoji";

/**
 * Output density for HTML5 markup:
 * - `oneliner` — fully compact (no insignificant whitespace)
 * - `linesaving` — hybrid: keep small related clusters on one line (like zipehr.json)
 * - `fluffy` — standard indented HTML (one logical element block per line)
 */
export type Html5Layout = "oneliner" | "linesaving" | "fluffy";

export type Html5SerializeOptions = {
  dialect: Html5Dialect;
  /**
   * Layout density. Default: `oneliner` for short, `linesaving` for full/emoji.
   */
  layout?: Html5Layout;
  lang?: string;
  /** When true, omit LOCATABLE name text (codes/ids still emitted). */
  omitLocatableNames?: boolean;
};

export const ZIPEHR_HTML5_URI = {
  short: "http://purl.org/ehrtslib/zipehr/html5/short/v1",
  full: "http://purl.org/ehrtslib/zipehr/html5/full/v1",
  emoji: "http://purl.org/ehrtslib/zipehr/html5/emoji/v1",
} as const;

export const ZIPEHR_HTML5_FMT_TOKEN: Record<Html5Dialect, string> = {
  short: "s1",
  full: "f1",
  emoji: "e1",
};

const SKIP_PROPS = new Set([
  "_type",
  "name",
  "archetype_node_id",
  "archetype_details",
]);

function escapeXmlText(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeXmlAttr(text: string): string {
  return escapeXmlText(text).replace(/"/g, "&quot;");
}

function rmToKebab(rmType: string): string {
  return rmType.toLowerCase().replace(/_/g, "-");
}

function tagForType(rmType: string, dialect: Html5Dialect): string {
  if (dialect === "full") return `o-${rmToKebab(rmType)}`;
  if (dialect === "emoji") {
    const emoji =
      SYMBOL_TABLE_EMOJI_SYMBOLS[
        rmType as keyof typeof SYMBOL_TABLE_EMOJI_SYMBOLS
      ];
    return `o-${emoji ?? rmType}`;
  }
  const override =
    SYMBOL_TABLE_HTML5_SHORT_TAGS[
      rmType as keyof typeof SYMBOL_TABLE_HTML5_SHORT_TAGS
    ];
  if (override) return `o-${override}`;
  const letter =
    SYMBOL_TABLE_LETTER_SYMBOLS[
      rmType as keyof typeof SYMBOL_TABLE_LETTER_SYMBOLS
    ];
  return `o-${String(letter ?? rmType).toLowerCase()}`;
}

function encodeMagnitudeStatus(
  rmStatus: string | undefined,
  dialect: Html5Dialect,
): string | undefined {
  if (rmStatus == null || rmStatus === "" || rmStatus === MAGNITUDE_STATUS_EXACT_RM) {
    return undefined;
  }
  const row = MAGNITUDE_STATUS_OPERATORS.find((o) => o.rm === rmStatus);
  if (!row) return rmStatus;
  return dialect === "emoji" ? row.emoji : row.letter;
}

function terminologyAttr(
  terminologyId: string | undefined,
  dialect: Html5Dialect,
): { attr: string; value: string } | undefined {
  if (!terminologyId) return undefined;
  if (dialect === "emoji") {
    for (const { prefix, emoji } of TERMINOLOGY_SHORTCUTS) {
      const id = prefix.replace(/::$/, "");
      if (terminologyId === id || terminologyId.startsWith(prefix)) {
        return { attr: emoji, value: terminologyId };
      }
    }
    // local / openehr without ::
    if (terminologyId === "local") return { attr: "📍", value: terminologyId };
    if (terminologyId === "openehr") return { attr: "🌬️", value: terminologyId };
  }
  return undefined;
}

function extractNameValue(obj: Record<string, unknown>): string {
  const name = obj.name;
  if (name == null) return "";
  if (typeof name === "string") return name;
  if (typeof name === "object" && !Array.isArray(name)) {
    const n = name as Record<string, unknown>;
    if (n.value != null) return String(n.value);
  }
  return "";
}

function extractArchetypeDetails(obj: Record<string, unknown>): {
  archetypeId?: string;
  templateId?: string;
  rmVersion?: string;
} {
  const details = obj.archetype_details;
  if (!details || typeof details !== "object" || Array.isArray(details)) {
    return {};
  }
  const d = details as Record<string, unknown>;
  const unwrap = (v: unknown): string | undefined => {
    if (v == null) return undefined;
    if (typeof v === "string") return v;
    if (typeof v === "object" && !Array.isArray(v)) {
      const o = v as Record<string, unknown>;
      if (o.value != null) return String(o.value);
    }
    return String(v);
  };
  return {
    archetypeId: unwrap(d.archetype_id),
    templateId: unwrap(d.template_id),
    rmVersion: unwrap(d.rm_version),
  };
}

function unwrapCodePhrase(value: unknown): {
  terminology?: string;
  code?: string;
} {
  if (value == null) return {};
  if (typeof value === "string") {
    const m = value.match(/^(?:([^:]+)::)?(.+)$/);
    return m ? { terminology: m[1], code: m[2] } : { code: value };
  }
  if (typeof value !== "object" || Array.isArray(value)) return {};
  const o = value as Record<string, unknown>;
  let terminology: string | undefined;
  const tid = o.terminology_id;
  if (typeof tid === "string") terminology = tid;
  else if (tid && typeof tid === "object" && !Array.isArray(tid)) {
    terminology = String((tid as Record<string, unknown>).value ?? "");
  }
  const code = o.code_string != null
    ? String(o.code_string)
    : o.code != null
    ? String(o.code)
    : undefined;
  return { terminology, code };
}

type AttrBag = { name: string; value?: string; boolean?: boolean };

function locatableAttrs(
  obj: Record<string, unknown>,
  dialect: Html5Dialect,
): AttrBag[] {
  const out: AttrBag[] = [];
  const nodeId = obj.archetype_node_id != null
    ? String(obj.archetype_node_id)
    : undefined;
  const { archetypeId, templateId, rmVersion } = extractArchetypeDetails(obj);
  const effectiveNodeId = nodeId ?? archetypeId;
  const sameAsNode = archetypeId != null && effectiveNodeId != null &&
    archetypeId === effectiveNodeId;

  const names = dialect === "short"
    ? {
      node: "n",
      arch: "a",
      template: "tp",
      rm: "rm",
    }
    : dialect === "full"
    ? {
      node: "archetype-node-id",
      arch: "archetype-id",
      template: "template-id",
      rm: "rm-version",
    }
    : {
      node: "🆔",
      arch: "Ⓐ",
      template: "Ⓣ",
      rm: "⚙️",
    };

  if (effectiveNodeId) {
    out.push({ name: names.node, value: effectiveNodeId });
  }
  if (archetypeId) {
    if (sameAsNode) {
      out.push({ name: names.arch, boolean: true });
    } else {
      out.push({ name: names.arch, value: archetypeId });
    }
  }
  if (templateId) out.push({ name: names.template, value: templateId });
  if (rmVersion) out.push({ name: names.rm, value: rmVersion });
  return out;
}

function formatAttrs(attrs: AttrBag[]): string {
  if (attrs.length === 0) return "";
  return " " + attrs
    .map((a) =>
      a.boolean || a.value == null
        ? a.name
        : `${a.name}="${escapeXmlAttr(a.value)}"`
    )
    .join(" ");
}

function quantityChildTags(dialect: Html5Dialect): {
  mag: string;
  unit: string;
} {
  if (dialect === "short") return { mag: "mag", unit: "unit" };
  if (dialect === "full") return { mag: "magnitude", unit: "units" };
  return {
    mag: String(SYMBOL_TABLE_EMOJI_SYMBOLS["DV_QUANTITY.magnitude"] ?? "№"),
    unit: String(SYMBOL_TABLE_EMOJI_SYMBOLS["DV_QUANTITY.units"] ?? "◌"),
  };
}

function quantityAttrNames(dialect: Html5Dialect): {
  status: string;
  precision: string;
  accuracy: string;
} {
  if (dialect === "short") {
    return { status: "mst", precision: "prc", accuracy: "acc" };
  }
  if (dialect === "full") {
    return {
      status: "magnitude-status",
      precision: "precision",
      accuracy: "accuracy",
    };
  }
  return {
    status: String(
      SYMBOL_TABLE_EMOJI_SYMBOLS["DV_QUANTITY.magnitude_status"] ?? "🎛",
    ),
    precision: String(
      SYMBOL_TABLE_EMOJI_SYMBOLS["DV_QUANTITY.precision"] ?? "⋯",
    ),
    accuracy: String(
      SYMBOL_TABLE_EMOJI_SYMBOLS["DV_QUANTITY.accuracy"] ?? "±",
    ),
  };
}

type MarkupNode = {
  tag: string;
  attrs: AttrBag[];
  /** LOCATABLE display name before child elements. */
  leadingText: string;
  /** Simple leaf text content (DV_TEXT, etc.). */
  textContent?: string;
  children: MarkupNode[];
};

function markup(
  tag: string,
  attrs: AttrBag[],
  opts?: {
    leadingText?: string;
    textContent?: string;
    children?: MarkupNode[];
  },
): MarkupNode {
  return {
    tag,
    attrs,
    leadingText: opts?.leadingText ?? "",
    textContent: opts?.textContent,
    children: opts?.children ?? [],
  };
}

function textLeaf(tag: string, text: string): MarkupNode {
  return markup(tag, [], { textContent: text });
}

function renderDvQuantity(
  obj: Record<string, unknown>,
  dialect: Html5Dialect,
  extraAttrs: AttrBag[],
): MarkupNode {
  const tag = tagForType("DV_QUANTITY", dialect);
  const { mag, unit } = quantityChildTags(dialect);
  const qAttrs = quantityAttrNames(dialect);
  const attrs = [...extraAttrs];

  const statusWire = encodeMagnitudeStatus(
    obj.magnitude_status != null ? String(obj.magnitude_status) : undefined,
    dialect,
  );
  if (statusWire) attrs.push({ name: qAttrs.status, value: statusWire });
  if (obj.precision != null) {
    attrs.push({ name: qAttrs.precision, value: String(obj.precision) });
  }
  if (obj.accuracy != null) {
    attrs.push({ name: qAttrs.accuracy, value: String(obj.accuracy) });
  }

  const magnitude = obj.magnitude != null ? String(obj.magnitude) : "";
  const units = obj.units != null ? String(obj.units) : "";
  const unitsSystem = obj.units_system != null
    ? String(obj.units_system)
    : undefined;
  const unitAttrs: AttrBag[] = unitsSystem && unitsSystem !== units
    ? [{ name: "u", value: unitsSystem }]
    : [];

  return markup(tag, attrs, {
    children: [
      textLeaf(mag, magnitude),
      markup(unit, unitAttrs, { textContent: units }),
    ],
  });
}

function renderDvLeaf(
  rmType: string,
  obj: Record<string, unknown>,
  dialect: Html5Dialect,
  extraAttrs: AttrBag[],
): MarkupNode {
  if (rmType === "DV_QUANTITY") {
    return renderDvQuantity(obj, dialect, extraAttrs);
  }

  const tag = tagForType(rmType, dialect);
  const attrs = [...extraAttrs];
  let text = "";

  switch (rmType) {
    case "DV_TEXT":
      text = obj.value != null ? String(obj.value) : "";
      break;
    case "DV_CODED_TEXT": {
      text = obj.value != null ? String(obj.value) : "";
      const defining = unwrapCodePhrase(obj.defining_code);
      const term = defining.terminology;
      const code = defining.code;
      if (dialect === "short") {
        if (term) attrs.push({ name: "t", value: term });
        if (code) attrs.push({ name: "c", value: code });
      } else if (dialect === "full") {
        if (term) attrs.push({ name: "terminology-id", value: term });
        if (code) attrs.push({ name: "code-string", value: code });
      } else {
        const ta = terminologyAttr(term, dialect);
        if (ta && code) {
          attrs.push({ name: ta.attr, value: code });
        } else {
          if (term) attrs.push({ name: "terminology-id", value: term });
          if (code) attrs.push({ name: "code-string", value: code });
        }
      }
      break;
    }
    case "CODE_PHRASE": {
      const { terminology, code } = unwrapCodePhrase(obj);
      if (dialect === "short") {
        if (terminology) attrs.push({ name: "t", value: terminology });
        if (code) attrs.push({ name: "c", value: code });
      } else if (dialect === "full") {
        if (terminology) {
          attrs.push({ name: "terminology-id", value: terminology });
        }
        if (code) attrs.push({ name: "code-string", value: code });
      } else {
        const ta = terminologyAttr(terminology, dialect);
        if (ta && code) attrs.push({ name: ta.attr, value: code });
        else {
          if (terminology) {
            attrs.push({ name: "terminology-id", value: terminology });
          }
          if (code) attrs.push({ name: "code-string", value: code });
        }
      }
      text = code ?? "";
      break;
    }
    case "DV_BOOLEAN":
      text = obj.value != null ? String(obj.value) : "";
      break;
    case "DV_COUNT":
      text = obj.magnitude != null ? String(obj.magnitude) : "";
      break;
    case "DV_DATE":
    case "DV_TIME":
    case "DV_DATE_TIME":
    case "DV_DURATION":
    case "DV_URI":
    case "DV_EHR_URI":
      text = obj.value != null ? String(obj.value) : "";
      break;
    case "DV_IDENTIFIER":
      text = obj.id != null ? String(obj.id) : "";
      break;
    case "DV_PROPORTION": {
      const numTag = dialect === "short" ? "num" : "numerator";
      const denTag = dialect === "short" ? "den" : "denominator";
      if (obj.type != null) {
        attrs.push({
          name: dialect === "short" ? "pk" : "proportion-kind",
          value: String(obj.type),
        });
      }
      if (obj.precision != null) {
        attrs.push({
          name: dialect === "short" ? "prc" : "precision",
          value: String(obj.precision),
        });
      }
      return markup(tag, attrs, {
        children: [
          textLeaf(numTag, String(obj.numerator ?? "")),
          textLeaf(denTag, String(obj.denominator ?? "")),
        ],
      });
    }
    default:
      text = obj.value != null ? String(obj.value) : "";
      break;
  }

  return markup(tag, attrs, { textContent: text || undefined });
}

function isDataValueType(rmType: string): boolean {
  return rmType.startsWith("DV_") || rmType === "CODE_PHRASE" ||
    rmType === "TERM_MAPPING" || rmType === "REFERENCE_RANGE";
}

function orderedKeys(
  parentType: string | undefined,
  keys: string[],
): string[] {
  if (!parentType) return keys;
  const preferred = PROPERTY_TYPE_MAP[parentType];
  if (!preferred) return keys;
  const order = Object.keys(preferred);
  const inOrder = order.filter((k) => keys.includes(k));
  const rest = keys.filter((k) => !order.includes(k));
  return [...inOrder, ...rest];
}

function propertyAmbiguous(
  parentType: string | undefined,
  childType: string,
  propertyName: string,
): boolean {
  if (!parentType) return false;
  const map = PROPERTY_TYPE_MAP[parentType];
  if (!map) return false;
  const matches = Object.entries(map).filter(([, t]) => t === childType);
  if (matches.length <= 1) return false;
  return !matches.some(([p]) => p === propertyName) || matches.length > 1;
}

function buildNode(
  node: unknown,
  dialect: Html5Dialect,
  options: {
    omitLocatableNames: boolean;
    isRoot: boolean;
    parentType?: string;
    propertyName?: string;
    lang?: string;
  },
): MarkupNode | MarkupNode[] | null {
  if (node == null) return null;

  if (Array.isArray(node)) {
    const items: MarkupNode[] = [];
    for (const item of node) {
      const built = buildNode(item, dialect, { ...options, isRoot: false });
      if (built == null) continue;
      if (Array.isArray(built)) items.push(...built);
      else items.push(built);
    }
    return items;
  }

  if (typeof node !== "object") {
    return null;
  }

  const obj = node as Record<string, unknown>;
  const rmType = obj._type != null ? String(obj._type) : undefined;
  if (!rmType) {
    const items: MarkupNode[] = [];
    for (const [k, v] of Object.entries(obj)) {
      const built = buildNode(v, dialect, {
        ...options,
        isRoot: false,
        propertyName: k,
      });
      if (built == null) continue;
      if (Array.isArray(built)) items.push(...built);
      else items.push(built);
    }
    return items;
  }

  const extraAttrs: AttrBag[] = [];
  if (options.isRoot) {
    extraAttrs.push({
      name: "fmt",
      value: ZIPEHR_HTML5_FMT_TOKEN[dialect],
    });
    if (options.lang) {
      extraAttrs.push({ name: "lang", value: options.lang });
    }
  }

  if (
    options.parentType && options.propertyName &&
    propertyAmbiguous(options.parentType, rmType, options.propertyName)
  ) {
    const propAttr = dialect === "short"
      ? "p"
      : dialect === "full"
      ? "property"
      : "p";
    extraAttrs.push({ name: propAttr, value: options.propertyName });
  }

  if (isDataValueType(rmType) && !LOCATABLE_LIKE_TYPES.has(rmType)) {
    return renderDvLeaf(rmType, obj, dialect, extraAttrs);
  }

  const tag = tagForType(rmType, dialect);
  const attrs = [...extraAttrs, ...locatableAttrs(obj, dialect)];

  if (rmType === "COMPOSITION") {
    for (const field of ["language", "territory", "encoding"] as const) {
      const cp = unwrapCodePhrase(obj[field]);
      if (!cp.code) continue;
      if (dialect === "emoji") {
        const promo = TERMINOLOGY_SHORTCUTS.find((s) =>
          field === "language"
            ? s.prefix.startsWith("ISO_639")
            : field === "territory"
            ? s.prefix.startsWith("ISO_3166")
            : s.prefix.startsWith("IANA")
        );
        if (promo) {
          attrs.push({ name: promo.emoji, value: cp.code });
          continue;
        }
      }
      if (dialect !== "short") {
        attrs.push({ name: field, value: cp.code });
      }
    }
  }

  const nameText = options.omitLocatableNames ? "" : extractNameValue(obj);
  const childKeys = orderedKeys(
    rmType,
    Object.keys(obj).filter((k) => {
      if (SKIP_PROPS.has(k)) return false;
      if (
        rmType === "COMPOSITION" && dialect !== "short" &&
        (k === "language" || k === "territory" || k === "encoding") &&
        unwrapCodePhrase(obj[k]).code
      ) {
        return false;
      }
      return true;
    }),
  );

  const children: MarkupNode[] = [];
  for (const key of childKeys) {
    const child = obj[key];
    const built = buildNode(child, dialect, {
      omitLocatableNames: options.omitLocatableNames,
      isRoot: false,
      parentType: rmType,
      propertyName: key,
    });
    if (built == null) continue;
    if (Array.isArray(built)) children.push(...built);
    else children.push(built);
  }

  return markup(tag, attrs, {
    leadingText: nameText,
    children,
  });
}

const LINESAVING_MAX_INLINE = 140;

function openTag(node: MarkupNode): string {
  return `<${node.tag}${formatAttrs(node.attrs)}>`;
}

function closeTag(node: MarkupNode): string {
  return `</${node.tag}>`;
}

function isSimpleLeaf(node: MarkupNode): boolean {
  return node.children.length === 0;
}

function formatCompact(node: MarkupNode): string {
  if (isSimpleLeaf(node)) {
    const text = node.textContent != null
      ? escapeXmlText(node.textContent)
      : "";
    if (!text && node.attrs.length === 0 && !node.leadingText) {
      return `<${node.tag}${formatAttrs(node.attrs)}/>`;
    }
    return `${openTag(node)}${escapeXmlText(node.leadingText)}${text}${closeTag(node)}`;
  }
  const inner = escapeXmlText(node.leadingText) +
    node.children.map(formatCompact).join("");
  return `${openTag(node)}${inner}${closeTag(node)}`;
}

function maxElementDepth(node: MarkupNode): number {
  if (node.children.length === 0) return 0;
  return 1 + Math.max(...node.children.map(maxElementDepth));
}

function canInlineLinesaving(node: MarkupNode): boolean {
  if (isSimpleLeaf(node)) return true;
  // Keep quantity/proportion-style clusters (depth 1) with parent name on one line
  const depth = maxElementDepth(node);
  if (depth <= 1) {
    return formatCompact(node).length <= LINESAVING_MAX_INLINE;
  }
  if (depth === 2) {
    // e.g. ELEMENT + QUANTITY(mag,unit) or ELEMENT + coded text
    return formatCompact(node).length <= LINESAVING_MAX_INLINE;
  }
  return false;
}

function formatLinesaving(node: MarkupNode, depth: number): string {
  const pad = "  ".repeat(depth);
  if (canInlineLinesaving(node)) {
    return pad + formatCompact(node);
  }

  const lines: string[] = [];
  const leading = node.leadingText ? escapeXmlText(node.leadingText) : "";
  // Open tag + optional leading name on same line (JSON-style key clustering)
  lines.push(pad + openTag(node) + leading);
  for (const child of node.children) {
    lines.push(formatLinesaving(child, depth + 1));
  }
  lines.push(pad + closeTag(node));
  return lines.join("\n");
}

function formatFluffy(node: MarkupNode, depth: number): string {
  const pad = "  ".repeat(depth);
  const childPad = "  ".repeat(depth + 1);

  if (isSimpleLeaf(node)) {
    const text = node.textContent != null
      ? escapeXmlText(node.textContent)
      : "";
    if (!text && !node.leadingText) {
      return `${pad}<${node.tag}${formatAttrs(node.attrs)}/>`;
    }
    return `${pad}${openTag(node)}${escapeXmlText(node.leadingText)}${text}${closeTag(node)}`;
  }

  const lines: string[] = [];
  lines.push(pad + openTag(node));
  if (node.leadingText) {
    lines.push(childPad + escapeXmlText(node.leadingText));
  }
  for (const child of node.children) {
    lines.push(formatFluffy(child, depth + 1));
  }
  lines.push(pad + closeTag(node));
  return lines.join("\n");
}

function resolveLayout(
  dialect: Html5Dialect,
  options: Html5SerializeOptions,
): Html5Layout {
  if (options.layout) return options.layout;
  return dialect === "short" ? "oneliner" : "linesaving";
}

function formatMarkup(node: MarkupNode, layout: Html5Layout): string {
  if (layout === "oneliner") return formatCompact(node);
  if (layout === "fluffy") return formatFluffy(node, 0) + "\n";
  return formatLinesaving(node, 0) + "\n";
}

/** Serialize canonical JSON (with `_type`) to ZipEHR HTML5 markup. */
export function serializeCanonicalToHtml5(
  canonical: unknown,
  options: Html5SerializeOptions,
): string {
  const dialect = options.dialect;
  const layout = resolveLayout(dialect, options);
  const built = buildNode(canonical, dialect, {
    omitLocatableNames: options.omitLocatableNames ?? false,
    isRoot: true,
    lang: options.lang,
  });
  if (built == null) return "";
  if (Array.isArray(built)) {
    // Unexpected multi-root — join
    return built.map((n) => formatMarkup(n, layout)).join(
      layout === "oneliner" ? "" : "\n",
    );
  }
  return formatMarkup(built, layout);
}
