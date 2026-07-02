import { parseOptXml } from "./enhanced/parser/legacy/opt_xml_parser.ts";
import {
  buildWebTemplate,
} from "./enhanced/serialization/simplified/mod.ts";

const xml = await Deno.readTextFile(
  "test_data/opt14/RIPPLE-Conformance Test.opt",
);
const { operationalTemplate } = parseOptXml(xml);
const wt = buildWebTemplate(operationalTemplate);

function walk(node: unknown, chain: string) {
  const n = node as Record<string, unknown>;
  const c = chain ? `${chain}/${n.id}` : String(n.id);
  if (String(n.id).startsWith("heading1") || c.includes("tree")) {
    console.log(c, `[${n.rmType}]`, n.nodeId, n.aqlPath, "max=", n.max);
  }
  for (const ch of (n.children as unknown[]) ?? []) walk(ch, c);
}
for (const ch of wt.tree.children ?? []) walk(ch, "");
