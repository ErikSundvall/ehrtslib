// Enhanced implementation based on BMM schema: term v3.1.0
// BMM Version: 2.4
// Schema Revision: 3.1.0.2
// Description: term
// Source: https://raw.githubusercontent.com/sebastian-iancu/code-generator/master/code/BMM-JSON/openehr_term_3.1.0.bmm.json
// Last synced with BMM: 2025-11-14
//
// ✅ ENHANCED IMPLEMENTATION
// This file contains fully implemented methods and additional functionality beyond the BMM specification.
// It is safe to edit this file - your changes will not be overwritten by the generator.
//
// The generator outputs to /generated directory. To update this file for a new BMM version:
// 1. Run generator to update /generated/openehr_term.ts
// 2. Compare changes using: deno run --allow-read tasks/compare_bmm_versions.ts
// 3. Manually merge relevant changes into this file
//
// For more information about openEHR specifications, visit: https://specifications.openehr.org/

import * as openehr_base from "./openehr_base.ts";

/**
 * A code set.
 */
export class CODE_SET {
  /**
   * Internal storage for name
   * @protected
   */
  protected _name?: openehr_base.String;

  /**
   * Name of this code set.
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
   * Internal storage for openehr_id
   * @protected
   */
  protected _openehr_id?: openehr_base.String;

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
   * Gets the openehr_base.String wrapper object for openehr_id.
   * Use this to access openehr_base.String methods.
   */
  get $openehr_id(): openehr_base.String | undefined {
    return this._openehr_id;
  }

  /**
   * Sets openehr_id from either a primitive value or openehr_base.String wrapper.
   */
  set openehr_id(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._openehr_id = undefined;
    } else if (typeof val === "string") {
      this._openehr_id = openehr_base.String.from(val);
    } else {
      this._openehr_id = val;
    }
  }

  /**
   * Internal storage for issuer
   * @protected
   */
  protected _issuer?: openehr_base.String;

  /**
   * Name of the issuing organisation.
   */
  get issuer(): string | undefined {
    return this._issuer?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for issuer.
   * Use this to access openehr_base.String methods.
   */
  get $issuer(): openehr_base.String | undefined {
    return this._issuer;
  }

  /**
   * Sets issuer from either a primitive value or openehr_base.String wrapper.
   */
  set issuer(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._issuer = undefined;
    } else if (typeof val === "string") {
      this._issuer = openehr_base.String.from(val);
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
   * @protected
   */
  protected _external_id?: openehr_base.String;

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
   * Gets the openehr_base.String wrapper object for external_id.
   * Use this to access openehr_base.String methods.
   */
  get $external_id(): openehr_base.String | undefined {
    return this._external_id;
  }

  /**
   * Sets external_id from either a primitive value or openehr_base.String wrapper.
   */
  set external_id(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._external_id = undefined;
    } else if (typeof val === "string") {
      this._external_id = openehr_base.String.from(val);
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
   * @protected
   */
  protected _name?: openehr_base.String;

  /**
   * Name of this vocabulary.
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
   * List of concepts (i.e. coded terms) in this vocabulary.
   */
  concepts?: undefined;
  /**
   * Internal storage for openehr_id
   * @protected
   */
  protected _openehr_id?: openehr_base.String;

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
   * Gets the openehr_base.String wrapper object for openehr_id.
   * Use this to access openehr_base.String methods.
   */
  get $openehr_id(): openehr_base.String | undefined {
    return this._openehr_id;
  }

  /**
   * Sets openehr_id from either a primitive value or openehr_base.String wrapper.
   */
  set openehr_id(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._openehr_id = undefined;
    } else if (typeof val === "string") {
      this._openehr_id = openehr_base.String.from(val);
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
   * @protected
   */
  protected _value?: openehr_base.String;

  /**
   * The code string for this code entity, e.g. \`"AF"\`.
   */
  get value(): string | undefined {
    return this._value?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for value.
   * Use this to access openehr_base.String methods.
   */
  get $value(): openehr_base.String | undefined {
    return this._value;
  }

  /**
   * Sets value from either a primitive value or openehr_base.String wrapper.
   */
  set value(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._value = undefined;
    } else if (typeof val === "string") {
      this._value = openehr_base.String.from(val);
    } else {
      this._value = val;
    }
  }

  /**
   * Internal storage for description
   * @protected
   */
  protected _description?: openehr_base.String;

  /**
   * Optional description of this code, e.g. \`"AFGHANISTAN"\`.
   *
   * This field may be used to hold translations of the description in a language-specific copy of the English language original code set.
   */
  get description(): string | undefined {
    return this._description?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for description.
   * Use this to access openehr_base.String methods.
   */
  get $description(): openehr_base.String | undefined {
    return this._description;
  }

  /**
   * Sets description from either a primitive value or openehr_base.String wrapper.
   */
  set description(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._description = undefined;
    } else if (typeof val === "string") {
      this._description = openehr_base.String.from(val);
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
   * @protected
   */
  protected _id?: openehr_base.String;

  /**
   * The code of this concept.
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

  /**
   * Internal storage for rubric
   * @protected
   */
  protected _rubric?: openehr_base.String;

  /**
   * The rubric, i.e. linguistic expression, of this concept, in the language of this terminology instance.
   */
  get rubric(): string | undefined {
    return this._rubric?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for rubric.
   * Use this to access openehr_base.String methods.
   */
  get $rubric(): openehr_base.String | undefined {
    return this._rubric;
  }

  /**
   * Sets rubric from either a primitive value or openehr_base.String wrapper.
   */
  set rubric(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._rubric = undefined;
    } else if (typeof val === "string") {
      this._rubric = openehr_base.String.from(val);
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
   * @protected
   */
  protected _name?: openehr_base.String;

  /**
   * Name of this terminology.
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
   * Internal storage for language
   * @protected
   */
  protected _language?: openehr_base.String;

  /**
   * Language of this terminology, as an ISO:639 2-letter code.
   */
  get language(): string | undefined {
    return this._language?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for language.
   * Use this to access openehr_base.String methods.
   */
  get $language(): openehr_base.String | undefined {
    return this._language;
  }

  /**
   * Sets language from either a primitive value or openehr_base.String wrapper.
   */
  set language(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._language = undefined;
    } else if (typeof val === "string") {
      this._language = openehr_base.String.from(val);
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
   * @protected
   */
  protected _version?: openehr_base.String;

  /**
   * Version of this instance of the terminology.
   */
  get version(): string | undefined {
    return this._version?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for version.
   * Use this to access openehr_base.String methods.
   */
  get $version(): openehr_base.String | undefined {
    return this._version;
  }

  /**
   * Sets version from either a primitive value or openehr_base.String wrapper.
   */
  set version(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._version = undefined;
    } else if (typeof val === "string") {
      this._version = openehr_base.String.from(val);
    } else {
      this._version = val;
    }
  }

  /**
   * Date of issue of this version of the terminology.
   */
  date?: openehr_base.Iso8601_date;
}

/**
 * Enumeration of possible lifecycle states of any part of the terminomlogy.
 */
export class TERMINOLOGY_STATUS extends openehr_base.String {
}
