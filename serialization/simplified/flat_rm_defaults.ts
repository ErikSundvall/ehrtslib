/**
 * Post-process FLAT-deserialized compositions: ACTION ISM_TRANSITION defaults,
 * DV_CODED_TEXT completion, and rubric validation.
 */

import {
  resolveDvCodedTextValue,
  resolveInstructionStateCode,
  terminologyIdValue,
} from "../../generation/coded_text_value.ts";
import { instructionStateRubric } from "../../term/openehr_group_rubrics.ts";
import { openehrCodeMeaning } from "../../validation/rm_specification_validator.ts";
import type { FlatPayload, WebTemplate, WebTemplateNode } from "./types.ts";
import {
  resolveAllAtWebTemplateNode,
  resolveChildWebTemplateNodes,
} from "./instance_nav.ts";

type RmObject = Record<string, unknown>;

export interface FlatRmDefaultIssue {
  path: string;
  message: string;
  severity: "error" | "warning";
  /** Set on issues raised under {@link CodedTextMismatch}. */
  kind?: "coded-text-mismatch";
}

/**
 * What FLAT → RM does with a DV_CODED_TEXT `|code`, `|value`, or bare key that
 * has no exact (case-sensitive) match in the Web Template code list.
 *
 * | Mode | Case-only mismatch | No match at all |
 * |---|---|---|
 * | `"reject"` (default) | error | error |
 * | `"keep"` | kept as sent + warning | kept as sent + warning |
 * | `"correct"` | normalised to the template code/rubric + warning | error |
 *
 * Errors are issues from `deserializeFromFlatWithIssues`; `deserializeFromFlat`,
 * `buildRmValue`, and `buildDvValue` (without a caller `issues` array) throw
 * {@link CodedTextMismatchError}. Exact matches and code-only completion are
 * the same in every mode.
 */
export type CodedTextMismatch = "reject" | "keep" | "correct";

/** Options for {@link applyFlatRmDefaults} and the FLAT deserializers. */
export interface FlatRmDefaultOptions {
  /** DV_CODED_TEXT input without an exact template match. Default `"reject"`. */
  codedTextMismatch?: CodedTextMismatch;
}

/** Thrown by the non-collecting FLAT APIs on a coded-text mismatch error. */
export class CodedTextMismatchError extends Error {
  constructor(readonly issues: FlatRmDefaultIssue[]) {
    super(issues.map((issue) => `${issue.path}: ${issue.message}`).join("\n"));
    this.name = "CodedTextMismatchError";
  }
}

/** Throw {@link CodedTextMismatchError} when `issues` has a mismatch error. */
export function throwOnCodedTextMismatch(issues: FlatRmDefaultIssue[]): void {
  const errors = issues.filter((issue) =>
    issue.kind === "coded-text-mismatch" && issue.severity === "error"
  );
  if (errors.length) throw new CodedTextMismatchError(errors);
}

type MismatchAction = "correct" | "keep" | "stop";

/**
 * Report input without an exact template match and say what to do with it.
 * `caseOnly` names the template code or rubric it matches ignoring case.
 */
function reportMismatch(
  issues: FlatRmDefaultIssue[],
  path: string,
  mode: CodedTextMismatch,
  subject: string,
  caseOnly?: { kind: "code" | "rubric"; target: string },
): MismatchAction {
  const detail = caseOnly
    ? `matches template ${caseOnly.kind} "${caseOnly.target}" only when case is ignored`
    : "has no unique match among the template-allowed codes and rubrics";
  if (caseOnly && mode === "correct") {
    issues.push({
      path,
      severity: "warning",
      kind: "coded-text-mismatch",
      message:
        `DV_CODED_TEXT ${subject} ${detail}; corrected to "${caseOnly.target}" (codedTextMismatch: "correct")`,
    });
    return "correct";
  }
  if (mode === "keep") {
    issues.push({
      path,
      severity: "warning",
      kind: "coded-text-mismatch",
      message:
        `DV_CODED_TEXT ${subject} ${detail}; kept as sent (codedTextMismatch: "keep")`,
    });
    return "keep";
  }
  const alternatives = caseOnly
    ? `set codedTextMismatch: "correct" to normalise it or "keep" to keep it as sent`
    : `set codedTextMismatch: "keep" to keep it as sent`;
  issues.push({
    path,
    severity: "error",
    kind: "coded-text-mismatch",
    message: `DV_CODED_TEXT ${subject} ${detail}; ${alternatives}`,
  });
  return "stop";
}

function listItemLabel(
  node: WebTemplateNode,
  code: string,
): string | undefined {
  for (const input of node.inputs ?? []) {
    if (input.suffix && input.suffix !== "code") continue;
    for (const item of input.list ?? []) {
      if (item.value === code) return item.label;
    }
  }
  return undefined;
}

interface CodedListEntry {
  value: string;
  label?: string;
  terminology?: string;
  localizedLabels?: Record<string, string>;
}

function codedListEntries(node: WebTemplateNode): CodedListEntry[] {
  const out: CodedListEntry[] = [];
  for (const input of node.inputs ?? []) {
    if (input.suffix && input.suffix !== "code") continue;
    const terminology = input.terminology;
    for (const item of input.list ?? []) {
      if (item.value) {
        out.push({
          value: item.value,
          label: item.label,
          terminology,
          localizedLabels: item.localizedLabels,
        });
      }
    }
  }
  return out;
}

function isLocalOrOpenehr(term: string | undefined): boolean {
  if (!term) return true;
  const normalized = term.toLowerCase();
  return normalized === "local" || normalized === "openehr";
}

function rubricTexts(entry: CodedListEntry, term: string): string[] {
  const texts: string[] = [];
  if (term === "openehr") {
    const rubric = instructionStateRubric(entry.value);
    if (rubric) texts.push(rubric);
  } else if (entry.label) {
    texts.push(entry.label);
  }
  if (term !== "openehr") {
    for (const label of Object.values(entry.localizedLabels ?? {})) {
      if (label) texts.push(label);
    }
  }
  return texts;
}

/** True when `val` names openEHR instruction state `code` (digits, rubric, or meaning). */
function matchesInstructionState(
  val: string,
  code: string,
  ignoreCase: boolean,
): boolean {
  if (resolveInstructionStateCode(val) !== code) return false;
  if (ignoreCase) return true;
  const trimmed = val.trim();
  return /^\d+$/.test(trimmed) || instructionStateRubric(code) === trimmed ||
    openehrCodeMeaning(code) === trimmed;
}

function matchesRubric(
  entry: CodedListEntry,
  val: string,
  term: string,
  ignoreCase = false,
): boolean {
  const lower = val.toLowerCase();
  if (
    rubricTexts(entry, term).some((text) =>
      ignoreCase ? text.toLowerCase() === lower : text === val
    )
  ) {
    return true;
  }
  return matchesInstructionState(val, entry.value, ignoreCase);
}

/** Rubric of `entry` that equals `val` ignoring case. */
function caseOnlyRubric(
  entry: CodedListEntry,
  val: string,
  term: string,
): string {
  const lower = val.toLowerCase();
  return rubricTexts(entry, term).find((text) => text.toLowerCase() === lower) ??
    instructionStateRubric(entry.value) ?? entry.value;
}

function findListEntry(
  node: WebTemplateNode,
  code: string,
): CodedListEntry | undefined {
  const lower = code.toLowerCase();
  return codedListEntries(node).find((entry) => entry.value.toLowerCase() === lower);
}

/** Template rubric for `code`, preferring the composition language. */
function labelForCode(
  node: WebTemplateNode,
  code: string,
  language?: string,
): string | undefined {
  const item = findListEntry(node, code);
  if (!item) return undefined;
  if (language && item.localizedLabels) {
    const exact = item.localizedLabels[language];
    if (exact) return exact;
    const key = Object.keys(item.localizedLabels).find((candidate) =>
      candidate.toLowerCase() === language.toLowerCase()
    );
    if (key && item.localizedLabels[key]) return item.localizedLabels[key];
  }
  return item.label;
}

function templateTerminology(node: WebTemplateNode): string {
  return node.inputs?.find((i) => i.suffix === "code" || !i.suffix)?.terminology ??
    "local";
}

function currentStatesForCareflow(
  careWt: WebTemplateNode,
  careflowCode: string,
): string[] | undefined {
  for (const input of careWt.inputs ?? []) {
    if (input.suffix && input.suffix !== "code") continue;
    const item = input.list?.find((i) => i.value === careflowCode);
    const states = item?.currentStates;
    if (Array.isArray(states) && states.length) {
      return states.map(String);
    }
  }
  return undefined;
}

/**
 * Fill a partial DV_CODED_TEXT from the Web Template code list.
 *
 * Local and openEHR lists only. External terminologies are left as given.
 * `|code` and `|value` must match the template codes and rubrics exactly;
 * other input is handled per `mode` (see {@link CodedTextMismatch}). The
 * stored `value` is the template rubric for `language` when it is filled or
 * corrected.
 */
export function completeDvCodedText(
  value: RmObject,
  wtNode: WebTemplateNode,
  issues: FlatRmDefaultIssue[],
  path: string,
  language?: string,
  mode: CodedTextMismatch = "reject",
): void {
  if (value._type !== "DV_CODED_TEXT") return;

  const nodeTerm = templateTerminology(wtNode);
  if (!isLocalOrOpenehr(nodeTerm)) return;

  const entries = codedListEntries(wtNode);
  const only = entries.length === 1 ? entries[0] : undefined;

  let dc = value.defining_code as RmObject | undefined;
  const instanceTerm = terminologyIdValue(dc);
  if (instanceTerm && !isLocalOrOpenehr(instanceTerm)) return;

  let code = dc?.code_string as string | undefined;
  const term = instanceTerm ?? only?.terminology ?? nodeTerm;
  let val = typeof value.value === "string" ? value.value : undefined;

  if (code && entries.length && !entries.some((entry) => entry.value === code)) {
    const folded = entries.filter((entry) =>
      entry.value.toLowerCase() === code!.toLowerCase()
    );
    const action = reportMismatch(
      issues,
      path,
      mode,
      `code "${code}"`,
      folded.length === 1 ? { kind: "code", target: folded[0].value } : undefined,
    );
    if (action !== "correct") return;
    code = folded[0].value;
    dc!.code_string = code;
  }

  if (!code && val && entries.length) {
    const text = val;
    const exact = entries.filter((entry) => matchesRubric(entry, text, term));
    if (exact.length === 1) {
      code = exact[0].value;
    } else if (exact.length > 1) {
      issues.push({
        path,
        severity: "error",
        message:
          `DV_CODED_TEXT value "${val}" is ambiguous for template codes: ${
            exact.map((m) => m.value).join(", ")
          }`,
      });
      return;
    } else {
      const folded = entries.filter((entry) =>
        matchesRubric(entry, text, term, true)
      );
      const action = reportMismatch(
        issues,
        path,
        mode,
        `value "${val}"`,
        folded.length === 1
          ? { kind: "rubric", target: caseOnlyRubric(folded[0], text, term) }
          : undefined,
      );
      if (action !== "correct") return;
      code = folded[0].value;
      delete value.value;
      val = undefined;
    }
  } else if (!code && only) {
    code = only.value;
  }

  if (code && (!dc || !dc.code_string)) {
    value.defining_code = {
      _type: "CODE_PHRASE",
      code_string: code,
      terminology_id: { _type: "TERMINOLOGY_ID", value: term },
    };
    dc = value.defining_code as RmObject;
  }

  if (!code) return;

  const rubric = term === "openehr"
    ? instructionStateRubric(code) ??
      resolveDvCodedTextValue(dc, {
        templateLabel: labelForCode(wtNode, code, language),
      })
    : labelForCode(wtNode, code, language);

  if (!val) {
    if (term === "openehr") {
      if (rubric) value.value = rubric;
    } else if (rubric || entries.length === 1) {
      value.value = resolveDvCodedTextValue(dc, { templateLabel: rubric });
    }
    return;
  }
  if (!rubric || val === rubric) return;

  const item = entries.find((entry) => entry.value === code);
  if (!item) return;
  if (matchesRubric(item, val, term)) {
    // Exact rubric in another language, or an openEHR meaning.
    value.value = rubric;
    return;
  }
  if (matchesRubric(item, val, term, true)) {
    const action = reportMismatch(issues, path, mode, `value "${val}"`, {
      kind: "rubric",
      target: caseOnlyRubric(item, val, term),
    });
    if (action === "correct") value.value = rubric;
    return;
  }
  const other = entries.find((entry) =>
    entry !== item && matchesRubric(entry, val!, term, true)
  );
  if (other) {
    if (reportConflict(issues, path, mode, code, val, other.value, rubric)) {
      value.value = rubric;
    }
    return;
  }
  const action = reportMismatch(issues, path, mode, `value "${val}"`);
  if (action === "correct") value.value = rubric;
}

/**
 * `|code` and `|value` each match a template entry, but different ones.
 * Returns true when `value` should be replaced by the rubric of `|code`.
 */
function reportConflict(
  issues: FlatRmDefaultIssue[],
  path: string,
  mode: CodedTextMismatch,
  code: string,
  val: string,
  valueCode: string,
  rubric: string,
): boolean {
  const detail =
    `DV_CODED_TEXT code "${code}" and value "${val}" name different template entries (the value matches code ${valueCode})`;
  if (mode === "correct") {
    issues.push({
      path,
      severity: "warning",
      kind: "coded-text-mismatch",
      message:
        `${detail}; value replaced by "${rubric}" (codedTextMismatch: "correct")`,
    });
    return true;
  }
  if (mode === "keep") {
    issues.push({
      path,
      severity: "warning",
      kind: "coded-text-mismatch",
      message: `${detail}; both kept as sent (codedTextMismatch: "keep")`,
    });
    return false;
  }
  issues.push({
    path,
    severity: "error",
    kind: "coded-text-mismatch",
    message:
      `${detail}; set codedTextMismatch: "correct" to use the rubric of the code or "keep" to keep both as sent`,
  });
  return false;
}

function pickCurrentStateCode(
  wtNode: WebTemplateNode,
  ctxDefault?: string,
): string | undefined {
  const entries = codedListEntries(wtNode);
  if (entries.length === 1) return entries[0].value;
  if (!ctxDefault) return undefined;
  const resolved = resolveInstructionStateCode(ctxDefault);
  if (!resolved) return undefined;
  if (entries.some((e) => e.value === resolved)) return resolved;
  return entries.length ? undefined : resolved;
}

type IsmVariantHint = {
  nodeId?: string;
  currentState?: string;
  careflowStep?: string;
};

function ismVariants(ismWt: WebTemplateNode): IsmVariantHint[] {
  const raw = ismWt.annotations?.ismVariants;
  return Array.isArray(raw) ? raw as IsmVariantHint[] : [];
}

function inferFromCareflow(
  ism: RmObject,
  ismWt: WebTemplateNode,
): IsmVariantHint | undefined {
  const careflow = ism.careflow_step as RmObject | undefined;
  const code = (careflow?.defining_code as { code_string?: string } | undefined)
    ?.code_string;
  if (!code) return undefined;

  const careWt = ismWt.children?.find((c) => c.id === "careflow_step");
  const fromList = careWt ? currentStatesForCareflow(careWt, code) : undefined;
  if (fromList?.length === 1) {
    const variant = ismVariants(ismWt).find((v) => v.careflowStep === code);
    return {
      careflowStep: code,
      currentState: fromList[0],
      nodeId: variant?.nodeId,
    };
  }

  const variants = ismVariants(ismWt).filter((v) => v.careflowStep === code);
  return variants.length === 1 ? variants[0] : undefined;
}

function buildDvFromWtNode(wtNode: WebTemplateNode, code: string): RmObject {
  const terminology = templateTerminology(wtNode);
  const label = listItemLabel(wtNode, code);
  const defining_code = {
    _type: "CODE_PHRASE",
    terminology_id: { _type: "TERMINOLOGY_ID", value: terminology },
    code_string: code,
  };
  return {
    _type: "DV_CODED_TEXT",
    defining_code,
    value: resolveDvCodedTextValue(defining_code, { templateLabel: label }),
  };
}

function fillIsmFromWebTemplate(
  ism: RmObject,
  ismWt: WebTemplateNode,
  ctxCurrentState?: string,
  issues: FlatRmDefaultIssue[] = [],
  pathPrefix = "",
  language?: string,
  mode: CodedTextMismatch = "reject",
): void {
  // ISM_TRANSITION is PATHABLE, not LOCATABLE: it has no archetype_node_id.
  // The template variant is identified by careflow_step / current_state.
  // Older data (or a |raw object) may still carry the key; drop it.
  delete ism.archetype_node_id;
  const variant = inferFromCareflow(ism, ismWt);

  const currentWt = ismWt.children?.find((c) => c.id === "current_state");
  if (currentWt && !ism.current_state) {
    const code = variant?.currentState ??
      pickCurrentStateCode(currentWt, ctxCurrentState);
    if (code) {
      ism.current_state = buildDvFromWtNode(currentWt, code);
    }
  }
  if (ism.current_state && typeof ism.current_state === "object" && currentWt) {
    completeDvCodedText(
      ism.current_state as RmObject,
      currentWt,
      issues,
      `${pathPrefix}/current_state`,
      language,
      mode,
    );
  }

  const careWt = ismWt.children?.find((c) => c.id === "careflow_step");
  if (careWt && ism.careflow_step && typeof ism.careflow_step === "object") {
    completeDvCodedText(
      ism.careflow_step as RmObject,
      careWt,
      issues,
      `${pathPrefix}/careflow_step`,
      language,
      mode,
    );
  }
}

function defaultIsmTransition(
  ismWt: WebTemplateNode,
  ctxCurrentState?: string,
  issues: FlatRmDefaultIssue[] = [],
  pathPrefix = "",
  language?: string,
  mode: CodedTextMismatch = "reject",
): RmObject {
  const ism: RmObject = { _type: "ISM_TRANSITION" };
  fillIsmFromWebTemplate(
    ism,
    ismWt,
    ctxCurrentState,
    issues,
    pathPrefix,
    language,
    mode,
  );
  return ism;
}

function ctxCurrentStateDefault(flat: FlatPayload): string | undefined {
  for (const [key, value] of Object.entries(flat)) {
    if (!key.startsWith("ctx/action_ism_transition_current_state")) continue;
    if (value == null || typeof value === "object") continue;
    const pipe = key.indexOf("|");
    const suffix = pipe === -1 ? "" : key.slice(pipe + 1);
    if (suffix && suffix !== "value" && suffix !== "code") continue;
    return String(value);
  }
  return undefined;
}

function walkTemplate(
  nodes: WebTemplateNode[],
  visit: (node: WebTemplateNode) => void,
): void {
  for (const node of nodes) {
    visit(node);
    if (node.children?.length) walkTemplate(node.children, visit);
  }
}

function compositionLanguage(composition: RmObject): string | undefined {
  const lang = composition.language;
  if (!lang || typeof lang !== "object") return undefined;
  const code = (lang as RmObject).code_string;
  return typeof code === "string" && code ? code : undefined;
}

/**
 * Visit every DV_CODED_TEXT in the composition. Child AQL paths are absolute,
 * so resolution uses the composition root (the same walk FLAT serialization uses).
 */
function enrichCodedValues(
  root: unknown,
  node: WebTemplateNode,
  issues: FlatRmDefaultIssue[],
  language: string | undefined,
  mode: CodedTextMismatch,
  scope?: unknown,
): void {
  if (node.inContext) return;
  const values = scope !== undefined
    ? [scope]
    : resolveAllAtWebTemplateNode(root, node);
  if (!values.length) return;

  if (node.rmType === "DV_CODED_TEXT") {
    for (const value of values) {
      if (value && typeof value === "object") {
        completeDvCodedText(
          value as RmObject,
          node,
          issues,
          node.aqlPath,
          language,
          mode,
        );
      }
    }
    return;
  }

  for (const value of values) {
    if (!value || typeof value !== "object") continue;
    for (const child of node.children ?? []) {
      const childValues = resolveChildWebTemplateNodes(
        root,
        value,
        node,
        child,
      );
      for (const childValue of childValues) {
        enrichCodedValues(root, child, issues, language, mode, childValue);
      }
    }
  }
}

function dedupeIssues(issues: FlatRmDefaultIssue[]): void {
  const seen = new Set<string>();
  let write = 0;
  for (const issue of issues) {
    const key = `${issue.severity}\0${issue.path}\0${issue.message}`;
    if (seen.has(key)) continue;
    seen.add(key);
    issues[write++] = issue;
  }
  issues.length = write;
}

/**
 * Apply RM defaults after FLAT deserialization (ACTION ISM_TRANSITION, coded
 * text values).
 */
export function applyFlatRmDefaults(
  composition: RmObject,
  webTemplate: WebTemplate,
  flat: FlatPayload,
  issues: FlatRmDefaultIssue[] = [],
  options: FlatRmDefaultOptions = {},
): void {
  const mode = options.codedTextMismatch ?? "reject";
  const ctxState = ctxCurrentStateDefault(flat);
  const language = compositionLanguage(composition) ?? webTemplate.defaultLanguage;
  const root = webTemplate.tree;

  walkTemplate(root.children ?? [], (node) => {
    if (node.rmType !== "ACTION") return;
    const ismWt = node.children?.find((c) => c.id === "ism_transition");
    if (!ismWt) return;
    const actions = resolveAllAtWebTemplateNode(composition, node);
    for (const action of actions) {
      if (!action || typeof action !== "object") continue;
      const record = action as RmObject;
      const ismPath = `${node.aqlPath}/ism_transition`;
      if (!record.ism_transition) {
        record.ism_transition = defaultIsmTransition(
          ismWt,
          ctxState,
          issues,
          ismPath,
          language,
          mode,
        );
      } else if (typeof record.ism_transition === "object") {
        fillIsmFromWebTemplate(
          record.ism_transition as RmObject,
          ismWt,
          ctxState,
          issues,
          ismPath,
          language,
          mode,
        );
      }
    }
  });

  enrichCodedValues(composition, root, issues, language, mode);
  dedupeIssues(issues);
}
