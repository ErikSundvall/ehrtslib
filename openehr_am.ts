// Generated from BMM schema: am v2.4.0
// BMM Version: 2.4
// Schema Revision: 2.4.0.2
// Description: openEHR Archetype Model
// Source: https://raw.githubusercontent.com/sebastian-iancu/code-generator/master/code/BMM-JSON/openehr_am_2.4.0.bmm.json
// Generated: 2025-11-10T12:36:29.635Z
// 
// This file was automatically generated from openEHR BMM (Basic Meta-Model) specifications.
// Do not edit manually - regenerate using: deno run --allow-read --allow-net --allow-write tasks/generate_ts_libs.ts
//
// For more information about openEHR specifications, visit: https://specifications.openehr.org/

import * as openehr_base from "./openehr_base.ts";

// Unknown types - defined as 'any' for now
type T = any;

/**
 * Archetype equivalent to ARCHETYPED class in Common reference model. Defines semantics of identfication, lifecycle, versioning, composition and specialisation.
 */
export class ARCHETYPE {
    /**
     * Root node of the definition of this archetype.
     */
    definition?: C_COMPLEX_OBJECT;
    /**
     * The ontology of the archetype.
     */
    ontology?: ARCHETYPE_ONTOLOGY;
    /**
     * ADL version if archetype was read in from an ADL sharable archetype.
     */
    adl_version?: string;
    /**
     * Multi-axial identifier of this archetype in archetype space.
     */
    archetype_id?: openehr_base.ARCHETYPE_ID;
    /**
     * OID identifier of this archetype.
     */
    uid?: openehr_base.HIER_OBJECT_ID;
    /**
     * The normative meaning of the archetype as a whole, expressed as a local archetype code, typically “at0000”.
     */
    concept?: string;
    /**
     * Identifier of the specialisation parent of this archetype.
     */
    parent_archetype_id?: openehr_base.ARCHETYPE_ID;
    /**
     * Invariant statements about this object. Statements are expressed in first order predicate logic, and usually refer to at least two attributes.
     */
    invariants?: undefined;
}

/**
 * Root object of a standalone, authored archetype, including all meta-data, description, other identifiers and lifecycle.
 */
export class AUTHORED_ARCHETYPE {
    /**
     * ADL version if archetype was read in from an ADL sharable archetype.
     */
    adl_version?: string;
    /**
     * Unique identifier of this archetype artefact instance. A new identifier is assigned every time the content is changed by a tool. Used by tools to distinguish different revisions and/or interim snapshots of the same artefact.
     */
    build_uid?: string;
    /**
     * Semver.org compatible release of the most recent reference model release on which the archetype in its current version is based. This does not imply conformance only to this release, since an archetype may be valid with respect to multiple releases of a reference model.
     */
    rm_release?: string;
    /**
     * If True, indicates that this artefact was machine-generated from some other source, in which case, tools would expect to overwrite this artefact on a new generation. Editing tools should set this value to False when a user starts to manually edit an archetype.
     */
    is_generated?: boolean;
    other_meta_data?: undefined;
}

/**
 * Class representing source template, i.e. a kind of archetype that may include template overlays, and may be restricted by tools to only defining mandations, prohibitions, and restrictions on elements already defined in the flat parent.
 */
export class TEMPLATE {
    /**
     * Overlay archetypes, i.e. partial archetypes that include full definition and terminology, but logically derive all their meta-data from the owning template.
     */
    overlays?: undefined;
}

/**
 * Root object of an operational template. An operational template is derived from a \`TEMPLATE\` definition and the \`ARCHETYPEs\` and/or \`TEMPLATE_OVERLAYs\` mentioned by that template by a process of flattening, and potentially removal of unneeded languages and terminologies.
 * 
 * An operational template is used for generating and validating RM-canonical instance data, and also as a source artefact for generating other downstream technical artefacts, including XML schemas, APIs and UI form definitions.
 */
export class OPERATIONAL_TEMPLATE {
    /**
     * Compendium of flattened terminologies of archetypes  referenced from this template, keyed by archetype identifier. This will almost always be present in a template.
     */
    component_terminologies?: undefined;
    /**
     * Compendium of flattened terminology extracts (i.e. from external terminologies) from archetypes referenced from this template, keyed by archetype identifier.
     */
    terminology_extracts?: undefined;
}

/**
 * A concrete form of the bare \`ARCHETYPE\` class, used to represent overlays in a source template. Overlays have no meta-data of their own, and are instead documented by their owning template.
 */
export class TEMPLATE_OVERLAY {
}

/**
 * Human-readable structured identifier (HRID) for an archetype or template.
 */
export class ARCHETYPE_HRID {
    /**
     * Reverse domain name namespace identifier.
     */
    namespace?: string;
    /**
     * Name of the Reference Model publisher.
     */
    rm_publisher?: string;
    /**
     * Name of the package in whose reachability graph the \`_rm_class_\` class is found (there can be more than one possibility in many reference models).
     */
    rm_package?: string;
    /**
     * Name of the root class of this archetype.
     */
    rm_class?: string;
    /**
     * The short concept name of the archetype as used in the multi-axial \`_archetype_hrid_\`.
     */
    concept_id?: string;
    /**
     * The full numeric version of this archetype consisting of 3 parts, e.g. \`"1.8.2"\`. The \`_archetype_hrid_\` feature includes only the major version.
     */
    release_version?: string;
    /**
     * The status of the version, i.e.:
     * 
     * * released: (empty string)
     * * release_candidate: \`"rc"\`
     * * alpha: \`"alpha"\`
     * * beta: \`"beta"\`
     */
    version_status?: openehr_base.VERSION_STATUS;
    /**
     * The build count since last increment of any version part.
     */
    build_count?: string;
}

/**
 * Archetype equivalent to LOCATABLE class in openEHR Common reference model. Defines common constraints for any inheritor of LOCATABLE in any reference model. 
 */
export class ARCHETYPE_CONSTRAINT {
}

/**
 * Abstract model of constraint on any kind of object node. 
 */
export class C_OBJECT {
    /**
     * Reference model type that this node corresponds to. 
     */
    rm_type_name?: string;
    /**
     * Occurrences of this object node in the data, under the owning attribute. Upper limit can only be greater than 1 if owning attribute has a cardinality of more than 1).
     */
    occurrences?: undefined;
    /**
     * Semantic identifier of this node, used to dis-tinguish sibling nodes. All nodes must have a node_id; for nodes under a container C_ATTRIBUTE, the id must be an id-code must be defined in the archetype terminolo-gy. For valid structures, all node ids are id-codes.
     * For C_PRIMITIVE_OBJECTs, it will have the special value Primitive_node_id.
     * 
     */
    node_id?: string;
}

/**
 * Abstract model of constraint on any kind of attribute node.
 */
export class C_ATTRIBUTE {
    /**
     * Reference model attribute within the enclosing type represented by a C_OBJECT.
     */
    rm_attribute_name?: string;
    /**
     * Constraint on every attribute, regardless of whether it is singular or of a container type, which indicates whether its target object exists or not (i.e. is mandatory or not).
     */
    existence?: undefined;
    /**
     * Child C_OBJECT nodes. Each such node represents a constraint on the type of this attribute in its reference model. Multiples occur both for multiple items in the case of container attributes, and alternatives in the case of singular attributes. 
     */
    children?: undefined;
}

/**
 * Abstract parent type of C_OBJECT subtypes that are defined by value, i.e. whose definitions are actually in the archetype rather than being by reference. 
 */
export class C_DEFINED_OBJECT {
    /**
     * Value to be assumed if none sent in data.
     */
    assumed_value?: any;
}

/**
 * A constraint defined by proxy, using a reference to an object constraint defined elsewhere in the same archetype. Note that since this object refers to another node, there are two objects with available occurrences values. The local occurrences value on a \`COMPLEX_OBJECT_PROXY\` should always be used; when setting this from a serialised form, if no occurrences is mentioned, the target occurrences should be used (not the standard default of \`{1..1}\`); otherwise the locally specified occurrences should be used as normal. When serialising out, if the occurrences is the same as that of the target, it can be left out. 
 */
export class C_COMPLEX_OBJECT_PROXY {
    /**
     * Reference to an object node using archetype path notation.
     */
    target_path?: string;
}

/**
 * Constraint describing a  slot' where another archetype can occur. 
 */
export class ARCHETYPE_SLOT {
    /**
     * List of constraints defining other archetypes that could be included at this point. 
     */
    includes?: undefined;
    /**
     * List of constraints defining other archetypes that cannot be included at this point. 
     */
    excludes?: undefined;
}

/**
 * Constraint on a primitive type.
 */
export class C_PRIMITIVE_OBJECT {
    /**
     * Object actually defining the constraint.
     */
    item?: C_PRIMITIVE;
}

/**
 * Defines the order indicator that can be used on a \`C_OBJECT\` within a container attribute in a specialised archetype to indicate its order with respect to a sibling defined in a higher specialisation level.
 * 
 * Misuse: This type cannot be used on a \`C_OBJECT\` other than one within a container attribute in a specialised archetype.
 */
export class SIBLING_ORDER {
    /**
     * True if the order relationship is ‘before’, if False, it is ‘after’.
     */
    is_before?: boolean;
    /**
     * Node identifier of sibling before or after which this node should come.
     */
    sibling_node_id?: string;
}

/**
 * Object representing a constraint on an attribute tuple, i.e. a group of attributes that are constrained together. Typically used for representing co-varying constraints like \`{units, range}\` constraints.
 */
export class C_ATTRIBUTE_TUPLE {
    /**
     * Tuple definitions.
     */
    tuples?: undefined;
    /**
     * List of \`C_ATTRIBUTEs\` forming the definition of the tuple.
     */
    members?: undefined;
}

/**
 * Class representing a single object tuple instance in a tuple constraint. Each such instance is a vector of object constraints, where each member (each \`C_PRIMITIVE_OBJECT\`) corresponds to one of the \`C_ATTRIBUTEs\` referred to by the owning \`C_ATTRIBUTE_TUPLE\`.
 */
export class C_PRIMITIVE_TUPLE {
    /**
     * Object constraint members of this tuple group.
     */
    members?: undefined;
}

/**
 * Abstract parent of classes defining second order constraints.
 */
export class C_SECOND_ORDER {
    /**
     * Members of this second order constrainer. Normally redefined in descendants.
     */
    members?: undefined;
}

/**
 * A specialisation of \`C_COMPLEX_OBJECT\` whose node_id attribute is an archetype identifier rather than the normal internal node code (i.e. id-code).
 * 
 * Used in two situations. The first is to represent an 'external reference' to an archetype from within another archetype or template. This supports re-use. The second use is within a template, where it is used as a slot-filler. 
 * 
 * For a new external reference, the \`_node_id_\` is set in the normal way, i.e. with a new code at the specialisation level of the archetype.
 * 
 * For a slot-filler or a redefined external reference, the \`_node_id_\` is set to a specialised version of the \`_node_id_\` of the node being specialised, allowing matching to occur during flattening.
 * 
 * In all uses within source archetypes and templates, the \`_children_\` attribute is \`Void\`.
 * 
 * In an operational template, the \`_node_id_\` is converted to the \`_archetype_ref_\`, and the structure contains the result of flattening any template overlay structure and the underlying flat archetype.
 * 
 */
export class C_ARCHETYPE_ROOT {
    /**
     * Reference to archetype is being used to fill a slot or redefine an external reference. Typically an 'interface' archetype id, i.e. identifier with partial version information.
     */
    archetype_ref?: string;
}

/**
 * Constraint on complex objects, i.e. any object that consists of other object constraints.
 */
export class C_COMPLEX_OBJECT {
    /**
     * List of constraints on attributes of the reference model type represented by this object.
     */
    attributes?: undefined;
}

/**
 * Constraint expression representing a regex constraint on an archetype identifier.
 */
export class ARCHETYPE_ID_CONSTRAINT {
    /**
     * Right hand side of the constraint expression, in the form of a \`C_STRING\`, i.e. string value constrainer.
     */
    constraint?: C_STRING;
}

/**
 * Constraint on instances of Boolean. Both attributes cannot be set to False, since this would mean that the Boolean value being constrained cannot be True or False.
 */
export class C_BOOLEAN {
    /**
     * True if the value True is allowed.
     */
    true_valid?: boolean;
    /**
     * True if the value False is allowed.
     */
    false_valid?: boolean;
    /**
     * The value to assume if this item is not included in data, due to being part of an optional structure.
     */
    assumed_value?: boolean;
}

/**
 * Constraint on instances of STRING. 
 */
export class C_STRING {
    /**
     * Regular expression pattern for proposed instances of String to match.
     */
    pattern?: string;
    /**
     * Set of Strings specifying constraint.
     */
    list?: undefined;
    /**
     * True if the list is being used to specify the constraint but is not considered exhaustive.
     */
    list_open?: boolean;
    /**
     * The value to assume if this item is not included in data, due to being part of an optional structure.
     */
    assumed_value?: string;
}

/**
 * Constraint on instances of Integer.
 */
export class C_INTEGER {
    /**
     * Set of Integers specifying constraint.
     */
    list?: undefined;
    /**
     * Range of Integers specifying constraint.
     */
    range?: undefined;
    /**
     * The value to assume if this item is not included in data, due to being part of an optional structure.
     */
    assumed_value?: number;
}

/**
 * Constraint on instances of Real.
 */
export class C_REAL {
    /**
     * Set of Reals specifying constraint.
     */
    list?: undefined;
    /**
     * Range of Real specifying constraint.
     */
    range?: undefined;
    /**
     * The value to assume if this item is not included in data, due to being part of an optional structure.
     */
    assumed_value?: number;
}

/**
 * Abstract parent of primitive constrainer classes based on \`Ordered\` base types, i.e. types like \`Integer\`, \`Real\`, and the Date/Time types. The model constraint is a List of Intervals, which may include point Intervals, and acts as a efficient and formally tractable representation of any number of point values and/or contiguous intervals of an ordered value domain.
 * 
 * In its simplest form, the constraint accessor returns just a single point \`Interval<T>\` object, representing a single value.
 * 
 * The next simplest form is a single proper \`Interval <T>\` (i.e. normal two-sided or half-open interval). The most complex form is a list of any combination of point and proper intervals.
 */
export class C_ORDERED {
    /**
     * Constraint in the form of a List of Intervals of the parameter type T. Concrete types generated in descendants via template binding.
     */
    constraint?: undefined;
    /**
     * Default value set in a template, and present in an operational template. Generally limited to leaf and near-leaf nodes.
     */
    default_value?: T;
    /**
     * Value to be assumed if none sent in data.
     */
    assumed_value?: T;
}

/**
 * Constrainer type for instances of \`Terminology_code\`. The constraint attribute can contain:
 * 
 * * a single at-code
 * * a single ac-code, representing a value-set that is defined in the archetype terminology
 * 
 * If there is an assumed value for the ac-code case above, the \`_assumed_value_\` attribute contains a single at-code, which must come from the list of at-codes defined as the internal value set for the ac-code.
 * 
 * The \`_constraint_status_\` attribute and \`_constraint_required_()\` function together define whether the \`_constraint_\` is considered formal ('required') or not. In the non-required cases, a data-item matched to this constraint may be any coded term.
 */
export class C_TERMINOLOGY_CODE {
    /**
     * Type of individual constraint - a single string that can either be a local at-code, or a local ac-code signifying a locally defined value set. If an ac-code, assumed_value may contain an at-code from the value set of the ac-code.
     * 
     * Use an empty string for no constraint.
     */
    constraint?: string;
    /**
     * Assumed Terminology code value.
     */
    assumed_value?: openehr_base.Terminology_code;
    default_value?: openehr_base.Terminology_code;
    /**
     * Constraint status of this terminology constraint. If Void, the meaning is as follows:
     * 
     * * in a top-level  archetype, equivalent to \`required\`;
     * * in a specialised (source) archetype, the meaning is to inherit the value from the corresponding node in the parent.
     * 
     * In the case of a specialised archetype generated by flattening, the value of this field will be:
     * 
     * * Void if it was Void in the parent;
     * * otherwise, it will carry the same value as in the parent.
     */
    constraint_status?: CONSTRAINT_STATUS;
}

/**
 * Purpose Abstract parent of \`C_ORDERED\` types whose base type is an ISO date/time type.
 */
export class C_TEMPORAL {
    /**
     * Optional alternative constraint in the form of a pattern based on ISO8601. See descendants for details.
     */
    pattern_constraint?: string;
}

/**
 * ISO 8601-compatible constraint on instances of Time. There is no validity flag for ‘hour’, since it must always be by definition mandatory in order to have a sensible time at all. Syntax expressions of instances of this class include “HH:??:xx” (time with optional minutes and seconds not allowed).
 */
export class C_TIME {
    /**
     * Validity of minute in constrained time.
     */
    minute_validity?: openehr_base.VALIDITY_KIND;
    /**
     * Validity of second in constrained time.
     */
    second_validity?: openehr_base.VALIDITY_KIND;
    /**
     * Validity of millisecond in constrained time.
     */
    millisecond_validity?: openehr_base.VALIDITY_KIND;
    /**
     * Validity of timezone in constrained date.
     */
    timezone_validity?: openehr_base.VALIDITY_KIND;
    /**
     * Interval of Times specifying constraint.
     */
    range?: undefined;
    /**
     * The value to assume if this item is not included in data, due to being part of an optional structure.
     */
    assumed_value?: openehr_base.Iso8601_time;
}

/**
 * ISO 8601-compatible constraint on instances of Date in the form either of a set of validity values, or an actual date range. There is no validity flag for ‘year’, since it must always be by definition mandatory in order to have a sensible date at all. Syntax expressions of instances of this class include “YYYY-??-??” (date with optional month and day).
 */
export class C_DATE {
    /**
     * Validity of day in constrained date.
     */
    day_validity?: openehr_base.VALIDITY_KIND;
    /**
     * Validity of month in constrained date.
     */
    month_validity?: openehr_base.VALIDITY_KIND;
    /**
     * Validity of timezone in constrained date.
     */
    timezone_validity?: openehr_base.VALIDITY_KIND;
    /**
     * Interval of Dates specifying constraint.
     */
    range?: undefined;
    /**
     * The value to assume if this item is not included in data, due to being part of an optional structure.
     */
    assumed_value?: openehr_base.Iso8601_date;
}

/**
 * ISO 8601-compatible constraint on instances of Date_Time. There is no validity flag for ‘year’, since it must always be by definition mandatory in order to have a sensible date/time at all. Syntax expressions of instances of this class include “YYYY-MM-DDT??:??:??” (date/time with optional time) and “YYYY-MMDDTHH:MM:xx” (date/time, seconds not allowed).
 */
export class C_DATE_TIME {
    /**
     * Validity of month in constrained date.
     */
    month_validity?: openehr_base.VALIDITY_KIND;
    /**
     * Validity of day in constrained date.
     */
    day_validity?: openehr_base.VALIDITY_KIND;
    /**
     * Validity of hour in constrained time.
     */
    hour_validity?: openehr_base.VALIDITY_KIND;
    /**
     * Validity of minute in constrained time.
     */
    minute_validity?: openehr_base.VALIDITY_KIND;
    /**
     * Validity of second in constrained time.
     */
    second_validity?: openehr_base.VALIDITY_KIND;
    /**
     * Validity of millisecond in constrained time.
     */
    millisecond_valdity?: openehr_base.VALIDITY_KIND;
    /**
     * Validity of timezone in constrained date.
     */
    timezone_valdity?: openehr_base.VALIDITY_KIND;
    /**
     * Range of Date_times specifying constraint.
     */
    range?: undefined;
    /**
     * The value to assume if this item is not included in data, due to being part of an optional structure.
     */
    assumed_value?: openehr_base.Iso8601_date_time;
}

/**
 * ISO 8601-compatible constraint on instances of Duration. In ISO 8601 terms, constraints might are of the form “PWD” (weeks and/or days), “PDTHMS” (days, hours, minutes, seconds) and so on.
 * 
 * Both range and the constraint pattern can be set at the same time, corresponding to the ADL constraint \`"PWD/|P0W..P50W|"\`.
 * 
 * As for all of openEHR, two ISO 8601 exceptions are allowed: 
 * 
 * * the ‘W’ (week) designator can be mixed in - the allowed patterns are: \`P[Y|y][M|m][D|d][T[H|h][M|m][S|s]]\` and \`P[W|w]\`;
 * * the values used in an interval constraint may be negated, i.e. a leading minus (\`'-'\`) sign may be used.
 * 
 */
export class C_DURATION {
    years_allowed?: boolean;
    /**
     * True if months are allowed in the constrained Duration.
     */
    months_allowed?: boolean;
    weeks_allowed?: boolean;
    /**
     * True if days are allowed in the constrained Duration.
     */
    days_allowed?: boolean;
    /**
     * True if hours are allowed in the constrained Duration.
     */
    hours_allowed?: boolean;
    /**
     * True if minutes are allowed in the constrained Duration.
     */
    minutes_allowed?: boolean;
    seconds_allowed?: boolean;
    /**
     * True if fractional seconds are allowed in the constrained Duration.
     */
    fractional_seconds_allowed?: boolean;
    /**
     * Range of Durations specifying constraint.
     */
    range?: undefined;
    /**
     * The value to assume if this item is not included in data, due to being part of an optional structure.
     */
    assumed_value?: openehr_base.Iso8601_duration;
}

/**
 * Definitions related to \`C_TEMPORAL\` constraints.
 */
export class C_TEMPORAL_DEFINITIONS {
    /**
     * List of allowed date constraints. Contains the values:
     * 
     * \`\`\`
     * "YYYY-MM-DD"    -- full date required
     * "YYYY-MM-??"    -- day optional
     * "YYYY-MM-XX"    -- day prohibited
     * "YYYY-??-??"    -- any partial or full date
     * "YYYY-??-XX"    -- day prohibited
     * "YYYY-XX-XX"    -- only prohibited
     * \`\`\`
     */
    valid_date_constraint_patterns?: undefined;
    /**
     * List of allowed date constraint replacements e.g. in specialised archetype. Contains the values:
     * 
     * ----
     * "YYYY-MM-DD": [],
     * 
     * "YYYY-MM-??": ["YYYY-MM-DD", 
     *                "YYYY-MM-XX"],
     * 
     * "YYYY-MM-XX": [],
     * 
     * "YYYY-??-??": ["YYYY-MM-??",
     *                "YYYY-MM-DD",
     *                "YYYY-MM-XX",
     *                "YYYY-??-XX",
     *                "YYYY-XX-XX"],
     * 
     * "YYYY-??-XX": ["YYYY-MM-XX", 
     *               "YYYY-XX-XX"],
     * 
     * "YYYY-XX-XX": []
     * ----
     * 
     * In the above, an empty list value indicates no replacements possible.
     */
    valid_date_constraint_replacements?: undefined;
    /**
     * List of allowed time constraints. Contains the values:
     * 
     * \`\`\`
     * "HH:MM:SS"    -- full time required
     * "HH:MM:??"    -- seconds optional
     * "HH:MM:XX"    -- minutes required, seconds prohibited
     * "HH:??:??"    -- minutes and seconds optional
     * "HH:??:XX"    -- minutes optional, seconds prohibited
     * \`\`\`
     */
    valid_time_constraint_patterns?: undefined;
    /**
     * List of allowed time constraint replacements e.g. in specialised archetype. Contains the values:
     * 
     * ----
     * "HH:MM:SS": [],
     * 
     * "HH:MM:??": ["HH:MM:SS",
     *              "HH:MM:XX"],
     * 
     * "HH:MM:XX": [],
     * 
     * "HH-??-??": ["HH:MM:??",
     *              "HH:MM:SS",
     *              "HH:MM:XX",
     *              "HH:??:XX"],
     * 
     * "HH-??-XX": ["HH:MM:XX"]
     * ----
     * 
     * In the above, an empty list value indicates no replacements possible.
     */
    valid_time_constraint_replacements?: undefined;
    /**
     * List of allowed date/time constraints. Contains the values:
     * 
     * \`\`\`
     * "YYYY-MM-DDTHH:MM:SS"    -- full date/time required
     * "YYYY-MM-DDTHH:MM:??"    -- seconds optional
     * "YYYY-MM-DDTHH:MM:XX"    -- seconds prohibited
     * "YYYY-MM-DDTHH:??:??"    -- minutes and seconds optional
     * "YYYY-MM-DDTHH:??:XX"    -- minutes optional, seconds prohibited
     * "YYYY-??-??T??:??:??"    -- any date/time ok
     * \`\`\`
     */
    valid_date_time_constraint_patterns?: undefined;
    /**
     * List of allowed date/time constraint replacements e.g. in specialised archetype. Contains the values:
     * 
     * ----
     * "YYYY-MM-DDTHH:MM:SS": [],
     * 
     * "YYYY-MM-DDTHH:MM:??": ["YYYY-MM-DDTHH:MM:SS",
     *                         "YYYY-MM-DDTHH:MM:XX"],
     * 
     * "YYYY-MM-DDTHH:MM:XX": [],
     * 
     * "YYYY-MM-DDTHH:??:??": ["YYYY-MM-DDTHH:??:XX",
     *                         "YYYY-MM-DDTHH:MM:SS",
     *                         "YYYY-MM-DDTHH:MM:??",
     *                         "YYYY-MM-DDTHH:MM:XX"],
     * 
     * "YYYY-MM-DDTHH:??:XX": ["YYYY-MM-DDTHH:MM:XX"],
     * 
     * "YYYY-??-??T??:??:??": ["YYYY-MM-DDTHH:MM:SS",
     *                         "YYYY-MM-DDTHH:MM:??",
     *                         "YYYY-MM-DDTHH:MM:XX",
     *                         "YYYY-MM-DDTHH:??:??",
     *                         "YYYY-MM-DDTHH:??:XX"]
     * ----
     */
    valid_date_time_constraint_replacements?: undefined;
}

/**
 * Status of \`_constraint_\`, with values allowing for 'soft' constraints, which are effectively different kinds of suggestions.
 */
export class CONSTRAINT_STATUS {
}

/**
 * Representation of any coded entity (term or constraint) in the archetype ontology.
 */
export class ARCHETYPE_TERM {
    /**
     * Code of this term. 
     */
    code?: string;
    /**
     * Hash of keys (“text”, “description” etc) and corresponding values.
     */
    items?: undefined;
}

/**
 * Class whose instances represent any kind of 1:N relationship between a source term and 1-N target terms.
 */
export class TERMINOLOGY_RELATION {
    /**
     * Code of source term of this relation.
     */
    id?: string;
    /**
     * List of target terms in this relation.
     */
    members?: undefined;
}

/**
 * Representation of a flat value set within the archetype terminology.
 */
export class VALUE_SET {
}

/**
 * Local terminology of an archetype. This class defines the semantics of the terminology of an archetype.
 */
export class ARCHETYPE_TERMINOLOGY {
    /**
     * True if this terminology only contains terms relating to a differential specialisation of the owning artefact, rather than a complete set.
     */
    is_differential?: boolean;
    /**
     * Original language of the terminology, as set at artefact creation or parsing time; must be a code in the ISO 639-1 2 character language code-set.
     * 
     */
    original_language?: string;
    /**
     * Term code defining the meaning of the artefact as a whole, and always used as the id-code on the root node of the artefact. Must be defined in the \`_term_definitions_\` property.
     */
    concept_code?: string;
    /**
     * Directory of term definitions as a two-level table. The outer hash keys are language codes, e.g. \`"en"\`, \`"de"\`, while the inner hash keys are term codes, e.g. \`"id17"\`, \`"at4"\`.
     */
    term_definitions?: undefined;
    /**
     * Directory of bindings to external terminology codes and value sets, as a two-level table. The outer hash keys are terminology ids, e.g. \`"SNOMED_CT"\`, and the inner hash keys are constraint codes, e.g. \`"at4"\`, \`"ac13"\` or paths. The indexed \`Uri\` objects represent references to externally defined resources, either terms, ontology concepts, or terminology subsets / ref-sets.
     */
    term_bindings?: undefined;
    /**
     * Archetype that owns this terminology.
     */
    owner_archetype?: ARCHETYPE;
    /**
     * Archetype-local value sets, each keyed by value-set id, i.e. an ac-code.
     */
    value_sets?: undefined;
    /**
     * Directory of extracts of external terminologies, as a two-level table. The outer hash keys are terminology ids, e.g. \`"SNOMED_CT"\`, while the inner hash keys are term codes or code-phrases from the relevant terminology, e.g. \`"10094842"\`.
     */
    terminology_extracts?: undefined;
}

/**
 * Definitions relating to the internal code system of archetypes.
 */
export class ADL_CODE_DEFINITIONS {
}

/**
 * Definition of visibility of an RM attribute within a larger archetype structure.
 */
export class RM_ATTRIBUTE_VISIBILITY {
    /**
     * Visibility setting of a non-archetyped RM attribute (RM attributes that are constrained or within the archetyped structure are visible by default).
     */
    visibility?: VISIBILITY_TYPE;
    /**
     * Optional alias for the attribute referenced by the path.
     */
    alias?: openehr_base.Terminology_code;
}

/**
 * Container object for archetype statements relating to RM attributes, which may be directly on objects constrained within the archetype, or at deeper non-constrained RM paths from an object or the root.
 */
export class RM_OVERLAY {
    /**
     * Optional structure in which visibility and aliasing of reference model elements can be specified. Key is path to an RM attribute, which is typically formed from a path to an archetyped node concatenated with a further pure RM attribute path; may also refer to a non-archetyped attribute.
     */
    rm_visibility?: undefined;
}

/**
 * Enumeration of visibility settings for model elements.
 */
export class VISIBILITY_TYPE {
}

/**
 * Archetype equivalent to LOCATABLE class in openEHR Common reference model. Defines common constraints for any inheritor of LOCATABLE in any reference model. 
 */
export class P_ARCHETYPE_CONSTRAINT {
}

/**
 * Abstract model of constraint on any kind of object node. 
 */
export class P_C_OBJECT {
    /**
     * Reference model type that this node corresponds to. 
     */
    rm_type_name?: string;
    /**
     * Occurrences of this object node in the data, under the owning attribute. Upper limit can only be greater than 1 if owning attribute has a cardinality of more than 1.
     */
    occurrences?: string;
    /**
     * Semantic id of this node, used to differentiate sibling nodes of the same type. Each node_id must be defined in the archetype ontology as a term code.
     *
     */
    node_id?: string;
    is_deprecated?: boolean;
}

/**
 * Abstract model of constraint on any kind of attribute node.
 */
export class P_C_ATTRIBUTE {
    /**
     * Reference model attribute within the enclosing type represented by a C_OBJECT.
     */
    rm_attribute_name?: string;
    /**
     * Constraint on every attribute, regardless of whether it is singular or of a container type, which indicates whether its target object exists or not (i.e. is mandatory or not).
     */
    existence?: string;
    /**
     * Child C_OBJECT nodes. Each such node represents a constraint on the type of this attribute in its reference model. Multiples occur both for multiple items in the case of container attributes, and alternatives in the case of singular attributes.
     */
    children?: undefined;
    /**
     * Within a differential specialised archetype, may be set to represent a deep path within the structure to which this constraint and its child constraints apply.
     */
    differential_path?: string;
    /**
     * Cardinality constraint of attribute, if a container attribute.
     */
    cardinality?: string;
    /**
     * Flag indicating whether this attribute constraint is on a container (i.e. multiply-valued) attribute.
     */
    is_multiple?: boolean;
}

/**
 * Abstract parent type of C_OBJECT subtypes that are defined by value, i.e. whose definitions are actually in the archetype rather than being by reference.
 */
export class P_C_DEFINED_OBJECT {
    is_frozen?: boolean;
    default_value?: any;
}

/**
 * A constraint defined by proxy, using a reference to an object constraint defined elsewhere in the same archetype. Note that since this object refers to another node, there are two objects with available occurrences values. The local occurrences value on a COJMPLEX_OBJECT_PROXY should always be used; when setting this from a seri- alised form, if no occurrences is mentioned, the target occurrences should be used (not the standard default of {1..1}); otherwise the locally specified occurrences should be used as normal. When serialising out, if the occurrences is the same as that of the target, it can be left out.
 */
export class P_C_COMPLEX_OBJECT_PROXY {
    /**
     * Reference to an object node using archetype path notation.
     */
    target_path?: string;
}

/**
 * Constraint describing a  slot' where another archetype can occur.
 */
export class P_ARCHETYPE_SLOT {
    /**
     * List of constraints defining other archetypes that could be included at this point.
     */
    includes?: undefined;
    /**
     * List of constraints defining other archetypes that cannot be included at this point.
     */
    excludes?: undefined;
    is_closed?: boolean;
}

/**
 * Parent of types representing constraints on primitive types.
 */
export class P_C_PRIMITIVE_OBJECT {
    /**
     * Value to be assumed if none sent in data.
     */
    assumed_value?: any;
    /**
     * True if this constraint is actually of an enumerated type that conforms to a primitive type, not a primitive.
     */
    is_enumerated_type_constraint?: boolean;
    /**
     * Constraint represented by this object; redefine in descendants.
     */
    constraint?: any;
}

/**
 * Constraint on complex objects, i.e. any object that consists of other object constraints.
 */
export class P_C_COMPLEX_OBJECT {
    /**
     * List of constraints on attributes of the reference model type represented by this object.
     */
    attributes?: undefined;
    /**
     * List of attribute tuple constraints under this object constraint, if any.
     */
    attribute_tuples?: undefined;
}

/**
 * Object representing a constraint on an atttribute tuple, i.e. a group of attributes that are constrained together. Typically used for representing co-varying constraints like {units, range} constraints.
 */
export class P_C_ATTRIBUTE_TUPLE {
    /**
     * Member attribute constraint objects.
     */
    members?: undefined;
}

export class P_C_ARCHETYPE_ROOT {
    archetype_ref?: string;
}

/**
 * Constraint on instances of Boolean. Both attributes cannot be set to False, since this would mean that the Boolean value being constrained cannot be True or False.
 */
export class P_C_BOOLEAN {
    constraint?: undefined;
    assumed_value?: boolean;
    default_value?: boolean;
}

/**
 * Constraint on instances of STRING. 
 */
export class P_C_STRING {
    /**
     * String constraint - a list of literal strings and / or regular expression strings delimited by the ‘/’ character.
     */
    constraint?: undefined;
    default_value?: string;
    assumed_value?: string;
}

/**
 * Constraint on instances of Integer.
 */
export class P_C_INTEGER {
}

/**
 * Constraint on instances of Real.
 */
export class P_C_REAL {
}

/**
 * Abstract parent of primitive constrainer classes based on ORDERED base types, i.e. types like Integer, Real, and the Date/Time types. The model constraint is a List of Intervals, which may include point Intervals, and acts as a efficient and formally tractable representation of any number of point values and/or contiguous intervals of an ordered value domain.
 * 
 * In its simplest form, the constraint accessor returns just a single point Interval<T> object, representing a single value.
 * 
 * The next simplest form is a single proper Interval <T> (i.e. normal two-sided or half-open interval). The most complex form is a list of any combination of point and proper intervals.
 */
export class P_C_ORDERED {
    constraint?: undefined;
}

/**
 * Constrainer type for instances of TERMINOLOGY_CODE. The primary expression of the constraint is in the property \`tuple_constraint', and comes in 3 variations:
 * * a single at-code
 * * a single ac-code, representing a value-set that is defined in the archetype terminology
 * * a list of at- and/or ac-codes, representing the possibilities of a tuple constraint
 * The last possibility above is enabled by the merge_tuple routine, which enables the constraint of another single-valued C_TERMINOLOGY_CODE to be merged with the current one.
 */
export class P_C_TERMINOLOGY_CODE {
    constraint?: string;
    assumed_value?: openehr_base.Terminology_code;
    default_value?: openehr_base.Terminology_code;
}

/**
 * Purpose Abstract parent of C_ORDERED types whose base type is an ISO date/time type.
 */
export class P_C_TEMPORAL {
    /**
     * Optional alternative constraint in the form of a pattern based on ISO8601. See descendants for details.
     */
    pattern_constraint?: string;
}

/**
 * ISO 8601-compatible constraint on instances of Time in the form either of a set of validity values, or else date ranges based on the C_ORDERED list constraint. There is no validity flag for ‘hour’, since it must always be by definition mandatory in order to have a sensible time at all. Syntax expressions of instances of this class include “HH:??:xx” (time with optional minutes and seconds not allowed).
 */
export class P_C_TIME {
}

/**
 * ISO 8601-compatible constraint on instances of Date in the form either of a set of validity values, or else date ranges based on the C_ORDERED list constraint. There is no validity flag for ‘year’, since it must always be by definition mandatory in order to have a sensible date at all. Syntax expressions of instances of this class include “YYYY-??-??” (date with optional month and day).
 */
export class P_C_DATE {
}

/**
 * ISO 8601-compatible constraint on instances of Date_Time. There is no validity flag for ‘year’, since it must always be by definition mandatory in order to have a sensible date/time at all. Syntax expressions of instances of this class include “YYYY-MM-DDT??:??:??” (date/time with optional time) and “YYYY-MMDDTHH:MM:xx” (date/time, seconds not allowed).
 */
export class P_C_DATE_TIME {
}

export class P_C_DURATION {
}

/**
 * Archetype equivalent to ARCHETYPED class in Common reference model. Defines semantics of identfication, lifecycle, versioning, composition and specialisation.
 * 
 * An archetype is a modelled as a particular kind of AUTHORED_RESOURCE, and as such, includes descriptive meta-data, language information and revision history. The ARCHETYPE class adds identifying information, a definition - expressed in terms of constraints on instances of an object model, and an ontology.
 */
export class P_ARCHETYPE {
    /**
     * Identifier of the specialisation parent of this archetype.
     */
    parent_archetype_id?: string;
    /**
     * Identifier of this archetype.
     */
    archetype_id?: P_ARCHETYPE_HRID;
    /**
     * Flag indicating whether this archetype is differential or flat in its contents. Top-level source archetypes have this flag set to True.
     */
    is_differential?: boolean;
    /**
     * Root node of the definition of this archetype.
     */
    definition?: P_C_COMPLEX_OBJECT;
    /**
     * The terminology of the archetype.
     */
    terminology?: P_ARCHETYPE_TERMINOLOGY;
    /**
     * Rules relating to this archetype. Statements are expressed in first order predicate logic, and usually refer to at least two attributes.
     */
    rules?: undefined;
}

/**
 * Root object of a standalone, authored archetype, including all meta-data, description, other identifiers and lifecycle.
 */
export class P_AUTHORED_ARCHETYPE {
    /**
     * ADL version if archteype was read in from an ADL sharable archetype.
     */
    adl_version?: string;
    /**
     * Unique identifier of this archetype artefact instance. A new identifier is assigned every time the content is changed by a tool. Used by tools to distinguish different revisions and/or interim snapshots of the same artefact.
     */
    build_uid?: openehr_base.UID;
    /**
     * Semver.org compatible release of the most recent reference model release on which the archetype in its current version is based. This does not imply conformance only to this release, since an archetype may be valid with respect to multiple releases of a reference model.
     */
    rm_release?: string;
    /**
     * If True, indicates that this artefact was machine-generated from some other source, in which case, tools would expect to overwrite this artefact on a new generation. Editing tools should set this value to False when a user starts to manually edit an archetype.
     */
    is_generated?: boolean;
    other_meta_data?: undefined;
}

/**
 * Class representing source template, i.e. a kind of archetype that may include template overlays, and may be restricted by tools to only defining mandations, prohibitions, and restrictions on elements already defined in the flat parent.
 */
export class P_TEMPLATE {
}

/**
 * Root object of an operational template. An operational template is derived from a TEMPLATE definition and the ARCHETYPEs and/or TEMPLATE_OVERLAYs mentioned by that template by a process of flattening, and potentially removal of unneeded languages and terminologies.
 * 
 * An operational template is used for generating and validating canonical openEHR data, and also as a source artefact for generating other downstream technical artefacts, including XML schemas, APIs and UI form definitions.
 */
export class P_OPERATIONAL_TEMPLATE {
    /**
     * Compendium of flattened terminologies of archetypes externally referenced from this archetype, keyed by archetype identifier. This will almost always be present in a template.
     */
    component_terminologies?: undefined;
    /**
     * Directory of term definitions as a two-level  table. The outer hash keys are term codes,  e.g. "at4", and the inner hash key are term  attribute names, e.g. "text", "description" etc.
     */
    terminology_extracts?: undefined;
}

/**
 * Human_readable identifier (HRID) for an archetype or template.
 */
export class P_ARCHETYPE_HRID {
    /**
     * Reverse domain name namespace identifier.
     */
    namespace?: string;
    /**
     * Name of the Reference Model publisher.
     */
    rm_publisher?: string;
    /**
     * Name of the package in whose reachability graph the rm_class class is found (there can be more than one possibility in many reference models).
     */
    rm_package?: string;
    /**
     * Name of the root class of this archetype.
     */
    rm_class?: string;
    /**
     * The short concept name of the archetype as used in the multi-axial archetype_hrid.
     */
    concept_id?: string;
    /**
     * The full numeric version of this archetype consisting of 3 parts, e.g. 1.8.2. The archetype_hrid feature includes only the major version.
     */
    release_version?: string;
    /**
     * The status of the version, i.e. released, release_candidate etc.
     */
    version_status?: openehr_base.VERSION_STATUS;
    /**
     * The build count since last increment of any version part.
     */
    build_count?: string;
}

/**
 * Abstract idea of an online resource created by a human author.
 *
 */
export class P_AUTHORED_RESOURCE {
    /**
     * Language in which this resource was initially authored. Although there is no language primacy of resources overall, the language of original authoring is required to ensure natural language translations can preserve quality. Language is relevant in both the description and ontology sections.
     */
    original_language?: string;
    /**
     * True if this resource is under any kind of change control (even file copying), in which case revision history is created.
     */
    is_controlled?: boolean;
    /**
     * List of details for each natural translation made of this resource, keyed by language. For each translation listed here, there must be corresponding sections in all language-dependent parts of the resource. The original_language does not appear in this list.
     */
    translations?: undefined;
    /**
     * Description and lifecycle information of the resource.
     */
    description?: openehr_base.RESOURCE_DESCRIPTION;
    /**
     * Unique identifier of the family of archetypes having the same interface identifier (same major version).
     */
    uid?: string;
    /**
     * Annotations on individual items within the resource, keyed by path. The inner table takes the form of a Hash table of String values keyed by String tags.
     */
    annotations?: undefined;
}

/**
 * Local ontology of an archetype.
 */
export class P_ARCHETYPE_TERMINOLOGY {
    is_differential?: boolean;
    original_language?: string;
    /**
     * Directory of term definitions as a two-level 
     * table. The outer hash keys are term codes, 
     * e.g. "at0004", and the inner hash key are term 
     * attribute names, e.g. "text", "description" etc.
     */
    term_definitions?: undefined;
    /**
     * Directory of term bindings as a two-level 
     * table. The outer hash keys are local term codes, 
     * e.g. "at0004", and the inner hash keys are terminology 
     * code phrases, e.g. "SNOMED(2003)::163034007" etc.
     */
    term_bindings?: undefined;
    value_sets?: undefined;
}

/**
 * Profile of common settings relating to use of reference model(s) and terminology for a given archetype developing organisation.
 */
export class AOM_PROFILE {
    /**
     * Name of this profile, usually based on the publisher it pertains to e.g. "openEHR", "CDISC", etc.
     */
    profile_name?: string;
    /**
     * States a class from the Reference Model that provides archetyping capability in RM data structures. This attribute is optional, and there need be no such class in the RM. Defining it here has the effect in tools that the class tree under which archetypes are arranged contains only RM classes inheriting from this class.
     */
    archetype_parent_class?: string;
    /**
     * This attribute defines a base class from the Reference Model whose descendants are considered to be 'logical data types', i.e. of some higher level than the built-in primitive types String, Integer etc. This attribute is optional, even if the RM does have such a class, and is only used to help tooling to provide more intelligent display.
     */
    archetype_data_value_parent_class?: string;
    /**
     * Mappings from AOM built-in types to actual types in RM: whenever the type name is encountered in an archetype, it is mapped to a specific RM type.
     */
    aom_rm_type_mappings?: undefined;
    /**
     * If \`_archetype_parent_class_\` is not set, designate a class whose descendants should be made visible in tree and grid renderings of the archetype definition.
     */
    archetype_visualise_descendants_of?: string;
    /**
     * Allowed type substitutions: Actual RM type names keyed by AOM built-in types which can substitute for them in an archetype. E.g. \`<key = "ISO8601_DATE", value = "String">\` means that if RM property \`TYPE._some_property_\` is of type \`String\`, an \`ISO8601_DATE\` is allowed at that position in the archetype.
     */
    aom_rm_type_substitutions?: undefined;
    /**
     * List of mappings of lifecycle state names used in archetypes to AOM lifecycle state names:
     *
     * * key = source lifecycle state;
     * * value = AOM lifecycle state.
     */
    aom_lifecycle_mappings?: undefined;
    /**
     * Equivalences of RM primitive types to in-built set of primitive types. Used to determine which AOM \`C_PRIMITIVE_OBJECT\` descendant is used for a primitive type. Typical entries:
     *
     * * \`value\`	\`key\`
     * * "Real"	"Double"
     * * "Integer"	"Integer64"
     */
    rm_primitive_type_equivalences?: undefined;
}

/**
 * Data object expressing a mapping between two types.
 */
export class AOM_TYPE_MAPPING {
    /**
     * Name of the AOM type being mapped to an RM type.
     */
    source_class_name?: string;
    /**
     * Name of the RM type in the mapping.
     */
    target_class_name?: string;
    /**
     * List of mappings of properties of this type to another type.
     */
    property_mappings?: undefined;
}

/**
 * Data object expressing a mapping between two class properties.
 */
export class AOM_PROPERTY_MAPPING {
    /**
     * Name of property in source class.
     */
    source_property_name?: string;
    /**
     * Name of property in target class.
     */
    target_property_name?: string;
}

/**
 * Expression tree leaf item representing a constraint on an archetype identifier.
 */
export class EXPR_ARCHETYPE_ID_CONSTRAINT {
    /**
     * A C_STRING representing a regular expression for matching Archetype identifiers.
     */
    item?: C_STRING;
}

/**
 * Expression tree leaf item representing a reference to a value found in data at a location specified by a path in the archetype definition.
 * 
 * * A path referring to a value in the archetype (paths with a leading ‘/’ are in the definition section.
 * * Paths with no leading ‘/’ are in the outer part of the archetype, e.g. “archetype_id/value” refers to the String value of the archetype_id attribute of the enclosing archetype.
 * 
 */
export class EXPR_ARCHETYPE_REF {
    /**
     * The path to the archetype node.
     */
    path?: string;
    item?: ARCHETYPE_CONSTRAINT;
}

/**
 * Expression tree leaf item representing a constraint on a primitive type, expressed in the form of a concrete subtype of C_PRIMITIVE_OBJECT.
 */
export class EXPR_CONSTRAINT {
    /**
     * The constraint.
     */
    item?: C_PRIMITIVE_OBJECT;
}

/**
 * Constrainer class for Ordinal data.
 */
export class C_ORDINAL {
    /**
     * Value set of allowed Ordinals in the constraint.
     */
    list?: undefined;
}

/**
 * Constrainer class for Coded text data.
 */
export class C_CODED_TEXT {
    /**
     * Terminology identifier.
     */
    terminology?: string;
    /**
     * Optional list of codes from the terminology. No list means any code from the terminology is allowed.
     */
    code_list?: undefined;
    reference?: string;
}

/**
 * Constrainer class for Quantity data.
 */
export class C_QUANTITY {
    /**
     * Name of physical property for Quantities being constrained.
     */
    property?: string;
    /**
     * Value set of allowed individual Quantity item constraints in this Quantity constraint.
     */
    list?: undefined;
}

/**
 * Constrainer class for a single Quantity.
 */
export class C_QUANTITY_ITEM {
    /**
     * Quantity magnitude constraint.
     */
    magnitude?: undefined;
    /**
     * Optional units constraint.
     */
    units?: string;
}

/**
 * Constrainer object representing a single Ordinal value.
 */
export class ORDINAL {
    /**
     * Terminology code providing the Ordinal's symbol.
     */
    symbol?: openehr_base.CODE_PHRASE;
    /**
     * Ordinal value.
     */
    value?: number;
}

/**
 * Structural model of a typed first order predicate logic assertion, in the form of an expression tree, including optional variable definitions. 
 */
export class ASSERTION {
    /**
     * Expression tag, used for differentiating multiple assertions.
     */
    tag?: string;
    /**
     * String form of expression, in case an expression evaluator taking String expressions is used for evaluation. 
     */
    string_expression?: string;
    /**
     * Root of expression tree.
     */
    expression?: EXPR_ITEM;
    /**
     * Definitions of variables used in the assertion expression.
     */
    variables?: undefined;
}

/**
 * Definition of a named variable used in an assertion expression.
 */
export class ASSERTION_VARIABLE {
    /**
     * Name of variable.
     */
    name?: string;
    /**
     * Formal definition of the variable.
     */
    definition?: string;
}

/**
 * Abstract parent of all expression tree items.
 */
export class EXPR_ITEM {
    /**
     * Type name of this item in the mathematical sense. For leaf nodes, must be the name of a primitive type, or else a reference model type. The type for any relational or boolean operator will be “Boolean”, while the type for any arithmetic operator, will be “Real” or “Integer”.
     */
    type?: string;
}

/**
 * Expression tree leaf item representing one of:
 *
 * * a manifest constant of any primitive type;
 * * a path referring to a value in the archetype;
 * * a constraint;
 * * a variable reference.
 *
 */
export class EXPR_LEAF {
    /**
     * Type of reference: “constant”, “attribute”, “function”, “constraint”. The first three are used to indicate the referencing mechanism for an operand. The last is used to indicate a constraint operand, as happens in the case of the right-hand operand of the ‘matches’ operator.
     */
    reference_type?: string;
    /**
     * The value referred to; a manifest constant, an attribute path (in the form of a String), or for the right-hand side of a ‘matches’ node, a constraint, often a C_PRIMITIVE_OBJECT.
     */
    item?: any;
}

/**
 * Abstract parent of operator types.
 */
export class EXPR_OPERATOR {
    /**
     * True if the natural precedence of operators is overridden in the expression represented by this node of the expression tree. If True, parentheses should be introduced around the totality of the syntax expression corresponding to this operator node and its operands.
     */
    precedence_overridden?: boolean;
    /**
     * Code of operator.
     */
    operator?: OPERATOR_KIND;
}

/**
 * Unary operator expression node.
 */
export class EXPR_UNARY_OPERATOR {
    /**
     * Operand node.
     */
    operand?: EXPR_ITEM;
}

/**
 * Binary operator expression node.
 */
export class EXPR_BINARY_OPERATOR {
    /**
     * Left operand node.
     */
    left_operand?: EXPR_ITEM;
    /**
     * Right operand node.
     */
    right_operand?: EXPR_ITEM;
}

/**
 * Enumeration type for operator types in assertion expressions.
 */
export class OPERATOR_KIND {
}

/**
 * Express constraints on the cardinality of container objects which are the values of multiply-valued attributes, including uniqueness and ordering, providing the means to state that a container acts like a logical list, set or bag. The cardinality cannot contradict the cardinality of the corresponding attribute within the relevant reference model.
 */
export class CARDINALITY {
    /**
     * The interval of this cardinality. 
     */
    interval?: undefined;
    /**
     * True if the members of the container attribute to which this cardinality refers are ordered. 
     */
    is_ordered?: boolean;
    /**
     * True if the members of the container attribute to which this cardinality refers are unique.
     */
    is_unique?: boolean;
}

/**
 * A constraint defined by proxy, using a reference to an object constraint defined elsewhere in the same
 * archetype.
 * 
 * Note that since this object refers to another node, there are two objects with available occurrences values. The local occurrences value on an ARCHETYPE_INTERNAL_REF should always be used; when setting this from a serialised form, if no occurrences is mentioned, the target occurrences should be used (not the standard default of {1..1}); otherwise the locally specified occurrences should be used as normal. When serialising out, if the occurrences is the same as that of the target, it can be left out.
 */
export class ARCHETYPE_INTERNAL_REF {
    /**
     * Reference to an object node using archetype path notation.
     */
    target_path?: string;
}

/**
 * Concrete model of constraint on a single-valued attribute node. The meaning of the inherited children attribute is that they are alternatives.
 */
export class C_SINGLE_ATTRIBUTE {
}

/**
 * Reference to a constraint described in the same archetype, but outside the main constraint structure. This is used to refer to constraints expressed in terms of external resources, such as constraints on terminology value sets.
 */
export class CONSTRAINT_REF {
    /**
     * Reference to a constraint in the archetype local ontology.
     */
    reference?: string;
}

/**
 * Concrete model of constraint on multiply-valued (ie. container) attribute node.
 */
export class C_MULTIPLE_ATTRIBUTE {
    /**
     * Cardinality of this attribute constraint, if it constraints a container attribute.
     */
    cardinality?: CARDINALITY;
}

/**
 * Abstract parent type of domain-specific constrainer types, to be defined in external packages.
 */
export class C_DOMAIN_TYPE {
}

/**
 * Abstract parent type of C_OBJECT subtypes that are defined by reference.
 */
export class C_REFERENCE_OBJECT {
}

/**
 * Local ontology of an archetype.
 */
export class ARCHETYPE_ONTOLOGY {
    /**
     * List of all term codes in the ontology. Most of these correspond to “at” codes in an ADL archetype, which are the node_ids on C_OBJECT descendants. There may be an extra one, if a different term is used as the overall archetype concept from that used as the node_id of the outermost C_OBJECT in the definition part.
     */
    term_codes?: undefined;
    /**
     * List of all term codes in the ontology. These correspond to the “ac” codes in an ADL archetype, or equivalently, the CONSTRAINT_REF.reference values in the archetype definition.
     */
    constraint_codes?: undefined;
    /**
     * Archetype which owns this terminology.
     */
    parent_archetype?: ARCHETYPE;
    /**
     * List of terminologies to which term or constraint bindings exist in this terminology.
     */
    terminologies_available?: undefined;
    /**
     * Specialisation depth of this archetype. Unspecialised archetypes have depth 0, with each additional level of specialisation adding 1 to the specialisation_depth.
     */
    specialisation_depth?: number;
    term_attribute_names?: undefined;
}

/**
 * Parent of types representing constraints on primitive types.
 */
export class C_PRIMITIVE {
    /**
     * Value to be assumed if none sent in data.
     */
    assumed_value?: any;
}

