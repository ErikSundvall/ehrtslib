/**
 * Semicolon-separated `code: value` metadata grammar for XHTML `title` attributes.
 *
 * Bare `ar` / `Ⓐ` (no `: value`) means archetype_id equals the node id (`id:` / `🆔:`),
 * matching the HTML5 valueless `Ⓐ` / `a` flag.
 *
 * Optional RM property prefix: `propertyName — …` (U+2014 em dash) at the start of
 * `title` when `propertyMode` is `attribute` (or the slot is ambiguous).
 *
 * Wire codes (FHIR Narrative allows emoji inside attribute *values*, not in `class`):
 * - lettercode: `id`, `ar`, `te`, `rm`, `territory`
 * - emoji: `🆔`, `Ⓐ`, `Ⓣ`, `⚙️`, `🌐`
 */

export type LocatableTitleFields = {
  id?: string;
  /** Archetype id string, or `true` when equal to `id` (flag). */
  ar?: string | true;
  te?: string;
  rm?: string;
  /** COMPOSITION territory as bare ISO 3166-1 code (e.g. `SE`). */
  territory?: string;
};

/** Which symbol set to emit in `title` attribute values. */
export type TitleSymbolVariant = "lettercode" | "emoji";

/** Em dash delimiter between RM property name and the rest of `title`. */
export const TITLE_PROPERTY_DELIMITER = " — ";

const LETTER_WIRE = {
  id: "id",
  ar: "ar",
  te: "te",
  rm: "rm",
  territory: "territory",
} as const;

const EMOJI_WIRE = {
  id: "🆔",
  ar: "Ⓐ",
  te: "Ⓣ",
  rm: "⚙️",
  territory: "🌐",
} as const;

const WIRE_TO_FIELD: Record<string, keyof LocatableTitleFields> = {
  id: "id",
  "🆔": "id",
  ar: "ar",
  "Ⓐ": "ar",
  te: "te",
  "Ⓣ": "te",
  rm: "rm",
  "⚙️": "rm",
  territory: "territory",
  "🌐": "territory",
};

const ATTR_ORDER = ["id", "ar", "te", "rm", "territory"] as const;

/** Escape backslashes and semicolons for unquoted title values. */
export function escapeTitleValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;");
}

/** Unescape title value sequences produced by {@link escapeTitleValue}. */
export function unescapeTitleValue(value: string): string {
  let result = "";
  for (let i = 0; i < value.length; i++) {
    const ch = value[i];
    if (ch === "\\" && i + 1 < value.length) {
      result += value[i + 1];
      i++;
      continue;
    }
    result += ch;
  }
  return result;
}

function needsQuoting(value: string): boolean {
  return /[;"]/.test(value) || /^\s|\s$/.test(value);
}

function quoteTitleValue(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function parseQuotedValue(text: string): string | null {
  if (!text.startsWith('"')) return null;
  let result = "";
  for (let i = 1; i < text.length; i++) {
    const ch = text[i];
    if (ch === "\\" && i + 1 < text.length) {
      result += text[i + 1];
      i++;
      continue;
    }
    if (ch === '"') return result;
    result += ch;
  }
  return null;
}

/** Split title on semicolons that are not escaped or inside quotes. */
export function splitTitlePairs(title: string): string[] {
  const pairs: string[] = [];
  let current = "";
  let inQuote = false;

  for (let i = 0; i < title.length; i++) {
    const ch = title[i];
    if (ch === '"' && (i === 0 || title[i - 1] !== "\\")) {
      inQuote = !inQuote;
      current += ch;
      continue;
    }
    if (!inQuote && ch === "\\" && i + 1 < title.length) {
      current += ch + title[i + 1];
      i++;
      continue;
    }
    if (!inQuote && ch === ";") {
      const trimmed = current.trim();
      if (trimmed) pairs.push(trimmed);
      current = "";
      continue;
    }
    current += ch;
  }
  const trimmed = current.trim();
  if (trimmed) pairs.push(trimmed);
  return pairs;
}

function wireFor(variant: TitleSymbolVariant) {
  return variant === "emoji" ? EMOJI_WIRE : LETTER_WIRE;
}

/**
 * Split an optional `propertyName — …` prefix from a title value.
 * Property names are openEHR RM snake_case identifiers.
 */
export function splitTitlePropertyPrefix(title: string): {
  property?: string;
  rest: string;
} {
  if (!title) return { rest: "" };
  const idx = title.indexOf(TITLE_PROPERTY_DELIMITER);
  if (idx > 0) {
    const before = title.slice(0, idx).trim();
    if (/^[a-z][a-z0-9_]*$/i.test(before)) {
      return {
        property: before,
        rest: title.slice(idx + TITLE_PROPERTY_DELIMITER.length),
      };
    }
  }
  // Property-only titles may end with ` —` (trailing space trimmed on emit).
  const bareDelim = TITLE_PROPERTY_DELIMITER.trimEnd();
  if (title.endsWith(bareDelim)) {
    const before = title.slice(0, -bareDelim.length).trim();
    if (/^[a-z][a-z0-9_]*$/i.test(before)) {
      return { property: before, rest: "" };
    }
  }
  return { rest: title };
}

/** Prepend `propertyName — ` when an RM property should be emitted into `title`. */
export function formatTitleWithProperty(
  propertyName: string | undefined,
  titleBody: string,
  emitProperty: boolean,
): string {
  if (!emitProperty || !propertyName) return titleBody;
  if (!titleBody) return `${propertyName}${TITLE_PROPERTY_DELIMITER}`.trimEnd();
  return `${propertyName}${TITLE_PROPERTY_DELIMITER}${titleBody}`;
}

/** Format LOCATABLE metadata for an XHTML `title` attribute (excludes name). */
export function formatLocatableTitle(
  fields: LocatableTitleFields,
  variant: TitleSymbolVariant = "lettercode",
): string {
  const wire = wireFor(variant);
  const pairs: string[] = [];
  for (const code of ATTR_ORDER) {
    const value = fields[code];
    if (value == null || value === "") continue;
    const wireCode = wire[code];
    if (value === true) {
      pairs.push(wireCode);
      continue;
    }
    const rendered = needsQuoting(value)
      ? quoteTitleValue(value)
      : escapeTitleValue(value);
    pairs.push(`${wireCode}: ${rendered}`);
  }
  return pairs.join("; ");
}

/** Parse LOCATABLE metadata from an XHTML `title` attribute (letter or emoji codes). */
export function parseLocatableTitle(title: string): LocatableTitleFields {
  const fields: LocatableTitleFields = {};
  if (!title.trim()) return fields;

  for (const pair of splitTitlePairs(title)) {
    const colonIdx = pair.indexOf(":");
    if (colonIdx < 0) {
      // Bare flag token (`ar` / `Ⓐ` → archetype id same as node id).
      const code = pair.trim();
      if (code === "ar" || code === "Ⓐ") fields.ar = true;
      continue;
    }
    const wireCode = pair.slice(0, colonIdx).trim();
    const field = WIRE_TO_FIELD[wireCode];
    if (!field) continue;
    const rawValue = pair.slice(colonIdx + 1).trim();
    const quoted = parseQuotedValue(rawValue);
    const value = quoted ?? unescapeTitleValue(rawValue);
    if (field === "ar") {
      fields.ar = value;
    } else {
      fields[field] = value;
    }
  }
  return fields;
}
