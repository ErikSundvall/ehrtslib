/**
 * Public RM attribute introspection API (BMM-backed).
 *
 * Complements `TypeRegistry` (construct/deserialize) with schema metadata for
 * editors, validators, and codegen. Distinct from AM/OPT constraint walking
 * under `enhanced/am/` — this describes the Reference Model itself, not
 * archetype or template constraints.
 *
 * Data: `rm_attribute_meta.generated.ts` (regenerate via
 * `deno run --allow-read --allow-net --allow-write tasks/generate_rm_meta.ts`).
 */

import {
  RM_CLASSES,
  RM_META_BMM_VERSION,
  RM_META_GENERATED_AT,
  RM_META_RM_RELEASE,
  RM_META_SCHEMA_NAME,
  RM_META_SOURCES,
  RM_OWN_ATTRIBUTES,
  type RmAttributeMetaRow,
} from "./rm_attribute_meta.generated.ts";

export {
  RM_META_BMM_VERSION,
  RM_META_GENERATED_AT,
  RM_META_RM_RELEASE,
  RM_META_SCHEMA_NAME,
  RM_META_SOURCES,
};

export interface RmMultiplicity {
  min: number;
  /** `null` = unbounded */
  max: number | null;
}

export interface RmAttributeMeta {
  name: string;
  /** OpenEHR type name, e.g. `"DV_QUANTITY"`, `"List<LINK>"`, `"PARTY_PROXY"` */
  typeName: string;
  multiplicity: RmMultiplicity;
  /** True when BMM marks the property mandatory (`is_mandatory` / lower bound ≥ 1) */
  mandatory: boolean;
  /** Declaring type in the inheritance chain, e.g. `"LOCATABLE"` */
  declaredIn: string;
  documentation?: string;
  /** True when the attribute type is abstract / polymorphic */
  polymorphic?: boolean;
}

function toMeta(row: RmAttributeMetaRow, declaredIn: string): RmAttributeMeta {
  const meta: RmAttributeMeta = {
    name: row.name,
    typeName: row.typeName,
    multiplicity: { min: row.min, max: row.max },
    mandatory: row.mandatory,
    declaredIn,
    polymorphic: row.polymorphic,
  };
  if (row.documentation) {
    meta.documentation = row.documentation;
  }
  return meta;
}

/**
 * Ancestor chain including `rmType`, most-specific first, root last.
 * Unknown types return `[rmType]` only.
 */
export function ancestorsOf(rmType: string): string[] {
  const chain: string[] = [];
  const seen = new Set<string>();
  const visit = (name: string) => {
    if (seen.has(name)) return;
    seen.add(name);
    chain.push(name);
    const row = RM_CLASSES[name];
    if (!row) return;
    for (const a of row.ancestors) {
      visit(a);
    }
  };
  visit(rmType);
  return chain;
}

/** Only attributes declared directly on `rmType` (no inheritance). */
export function ownAttributesFor(rmType: string): RmAttributeMeta[] {
  const rows = RM_OWN_ATTRIBUTES[rmType];
  if (!rows) return [];
  return rows.map((r) => toMeta(r, rmType));
}

/**
 * Own + inherited attributes for `rmType`.
 * Order: declaring type from root → leaf, then attribute name within each type.
 */
export function attributesFor(rmType: string): RmAttributeMeta[] {
  if (!RM_CLASSES[rmType] && !RM_OWN_ATTRIBUTES[rmType]) {
    return [];
  }
  const chain = ancestorsOf(rmType);
  // root → leaf for stable ancestry grouping
  const rootToLeaf = [...chain].reverse();
  const result: RmAttributeMeta[] = [];
  const seenNames = new Set<string>();

  for (const declaring of rootToLeaf) {
    const rows = RM_OWN_ATTRIBUTES[declaring];
    if (!rows) continue;
    for (const row of rows) {
      // Child redefinitions (rare in BMM) win: skip if already collected from
      // a more specific type — we iterate root→leaf so later overwrites.
      if (seenNames.has(row.name)) {
        // replace previous with more specific declaration
        const idx = result.findIndex((a) => a.name === row.name);
        if (idx >= 0) {
          result[idx] = toMeta(row, declaring);
        }
        continue;
      }
      seenNames.add(row.name);
      result.push(toMeta(row, declaring));
    }
  }
  return result;
}

export function isSubtypeOf(rmType: string, ancestor: string): boolean {
  if (rmType === ancestor) return true;
  return ancestorsOf(rmType).includes(ancestor);
}

export function isDataValueType(rmType: string): boolean {
  return isSubtypeOf(rmType, "DATA_VALUE");
}

export interface SubtypesOptions {
  /** When true (default), exclude abstract types. */
  concreteOnly?: boolean;
}

/**
 * Subtypes of `rmType` (not including `rmType` itself).
 * Default: concrete (non-abstract) only.
 */
export function subtypesOf(
  rmType: string,
  opts?: SubtypesOptions,
): string[] {
  const concreteOnly = opts?.concreteOnly !== false;
  const out: string[] = [];
  for (const name of Object.keys(RM_CLASSES)) {
    if (name === rmType) continue;
    if (!isSubtypeOf(name, rmType)) continue;
    if (concreteOnly && RM_CLASSES[name]?.isAbstract) continue;
    out.push(name);
  }
  out.sort((a, b) => a.localeCompare(b));
  return out;
}

/** Whether the type is known in the generated BMM meta tables. */
export function hasRmType(rmType: string): boolean {
  return rmType in RM_CLASSES;
}

/** True when BMM marks the type abstract. */
export function isAbstractType(rmType: string): boolean {
  return RM_CLASSES[rmType]?.isAbstract === true;
}
