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
export const PARTICIPATION_MODE_GROUP = "participation_mode";

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
  [
    PARTICIPATION_MODE_GROUP,
    new Map([
      ["193", "not specified"],
      ["216", "face-to-face communication"],
      ["223", "interpreted face-to-face communication"],
      ["217", "signing (face-to-face)"],
      ["195", "live audiovisual; videoconference; videophone"],
      ["198", "videoconferencing"],
      ["197", "videophone"],
      ["218", "signing over video"],
      ["224", "interpreted video communication"],
      ["194", "asynchronous audiovisual; recorded video"],
      ["196", "recorded video"],
      ["202", "live audio-only; telephone; internet phone; teleconference"],
      ["204", "telephone"],
      ["203", "teleconference"],
      ["205", "internet telephone"],
      ["222", "interpreted audio-only"],
      ["199", "asynchronous audio-only; dictated; voice mail"],
      ["200", "dictated"],
      ["201", "voice-mail"],
      ["212", "live text-only; internet chat; SMS chat; interactive written note"],
      ["213", "internet chat"],
      ["214", "SMS chat"],
      ["215", "interactive written note"],
      ["206", "asynchronous text; email; fax; letter; handwritten note; SMS message"],
      ["211", "handwritten note"],
      ["210", "printed/typed letter"],
      ["207", "email"],
      ["208", "facsimile/telefax"],
      ["221", "translated text"],
      ["209", "SMS message"],
      ["219", "physically present"],
      ["220", "physically remote"],
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
