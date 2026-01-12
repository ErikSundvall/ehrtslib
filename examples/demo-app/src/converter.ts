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
  typescriptConfig: { useTerse: boolean; useCompactConstructors: boolean; includeComments: boolean; indent: number };
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
    return serializer.serialize(obj);
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
  config: { useTerse: boolean; useCompactConstructors: boolean; includeComments: boolean; indent: number }
): string {
  const indentStr = ' '.repeat(config.indent);
  let code = '';
  
  // Add imports
  code += `import * as openehr_rm from "./enhanced/openehr_rm.ts";\n`;
  code += `import * as openehr_base from "./enhanced/openehr_base.ts";\n\n`;
  
  if (config.includeComments) {
    code += `// Generated TypeScript initialization code\n`;
    code += `// Based on openEHR Reference Model\n\n`;
  }
  
  // Generate object initialization
  const variableName = generateVariableName(obj);
  code += `const ${variableName} = `;
  code += generateObjectCode(obj, config, 0);
  code += `;\n`;
  
  return code;
}

/**
 * Generate a variable name from an object
 */
function generateVariableName(obj: any): string {
  const typeName = TypeRegistry.getTypeNameFromInstance(obj);
  if (!typeName) return 'rmObject';
  
  return typeName.toLowerCase().replace(/_/g, '');
}

/**
 * Generate object initialization code recursively
 */
function generateObjectCode(
  obj: any,
  config: { useTerse: boolean; useCompactConstructors: boolean; includeComments: boolean; indent: number },
  depth: number
): string {
  if (obj === null || obj === undefined) {
    return 'undefined';
  }
  
  // Handle primitives
  if (typeof obj === 'string') {
    return JSON.stringify(obj);
  }
  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return String(obj);
  }
  
  // Handle arrays
  if (Array.isArray(obj)) {
    if (obj.length === 0) {
      return '[]';
    }
    const indentStr = ' '.repeat(config.indent * (depth + 1));
    const items = obj.map(item => 
      indentStr + generateObjectCode(item, config, depth + 1)
    ).join(',\n');
    return `[\n${items}\n${' '.repeat(config.indent * depth)}]`;
  }
  
  // Handle objects
  const typeName = TypeRegistry.getTypeNameFromInstance(obj);
  if (!typeName) {
    // Plain object
    return JSON.stringify(obj, null, config.indent);
  }
  
  // Check for terse format opportunity
  if (config.useTerse && (typeName === 'CODE_PHRASE' || typeName === 'DV_CODED_TEXT')) {
    const terseForm = getTerseForm(obj, typeName);
    if (terseForm) {
      return JSON.stringify(terseForm);
    }
  }
  
  // Generate constructor call
  const modulePrefix = getModulePrefix(typeName);
  let code = `new ${modulePrefix}.${typeName}(`;
  
  if (config.useCompactConstructors) {
    // Use single initialization object
    code += generateInitObject(obj, config, depth + 1);
  } else {
    // Use individual property assignments (less common)
    code += generateInitObject(obj, config, depth + 1);
  }
  
  code += ')';
  return code;
}

/**
 * Get module prefix for a type
 */
function getModulePrefix(typeName: string): string {
  // Common BASE types
  const baseTypes = ['TERMINOLOGY_ID', 'CODE_PHRASE', 'ARCHETYPE_ID', 'OBJECT_VERSION_ID', 
                      'TEMPLATE_ID', 'GENERIC_ID', 'OBJECT_ID', 'UID_BASED_ID', 'HIER_OBJECT_ID'];
  
  if (baseTypes.includes(typeName)) {
    return 'openehr_base';
  }
  
  return 'openehr_rm';
}

/**
 * Generate initialization object
 */
function generateInitObject(
  obj: any,
  config: { useTerse: boolean; useCompactConstructors: boolean; includeComments: boolean; indent: number },
  depth: number
): string {
  const indentStr = ' '.repeat(config.indent * depth);
  const properties: string[] = [];
  
  for (const [key, value] of Object.entries(obj)) {
    // Skip internal properties
    if (key.startsWith('_') || key === 'constructor') {
      continue;
    }
    
    const valueCode = generateObjectCode(value, config, depth);
    properties.push(`${indentStr}${key}: ${valueCode}`);
  }
  
  if (properties.length === 0) {
    return '{}';
  }
  
  return `{\n${properties.join(',\n')}\n${' '.repeat(config.indent * (depth - 1))}}`;
}

/**
 * Get terse form for CODE_PHRASE or DV_CODED_TEXT
 */
function getTerseForm(obj: any, typeName: string): string | null {
  if (typeName === 'CODE_PHRASE') {
    const terminologyId = obj.terminology_id?.value;
    const codeString = obj.code_string;
    if (terminologyId && codeString) {
      return `[${terminologyId}::${codeString}]`;
    }
  } else if (typeName === 'DV_CODED_TEXT') {
    const value = obj.value;
    const definingCode = obj.defining_code;
    if (value && definingCode) {
      const terminologyId = definingCode.terminology_id?.value;
      const codeString = definingCode.code_string;
      if (terminologyId && codeString) {
        return `[${terminologyId}::${codeString}|${value}|]`;
      }
    }
  }
  return null;
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
