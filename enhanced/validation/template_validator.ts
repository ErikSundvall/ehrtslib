/**
 * Validation Framework for openEHR Templates
 * 
 * Validates RM instances against operational templates/archetypes.
 * Following PRD Option 1: External Validator (non-intrusive).
 */

import * as openehr_am from "../openehr_am.ts";

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationMessage[];
  warnings: ValidationMessage[];
}

/**
 * Validation message
 */
export interface ValidationMessage {
  path: string;
  message: string;
  severity: "error" | "warning" | "info";
  constraintType: string;
}

/**
 * Validation configuration
 */
export interface ValidationConfig {
  failFast?: boolean;
  requiredOnly?: boolean;
  maxDepth?: number;
}

/**
 * Main template validator
 */
export class TemplateValidator {
  private config: ValidationConfig;

  constructor(config?: ValidationConfig) {
    this.config = {
      failFast: false,
      requiredOnly: false,
      maxDepth: 100,
      ...config,
    };
  }

  /**
   * Validate an RM instance against a template
   */
  validate(
    rmInstance: any,
    template: openehr_am.OPERATIONAL_TEMPLATE | openehr_am.ARCHETYPE
  ): ValidationResult {
    const errors: ValidationMessage[] = [];
    const warnings: ValidationMessage[] = [];

    // Basic validation placeholder
    if (!template.definition) {
      errors.push({
        path: "/",
        message: "Template has no definition",
        severity: "error",
        constraintType: "structure",
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
