import { assertEquals } from "@std/assert";
import { parseOptXml } from "../../../../parser/legacy/opt_xml_parser.ts";
import { parseTemplateInput } from "../../../../parser/mod.ts";
import { buildWebTemplate } from "../../../../serialization/simplified/web_template_builder.ts";
import type { WebTemplateNode } from "../../../../serialization/simplified/types.ts";

const OPT14 = new URL("../../../opt14/", import.meta.url);

function collectIds(node: WebTemplateNode, out: string[] = []): string[] {
  out.push(`${node.aqlPath}::${node.id}`);
  for (const child of node.children ?? []) collectIds(child, out);
  return out;
}

async function idsForOpt(name: string): Promise<string[]> {
  const xml = await Deno.readTextFile(new URL(name, OPT14));
  const { operationalTemplate } = parseOptXml(xml);
  const wt = buildWebTemplate(operationalTemplate!);
  return collectIds(wt.tree).sort();
}

Deno.test("web template ids — section_cardinality keeps section archetype ids", async () => {
  const ids = await idsForOpt("section_cardinality.opt");
  assertEquals(ids.some((line) => line.endsWith("::content_2")), false);
  assertEquals(ids.some((line) => line.includes("SECTION") && line.includes("validation_section_test")), true);
});

Deno.test("web template ids — nested.en.v1 has no container-attribute id regression", async () => {
  const ids = await idsForOpt("nested.en.v1.opt");
  assertEquals(ids.some((line) => /::items_\d+$/.test(line.split("::")[1] ?? "")), false);
});

Deno.test("web template ids — minimal_action ISM leaves unchanged", async () => {
  const xml = await Deno.readTextFile(
    new URL("../../../veredictum/templates/minimal_action.opt", import.meta.url),
  );
  const { operationalTemplate } = parseTemplateInput(xml);
  const wt = buildWebTemplate(operationalTemplate!);
  const ids = collectIds(wt.tree);
  assertEquals(ids.some((l) => l.endsWith("::ism_transition")), true);
  assertEquals(ids.some((l) => l.endsWith("::current_state")), true);
  assertEquals(ids.some((l) => l.endsWith("::dv_coded_text")), false);
});
