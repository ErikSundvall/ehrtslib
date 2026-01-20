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

      // Determine which style to use
      const mainStyle = this.getEffectiveMainStyle();

      // Use Document API for hybrid and flow styles
      if (mainStyle === 'hybrid') {
        return this.serializeHybrid(plainObj);
      } else if (mainStyle === 'flow') {
        return this.serializeFlow(plainObj);
      } else {
        // Block style - use basic stringify
        const options = this.getYamlOptions();
        return stringify(plainObj, options);
      }
    } catch (error) {
      throw new SerializationError(
        `Failed to serialize to YAML: ${error instanceof Error ? error.message : String(error)}`,
        obj,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Determine the effective main style based on configuration
   */
  private getEffectiveMainStyle(): 'block' | 'flow' | 'hybrid' {
    // Return the configured mainStyle, defaulting to 'hybrid'
    return this.config.mainStyle || 'hybrid';
  }

  /**
   * Determine if we are effectively in block mode (pure block style)
   */
  private isEffectiveBlockMode(): boolean {
    return this.getEffectiveMainStyle() === 'block';
  }

  /**
   * Serialize with hybrid formatting using Document API
   * This allows fine-grained control over flow vs block style
   * Simple objects are inline, complex objects use block style
   * 
   * @param obj - The plain object to serialize
   * @returns YAML string
   */
  private serializeHybrid(obj: any): string {
    const doc = new Document(obj);

    // Walk the document tree and set flow/block style based on complexity
    this.applyHybridFormattingToNode(doc.contents, 0);

    const yaml = doc.toString({
      indent: this.config.indent,
      lineWidth: this.config.lineWidth,
    });

    return yaml;
  }

  /**
   * Serialize with flow formatting using Document API
   * Uses flow style with strategic line breaks for archetype metadata
   * 
   * @param obj - The plain object to serialize
   * @returns YAML string
   */
  private serializeFlow(obj: any): string {
    const doc = new Document(obj);

    // Apply flow style to all nodes
    this.applyFlowFormattingToNode(doc.contents);

    let yaml = doc.toString({
      indent: this.config.indent,
      lineWidth: this.config.lineWidth || 0,
    });

    // If keepArchetypeDetailsInline is enabled, add strategic line breaks
    if (this.config.keepArchetypeDetailsInline) {
      yaml = this.addStrategicLineBreaks(yaml);
    }

    return yaml;
  }

  /**
   * Add strategic line breaks to flow-style YAML for better readability.
   * Adds line breaks after archetype metadata and before 'items' and 'value' properties.
   * This creates valid YAML with improved structure visibility.
   * 
   * @param yaml - Flow-style YAML string
   * @returns YAML string with strategic line breaks
   */
  private addStrategicLineBreaks(yaml: string): string {
    const indentSize = this.config.indent || 2;

    // 1. Normalize: remove all newlines and multiple spaces outside quotes
    let input = "";
    let inQuotes = false;
    let quoteChar = "";
    for (let i = 0; i < yaml.length; i++) {
      const c = yaml[i];
      if ((c === "\"" || c === "'") && (i === 0 || yaml[i - 1] !== "\\")) {
        if (!inQuotes) { inQuotes = true; quoteChar = c; }
        else if (c === quoteChar) inQuotes = false;
        input += c;
      } else if (inQuotes) {
        input += c;
      } else if (c === "\n" || c === "\r") {
        input += " ";
      } else {
        input += c;
      }
    }
    input = input.replace(/\s+/g, " ");

    const getIndent = (d: number) => "\n" + " ".repeat(Math.max(0, d) * indentSize);
    const metadataFields = ["name", "archetype_node_id", "archetype_details", "_type"];

    let result = "";
    let depth = 0;
    let i = 0;
    const fieldStack: string[][] = [[]]; // Track fields at each nesting level

    while (i < input.length) {
      const char = input[i];

      // Skip quotes
      if ((char === "\"" || char === "'") && (i === 0 || input[i - 1] !== "\\")) {
        const q = char;
        result += input[i++];
        while (i < input.length && input[i] !== q) {
          if (input[i] === "\\") result += input[i++];
          result += input[i++];
        }
        if (i < input.length) result += input[i++];
        continue;
      }

      if (char === "{") {
        const prev = input.substring(Math.max(0, i - 30), i);
        // Detect if this brace follows a major property (possibly with a [ for arrays)
        const prevNorm = prev.replace(/\s+/g, "");
        const isMajorProp = !!prevNorm.match(/(?:context|other_context|data|items|content|activities|description|protocol|state):\[?$/);

        result += char;
        fieldStack.push([]);
        depth++;

        if (isMajorProp || (depth === 1 && result.trim() === "{")) {
          result += getIndent(depth);
        }
      } else if (char === "[") {
        result += char;
        fieldStack.push([]);
        depth++;
      } else if (char === "}" || char === "]") {
        if (fieldStack.length > 0) fieldStack.pop();
        depth--;
        result += char;
      } else if (char === ":") {
        // Identify the field name just before this colon
        let k = result.length - 1;
        while (k >= 0 && /[\w_]/.test(result[k])) k--;
        const fieldName = result.substring(k + 1);
        if (fieldStack[depth]) {
          fieldStack[depth].push(fieldName);
        }
        result += char;
      } else if (char === ",") {
        result += char;

        // Look ahead to see what's next
        let j = i + 1;
        while (j < input.length && /\s/.test(input[j])) j++;
        const remaining = input.substring(j);

        // Identify next field
        const nextFieldMatch = remaining.match(/^(\w+):/);
        const nextField = nextFieldMatch ? nextFieldMatch[1] : "";

        // CORE LOGIC: Stay together if next is metadata. Break if next is NOT metadata.
        const nextIsMetadata = metadataFields.includes(nextField);

        if (nextField !== "" && !nextIsMetadata) {
          result += getIndent(depth);
          i = j - 1;
        }
        // Also break before next object in an array (sequence items)
        else if (remaining.startsWith("{")) {
          result += getIndent(depth);
          i = j - 1;
        }
      } else if (char === " " && result.endsWith(" ")) {
        // Skip multiple spaces
      } else {
        result += char;
      }
      i++;
    }

    // Final cleanup: remove trailing spaces and ensure no blank lines at the end
    return result.replace(/[ \t]+\n/g, "\n").trim();
  }

  /**
   * Apply flow formatting to a YAML node
   * Sets all nodes to use flow style
   * 
   * @param node - The YAML node to format
   */
  private applyFlowFormattingToNode(node: any): void {
    if (!node) return;

    // FIX 3: Visual Formatting
    // In Flow mode, we want to force everything to be flow style.
    // Standard YAML serializers might wrap flow objects if they are long,
    // but setting flow=true explicitly helps hint the stringifier.

    if (isMap(node)) {
      node.flow = true;
      // Recurse into map items
      if (node.items && Array.isArray(node.items)) {
        for (const pair of node.items) {
          if (pair.value) {
            this.applyFlowFormattingToNode(pair.value);
          }
        }
      }
    } else if (isSeq(node)) {
      node.flow = true;
      // Recurse into sequence items
      if (node.items && Array.isArray(node.items)) {
        for (const item of node.items) {
          this.applyFlowFormattingToNode(item);
        }
      }
    }
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
      // Check if this map should be inline
      const shouldBeInline = this.shouldNodeBeInline(node);

      if (shouldBeInline) {
        node.flow = true;  // Use flow style (inline)
      } else {
        node.flow = false; // Use block style
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

    // if in strict block mode, never inline maps unless empty
    if (this.isEffectiveBlockMode()) {
      if (isMap(node) && node.items && node.items.length === 0) return true;
      return false;
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

    // Get type information
    let typeName = TypeRegistry.getTypeNameFromInstance(obj);

    // Try to infer type if not found
    if (!typeName && this.config.useTypeInference) {
      if (parentType && propertyName) {
        typeName = TypeInferenceEngine.inferType(propertyName, parentType, obj);
      } else {
        typeName = TypeInferenceEngine.inferFromStructure(obj);
      }
    }

    // Handle terse format conversion if enabled
    if (this.config.useTerseFormat && this.canUseTerseFormat(obj, typeName)) {
      return this.toTerseFormat(obj, typeName);
    }

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

    // Configure style based on mainStyle
    const mainStyle = this.getEffectiveMainStyle();
    if (mainStyle === 'flow') {
      // Full flow style
      options.flowLevel = 0;
    } else {
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
  private canUseTerseFormat(obj: any, knownTypeName?: string): boolean {
    if (!obj || typeof obj !== 'object') {
      return false;
    }

    const typeName = knownTypeName || TypeRegistry.getTypeNameFromInstance(obj);

    return typeName === 'CODE_PHRASE' ||
      typeName === 'DV_CODED_TEXT' ||
      typeName === 'DV_TEXT' ||
      typeName === 'ARCHETYPE_ID' ||
      typeName === 'TEMPLATE_ID' ||
      typeName === 'TERMINOLOGY_ID' ||
      typeName === 'OBJECT_VERSION_ID';
  }

  /**
   * Convert object to terse format string
   */
  private toTerseFormat(obj: any, knownTypeName?: string): string {
    const typeName = knownTypeName || TypeRegistry.getTypeNameFromInstance(obj);

    if (typeName === 'CODE_PHRASE') {
      return toTerseCodePhrase(obj);
    }

    if (typeName === 'DV_CODED_TEXT') {
      return toTerseDvCodedText(obj);
    }

    // Simple wrappers just become their value
    // TODO: Developer comment: Not sure we actually want this if it changes the semantics (not just line wrapping etc) it likely breaks standard and deserialisation
    if (typeName === 'DV_TEXT' ||
      typeName === 'ARCHETYPE_ID' ||
      typeName === 'TEMPLATE_ID' ||
      typeName === 'TERMINOLOGY_ID' ||
      typeName === 'OBJECT_VERSION_ID') {
      return obj.value;
    }

    throw new SerializationError(`Cannot convert ${typeName} to terse format`, obj);
  }
}
