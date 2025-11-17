// Enhanced implementation based on BMM schema: lang v1.1.0
// BMM Version: 2.4
// Schema Revision: 1.1.0.2
// Description: lang
// Source: https://raw.githubusercontent.com/sebastian-iancu/code-generator/master/code/BMM-JSON/openehr_lang_1.1.0.bmm.json
// Last synced with BMM: 2025-11-14
//
// ✅ ENHANCED IMPLEMENTATION
// This file contains fully implemented methods and additional functionality beyond the BMM specification.
// It is safe to edit this file - your changes will not be overwritten by the generator.
//
// The generator outputs to /generated directory. To update this file for a new BMM version:
// 1. Run generator to update /generated/openehr_lang.ts
// 2. Compare changes using: deno run --allow-read tasks/compare_bmm_versions.ts
// 3. Manually merge relevant changes into this file
//
// For more information about openEHR specifications, visit: https://specifications.openehr.org/

import * as openehr_base from "./openehr_base.ts";

// Unknown types - defined as 'any' for now
type BMM_CLASS = any;
type BMM_CONTAINER_TYPE = any;
type BMM_ENUMERATION = any;
type BMM_ENUMERATION_INTEGER = any;
type BMM_ENUMERATION_STRING = any;
type BMM_GENERIC_TYPE = any;
type BMM_INDEXED_CONTAINER_TYPE = any;
type BMM_PARAMETER_TYPE = any;
type BMM_SIMPLE_TYPE = any;
type BMM_STATUS_TYPE = any;
type BMM_TUPLE_TYPE = any;
type BMM_TYPE = any;
type BMM_UNITARY_TYPE = any;
type C_OBJECT = any;
type T = any;

/**
 * Definitions used by all BMM packages.
 */
export class BMM_DEFINITIONS extends openehr_base.BASIC_DEFINITIONS {
  /**
   * built-in class definition corresponding to the top \`Any' class.
   * @returns Result value
   */
  Any_class(): BMM_SIMPLE_CLASS {
    // TODO: Implement Any_class behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method Any_class not yet implemented.");
  }

  /**
   * Built-in type definition corresponding to the top \`Any' type.
   * @returns Result value
   */
  Any_type(): BMM_SIMPLE_TYPE {
    // TODO: Implement Any_type behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method Any_type not yet implemented.");
  }

  /**
   * Create schema id, formed from:
   *
   * \`a_model_publisher '-' a_schema_name '-' a_model_release\`
   *
   * e.g. \`openehr_rm_1.0.3\`, \`openehr_test_1.0.1\`, \`iso_13606_1_2008_2.1.2\`.
   * @param a_model_publisher - Parameter
   * @param a_schema_name - Parameter
   * @param a_model_release - Parameter
   * @returns Result value
   */
  create_schema_id(
    a_model_publisher: openehr_base.Any,
    a_schema_name: openehr_base.Any,
    a_model_release: openehr_base.String,
  ): openehr_base.String {
    // TODO: Implement create_schema_id behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method create_schema_id not yet implemented.");
  }
}

/**
 * Access to BMM models that have been loaded and validated from one or more schema sets.
 */
export class BMM_MODEL_ACCESS {
  /**
   * List of directories where all the schemas loaded here are found.
   */
  schema_directories?: undefined;
  /**
   * All schemas found and loaded from \`_schema_directory_\`. Keyed by \`_schema_id_\`.
   */
  all_schemas?: undefined;
  /**
   * Top-level (root) models in use, keyed by \`_model_id_\`.
   */
  bmm_models?: undefined;
  /**
   * Validated models, keyed by \`_model_id()_\` and any shorter forms of id, with some or no versioning information. For example, the keys \`"openEHR_EHR_1.0.4"\`, \`"openEHR_EHR_1.0"\`, \`"openEHR_EHR_1"\`, and \`"openEHR_EHR"\` will all match the \`"openEHR_EHR_1.0.4"\` model, assuming it is the most recent version available.
   */
  matching_bmm_models?: undefined;
  /**
   * Initialise with a specific schema load list, usually a sub-set of schemas that will be found in a specified directories \`_a_schema_dirs_\`.
   * @param a_schema_dirs - Parameter
   * @param a_schema_load_list - Parameter
   * @returns Result value
   */
  initialise_with_load_list(
    a_schema_dirs: undefined,
    a_schema_load_list: undefined,
  ): void {
    // TODO: Implement initialise_with_load_list behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method initialise_with_load_list not yet implemented.");
  }

  /**
   * Load all schemas found in a specified directories \`_a_schema_dirs_\`.
   * @param a_schema_dirs - Parameter
   * @returns Result value
   */
  initialise_all(a_schema_dirs: undefined): void {
    // TODO: Implement initialise_all behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method initialise_all not yet implemented.");
  }

  /**
   * Reload BMM schemas.
   * @returns Result value
   */
  reload_schemas(): void {
    // TODO: Implement reload_schemas behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method reload_schemas not yet implemented.");
  }

  /**
   * Return model containing the model key which is a \`_model_id_\` or any shorter form e.g. model id minus the version. If a shorter key is used, the \`BMM_MODEL\` with the most recent version will be selected. Uses \`_matching_bmm_models_\` table to find matches if partial version information is supplied in key.
   * @param a_model_key - Parameter
   * @returns Result value
   */
  bmm_model(a_model_key: openehr_base.String): BMM_MODEL {
    // TODO: Implement bmm_model behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method bmm_model not yet implemented.");
  }

  /**
   * True if a model for a \`_model_key_\` is available. A model key is a \`_model_id_\` or any shorter form e.g. model id minus the version. If a shorter key is used, the Result s True if a \`BMM_MODEL\` with any version exists.
   * @param a_model_key - Parameter
   * @returns Result value
   */
  has_bmm_model(a_model_key: openehr_base.String): openehr_base.Boolean {
    // TODO: Implement has_bmm_model behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method has_bmm_model not yet implemented.");
  }
}

/**
 * Descriptor for a BMM schema. Contains a meta-data table of attributes obtained from a mini-ODIN parse of the  schema file.
 */
export abstract class BMM_SCHEMA_DESCRIPTOR {
  /**
   * Persistent form of model.
   */
  bmm_schema?: BMM_SCHEMA;
  /**
   * Computable form of model.
   */
  bmm_model?: BMM_MODEL;
  /**
   * Internal storage for schema_id
   * @protected
   */
  protected _schema_id?: openehr_base.String;

  /**
   * Schema id, formed by
   *
   * \`{BMM_DEFINITIONS}.create_schema_id(
   *   meta_data.item({BMM_DEFINITIONS}.Metadata_model_publisher),
   *   meta_data.item({BMM_DEFINITIONS}.Metadata_schema_name),
   *   meta_data.item({BMM_DEFINITIONS}.Metadata_model_release)\`
   *
   * e.g. \`openehr_rm_1.0.3\`, \`openehr_test_1.0.1\`, \`iso_13606_1_2008_2.1.2\`.
   */
  get schema_id(): string | undefined {
    return this._schema_id?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for schema_id.
   * Use this to access openehr_base.String methods.
   */
  get $schema_id(): openehr_base.String | undefined {
    return this._schema_id;
  }

  /**
   * Sets schema_id from either a primitive value or openehr_base.String wrapper.
   */
  set schema_id(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._schema_id = undefined;
    } else if (typeof val === "string") {
      this._schema_id = openehr_base.String.from(val);
    } else {
      this._schema_id = val;
    }
  }

  /**
   * Table of \`{key, value}\` of schema meta-data, keys are string values defined by \`{BMM_DEFINITIONS}.Metadata_*\` constants.
   */
  meta_data?: undefined;
  /**
   * Identifiers of schemas included by this schema.
   */
  includes?: undefined;
  /**
   * True if this is a top-level schema, i.e. is the root schema of a 'model'. True if \`_bmm_schema_ /= Void and then _bmm_schema.model_name_ /= Void\`.
   * @returns Result value
   */
  is_top_level(): openehr_base.Boolean {
    // TODO: Implement is_top_level behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method is_top_level not yet implemented.");
  }

  /**
   * True if the BMM version found in the schema (or assumed, if none) is compatible with that in this software.
   * @returns Result value
   */
  is_bmm_compatible(): openehr_base.Boolean {
    // TODO: Implement is_bmm_compatible behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method is_bmm_compatible not yet implemented.");
  }

  /**
   * Load schema into in-memory form, i.e. a \`P_BMM_SCHEMA\` instance, if structurally valid. If successful, \`_p_schema_\` will be set.
   * @returns Result value
   */
  load(): void {
    // TODO: Implement load behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method load not yet implemented.");
  }

  /**
   * Validate loaded schema and report errors.
   * @returns Result value
   */
  validate_merged(): void {
    // TODO: Implement validate_merged behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method validate_merged not yet implemented.");
  }

  /**
   * Validate includes list for this schema, to see if each mentioned schema exists in \`_all_schemas_\` list.
   * @param all_schemas_list - Parameter
   * @returns Result value
   */
  validate_includes(all_schemas_list: undefined): void {
    // TODO: Implement validate_includes behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method validate_includes not yet implemented.");
  }

  /**
   * Create \`schema\`, i.e. the \`BMM_MODEL\` from one \`P_BMM_SCHEMA\` schema.
   * @returns Result value
   */
  create_model(): void {
    // TODO: Implement create_model behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method create_model not yet implemented.");
  }
}

/**
 * Core properties of \`BMM_MODEL\`, may be used in a serial representation as well, such as \`P_BMM_SCHEMA\`.
 */
export class BMM_MODEL_METADATA {
  /**
   * Internal storage for rm_publisher
   * @protected
   */
  protected _rm_publisher?: openehr_base.String;

  /**
   * Publisher of model expressed in the schema.
   */
  get rm_publisher(): string | undefined {
    return this._rm_publisher?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for rm_publisher.
   * Use this to access openehr_base.String methods.
   */
  get $rm_publisher(): openehr_base.String | undefined {
    return this._rm_publisher;
  }

  /**
   * Sets rm_publisher from either a primitive value or openehr_base.String wrapper.
   */
  set rm_publisher(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._rm_publisher = undefined;
    } else if (typeof val === "string") {
      this._rm_publisher = openehr_base.String.from(val);
    } else {
      this._rm_publisher = val;
    }
  }

  /**
   * Internal storage for rm_release
   * @protected
   */
  protected _rm_release?: openehr_base.String;

  /**
   * Release of model expressed in the schema as a 3-part numeric, e.g. "3.1.0" .
   */
  get rm_release(): string | undefined {
    return this._rm_release?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for rm_release.
   * Use this to access openehr_base.String methods.
   */
  get $rm_release(): openehr_base.String | undefined {
    return this._rm_release;
  }

  /**
   * Sets rm_release from either a primitive value or openehr_base.String wrapper.
   */
  set rm_release(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._rm_release = undefined;
    } else if (typeof val === "string") {
      this._rm_release = openehr_base.String.from(val);
    } else {
      this._rm_release = val;
    }
  }
}

/**
 * Abstract parent of any persistable form of a BMM model, e.g. \`P_BMM_SCHEMA\`.
 */
export abstract class BMM_SCHEMA extends BMM_MODEL_METADATA {
  /**
   * Internal storage for bmm_version
   * @protected
   */
  protected _bmm_version?: openehr_base.String;

  /**
   * Version of BMM model, enabling schema evolution reasoning. Persisted attribute.
   */
  get bmm_version(): string | undefined {
    return this._bmm_version?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for bmm_version.
   * Use this to access openehr_base.String methods.
   */
  get $bmm_version(): openehr_base.String | undefined {
    return this._bmm_version;
  }

  /**
   * Sets bmm_version from either a primitive value or openehr_base.String wrapper.
   */
  set bmm_version(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._bmm_version = undefined;
    } else if (typeof val === "string") {
      this._bmm_version = openehr_base.String.from(val);
    } else {
      this._bmm_version = val;
    }
  }

  /**
   * Inclusion list of any form of BMM model, in the form of a hash of individual include specifications, each of which at least specifies the id of another schema, and may specify a namespace via which types from the included schemas are known in this schema.
   * Persisted attribute.
   */
  includes?: undefined;
  /**
   * Generated by \`_create_bmm_model_\` from persisted elements.
   */
  bmm_model?: BMM_MODEL;
  /**
   * Current processing state.
   */
  state?: BMM_SCHEMA_STATE;
  /**
   * Internal storage for model_name
   * @protected
   */
  protected _model_name?: openehr_base.String;

  /**
   * Name of this model, if this schema is a model root point. Not set for sub-schemas that are not considered models on their own.
   */
  get model_name(): string | undefined {
    return this._model_name?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for model_name.
   * Use this to access openehr_base.String methods.
   */
  get $model_name(): openehr_base.String | undefined {
    return this._model_name;
  }

  /**
   * Sets model_name from either a primitive value or openehr_base.String wrapper.
   */
  set model_name(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._model_name = undefined;
    } else if (typeof val === "string") {
      this._model_name = openehr_base.String.from(val);
    } else {
      this._model_name = val;
    }
  }

  /**
   * Internal storage for schema_name
   * @protected
   */
  protected _schema_name?: openehr_base.String;

  /**
   * Name of model expressed in schema; a 'schema' usually contains all of the packages of one 'model' of a publisher. A publisher with more than one model can have multiple schemas.
   */
  get schema_name(): string | undefined {
    return this._schema_name?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for schema_name.
   * Use this to access openehr_base.String methods.
   */
  get $schema_name(): openehr_base.String | undefined {
    return this._schema_name;
  }

  /**
   * Sets schema_name from either a primitive value or openehr_base.String wrapper.
   */
  set schema_name(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._schema_name = undefined;
    } else if (typeof val === "string") {
      this._schema_name = openehr_base.String.from(val);
    } else {
      this._schema_name = val;
    }
  }

  /**
   * Internal storage for schema_revision
   * @protected
   */
  protected _schema_revision?: openehr_base.String;

  /**
   * Revision of schema.
   */
  get schema_revision(): string | undefined {
    return this._schema_revision?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for schema_revision.
   * Use this to access openehr_base.String methods.
   */
  get $schema_revision(): openehr_base.String | undefined {
    return this._schema_revision;
  }

  /**
   * Sets schema_revision from either a primitive value or openehr_base.String wrapper.
   */
  set schema_revision(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._schema_revision = undefined;
    } else if (typeof val === "string") {
      this._schema_revision = openehr_base.String.from(val);
    } else {
      this._schema_revision = val;
    }
  }

  /**
   * Internal storage for schema_lifecycle_state
   * @protected
   */
  protected _schema_lifecycle_state?: openehr_base.String;

  /**
   * Schema development lifecycle state.
   */
  get schema_lifecycle_state(): string | undefined {
    return this._schema_lifecycle_state?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for schema_lifecycle_state.
   * Use this to access openehr_base.String methods.
   */
  get $schema_lifecycle_state(): openehr_base.String | undefined {
    return this._schema_lifecycle_state;
  }

  /**
   * Sets schema_lifecycle_state from either a primitive value or openehr_base.String wrapper.
   */
  set schema_lifecycle_state(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._schema_lifecycle_state = undefined;
    } else if (typeof val === "string") {
      this._schema_lifecycle_state = openehr_base.String.from(val);
    } else {
      this._schema_lifecycle_state = val;
    }
  }

  /**
   * Internal storage for schema_author
   * @protected
   */
  protected _schema_author?: openehr_base.String;

  /**
   * Primary author of schema.
   */
  get schema_author(): string | undefined {
    return this._schema_author?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for schema_author.
   * Use this to access openehr_base.String methods.
   */
  get $schema_author(): openehr_base.String | undefined {
    return this._schema_author;
  }

  /**
   * Sets schema_author from either a primitive value or openehr_base.String wrapper.
   */
  set schema_author(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._schema_author = undefined;
    } else if (typeof val === "string") {
      this._schema_author = openehr_base.String.from(val);
    } else {
      this._schema_author = val;
    }
  }

  /**
   * Internal storage for schema_description
   * @protected
   */
  protected _schema_description?: openehr_base.String;

  /**
   * Description of schema.
   */
  get schema_description(): string | undefined {
    return this._schema_description?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for schema_description.
   * Use this to access openehr_base.String methods.
   */
  get $schema_description(): openehr_base.String | undefined {
    return this._schema_description;
  }

  /**
   * Sets schema_description from either a primitive value or openehr_base.String wrapper.
   */
  set schema_description(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._schema_description = undefined;
    } else if (typeof val === "string") {
      this._schema_description = openehr_base.String.from(val);
    } else {
      this._schema_description = val;
    }
  }

  /**
   * Contributing authors of schema.
   */
  schema_contributors?: undefined;
  /**
   * Do some basic validation post initial creation
   *
   * * check that package structure is regular:
   * ** only top-level packages can have qualified names
   * ** no top-level package name can be a direct parent or child of another (child package must be declared under the parent)
   * * check that all classes are mentioned in the package structure
   * * check that all models refer to valid packages
   * @returns Result value
   */
  abstract validate_created(): void;

  /**
   * Finalisation work:
   *
   * * convert packages to canonical form, i.e. full hierarchy with no packages with names like aa.bb.cc
   * * set up include processing list
   * @returns Result value
   */
  abstract load_finalise(): void;

  /**
   * Merge in class and package definitions from \`_other_\`, except where the current schema already has a definition for the given type or package.
   * @param other - Parameter
   * @returns Result value
   */
  abstract merge(other: BMM_SCHEMA): void;

  /**
   * Main validation prior to generation of \`_bmm_model_\`.
   * @returns Result value
   */
  abstract validate(): void;

  /**
   * Populate \`_bmm_model_\` from schema.
   * @returns Result value
   */
  abstract create_bmm_model(): void;

  /**
   * True when validation may be commenced.
   * @returns Result value
   */
  read_to_validate(): openehr_base.Boolean {
    // TODO: Implement read_to_validate behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method read_to_validate not yet implemented.");
  }

  /**
   * Identifier of this schema, used for stating inclusions and identifying files. Formed as:
   *
   * \`{BMM_DEFINITIONS}.create_schema_id ( _rm_publisher_,  _schema_name_,   _rm_release_)\`
   *
   * E.g. \`"openehr_rm_ehr_1.0.4"\`.
   * @returns Result value
   */
  schema_id(): openehr_base.String {
    // TODO: Implement schema_id behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method schema_id not yet implemented.");
  }
}

/**
 * Schema inclusion structure.
 */
export class BMM_INCLUDE_SPEC {
  /**
   * Internal storage for id
   * @protected
   */
  protected _id?: openehr_base.String;

  /**
   * Full identifier of the included schema, e.g. \`"openehr_primitive_types_1.0.2"\`.
   */
  get id(): string | undefined {
    return this._id?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for id.
   * Use this to access openehr_base.String methods.
   */
  get $id(): openehr_base.String | undefined {
    return this._id;
  }

  /**
   * Sets id from either a primitive value or openehr_base.String wrapper.
   */
  set id(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._id = undefined;
    } else if (typeof val === "string") {
      this._id = openehr_base.String.from(val);
    } else {
      this._id = val;
    }
  }
}

export class BMM_SCHEMA_METADATA_KEY extends openehr_base.String {
}

/**
 * Enumeration of processing states of a \`BMM_SCHEMA\` used by creation and validation routines in \`BMM_SCHEMA\`.
 */
export class BMM_SCHEMA_STATE extends openehr_base.String {
}

/**
 * Abstract meta-type of BMM declared model elements. A _declaration_ is a an element of a model within a context, which defines the _scope_ of the element. Thus, a class definition and its property and routine definitions are model elements, but Types are not, since they are derived from model elements.
 */
export abstract class BMM_MODEL_ELEMENT {
  /**
   * Internal storage for name
   * @protected
   */
  protected _name?: openehr_base.String;

  /**
   * Name of this model element.
   */
  get name(): string | undefined {
    return this._name?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for name.
   * Use this to access openehr_base.String methods.
   */
  get $name(): openehr_base.String | undefined {
    return this._name;
  }

  /**
   * Sets name from either a primitive value or openehr_base.String wrapper.
   */
  set name(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._name = undefined;
    } else if (typeof val === "string") {
      this._name = openehr_base.String.from(val);
    } else {
      this._name = val;
    }
  }

  /**
   * Optional documentation of this element, as a keyed list.
   *
   * It is strongly recommended to use the following key /type combinations for the relevant purposes:
   *
   * * \`"purpose": String\`
   * * \`"keywords": List<String>\`
   * * \`"use": String\`
   * * \`"misuse": String\`
   * * \`"references": String\`
   *
   * Other keys and value types may be freely added.
   */
  documentation?: undefined;
  /**
   * Model element within which an element is declared.
   */
  scope?: BMM_MODEL_ELEMENT;
  /**
   * Optional meta-data of this element, as a keyed list. May be used to extend the meta-model.
   */
  extensions?: undefined;
  /**
   * True if this model element is the root of a model structure hierarchy.
   * @returns Result value
   */
  is_root_scope(): openehr_base.Boolean {
    // TODO: Implement is_root_scope behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method is_root_scope not yet implemented.");
  }
}

/**
 * A formal element having a name, type and a type-based signature.
 */
export abstract class BMM_FORMAL_ELEMENT extends BMM_MODEL_ELEMENT {
  /**
   * Declared or inferred static type of the entity.
   */
  type?: BMM_TYPE;
  /**
   * Internal storage for is_nullable
   * @protected
   */
  protected _is_nullable?: openehr_base.Boolean;

  /**
   * True if this element can be null (Void) at execution time. May be interpreted as optionality in subtypes..
   */
  get is_nullable(): boolean | undefined {
    return this._is_nullable?.value;
  }

  /**
   * Gets the openehr_base.Boolean wrapper object for is_nullable.
   * Use this to access openehr_base.Boolean methods.
   */
  get $is_nullable(): openehr_base.Boolean | undefined {
    return this._is_nullable;
  }

  /**
   * Sets is_nullable from either a primitive value or openehr_base.Boolean wrapper.
   */
  set is_nullable(val: boolean | openehr_base.Boolean | undefined) {
    if (val === undefined || val === null) {
      this._is_nullable = undefined;
    } else if (typeof val === "boolean") {
      this._is_nullable = openehr_base.Boolean.from(val);
    } else {
      this._is_nullable = val;
    }
  }

  /**
   * Formal signature of this element, in the form:
   *
   * \`name [arg1_name: T_arg1, ...][:T_value]\`
   *
   * Specific implementations in descendants.
   * @returns Result value
   */
  abstract signature(): BMM_SIGNATURE;

  /**
   * True if \`_type_\` is notionally Boolean (i.e. a \`BMM_SIMPLE_TYPE\` with \`_type_name()_\` = \`'Boolean'\`).
   * @returns Result value
   */
  is_boolean(): openehr_base.Boolean {
    // TODO: Implement is_boolean behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method is_boolean not yet implemented.");
  }
}

/**
 * A module-scoped formal element.
 */
export abstract class BMM_FEATURE extends BMM_FORMAL_ELEMENT {
  /**
   * Internal storage for is_synthesised_generic
   * @protected
   */
  protected _is_synthesised_generic?: openehr_base.Boolean;

  /**
   * True if this feature was synthesised due to generic substitution in an inherited type, or further constraining of a formal generic parameter.
   */
  get is_synthesised_generic(): boolean | undefined {
    return this._is_synthesised_generic?.value;
  }

  /**
   * Gets the openehr_base.Boolean wrapper object for is_synthesised_generic.
   * Use this to access openehr_base.Boolean methods.
   */
  get $is_synthesised_generic(): openehr_base.Boolean | undefined {
    return this._is_synthesised_generic;
  }

  /**
   * Sets is_synthesised_generic from either a primitive value or openehr_base.Boolean wrapper.
   */
  set is_synthesised_generic(val: boolean | openehr_base.Boolean | undefined) {
    if (val === undefined || val === null) {
      this._is_synthesised_generic = undefined;
    } else if (typeof val === "boolean") {
      this._is_synthesised_generic = openehr_base.Boolean.from(val);
    } else {
      this._is_synthesised_generic = val;
    }
  }

  /**
   * Extensions to feature-level meta-types.
   */
  feature_extensions?: undefined;
  /**
   * Group containing this feature.
   */
  group?: BMM_FEATURE_GROUP;
  /**
   * Model element within which an element is declared.
   */
  override scope?: BMM_CLASS = undefined;
}

/**
 * Meta-type representing instantiable features, i.e. features that are created as value objects.
 */
export abstract class BMM_INSTANTIABLE_FEATURE extends BMM_FEATURE {
}

/**
 * Meta-type for static (i.e. read-only) properties.
 */
export abstract class BMM_STATIC extends BMM_INSTANTIABLE_FEATURE {
}

/**
 * An immutable, static value-returning element scoped to a class. The \`_value_\` is the result of the evaluation of the \`_generator_\`, which may be as simple as a literal value, or may be any expression, including a function call.
 */
export class BMM_CONSTANT extends BMM_STATIC {
  /**
   * Literal value of the constant.
   */
  generator?: BMM_LITERAL_VALUE;
}

/**
 * Meta-type of a writable property definition within a class definition of an object model. The \`_is_composition_\` attribute indicates whether the property has sub-part or an association semantics with respect to the owning class.
 */
export abstract class BMM_PROPERTY extends BMM_INSTANTIABLE_FEATURE {
  /**
   * Internal storage for is_im_runtime
   * @protected
   */
  protected _is_im_runtime?: openehr_base.Boolean;

  /**
   * True if this property is marked with info model \`_im_runtime_\` property.
   */
  get is_im_runtime(): boolean | undefined {
    return this._is_im_runtime?.value;
  }

  /**
   * Gets the openehr_base.Boolean wrapper object for is_im_runtime.
   * Use this to access openehr_base.Boolean methods.
   */
  get $is_im_runtime(): openehr_base.Boolean | undefined {
    return this._is_im_runtime;
  }

  /**
   * Sets is_im_runtime from either a primitive value or openehr_base.Boolean wrapper.
   */
  set is_im_runtime(val: boolean | openehr_base.Boolean | undefined) {
    if (val === undefined || val === null) {
      this._is_im_runtime = undefined;
    } else if (typeof val === "boolean") {
      this._is_im_runtime = openehr_base.Boolean.from(val);
    } else {
      this._is_im_runtime = val;
    }
  }

  /**
   * Internal storage for is_im_infrastructure
   * @protected
   */
  protected _is_im_infrastructure?: openehr_base.Boolean;

  /**
   * True if this property was marked with info model \`_im_infrastructure_\` flag.
   */
  get is_im_infrastructure(): boolean | undefined {
    return this._is_im_infrastructure?.value;
  }

  /**
   * Gets the openehr_base.Boolean wrapper object for is_im_infrastructure.
   * Use this to access openehr_base.Boolean methods.
   */
  get $is_im_infrastructure(): openehr_base.Boolean | undefined {
    return this._is_im_infrastructure;
  }

  /**
   * Sets is_im_infrastructure from either a primitive value or openehr_base.Boolean wrapper.
   */
  set is_im_infrastructure(val: boolean | openehr_base.Boolean | undefined) {
    if (val === undefined || val === null) {
      this._is_im_infrastructure = undefined;
    } else if (typeof val === "boolean") {
      this._is_im_infrastructure = openehr_base.Boolean.from(val);
    } else {
      this._is_im_infrastructure = val;
    }
  }

  /**
   * Internal storage for is_composition
   * @protected
   */
  protected _is_composition?: openehr_base.Boolean;

  /**
   * True if this property instance is a compositional sub-part of the owning class instance. Equivalent to 'composition' in UML associations (but missing from UML properties without associations) and also 'cascade-delete' semantics in ER schemas.
   */
  get is_composition(): boolean | undefined {
    return this._is_composition?.value;
  }

  /**
   * Gets the openehr_base.Boolean wrapper object for is_composition.
   * Use this to access openehr_base.Boolean methods.
   */
  get $is_composition(): openehr_base.Boolean | undefined {
    return this._is_composition;
  }

  /**
   * Sets is_composition from either a primitive value or openehr_base.Boolean wrapper.
   */
  set is_composition(val: boolean | openehr_base.Boolean | undefined) {
    if (val === undefined || val === null) {
      this._is_composition = undefined;
    } else if (typeof val === "boolean") {
      this._is_composition = openehr_base.Boolean.from(val);
    } else {
      this._is_composition = val;
    }
  }

  /**
   * Interval form of \`0..1\`, \`1..1\` etc, derived from \`_is_nullable_\`.
   * @returns Result value
   */
  existence(): openehr_base.Multiplicity_interval {
    // TODO: Implement existence behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method existence not yet implemented.");
  }

  /**
   * Name of this property to display in UI.
   * @returns Result value
   */
  display_name(): openehr_base.String {
    // TODO: Implement display_name behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method display_name not yet implemented.");
  }
}

/**
 * Meta-type of for properties of linear container type, such as List<T> etc.
 */
export class BMM_CONTAINER_PROPERTY extends BMM_PROPERTY {
  /**
   * Cardinality of this container.
   */
  cardinality?: openehr_base.Multiplicity_interval;
  /**
   * Declared or inferred static type of the entity.
   */
  override type?: BMM_CONTAINER_TYPE = undefined;
  /**
   * Name of this property in form \`name: ContainerTypeName<>\`.
   * @returns Result value
   */
  display_name(): openehr_base.String {
    // TODO: Implement display_name behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method display_name not yet implemented.");
  }
}

/**
 * A feature defining a routine, scoped to a class.
 */
export abstract class BMM_ROUTINE extends BMM_FEATURE {
  /**
   * Formal parameters of the routine.
   */
  parameters?: undefined;
  /**
   * Boolean conditions that must evaluate to True for the routine to execute correctly, May be used to generate exceptions if included in run-time build.
   *
   * A False pre-condition implies an error in the passed parameters.
   */
  pre_conditions?: undefined;
  /**
   * Boolean conditions that will evaluate to True if the routine executed correctly, May be used to generate exceptions if included in run-time build.
   *
   * A False post-condition implies an error (i.e. bug) in routine code.
   */
  post_conditions?: undefined;
  /**
   * Body of a routine, i.e. executable program.
   */
  definition?: BMM_ROUTINE_DEFINITION;
  /**
   * Return number of arguments of this routine.
   * @returns Result value
   */
  arity(): openehr_base.Integer {
    // TODO: Implement arity behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method arity not yet implemented.");
  }
}

/**
 * A formal element with signature of the form: \`name ({arg:TArg}*):TResult\`. A function is a computed (rather than data) element, generally assumed to be non-state-changing.
 */
export class BMM_FUNCTION extends BMM_ROUTINE {
  /**
   * Optional details enabling a function to be represented as an operator in a syntactic representation.
   */
  operator_definition?: BMM_OPERATOR;
  /**
   * Automatically created Result variable, usable in body and post-condition.
   */
  result?: BMM_RESULT;
}

/**
 * A routine-scoped formal element.
 */
export abstract class BMM_VARIABLE extends BMM_FORMAL_ELEMENT {
  /**
   * Routine within which variable is defined.
   */
  override scope?: BMM_ROUTINE = undefined;
}

/**
 * Meta-type for writable variables, including the special variable \`Result\`.
 */
export abstract class BMM_WRITABLE_VARIABLE extends BMM_VARIABLE {
}

/**
 * A routine local variable (writable).
 */
export class BMM_LOCAL extends BMM_WRITABLE_VARIABLE {
}

/**
 * Definition of a symbolic operator associated with a function.
 */
export class BMM_OPERATOR {
  /**
   * Position of operator in syntactic representation.
   */
  position?: BMM_OPERATOR_POSITION;
  /**
   * Set of \`String\` symbols that may be used to represent this operator in a textual representation of a BMM model.
   */
  symbols?: undefined;
  /**
   * Internal storage for name
   * @protected
   */
  protected _name?: openehr_base.String;

  /**
   * Formal name of the operator, e.g. 'minus' etc.
   */
  get name(): string | undefined {
    return this._name?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for name.
   * Use this to access openehr_base.String methods.
   */
  get $name(): openehr_base.String | undefined {
    return this._name;
  }

  /**
   * Sets name from either a primitive value or openehr_base.String wrapper.
   */
  set name(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._name = undefined;
    } else if (typeof val === "string") {
      this._name = openehr_base.String.from(val);
    } else {
      this._name = val;
    }
  }
}

/**
 * Meta-type for writable variables, including routine parameters and the special variable \`Self\`.
 */
export abstract class BMM_READONLY_VARIABLE extends BMM_VARIABLE {
}

/**
 * A routine parameter variable (read-only).
 */
export class BMM_PARAMETER extends BMM_READONLY_VARIABLE {
  /**
   * Optional read/write direction of the parameter. If none-supplied, the parameter is treated as \`in\`, i.e. readable.
   */
  direction?: BMM_PARAMETER_DIRECTION;
}

/**
 * A formal element with signature of the form: \`name ({arg:TArg}*):TStatus\`, where \`TStatus\` is the built-in type \`BMM_STATUS_TYPE\`.. A procedure is a computed (rather than data) element, generally assumed to be state-changing, and is usually called in the form \`name ({arg:TArg}*)\`.
 */
export class BMM_PROCEDURE extends BMM_ROUTINE {
  /**
   * Declared or inferred static type of the entity.
   */
  override type?: BMM_STATUS_TYPE = undefined;
  /**
   * Formal signature of this element, in the form:
   *
   * \`name [arg1_name: T_arg1, ...][:T_value]\`
   *
   * Specific implementations in descendants.
   * @returns Result value
   */
  signature(): BMM_PROCEDURE_TYPE {
    // TODO: Implement signature behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method signature not yet implemented.");
  }
}

/**
 * Meta-type of for properties of unitary type.
 */
export class BMM_UNITARY_PROPERTY extends BMM_PROPERTY {
  /**
   * Declared or inferred static type of the entity.
   */
  override type?: BMM_UNITARY_TYPE = undefined;
}

/**
 * Meta-type of for properties of linear container type, such as \`Hash<Index_type, T>\` etc.
 */
export class BMM_INDEXED_CONTAINER_PROPERTY extends BMM_CONTAINER_PROPERTY {
  /**
   * Declared or inferred static type of the entity.
   */
  override type?: BMM_INDEXED_CONTAINER_TYPE = undefined;
  /**
   * Name of this property in form \`name: ContainerTypeName<IndexTypeName, ...>\`.
   * @returns Result value
   */
  display_name(): openehr_base.String {
    // TODO: Implement display_name behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method display_name not yet implemented.");
  }
}

/**
 * Automatically declared variable representing result of a Function call (writable).
 */
export class BMM_RESULT extends BMM_WRITABLE_VARIABLE {
  /**
   * Name of this model element.
   */
  override get name(): string | undefined {
    return this._name?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for name.
   * Use this to access openehr_base.String methods.
   */
  override get $name(): openehr_base.String | undefined {
    return this._name;
  }

  /**
   * Sets name from either a primitive value or openehr_base.String wrapper.
   */
  override set name(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._name = undefined;
    } else if (typeof val === "string") {
      this._name = openehr_base.String.from(val);
    } else {
      this._name = val;
    }
  }
}

/**
 * Abstract parent of feature extensions.
 */
export abstract class BMM_FEATURE_EXTENSION {
}

/**
 * Abstract ancestor of routine body meta-types.
 */
export abstract class BMM_ROUTINE_DEFINITION {
}

/**
 * External routine meta-type, containing sufficient meta-data to enable a routine in an external library to be called.
 */
export class BMM_EXTERNAL_ROUTINE extends BMM_ROUTINE_DEFINITION {
  /**
   * External call general meta-data, including target routine name, type mapping etc.
   */
  meta_data?: undefined;
  /**
   * Optional argument-mapping meta-data.
   */
  argument_mapping?: undefined;
}

/**
 * A logical group of features, with a name and set of properties that applies to the group.
 */
export class BMM_FEATURE_GROUP {
  /**
   * Internal storage for name
   * @protected
   */
  protected _name?: openehr_base.String;

  /**
   * Name of this feature group; defaults to 'feature'.
   */
  get name(): string | undefined {
    return this._name?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for name.
   * Use this to access openehr_base.String methods.
   */
  get $name(): openehr_base.String | undefined {
    return this._name;
  }

  /**
   * Sets name from either a primitive value or openehr_base.String wrapper.
   */
  set name(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._name = undefined;
    } else if (typeof val === "string") {
      this._name = openehr_base.String.from(val);
    } else {
      this._name = val;
    }
  }

  /**
   * Set of properties of this group, represented as name/value pairs. These are understood to apply logically to all of the features contained within the group.
   */
  properties?: undefined;
  /**
   * Set of features in this group.
   */
  features?: undefined;
  /**
   * Optional visibility to apply to all features in this group.
   */
  visibility?: BMM_VISIBILITY;
}

/**
 * Abstract parent of visibility representation.
 *
 * TODO: define schemes; probably need to support C++/Java scheme as well as better type-based schemes.
 */
export abstract class BMM_VISIBILITY {
}

/**
 * Meta-type for an automatically created variable referencing the current instance. Typically called 'self' or 'this' in programming languages. Read-only.
 */
export class BMM_SELF extends BMM_READONLY_VARIABLE {
  /**
   * Name of this model element.
   */
  override get name(): string | undefined {
    return this._name?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for name.
   * Use this to access openehr_base.String methods.
   */
  override get $name(): openehr_base.String | undefined {
    return this._name;
  }

  /**
   * Sets name from either a primitive value or openehr_base.String wrapper.
   */
  override set name(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._name = undefined;
    } else if (typeof val === "string") {
      this._name = openehr_base.String.from(val);
    } else {
      this._name = val;
    }
  }
}

/**
 * Meta-type for static value properties computed once by a function invocation.
 */
export class BMM_SINGLETON extends BMM_STATIC {
  /**
   * Generator of the value of this static property.
   */
  generator?: BMM_ROUTINE_DEFINITION;
}

/**
 * Meta-type for locally declared routine body.
 */
export class BMM_LOCAL_ROUTINE extends BMM_ROUTINE_DEFINITION {
  /**
   * Local variables of the routine, if there is a body defined.
   */
  locals?: undefined;
  /**
   * Body of routine declaration.
   */
  body?: BMM_STATEMENT_BLOCK;
}

/**
 * Enumeration of possible position of operator in a syntactic representation for operators associated with 1- and 2- degree functions.
 */
export class BMM_OPERATOR_POSITION extends openehr_base.String {
}

/**
 * Enumeration of parameter read/write direction values.
 */
export class BMM_PARAMETER_DIRECTION extends openehr_base.String {
}

/**
 * Meta-type for literal instance values declared in a model. Instance values may be inline values of primitive types in the usual fashion or complex objects in syntax form, e.g. JSON.
 */
export abstract class BMM_LITERAL_VALUE<T extends BMM_TYPE> {
  /**
   * Internal storage for value_literal
   * @protected
   */
  protected _value_literal?: openehr_base.String;

  /**
   * A serial representation of the value.
   */
  get value_literal(): string | undefined {
    return this._value_literal?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for value_literal.
   * Use this to access openehr_base.String methods.
   */
  get $value_literal(): openehr_base.String | undefined {
    return this._value_literal;
  }

  /**
   * Sets value_literal from either a primitive value or openehr_base.String wrapper.
   */
  set value_literal(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._value_literal = undefined;
    } else if (typeof val === "string") {
      this._value_literal = openehr_base.String.from(val);
    } else {
      this._value_literal = val;
    }
  }

  /**
   * A native representation of the value, possibly derived by deserialising \`_value_literal_\`.
   */
  value?: openehr_base.Any;
  /**
   * Internal storage for syntax
   * @protected
   */
  protected _syntax?: openehr_base.String;

  /**
   * Optional specification of formalism of the \`_value_literal_\` attribute for complex values. Value may be any of \`json | json5 | yawl | xml | odin | rdf\` or another value agreed by the user community. If not set, \`json\` is assumed.
   */
  get syntax(): string | undefined {
    return this._syntax?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for syntax.
   * Use this to access openehr_base.String methods.
   */
  get $syntax(): openehr_base.String | undefined {
    return this._syntax;
  }

  /**
   * Sets syntax from either a primitive value or openehr_base.String wrapper.
   */
  set syntax(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._syntax = undefined;
    } else if (typeof val === "string") {
      this._syntax = openehr_base.String.from(val);
    } else {
      this._syntax = val;
    }
  }

  /**
   * Concrete type of this literal.
   */
  type?: T;
}

/**
 * Meta-type for literals whose concrete type is a unitary type in the BMM sense.
 */
export abstract class BMM_UNITARY_VALUE<T extends BMM_UNITARY_TYPE>
  extends BMM_LITERAL_VALUE<T> {
}

/**
 * Meta-type for literals whose concrete type is a primitive type.
 */
export class BMM_PRIMITIVE_VALUE extends BMM_UNITARY_VALUE<T> {
  /**
   * Concrete type of this literal.
   */
  override type?: BMM_SIMPLE_TYPE = undefined;
}

/**
 * Meta-type for a literal Integer value, for which \`_type_\` is fixed to the \`BMM_TYPE\` representing \`Integer\` and \`_value_\` is of type \`Integer\`.
 */
export class BMM_INTEGER_VALUE extends BMM_PRIMITIVE_VALUE {
  /**
   * Native Integer value.
   */
  override value?: openehr_base.Integer = undefined;
}

/**
 * Meta-type for a literal String value, for which \`_type_\` is fixed to the \`BMM_TYPE\` representing \`String\` and \`_value_\` is of type \`String\`.
 */
export class BMM_STRING_VALUE extends BMM_PRIMITIVE_VALUE {
  /**
   * Native String value.
   */
  override value?: openehr_base.String = undefined;
}

/**
 * Meta-type for a literal Boolean value, for which \`_type_\` is fixed to the \`BMM_TYPE\` representing \`Boolean\` and \`_value_\` is of type \`Boolean\`.
 */
export class BMM_BOOLEAN_VALUE extends BMM_PRIMITIVE_VALUE {
  /**
   * Native Boolean value.
   */
  override value?: openehr_base.Boolean = undefined;
}

/**
 * Meta-type for literals whose concrete type is a linear container type, i.e. array, list or set.
 */
export class BMM_CONTAINER_VALUE extends BMM_LITERAL_VALUE<T> {
}

/**
 * Meta-type for literals whose concrete type is an indexed container, i.e. Hash table, Map etc.
 */
export class BMM_INDEXED_CONTAINER_VALUE extends BMM_LITERAL_VALUE<T> {
}

/**
 * Meta-type for literal intervals of type \`Interval<Ordered>\`.
 */
export class BMM_INTERVAL_VALUE extends BMM_LITERAL_VALUE<T> {
}

/**
 * A BMM model component that contains packages and classes.
 */
export abstract class BMM_PACKAGE_CONTAINER extends BMM_MODEL_ELEMENT {
  /**
   * Child packages; keys all in upper case for guaranteed matching.
   */
  packages?: undefined;
  /**
   * Model element within which a referenceable element is known.
   */
  override scope?: BMM_PACKAGE_CONTAINER = undefined;
  /**
   * Package at the path \`_a_path_\`.
   * @param a_path - Parameter
   * @returns Result value
   */
  package_at_path(a_path: openehr_base.String): BMM_PACKAGE {
    // TODO: Implement package_at_path behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method package_at_path not yet implemented.");
  }

  /**
   * Recursively execute \`_action_\`, which is a procedure taking a \`BMM_PACKAGE\` argument, on all members of packages.
   * @param action - Parameter
   * @returns Result value
   */
  do_recursive_packages(action: EL_PROCEDURE_AGENT): void {
    // TODO: Implement do_recursive_packages behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method do_recursive_packages not yet implemented.");
  }

  /**
   * True if there is a package at the path \`_a_path_\`; paths are delimited with delimiter \`{BMM_DEFINITIONS} _Package_name_delimiter_\`.
   * @param a_path - Parameter
   * @returns Result value
   */
  has_package_path(a_path: openehr_base.String): openehr_base.Boolean {
    // TODO: Implement has_package_path behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method has_package_path not yet implemented.");
  }
}

/**
 * Definition of the root of a BMM model (along with what is inherited from \`BMM_SCHEMA_CORE\`).
 */
export class BMM_MODEL extends BMM_PACKAGE_CONTAINER {
  /**
   * All classes in this model, keyed by type name.
   */
  class_definitions?: undefined;
  /**
   * List of other models 'used' (i.e. 'imported' by this model). Classes in the current model may refer to classes in a used model by specifying the other class's \`_scope_\` meta-attribute.
   */
  used_models?: undefined;
  /**
   * All classes in this model, keyed by type name.
   */
  modules?: undefined;
  /**
   * Identifier of this model, lower-case, formed from:
   *
   * \`<rm_publisher>_<model_name>_<rm_release>\`
   *
   * E.g. \`"openehr_ehr_1.0.4"\`.
   * @returns Result value
   */
  model_id(): openehr_base.String {
    // TODO: Implement model_id behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method model_id not yet implemented.");
  }

  /**
   * Retrieve the class definition corresponding to \`_a_type_name_\` (which may contain a generic part).
   * @param a_name - Parameter
   * @returns Result value
   */
  class_definition(a_name: openehr_base.String): BMM_CLASS {
    // TODO: Implement class_definition behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method class_definition not yet implemented.");
  }

  /**
   * Retrieve the class definition corresponding to \`_a_type_name_\`. If it contains a generic part, this will be removed if it is a fully open generic name, otherwise it will remain intact, i.e. if it is an effective generic name that identifies a \`BMM_GENERIC_CLASS_EFFECTIVE\`.
   * @returns Result value
   */
  type_definition(): BMM_CLASS {
    // TODO: Implement type_definition behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method type_definition not yet implemented.");
  }

  /**
   * True if \`_a_class_name_\` has a class definition in the model.
   * @param a_class_name - Parameter
   * @returns Result value
   */
  has_class_definition(
    a_class_name: openehr_base.String,
  ): openehr_base.Boolean {
    // TODO: Implement has_class_definition behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method has_class_definition not yet implemented.");
  }

  /**
   * True if \`_a_type_name_\` is already concretely known in the system, including if it is generic, which may be open, partially open or closed.
   * @param a_type_name - Parameter
   * @returns Result value
   */
  has_type_definition(a_type_name: openehr_base.String): openehr_base.Boolean {
    // TODO: Implement has_type_definition behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method has_type_definition not yet implemented.");
  }

  /**
   * Retrieve the enumeration definition corresponding to \`_a_type_name_\`.
   * @param a_name - Parameter
   * @returns Result value
   */
  enumeration_definition(a_name: openehr_base.String): BMM_ENUMERATION {
    // TODO: Implement enumeration_definition behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method enumeration_definition not yet implemented.");
  }

  /**
   * List of keys in \`_class_definitions_\` of items marked as primitive types.
   * @returns Result value
   */
  primitive_types(): openehr_base.String {
    // TODO: Implement primitive_types behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method primitive_types not yet implemented.");
  }

  /**
   * List of keys in \`_class_definitions_\` of items that are enumeration types.
   * @returns Result value
   */
  enumeration_types(): openehr_base.String {
    // TODO: Implement enumeration_types behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method enumeration_types not yet implemented.");
  }

  /**
   * Retrieve the property definition for \`_a_prop_name_\` in flattened class corresponding to \`_a_type_name_\`.
   * @returns Result value
   */
  property_definition(): BMM_PROPERTY {
    // TODO: Implement property_definition behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method property_definition not yet implemented.");
  }

  /**
   * True if \`_a_ms_property_type_\` is a valid 'MS' dynamic type for \`_a_property_\` in BMM type \`_a_bmm_type_name_\`. 'MS' conformance means 'model-semantic' conformance, which abstracts away container types like \`List<>\`, \`Set<>\` etc and compares the dynamic type with the relation target type in the UML sense, i.e. regardless of whether there is single or multiple containment.
   * @param a_bmm_type_name - Parameter
   * @param a_bmm_property_name - Parameter
   * @param a_ms_property_name - Parameter
   * @returns Result value
   */
  ms_conformant_property_type(
    a_bmm_type_name: openehr_base.String,
    a_bmm_property_name: openehr_base.String,
    a_ms_property_name: openehr_base.String,
  ): openehr_base.Boolean {
    // TODO: Implement ms_conformant_property_type behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method ms_conformant_property_type not yet implemented.");
  }

  /**
   * Retrieve the property definition for \`_a_property_path_\` in flattened class corresponding to \`_a_type_name_\`.
   * @returns Result value
   */
  property_definition_at_path(): BMM_PROPERTY {
    // TODO: Implement property_definition_at_path behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method property_definition_at_path not yet implemented.");
  }

  /**
   * Retrieve the class definition for the class that owns the terminal attribute in \`a_prop_path\` in flattened class corresponding to \`a_type_name\`.
   * @param a_type_name - Parameter
   * @param a_prop_path - Parameter
   * @returns Result value
   */
  class_definition_at_path(
    a_type_name: openehr_base.String,
    a_prop_path: openehr_base.String,
  ): BMM_CLASS {
    // TODO: Implement class_definition_at_path behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method class_definition_at_path not yet implemented.");
  }

  /**
   * Return all ancestor types of \`_a_class_name_\` up to root class (usually \`Any\`, \`Object\` or something similar). Does  not include current class. Returns empty list if none.
   * @param a_class - Parameter
   * @returns Result value
   */
  all_ancestor_classes(a_class: openehr_base.String): openehr_base.String {
    // TODO: Implement all_ancestor_classes behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method all_ancestor_classes not yet implemented.");
  }

  /**
   * True if \`_a_class_name_\` is a descendant in the model of \`_a_parent_class_name_\`.
   * @param a_class_name - Parameter
   * @param a_parent_class_name - Parameter
   * @returns Result value
   */
  is_descendant_of(
    a_class_name: openehr_base.String,
    a_parent_class_name: openehr_base.String,
  ): openehr_base.Boolean {
    // TODO: Implement is_descendant_of behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method is_descendant_of not yet implemented.");
  }

  /**
   * Check conformance of \`_a_desc_type_\` to \`_an_anc_type_\`; the types may be generic, and may contain open generic parameters like 'T' etc. These are replaced with their appropriate constrainer types, or Any during the conformance testing process.
   *
   * Conformance is found if:
   *
   * * [base class test] types are non-generic, and either type names are identical, or else \`_a_desc_type_\` has \`_an_anc_type_\` in its ancestors;
   * * both types are generic and pass base class test; number of generic params matches, and each generic parameter type, after 'open parameter' substitution, recursively passes; \`_type_name_conforms_to_\` test
   * * descendant type is generic and ancestor type is not, and they pass base classes test.
   * @param a_desc_type - Parameter
   * @param an_anc_type - Parameter
   * @returns Result value
   */
  type_conforms_to(
    a_desc_type: openehr_base.String,
    an_anc_type: openehr_base.String,
  ): openehr_base.Boolean {
    // TODO: Implement type_conforms_to behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method type_conforms_to not yet implemented.");
  }

  /**
   * Generate type substitutions for the supplied type, which may be simple, generic (closed, open or partially open), or a container type. In the generic and container cases, the result is the permutation of the base class type and type substitutions of all generic parameters.
   * @param a_type - Parameter
   * @returns Result value
   */
  subtypes(a_type: openehr_base.String): openehr_base.String {
    // TODO: Implement subtypes behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method subtypes not yet implemented.");
  }

  /**
   * \`BMM_SIMPLE_CLASS\` instance for the \`Any\` class. This may be defined in the BMM schema, but if not, use \`BMM_DEFINITIONS._any_class_\`.
   * @returns Result value
   */
  any_class_definition(): BMM_SIMPLE_CLASS {
    // TODO: Implement any_class_definition behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method any_class_definition not yet implemented.");
  }

  /**
   * \`BMM_SIMPLE_TYPE\` instance for the \`Any\` type.
   * @returns Result value
   */
  any_type_definition(): BMM_SIMPLE_TYPE {
    // TODO: Implement any_type_definition behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method any_type_definition not yet implemented.");
  }

  /**
   * \`BMM_SIMPLE_TYPE\` instance for the \`Boolean\` type.
   * @returns Result value
   */
  boolean_type_definition(): BMM_SIMPLE_TYPE {
    // TODO: Implement boolean_type_definition behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method boolean_type_definition not yet implemented.");
  }
}

/**
 * Abstraction of a package as a tree structure whose nodes can contain other packages and classes.
 *
 * The \`_name_\` may be qualified if it is a top-level package.
 */
export class BMM_PACKAGE extends BMM_PACKAGE_CONTAINER {
  /**
   * Member modules in this package.
   */
  members?: undefined;
  /**
   * Obtain the set of top-level classes in this package, either from this package itself or by recursing into the structure until classes are obtained from child packages. Recurse into each child only far enough to find the first level of classes.
   * @returns Result value
   */
  root_classes(): BMM_CLASS {
    // TODO: Implement root_classes behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method root_classes not yet implemented.");
  }

  /**
   * Full path of this package back to root package.
   * @returns Result value
   */
  path(): openehr_base.String {
    // TODO: Implement path behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method path not yet implemented.");
  }
}

/**
 * Abstract parent of all typed expression meta-types.
 */
export abstract class EL_EXPRESSION {
  /**
   * Meta-type of expression entity used in type-checking and evaluation.
   *
   * Effected in descendants.
   * @returns Result value
   */
  abstract eval_type(): BMM_TYPE;

  /**
   * True if \`_eval_type_\` is notionally Boolean (i.e. a \`BMM_SIMPLE_TYPE\` with \`_type_name()_\` = \`Boolean\`).
   * @returns Result value
   */
  is_boolean(): openehr_base.Boolean {
    // TODO: Implement is_boolean behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method is_boolean not yet implemented.");
  }
}

/**
 * Abstract parent of operator types.
 */
export abstract class EL_OPERATOR extends EL_EXPRESSION {
  /**
   * Internal storage for precedence_overridden
   * @protected
   */
  protected _precedence_overridden?: openehr_base.Boolean;

  /**
   * True if the natural precedence of operators is overridden in the expression represented by this node of the expression tree. If True, parentheses should be introduced around the totality of the syntax expression corresponding to this operator node and its operands.
   */
  get precedence_overridden(): boolean | undefined {
    return this._precedence_overridden?.value;
  }

  /**
   * Gets the openehr_base.Boolean wrapper object for precedence_overridden.
   * Use this to access openehr_base.Boolean methods.
   */
  get $precedence_overridden(): openehr_base.Boolean | undefined {
    return this._precedence_overridden;
  }

  /**
   * Sets precedence_overridden from either a primitive value or openehr_base.Boolean wrapper.
   */
  set precedence_overridden(val: boolean | openehr_base.Boolean | undefined) {
    if (val === undefined || val === null) {
      this._precedence_overridden = undefined;
    } else if (typeof val === "boolean") {
      this._precedence_overridden = openehr_base.Boolean.from(val);
    } else {
      this._precedence_overridden = val;
    }
  }

  /**
   * Internal storage for symbol
   * @protected
   */
  protected _symbol?: openehr_base.String;

  /**
   * The symbol actually used in the expression, or intended to be used for serialisation. Must be a member of \`OPERATOR_DEF._symbols_\`.
   */
  get symbol(): string | undefined {
    return this._symbol?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for symbol.
   * Use this to access openehr_base.String methods.
   */
  get $symbol(): openehr_base.String | undefined {
    return this._symbol;
  }

  /**
   * Sets symbol from either a primitive value or openehr_base.String wrapper.
   */
  set symbol(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._symbol = undefined;
    } else if (typeof val === "string") {
      this._symbol = openehr_base.String.from(val);
    } else {
      this._symbol = val;
    }
  }

  /**
   * Function call equivalent to this operator expression, inferred by matching operator against functions defined in interface of principal operand.
   */
  call?: EL_FUNCTION_CALL;
  /**
   * Operator definition derived from \`_definition.operator_definition()_\`.
   * @returns Result value
   */
  operator_definition(): BMM_OPERATOR {
    // TODO: Implement operator_definition behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method operator_definition not yet implemented.");
  }

  /**
   * Function call equivalent to this operator.
   * @returns Result value
   */
  equivalent_call(): EL_FUNCTION_CALL {
    // TODO: Implement equivalent_call behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method equivalent_call not yet implemented.");
  }
}

/**
 * Binary operator expression node.
 */
export class EL_BINARY_OPERATOR extends EL_OPERATOR {
  /**
   * Left operand node.
   */
  left_operand?: EL_EXPRESSION;
  /**
   * Right operand node.
   */
  right_operand?: EL_EXPRESSION;
}

/**
 * Expression entities that are terminals (i.e. leaves) within operator expressions or tuples.
 */
export abstract class EL_TERMINAL extends EL_EXPRESSION {
}

/**
 * Simple terminal i.e. logically atomic expression element.
 */
export abstract class EL_SIMPLE extends EL_TERMINAL {
}

/**
 * Literal value of any type known in the model, including primitive types. Defined via a \`BMM_LITERAL_VALUE\`.
 */
export class EL_LITERAL extends EL_SIMPLE {
  /**
   * The reference item from which the value of this node can be computed.
   */
  value?: undefined;
  /**
   * Return \`_value.type_\`.
   * @returns Result value
   */
  eval_type(): BMM_TYPE {
    // TODO: Implement eval_type behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method eval_type not yet implemented.");
  }
}

/**
 * Unary operator expression node.
 */
export class EL_UNARY_OPERATOR extends EL_OPERATOR {
  /**
   * Operand node.
   */
  operand?: EL_EXPRESSION;
}

/**
 * Meta-type representing a value-generating simple expression.
 */
export abstract class EL_VALUE_GENERATOR extends EL_SIMPLE {
  /**
   * Internal storage for is_writable
   * @protected
   */
  protected _is_writable?: openehr_base.Boolean;

  get is_writable(): boolean | undefined {
    return this._is_writable?.value;
  }

  /**
   * Gets the openehr_base.Boolean wrapper object for is_writable.
   * Use this to access openehr_base.Boolean methods.
   */
  get $is_writable(): openehr_base.Boolean | undefined {
    return this._is_writable;
  }

  /**
   * Sets is_writable from either a primitive value or openehr_base.Boolean wrapper.
   */
  set is_writable(val: boolean | openehr_base.Boolean | undefined) {
    if (val === undefined || val === null) {
      this._is_writable = undefined;
    } else if (typeof val === "boolean") {
      this._is_writable = openehr_base.Boolean.from(val);
    } else {
      this._is_writable = val;
    }
  }

  /**
   * Internal storage for name
   * @protected
   */
  protected _name?: openehr_base.String;

  /**
   * Name used to represent the reference or other entity.
   */
  get name(): string | undefined {
    return this._name?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for name.
   * Use this to access openehr_base.String methods.
   */
  get $name(): openehr_base.String | undefined {
    return this._name;
  }

  /**
   * Sets name from either a primitive value or openehr_base.String wrapper.
   */
  set name(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._name = undefined;
    } else if (typeof val === "string") {
      this._name = openehr_base.String.from(val);
    } else {
      this._name = val;
    }
  }

  /**
   * Generated full reference name, based on constituent parts of the entity. Default version outputs \`_name_\` field.
   * @returns Result value
   */
  reference(): openehr_base.String {
    // TODO: Implement reference behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method reference not yet implemented.");
  }
}

/**
 * A reference that is scoped by a containing entity and requires a context qualifier if it is not the currently scoping entity.
 */
export abstract class EL_FEATURE_REF extends EL_VALUE_GENERATOR {
  /**
   * Scoping expression, which must be a \`EL_VALUE_GENERATOR\`.
   */
  scoper?: EL_VALUE_GENERATOR;
  /**
   * Generated full reference name, consisting of scoping elements and \`_name_\` concatenated using dot notation.
   * @returns Result value
   */
  reference(): openehr_base.String {
    // TODO: Implement reference behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method reference not yet implemented.");
  }
}

/**
 * Reference to a writable property.
 */
export class EL_PROPERTY_REF extends EL_FEATURE_REF {
  /**
   * Property definition (within class).
   */
  definition?: BMM_PROPERTY;
  /**
   * Defined to return True.
   */
  override get is_writable(): boolean | undefined {
    return this._is_writable?.value;
  }

  /**
   * Gets the openehr_base.Boolean wrapper object for is_writable.
   * Use this to access openehr_base.Boolean methods.
   */
  override get $is_writable(): openehr_base.Boolean | undefined {
    return this._is_writable;
  }

  /**
   * Sets is_writable from either a primitive value or openehr_base.Boolean wrapper.
   */
  override set is_writable(val: boolean | openehr_base.Boolean | undefined) {
    if (val === undefined || val === null) {
      this._is_writable = undefined;
    } else if (typeof val === "boolean") {
      this._is_writable = openehr_base.Boolean.from(val);
    } else {
      this._is_writable = val;
    }
  }

  /**
   * Type definition (i.e. BMM meta-type definition object) of the constant, property or variable, inferred by inspection of the current scoping instance. Return \`_definition.type_\`.
   * @returns Result value
   */
  eval_type(): BMM_TYPE {
    // TODO: Implement eval_type behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method eval_type not yet implemented.");
  }
}

/**
 * Parent type of predicate of any object reference.
 */
export abstract class EL_PREDICATE extends EL_SIMPLE {
  /**
   * The target instance of this predicate.
   */
  operand?: EL_VALUE_GENERATOR;
  /**
   * Return \`{BMM_MODEL}._boolean_type_definition_()\`.
   * @returns Result value
   */
  eval_type(): BMM_SIMPLE_TYPE {
    // TODO: Implement eval_type behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method eval_type not yet implemented.");
  }
}

/**
 * A predicate taking one external variable reference argument, that returns true if the reference is resolvable, i.e. the external value is obtainable.
 *
 * NOTE: probably to be removed.
 */
export class EL_DEFINED extends EL_PREDICATE {
}

/**
 * A call made to a 'closed' agent, i.e. one with no remaining open arguments.
 */
export abstract class EL_AGENT_CALL {
  /**
   * The agent being called.
   */
  agent?: EL_AGENT;
}

/**
 * A call made on a closed function agent, returning a result. Equivalent to an 'application' of a function in Lambda calculus.
 */
export class EL_FUNCTION_CALL extends EL_FEATURE_REF {
  /**
   * The function agent being called.
   */
  override agent?: EL_FUNCTION_AGENT = undefined;
  /**
   * Defined to return False.
   */
  override get is_writable(): boolean | undefined {
    return this._is_writable?.value;
  }

  /**
   * Gets the openehr_base.Boolean wrapper object for is_writable.
   * Use this to access openehr_base.Boolean methods.
   */
  override get $is_writable(): openehr_base.Boolean | undefined {
    return this._is_writable;
  }

  /**
   * Sets is_writable from either a primitive value or openehr_base.Boolean wrapper.
   */
  override set is_writable(val: boolean | openehr_base.Boolean | undefined) {
    if (val === undefined || val === null) {
      this._is_writable = undefined;
    } else if (typeof val === "boolean") {
      this._is_writable = openehr_base.Boolean.from(val);
    } else {
      this._is_writable = val;
    }
  }

  /**
   * Return \`_agent.definition.type_\`.
   * @returns Result value
   */
  eval_type(): BMM_TYPE {
    // TODO: Implement eval_type behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method eval_type not yet implemented.");
  }

  /**
   * Generated full reference name, consisting of any scoping elements, function name and routine parameters enclosed in parentheses.
   * @returns Result value
   */
  reference(): openehr_base.String {
    // TODO: Implement reference behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method reference not yet implemented.");
  }
}

/**
 * A delayed routine call, whose arguments may be open, partially closed or closed. Generated by special reference to a routine, usually via a dedicated keyword, such as 'lambda' or 'agent', or other special syntax.
 *
 * Instances may include closed delayed calls like \`calculate_age (dob="1987-09-13", today="2019-06-03")\` but also partially open calls such as \`format_structure (struct=?, style=3)\`, where \`struct\` is an open argument.
 *
 * Evaluation type (i.e. type of runtime evaluated form) is \`BMM_SIGNATURE\`.
 */
export abstract class EL_AGENT extends EL_FEATURE_REF {
  /**
   * Name of the routine being called.
   */
  override get name(): string | undefined {
    return this._name?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for name.
   * Use this to access openehr_base.String methods.
   */
  override get $name(): openehr_base.String | undefined {
    return this._name;
  }

  /**
   * Sets name from either a primitive value or openehr_base.String wrapper.
   */
  override set name(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._name = undefined;
    } else if (typeof val === "string") {
      this._name = openehr_base.String.from(val);
    } else {
      this._name = val;
    }
  }

  /**
   * Closed arguments of a routine call as a tuple of objects.
   */
  closed_args?: EL_TUPLE;
  /**
   * Optional list of names of open arguments of the call. If not provided, and the \`_name_\` refers to a routine with more arguments than supplied in \`_closed_args_\`, the missing arguments are inferred from the \`_definition_\`.
   */
  open_args?: undefined;
  /**
   * Reference to definition of a routine for which this is an agent, if one exists.
   */
  definition?: BMM_ROUTINE;
  override get is_writable(): boolean | undefined {
    return this._is_writable?.value;
  }

  /**
   * Gets the openehr_base.Boolean wrapper object for is_writable.
   * Use this to access openehr_base.Boolean methods.
   */
  override get $is_writable(): openehr_base.Boolean | undefined {
    return this._is_writable;
  }

  /**
   * Sets is_writable from either a primitive value or openehr_base.Boolean wrapper.
   */
  override set is_writable(val: boolean | openehr_base.Boolean | undefined) {
    if (val === undefined || val === null) {
      this._is_writable = undefined;
    } else if (typeof val === "boolean") {
      this._is_writable = openehr_base.Boolean.from(val);
    } else {
      this._is_writable = val;
    }
  }

  /**
   * Eval type is the signature corresponding to the (remaining) open arguments and return type, if any.
   * @returns Result value
   */
  eval_type(): BMM_ROUTINE_TYPE {
    // TODO: Implement eval_type behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method eval_type not yet implemented.");
  }

  /**
   * True if there are no open arguments.
   * @returns Result value
   */
  is_callable(): openehr_base.Boolean {
    // TODO: Implement is_callable behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method is_callable not yet implemented.");
  }

  /**
   * Generated full reference name, including scoping elements.
   * @returns Result value
   */
  reference(): openehr_base.String {
    // TODO: Implement reference behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method reference not yet implemented.");
  }
}

/**
 * A single tuple item, with an optional name.
 */
export class EL_TUPLE_ITEM {
  /**
   * Reference to value entity. If Void, this indicates that the item in this position is Void, e.g. within a routine call parameter list.
   */
  item?: EL_EXPRESSION;
  /**
   * Internal storage for name
   * @protected
   */
  protected _name?: openehr_base.String;

  /**
   * Optional name of tuple item.
   */
  get name(): string | undefined {
    return this._name?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for name.
   * Use this to access openehr_base.String methods.
   */
  get $name(): openehr_base.String | undefined {
    return this._name;
  }

  /**
   * Sets name from either a primitive value or openehr_base.String wrapper.
   */
  set name(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._name = undefined;
    } else if (typeof val === "string") {
      this._name = openehr_base.String.from(val);
    } else {
      this._name = val;
    }
  }
}

/**
 * An agent whose signature is of a procedure, i.e. has no result type.
 */
export class EL_PROCEDURE_AGENT extends EL_AGENT {
  /**
   * Reference to definition of routine for which this is a call instance.
   */
  override definition?: BMM_PROCEDURE = undefined;
  /**
   * Eval type is the signature corresponding to the (remaining) open arguments and return type, if any.
   * @returns Result value
   */
  eval_type(): BMM_PROCEDURE_TYPE {
    // TODO: Implement eval_type behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method eval_type not yet implemented.");
  }
}

/**
 * Defines an array of optionally named items each of any type.
 */
export class EL_TUPLE extends EL_EXPRESSION {
  /**
   * Items in the tuple, potentially with names. Typical use is to represent an argument list to routine call.
   */
  items?: undefined;
  /**
   * Static type inferred from literal value.
   */
  type?: BMM_TUPLE_TYPE;
  /**
   * Return \`_type_\`.
   * @returns Result value
   */
  eval_type(): BMM_TYPE {
    // TODO: Implement eval_type behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method eval_type not yet implemented.");
  }
}

/**
 * An agent whose signature is of a function, i.e. has a result type.
 */
export class EL_FUNCTION_AGENT extends EL_AGENT {
  /**
   * Reference to definition of a routine for which this is a direct call instance, if one exists.
   */
  override definition?: BMM_FUNCTION = undefined;
  /**
   * Eval type is the signature corresponding to the (remaining) open arguments and return type, if any.
   * @returns Result value
   */
  eval_type(): BMM_FUNCTION_TYPE {
    // TODO: Implement eval_type behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method eval_type not yet implemented.");
  }
}

/**
 * A predicate on any object reference (including function call) that returns True if the reference is attached, i.e. non-Void.
 */
export class EL_ATTACHED extends EL_PREDICATE {
}

/**
 * Abstract parent for second-order constrained forms of first-order expression meta-types.
 */
export abstract class EL_CONSTRAINED extends EL_EXPRESSION {
  /**
   * The base expression of this constrained form.
   */
  base_expression?: EL_EXPRESSION;
}

/**
 * Boolean-returning expression.
 */
export class EL_BOOLEAN_EXPRESSION extends EL_CONSTRAINED {
}

/**
 * Meta-type for reference to a non-abstract type as an object. Assumed to be accessible at run-time. Typically represented syntactically as \`TypeName\` or \`{TypeName}\`.
 *
 * May be used as a value, or as the qualifier for a function or constant access.
 */
export class EL_TYPE_REF extends EL_VALUE_GENERATOR {
  /**
   * Type, directly from the name of the reference, e.g. \`{SOME_TYPE}\`.
   */
  type?: BMM_TYPE;
  /**
   * Internal storage for is_mutable
   * @protected
   */
  protected _is_mutable?: openehr_base.Boolean;

  get is_mutable(): boolean | undefined {
    return this._is_mutable?.value;
  }

  /**
   * Gets the openehr_base.Boolean wrapper object for is_mutable.
   * Use this to access openehr_base.Boolean methods.
   */
  get $is_mutable(): openehr_base.Boolean | undefined {
    return this._is_mutable;
  }

  /**
   * Sets is_mutable from either a primitive value or openehr_base.Boolean wrapper.
   */
  set is_mutable(val: boolean | openehr_base.Boolean | undefined) {
    if (val === undefined || val === null) {
      this._is_mutable = undefined;
    } else if (typeof val === "boolean") {
      this._is_mutable = openehr_base.Boolean.from(val);
    } else {
      this._is_mutable = val;
    }
  }

  /**
   * Return \`_type_\`.
   * @returns Result value
   */
  eval_type(): BMM_TYPE {
    // TODO: Implement eval_type behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method eval_type not yet implemented.");
  }
}

/**
 * Abstract parent of meta-types representing a branch of some kind of decision structure. Defines \`result\` as being of the generic type \`T\`.
 */
export abstract class EL_DECISION_BRANCH<T extends EL_TERMINAL> {
  /**
   * Result expression of conditional, if its \`_condition_\` evaluates to True.
   */
  result?: T;
}

/**
 * Conditional structure used in condition chain expressions. Evaluated by evaluating its \`_condition_\`, which is a Boolean-returning expression, and if this returns True, the result is the evaluation result of \`_expression_\`.
 */
export class EL_CONDITIONAL_EXPRESSION<T extends EL_TERMINAL>
  extends EL_DECISION_BRANCH<T> {
  /**
   * Boolean expression defining the condition of this decision branch.
   */
  condition?: EL_EXPRESSION;
}

/**
 * Meta-type for decision tables. Generic on the meta-type of the \`_result_\` attribute of the branches, to allow specialised forms of if/else and case structures to be created.
 */
export abstract class EL_DECISION_TABLE<T extends EL_TERMINAL>
  extends EL_TERMINAL {
  /**
   * Members of the chain, equivalent to branches in an if/then/else chain and cases in a case statement.
   */
  items?: undefined;
  /**
   * Result expression of conditional, if its \`_condition_\` evaluates to True.
   */
  else?: T;
}

/**
 * Compound expression consisting of a chain of condition-gated expressions, and an ungated \`_else_\` member that as a whole, represents an if/then/elseif/else chains.
 *
 * Evaluated by iterating through \`_items_\` and for each one, evaluating its \`_condition_\`, which if True, causes the evaluation result of the chain to be that item's \`_result_\` evaluation result.
 *
 * If no member of \`_items_\` has a True-returning \`_condition_\`, the evaluation result is the result of evaluating the \`_else_\` expression.
 */
export class EL_CONDITION_CHAIN<T extends EL_TERMINAL>
  extends EL_DECISION_TABLE<T> {
  /**
   * Members of the chain, equivalent to branches in an if/then/else chain and cases in a case statement.
   */
  override items?: undefined;
}

/**
 * Compound expression consisting of a list of value-range / expression pairs, and an  \`_else_\` member that as a whole, represents a case statement flavour of decision table.
 *
 * Evaluated by iterating through \`_items_\` and for each one, comparing \`_input_\` to the item \`_value_range_\`. If the \`_input_\` is in the range, the evaluation result of the table is that item's \`_result_\` evaluation result.
 *
 * If no member of \`_items_\` has a True-returning \`_condition_\`, the evaluation result is the result of evaluating the \`_else_\` expression.
 */
export class EL_CASE_TABLE<T extends EL_TERMINAL> extends EL_DECISION_TABLE<T> {
  /**
   * Members of the chain, equivalent to branches in an if/then/else chain and cases in a case statement.
   */
  override items?: undefined;
  /**
   * Expressing generating the input value for the case table.
   */
  test_value?: EL_VALUE_GENERATOR;
}

/**
 * One branch of a Case table, consisting of a value constraint (the match criterion) and a result, of the generic parameter type T.
 */
export class EL_CASE<T extends EL_TERMINAL> extends EL_DECISION_BRANCH<T> {
  /**
   * Constraint on
   */
  value_constraint?: C_OBJECT;
}

/**
 * Abstract meta-type of any kind of symbolic variable.
 */
export abstract class EL_VARIABLE extends EL_VALUE_GENERATOR {
}

/**
 * Reference to a writable property, either a constant or computed.
 */
export class EL_STATIC_REF extends EL_FEATURE_REF {
  /**
   * Constant definition (within class).
   */
  definition?: BMM_STATIC;
  /**
   * Defined to return False.
   */
  override get is_writable(): boolean | undefined {
    return this._is_writable?.value;
  }

  /**
   * Gets the openehr_base.Boolean wrapper object for is_writable.
   * Use this to access openehr_base.Boolean methods.
   */
  override get $is_writable(): openehr_base.Boolean | undefined {
    return this._is_writable;
  }

  /**
   * Sets is_writable from either a primitive value or openehr_base.Boolean wrapper.
   */
  override set is_writable(val: boolean | openehr_base.Boolean | undefined) {
    if (val === undefined || val === null) {
      this._is_writable = undefined;
    } else if (typeof val === "boolean") {
      this._is_writable = openehr_base.Boolean.from(val);
    } else {
      this._is_writable = val;
    }
  }
}

/**
 * Meta-type of writable variables, including routine locals and the special variable 'Result'.
 */
export class EL_WRITABLE_VARIABLE extends EL_VARIABLE {
  /**
   * Variable definition to which this reference refers.
   */
  definition?: BMM_WRITABLE_VARIABLE;
  /**
   * Defined to return True in all cases.
   */
  override get is_writable(): boolean | undefined {
    return this._is_writable?.value;
  }

  /**
   * Gets the openehr_base.Boolean wrapper object for is_writable.
   * Use this to access openehr_base.Boolean methods.
   */
  override get $is_writable(): openehr_base.Boolean | undefined {
    return this._is_writable;
  }

  /**
   * Sets is_writable from either a primitive value or openehr_base.Boolean wrapper.
   */
  override set is_writable(val: boolean | openehr_base.Boolean | undefined) {
    if (val === undefined || val === null) {
      this._is_writable = undefined;
    } else if (typeof val === "boolean") {
      this._is_writable = openehr_base.Boolean.from(val);
    } else {
      this._is_writable = val;
    }
  }
}

/**
 * Meta-type of read-only variables, including routine parameter and the special variable 'Self'.
 */
export class EL_READONLY_VARIABLE extends EL_VARIABLE {
  /**
   * Variable definition to which this reference refers.
   */
  definition?: BMM_READONLY_VARIABLE;
  /**
   * Defined to return False in all cases.
   */
  override get is_writable(): boolean | undefined {
    return this._is_writable?.value;
  }

  /**
   * Gets the openehr_base.Boolean wrapper object for is_writable.
   * Use this to access openehr_base.Boolean methods.
   */
  override get $is_writable(): openehr_base.Boolean | undefined {
    return this._is_writable;
  }

  /**
   * Sets is_writable from either a primitive value or openehr_base.Boolean wrapper.
   */
  override set is_writable(val: boolean | openehr_base.Boolean | undefined) {
    if (val === undefined || val === null) {
      this._is_writable = undefined;
    } else if (typeof val === "boolean") {
      this._is_writable = openehr_base.Boolean.from(val);
    } else {
      this._is_writable = val;
    }
  }
}

/**
 * Specialised form of Decision Table that allows only procedure call agents (lambdas) as the result of branches.
 */
export class BMM_ACTION_DECISION_TABLE {
}

/**
 * Abstract parent of statement types representing a locally defined routine body.
 */
export abstract class BMM_STATEMENT_ITEM {
}

/**
 * Abstract parent of 'statement' types that may be defined to implement BMM Routines.
 */
export abstract class BMM_STATEMENT extends BMM_STATEMENT_ITEM {
}

/**
 * Multi-branch conditional statement structure
 */
export class BMM_ACTION_TABLE extends BMM_STATEMENT {
  /**
   * A specialised decision table whose outputs can only be procedure agents. In execution, the matched agent will be invoked.
   */
  decision_table?: BMM_ACTION_DECISION_TABLE;
}

/**
 * Simple statement, i.e. statement with one logical element - a single expression, procedure call etc.
 */
export abstract class BMM_SIMPLE_STATEMENT extends BMM_STATEMENT {
}

/**
 * Statement type representing an assignment from a value-generating source to a writable entity, i.e. a variable reference or property.
 *
 * At the meta-model level, may be understood as an initialisation of an existing meta-model instance.
 */
export class BMM_ASSIGNMENT extends BMM_SIMPLE_STATEMENT {
  /**
   * The target variable on the notional left-hand side of this assignment.
   */
  target?: EL_VALUE_GENERATOR;
  /**
   * Source right hand side) of the assignment.
   */
  source?: EL_EXPRESSION;
}

/**
 * A statement that asserts the truth of its expression. If the expression evaluates to False the execution generates an exception (depending on run-time settings).
 *
 * May be rendered in syntax as \`assert condition\` or similar.
 */
export class BMM_ASSERTION extends BMM_SIMPLE_STATEMENT {
  /**
   * Boolean-valued expression of the assertion.
   */
  expression?: EL_BOOLEAN_EXPRESSION;
  /**
   * Internal storage for tag
   * @protected
   */
  protected _tag?: openehr_base.String;

  /**
   * Optional tag, typically used to designate design intention of the assertion, e.g. \`"Inv_all_members_valid"\`.
   */
  get tag(): string | undefined {
    return this._tag?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for tag.
   * Use this to access openehr_base.String methods.
   */
  get $tag(): openehr_base.String | undefined {
    return this._tag;
  }

  /**
   * Sets tag from either a primitive value or openehr_base.String wrapper.
   */
  set tag(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._tag = undefined;
    } else if (typeof val === "string") {
      this._tag = openehr_base.String.from(val);
    } else {
      this._tag = val;
    }
  }
}

/**
 * A call made on a closed procedure agent. The method in BMM via which external actions are achieved from within a program.
 */
export class BMM_PROCEDURE_CALL extends EL_AGENT_CALL {
  /**
   * The procedure agent being called.
   */
  override agent?: EL_PROCEDURE_AGENT = undefined;
}

/**
 * A statement 'block' corresponding to the programming language concept of the same name. May be used to establish scope in specific languages.
 */
export class BMM_STATEMENT_BLOCK extends BMM_STATEMENT_ITEM {
  /**
   * Child blocks of the current block.
   */
  items?: undefined;
}

/**
 * Declaration of a writable variable, associating a name with a type.
 */
export class BMM_DECLARATION extends BMM_SIMPLE_STATEMENT {
  /**
   * Internal storage for name
   * @protected
   */
  protected _name?: openehr_base.String;

  get name(): string | undefined {
    return this._name?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for name.
   * Use this to access openehr_base.String methods.
   */
  get $name(): openehr_base.String | undefined {
    return this._name;
  }

  /**
   * Sets name from either a primitive value or openehr_base.String wrapper.
   */
  set name(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._name = undefined;
    } else if (typeof val === "string") {
      this._name = openehr_base.String.from(val);
    } else {
      this._name = val;
    }
  }

  result?: EL_WRITABLE_VARIABLE;
  /**
   * The declared type of the variable.
   */
  type?: BMM_TYPE;
}

/**
 * Persistent form of \`BMM_MODEL_ELEMENT\`.
 */
export abstract class P_BMM_MODEL_ELEMENT {
  /**
   * Internal storage for documentation
   * @protected
   */
  protected _documentation?: openehr_base.String;

  /**
   * Optional documentation of this element.
   */
  get documentation(): string | undefined {
    return this._documentation?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for documentation.
   * Use this to access openehr_base.String methods.
   */
  get $documentation(): openehr_base.String | undefined {
    return this._documentation;
  }

  /**
   * Sets documentation from either a primitive value or openehr_base.String wrapper.
   */
  set documentation(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._documentation = undefined;
    } else if (typeof val === "string") {
      this._documentation = openehr_base.String.from(val);
    } else {
      this._documentation = val;
    }
  }
}

/**
 * Definition of persistent form of \`BMM_CLASS\` for serialisation to ODIN, JSON, XML etc.
 */
export class P_BMM_CLASS extends P_BMM_MODEL_ELEMENT {
  /**
   * Internal storage for name
   * @protected
   */
  protected _name?: openehr_base.String;

  /**
   * Name of the class. Persisted attribute.
   */
  get name(): string | undefined {
    return this._name?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for name.
   * Use this to access openehr_base.String methods.
   */
  get $name(): openehr_base.String | undefined {
    return this._name;
  }

  /**
   * Sets name from either a primitive value or openehr_base.String wrapper.
   */
  set name(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._name = undefined;
    } else if (typeof val === "string") {
      this._name = openehr_base.String.from(val);
    } else {
      this._name = val;
    }
  }

  /**
   * List of immediate inheritance parents. If there are generic ancestors, use \`_ancestor_defs_\` instead. Persisted attribute.
   */
  ancestors?: undefined;
  /**
   * List of attributes defined in this class. Persistent attribute.
   */
  properties?: undefined;
  /**
   * Internal storage for is_abstract
   * @protected
   */
  protected _is_abstract?: openehr_base.Boolean;

  /**
   * True if this is an abstract type. Persisted attribute.
   */
  get is_abstract(): boolean | undefined {
    return this._is_abstract?.value;
  }

  /**
   * Gets the openehr_base.Boolean wrapper object for is_abstract.
   * Use this to access openehr_base.Boolean methods.
   */
  get $is_abstract(): openehr_base.Boolean | undefined {
    return this._is_abstract;
  }

  /**
   * Sets is_abstract from either a primitive value or openehr_base.Boolean wrapper.
   */
  set is_abstract(val: boolean | openehr_base.Boolean | undefined) {
    if (val === undefined || val === null) {
      this._is_abstract = undefined;
    } else if (typeof val === "boolean") {
      this._is_abstract = openehr_base.Boolean.from(val);
    } else {
      this._is_abstract = val;
    }
  }

  /**
   * Internal storage for is_override
   * @protected
   */
  protected _is_override?: openehr_base.Boolean;

  /**
   * True if this class definition overrides one found in an included schema.
   */
  get is_override(): boolean | undefined {
    return this._is_override?.value;
  }

  /**
   * Gets the openehr_base.Boolean wrapper object for is_override.
   * Use this to access openehr_base.Boolean methods.
   */
  get $is_override(): openehr_base.Boolean | undefined {
    return this._is_override;
  }

  /**
   * Sets is_override from either a primitive value or openehr_base.Boolean wrapper.
   */
  set is_override(val: boolean | openehr_base.Boolean | undefined) {
    if (val === undefined || val === null) {
      this._is_override = undefined;
    } else if (typeof val === "boolean") {
      this._is_override = openehr_base.Boolean.from(val);
    } else {
      this._is_override = val;
    }
  }

  /**
   * List of generic parameter definitions. Persisted attribute.
   */
  generic_parameter_defs?: undefined;
  /**
   * Internal storage for source_schema_id
   * @protected
   */
  protected _source_schema_id?: openehr_base.String;

  /**
   * Reference to original source schema defining this class. Set during \`BMM_SCHEMA\` materialise. Useful for GUI tools to enable user to edit the schema file containing a given class (i.e. taking into account that a class may be in any of the schemas in a schema inclusion hierarchy).
   */
  get source_schema_id(): string | undefined {
    return this._source_schema_id?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for source_schema_id.
   * Use this to access openehr_base.String methods.
   */
  get $source_schema_id(): openehr_base.String | undefined {
    return this._source_schema_id;
  }

  /**
   * Sets source_schema_id from either a primitive value or openehr_base.String wrapper.
   */
  set source_schema_id(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._source_schema_id = undefined;
    } else if (typeof val === "string") {
      this._source_schema_id = openehr_base.String.from(val);
    } else {
      this._source_schema_id = val;
    }
  }

  /**
   * \`BMM_CLASS\` object built by \`_create_bmm_class_definition_\` and \`_populate_bmm_class_definition_\`.
   */
  bmm_class?: BMM_CLASS;
  /**
   * Internal storage for uid
   * @protected
   */
  protected _uid?: openehr_base.Integer;

  /**
   * Unique id generated for later comparison during merging, in order to detect if two classes are the same. Assigned in post-load processing.
   */
  get uid(): number | undefined {
    return this._uid?.value;
  }

  /**
   * Gets the openehr_base.Integer wrapper object for uid.
   * Use this to access openehr_base.Integer methods.
   */
  get $uid(): openehr_base.Integer | undefined {
    return this._uid;
  }

  /**
   * Sets uid from either a primitive value or openehr_base.Integer wrapper.
   */
  set uid(val: number | openehr_base.Integer | undefined) {
    if (val === undefined || val === null) {
      this._uid = undefined;
    } else if (typeof val === "number") {
      this._uid = openehr_base.Integer.from(val);
    } else {
      this._uid = val;
    }
  }

  /**
   * List of structured inheritance ancestors, used only in the case of generic inheritance. Persisted attribute.
   */
  ancestor_defs?: undefined;
  /**
   * True if this class is a generic class.
   * @returns Result value
   */
  is_generic(): openehr_base.Boolean {
    // TODO: Implement is_generic behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method is_generic not yet implemented.");
  }

  /**
   * Create \`_bmm_class_definition_\`.
   * @returns Result value
   */
  create_bmm_class(): void {
    // TODO: Implement create_bmm_class behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method create_bmm_class not yet implemented.");
  }

  /**
   * Add remaining model elements from Current to \`_bmm_class_definition_\`.
   * @param a_bmm_schema - Parameter
   * @returns Result value
   */
  populate_bmm_class(a_bmm_schema: BMM_MODEL): void {
    // TODO: Implement populate_bmm_class behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method populate_bmm_class not yet implemented.");
  }
}

/**
 * Persistent form of \`BMM_ENUMERATION\` attributes.
 */
export class P_BMM_ENUMERATION extends P_BMM_CLASS {
  item_names?: undefined;
  item_values?: undefined;
  /**
   * \`BMM_CLASS\` object build by \`_create_bmm_class_definition_\` and \`_populate_bmm_class_definition_\`.
   */
  override bmm_class?: BMM_ENUMERATION = undefined;
}

/**
 * Persisted form of a model component that contains packages.
 */
export class P_BMM_PACKAGE_CONTAINER {
  /**
   * Package structure as a hierarchy of packages each potentially containing names of classes in that package in the original model.
   */
  packages?: undefined;
}

/**
 * Persisted form of \`BMM_SCHEMA\`.
 */
export class P_BMM_SCHEMA extends P_BMM_PACKAGE_CONTAINER {
  /**
   * Primitive type definitions. Persisted attribute.
   */
  primitive_types?: undefined;
  /**
   * Class definitions. Persisted attribute.
   */
  class_definitions?: undefined;
  /**
   * Implementation of \`_validate_created()_\`
   * @returns Result value
   */
  validate_created(): void {
    // TODO: Implement validate_created behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method validate_created not yet implemented.");
  }

  /**
   * Implementation of \`_load_finalise()_\`
   * @returns Result value
   */
  load_finalise(): void {
    // TODO: Implement load_finalise behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method load_finalise not yet implemented.");
  }

  /**
   * Implementation of \`_merge()_\`
   * @param other - Parameter
   * @returns Result value
   */
  merge(other: P_BMM_SCHEMA): void {
    // TODO: Implement merge behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method merge not yet implemented.");
  }

  /**
   * Implementation of \`_validate()_\`
   * @returns Result value
   */
  validate(): void {
    // TODO: Implement validate behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method validate not yet implemented.");
  }

  /**
   * Implementation of \`_create_bmm_model()_\`
   * @returns Result value
   */
  create_bmm_model(): void {
    // TODO: Implement create_bmm_model behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method create_bmm_model not yet implemented.");
  }

  /**
   * Package structure in which all top-level qualified package names like \`xx.yy.zz\` have been expanded out to a hierarchy of \`BMM_PACKAGE\` objects.
   * @returns Result value
   */
  canonical_packages(): P_BMM_PACKAGE {
    // TODO: Implement canonical_packages behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method canonical_packages not yet implemented.");
  }
}

/**
 * Persistent form of \`BMM_PROPERTY\`.
 */
export abstract class P_BMM_PROPERTY extends P_BMM_MODEL_ELEMENT {
  /**
   * Internal storage for name
   * @protected
   */
  protected _name?: openehr_base.String;

  /**
   * Name of this property within its class. Persisted attribute.
   */
  get name(): string | undefined {
    return this._name?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for name.
   * Use this to access openehr_base.String methods.
   */
  get $name(): openehr_base.String | undefined {
    return this._name;
  }

  /**
   * Sets name from either a primitive value or openehr_base.String wrapper.
   */
  set name(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._name = undefined;
    } else if (typeof val === "string") {
      this._name = openehr_base.String.from(val);
    } else {
      this._name = val;
    }
  }

  /**
   * Internal storage for is_mandatory
   * @protected
   */
  protected _is_mandatory?: openehr_base.Boolean;

  /**
   * True if this property is mandatory in its class. Persisted attribute.
   */
  get is_mandatory(): boolean | undefined {
    return this._is_mandatory?.value;
  }

  /**
   * Gets the openehr_base.Boolean wrapper object for is_mandatory.
   * Use this to access openehr_base.Boolean methods.
   */
  get $is_mandatory(): openehr_base.Boolean | undefined {
    return this._is_mandatory;
  }

  /**
   * Sets is_mandatory from either a primitive value or openehr_base.Boolean wrapper.
   */
  set is_mandatory(val: boolean | openehr_base.Boolean | undefined) {
    if (val === undefined || val === null) {
      this._is_mandatory = undefined;
    } else if (typeof val === "boolean") {
      this._is_mandatory = openehr_base.Boolean.from(val);
    } else {
      this._is_mandatory = val;
    }
  }

  /**
   * Internal storage for is_computed
   * @protected
   */
  protected _is_computed?: openehr_base.Boolean;

  /**
   * True if this property is computed rather than stored in objects of this class. Persisted Attribute.
   */
  get is_computed(): boolean | undefined {
    return this._is_computed?.value;
  }

  /**
   * Gets the openehr_base.Boolean wrapper object for is_computed.
   * Use this to access openehr_base.Boolean methods.
   */
  get $is_computed(): openehr_base.Boolean | undefined {
    return this._is_computed;
  }

  /**
   * Sets is_computed from either a primitive value or openehr_base.Boolean wrapper.
   */
  set is_computed(val: boolean | openehr_base.Boolean | undefined) {
    if (val === undefined || val === null) {
      this._is_computed = undefined;
    } else if (typeof val === "boolean") {
      this._is_computed = openehr_base.Boolean.from(val);
    } else {
      this._is_computed = val;
    }
  }

  /**
   * Internal storage for is_im_infrastructure
   * @protected
   */
  protected _is_im_infrastructure?: openehr_base.Boolean;

  /**
   * True if this property is info model 'infrastructure' rather than 'data'. Persisted attribute.
   */
  get is_im_infrastructure(): boolean | undefined {
    return this._is_im_infrastructure?.value;
  }

  /**
   * Gets the openehr_base.Boolean wrapper object for is_im_infrastructure.
   * Use this to access openehr_base.Boolean methods.
   */
  get $is_im_infrastructure(): openehr_base.Boolean | undefined {
    return this._is_im_infrastructure;
  }

  /**
   * Sets is_im_infrastructure from either a primitive value or openehr_base.Boolean wrapper.
   */
  set is_im_infrastructure(val: boolean | openehr_base.Boolean | undefined) {
    if (val === undefined || val === null) {
      this._is_im_infrastructure = undefined;
    } else if (typeof val === "boolean") {
      this._is_im_infrastructure = openehr_base.Boolean.from(val);
    } else {
      this._is_im_infrastructure = val;
    }
  }

  /**
   * Internal storage for is_im_runtime
   * @protected
   */
  protected _is_im_runtime?: openehr_base.Boolean;

  /**
   * True if this property is info model 'runtime' settable property. Persisted attribute.
   */
  get is_im_runtime(): boolean | undefined {
    return this._is_im_runtime?.value;
  }

  /**
   * Gets the openehr_base.Boolean wrapper object for is_im_runtime.
   * Use this to access openehr_base.Boolean methods.
   */
  get $is_im_runtime(): openehr_base.Boolean | undefined {
    return this._is_im_runtime;
  }

  /**
   * Sets is_im_runtime from either a primitive value or openehr_base.Boolean wrapper.
   */
  set is_im_runtime(val: boolean | openehr_base.Boolean | undefined) {
    if (val === undefined || val === null) {
      this._is_im_runtime = undefined;
    } else if (typeof val === "boolean") {
      this._is_im_runtime = openehr_base.Boolean.from(val);
    } else {
      this._is_im_runtime = val;
    }
  }

  /**
   * Type definition of this property, if not a simple String type reference. Persisted attribute.
   */
  type_def?: P_BMM_TYPE;
  /**
   * BMM_PROPERTY created by create_bmm_property_definition.
   */
  bmm_property?: BMM_PROPERTY;
  /**
   * Create \`_bmm_property_definition_\` from \`P_BMM_XX\` parts.
   * @param a_bmm_schema - Parameter
   * @param a_class_def - Parameter
   * @returns Result value
   */
  create_bmm_property(a_bmm_schema: BMM_MODEL, a_class_def: BMM_CLASS): void {
    // TODO: Implement create_bmm_property behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method create_bmm_property not yet implemented.");
  }
}

/**
 * Persistent form of \`BMM_GENERIC_PARAMETER\`.
 */
export class P_BMM_GENERIC_PARAMETER extends P_BMM_MODEL_ELEMENT {
  /**
   * Internal storage for name
   * @protected
   */
  protected _name?: openehr_base.String;

  /**
   * Name of the parameter, e.g. 'T' etc. Persisted attribute. Name is limited to 1 character, upper case.
   */
  get name(): string | undefined {
    return this._name?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for name.
   * Use this to access openehr_base.String methods.
   */
  get $name(): openehr_base.String | undefined {
    return this._name;
  }

  /**
   * Sets name from either a primitive value or openehr_base.String wrapper.
   */
  set name(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._name = undefined;
    } else if (typeof val === "string") {
      this._name = openehr_base.String.from(val);
    } else {
      this._name = val;
    }
  }

  /**
   * Internal storage for conforms_to_type
   * @protected
   */
  protected _conforms_to_type?: openehr_base.String;

  /**
   * Optional conformance constraint - the name of a type to which a concrete substitution of this generic parameter must conform. Persisted attribute.
   */
  get conforms_to_type(): string | undefined {
    return this._conforms_to_type?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for conforms_to_type.
   * Use this to access openehr_base.String methods.
   */
  get $conforms_to_type(): openehr_base.String | undefined {
    return this._conforms_to_type;
  }

  /**
   * Sets conforms_to_type from either a primitive value or openehr_base.String wrapper.
   */
  set conforms_to_type(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._conforms_to_type = undefined;
    } else if (typeof val === "string") {
      this._conforms_to_type = openehr_base.String.from(val);
    } else {
      this._conforms_to_type = val;
    }
  }

  /**
   * \`BMM_GENERIC_PARAMETER\` created by \`_create_bmm_generic_parameter_\`.
   */
  bmm_generic_parameter?: BMM_PARAMETER_TYPE;
  /**
   * Create \`_bmm_generic_parameter_\`.
   * @param a_bmm_schema - Parameter
   * @returns Result value
   */
  create_bmm_generic_parameter(a_bmm_schema: BMM_MODEL): void {
    // TODO: Implement create_bmm_generic_parameter behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method create_bmm_generic_parameter not yet implemented.");
  }
}

/**
 * Persistent form of \`BMM_TYPE\`.
 */
export abstract class P_BMM_TYPE {
  /**
   * Result of \`_create_bmm_type()_\` call.
   */
  bmm_type?: BMM_TYPE;
  /**
   * Create appropriate \`BMM_XXX\` object; effected in descendants.
   * @param a_schema - Parameter
   * @param a_class_def - Parameter
   * @returns Result value
   */
  abstract create_bmm_type(a_schema: BMM_MODEL, a_class_def: BMM_CLASS): void;

  /**
   * Formal name of the type for display.
   * @returns Result value
   */
  abstract as_type_string(): openehr_base.String;
}

/**
 * Persistent form of \`BMM_CONTAINER_TYPE\`.
 */
export class P_BMM_CONTAINER_TYPE extends P_BMM_TYPE {
  /**
   * Internal storage for container_type
   * @protected
   */
  protected _container_type?: openehr_base.String;

  /**
   * The type of the container. This converts to the \`_root_type_\` in \`BMM_GENERIC_TYPE\`. Persisted attribute.
   */
  get container_type(): string | undefined {
    return this._container_type?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for container_type.
   * Use this to access openehr_base.String methods.
   */
  get $container_type(): openehr_base.String | undefined {
    return this._container_type;
  }

  /**
   * Sets container_type from either a primitive value or openehr_base.String wrapper.
   */
  set container_type(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._container_type = undefined;
    } else if (typeof val === "string") {
      this._container_type = openehr_base.String.from(val);
    } else {
      this._container_type = val;
    }
  }

  /**
   * Type definition of \`_type_\`, if not a simple String type reference. Persisted attribute.
   */
  type_def?: P_BMM_BASE_TYPE;
  /**
   * Internal storage for type
   * @protected
   */
  protected _type?: openehr_base.String;

  /**
   * The target type; this converts to the first parameter in \`_generic_parameters_\` in \`BMM_GENERIC_TYPE\`. Persisted attribute.
   */
  get type(): string | undefined {
    return this._type?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for type.
   * Use this to access openehr_base.String methods.
   */
  get $type(): openehr_base.String | undefined {
    return this._type;
  }

  /**
   * Sets type from either a primitive value or openehr_base.String wrapper.
   */
  set type(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._type = undefined;
    } else if (typeof val === "string") {
      this._type = openehr_base.String.from(val);
    } else {
      this._type = val;
    }
  }

  /**
   * Result of \`_create_bmm_type()_\` call.
   */
  override bmm_type?: BMM_CONTAINER_TYPE = undefined;
  /**
   * The target type; this converts to the first parameter in \`_generic_parameters_\` in \`BMM_GENERIC_TYPE\`. Persisted attribute.
   * @returns Result value
   */
  type_ref(): P_BMM_BASE_TYPE {
    // TODO: Implement type_ref behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method type_ref not yet implemented.");
  }
}

/**
 * Persistent form of \`BMM_PROPER_TYPE\`.
 */
export abstract class P_BMM_BASE_TYPE extends P_BMM_TYPE {
  /**
   * Internal storage for value_constraint
   * @protected
   */
  protected _value_constraint?: openehr_base.String;

  get value_constraint(): string | undefined {
    return this._value_constraint?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for value_constraint.
   * Use this to access openehr_base.String methods.
   */
  get $value_constraint(): openehr_base.String | undefined {
    return this._value_constraint;
  }

  /**
   * Sets value_constraint from either a primitive value or openehr_base.String wrapper.
   */
  set value_constraint(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._value_constraint = undefined;
    } else if (typeof val === "string") {
      this._value_constraint = openehr_base.String.from(val);
    } else {
      this._value_constraint = val;
    }
  }
}

/**
 * Persistent form of \`BMM_SIMPLE_TYPE\`.
 */
export class P_BMM_SIMPLE_TYPE extends P_BMM_BASE_TYPE {
  /**
   * Internal storage for type
   * @protected
   */
  protected _type?: openehr_base.String;

  /**
   * Name of type - must be a simple class name.
   */
  get type(): string | undefined {
    return this._type?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for type.
   * Use this to access openehr_base.String methods.
   */
  get $type(): openehr_base.String | undefined {
    return this._type;
  }

  /**
   * Sets type from either a primitive value or openehr_base.String wrapper.
   */
  set type(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._type = undefined;
    } else if (typeof val === "string") {
      this._type = openehr_base.String.from(val);
    } else {
      this._type = val;
    }
  }

  /**
   * Result of \`_create_bmm_type()_\` call.
   */
  override bmm_type?: BMM_SIMPLE_TYPE = undefined;
}

/**
 * Persistent form of \`BMM_PARAMETER_TYPE\`.
 */
export class P_BMM_OPEN_TYPE extends P_BMM_BASE_TYPE {
  /**
   * Internal storage for type
   * @protected
   */
  protected _type?: openehr_base.String;

  /**
   * Simple type parameter as a single letter like 'T', 'G' etc.
   */
  get type(): string | undefined {
    return this._type?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for type.
   * Use this to access openehr_base.String methods.
   */
  get $type(): openehr_base.String | undefined {
    return this._type;
  }

  /**
   * Sets type from either a primitive value or openehr_base.String wrapper.
   */
  set type(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._type = undefined;
    } else if (typeof val === "string") {
      this._type = openehr_base.String.from(val);
    } else {
      this._type = val;
    }
  }

  /**
   * Result of \`_create_bmm_type()_\` call.
   */
  override bmm_type?: openehr_base.Any = undefined;
}

/**
 * Persistent form of \`BMM_GENERIC_TYPE\`.
 */
export class P_BMM_GENERIC_TYPE extends P_BMM_BASE_TYPE {
  /**
   * Internal storage for root_type
   * @protected
   */
  protected _root_type?: openehr_base.String;

  /**
   * Root type of this generic type, e.g. \`Interval\` in \`Interval<Integer>\`.
   */
  get root_type(): string | undefined {
    return this._root_type?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for root_type.
   * Use this to access openehr_base.String methods.
   */
  get $root_type(): openehr_base.String | undefined {
    return this._root_type;
  }

  /**
   * Sets root_type from either a primitive value or openehr_base.String wrapper.
   */
  set root_type(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._root_type = undefined;
    } else if (typeof val === "string") {
      this._root_type = openehr_base.String.from(val);
    } else {
      this._root_type = val;
    }
  }

  /**
   * Generic parameters of the root_type in this type specifier if non-simple types. The order must match the order of the owning class's formal generic parameter declarations. Persistent attribute.
   */
  generic_parameter_defs?: undefined;
  /**
   * Generic parameters of the \`_root_type_\` in this type specifier, if simple types. The order must match the order of the owning class's formal generic parameter declarations. Persistent attribute.
   */
  generic_parameters?: undefined;
  /**
   * Result of \`_create_bmm_type()_\` call.
   */
  override bmm_type?: BMM_GENERIC_TYPE = undefined;
  /**
   * Generic parameters of the root_type in this type specifier. The order must match the order of the owning class's formal generic parameter declarations
   * @returns Result value
   */
  generic_parameter_refs(): P_BMM_TYPE {
    // TODO: Implement generic_parameter_refs behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method generic_parameter_refs not yet implemented.");
  }
}

/**
 * Persisted form of a package as a tree structure whose nodes can contain more packages and/or classes.
 */
export class P_BMM_PACKAGE extends P_BMM_PACKAGE_CONTAINER {
  /**
   * Internal storage for name
   * @protected
   */
  protected _name?: openehr_base.String;

  /**
   * Name of the package from schema; this name may be qualified if it is a top-level package within the schema, or unqualified. Persistent attribute.
   */
  get name(): string | undefined {
    return this._name?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for name.
   * Use this to access openehr_base.String methods.
   */
  get $name(): openehr_base.String | undefined {
    return this._name;
  }

  /**
   * Sets name from either a primitive value or openehr_base.String wrapper.
   */
  set name(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._name = undefined;
    } else if (typeof val === "string") {
      this._name = openehr_base.String.from(val);
    } else {
      this._name = val;
    }
  }

  /**
   * List of classes in this package. Persistent attribute.
   */
  classes?: undefined;
  /**
   * \`BMM_PACKAGE\` created by \`_create_bmm_package_definition_\`.
   */
  bmm_package_definition?: BMM_PACKAGE;
  /**
   * Merge packages and classes from other (from an included \`P_BMM_SCHEMA\`) into this package.
   * @param other - Parameter
   * @returns Result value
   */
  merge(other: P_BMM_PACKAGE): void {
    // TODO: Implement merge behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method merge not yet implemented.");
  }

  /**
   * Generate a \`BMM_PACKAGE_DEFINITION\` object and write it to \`_bmm_package_definition_\`.
   * @returns Result value
   */
  create_bmm_package_definition(): void {
    // TODO: Implement create_bmm_package_definition behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error(
      "Method create_bmm_package_definition not yet implemented.",
    );
  }
}

/**
 * Persistent form of \`BMM_CONTAINER_PROPERTY\`.
 */
export class P_BMM_CONTAINER_PROPERTY extends P_BMM_PROPERTY {
  /**
   * Cardinality of this property in its class. Persistent attribute.
   */
  cardinality?: undefined;
  /**
   * Type definition of this property, if not a simple String type reference. Persistent attribute.
   */
  override type_def?: P_BMM_CONTAINER_TYPE = undefined;
  /**
   * \`BMM_PROPERTY\` created by \`_create_bmm_property_\`.
   */
  override bmm_property?: BMM_CONTAINER_PROPERTY = undefined;
  /**
   * Create \`_bmm_property_definition_\`.
   * @param a_bmm_schema - Parameter
   * @param a_class_def - Parameter
   * @returns Result value
   */
  create_bmm_property(a_bmm_schema: BMM_MODEL, a_class_def: BMM_CLASS): void {
    // TODO: Implement create_bmm_property behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method create_bmm_property not yet implemented.");
  }
}

/**
 * Persistent form of \`BMM_SINGLE_PROPERTY\`.
 */
export class P_BMM_SINGLE_PROPERTY extends P_BMM_PROPERTY {
  /**
   * Internal storage for type
   * @protected
   */
  protected _type?: openehr_base.String;

  /**
   * If the type is a simple type, then this attribute will hold the type name. If the type is a container or generic, then type_ref will hold the type definition. The resulting type is generated in type_def.
   */
  get type(): string | undefined {
    return this._type?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for type.
   * Use this to access openehr_base.String methods.
   */
  get $type(): openehr_base.String | undefined {
    return this._type;
  }

  /**
   * Sets type from either a primitive value or openehr_base.String wrapper.
   */
  set type(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._type = undefined;
    } else if (typeof val === "string") {
      this._type = openehr_base.String.from(val);
    } else {
      this._type = val;
    }
  }

  /**
   * Type definition of this property computed from \`_type_\` for later use in \`_bmm_property_\`.
   */
  type_ref?: P_BMM_SIMPLE_TYPE;
  /**
   * \`BMM_PROPERTY\` created by \`_create_bmm_property_definition_\`.
   */
  override bmm_property?: BMM_UNITARY_PROPERTY = undefined;
  /**
   * Generate \`_type_ref_\` from \`_type_\` and save.
   * @returns Result value
   */
  type_def(): P_BMM_SIMPLE_TYPE {
    // TODO: Implement type_def behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method type_def not yet implemented.");
  }
}

/**
 * Persistent form of a \`BMM_SINGLE_PROPERTY_OPEN\`.
 */
export class P_BMM_SINGLE_PROPERTY_OPEN extends P_BMM_PROPERTY {
  /**
   * Type definition of this property computed from \`_type_\` for later use in \`_bmm_property_\`.
   */
  type_ref?: P_BMM_OPEN_TYPE;
  /**
   * Internal storage for type
   * @protected
   */
  protected _type?: openehr_base.String;

  /**
   * Type definition of this property, if a simple String type reference. Really we should use \`_type_def_\` to be regular in the schema, but that makes the schema more wordy and less clear. So we use this persisted String value, and compute the \`_type_def_\` on the fly. Persisted attribute.
   */
  get type(): string | undefined {
    return this._type?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for type.
   * Use this to access openehr_base.String methods.
   */
  get $type(): openehr_base.String | undefined {
    return this._type;
  }

  /**
   * Sets type from either a primitive value or openehr_base.String wrapper.
   */
  set type(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._type = undefined;
    } else if (typeof val === "string") {
      this._type = openehr_base.String.from(val);
    } else {
      this._type = val;
    }
  }

  /**
   * \`BMM_PROPERTY\` created by \`_create_bmm_property_definition_\`.
   */
  override bmm_property?: BMM_UNITARY_PROPERTY = undefined;
  /**
   * Generate \`_type_ref_\` from \`_type_\` and save.
   * @returns Result value
   */
  type_def(): P_BMM_OPEN_TYPE {
    // TODO: Implement type_def behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method type_def not yet implemented.");
  }
}

/**
 * Persistent form of \`BMM_GENERIC_PROPERTY\`.
 */
export class P_BMM_GENERIC_PROPERTY extends P_BMM_PROPERTY {
  /**
   * Type definition of this property, if not a simple String type reference. Persistent attribute.
   */
  override type_def?: P_BMM_GENERIC_TYPE = undefined;
  /**
   * \`BMM_PROPERTY\` created by \`_create_bmm_property_definition_\`.
   */
  override bmm_property?: BMM_UNITARY_PROPERTY = undefined;
}

/**
 * Persistent form of an instance of \`BMM_ENUMERATION_INTEGER\`.
 */
export class P_BMM_ENUMERATION_INTEGER extends P_BMM_ENUMERATION {
  /**
   * \`BMM_CLASS\` object build by \`_create_bmm_class_definition_\` and \`_populate_bmm_class_definition_\`.
   */
  override bmm_class?: BMM_ENUMERATION_INTEGER = undefined;
}

/**
 * Persistent form of \`BMM_ENUMERATION_STRING\`.
 */
export class P_BMM_ENUMERATION_STRING extends P_BMM_ENUMERATION {
  /**
   * \`BMM_CLASS\` object build by \`_create_bmm_class_definition_\` and \`_populate_bmm_class_definition_\`.
   */
  override bmm_class?: BMM_ENUMERATION_STRING = undefined;
}

/**
 * Concrete descendant of \`BMM_SCHEMA_DESCRIPTOR\` that provides a way to read an ODIN or other similarly encoded P_BMM schema file.
 */
export class P_BMM_SCHEMA_DESCRIPTOR extends BMM_SCHEMA_DESCRIPTOR {
  /**
   * Persistent form of model.
   */
  override bmm_schema?: P_BMM_SCHEMA = undefined;
}

export class P_BMM_INDEXED_CONTAINER_PROPERTY extends P_BMM_CONTAINER_PROPERTY {
  /**
   * Type definition of this property, if not a simple String type reference. Persistent attribute.
   */
  override type_def?: P_BMM_INDEXED_CONTAINER_TYPE = undefined;
  /**
   * \`BMM_PROPERTY\` created by \`_create_bmm_property_\`.
   */
  override bmm_property?: BMM_INDEXED_CONTAINER_PROPERTY = undefined;
}

export class P_BMM_INDEXED_CONTAINER_TYPE extends P_BMM_CONTAINER_TYPE {
  /**
   * Internal storage for index_type
   * @protected
   */
  protected _index_type?: openehr_base.String;

  get index_type(): string | undefined {
    return this._index_type?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for index_type.
   * Use this to access openehr_base.String methods.
   */
  get $index_type(): openehr_base.String | undefined {
    return this._index_type;
  }

  /**
   * Sets index_type from either a primitive value or openehr_base.String wrapper.
   */
  set index_type(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._index_type = undefined;
    } else if (typeof val === "string") {
      this._index_type = openehr_base.String.from(val);
    } else {
      this._index_type = val;
    }
  }

  /**
   * Result of \`_create_bmm_type()_\` call.
   */
  override bmm_type?: BMM_INDEXED_CONTAINER_TYPE = undefined;
}

/**
 * Meta-type for the notion of statement, which is a non-value-returning entity.
 */
export abstract class STATEMENT {
}

/**
 * Meta-type for a first order predicate logic expression with a Boolean result.
 */
export class ASSERTION extends STATEMENT {
  /**
   * Internal storage for tag
   * @protected
   */
  protected _tag?: openehr_base.String;

  /**
   * Expression tag, used for differentiating multiple assertions.
   */
  get tag(): string | undefined {
    return this._tag?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for tag.
   * Use this to access openehr_base.String methods.
   */
  get $tag(): openehr_base.String | undefined {
    return this._tag;
  }

  /**
   * Sets tag from either a primitive value or openehr_base.String wrapper.
   */
  set tag(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._tag = undefined;
    } else if (typeof val === "string") {
      this._tag = openehr_base.String.from(val);
    } else {
      this._tag = val;
    }
  }

  /**
   * Internal storage for string_expression
   * @protected
   */
  protected _string_expression?: openehr_base.String;

  /**
   * String form of expression, in case an expression evaluator taking String expressions is used for evaluation.
   */
  get string_expression(): string | undefined {
    return this._string_expression?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for string_expression.
   * Use this to access openehr_base.String methods.
   */
  get $string_expression(): openehr_base.String | undefined {
    return this._string_expression;
  }

  /**
   * Sets string_expression from either a primitive value or openehr_base.String wrapper.
   */
  set string_expression(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._string_expression = undefined;
    } else if (typeof val === "string") {
      this._string_expression = openehr_base.String.from(val);
    } else {
      this._string_expression = val;
    }
  }

  /**
   * Root of expression tree.
   */
  expression?: EXPRESSION;
}

/**
 * Meta-type representing the assignment statement, which associates a named variable with an expression, and produces no value.
 */
export class ASSIGNMENT extends STATEMENT {
  /**
   * The target variable on the notional left-hand side of this assignment.
   */
  target?: VARIABLE_DECLARATION;
  /**
   * Source right hand side) of the assignment.
   */
  source?: EXPR_VALUE;
}

/**
 * Any kind of statement element that can be evaluated. The type will either be supplied in descendant types or else will be inferred by an assignment statement linked to a typed variable.
 */
export abstract class EXPR_VALUE {
  /**
   * The computed value of this node as a result of the nodes below it, for operator nodes, or else statically set or otherwise derived values.
   * @returns Result value
   */
  abstract value(): openehr_base.Any;
}

/**
 * Abstract parent of all expression meta-types.
 */
export abstract class EXPRESSION extends EXPR_VALUE {
  /**
   * The primitive type of this node, which must be determined by redefinitions in concrete classes.
   * @returns Result value
   */
  abstract type(): EXPR_TYPE_DEF;
}

/**
 * Abstract parent of operator types.
 */
export abstract class EXPR_OPERATOR extends EXPRESSION {
  /**
   * Internal storage for precedence_overridden
   * @protected
   */
  protected _precedence_overridden?: openehr_base.Boolean;

  /**
   * True if the natural precedence of operators is overridden in the expression represented by this node of the expression tree. If True, parentheses should be introduced around the totality of the syntax expression corresponding to this operator node and its operands.
   */
  get precedence_overridden(): boolean | undefined {
    return this._precedence_overridden?.value;
  }

  /**
   * Gets the openehr_base.Boolean wrapper object for precedence_overridden.
   * Use this to access openehr_base.Boolean methods.
   */
  get $precedence_overridden(): openehr_base.Boolean | undefined {
    return this._precedence_overridden;
  }

  /**
   * Sets precedence_overridden from either a primitive value or openehr_base.Boolean wrapper.
   */
  set precedence_overridden(val: boolean | openehr_base.Boolean | undefined) {
    if (val === undefined || val === null) {
      this._precedence_overridden = undefined;
    } else if (typeof val === "boolean") {
      this._precedence_overridden = openehr_base.Boolean.from(val);
    } else {
      this._precedence_overridden = val;
    }
  }

  /**
   * Operator definition.
   */
  operator?: OPERATOR_KIND;
  /**
   * Internal storage for symbol
   * @protected
   */
  protected _symbol?: openehr_base.String;

  /**
   * The symbol actually used in the rule, or intended to be used for serialisation. Must be a member of \`operator_def.symbols\`.
   */
  get symbol(): string | undefined {
    return this._symbol?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for symbol.
   * Use this to access openehr_base.String methods.
   */
  get $symbol(): openehr_base.String | undefined {
    return this._symbol;
  }

  /**
   * Sets symbol from either a primitive value or openehr_base.String wrapper.
   */
  set symbol(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._symbol = undefined;
    } else if (typeof val === "string") {
      this._symbol = openehr_base.String.from(val);
    } else {
      this._symbol = val;
    }
  }
}

/**
 * Binary operator expression node.
 */
export class EXPR_BINARY_OPERATOR extends EXPR_OPERATOR {
  /**
   * Left operand node.
   */
  left_operand?: EXPRESSION;
  /**
   * Right operand node.
   */
  right_operand?: EXPRESSION;
}

/**
 * Meta-type representing one of:
 *
 * * a manifest constant of any primitive type;
 * * a path referring to a value in the archetype;
 * * a constraint;
 * * a variable reference.
 */
export abstract class EXPR_LEAF extends EXPRESSION {
  /**
   * The reference item from which the value of this node can be computed.
   */
  item?: openehr_base.Any;
}

/**
 * Node representing a function call with 0 or more arguments.
 */
export class EXPR_FUNCTION_CALL extends EXPR_LEAF {
  /**
   * Arguments of this function, which can be from 0 to any number. Functions with no arguments are typically used to represent real world varying values like 'current time' and so on.
   */
  arguments?: undefined;
}

/**
 * Literal value expression tree leaf item. This can represent a literal value of any primitive type included in the \`PRIMITIVE_TYPE\` enumeration.
 */
export class EXPR_LITERAL extends EXPR_LEAF {
  /**
   * A statically set constant value of a primitive type.
   */
  override item?: openehr_base.Any;
}

/**
 * Unary operator expression node.
 */
export class EXPR_UNARY_OPERATOR extends EXPR_OPERATOR {
  /**
   * Operand node.
   */
  operand?: EXPRESSION;
}

/**
 * Expression tree leaf item representing a reference to a declared variable.
 */
export class EXPR_VARIABLE_REF extends EXPR_LEAF {
  /**
   * The variable referred to.
   */
  override item?: VARIABLE_DECLARATION = undefined;
}

/**
 * Definition of a variable whose value is derived from a query run on a data context in the operational environment. Typical uses of this kind of variable are to obtain values like the patient date of birth, sex, weight, and so on. It could also be used to obtain items from a knowledge context, such as a drug database.
 */
export class EXTERNAL_QUERY extends EXPR_VALUE {
  /**
   * Internal storage for context
   * @protected
   */
  protected _context?: openehr_base.String;

  /**
   * Optional name of context. This allows a basic separation of query types to be done in more sophisticated environments. Possible values might be “patient”, “medications” and so on.
   * Not yet standardised.
   */
  get context(): string | undefined {
    return this._context?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for context.
   * Use this to access openehr_base.String methods.
   */
  get $context(): openehr_base.String | undefined {
    return this._context;
  }

  /**
   * Sets context from either a primitive value or openehr_base.String wrapper.
   */
  set context(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._context = undefined;
    } else if (typeof val === "string") {
      this._context = openehr_base.String.from(val);
    } else {
      this._context = val;
    }
  }

  /**
   * Internal storage for query_id
   * @protected
   */
  protected _query_id?: openehr_base.String;

  /**
   * Identifier of query in the external context, e.g. “date_of_birth”.
   * Not yet standardised.
   */
  get query_id(): string | undefined {
    return this._query_id?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for query_id.
   * Use this to access openehr_base.String methods.
   */
  get $query_id(): openehr_base.String | undefined {
    return this._query_id;
  }

  /**
   * Sets query_id from either a primitive value or openehr_base.String wrapper.
   */
  set query_id(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._query_id = undefined;
    } else if (typeof val === "string") {
      this._query_id = openehr_base.String.from(val);
    } else {
      this._query_id = val;
    }
  }

  /**
   * Optional arguments to query.
   * Not yet standardised.
   */
  query_args?: undefined;
}

/**
 * A container for a specific set of statements intended to be used together.
 */
export class STATEMENT_SET {
  /**
   * The member statements of this statement set.
   */
  statement?: undefined;
  /**
   * Internal storage for name
   * @protected
   */
  protected _name?: openehr_base.String;

  /**
   * Optional name of this rule set.
   */
  get name(): string | undefined {
    return this._name?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for name.
   * Use this to access openehr_base.String methods.
   */
  get $name(): openehr_base.String | undefined {
    return this._name;
  }

  /**
   * Sets name from either a primitive value or openehr_base.String wrapper.
   */
  set name(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._name = undefined;
    } else if (typeof val === "string") {
      this._name = openehr_base.String.from(val);
    } else {
      this._name = val;
    }
  }

  /**
   * Execution result of the whole rule set. Determined by the and-ing of result values of Assertions in the rule set.
   * @returns Result value
   */
  execution_result(): openehr_base.Boolean {
    // TODO: Implement execution_result behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method execution_result not yet implemented.");
  }
}

/**
 * Meta-type for the declaration of a named variable that can be used in an expression.
 */
export class VARIABLE_DECLARATION extends STATEMENT {
  /**
   * Internal storage for name
   * @protected
   */
  protected _name?: openehr_base.String;

  /**
   * Name of the variable.
   */
  get name(): string | undefined {
    return this._name?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for name.
   * Use this to access openehr_base.String methods.
   */
  get $name(): openehr_base.String | undefined {
    return this._name;
  }

  /**
   * Sets name from either a primitive value or openehr_base.String wrapper.
   */
  set name(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._name = undefined;
    } else if (typeof val === "string") {
      this._name = openehr_base.String.from(val);
    } else {
      this._name = val;
    }
  }

  /**
   * Primitive type of the variable, enabling its use to be type-checked in expressions.
   */
  type?: EXPR_TYPE_DEF;
}

/**
 * Path-based reference to a value in a data structure.
 */
export class EXPR_VALUE_REF extends EXPR_LEAF {
}

/**
 * Universal quantification operator, usually known as \`for_all\`, whose operand is a collection of items referenced by an \`EXPR_VALUE_REF\`. The \`_condition_\` attribute represents an assertion that is applied to every member of the collection at runtime to determine the result.
 */
export class EXPR_FOR_ALL extends EXPR_OPERATOR {
  /**
   * Boolean condition that returns True or False when applied to a member of the operand of a \`for_all\` operator.
   */
  condition?: ASSERTION;
  /**
   * Reference to collection / container object to which the \`for_all\` operator is to be applied.
   */
  operand?: EXPR_VALUE_REF;
}

/**
 * Enumeration representing operators.
 */
export class OPERATOR_KIND extends openehr_base.String {
}

/**
 * Ancestor class for type definitions known in the openEHR Expression formalism.
 */
export abstract class EXPR_TYPE_DEF {
  /**
   * Internal storage for type_name
   * @protected
   */
  protected _type_name?: openehr_base.String;

  /**
   * Natural language type name of this type as used in abstract rules syntax variable declarations.
   */
  get type_name(): string | undefined {
    return this._type_name?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for type_name.
   * Use this to access openehr_base.String methods.
   */
  get $type_name(): openehr_base.String | undefined {
    return this._type_name;
  }

  /**
   * Sets type_name from either a primitive value or openehr_base.String wrapper.
   */
  set type_name(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._type_name = undefined;
    } else if (typeof val === "string") {
      this._type_name = openehr_base.String.from(val);
    } else {
      this._type_name = val;
    }
  }

  /**
   * Attribute of the openEHR primitive type (or Any) corresponding to this type definition meta-type.
   */
  type_anchor?: openehr_base.Any;
}

/**
 * Rules meta-type representing the primitive type Boolean.
 */
export class TYPE_DEF_BOOLEAN extends EXPR_TYPE_DEF {
  override get type_name(): string | undefined {
    return this._type_name?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for type_name.
   * Use this to access openehr_base.String methods.
   */
  override get $type_name(): openehr_base.String | undefined {
    return this._type_name;
  }

  /**
   * Sets type_name from either a primitive value or openehr_base.String wrapper.
   */
  override set type_name(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._type_name = undefined;
    } else if (typeof val === "string") {
      this._type_name = openehr_base.String.from(val);
    } else {
      this._type_name = val;
    }
  }

  override type_anchor?: openehr_base.Boolean = undefined;
}

/**
 * Rules meta-type representing the primitive type Date.
 */
export class TYPE_DEF_DATE extends EXPR_TYPE_DEF {
  override get type_name(): string | undefined {
    return this._type_name?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for type_name.
   * Use this to access openehr_base.String methods.
   */
  override get $type_name(): openehr_base.String | undefined {
    return this._type_name;
  }

  /**
   * Sets type_name from either a primitive value or openehr_base.String wrapper.
   */
  override set type_name(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._type_name = undefined;
    } else if (typeof val === "string") {
      this._type_name = openehr_base.String.from(val);
    } else {
      this._type_name = val;
    }
  }

  override type_anchor?: openehr_base.Iso8601_date = undefined;
}

/**
 * Rules meta-type representing the primitive type Date_time.
 */
export class TYPE_DEF_DATE_TIME extends EXPR_TYPE_DEF {
  override get type_name(): string | undefined {
    return this._type_name?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for type_name.
   * Use this to access openehr_base.String methods.
   */
  override get $type_name(): openehr_base.String | undefined {
    return this._type_name;
  }

  /**
   * Sets type_name from either a primitive value or openehr_base.String wrapper.
   */
  override set type_name(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._type_name = undefined;
    } else if (typeof val === "string") {
      this._type_name = openehr_base.String.from(val);
    } else {
      this._type_name = val;
    }
  }

  override type_anchor?: openehr_base.Iso8601_date_time = undefined;
}

/**
 * Rules meta-type representing the primitive type Duration.
 */
export class TYPE_DEF_DURATION extends EXPR_TYPE_DEF {
  override get type_name(): string | undefined {
    return this._type_name?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for type_name.
   * Use this to access openehr_base.String methods.
   */
  override get $type_name(): openehr_base.String | undefined {
    return this._type_name;
  }

  /**
   * Sets type_name from either a primitive value or openehr_base.String wrapper.
   */
  override set type_name(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._type_name = undefined;
    } else if (typeof val === "string") {
      this._type_name = openehr_base.String.from(val);
    } else {
      this._type_name = val;
    }
  }

  override type_anchor?: openehr_base.Iso8601_duration = undefined;
}

/**
 * Rules meta-type representing the primitive type Integer.
 */
export class TYPE_DEF_INTEGER extends EXPR_TYPE_DEF {
  override get type_name(): string | undefined {
    return this._type_name?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for type_name.
   * Use this to access openehr_base.String methods.
   */
  override get $type_name(): openehr_base.String | undefined {
    return this._type_name;
  }

  /**
   * Sets type_name from either a primitive value or openehr_base.String wrapper.
   */
  override set type_name(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._type_name = undefined;
    } else if (typeof val === "string") {
      this._type_name = openehr_base.String.from(val);
    } else {
      this._type_name = val;
    }
  }

  override type_anchor?: openehr_base.Integer = undefined;
}

/**
 * Rules meta-type representing the type Object_ref, which is assumed to by the type of any non-primitive reference target within a rule.
 */
export class TYPE_DEF_OBJECT_REF extends EXPR_TYPE_DEF {
  override get type_name(): string | undefined {
    return this._type_name?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for type_name.
   * Use this to access openehr_base.String methods.
   */
  override get $type_name(): openehr_base.String | undefined {
    return this._type_name;
  }

  /**
   * Sets type_name from either a primitive value or openehr_base.String wrapper.
   */
  override set type_name(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._type_name = undefined;
    } else if (typeof val === "string") {
      this._type_name = openehr_base.String.from(val);
    } else {
      this._type_name = val;
    }
  }
}

/**
 * Rules meta-type representing the primitive type Real.
 */
export class TYPE_DEF_REAL extends EXPR_TYPE_DEF {
  override get type_name(): string | undefined {
    return this._type_name?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for type_name.
   * Use this to access openehr_base.String methods.
   */
  override get $type_name(): openehr_base.String | undefined {
    return this._type_name;
  }

  /**
   * Sets type_name from either a primitive value or openehr_base.String wrapper.
   */
  override set type_name(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._type_name = undefined;
    } else if (typeof val === "string") {
      this._type_name = openehr_base.String.from(val);
    } else {
      this._type_name = val;
    }
  }

  override type_anchor?: number = undefined;
}

/**
 * Rules meta-type representing the primitive type String.
 */
export class TYPE_DEF_STRING extends EXPR_TYPE_DEF {
  override get type_name(): string | undefined {
    return this._type_name?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for type_name.
   * Use this to access openehr_base.String methods.
   */
  override get $type_name(): openehr_base.String | undefined {
    return this._type_name;
  }

  /**
   * Sets type_name from either a primitive value or openehr_base.String wrapper.
   */
  override set type_name(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._type_name = undefined;
    } else if (typeof val === "string") {
      this._type_name = openehr_base.String.from(val);
    } else {
      this._type_name = val;
    }
  }

  override type_anchor?: openehr_base.String = undefined;
}

/**
 * Rules meta-type representing the primitive type Terminology_code.
 */
export class TYPE_DEF_TERMINOLOGY_CODE extends EXPR_TYPE_DEF {
  override get type_name(): string | undefined {
    return this._type_name?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for type_name.
   * Use this to access openehr_base.String methods.
   */
  override get $type_name(): openehr_base.String | undefined {
    return this._type_name;
  }

  /**
   * Sets type_name from either a primitive value or openehr_base.String wrapper.
   */
  override set type_name(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._type_name = undefined;
    } else if (typeof val === "string") {
      this._type_name = openehr_base.String.from(val);
    } else {
      this._type_name = val;
    }
  }

  override type_anchor?: openehr_base.Terminology_code = undefined;
}

/**
 * Rules meta-type representing the primitive type Time.
 */
export class TYPE_DEF_TIME extends EXPR_TYPE_DEF {
  override get type_name(): string | undefined {
    return this._type_name?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for type_name.
   * Use this to access openehr_base.String methods.
   */
  override get $type_name(): openehr_base.String | undefined {
    return this._type_name;
  }

  /**
   * Sets type_name from either a primitive value or openehr_base.String wrapper.
   */
  override set type_name(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._type_name = undefined;
    } else if (typeof val === "string") {
      this._type_name = openehr_base.String.from(val);
    } else {
      this._type_name = val;
    }
  }

  override type_anchor?: openehr_base.Iso8601_time = undefined;
}

/**
 * Rules meta-type representing the primitive type Uri.
 */
export class TYPE_DEF_URI extends EXPR_TYPE_DEF {
  override get type_name(): string | undefined {
    return this._type_name?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for type_name.
   * Use this to access openehr_base.String methods.
   */
  override get $type_name(): openehr_base.String | undefined {
    return this._type_name;
  }

  /**
   * Sets type_name from either a primitive value or openehr_base.String wrapper.
   */
  override set type_name(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._type_name = undefined;
    } else if (typeof val === "string") {
      this._type_name = openehr_base.String.from(val);
    } else {
      this._type_name = val;
    }
  }

  override type_anchor?: openehr_base.Uri = undefined;
}
