/**
 * Validation Framework for openEHR Templates
 * 
 * Validates RM instances against operational templates/archetypes.
 * Following PRD Option 1: External Validator (non-intrusive).
 */

import * as openehr_am from "../am/openehr_am.ts";
import { isSubtypeOf } from "../meta/mod.ts";
import { TypeRegistry } from "../serialization/common/type_registry.ts";
import {
  buildJsonSourceIndex,
  enrichValidationMessageWithSource,
  type JsonSourceIndex,
} from "../serialization/common/json_source_index.ts";
import { UcumService } from "../term/ucum_service.ts";
import { IntervalValidator } from "./interval_validator.ts";
import { RMSpecificationValidator } from "./rm_specification_validator.ts";
import { InvariantEvaluator } from "./invariant_evaluator.ts";
import {
  inOrderedRange,
  matchesAdlTemporalPattern,
} from "./temporal_pattern.ts";

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
  /** RM instance JSON path (e.g. `/data/events[0]/`). */
  path: string;
  /** Constraint path in archetype definition (ADL path when known; otherwise same as `path`). */
  archetypePath?: string;
  message: string;
  severity: "error" | "warning" | "info";
  constraintType: string;
  /** JSON Pointer into the original source when `jsonSource` was provided to `validate`. */
  jsonPointer?: string;
  /** 1-based line in the original JSON source (when available). */
  sourceLine?: number;
  /** 1-based column in the original JSON source (when available). */
  sourceColumn?: number;
}

/**
 * Optional per-validation inputs (e.g. original JSON for source mapping).
 */
export interface ValidationOptions {
  /** Original JSON text used to build `rmInstance`; enables source line/column on messages. */
  jsonSource?: string;
}

/**
 * Validation configuration
 */
export interface ValidationConfig {
  failFast?: boolean;
  requiredOnly?: boolean;
  maxDepth?: number;
  validateUnits?: boolean;              // Enable UCUM unit validation
  validateTerminology?: boolean;        // Enable terminology validation
  useTypeRegistry?: boolean;            // Use TypeRegistry for type resolution
  validateIntervals?: boolean;          // Enable DV_INTERVAL validation
  validateRMSpecification?: boolean;    // Enable RM specification constraints
  validateInvariants?: boolean;         // Evaluate archetype rules / invariants
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
  private intervalValidator?: IntervalValidator;
  private rmSpecValidator?: RMSpecificationValidator;

  constructor(config?: ValidationConfig) {
    this.config = {
      failFast: false,
      requiredOnly: false,
      maxDepth: 100,
      validateUnits: true,
      validateTerminology: true,
      useTypeRegistry: true,
      validateIntervals: true,
      validateRMSpecification: true,
      validateInvariants: true,
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
    
    if (this.config.validateIntervals) {
      this.intervalValidator = new IntervalValidator();
    }
    
    if (this.config.validateRMSpecification) {
      this.rmSpecValidator = new RMSpecificationValidator();
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
    template: openehr_am.OPERATIONAL_TEMPLATE | openehr_am.ARCHETYPE,
    options?: ValidationOptions,
  ): ValidationResult {
    const errors: ValidationMessage[] = [];
    const warnings: ValidationMessage[] = [];
    const sourceIndex = options?.jsonSource
      ? buildJsonSourceIndex(options.jsonSource)
      : undefined;

    // Validate against definition
    if (!template.definition) {
      errors.push({
        path: "/",
        message: "Template has no definition",
        severity: "error",
        constraintType: "structure",
      });
    } else {
      this.validateNode(
        rmInstance,
        template.definition,
        "/",
        errors,
        warnings,
        0,
        template.definition.rm_type_name,
      );
    }

    if (this.config.validateRMSpecification && this.rmSpecValidator) {
      const rmMsgs = this.rmSpecValidator.validateInstance(
        rmInstance,
        template.definition?.rm_type_name,
        "/",
      );
      for (const m of rmMsgs) {
        m.archetypePath = m.archetypePath ?? m.path;
      }
      errors.push(...rmMsgs.filter((m) => m.severity === "error"));
      warnings.push(...rmMsgs.filter((m) => m.severity === "warning"));
    }

    if (
      this.config.validateInvariants &&
      template.invariants?.length
    ) {
      const invariantMsgs = new InvariantEvaluator({
        definition: template.definition,
      }).validateInvariants(
        rmInstance,
        template.invariants,
        template.definition,
      );
      errors.push(...invariantMsgs.filter((m) => m.severity === "error"));
      warnings.push(...invariantMsgs.filter((m) => m.severity === "warning"));
    }

    if (sourceIndex) {
      for (const message of [...errors, ...warnings]) {
        enrichValidationMessageWithSource(message, sourceIndex);
      }
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
    depth: number,
    parentRmType?: string,
  ): void {
    if (depth > (this.config.maxDepth || 100)) {
      warnings.push({
        path,
        archetypePath: path,
        message: "Maximum validation depth exceeded",
        severity: "warning",
        constraintType: "depth",
      });
      return;
    }

    // Validate type match using TypeRegistry if enabled.
    // Primitive RM types (INTEGER, STRING, …) constrain leaf values, not
    // `_type` tags. Constrained RM classes accept instances of subtypes
    // (POINT_EVENT satisfies EVENT; DV_CODED_TEXT satisfies DV_TEXT).
    if (this.config.useTypeRegistry && cObject.rm_type_name && rmNode) {
      const expected = cObject.rm_type_name;
      if (!isPrimitiveRmType(expected)) {
        const actualType = this.getTypeName(rmNode);
        if (
          actualType &&
          actualType !== expected &&
          !isSubtypeOf(actualType, expected)
        ) {
          errors.push({
            path,
            archetypePath: path,
            message: `Type mismatch: expected ${expected}, got ${actualType}`,
            severity: "error",
            constraintType: "type",
          });
        }
      }
    }

    if (
      cObject instanceof openehr_am.C_ARCHETYPE_ROOT &&
      rmNode &&
      typeof cObject.archetype_ref === "string" &&
      cObject.archetype_ref
    ) {
      const instanceId = typeof rmNode.archetype_node_id === "string"
        ? rmNode.archetype_node_id
        : undefined;
      if (
        instanceId &&
        looksLikeArchetypeId(instanceId) &&
        instanceId !== cObject.archetype_ref
      ) {
        errors.push({
          path,
          archetypePath: path,
          message:
            `archetype_node_id "${instanceId}" does not match template archetype "${cObject.archetype_ref}"`,
          severity: "error",
          constraintType: "archetype_id",
        });
      }
    }

    // Validate occurrences
    if (cObject.occurrences) {
      const msgs = this.occurrenceValidator.validate(rmNode, cObject, path);
      errors.push(...msgs.filter(m => m.severity === "error"));
      warnings.push(...msgs.filter(m => m.severity === "warning"));
    }

    // Validate primitive constraints. Legacy OPT XML wraps C_INTEGER/C_STRING
    // inside C_PRIMITIVE_OBJECT.item; AOM2 C_TERMINOLOGY_CODE also extends
    // C_PRIMITIVE_OBJECT and is handled by TerminologyValidator instead.
    if (
      isPrimitiveConstraint(cObject) &&
      rmNode !== null && rmNode !== undefined
    ) {
      const msgs = this.primitiveValidator.validate(rmNode, cObject, path);
      errors.push(...msgs.filter((m) => m.severity === "error"));
      warnings.push(...msgs.filter((m) => m.severity === "warning"));
    }

    if (cObject instanceof openehr_am.C_QUANTITY && rmNode) {
      const msgs = validateQuantityConstraint(rmNode, cObject, path);
      errors.push(...msgs.filter((m) => m.severity === "error"));
      warnings.push(...msgs.filter((m) => m.severity === "warning"));
    }

    if (cObject instanceof openehr_am.C_ORDINAL && rmNode) {
      const msgs = validateOrdinalConstraint(rmNode, cObject, path);
      errors.push(...msgs.filter((m) => m.severity === "error"));
      warnings.push(...msgs.filter((m) => m.severity === "warning"));
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

    // Validate intervals if enabled
    if (this.config.validateIntervals && this.intervalValidator && rmNode) {
      const intervalMsgs = this.intervalValidator.validate(rmNode, path);
      errors.push(...intervalMsgs.filter(m => m.severity === "error"));
      warnings.push(...intervalMsgs.filter(m => m.severity === "warning"));
    }

    // Validate RM specification constraints if enabled (parent RM type + attribute name)
    if (
      this.config.validateRMSpecification && this.rmSpecValidator && rmNode &&
      parentRmType
    ) {
      const pathParts = path.split("/").filter(Boolean);
      const attributeName = pathParts[pathParts.length - 1]?.replace(/\[\d+\]$/, "");
      if (attributeName && !/^\d+$/.test(attributeName)) {
        const rmSpecMsgs = this.rmSpecValidator.validate(
          rmNode,
          parentRmType,
          attributeName,
          path,
        );
        for (const m of rmSpecMsgs) {
          m.archetypePath = m.archetypePath ?? path;
        }
        errors.push(...rmSpecMsgs.filter((m) => m.severity === "error"));
        warnings.push(...rmSpecMsgs.filter((m) => m.severity === "warning"));
      }
    }

    // Validate complex object
    if (cObject instanceof openehr_am.C_COMPLEX_OBJECT && rmNode) {
      this.validateComplexObject(
        rmNode,
        cObject,
        path,
        errors,
        warnings,
        depth,
      );
    }
  }

  private validateComplexObject(
    rmNode: any,
    cObject: openehr_am.C_COMPLEX_OBJECT,
    path: string,
    errors: ValidationMessage[],
    warnings: ValidationMessage[],
    depth: number,
  ): void {
    if (!cObject.attributes) return;

    for (const cAttribute of cObject.attributes) {
      const attrName = cAttribute.rm_attribute_name;
      if (!attrName) continue;

      const rmValue = rmNode[attrName];
      const attrPath = `${path}${attrName}/`;
      const existence = (
        cAttribute as { existence?: { lower?: number } }
      ).existence;

      if (existence && (existence.lower ?? 0) > 0) {
        const missing = rmValue === null || rmValue === undefined ||
          (Array.isArray(rmValue) && rmValue.length === 0);
        if (missing) {
          errors.push({
            path: attrPath,
            archetypePath: attrPath,
            message: `Required attribute missing: ${attrName}`,
            severity: "error",
            constraintType: "existence",
          });
        }
      }

      const members = Array.isArray(rmValue)
        ? rmValue
        : (rmValue === null || rmValue === undefined ? [] : [rmValue]);
      if (
        cAttribute instanceof openehr_am.C_MULTIPLE_ATTRIBUTE ||
        Array.isArray(rmValue)
      ) {
        const msgs = this.cardinalityValidator.validate(
          members,
          cAttribute,
          attrPath,
        );
        errors.push(...msgs.filter((m) => m.severity === "error"));
        warnings.push(...msgs.filter((m) => m.severity === "warning"));
      }

      const children = cAttribute.children ?? [];
      if (!children.length) continue;

      if (Array.isArray(rmValue)) {
        rmValue.forEach((item, i) => {
          const child = matchConstraintChild(children, item) ?? children[0];
          this.validateNode(
            item,
            child,
            `${attrPath}[${i}]/`,
            errors,
            warnings,
            depth + 1,
            cObject.rm_type_name,
          );
        });
      } else if (rmValue !== null && rmValue !== undefined) {
        const child = matchConstraintChild(children, rmValue) ?? children[0];
        this.validateNode(
          rmValue,
          child,
          attrPath,
          errors,
          warnings,
          depth + 1,
          cObject.rm_type_name,
        );
      } else {
        for (const child of children) {
          this.validateNode(
            rmValue,
            child,
            attrPath,
            errors,
            warnings,
            depth + 1,
            cObject.rm_type_name,
          );
        }
      }
    }
  }

  private validateUnits(rmNode: any, path: string): ValidationMessage[] {
    const messages: ValidationMessage[] = [];
    if (!rmNode || typeof rmNode !== "object") return messages;

    if (rmNode.units && typeof rmNode.units === "string") {
      const validationResult = this.ucumService!.validate(rmNode.units);
      if (validationResult && validationResult.status === "invalid") {
        messages.push({
          path,
          archetypePath: path,
          message: `Invalid UCUM unit: "${rmNode.units}"${
            validationResult.msg ? ": " + validationResult.msg.join(", ") : ""
          }`,
          severity: "error",
          constraintType: "ucum",
        });
      }
    }

    for (const [key, val] of Object.entries(rmNode)) {
      if (val && typeof val === "object") {
        messages.push(...this.validateUnits(val, `${path}${key}/`));
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
    path: string,
  ): ValidationMessage[] {
    const messages: ValidationMessage[] = [];
    const members = Array.isArray(rmValue) ? rmValue : [];
    const card = (cAttribute as openehr_am.C_MULTIPLE_ATTRIBUTE).cardinality;
    const interval = card && typeof card === "object"
      ? (card as { interval?: { lower?: number; upper?: number; upper_unbounded?: boolean } }).interval
      : undefined;
    if (!interval) return messages;

    const count = members.length;
    const lower = interval.lower ?? 0;
    const upper = interval.upper_unbounded ? undefined : interval.upper;
    if (count < lower) {
      messages.push({
        path,
        message: `Cardinality ${count} below minimum: ${lower}`,
        severity: "error",
        constraintType: "cardinality",
      });
    }
    if (upper !== undefined && count > upper) {
      messages.push({
        path,
        message: `Cardinality ${count} above maximum: ${upper}`,
        severity: "error",
        constraintType: "cardinality",
      });
    }
    return messages;
  }
}

/**
 * Primitive constraint validator with detailed constraints
 */
export class PrimitiveValidator {
  validate(
    rmValue: any,
    cObject: unknown,
    path: string,
  ): ValidationMessage[] {
    const messages: ValidationMessage[] = [];
    const constraint = unwrapPrimitiveConstraint(cObject);
    if (!constraint) return messages;
    const value = extractPrimitiveValue(rmValue);

    if (constraint instanceof openehr_am.C_STRING) {
      this.validateString(value, constraint, path, messages);
    } else if (constraint instanceof openehr_am.C_INTEGER) {
      this.validateInteger(value, constraint, path, messages);
    } else if (constraint instanceof openehr_am.C_REAL) {
      this.validateReal(value, constraint, path, messages);
    } else if (constraint instanceof openehr_am.C_BOOLEAN) {
      this.validateBoolean(value, constraint, path, messages);
    } else if (
      constraint instanceof openehr_am.C_DATE ||
      constraint instanceof openehr_am.C_TIME ||
      constraint instanceof openehr_am.C_DATE_TIME ||
      constraint instanceof openehr_am.C_DURATION
    ) {
      this.validateTemporal(value, constraint, path, messages);
    }

    return messages;
  }

  private validateString(
    value: any,
    constraint: openehr_am.C_STRING,
    path: string,
    messages: ValidationMessage[]
  ): void {
    if (typeof value !== "string") {
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

    const list = (constraint as { list?: string[] }).list;
    if (list && list.length > 0) {
      if (!list.includes(value)) {
        messages.push({
          path,
          message: `String "${value}" not in allowed list: [${list.join(", ")}]`,
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

    if (constraint.range && !inOrderedRange(value, constraint.range as RangeLike)) {
      messages.push({
        path,
        message: `Integer ${value} not in range`,
        severity: "error",
        constraintType: "integer_range",
      });
    }

    const list = (constraint as { list?: number[] }).list;
    if (list && list.length > 0 && !list.includes(value)) {
      messages.push({
        path,
        message: `Integer ${value} not in allowed list: [${list.join(", ")}]`,
        severity: "error",
        constraintType: "integer_list",
      });
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

    if (constraint.range && !inOrderedRange(value, constraint.range as RangeLike)) {
      messages.push({
        path,
        message: `Real ${value} not in range`,
        severity: "error",
        constraintType: "real_range",
      });
    }

    const list = (constraint as { list?: number[] }).list;
    if (list && list.length > 0 && !list.includes(value)) {
      messages.push({
        path,
        message: `Real ${value} not in allowed list: [${list.join(", ")}]`,
        severity: "error",
        constraintType: "real_list",
      });
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

  private validateTemporal(
    value: any,
    constraint:
      | openehr_am.C_DATE
      | openehr_am.C_TIME
      | openehr_am.C_DATE_TIME
      | openehr_am.C_DURATION,
    path: string,
    messages: ValidationMessage[],
  ): void {
    if (typeof value !== "string") {
      messages.push({
        path,
        message: `Expected ISO 8601 string, got ${typeof value}`,
        severity: "error",
        constraintType: "primitive_type",
      });
      return;
    }
    const pattern = (constraint as { pattern?: string }).pattern ??
      (constraint as { pattern_constraint?: string }).pattern_constraint;
    if (pattern && !matchesAdlTemporalPattern(value, pattern)) {
      messages.push({
        path,
        message: `Value "${value}" does not match temporal pattern ${pattern}`,
        severity: "error",
        constraintType: "temporal_pattern",
      });
    }
    const range = (constraint as { range?: RangeLike }).range;
    if (range && !inOrderedRange(value, range)) {
      messages.push({
        path,
        message: `Value "${value}" is outside the constrained range`,
        severity: "error",
        constraintType: "temporal_range",
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
    path: string,
  ): ValidationMessage[] {
    const messages: ValidationMessage[] = [];
    if (!rmValue) return messages;

    if (cObject instanceof openehr_am.C_TERMINOLOGY_CODE) {
      this.validateCodePhrase(rmValue, cObject, path, messages);
      return messages;
    }

    const isCodedText = cObject.rm_type_name === "DV_CODED_TEXT" ||
      (typeof rmValue === "object" && rmValue && "defining_code" in rmValue);
    if (isCodedText) {
      if (rmValue.defining_code) {
        this.validateCodePhrase(
          rmValue.defining_code,
          cObject,
          path,
          messages,
        );
      } else if (cObject.rm_type_name === "DV_CODED_TEXT") {
        messages.push({
          path,
          message: "Missing defining_code in DV_CODED_TEXT",
          severity: "error",
          constraintType: "terminology",
        });
      }
    }

    return messages;
  }

  private validateCodePhrase(
    code: any,
    cObject: openehr_am.C_OBJECT,
    path: string,
    messages: ValidationMessage[],
  ): void {
    const terminologyId = terminologyIdOf(code);
    const codeString = codeStringOf(code);
    if (!terminologyId) {
      messages.push({
        path,
        archetypePath: path,
        message: "Missing terminology_id in coded text",
        severity: "error",
        constraintType: "terminology",
      });
    }
    if (!codeString) {
      messages.push({
        path,
        message: "Missing code_string in coded text",
        severity: "error",
        constraintType: "terminology",
      });
    }

    const runtime = cObject as openehr_am.C_TERMINOLOGY_CODE & {
      code_list?: string[];
      terminology_id?: string;
    };
    if (runtime.terminology_id && terminologyId) {
      if (runtime.terminology_id !== terminologyId) {
        messages.push({
          path,
          message:
            `terminology_id "${terminologyId}" does not match constrained terminology "${runtime.terminology_id}"`,
          severity: "error",
          constraintType: "terminology_id",
        });
      }
    }
    const allowed = runtime.code_list?.length
      ? runtime.code_list
      : (runtime.constraint ? [runtime.constraint] : []);
    if (allowed.length && codeString && !allowed.includes(codeString)) {
      messages.push({
        path,
        message: `code_string "${codeString}" is not in C_CODE_PHRASE.code_list`,
        severity: "error",
        constraintType: "code_list",
      });
    }
  }
}

type RangeLike = {
  lower?: unknown;
  upper?: unknown;
  lower_included?: boolean;
  upper_included?: boolean;
  lower_unbounded?: boolean;
  upper_unbounded?: boolean;
};

const PRIMITIVE_RM_TYPES = new Set([
  "INTEGER",
  "REAL",
  "BOOLEAN",
  "STRING",
  "DATE",
  "TIME",
  "DATE_TIME",
  "DURATION",
  "ISO8601_DATE",
  "ISO8601_TIME",
  "ISO8601_DATE_TIME",
  "ISO8601_DURATION",
]);

function isPrimitiveRmType(rmType: string): boolean {
  return PRIMITIVE_RM_TYPES.has(rmType.toUpperCase());
}

function isPrimitiveConstraint(cObject: unknown): boolean {
  if (cObject instanceof openehr_am.C_TERMINOLOGY_CODE) return false;
  return cObject instanceof openehr_am.C_PRIMITIVE_OBJECT ||
    cObject instanceof openehr_am.C_STRING ||
    cObject instanceof openehr_am.C_INTEGER ||
    cObject instanceof openehr_am.C_REAL ||
    cObject instanceof openehr_am.C_BOOLEAN ||
    cObject instanceof openehr_am.C_DATE ||
    cObject instanceof openehr_am.C_TIME ||
    cObject instanceof openehr_am.C_DATE_TIME ||
    cObject instanceof openehr_am.C_DURATION;
}

function unwrapPrimitiveConstraint(cObject: unknown): unknown {
  if (
    cObject instanceof openehr_am.C_PRIMITIVE_OBJECT &&
    !(cObject instanceof openehr_am.C_TERMINOLOGY_CODE)
  ) {
    return cObject.item ?? cObject;
  }
  return cObject;
}

function extractPrimitiveValue(rmValue: unknown): unknown {
  if (rmValue && typeof rmValue === "object" && "value" in rmValue) {
    return (rmValue as { value?: unknown }).value;
  }
  return rmValue;
}

function matchConstraintChild(
  children: openehr_am.C_OBJECT[],
  rmItem: unknown,
): openehr_am.C_OBJECT | undefined {
  if (children.length === 1) return children[0];
  const actual = TypeRegistry.getTypeNameFromInstance(rmItem);
  if (!actual) return children[0];
  return children.find((child) => {
    const expected = child.rm_type_name;
    if (!expected) return false;
    return actual === expected || isSubtypeOf(actual, expected);
  });
}

function terminologyIdOf(code: unknown): string | undefined {
  if (!code || typeof code !== "object") return undefined;
  const rec = code as { terminology_id?: { value?: string } | string };
  if (typeof rec.terminology_id === "string") return rec.terminology_id;
  return rec.terminology_id?.value;
}

function looksLikeArchetypeId(id: string): boolean {
  return /openEHR-/i.test(id) || id.includes("::") ||
    /-(EHR|DEMOGRAPHIC|EHR_EXTRACT)-/.test(id);
}

function codeStringOf(code: unknown): string | undefined {
  if (!code || typeof code !== "object") return undefined;
  const rec = code as { code_string?: string };
  return rec.code_string;
}

function validateQuantityConstraint(
  rmValue: any,
  cObject: openehr_am.C_QUANTITY,
  path: string,
): ValidationMessage[] {
  const messages: ValidationMessage[] = [];
  const list = (cObject as { list?: Array<{ units?: string; magnitude?: RangeLike }> }).list ?? [];
  const units = rmValue?.units;
  if (list.length && units) {
    const match = list.find((item) => item.units === units);
    if (!match) {
      messages.push({
        path,
        message: `units "${units}" is not in C_DV_QUANTITY.list`,
        severity: "error",
        constraintType: "quantity_units",
      });
    } else if (
      match.magnitude &&
      rmValue.magnitude !== undefined &&
      !inOrderedRange(rmValue.magnitude, match.magnitude)
    ) {
      messages.push({
        path,
        message: `magnitude ${rmValue.magnitude} is outside the units interval for ${units}`,
        severity: "error",
        constraintType: "quantity_magnitude",
      });
    }
  }
  return messages;
}

function validateOrdinalConstraint(
  rmValue: any,
  cObject: openehr_am.C_ORDINAL,
  path: string,
): ValidationMessage[] {
  const messages: ValidationMessage[] = [];
  const list = (cObject as {
    list?: Array<{ value?: number; symbol?: { code_string?: string } }>;
  }).list ?? [];
  if (!list.length) return messages;
  const value = rmValue?.value;
  const symbol = codeStringOf(rmValue?.symbol) ??
    codeStringOf(rmValue?.symbol?.defining_code);
  const match = list.find((item) => {
    const itemCode = codeStringOf(item.symbol) ??
      (item.symbol as { code_string?: string } | undefined)?.code_string;
    if (value !== undefined && item.value !== undefined) {
      return item.value === value;
    }
    return itemCode !== undefined && itemCode === symbol;
  });
  if (!match) {
    messages.push({
      path,
      message: "DV_ORDINAL is not a member of C_DV_ORDINAL.list",
      severity: "error",
      constraintType: "ordinal_list",
    });
  }
  return messages;
}
