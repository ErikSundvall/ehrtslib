/**
 * Initialization Helper Functions
 * 
 * This module provides helper functions for constructor initialization
 * that enable simplified object creation with automatic type conversion.
 * 
 * These functions support:
 * - Primitive values (strings, numbers) -> wrapper objects
 * - Terse format strings -> complex objects (CODE_PHRASE, DV_CODED_TEXT)
 * - Partial objects -> full instances
 * - Full instances -> pass-through
 */

import { TERMINOLOGY_ID, ARCHETYPE_ID, OBJECT_VERSION_ID } from "./openehr_base.ts";
import { 
  CODE_PHRASE, 
  DV_TEXT, 
  DV_CODED_TEXT,
  PARTY_PROXY,
  PARTY_IDENTIFIED,
  ARCHETYPED,
  EVENT_CONTEXT
} from "./openehr_rm.ts";
import { parseTerseCodePhrase, parseTerseDvCodedText } from "./terse_format.ts";

/**
 * Initialize any single-value wrapper type (TERMINOLOGY_ID, ARCHETYPE_ID, OBJECT_VERSION_ID, etc.)
 * 
 * @param value - String primitive, full instance, or partial object
 * @param constructor - Constructor function for the target type
 * @returns Initialized instance
 */
export function initSingleValueWrapper<T extends { value?: string }>(
  value: string | T | Partial<T> | undefined,
  constructor: new () => T
): T | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  
  if (typeof value === 'string') {
    const instance = new constructor();
    (instance as any).value = value;
    return instance;
  } else if (value instanceof constructor) {
    return value;
  } else {
    return Object.assign(new constructor(), value) as T;
  }
}

/**
 * Initialize TERMINOLOGY_ID from string or object.
 * 
 * @param value - String, full instance, or partial object
 * @returns Initialized TERMINOLOGY_ID or undefined
 * 
 * @example
 * ```typescript
 * const termId = initTerminologyId("ISO_639-1");
 * const termId2 = initTerminologyId({ value: "openehr" });
 * ```
 */
export function initTerminologyId(
  value: string | TERMINOLOGY_ID | Partial<TERMINOLOGY_ID> | undefined
): TERMINOLOGY_ID | undefined {
  return initSingleValueWrapper(value, TERMINOLOGY_ID);
}

/**
 * Initialize ARCHETYPE_ID from string or object.
 * 
 * @param value - String, full instance, or partial object
 * @returns Initialized ARCHETYPE_ID or undefined
 */
export function initArchetypeId(
  value: string | ARCHETYPE_ID | Partial<ARCHETYPE_ID> | undefined
): ARCHETYPE_ID | undefined {
  return initSingleValueWrapper(value, ARCHETYPE_ID);
}

/**
 * Initialize OBJECT_VERSION_ID from string or object.
 * 
 * @param value - String, full instance, or partial object
 * @returns Initialized OBJECT_VERSION_ID or undefined
 */
export function initObjectVersionId(
  value: string | OBJECT_VERSION_ID | Partial<OBJECT_VERSION_ID> | undefined
): OBJECT_VERSION_ID | undefined {
  return initSingleValueWrapper(value, OBJECT_VERSION_ID);
}

/**
 * Initialize DV_TEXT from string or object.
 * 
 * @param value - String (sets value property), full instance, or partial object
 * @returns Initialized DV_TEXT or undefined
 * 
 * @example
 * ```typescript
 * const text = initDvText("Hello"); // Creates DV_TEXT with value="Hello"
 * const text2 = initDvText({ value: "World", language: {...} });
 * ```
 */
export function initDvText(
  value: string | DV_TEXT | Partial<DV_TEXT> | undefined
): DV_TEXT | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  
  if (value instanceof DV_TEXT) {
    return value;
  } else {
    // Use DV_TEXT constructor to leverage its initialization logic
    return new DV_TEXT(value);
  }
}

/**
 * Initialize CODE_PHRASE from string (terse or object) or object.
 * 
 * Supports:
 * - Terse format: "terminology::code" (e.g., "ISO_639-1::en")
 * - Object format: { code_string: "en", terminology_id: "ISO_639-1" }
 * - Full instance pass-through
 * 
 * @param value - String (terse format), full instance, or partial object
 * @returns Initialized CODE_PHRASE or undefined
 * @throws Error if string is not valid terse format and not an object
 * 
 * @example
 * ```typescript
 * const cp = initCodePhrase("ISO_639-1::en");
 * const cp2 = initCodePhrase({ code_string: "en", terminology_id: "ISO_639-1" });
 * ```
 */
export function initCodePhrase(
  value: string | CODE_PHRASE | Partial<CODE_PHRASE> | undefined
): CODE_PHRASE | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  
  if (typeof value === 'string') {
    // Try parsing as terse format
    const parsed = parseTerseCodePhrase(value);
    if (parsed) return parsed;
    
    // Not terse format - throw descriptive error
    throw new Error(
      `Invalid CODE_PHRASE format: "${value}"\n` +
      `Expected terse format like "terminology::code"\n` +
      `Examples:\n` +
      `  - "ISO_639-1::en"\n` +
      `  - "openehr::433"\n` +
      `Or use object format: { code_string: "en", terminology_id: "ISO_639-1" }`
    );
  } else if (value instanceof CODE_PHRASE) {
    return value;
  } else {
    // Partial object - construct from parts
    const cp = new CODE_PHRASE();
    if ('terminology_id' in value && value.terminology_id !== undefined) {
      cp.terminology_id = initTerminologyId(value.terminology_id as any);
    }
    if ('code_string' in value && value.code_string !== undefined) {
      cp.code_string = value.code_string as string;
    }
    return cp;
  }
}

/**
 * Initialize DV_CODED_TEXT from string (terse format) or object.
 * 
 * Supports:
 * - Terse format: "terminology::code|value|" (e.g., "openehr::433|event|")
 * - Object format: { value: "event", defining_code: {...} }
 * - Full instance pass-through
 * 
 * @param value - String (terse format), full instance, or partial object
 * @returns Initialized DV_CODED_TEXT or undefined
 * @throws Error if string is not valid terse format
 * 
 * @example
 * ```typescript
 * const dct = initDvCodedText("openehr::433|event|");
 * const dct2 = initDvCodedText({ 
 *   value: "event", 
 *   defining_code: { code_string: "433", terminology_id: "openehr" }
 * });
 * ```
 */
export function initDvCodedText(
  value: string | DV_CODED_TEXT | Partial<DV_CODED_TEXT> | undefined
): DV_CODED_TEXT | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  
  if (typeof value === 'string') {
    // Try parsing as terse format
    const parsed = parseTerseDvCodedText(value);
    if (parsed) return parsed;
    
    // Not terse format - throw descriptive error
    throw new Error(
      `Invalid DV_CODED_TEXT format: "${value}"\n` +
      `Expected terse format like "terminology::code|value|"\n` +
      `Examples:\n` +
      `  - "openehr::433|event|"\n` +
      `  - "SNOMED-CT::73211009|diabetes mellitus|"\n` +
      `Or use object format: { value: "event", defining_code: {...} }`
    );
  } else if (value instanceof DV_CODED_TEXT) {
    return value;
  } else {
    // Partial object - construct from parts
    const dct = new DV_CODED_TEXT();
    if ('value' in value && value.value !== undefined) {
      dct.value = value.value as string;
    }
    if ('defining_code' in value && value.defining_code !== undefined) {
      dct.defining_code = initCodePhrase(value.defining_code as any);
    }
    // Copy other DV_TEXT properties if present
    if ('hyperlink' in value) dct.hyperlink = value.hyperlink as any;
    if ('formatting' in value) dct.formatting = value.formatting as any;
    if ('mappings' in value) dct.mappings = value.mappings as any;
    if ('language' in value) dct.language = initCodePhrase(value.language as any);
    if ('encoding' in value) dct.encoding = initCodePhrase(value.encoding as any);
    
    return dct;
  }
}

/**
 * Initialize PARTY_PROXY or subtype from object.
 * Handles both PARTY_IDENTIFIED and other subtypes.
 * 
 * @param value - Full instance or partial object
 * @returns Initialized PARTY_PROXY or undefined
 */
export function initPartyProxy(
  value: PARTY_PROXY | Partial<PARTY_PROXY> | undefined
): PARTY_PROXY | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  
  // If it's already a PARTY_PROXY instance, return it
  if (value instanceof PARTY_PROXY) {
    return value;
  }
  
  // Otherwise, create PARTY_IDENTIFIED (most common case)
  const party = new PARTY_IDENTIFIED();
  
  // Handle 'name' property - PARTY_IDENTIFIED.name is a String, not DV_TEXT
  if ('name' in value && value.name !== undefined) {
    if (typeof value.name === 'string') {
      party.name = value.name;
    } else if (typeof (value.name as any).value === 'string') {
      // If it's a DV_TEXT-like object with value property, extract the value
      party.name = (value.name as any).value;
    } else {
      party.name = value.name as any;
    }
  }
  
  // Copy other properties
  if ('external_ref' in value) party.external_ref = value.external_ref as any;
  if ('identifiers' in value) party.identifiers = value.identifiers as any;
  
  return party;
}

/**
 * Initialize ARCHETYPED from object.
 * 
 * @param value - Full instance or partial object
 * @returns Initialized ARCHETYPED or undefined
 */
export function initArchetyped(
  value: ARCHETYPED | Partial<ARCHETYPED> | undefined
): ARCHETYPED | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  
  if (value instanceof ARCHETYPED) {
    return value;
  }
  
  const archetyped = new ARCHETYPED();
  
  if ('archetype_id' in value && value.archetype_id !== undefined) {
    archetyped.archetype_id = initArchetypeId(value.archetype_id as any);
  }
  if ('rm_version' in value && value.rm_version !== undefined) {
    archetyped.rm_version = value.rm_version as string;
  }
  if ('template_id' in value) archetyped.template_id = value.template_id as any;
  
  return archetyped;
}

/**
 * Initialize EVENT_CONTEXT from object.
 * 
 * @param value - Full instance or partial object
 * @returns Initialized EVENT_CONTEXT or undefined
 */
export function initEventContext(
  value: EVENT_CONTEXT | Partial<EVENT_CONTEXT> | undefined
): EVENT_CONTEXT | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  
  if (value instanceof EVENT_CONTEXT) {
    return value;
  }
  
  const context = new EVENT_CONTEXT();
  
  // Copy properties (simplified - doesn't handle nested initialization)
  Object.assign(context, value);
  
  return context;
}
