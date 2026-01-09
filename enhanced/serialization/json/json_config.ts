/**
 * JSON Serialization Configuration
 * 
 * Defines configuration options for JSON serialization and deserialization
 * of openEHR RM objects, following the openEHR ITS-JSON specification.
 */

/**
 * Configuration options for JSON serialization
 */
export interface JsonSerializationConfig {
  /**
   * Name of the type discriminator property
   * @default "_type"
   */
  typePropertyName?: string;
  
  /**
   * Always include the type property, even when it could be inferred.
   * Setting this to false enables type inference which reduces JSON size but may
   * impact serialization/deserialization performance (trade-off: size vs speed).
   * @default true (for canonical JSON compliance and maximum interoperability)
   */
  alwaysIncludeType?: boolean;
  
  /**
   * Include properties with null values
   * @default false
   */
  includeNullValues?: boolean;
  
  /**
   * Include empty collections (arrays/objects)
   * @default true
   */
  includeEmptyCollections?: boolean;
  
  /**
   * Use pretty printing (formatted with indentation)
   * @default false
   */
  prettyPrint?: boolean;
  
  /**
   * Indentation size (spaces) when pretty printing
   * @default 2
   */
  indent?: number;
  
  /**
   * Use terse format for CODE_PHRASE and DV_CODED_TEXT
   * 
   * **WARNING**: This breaks the canonical JSON format and may cause
   * interoperability issues with other openEHR implementations.
   * Use only for internal storage or when you control both ends.
   * 
   * @default false
   */
  useTerseFormat?: boolean;
  
  /**
   * Use hybrid style formatting (zipehr-like)
   * Simple objects inline, complex objects with line breaks
   * 
   * @default false
   */
  useHybridStyle?: boolean;
  
  /**
   * Maximum properties for inline formatting in hybrid style
   * @default 3
   */
  maxInlineProperties?: number;
}

/**
 * Configuration options for JSON deserialization
 */
export interface JsonDeserializationConfig {
  /**
   * Name of the type discriminator property
   * @default "_type"
   */
  typePropertyName?: string;
  
  /**
   * Strict mode: fail on unknown types or missing required properties
   * @default false
   */
  strict?: boolean;
  
  /**
   * Allow incomplete objects (missing required properties)
   * @default false
   */
  allowIncomplete?: boolean;
  
  /**
   * Parse terse format strings to CODE_PHRASE and DV_CODED_TEXT
   * Automatically detects and converts strings like "ISO_639-1::en"
   * 
   * @default false
   */
  parseTerseFormat?: boolean;
}

/**
 * Default serialization configuration (canonical JSON format - openEHR standard)
 * This is the recommended configuration for interoperability with other openEHR implementations.
 */
export const DEFAULT_JSON_SERIALIZATION_CONFIG: Required<JsonSerializationConfig> = {
  typePropertyName: '_type',
  alwaysIncludeType: true,  // Changed to true for canonical compliance by default
  includeNullValues: false,
  includeEmptyCollections: true,
  prettyPrint: true,  // Changed to true for readability by default
  indent: 2,
  useTerseFormat: false,
  useHybridStyle: false,
  maxInlineProperties: 3,
};

/**
 * Default deserialization configuration
 */
export const DEFAULT_JSON_DESERIALIZATION_CONFIG: Required<JsonDeserializationConfig> = {
  typePropertyName: '_type',
  strict: false,
  allowIncomplete: false,
  parseTerseFormat: false,
};

/**
 * Preset: Canonical JSON format (strict openEHR compliance)
 * Use this for maximum interoperability with other openEHR implementations.
 */
export const CANONICAL_JSON_CONFIG: JsonSerializationConfig = {
  typePropertyName: '_type',
  alwaysIncludeType: true,
  includeNullValues: false,
  includeEmptyCollections: true,
  prettyPrint: true,
  indent: 2,
  useTerseFormat: false,
  useHybridStyle: false,
};

/**
 * Preset: Canonical JSON deserialization (strict openEHR compliance)
 */
export const CANONICAL_JSON_DESERIALIZE_CONFIG: JsonDeserializationConfig = {
  typePropertyName: '_type',
  strict: false,
  allowIncomplete: false,
  parseTerseFormat: false,
};

/**
 * Preset: Compact JSON format (smaller output with type inference)
 * Trade-off: Smaller size but slower serialization/deserialization due to type inference.
 */
export const COMPACT_JSON_CONFIG: JsonSerializationConfig = {
  typePropertyName: '_type',
  alwaysIncludeType: false, // Use type inference
  includeNullValues: false,
  includeEmptyCollections: false,
  prettyPrint: false,
  useTerseFormat: false,
  useHybridStyle: false,
};

/**
 * Preset: Compact JSON deserialization
 */
export const COMPACT_JSON_DESERIALIZE_CONFIG: JsonDeserializationConfig = {
  typePropertyName: '_type',
  strict: false,
  allowIncomplete: false,
  parseTerseFormat: false,
};

/**
 * Preset: Somewhat more human-readable JSON with hybrid formatting
 */
export const HYBRID_JSON_CONFIG: JsonSerializationConfig = {
  typePropertyName: '_type',
  alwaysIncludeType: false,
  includeNullValues: false,
  includeEmptyCollections: true,
  prettyPrint: true,
  indent: 2,
  useTerseFormat: false,
  useHybridStyle: true,  // Note: Hybrid formatting is not fully implemented
  maxInlineProperties: 3,
};

/**
 * Preset: Hybrid JSON deserialization
 */
export const HYBRID_JSON_DESERIALIZE_CONFIG: JsonDeserializationConfig = {
  typePropertyName: '_type',
  strict: false,
  allowIncomplete: false,
  parseTerseFormat: false,
};

/**
 * Preset: Non-standard very compact format (terse + compact)
 * **WARNING**: Not interoperable with standard openEHR JSON. Use only for internal storage.
 * Trade-off: Smallest size but breaks canonical format and impacts performance.
 */
export const NON_STANDARD_VERY_COMPACT_JSON_CONFIG: JsonSerializationConfig = {
  typePropertyName: '_type',
  alwaysIncludeType: false,
  includeNullValues: false,
  includeEmptyCollections: false,
  prettyPrint: false,
  useTerseFormat: true, // Non-standard!
  useHybridStyle: false,
};

/**
 * Preset: Non-standard very compact deserialization
 * **WARNING**: Only use with NON_STANDARD_VERY_COMPACT_JSON_CONFIG serialized data.
 */
export const NON_STANDARD_VERY_COMPACT_JSON_DESERIALIZE_CONFIG: JsonDeserializationConfig = {
  typePropertyName: '_type',
  strict: false,
  allowIncomplete: false,
  parseTerseFormat: true,  // Must enable to deserialize terse format
};
