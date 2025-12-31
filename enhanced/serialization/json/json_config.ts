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
   * Always include the type property, even when it could be inferred
   * @default false (use type inference to omit when safe)
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
 * Default serialization configuration (canonical JSON format)
 */
export const DEFAULT_JSON_SERIALIZATION_CONFIG: Required<JsonSerializationConfig> = {
  typePropertyName: '_type',
  alwaysIncludeType: false,
  includeNullValues: false,
  includeEmptyCollections: true,
  prettyPrint: false,
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
 * Preset: Compact JSON format (smaller output with type inference)
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
 * Preset: Human-readable JSON with hybrid formatting
 */
export const HYBRID_JSON_CONFIG: JsonSerializationConfig = {
  typePropertyName: '_type',
  alwaysIncludeType: false,
  includeNullValues: false,
  includeEmptyCollections: true,
  prettyPrint: true,
  indent: 2,
  useTerseFormat: false,
  useHybridStyle: true,
  maxInlineProperties: 3,
};

/**
 * Preset: Internal storage format (terse + compact)
 * **WARNING**: Not interoperable with standard openEHR JSON
 */
export const INTERNAL_JSON_CONFIG: JsonSerializationConfig = {
  typePropertyName: '_type',
  alwaysIncludeType: false,
  includeNullValues: false,
  includeEmptyCollections: false,
  prettyPrint: false,
  useTerseFormat: true, // Non-standard!
  useHybridStyle: false,
};
