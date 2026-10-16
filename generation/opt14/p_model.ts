/**
 * Plain constraint-tree model used by the ADL2 template → ADL 1.4 OPT/OET
 * exporters (#123). Converting the AOM once into plain objects keeps the
 * ADL2 flattening and 1.4 serialisation logic small and side-effect free.
 */

import * as openehr_am from "../../am/openehr_am.ts";

export interface PInterval {
  lower?: number;
  /** undefined = unbounded */
  upper?: number;
}

export interface PCardinality {
  interval: PInterval;
  ordered: boolean;
  unique: boolean;
}

export type PPrimitive =
  | { type: "string"; list?: string[]; pattern?: string }
  | { type: "boolean"; trueValid: boolean; falseValid: boolean }
  | { type: "interval"; expr: string };

export interface PObject {
  kind: "complex" | "root" | "slot" | "term" | "prim";
  rmType: string;
  nodeId?: string;
  occ?: PInterval;
  attrs?: PAttribute[];
  /** root: referenced archetype / overlay id (ADL2 `use_archetype`). */
  archetypeRef?: string;
  /** slot include / exclude archetype id regexes. */
  includes?: string[];
  excludes?: string[];
  /** term: ac/at code or `[terminology::code]` text. */
  termConstraint?: string;
  prim?: PPrimitive;
}

export interface PAttribute {
  /** RM attribute name, or a differential path (`/data[id2]/items`). */
  name: string;
  multiple: boolean;
  existence?: PInterval;
  cardinality?: PCardinality;
  children: PObject[];
}

function str(v: unknown): string | undefined {
  if (v === undefined || v === null) return undefined;
  if (typeof v === "string") return v;
  if (typeof v === "object" && "value" in (v as Record<string, unknown>)) {
    return str((v as { value: unknown }).value);
  }
  return String(v);
}

function interval(m: unknown): PInterval | undefined {
  if (!m || typeof m !== "object") return undefined;
  const o = m as { lower?: number; upper?: number; upper_unbounded?: boolean };
  return {
    lower: o.lower ?? 0,
    upper: o.upper_unbounded ? undefined : o.upper,
  };
}

function primitiveFromAom(
  obj: openehr_am.C_PRIMITIVE_OBJECT,
): PPrimitive | undefined {
  const item = (obj as { item?: unknown }).item;
  const rm = obj.rm_type_name ?? "";
  if (item instanceof openehr_am.C_BOOLEAN) {
    return {
      type: "boolean",
      trueValid: !!item.true_valid,
      falseValid: !!item.false_valid,
    };
  }
  if (item instanceof openehr_am.C_STRING) {
    const pattern = str((item as { pattern?: unknown }).pattern) ?? "";
    if (rm === "Integer" || rm === "Real") {
      return { type: "interval", expr: pattern };
    }
    if (rm === "STRING") return { type: "string", pattern };
    // Quoted string constraint(s); the cADL parser joins values with `|`.
    return { type: "string", list: pattern.split("|") };
  }
  return undefined;
}

/** Convert an AOM constraint object into the plain model. */
export function pFromAom(obj: openehr_am.C_OBJECT): PObject {
  const base = {
    rmType: obj.rm_type_name ?? "",
    nodeId: obj.node_id || undefined,
    occ: interval((obj as { occurrences?: unknown }).occurrences),
  };
  if (obj instanceof openehr_am.ARCHETYPE_SLOT) {
    const pats = (list: unknown) =>
      ((list as Array<{ constraint?: { pattern?: string } }>) ?? [])
        .map((x) => x?.constraint?.pattern)
        .filter((p): p is string => !!p);
    return {
      ...base,
      kind: "slot",
      includes: pats((obj as { includes?: unknown }).includes),
      excludes: pats((obj as { excludes?: unknown }).excludes),
    };
  }
  if (obj instanceof openehr_am.C_TERMINOLOGY_CODE) {
    return {
      ...base,
      kind: "term",
      termConstraint: str((obj as { constraint?: unknown }).constraint) ?? "",
    };
  }
  if (obj instanceof openehr_am.C_PRIMITIVE_OBJECT) {
    return { ...base, nodeId: undefined, kind: "prim", prim: primitiveFromAom(obj) };
  }
  const attrs = ((obj as { attributes?: openehr_am.C_ATTRIBUTE[] }).attributes ??
    []).map(pAttrFromAom);
  if (obj instanceof openehr_am.C_ARCHETYPE_ROOT) {
    return {
      ...base,
      kind: "root",
      archetypeRef: obj.archetype_ref,
      attrs: attrs.length ? attrs : undefined,
    };
  }
  return { ...base, kind: "complex", attrs: attrs.length ? attrs : undefined };
}

function pAttrFromAom(attr: openehr_am.C_ATTRIBUTE): PAttribute {
  const multiple = attr instanceof openehr_am.C_MULTIPLE_ATTRIBUTE;
  const card = multiple
    ? (attr as { cardinality?: Record<string, unknown> }).cardinality
    : undefined;
  return {
    name: attr.rm_attribute_name ?? "",
    multiple,
    existence: interval((attr as { existence?: unknown }).existence),
    cardinality: card
      ? {
        interval: interval(card.interval) ?? { lower: 0 },
        ordered: !!card.is_ordered,
        unique: !!card.is_unique,
      }
      : undefined,
    children: ((attr as { children?: openehr_am.C_OBJECT[] }).children ?? [])
      .map(pFromAom),
  };
}

export function pClone<T>(v: T): T {
  return structuredClone(v);
}

/** Depth-first walk over objects. */
export function pWalk(
  obj: PObject,
  fn: (o: PObject, parents: PObject[]) => void,
  parents: PObject[] = [],
): void {
  fn(obj, parents);
  for (const a of obj.attrs ?? []) {
    for (const c of a.children) pWalk(c, fn, [...parents, obj]);
  }
}
