import { assertEquals } from "@std/assert";
import { instructionStateRubric } from "../../../term/openehr_group_rubrics.ts";
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
