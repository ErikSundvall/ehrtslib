/**
 * `webTemplateToOpt` keeps name-constrained siblings apart: a path step
 * `content[openEHR-EHR-SECTION.adhoc.v1 and name/value='Measurements']` (or
 * the short form `[…,'Measurements']`) becomes its own constraint object with
 * a `name` constraint, so OPT → WT → OPT → WT keeps both SECTIONs, their
 * names and their children.
 */
import { assert, assertEquals } from "@std/assert";
import { parseOptXml } from "../../../../parser/legacy/opt_xml_parser.ts";
import { RMInstanceGenerator } from "../../../../generation/rm_instance_generator.ts";
import {
  buildWebTemplate,
  serializeToFlat,
  type WebTemplate,
  webTemplateToOpt,
} from "../../../../serialization/simplified/mod.ts";
import { fixedNameConstraint } from "../../../../serialization/simplified/web_template_builder.ts";
import type { WebTemplateNode } from "../../../../serialization/simplified/types.ts";

const OPT = new URL("../../../opt14/aql_example.opt", import.meta.url);

function webTemplate(): WebTemplate {
  return buildWebTemplate(
    parseOptXml(Deno.readTextFileSync(OPT)).operationalTemplate!,
  );
}

/** `id-chain  aqlPath  name` of every template node. */
function nodes(node: WebTemplateNode, prefix = ""): string[] {
  const chain = `${prefix}/${node.id}`;
  return [
    `${chain}  ${node.aqlPath}  ${node.name}`,
    ...(node.children ?? []).filter((c) => !c.inContext).flatMap((c) =>
      nodes(c, chain)
    ),
  ];
}

function sections(wt: WebTemplate) {
  return (wt.tree.children ?? []).filter((c) => c.rmType === "SECTION")
    .map((c) => ({
      id: c.id,
      name: c.name,
      aqlPath: c.aqlPath,
      children: c.children?.length,
    }));
}

Deno.test("webTemplateToOpt: sibling SECTIONs told apart by name get separate name-constrained objects", () => {
  const wt = webTemplate();
  const opt = webTemplateToOpt(wt);
  const content = opt.definition!.attributes!.find((a) =>
    a.rm_attribute_name === "content"
  )!;
  const names = (content.children ?? []).map((c) => fixedNameConstraint(c))
    .sort();
  assertEquals(names, ["Behavior", "Measurements"]);
  for (const section of content.children ?? []) {
    assertEquals(
      section.node_id,
      "openEHR-EHR-SECTION.adhoc.v1",
      "no name in the node id",
    );
  }
});

Deno.test("OPT → WT → OPT → WT keeps name-constrained SECTIONs, names and children", () => {
  const wt = webTemplate();
  const again = buildWebTemplate(webTemplateToOpt(wt));
  assertEquals(sections(again), sections(wt));
  assertEquals(nodes(again.tree), nodes(wt.tree));
});

Deno.test("webTemplateToOpt reads the short name predicate form [id,'Name']", () => {
  const wt = webTemplate();
  const short = structuredClone(wt);
  const rewrite = (n: WebTemplateNode) => {
    n.aqlPath = n.aqlPath.replace(/ and name\/value='([^']*)'/g, ",'$1'");
    n.children?.forEach(rewrite);
  };
  rewrite(short.tree);
  const again = buildWebTemplate(webTemplateToOpt(short));
  assertEquals(sections(again), sections(wt));
});

Deno.test("instances generated from the reconstructed OPT fill both SECTIONs", () => {
  const wt = webTemplate();
  const instance = new RMInstanceGenerator({ mode: "maximal" }).generate(
    webTemplateToOpt(wt),
  );
  const keys = Object.keys(serializeToFlat(instance, wt));
  assert(
    keys.some((k) => k.startsWith("aql_example/measurements/")),
    keys.join("\n"),
  );
  assert(
    keys.some((k) => k.startsWith("aql_example/behavior/")),
    keys.join("\n"),
  );
});
