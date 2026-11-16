/**
 * ADL primitive literals that are not integers: ISO 8601 durations inside
 * `|…|`, and the boolean words True / False.
 *
 * `|>=PT0S|` is a duration range. Treating it as an integer (because it has
 * no decimal point) is what made the OPT 1.4 exporter write an empty
 * C_INTEGER (#313).
 */

const DURATION_ATOM =
  /^P(?:\d+(?:\.\d+)?Y)?(?:\d+(?:\.\d+)?M)?(?:\d+(?:\.\d+)?W)?(?:\d+(?:\.\d+)?D)?(?:T(?:\d+(?:\.\d+)?H)?(?:\d+(?:\.\d+)?M)?(?:\d+(?:\.\d+)?S)?)?$/i;

export function isDurationAtom(text: string): boolean {
  if (!DURATION_ATOM.test(text) || !/\d/.test(text)) return false;
  if (/T/i.test(text) && !/T(?:\d+(?:\.\d+)?H)?(?:\d+(?:\.\d+)?M)?\d/i.test(text)) {
    return false;
  }
  return true;
}

/** `|>=PT0S|`, `|PT0S..P1W|`, `|P2W|` and the same text without the pipes. */
export function isDurationConstraint(expr: string): boolean {
  const compact = expr.replace(/\s+/g, "");
  if (!compact) return false;
  const parts = compact.split("..");
  if (parts.length > 2) return false;
  return parts.every((part) => isDurationAtom(part.replace(/^(>=|<=|>|<)/, "")));
}

export interface DurationConstraintRange {
  lower?: string;
  upper?: string;
  lowerIncl: boolean;
  upperIncl: boolean;
}

export function parseDurationConstraint(
  expr: string,
): DurationConstraintRange | undefined {
  if (!isDurationConstraint(expr)) return undefined;
  const parts = expr.replace(/\s+/g, "").split("..");
  if (parts.length === 1) {
    const match = /^(>=|>|<=|<)?(.+)$/.exec(parts[0]);
    if (!match) return undefined;
    const atom = match[2];
    const op = match[1];
    if (!op) {
      return { lower: atom, upper: atom, lowerIncl: true, upperIncl: true };
    }
    if (op === ">" || op === ">=") {
      return { lower: atom, lowerIncl: op === ">=", upperIncl: false };
    }
    return { upper: atom, upperIncl: op === "<=", lowerIncl: false };
  }
  const lower = /^(>=|>)?(.+)$/.exec(parts[0]);
  const upper = /^(<=|<)?(.+)$/.exec(parts[1]);
  if (!lower || !upper) return undefined;
  return {
    lower: lower[2],
    upper: upper[2],
    lowerIncl: lower[1] !== ">",
    upperIncl: upper[1] !== "<",
  };
}
