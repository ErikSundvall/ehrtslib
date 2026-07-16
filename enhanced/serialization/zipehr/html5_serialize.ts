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

export type Html5SerializeOptions = {
  dialect: Html5Dialect;
  /**
   * Pretty-print with indentation. Default: `false` for short, `true` for full/emoji.
   * User-selectable for all three dialects.
   */
  prettyPrint?: boolean;
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

const ARRAY_PROPERTIES = new Set([
  "content",
  "items",
  "events",
  "activities",
  "other_participations",
  "other_reference_ranges",
  "mappings",
]);

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

type AttrBag = { name: string; value: string };

function locatableAttrs(
  obj: Record<string, unknown>,
  dialect: Html5Dialect,
): AttrBag[] {
  const out: AttrBag[] = [];
  const nodeId = obj.archetype_node_id != null
    ? String(obj.archetype_node_id)
    : undefined;
  const { archetypeId, templateId, rmVersion } = extractArchetypeDetails(obj);

  if (dialect === "short") {
    if (nodeId) out.push({ name: "n", value: nodeId });
    if (archetypeId) out.push({ name: "a", value: archetypeId });
    if (templateId) out.push({ name: "tp", value: templateId });
    if (rmVersion) out.push({ name: "rm", value: rmVersion });
  } else if (dialect === "full") {
    if (nodeId) out.push({ name: "archetype-node-id", value: nodeId });
    if (archetypeId) out.push({ name: "archetype-id", value: archetypeId });
    if (templateId) out.push({ name: "template-id", value: templateId });
    if (rmVersion) out.push({ name: "rm-version", value: rmVersion });
  } else {
    if (nodeId) out.push({ name: "🆔", value: nodeId });
    if (archetypeId) out.push({ name: "Ⓐ", value: archetypeId });
    if (templateId) out.push({ name: "Ⓣ", value: templateId });
    if (rmVersion) out.push({ name: "⚙️", value: rmVersion });
  }
  return out;
}

function formatAttrs(attrs: AttrBag[]): string {
  if (attrs.length === 0) return "";
  return " " + attrs
    .map((a) => `${a.name}="${escapeXmlAttr(a.value)}"`)
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

function renderDvQuantity(
  obj: Record<string, unknown>,
  dialect: Html5Dialect,
  extraAttrs: AttrBag[],
): string {
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
  const unitAttr = unitsSystem && unitsSystem !== units
    ? ` u="${escapeXmlAttr(unitsSystem)}"`
    : "";

  const inner =
    `<${mag}>${escapeXmlText(magnitude)}</${mag}>` +
    `<${unit}${unitAttr}>${escapeXmlText(units)}</${unit}>`;
  return `<${tag}${formatAttrs(attrs)}>${inner}</${tag}>`;
}

function renderDvLeaf(
  rmType: string,
  obj: Record<string, unknown>,
  dialect: Html5Dialect,
  extraAttrs: AttrBag[],
): string {
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
      const inner =
        `<${numTag}>${escapeXmlText(String(obj.numerator ?? ""))}</${numTag}>` +
        `<${denTag}>${escapeXmlText(String(obj.denominator ?? ""))}</${denTag}>`;
      return `<${tag}${formatAttrs(attrs)}>${inner}</${tag}>`;
    }
    default:
      text = obj.value != null ? String(obj.value) : "";
      break;
  }

  if (!text && attrs.length === 0) {
    return `<${tag}${formatAttrs(attrs)}/>`;
  }
  return `<${tag}${formatAttrs(attrs)}>${escapeXmlText(text)}</${tag}>`;
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

function renderNode(
  node: unknown,
  dialect: Html5Dialect,
  options: {
    omitLocatableNames: boolean;
    isRoot: boolean;
    parentType?: string;
    propertyName?: string;
    lang?: string;
  },
): string {
  if (node == null) return "";

  if (Array.isArray(node)) {
    return node.map((item) =>
      renderNode(item, dialect, { ...options, isRoot: false })
    ).join("");
  }

  if (typeof node !== "object") {
    return escapeXmlText(String(node));
  }

  const obj = node as Record<string, unknown>;
  const rmType = obj._type != null ? String(obj._type) : undefined;
  if (!rmType) {
    // Untyped object: render children only
    return Object.entries(obj).map(([k, v]) =>
      renderNode(v, dialect, {
        ...options,
        isRoot: false,
        propertyName: k,
      })
    ).join("");
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

  // LOCATABLE / structure
  const tag = tagForType(rmType, dialect);
  const attrs = [...extraAttrs, ...locatableAttrs(obj, dialect)];

  // Composition language/territory/encoding promotions
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
      if (dialect === "short") {
        // keep as nested CODE_PHRASE children instead
      } else {
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

  const childrenHtml = childKeys.map((key) => {
    const child = obj[key];
    if (ARRAY_PROPERTIES.has(key) && Array.isArray(child)) {
      return child.map((item) =>
        renderNode(item, dialect, {
          omitLocatableNames: options.omitLocatableNames,
          isRoot: false,
          parentType: rmType,
          propertyName: key,
        })
      ).join("");
    }
    return renderNode(child, dialect, {
      omitLocatableNames: options.omitLocatableNames,
      isRoot: false,
      parentType: rmType,
      propertyName: key,
    });
  }).join("");

  const leading = nameText ? escapeXmlText(nameText) : "";
  return `<${tag}${formatAttrs(attrs)}>${leading}${childrenHtml}</${tag}>`;
}

function prettyPrintHtml5(html: string): string {
  const pad = "  ";
  let depth = 0;
  return html
    .replace(/>\s+</g, "><")
    .replace(/></g, ">\n<")
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return "";
      if (/^<\//.test(trimmed)) depth = Math.max(0, depth - 1);
      const indented = pad.repeat(depth) + trimmed;
      // Open tag that is not self-closing and not a leaf-only line with close
      if (
        /^<[^!?/][^>]*[^/]>$/.test(trimmed) &&
        !/^<[^>]+>.*<\/[^>]+>$/.test(trimmed)
      ) {
        depth++;
      }
      return indented;
    })
    .filter(Boolean)
    .join("\n") + "\n";
}

/** Serialize canonical JSON (with `_type`) to ZipEHR HTML5 markup. */
export function serializeCanonicalToHtml5(
  canonical: unknown,
  options: Html5SerializeOptions,
): string {
  const dialect = options.dialect;
  const prettyPrint = options.prettyPrint ?? dialect !== "short";
  const html = renderNode(canonical, dialect, {
    omitLocatableNames: options.omitLocatableNames ?? false,
    isRoot: true,
    lang: options.lang,
  });
  return prettyPrint ? prettyPrintHtml5(html) : html;
}
