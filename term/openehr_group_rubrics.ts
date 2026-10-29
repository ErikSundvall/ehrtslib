/**
 * Group-aware openEHR terminology rubrics (English), parsed from
 * `terminology_data/openehr_terminology_en.xml`.
 *
 * Instruction-state codes are group-specific (SPECPR-51): e.g. 532 is
 * "completed" in `instruction_states`, not "complete" from other groups.
 */

import { fromFileUrl, join } from "@std/path";

const TERMINOLOGY_XML = join(
  fromFileUrl(new URL("../terminology_data/openehr_terminology_en.xml", import.meta.url)),
);

type GroupMap = Map<string, string>;

let groupCache: Map<string, GroupMap> | null = null;

function loadGroups(): Map<string, GroupMap> {
  if (groupCache) return groupCache;
  const xml = Deno.readTextFileSync(TERMINOLOGY_XML);
  const groups = new Map<string, GroupMap>();
  const groupRe = /<group\b([^>]*)>([\s\S]*?)<\/group>/g;
  for (const groupMatch of xml.matchAll(groupRe)) {
    const attrs = groupMatch[1];
    const openehrId = /openehr_id="([^"]+)"/.exec(attrs)?.[1];
    if (!openehrId) continue;
    const concepts = new Map<string, string>();
    const conceptRe = /<concept\b([^>]*?)\/?>/g;
    for (const conceptMatch of groupMatch[2].matchAll(conceptRe)) {
      const id = /id="([^"]+)"/.exec(conceptMatch[1])?.[1];
      const rubric = /rubric="([^"]+)"/.exec(conceptMatch[1])?.[1];
      if (id && rubric) concepts.set(id, rubric);
    }
    groups.set(openehrId, concepts);
  }
  groupCache = groups;
  return groups;
}

/** Rubric for a code within an openEHR terminology group (English). */
export function openEhrGroupRubric(
  groupId: string,
  code: string,
): string | undefined {
  return loadGroups().get(groupId)?.get(code);
}

export const INSTRUCTION_STATES_GROUP = "instruction_states";

export function instructionStateRubric(code: string): string | undefined {
  return openEhrGroupRubric(INSTRUCTION_STATES_GROUP, code);
}

/** All instruction-state codes defined in the English terminology file. */
export function instructionStateCodes(): string[] {
  const group = loadGroups().get(INSTRUCTION_STATES_GROUP);
  return group ? [...group.keys()] : [];
}
