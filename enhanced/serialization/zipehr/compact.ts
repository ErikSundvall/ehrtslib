/**
 * Compact plain-object conversion for `zipehr.yaml` (type inference + terse format).
 * Mirrors FLOW_YAML_CONFIG rules; works on canonical JSON with _type fields.
 */

import {
  canFoldInferrableValueLeaf,
  inferType,
  isValueOnlyRmObject,
  POLYMORPHIC_TYPES,
  resolveType,
} from "./shared.ts";

export const FLOW_YAML_CONFIG = Object.freeze({
  mainStyle: "flow" as const,
  includeType: false,
  useTypeInference: true,
  useTerseFormat: true,
  includeNullValues: false,
  includeEmptyCollections: false,
  archetypeNodeIdLocation: "after_name" as const,
  keepArchetypeDetailsInline: true,
});

export type CompactConfig = typeof FLOW_YAML_CONFIG;

function getTermId(obj: Record<string, unknown>): string {
  const tid = obj.terminology_id;
  if (!tid) return "";
  if (typeof tid === "object" && tid !== null) {
    const t = tid as Record<string, unknown>;
    return String(t.value ?? t._value ?? "");
  }
  return String(tid);
}

export function toTerseCodePhrase(obj: Record<string, unknown>): string {
  return `${getTermId(obj)}::${obj.code_string ?? obj.code ?? ""}`;
}

export function toTerseDvCodedText(obj: Record<string, unknown>): string {
  const dc = (obj.defining_code ?? {}) as Record<string, unknown>;
  const termId = getTermId(dc);
  const code = dc.code_string ?? dc.code ?? "";
  const value = obj.value ?? "";
  return `${termId}::${code}|${value}|`;
}

/** Canonical DV_CODED_TEXT → terse string with terminology shortcuts applied. */
export function toTerseDvCodedTextShort(
  obj: Record<string, unknown>,
  shorten: (s: string) => string,
): string {
  return shorten(toTerseDvCodedText(obj));
}

function canUseTerseFormat(typeName: string): boolean {
  return typeName === "CODE_PHRASE" || typeName === "DV_CODED_TEXT" ||
    typeName === "DV_TEXT" || typeName === "ARCHETYPE_ID" ||
    typeName === "TEMPLATE_ID" || typeName === "TERMINOLOGY_ID" ||
    typeName === "OBJECT_VERSION_ID";
}

function toTerseValue(
  obj: Record<string, unknown>,
  typeName: string,
): string | undefined {
  if (typeName === "CODE_PHRASE") return toTerseCodePhrase(obj);
  if (typeName === "DV_CODED_TEXT") return toTerseDvCodedText(obj);
  if (
    typeName === "DV_TEXT" || typeName === "TERMINOLOGY_ID" ||
    typeName === "ARCHETYPE_ID" || typeName === "TEMPLATE_ID" ||
    typeName === "OBJECT_VERSION_ID"
  ) {
    return obj.value as string;
  }
  return undefined;
}

function shouldIncludeType(
  typeName: string | undefined,
  parentType: string | undefined,
  propertyName: string | undefined,
  config: CompactConfig,
): boolean {
  if (config.includeType) {
    if (!config.useTypeInference) return true;
    if (!parentType || !propertyName || !typeName) return true;
    const expected = inferType(propertyName, parentType, { _type: typeName });
    if (!expected) return true;
    if (POLYMORPHIC_TYPES.has(expected)) return true;
    return typeName !== expected;
  }
  return false;
}

function reorderKeys(keys: string[], config: CompactConfig): string[] {
  if (
    config.archetypeNodeIdLocation !== "after_name" ||
    !keys.includes("archetype_node_id")
  ) {
    return keys;
  }
  const rest = keys.filter((k) => k !== "archetype_node_id");
  if (!rest.includes("name")) return keys;
  const ordered: string[] = [];
  for (const k of rest) {
    ordered.push(k);
    if (k === "name") ordered.push("archetype_node_id");
  }
  return ordered;
}

export function toPlainObjectCompact(
  obj: unknown,
  parentType?: string,
  propertyName?: string,
  config: CompactConfig = FLOW_YAML_CONFIG,
): unknown {
  if (obj === null || obj === undefined) {
    return config.includeNullValues ? null : undefined;
  }
  if (typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    const result = obj
      .map((item) =>
        toPlainObjectCompact(item, parentType, propertyName, config)
      )
      .filter((item) => item !== undefined);
    if (result.length === 0 && !config.includeEmptyCollections) {
      return undefined;
    }
    return result;
  }

  const typed = obj as Record<string, unknown>;
  const typeName = resolveType(obj, parentType, propertyName);

  if (
    isValueOnlyRmObject(typed) &&
    canFoldInferrableValueLeaf(typeName, parentType, propertyName)
  ) {
    return typed.value;
  }

  if (config.useTerseFormat && typeName && canUseTerseFormat(typeName)) {
    const terse = toTerseValue(typed, typeName);
    if (terse !== undefined) return terse;
  }

  const result: Record<string, unknown> = {};
  if (
    config.includeType &&
    shouldIncludeType(typeName, parentType, propertyName, config) && typeName
  ) {
    result._type = typeName;
  }

  let keys = Object.keys(typed).filter((k) => {
    if (k === "_type") return false;
    const v = typed[k];
    if ((v === null || v === undefined) && !config.includeNullValues) {
      return false;
    }
    return true;
  });

  keys = reorderKeys(keys, config);

  for (const key of keys) {
    const plainValue = toPlainObjectCompact(
      typed[key],
      typeName,
      key,
      config,
    );
    if (plainValue !== undefined) result[key] = plainValue;
  }

  const hasProps = Object.keys(result).some((k) => k !== "_type");
  if (!hasProps && typeName) {
    return { _type: typeName };
  }
  if (!hasProps && !config.includeEmptyCollections) return undefined;
  return result;
}

export function jsonToCompactPlain(json: unknown): unknown {
  return toPlainObjectCompact(json, undefined, undefined, FLOW_YAML_CONFIG);
}
