// Generated from BMM schema: lang v1.1.0
// BMM Version: 2.4
// Schema Revision: 1.1.0.2
// Description: lang
// Source: https://raw.githubusercontent.com/sebastian-iancu/code-generator/master/code/BMM-JSON/openehr_lang_1.1.0.bmm.json
// Generated: 2025-11-11T08:25:30.770Z
// 
// This file was automatically generated from openEHR BMM (Basic Meta-Model) specifications.
// Do not edit manually - regenerate using: deno run --allow-read --allow-net --allow-write tasks/generate_ts_libs.ts
//
// For more information about openEHR specifications, visit: https://specifications.openehr.org/

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
type Boolean = any;
type C_OBJECT = any;
type Integer = any;
type Iso8601_date = any;
type Iso8601_date_time = any;
type Iso8601_duration = any;
type Iso8601_time = any;
type Multiplicity_interval = any;
type String = any;
type T = any;
type Terminology_code = any;
type Uri = any;

/**
 * Definitions used by all BMM packages.
 */
export class BMM_DEFINITIONS extends BASIC_DEFINITIONS {
    /**
     * built-in class definition corresponding to the top \`Any' class.
     * @returns Result value
     */
    Any_class(): BMM_SIMPLE_CLASS {
        throw new Error("Method Any_class not implemented.");
    }

    /**
     * Built-in type definition corresponding to the top \`Any' type.
     * @returns Result value
     */
    Any_type(): BMM_SIMPLE_TYPE {
        throw new Error("Method Any_type not implemented.");
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
    create_schema_id(a_model_publisher: Any, a_schema_name: Any, a_model_release: String): String {
        throw new Error("Method create_schema_id not implemented.");
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
    initialise_with_load_list(a_schema_dirs: undefined, a_schema_load_list: undefined): void {
        throw new Error("Method initialise_with_load_list not implemented.");
    }

    /**
     * Load all schemas found in a specified directories \`_a_schema_dirs_\`.
     * @param a_schema_dirs - Parameter
     * @returns Result value
     */
    initialise_all(a_schema_dirs: undefined): void {
        throw new Error("Method initialise_all not implemented.");
    }

    /**
     * Reload BMM schemas.
     * @returns Result value
     */
    reload_schemas(): void {
        throw new Error("Method reload_schemas not implemented.");
    }

    /**
     * Return model containing the model key which is a \`_model_id_\` or any shorter form e.g. model id minus the version. If a shorter key is used, the \`BMM_MODEL\` with the most recent version will be selected. Uses \`_matching_bmm_models_\` table to find matches if partial version information is supplied in key.
     * @param a_model_key - Parameter
     * @returns Result value
     */
    bmm_model(a_model_key: String): BMM_MODEL {
        throw new Error("Method bmm_model not implemented.");
    }

    /**
     * True if a model for a \`_model_key_\` is available. A model key is a \`_model_id_\` or any shorter form e.g. model id minus the version. If a shorter key is used, the Result s True if a \`BMM_MODEL\` with any version exists.
     * @param a_model_key - Parameter
     * @returns Result value
     */
    has_bmm_model(a_model_key: String): Boolean {
        throw new Error("Method has_bmm_model not implemented.");
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
     * Schema id, formed by 
     * 
     * \`{BMM_DEFINITIONS}.create_schema_id(
     *   meta_data.item({BMM_DEFINITIONS}.Metadata_model_publisher),
     *   meta_data.item({BMM_DEFINITIONS}.Metadata_schema_name),
     *   meta_data.item({BMM_DEFINITIONS}.Metadata_model_release)\`
     * 
     * e.g. \`openehr_rm_1.0.3\`, \`openehr_test_1.0.1\`, \`iso_13606_1_2008_2.1.2\`.
     */
    schema_id?: String;
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
    is_top_level(): Boolean {
        throw new Error("Method is_top_level not implemented.");
    }

    /**
     * True if the BMM version found in the schema (or assumed, if none) is compatible with that in this software.
     * @returns Result value
     */
    is_bmm_compatible(): Boolean {
        throw new Error("Method is_bmm_compatible not implemented.");
    }

    /**
     * Load schema into in-memory form, i.e. a \`P_BMM_SCHEMA\` instance, if structurally valid. If successful, \`_p_schema_\` will be set.
     * @returns Result value
     */
    load(): void {
        throw new Error("Method load not implemented.");
    }

    /**
     * Validate loaded schema and report errors.
     * @returns Result value
     */
    validate_merged(): void {
        throw new Error("Method validate_merged not implemented.");
    }

    /**
     * Validate includes list for this schema, to see if each mentioned schema exists in \`_all_schemas_\` list.
     * @param all_schemas_list - Parameter
     * @returns Result value
     */
    validate_includes(all_schemas_list: undefined): void {
        throw new Error("Method validate_includes not implemented.");
    }

    /**
     * Create \`schema\`, i.e. the \`BMM_MODEL\` from one \`P_BMM_SCHEMA\` schema.
     * @returns Result value
     */
    create_model(): void {
        throw new Error("Method create_model not implemented.");
    }

}

/**
 * Core properties of \`BMM_MODEL\`, may be used in a serial representation as well, such as \`P_BMM_SCHEMA\`.
 */
export class BMM_MODEL_METADATA {
    /**
     * Publisher of model expressed in the schema.
     */
    rm_publisher?: String;
    /**
     * Release of model expressed in the schema as a 3-part numeric, e.g. "3.1.0" . 
     */
    rm_release?: String;
}

/**
 * Abstract parent of any persistable form of a BMM model, e.g. \`P_BMM_SCHEMA\`.
 */
export abstract class BMM_SCHEMA extends BMM_MODEL_METADATA {
    /**
     * Version of BMM model, enabling schema evolution reasoning. Persisted attribute.
     */
    bmm_version?: String;
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
     * Name of this model, if this schema is a model root point. Not set for sub-schemas that are not considered models on their own.
     */
    model_name?: String;
    /**
     * Name of model expressed in schema; a 'schema' usually contains all of the packages of one 'model' of a publisher. A publisher with more than one model can have multiple schemas. 
     */
    schema_name?: String;
    /**
     * Revision of schema.
     */
    schema_revision?: String;
    /**
     * Schema development lifecycle state. 
     */
    schema_lifecycle_state?: String;
    /**
     * Primary author of schema. 
     */
    schema_author?: String;
    /**
     * Description of schema. 
     */
    schema_description?: String;
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
    read_to_validate(): Boolean {
        throw new Error("Method read_to_validate not implemented.");
    }

    /**
     * Identifier of this schema, used for stating inclusions and identifying files. Formed as:
     * 
     * \`{BMM_DEFINITIONS}.create_schema_id ( _rm_publisher_,  _schema_name_,   _rm_release_)\`
     * 
     * E.g. \`"openehr_rm_ehr_1.0.4"\`.
     * @returns Result value
     */
    schema_id(): String {
        throw new Error("Method schema_id not implemented.");
    }

}

/**
 * Schema inclusion structure.
 */
export class BMM_INCLUDE_SPEC {
    /**
     * Full identifier of the included schema, e.g. \`"openehr_primitive_types_1.0.2"\`.
     */
    id?: String;
}

export class BMM_SCHEMA_METADATA_KEY extends String {
}

/**
 * Enumeration of processing states of a \`BMM_SCHEMA\` used by creation and validation routines in \`BMM_SCHEMA\`.
 */
export class BMM_SCHEMA_STATE extends String {
}

/**
 * Abstract meta-type of BMM declared model elements. A _declaration_ is a an element of a model within a context, which defines the _scope_ of the element. Thus, a class definition and its property and routine definitions are model elements, but Types are not, since they are derived from model elements.
 */
export abstract class BMM_MODEL_ELEMENT {
    /**
     * Name of this model element.
     */
    name?: String;
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
    is_root_scope(): Boolean {
        throw new Error("Method is_root_scope not implemented.");
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
     * True if this element can be null (Void) at execution time. May be interpreted as optionality in subtypes..
     */
    is_nullable?: Boolean;
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
    is_boolean(): Boolean {
        throw new Error("Method is_boolean not implemented.");
    }

}

/**
 * A module-scoped formal element.
 */
export abstract class BMM_FEATURE extends BMM_FORMAL_ELEMENT {
    /**
     * True if this feature was synthesised due to generic substitution in an inherited type, or further constraining of a formal generic parameter.
     */
    is_synthesised_generic?: Boolean;
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
     * True if this property is marked with info model \`_im_runtime_\` property.
     */
    is_im_runtime?: Boolean;
    /**
     * True if this property was marked with info model \`_im_infrastructure_\` flag.
     */
    is_im_infrastructure?: Boolean;
    /**
     * True if this property instance is a compositional sub-part of the owning class instance. Equivalent to 'composition' in UML associations (but missing from UML properties without associations) and also 'cascade-delete' semantics in ER schemas.
     */
    is_composition?: Boolean;
    /**
     * Interval form of \`0..1\`, \`1..1\` etc, derived from \`_is_nullable_\`.
     * @returns Result value
     */
    existence(): Multiplicity_interval {
        throw new Error("Method existence not implemented.");
    }

    /**
     * Name of this property to display in UI.
     * @returns Result value
     */
    display_name(): String {
        throw new Error("Method display_name not implemented.");
    }

}

/**
 * Meta-type of for properties of linear container type, such as List<T> etc.
 */
export class BMM_CONTAINER_PROPERTY extends BMM_PROPERTY {
    /**
     * Cardinality of this container.
     */
    cardinality?: Multiplicity_interval;
    /**
     * Declared or inferred static type of the entity.
     */
    override type?: BMM_CONTAINER_TYPE = undefined;
    /**
     * Name of this property in form \`name: ContainerTypeName<>\`.
     * @returns Result value
     */
    display_name(): String {
        throw new Error("Method display_name not implemented.");
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
    arity(): Integer {
        throw new Error("Method arity not implemented.");
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
     * Formal name of the operator, e.g. 'minus' etc.
     */
    name?: String;
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
        throw new Error("Method signature not implemented.");
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
    display_name(): String {
        throw new Error("Method display_name not implemented.");
    }

}

/**
 * Automatically declared variable representing result of a Function call (writable).
 */
export class BMM_RESULT extends BMM_WRITABLE_VARIABLE {
    /**
     * Name of this model element.
     */
    override name?: String;
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
     * Name of this feature group; defaults to 'feature'.
     */
    name?: String;
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
    override name?: String;
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
export class BMM_OPERATOR_POSITION extends String {
}

/**
 * Enumeration of parameter read/write direction values.
 */
export class BMM_PARAMETER_DIRECTION extends String {
}

/**
 * Meta-type for literal instance values declared in a model. Instance values may be inline values of primitive types in the usual fashion or complex objects in syntax form, e.g. JSON.
 */
export abstract class BMM_LITERAL_VALUE<T extends BMM_TYPE> {
    /**
     * A serial representation of the value.
     */
    value_literal?: String;
    /**
     * A native representation of the value, possibly derived by deserialising \`_value_literal_\`.
     */
    value?: Any;
    /**
     * Optional specification of formalism of the \`_value_literal_\` attribute for complex values. Value may be any of \`json | json5 | yawl | xml | odin | rdf\` or another value agreed by the user community. If not set, \`json\` is assumed.
     */
    syntax?: String;
    /**
     * Concrete type of this literal.
     */
    type?: T;
}

/**
 * Meta-type for literals whose concrete type is a unitary type in the BMM sense.
 */
export abstract class BMM_UNITARY_VALUE<T extends BMM_UNITARY_TYPE> extends BMM_LITERAL_VALUE<T> {
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
    override value?: Integer = undefined;
}

/**
 * Meta-type for a literal String value, for which \`_type_\` is fixed to the \`BMM_TYPE\` representing \`String\` and \`_value_\` is of type \`String\`.
 */
export class BMM_STRING_VALUE extends BMM_PRIMITIVE_VALUE {
    /**
     * Native String value.
     */
    override value?: String = undefined;
}

/**
 * Meta-type for a literal Boolean value, for which \`_type_\` is fixed to the \`BMM_TYPE\` representing \`Boolean\` and \`_value_\` is of type \`Boolean\`.
 */
export class BMM_BOOLEAN_VALUE extends BMM_PRIMITIVE_VALUE {
    /**
     * Native Boolean value.
     */
    override value?: Boolean = undefined;
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
    package_at_path(a_path: String): BMM_PACKAGE {
        throw new Error("Method package_at_path not implemented.");
    }

    /**
     * Recursively execute \`_action_\`, which is a procedure taking a \`BMM_PACKAGE\` argument, on all members of packages.
     * @param action - Parameter
     * @returns Result value
     */
    do_recursive_packages(action: EL_PROCEDURE_AGENT): void {
        throw new Error("Method do_recursive_packages not implemented.");
    }

    /**
     * True if there is a package at the path \`_a_path_\`; paths are delimited with delimiter \`{BMM_DEFINITIONS} _Package_name_delimiter_\`.
     * @param a_path - Parameter
     * @returns Result value
     */
    has_package_path(a_path: String): Boolean {
        throw new Error("Method has_package_path not implemented.");
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
    model_id(): String {
        throw new Error("Method model_id not implemented.");
    }

    /**
     * Retrieve the class definition corresponding to \`_a_type_name_\` (which may contain a generic part).
     * @param a_name - Parameter
     * @returns Result value
     */
    class_definition(a_name: String): BMM_CLASS {
        throw new Error("Method class_definition not implemented.");
    }

    /**
     * Retrieve the class definition corresponding to \`_a_type_name_\`. If it contains a generic part, this will be removed if it is a fully open generic name, otherwise it will remain intact, i.e. if it is an effective generic name that identifies a \`BMM_GENERIC_CLASS_EFFECTIVE\`.
     * @returns Result value
     */
    type_definition(): BMM_CLASS {
        throw new Error("Method type_definition not implemented.");
    }

    /**
     * True if \`_a_class_name_\` has a class definition in the model.
     * @param a_class_name - Parameter
     * @returns Result value
     */
    has_class_definition(a_class_name: String): Boolean {
        throw new Error("Method has_class_definition not implemented.");
    }

    /**
     * True if \`_a_type_name_\` is already concretely known in the system, including if it is generic, which may be open, partially open or closed.
     * @param a_type_name - Parameter
     * @returns Result value
     */
    has_type_definition(a_type_name: String): Boolean {
        throw new Error("Method has_type_definition not implemented.");
    }

    /**
     * Retrieve the enumeration definition corresponding to \`_a_type_name_\`.
     * @param a_name - Parameter
     * @returns Result value
     */
    enumeration_definition(a_name: String): BMM_ENUMERATION {
        throw new Error("Method enumeration_definition not implemented.");
    }

    /**
     * List of keys in \`_class_definitions_\` of items marked as primitive types.
     * @returns Result value
     */
    primitive_types(): String {
        throw new Error("Method primitive_types not implemented.");
    }

    /**
     * List of keys in \`_class_definitions_\` of items that are enumeration types.
     * @returns Result value
     */
    enumeration_types(): String {
        throw new Error("Method enumeration_types not implemented.");
    }

    /**
     * Retrieve the property definition for \`_a_prop_name_\` in flattened class corresponding to \`_a_type_name_\`.
     * @returns Result value
     */
    property_definition(): BMM_PROPERTY {
        throw new Error("Method property_definition not implemented.");
    }

    /**
     * True if \`_a_ms_property_type_\` is a valid 'MS' dynamic type for \`_a_property_\` in BMM type \`_a_bmm_type_name_\`. 'MS' conformance means 'model-semantic' conformance, which abstracts away container types like \`List<>\`, \`Set<>\` etc and compares the dynamic type with the relation target type in the UML sense, i.e. regardless of whether there is single or multiple containment.
     * @param a_bmm_type_name - Parameter
     * @param a_bmm_property_name - Parameter
     * @param a_ms_property_name - Parameter
     * @returns Result value
     */
    ms_conformant_property_type(a_bmm_type_name: String, a_bmm_property_name: String, a_ms_property_name: String): Boolean {
        throw new Error("Method ms_conformant_property_type not implemented.");
    }

    /**
     * Retrieve the property definition for \`_a_property_path_\` in flattened class corresponding to \`_a_type_name_\`.
     * @returns Result value
     */
    property_definition_at_path(): BMM_PROPERTY {
        throw new Error("Method property_definition_at_path not implemented.");
    }

    /**
     * Retrieve the class definition for the class that owns the terminal attribute in \`a_prop_path\` in flattened class corresponding to \`a_type_name\`.
     * @param a_type_name - Parameter
     * @param a_prop_path - Parameter
     * @returns Result value
     */
    class_definition_at_path(a_type_name: String, a_prop_path: String): BMM_CLASS {
        throw new Error("Method class_definition_at_path not implemented.");
    }

    /**
     * Return all ancestor types of \`_a_class_name_\` up to root class (usually \`Any\`, \`Object\` or something similar). Does  not include current class. Returns empty list if none.
     * @param a_class - Parameter
     * @returns Result value
     */
    all_ancestor_classes(a_class: String): String {
        throw new Error("Method all_ancestor_classes not implemented.");
    }

    /**
     * True if \`_a_class_name_\` is a descendant in the model of \`_a_parent_class_name_\`.
     * @param a_class_name - Parameter
     * @param a_parent_class_name - Parameter
     * @returns Result value
     */
    is_descendant_of(a_class_name: String, a_parent_class_name: String): Boolean {
        throw new Error("Method is_descendant_of not implemented.");
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
    type_conforms_to(a_desc_type: String, an_anc_type: String): Boolean {
        throw new Error("Method type_conforms_to not implemented.");
    }

    /**
     * Generate type substitutions for the supplied type, which may be simple, generic (closed, open or partially open), or a container type. In the generic and container cases, the result is the permutation of the base class type and type substitutions of all generic parameters.
     * @param a_type - Parameter
     * @returns Result value
     */
    subtypes(a_type: String): String {
        throw new Error("Method subtypes not implemented.");
    }

    /**
     * \`BMM_SIMPLE_CLASS\` instance for the \`Any\` class. This may be defined in the BMM schema, but if not, use \`BMM_DEFINITIONS._any_class_\`.
     * @returns Result value
     */
    any_class_definition(): BMM_SIMPLE_CLASS {
        throw new Error("Method any_class_definition not implemented.");
    }

    /**
     * \`BMM_SIMPLE_TYPE\` instance for the \`Any\` type.
     * @returns Result value
     */
    any_type_definition(): BMM_SIMPLE_TYPE {
        throw new Error("Method any_type_definition not implemented.");
    }

    /**
     * \`BMM_SIMPLE_TYPE\` instance for the \`Boolean\` type.
     * @returns Result value
     */
    boolean_type_definition(): BMM_SIMPLE_TYPE {
        throw new Error("Method boolean_type_definition not implemented.");
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
        throw new Error("Method root_classes not implemented.");
    }

    /**
     * Full path of this package back to root package.
     * @returns Result value
     */
    path(): String {
        throw new Error("Method path not implemented.");
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
    is_boolean(): Boolean {
        throw new Error("Method is_boolean not implemented.");
    }

}

/**
 * Abstract parent of operator types.
 */
export abstract class EL_OPERATOR extends EL_EXPRESSION {
    /**
     * True if the natural precedence of operators is overridden in the expression represented by this node of the expression tree. If True, parentheses should be introduced around the totality of the syntax expression corresponding to this operator node and its operands.
     */
    precedence_overridden?: Boolean;
    /**
     * The symbol actually used in the expression, or intended to be used for serialisation. Must be a member of \`OPERATOR_DEF._symbols_\`.
     */
    symbol?: String;
    /**
     * Function call equivalent to this operator expression, inferred by matching operator against functions defined in interface of principal operand.
     */
    call?: EL_FUNCTION_CALL;
    /**
     * Operator definition derived from \`_definition.operator_definition()_\`.
     * @returns Result value
     */
    operator_definition(): BMM_OPERATOR {
        throw new Error("Method operator_definition not implemented.");
    }

    /**
     * Function call equivalent to this operator.
     * @returns Result value
     */
    equivalent_call(): EL_FUNCTION_CALL {
        throw new Error("Method equivalent_call not implemented.");
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
        throw new Error("Method eval_type not implemented.");
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
    is_writable?: Boolean;
    /**
     * Name used to represent the reference or other entity.
     */
    name?: String;
    /**
     * Generated full reference name, based on constituent parts of the entity. Default version outputs \`_name_\` field.
     * @returns Result value
     */
    reference(): String {
        throw new Error("Method reference not implemented.");
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
    reference(): String {
        throw new Error("Method reference not implemented.");
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
    override is_writable?: Boolean;
    /**
     * Type definition (i.e. BMM meta-type definition object) of the constant, property or variable, inferred by inspection of the current scoping instance. Return \`_definition.type_\`.
     * @returns Result value
     */
    eval_type(): BMM_TYPE {
        throw new Error("Method eval_type not implemented.");
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
        throw new Error("Method eval_type not implemented.");
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
    override is_writable?: Boolean;
    /**
     * Return \`_agent.definition.type_\`.
     * @returns Result value
     */
    eval_type(): BMM_TYPE {
        throw new Error("Method eval_type not implemented.");
    }

    /**
     * Generated full reference name, consisting of any scoping elements, function name and routine parameters enclosed in parentheses.
     * @returns Result value
     */
    reference(): String {
        throw new Error("Method reference not implemented.");
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
    override name?: String;
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
    override is_writable?: Boolean;
    /**
     * Eval type is the signature corresponding to the (remaining) open arguments and return type, if any.
     * @returns Result value
     */
    eval_type(): BMM_ROUTINE_TYPE {
        throw new Error("Method eval_type not implemented.");
    }

    /**
     * True if there are no open arguments.
     * @returns Result value
     */
    is_callable(): Boolean {
        throw new Error("Method is_callable not implemented.");
    }

    /**
     * Generated full reference name, including scoping elements.
     * @returns Result value
     */
    reference(): String {
        throw new Error("Method reference not implemented.");
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
     * Optional name of tuple item.
     */
    name?: String;
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
        throw new Error("Method eval_type not implemented.");
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
        throw new Error("Method eval_type not implemented.");
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
        throw new Error("Method eval_type not implemented.");
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
    is_mutable?: Boolean;
    /**
     * Return \`_type_\`.
     * @returns Result value
     */
    eval_type(): BMM_TYPE {
        throw new Error("Method eval_type not implemented.");
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
export class EL_CONDITIONAL_EXPRESSION<T extends EL_TERMINAL> extends EL_DECISION_BRANCH<T> {
    /**
     * Boolean expression defining the condition of this decision branch.
     */
    condition?: EL_EXPRESSION;
}

/**
 * Meta-type for decision tables. Generic on the meta-type of the \`_result_\` attribute of the branches, to allow specialised forms of if/else and case structures to be created.
 */
export abstract class EL_DECISION_TABLE<T extends EL_TERMINAL> extends EL_TERMINAL {
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
export class EL_CONDITION_CHAIN<T extends EL_TERMINAL> extends EL_DECISION_TABLE<T> {
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
    override is_writable?: Boolean;
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
    override is_writable?: Boolean;
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
    override is_writable?: Boolean;
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
     * Optional tag, typically used to designate design intention of the assertion, e.g. \`"Inv_all_members_valid"\`.
     */
    tag?: String;
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
    name?: String;
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
     * Optional documentation of this element.
     */
    documentation?: String;
}

/**
 * Definition of persistent form of \`BMM_CLASS\` for serialisation to ODIN, JSON, XML etc.
 */
export class P_BMM_CLASS extends P_BMM_MODEL_ELEMENT {
    /**
     * Name of the class. Persisted attribute.
     */
    name?: String;
    /**
     * List of immediate inheritance parents. If there are generic ancestors, use \`_ancestor_defs_\` instead. Persisted attribute.
     */
    ancestors?: undefined;
    /**
     * List of attributes defined in this class. Persistent attribute.
     */
    properties?: undefined;
    /**
     * True if this is an abstract type. Persisted attribute.
     */
    is_abstract?: Boolean;
    /**
     * True if this class definition overrides one found in an included schema.
     */
    is_override?: Boolean;
    /**
     * List of generic parameter definitions. Persisted attribute.
     */
    generic_parameter_defs?: undefined;
    /**
     * Reference to original source schema defining this class. Set during \`BMM_SCHEMA\` materialise. Useful for GUI tools to enable user to edit the schema file containing a given class (i.e. taking into account that a class may be in any of the schemas in a schema inclusion hierarchy).
     */
    source_schema_id?: String;
    /**
     * \`BMM_CLASS\` object built by \`_create_bmm_class_definition_\` and \`_populate_bmm_class_definition_\`.
     */
    bmm_class?: BMM_CLASS;
    /**
     * Unique id generated for later comparison during merging, in order to detect if two classes are the same. Assigned in post-load processing.
     */
    uid?: Integer;
    /**
     * List of structured inheritance ancestors, used only in the case of generic inheritance. Persisted attribute.
     */
    ancestor_defs?: undefined;
    /**
     * True if this class is a generic class.
     * @returns Result value
     */
    is_generic(): Boolean {
        throw new Error("Method is_generic not implemented.");
    }

    /**
     * Create \`_bmm_class_definition_\`.
     * @returns Result value
     */
    create_bmm_class(): void {
        throw new Error("Method create_bmm_class not implemented.");
    }

    /**
     * Add remaining model elements from Current to \`_bmm_class_definition_\`.
     * @param a_bmm_schema - Parameter
     * @returns Result value
     */
    populate_bmm_class(a_bmm_schema: BMM_MODEL): void {
        throw new Error("Method populate_bmm_class not implemented.");
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
        throw new Error("Method validate_created not implemented.");
    }

    /**
     * Implementation of \`_load_finalise()_\`
     * @returns Result value
     */
    load_finalise(): void {
        throw new Error("Method load_finalise not implemented.");
    }

    /**
     * Implementation of \`_merge()_\`
     * @param other - Parameter
     * @returns Result value
     */
    merge(other: P_BMM_SCHEMA): void {
        throw new Error("Method merge not implemented.");
    }

    /**
     * Implementation of \`_validate()_\`
     * @returns Result value
     */
    validate(): void {
        throw new Error("Method validate not implemented.");
    }

    /**
     * Implementation of \`_create_bmm_model()_\`
     * @returns Result value
     */
    create_bmm_model(): void {
        throw new Error("Method create_bmm_model not implemented.");
    }

    /**
     * Package structure in which all top-level qualified package names like \`xx.yy.zz\` have been expanded out to a hierarchy of \`BMM_PACKAGE\` objects.
     * @returns Result value
     */
    canonical_packages(): P_BMM_PACKAGE {
        throw new Error("Method canonical_packages not implemented.");
    }

}

/**
 * Persistent form of \`BMM_PROPERTY\`.
 */
export abstract class P_BMM_PROPERTY extends P_BMM_MODEL_ELEMENT {
    /**
     * Name of this property within its class. Persisted attribute.
     */
    name?: String;
    /**
     * True if this property is mandatory in its class. Persisted attribute.
     */
    is_mandatory?: Boolean;
    /**
     * True if this property is computed rather than stored in objects of this class. Persisted Attribute.
     */
    is_computed?: Boolean;
    /**
     * True if this property is info model 'infrastructure' rather than 'data'. Persisted attribute.
     */
    is_im_infrastructure?: Boolean;
    /**
     * True if this property is info model 'runtime' settable property. Persisted attribute.
     */
    is_im_runtime?: Boolean;
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
        throw new Error("Method create_bmm_property not implemented.");
    }

}

/**
 * Persistent form of \`BMM_GENERIC_PARAMETER\`.
 */
export class P_BMM_GENERIC_PARAMETER extends P_BMM_MODEL_ELEMENT {
    /**
     * Name of the parameter, e.g. 'T' etc. Persisted attribute. Name is limited to 1 character, upper case.
     */
    name?: String;
    /**
     * Optional conformance constraint - the name of a type to which a concrete substitution of this generic parameter must conform. Persisted attribute.
     */
    conforms_to_type?: String;
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
        throw new Error("Method create_bmm_generic_parameter not implemented.");
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
    abstract as_type_string(): String;

}

/**
 * Persistent form of \`BMM_CONTAINER_TYPE\`.
 */
export class P_BMM_CONTAINER_TYPE extends P_BMM_TYPE {
    /**
     * The type of the container. This converts to the \`_root_type_\` in \`BMM_GENERIC_TYPE\`. Persisted attribute.
     */
    container_type?: String;
    /**
     * Type definition of \`_type_\`, if not a simple String type reference. Persisted attribute.
     */
    type_def?: P_BMM_BASE_TYPE;
    /**
     * The target type; this converts to the first parameter in \`_generic_parameters_\` in \`BMM_GENERIC_TYPE\`. Persisted attribute.
     */
    type?: String;
    /**
     * Result of \`_create_bmm_type()_\` call.
     */
    override bmm_type?: BMM_CONTAINER_TYPE = undefined;
    /**
     * The target type; this converts to the first parameter in \`_generic_parameters_\` in \`BMM_GENERIC_TYPE\`. Persisted attribute.
     * @returns Result value
     */
    type_ref(): P_BMM_BASE_TYPE {
        throw new Error("Method type_ref not implemented.");
    }

}

/**
 * Persistent form of \`BMM_PROPER_TYPE\`.
 */
export abstract class P_BMM_BASE_TYPE extends P_BMM_TYPE {
    value_constraint?: String;
}

/**
 * Persistent form of \`BMM_SIMPLE_TYPE\`.
 */
export class P_BMM_SIMPLE_TYPE extends P_BMM_BASE_TYPE {
    /**
     * Name of type - must be a simple class name.
     */
    type?: String;
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
     * Simple type parameter as a single letter like 'T', 'G' etc.
     */
    type?: String;
    /**
     * Result of \`_create_bmm_type()_\` call.
     */
    override bmm_type?: Any = undefined;
}

/**
 * Persistent form of \`BMM_GENERIC_TYPE\`.
 */
export class P_BMM_GENERIC_TYPE extends P_BMM_BASE_TYPE {
    /**
     * Root type of this generic type, e.g. \`Interval\` in \`Interval<Integer>\`.
     */
    root_type?: String;
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
        throw new Error("Method generic_parameter_refs not implemented.");
    }

}

/**
 * Persisted form of a package as a tree structure whose nodes can contain more packages and/or classes.
 */
export class P_BMM_PACKAGE extends P_BMM_PACKAGE_CONTAINER {
    /**
     * Name of the package from schema; this name may be qualified if it is a top-level package within the schema, or unqualified. Persistent attribute.
     */
    name?: String;
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
        throw new Error("Method merge not implemented.");
    }

    /**
     * Generate a \`BMM_PACKAGE_DEFINITION\` object and write it to \`_bmm_package_definition_\`.
     * @returns Result value
     */
    create_bmm_package_definition(): void {
        throw new Error("Method create_bmm_package_definition not implemented.");
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
        throw new Error("Method create_bmm_property not implemented.");
    }

}

/**
 * Persistent form of \`BMM_SINGLE_PROPERTY\`.
 */
export class P_BMM_SINGLE_PROPERTY extends P_BMM_PROPERTY {
    /**
     * If the type is a simple type, then this attribute will hold the type name. If the type is a container or generic, then type_ref will hold the type definition. The resulting type is generated in type_def.
     */
    type?: String;
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
        throw new Error("Method type_def not implemented.");
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
     * Type definition of this property, if a simple String type reference. Really we should use \`_type_def_\` to be regular in the schema, but that makes the schema more wordy and less clear. So we use this persisted String value, and compute the \`_type_def_\` on the fly. Persisted attribute.
     */
    type?: String;
    /**
     * \`BMM_PROPERTY\` created by \`_create_bmm_property_definition_\`.
     */
    override bmm_property?: BMM_UNITARY_PROPERTY = undefined;
    /**
     * Generate \`_type_ref_\` from \`_type_\` and save.
     * @returns Result value
     */
    type_def(): P_BMM_OPEN_TYPE {
        throw new Error("Method type_def not implemented.");
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
    index_type?: String;
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
     * Expression tag, used for differentiating multiple assertions.
     */
    tag?: String;
    /**
     * String form of expression, in case an expression evaluator taking String expressions is used for evaluation. 
     */
    string_expression?: String;
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
    abstract value(): Any;

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
     * True if the natural precedence of operators is overridden in the expression represented by this node of the expression tree. If True, parentheses should be introduced around the totality of the syntax expression corresponding to this operator node and its operands.
     */
    precedence_overridden?: Boolean;
    /**
     * Operator definition.
     */
    operator?: OPERATOR_KIND;
    /**
     * The symbol actually used in the rule, or intended to be used for serialisation. Must be a member of \`operator_def.symbols\`.
     */
    symbol?: String;
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
 * 
 */
export abstract class EXPR_LEAF extends EXPRESSION {
    /**
     * The reference item from which the value of this node can be computed.
     */
    item?: Any;
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
    override item?: Any;
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
     * Optional name of context. This allows a basic separation of query types to be done in more sophisticated environments. Possible values might be “patient”, “medications” and so on.
     * Not yet standardised.
     * 
     */
    context?: String;
    /**
     * Identifier of query in the external context, e.g. “date_of_birth”.
     * Not yet standardised.
     * 
     */
    query_id?: String;
    /**
     * Optional arguments to query.
     * Not yet standardised.
     * 
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
     * Optional name of this rule set.
     */
    name?: String;
    /**
     * Execution result of the whole rule set. Determined by the and-ing of result values of Assertions in the rule set.
     * @returns Result value
     */
    execution_result(): Boolean {
        throw new Error("Method execution_result not implemented.");
    }

}

/**
 * Meta-type for the declaration of a named variable that can be used in an expression.
 */
export class VARIABLE_DECLARATION extends STATEMENT {
    /**
     * Name of the variable.
     */
    name?: String;
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
export class OPERATOR_KIND extends String {
}

/**
 * Ancestor class for type definitions known in the openEHR Expression formalism.
 */
export abstract class EXPR_TYPE_DEF {
    /**
     * Natural language type name of this type as used in abstract rules syntax variable declarations.
     */
    type_name?: String;
    /**
     * Attribute of the openEHR primitive type (or Any) corresponding to this type definition meta-type.
     */
    type_anchor?: Any;
}

/**
 * Rules meta-type representing the primitive type Boolean.
 */
export class TYPE_DEF_BOOLEAN extends EXPR_TYPE_DEF {
    override type_name?: String;
    override type_anchor?: Boolean = undefined;
}

/**
 * Rules meta-type representing the primitive type Date.
 */
export class TYPE_DEF_DATE extends EXPR_TYPE_DEF {
    override type_name?: String;
    override type_anchor?: Iso8601_date = undefined;
}

/**
 * Rules meta-type representing the primitive type Date_time.
 */
export class TYPE_DEF_DATE_TIME extends EXPR_TYPE_DEF {
    override type_name?: String;
    override type_anchor?: Iso8601_date_time = undefined;
}

/**
 * Rules meta-type representing the primitive type Duration.
 */
export class TYPE_DEF_DURATION extends EXPR_TYPE_DEF {
    override type_name?: String;
    override type_anchor?: Iso8601_duration = undefined;
}

/**
 * Rules meta-type representing the primitive type Integer.
 */
export class TYPE_DEF_INTEGER extends EXPR_TYPE_DEF {
    override type_name?: String;
    override type_anchor?: Integer = undefined;
}

/**
 * Rules meta-type representing the type Object_ref, which is assumed to by the type of any non-primitive reference target within a rule.
 */
export class TYPE_DEF_OBJECT_REF extends EXPR_TYPE_DEF {
    override type_name?: String;
}

/**
 * Rules meta-type representing the primitive type Real.
 */
export class TYPE_DEF_REAL extends EXPR_TYPE_DEF {
    override type_name?: String;
    override type_anchor?: number = undefined;
}

/**
 * Rules meta-type representing the primitive type String.
 */
export class TYPE_DEF_STRING extends EXPR_TYPE_DEF {
    override type_name?: String;
    override type_anchor?: String = undefined;
}

/**
 * Rules meta-type representing the primitive type Terminology_code.
 */
export class TYPE_DEF_TERMINOLOGY_CODE extends EXPR_TYPE_DEF {
    override type_name?: String;
    override type_anchor?: Terminology_code = undefined;
}

/**
 * Rules meta-type representing the primitive type Time.
 */
export class TYPE_DEF_TIME extends EXPR_TYPE_DEF {
    override type_name?: String;
    override type_anchor?: Iso8601_time = undefined;
}

/**
 * Rules meta-type representing the primitive type Uri.
 */
export class TYPE_DEF_URI extends EXPR_TYPE_DEF {
    override type_name?: String;
    override type_anchor?: Uri = undefined;
}

