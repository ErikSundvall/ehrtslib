/**
 * Emoji substitution and zipehr shorthands (ported from zipehr-convert.js).
 */

import { jsonToCompactPlain, toTerseDvCodedTextShort } from "./compact.ts";
import {
  buildLocatableFoldedString,
  compactArchetypeDetails,
  extractFirstScalar,
  extractTerminologyFieldCode,
  getSymbolFor,
  inferrablePropertyType,
  isSymbolKey,
  isTerseDvCodedText,
  resolveType,
  shortenTerseString,
  TERMINOLOGY_FIELD_PROMOTIONS,
} from "./shared.ts";

function promoteTerminologyFields(obj: Record<string, unknown>): void {
  for (const { field, prefix, emoji } of TERMINOLOGY_FIELD_PROMOTIONS) {
    if (!Object.prototype.hasOwnProperty.call(obj, field)) continue;
    const code = extractTerminologyFieldCode(obj[field], prefix, emoji);
    if (code == null) continue;
    delete obj[field];
    obj[emoji] = code;
  }
}

function hasLocatableFoldString(obj: Record<string, unknown>): boolean {
  // Folded locatable strings always end with a bracket suffix: `name[at0001]`.
  return Object.keys(obj).some((k) => {
    if (k === "value") return false;
    if (!isSymbolKey(k)) return false;
    return typeof obj[k] === "string" && /\[[^\]]+\]$/.test(String(obj[k]));
  });
}

/**
 * Fold redundant `value: { <emoji>: ... }` wrappers on locatable-like objects.
 *
 * Example:
 *   { "🔹": "Namn[at0001]", value: { "🗉": "Brand..." } }
 * becomes:
 *   { "🔹": "Namn[at0001]", "🗉": "Brand..." }
 *
 * This is a space-saving ZipEHR shorthand; `deserialize.ts` reconstructs the
 * original canonical shape.
 */
function foldRedundantValueProperty(obj: Record<string, unknown>): void {
  if (!hasLocatableFoldString(obj)) return;
  if (!Object.prototype.hasOwnProperty.call(obj, "value")) return;

  const inner = (obj as Record<string, unknown>).value as unknown;
  if (!inner || typeof inner !== "object" || Array.isArray(inner)) return;

  const innerObj = inner as Record<string, unknown>;
  const innerKeys = Object.keys(innerObj);
  // Only fold when the `value` wrapper contains exactly one symbol key.
  if (innerKeys.length !== 1) return;

  const symKey = innerKeys[0];
  if (!isSymbolKey(symKey) || symKey === "_") return;
  if (Object.prototype.hasOwnProperty.call(obj, symKey)) return;

  obj[symKey] = innerObj[symKey];
  delete obj.value;
}

function foldCompositionName(
  obj: Record<string, unknown>,
  symbolMap: Record<string, string>,
): Record<string, unknown> {
  const compositionSym = getSymbolFor(symbolMap, "COMPOSITION");
  const isComposition = (compositionSym && obj._ === compositionSym) ||
    obj._ === "COMPOSITION";
  if (!isComposition || !Object.prototype.hasOwnProperty.call(obj, "name")) {
    return obj;
  }

  const nameStr = extractFirstScalar(obj.name);
  if (nameStr == null) return obj;

  const sym = compositionSym || "🖂";
  const folded = buildLocatableFoldedString(
    nameStr,
    obj.archetype_node_id != null ? String(obj.archetype_node_id) : undefined,
    obj.archetype_details,
  );
  const out: Record<string, unknown> = { [sym]: folded };
  for (const k of Object.keys(obj)) {
    if (
      k === "_" || k === "name" || k === "archetype_node_id" ||
      k === "archetype_details"
    ) {
      continue;
    }
    out[k] = obj[k];
  }
  return out;
}

export function applyZipehrShorthands(
  node: unknown,
  symbolMap: Record<string, string>,
): unknown {
  if (node === null) return null;
  if (Array.isArray(node)) {
    return node.map((item) => applyZipehrShorthands(item, symbolMap));
  }
  if (typeof node !== "object") return node;

  let obj = node as Record<string, unknown>;
  if (Object.prototype.hasOwnProperty.call(obj, "archetype_details")) {
    const compacted = compactArchetypeDetails(obj.archetype_details);
    if (compacted !== obj.archetype_details) {
      obj = { ...obj, archetype_details: compacted as Record<string, unknown> };
    }
  }

  obj = foldCompositionName(obj, symbolMap);
  promoteTerminologyFields(obj);
  foldRedundantValueProperty(obj);

  const out: Record<string, unknown> = {};
  for (const k of Object.keys(obj)) {
    out[k] = applyZipehrShorthands(obj[k], symbolMap);
  }
  return out;
}

function formatCodePhraseValue(obj: Record<string, unknown>): string {
  let termId: string | undefined;
  const tid = obj.terminology_id;
  if (tid) {
    if (typeof tid === "object" && tid !== null) {
      const t = tid as Record<string, unknown>;
      termId = String(t.value ?? t._value ?? "");
    } else {
      termId = String(tid);
    }
  }
  const code = obj.code_string ?? obj.code ?? "";
  const preferred = obj.preferred_term ?? obj.preferred;
  let valueStr = "";
  if (termId) valueStr += termId + "::";
  valueStr += String(code);
  if (preferred) valueStr += "|" + preferred + "|";
  return shortenTerseString(valueStr);
}

function convertObjectDirectInner(
  obj: unknown,
  symbolMap: Record<string, string>,
): unknown {
  if (obj === null) return null;
  if (Array.isArray(obj)) {
    return obj.map((e) => convertObjectDirectInner(e, symbolMap));
  }
  if (typeof obj !== "object") return obj;

  const typed = obj as Record<string, unknown>;
  if (Object.prototype.hasOwnProperty.call(typed, "_type")) {
    const t = String(typed._type);

    if (t === "CODE_PHRASE") {
      const symbol = getSymbolFor(symbolMap, "CODE_PHRASE") || "🏷️";
      return { [symbol]: formatCodePhraseValue(typed) };
    }

    if (t === "DV_CODED_TEXT") {
      const symbol = getSymbolFor(symbolMap, "DV_CODED_TEXT") || "🗈";
      return {
        [symbol]: toTerseDvCodedTextShort(typed, shortenTerseString),
      };
    }

    if (t.startsWith("DV_")) {
      const symbol = getSymbolFor(symbolMap, t) || t;
      if (Object.prototype.hasOwnProperty.call(typed, "value")) {
        const extraKeys = Object.keys(typed).filter((k) =>
          k !== "_type" && k !== "value"
        );
        if (extraKeys.length === 0) {
          return {
            [symbol]: convertObjectDirectInner(typed.value, symbolMap),
          };
        }
        const inner: Record<string, unknown> = {
          value: convertObjectDirectInner(typed.value, symbolMap),
        };
        for (const k of extraKeys) {
          inner[k] = convertObjectDirectInner(typed[k], symbolMap);
        }
        return { [symbol]: inner };
      }
      const inner: Record<string, unknown> = {};
      for (const k of Object.keys(typed)) {
        if (k === "_type") continue;
        inner[k] = convertObjectDirectInner(typed[k], symbolMap);
      }
      return {
        [symbol]: Object.keys(inner).length === 0 ? null : inner,
      };
    }

    const sym = getSymbolFor(symbolMap, t) || t;

    if (
      Object.prototype.hasOwnProperty.call(typed, "name") &&
      (Object.prototype.hasOwnProperty.call(typed, "archetype_node_id") ||
        Object.prototype.hasOwnProperty.call(typed, "archetype_details"))
    ) {
      const convName = convertObjectDirectInner(typed.name, symbolMap);
      const nameStr = extractFirstScalar(convName) || "";
      const nodeId = typed.archetype_node_id != null
        ? extractFirstScalar(
          convertObjectDirectInner(typed.archetype_node_id, symbolMap),
        ) ?? String(typed.archetype_node_id)
        : undefined;
      const folded = buildLocatableFoldedString(
        nameStr,
        nodeId,
        typed.archetype_details,
      );
      const out: Record<string, unknown> = { [sym]: folded };
      for (const k of Object.keys(typed)) {
        if (
          k === "_type" || k === "name" || k === "archetype_node_id" ||
          k === "archetype_details"
        ) {
          continue;
        }
        out[k] = convertObjectDirectInner(typed[k], symbolMap);
      }
      return out;
    }

    const out: Record<string, unknown> = { _: sym };
    for (const k of Object.keys(typed)) {
      if (k === "_type") continue;
      out[k] = convertObjectDirectInner(typed[k], symbolMap);
    }
    return out;
  }

  const out: Record<string, unknown> = {};
  for (const k of Object.keys(typed)) {
    out[k] = convertObjectDirectInner(typed[k], symbolMap);
  }
  return out;
}

/** `zipehr.json`: emoji substitution on canonical JSON with _type fields. */
export function convertObjectDirect(
  obj: unknown,
  symbolMap: Record<string, string>,
): unknown {
  return applyZipehrShorthands(
    convertObjectDirectInner(obj, symbolMap),
    symbolMap,
  );
}

function wrapCodePhraseString(
  terseStr: string,
  symbolMap: Record<string, string>,
): Record<string, string> {
  const symbol = getSymbolFor(symbolMap, "CODE_PHRASE") || "🏷️";
  return { [symbol]: shortenTerseString(terseStr) };
}

function wrapDvCodedTextString(
  terseStr: string,
  symbolMap: Record<string, string>,
): Record<string, unknown> {
  const symbol = getSymbolFor(symbolMap, "DV_CODED_TEXT") || "🗈";
  return { [symbol]: shortenTerseString(terseStr) };
}

function wrapDvScalar(
  typeName: string,
  scalar: unknown,
  symbolMap: Record<string, string>,
): Record<string, unknown> {
  const symbol = getSymbolFor(symbolMap, typeName) || typeName;
  return { [symbol]: scalar };
}

function isTerseCodePhraseCompat(str: string, original: unknown): boolean {
  if (typeof str !== "string") return false;
  if (original && typeof original === "object" && !Array.isArray(original)) {
    const typed = (original as { _type?: string })._type;
    if (typed && typed !== "CODE_PHRASE") return false;
  }
  return /^[^:]+::[^|]+$/.test(str);
}

export function applyEmojiToCompact(
  compact: unknown,
  original: unknown,
  symbolMap: Record<string, string>,
  parentType?: string,
  propertyName?: string,
): unknown {
  if (compact === undefined) {
    if (original && typeof original === "object" && !Array.isArray(original)) {
      const typed = original as { _type?: string };
      if (typed._type) {
        const sym = getSymbolFor(symbolMap, typed._type) || typed._type;
        return { _: sym };
      }
    }
    return undefined;
  }
  if (compact === null) return null;
  if (Array.isArray(compact)) {
    const origArr = Array.isArray(original) ? original : [];
    return compact.map((item, i) =>
      applyEmojiToCompact(
        item,
        origArr[i],
        symbolMap,
        parentType,
        propertyName,
      )
    );
  }
  if (typeof compact !== "object") {
    const typeName = resolveType(original, parentType, propertyName);
    if (propertyName === "archetype_id" || propertyName === "template_id") {
      return { value: compact };
    }
    if (typeof compact === "string") {
      if (inferrablePropertyType(parentType, propertyName)) {
        return shortenTerseString(compact);
      }
      if (
        typeName === "CODE_PHRASE" || isTerseCodePhraseCompat(compact, original)
      ) {
        return wrapCodePhraseString(compact, symbolMap);
      }
      if (typeName === "DV_CODED_TEXT" || isTerseDvCodedText(compact)) {
        return wrapDvCodedTextString(compact, symbolMap);
      }
      if (typeName && typeName.startsWith("DV_")) {
        return wrapDvScalar(typeName, compact, symbolMap);
      }
    }
    return compact;
  }

  const compactObj = compact as Record<string, unknown>;
  const origObj =
    (original && typeof original === "object" && !Array.isArray(original))
      ? original as Record<string, unknown>
      : undefined;

  if (compactObj._type && Object.keys(compactObj).length === 1) {
    const sym = getSymbolFor(symbolMap, String(compactObj._type)) ||
      String(compactObj._type);
    return { _: sym };
  }

  const typeName = (origObj && origObj._type) ||
    compactObj._type ||
    resolveType(original, parentType, propertyName);

  if (
    Object.keys(compactObj).length === 1 &&
    Object.prototype.hasOwnProperty.call(compactObj, "value") &&
    !Object.prototype.hasOwnProperty.call(compactObj, "_type")
  ) {
    if (inferrablePropertyType(parentType, propertyName)) {
      return compactObj.value;
    }
    const dvType = resolveType(original, parentType, propertyName);
    if (dvType && dvType.startsWith("DV_")) {
      return wrapDvScalar(dvType, compactObj.value, symbolMap);
    }
  }

  if (
    origObj &&
    Object.prototype.hasOwnProperty.call(origObj, "name") &&
    (Object.prototype.hasOwnProperty.call(origObj, "archetype_node_id") ||
      Object.prototype.hasOwnProperty.call(origObj, "archetype_details"))
  ) {
    const sym = getSymbolFor(symbolMap, String(typeName ?? "")) ||
      String(typeName ?? "LOCATABLE");
    const nameStr = typeof compactObj.name === "string"
      ? compactObj.name
      : (extractFirstScalar(compactObj.name) ||
        extractFirstScalar(origObj.name) || "");
    const nodeId = compactObj.archetype_node_id != null
      ? String(compactObj.archetype_node_id)
      : (origObj.archetype_node_id != null
        ? String(origObj.archetype_node_id)
        : undefined);
    const folded = buildLocatableFoldedString(
      nameStr,
      nodeId,
      origObj.archetype_details,
    );
    const out: Record<string, unknown> = { [String(sym)]: folded };
    for (const k of Object.keys(compactObj)) {
      if (
        k === "_type" || k === "name" || k === "archetype_node_id" ||
        k === "archetype_details"
      ) {
        continue;
      }
      out[k] = applyEmojiToCompact(
        compactObj[k],
        origObj[k],
        symbolMap,
        String(typeName),
        k,
      );
    }
    return out;
  }

  if (
    typeName && String(typeName).startsWith("DV_")
  ) {
    const symbol = getSymbolFor(symbolMap, String(typeName)) || typeName;
    const inner: Record<string, unknown> = {};
    for (const k of Object.keys(compactObj)) {
      if (k === "_type") continue;
      inner[k] = applyEmojiToCompact(
        compactObj[k],
        origObj && origObj[k],
        symbolMap,
        String(typeName),
        k,
      );
    }
    return {
      [String(symbol)]: Object.keys(inner).length === 0 ? null : inner,
    };
  }

  if (inferrablePropertyType(parentType, propertyName)) {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(compactObj)) {
      if (k === "_type") continue;
      out[k] = applyEmojiToCompact(
        compactObj[k],
        origObj && origObj[k],
        symbolMap,
        String(typeName),
        k,
      );
    }
    return out;
  }

  const sym = getSymbolFor(symbolMap, String(typeName));
  if (sym) {
    const inner: Record<string, unknown> = {};
    for (const k of Object.keys(compactObj)) {
      if (k === "_type") continue;
      inner[k] = applyEmojiToCompact(
        compactObj[k],
        origObj && origObj[k],
        symbolMap,
        String(typeName),
        k,
      );
    }
    return { [sym]: inner };
  }

  const out: Record<string, unknown> = {};
  if (typeName && typeName !== "Object") {
    out._ = typeName;
  }
  for (const k of Object.keys(compactObj)) {
    if (k === "_type") continue;
    out[k] = applyEmojiToCompact(
      compactObj[k],
      origObj && origObj[k],
      symbolMap,
      String(typeName),
      k,
    );
  }
  return out;
}

/** `zipehr.yaml`: compact (terse + type inference) then emoji substitution. */
export function convertObjectEhrtslib(
  obj: unknown,
  symbolMap: Record<string, string>,
): unknown {
  const compact = jsonToCompactPlain(obj);
  return applyZipehrShorthands(
    applyEmojiToCompact(compact, obj, symbolMap, undefined, undefined),
    symbolMap,
  );
}
