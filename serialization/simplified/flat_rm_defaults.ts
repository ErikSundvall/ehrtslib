/**
 * Post-process FLAT-deserialized compositions: ACTION ISM_TRANSITION defaults
 * and DV_CODED_TEXT value resolution from Web Template inputs.
 */

import {
  resolveDvCodedTextValue,
  resolveInstructionStateCode,
} from "../../generation/coded_text_value.ts";
import type { FlatPayload, WebTemplate, WebTemplateNode } from "./types.ts";
import { resolveAllAtWebTemplateNode } from "./instance_nav.ts";

type RmObject = Record<string, unknown>;

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

function enrichDvCodedText(
  value: RmObject,
  wtNode?: WebTemplateNode,
): void {
  if (value._type !== "DV_CODED_TEXT") return;
  const dc = value.defining_code as RmObject | undefined;
  const code = dc?.code_string as string | undefined;
  if (!code) return;
  const existing = value.value;
  if (typeof existing === "string" && existing.length > 0) return;
  const templateLabel = wtNode ? listItemLabel(wtNode, code) : undefined;
  value.value = resolveDvCodedTextValue(dc, { templateLabel });
}

function buildDvFromWtNode(wtNode: WebTemplateNode, code: string): RmObject {
  const terminology = wtNode.inputs?.find((i) =>
    i.suffix === "code" || !i.suffix
  )?.terminology ?? "local";
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
  const variants = ismVariants(ismWt).filter((v) => v.careflowStep === code);
  return variants.length === 1 ? variants[0] : undefined;
}

function fillIsmFromWebTemplate(
  ism: RmObject,
  ismWt: WebTemplateNode,
  ctxCurrentState?: string,
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
    if (code) ism.current_state = buildDvFromWtNode(currentWt, code);
  }
  if (ism.current_state && typeof ism.current_state === "object") {
    enrichDvCodedText(ism.current_state as RmObject, currentWt);
  }

  const careWt = ismWt.children?.find((c) => c.id === "careflow_step");
  if (careWt && ism.careflow_step && typeof ism.careflow_step === "object") {
    enrichDvCodedText(ism.careflow_step as RmObject, careWt);
  }
}

function defaultIsmTransition(
  ismWt: WebTemplateNode,
  ctxCurrentState?: string,
): RmObject {
  const ism: RmObject = {
    _type: "ISM_TRANSITION",
  };
  if (ismWt.nodeId) ism.archetype_node_id = ismWt.nodeId;
  fillIsmFromWebTemplate(ism, ismWt, ctxCurrentState);
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
): void {
  if (!instance || typeof instance !== "object") return;
  if (wtNode.rmType === "DV_CODED_TEXT") {
    enrichDvCodedText(instance as RmObject, wtNode);
    return;
  }
  for (const childWt of wtNode.children ?? []) {
    const children = resolveAllAtWebTemplateNode(instance, childWt);
    for (const child of children) {
      enrichCodedValuesInTree(child, childWt);
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
      if (!record.ism_transition) {
        record.ism_transition = defaultIsmTransition(ismWt, ctxState);
      } else if (typeof record.ism_transition === "object") {
        fillIsmFromWebTemplate(
          record.ism_transition as RmObject,
          ismWt,
          ctxState,
        );
      }
      enrichCodedValuesInTree(record, node);
    }
  });

  enrichCodedValuesInTree(composition, root);
}
