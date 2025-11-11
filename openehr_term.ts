// Generated from BMM schema: term v3.1.0
// BMM Version: 2.4
// Schema Revision: 3.1.0.2
// Description: term
// Source: https://raw.githubusercontent.com/sebastian-iancu/code-generator/master/code/BMM-JSON/openehr_term_3.1.0.bmm.json
// Generated: 2025-11-11T08:30:07.266Z
// 
// This file was automatically generated from openEHR BMM (Basic Meta-Model) specifications.
// Do not edit manually - regenerate using: deno run --allow-read --allow-net --allow-write tasks/generate_ts_libs.ts
//
// For more information about openEHR specifications, visit: https://specifications.openehr.org/

// Unknown types - defined as 'any' for now
type Iso8601_date = any;
type String = any;

/**
 * A code set.
 */
export class CODE_SET {
    /**
     * Internal storage for name
     * @private
     */
    private _name?: String;

    /**
     * Name of this code set.
     */
    get name(): string | undefined {
        return this._name?.value;
    }

    /**
     * Gets the String wrapper object for name.
     * Use this to access String methods.
     */
    get $name(): String | undefined {
        return this._name;
    }

    /**
     * Sets name from either a primitive value or String wrapper.
     */
    set name(val: string | String | undefined) {
        if (val === undefined || val === null) {
            this._name = undefined;
        } else if (typeof val === 'string') {
            this._name = String.from(val);
        } else {
            this._name = val;
        }
    }

    /**
     * Internal storage for openehr_id
     * @private
     */
    private _openehr_id?: String;

    /**
     * Identifier used for code set in the openEHR Reference Model. The value is inferred from the \`_name_\` attribute.
     * 
     * Valid values take the form of an xs:NCName value, i.e. cannot contain:
     * 
     * * symbol characters \`:, @, $, %, &, /, +, ,, ;\`;
     * * whitespace characters or different parentheses. 
     * 
     * An NCName cannot begin with a number, dot or minus character although these can appear later in the value.
     */
    get openehr_id(): string | undefined {
        return this._openehr_id?.value;
    }

    /**
     * Gets the String wrapper object for openehr_id.
     * Use this to access String methods.
     */
    get $openehr_id(): String | undefined {
        return this._openehr_id;
    }

    /**
     * Sets openehr_id from either a primitive value or String wrapper.
     */
    set openehr_id(val: string | String | undefined) {
        if (val === undefined || val === null) {
            this._openehr_id = undefined;
        } else if (typeof val === 'string') {
            this._openehr_id = String.from(val);
        } else {
            this._openehr_id = val;
        }
    }

    /**
     * Internal storage for issuer
     * @private
     */
    private _issuer?: String;

    /**
     * Name of the issuing organisation.
     */
    get issuer(): string | undefined {
        return this._issuer?.value;
    }

    /**
     * Gets the String wrapper object for issuer.
     * Use this to access String methods.
     */
    get $issuer(): String | undefined {
        return this._issuer;
    }

    /**
     * Sets issuer from either a primitive value or String wrapper.
     */
    set issuer(val: string | String | undefined) {
        if (val === undefined || val === null) {
            this._issuer = undefined;
        } else if (typeof val === 'string') {
            this._issuer = String.from(val);
        } else {
            this._issuer = val;
        }
    }

    /**
     * Codes in this code set.
     */
    codes?: undefined;
    /**
     * Internal storage for external_id
     * @private
     */
    private _external_id?: String;

    /**
     * An optional identifier assumed by openEHR to be the identifier of this code set, based on its published name, with spaces replaced by underscores.
     * 
     * Valid values take the form of an xs:NCName value, i.e. cannot contain:
     * 
     * * symbol characters \`:, @, $, %, &, /, +, ,, ;\`;
     * * whitespace characters or different parentheses. 
     * 
     * An NCName cannot begin with a number, dot or minus character although these can appear later in the value.
     */
    get external_id(): string | undefined {
        return this._external_id?.value;
    }

    /**
     * Gets the String wrapper object for external_id.
     * Use this to access String methods.
     */
    get $external_id(): String | undefined {
        return this._external_id;
    }

    /**
     * Sets external_id from either a primitive value or String wrapper.
     */
    set external_id(val: string | String | undefined) {
        if (val === undefined || val === null) {
            this._external_id = undefined;
        } else if (typeof val === 'string') {
            this._external_id = String.from(val);
        } else {
            this._external_id = val;
        }
    }

    /**
     * Status of this code set.
     */
    status?: TERMINOLOGY_STATUS;
}

/**
 * A single vocabulary, in a particular language, within a Terminology.
 */
export class TERMINOLOGY_GROUP {
    /**
     * Internal storage for name
     * @private
     */
    private _name?: String;

    /**
     * Name of this vocabulary.
     */
    get name(): string | undefined {
        return this._name?.value;
    }

    /**
     * Gets the String wrapper object for name.
     * Use this to access String methods.
     */
    get $name(): String | undefined {
        return this._name;
    }

    /**
     * Sets name from either a primitive value or String wrapper.
     */
    set name(val: string | String | undefined) {
        if (val === undefined || val === null) {
            this._name = undefined;
        } else if (typeof val === 'string') {
            this._name = String.from(val);
        } else {
            this._name = val;
        }
    }

    /**
     * List of concepts (i.e. coded terms) in this vocabulary.
     */
    concepts?: undefined;
    /**
     * Internal storage for openehr_id
     * @private
     */
    private _openehr_id?: String;

    /**
     * Identifier used for terminology group in the openEHR Reference Model. The value is inferred from the \`_name_\` attribute.
     * 
     * Valid values take the form of an xs:NCName value, i.e. cannot contain:
     * 
     * * symbol characters \`:, @, $, %, &, /, +, ,, ;\`;
     * * whitespace characters or different parentheses. 
     * 
     * An NCName cannot begin with a number, dot or minus character although these can appear later in the value.
     */
    get openehr_id(): string | undefined {
        return this._openehr_id?.value;
    }

    /**
     * Gets the String wrapper object for openehr_id.
     * Use this to access String methods.
     */
    get $openehr_id(): String | undefined {
        return this._openehr_id;
    }

    /**
     * Sets openehr_id from either a primitive value or String wrapper.
     */
    set openehr_id(val: string | String | undefined) {
        if (val === undefined || val === null) {
            this._openehr_id = undefined;
        } else if (typeof val === 'string') {
            this._openehr_id = String.from(val);
        } else {
            this._openehr_id = val;
        }
    }

    /**
     * Status of this vocabulary.
     */
    status?: TERMINOLOGY_STATUS;
}

/**
 * A single code entity in a code set.
 */
export class CODE {
    /**
     * Internal storage for value
     * @private
     */
    private _value?: String;

    /**
     * The code string for this code entity, e.g. \`"AF"\`.
     */
    get value(): string | undefined {
        return this._value?.value;
    }

    /**
     * Gets the String wrapper object for value.
     * Use this to access String methods.
     */
    get $value(): String | undefined {
        return this._value;
    }

    /**
     * Sets value from either a primitive value or String wrapper.
     */
    set value(val: string | String | undefined) {
        if (val === undefined || val === null) {
            this._value = undefined;
        } else if (typeof val === 'string') {
            this._value = String.from(val);
        } else {
            this._value = val;
        }
    }

    /**
     * Internal storage for description
     * @private
     */
    private _description?: String;

    /**
     * Optional description of this code, e.g. \`"AFGHANISTAN"\`.
     * 
     * This field may be used to hold translations of the description in a language-specific copy of the English language original code set.
     */
    get description(): string | undefined {
        return this._description?.value;
    }

    /**
     * Gets the String wrapper object for description.
     * Use this to access String methods.
     */
    get $description(): String | undefined {
        return this._description;
    }

    /**
     * Sets description from either a primitive value or String wrapper.
     */
    set description(val: string | String | undefined) {
        if (val === undefined || val === null) {
            this._description = undefined;
        } else if (typeof val === 'string') {
            this._description = String.from(val);
        } else {
            this._description = val;
        }
    }

    /**
     * Status of this code within the code set.
     */
    status?: TERMINOLOGY_STATUS;
}

/**
 * A single terminology concept in a vocabulary.
 */
export class TERMINOLOGY_CONCEPT {
    /**
     * Internal storage for id
     * @private
     */
    private _id?: String;

    /**
     * The code of this concept.
     */
    get id(): string | undefined {
        return this._id?.value;
    }

    /**
     * Gets the String wrapper object for id.
     * Use this to access String methods.
     */
    get $id(): String | undefined {
        return this._id;
    }

    /**
     * Sets id from either a primitive value or String wrapper.
     */
    set id(val: string | String | undefined) {
        if (val === undefined || val === null) {
            this._id = undefined;
        } else if (typeof val === 'string') {
            this._id = String.from(val);
        } else {
            this._id = val;
        }
    }

    /**
     * Internal storage for rubric
     * @private
     */
    private _rubric?: String;

    /**
     * The rubric, i.e. linguistic expression, of this concept, in the language of this terminology instance.
     */
    get rubric(): string | undefined {
        return this._rubric?.value;
    }

    /**
     * Gets the String wrapper object for rubric.
     * Use this to access String methods.
     */
    get $rubric(): String | undefined {
        return this._rubric;
    }

    /**
     * Sets rubric from either a primitive value or String wrapper.
     */
    set rubric(val: string | String | undefined) {
        if (val === undefined || val === null) {
            this._rubric = undefined;
        } else if (typeof val === 'string') {
            this._rubric = String.from(val);
        } else {
            this._rubric = val;
        }
    }

    /**
     * Status of this concept within the vocabulary.
     */
    status?: TERMINOLOGY_STATUS;
}

/**
 * Container for code sets and/or vocabularies that belong to a given logical terminology.
 */
export class TERMINOLOGY {
    /**
     * Internal storage for name
     * @private
     */
    private _name?: String;

    /**
     * Name of this terminology.
     */
    get name(): string | undefined {
        return this._name?.value;
    }

    /**
     * Gets the String wrapper object for name.
     * Use this to access String methods.
     */
    get $name(): String | undefined {
        return this._name;
    }

    /**
     * Sets name from either a primitive value or String wrapper.
     */
    set name(val: string | String | undefined) {
        if (val === undefined || val === null) {
            this._name = undefined;
        } else if (typeof val === 'string') {
            this._name = String.from(val);
        } else {
            this._name = val;
        }
    }

    /**
     * Internal storage for language
     * @private
     */
    private _language?: String;

    /**
     * Language of this terminology, as an ISO:639 2-letter code.
     */
    get language(): string | undefined {
        return this._language?.value;
    }

    /**
     * Gets the String wrapper object for language.
     * Use this to access String methods.
     */
    get $language(): String | undefined {
        return this._language;
    }

    /**
     * Sets language from either a primitive value or String wrapper.
     */
    set language(val: string | String | undefined) {
        if (val === undefined || val === null) {
            this._language = undefined;
        } else if (typeof val === 'string') {
            this._language = String.from(val);
        } else {
            this._language = val;
        }
    }

    /**
     * Code sets in this Terminology.
     */
    code_sets?: undefined;
    /**
     * Vocabularies of coded terms in this terminology.
     */
    vocabularies?: undefined;
    /**
     * Internal storage for version
     * @private
     */
    private _version?: String;

    /**
     * Version of this instance of the terminology.
     */
    get version(): string | undefined {
        return this._version?.value;
    }

    /**
     * Gets the String wrapper object for version.
     * Use this to access String methods.
     */
    get $version(): String | undefined {
        return this._version;
    }

    /**
     * Sets version from either a primitive value or String wrapper.
     */
    set version(val: string | String | undefined) {
        if (val === undefined || val === null) {
            this._version = undefined;
        } else if (typeof val === 'string') {
            this._version = String.from(val);
        } else {
            this._version = val;
        }
    }

    /**
     * Date of issue of this version of the terminology.
     */
    date?: Iso8601_date;
}

/**
 * Enumeration of possible lifecycle states of any part of the terminomlogy.
 */
export class TERMINOLOGY_STATUS extends String {
}

