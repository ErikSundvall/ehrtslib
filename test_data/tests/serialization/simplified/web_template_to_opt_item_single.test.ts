/**
 * `webTemplateToOpt` rebuilds an ITEM_SINGLE leaf (`…/item[at0005]`) as an
 * ELEMENT with its value, as it does for `items[…]`, so the leaf keeps its
 * path. Test_all_types: `context/other_context[at0004]/item[at0005]`.
 */
import { assertEquals } from "@std/assert";
import { parseOptXml } from "../../../../parser/legacy/opt_xml_parser.ts";
import {
  buildWebTemplate,
  webTemplateToOpt,
} from "../../../../serialization/simplified/mod.ts";
import type { WebTemplateNode } from "../../../../serialization/simplified/types.ts";

function nodes(node: WebTemplateNode, prefix = ""): string[] {
  const chain = `${prefix}/${node.id}`;
  return [
    `${chain}  ${node.aqlPath}  ${node.name}  ${node.rmType}`,
    ...(node.children ?? []).filter((c) => !c.inContext).flatMap((c) =>
      nodes(c, chain)
    ),
  ];
}

Deno.test("webTemplateToOpt keeps an ITEM_SINGLE leaf", () => {
  const wt = buildWebTemplate(
    parseOptXml(
      Deno.readTextFileSync(
        new URL("../../../opt14/Test_all_types.opt", import.meta.url),
      ),
    ).operationalTemplate!,
  );
  const back = buildWebTemplate(webTemplateToOpt(wt));
  const leaf = nodes(back.tree).find((n) => n.includes("/context_coded_text "));
  assertEquals(
    leaf?.split("  ")[1],
    "/context/other_context[at0004]/item[at0005]",
  );
  assertEquals(nodes(back.tree).sort(), nodes(wt.tree).sort());
});
