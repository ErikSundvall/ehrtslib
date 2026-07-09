/**
 * Expand zipehr objects back to canonical openEHR JSON (with _type fields).
 */

import {
  ARCHETYPE_DETAIL_SYMBOLS,
  expandTerseString,
  getSymbolFor,
  inferrablePropertyType,
  isLocatableStructuredObject,
  isSymbolKey,
  isTerseCodePhrase,
  isTerseDvCodedText,
  isValueOnlyRmObject,
  parseLocatableStructuredObject,
  parseTerseDvCodedText,
  PROPERTY_TYPE_MAP,
  TERMINOLOGY_FIELD_PROMOTIONS,
} from "./shared.ts";
import { buildReverseSymbolMap, type ZipehrSymbolVariant } from "./symbol_map.ts";
import { TABLE3_EMOJI_SYMBOLS, TABLE3_LETTER_SYMBOLS } from "./table3_text.ts";

function buildSymbolMapFromTable(
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

const DEFAULT_EMOJI_SYMBOL_MAP = buildSymbolMapFromTable(TABLE3_EMOJI_SYMBOLS);
const DEFAULT_LETTER_SYMBOL_MAP = buildSymbolMapFromTable(TABLE3_LETTER_SYMBOLS);

function scoreZipehrSymbolKeys(
  node: unknown,
  reverseMap: Map<string, string>,
): number {
  if (node === null || node === undefined) return 0;
  if (typeof node !== "object") return 0;
  if (Array.isArray(node)) {
    return node.reduce((sum, item) => sum + scoreZipehrSymbolKeys(item, reverseMap), 0);
  }

  const obj = node as Record<string, unknown>;
  let score = 0;
  for (const [k, v] of Object.entries(obj)) {
    if (k !== "_" && reverseMap.has(k)) score++;
    if (k === "_" && typeof v === "string" && reverseMap.has(v)) score++;
    score += scoreZipehrSymbolKeys(v, reverseMap);
  }
  return score;
}

function expandCodePhraseTerse(terse: string): Record<string, unknown> {
  const expanded = expandTerseString(terse);
  const parts = expanded.split("::");
  const termId = parts[0] ?? "";
  const rest = parts.slice(1).join("::");
  const pipeIdx = rest.indexOf("|");
  const code = pipeIdx >= 0 ? rest.slice(0, pipeIdx) : rest;
  const result: Record<string, unknown> = {
    _type: "CODE_PHRASE",
    terminology_id: { _type: "TERMINOLOGY_ID", value: termId },
    code_string: code,
  };
  if (pipeIdx >= 0) {
    const preferred = rest.slice(pipeIdx + 1).replace(/\|$/, "");
    if (preferred) result.preferred_term = preferred;
  }
  return result;
}

function expandDvCodedTextTerse(terse: string): Record<string, unknown> {
  const expanded = expandTerseString(terse);
  const parsed = parseTerseDvCodedText(expanded);
  if (!parsed) {
    return { _type: "DV_CODED_TEXT", value: expanded };
  }
  return {
    _type: "DV_CODED_TEXT",
    value: parsed.value,
    defining_code: expandCodePhraseTerse(
      `${parsed.termId}::${parsed.code}`,
    ),
  };
}

function expandTerseScalar(
  value: string,
  expectedType?: string,
): unknown {
  const expanded = expandTerseString(value);
  if (isTerseDvCodedText(expanded)) return expandDvCodedTextTerse(expanded);
  if (isTerseCodePhrase(expanded)) return expandCodePhraseTerse(expanded);
  if (expectedType === "DV_TEXT" || expectedType === "TERMINOLOGY_ID") {
    return { _type: expectedType, value: expanded };
  }
  return expanded;
}

function expandInferrableLeaf(
  value: unknown,
  expectedType: string,
): unknown {
  if (typeof value === "string") {
    if (expectedType === "CODE_PHRASE") {
      const expanded = expandTerseString(value);
      if (isTerseCodePhrase(expanded) || expanded.includes("::")) {
        return expandCodePhraseTerse(value);
      }
    }
    if (expectedType === "DV_CODED_TEXT") {
      const expanded = expandTerseString(value);
      if (isTerseDvCodedText(expanded)) {
        return expandDvCodedTextTerse(value);
      }
    }
    const expanded = expandTerseScalar(value, expectedType);
    if (typeof expanded === "object" && expanded !== null) {
      return expanded;
    }
    return { _type: expectedType, value: expanded };
  }

  if (
    typeof value === "number" || typeof value === "boolean" ||
    value === null
  ) {
    return { _type: expectedType, value };
  }

  return value;
}

function expandArchetypeDetails(
  details: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { _type: "ARCHETYPED" };
  const tSym = ARCHETYPE_DETAIL_SYMBOLS.template_id;
  const aSym = ARCHETYPE_DETAIL_SYMBOLS.archetype_id;
  const rSym = ARCHETYPE_DETAIL_SYMBOLS.rm_version;

  if (details[tSym] != null) {
    out.template_id = {
      _type: "TEMPLATE_ID",
      value: details[tSym],
    };
  }
  if (details[aSym] != null) {
    out.archetype_id = {
      _type: "ARCHETYPE_ID",
      value: details[aSym],
    };
  }
  if (details[rSym] != null) {
    out.rm_version = details[rSym];
  }

  for (const k of Object.keys(details)) {
    if (k === tSym || k === aSym || k === rSym) continue;
    out[k] = details[k];
  }
  return out;
}

function expandStructuredLocatable(
  structured: Record<string, unknown>,
  typeName: string,
  obj: Record<string, unknown>,
  symKey: string,
  reverseMap: Map<string, string>,
  symbolMap: Record<string, string>,
): Record<string, unknown> {
  const parsed = parseLocatableStructuredObject(structured, symbolMap);

  const out: Record<string, unknown> = {
    _type: typeName,
    name: { _type: "DV_TEXT", value: parsed.name },
  };

  if (parsed.archetypeNodeId) {
    out.archetype_node_id = parsed.archetypeNodeId;
  }
  if (parsed.archetypeDetails) {
    out.archetype_details = expandArchetypeDetails(parsed.archetypeDetails);
  }

  for (const k of Object.keys(obj)) {
    if (k === symKey || k === "archetype_details") continue;
    out[k] = expandNode(obj[k], typeName, k, reverseMap, symbolMap);
  }
  return out;
}

function expandPromotedTerminology(
  obj: Record<string, unknown>,
): Record<string, unknown> {
  const out = { ...obj };
  for (const { field, prefix, emoji } of TERMINOLOGY_FIELD_PROMOTIONS) {
    if (!Object.prototype.hasOwnProperty.call(out, emoji)) continue;
    const code = String(out[emoji]);
    delete out[emoji];
    out[field] = expandCodePhraseTerse(`${prefix}${code}`);
  }
  return out;
}

function typeFromSymbolKey(
  key: string,
  reverseMap: Map<string, string>,
  symbolMap: Record<string, string>,
): string | undefined {
  if (key === "_") return undefined;
  if (reverseMap.has(key)) return reverseMap.get(key);
  if (key.startsWith("DV_")) return key;
  const fromMap = getSymbolFor(symbolMap, key);
  if (fromMap === key) return key;
  return reverseMap.get(key);
}

function expandNode(
  node: unknown,
  parentType?: string,
  propertyName?: string,
  reverseMap?: Map<string, string>,
  symbolMap?: Record<string, string>,
): unknown {
  if (node === null || node === undefined) return node;

  const expectedType = inferrablePropertyType(parentType, propertyName);
  if (typeof node !== "object") {
    if (expectedType) {
      return expandInferrableLeaf(node, expectedType);
    }
    return node;
  }

  if (Array.isArray(node)) {
    const itemType = parentType && propertyName
      ? PROPERTY_TYPE_MAP[parentType]?.[propertyName]
      : undefined;
    return node.map((item) =>
      expandNode(item, parentType, propertyName, reverseMap, symbolMap)
    );
  }

  const obj = expandPromotedTerminology(node as Record<string, unknown>);

  if (
    expectedType &&
    isValueOnlyRmObject(obj) &&
    !Object.keys(obj).some((k) =>
      k === "_" ||
      (reverseMap ? reverseMap.has(k) : isSymbolKey(k))
    )
  ) {
    return expandInferrableLeaf(obj.value, expectedType);
  }

  if (obj.archetype_details && typeof obj.archetype_details === "object") {
    obj.archetype_details = expandArchetypeDetails(
      obj.archetype_details as Record<string, unknown>,
    );
  }

  if (!reverseMap || !symbolMap) {
    return obj;
  }

  const compositionSym = getSymbolFor(symbolMap, "COMPOSITION");
  if (
    compositionSym &&
    Object.prototype.hasOwnProperty.call(obj, compositionSym) &&
    isLocatableStructuredObject(obj[compositionSym], symbolMap)
  ) {
    return expandStructuredLocatable(
      obj[compositionSym] as Record<string, unknown>,
      "COMPOSITION",
      obj,
      compositionSym,
      reverseMap,
      symbolMap,
    );
  }

  const symbolKeys = Object.keys(obj).filter((k) =>
    reverseMap ? reverseMap.has(k) && k !== "_" : isSymbolKey(k) && k !== "_"
  );
  const typeMarker = obj._;

  // ZipEHR shorthand fold reverse:
  // { "🔹": { "🪧": "Namn", "🆔": "at0001" }, value: { "🗉": "Brand..." } }
  // becomes:
  // { "🔹": { "🪧": "Namn", "🆔": "at0001" }, "🗉": "Brand..." }
  if (
    symbolKeys.length === 2 &&
    !Object.prototype.hasOwnProperty.call(obj, "value")
  ) {
    const locatableKeys = symbolKeys.filter((k) =>
      isLocatableStructuredObject(obj[k], symbolMap)
    );
    if (locatableKeys.length === 1) {
      const locKey = locatableKeys[0];
      const otherKey = symbolKeys.find((k) => k !== locKey)!;
      const typeName = typeFromSymbolKey(locKey, reverseMap, symbolMap);
      if (typeName) {
        const out = expandStructuredLocatable(
          obj[locKey] as Record<string, unknown>,
          typeName,
          obj,
          locKey,
          reverseMap,
          symbolMap,
        );

        const valueWrapper = { [otherKey]: obj[otherKey] };
        out.value = expandNode(
          valueWrapper,
          undefined,
          undefined,
          reverseMap,
          symbolMap,
        );
        return out;
      }
    }
  }

  if (symbolKeys.length === 1 && typeof obj[symbolKeys[0]] === "string") {
    const symKey = symbolKeys[0];
    const strVal = String(obj[symKey]);
    const typeName = typeFromSymbolKey(symKey, reverseMap, symbolMap);

    if (symKey === getSymbolFor(symbolMap, "CODE_PHRASE") || symKey === "🏷️") {
      return expandCodePhraseTerse(strVal);
    }

    if (typeName && typeName.startsWith("DV_")) {
      const expanded = expandTerseScalar(strVal, typeName);
      if (typeof expanded === "object") return expanded;
      const out: Record<string, unknown> = {
        _type: typeName,
        value: expanded,
      };
      for (const k of Object.keys(obj)) {
        if (k === symKey) continue;
        out[k] = expandNode(obj[k], typeName, k, reverseMap, symbolMap);
      }
      return out;
    }
  }

  if (symbolKeys.length === 1 && typeof obj[symbolKeys[0]] === "object") {
    const symKey = symbolKeys[0];
    const typeName = typeFromSymbolKey(symKey, reverseMap, symbolMap);
    if (typeName) {
      const innerVal = obj[symKey];
      if (
        innerVal && typeof innerVal === "object" && !Array.isArray(innerVal) &&
        isLocatableStructuredObject(innerVal, symbolMap)
      ) {
        return expandStructuredLocatable(
          innerVal as Record<string, unknown>,
          typeName,
          obj,
          symKey,
          reverseMap,
          symbolMap,
        );
      }

      const inner = expandNode(
        innerVal,
        typeName,
        undefined,
        reverseMap,
        symbolMap,
      );
      const out: Record<string, unknown> = { _type: typeName };
      if (inner && typeof inner === "object" && !Array.isArray(inner)) {
        Object.assign(out, inner as Record<string, unknown>);
      } else if (inner !== undefined) {
        out.value = inner;
      }
      for (const k of Object.keys(obj)) {
        if (k === symKey) continue;
        out[k] = expandNode(obj[k], typeName, k, reverseMap, symbolMap);
      }
      return out;
    }
  }

  let nodeType: string | undefined;
  if (typeof typeMarker === "string") {
    nodeType = reverseMap.get(typeMarker) ?? typeMarker;
  }
  if (!nodeType) {
    nodeType = inferrablePropertyType(parentType, propertyName);
  }

  const out: Record<string, unknown> = {};
  if (nodeType) out._type = nodeType;

  for (const k of Object.keys(obj)) {
    if (k === "_") continue;

    const v = obj[k];
    if (typeof v === "string" && isTerseCodePhrase(expandTerseString(v))) {
      out[k] = expandCodePhraseTerse(v);
      continue;
    }
    if (typeof v === "string" && isTerseDvCodedText(expandTerseString(v))) {
      out[k] = expandDvCodedTextTerse(v);
      continue;
    }

    out[k] = expandNode(v, nodeType, k, reverseMap, symbolMap);
  }

  if (!out._type && nodeType) out._type = nodeType;
  return out;
}

/** Expand a zipehr object tree to canonical openEHR JSON. */
export function expandZipehrToCanonical(
  zipehrObj: unknown,
  symbolMapOrVariant?: Record<string, string> | ZipehrSymbolVariant | "auto",
): unknown {
  let symbolMap: Record<string, string>;
  if (!symbolMapOrVariant || symbolMapOrVariant === "auto") {
    const reverseEmoji = buildReverseSymbolMap(DEFAULT_EMOJI_SYMBOL_MAP);
    const reverseLetter = buildReverseSymbolMap(DEFAULT_LETTER_SYMBOL_MAP);
    const emojiScore = scoreZipehrSymbolKeys(zipehrObj, reverseEmoji);
    const letterScore = scoreZipehrSymbolKeys(zipehrObj, reverseLetter);
    symbolMap = letterScore > emojiScore
      ? DEFAULT_LETTER_SYMBOL_MAP
      : DEFAULT_EMOJI_SYMBOL_MAP;
  } else if (typeof symbolMapOrVariant === "string") {
    symbolMap = symbolMapOrVariant === "lettercode"
      ? DEFAULT_LETTER_SYMBOL_MAP
      : DEFAULT_EMOJI_SYMBOL_MAP;
  } else {
    symbolMap = symbolMapOrVariant;
  }

  const reverseMap = buildReverseSymbolMap(symbolMap);
  return expandNode(zipehrObj, undefined, undefined, reverseMap, symbolMap);
}
