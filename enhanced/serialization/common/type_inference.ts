/**
 * Type Inference Engine for Smart Type Omission
 *
 * Determines when `_type` can be omitted on serialize and how to recover it on
 * deserialize. Property → type lookup is backed by BMM RM meta
 * (`enhanced/meta.attributesFor`), not hand-maintained tables.
 */

import {
  attributesFor,
  hasRmType,
  isAbstractType,
  isSubtypeOf,
  subtypesOf,
} from "../../meta/mod.ts";
import { TypeRegistry } from "./type_registry.ts";

/**
 * Property type information extracted from RM class metadata
 * Maps parent type + property name to expected type
 */
interface PropertyTypeInfo {
  parentType: string;
  propertyName: string;
  expectedType: string;
  isPolymorphic: boolean;
}

/** BMM / BASE names that are not openEHR object types for serde purposes. */
const PRIMITIVE_LIKE = new Set([
  "String",
  "Boolean",
  "Integer",
  "Integer64",
  "Real",
  "Double",
  "Byte",
  "Any",
  "Character",
  "Octet",
]);

/**
 * Clinical-RM concrete defaults when BMM declares an abstract type that serde
 * almost always materialises as one subtype (ZipEHR uid folding, etc.).
 */
const CONCRETE_DEFAULTS: Record<string, string> = {
  UID_BASED_ID: "OBJECT_VERSION_ID",
};

/**
 * Strip BMM container / generic wrappers to the element or base type name.
 * `List<CONTENT_ITEM>` → `CONTENT_ITEM`, `HISTORY<ITEM_STRUCTURE>` → `HISTORY`,
 * `EVENT<T>` → `EVENT`, bare `T` (EVENT.data) → `ITEM_STRUCTURE`.
 */
export function normalizeRmTypeName(typeName: string): string | undefined {
  let t = typeName.trim();
  if (!t) return undefined;

  const listMatch = t.match(/^List<\s*(.+)\s*>$/i);
  if (listMatch) t = listMatch[1].trim();

  const genericMatch = t.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*<.*>$/);
  if (genericMatch) t = genericMatch[1];

  if (t === "T") return "ITEM_STRUCTURE";
  return t;
}

function isPrimitiveLike(typeName: string): boolean {
  return PRIMITIVE_LIKE.has(typeName);
}

/**
 * Type Inference Engine for determining when `_type` fields can be omitted
 * and for inferring types during deserialization.
 */
export class TypeInferenceEngine {
  private static propertyTypeMap = new Map<string, PropertyTypeInfo>();
  private static propertyMapCache = new Map<string, Record<string, string>>();

  /** Extra polymorphic registrations (tests / rare extensions). */
  private static extraPolymorphic = new Set<string>();

  /**
   * Determine if a type field can be omitted during serialization.
   * Exact type match may omit even when the expected type has subtypes
   * (e.g. DV_TEXT name with a DV_TEXT value); a subtype instance must keep `_type`.
   */
  static canOmitType(
    propertyName: string,
    parentType: string,
    value: any,
  ): boolean {
    if (!value || typeof value !== "object") {
      return true; // Primitives don't need type
    }

    const valueType = TypeRegistry.getTypeNameFromInstance(value);
    if (!valueType) {
      return false; // Unknown type, must include
    }

    const expectedType = this.getDefaultTypeForProperty(
      parentType,
      propertyName,
    );

    if (!expectedType) {
      return false; // No default type known, must include
    }

    // Exact match: safe to omit regardless of whether expectedType has subtypes
    return valueType === expectedType;
  }

  /**
   * Infer the type from context during deserialization
   */
  static inferType(
    propertyName: string,
    parentType: string,
    data: any,
  ): string | undefined {
    const defaultType = this.getDefaultTypeForProperty(
      parentType,
      propertyName,
    );
    if (defaultType && !this.isPolymorphic(defaultType)) {
      return defaultType;
    }

    const structureInferred = this.inferFromStructure(data, defaultType);
    if (structureInferred) {
      return structureInferred;
    }

    if (defaultType) {
      if (this.isPolymorphic(defaultType)) {
        if (typeof console !== "undefined" && console.debug) {
          console.debug(
            `TypeInferenceEngine: Using best guess type '${defaultType}' for polymorphic property '${propertyName}' on '${parentType}'`,
          );
        }
      }
      return defaultType;
    }
  }

  /**
   * Get the expected/default type for a property on a parent type (BMM-backed).
   */
  static getDefaultTypeForProperty(
    parentType: string,
    propertyName: string,
  ): string | undefined {
    const key = `${parentType}.${propertyName}`;
    const cached = this.propertyTypeMap.get(key);
    if (cached) {
      return cached.expectedType;
    }

    const mapping = this.buildPropertyTypeMapping(parentType, propertyName);
    if (mapping) {
      this.propertyTypeMap.set(key, mapping);
      return mapping.expectedType;
    }

    return undefined;
  }

  /**
   * Non-polymorphic expected type for a property — suitable for omitting `_type`
   * or folding a value-only leaf (ZipEHR yaml / HTML).
   */
  static getInferrablePropertyType(
    parentType: string,
    propertyName: string,
  ): string | undefined {
    const expected = this.getDefaultTypeForProperty(parentType, propertyName);
    if (!expected || this.isPolymorphic(expected) || isPrimitiveLike(expected)) {
      return undefined;
    }
    return expected;
  }

  /**
   * All RM property → type entries for a parent (normalized). Used by ZipEHR
   * for child key order and ambiguous slot detection.
   */
  static getPropertyTypeMap(parentType: string): Record<string, string> {
    const cached = this.propertyMapCache.get(parentType);
    if (cached) return cached;

    const map: Record<string, string> = {};
    for (const attr of attributesFor(parentType)) {
      const normalized = normalizeRmTypeName(attr.typeName);
      if (!normalized || isPrimitiveLike(normalized)) continue;
      const concrete = CONCRETE_DEFAULTS[normalized] ?? normalized;
      map[attr.name] = concrete;
    }
    this.propertyMapCache.set(parentType, map);
    return map;
  }

  /**
   * True when the type may be substituted by a concrete subtype in instance data.
   */
  static isPolymorphic(typeName: string): boolean {
    if (this.extraPolymorphic.has(typeName)) return true;
    if (isAbstractType(typeName)) return true;
    // Concrete types with RM object subtypes (e.g. DV_TEXT → DV_CODED_TEXT,
    // PARTY_IDENTIFIED → PARTY_RELATED)
    return subtypesOf(typeName).some((sub) => this.isRmObjectSubtype(sub));
  }

  private static isRmObjectSubtype(typeName: string): boolean {
    if (isPrimitiveLike(typeName)) return false;
    return (
      isSubtypeOf(typeName, "DATA_VALUE") ||
      isSubtypeOf(typeName, "LOCATABLE") ||
      isSubtypeOf(typeName, "PATHABLE") ||
      isSubtypeOf(typeName, "PARTY_PROXY") ||
      isSubtypeOf(typeName, "DV_ENCAPSULATED") ||
      isSubtypeOf(typeName, "UID_BASED_ID") ||
      isSubtypeOf(typeName, "CONTENT_ITEM") ||
      isSubtypeOf(typeName, "ITEM") ||
      isSubtypeOf(typeName, "ITEM_STRUCTURE") ||
      isSubtypeOf(typeName, "EVENT")
    );
  }

  /**
   * Infer type from the structure of the data object
   */
  static inferFromStructure(
    data: any,
    _expectedType?: string,
  ): string | undefined {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return undefined;
    }

    const properties = Object.keys(data);

    if (properties.includes("value") && properties.includes("defining_code")) {
      return "DV_CODED_TEXT";
    }

    if (
      properties.includes("terminology_id") &&
      properties.includes("code_string")
    ) {
      return "CODE_PHRASE";
    }

    if (properties.includes("magnitude") && properties.includes("units")) {
      return "DV_QUANTITY";
    }

    if (properties.includes("magnitude") && !properties.includes("units")) {
      return "DV_COUNT";
    }

    if (properties.includes("value") && typeof data.value === "boolean") {
      return "DV_BOOLEAN";
    }

    if (
      properties.includes("value") && typeof data.value === "string" &&
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(data.value)
    ) {
      return "DV_DATE_TIME";
    }

    if (
      properties.includes("value") && !properties.includes("defining_code") &&
      !properties.includes("magnitude")
    ) {
      return "DV_TEXT";
    }

    if (
      properties.length === 1 && properties.includes("value") &&
      typeof data.value === "string"
    ) {
      return "TERMINOLOGY_ID";
    }

    if (
      properties.includes("category") &&
      properties.includes("archetype_node_id")
    ) {
      return "COMPOSITION";
    }

    if (
      properties.includes("data") && properties.includes("archetype_node_id")
    ) {
      return "OBSERVATION";
    }

    return undefined;
  }

  private static buildPropertyTypeMapping(
    parentType: string,
    propertyName: string,
  ): PropertyTypeInfo | undefined {
    if (!hasRmType(parentType) && attributesFor(parentType).length === 0) {
      return undefined;
    }

    const attr = attributesFor(parentType).find((a) => a.name === propertyName);
    if (!attr) return undefined;

    const normalized = normalizeRmTypeName(attr.typeName);
    if (!normalized) return undefined;

    const expectedType = CONCRETE_DEFAULTS[normalized] ?? normalized;
    const isPolymorphic = attr.polymorphic === true ||
      this.isPolymorphic(expectedType) ||
      this.isPolymorphic(normalized);

    return {
      parentType,
      propertyName,
      expectedType,
      isPolymorphic,
    };
  }

  static getPropertyType(
    parentType: string,
    propertyName: string,
  ): string | undefined {
    return this.getDefaultTypeForProperty(parentType, propertyName);
  }

  static clearCache(): void {
    this.propertyTypeMap.clear();
    this.propertyMapCache.clear();
  }

  static registerPolymorphicTypes(types: string[]): void {
    types.forEach((type) => this.extraPolymorphic.add(type));
  }

  /** Whether `rmType` inherits LOCATABLE (replaces hand-maintained type sets). */
  static isLocatableLike(rmType: string): boolean {
    return isSubtypeOf(rmType, "LOCATABLE");
  }
}
