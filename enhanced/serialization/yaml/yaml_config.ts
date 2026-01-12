import { ArchetypeNodeIdLocation } from '../common/mod.ts';
export type { ArchetypeNodeIdLocation };

/**
 * Configuration options for YAML serialization
 */
export interface YamlSerializationConfig {
  /**
   * Include _type fields in output
   * @default false
   */
  includeType?: boolean;

  /**
   * Use type inference to omit _type when safe
   * Enables compact mode with fewer type annotations
   * @default true
   */
  useTypeInference?: boolean;

  /**
   * Use flow style for values (inline: {a: 1, b: 2})
   * @default false
   */
  flowStyleValues?: boolean;

  /**
   * Use block style for objects (multi-line)
   * @default true
   */
  blockStyleObjects?: boolean;

  /**
   * Use hybrid style (zipehr-like)
   * Simple objects inline using flow style ({key: value}), complex objects block style
   * @default false
   */
  hybridStyle?: boolean;

  /**
   * Indentation size (spaces)
   * @default 2
   */
  indent?: number;

  /**
   * Line width for wrapping
   * @default 80
   */
  lineWidth?: number;

  /**
   * Use terse format for CODE_PHRASE and DV_CODED_TEXT
   * Works well with YAML (no official standard)
   * 
   * @default true
   */
  useTerseFormat?: boolean;

  /**
   * Include null values
   * @default false
   */
  includeNullValues?: boolean;

  /**
   * Include empty collections
   * @default false
   */
  includeEmptyCollections?: boolean;

  /**
   * Maximum properties for inline formatting in hybrid style
   * @default 3
   */
  maxInlineProperties?: number;

  /**
   * Location of the archetype_node_id property in the serialized output.
   * @default 'after_name'
   */
  archetypeNodeIdLocation?: ArchetypeNodeIdLocation;
}

/**
 * Configuration options for YAML deserialization
 */
export interface YamlDeserializationConfig {
  /**
   * Strict mode: fail on unknown types or duplicate keys
   * @default true (YAML defaults to strict)
   */
  strict?: boolean;

  /**
   * Allow duplicate keys in YAML (overwrite behavior)
   * @default false
   */
  allowDuplicateKeys?: boolean;

  /**
   * Parse terse format strings to CODE_PHRASE and DV_CODED_TEXT
   * @default true
   */
  parseTerseFormat?: boolean;
}

/**
 * Default YAML serialization configuration
 * For YAML, we prioritize readability and compactness since there's no official openEHR YAML standard.
 */
export const DEFAULT_YAML_SERIALIZATION_CONFIG: Required<YamlSerializationConfig> = {
  includeType: false,
  useTypeInference: true,  // Changed to true - omit types when safe for smaller output
  flowStyleValues: false,
  blockStyleObjects: true,
  hybridStyle: false,
  indent: 2,
  lineWidth: 80,
  useTerseFormat: true,  // Changed to true - terse format recommended for YAML
  includeNullValues: false,
  includeEmptyCollections: false,  // Changed to false for more compact output
  maxInlineProperties: 3,
  archetypeNodeIdLocation: 'after_name',
};

/**
 * Default YAML deserialization configuration
 */
export const DEFAULT_YAML_DESERIALIZATION_CONFIG: Required<YamlDeserializationConfig> = {
  strict: true,
  allowDuplicateKeys: false,
  parseTerseFormat: true,  // Changed to true to match default serialization
};

/**
 * Preset: Standard YAML format (readable with types)
 */
export const VERBOSE_YAML_CONFIG: YamlSerializationConfig = {
  includeType: true,
  useTypeInference: false,
  flowStyleValues: false,
  blockStyleObjects: true,
  hybridStyle: false,
  indent: 2,
  lineWidth: 80,
  useTerseFormat: false,
  archetypeNodeIdLocation: 'after_name',
};

/**
 * Preset: Hybrid YAML format (zipehr-like, optimized for readability)
 * Inverted settings for less redundancy and better readability
 */
export const HYBRID_YAML_CONFIG: YamlSerializationConfig = {
  includeType: false,  // Inverted: omit types for less redundancy
  useTypeInference: true,  // Inverted: enable inference for cleaner output
  flowStyleValues: false,
  blockStyleObjects: true,
  hybridStyle: true, // Intelligent inline/block mixing
  indent: 2,
  lineWidth: 80,
  useTerseFormat: true,
  includeNullValues: false,
  includeEmptyCollections: true,
  maxInlineProperties: 3,
};

/**
 * Preset: Flow-style YAML (more JSON-like)
 */
export const FLOW_YAML_CONFIG: YamlSerializationConfig = {
  includeType: true,
  useTypeInference: false,
  flowStyleValues: true,
  blockStyleObjects: false,
  hybridStyle: false,
  indent: 2,
  lineWidth: 120,
  useTerseFormat: false,
};
