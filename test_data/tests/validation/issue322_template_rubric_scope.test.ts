/**
 * #322: Template rubric warnings must respect the active archetype scope.
 * Reused local::at* codes across archetypes in one OPT must not resolve via the
 * flat ontology or an unrelated archetype's term table.
 */
import { assert, assertEquals } from "@std/assert";
import { parseOptXml } from "../../../parser/mod.ts";
import { TemplateValidator } from "../../../validation/template_validator.ts";

const THUMB_OPT = new URL(
  "../../fixtures/ferroehr/thumb-pain-encounter.v2-coded.opt",
  import.meta.url,
);
const WORKBENCH_COMP = new URL(
  "../../fixtures/workbench-ferro/01-demo-1998.json",
  import.meta.url,
);

const opt = parseOptXml(
  Deno.readTextFileSync(THUMB_OPT),
).operationalTemplate!;
const composition = JSON.parse(Deno.readTextFileSync(WORKBENCH_COMP));

function rubricWarnings(result: ReturnType<TemplateValidator["validate"]>) {
  return result.warnings.filter((m) => m.constraintType === "term_rubric");
}

Deno.test("#322 thumb-pain: laterality codes do not get exclusion/screening rubrics", () => {
  const validator = new TemplateValidator({
    validateTerminology: true,
    validateRMSpecification: false,
    validateUnits: false,
    validateIntervals: false,
    validateInvariants: false,
  });
  const result = validator.validate(composition, opt);
  const rubrics = rubricWarnings(result);
  const falsePositives = rubrics.filter((m) =>
    (m.message.includes("at0004") && m.message.includes("Problem/diagnosis")) ||
    (m.message.includes("at0003") && m.message.includes("Excluded concept")) ||
    (m.message.includes("at0024") && m.message.includes('"No"'))
  );
  assertEquals(
    falsePositives,
    [],
    `unexpected rubric warnings: ${falsePositives.map((m) => m.message).join("; ")}`,
  );
});

Deno.test("#322 scoped lookup: wrong archetype on stack still warns", () => {
  const validator = new TemplateValidator({
    validateTerminology: true,
    validateRMSpecification: false,
    validateUnits: false,
    validateIntervals: false,
    validateInvariants: false,
  });
  const swapped = structuredClone(composition) as Record<string, unknown>;
  const findLocalCode = (node: unknown, code: string): unknown => {
    if (!node || typeof node !== "object") return undefined;
    const rec = node as Record<string, unknown>;
    const defining = rec.defining_code as
      | { code_string?: string }
      | undefined;
    if (
      rec._type === "DV_CODED_TEXT" &&
      defining?.code_string === code
    ) {
      return node;
    }
    for (const value of Object.values(rec)) {
      if (Array.isArray(value)) {
        for (const item of value) {
          const hit = findLocalCode(item, code);
          if (hit) return hit;
        }
      } else if (value && typeof value === "object") {
        const hit = findLocalCode(value, code);
        if (hit) return hit;
      }
    }
    return undefined;
  };
  const laterality = findLocalCode(swapped, "at0004") as {
    value?: string;
  } | undefined;
  assert(laterality);
  laterality.value = "NotRight";
  const result = validator.validate(swapped, opt);
  const hit = rubricWarnings(result).find((m) =>
    m.message.includes("at0004") && m.message.includes("NotRight")
  );
  assert(hit, "expected a rubric warning when value disagrees with scoped rubric");
  assert(
    hit.message.includes("Right"),
    `expected scoped rubric Right, got: ${hit.message}`,
  );
});