// Type definitions for openEHR AM 2.3.0
// Project: https://specifications.openehr.org/releases/AM/Release-2.3.0
// Definitions by: Jules <https://www.jules.ai>

import {
  Any,
  AUTHORED_RESOURCE,
  Boolean,
  Cardinality,
  Date,
  Date_time,
  Duration,
  Integer,
  Interval,
  Multiplicity_interval,
  Ordered,
  Real,
  String,
  Terminology_code,
  Time,
  Uri,
  UUID,
  VERSION_STATUS,
} from "./base";
import { STATEMENT } from "./term";

//
// definitions
//

export class ADL_CODE_DEFINITIONS extends Any {
}

//
// archetype
//

export class ARCHETYPE_HRID extends Any {
  namespace?: String;
  rm_publisher: String;
  rm_package: String;
  rm_class: String;
  concept_id: String;
  release_version: String;
  version_status: VERSION_STATUS;
  build_count: String;
  constructor(
    rm_publisher: String,
    rm_package: String,
    rm_class: String,
    concept_id: String,
    release_version: String,
    version_status: VERSION_STATUS,
    build_count: String,
    namespace?: String,
  ) {
    super();
    this.namespace = namespace;
    this.rm_publisher = rm_publisher;
    this.rm_package = rm_package;
    this.rm_class = rm_class;
    this.concept_id = concept_id;
    this.release_version = release_version;
    this.version_status = version_status;
    this.build_count = build_count;
  }
}

export class ARCHETYPE {
  parent_archetype_id?: String;
  archetype_id: ARCHETYPE_HRID;
  rules?: STATEMENT;
  is_differential: Boolean;
  terminology: ARCHETYPE_TERMINOLOGY;
  definition: C_COMPLEX_OBJECT;
  constructor(
    archetype_id: ARCHETYPE_HRID,
    is_differential: Boolean,
    terminology: ARCHETYPE_TERMINOLOGY,
    definition: C_COMPLEX_OBJECT,
    parent_archetype_id?: String,
    rules?: STATEMENT,
  ) {
    this.parent_archetype_id = parent_archetype_id;
    this.archetype_id = archetype_id;
    this.rules = rules;
    this.is_differential = is_differential;
    this.terminology = terminology;
    this.definition = definition;
  }
}

export class AUTHORED_ARCHETYPE extends AUTHORED_RESOURCE {
  adl_version?: String;
  rm_release: String;
  is_generated: Boolean;
  build_uid: UUID;
  other_meta_data: Map<string, String>;
  constructor(
    rm_release: String,
    is_generated: Boolean,
    build_uid: UUID,
    other_meta_data: Map<string, String>,
    adl_version?: String,
  ) {
    super();
    this.adl_version = adl_version;
    this.rm_release = rm_release;
    this.is_generated = is_generated;
    this.build_uid = build_uid;
    this.other_meta_data = other_meta_data;
  }
}

export class OPERATIONAL_TEMPLATE extends AUTHORED_ARCHETYPE {
  component_terminologies?: Map<string, ARCHETYPE_TERMINOLOGY>;
  terminology_extracts?: Map<string, ARCHETYPE_TERMINOLOGY>;
  constructor(
    rm_release: String,
    is_generated: Boolean,
    build_uid: UUID,
    other_meta_data: Map<string, String>,
    adl_version?: String,
    component_terminologies?: Map<string, ARCHETYPE_TERMINOLOGY>,
    terminology_extracts?: Map<string, ARCHETYPE_TERMINOLOGY>,
  ) {
    super(rm_release, is_generated, build_uid, other_meta_data, adl_version);
    this.component_terminologies = component_terminologies;
    this.terminology_extracts = terminology_extracts;
  }
}

export class TEMPLATE extends AUTHORED_ARCHETYPE {
  template_overlays: TEMPLATE_OVERLAY[];
  constructor(
    rm_release: String,
    is_generated: Boolean,
    build_uid: UUID,
    other_meta_data: Map<string, String>,
    template_overlays: TEMPLATE_OVERLAY[],
    adl_version?: String,
  ) {
    super(rm_release, is_generated, build_uid, other_meta_data, adl_version);
    this.template_overlays = template_overlays;
  }
}

export class TEMPLATE_OVERLAY extends ARCHETYPE {
}

//
// terminology
//

export class ARCHETYPE_TERMINOLOGY extends Any {
  term_bindings?: Map<string, Map<string, Uri>>;
  original_language: String;
  value_sets?: Map<string, VALUE_SET>;
  concept_code: String;
  terminology_extracts?: Map<string, Map<string, ARCHETYPE_TERM>>;
  term_definitions: Map<string, Map<string, ARCHETYPE_TERM>>;
  is_differential: Boolean;
  constructor(
    original_language: String,
    concept_code: String,
    term_definitions: Map<string, Map<string, ARCHETYPE_TERM>>,
    is_differential: Boolean,
    term_bindings?: Map<string, Map<string, Uri>>,
    value_sets?: Map<string, VALUE_SET>,
    terminology_extracts?: Map<string, Map<string, ARCHETYPE_TERM>>,
  ) {
    super();
    this.term_bindings = term_bindings;
    this.original_language = original_language;
    this.value_sets = value_sets;
    this.concept_code = concept_code;
    this.terminology_extracts = terminology_extracts;
    this.term_definitions = term_definitions;
    this.is_differential = is_differential;
  }
}

export class TERMINOLOGY_RELATION extends Any {
  id: String;
  members: String[];
  constructor(id: String, members: String[]) {
    super();
    this.id = id;
    this.members = members;
  }
}

export class VALUE_SET extends TERMINOLOGY_RELATION {
}

export class ARCHETYPE_TERM extends Any {
  code: String;
  text: String;
  description: String;
  other_items?: Map<string, String>;
  constructor(
    code: String,
    text: String,
    description: String,
    other_items?: Map<string, String>,
  ) {
    super();
    this.code = code;
    this.text = text;
    this.description = description;
    this.other_items = other_items;
  }
}

//
// constraint_model
//

export abstract class ARCHETYPE_CONSTRAINT extends Any {
  parent?: ARCHETYPE_CONSTRAINT;
  soc_parent?: C_SECOND_ORDER;
  constructor(parent?: ARCHETYPE_CONSTRAINT, soc_parent?: C_SECOND_ORDER) {
    super();
    this.parent = parent;
    this.soc_parent = soc_parent;
  }
}

export class C_ATTRIBUTE extends ARCHETYPE_CONSTRAINT {
  rm_attribute_name: String;
  existence?: Multiplicity_interval;
  children?: C_OBJECT[];
  differential_path?: String;
  cardinality?: Cardinality;
  is_multiple: Boolean;
  constructor(
    rm_attribute_name: String,
    is_multiple: Boolean,
    existence?: Multiplicity_interval,
    children?: C_OBJECT[],
    differential_path?: String,
    cardinality?: Cardinality,
    parent?: ARCHETYPE_CONSTRAINT,
    soc_parent?: C_SECOND_ORDER,
  ) {
    super(parent, soc_parent);
    this.rm_attribute_name = rm_attribute_name;
    this.existence = existence;
    this.children = children;
    this.differential_path = differential_path;
    this.cardinality = cardinality;
    this.is_multiple = is_multiple;
  }
}

export abstract class C_OBJECT extends ARCHETYPE_CONSTRAINT {
  rm_type_name: String;
  occurrences?: Multiplicity_interval;
  node_id: String;
  is_deprecated?: Boolean;
  sibling_order?: SIBLING_ORDER;
  constructor(
    rm_type_name: String,
    node_id: String,
    occurrences?: Multiplicity_interval,
    is_deprecated?: Boolean,
    sibling_order?: SIBLING_ORDER,
    parent?: ARCHETYPE_CONSTRAINT,
    soc_parent?: C_SECOND_ORDER,
  ) {
    super(parent, soc_parent);
    this.rm_type_name = rm_type_name;
    this.occurrences = occurrences;
    this.node_id = node_id;
    this.is_deprecated = is_deprecated;
    this.sibling_order = sibling_order;
  }
}

export class SIBLING_ORDER extends Any {
  sibling_node_id: String;
  is_before: Boolean;
  constructor(sibling_node_id: String, is_before: Boolean) {
    super();
    this.sibling_node_id = sibling_node_id;
    this.is_before = is_before;
  }
}

export abstract class C_DEFINED_OBJECT extends C_OBJECT {
  default_value?: Any;
  constructor(
    rm_type_name: String,
    node_id: String,
    occurrences?: Multiplicity_interval,
    is_deprecated?: Boolean,
    sibling_order?: SIBLING_ORDER,
    parent?: ARCHETYPE_CONSTRAINT,
    soc_parent?: C_SECOND_ORDER,
    default_value?: Any,
  ) {
    super(
      rm_type_name,
      node_id,
      occurrences,
      is_deprecated,
      sibling_order,
      parent,
      soc_parent,
    );
    this.default_value = default_value;
  }
}

export class C_COMPLEX_OBJECT extends C_DEFINED_OBJECT {
  attributes?: C_ATTRIBUTE[];
  attribute_tuples?: C_ATTRIBUTE_TUPLE[];
  constructor(
    rm_type_name: String,
    node_id: String,
    occurrences?: Multiplicity_interval,
    is_deprecated?: Boolean,
    sibling_order?: SIBLING_ORDER,
    parent?: ARCHETYPE_CONSTRAINT,
    soc_parent?: C_SECOND_ORDER,
    default_value?: Any,
    attributes?: C_ATTRIBUTE[],
    attribute_tuples?: C_ATTRIBUTE_TUPLE[],
  ) {
    super(
      rm_type_name,
      node_id,
      occurrences,
      is_deprecated,
      sibling_order,
      parent,
      soc_parent,
      default_value,
    );
    this.attributes = attributes;
    this.attribute_tuples = attribute_tuples;
  }
}

export class C_ARCHETYPE_ROOT extends C_COMPLEX_OBJECT {
  archetype_ref: String;
  constructor(
    rm_type_name: String,
    node_id: String,
    archetype_ref: String,
    occurrences?: Multiplicity_interval,
    is_deprecated?: Boolean,
    sibling_order?: SIBLING_ORDER,
    parent?: ARCHETYPE_CONSTRAINT,
    soc_parent?: C_SECOND_ORDER,
    default_value?: Any,
    attributes?: C_ATTRIBUTE[],
    attribute_tuples?: C_ATTRIBUTE_TUPLE[],
  ) {
    super(
      rm_type_name,
      node_id,
      occurrences,
      is_deprecated,
      sibling_order,
      parent,
      soc_parent,
      default_value,
      attributes,
      attribute_tuples,
    );
    this.archetype_ref = archetype_ref;
  }
}

export class ARCHETYPE_SLOT extends C_OBJECT {
  excludes?: ASSERTION[];
  includes?: ASSERTION[];
  closed: Boolean;
  constructor(
    rm_type_name: String,
    node_id: String,
    closed: Boolean,
    occurrences?: Multiplicity_interval,
    is_deprecated?: Boolean,
    sibling_order?: SIBLING_ORDER,
    parent?: ARCHETYPE_CONSTRAINT,
    soc_parent?: C_SECOND_ORDER,
    excludes?: ASSERTION[],
    includes?: ASSERTION[],
  ) {
    super(
      rm_type_name,
      node_id,
      occurrences,
      is_deprecated,
      sibling_order,
      parent,
      soc_parent,
    );
    this.excludes = excludes;
    this.includes = includes;
    this.closed = closed;
  }
}

export class C_COMPLEX_OBJECT_PROXY extends C_OBJECT {
  target_path: String;
  constructor(
    rm_type_name: String,
    node_id: String,
    target_path: String,
    occurrences?: Multiplicity_interval,
    is_deprecated?: Boolean,
    sibling_order?: SIBLING_ORDER,
    parent?: ARCHETYPE_CONSTRAINT,
    soc_parent?: C_SECOND_ORDER,
  ) {
    super(
      rm_type_name,
      node_id,
      occurrences,
      is_deprecated,
      sibling_order,
      parent,
      soc_parent,
    );
    this.target_path = target_path;
  }
}

export abstract class C_PRIMITIVE_OBJECT extends C_DEFINED_OBJECT {
  is_enumerated_type_constraint?: Boolean;
  assumed_value?: Any;
  constraint: Any;
  constructor(
    rm_type_name: String,
    node_id: String,
    constraint: Any,
    occurrences?: Multiplicity_interval,
    is_deprecated?: Boolean,
    sibling_order?: SIBLING_ORDER,
    parent?: ARCHETYPE_CONSTRAINT,
    soc_parent?: C_SECOND_ORDER,
    default_value?: Any,
    is_enumerated_type_constraint?: Boolean,
    assumed_value?: Any,
  ) {
    super(
      rm_type_name,
      node_id,
      occurrences,
      is_deprecated,
      sibling_order,
      parent,
      soc_parent,
      default_value,
    );
    this.is_enumerated_type_constraint = is_enumerated_type_constraint;
    this.assumed_value = assumed_value;
    this.constraint = constraint;
  }
}

export class C_SECOND_ORDER extends Any {
  members: ARCHETYPE_CONSTRAINT[];
  constructor(members: ARCHETYPE_CONSTRAINT[]) {
    super();
    this.members = members;
  }
}

export class C_ATTRIBUTE_TUPLE extends C_SECOND_ORDER {
  tuples?: C_PRIMITIVE_TUPLE[];
  members: C_ATTRIBUTE[];
  constructor(members: C_ATTRIBUTE[], tuples?: C_PRIMITIVE_TUPLE[]) {
    super(members);
    this.tuples = tuples;
    this.members = members;
  }
}

export class C_PRIMITIVE_TUPLE extends C_SECOND_ORDER {
  members: C_PRIMITIVE_OBJECT[];
  constructor(members: C_PRIMITIVE_OBJECT[]) {
    super(members);
    this.members = members;
  }
}

//
// constraint_model.primitive
//

export class C_BOOLEAN extends C_PRIMITIVE_OBJECT {
  constraint?: Boolean[];
  assumed_value?: Boolean;
  default_value?: Boolean;
  constructor(
    rm_type_name: String,
    node_id: String,
    constraint?: Boolean[],
    occurrences?: Multiplicity_interval,
    is_deprecated?: Boolean,
    sibling_order?: SIBLING_ORDER,
    parent?: ARCHETYPE_CONSTRAINT,
    soc_parent?: C_SECOND_ORDER,
    default_value?: Boolean,
    is_enumerated_type_constraint?: Boolean,
    assumed_value?: Boolean,
  ) {
    super(
      rm_type_name,
      node_id,
      constraint,
      occurrences,
      is_deprecated,
      sibling_order,
      parent,
      soc_parent,
      default_value,
      is_enumerated_type_constraint,
      assumed_value,
    );
    this.constraint = constraint;
    this.assumed_value = assumed_value;
    this.default_value = default_value;
  }
}

export class C_STRING extends C_PRIMITIVE_OBJECT {
  constraint: String[];
  assumed_value?: String;
  default_value?: String;
  constructor(
    rm_type_name: String,
    node_id: String,
    constraint: String[],
    occurrences?: Multiplicity_interval,
    is_deprecated?: Boolean,
    sibling_order?: SIBLING_ORDER,
    parent?: ARCHETYPE_CONSTRAINT,
    soc_parent?: C_SECOND_ORDER,
    default_value?: String,
    is_enumerated_type_constraint?: Boolean,
    assumed_value?: String,
  ) {
    super(
      rm_type_name,
      node_id,
      constraint,
      occurrences,
      is_deprecated,
      sibling_order,
      parent,
      soc_parent,
      default_value,
      is_enumerated_type_constraint,
      assumed_value,
    );
    this.constraint = constraint;
    this.assumed_value = assumed_value;
    this.default_value = default_value;
  }
}

export class C_TERMINOLOGY_CODE extends C_PRIMITIVE_OBJECT {
  constraint: String;
  constraint_status?: CONSTRAINT_STATUS;
  assumed_value?: Terminology_code;
  default_value?: Terminology_code;
  constructor(
    rm_type_name: String,
    node_id: String,
    constraint: String,
    occurrences?: Multiplicity_interval,
    is_deprecated?: Boolean,
    sibling_order?: SIBLING_ORDER,
    parent?: ARCHETYPE_CONSTRAINT,
    soc_parent?: C_SECOND_ORDER,
    default_value?: Terminology_code,
    is_enumerated_type_constraint?: Boolean,
    assumed_value?: Terminology_code,
    constraint_status?: CONSTRAINT_STATUS,
  ) {
    super(
      rm_type_name,
      node_id,
      constraint,
      occurrences,
      is_deprecated,
      sibling_order,
      parent,
      soc_parent,
      default_value,
      is_enumerated_type_constraint,
      assumed_value,
    );
    this.constraint = constraint;
    this.constraint_status = constraint_status;
    this.assumed_value = assumed_value;
    this.default_value = default_value;
  }
}

export enum CONSTRAINT_STATUS {
  REQUIRED,
  EXTENSIBLE,
  PREFERRED,
  EXAMPLE,
}

export abstract class C_ORDERED<T extends Ordered> extends C_PRIMITIVE_OBJECT {
  constraint?: Interval<T>[];
  constructor(
    rm_type_name: String,
    node_id: String,
    constraint?: Interval<T>[],
    occurrences?: Multiplicity_interval,
    is_deprecated?: Boolean,
    sibling_order?: SIBLING_ORDER,
    parent?: ARCHETYPE_CONSTRAINT,
    soc_parent?: C_SECOND_ORDER,
    default_value?: Any,
    is_enumerated_type_constraint?: Boolean,
    assumed_value?: Any,
  ) {
    super(
      rm_type_name,
      node_id,
      constraint,
      occurrences,
      is_deprecated,
      sibling_order,
      parent,
      soc_parent,
      default_value,
      is_enumerated_type_constraint,
      assumed_value,
    );
    this.constraint = constraint;
  }
}

export class C_INTEGER extends C_ORDERED<Integer> {
  constraint: Interval<Integer>[];
  assumed_value?: Integer;
  default_value?: Integer;
  constructor(
    rm_type_name: String,
    node_id: String,
    constraint: Interval<Integer>[],
    occurrences?: Multiplicity_interval,
    is_deprecated?: Boolean,
    sibling_order?: SIBLING_ORDER,
    parent?: ARCHETYPE_CONSTRAINT,
    soc_parent?: C_SECOND_ORDER,
    default_value?: Integer,
    is_enumerated_type_constraint?: Boolean,
    assumed_value?: Integer,
  ) {
    super(
      rm_type_name,
      node_id,
      constraint,
      occurrences,
      is_deprecated,
      sibling_order,
      parent,
      soc_parent,
      default_value,
      is_enumerated_type_constraint,
      assumed_value,
    );
    this.constraint = constraint;
    this.assumed_value = assumed_value;
    this.default_value = default_value;
  }
}

export class C_REAL extends C_ORDERED<Real> {
  constraint: Interval<Real>[];
  assumed_value?: Real;
  default_value?: Real;
  constructor(
    rm_type_name: String,
    node_id: String,
    constraint: Interval<Real>[],
    occurrences?: Multiplicity_interval,
    is_deprecated?: Boolean,
    sibling_order?: SIBLING_ORDER,
    parent?: ARCHETYPE_CONSTRAINT,
    soc_parent?: C_SECOND_ORDER,
    default_value?: Real,
    is_enumerated_type_constraint?: Boolean,
    assumed_value?: Real,
  ) {
    super(
      rm_type_name,
      node_id,
      constraint,
      occurrences,
      is_deprecated,
      sibling_order,
      parent,
      soc_parent,
      default_value,
      is_enumerated_type_constraint,
      assumed_value,
    );
    this.constraint = constraint;
    this.assumed_value = assumed_value;
    this.default_value = default_value;
  }
}

export abstract class C_TEMPORAL<T extends Ordered> extends C_ORDERED<T> {
  pattern_constraint?: String;
  constructor(
    rm_type_name: String,
    node_id: String,
    constraint?: Interval<T>[],
    occurrences?: Multiplicity_interval,
    is_deprecated?: Boolean,
    sibling_order?: SIBLING_ORDER,
    parent?: ARCHETYPE_CONSTRAINT,
    soc_parent?: C_SECOND_ORDER,
    default_value?: Any,
    is_enumerated_type_constraint?: Boolean,
    assumed_value?: Any,
    pattern_constraint?: String,
  ) {
    super(
      rm_type_name,
      node_id,
      constraint,
      occurrences,
      is_deprecated,
      sibling_order,
      parent,
      soc_parent,
      default_value,
      is_enumerated_type_constraint,
      assumed_value,
    );
    this.pattern_constraint = pattern_constraint;
  }
}

export class C_DATE extends C_TEMPORAL<Date> {
  constraint: Interval<Date>[];
  assumed_value?: Date;
  default_value?: Date;
  constructor(
    rm_type_name: String,
    node_id: String,
    constraint: Interval<Date>[],
    occurrences?: Multiplicity_interval,
    is_deprecated?: Boolean,
    sibling_order?: SIBLING_ORDER,
    parent?: ARCHETYPE_CONSTRAINT,
    soc_parent?: C_SECOND_ORDER,
    default_value?: Date,
    is_enumerated_type_constraint?: Boolean,
    assumed_value?: Date,
    pattern_constraint?: String,
  ) {
    super(
      rm_type_name,
      node_id,
      constraint,
      occurrences,
      is_deprecated,
      sibling_order,
      parent,
      soc_parent,
      default_value,
      is_enumerated_type_constraint,
      assumed_value,
      pattern_constraint,
    );
    this.constraint = constraint;
    this.assumed_value = assumed_value;
    this.default_value = default_value;
  }
}

export class C_TIME extends C_TEMPORAL<Time> {
  constraint: Interval<Time>[];
  assumed_value?: Time;
  default_value?: Time;
  constructor(
    rm_type_name: String,
    node_id: String,
    constraint: Interval<Time>[],
    occurrences?: Multiplicity_interval,
    is_deprecated?: Boolean,
    sibling_order?: SIBLING_ORDER,
    parent?: ARCHETYPE_CONSTRAINT,
    soc_parent?: C_SECOND_ORDER,
    default_value?: Time,
    is_enumerated_type_constraint?: Boolean,
    assumed_value?: Time,
    pattern_constraint?: String,
  ) {
    super(
      rm_type_name,
      node_id,
      constraint,
      occurrences,
      is_deprecated,
      sibling_order,
      parent,
      soc_parent,
      default_value,
      is_enumerated_type_constraint,
      assumed_value,
      pattern_constraint,
    );
    this.constraint = constraint;
    this.assumed_value = assumed_value;
    this.default_value = default_value;
  }
}

export class C_DATE_TIME extends C_TEMPORAL<Date_time> {
  constraint: Interval<Date_time>[];
  assumed_value?: Date_time;
  default_value?: Date_time;
  constructor(
    rm_type_name: String,
    node_id: String,
    constraint: Interval<Date_time>[],
    occurrences?: Multiplicity_interval,
    is_deprecated?: Boolean,
    sibling_order?: SIBLING_ORDER,
    parent?: ARCHETYPE_CONSTRAINT,
    soc_parent?: C_SECOND_ORDER,
    default_value?: Date_time,
    is_enumerated_type_constraint?: Boolean,
    assumed_value?: Date_time,
    pattern_constraint?: String,
  ) {
    super(
      rm_type_name,
      node_id,
      constraint,
      occurrences,
      is_deprecated,
      sibling_order,
      parent,
      soc_parent,
      default_value,
      is_enumerated_type_constraint,
      assumed_value,
      pattern_constraint,
    );
    this.constraint = constraint;
    this.assumed_value = assumed_value;
    this.default_value = default_value;
  }
}

export class C_DURATION extends C_TEMPORAL<Duration> {
  constraint: Interval<Duration>[];
  assumed_value?: Duration;
  default_value?: Duration;
  constructor(
    rm_type_name: String,
    node_id: String,
    constraint: Interval<Duration>[],
    occurrences?: Multiplicity_interval,
    is_deprecated?: Boolean,
    sibling_order?: SIBLING_ORDER,
    parent?: ARCHETYPE_CONSTRAINT,
    soc_parent?: C_SECOND_ORDER,
    default_value?: Duration,
    is_enumerated_type_constraint?: Boolean,
    assumed_value?: Duration,
    pattern_constraint?: String,
  ) {
    super(
      rm_type_name,
      node_id,
      constraint,
      occurrences,
      is_deprecated,
      sibling_order,
      parent,
      soc_parent,
      default_value,
      is_enumerated_type_constraint,
      assumed_value,
      pattern_constraint,
    );
    this.constraint = constraint;
    this.assumed_value = assumed_value;
    this.default_value = default_value;
  }
}

//
// rm_overlay
//

export class RM_OVERLAY extends Any {
  rm_visibility?: Map<string, RM_ATTRIBUTE_VISIBILITY>;
  constructor(rm_visibility?: Map<string, RM_ATTRIBUTE_VISIBILITY>) {
    super();
    this.rm_visibility = rm_visibility;
  }
}

export class RM_ATTRIBUTE_VISIBILITY extends Any {
  alias?: Terminology_code;
  visibility?: VISIBILITY_TYPE;
  constructor(alias?: Terminology_code, visibility?: VISIBILITY_TYPE) {
    super();
    this.alias = alias;
    this.visibility = visibility;
  }
}

export enum VISIBILITY_TYPE {
  HIDE = "hide",
  SHOW = "show",
}

//
// profile
//

export class AOM_PROFILE extends Any {
  profile_name: String;
  aom_rm_type_substitutions?: Map<string, String>;
  aom_lifecycle_mappings?: Map<string, String>;
  aom_rm_type_mappings?: Map<string, AOM_TYPE_MAPPING>;
  rm_primitive_type_equivalences?: Map<string, String>;
  constructor(
    profile_name: String,
    aom_rm_type_substitutions?: Map<string, String>,
    aom_lifecycle_mappings?: Map<string, String>,
    aom_rm_type_mappings?: Map<string, AOM_TYPE_MAPPING>,
    rm_primitive_type_equivalences?: Map<string, String>,
  ) {
    super();
    this.profile_name = profile_name;
    this.aom_rm_type_substitutions = aom_rm_type_substitutions;
    this.aom_lifecycle_mappings = aom_lifecycle_mappings;
    this.aom_rm_type_mappings = aom_rm_type_mappings;
    this.rm_primitive_type_equivalences = rm_primitive_type_equivalences;
  }
}

export class AOM_TYPE_MAPPING extends Any {
  source_class_name: String;
  target_class_name: String;
  property_mappings?: Map<string, AOM_PROPERTY_MAPPING>;
  constructor(
    source_class_name: String,
    target_class_name: String,
    property_mappings?: Map<string, AOM_PROPERTY_MAPPING>,
  ) {
    super();
    this.source_class_name = source_class_name;
    this.target_class_name = target_class_name;
    this.property_mappings = property_mappings;
  }
}

export class AOM_PROPERTY_MAPPING extends Any {
  source_property: String;
  target_property: String;
  constructor(source_property: String, target_property: String) {
    super();
    this.source_property = source_property;
    this.target_property = target_property;
  }
}
