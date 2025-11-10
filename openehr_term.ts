type undefined = any;
type TERMINOLOGY_STATUS = any;

/**
 * A code set.
 */
export class CODE_SET {
    /**
     * Name of this code set.
     */
    name?: string;
    /**
     * Identifier used for code set in the openEHR Reference Model. The value is inferred from the `_name_` attribute.
     * 
     * Valid values take the form of an xs:NCName value, i.e. cannot contain:
     * 
     * * symbol characters `:, @, $, %, &, /, +, ,, ;`;
     * * whitespace characters or different parentheses. 
     * 
     * An NCName cannot begin with a number, dot or minus character although these can appear later in the value.
     */
    openehr_id?: string;
    /**
     * Name of the issuing organisation.
     */
    issuer?: string;
    /**
     * Codes in this code set.
     */
    codes?: undefined;
    /**
     * An optional identifier assumed by openEHR to be the identifier of this code set, based on its published name, with spaces replaced by underscores.
     * 
     * Valid values take the form of an xs:NCName value, i.e. cannot contain:
     * 
     * * symbol characters `:, @, $, %, &, /, +, ,, ;`;
     * * whitespace characters or different parentheses. 
     * 
     * An NCName cannot begin with a number, dot or minus character although these can appear later in the value.
     */
    external_id?: string;
    /**
     * Status of this code set.
     */
    status?: TERMINOLOGY_STATUS;
}

type undefined = any;
type TERMINOLOGY_STATUS = any;

/**
 * A single vocabulary, in a particular language, within a Terminology.
 */
export class TERMINOLOGY_GROUP {
    /**
     * Name of this vocabulary.
     */
    name?: string;
    /**
     * List of concepts (i.e. coded terms) in this vocabulary.
     */
    concepts?: undefined;
    /**
     * Identifier used for terminology group in the openEHR Reference Model. The value is inferred from the `_name_` attribute.
     * 
     * Valid values take the form of an xs:NCName value, i.e. cannot contain:
     * 
     * * symbol characters `:, @, $, %, &, /, +, ,, ;`;
     * * whitespace characters or different parentheses. 
     * 
     * An NCName cannot begin with a number, dot or minus character although these can appear later in the value.
     */
    openehr_id?: string;
    /**
     * Status of this vocabulary.
     */
    status?: TERMINOLOGY_STATUS;
}

type TERMINOLOGY_STATUS = any;

/**
 * A single code entity in a code set.
 */
export class CODE {
    /**
     * The code string for this code entity, e.g. `"AF"`.
     */
    value?: string;
    /**
     * Optional description of this code, e.g. `"AFGHANISTAN"`.
     * 
     * This field may be used to hold translations of the description in a language-specific copy of the English language original code set.
     */
    description?: string;
    /**
     * Status of this code within the code set.
     */
    status?: TERMINOLOGY_STATUS;
}

type TERMINOLOGY_STATUS = any;

/**
 * A single terminology concept in a vocabulary.
 */
export class TERMINOLOGY_CONCEPT {
    /**
     * The code of this concept.
     */
    id?: string;
    /**
     * The rubric, i.e. linguistic expression, of this concept, in the language of this terminology instance.
     */
    rubric?: string;
    /**
     * Status of this concept within the vocabulary.
     */
    status?: TERMINOLOGY_STATUS;
}

type undefined = any;
type Iso8601_date = any;

/**
 * Container for code sets and/or vocabularies that belong to a given logical terminology.
 */
export class TERMINOLOGY {
    /**
     * Name of this terminology.
     */
    name?: string;
    /**
     * Language of this terminology, as an ISO:639 2-letter code.
     */
    language?: string;
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
    version?: string;
    /**
     * Date of issue of this version of the terminology.
     */
    date?: Iso8601_date;
}

/**
 * Enumeration of possible lifecycle states of any part of the terminomlogy.
 */
export class TERMINOLOGY_STATUS {
}

