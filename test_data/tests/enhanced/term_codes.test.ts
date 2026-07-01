import { assertEquals } from "https://deno.land/std@0.220.0/assert/mod.ts";
import { termCodeCandidates } from "../../../enhanced/generation/term_codes.ts";

Deno.test("termCodeCandidates normalises short archetype node ids", () => {
  const at02 = termCodeCandidates("at0.2");
  assertEquals(at02.includes("at0.2"), true);
  assertEquals(at02.includes("at0002"), true);
  assertEquals(termCodeCandidates("id2").includes("at0002"), true);
  assertEquals(termCodeCandidates("at0003.1").includes("at0003"), true);
});
