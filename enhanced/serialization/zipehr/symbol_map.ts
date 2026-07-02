import table3Text from "./table3_text.ts";
import { loadSymbolMapFromText } from "./shared.ts";

let cachedSymbolMap: Record<string, string> | null = null;

/** Load the default RM class → emoji symbol table (table3.yaml). */
export async function loadDefaultSymbolMap(): Promise<Record<string, string>> {
  if (cachedSymbolMap) return cachedSymbolMap;
  cachedSymbolMap = loadSymbolMapFromText(table3Text);
  return cachedSymbolMap;
}

/** Synchronous load when the table text is already available. */
export function loadSymbolMapFromFileText(text: string): Record<string, string> {
  return loadSymbolMapFromText(text);
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
