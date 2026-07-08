import {
  TABLE3_EMOJI_SYMBOLS,
  TABLE3_LETTER_SYMBOLS,
} from "./table3_text.ts";

export type ZipehrSymbolVariant = "emoji" | "lettercode";

const cachedByVariant: Partial<Record<ZipehrSymbolVariant, Record<string, string>>> =
  {};

function withCaseVariants(
  base: Record<string, string>,
): Record<string, string> {
  const out: Record<string, string> = Object.create(null);
  for (const [key, symbol] of Object.entries(base)) {
    out[key] = symbol;
    out[key.toUpperCase()] = symbol;
    out[key.toLowerCase()] = symbol;
  }
  return out;
}

/** Load the RM class → symbol table. */
export async function loadSymbolMap(
  variant: ZipehrSymbolVariant,
): Promise<Record<string, string>> {
  if (cachedByVariant[variant]) return cachedByVariant[variant]!;
  const base = variant === "lettercode" ? TABLE3_LETTER_SYMBOLS : TABLE3_EMOJI_SYMBOLS;
  cachedByVariant[variant] = withCaseVariants(base);
  return cachedByVariant[variant]!;
}

/** Backward compatible default (emoji variant). */
export async function loadDefaultSymbolMap(): Promise<Record<string, string>> {
  return loadSymbolMap("emoji");
}

/** Synchronous load when the table text is already available. */
export function loadSymbolMapFromFileText(text: string): Record<string, string> {
  // This remains for older tests/fixtures that might still provide embedded
  // table text. Prefer `loadSymbolMap()` for new callers.
  const re = /([A-Za-z0-9_]+)\s*:\s*\[\s*["']([^"']+)["']/g;
  const cleaned = text.split(/\r?\n/).filter((l) => !/^\s*#/.test(l)).join("\n");
  const map: Record<string, string> = Object.create(null);
  let m: RegExpExecArray | null;
  while ((m = re.exec(cleaned)) !== null) {
    const key = m[1];
    const firstSymbol = m[2];
    map[key] = firstSymbol;
    map[key.toUpperCase()] = firstSymbol;
    map[key.toLowerCase()] = firstSymbol;
  }
  return map;
}

/** Build emoji → RM class name reverse lookup (first symbol wins). */
export function buildReverseSymbolMap(
  map: Record<string, string>,
): Map<string, string> {
  const reverse = new Map<string, string>();
  const seenTypes = new Set<string>();
  for (const [typeName, symbol] of Object.entries(map)) {
    if (typeName !== typeName.toUpperCase()) continue;
    if (seenTypes.has(typeName)) continue;
    seenTypes.add(typeName);
    if (!reverse.has(symbol)) {
      reverse.set(symbol, typeName);
    }
  }
  return reverse;
}
