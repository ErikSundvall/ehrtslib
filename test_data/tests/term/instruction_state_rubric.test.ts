import { assertEquals } from "@std/assert";
import {
  embeddedOpenEhrGroupIds,
  instructionStateCodes,
  instructionStateRubric,
  openEhrGroupRubric,
} from "../../../term/openehr_group_rubrics.ts";
import { openehrCodeMeaning } from "../../../validation/rm_specification_validator.ts";

Deno.test("instruction_states rubrics match openehr_terminology_en.xml", () => {
  assertEquals(instructionStateRubric("524"), "initial");
  assertEquals(instructionStateRubric("526"), "planned");
  assertEquals(instructionStateRubric("529"), "scheduled");
  assertEquals(instructionStateRubric("530"), "suspended");
  assertEquals(instructionStateRubric("531"), "aborted");
  assertEquals(instructionStateRubric("532"), "completed");
  assertEquals(instructionStateRubric("533"), "expired");
  assertEquals(openehrCodeMeaning("532"), "completed");
});

Deno.test("embedded group rubrics equal openehr_terminology_en.xml", () => {
  const xml = Deno.readTextFileSync(
    new URL(
      "../../../terminology_data/openehr_terminology_en.xml",
      import.meta.url,
    ),
  );
  for (const groupId of embeddedOpenEhrGroupIds()) {
    const group = new RegExp(
      `<group\\b[^>]*openehr_id="${groupId}"[^>]*>([\\s\\S]*?)</group>`,
    ).exec(xml);
    if (!group) throw new Error(`group ${groupId} missing in XML`);
    const fromXml: [string, string][] = [];
    for (const c of group[1].matchAll(/<concept\b([^>]*?)\/?>/g)) {
      const id = /id="([^"]+)"/.exec(c[1])?.[1];
      const rubric = /rubric="([^"]+)"/.exec(c[1])?.[1];
      if (id && rubric) fromXml.push([id, rubric]);
    }
    const embedded = groupId === "instruction_states"
      ? instructionStateCodes().map((
        code,
      ): [string, string] => [code, openEhrGroupRubric(groupId, code)!])
      : [];
    assertEquals(embedded, fromXml, groupId);
  }
});
