/**
 * Structural validation of parsed AOM archetypes/templates (Archie-style checks without JVM).
 */

import * as openehr_am from "../openehr_am.ts";
import type { ValidationMessage, ValidationResult } from "./template_validator.ts";

export class ArchetypeValidator {
  validate(
    archetype: openehr_am.ARCHETYPE | openehr_am.TEMPLATE | openehr_am.OPERATIONAL_TEMPLATE,
  ): ValidationResult {
    const errors: ValidationMessage[] = [];
    const warnings: ValidationMessage[] = [];

    if (!archetype.archetype_id?.value) {
      errors.push(msg("/", "Missing archetype_id", "header"));
    }

    if (!archetype.definition) {
      errors.push(msg("/", "Missing definition", "structure"));
    } else {
      this.validateCObject(archetype.definition, "/definition", errors, warnings, 0);
    }

    const ontology = archetype.ontology as Record<string, unknown> | undefined;
    const termDefs = ontology?.term_definitions as Record<string, unknown> | undefined;
    if (termDefs && Object.keys(termDefs).length === 0) {
      warnings.push(msg("/terminology", "Empty term_definitions", "terminology", "warning"));
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private validateCObject(
    node: openehr_am.C_OBJECT,
    path: string,
    errors: ValidationMessage[],
    warnings: ValidationMessage[],
    depth: number,
  ): void {
    if (depth > 64) {
      warnings.push(msg(path, "Maximum archetype tree depth exceeded", "depth", "warning"));
      return;
    }

    const needsRmType = node instanceof openehr_am.C_COMPLEX_OBJECT ||
      node instanceof openehr_am.C_ARCHETYPE_ROOT ||
      node instanceof openehr_am.ARCHETYPE_SLOT;

    if (!node.rm_type_name && needsRmType) {
      const msgText = "Missing rm_type_name on C_OBJECT";
      if (depth === 0) {
        errors.push(msg(path, msgText, "structure"));
      } else {
        warnings.push(msg(path, msgText, "structure", "warning"));
      }
    }
    if (!node.node_id) {
      warnings.push(msg(path, "Missing node_id on C_OBJECT", "structure", "warning"));
    }

    if (node instanceof openehr_am.C_COMPLEX_OBJECT && node.attributes) {
      for (const attr of node.attributes) {
        if (!attr.rm_attribute_name) {
          errors.push(msg(path, "C_ATTRIBUTE missing rm_attribute_name", "structure"));
          continue;
        }
        const attrPath = `${path}/${attr.rm_attribute_name}`;
        if (!attr.children?.length) {
          warnings.push(msg(attrPath, "Attribute has no children", "structure", "warning"));
        }
        for (const child of attr.children ?? []) {
          this.validateCObject(child, `${attrPath}/${child.node_id ?? "?"}`, errors, warnings, depth + 1);
        }
      }
    }
  }
}

function msg(
  path: string,
  message: string,
  constraintType: string,
  severity: ValidationMessage["severity"] = "error",
): ValidationMessage {
  return {
    path,
    archetypePath: path,
    message,
    severity,
    constraintType,
  };
}
