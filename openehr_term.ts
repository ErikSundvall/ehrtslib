// Generated from BMM schema: term v3.1.0
// BMM Version: 2.4
// Schema Revision: 3.1.0.2
// Description: term
// Source: https://raw.githubusercontent.com/sebastian-iancu/code-generator/master/code/BMM-JSON/openehr_term_3.1.0.bmm.json
// Generated: 2025-11-11T08:25:31.047Z
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
     * Name of this code set.
     */
    name?: String;
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
    openehr_id?: String;
    /**
     * Name of the issuing organisation.
     */
    issuer?: String;
    /**
     * Codes in this code set.
     */
    codes?: undefined;
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
    external_id?: String;
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
     * Name of this vocabulary.
     */
    name?: String;
    /**
     * List of concepts (i.e. coded terms) in this vocabulary.
     */
    concepts?: undefined;
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
    openehr_id?: String;
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
     * The code string for this code entity, e.g. \`"AF"\`.
     */
    value?: String;
    /**
     * Optional description of this code, e.g. \`"AFGHANISTAN"\`.
     * 
     * This field may be used to hold translations of the description in a language-specific copy of the English language original code set.
     */
    description?: String;
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
     * The code of this concept.
     */
    id?: String;
    /**
     * The rubric, i.e. linguistic expression, of this concept, in the language of this terminology instance.
     */
    rubric?: String;
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
     * Name of this terminology.
     */
    name?: String;
    /**
     * Language of this terminology, as an ISO:639 2-letter code.
     */
    language?: String;
    /**
     * Code sets in this Terminology.
     */
    code_sets?: undefined;
    /**
     * Vocabularies of coded terms in this terminology.
     */
    vocabularies?: undefined;
    /**
     * Version of this instance of the terminology.
     */
    version?: String;
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

