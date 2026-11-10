/**
 * Fill inferrable `_type` on plain RM object trees (Veredictum-style shorthand JSON).
 * Used before semantic compare so document round-trip matches fixture typing policy.
 */

import {
  normalizeRmTypeName,
  TypeInferenceEngine,
} from "../common/type_inference.ts";
import { attributesFor } from "../../meta/mod.ts";

function resolveRmType(
  obj: Record<string, unknown>,
  expectedType?: string,
  parentType?: string,
  propertyName?: string,
): string | undefined {
  if (typeof obj._type === "string") return obj._type;
  if (expectedType) return expectedType;
  if (parentType && propertyName) {
    const inferred = TypeInferenceEngine.inferType(propertyName, parentType, obj);
    if (inferred) return inferred;
  }
  return TypeInferenceEngine.inferFromStructure(obj, expectedType);
}

function listElementType(parentType: string, propertyName: string): string | undefined {
  const attr = attributesFor(parentType).find((a) => a.name === propertyName);
  if (!attr) return undefined;
  const raw = attr.typeName.trim();
  const listMatch = raw.match(/^List<\s*(.+)\s*>$/i);
  if (listMatch) return normalizeRmTypeName(listMatch[1]);
  return undefined;
}

export function hydrateInferrableRmTypesInPlace(
  value: unknown,
  parentType?: string,
  propertyName?: string,
  expectedType?: string,
  depth = 0,
): void {
  if (depth > 48 || value == null) return;

  if (Array.isArray(value)) {
    const elemType = parentType && propertyName
      ? listElementType(parentType, propertyName)
      : undefined;
    for (const item of value) {
      hydrateInferrableRmTypesInPlace(item, parentType, propertyName, elemType, depth + 1);
    }
    return;
  }

  if (typeof value !== "object") return;
  const obj = value as Record<string, unknown>;
  const typeName = resolveRmType(obj, expectedType, parentType, propertyName);
  if (typeName && typeof obj._type !== "string") {
    obj._type = typeName;
  }
  if (!typeName) return;

  for (const [key, child] of Object.entries(obj)) {
    if (key === "_type" || child == null) continue;
    hydrateInferrableRmTypesInPlace(child, typeName, key, undefined, depth + 1);
  }
}
