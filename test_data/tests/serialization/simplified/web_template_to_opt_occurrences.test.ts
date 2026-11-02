/**
 * `webTemplateToOpt` keeps the names of each occurrence of a reused
 * archetype. ips.v0 uses ACTION.medication as "Medication statement" and as
 * "Immunization statement" (with an at0020 renamed "Immunisation item"); the
 * second occurrence gets its own term scope, so OPT → WT → OPT → WT keeps
 * every node id and name.
 */
import { assertEquals } from "@std/assert";
import { parseOptXml } from "../../../../parser/legacy/opt_xml_parser.ts";
import {
  buildWebTemplate,
  webTemplateToOpt,
} from "../../../../serialization/simplified/mod.ts";
import type { WebTemplateNode } from "../../../../serialization/simplified/types.ts";
import {
  type OperationalTemplateWithTermScopes,
  termScopeOf,
} from "../../../../generation/term_scope.ts";

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

for (const file of ["ips.v0.opt", "Virologischer Befund.opt"]) {
  Deno.test(`webTemplateToOpt keeps reused archetypes' names: ${file}`, () => {
    const opt = parseOptXml(
      Deno.readTextFileSync(
        new URL(`../../../opt14/${file}`, import.meta.url),
      ),
    ).operationalTemplate!;
    const wt = buildWebTemplate(opt);
    const back = buildWebTemplate(webTemplateToOpt(wt));
    // Sibling order may differ; ids, paths and names must not.
    assertEquals(nodes(back.tree).sort(), nodes(wt.tree).sort());
  });
}

Deno.test("webTemplateToOpt gives a renamed reuse its own term scope", () => {
  const opt = parseOptXml(
    Deno.readTextFileSync(
      new URL("../../../opt14/ips.v0.opt", import.meta.url),
    ),
  ).operationalTemplate!;
  const rebuilt = webTemplateToOpt(buildWebTemplate(opt)) as
    & typeof opt
    & OperationalTemplateWithTermScopes;
  const occurrence = Object.keys(rebuilt.occurrence_term_definitions ?? {})
    .find((k) => k.startsWith("openEHR-EHR-ACTION.medication.v1#"));
  assertEquals(occurrence, "openEHR-EHR-ACTION.medication.v1#2");
  const table = rebuilt.occurrence_term_definitions![occurrence!].en;
  assertEquals(
    table["openEHR-EHR-ACTION.medication.v1"].text,
    "Immunization statement",
  );
  // Its nodes carry the occurrence scope.
  const scopes = new Set<string | undefined>();
  const walk = (o: unknown) => {
    const obj = o as { attributes?: { children?: unknown[] }[] };
    scopes.add(termScopeOf(o));
    for (const a of obj.attributes ?? []) {
      for (const c of a.children ?? []) walk(c);
    }
  };
  walk(rebuilt.definition);
  assertEquals(scopes.has(occurrence), true);
});
