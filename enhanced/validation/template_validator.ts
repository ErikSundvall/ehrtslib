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
  private occurrenceValidator: OccurrenceValidator;
  private cardinalityValidator: CardinalityValidator;
  private primitiveValidator: PrimitiveValidator;

  constructor(config?: ValidationConfig) {
    this.config = {
      failFast: false,
      requiredOnly: false,
      maxDepth: 100,
      ...config,
    };
    
    this.occurrenceValidator = new OccurrenceValidator();
    this.cardinalityValidator = new CardinalityValidator();
    this.primitiveValidator = new PrimitiveValidator();
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

    // Validate against definition
    if (!template.definition) {
      errors.push({
        path: "/",
        message: "Template has no definition",
        severity: "error",
        constraintType: "structure",
      });
    } else {
      this.validateNode(rmInstance, template.definition, "/", errors, warnings, 0);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private validateNode(
    rmNode: any,
    cObject: openehr_am.C_OBJECT,
    path: string,
    errors: ValidationMessage[],
    warnings: ValidationMessage[],
    depth: number
  ): void {
    if (depth > (this.config.maxDepth || 100)) {
      warnings.push({
        path,
        message: "Maximum validation depth exceeded",
        severity: "warning",
        constraintType: "depth",
      });
      return;
    }

    // Validate occurrences
    if (cObject.occurrences) {
      const msgs = this.occurrenceValidator.validate(rmNode, cObject, path);
      errors.push(...msgs.filter(m => m.severity === "error"));
      warnings.push(...msgs.filter(m => m.severity === "warning"));
    }

    // Validate complex object
    if (cObject instanceof openehr_am.C_COMPLEX_OBJECT && rmNode) {
      this.validateComplexObject(rmNode, cObject, path, errors, warnings, depth);
    }
  }

  private validateComplexObject(
    rmNode: any,
    cObject: openehr_am.C_COMPLEX_OBJECT,
    path: string,
    errors: ValidationMessage[],
    warnings: ValidationMessage[],
    depth: number
  ): void {
    if (!cObject.attributes) return;

    for (const cAttribute of cObject.attributes) {
      const attrName = cAttribute.rm_attribute_name;
      if (!attrName) continue;

      const rmValue = rmNode[attrName];
      const attrPath = `${path}${attrName}`;

      // Validate cardinality
      if (Array.isArray(rmValue)) {
        const msgs = this.cardinalityValidator.validate(rmValue, cAttribute, attrPath);
        errors.push(...msgs.filter(m => m.severity === "error"));
        warnings.push(...msgs.filter(m => m.severity === "warning"));
      }

      // Validate children
      if (cAttribute.children) {
        for (const child of cAttribute.children) {
          if (Array.isArray(rmValue)) {
            rmValue.forEach((item, i) => {
              this.validateNode(item, child, `${attrPath}[${i}]/`, errors, warnings, depth + 1);
            });
          } else {
            this.validateNode(rmValue, child, `${attrPath}/`, errors, warnings, depth + 1);
          }
        }
      }
    }
  }
}

/**
 * Occurrence constraint validator
 */
export class OccurrenceValidator {
  validate(
    rmValue: any,
    cObject: openehr_am.C_OBJECT,
    path: string
  ): ValidationMessage[] {
    const messages: ValidationMessage[] = [];
    if (!cObject.occurrences) return messages;

    const exists = rmValue !== null && rmValue !== undefined;
    const lower = cObject.occurrences.lower || 0;
    const upper = cObject.occurrences.upper;

    if (lower > 0 && !exists) {
      messages.push({
        path,
        message: `Required attribute missing (min: ${lower})`,
        severity: "error",
        constraintType: "occurrence",
      });
    }

    if (exists && upper !== undefined) {
      const count = Array.isArray(rmValue) ? rmValue.length : 1;
      if (count > upper) {
        messages.push({
          path,
          message: `Too many occurrences: ${count} (max: ${upper})`,
          severity: "error",
          constraintType: "occurrence",
        });
      }
    }

    return messages;
  }
}

/**
 * Cardinality constraint validator
 */
export class CardinalityValidator {
  validate(
    rmValue: any[],
    cAttribute: openehr_am.C_ATTRIBUTE,
    path: string
  ): ValidationMessage[] {
    const messages: ValidationMessage[] = [];
    
    // Basic cardinality check for arrays
    if (!Array.isArray(rmValue)) return messages;
    
    // Could expand to check C_MULTIPLE_ATTRIBUTE.cardinality property
    
    return messages;
  }
}

/**
 * Primitive constraint validator
 */
export class PrimitiveValidator {
  validate(
    rmValue: any,
    cObject: openehr_am.C_PRIMITIVE_OBJECT,
    path: string
  ): ValidationMessage[] {
    const messages: ValidationMessage[] = [];
    
    // TODO: Implement primitive validations
    // - C_STRING: pattern, list
    // - C_INTEGER: range, list
    // - C_REAL: range, list
    // - C_BOOLEAN: constraints
    
    return messages;
  }
}
