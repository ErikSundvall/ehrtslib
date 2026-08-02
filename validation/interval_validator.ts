/**
 * Interval Validator for DV_INTERVAL types
 * 
 * Validates interval-specific constraints:
 * - Lower and upper bounds
 * - Inclusion/exclusion of bounds
 * - Unbounded intervals
 * - Proper ordering (lower <= upper)
 */

import type { ValidationMessage } from "./template_validator.ts";

/**
 * Validates DV_INTERVAL instances
 */
export class IntervalValidator {
  /**
   * Validate a DV_INTERVAL instance
   * 
   * @param rmValue - The interval instance to validate
   * @param path - Path for error reporting
   * @returns Array of validation messages
   */
  validate(
    rmValue: any,
    path: string
  ): ValidationMessage[] {
    const messages: ValidationMessage[] = [];
    
    if (!rmValue || typeof rmValue !== 'object') {
      return messages;
    }
    
    // Check if this is an interval-like object
    if (!this.isInterval(rmValue)) {
      return messages;
    }
    
    // Validate lower/upper bounds exist appropriately
    const hasLower = rmValue.lower !== undefined && rmValue.lower !== null;
    const hasUpper = rmValue.upper !== undefined && rmValue.upper !== null;
    const lowerUnbounded = rmValue.lower_unbounded === true;
    const upperUnbounded = rmValue.upper_unbounded === true;
    
    // If unbounded, should not have corresponding bound
    if (lowerUnbounded && hasLower) {
      messages.push({
        path,
        message: "Interval marked as lower_unbounded but has lower bound",
        severity: "error",
        constraintType: "interval",
      });
    }
    
    if (upperUnbounded && hasUpper) {
      messages.push({
        path,
        message: "Interval marked as upper_unbounded but has upper bound",
        severity: "error",
        constraintType: "interval",
      });
    }
    
    // If not unbounded, should have corresponding bound
    if (!lowerUnbounded && !hasLower) {
      messages.push({
        path,
        message: "Interval not marked as lower_unbounded but missing lower bound",
        severity: "error",
        constraintType: "interval",
      });
    }
    
    if (!upperUnbounded && !hasUpper) {
      messages.push({
        path,
        message: "Interval not marked as upper_unbounded but missing upper bound",
        severity: "error",
        constraintType: "interval",
      });
    }
    
    // Validate ordering if both bounds exist
    if (hasLower && hasUpper) {
      const lowerValue = this.extractComparableValue(rmValue.lower);
      const upperValue = this.extractComparableValue(rmValue.upper);
      
      if (lowerValue !== null && upperValue !== null) {
        if (lowerValue > upperValue) {
          messages.push({
            path,
            message: `Interval lower bound (${lowerValue}) exceeds upper bound (${upperValue})`,
            severity: "error",
            constraintType: "interval",
          });
        }
      }
    }
    
    // Validate inclusion flags
    if (hasLower && rmValue.lower_included === undefined) {
      messages.push({
        path,
        message: "Interval with lower bound missing lower_included flag",
        severity: "warning",
        constraintType: "interval",
      });
    }
    
    if (hasUpper && rmValue.upper_included === undefined) {
      messages.push({
        path,
        message: "Interval with upper bound missing upper_included flag",
        severity: "warning",
        constraintType: "interval",
      });
    }
    
    return messages;
  }
  
  /**
   * Check if an object represents an interval
   */
  private isInterval(obj: any): boolean {
    // Check for interval-like properties
    return (
      obj._type?.includes("INTERVAL") ||
      (obj.lower !== undefined || obj.upper !== undefined ||
       obj.lower_unbounded !== undefined || obj.upper_unbounded !== undefined)
    );
  }
  
  /**
   * Extract a comparable value from an interval bound
   */
  private extractComparableValue(bound: any): number | string | null {
    if (bound === null || bound === undefined) {
      return null;
    }
    
    // Handle primitive values
    if (typeof bound === 'number' || typeof bound === 'string') {
      return bound;
    }
    
    // Handle DV_QUANTITY
    if (bound.magnitude !== undefined) {
      return bound.magnitude;
    }
    
    // Handle DV_COUNT
    if (bound.magnitude !== undefined) {
      return bound.magnitude;
    }
    
    // Handle DV_DATE, DV_TIME, DV_DATE_TIME
    if (bound.value !== undefined && typeof bound.value === 'string') {
      return bound.value;
    }
    
    // Handle DV_DURATION - convert to seconds for comparison
    if (bound.value !== undefined && typeof bound.value === 'string' && bound.value.startsWith('P')) {
      // ISO 8601 duration - simplified comparison using string
      return bound.value;
    }
    
    return null;
  }
}
