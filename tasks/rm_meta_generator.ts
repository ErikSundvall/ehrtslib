/**
 * Generate RM/BASE attribute metadata tables from BMM models.
 * Used by tasks/generate_rm_meta.ts — keep in sync with BmmProperty semantics.
 */
import type {
  BmmClass,
  BmmModel,
  BmmProperty,
  BmmTypeReference,
} from "./bmm_parser.ts";

/** Compact class row stored in the generated table. */
export interface RmClassMetaRow {
  isAbstract: boolean;
  /** Direct ancestor type names (BMM `ancestors`). */
  ancestors: string[];
}

/** Compact attribute row; `declaredIn` is filled when emitting inheritance-aware views. */
export interface RmAttributeMetaRow {
  name: string;
  typeName: string;
  min: number;
  /** `null` = unbounded */
  max: number | null;
  mandatory: boolean;
  documentation?: string;
  polymorphic: boolean;
}

export interface RmMetaTables {
  schemaName: string;
  rmRelease: string;
  bmmVersion: string;
  sources: string[];
  generatedAt: string;
  classes: Record<string, RmClassMetaRow>;
  /** Own attributes only, keyed by declaring type name. */
  ownAttributes: Record<string, RmAttributeMetaRow[]>;
}

/** Format a BMM type reference as an openEHR-style type name string. */
export function formatTypeRef(
  // deno-lint-ignore no-explicit-any
  ref: BmmTypeReference | string | any,
): string {
  if (typeof ref === "string") return ref;
  if (!ref || typeof ref !== "object") return "Any";

  if (ref.container_type) {
    const inner = ref.type_def
      ? formatTypeRef(ref.type_def)
      : (ref.type || "Any");
    return `${ref.container_type}<${inner}>`;
  }

  if (ref.root_type) {
    const params = (ref.generic_parameters || []).map(
      // deno-lint-ignore no-explicit-any
      (p: any) => formatTypeRef(p),
    );
    return params.length > 0
      ? `${ref.root_type}<${params.join(", ")}>`
      : ref.root_type;
  }

  return ref.type || "Any";
}

/** Normalize attribute type name from a BMM property. */
export function formatPropertyTypeName(prop: BmmProperty): string {
  if (prop.type_def) {
    return formatTypeRef(prop.type_def);
  }
  return prop.type || "Any";
}

/**
 * Extract the "root" type used for polymorphism checks.
 * `List<LINK>` → `LINK`; `DV_INTERVAL<DV_QUANTITY>` → `DV_INTERVAL`.
 */
export function rootTypeName(typeName: string): string {
  const angle = typeName.indexOf("<");
  if (angle === -1) return typeName;
  const before = typeName.slice(0, angle);
  // Containers: List/Set/Array/Hash — use the first generic argument's root
  if (
    before === "List" || before === "Set" || before === "Array" ||
    before === "Hash"
  ) {
    const inner = typeName.slice(angle + 1, typeName.lastIndexOf(">"));
    // Hash may be Hash<K, V> — take first param
    const first = inner.split(",")[0]?.trim() ?? inner;
    return rootTypeName(first);
  }
  return before;
}

export function multiplicityFromProperty(
  prop: BmmProperty,
): { min: number; max: number | null } {
  if (prop.cardinality) {
    const min = prop.cardinality.lower ?? 0;
    const max = prop.cardinality.upper_unbounded
      ? null
      : (prop.cardinality.upper ?? min);
    return { min, max };
  }
  const mandatory = prop.is_mandatory === true;
  return { min: mandatory ? 1 : 0, max: 1 };
}

export function isPropertyMandatory(prop: BmmProperty): boolean {
  if (prop.is_mandatory === true) return true;
  const { min } = multiplicityFromProperty(prop);
  return min >= 1;
}

function collectClasses(model: BmmModel): Record<string, BmmClass> {
  const out: Record<string, BmmClass> = {};
  if (model.primitive_types) {
    for (const [k, c] of Object.entries(model.primitive_types)) {
      out[c.name || k] = c;
    }
  }
  if (model.class_definitions) {
    for (const [k, c] of Object.entries(model.class_definitions)) {
      out[c.name || k] = c;
    }
  }
  return out;
}

function propertyToRow(
  prop: BmmProperty,
  classes: Record<string, RmClassMetaRow>,
): RmAttributeMetaRow {
  const typeName = formatPropertyTypeName(prop);
  const { min, max } = multiplicityFromProperty(prop);
  const mandatory = isPropertyMandatory(prop);
  const root = rootTypeName(typeName);
  const polymorphic = classes[root]?.isAbstract === true;
  const row: RmAttributeMetaRow = {
    name: prop.name,
    typeName,
    min,
    max,
    mandatory,
    polymorphic,
  };
  if (prop.documentation) {
    row.documentation = prop.documentation;
  }
  return row;
}

/**
 * Build meta tables from one or more BMM models (typically BASE then RM).
 * Later models overwrite same-named classes (RM wins over BASE if duplicated).
 */
export function buildRmMetaTables(
  models: Array<{ model: BmmModel; source: string }>,
  generatedAt: string = new Date().toISOString(),
): RmMetaTables {
  const allBmmClasses: Record<string, BmmClass> = {};
  const sources: string[] = [];
  let schemaName = "";
  let rmRelease = "";
  let bmmVersion = "";

  for (const { model, source } of models) {
    sources.push(source);
    // Prefer RM schema identity when present
    if (model.schema_name === "rm" || !schemaName) {
      schemaName = model.schema_name;
      rmRelease = model.rm_release;
      bmmVersion = model.bmm_version || bmmVersion;
    }
    Object.assign(allBmmClasses, collectClasses(model));
  }

  const classes: Record<string, RmClassMetaRow> = {};
  for (const [name, c] of Object.entries(allBmmClasses)) {
    classes[name] = {
      isAbstract: c.is_abstract === true,
      ancestors: [...(c.ancestors || [])],
    };
  }

  const ownAttributes: Record<string, RmAttributeMetaRow[]> = {};
  for (const [name, c] of Object.entries(allBmmClasses)) {
    if (!c.properties) continue;
    const rows = Object.values(c.properties)
      .map((p) => propertyToRow(p, classes))
      .sort((a, b) => a.name.localeCompare(b.name));
    if (rows.length > 0) {
      ownAttributes[name] = rows;
    }
  }

  return {
    schemaName: schemaName || "unknown",
    rmRelease: rmRelease || "unknown",
    bmmVersion: bmmVersion || "unknown",
    sources,
    generatedAt,
    classes,
    ownAttributes,
  };
}

/** Emit TypeScript source for the generated meta data module. */
export function emitRmMetaTypeScript(tables: RmMetaTables): string {
  const header =
    `// Generated RM/BASE attribute metadata from openEHR BMM
// Schema: ${tables.schemaName} v${tables.rmRelease}
// BMM Version: ${tables.bmmVersion}
// Sources:
${tables.sources.map((s) => `//   - ${s}`).join("\n")}
// Generated: ${tables.generatedAt}
//
// DO NOT EDIT THIS FILE DIRECTLY — regenerate with:
//   deno run --allow-read --allow-net --allow-write tasks/generate_rm_meta.ts
//

`;

  const body = `export interface RmClassMetaRow {
  isAbstract: boolean;
  ancestors: string[];
}

export interface RmAttributeMetaRow {
  name: string;
  typeName: string;
  min: number;
  max: number | null;
  mandatory: boolean;
  documentation?: string;
  polymorphic: boolean;
}

export const RM_META_SCHEMA_NAME = ${JSON.stringify(tables.schemaName)};
export const RM_META_RM_RELEASE = ${JSON.stringify(tables.rmRelease)};
export const RM_META_BMM_VERSION = ${JSON.stringify(tables.bmmVersion)};
export const RM_META_SOURCES: readonly string[] = ${
    JSON.stringify(tables.sources, null, 2)
  };
export const RM_META_GENERATED_AT = ${JSON.stringify(tables.generatedAt)};

export const RM_CLASSES: Readonly<Record<string, RmClassMetaRow>> = ${
    JSON.stringify(tables.classes, null, 2)
  };

export const RM_OWN_ATTRIBUTES: Readonly<
  Record<string, readonly RmAttributeMetaRow[]>
> = ${JSON.stringify(tables.ownAttributes, null, 2)};
`;

  return header + body;
}
