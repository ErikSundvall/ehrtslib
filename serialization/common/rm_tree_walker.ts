/**
 * Shared RM-tree walker for serialization.
 *
 * Collects enumerable own properties + prototype getters (skipping `_`/`$`
 * internals and functions), then recursively converts values via a visitor.
 * JSON and YAML serializers are thin adapters over this module.
 */

import { TypeRegistry } from "./type_registry.ts";
import {
  orderSerializationKeys,
  type PropertyOrderOptions,
} from "./property_order.ts";

export type RmTreeWalkOptions = {
  /** Include null / undefined property values in the property list. Default false. */
  includeNullValues?: boolean;
  /** Property key ordering (archetype_node_id / name placement). */
  order?: PropertyOrderOptions;
};

export type RmTreeNodeContext = {
  typeName: string | undefined;
  parentType?: string;
  propertyName?: string;
};

/**
 * Enumerate serializable property names on an RM instance (own + getters).
 */
export function collectRmPropertyNames(
  obj: object,
  options: RmTreeWalkOptions = {},
): string[] {
  const includeNull = options.includeNullValues ?? false;
  const allProperties = new Set<string>();

  Object.keys(obj).forEach((key) => allProperties.add(key));

  let proto = Object.getPrototypeOf(obj);
  while (proto && proto !== Object.prototype) {
    Object.getOwnPropertyNames(proto).forEach((key) => {
      if (key === "constructor") return;
      const descriptor = Object.getOwnPropertyDescriptor(proto, key);
      if (descriptor?.get) allProperties.add(key);
    });
    proto = Object.getPrototypeOf(proto);
  }

  const props = Array.from(allProperties).filter((key) => {
    if (key.startsWith("_") || key.startsWith("$")) return false;
    const value = (obj as Record<string, unknown>)[key];
    if (typeof value === "function") return false;
    if ((value === null || value === undefined) && !includeNull) return false;
    return true;
  });

  return orderSerializationKeys(props, options.order ?? {});
}

/**
 * Resolve TypeRegistry type name for an instance (undefined if unknown).
 */
export function resolveRmTypeName(obj: object): string | undefined {
  return TypeRegistry.getTypeNameFromInstance(obj) ?? undefined;
}

/**
 * Walk an RM value tree into a plain JSON-like structure.
 *
 * `visitObject` builds the object node (type tag + property map). Recursion
 * into property values is provided via `recurse`.
 */
export function walkRmTreeToPlain(
  obj: unknown,
  options: RmTreeWalkOptions,
  visitObject: (
    ctx: RmTreeNodeContext,
    orderedKeys: string[],
    recurse: (value: unknown, propertyName: string) => unknown,
    source: Record<string, unknown>,
  ) => unknown,
  parentType?: string,
  propertyName?: string,
): unknown {
  if (obj === null || obj === undefined) {
    return options.includeNullValues ? null : undefined;
  }

  if (typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    const result = obj.map((item) =>
      walkRmTreeToPlain(item, options, visitObject, parentType, propertyName)
    );
    return result;
  }

  const typeName = resolveRmTypeName(obj);
  const orderedKeys = collectRmPropertyNames(obj, options);
  const recurse = (value: unknown, key: string) =>
    walkRmTreeToPlain(value, options, visitObject, typeName, key);

  return visitObject(
    { typeName, parentType, propertyName },
    orderedKeys,
    recurse,
    obj as Record<string, unknown>,
  );
}
