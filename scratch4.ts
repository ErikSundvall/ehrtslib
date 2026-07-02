import { parseOptXml } from "./enhanced/parser/legacy/opt_xml_parser.ts";
import {
  buildWebTemplate,
  webTemplateToOpt,
} from "./enhanced/serialization/simplified/mod.ts";

const name = Deno.args[0] ?? "section_cardinality.opt";
const xml = await Deno.readTextFile(`test_data/opt14/${name}`);
const { operationalTemplate } = parseOptXml(xml);
const wt = buildWebTemplate(operationalTemplate);
const opt2 = webTemplateToOpt(wt);
const wt3 = buildWebTemplate(opt2);

function dump(node: unknown, depth: number, out: string[]) {
  const n = node as Record<string, unknown>;
  out.push(
    "  ".repeat(depth) +
      `${n.id} [${n.rmType}] nodeId=${n.nodeId} ${n.aqlPath}` +
      (n.inContext ? " ctx" : ""),
  );
  for (const c of (n.children as unknown[]) ?? []) dump(c, depth + 1, out);
}
const a: string[] = [];
const b: string[] = [];
dump(wt.tree, 0, a);
dump(wt3.tree, 0, b);
console.log("=== original WT ===");
console.log(a.join("\n"));
console.log("=== rebuilt WT ===");
console.log(b.join("\n"));
console.log("=== line diff ===");
const max = Math.max(a.length, b.length);
for (let i = 0; i < max; i++) {
  if (a[i] !== b[i]) {
    console.log(`-${a[i] ?? "(none)"}`);
    console.log(`+${b[i] ?? "(none)"}`);
  }
}
