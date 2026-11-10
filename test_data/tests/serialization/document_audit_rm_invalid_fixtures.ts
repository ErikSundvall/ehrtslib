/**
 * Veredictum (or other) compositions that are intentionally RM-invalid for a declared
 * template. They stay in the corpus for other tests but are excluded from the
 * structural lossless gate with an asserted rejection reason.
 */

import { parseOptXml } from "../../../parser/legacy/opt_xml_parser.ts";
import { TemplateValidator } from "../../../validation/template_validator.ts";

/** Fixture id (as in {@link loadTemplatedCompositionFixtures}) → minimal_evaluation OPT. */
export const STRUCTURAL_AUDIT_RM_INVALID_FIXTURES: Record<string, string> = {
  "veredictum/minimal_event.dv_text_in_content.json": "../../opt14/minimal_evaluation.opt",
};

export function assertRmInvalidFixtureRejected(
  fixtureId: string,
  comp: Record<string, unknown>,
): void {
  const optRel = STRUCTURAL_AUDIT_RM_INVALID_FIXTURES[fixtureId];
  if (!optRel) {
    throw new Error(`Unknown RM-invalid fixture id: ${fixtureId}`);
  }
  const optPath = new URL(optRel, import.meta.url);
  const { operationalTemplate } = parseOptXml(Deno.readTextFileSync(optPath));
  const result = new TemplateValidator().validate(comp, operationalTemplate);
  if (result.valid) {
    throw new Error(
      `${fixtureId} expected RM/template-invalid but validation passed`,
    );
  }
  const joined = result.errors.map((e) => e.message).join("; ");
  if (!/CONTENT_ITEM|DV_TEXT|EVALUATION/i.test(joined)) {
    throw new Error(
      `${fixtureId} rejected but not for CONTENT_ITEM/DV_TEXT: ${joined}`,
    );
  }
}
