/**
 * ELEMENT nodes without a value constraint ("any" ELEMENTs).
 *
 * The template allows any DATA_VALUE in `ELEMENT.value`, so the value's RM
 * type has to be in the FLAT path. Simplified Formats writes a choice of
 * value types as a `<type>_value` segment below the ELEMENT (spec §5.8:
 * `…/labresult/text_value`), the id being the type without `DV_`, in lower
 * case. Writer, reader and validator use the virtual leaf nodes below.
 * @see openehr://guides/specs/its-rest-simplified_formats
 */

import type { WebTemplateNode } from "./types.ts";
import { hasRmType, isAbstractType, isSubtypeOf } from "../../meta/mod.ts";

/** An ELEMENT leaf: no value constraint, so no inputs and no children. */
export function isUnconstrainedElement(node: WebTemplateNode): boolean {
  return node.rmType === "ELEMENT" && !node.children?.length &&
    !node.inputs?.length;
}

/**
 * `DV_CODED_TEXT` → `coded_text_value`, `DV_INTERVAL<DV_QUANTITY>` →
 * `interval_of_quantity_value` (as Better and FerroEHR name it; a plain
 * `interval_value` would lose the interval's type).
 */
export function valueChoiceId(rmType: string): string {
  const interval = /^DV_INTERVAL<(.+)>$/.exec(rmType);
  if (interval) return `interval_of_${valueChoiceId(interval[1])}`;
  return `${rmType.replace(/^DV_/, "").toLowerCase()}_value`;
}

/**
 * `coded_text_value` → `DV_CODED_TEXT`, `interval_of_quantity_value` →
 * `DV_INTERVAL<DV_QUANTITY>`, when that is a concrete data value type.
 */
export function valueChoiceType(segmentId: string): string | undefined {
  const interval = /^interval_of_(.+)$/.exec(segmentId);
  if (interval) {
    const inner = valueChoiceType(interval[1]);
    return inner && isSubtypeOf(inner, "DV_ORDERED")
      ? `DV_INTERVAL<${inner}>`
      : undefined;
  }
  const m = /^([a-z0-9_]+)_value$/.exec(segmentId);
  if (!m) return undefined;
  const rmType = `DV_${m[1].toUpperCase()}`;
  // A generic type needs its parameter: `interval_of_<t>_value`.
  if (rmType === "DV_INTERVAL") return undefined;
  if (!hasRmType(rmType) || isAbstractType(rmType)) return undefined;
  return isSubtypeOf(rmType, "DATA_VALUE") ? rmType : undefined;
}

/**
 * ELEMENT node whose value may have one of several types: its children are
 * the `<type>_value` leaves at `<element>/value`.
 */
export function isValueChoiceElement(node: WebTemplateNode): boolean {
  return node.rmType === "ELEMENT" && !!node.children?.length &&
    node.children.every((c) =>
      c.aqlPath === `${node.aqlPath}/value` && valueChoiceType(c.id) !== undefined
    );
}

/** The choice child for a value of `rmType`: same type, else a supertype. */
export function valueChoiceFor(
  element: WebTemplateNode,
  rmType: string,
): WebTemplateNode | undefined {
  const children = element.children ?? [];
  return children.find((c) => c.rmType === rmType) ??
    children.find((c) =>
      !c.rmType.includes("<") && !rmType.includes("<") &&
      isSubtypeOf(rmType, c.rmType)
    );
}

/**
 * Leaf node for the value of an unconstrained ELEMENT as `rmType`: it
 * addresses `ELEMENT.value` and keeps the ELEMENT's node id and names.
 */
export function elementValueChoiceNode(
  element: WebTemplateNode,
  rmType: string,
): WebTemplateNode {
  const {
    children: _children,
    inputs: _inputs,
    annotations: _annotations,
    ...rest
  } = element;
  return {
    ...rest,
    id: valueChoiceId(rmType),
    rmType,
    min: 0,
    max: 1,
    aqlPath: `${element.aqlPath}/value`,
  };
}

/**
 * Node for an id chain (`a/b/c`, indices stripped), including the
 * `<type>_value` leaf below an unconstrained ELEMENT.
 */
export function nodeForChain(
  nodeByChain: ReadonlyMap<string, WebTemplateNode>,
  chain: string,
): WebTemplateNode | undefined {
  const node = nodeByChain.get(chain);
  if (node) return node;
  const cut = chain.lastIndexOf("/");
  if (cut === -1) return undefined;
  const element = nodeByChain.get(chain.slice(0, cut));
  const rmType = valueChoiceType(chain.slice(cut + 1));
  if (!element || !rmType || !isUnconstrainedElement(element)) return undefined;
  return elementValueChoiceNode(element, rmType);
}

const ARCHETYPE_ID_IN_PATH =
  /openEHR-[A-Z]+-[A-Za-z0-9_]+\.[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)*\.v\d+(?:\.\d+)*/g;

/** Archetype a Web Template node belongs to: the last archetype id in its path. */
export function archetypeOfNode(
  node: WebTemplateNode,
  rootArchetype?: string,
): string | undefined {
  const ids = node.aqlPath.match(ARCHETYPE_ID_IN_PATH);
  return ids?.[ids.length - 1] ?? rootArchetype;
}

/**
 * Local codes per archetype, as far as the Web Template shows them: node ids
 * and `local` value-list codes. A Web Template does not carry the full
 * archetype terminology, so codes the template does not use are missing.
 */
export function localCodesByArchetype(
  tree: WebTemplateNode,
): Map<string, Set<string>> {
  const root = tree.nodeId;
  const out = new Map<string, Set<string>>();
  const add = (scope: string | undefined, code: string | undefined) => {
    if (!scope || !code || !/^(?:at|ac)\d/.test(code)) return;
    let codes = out.get(scope);
    if (!codes) out.set(scope, codes = new Set());
    codes.add(code);
  };
  const walk = (node: WebTemplateNode) => {
    const scope = archetypeOfNode(node, root);
    add(scope, node.nodeId);
    for (const input of node.inputs ?? []) {
      if (input.terminology && input.terminology !== "local") continue;
      for (const item of input.list ?? []) add(scope, item.value);
    }
    node.children?.forEach(walk);
  };
  walk(tree);
  return out;
}
