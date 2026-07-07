/**
 * Expand zipehr objects back to canonical openEHR JSON (with _type fields).
 */

import {
  ARCHETYPE_DETAIL_SYMBOLS,
  expandTerseString,
  getSymbolFor,
  isTerseCodePhrase,
  isTerseDvCodedText,
  isSymbolKey,
  parseLocatableBracket,
  parseLocatableFolded,
  parseTerseDvCodedText,
  PROPERTY_TYPE_MAP,
  TERMINOLOGY_FIELD_PROMOTIONS,
} from "./shared.ts";
import { buildReverseSymbolMap } from "./symbol_map.ts";

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

function expandFoldedLocatable(
  foldedValue: string,
  typeName: string,
  obj: Record<string, unknown>,
  symKey: string,
  reverseMap: Map<string, string>,
  symbolMap: Record<string, string>,
): Record<string, unknown> {
  const parsed = parseLocatableFolded(foldedValue);
  const name = parsed?.name ?? foldedValue;
  const bracket = parsed?.bracket ?? "";
  const bracketParts = parseLocatableBracket(bracket, name);

  const out: Record<string, unknown> = {
    _type: typeName,
    name: { _type: "DV_TEXT", value: name },
  };

  if (bracketParts.archetypeNodeId) {
    out.archetype_node_id = bracketParts.archetypeNodeId;
  }
  if (bracketParts.archetypeDetails) {
    out.archetype_details = expandArchetypeDetails(bracketParts.archetypeDetails);
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
  if (typeof node !== "object") return node;

  if (Array.isArray(node)) {
    const itemType = parentType && propertyName
      ? PROPERTY_TYPE_MAP[parentType]?.[propertyName]
      : undefined;
    return node.map((item) =>
      expandNode(item, parentType, propertyName, reverseMap, symbolMap)
    );
  }

  const obj = expandPromotedTerminology(node as Record<string, unknown>);

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
    compositionSym && Object.prototype.hasOwnProperty.call(obj, compositionSym) &&
    typeof obj[compositionSym] === "string"
  ) {
    return expandFoldedLocatable(
      String(obj[compositionSym]),
      "COMPOSITION",
      obj,
      compositionSym,
      reverseMap,
      symbolMap,
    );
  }

  const symbolKeys = Object.keys(obj).filter((k) => isSymbolKey(k) && k !== "_");
  const typeMarker = obj._;

  if (symbolKeys.length === 1 && typeof obj[symbolKeys[0]] === "string") {
    const symKey = symbolKeys[0];
    const strVal = String(obj[symKey]);
    const typeName = typeFromSymbolKey(symKey, reverseMap, symbolMap);

    if (symKey === getSymbolFor(symbolMap, "CODE_PHRASE") || symKey === "🏷️") {
      return expandCodePhraseTerse(strVal);
    }

    const locatable = parseLocatableFolded(strVal);
    if (locatable && typeName) {
      return expandFoldedLocatable(
        strVal,
        typeName,
        obj,
        symKey,
        reverseMap,
        symbolMap,
      );
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
    if (typeName && typeName.startsWith("DV_")) {
      const inner = expandNode(
        obj[symKey],
        typeName,
        undefined,
        reverseMap,
        symbolMap,
      );
      const out: Record<string, unknown> = { _type: typeName };
      if (inner && typeof inner === "object" && !Array.isArray(inner)) {
        Object.assign(out, inner as Record<string, unknown>);
      } else {
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
  symbolMap: Record<string, string>,
): unknown {
  const reverseMap = buildReverseSymbolMap(symbolMap);
  return expandNode(zipehrObj, undefined, undefined, reverseMap, symbolMap);
}
