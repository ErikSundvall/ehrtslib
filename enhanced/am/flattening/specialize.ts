/**
 * Merge parent (flat) and child (differential) cADL definition trees.
 */

import * as openehr_am from "../../openehr_am.ts";
import { cloneAttribute, cloneCObject, cloneComplexObject } from "../aom_clone.ts";

function attributeChildren(
  attr: openehr_am.C_ATTRIBUTE,
): openehr_am.C_OBJECT[] {
  return (attr as { children?: openehr_am.C_OBJECT[] }).children ?? [];
}

function setAttributeChildren(
  attr: openehr_am.C_ATTRIBUTE,
  children: openehr_am.C_OBJECT[],
): void {
  (attr as { children: openehr_am.C_OBJECT[] }).children = children;
}

function findAttribute(
  obj: openehr_am.C_COMPLEX_OBJECT,
  name: string,
): openehr_am.C_ATTRIBUTE | undefined {
  return obj.attributes?.find((a) => a.rm_attribute_name === name);
}

function findChildByNodeId(
  children: openehr_am.C_OBJECT[],
  nodeId: string,
): openehr_am.C_OBJECT | undefined {
  return children.find((c) => c.node_id === nodeId);
}

function mergeCObject(
  parent: openehr_am.C_OBJECT,
  child: openehr_am.C_OBJECT,
): openehr_am.C_OBJECT {
  if (
    child instanceof openehr_am.C_COMPLEX_OBJECT &&
    parent instanceof openehr_am.C_COMPLEX_OBJECT
  ) {
    return specializeComplexObject(parent, child);
  }
  return cloneCObject(child);
}

/**
 * Apply differential constraints onto a flat parent definition.
 */
export function specializeComplexObject(
  parentFlat: openehr_am.C_COMPLEX_OBJECT,
  differential: openehr_am.C_COMPLEX_OBJECT,
): openehr_am.C_COMPLEX_OBJECT {
  const result = cloneComplexObject(parentFlat);

  if (differential.occurrences) {
    result.occurrences = differential.occurrences;
  }

  if (!differential.attributes?.length) {
    return result;
  }

  if (!result.attributes) {
    result.attributes = [];
  }

  for (const diffAttr of differential.attributes) {
    const name = diffAttr.rm_attribute_name;
    if (!name) continue;

    const existing = findAttribute(result, name);
    if (!existing) {
      result.attributes.push(cloneAttribute(diffAttr));
      continue;
    }

    const diffChildren = attributeChildren(diffAttr);
    if (!diffChildren.length) {
      const existence = (diffAttr as {
        existence?: unknown;
      }).existence;
      if (existence !== undefined) {
        (existing as { existence: unknown }).existence = existence;
      }
      if (diffAttr instanceof openehr_am.C_MULTIPLE_ATTRIBUTE) {
        const ma = existing as openehr_am.C_MULTIPLE_ATTRIBUTE;
        if (diffAttr.cardinality) {
          ma.cardinality = diffAttr.cardinality;
        }
      }
      continue;
    }

    const mergedChildren: openehr_am.C_OBJECT[] = attributeChildren(existing)
      .map(cloneCObject);

    for (const diffChild of diffChildren) {
      const nodeId = diffChild.node_id;
      if (!nodeId) {
        mergedChildren.push(cloneCObject(diffChild));
        continue;
      }
      const idx = mergedChildren.findIndex((c) => c.node_id === nodeId);
      if (idx < 0) {
        mergedChildren.push(cloneCObject(diffChild));
        continue;
      }
      const parentChild = mergedChildren[idx];
      if (
        parentChild instanceof openehr_am.C_COMPLEX_OBJECT &&
        diffChild instanceof openehr_am.C_COMPLEX_OBJECT
      ) {
        mergedChildren[idx] = mergeCObject(parentChild, diffChild);
      } else {
        mergedChildren[idx] = cloneCObject(diffChild);
      }
    }

    setAttributeChildren(existing, mergedChildren);
  }

  return result;
}
