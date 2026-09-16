// openEHR LANG model — classic (non-BMM3) BMM 2 type-lattice classes
// from official openehr_lang_1.1.0. These names coexist with the BMM3
// entity types in ./entity.ts; they are not merged (ITS-BMM AGENTS.md).

import { BMM_MODEL_ELEMENT } from "./element.ts";
import type { BMM_CLASS } from "./entity.ts";
import * as openehr_base from "../../../base/mod.ts";

function str(value: string): openehr_base.String {
  return openehr_base.String.from(value);
}

/**
 * Formal string form of a type as per UML (classic BMM 2 classifier).
 */
export abstract class BMM_CLASSIFIER extends BMM_MODEL_ELEMENT {
  type_name(): openehr_base.String {
    return str(this.name ?? "");
  }

  type_category(): openehr_base.String {
    return str("simple");
  }

  type_signature(): openehr_base.String {
    return this.type_name();
  }

  base_class(): BMM_CLASS | undefined {
    return undefined;
  }

  flattened_type_list(): string[] {
    return [this.type_name().value ?? ""];
  }
}

/**
 * Classic BMM 2 type-lattice node that is not itself a class definition.
 */
export abstract class BMM_TYPE_ELEMENT extends BMM_CLASSIFIER {}

/**
 * Open type reference to a single type parameter, typically `T`, `V`, `K`.
 */
export class BMM_OPEN_TYPE extends BMM_TYPE_ELEMENT {
  generic_constraint?: BMM_GENERIC_PARAMETER;

  override type_name(): openehr_base.String {
    return this.generic_constraint?.type_name() ?? str("T");
  }

  conformance_type_name(): openehr_base.String {
    return this.generic_constraint?.flattened_conforms_to_type() ?? str("Any");
  }
}

/**
 * Classic BMM 2 generic parameter definition (BMM3 equivalent: `BMM_PARAMETER_TYPE`).
 */
export class BMM_GENERIC_PARAMETER extends BMM_TYPE_ELEMENT {
  conforms_to_type?: BMM_CLASS;
  inheritance_precursor?: BMM_GENERIC_PARAMETER;

  flattened_conforms_to_type(): openehr_base.String {
    if (this.inheritance_precursor) {
      return this.inheritance_precursor.flattened_conforms_to_type();
    }
    return str(this.conforms_to_type?.name ?? "Any");
  }

  effective_conforms_to_type(): BMM_CLASS | undefined {
    return this.conforms_to_type ??
      this.inheritance_precursor?.effective_conforms_to_type();
  }

  override type_signature(): openehr_base.String {
    const n = this.name ?? "";
    const constraint = this.flattened_conforms_to_type().value;
    return str(constraint && constraint !== "Any" ? `${n}:${constraint}` : n);
  }
}
