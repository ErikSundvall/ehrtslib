/**
 * Map ADL2 ODIN sections (annotations, rm_overlay) onto AOM instances.
 */

import type { OdinObject } from "./odin_parser.ts";
import * as openehr_am from "../openehr_am.ts";
import * as openehr_base from "../openehr_base.ts";

export function applyAnnotationsOdin(
  archetype: openehr_am.ARCHETYPE,
  data: OdinObject,
): void {
  const ann = new openehr_base.RESOURCE_ANNOTATIONS();
  const bag = ann as Record<string, unknown>;
  if (data.documentation !== undefined) {
    bag.documentation = data.documentation;
  } else if (Object.keys(data).length > 0) {
    bag.documentation = data;
  }
  (archetype as Record<string, unknown>).annotations = ann;
}

export function applyRmOverlayOdin(
  archetype: openehr_am.ARCHETYPE,
  data: OdinObject,
): void {
  const overlay = new openehr_am.RM_OVERLAY();
  const bag = overlay as Record<string, unknown>;
  if (data.rm_visibility !== undefined) {
    bag.rm_visibility = data.rm_visibility;
  } else if (Object.keys(data).length > 0) {
    bag.rm_visibility = data;
  }
  (archetype as Record<string, unknown>).rm_overlay = overlay;
}

export function getAnnotationsDocumentation(
  archetype: openehr_am.ARCHETYPE,
): OdinObject | undefined {
  const ann = (archetype as Record<string, unknown>).annotations as
    | openehr_base.RESOURCE_ANNOTATIONS
    | undefined;
  if (!ann) return undefined;
  const doc = (ann as Record<string, unknown>).documentation;
  return doc && typeof doc === "object" ? doc as OdinObject : undefined;
}

export function getRmOverlayVisibility(
  archetype: openehr_am.ARCHETYPE,
): OdinObject | undefined {
  const overlay = (archetype as Record<string, unknown>).rm_overlay as
    | openehr_am.RM_OVERLAY
    | undefined;
  if (!overlay) return undefined;
  const vis = (overlay as Record<string, unknown>).rm_visibility;
  return vis && typeof vis === "object" ? vis as OdinObject : undefined;
}
