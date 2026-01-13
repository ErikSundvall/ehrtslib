import { ArchetypeNodeIdLocation } from '../common/mod.ts';
export type { ArchetypeNodeIdLocation };

/**
 * YAML main style options
 */
export type YamlMainStyle = 'block' | 'flow' | 'hybrid';

/**
 * Configuration options for YAML serialization
 */
export interface YamlSerializationConfig {
  /**
   * Main YAML style: 'block', 'flow', or 'hybrid'
   * - 'block': Multi-line block style for all objects
   * - 'flow': Inline flow style with proper line breaks
   * - 'hybrid': Mix of inline and block (simple objects inline, complex objects block)
   * @default 'hybrid'
   */
  mainStyle?: YamlMainStyle;

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
   * @deprecated Use mainStyle instead. This option is kept for backward compatibility.
   * Use flow style for values (inline: {a: 1, b: 2})
   * @default false
   */
  flowStyleValues?: boolean;

  /**
   * @deprecated Use mainStyle instead. This option is kept for backward compatibility.
   * Use block style for objects (multi-line)
   * @default true
   */
  blockStyleObjects?: boolean;

  /**
   * @deprecated Use mainStyle: 'hybrid' instead. This option is kept for backward compatibility.
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

  /**
   * Keep archetype metadata (name, archetype_node_id, archetype_details) inline.
   * ONLY works with mainStyle: 'flow'. When enabled in flow style, archetype metadata
   * is formatted on one line with strategic line breaks, while other properties 
   * remain on separate lines for better readability.
   * 
   * Has no effect in 'block' or 'hybrid' styles.
   * @default true (enabled by default in flow mode)
   */
  keepArchetypeDetailsInline?: boolean;
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
  mainStyle: 'hybrid',
  includeType: false,
  useTypeInference: true,  // Changed to true - omit types when safe for smaller output
  flowStyleValues: false,  // Deprecated - use mainStyle
  blockStyleObjects: true,  // Deprecated - use mainStyle
  hybridStyle: false,  // Deprecated - use mainStyle
  indent: 2,
  lineWidth: 80,
  useTerseFormat: true,  // Changed to true - terse format recommended for YAML
  includeNullValues: false,
  includeEmptyCollections: false,  // Changed to false for more compact output
  maxInlineProperties: 3,
  archetypeNodeIdLocation: 'after_name',
  keepArchetypeDetailsInline: false,  // Only works with flow style
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
  mainStyle: 'block',
  includeType: true,
  useTypeInference: false,
  indent: 2,
  lineWidth: 80,
  useTerseFormat: false,
  archetypeNodeIdLocation: 'after_name',
  keepArchetypeDetailsInline: false,
};

/**
 * Preset: Hybrid YAML format (zipehr-like, optimized for readability)
 * Simple objects inline, complex objects in block style
 */
export const HYBRID_YAML_CONFIG: YamlSerializationConfig = {
  mainStyle: 'hybrid',
  includeType: false,
  useTypeInference: true,
  indent: 2,
  lineWidth: 0,
  useTerseFormat: true,
  includeNullValues: false,
  includeEmptyCollections: true,
  maxInlineProperties: 3,
  keepArchetypeDetailsInline: false,  // Not applicable in hybrid mode
  archetypeNodeIdLocation: 'after_name',
};

/**
 * Preset: Flow-style YAML (compact with strategic line breaks)
 */
export const FLOW_YAML_CONFIG: YamlSerializationConfig = {
  mainStyle: 'flow',
  includeType: false,
  useTypeInference: true,
  indent: 2,
  lineWidth: 0,  // Disable wrapping for better control
  useTerseFormat: true,
  keepArchetypeDetailsInline: true,  // Enable archetype inline in flow mode
  archetypeNodeIdLocation: 'after_name',
};

/**
 * Preset: Block-style YAML (traditional multi-line format)
 */
export const BLOCK_YAML_CONFIG: YamlSerializationConfig = {
  mainStyle: 'block',
  includeType: false,
  useTypeInference: true,
  indent: 2,
  lineWidth: 80,
  useTerseFormat: true,
  keepArchetypeDetailsInline: false,  // Not applicable in block mode
  archetypeNodeIdLocation: 'after_name',
};
