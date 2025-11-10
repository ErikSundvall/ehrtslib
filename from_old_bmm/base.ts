// Type definitions for openEHR BASE 1.2.0
// Project: https://specifications.openehr.org/releases/BASE/Release-1.2.0
// Definitions by: Jules <https://www.jules.ai>

export {};

// foundation_types

export abstract class Any {
}

export abstract class Ordered extends Any {
}

export abstract class Numeric extends Any {
}

export abstract class Ordered_Numeric extends Ordered {
}

export class Byte extends Ordered {
}

export class Octet extends Ordered {
}

export class Boolean extends Any {
	value: boolean;
	constructor(value: boolean) {
		super();
		this.value = value;
	}
}

export class Integer extends Ordered_Numeric {
	value: number;
	constructor(value: number) {
		super();
		this.value = value;
	}
}

export class Integer64 extends Ordered_Numeric {
	value: bigint;
	constructor(value: bigint) {
		super();
		this.value = value;
	}
}

export class Real extends Ordered_Numeric {
	value: number;
	constructor(value: number) {
		super();
		this.value = value;
	}
}

export class Double extends Ordered_Numeric {
	value: number;
	constructor(value: number) {
		super();
		this.value = value;
	}
}

export class Character extends Ordered {
	value: string;
	constructor(value: string) {
		super();
		this.value = value;
	}
}

export class String extends Ordered {
	value: string;
	constructor(value: string) {
		super();
		this.value = value;
	}
}

export class Uri extends String {
}

export abstract class Temporal extends Ordered {
}

export abstract class Iso8601_type extends Temporal {
	value: string;
	constructor(value: string) {
		super();
		this.value = value;
	}
}

export class Date extends Iso8601_type {
}

export class Time extends Iso8601_type {
}

export class Date_time extends Iso8601_type {
}

export class Duration extends Iso8601_type {
}

export class Iso8601_date extends Iso8601_type {
}

export class Iso8601_time extends Iso8601_type {
}

export class Iso8601_date_time extends Iso8601_type {
}

export class Iso8601_duration extends Iso8601_type {
}

export class Terminology_code extends Any {
	terminology_id: String;
	terminology_version?: String;
	code_string: String;
	uri?: Uri;
	constructor(terminology_id: String, code_string: String, terminology_version?: String, uri?: Uri) {
		super();
		this.terminology_id = terminology_id;
		this.terminology_version = terminology_version;
		this.code_string = code_string;
		this.uri = uri;
	}
}

export class Terminology_term extends Any {
	text: String;
	concept: Terminology_code;
	constructor(text: String, concept: Terminology_code) {
		super();
		this.text = text;
		this.concept = concept;
	}
}

export abstract class Container<V> extends Any {
}

export class List<V> extends Container<V> {
	value: V[];
	constructor(value: V[]) {
		super();
		this.value = value;
	}
}

export class Array<V> extends Container<V> {
	value: V[];
	constructor(value: V[]) {
		super();
		this.value = value;
	}
}

export class Set<V> extends Container<V> {
	value: V[];
	constructor(value: V[]) {
		super();
		this.value = value;
	}
}

export class Interval<T extends Ordered> extends Any {
	lower?: T;
	upper?: T;
	lower_unbounded: Boolean;
	upper_unbounded: Boolean;
	lower_included: Boolean;
	upper_included: Boolean;
	constructor(lower_unbounded: Boolean, upper_unbounded: Boolean, lower_included: Boolean, upper_included: Boolean, lower?: T, upper?: T) {
		super();
		this.lower = lower;
		this.upper = upper;
		this.lower_unbounded = lower_unbounded;
		this.upper_unbounded = upper_unbounded;
		this.lower_included = lower_included;
		this.upper_included = upper_included;
	}
}

export class Multiplicity_interval extends Interval<Integer> {
}

export class Cardinality extends Any {
	is_ordered: Boolean;
	is_unique: Boolean;
	interval: Multiplicity_interval;
	constructor(is_ordered: Boolean, is_unique: Boolean, interval: Multiplicity_interval) {
		super();
		this.is_ordered = is_ordered;
		this.is_unique = is_unique;
		this.interval = interval;
	}
}

export class Hash<K extends Ordered, V> extends Container<V> {
	value: Map<K, V>;
	constructor(value: Map<K, V>) {
		super();
		this.value = value;
	}
}

// base_types

export abstract class OBJECT_ID extends Any {
    value: String;
    constructor(value: String) {
        super();
        this.value = value;
    }
}

export class OBJECT_REF extends Any {
    id: OBJECT_ID;
    namespace?: String;
    type: String;
    constructor(id: OBJECT_ID, type: String, namespace?: String) {
        super();
        this.id = id;
        this.namespace = namespace;
        this.type = type;
    }
}

export abstract class UID_BASED_ID extends OBJECT_ID {
}

export class LOCATABLE_REF extends OBJECT_REF {
    id: UID_BASED_ID;
    path?: String;
    constructor(id: UID_BASED_ID, type: String, namespace?: String, path?: String) {
        super(id, type, namespace);
        this.id = id;
        this.path = path;
    }
}

export class PARTY_REF extends OBJECT_REF {
}

export class ACCESS_GROUP_REF extends OBJECT_REF {
}

export class TERMINOLOGY_ID extends OBJECT_ID {
}

export class GENERIC_ID extends OBJECT_ID {
    scheme: String;
    constructor(value: String, scheme: String) {
        super(value);
        this.scheme = scheme;
    }
}

export class ARCHETYPE_ID extends OBJECT_ID {
}

export class TEMPLATE_ID extends OBJECT_ID {
}

export class OBJECT_VERSION_ID extends UID_BASED_ID {
}

export class HIER_OBJECT_ID extends UID_BASED_ID {
}

export class VERSION_TREE_ID extends Any {
    value: String;
    constructor(value: String) {
        super();
        this.value = value;
    }
}

export abstract class UID extends Any {
    value: String;
    constructor(value: String) {
        super();
        this.value = value;
    }
}

export class INTERNET_ID extends UID {
}

export class UUID extends UID {
}

export class ISO_OID extends UID {
}

export enum VALIDITY_KIND {
    MANDATORY = "mandatory",
    OPTIONAL = "optional",
    PROHIBITED = "prohibited",
}

export enum VERSION_STATUS {
    ALPHA = "alpha",
    BETA = "beta",
    RELEASE_CANDIDATE = "release_candidate",
    RELEASED = "released",
    BUILD = "build",
}

// resource

export abstract class AUTHORED_RESOURCE extends Any {
    original_language: Terminology_code;
    is_controlled?: Boolean;
    translations?: Map<string, TRANSLATION_DETAILS>;
    description?: RESOURCE_DESCRIPTION;
    annotations?: RESOURCE_ANNOTATIONS;
    constructor(original_language: Terminology_code, is_controlled?: Boolean, translations?: Map<string, TRANSLATION_DETAILS>, description?: RESOURCE_DESCRIPTION, annotations?: RESOURCE_ANNOTATIONS) {
        super();
        this.original_language = original_language;
        this.is_controlled = is_controlled;
        this.translations = translations;
        this.description = description;
        this.annotations = annotations;
    }
}

export class TRANSLATION_DETAILS extends Any {
    language: Terminology_code;
    author: Map<string, String>;
    accreditation?: String;
    version_last_translated?: String;
    other_details?: Map<string, String>;
    other_contributors?: List<String>;
    constructor(language: Terminology_code, author: Map<string, String>, accreditation?: String, version_last_translated?: String, other_details?: Map<string, String>, other_contributors?: List<String>) {
        super();
        this.language = language;
        this.author = author;
        this.accreditation = accreditation;
        this.version_last_translated = version_last_translated;
        this.other_details = other_details;
        this.other_contributors = other_contributors;
    }
}

export class RESOURCE_DESCRIPTION_ITEM extends Any {
    language: Terminology_code;
    purpose: String;
    keywords?: List<String>;
    use?: String;
    misuse?: String;
    original_resource_uri?: List<Map<string, String>>;
    other_details?: Map<string, String>;
    constructor(language: Terminology_code, purpose: String, keywords?: List<String>, use?: String, misuse?: String, original_resource_uri?: List<Map<string, String>>, other_details?: Map<string, String>) {
        super();
        this.language = language;
        this.purpose = purpose;
        this.keywords = keywords;
        this.use = use;
        this.misuse = misuse;
        this.original_resource_uri = original_resource_uri;
        this.other_details = other_details;
    }
}

export class RESOURCE_DESCRIPTION extends Any {
    original_author: Map<string, String>;
    original_namespace?: String;
    original_publisher?: String;
    other_contributors?: List<String>;
    custodian_namespace?: String;
    custodian_organisation?: String;
    copyright?: String;
    licence?: String;
    lifecycle_state: String;
    resource_package_uri?: String;
    ip_acknowledgements?: Map<string, String>;
    references?: Map<string, String>;
    conversion_details?: Map<string, String>;
    other_details?: Map<string, String>;
    parent_resource: AUTHORED_RESOURCE;
    details?: Map<string, RESOURCE_DESCRIPTION_ITEM>;
    constructor(original_author: Map<string, String>, lifecycle_state: String, parent_resource: AUTHORED_RESOURCE, original_namespace?: String, original_publisher?: String, other_contributors?: List<String>, custodian_namespace?: String, custodian_organisation?: String, copyright?: String, licence?: String, resource_package_uri?: String, ip_acknowledgements?: Map<string, String>, references?: Map<string, String>, conversion_details?: Map<string, String>, other_details?: Map<string, String>, details?: Map<string, RESOURCE_DESCRIPTION_ITEM>) {
        super();
        this.original_author = original_author;
        this.original_namespace = original_namespace;
        this.original_publisher = original_publisher;
        this.other_contributors = other_contributors;
        this.custodian_namespace = custodian_namespace;
        this.custodian_organisation = custodian_organisation;
        this.copyright = copyright;
        this.licence = licence;
        this.lifecycle_state = lifecycle_state;
        this.resource_package_uri = resource_package_uri;
        this.ip_acknowledgements = ip_acknowledgements;
        this.references = references;
        this.conversion_details = conversion_details;
        this.other_details = other_details;
        this.parent_resource = parent_resource;
        this.details = details;
    }
}

export class RESOURCE_ANNOTATIONS extends Any {
    documentation: Map<string, Map<string, Map<string, String>>>;
    constructor(documentation: Map<string, Map<string, Map<string, String>>>) {
        super();
        this.documentation = documentation;
    }
}
