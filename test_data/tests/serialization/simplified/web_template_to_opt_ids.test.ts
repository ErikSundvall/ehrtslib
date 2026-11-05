/**
 * OPT → Web Template → OPT → Web Template keeps node ids and ACTION
 * `ism_transition` mins (#271).
 *
 * nested.en.v1: `at0002` is "ordinal" on the item tree and "count" on a
 * nested cluster. The id is slugged from the item tree's term.
 * RIPPLE: "Request" and "Request #3" share `at0001`. The renamed sibling
 * must not take the other's id (`request` → `request_3`).
 * Test_all_types: ACTION `ism_transition` and `current_state` are 1..1.
 */
import { assertEquals } from "@std/assert";
import { parseOptXml } from "../../../../parser/legacy/opt_xml_parser.ts";
import {
  buildWebTemplate,
  webTemplateToOpt,
} from "../../../../serialization/simplified/mod.ts";
import type { WebTemplateNode } from "../../../../serialization/simplified/types.ts";

function chain(node: WebTemplateNode, prefix = ""): string[] {
  const here = `${prefix}/${node.id}`;
  return [
    `${here}  ${node.aqlPath}  ${node.name}`,
    ...(node.children ?? []).filter((c) => !c.inContext).flatMap((c) =>
      chain(c, here)
    ),
  ];
}

function roundTrip(file: string): { before: string[]; after: string[] } {
  const opt = parseOptXml(
    Deno.readTextFileSync(new URL(`../../../opt14/${file}`, import.meta.url)),
  ).operationalTemplate!;
  const wt = buildWebTemplate(opt);
  const back = buildWebTemplate(webTemplateToOpt(wt));
  return { before: chain(wt.tree), after: chain(back.tree) };
}

for (const file of ["nested.en.v1.opt", "RIPPLE-Conformance Test.opt"]) {
  Deno.test(`webTemplateToOpt keeps node ids: ${file}`, () => {
    const { before, after } = roundTrip(file);
    assertEquals(after, before);
  });
}

function nodes(
  node: WebTemplateNode,
  pred: (n: WebTemplateNode) => boolean,
): WebTemplateNode[] {
  const out: WebTemplateNode[] = [];
  const visit = (n: WebTemplateNode) => {
    if (pred(n)) out.push(n);
    for (const c of n.children ?? []) visit(c);
  };
  visit(node);
  return out;
}

Deno.test("webTemplateToOpt keeps ACTION ism_transition min 1", () => {
  const opt = parseOptXml(
    Deno.readTextFileSync(
      new URL("../../../opt14/Test_all_types.opt", import.meta.url),
    ),
  ).operationalTemplate!;
  const wt = buildWebTemplate(opt);
  const back = buildWebTemplate(webTemplateToOpt(wt));
  const ism = (tree: WebTemplateNode) =>
    nodes(
      tree,
      (n) => n.id === "ism_transition" && n.rmType === "ISM_TRANSITION",
    );
  const state = (tree: WebTemplateNode) =>
    nodes(tree, (n) => n.aqlPath.endsWith("/ism_transition/current_state"));
  assertEquals(ism(wt.tree).map((n) => n.min), [1]);
  assertEquals(ism(back.tree).map((n) => [n.min, n.max]), [[1, 1]]);
  assertEquals(state(back.tree).map((n) => [n.min, n.max]), [[1, 1]]);
});
