/**
 * Semicolon-separated `code: value` metadata grammar for XHTML `title` attributes.
 */

export type LocatableTitleFields = {
  id?: string;
  ar?: string;
  te?: string;
  rm?: string;
};

const KNOWN_ATTR_CODES = new Set(["id", "ar", "te", "rm"]);
const ATTR_ORDER = ["te", "ar", "rm", "id"] as const;

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

/** Format LOCATABLE metadata for an XHTML `title` attribute (excludes name). */
export function formatLocatableTitle(fields: LocatableTitleFields): string {
  const pairs: string[] = [];
  for (const code of ATTR_ORDER) {
    const value = fields[code];
    if (value == null || value === "") continue;
    const rendered = needsQuoting(value)
      ? quoteTitleValue(value)
      : escapeTitleValue(value);
    pairs.push(`${code}: ${rendered}`);
  }
  return pairs.join("; ");
}

/** Parse LOCATABLE metadata from an XHTML `title` attribute. */
export function parseLocatableTitle(title: string): LocatableTitleFields {
  const fields: LocatableTitleFields = {};
  if (!title.trim()) return fields;

  for (const pair of splitTitlePairs(title)) {
    const colonIdx = pair.indexOf(":");
    if (colonIdx < 0) continue;
    const code = pair.slice(0, colonIdx).trim();
    if (!KNOWN_ATTR_CODES.has(code)) continue;
    const rawValue = pair.slice(colonIdx + 1).trim();
    const quoted = parseQuotedValue(rawValue);
    const value = quoted ?? unescapeTitleValue(rawValue);
    fields[code as keyof LocatableTitleFields] = value;
  }
  return fields;
}
