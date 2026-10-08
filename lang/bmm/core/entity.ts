// openEHR LANG model — BMM3 entity / type meta-classes
// (org.openehr.lang.bmm3.core.entity and .range_constrained in official ITS-BMM).
// Hand-written from openehr_lang_1.1.0-bmm3.bmm.json; kept under lang/bmm/core
// so existing package paths stay stable.

import { BMM_MODEL_ELEMENT } from "./element.ts";
import type { BMM_FORMAL_ELEMENT } from "../core.ts";
import type {
  BMM_FEATURE_GROUP,
  BMM_FUNCTION,
  BMM_PROCEDURE,
  BMM_PROPERTY,
  BMM_STATIC,
} from "./feature.ts";
import type { BMM_PRIMITIVE_VALUE, BMM_INTEGER_VALUE, BMM_STRING_VALUE } from "./literal_value.ts";
import type { BMM_MODEL, BMM_PACKAGE } from "./model.ts";
import * as openehr_base from "../../../base/mod.ts";

function className(cls?: BMM_CLASS): string {
  return cls?.name ?? "";
}

function str(value: string): openehr_base.String {
  return openehr_base.String.from(value);
}

function bool(value: boolean): openehr_base.Boolean {
  return openehr_base.Boolean.from(value);
}

/**
 * Meta-type of any type referenced in a BMM model (BMM3).
 * Root of the type lattice; types are derived, not declared model elements.
 */
export abstract class BMM_TYPE {
  abstract type_name(): openehr_base.String;

  type_signature(): openehr_base.String {
    return this.type_name();
  }

  abstract is_abstract(): openehr_base.Boolean;

  abstract is_primitive(): openehr_base.Boolean;

  unitary_type(): BMM_TYPE {
    return this;
  }

  effective_type(): BMM_TYPE {
    return this;
  }

  flattened_type_list(): string[] {
    return [this.type_name().value ?? ""];
  }
}

/** Types that are not containers (simple, generic, open, builtin). */
export abstract class BMM_UNITARY_TYPE extends BMM_TYPE {
  override unitary_type(): BMM_UNITARY_TYPE {
    return this;
  }
}

/** Types that have an effective (non-parameter) form. */
export abstract class BMM_EFFECTIVE_TYPE extends BMM_UNITARY_TYPE {
  override effective_type(): BMM_EFFECTIVE_TYPE {
    return this;
  }

  abstract type_base_name(): openehr_base.String;
}

/** Built-in meta-types (signatures, tuples, status). */
export abstract class BMM_BUILTIN_TYPE extends BMM_EFFECTIVE_TYPE {
  override is_abstract(): openehr_base.Boolean {
    return bool(false);
  }

  override is_primitive(): openehr_base.Boolean {
    return bool(true);
  }

  override type_base_name(): openehr_base.String {
    return this.type_name();
  }
}

/** Formal signature of a property or routine. */
export class BMM_SIGNATURE extends BMM_BUILTIN_TYPE {
  result_type?: BMM_TYPE;

  override type_name(): openehr_base.String {
    return this.result_type?.type_name() ?? str("Signature");
  }

  override flattened_type_list(): string[] {
    return this.result_type?.flattened_type_list() ?? [this.type_name().value ?? ""];
  }
}

export class BMM_PROPERTY_TYPE extends BMM_SIGNATURE {}

export class BMM_TUPLE_TYPE extends BMM_BUILTIN_TYPE {
  item_types?: Map<string, BMM_TYPE>;

  override type_name(): openehr_base.String {
    const parts = [...(this.item_types?.values() ?? [])].map((t) =>
      t.type_name().value ?? ""
    );
    return str(`Tuple<${parts.join(",")}>`);
  }

  override flattened_type_list(): string[] {
    const out: string[] = [];
    for (const t of this.item_types?.values() ?? []) {
      out.push(...t.flattened_type_list());
    }
    return out.length ? out : [this.type_name().value ?? ""];
  }
}

export class BMM_ROUTINE_TYPE extends BMM_SIGNATURE {
  argument_types?: BMM_TUPLE_TYPE | BMM_TYPE[];
}

export class BMM_FUNCTION_TYPE extends BMM_ROUTINE_TYPE {}

export class BMM_STATUS_TYPE extends BMM_BUILTIN_TYPE {
  override type_name(): openehr_base.String {
    return str("Status");
  }
}

export class BMM_PROCEDURE_TYPE extends BMM_ROUTINE_TYPE {
  override result_type?: BMM_STATUS_TYPE = undefined;
}

/** Reference to a value set in an external resource. */
export class BMM_VALUE_SET_SPEC {
  resource_id?: string | openehr_base.String;
  value_set_id?: string | openehr_base.String;
}

/** Effective type based on a model class. */
export abstract class BMM_MODEL_TYPE extends BMM_EFFECTIVE_TYPE {
  value_constraint?: BMM_VALUE_SET_SPEC;
  base_class?: BMM_CLASS;

  override type_base_name(): openehr_base.String {
    return str(className(this.base_class));
  }

  override is_primitive(): openehr_base.Boolean {
    return bool(this.base_class?.is_primitive === true);
  }
}

export class BMM_SIMPLE_TYPE extends BMM_MODEL_TYPE {
  declare base_class?: BMM_SIMPLE_CLASS;

  override type_name(): openehr_base.String {
    return str(className(this.base_class));
  }

  override is_abstract(): openehr_base.Boolean {
    return bool(this.base_class?.is_abstract === true);
  }

  override flattened_type_list(): string[] {
    return [this.type_name().value ?? ""];
  }

  effective_base_class(): BMM_SIMPLE_CLASS | undefined {
    return this.base_class;
  }

  /** Factory used by expression/model helpers that previously forged a stub object. */
  static named(className: string): BMM_SIMPLE_TYPE {
    const cls = new BMM_SIMPLE_CLASS();
    cls.name = className;
    cls.is_primitive = true;
    const t = new BMM_SIMPLE_TYPE();
    t.base_class = cls;
    return t;
  }
}

export class BMM_GENERIC_TYPE extends BMM_MODEL_TYPE {
  generic_parameters?: BMM_UNITARY_TYPE[];
  declare base_class?: BMM_GENERIC_CLASS;

  override type_name(): openehr_base.String {
    const base = className(this.base_class);
    const params = (this.generic_parameters ?? []).map((p) =>
      p.type_name().value ?? ""
    );
    return str(params.length ? `${base}<${params.join(",")}>` : base);
  }

  type_signature(): openehr_base.String {
    return this.type_name();
  }

  override is_abstract(): openehr_base.Boolean {
    return bool(this.base_class?.is_abstract === true);
  }

  override flattened_type_list(): string[] {
    const out = [className(this.base_class)];
    for (const p of this.generic_parameters ?? []) {
      out.push(...p.flattened_type_list());
    }
    return out;
  }

  is_partially_closed(): openehr_base.Boolean {
    return bool((this.generic_parameters ?? []).some((p) => p instanceof BMM_PARAMETER_TYPE));
  }

  effective_base_class(): BMM_GENERIC_CLASS | undefined {
    return this.base_class;
  }

  is_open(): openehr_base.Boolean {
    return this.is_partially_closed();
  }
}

export class BMM_PARAMETER_TYPE extends BMM_UNITARY_TYPE {
  name?: string | openehr_base.String;
  type_constraint?: BMM_EFFECTIVE_TYPE;
  /** Persistence-form alias used by P_BMM_GENERIC_PARAMETER. */
  conforms_to_type?: string | openehr_base.String;
  inheritance_precursor?: BMM_PARAMETER_TYPE;

  override type_name(): openehr_base.String {
    const n = typeof this.name === "string" ? this.name : this.name?.value ?? "";
    return str(n);
  }

  override type_signature(): openehr_base.String {
    const constraint = this.type_constraint?.type_name().value;
    const n = this.type_name().value ?? "";
    return str(constraint ? `${n}:${constraint}` : n);
  }

  override is_primitive(): openehr_base.Boolean {
    return this.type_constraint?.is_primitive() ?? bool(false);
  }

  override is_abstract(): openehr_base.Boolean {
    return this.type_constraint?.is_abstract() ?? bool(false);
  }

  override flattened_type_list(): string[] {
    return this.type_constraint?.flattened_type_list() ?? [this.type_name().value ?? ""];
  }

  override effective_type(): BMM_EFFECTIVE_TYPE {
    return this.type_constraint ?? this as unknown as BMM_EFFECTIVE_TYPE;
  }

  flattened_conforms_to_type(): openehr_base.String {
    return this.type_constraint?.type_name() ?? this.type_name();
  }
}

export class BMM_CONTAINER_TYPE extends BMM_TYPE {
  container_class?: BMM_GENERIC_CLASS;
  item_type?: BMM_UNITARY_TYPE;
  is_ordered?: boolean;
  is_unique?: boolean;

  override type_name(): openehr_base.String {
    const c = className(this.container_class) || "List";
    const i = this.item_type?.type_name().value ?? "";
    return str(`${c}<${i}>`);
  }

  override is_abstract(): openehr_base.Boolean {
    return bool(this.container_class?.is_abstract === true);
  }

  override flattened_type_list(): string[] {
    const out = [className(this.container_class) || "List"];
    if (this.item_type) out.push(...this.item_type.flattened_type_list());
    return out;
  }

  override unitary_type(): BMM_UNITARY_TYPE {
    return this.item_type ?? this as unknown as BMM_UNITARY_TYPE;
  }

  override is_primitive(): openehr_base.Boolean {
    return bool(false);
  }

  override effective_type(): BMM_TYPE {
    return this.item_type?.effective_type() ?? this;
  }
}

export class BMM_INDEXED_CONTAINER_TYPE extends BMM_CONTAINER_TYPE {
  index_type?: BMM_SIMPLE_TYPE;

  override type_name(): openehr_base.String {
    const c = className(this.container_class) || "Hash";
    const k = this.index_type?.type_name().value ?? "";
    const v = this.item_type?.type_name().value ?? "";
    return str(`${c}<${k},${v}>`);
  }
}

/**
 * Enumeration of BMM3 entity meta-types.
 */
export class BMM_ENTITY_METATYPE extends openehr_base.String {
  static Entity_metatype_simple = "Entity_metatype_simple";
  static Entity_metatype_generic = "Entity_metatype_generic";
  static Entity_metatype_generic_parameter = "Entity_metatype_generic_parameter";
  static Entity_metatype_range_constrained = "Entity_metatype_range_constrained";
  static Entity_metatype_enumeration = "Entity_metatype_enumeration";
  static Entity_metatype_container = "Entity_metatype_container";
}

/** A named module (class or similar) in a BMM model. */
export abstract class BMM_MODULE extends BMM_MODEL_ELEMENT {
  declare scope?: BMM_MODEL;
  feature_groups?: BMM_FEATURE_GROUP[];
  features?: BMM_FORMAL_ELEMENT[];
}

/**
 * Definitional class entry in a BMM3 model.
 */
export abstract class BMM_CLASS extends BMM_MODULE {
  ancestors?: Map<string, BMM_MODEL_TYPE>;
  package?: BMM_PACKAGE;
  properties?: Map<string, BMM_PROPERTY>;
  source_schema_id?: string | openehr_base.String;
  immediate_descendants?: BMM_CLASS[];
  is_override?: boolean | openehr_base.Boolean;
  static_properties?: Map<string, BMM_STATIC>;
  functions?: Map<string, BMM_FUNCTION>;
  procedures?: Map<string, BMM_PROCEDURE>;
  is_primitive?: boolean;
  is_abstract?: boolean;
  invariants?: unknown[];
  creators?: Map<string, BMM_PROCEDURE>;
  converters?: Map<string, BMM_PROCEDURE>;

  type(): BMM_MODEL_TYPE {
    const t = new BMM_SIMPLE_TYPE();
    t.base_class = this as unknown as BMM_SIMPLE_CLASS;
    return t;
  }

  all_ancestors(): string[] {
    const names = [...(this.ancestors?.keys() ?? [])];
    return names;
  }

  all_descendants(): string[] {
    return (this.immediate_descendants ?? [])
      .map((c) => c.name)
      .filter((n): n is string => typeof n === "string");
  }

  suppliers(): string[] {
    return [];
  }

  suppliers_non_primitive(): string[] {
    return this.suppliers();
  }

  supplier_closure(): string[] {
    return this.suppliers();
  }

  package_path(): openehr_base.String {
    return str(this.package?.name ?? "");
  }

  class_path(): openehr_base.String {
    const pkg = this.package_path().value ?? "";
    const n = this.name ?? "";
    return str(pkg ? `${pkg}.${n}` : n);
  }

  flat_features(): BMM_FORMAL_ELEMENT[] {
    return this.features ?? [];
  }

  flat_properties(): BMM_PROPERTY[] {
    return [...(this.properties?.values() ?? [])];
  }
}

export class BMM_SIMPLE_CLASS extends BMM_CLASS {
  override type(): BMM_SIMPLE_TYPE {
    const t = new BMM_SIMPLE_TYPE();
    t.base_class = this;
    return t;
  }
}

export class BMM_GENERIC_CLASS extends BMM_CLASS {
  generic_parameters?: Map<string, BMM_PARAMETER_TYPE>;

  override type(): BMM_GENERIC_TYPE {
    const t = new BMM_GENERIC_TYPE();
    t.base_class = this;
    t.generic_parameters = [...(this.generic_parameters?.values() ?? [])];
    return t;
  }

  override suppliers(): string[] {
    return [...(this.generic_parameters?.keys() ?? [])];
  }

  generic_parameter_conformance_type(
    name: string | openehr_base.String,
  ): openehr_base.String {
    const key = typeof name === "string" ? name : name.value ?? "";
    return this.generic_parameters?.get(key)?.flattened_conforms_to_type() ??
      str("Any");
  }
}

export class BMM_ENUMERATION extends BMM_SIMPLE_CLASS {
  item_names?: string[];
  item_values?: BMM_PRIMITIVE_VALUE[];

  name_map(): Map<string, BMM_PRIMITIVE_VALUE> {
    const map = new Map<string, BMM_PRIMITIVE_VALUE>();
    const names = this.item_names ?? [];
    const values = this.item_values ?? [];
    for (let i = 0; i < names.length; i++) {
      if (values[i]) map.set(names[i], values[i]);
    }
    return map;
  }
}

export class BMM_ENUMERATION_INTEGER extends BMM_ENUMERATION {
  declare item_values?: BMM_INTEGER_VALUE[];
}

export class BMM_ENUMERATION_STRING extends BMM_ENUMERATION {
  declare item_values?: BMM_STRING_VALUE[];
}
