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
import type { FlatPayload, WebTemplate, WebTemplateNode } from "./types.ts";
import { resolveAllAtWebTemplateNode } from "./instance_nav.ts";

type RmObject = Record<string, unknown>;

export interface FlatRmDefaultIssue {
  path: string;
  message: string;
  severity: "error" | "warning";
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

function codedListEntries(
  node: WebTemplateNode,
): Array<{ value: string; label?: string; terminology?: string }> {
  const out: Array<{ value: string; label?: string; terminology?: string }> =
    [];
  for (const input of node.inputs ?? []) {
    if (input.suffix && input.suffix !== "code") continue;
    const terminology = input.terminology;
    for (const item of input.list ?? []) {
      if (item.value) out.push({ value: item.value, label: item.label, terminology });
    }
  }
  return out;
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

function completeDvCodedText(
  value: RmObject,
  wtNode: WebTemplateNode,
  issues: FlatRmDefaultIssue[],
  path: string,
): void {
  if (value._type !== "DV_CODED_TEXT") return;

  const entries = codedListEntries(wtNode);
  const only = entries.length === 1 ? entries[0] : undefined;
  const terminology = templateTerminology(wtNode);

  let dc = value.defining_code as RmObject | undefined;
  let code = dc?.code_string as string | undefined;
  const term = terminologyIdValue(dc) ?? only?.terminology ?? terminology;
  let val = typeof value.value === "string" ? value.value : undefined;

  if (!code && val) {
    const rubricMatches = entries.filter((entry) => {
      const expected = term === "openehr"
        ? instructionStateRubric(entry.value)
        : entry.label;
      if (expected && expected.toLowerCase() === val.toLowerCase()) return true;
      return resolveInstructionStateCode(val) === entry.value;
    });
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
      const expectedRubric = resolveDvCodedTextValue(
        { code_string: only.value, terminology_id: { value: term } },
        { templateLabel: only.label },
      );
      const byRubric = val.toLowerCase() === expectedRubric.toLowerCase()
        ? only.value
        : undefined;
      const byCtx = resolveInstructionStateCode(val);
      const resolved = byRubric ??
        (byCtx === only.value ? byCtx : undefined);
      if (!resolved) {
        issues.push({
          path,
          severity: "error",
          message:
            `DV_CODED_TEXT value "${val}" does not match the only template-allowed code ${only.value} (expected rubric "${expectedRubric}")`,
        });
        return;
      }
      code = resolved;
    } else {
      issues.push({
        path,
        severity: "error",
        message:
          `DV_CODED_TEXT value "${val}" does not match any template-allowed code`,
      });
      return;
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

  if (code && !val) {
    const templateLabel = listItemLabel(wtNode, code);
    value.value = resolveDvCodedTextValue(dc, { templateLabel });
    val = value.value as string;
  }

  if (code && val && term === "openehr") {
    const expected = instructionStateRubric(code) ??
      resolveDvCodedTextValue(dc, { templateLabel: listItemLabel(wtNode, code) });
    if (expected && val !== expected && resolveInstructionStateCode(val) !== code) {
      issues.push({
        path,
        severity: "error",
        message:
          `DV_CODED_TEXT value "${val}" does not match openEHR rubric "${expected}" for code ${code}`,
      });
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
    );
  }

  const careWt = ismWt.children?.find((c) => c.id === "careflow_step");
  if (careWt && ism.careflow_step && typeof ism.careflow_step === "object") {
    completeDvCodedText(
      ism.careflow_step as RmObject,
      careWt,
      issues,
      `${pathPrefix}/careflow_step`,
    );
  }
}

function defaultIsmTransition(
  ismWt: WebTemplateNode,
  ctxCurrentState?: string,
  issues: FlatRmDefaultIssue[] = [],
  pathPrefix = "",
): RmObject {
  const ism: RmObject = { _type: "ISM_TRANSITION" };
  if (ismWt.nodeId) ism.archetype_node_id = ismWt.nodeId;
  fillIsmFromWebTemplate(ism, ismWt, ctxCurrentState, issues, pathPrefix);
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

function enrichCodedValuesInTree(
  instance: unknown,
  wtNode: WebTemplateNode,
  issues: FlatRmDefaultIssue[],
  path = "",
): void {
  if (!instance || typeof instance !== "object") return;
  if (wtNode.rmType === "DV_CODED_TEXT") {
    completeDvCodedText(instance as RmObject, wtNode, issues, path || wtNode.aqlPath);
    return;
  }
  for (const childWt of wtNode.children ?? []) {
    const children = resolveAllAtWebTemplateNode(instance, childWt);
    for (const child of children) {
      enrichCodedValuesInTree(child, childWt, issues, childWt.aqlPath);
    }
  }
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
): void {
  const ctxState = ctxCurrentStateDefault(flat);
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
        );
      } else if (typeof record.ism_transition === "object") {
        fillIsmFromWebTemplate(
          record.ism_transition as RmObject,
          ismWt,
          ctxState,
          issues,
          ismPath,
        );
      }
      enrichCodedValuesInTree(record, node, issues);
    }
  });

  enrichCodedValuesInTree(composition, root, issues);
}
