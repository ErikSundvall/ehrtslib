/**
 * Check that a generated RM instance covers the operational template
 * according to generation mode semantics.
 */

import * as openehr_am from "../../openehr_am.ts";
import type { GenerationMode } from "./rm_instance_generator.ts";

type Bounds = { min: number; max: number; unbounded: boolean };

export interface TemplateSlotExpectation {
  /** RM path using attribute names and numeric indices, e.g. content/0/data/events/0/offset */
  path: string;
  rmType: string;
  nodeId?: string;
  /** Primitive constraints are satisfied by a value on the parent path, not a child object */
  primitive: boolean;
  required: boolean;
}

export interface CoverageResult {
  expected: TemplateSlotExpectation[];
  missing: TemplateSlotExpectation[];
}

const PRIMITIVE_RM_TYPES = new Set([
  "STRING",
  "INTEGER",
  "REAL",
  "BOOLEAN",
  "DATE",
  "TIME",
  "DATE_TIME",
  "DURATION",
]);

function boundsFromMultiplicity(
  multiplicity: unknown,
  defaultMin: number,
  defaultMax: number,
): Bounds {
  const interval = (multiplicity as { interval?: Bounds } | undefined)?.interval ??
    multiplicity as Bounds | undefined;
  if (!interval) {
    return { min: defaultMin, max: defaultMax, unbounded: false };
  }
  const lower = (interval as { lower_unbounded?: boolean }).lower_unbounded
    ? 0
    : ((interval as { lower?: number }).lower ?? defaultMin);
  const unbounded = (interval as { upper_unbounded?: boolean }).upper_unbounded ===
    true;
  const upper = unbounded
    ? -1
    : ((interval as { upper?: number }).upper ?? defaultMax);
  return {
    min: Math.max(0, Number(lower)),
    max: upper < 0 ? -1 : Math.max(0, Number(upper)),
    unbounded,
  };
}

function objectBounds(cObject: openehr_am.C_OBJECT): Bounds {
  return boundsFromMultiplicity(cObject.occurrences, 1, 1);
}

function attributeBounds(cAttribute: openehr_am.C_ATTRIBUTE): Bounds {
  const existenceBounds = boundsFromMultiplicity(
    (cAttribute as { existence?: unknown }).existence,
    0,
    1,
  );
  if (cAttribute instanceof openehr_am.C_MULTIPLE_ATTRIBUTE) {
    const cardBounds = boundsFromMultiplicity(
      cAttribute.cardinality?.interval,
      0,
      1,
    );
    return {
      min: Math.max(existenceBounds.min, cardBounds.min),
      max: cardBounds.max,
      unbounded: cardBounds.unbounded,
    };
  }
  return existenceBounds;
}

function isExcluded(bounds: Bounds): boolean {
  return !bounds.unbounded && bounds.max === 0;
}

function isPrimitiveConstraint(cObject: openehr_am.C_OBJECT): boolean {
  if (
    cObject instanceof openehr_am.C_PRIMITIVE_OBJECT ||
    cObject instanceof openehr_am.C_PRIMITIVE ||
    cObject instanceof openehr_am.C_QUANTITY ||
    cObject instanceof openehr_am.C_CODED_TEXT ||
    cObject instanceof openehr_am.C_TERMINOLOGY_CODE
  ) {
    return true;
  }
  const rmType = cObject.rm_type_name ?? "";
  if (PRIMITIVE_RM_TYPES.has(rmType)) return true;
  const isComplex = cObject instanceof openehr_am.C_COMPLEX_OBJECT ||
    cObject instanceof openehr_am.C_ARCHETYPE_ROOT;
  return !isComplex || (cObject.attributes?.length ?? 0) === 0;
}

function hasMandatoryDescendant(cObject: openehr_am.C_OBJECT): boolean {
  if (objectBounds(cObject).min > 0) return true;
  if (
    !(cObject instanceof openehr_am.C_COMPLEX_OBJECT) &&
    !(cObject instanceof openehr_am.C_ARCHETYPE_ROOT)
  ) {
    return false;
  }
  for (const attr of cObject.attributes ?? []) {
    if (isExcluded(attributeBounds(attr))) continue;
    for (const child of attr.children ?? []) {
      if (isExcluded(objectBounds(child))) continue;
      if (objectBounds(child).min > 0 || hasMandatoryDescendant(child)) {
        return true;
      }
    }
  }
  return false;
}

function shouldIncludeObject(
  cObject: openehr_am.C_OBJECT,
  mode: GenerationMode,
): boolean {
  const bounds = objectBounds(cObject);
  if (isExcluded(bounds)) return false;
  return bounds.min > 0 || mode !== "minimal";
}

function shouldIncludeAttribute(
  cAttribute: openehr_am.C_ATTRIBUTE,
  mode: GenerationMode,
): boolean {
  const bounds = attributeBounds(cAttribute);
  if (isExcluded(bounds)) return false;
  if (bounds.min > 0) return true;
  if (mode !== "minimal") return true;
  return (cAttribute.children ?? []).some((child) =>
    objectBounds(child).min > 0 || hasMandatoryDescendant(child)
  );
}

function memberCount(
  cObject: openehr_am.C_OBJECT,
  mode: GenerationMode,
  maxGeneratedItems: number,
): number {
  const bounds = objectBounds(cObject);
  if (mode === "minimal") return bounds.min;
  if (mode === "example") return Math.max(bounds.min, 1);
  if (bounds.unbounded || bounds.max < 0) {
    return Math.max(bounds.min, Math.min(2, maxGeneratedItems));
  }
  return Math.max(bounds.min, Math.min(bounds.max, maxGeneratedItems));
}

function selectAlternative(
  children: openehr_am.C_OBJECT[],
): openehr_am.C_OBJECT | undefined {
  const allowed = children.filter((child) => !isExcluded(objectBounds(child)));
  const required = allowed.filter((child) => objectBounds(child).min > 0);
  return required[0] ?? allowed[0];
}

function selectMembers(
  children: openehr_am.C_OBJECT[],
  mode: GenerationMode,
): openehr_am.C_OBJECT[] {
  const allowed = children.filter((child) => !isExcluded(objectBounds(child)));
  if (mode === "minimal") {
    const required = allowed.filter((child) => objectBounds(child).min > 0);
    if (required.length) return required;
    return [];
  }
  return allowed;
}

function collectExpected(
  cObject: openehr_am.C_OBJECT,
  path: string,
  mode: GenerationMode,
  maxGeneratedItems: number,
  out: TemplateSlotExpectation[],
): void {
  if (!shouldIncludeObject(cObject, mode)) return;

  if (isPrimitiveConstraint(cObject)) {
    out.push({
      path,
      rmType: cObject.rm_type_name ?? "UNKNOWN",
      nodeId: cObject.node_id,
      primitive: true,
      required: objectBounds(cObject).min > 0,
    });
    return;
  }

  out.push({
    path,
    rmType: cObject.rm_type_name ?? "UNKNOWN",
    nodeId: cObject.node_id,
    primitive: false,
    required: objectBounds(cObject).min > 0,
  });

  if (
    !(cObject instanceof openehr_am.C_COMPLEX_OBJECT) &&
    !(cObject instanceof openehr_am.C_ARCHETYPE_ROOT)
  ) {
    return;
  }

  for (const attr of cObject.attributes ?? []) {
    if (!shouldIncludeAttribute(attr, mode)) continue;
    const attrName = attr.rm_attribute_name;
    if (!attrName) continue;
    const children = attr.children ?? [];

    if (attr instanceof openehr_am.C_MULTIPLE_ATTRIBUTE) {
      const members = selectMembers(children, mode);
      let memberIndex = 0;
      for (const member of members) {
        const count = memberCount(member, mode, maxGeneratedItems);
        for (let i = 0; i < count; i++) {
          collectExpected(
            member,
            path
              ? `${path}/${attrName}/${memberIndex}`
              : `${attrName}/${memberIndex}`,
            mode,
            maxGeneratedItems,
            out,
          );
          memberIndex++;
        }
      }
      continue;
    }

    const child = selectAlternative(children);
    if (!child) continue;
    collectExpected(
      child,
      path ? `${path}/${attrName}` : attrName,
      mode,
      maxGeneratedItems,
      out,
    );
  }
}

export function expectedTemplateSlots(
  template: openehr_am.OPERATIONAL_TEMPLATE | openehr_am.ARCHETYPE,
  mode: GenerationMode,
  options?: { maxGeneratedItems?: number },
): TemplateSlotExpectation[] {
  if (!template.definition) return [];
  const slots: TemplateSlotExpectation[] = [];
  collectExpected(
    template.definition,
    "",
    mode,
    options?.maxGeneratedItems ?? 3,
    slots,
  );
  return slots;
}

function getAtPath(instance: unknown, path: string): unknown {
  if (!path) return instance;
  let current: unknown = instance;
  for (const segment of path.split("/").filter(Boolean)) {
    if (current === null || current === undefined) return undefined;
    if (Array.isArray(current)) {
      current = current[Number(segment)];
      continue;
    }
    if (typeof current === "object") {
      current = (current as Record<string, unknown>)[segment];
      continue;
    }
    return undefined;
  }
  return current;
}

function slotSatisfied(
  instance: unknown,
  slot: TemplateSlotExpectation,
): boolean {
  const value = getAtPath(instance, slot.path);
  if (value === null || value === undefined) return false;

  if (slot.primitive) {
    if (typeof value === "string" || typeof value === "number") return true;
    if (typeof value === "boolean") return true;
    if (typeof value === "object" && value !== null) {
      const typed = value as Record<string, unknown>;
      if (slot.rmType.startsWith("DV_") && typed._type === slot.rmType) return true;
      if (typed._type === slot.rmType) return true;
      if ("value" in typed || "magnitude" in typed || "defining_code" in typed) {
        return true;
      }
    }
    return false;
  }

  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  if (obj._type !== slot.rmType) return false;
  if (slot.nodeId && obj.archetype_node_id !== slot.nodeId) return false;
  return true;
}

export function templateInstanceCoverage(
  instance: unknown,
  template: openehr_am.OPERATIONAL_TEMPLATE | openehr_am.ARCHETYPE,
  mode: GenerationMode,
  options?: { maxGeneratedItems?: number },
): CoverageResult {
  const expected = expectedTemplateSlots(template, mode, options);
  const missing = expected.filter((slot) => !slotSatisfied(instance, slot));
  return { expected, missing };
}

export function assertTemplateInstanceCoverage(
  instance: unknown,
  template: openehr_am.OPERATIONAL_TEMPLATE | openehr_am.ARCHETYPE,
  mode: GenerationMode,
  options?: { maxGeneratedItems?: number },
): void {
  const { missing, expected } = templateInstanceCoverage(
    instance,
    template,
    mode,
    options,
  );
  if (!missing.length) return;
  const lines = missing.slice(0, 12).map((slot) =>
    `${slot.required ? "*" : " "}${slot.path || "/"} [${
      slot.nodeId ?? slot.rmType
    }]`
  );
  throw new Error(
    `Generated instance missing ${missing.length}/${expected.length} expected template slots in ${mode} mode:\n` +
      lines.join("\n"),
  );
}
