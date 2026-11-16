/**
 * #310: TERM_MAPPING.Match_valid rejects anything other than '>', '=', '<' or '?'.
 * `is_valid_match_code(match)` used to evaluate as unknown, so '~' passed.
 */
import { assert, assertEquals } from "@std/assert";
import { RMSpecificationValidator } from "../../../validation/rm_specification_validator.ts";
import { evaluateBmmExpression } from "../../../validation/bmm_invariant_eval.ts";

function mapping(match: unknown): Record<string, unknown> {
  return {
    _type: "TERM_MAPPING",
    match,
    target: {
      _type: "CODE_PHRASE",
      terminology_id: { _type: "TERMINOLOGY_ID", value: "ICD10" },
      code_string: "M79.64",
    },
  };
}

function matchErrors(match: unknown): string[] {
  const messages = new RMSpecificationValidator().validateInstance(mapping(match));
  return messages
    .filter((m) => m.message.includes("Match_valid"))
    .map((m) => m.message);
}

Deno.test("#310 is_valid_match_code accepts only >, =, < and ?", () => {
  for (const code of [">", "=", "<", "?"]) {
    assertEquals(evaluateBmmExpression("is_valid_match_code (match)", { match: code }), true);
    assertEquals(matchErrors(code), []);
  }
  assertEquals(
    evaluateBmmExpression("is_valid_match_code (match)", { match: { value: "=" } }),
    true,
  );
});

Deno.test("#310 Match_valid rejects '~' and other codes", () => {
  for (const code of ["~", "≈", "", "eq", ">=", "<=", null]) {
    assertEquals(
      evaluateBmmExpression("is_valid_match_code (match)", { match: code }),
      false,
      String(code),
    );
    const errors = matchErrors(code);
    assert(errors.length === 1, `${String(code)}: ${errors.join("; ")}`);
    assert(errors[0].includes("TERM_MAPPING.Match_valid"));
  }
});
