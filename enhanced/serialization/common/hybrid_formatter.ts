/**
 * Hybrid Style Formatter for ZipEHR-like Output
 * 
 * This module provides formatting utilities for creating "hybrid style" JSON and YAML,
 * where simple objects are formatted inline (flow style) and complex objects are 
 * formatted with line breaks (block style).
 * 
 * This approach, inspired by the ZipEHR project, improves readability while keeping
 * output compact.
 */

/**
 * Configuration options for hybrid formatting
 */
export interface HybridFormatterOptions {
  /** Maximum number of properties for inline formatting (default: 3) */
  maxInlineProperties?: number;
  
  /** Maximum total character length for inline formatting (default: 80) */
  maxInlineLength?: number;
  
  /** Maximum nesting depth for inline formatting (default: 1) */
  maxInlineDepth?: number;
}

/**
 * Default hybrid formatter options
 */
const DEFAULT_OPTIONS: Required<HybridFormatterOptions> = {
  maxInlineProperties: 3,
  maxInlineLength: 80,
  maxInlineDepth: 1,
};

/**
 * Hybrid Style Formatter
 * Provides intelligent formatting decisions for JSON and YAML output
 */
export class HybridStyleFormatter {
  /**
   * Determine if an object should be formatted inline
   * 
   * @param obj - The object to check
   * @param options - Formatting options
   * @returns true if the object should be formatted inline
   */
  static shouldFormatInline(
    obj: any,
    options: HybridFormatterOptions = {}
  ): boolean {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    
    if (!obj || typeof obj !== 'object') {
      return true; // Primitives are always inline
    }
    
    if (Array.isArray(obj)) {
      // Arrays with few simple elements can be inline
      if (obj.length === 0) return true;
      if (obj.length > opts.maxInlineProperties) return false;
      return obj.every(item => !this.isComplexValue(item));
    }
    
    const properties = Object.keys(obj);
    
    // Too many properties -> block style
    if (properties.length > opts.maxInlineProperties) {
      return false;
    }
    
    // Check if any property value is complex
    const hasComplexValue = properties.some(key => 
      this.isComplexValue(obj[key])
    );
    
    if (hasComplexValue) {
      return false;
    }
    
    // Check estimated length
    const estimatedLength = this.estimateInlineLength(obj);
    if (estimatedLength > opts.maxInlineLength) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Check if a value is complex (object or array with items)
   * 
   * @param value - The value to check
   * @returns true if the value is complex
   */
  static isComplexValue(value: any): boolean {
    if (value === null || value === undefined) {
      return false;
    }
    
    if (Array.isArray(value)) {
      return value.length > 0 && value.some(item => typeof item === 'object');
    }
    
    if (typeof value === 'object') {
      return Object.keys(value).length > 0;
    }
    
    return false;
  }
  
  /**
   * Estimate the inline length of an object when formatted
   * 
   * @param obj - The object to measure
   * @returns Estimated character length
   */
  static estimateInlineLength(obj: any): number {
    if (obj === null || obj === undefined) {
      return 4; // "null"
    }
    
    if (typeof obj === 'string') {
      return obj.length + 2; // quotes
    }
    
    if (typeof obj === 'number' || typeof obj === 'boolean') {
      return String(obj).length;
    }
    
    if (Array.isArray(obj)) {
      return 2 + obj.reduce((sum, item) => 
        sum + this.estimateInlineLength(item) + 2, 0); // brackets + commas
    }
    
    if (typeof obj === 'object') {
      return 2 + Object.entries(obj).reduce((sum, [key, value]) => 
        sum + key.length + 3 + this.estimateInlineLength(value) + 2, 0); // braces + colons + commas
    }
    
    return 0;
  }
  
  /**
   * Calculate complexity score for an object
   * Higher score means more complex
   * 
   * @param obj - The object to score
   * @param depth - Current nesting depth
   * @returns Complexity score
   */
  static getComplexityScore(obj: any, depth: number = 0): number {
    if (obj === null || obj === undefined) {
      return 0;
    }
    
    if (typeof obj !== 'object') {
      return 1;
    }
    
    if (Array.isArray(obj)) {
      return 5 + obj.reduce((sum, item) => 
        sum + this.getComplexityScore(item, depth + 1), 0);
    }
    
    const properties = Object.keys(obj);
    return 5 + properties.reduce((sum, key) => 
      sum + this.getComplexityScore(obj[key], depth + 1), 0);
  }
  
  /**
   * Apply hybrid formatting to a JSON string as post-processing
   * This reformats already-serialized JSON to use hybrid style
   * 
   * @param jsonString - Pretty-printed JSON string
   * @param options - Formatting options
   * @returns Reformatted JSON string
   */
  static applyHybridFormattingToJson(
    jsonString: string,
    options: HybridFormatterOptions = {}
  ): string {
    // This is a simplified implementation
    // A complete version would parse and reformat more intelligently
    
    // For now, we'll just return the input
    // The actual hybrid formatting should happen during serialization
    return jsonString;
  }
  
  /**
   * Prepare an object for YAML serialization with hybrid style hints
   * Adds style metadata that the YAML serializer can use
   * 
   * @param obj - The object to prepare
   * @param options - Formatting options
   * @returns Object with style hints (or original if not needed)
   */
  static applyHybridFormattingToYaml(
    obj: any,
    options: HybridFormatterOptions = {}
  ): any {
    // This would add metadata for the YAML serializer
    // For now, return the original object
    // The YAML serializer will use shouldFormatInline() to make decisions
    return obj;
  }
  
  /**
   * Determine formatting style for a property value
   * 
   * @param value - The property value
   * @param options - Formatting options
   * @returns 'inline' | 'block'
   */
  static getFormattingStyle(
    value: any,
    options: HybridFormatterOptions = {}
  ): 'inline' | 'block' {
    return this.shouldFormatInline(value, options) ? 'inline' : 'block';
  }
}
