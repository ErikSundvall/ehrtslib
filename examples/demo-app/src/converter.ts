/**
 * Converter Module
 * 
 * Handles conversion between different openEHR formats using ehrtslib serialization modules.
 */

import {
  JsonCanonicalSerializer,
  JsonCanonicalDeserializer,
  JsonConfigurableSerializer,
  JsonConfigurableDeserializer,
  type JsonSerializationConfig,
  type JsonDeserializationConfig,
  DEFAULT_JSON_SERIALIZATION_CONFIG,
  DEFAULT_JSON_DESERIALIZATION_CONFIG,
  CANONICAL_JSON_CONFIG,
  CANONICAL_JSON_DESERIALIZE_CONFIG,
  COMPACT_JSON_CONFIG,
  COMPACT_JSON_DESERIALIZE_CONFIG,
  HYBRID_JSON_CONFIG,
  HYBRID_JSON_DESERIALIZE_CONFIG,
  NON_STANDARD_VERY_COMPACT_JSON_CONFIG,
  NON_STANDARD_VERY_COMPACT_JSON_DESERIALIZE_CONFIG,
} from '../../../enhanced/serialization/json/mod.ts';

import {
  YamlSerializer,
  YamlDeserializer,
  type YamlSerializationConfig,
  type YamlDeserializationConfig,
  DEFAULT_YAML_SERIALIZATION_CONFIG,
  DEFAULT_YAML_DESERIALIZATION_CONFIG,
  VERBOSE_YAML_CONFIG,
  HYBRID_YAML_CONFIG,
  FLOW_YAML_CONFIG,
} from '../../../enhanced/serialization/yaml/mod.ts';

import {
  XmlSerializer,
  XmlDeserializer,
} from '../../../enhanced/serialization/xml/mod.ts';

import {
  TypeScriptConstructorSerializer,
  type TypeScriptConstructorSerializationConfig,
} from '../../../enhanced/serialization/typescript/mod.ts';

import {
  TypeRegistry,
  SerializationError,
  DeserializationError,
} from '../../../enhanced/serialization/common/mod.ts';

// Import RM and Base modules for type registration
import * as openehr_rm from '../../../enhanced/openehr_rm.ts';
import * as openehr_base from '../../../enhanced/openehr_base.ts';

// Global flag to track if TypeRegistry is initialized
let typeRegistryInitialized = false;

/**
 * Initialize the TypeRegistry with all RM types
 */
export function initializeTypeRegistry() {
  if (typeRegistryInitialized) {
    return;
  }

  try {
    // Register RM types
    TypeRegistry.registerModule(openehr_rm);

    // Register BASE types
    TypeRegistry.registerModule(openehr_base);

    typeRegistryInitialized = true;
    console.log('✓ TypeRegistry initialized with', TypeRegistry.getAllTypeNames().length, 'types');
  } catch (error) {
    console.error('Failed to initialize TypeRegistry:', error);
    throw error;
  }
}

/**
 * Input format types
 */
export type InputFormat = 'xml' | 'json' | 'yaml';

/**
 * Output format types
 */
export type OutputFormat = 'xml' | 'json' | 'yaml' | 'typescript';

/**
 * Conversion options
 */
export interface ConversionOptions {
  inputFormat: InputFormat;
  inputDeserializerConfig: JsonDeserializationConfig | YamlDeserializationConfig;
  outputFormats: OutputFormat[];
  jsonSerializerType: 'canonical' | 'configurable';
  jsonConfig: JsonSerializationConfig;
  yamlConfig: YamlSerializationConfig;
  xmlConfig: { prettyPrint: boolean; indent: number; includeDeclaration: boolean; includeNamespaces: boolean };
  typescriptConfig: TypeScriptConstructorSerializationConfig;
}

/**
 * Conversion result
 */
export interface ConversionResult {
  success: boolean;
  outputs?: {
    xml?: string;
    json?: string;
    yaml?: string;
    typescript?: string;
  };
  error?: string;
  errorDetails?: any;
}

/**
 * Convert input data to requested output formats
 */
export async function convert(input: string, options: ConversionOptions): Promise<ConversionResult> {
  // Initialize TypeRegistry if not done yet
  if (!typeRegistryInitialized) {
    initializeTypeRegistry();
  }

  try {
    // Step 1: Deserialize input to RM object
    const rmObject = await deserializeInput(input, options.inputFormat, options.inputDeserializerConfig);

    // Step 2: Serialize to requested output formats
    const outputs: Record<string, string> = {};

    for (const format of options.outputFormats) {
      try {
        switch (format) {
          case 'xml':
            outputs.xml = serializeToXml(rmObject, options.xmlConfig);
            break;
          case 'json':
            outputs.json = serializeToJson(rmObject, options.jsonSerializerType, options.jsonConfig);
            break;
          case 'yaml':
            outputs.yaml = serializeToYaml(rmObject, options.yamlConfig);
            break;
          case 'typescript':
            outputs.typescript = generateTypeScriptCode(rmObject, options.typescriptConfig);
            break;
        }
      } catch (error) {
        console.error(`Failed to serialize to ${format}:`, error);
        throw new Error(`Failed to convert to ${format}: ${(error as Error).message}`);
      }
    }

    return {
      success: true,
      outputs
    };

  } catch (error) {
    console.error('Conversion error:', error);
    return {
      success: false,
      error: (error as Error).message,
      errorDetails: error
    };
  }
}

/**
 * Deserialize input based on format
 */
async function deserializeInput(
  input: string,
  format: InputFormat,
  config: JsonDeserializationConfig | YamlDeserializationConfig
): Promise<any> {
  switch (format) {
    case 'json': {
      const deserializer = new JsonConfigurableDeserializer(config as JsonDeserializationConfig);
      return deserializer.deserialize(input);
    }
    case 'yaml': {
      const deserializer = new YamlDeserializer(config as YamlDeserializationConfig);
      return deserializer.deserialize(input);
    }
    case 'xml': {
      const deserializer = new XmlDeserializer();
      return deserializer.deserialize(input);
    }
    default:
      throw new Error(`Unsupported input format: ${format}`);
  }
}

/**
 * Serialize RM object to JSON
 */
function serializeToJson(
  obj: any,
  serializerType: 'canonical' | 'configurable',
  config: JsonSerializationConfig
): string {
  if (serializerType === 'canonical') {
    const serializer = new JsonCanonicalSerializer();
    return serializer.serialize(obj, {
      prettyPrint: config.prettyPrint,
      indent: config.indent,
      archetypeNodeIdLocation: config.archetypeNodeIdLocation
    });
  } else {
    const serializer = new JsonConfigurableSerializer(config);
    return serializer.serialize(obj);
  }
}

/**
 * Serialize RM object to YAML
 */
function serializeToYaml(obj: any, config: YamlSerializationConfig): string {
  const serializer = new YamlSerializer(config);
  return serializer.serialize(obj);
}

/**
 * Serialize RM object to XML
 */
function serializeToXml(
  obj: any,
  config: { prettyPrint: boolean; indent: number; includeDeclaration: boolean; includeNamespaces: boolean }
): string {
  const serializer = new XmlSerializer({
    prettyPrint: config.prettyPrint,
    indent: ' '.repeat(config.indent), // Convert number to string of spaces
    includeDeclaration: config.includeDeclaration,
    useNamespaces: config.includeNamespaces
  });
  return serializer.serialize(obj);
}

/**
 * Generate TypeScript initialization code
 */
function generateTypeScriptCode(
  obj: any,
  config: TypeScriptConstructorSerializationConfig
): string {
  const serializer = new TypeScriptConstructorSerializer(config);
  return serializer.serialize(obj);
}

/**
 * Get configuration presets
 */
export function getJsonConfigPreset(preset: string): JsonSerializationConfig {
  switch (preset) {
    case 'canonical':
      return CANONICAL_JSON_CONFIG;
    case 'compact':
      return COMPACT_JSON_CONFIG;
    case 'hybrid':
      return HYBRID_JSON_CONFIG;
    case 'very-compact':
      return NON_STANDARD_VERY_COMPACT_JSON_CONFIG;
    default:
      return DEFAULT_JSON_SERIALIZATION_CONFIG;
  }
}

export function getJsonDeserializeConfigPreset(preset: string): JsonDeserializationConfig {
  switch (preset) {
    case 'canonical':
      return CANONICAL_JSON_DESERIALIZE_CONFIG;
    case 'compact':
      return COMPACT_JSON_DESERIALIZE_CONFIG;
    case 'hybrid':
      return HYBRID_JSON_DESERIALIZE_CONFIG;
    default:
      return DEFAULT_JSON_DESERIALIZATION_CONFIG;
  }
}

export function getYamlConfigPreset(preset: string): YamlSerializationConfig {
  switch (preset) {
    case 'verbose':
      return VERBOSE_YAML_CONFIG;
    case 'hybrid':
      return HYBRID_YAML_CONFIG;
    case 'flow':
      return FLOW_YAML_CONFIG;
    default:
      return DEFAULT_YAML_SERIALIZATION_CONFIG;
  }
}

export function getYamlDeserializeConfigPreset(preset: string): YamlDeserializationConfig {
  // For now, use default for all presets
  return DEFAULT_YAML_DESERIALIZATION_CONFIG;
}
