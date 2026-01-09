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
