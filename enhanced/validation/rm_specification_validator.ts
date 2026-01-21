/**
 * RM Specification Validator
 * 
 * Validates instances against openEHR Reference Model specification constraints.
 * These are constraints defined in the RM specification itself, not in archetypes.
 * 
 * References:
 * - openEHR RM Specification: https://specifications.openehr.org/releases/RM/latest/
 * - openEHR Terminology: https://specifications.openehr.org/releases/TERM/latest/SupportTerminology.html
 * - Archie implementation: https://github.com/openEHR/archie
 */

import type { ValidationMessage } from "./template_validator.ts";

/**
 * RM specification constraints knowledge base
 * 
 * Based on openEHR RM specification and internal terminology.
 * Sources: Archie's RMObjectValidator, openEHR terminology XML files
 */
const RM_CONSTRAINTS = {
  // COMPOSITION.category - RM 1.1.0 Section 5.1.2
  // https://specifications.openehr.org/releases/RM/latest/ehr.html#_composition_class
  "COMPOSITION.category": {
    type: "coded_text_value_set",
    terminology_id: "openehr",
    allowed_codes: ["431", "433", "451"],  // persistent, event, episodic
    code_meanings: {
      "431": "persistent",
      "433": "event",
      "451": "episodic",
    },
    spec_ref: "https://specifications.openehr.org/releases/RM/latest/ehr.html#_composition_class",
  },
  
  // EVENT_CONTEXT.setting - RM 1.1.0 Section 5.1.3
  // https://specifications.openehr.org/releases/RM/latest/ehr.html#_event_context_class
  "EVENT_CONTEXT.setting": {
    type: "coded_text_value_set",
    terminology_id: "openehr",
    allowed_codes: ["225", "227", "228", "229", "230", "231", "232", "233", "234", "235", "236", "237", "238", "802"],
    code_meanings: {
      "225": "home",
      "227": "emergency care",
      "228": "primary medical care",
      "229": "primary nursing care",
      "230": "primary allied health care",
      "231": "midwifery care",
      "232": "secondary medical care",
      "233": "secondary nursing care",
      "234": "secondary allied health care",
      "235": "complementary health care",
      "236": "dental care",
      "237": "nursing home care",
      "238": "other care",
      "802": "mental healthcare",
    },
    spec_ref: "https://specifications.openehr.org/releases/RM/latest/ehr.html#_event_context_class",
  },
  
  // DV_ORDERED.normal_status - RM 1.1.0 Section 8.2.1
  // https://specifications.openehr.org/releases/RM/latest/data_types.html#_dv_ordered_class
  "DV_ORDERED.normal_status": {
    type: "coded_text_value_set",
    terminology_id: "openehr",
    allowed_codes: ["HHH", "HH", "H", "N", "L", "LL", "LLL"],
    code_meanings: {
      "HHH": "critically high",
      "HH": "very high",
      "H": "high",
      "N": "normal",
      "L": "low",
      "LL": "very low",
      "LLL": "critically low",
    },
    spec_ref: "https://specifications.openehr.org/releases/RM/latest/data_types.html#_dv_ordered_class",
  },
  
  // ATTESTATION.reason - RM 1.1.0 Section 10.3.2
  // https://specifications.openehr.org/releases/RM/latest/common.html#_attestation_class
  "ATTESTATION.reason": {
    type: "coded_text_value_set",
    terminology_id: "openehr",
    allowed_codes: ["240", "648"],
    code_meanings: {
      "240": "signed",
      "648": "witnessed",
    },
    spec_ref: "https://specifications.openehr.org/releases/RM/latest/common.html#_attestation_class",
  },
  
  // AUDIT_DETAILS.change_type - RM 1.1.0 Section 10.3.1
  // https://specifications.openehr.org/releases/RM/latest/common.html#_audit_details_class
  "AUDIT_DETAILS.change_type": {
    type: "coded_text_value_set",
    terminology_id: "openehr",
    allowed_codes: ["249", "250", "251", "252", "253", "523", "666"],
    code_meanings: {
      "249": "creation",
      "250": "amendment",
      "251": "modification",
      "252": "synthesis",
      "253": "unknown",
      "523": "deleted",
      "666": "attestation",
    },
    spec_ref: "https://specifications.openehr.org/releases/RM/latest/common.html#_audit_details_class",
  },
  
  // INTERVAL_EVENT.math_function - RM 1.1.0 Section 4.5.3
  // https://specifications.openehr.org/releases/RM/latest/data_structures.html#_interval_event_class
  "INTERVAL_EVENT.math_function": {
    type: "coded_text_value_set",
    terminology_id: "openehr",
    allowed_codes: ["144", "145", "146", "147", "148", "149", "267", "268", "521", "522", "640"],
    code_meanings: {
      "144": "maximum",
      "145": "minimum",
      "146": "mean",
      "147": "change",
      "148": "total",
      "149": "variation",
      "267": "mode",
      "268": "median",
      "521": "decrease",
      "522": "increase",
      "640": "actual",
    },
    spec_ref: "https://specifications.openehr.org/releases/RM/latest/data_structures.html#_interval_event_class",
  },
  
  // ISM_TRANSITION.current_state - RM 1.1.0 Section 7.3.2
  // https://specifications.openehr.org/releases/RM/latest/ehr.html#_ism_transition_class
  "ISM_TRANSITION.current_state": {
    type: "coded_text_value_set",
    terminology_id: "openehr",
    // Instruction state machine codes (524-533)
    allowed_codes: ["245", "524", "526", "527", "528", "529", "530", "531", "532", "533"],
    code_meanings: {
      "245": "active",
      "524": "initial",
      "526": "planned",
      "527": "postponed",
      "528": "cancelled",
      "529": "scheduled",
      "530": "active",
      "531": "suspended",
      "532": "aborted",
      "533": "completed",
    },
    spec_ref: "https://specifications.openehr.org/releases/RM/latest/ehr.html#_ism_transition_class",
  },
  
  // Required attributes
  // COMPOSITION.language - RM 1.1.0
  "COMPOSITION.language": {
    type: "required",
    message: "COMPOSITION.language is required by RM specification",
    spec_ref: "https://specifications.openehr.org/releases/RM/latest/ehr.html#_composition_class",
  },
  
  // COMPOSITION.territory - RM 1.1.0
  "COMPOSITION.territory": {
    type: "required",
    message: "COMPOSITION.territory is required by RM specification",
    spec_ref: "https://specifications.openehr.org/releases/RM/latest/ehr.html#_composition_class",
  },
  
  // COMPOSITION.composer - RM 1.1.0
  "COMPOSITION.composer": {
    type: "required",
    message: "COMPOSITION.composer is required by RM specification",
    spec_ref: "https://specifications.openehr.org/releases/RM/latest/ehr.html#_composition_class",
  },
  
  // OBSERVATION.data - RM 1.1.0
  "OBSERVATION.data": {
    type: "required",
    message: "OBSERVATION.data is required by RM specification",
    spec_ref: "https://specifications.openehr.org/releases/RM/latest/ehr.html#_observation_class",
  },
  
  // INSTRUCTION.narrative - RM 1.1.0
  "INSTRUCTION.narrative": {
    type: "required",
    message: "INSTRUCTION.narrative is required by RM specification",
    spec_ref: "https://specifications.openehr.org/releases/RM/latest/ehr.html#_instruction_class",
  },
  
  // ACTION.time - RM 1.1.0
  "ACTION.time": {
    type: "required",
    message: "ACTION.time is required by RM specification",
    spec_ref: "https://specifications.openehr.org/releases/RM/latest/ehr.html#_action_class",
  },
  
  // HISTORY.origin - RM 1.1.0
  "HISTORY.origin": {
    type: "required",
    message: "HISTORY.origin is required by RM specification",
    spec_ref: "https://specifications.openehr.org/releases/RM/latest/data_structures.html#_history_class",
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
      const match = rmValue.match(/^([^:]+)::(\w+)\|?([^|]*)?\|?$/);
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
      
      const specRef = constraint.spec_ref ? ` (see ${constraint.spec_ref})` : "";
      
      messages.push({
        path,
        message: `Code "${code}" not allowed by RM specification. Allowed values: ${allowedList}${specRef}`,
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
        const match = codedText.defining_code.match(/::(\w+)/);
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
