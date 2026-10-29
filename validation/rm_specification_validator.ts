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

import {
  ancestorsOf,
  attributesFor,
  hasRmType,
  isAbstractType,
  isDataValueType,
  isSubtypeOf,
  type RmAttributeMeta,
} from "../meta/mod.ts";
import { TypeRegistry } from "../serialization/common/type_registry.ts";
import { instructionStateRubric } from "../term/openehr_group_rubrics.ts";
import {
  attributeNamesInExpression,
  evaluateBmmExpression,
} from "./bmm_invariant_eval.ts";
import { BMM_INVARIANTS } from "./bmm_invariants.generated.ts";
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
    allowed_codes: ["431", "433", "451"], // persistent, event, episodic
    code_meanings: {
      "431": "persistent",
      "433": "event",
      "451": "episodic",
    },
    spec_ref:
      "https://specifications.openehr.org/releases/RM/latest/ehr.html#_composition_class",
  },

  // EVENT_CONTEXT.setting - RM 1.1.0 Section 5.1.3
  // https://specifications.openehr.org/releases/RM/latest/ehr.html#_event_context_class
  "EVENT_CONTEXT.setting": {
    type: "coded_text_value_set",
    terminology_id: "openehr",
    allowed_codes: [
      "225",
      "227",
      "228",
      "229",
      "230",
      "231",
      "232",
      "233",
      "234",
      "235",
      "236",
      "237",
      "238",
      "802",
    ],
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
    spec_ref:
      "https://specifications.openehr.org/releases/RM/latest/ehr.html#_event_context_class",
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
    spec_ref:
      "https://specifications.openehr.org/releases/RM/latest/data_types.html#_dv_ordered_class",
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
    spec_ref:
      "https://specifications.openehr.org/releases/RM/latest/common.html#_attestation_class",
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
    spec_ref:
      "https://specifications.openehr.org/releases/RM/latest/common.html#_audit_details_class",
  },

  "DV_TEXT.value": {
    type: "non_empty_string",
    message: "DV_TEXT.value must be a non-empty string",
    spec_ref:
      "https://specifications.openehr.org/releases/RM/latest/data_types.html#_dv_text_class",
  },
  "DV_CODED_TEXT.value": {
    type: "non_empty_string",
    message: "DV_CODED_TEXT.value must be a non-empty string",
    spec_ref:
      "https://specifications.openehr.org/releases/RM/latest/data_types.html#_dv_coded_text_class",
  },
  "DV_URI.value": {
    type: "uri",
    message: "DV_URI.value must be an RFC 3986 URI",
    spec_ref:
      "https://specifications.openehr.org/releases/RM/latest/data_types.html#_dv_uri_class",
  },
  "DV_EHR_URI.value": {
    type: "uri",
    message: "DV_EHR_URI.value must be an RFC 3986 URI",
    spec_ref:
      "https://specifications.openehr.org/releases/RM/latest/data_types.html#_dv_ehr_uri_class",
  },
  "DV_COUNT.magnitude": {
    type: "required",
    message: "DV_COUNT.magnitude is required by RM specification",
    spec_ref:
      "https://specifications.openehr.org/releases/RM/latest/data_types.html#_dv_count_class",
  },
  "DV_QUANTITY.magnitude": {
    type: "required",
    message: "DV_QUANTITY.magnitude is required by RM specification",
    spec_ref:
      "https://specifications.openehr.org/releases/RM/latest/data_types.html#_dv_quantity_class",
  },
  "DV_QUANTITY.units": {
    type: "required",
    message: "DV_QUANTITY.units is required by RM specification",
    spec_ref:
      "https://specifications.openehr.org/releases/RM/latest/data_types.html#_dv_quantity_class",
  },
  "DV_BOOLEAN.value": {
    type: "required",
    message: "DV_BOOLEAN.value is required by RM specification",
    spec_ref:
      "https://specifications.openehr.org/releases/RM/latest/data_types.html#_dv_boolean_class",
  },

  // INTERVAL_EVENT.math_function - RM 1.1.0 Section 4.5.3
  // https://specifications.openehr.org/releases/RM/latest/data_structures.html#_interval_event_class
  "INTERVAL_EVENT.math_function": {
    type: "coded_text_value_set",
    terminology_id: "openehr",
    allowed_codes: [
      "144",
      "145",
      "146",
      "147",
      "148",
      "149",
      "267",
      "268",
      "521",
      "522",
      "640",
    ],
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
    spec_ref:
      "https://specifications.openehr.org/releases/RM/latest/data_structures.html#_interval_event_class",
  },

  // ISM_TRANSITION.current_state - RM 1.1.0 Section 7.3.2
  // https://specifications.openehr.org/releases/RM/latest/ehr.html#_ism_transition_class
  "ISM_TRANSITION.current_state": {
    type: "coded_text_value_set",
    terminology_id: "openehr",
    // Instruction state machine codes (524-533)
    allowed_codes: [
      "245",
      "524",
      "526",
      "527",
      "528",
      "529",
      "530",
      "531",
      "532",
      "533",
    ],
    terminology_group: "instruction_states",
    spec_ref:
      "https://specifications.openehr.org/releases/RM/latest/ehr.html#_ism_transition_class",
  },

  // Required attributes
  // COMPOSITION.language - RM 1.1.0 (openEHR languages code set / ISO 639-1)
  "COMPOSITION.language": {
    type: "required_code_phrase",
    terminology_id: "ISO_639-1",
    codeset: "iso_639_1",
    message: "COMPOSITION.language is required by RM specification",
    spec_ref:
      "https://specifications.openehr.org/releases/RM/latest/ehr.html#_composition_class",
  },

  // COMPOSITION.territory - RM 1.1.0 (openEHR countries / ISO 3166-1)
  "COMPOSITION.territory": {
    type: "required_code_phrase",
    terminology_id: "ISO_3166-1",
    codeset: "iso_3166_1",
    message: "COMPOSITION.territory is required by RM specification",
    spec_ref:
      "https://specifications.openehr.org/releases/RM/latest/ehr.html#_composition_class",
  },

  // COMPOSITION.composer - RM 1.1.0
  "COMPOSITION.composer": {
    type: "required",
    message: "COMPOSITION.composer is required by RM specification",
    spec_ref:
      "https://specifications.openehr.org/releases/RM/latest/ehr.html#_composition_class",
  },

  // ENTRY.subject - RM 1.1.0 (inherited by OBSERVATION, EVALUATION, …)
  "ENTRY.subject": {
    type: "required",
    message: "ENTRY.subject is required by RM specification",
    spec_ref:
      "https://specifications.openehr.org/releases/RM/latest/ehr.html#_entry_class",
  },

  "ENTRY.language": {
    type: "required_code_phrase",
    terminology_id: "ISO_639-1",
    codeset: "iso_639_1",
    message: "ENTRY.language is required by RM specification",
    spec_ref:
      "https://specifications.openehr.org/releases/RM/latest/ehr.html#_entry_class",
  },

  // OBSERVATION.data - RM 1.1.0
  "OBSERVATION.data": {
    type: "required",
    message: "OBSERVATION.data is required by RM specification",
    spec_ref:
      "https://specifications.openehr.org/releases/RM/latest/ehr.html#_observation_class",
  },

  // INSTRUCTION.narrative - RM 1.1.0
  "INSTRUCTION.narrative": {
    type: "required",
    message: "INSTRUCTION.narrative is required by RM specification",
    spec_ref:
      "https://specifications.openehr.org/releases/RM/latest/ehr.html#_instruction_class",
  },

  // ACTION.time - RM 1.1.0
  "ACTION.time": {
    type: "required",
    message: "ACTION.time is required by RM specification",
    spec_ref:
      "https://specifications.openehr.org/releases/RM/latest/ehr.html#_action_class",
  },

  // HISTORY.origin - RM 1.1.0
  "HISTORY.origin": {
    type: "required",
    message: "HISTORY.origin is required by RM specification",
    spec_ref:
      "https://specifications.openehr.org/releases/RM/latest/data_structures.html#_history_class",
  },
};

/**
 * English rubric of an openEHR terminology code that the RM constrains
 * (category, setting, ISM states, …), or undefined.
 */
export function openehrCodeMeaning(code: string): string | undefined {
  const instruction = instructionStateRubric(code);
  if (instruction) return instruction;
  for (const c of Object.values(RM_CONSTRAINTS)) {
    const group = (c as { terminology_group?: string }).terminology_group;
    if (group) continue;
    const meanings = (c as { code_meanings?: Record<string, string> })
      .code_meanings;
    if (meanings?.[code]) return meanings[code];
  }
  return undefined;
}

function rubricForConstraintCode(
  constraint: { terminology_group?: string; code_meanings?: Record<string, string> },
  code: string,
): string | undefined {
  if (constraint.terminology_group === "instruction_states") {
    return instructionStateRubric(code);
  }
  return constraint.code_meanings?.[code];
}

/**
 * Options for {@link RMSpecificationValidator}.
 *
 * `strict` controls attributes that are not in the RM: warnings by default,
 * errors when `strict` is true. It does not change multiplicity or type checks.
 */
export interface RMSpecificationValidatorOptions {
  strict?: boolean;
}

/**
 * Validates instances against RM specification constraints
 */
export class RMSpecificationValidator {
  private enabled: boolean;
  private strict: boolean;

  constructor(
    enabled: boolean = true,
    options?: RMSpecificationValidatorOptions,
  ) {
    this.enabled = enabled;
    this.strict = options?.strict === true;
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
    path: string,
  ): ValidationMessage[] {
    if (!this.enabled) {
      return [];
    }

    const messages: ValidationMessage[] = [];
    const constraintKey = `${rmTypeName}.${attributeName}`;
    const constraint =
      RM_CONSTRAINTS[constraintKey as keyof typeof RM_CONSTRAINTS];

    if (!constraint) {
      return messages;
    }
    this.applyConstraint(rmValue, constraint, constraintKey, path, messages);
    return messages;
  }

  /**
   * Walk a canonical RM instance (including attributes the OPT does not
   * constrain) and apply RM_CONSTRAINTS for the value's type and ancestors.
   *
   * The RM type is `_type` when present, otherwise the type-registry class
   * name. Attributes are read by BMM name so getter-backed fields count.
   * Required-attribute checks run for data values and for any other object
   * that has a resolved RM type plus at least one non-identity attribute.
   * Skeletal identity stubs still skip required checks.
   */
  validateInstance(
    rmValue: unknown,
    rmType?: string,
    path = "/",
  ): ValidationMessage[] {
    if (!this.enabled) return [];
    const messages: ValidationMessage[] = [];
    this.walkInstance(rmValue, rmType, path, messages, 0);
    return messages;
  }

  private applyConstraint(
    rmValue: unknown,
    constraint: Record<string, unknown>,
    constraintKey: string,
    path: string,
    messages: ValidationMessage[],
    options?: { skipRequired?: boolean },
  ): void {
    const type = constraint.type;
    if (type === "coded_text_value_set") {
      this.validateCodedTextValueSet(rmValue, constraint, path, messages);
      return;
    }
    if (type === "required" || type === "required_code_phrase") {
      if (
        !options?.skipRequired &&
        (rmValue === undefined || rmValue === null)
      ) {
        messages.push({
          path,
          message: (constraint.message as string) ||
            `${constraintKey} is required`,
          severity: "error",
          constraintType: "rm_specification",
        });
      }
      if (type === "required_code_phrase" && rmValue != null) {
        this.validateCodePhraseCodeset(rmValue, constraint, path, messages);
      }
      return;
    }
    if (type === "non_empty_string") {
      const empty = rmValue === undefined || rmValue === null ||
        (typeof rmValue === "string" && rmValue.length === 0);
      if (empty) {
        messages.push({
          path,
          message: (constraint.message as string) ||
            `${constraintKey} must not be empty`,
          severity: "error",
          constraintType: "rm_invariant",
        });
      }
      return;
    }
    if (type === "uri") {
      if (
        typeof rmValue === "string" && rmValue.length > 0 &&
        !isRfc3986Uri(rmValue)
      ) {
        messages.push({
          path,
          message: (constraint.message as string) ||
            `${constraintKey} is not a valid URI`,
          severity: "error",
          constraintType: "rm_schema",
        });
      }
    }
  }

  private walkInstance(
    rmValue: unknown,
    rmType: string | undefined,
    path: string,
    messages: ValidationMessage[],
    depth: number,
  ): void {
    if (depth > 80 || rmValue == null) return;
    if (Array.isArray(rmValue)) {
      const itemType = unwrapRmTypeName(rmType);
      rmValue.forEach((item, i) => {
        const itemPath = `${stripTrailingSlash(path)}[${i}]/`;
        const inferred = instanceRmType(item) ?? itemType;
        this.walkInstance(item, inferred, itemPath, messages, depth + 1);
      });
      return;
    }
    if (typeof rmValue !== "object") return;

    const rec = rmValue as Record<string, unknown>;
    const type = instanceRmType(rec) ?? rmType;
    if (type) {
      this.applyConstraintsForType(rec, type, path, messages);
    }
    if (type && hasRmType(type)) {
      this.applyStructure(rec, type, path, messages, depth);
      return;
    }
    this.walkUntypedChildren(rec, path, messages, depth);
  }

  /**
   * BMM multiplicity, value types, and attributes that are not in the model.
   * Recurses through BMM attribute names (getters included), not Object.entries.
   */
  private applyStructure(
    rmValue: Record<string, unknown>,
    rmType: string,
    path: string,
    messages: ValidationMessage[],
    depth: number,
  ): void {
    const attrs = attributesFor(rmType);
    const known = new Set(attrs.map((attr) => attr.name));
    const skipRequired = !shouldCheckRequired(rmValue, rmType);

    for (const key of ownPublicKeys(rmValue)) {
      if (known.has(key)) continue;
      const val = rmValue[key];
      if (typeof val === "function") continue;
      messages.push({
        path: joinRmPath(path, key),
        message:
          `${rmType}.${key} is not an attribute of the reference model`,
        severity: this.strict ? "error" : "warning",
        constraintType: "rm_schema",
      });
      if (val && typeof val === "object") {
        this.walkInstance(
          val,
          instanceRmType(val),
          joinRmPath(path, key),
          messages,
          depth + 1,
        );
      }
    }

    if (isSubtypeOf(rmType, "ENTRY")) {
      this.checkEntryEncoding(rmValue, path, messages);
    }

    for (const attr of attrs) {
      const value = readAttribute(rmValue, attr.name);
      const attrPath = joinRmPath(path, attr.name);
      const present = isPresentValue(value);
      if (
        !skipRequired && attributeIsMandatory(attr) && !present &&
        !rmConstraintCoversAbsence(rmType, attr.name)
      ) {
        messages.push({
          path: attrPath,
          message:
            `${attr.declaredIn}.${attr.name} is required by RM specification`,
          severity: "error",
          constraintType: "rm_specification",
        });
      }
      if (!present) continue;
      this.walkAttribute(value, attr, attrPath, messages, depth, skipRequired);
    }
  }

  private walkUntypedChildren(
    rmValue: Record<string, unknown>,
    path: string,
    messages: ValidationMessage[],
    depth: number,
  ): void {
    for (const [key, val] of Object.entries(rmValue)) {
      if (key === "_type" || key === "_parent" || key === "parent") continue;
      if (val == null || typeof val === "function") continue;
      if (typeof val !== "object") continue;
      this.walkInstance(
        val,
        instanceRmType(val),
        joinRmPath(path, key),
        messages,
        depth + 1,
      );
    }
  }

  private walkAttribute(
    value: unknown,
    attr: RmAttributeMeta,
    path: string,
    messages: ValidationMessage[],
    depth: number,
    skipRequired: boolean,
  ): void {
    const container = containerKind(attr.typeName);
    if (container?.kind === "list") {
      if (!Array.isArray(value)) {
        messages.push(typeMessage(
          path,
          `must be a ${attr.typeName}, got ${valueKind(value)}`,
        ));
        return;
      }
      if (
        !skipRequired && attr.multiplicity.min > 0 &&
        value.length < attr.multiplicity.min
      ) {
        messages.push({
          path,
          message:
            `${attr.declaredIn}.${attr.name} must contain at least ${attr.multiplicity.min} item(s)`,
          severity: "error",
          constraintType: "rm_specification",
        });
      }
      value.forEach((item, i) => {
        const itemPath = `${stripTrailingSlash(path)}[${i}]/`;
        if (
          !this.acceptsTypedValue(
            item,
            container.itemType,
            itemPath,
            messages,
          )
        ) return;
        const next = instanceRmType(item) ?? container.itemType;
        this.walkInstance(item, next, itemPath, messages, depth + 1);
      });
      return;
    }
    if (container?.kind === "hash") {
      if (value === null || typeof value !== "object" || Array.isArray(value)) {
        messages.push(typeMessage(
          path,
          `must be a ${attr.typeName}, got ${valueKind(value)}`,
        ));
        return;
      }
      for (const [hashKey, item] of Object.entries(value)) {
        const itemPath = joinRmPath(path, hashKey);
        if (
          !this.acceptsTypedValue(item, container.valueType, itemPath, messages)
        ) continue;
        if (item && typeof item === "object") {
          this.walkInstance(
            item,
            instanceRmType(item) ?? container.valueType,
            itemPath,
            messages,
            depth + 1,
          );
        }
      }
      return;
    }

    if (!this.acceptsTypedValue(value, attr.typeName, path, messages)) return;
    if (value && typeof value === "object" && !isPrimitiveBmmType(rootTypeName(attr.typeName))) {
      const declared = rootTypeName(attr.typeName);
      const next = instanceRmType(value) ??
        (hasRmType(declared) ? declared : undefined);
      this.walkInstance(value, next, path, messages, depth + 1);
    }
  }

  /**
   * @returns false when the value is the wrong kind and must not be walked
   * as the declared type.
   */
  private acceptsTypedValue(
    value: unknown,
    typeName: string,
    path: string,
    messages: ValidationMessage[],
  ): boolean {
    const expected = rootTypeName(typeName);
    if (!expected || isOpenTypeName(expected)) return true;
    if (isPrimitiveBmmType(expected)) {
      if (!valueMatchesPrimitive(value, expected)) {
        messages.push(typeMessage(
          path,
          `must be a ${expected}, got ${valueKind(value)}`,
        ));
        return false;
      }
      return false;
    }
    if (!hasRmType(expected)) return true;
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
      messages.push(typeMessage(
        path,
        `must be a ${expected}, got ${valueKind(value)}`,
      ));
      return false;
    }
    const actual = instanceRmType(value);
    if (actual) {
      if (actual === expected || isSubtypeOf(actual, expected)) return true;
      messages.push(typeMessage(
        path,
        `must be a ${expected} or subtype, got ${actual}`,
      ));
      return false;
    }
    if (isAbstractType(expected)) {
      messages.push(typeMessage(
        path,
        `must be a ${expected} or subtype`,
      ));
      return false;
    }
    return true;
  }

  /** ENTRY.encoding is coded from the openEHR character-sets code set. */
  private checkEntryEncoding(
    rmValue: Record<string, unknown>,
    path: string,
    messages: ValidationMessage[],
  ): void {
    const encoding = readAttribute(rmValue, "encoding");
    if (!isPresentValue(encoding)) return;
    const terminology = terminologyIdOf(encoding);
    if (!terminology || terminology === IANA_CHARACTER_SETS) return;
    messages.push({
      path: joinRmPath(path, "encoding"),
      message:
        `ENTRY.encoding terminology_id must be "${IANA_CHARACTER_SETS}", not "${terminology}"`,
      severity: "error",
      constraintType: "rm_specification",
    });
  }

  private applyConstraintsForType(
    rmValue: Record<string, unknown>,
    rmType: string,
    path: string,
    messages: ValidationMessage[],
  ): void {
    const skipRequired = !shouldCheckRequired(rmValue, rmType);
    const owners = new Set(ancestorsOf(rmType));
    owners.add(rmType);
    const coveredByBmm = this.applyBmmInvariants(
      rmValue,
      owners,
      path,
      messages,
    );
    for (const [key, constraint] of Object.entries(RM_CONSTRAINTS)) {
      const dot = key.indexOf(".");
      if (dot < 0) continue;
      const owner = key.slice(0, dot);
      const attr = key.slice(dot + 1);
      if (!owners.has(owner) && !isSubtypeOf(rmType, owner)) continue;
      // DV_CODED_TEXT inherits DV_TEXT.value; report once on the concrete type.
      if (owner === "DV_TEXT" && isSubtypeOf(rmType, "DV_CODED_TEXT")) {
        continue;
      }
      if (coveredByBmm.has(key)) continue;
      this.applyConstraint(
        readAttribute(rmValue, attr),
        constraint as Record<string, unknown>,
        key,
        joinRmPath(path, attr),
        messages,
        { skipRequired },
      );
    }
  }

  /**
   * RM and BASE class invariants from the generated BMM catalogue, including
   * ancestors. AM and LANG rows stay in the catalogue and are not applied here.
   * A conclusive result replaces the hand-written RM_CONSTRAINTS entry for the
   * same class attribute.
   */
  private applyBmmInvariants(
    rmValue: Record<string, unknown>,
    owners: Set<string>,
    path: string,
    messages: ValidationMessage[],
  ): Set<string> {
    const covered = new Set<string>();
    for (const row of BMM_INVARIANTS) {
      if (row.schema !== "rm" && row.schema !== "base") continue;
      if (!owners.has(row.className)) continue;
      if (!row.expression.trim()) continue;
      // Offset is optional on instances until a CDR or generator sets it.
      if (row.className === "EVENT" && row.name === "Offset_validity1") {
        const offset = (rmValue as Record<string, unknown>).offset;
        if (offset == null || typeof offset === "function") {
          continue;
        }
      }
      const result = evaluateBmmExpression(row.expression, rmValue);
      if (result === undefined) continue;
      for (const name of attributeNamesInExpression(row.expression)) {
        covered.add(`${row.className}.${name}`);
      }
      if (!result) {
        messages.push({
          path,
          message: `${row.className}.${row.name} failed: ${row.expression}`,
          severity: "error",
          constraintType: "rm_invariant",
        });
      }
    }
    return covered;
  }

  private validateCodePhraseCodeset(
    rmValue: unknown,
    constraint: Record<string, unknown>,
    path: string,
    messages: ValidationMessage[],
  ): void {
    const code = typeof rmValue === "string"
      ? (rmValue.match(/::([^|]+)/)?.[1] ?? rmValue)
      : this.extractCode(rmValue);
    if (!code) return;
    const codeset = constraint.codeset;
    if (codeset === "iso_639_1" && !isIso6391Language(code)) {
      messages.push({
        path,
        message: `Language code "${code}" is not a valid ISO 639-1 code (see ${
          constraint.spec_ref ?? "RM COMPOSITION.language"
        })`,
        severity: "error",
        constraintType: "rm_specification",
      });
    }
    if (codeset === "iso_3166_1" && !isIso3166Region(code)) {
      messages.push({
        path,
        message:
          `Territory code "${code}" is not a valid ISO 3166-1 alpha-2 code (see ${
            constraint.spec_ref ?? "RM COMPOSITION.territory"
          })`,
        severity: "error",
        constraintType: "rm_specification",
      });
    }
  }

  /**
   * Validate coded text against a value set
   */
  private validateCodedTextValueSet(
    rmValue: any,
    constraint: any,
    path: string,
    messages: ValidationMessage[],
  ): void {
    if (!rmValue) {
      return;
    }

    // Handle terse string format: "terminology::code|value|"
    if (typeof rmValue === "string") {
      const match = rmValue.match(/^([^:]+)::(\w+)\|?([^|]*)?\|?$/);
      if (match) {
        const [, terminology, code] = match;
        this.checkCodeValue(terminology, code, constraint, path, messages);
        return;
      }
    }

    // Handle DV_CODED_TEXT object
    if (typeof rmValue === "object") {
      const code = this.extractCode(rmValue);
      const terminology = this.extractTerminologyId(rmValue);

      if (code && terminology) {
        this.checkCodeValue(terminology, code, constraint, path, messages);
        if (
          constraint.terminology_group === "instruction_states" &&
          typeof rmValue.value === "string" && rmValue.value.length > 0
        ) {
          const expected = instructionStateRubric(code);
          if (expected && rmValue.value !== expected) {
            messages.push({
              path: `${path}/value`,
              message:
                `DV_CODED_TEXT.value must be the openEHR instruction-state rubric "${expected}" for code ${code}, not "${rmValue.value}"`,
              severity: "error",
              constraintType: "rm_specification",
            });
          }
        }
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
    messages: ValidationMessage[],
  ): void {
    // Check terminology ID matches
    if (
      constraint.terminology_id && terminology !== constraint.terminology_id
    ) {
      messages.push({
        path,
        message:
          `Terminology ID "${terminology}" does not match required "${constraint.terminology_id}"`,
        severity: "error",
        constraintType: "rm_specification",
      });
      return;
    }

    // Check code is in allowed list
    if (constraint.allowed_codes && !constraint.allowed_codes.includes(code)) {
      const allowedList = constraint.allowed_codes.map((c: string) => {
        const meaning = rubricForConstraintCode(constraint, c);
        return meaning ? `${c}|${meaning}|` : c;
      }).join(", ");

      const specRef = constraint.spec_ref
        ? ` (see ${constraint.spec_ref})`
        : "";

      messages.push({
        path,
        message:
          `Code "${code}" not allowed by RM specification. Allowed values: ${allowedList}${specRef}`,
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
      if (typeof codedText.defining_code === "string") {
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
      if (typeof codedText.terminology_id === "string") {
        return codedText.terminology_id;
      }
      if (codedText.terminology_id.value) {
        return codedText.terminology_id.value;
      }
    }

    // Via defining_code
    if (codedText.defining_code) {
      if (typeof codedText.defining_code === "string") {
        // Terse format: "terminology::code"
        const match = codedText.defining_code.match(/^([^:]+)::/);
        return match ? match[1] : null;
      }
      if (codedText.defining_code.terminology_id) {
        if (typeof codedText.defining_code.terminology_id === "string") {
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

function isRfc3986Uri(value: string): boolean {
  if (!/^[A-Za-z][A-Za-z0-9+.-]*:/.test(value)) return false;
  if (/[\s<>"{}|\\^`]/.test(value)) return false;
  try {
    if (/^https?:/i.test(value)) {
      const url = new URL(value);
      return Boolean(url.host);
    }
  } catch {
    return false;
  }
  return true;
}

const IDENTITY_KEYS = new Set([
  "_type",
  "name",
  "archetype_node_id",
  "archetype_details",
  "uid",
]);

function shouldCheckRequired(
  rmValue: Record<string, unknown>,
  rmType?: string,
): boolean {
  const type = instanceRmType(rmValue) ?? rmType ?? "";
  if (!type || !hasRmType(type)) return false;
  if (isDataValueType(type)) return true;
  return hasNonIdentityContent(rmValue, type);
}

/** openEHR code-set external id for character encodings (ENTRY.encoding). */
const IANA_CHARACTER_SETS = "IANA_character-sets";

const PRIMITIVE_BMM_TYPES = new Set([
  "String",
  "Integer",
  "Integer64",
  "Real",
  "Double",
  "Boolean",
  "Character",
  "Octet",
  "Byte",
  "Uri",
  "Numeric",
  "Ordered_Numeric",
  "Iso8601_date",
  "Iso8601_time",
  "Iso8601_date_time",
  "Iso8601_duration",
]);

function instanceRmType(value: unknown): string | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }
  const rec = value as Record<string, unknown>;
  if (typeof rec._type === "string" && rec._type.length > 0) return rec._type;
  const ctor = (value as object).constructor;
  if (typeof ctor !== "function" || ctor === Object) return undefined;
  const name = TypeRegistry.getTypeNameFromInstance(value);
  if (!name || name === "OBJECT" || name === "ARRAY") return undefined;
  return name;
}

function readAttribute(obj: object, name: string): unknown {
  try {
    const value = (obj as Record<string, unknown>)[name];
    if (typeof value === "function") return undefined;
    return value;
  } catch {
    return undefined;
  }
}

function ownPublicKeys(obj: object): string[] {
  return Object.keys(obj).filter((key) =>
    key !== "_type" && !key.startsWith("_") && !key.startsWith("$")
  );
}

function isPresentValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "function") return false;
  return true;
}

function hasNonIdentityContent(
  obj: Record<string, unknown>,
  type: string,
): boolean {
  for (const attr of attributesFor(type)) {
    if (IDENTITY_KEYS.has(attr.name)) continue;
    if (isPresentValue(readAttribute(obj, attr.name))) return true;
  }
  for (const key of ownPublicKeys(obj)) {
    if (IDENTITY_KEYS.has(key)) continue;
    if (typeof obj[key] === "function") continue;
    if (isPresentValue(obj[key])) return true;
  }
  return false;
}

function attributeIsMandatory(attr: RmAttributeMeta): boolean {
  return attr.mandatory || attr.multiplicity.min >= 1;
}

function rmConstraintCoversAbsence(rmType: string, attrName: string): boolean {
  const owners = new Set(ancestorsOf(rmType));
  owners.add(rmType);
  for (const [key, constraint] of Object.entries(RM_CONSTRAINTS)) {
    const dot = key.indexOf(".");
    if (dot < 0) continue;
    const owner = key.slice(0, dot);
    const name = key.slice(dot + 1);
    if (name !== attrName) continue;
    if (!owners.has(owner) && !isSubtypeOf(rmType, owner)) continue;
    const kind = (constraint as { type?: string }).type;
    if (
      kind === "required" || kind === "required_code_phrase" ||
      kind === "non_empty_string"
    ) {
      return true;
    }
  }
  return false;
}

function terminologyIdOf(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value.match(/^([^:]+)::/)?.[1];
  }
  if (!value || typeof value !== "object") return undefined;
  const rec = value as Record<string, unknown>;
  const direct = rec.terminology_id ?? rec.terminologyId;
  if (typeof direct === "string") return direct;
  if (direct && typeof direct === "object") {
    const inner = (direct as { value?: unknown }).value;
    if (typeof inner === "string") return inner;
  }
  return undefined;
}

type ContainerInfo =
  | { kind: "list"; itemType: string }
  | { kind: "hash"; valueType: string };

function containerKind(typeName: string): ContainerInfo | undefined {
  const parsed = splitGeneric(typeName);
  if (!parsed) return undefined;
  if (
    parsed.base === "List" || parsed.base === "Set" || parsed.base === "Array"
  ) {
    return { kind: "list", itemType: rootTypeName(parsed.args[0] ?? "") };
  }
  if (parsed.base === "Hash") {
    return {
      kind: "hash",
      valueType: rootTypeName(parsed.args[1] ?? parsed.args[0] ?? ""),
    };
  }
  return undefined;
}

function rootTypeName(typeName: string): string {
  const trimmed = typeName.trim();
  const parsed = splitGeneric(trimmed);
  if (!parsed) return trimmed;
  if (
    parsed.base === "List" || parsed.base === "Set" ||
    parsed.base === "Array" || parsed.base === "Hash"
  ) {
    const arg = parsed.base === "Hash"
      ? (parsed.args[1] ?? parsed.args[0] ?? "")
      : (parsed.args[0] ?? "");
    return rootTypeName(arg);
  }
  return parsed.base;
}

function splitGeneric(
  typeName: string,
): { base: string; args: string[] } | undefined {
  const lt = typeName.indexOf("<");
  if (lt < 0) return undefined;
  const gt = typeName.lastIndexOf(">");
  if (gt < lt) return undefined;
  const inner = typeName.slice(lt + 1, gt);
  const args: string[] = [];
  let depth = 0;
  let cur = "";
  for (const ch of inner) {
    if (ch === "<") depth++;
    else if (ch === ">") depth--;
    if (ch === "," && depth === 0) {
      args.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  if (cur.trim()) args.push(cur.trim());
  return { base: typeName.slice(0, lt).trim(), args };
}

function isOpenTypeName(typeName: string): boolean {
  return typeName === "Any" || typeName === "T";
}

function isPrimitiveBmmType(typeName: string): boolean {
  return PRIMITIVE_BMM_TYPES.has(typeName);
}

function valueMatchesPrimitive(value: unknown, typeName: string): boolean {
  switch (typeName) {
    case "Boolean":
      return typeof value === "boolean";
    case "Integer":
    case "Integer64":
    case "Byte":
    case "Octet":
      return typeof value === "number" && Number.isInteger(value);
    case "Real":
    case "Double":
    case "Numeric":
    case "Ordered_Numeric":
      return typeof value === "number" && Number.isFinite(value);
    default:
      return typeof value === "string";
  }
}

function valueKind(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

function typeMessage(path: string, detail: string): ValidationMessage {
  return {
    path,
    message: detail,
    severity: "error",
    constraintType: "rm_type",
  };
}

function joinRmPath(path: string, attr: string): string {
  if (!path || path === "/") return `/${attr}/`;
  return path.endsWith("/") ? `${path}${attr}/` : `${path}/${attr}/`;
}

function stripTrailingSlash(path: string): string {
  return path.endsWith("/") ? path.slice(0, -1) : path;
}

function unwrapRmTypeName(typeName: string | undefined): string | undefined {
  if (!typeName) return undefined;
  const list = typeName.match(/^(?:List|Set|Array)<(.+)>$/);
  if (list) return unwrapRmTypeName(list[1]);
  const generic = typeName.match(/^([^<]+)</);
  if (generic) return generic[1];
  return typeName;
}

/** User-assigned / private-use tags used as invalid fixtures (not real languages). */
const INVALID_ISO_639_1 = new Set(["zz", "xx", "qq"]);
const INVALID_ISO_3166_1 = new Set(["ZZ", "XX", "AA", "QZ", "QM", "XA", "XZ"]);

export function isIso6391Language(code: string): boolean {
  const normalized = code.trim().toLowerCase();
  if (!/^[a-z]{2}$/.test(normalized)) return false;
  if (INVALID_ISO_639_1.has(normalized)) return false;
  try {
    const name = new Intl.DisplayNames(["en"], { type: "language" }).of(
      normalized,
    );
    return Boolean(name && name !== normalized && !/^unknown/i.test(name));
  } catch {
    return false;
  }
}

export function isIso3166Region(code: string): boolean {
  const normalized = code.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalized)) return false;
  if (INVALID_ISO_3166_1.has(normalized)) return false;
  try {
    const name = new Intl.DisplayNames(["en"], { type: "region" }).of(
      normalized,
    );
    return Boolean(name && name !== normalized && !/^unknown/i.test(name));
  } catch {
    return false;
  }
}
