// Generated from BMM schema: base v1.3.0
// BMM Version: 2.4
// Schema Revision: 1.3.0.2
// Description: openEHR base types.
// Source: https://raw.githubusercontent.com/sebastian-iancu/code-generator/master/code/BMM-JSON/openehr_base_1.3.0.bmm.json
// Generated: 2025-11-10T12:36:29.607Z
// 
// This file was automatically generated from openEHR BMM (Basic Meta-Model) specifications.
// Do not edit manually - regenerate using: deno run --allow-read --allow-net --allow-write tasks/generate_ts_libs.ts
//
// For more information about openEHR specifications, visit: https://specifications.openehr.org/

// Unknown types - defined as 'any' for now
type T = any;

/**
 * Abstract ancestor class for all other classes. Usually maps to a type like \`Any\` or \`Object\` in an object-oriented technology. Defined here to provide value and reference equality semantics.
 */
export class Any {
}

/**
 * Type representing a keyed table of values. V is the value type, and K the type of the keys. 
 */
export class Hash {
}

/**
 * Abstract ancestor of container types whose items are addressable in some way.
 */
export class Container {
}

/**
 * Ordered container that may contain duplicates.
 */
export class List {
}

/**
 * Unordered container that may not contain duplicates.
 */
export class Set {
}

/**
 * Container whose storage is assumed to be contiguous.
 */
export class Array {
}

/**
 * A kind of String constrained to obey the syntax of RFC 3986.
 */
export class Uri {
}

/**
 * Abstract notional parent class of ordered, numeric types, which are types with both the \`_less_than_()\` and arithmetic functions defined.
 */
export class Ordered_Numeric {
}

/**
 * Type representing minimal interface of built-in Integer type.
 */
export class Integer {
}

/**
 * Type used to represent double-precision decimal numbers. Corresponds to a double-precision floating point value in most languages.
 */
export class Double {
}

/**
 * Abstract parent class of numeric types, which are types which have various arithmetic and comparison operators defined.
 */
export class Numeric {
}

/**
 * Type representing minimal interface of built-in Octet type.
 */
export class Octet {
}

/**
 * Type representing minimal interface of built-in Character type.
 */
export class Character {
}

/**
 * Type representing minimal interface of built-in Boolean type.
 */
export class Boolean {
}

/**
 * Type representing minimal interface of built-in String type, as used to represent textual data in any natural or formal language.
 */
export class String {
}

/**
 * Type used to represent decimal numbers. Corresponds to a single-precision floating point value in most languages.
 */
export class Real {
}

/**
 * Type representing minimal interface of built-in Integer64 type.
 */
export class Integer64 {
}

/**
 * Abstract parent class of ordered types i.e. types on which the '<' operator is defined.
 */
export class Ordered {
}

export class Byte {
}

/**
 * Represents an ISO 8601 date/time, including partial and extended forms. Value may be:
 * 
 * * \`YYYY-MM-DDThh:mm:ss[(,|.)sss][Z | ±hh[:mm]]\` (extended, preferred) or
 * * \`YYYYMMDDThhmmss[(,|.)sss][Z | ±hh[mm]]\` (compact)
 * * or a partial variant.
 * 
 * See \`_valid_iso8601_date_time()_\` for validity.
 * 
 * Note that this class includes 2 deviations from ISO 8601:2004:
 * 
 * * for partial date/times, any part of the date/time up to the month may be missing, not just seconds and minutes as in the standard;
 * * the time \`24:00:00\` is not allowed, since it would mean the date was really on the next day.
 */
export class Iso8601_date_time {
}

/**
 * Represents an ISO 8601 duration, which may have multiple parts from years down to seconds. The \`_value_\` attribute is a String in the format:
 * 
 * * \`P[nnY][nnM][nnW][nnD][T[nnH][nnM][nnS]]\`
 * 
 * NOTE: two deviations from ISO 8601 are supported, the first, to allow a negative sign, and the second allowing the 'W' designator to be mixed with other designators.
 */
export class Iso8601_duration {
}

/**
 * Represents an ISO 8601 time, including partial and extended forms. Value may be:
 * 
 * * \`hh:mm:ss[(,|.)sss][Z|±hh[:mm]]\` (extended, preferred) or
 * * \`hhmmss[(,|.)sss][Z|±hh[mm]]\` (compact)
 * * or a partial invariant.
 * 
 * See \`_valid_iso8601_time()_\` for validity.
 * 
 * NOTE: A small deviation to the ISO 8601:2004 standard in this class is that the time \`24:00:00\` is not allowed, for consistency with \`Iso8601_date_time\`.
 */
export class Iso8601_time {
}

/**
 * Abstract ancestor type of ISO 8601 types, defining interface for 'extended' and 'partial' concepts from ISO 8601.
 */
export class Iso8601_type {
    /**
     * Representation of all descendants is a single String.
     */
    value?: string;
}

/**
 * Represents an ISO 8601 date, including partial and extended forms. Value may be:
 * 
 * * \`YYYY-MM-DD\` (extended, preferred)
 * * \`YYYYMMDD\` (compact)
 * * a partial invariant.
 * 
 * See \`Time_definitions._valid_iso8601_date()_\` for validity.
 */
export class Iso8601_date {
}

/**
 * Abstract ancestor of time-related classes.
 */
export class Temporal {
}

/**
 * An Interval of Integer, used to represent multiplicity, cardinality and optionality in models. 
 */
export class Multiplicity_interval {
}

/**
 * Interval abstraction, featuring upper and lower limits that may be open or closed, included or not included.
 */
export class Interval {
    /**
     * Lower bound.
     */
    lower?: T;
    /**
     * Upper bound.
     */
    upper?: T;
    /**
     * True if \`_lower_\` boundary open (i.e. = \`-infinity\`).
     */
    lower_unbounded?: boolean;
    /**
     * True if \`_upper_\` boundary open (i.e. = \`+infinity\`).
     */
    upper_unbounded?: boolean;
    /**
     * True if \`_lower_\` boundary value included in range, if \`not _lower_unbounded_\`.
     */
    lower_included?: boolean;
    /**
     * True if \`_upper_\` boundary value included in range if \`not _upper_unbounded_\`.
     */
    upper_included?: boolean;
}

/**
 * Express constraints on the cardinality of container objects which are the values of multiply-valued attributes, including uniqueness and ordering, providing the means to state that a container acts like a logical list, set or bag.
 */
export class Cardinality {
    /**
     * The interval of this cardinality. 
     */
    interval?: Multiplicity_interval;
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
 * Primitive type representing a standalone reference to a terminology concept, in the form of a terminology identifier, optional version, and a code or code string from the terminology.
 */
export class Terminology_code {
    /**
     * The archetype environment namespace identifier used to identify a terminology. Typically a value like \`"snomed_ct"\` that is mapped elsewhere to the full URI identifying the terminology.
     */
    terminology_id?: string;
    /**
     * Optional string value representing terminology version, typically a date or dotted numeric.
     */
    terminology_version?: string;
    /**
     * A terminology code or post-coordinated code expression, if supported by the terminology. The code may refer to a single term, a value set consisting of multiple terms, or some other entity representable within the terminology.
     */
    code_string?: string;
    /**
     * The URI reference that may be used as a concrete key into a notional terminology service for queries that can obtain the term text, definition, and other associated elements.
     */
    uri?: string;
}

/**
 * Leaf type representing a standalone term from a terminology, which consists of the term text and the code, i.e. a concept reference.
 */
export class Terminology_term {
    /**
     * Reference to the terminology concept formally representing this term.
     */
    concept?: Terminology_code;
    /**
     * Text of term.
     */
    text?: string;
}

/**
 * Identifier for archetypes. Ideally these would identify globally unique archetypes.
 * 
 * Lexical form: \`rm_originator  '-' rm_name  '-' rm_entity  '.' concept_name {  '-' specialisation }*  '.v' number\`.
 */
export class ARCHETYPE_ID {
}

/**
 * Generic identifier type for identifiers whose format is otherwise unknown to openEHR. Includes an attribute for naming the identification scheme (which may well be local). 
 */
export class GENERIC_ID {
    /**
     * Name of the scheme to which this identifier conforms. Ideally this name will be recognisable globally but realistically it may be a local ad hoc scheme whose name is not controlled or standardised in any way. 
     */
    scheme?: string;
}

/**
 * Concrete type corresponding to hierarchical identifiers of the form defined by \`UID_BASED_ID\`. 
 */
export class HIER_OBJECT_ID {
}

/**
 * Reference to a \`LOCATABLE\` instance inside the top-level content structure inside a \`VERSION<T>\` identified by the \`_id_\` attribute. The \`_path_\` attribute is applied to the object that \`VERSION._data_\` points to. 
 */
export class LOCATABLE_REF {
    /**
     * The path to an instance, as an absolute path with respect to the object found at \`VERSION._data_\`. An empty path means that the object referred to by \`_id_\` is being specified. 
     */
    path?: string;
    /**
     * Globally unique id of an object, regardless of where it is stored.
     */
    id?: UID_BASED_ID;
}

/**
 * Ancestor class of identifiers of informational objects. Ids may be completely meaningless, in which case their only job is to refer to something, or may carry some information to do with the identified object. 
 * 
 * Object ids are used inside an object to identify that object. To identify another object in another service, use an \`OBJECT_REF\`, or else use a UID for local objects identified by UID. If none of the subtypes is suitable, direct instances of this class may be used. 
 */
export class OBJECT_ID {
    /**
     * The value of the id in the form defined below. 
     */
    value?: string;
}

/**
 * Class describing a reference to another object, which may exist locally or be maintained outside the current namespace, e.g. in another service. Services are usually external, e.g. available in a LAN (including on the same host) or the internet via Corba, SOAP, or some other distributed protocol. However, in small systems they may be part of the same executable as the data containing the Id. 
 */
export class OBJECT_REF {
    /**
     * Namespace to which this identifier belongs in the local system context (and possibly in any other openEHR compliant environment) e.g.  terminology ,  demographic . These names are not yet standardised. Legal values for \`_namespace_\` are:
     * 
     * * \`"local"\`
     * * \`"unknown"\`
     * * a string matching the standard regex \`[a-zA-Z][a-zA-Z0-9_.:\/&?=+-]*\`.
     * 
     * Note that the first two are just special values of the regex, and will be matched by it.
     */
    namespace?: string;
    /**
     * Name of the  class (concrete or abstract) of object to which this identifier type refers, e.g. \`PARTY\`, \`PERSON\`,  \`GUIDELINE\`  etc. These class names are from the relevant reference model. The type name \`ANY\` can be used to indicate that any type is accepted (e.g. if the type is unknown). 
     */
    type?: string;
    /**
     * Globally unique id of an object, regardless of where it is stored.
     */
    id?: OBJECT_ID;
}

/**
 * Globally unique identifier for one version of a versioned object; lexical form: \`object_id  '::' creating_system_id  '::' version_tree_id\`.
 */
export class OBJECT_VERSION_ID {
}

/**
 * Identifier for parties in a demographic or identity service. There are typically a number of subtypes of the \`PARTY\` class, including \`PERSON\`, \`ORGANISATION\`, etc. Abstract supertypes are allowed if the referenced object is of a type not known by the current implementation of this class (in other words, if the demographic model is changed by the addition of a new \`PARTY\` or \`ACTOR\` subtypes, valid \`PARTY_REFs\` can still be constructed to them). 
 */
export class PARTY_REF {
}

/**
 * Identifier for terminologies such as accessed via a terminology query service. In this class, the value attribute identifies the Terminology in the terminology service, e.g.  SNOMED-CT . A terminology is assumed to be in a particular language, which must be explicitly specified.
 * 
 * Lexical form: \`name [  '(' version  ')' ]\`.
 * 
 */
export class TERMINOLOGY_ID {
}

/**
 * Version tree identifier for one version. Lexical form: 
 * 
 * \`trunk_version [  '.' branch_number  '.' branch_version ]\`
 */
export class VERSION_TREE_ID {
    /**
     * String form of this identifier.
     */
    value?: string;
}

/**
 * Abstract model of UID-based identifiers consisting of a root part and an optional extension; lexical form: \`root '::' extension\`.
 */
export class UID_BASED_ID {
}

/**
 * Model of the DCE Universal Unique Identifier or UUID which takes the form of hexadecimal integers separated by hyphens, following the pattern 8-4-4-4-12 as defined by the Open Group, CDE 1.1 Remote Procedure Call specification, Appendix A. Also known as a GUID.
 */
export class UUID {
}

/**
 * Model of a reverse internet domain, as used to uniquely identify an internet domain. In the form of a dot-separated string in the reverse order of a domain name, specified by https://www.rfc-editor.org/info/rfc1034[IETF RFC 1034^]. 
 */
export class INTERNET_ID {
}

/**
 * Abstract parent of classes representing unique identifiers which identify information entities in a durable way. UIDs only ever identify one IE in time or space and are never re-used.
 */
export class UID {
    /**
     * The value of the id.
     */
    value?: string;
}

/**
 * Model of ISO's Object Identifier (oid) as defined by the standard ISO/IEC 8824. Oids are formed from integers separated by dots. Each non-leaf node in an Oid starting from the left corresponds to an assigning authority, and identifies that authority's namespace, inside which the remaining part of the identifier is locally unique. 
 */
export class ISO_OID {
}

/**
 * Identifier for templates. Lexical form to be determined.
 */
export class TEMPLATE_ID {
}

/**
 * Reference to access group in an access control service.
 */
export class ACCESS_GROUP_REF {
}

/**
 * Inheritance class to provide access to constants defined in other packages.
 */
export class OPENEHR_DEFINITIONS {
}

/**
 * Defines globally used constant values.
 */
export class BASIC_DEFINITIONS {
}

/**
 * An enumeration of three values that may commonly occur in constraint models.
 * 
 * Use as the type of any attribute within this model, which expresses constraint on some attribute in a class in a reference model. For example to indicate validity
 * of Date/Time fields.
 */
export class VALIDITY_KIND {
}

/**
 * Status of a versioned artefact, as one of a number of possible values: uncontrolled, prerelease, release, build.
 */
export class VERSION_STATUS {
}

export class Comparable {
}

/**
 * ISO8601 timezone string, in format:
 * 
 * * \`Z | ±hh[mm]\`
 * 
 * where:
 * 
 * * \`hh\` is "00" - "23" (0-filled to two digits)
 * * \`mm\` is "00" - "59" (0-filled to two digits)
 * * \`Z\` is a literal meaning UTC (modern replacement for GMT), i.e. timezone \`+0000\`
 * 
 */
export class Iso8601_timezone {
}

/**
 * Definitions for date/time classes. Note that the timezone limits are set by where the international dateline is. Thus, time in New Zealand is quoted using \`+12:00\`, not \`-12:00\`.
 */
export class Time_Definitions {
}

/**
 * Type representing a 'proper' Interval, i.e. any two-sided or one-sided interval.
 */
export class Proper_interval {
}

/**
 * Type representing an Interval that happens to be a point value. Provides an efficient representation that is substitutable for \`Interval<T>\` where needed.
 */
export class Point_interval {
    /**
     * Lower boundary open (i.e. = -infinity).
     */
    lower_unbounded?: boolean;
    /**
     * Upper boundary open (i.e. = +infinity).
     */
    upper_unbounded?: boolean;
    /**
     * Lower boundary value included in range if not \`_lower_unbounded_\`.
     */
    lower_included?: boolean;
    /**
     * Upper boundary value included in range if not \`_upper_unbounded_\`.
     */
    upper_included?: boolean;
}

/**
 * A fully coordinated (i.e. all coordination has been performed) term from a terminology service (as distinct from a particular terminology).
 * 
 * Retain for LEGACY only, while ADL1.4 requires CODE_PHRASE.
 */
export class CODE_PHRASE {
    /**
     * Identifier of the distinct terminology from which the code_string (or its elements) was extracted.
     */
    terminology_id?: TERMINOLOGY_ID;
    /**
     * The key used by the terminology service to identify a concept or coordination of concepts. This string is most likely parsable inside the terminology service, but nothing can be assumed about its syntax outside that context. 
     */
    code_string?: string;
    /**
     * Optional attribute to carry preferred term corresponding to the code or expression in \`_code_string_\`. Typical use in integration situations which create mappings, and representing data for which both a (non-preferred) actual term and a preferred term are both required.
     */
    preferred_term?: string;
}

/**
 * Abstract idea of an online resource created by a human author. 
 * 
 */
export class AUTHORED_RESOURCE {
    /**
     * Unique identifier of the family of archetypes having the same interface identifier (same major version).
     */
    uid?: string;
    /**
     * Language in which this resource was initially authored. Although there is no language primacy of resources overall, the language of original authoring is required to ensure natural language translations can preserve quality. Language is relevant in both the description and ontology sections. 
     */
    original_language?: Terminology_code;
    /**
     * Description and lifecycle information of the resource.
     */
    description?: RESOURCE_DESCRIPTION;
    /**
     * True if this resource is under any kind of change control (even file copying), in which case revision history is created. 
     */
    is_controlled?: boolean;
    /**
     * Annotations on individual items within the resource, keyed by path. The inner table takes the form of a Hash table of String values keyed by String tags.
     */
    annotations?: RESOURCE_ANNOTATIONS;
    /**
     * List of details for each natural translation made of this resource, keyed by language code. For each translation listed here, there must be corresponding sections in all language-dependent parts of the resource. The \`_original_language_\` does not appear in this list.
     */
    translations?: undefined;
}

/**
 * Defines the descriptive meta-data of a resource.
 */
export class RESOURCE_DESCRIPTION {
    /**
     * Original author of this resource, with all relevant details, including organisation.
     */
    original_author?: undefined;
    /**
     * Namespace of original author's organisation, in reverse internet form, if applicable.
     */
    original_namespace?: string;
    /**
     * Plain text name of organisation that originally published this artefact, if any.
     */
    original_publisher?: string;
    /**
     * Other contributors to the resource, each listed in "name <email>"  form. 
     */
    other_contributors?: undefined;
    /**
     * Lifecycle state of the resource, typically including states such as: initial, in_development, in_review, published, superseded, obsolete. 
     */
    lifecycle_state?: Terminology_code;
    /**
     * Reference to owning resource. 
     */
    parent_resource?: AUTHORED_RESOURCE;
    /**
     * Namespace in reverse internet id form, of current custodian organisation.
     */
    custodian_namespace?: string;
    /**
     * Plain text name of current custodian organisation.
     */
    custodian_organisation?: string;
    /**
     * Optional copyright statement for the resource as a knowledge resource. 
     * 
     */
    copyright?: string;
    /**
     * Licence of current artefact, in format "short licence name <URL of licence>", e.g. "Apache 2.0 License <http://www.apache.org/licenses/LICENSE-2.0.html>"
     */
    licence?: string;
    /**
     * List of acknowledgements of other IP directly referenced in this archetype, typically terminology codes, ontology ids etc. Recommended keys are the widely known name or namespace for the IP source, as shown in the following example:
     * 
     * ----
     * ip_acknowledgements = <
     *     ["loinc"] = <"This content from LOINC® is copyright © 1995 Regenstrief Institute, Inc. and the LOINC Committee, and available at no cost under the license at http://loinc.org/terms-of-use">
     *     ["snomedct"] = <"Content from SNOMED CT® is copyright © 2007 IHTSDO <ihtsdo.org>">
     * >
     * ----
     */
    ip_acknowledgements?: undefined;
    /**
     * List of references of material on which this artefact is based, as a keyed list of strings. The keys should be in a standard citation format.
     */
    references?: undefined;
    /**
     * URI of package to which this resource belongs.
     */
    resource_package_uri?: string;
    /**
     * Details related to conversion process that generated this model from an original, if relevant, as a list of name/value pairs. Typical example with recommended tags:
     * 
     * ----
     * conversion_details = <
     *     ["source_model"] = <"CEM model xyz <http://location.in.clinicalelementmodels.com>">
     *     ["tool"] = <"cem2adl v6.3.0">
     *     ["time"] = <"2014-11-03T09:05:00">
     * >
     * ----
     */
    conversion_details?: undefined;
    /**
     * Additional non-language-sensitive resource meta-data, as a list of name/value pairs.
     */
    other_details?: undefined;
    /**
     * Details of all parts of resource description that are natural language-dependent, keyed by language code.
     */
    details?: undefined;
}

/**
 * Class providing details of a natural language translation.
 */
export class TRANSLATION_DETAILS {
    /**
     * Language of the translation, coded using ISO 639-1 (2 character) language codes.
     */
    language?: Terminology_code;
    /**
     * Primary translator name and other demographic details.
     */
    author?: undefined;
    /**
     * Accreditation of primary translator or group, usually a national translator's registration or association membership id.
     */
    accreditation?: string;
    /**
     * Any other meta-data.
     */
    other_details?: undefined;
    /**
     * Version of this resource last time it was translated into the language represented by this \`TRANSLATION_DETAILS\` object.
     */
    version_last_translated?: string;
    /**
     * Additional contributors to this translation, each listed in the preferred format of the relevant organisation for the artefacts in question. A typical default is \`"name <email>"\` if nothing else is specified. 
     */
    other_contributors?: undefined;
}

/**
 * Language-specific detail of resource description. When a resource is translated for use in another language environment, each \`RESOURCE_DESCRIPTION_ITEM\` needs to be copied and translated into the new language.
 */
export class RESOURCE_DESCRIPTION_ITEM {
    /**
     * The localised language in which the items in this description item are written. Coded using ISO 639-1 (2 character) language codes.
     */
    language?: Terminology_code;
    /**
     * Purpose of the resource.
     */
    purpose?: string;
    /**
     * Keywords which characterise this resource, used e.g. for indexing and searching. 
     * 
     */
    keywords?: undefined;
    /**
     * Description of the uses of the resource, i.e. contexts in which it could be used. 
     * 
     */
    use?: string;
    /**
     * Description of any misuses of the resource, i.e. contexts in which it should not be used.
     */
    misuse?: string;
    /**
     * URIs of original clinical document(s) or description of which resource is a formalisation, in the language of this description item; keyed by meaning.
     */
    original_resource_uri?: undefined;
    /**
     * Additional language-senstive resource metadata, as a list of name/value pairs. 
     */
    other_details?: undefined;
}

/**
 * Object representing annotations on an archetype. These can be of various forms, with a documentation form defined so far, which has a multi-level tabular structure [ [ [String value, String key], path key], language key]. Example instance, showing the documentation structure.
 * 
 * --------
 *     documentation = <
 *         ["en"] = <
 *            ["/data[id2]"] = <
 *                ["ui"] = <"passthrough">
 *            >
 *            ["/data[id2]/items[id3]"] = <
 *                ["design note"] = <"this is a design note on Statement">
 *                ["requirements note"] = <"this is a requirements note on Statement">
 *                ["medline ref"] = <"this is a medline ref on Statement">
 *            >
 *         >
 *     >
 * --------
 * 
 * Other sub-structures might have different keys, e.g.  based on programming languages, UI toolkits etc.
 * 
 */
export class RESOURCE_ANNOTATIONS {
    /**
     * Documentary annotations in a multi-level keyed structure.
     */
    documentation?: undefined;
}

