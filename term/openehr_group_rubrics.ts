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
export const SETTING_GROUP = "setting";
export const COMPOSITION_CATEGORY_GROUP = "composition_category";

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
  [
    SETTING_GROUP,
    new Map([
      ["225", "home"],
      ["227", "emergency care"],
      ["228", "primary medical care"],
      ["229", "primary nursing care"],
      ["230", "primary allied health care"],
      ["231", "midwifery care"],
      ["232", "secondary medical care"],
      ["233", "secondary nursing care"],
      ["234", "secondary allied health care"],
      ["235", "complementary health care"],
      ["236", "dental care"],
      ["237", "nursing home care"],
      ["802", "mental healthcare"],
      ["238", "other care"],
    ]),
  ],
  [
    COMPOSITION_CATEGORY_GROUP,
    new Map([
      ["431", "persistent"],
      ["451", "episodic"],
      ["433", "event"],
      ["815", "report"],
    ]),
  ],
]);

/** Codes of an embedded openEHR group, in terminology file order. */
export function openEhrGroupCodes(groupId: string): string[] {
  const group = GROUPS.get(groupId);
  return group ? [...group.keys()] : [];
}

/** Code for an English rubric within an embedded openEHR group. */
export function openEhrGroupCode(
  groupId: string,
  rubric: string,
): string | undefined {
  for (const [code, text] of GROUPS.get(groupId) ?? []) {
    if (text === rubric) return code;
  }
  return undefined;
}

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
