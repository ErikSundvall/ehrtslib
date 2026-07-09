/**
 * Bidirectional RM class ↔ Ehrbase letter-code helpers (first symbol from table3.yaml).
 */

import { buildReverseSymbolMap, loadSymbolMap } from "./symbol_map.ts";
import { getSymbolFor } from "./shared.ts";

/** EVENT has no letter code; POINT_EVENT is the default concrete event class. */
const CLASS_ALIASES: Record<string, string> = {
  EVENT: "PE",
};

const RM_ALIASES: Record<string, string> = {
  PE: "POINT_EVENT",
  IE: "INTERVAL_EVENT",
};

let cachedLetterMap: Record<string, string> | undefined;
let cachedReverseMap: Map<string, string> | undefined;

/** Load the letter-code symbol map (cached). */
export async function loadLetterCodeMap(): Promise<Record<string, string>> {
  if (!cachedLetterMap) {
    cachedLetterMap = await loadSymbolMap("lettercode");
    cachedReverseMap = buildReverseSymbolMap(cachedLetterMap);
  }
  return cachedLetterMap;
}

export function getLetterCodeReverseMap(
  letterMap: Record<string, string>,
): Map<string, string> {
  if (cachedLetterMap === letterMap && cachedReverseMap) {
    return cachedReverseMap;
  }
  return buildReverseSymbolMap(letterMap);
}

/** Map an XHTML `class` token to an RM type name. */
export function rmTypeFromClass(
  className: string,
  reverseMap: Map<string, string>,
): string | undefined {
  const token = className.trim();
  if (!token) return undefined;
  const aliased = RM_ALIASES[token] ?? reverseMap.get(token) ?? token;
  if (aliased === token && !reverseMap.has(token) && !RM_ALIASES[token]) {
    return undefined;
  }
  return aliased;
}

/** Map an RM type name to an XHTML `class` token. */
export function classFromRmType(
  rmType: string,
  letterMap: Record<string, string>,
): string | undefined {
  const symbol = getSymbolFor(letterMap, rmType);
  if (symbol) return symbol;
  if (rmType === "EVENT" || rmType === "POINT_EVENT") {
    return CLASS_ALIASES.EVENT;
  }
  if (rmType === "INTERVAL_EVENT") {
    return getSymbolFor(letterMap, "INTERVAL_EVENT") ?? "IE";
  }
  return undefined;
}

/** Known letter-code class tokens from table3 (for format detection). */
export function knownLetterClassTokens(
  letterMap: Record<string, string>,
): Set<string> {
  const reverse = getLetterCodeReverseMap(letterMap);
  const tokens = new Set<string>(reverse.keys());
  for (const alias of Object.values(CLASS_ALIASES)) tokens.add(alias);
  for (const alias of Object.keys(RM_ALIASES)) tokens.add(alias);
  return tokens;
}
