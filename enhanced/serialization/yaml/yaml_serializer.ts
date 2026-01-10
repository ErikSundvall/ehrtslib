/**
 * YAML Serializer for openEHR RM Objects
 * 
 * Serializes openEHR Reference Model objects to YAML format.
 * 
 * Note: YAML is not an official openEHR standard, but provides
 * excellent human readability for configuration and data.
 * 
 * Features:
 * - Block, flow, and hybrid styles
 * - Type property handling with inference
 * - Optional terse format
 * - Configurable formatting
 */

import { stringify } from 'yaml';
import { TypeRegistry } from '../common/type_registry.ts';
import { TypeInferenceEngine } from '../common/type_inference.ts';
import { HybridStyleFormatter } from '../common/hybrid_formatter.ts';
import { SerializationError } from '../common/errors.ts';
import {
  toTerseCodePhrase,
  toTerseDvCodedText,
} from '../../terse_format.ts';
import {
  YamlSerializationConfig,
  DEFAULT_YAML_SERIALIZATION_CONFIG,
} from './yaml_config.ts';

/**
 * YAML Serializer for openEHR RM objects
 */
export class YamlSerializer {
  private config: Required<YamlSerializationConfig>;
  
  /**
   * Create a YAML serializer with the given configuration
   * 
   * @param config - Serialization configuration
   */
  constructor(config: YamlSerializationConfig = {}) {
    this.config = { ...DEFAULT_YAML_SERIALIZATION_CONFIG, ...config };
  }
  
  /**
   * Serialize an RM object to YAML string
   * 
   * @param obj - The object to serialize
   * @returns YAML string
   * @throws SerializationError if serialization fails
   */
  serialize(obj: any): string {
    try {
      // Convert to plain object
      const plainObj = this.toPlainObject(obj);
      
      // Configure YAML stringify options
      const options = this.getYamlOptions();
      
      // Serialize to YAML
      return stringify(plainObj, options);
    } catch (error) {
      throw new SerializationError(
        `Failed to serialize to YAML: ${error instanceof Error ? error.message : String(error)}`,
        obj,
        error instanceof Error ? error : undefined
      );
    }
  }
  
  /**
   * Convert an RM object to a plain object suitable for YAML serialization
   * 
   * @param obj - The object to convert
   * @param parentType - Type of the parent object (for type inference)
   * @param propertyName - Name of the property holding this object
   * @returns Plain object
   */
  private toPlainObject(obj: any, parentType?: string, propertyName?: string): any {
    // Handle primitives
    if (obj === null || obj === undefined) {
      return this.config.includeNullValues ? null : undefined;
    }
    
    if (typeof obj !== 'object') {
      return obj;
    }
    
    // Handle arrays
    if (Array.isArray(obj)) {
      const result = obj.map(item => this.toPlainObject(item, parentType, propertyName));
      if (result.length === 0 && !this.config.includeEmptyCollections) {
        return undefined;
      }
      return result;
    }
    
    // Handle terse format conversion if enabled
    if (this.config.useTerseFormat && this.canUseTerseFormat(obj)) {
      return this.toTerseFormat(obj);
    }
    
    // Get type information
    const typeName = TypeRegistry.getTypeNameFromInstance(obj);
    
    // Create result object
    const result: Record<string, any> = {};
    
    // Add type property if needed
    if (this.shouldIncludeType(obj, typeName, parentType, propertyName)) {
      result._type = typeName || obj.constructor.name.toUpperCase();
    }
    
    // Get all property names including getters
    const allProperties = new Set<string>();
    
    // Add own properties
    Object.keys(obj).forEach(key => allProperties.add(key));
    
    // Add properties from prototype chain (getters)
    let proto = Object.getPrototypeOf(obj);
    while (proto && proto !== Object.prototype) {
      Object.getOwnPropertyNames(proto).forEach(key => {
        if (key !== 'constructor') {
          const descriptor = Object.getOwnPropertyDescriptor(proto, key);
          if (descriptor && descriptor.get) {
            allProperties.add(key);
          }
        }
      });
      proto = Object.getPrototypeOf(proto);
    }
    
    // Serialize all properties
    for (const key of allProperties) {
      // Skip internal properties (starting with _ or $)
      if (key.startsWith('_') || key.startsWith('$')) {
        continue;
      }
      
      // Skip functions
      if (typeof obj[key] === 'function') {
        continue;
      }
      
      const value = obj[key];
      
      // Skip null/undefined if not including them
      if ((value === null || value === undefined) && !this.config.includeNullValues) {
        continue;
      }
      
      // Recursively convert
      const plainValue = this.toPlainObject(value, typeName, key);
      
      // Skip undefined values
      if (plainValue !== undefined) {
        result[key] = plainValue;
      }
    }
    
    // Skip empty objects if not including them
    const hasProperties = Object.keys(result).some(k => k !== '_type');
    if (!hasProperties && !this.config.includeEmptyCollections) {
      return undefined;
    }
    
    return result;
  }
  
  /**
   * Serialize with a specific configuration (one-time use)
   * 
   * @param obj - The object to serialize
   * @param config - Configuration for this serialization
   * @returns YAML string
   */
  static serializeWith(obj: any, config: YamlSerializationConfig): string {
    const serializer = new YamlSerializer(config);
    return serializer.serialize(obj);
  }
  
  /**
   * Get YAML library options based on configuration
   */
  private getYamlOptions(): any {
    const options: any = {
      indent: this.config.indent,
      lineWidth: this.config.lineWidth,
      minContentWidth: 20,
    };
    
    // Configure style
    if (this.config.hybridStyle) {
      // Hybrid style: use custom function to decide per-value
      options.defaultStringType = 'PLAIN';
      options.defaultKeyType = 'PLAIN';
      // Note: The yaml library doesn't have direct hybrid support,
      // so we pre-process the object structure
    } else if (this.config.flowStyleValues && !this.config.blockStyleObjects) {
      // Full flow style
      options.flowLevel = 0;
    } else if (this.config.blockStyleObjects) {
      // Block style (default)
      options.flowLevel = -1;
    }
    
    return options;
  }
  
  /**
   * Determine if type property should be included
   */
  private shouldIncludeType(
    obj: any,
    typeName: string | undefined,
    parentType?: string,
    propertyName?: string
  ): boolean {
    // Never include type if disabled
    if (!this.config.includeType) {
      return false;
    }
    
    // If type inference is enabled, try to omit
    if (this.config.useTypeInference && parentType && propertyName && typeName) {
      return !TypeInferenceEngine.canOmitType(propertyName, parentType, obj);
    }
    
    // Default: include type
    return true;
  }
  
  /**
   * Check if an object can use terse format
   */
  private canUseTerseFormat(obj: any): boolean {
    if (!obj || typeof obj !== 'object') {
      return false;
    }
    
    const typeName = TypeRegistry.getTypeNameFromInstance(obj);
    return typeName === 'CODE_PHRASE' || typeName === 'DV_CODED_TEXT';
  }
  
  /**
   * Convert object to terse format string
   */
  private toTerseFormat(obj: any): string {
    const typeName = TypeRegistry.getTypeNameFromInstance(obj);
    
    if (typeName === 'CODE_PHRASE') {
      return toTerseCodePhrase(obj);
    }
    
    if (typeName === 'DV_CODED_TEXT') {
      return toTerseDvCodedText(obj);
    }
    
    throw new SerializationError(`Cannot convert ${typeName} to terse format`, obj);
  }
}
