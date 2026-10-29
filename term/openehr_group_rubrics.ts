/**
 * Group-aware openEHR terminology rubrics (English).
 *
 * Instruction-state codes are group-specific (SPECPR-51): e.g. 532 is
 * "completed" in `instruction_states`, not "complete" from other groups.
 *
 * The rubrics are embedded rather than read from
 * `terminology_data/openehr_terminology_en.xml` at runtime, so this module
 * also works in browsers (no file system access). A test checks them against
 * the XML file.
 */

type GroupMap = ReadonlyMap<string, string>;

export const INSTRUCTION_STATES_GROUP = "instruction_states";

const GROUPS: ReadonlyMap<string, GroupMap> = new Map([
  [
    INSTRUCTION_STATES_GROUP,
    new Map([
      ["524", "initial"],
      ["526", "planned"],
      ["527", "postponed"],
      ["528", "cancelled"],
      ["529", "scheduled"],
      ["245", "active"],
      ["530", "suspended"],
      ["531", "aborted"],
      ["532", "completed"],
      ["533", "expired"],
    ]),
  ],
]);

/** Group ids whose rubrics are embedded in this module. */
export function embeddedOpenEhrGroupIds(): string[] {
  return [...GROUPS.keys()];
}

/** Rubric for a code within an embedded openEHR terminology group (English). */
export function openEhrGroupRubric(
  groupId: string,
  code: string,
): string | undefined {
  return GROUPS.get(groupId)?.get(code);
}

export function instructionStateRubric(code: string): string | undefined {
  return openEhrGroupRubric(INSTRUCTION_STATES_GROUP, code);
}

/** All instruction-state codes defined in the English terminology file. */
export function instructionStateCodes(): string[] {
  const group = GROUPS.get(INSTRUCTION_STATES_GROUP);
  return group ? [...group.keys()] : [];
}
