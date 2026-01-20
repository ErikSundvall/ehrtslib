/**
 * RM Specification Validator
 * 
 * Validates instances against openEHR Reference Model specification constraints.
 * These are constraints defined in the RM specification itself, not in archetypes.
 * 
 * Examples:
 * - COMPOSITION.category must be from openEHR terminology (431|persistent| or 433|event|)
 * - OBSERVATION.history must contain at least one EVENT
 * - Specific terminology_id values for certain coded text fields
 */

import type { ValidationMessage } from "./template_validator.ts";

/**
 * RM specification constraints knowledge base
 */
const RM_CONSTRAINTS = {
  // COMPOSITION.category must be from specific code list
  "COMPOSITION.category": {
    type: "coded_text_value_set",
    terminology_id: "openehr",
    allowed_codes: ["431", "433"],  // persistent, event
    code_meanings: {
      "431": "persistent",
      "433": "event",
    },
  },
  
  // EVENT_CONTEXT.setting must be from specific code list (ISM 229)
  "EVENT_CONTEXT.setting": {
    type: "coded_text_value_set",
    terminology_id: "openehr",
    allowed_codes: ["229", "230", "231", "232", "233", "234", "235", "236", "237", "238"],
    code_meanings: {
      "229": "home",
      "230": "emergency care",
      "231": "primary medical care",
      // ... etc
    },
  },
  
  // INSTRUCTION.narrative must be present
  "INSTRUCTION.narrative": {
    type: "required",
    message: "INSTRUCTION.narrative is required by RM specification",
  },
  
  // ACTION.time must be present
  "ACTION.time": {
    type: "required",
    message: "ACTION.time is required by RM specification",
  },
  
  // OBSERVATION must have data
  "OBSERVATION.data": {
    type: "required",
    message: "OBSERVATION.data is required by RM specification",
  },
};

/**
 * Validates instances against RM specification constraints
 */
export class RMSpecificationValidator {
  private enabled: boolean;
  
  constructor(enabled: boolean = true) {
    this.enabled = enabled;
  }
  
  /**
   * Validate an RM instance against specification constraints
   * 
   * @param rmValue - The RM instance
   * @param rmTypeName - The RM type name (e.g., "COMPOSITION")
   * @param attributeName - The attribute name (e.g., "category")
   * @param path - Path for error reporting
   * @returns Array of validation messages
   */
  validate(
    rmValue: any,
    rmTypeName: string,
    attributeName: string,
    path: string
  ): ValidationMessage[] {
    if (!this.enabled) {
      return [];
    }
    
    const messages: ValidationMessage[] = [];
    const constraintKey = `${rmTypeName}.${attributeName}`;
    const constraint = RM_CONSTRAINTS[constraintKey as keyof typeof RM_CONSTRAINTS];
    
    if (!constraint) {
      return messages;
    }
    
    // Handle coded text value set constraints
    if (constraint.type === "coded_text_value_set") {
      this.validateCodedTextValueSet(rmValue, constraint, path, messages);
    }
    
    // Handle required constraints
    else if (constraint.type === "required") {
      if (rmValue === undefined || rmValue === null) {
        messages.push({
          path,
          message: constraint.message || `${constraintKey} is required`,
          severity: "error",
          constraintType: "rm_specification",
        });
      }
    }
    
    return messages;
  }
  
  /**
   * Validate coded text against a value set
   */
  private validateCodedTextValueSet(
    rmValue: any,
    constraint: any,
    path: string,
    messages: ValidationMessage[]
  ): void {
    if (!rmValue) {
      return;
    }
    
    // Handle terse string format: "terminology::code|value|"
    if (typeof rmValue === 'string') {
      const match = rmValue.match(/^([^:]+)::(\d+)\|?([^|]*)?\|?$/);
      if (match) {
        const [, terminology, code] = match;
        this.checkCodeValue(terminology, code, constraint, path, messages);
        return;
      }
    }
    
    // Handle DV_CODED_TEXT object
    if (typeof rmValue === 'object') {
      const code = this.extractCode(rmValue);
      const terminology = this.extractTerminologyId(rmValue);
      
      if (code && terminology) {
        this.checkCodeValue(terminology, code, constraint, path, messages);
      }
    }
  }
  
  /**
   * Check if code is valid for the constraint
   */
  private checkCodeValue(
    terminology: string,
    code: string,
    constraint: any,
    path: string,
    messages: ValidationMessage[]
  ): void {
    // Check terminology ID matches
    if (constraint.terminology_id && terminology !== constraint.terminology_id) {
      messages.push({
        path,
        message: `Terminology ID "${terminology}" does not match required "${constraint.terminology_id}"`,
        severity: "error",
        constraintType: "rm_specification",
      });
      return;
    }
    
    // Check code is in allowed list
    if (constraint.allowed_codes && !constraint.allowed_codes.includes(code)) {
      const allowedList = constraint.allowed_codes.map((c: string) => {
        const meaning = constraint.code_meanings?.[c];
        return meaning ? `${c}|${meaning}|` : c;
      }).join(", ");
      
      messages.push({
        path,
        message: `Code "${code}" not allowed by RM specification. Allowed values: ${allowedList}`,
        severity: "error",
        constraintType: "rm_specification",
      });
    }
  }
  
  /**
   * Extract code from DV_CODED_TEXT
   */
  private extractCode(codedText: any): string | null {
    // Direct code_string property
    if (codedText.code_string) {
      return codedText.code_string;
    }
    
    // Via defining_code
    if (codedText.defining_code) {
      if (typeof codedText.defining_code === 'string') {
        // Terse format
        const match = codedText.defining_code.match(/::(\d+)/);
        return match ? match[1] : null;
      }
      if (codedText.defining_code.code_string) {
        return codedText.defining_code.code_string;
      }
    }
    
    return null;
  }
  
  /**
   * Extract terminology ID from DV_CODED_TEXT
   */
  private extractTerminologyId(codedText: any): string | null {
    // Direct terminology_id property
    if (codedText.terminology_id) {
      if (typeof codedText.terminology_id === 'string') {
        return codedText.terminology_id;
      }
      if (codedText.terminology_id.value) {
        return codedText.terminology_id.value;
      }
    }
    
    // Via defining_code
    if (codedText.defining_code) {
      if (typeof codedText.defining_code === 'string') {
        // Terse format: "terminology::code"
        const match = codedText.defining_code.match(/^([^:]+)::/);
        return match ? match[1] : null;
      }
      if (codedText.defining_code.terminology_id) {
        if (typeof codedText.defining_code.terminology_id === 'string') {
          return codedText.defining_code.terminology_id;
        }
        if (codedText.defining_code.terminology_id.value) {
          return codedText.defining_code.terminology_id.value;
        }
      }
    }
    
    return null;
  }
  
  /**
   * Get list of all RM constraints for documentation
   */
  static getConstraints(): typeof RM_CONSTRAINTS {
    return RM_CONSTRAINTS;
  }
}
