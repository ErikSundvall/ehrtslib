/**
 * ADL 1.4 / AOM temporal constraint helpers (C_DATE, C_TIME, C_DATE_TIME, C_DURATION).
 *
 * Patterns such as `yyyy-mm-??` and `PYMWDTHMS` are not JavaScript regexes; they
 * follow the openEHR ISO 8601 partial-date / allowed-field notation used in
 * operational templates.
 */

export function matchesAdlTemporalPattern(
  value: string,
  pattern: string,
): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  const p = pattern.trim();
  if (!p) return true;
  if (/^[PYMWDTHS]+$/i.test(p) && p.toUpperCase().startsWith("P")) {
    return matchesDurationPattern(trimmed, p.toUpperCase());
  }
  const re = adlTemporalPatternToRegExp(p);
  return re ? re.test(trimmed) : true;
}

export function matchesDurationPattern(
  value: string,
  pattern: string,
): boolean {
  const allowed = new Set(pattern.toUpperCase().split(""));
  const iso =
    /^P(?!$)(\d+Y)?(\d+M)?(\d+W)?(\d+D)?(?:T(?=.)(\d+H)?(\d+M)?(\d+(?:\.\d+)?S)?)?$/i;
  if (!iso.test(value)) return false;
  const used = value.toUpperCase().replace(/[0-9.T]/g, "");
  for (const ch of used) {
    if (!allowed.has(ch)) return false;
  }
  return true;
}

export function compareOrderedIso(a: unknown, b: unknown): number | undefined {
  if (a === undefined || a === null || b === undefined || b === null) {
    return undefined;
  }
  if (typeof a === "number" && typeof b === "number") return a - b;
  const sa = String(a);
  const sb = String(b);
  if (sa === sb) return 0;
  return sa < sb ? -1 : 1;
}

/**
 * Convert an ADL date/time pattern to a RegExp.
 * `??` = optional remaining field with its separator; `xx` = field forbidden.
 */
export function adlTemporalPatternToRegExp(
  pattern: string,
): RegExp | undefined {
  const src = pattern.trim();
  if (!src) return undefined;

  let i = 0;
  let out = "^";
  const peek = (n: number) => src.slice(i, i + n);
  let pendingSep = "";

  const takeToken = (): string | undefined => {
    const four = peek(4).toLowerCase();
    if (four === "yyyy") {
      i += 4;
      return "yyyy";
    }
    const two = peek(2).toLowerCase();
    if (
      two === "mm" || two === "dd" || two === "hh" || two === "ss" ||
      two === "??" || two === "xx"
    ) {
      i += 2;
      return two;
    }
    return undefined;
  };

  const flushSep = () => {
    if (pendingSep) {
      out += escapeRegex(pendingSep);
      pendingSep = "";
    }
  };

  while (i < src.length) {
    const tok = takeToken();
    if (tok === "yyyy") {
      flushSep();
      out += "\\d{4}";
      continue;
    }
    if (tok === "mm" || tok === "dd" || tok === "hh" || tok === "ss") {
      flushSep();
      out += "\\d{2}";
      continue;
    }
    if (tok === "??") {
      const sep = pendingSep ? escapeRegex(pendingSep) : "";
      pendingSep = "";
      out += `(?:${sep}\\d{2})?`;
      continue;
    }
    if (tok === "xx") {
      pendingSep = "";
      out += "(?![:\\-T.\\d])";
      continue;
    }
    const ch = src[i];
    i += 1;
    if (ch === "T") {
      flushSep();
      out += "T";
    } else {
      pendingSep += ch;
    }
  }
  flushSep();
  out += "$";
  try {
    return new RegExp(out, "i");
  } catch {
    return undefined;
  }
}

function escapeRegex(ch: string): string {
  return ch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function inOrderedRange(
  value: unknown,
  range: {
    lower?: unknown;
    upper?: unknown;
    lower_included?: boolean;
    upper_included?: boolean;
    lower_unbounded?: boolean;
    upper_unbounded?: boolean;
  } | undefined,
): boolean {
  if (!range) return true;
  if (range.lower !== undefined && range.lower_unbounded !== true) {
    const cmp = compareOrderedIso(value, range.lower);
    if (cmp === undefined) return true;
    if (range.lower_included === false ? cmp <= 0 : cmp < 0) return false;
  }
  if (range.upper !== undefined && range.upper_unbounded !== true) {
    const cmp = compareOrderedIso(value, range.upper);
    if (cmp === undefined) return true;
    if (range.upper_included === false ? cmp >= 0 : cmp > 0) return false;
  }
  return true;
}
