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

import { stringify, Document, isMap, isSeq, isScalar } from 'yaml';
import { TypeRegistry } from '../common/type_registry.ts';
import { TypeInferenceEngine } from '../common/type_inference.ts';
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

      // For hybrid style, use Document API for fine-grained control
      if (this.config.hybridStyle) {
        return this.serializeHybrid(plainObj);
      }

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
   * Serialize with hybrid formatting using Document API
   * This allows fine-grained control over flow vs block style
   * 
   * @param obj - The plain object to serialize
   * @returns YAML string
   */
  private serializeHybrid(obj: any): string {
    const doc = new Document(obj);

    // Walk the document tree and set flow/block style based on complexity
    this.applyHybridFormattingToNode(doc.contents, 0);

    return doc.toString({
      indent: this.config.indent,
      lineWidth: this.config.lineWidth,
    });
  }

   /**
   * Apply hybrid formatting to a YAML node
   * Simple objects get flow style, complex objects get block style
   * 
   * @param node - The YAML node to format
   * @param depth - Current depth in the tree
   */
  private applyHybridFormattingToNode(node: any, depth: number): void {
    if (!node) return;

    // Handle different node types
    if (isMap(node)) {
      // Check if we should apply special archetype formatting
      if (this.config.keepArchetypeDetailsInline && this.hasArchetypeMetadata(node)) {
        this.applyArchetypeInlineFormatting(node, depth);
        // Don't recurse into items here - applyArchetypeInlineFormatting handles it
        return;
      } else {
        // Check if this map should be inline
        const shouldBeInline = this.shouldNodeBeInline(node);

        if (shouldBeInline) {
          node.flow = true;  // Use flow style (inline)
        } else {
          node.flow = false; // Use block style
        }
      }

      // Recurse into map items
      if (node.items && Array.isArray(node.items)) {
        for (const pair of node.items) {
          if (pair.value) {
            this.applyHybridFormattingToNode(pair.value, depth + 1);
          }
        }
      }
    } else if (isSeq(node)) {
      // Sequence/array - usually keep block style
      node.flow = false;

      // Recurse into sequence items
      if (node.items && Array.isArray(node.items)) {
        for (const item of node.items) {
          this.applyHybridFormattingToNode(item, depth + 1);
        }
      }
    }
  }

  /**
   * Check if a map node has archetype metadata properties
   * (name, archetype_node_id, or archetype_details)
   */
  private hasArchetypeMetadata(node: any): boolean {
    if (!isMap(node) || !node.items || !Array.isArray(node.items)) {
      return false;
    }

    const keys = node.items.map((pair: any) => pair.key?.value).filter(Boolean);
    return keys.some((k: string) => 
      k === 'name' || k === 'archetype_node_id' || k === 'archetype_details'
    );
  }

  /**
   * Apply special formatting for objects with archetype metadata
   * Groups name, archetype_node_id, and archetype_details inline,
   * while keeping other properties on separate lines
   */
  private applyArchetypeInlineFormatting(node: any, depth: number): void {
    if (!isMap(node) || !node.items || !Array.isArray(node.items)) {
      return;
    }

    const archetypeKeys = new Set(['name', 'archetype_node_id', 'archetype_details']);
    const keys = node.items.map((pair: any) => pair.key?.value).filter(Boolean);
    
    // Check if object has non-archetype properties
    const hasOtherProperties = keys.some((k: string) => !archetypeKeys.has(k));

    if (!hasOtherProperties) {
      // If only archetype properties, make entire object inline
      node.flow = true;
      
      // Also make nested objects inline (like name, archetype_details)
      for (const pair of node.items) {
        if (pair.value && isMap(pair.value)) {
          pair.value.flow = true;
        }
      }
    } else {
      // If has other properties, make the map block style
      node.flow = false;
      
      // But make the archetype property values inline
      for (const pair of node.items) {
        const key = (pair as any).key?.value;
        if (archetypeKeys.has(key)) {
          if (pair.value && isMap(pair.value)) {
            // Make the value itself inline
            pair.value.flow = true;
            // Recursively make all nested maps inline too
            this.makeAllNestedMapsInline(pair.value);
          }
        } else {
          // For non-archetype properties, recurse normally
          if (pair.value) {
            this.applyHybridFormattingToNode(pair.value, depth + 1);
          }
        }
      }
    }
  }

  /**
   * Recursively make all nested maps within a node inline (flow style)
   */
  private makeAllNestedMapsInline(node: any): void {
    if (!isMap(node) || !node.items || !Array.isArray(node.items)) {
      return;
    }

    for (const pair of node.items) {
      if (pair.value && isMap(pair.value)) {
        pair.value.flow = true;
        this.makeAllNestedMapsInline(pair.value);
      }
    }
  }

  /**
   * Determine if a YAML node should be formatted inline
   * 
   * @param node - The YAML node
   * @returns true if the node should use flow style
   */
  private shouldNodeBeInline(node: any): boolean {
    // Scalars are always inline
    if (isScalar(node)) {
      return true;
    }

    // For maps, check number of properties and complexity
    if (isMap(node)) {
      if (!node.items || !Array.isArray(node.items)) {
        return true;
      }

      const numProps = node.items.length;

      // Too many properties -> block style
      const maxProps = this.config.maxInlineProperties ?? 3;
      if (numProps > maxProps) {
        return false;
      }

      // Check if any values are complex
      for (const pair of node.items) {
        if (this.isNodeComplex(pair.value)) {
          return false;
        }
      }

      return true;
    }

    // Sequences are not inlined by default
    return false;
  }

  /**
   * Check if a YAML node is complex (contains nested objects/arrays)
   * 
   * @param node - The YAML node
   * @returns true if the node is complex
   */
  private isNodeComplex(node: any): boolean {
    if (!node) return false;

    // Scalars are not complex
    if (isScalar(node)) {
      return false;
    }

    // Maps and sequences are complex
    if (isMap(node) || isSeq(node)) {
      return true;
    }

    return false;
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

    // Collect properties to serialize
    const props = Array.from(allProperties).filter(key => {
      // Skip internal properties (starting with _ or $)
      if (key.startsWith('_') || key.startsWith('$')) return false;
      // Skip functions
      if (typeof obj[key] === 'function') return false;
      // Skip null/undefined if not including them
      if ((obj[key] === null || obj[key] === undefined) && !this.config.includeNullValues) return false;
      return true;
    });

    // Reorder properties if archetype_node_id is present
    let orderedKeys: string[] = [];
    const archIdLocation = this.config.archetypeNodeIdLocation;
    const hasArchId = props.includes('archetype_node_id');
    const hasName = props.includes('name');

    if (hasArchId) {
      const rest = props.filter(k => k !== 'archetype_node_id');
      if (archIdLocation === 'beginning') {
        orderedKeys = ['archetype_node_id', ...rest];
      } else if (archIdLocation === 'after_name' && hasName) {
        for (const key of rest) {
          orderedKeys.push(key);
          if (key === 'name') orderedKeys.push('archetype_node_id');
        }
      } else if (archIdLocation === 'end') {
        orderedKeys = [...rest, 'archetype_node_id'];
      } else {
        // Fallback for 'after_name' if name not found, or any other case
        orderedKeys = [...rest, 'archetype_node_id'];
      }
    } else {
      orderedKeys = props;
    }

    // Serialize properties in order
    for (const key of orderedKeys) {
      const value = obj[key];

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
    if (this.config.flowStyleValues && !this.config.blockStyleObjects) {
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
