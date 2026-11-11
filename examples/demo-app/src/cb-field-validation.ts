import type {
  DraftProblem,
  DraftValidationResult,
} from "../../../contribution_builder/mod.ts";
import type { DemoSession, Field, FieldBinding } from "./contribution-demo.ts";

export interface FieldValidation {
  field: Field;
  problems: DraftProblem[];
  message: string;
}

function pathTail(bindingPath: string): string {
  const idx = bindingPath.lastIndexOf("/");
  return idx >= 0 ? bindingPath.slice(idx + 1) : bindingPath;
}

/** Whether a validator problem belongs on this hand-bound demo field. */
export function problemMatchesField(
  problem: DraftProblem,
  binding: FieldBinding,
): boolean {
  if (problem.node !== binding.target) return false;
  const rel = problem.relativePath.replace(/^\//, "");
  if (!rel) return true;
  if (binding.path === rel) return true;
  if (pathTail(binding.path) === rel) return true;
  if (binding.path.startsWith(`${rel}/`)) return true;
  if (binding.path.endsWith(`/${rel}`)) return true;
  return false;
}

export function collectFieldProblems(
  session: Pick<DemoSession, "fields">,
  result: DraftValidationResult,
): Map<Field, DraftProblem[]> {
  const seen = [...result.errors, ...result.missing, ...result.warnings];
  const byField = new Map<Field, DraftProblem[]>();
  for (const field of Object.keys(session.fields) as Field[]) {
    const binding = session.fields[field];
    const mine = seen.filter((p) => problemMatchesField(p, binding));
    if (mine.length) byField.set(field, mine);
  }
  return byField;
}

export function fieldValidationViews(
  session: Pick<DemoSession, "fields">,
  result: DraftValidationResult,
): FieldValidation[] {
  const map = collectFieldProblems(session, result);
  return [...map.entries()].map(([field, problems]) => ({
    field,
    problems,
    message: problems.map((p) => p.message).join(" "),
  }));
}

export function initialDemoShowsValidation(
  session: Pick<DemoSession, "fields" | "validator" | "draftId" | "template">,
  cloneBuild: DemoSession["clones"][0]["caller"]["build"],
): boolean {
  const result = session.validator.validate(
    cloneBuild,
    session.draftId,
    session.template,
  );
  return fieldValidationViews(session, result).some((v) =>
    v.field === "diagnosisName"
  );
}
