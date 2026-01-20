/**
 * Validation Framework for openEHR Templates
 * 
 * Validates RM instances against operational templates/archetypes.
 * Following PRD Option 1: External Validator (non-intrusive).
 */

import * as openehr_am from "../openehr_am.ts";
import { TypeRegistry } from "../serialization/common/type_registry.ts";
import { UcumService } from "../ucum_service.ts";

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
  validateUnits?: boolean;         // Enable UCUM unit validation
  validateTerminology?: boolean;   // Enable terminology validation
  useTypeRegistry?: boolean;       // Use TypeRegistry for type resolution
}

/**
 * Main template validator
 */
export class TemplateValidator {
  private config: ValidationConfig;
  private occurrenceValidator: OccurrenceValidator;
  private cardinalityValidator: CardinalityValidator;
  private primitiveValidator: PrimitiveValidator;
  private terminologyValidator?: TerminologyValidator;
  private ucumService?: UcumService;

  constructor(config?: ValidationConfig) {
    this.config = {
      failFast: false,
      requiredOnly: false,
      maxDepth: 100,
      validateUnits: true,
      validateTerminology: true,
      useTypeRegistry: true,
      ...config,
    };
    
    this.occurrenceValidator = new OccurrenceValidator();
    this.cardinalityValidator = new CardinalityValidator();
    this.primitiveValidator = new PrimitiveValidator();
    
    if (this.config.validateTerminology) {
      this.terminologyValidator = new TerminologyValidator();
    }
    
    if (this.config.validateUnits) {
      this.ucumService = new UcumService();
    }
  }

  /**
   * Initialize async dependencies (UCUM service)
   */
  async initialize(): Promise<void> {
    if (this.ucumService) {
      try {
        await this.ucumService.initialize();
      } catch (e) {
        console.warn("Failed to initialize UCUM service:", e);
      }
    }
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

    // Validate type match using TypeRegistry if enabled
    if (this.config.useTypeRegistry && cObject.rm_type_name && rmNode) {
      const actualType = this.getTypeName(rmNode);
      if (actualType && actualType !== cObject.rm_type_name) {
        errors.push({
          path,
          message: `Type mismatch: expected ${cObject.rm_type_name}, got ${actualType}`,
          severity: "error",
          constraintType: "type",
        });
      }
    }

    // Validate occurrences
    if (cObject.occurrences) {
      const msgs = this.occurrenceValidator.validate(rmNode, cObject, path);
      errors.push(...msgs.filter(m => m.severity === "error"));
      warnings.push(...msgs.filter(m => m.severity === "warning"));
    }

    // Validate primitive constraints - check both inheritance and type name
    const isPrimitiveObject = cObject instanceof openehr_am.C_PRIMITIVE_OBJECT ||
                             cObject instanceof openehr_am.C_STRING ||
                             cObject instanceof openehr_am.C_INTEGER ||
                             cObject instanceof openehr_am.C_REAL ||
                             cObject instanceof openehr_am.C_BOOLEAN;
    
    if (isPrimitiveObject && rmNode !== null && rmNode !== undefined) {
      const msgs = this.primitiveValidator.validate(rmNode, cObject as openehr_am.C_PRIMITIVE_OBJECT, path);
      errors.push(...msgs.filter(m => m.severity === "error"));
      warnings.push(...msgs.filter(m => m.severity === "warning"));
    }

    // Validate UCUM units if enabled
    if (this.config.validateUnits && this.ucumService && rmNode) {
      const unitMsgs = this.validateUnits(rmNode, path);
      errors.push(...unitMsgs.filter(m => m.severity === "error"));
      warnings.push(...unitMsgs.filter(m => m.severity === "warning"));
    }

    // Validate terminology if enabled
    if (this.config.validateTerminology && this.terminologyValidator && rmNode) {
      const termMsgs = this.terminologyValidator.validate(rmNode, cObject, path);
      errors.push(...termMsgs.filter(m => m.severity === "error"));
      warnings.push(...termMsgs.filter(m => m.severity === "warning"));
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

  private validateUnits(rmNode: any, path: string): ValidationMessage[] {
    const messages: ValidationMessage[] = [];
    
    // Check for units property (common in DV_QUANTITY)
    if (rmNode.units && typeof rmNode.units === 'string') {
      const validationResult = this.ucumService!.validateSync(rmNode.units);
      if (validationResult && validationResult.status === "invalid") {
        messages.push({
          path,
          message: `Invalid UCUM unit: "${rmNode.units}"${validationResult.msg ? ': ' + validationResult.msg.join(', ') : ''}`,
          severity: "error",
          constraintType: "ucum",
        });
      }
    }
    
    return messages;
  }

  private getTypeName(instance: any): string | undefined {
    return TypeRegistry.getTypeNameFromInstance(instance);
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
 * Primitive constraint validator with detailed constraints
 */
export class PrimitiveValidator {
  validate(
    rmValue: any,
    cObject: openehr_am.C_PRIMITIVE_OBJECT,
    path: string
  ): ValidationMessage[] {
    const messages: ValidationMessage[] = [];
    
    // Validate C_STRING constraints
    if (cObject instanceof openehr_am.C_STRING) {
      this.validateString(rmValue, cObject, path, messages);
    }
    
    // Validate C_INTEGER constraints
    else if (cObject instanceof openehr_am.C_INTEGER) {
      this.validateInteger(rmValue, cObject, path, messages);
    }
    
    // Validate C_REAL constraints
    else if (cObject instanceof openehr_am.C_REAL) {
      this.validateReal(rmValue, cObject, path, messages);
    }
    
    // Validate C_BOOLEAN constraints
    else if (cObject instanceof openehr_am.C_BOOLEAN) {
      this.validateBoolean(rmValue, cObject, path, messages);
    }
    
    return messages;
  }

  private validateString(
    value: any,
    constraint: openehr_am.C_STRING,
    path: string,
    messages: ValidationMessage[]
  ): void {
    if (typeof value !== 'string') {
      messages.push({
        path,
        message: `Expected string, got ${typeof value}`,
        severity: "error",
        constraintType: "primitive_type",
      });
      return;
    }

    // Check pattern if provided
    if (constraint.pattern) {
      try {
        const regex = new RegExp(constraint.pattern);
        if (!regex.test(value)) {
          messages.push({
            path,
            message: `String "${value}" does not match pattern: ${constraint.pattern}`,
            severity: "error",
            constraintType: "string_pattern",
          });
        }
      } catch (e) {
        messages.push({
          path,
          message: `Invalid regex pattern: ${constraint.pattern}`,
          severity: "warning",
          constraintType: "string_pattern",
        });
      }
    }

    // Check list if provided
    if (constraint.list && constraint.list.length > 0) {
      if (!constraint.list.includes(value)) {
        messages.push({
          path,
          message: `String "${value}" not in allowed list: [${constraint.list.join(', ')}]`,
          severity: "error",
          constraintType: "string_list",
        });
      }
    }
  }

  private validateInteger(
    value: any,
    constraint: openehr_am.C_INTEGER,
    path: string,
    messages: ValidationMessage[]
  ): void {
    if (typeof value !== 'number' || !Number.isInteger(value)) {
      messages.push({
        path,
        message: `Expected integer, got ${typeof value}`,
        severity: "error",
        constraintType: "primitive_type",
      });
      return;
    }

    // Check range if provided
    if (constraint.range) {
      const range = constraint.range;
      if (range.lower !== undefined && value < range.lower) {
        messages.push({
          path,
          message: `Integer ${value} below minimum: ${range.lower}`,
          severity: "error",
          constraintType: "integer_range",
        });
      }
      if (range.upper !== undefined && value > range.upper) {
        messages.push({
          path,
          message: `Integer ${value} above maximum: ${range.upper}`,
          severity: "error",
          constraintType: "integer_range",
        });
      }
    }

    // Check list if provided
    if (constraint.list && constraint.list.length > 0) {
      if (!constraint.list.includes(value)) {
        messages.push({
          path,
          message: `Integer ${value} not in allowed list: [${constraint.list.join(', ')}]`,
          severity: "error",
          constraintType: "integer_list",
        });
      }
    }
  }

  private validateReal(
    value: any,
    constraint: openehr_am.C_REAL,
    path: string,
    messages: ValidationMessage[]
  ): void {
    if (typeof value !== 'number') {
      messages.push({
        path,
        message: `Expected number, got ${typeof value}`,
        severity: "error",
        constraintType: "primitive_type",
      });
      return;
    }

    // Check range if provided
    if (constraint.range) {
      const range = constraint.range;
      if (range.lower !== undefined && value < range.lower) {
        messages.push({
          path,
          message: `Real ${value} below minimum: ${range.lower}`,
          severity: "error",
          constraintType: "real_range",
        });
      }
      if (range.upper !== undefined && value > range.upper) {
        messages.push({
          path,
          message: `Real ${value} above maximum: ${range.upper}`,
          severity: "error",
          constraintType: "real_range",
        });
      }
    }

    // Check list if provided
    if (constraint.list && constraint.list.length > 0) {
      if (!constraint.list.includes(value)) {
        messages.push({
          path,
          message: `Real ${value} not in allowed list: [${constraint.list.join(', ')}]`,
          severity: "error",
          constraintType: "real_list",
        });
      }
    }
  }

  private validateBoolean(
    value: any,
    constraint: openehr_am.C_BOOLEAN,
    path: string,
    messages: ValidationMessage[]
  ): void {
    if (typeof value !== 'boolean') {
      messages.push({
        path,
        message: `Expected boolean, got ${typeof value}`,
        severity: "error",
        constraintType: "primitive_type",
      });
      return;
    }

    // Check true_valid and false_valid constraints
    if (constraint.true_valid === false && value === true) {
      messages.push({
        path,
        message: `Boolean value 'true' is not allowed`,
        severity: "error",
        constraintType: "boolean_constraint",
      });
    }
    if (constraint.false_valid === false && value === false) {
      messages.push({
        path,
        message: `Boolean value 'false' is not allowed`,
        severity: "error",
        constraintType: "boolean_constraint",
      });
    }
  }
}

/**
 * Terminology validator
 */
export class TerminologyValidator {
  validate(
    rmValue: any,
    cObject: openehr_am.C_OBJECT,
    path: string
  ): ValidationMessage[] {
    const messages: ValidationMessage[] = [];
    
    // Check for coded text values (DV_CODED_TEXT)
    if (rmValue && rmValue._type === "DV_CODED_TEXT") {
      if (rmValue.defining_code) {
        const code = rmValue.defining_code;
        
        // Validate terminology_id is present
        if (!code.terminology_id || !code.terminology_id.value) {
          messages.push({
            path,
            message: "Missing terminology_id in coded text",
            severity: "error",
            constraintType: "terminology",
          });
        }
        
        // Validate code_string is present
        if (!code.code_string) {
          messages.push({
            path,
            message: "Missing code_string in coded text",
            severity: "error",
            constraintType: "terminology",
          });
        }
      } else {
        messages.push({
          path,
          message: "Missing defining_code in DV_CODED_TEXT",
          severity: "error",
          constraintType: "terminology",
        });
      }
    }
    
    // Could add external terminology validation (SNOMED, LOINC, etc.)
    // by querying terminology services
    
    return messages;
  }
}
