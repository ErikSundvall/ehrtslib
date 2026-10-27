/**
 * When Web Template node ids follow RM attribute names vs RM type names.
 */

import * as openehr_am from "../../am/openehr_am.ts";
import { isDataValueType, isSubtypeOf } from "../../meta/mod.ts";

const CONTAINER_ATTRIBUTES = new Set([
  "content",
  "items",
  "events",
  "activities",
  "protocol",
  "data",
  "state",
  "history",
  "participations",
  "relationships",
  "identities",
  "details",
  "feeder_audit",
  "links",
]);

function constraintNodeId(obj: openehr_am.C_OBJECT): string | undefined {
  const ref = (obj as openehr_am.C_ARCHETYPE_ROOT).archetype_ref;
  if (obj instanceof openehr_am.C_ARCHETYPE_ROOT && ref) return ref;
  const nodeId = obj.node_id;
  if (!nodeId) return undefined;
  if (/^at\d/i.test(nodeId) || nodeId.startsWith("openEHR-")) return nodeId;
  return nodeId;
}

/** Use RM attribute name as Web Template id (EHRbase convention). */
export function useRmAttributeAsWebTemplateId(
  parentRmType: string,
  attrName: string,
  child: openehr_am.C_OBJECT,
): boolean {
  if (attrName === "name") return false;
  if (CONTAINER_ATTRIBUTES.has(attrName)) return false;

  if (child instanceof openehr_am.C_ARCHETYPE_ROOT) return false;

  const rmType = child.rm_type_name ?? "";
  if (rmType === "ISM_TRANSITION" && attrName === "ism_transition") return true;
  if (parentRmType === "ISM_TRANSITION" && isDataValueType(rmType)) return true;

  if (!isDataValueType(rmType)) return false;
  if (isSubtypeOf(rmType, "LOCATABLE")) return false;
  if (constraintNodeId(child)) return false;
  return true;
}

export function webTemplateChildIdHint(
  parentRmType: string,
  attrName: string,
  child: openehr_am.C_OBJECT,
): string {
  if (
    child instanceof openehr_am.C_COMPLEX_OBJECT &&
    useRmAttributeAsWebTemplateId(parentRmType, attrName, child)
  ) {
    return attrName;
  }
  return child.rm_type_name?.toLowerCase() ?? attrName;
}
