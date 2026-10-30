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
}

/**
 * How a FLAT `|code`, `|value`, or bare key is matched against Web Template
 * codes and rubrics when a DV_CODED_TEXT is completed.
 *
 * - `"exact"` (default): case-sensitive, as in EHRbase. A code or value that
 *   matches only when case is ignored is kept as given and reported, with a hint.
 * - `"case-insensitive"`: case is ignored; the stored code and `value` get the
 *   template code and rubric.
 */
export type CodedValueMatch = "exact" | "case-insensitive";

/** Options for {@link applyFlatRmDefaults} and the FLAT deserializers. */
export interface FlatRmDefaultOptions {
  /** Code, rubric, and bare-key matching for DV_CODED_TEXT. Default `"exact"`. */
  codedValueMatch?: CodedValueMatch;
}

/** Compare two strings under the chosen {@link CodedValueMatch} mode. */
export function codedTextEquals(
  a: string,
  b: string,
  match: CodedValueMatch = "exact",
): boolean {
  return match === "case-insensitive"
    ? a.toLowerCase() === b.toLowerCase()
    : a === b;
}

/** Issue-message suffix for a value that only matches when case is ignored. */
export function caseOnlyMatchHint(kind: "rubric" | "code", target: string): string {
  return `; matches ${kind} "${target}" ignoring case; enable codedValueMatch: "case-insensitive" to accept`;
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
  match: CodedValueMatch,
): boolean {
  if (resolveInstructionStateCode(val) !== code) return false;
  if (match === "case-insensitive") return true;
  const trimmed = val.trim();
  return /^\d+$/.test(trimmed) || instructionStateRubric(code) === trimmed ||
    openehrCodeMeaning(code) === trimmed;
}

function matchesRubric(
  entry: CodedListEntry,
  val: string,
  term: string,
  match: CodedValueMatch = "exact",
): boolean {
  if (rubricTexts(entry, term).some((text) => codedTextEquals(text, val, match))) {
    return true;
  }
  return matchesInstructionState(val, entry.value, match);
}

/** First rubric of `entries` that equals `val` ignoring case (for the hint). */
function caseOnlyRubric(
  entries: CodedListEntry[],
  val: string,
  term: string,
): string | undefined {
  const lower = val.toLowerCase();
  for (const entry of entries) {
    const hit = rubricTexts(entry, term).find((text) => text.toLowerCase() === lower);
    if (hit) return hit;
    if (matchesInstructionState(val, entry.value, "case-insensitive")) {
      return instructionStateRubric(entry.value) ?? entry.value;
    }
  }
  return undefined;
}

/** Hint for an exact-mode miss that would match ignoring case, else "". */
function exactMissHint(
  entries: CodedListEntry[],
  val: string,
  term: string,
  match: CodedValueMatch,
): string {
  if (match !== "exact") return "";
  const rubric = caseOnlyRubric(entries, val, term);
  if (rubric) return caseOnlyMatchHint("rubric", rubric);
  const code = entries.find((entry) =>
    entry.value.toLowerCase() === val.toLowerCase()
  );
  return code ? caseOnlyMatchHint("code", code.value) : "";
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
 * `|code` and `|value` are matched against the template codes and rubrics
 * exactly unless `match` is `"case-insensitive"`, which also writes the
 * template code and the rubric for `language` (canonical casing). In exact
 * mode a code that differs only by case is kept as given and reported.
 */
export function completeDvCodedText(
  value: RmObject,
  wtNode: WebTemplateNode,
  issues: FlatRmDefaultIssue[],
  path: string,
  language?: string,
  match: CodedValueMatch = "exact",
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
  const val = typeof value.value === "string" ? value.value : undefined;

  if (!code && val && entries.length) {
    const text = val;
    const rubricMatches = entries.filter((entry) =>
      matchesRubric(entry, text, term, match)
    );
    if (rubricMatches.length === 1) {
      code = rubricMatches[0].value;
    } else if (rubricMatches.length > 1) {
      issues.push({
        path,
        severity: "error",
        message:
          `DV_CODED_TEXT value "${val}" is ambiguous for template codes: ${
            rubricMatches.map((m) => m.value).join(", ")
          }`,
      });
      return;
    } else if (only) {
      const expectedRubric = term === "openehr"
        ? (instructionStateRubric(only.value) ?? resolveDvCodedTextValue(
          { code_string: only.value, terminology_id: { value: term } },
          { templateLabel: only.label },
        ))
        : (labelForCode(wtNode, only.value, language) ?? resolveDvCodedTextValue(
          { code_string: only.value, terminology_id: { value: term } },
          { templateLabel: only.label },
        ));
      const accepted = matchesRubric(only, val, term, match) ||
        codedTextEquals(val, expectedRubric, match);
      if (!accepted) {
        const hint = exactMissHint(entries, val, term, match) ||
          (match === "exact" &&
              val.toLowerCase() === expectedRubric.toLowerCase()
            ? caseOnlyMatchHint("rubric", expectedRubric)
            : "");
        issues.push({
          path,
          severity: "error",
          message:
            `DV_CODED_TEXT value "${val}" does not match the only template-allowed code ${only.value} (expected rubric "${expectedRubric}")${hint}`,
        });
        return;
      }
      code = only.value;
    } else {
      issues.push({
        path,
        severity: "error",
        message:
          `DV_CODED_TEXT value "${val}" does not match any template-allowed code${
            exactMissHint(entries, val, term, match)
          }`,
      });
      return;
    }
  } else if (!code && only) {
    code = only.value;
  }

  if (code && !entries.some((entry) => entry.value === code)) {
    const folded = entries.find((entry) =>
      entry.value.toLowerCase() === code!.toLowerCase()
    );
    if (folded && match === "case-insensitive") {
      code = folded.value;
    } else if (folded) {
      issues.push({
        path,
        severity: "error",
        message: `DV_CODED_TEXT code "${code}" is not a template-allowed code${
          caseOnlyMatchHint("code", folded.value)
        }`,
      });
      return;
    }
  }

  if (code && (!dc || !dc.code_string)) {
    value.defining_code = {
      _type: "CODE_PHRASE",
      code_string: code,
      terminology_id: { _type: "TERMINOLOGY_ID", value: term },
    };
    dc = value.defining_code as RmObject;
  } else if (
    code && dc && dc.code_string !== code &&
    String(dc.code_string).toLowerCase() === code.toLowerCase()
  ) {
    dc.code_string = code;
  }

  if (code && term === "openehr") {
    const expected = instructionStateRubric(code) ??
      resolveDvCodedTextValue(dc, {
        templateLabel: labelForCode(wtNode, code, language),
      });
    if (!val && expected) {
      value.value = expected;
    } else if (val && expected && val !== expected) {
      if (
        codedTextEquals(val, expected, match) ||
        matchesInstructionState(val, code, match)
      ) {
        value.value = expected;
      } else {
        const hint = match === "exact" &&
            (val.toLowerCase() === expected.toLowerCase() ||
              matchesInstructionState(val, code, "case-insensitive"))
          ? caseOnlyMatchHint("rubric", expected)
          : "";
        issues.push({
          path,
          severity: "error",
          message:
            `DV_CODED_TEXT value "${val}" does not match openEHR rubric "${expected}" for code ${code}${hint}`,
        });
      }
    }
    return;
  }

  if (code && term !== "openehr") {
    const canonical = labelForCode(wtNode, code, language);
    if (!val) {
      if (canonical || entries.length === 1) {
        value.value = resolveDvCodedTextValue(dc, { templateLabel: canonical });
      }
    } else if (canonical) {
      const item = findListEntry(wtNode, code);
      const matched = item
        ? matchesRubric(item, val, term, match)
        : codedTextEquals(val, canonical, match);
      if (matched && val !== canonical) value.value = canonical;
    }
  }
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
  match: CodedValueMatch = "exact",
): void {
  const variant = inferFromCareflow(ism, ismWt);
  if (variant?.nodeId && !ism.archetype_node_id) {
    ism.archetype_node_id = variant.nodeId;
  }
  if (!ism.archetype_node_id && ctxCurrentState) {
    const resolved = resolveInstructionStateCode(ctxCurrentState);
    const byCtx = ismVariants(ismWt).find((v) => v.currentState === resolved);
    if (byCtx?.nodeId) ism.archetype_node_id = byCtx.nodeId;
  }
  if (!ism.archetype_node_id && ismWt.nodeId) {
    ism.archetype_node_id = ismWt.nodeId;
  }

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
      match,
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
      match,
    );
  }
}

function defaultIsmTransition(
  ismWt: WebTemplateNode,
  ctxCurrentState?: string,
  issues: FlatRmDefaultIssue[] = [],
  pathPrefix = "",
  language?: string,
  match: CodedValueMatch = "exact",
): RmObject {
  const ism: RmObject = { _type: "ISM_TRANSITION" };
  if (ismWt.nodeId) ism.archetype_node_id = ismWt.nodeId;
  fillIsmFromWebTemplate(
    ism,
    ismWt,
    ctxCurrentState,
    issues,
    pathPrefix,
    language,
    match,
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
  match: CodedValueMatch,
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
          match,
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
        enrichCodedValues(root, child, issues, language, match, childValue);
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
  const match = options.codedValueMatch ?? "exact";
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
          match,
        );
      } else if (typeof record.ism_transition === "object") {
        fillIsmFromWebTemplate(
          record.ism_transition as RmObject,
          ismWt,
          ctxState,
          issues,
          ismPath,
          language,
          match,
        );
      }
    }
  });

  enrichCodedValues(composition, root, issues, language, match);
  dedupeIssues(issues);
}
