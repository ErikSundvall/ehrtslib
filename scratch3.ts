import { parseOptXml } from "./enhanced/parser/legacy/opt_xml_parser.ts";
import { RMInstanceGenerator } from "./enhanced/generation/rm_instance_generator.ts";
import {
  buildWebTemplate,
  deserializeFromFlat,
  parseWebTemplate,
  serializeToFlat,
  serializeToStructured,
  structuredToFlat,
  webTemplateToOpt,
} from "./enhanced/serialization/simplified/mod.ts";

function diffKeys(a: Record<string, unknown>, b: Record<string, unknown>) {
  const out: string[] = [];
  for (const k of Object.keys(a)) {
    if (!(k in b)) out.push(`-${k}`);
    else if (a[k] !== b[k]) out.push(`~${k}`);
  }
  for (const k of Object.keys(b)) if (!(k in a)) out.push(`+${k}`);
  return out;
}

function treeSig(node: unknown): unknown {
  const n = node as Record<string, unknown>;
  return {
    id: n.id,
    rmType: n.rmType,
    nodeId: n.nodeId,
    aqlPath: n.aqlPath,
    children: ((n.children as unknown[]) ?? []).map(treeSig),
  };
}

for await (const entry of Deno.readDir("test_data/opt14")) {
  if (!entry.name.endsWith(".opt")) continue;
  try {
    const xml = await Deno.readTextFile(`test_data/opt14/${entry.name}`);
    const { operationalTemplate } = parseOptXml(xml);
    const wt = buildWebTemplate(operationalTemplate);
    const instance = new RMInstanceGenerator({ mode: "maximal" }).generate(
      operationalTemplate,
    );
    const flat = serializeToFlat(instance, wt);
    const restored = deserializeFromFlat(flat, wt);
    const flat2 = serializeToFlat(restored, wt);
    const d1 = diffKeys(flat, flat2);

    const structured = serializeToStructured(instance, wt);
    const flat3 = structuredToFlat(
      structured as Record<string, unknown>,
      wt,
    );
    const d2 = diffKeys(flat, flat3);

    const wt2 = parseWebTemplate(JSON.stringify(wt));
    const d3 = JSON.stringify(treeSig(wt.tree)) ===
        JSON.stringify(treeSig(wt2.tree))
      ? []
      : ["tree-mismatch"];

    const opt2 = webTemplateToOpt(wt);
    const wt3 = buildWebTemplate(opt2);
    const d4 = JSON.stringify(treeSig(wt.tree)) ===
        JSON.stringify(treeSig(wt3.tree))
      ? []
      : ["tree-mismatch"];

    console.log(
      `${entry.name}: keys=${Object.keys(flat).length} flatRT=${
        d1.length ? "FAIL " + d1.length : "ok"
      } s2f=${d2.length ? "FAIL " + d2.length : "ok"} wtParse=${
        d3.length ? "FAIL" : "ok"
      } wtOpt=${d4.length ? "FAIL" : "ok"}`,
    );
    if (d1.length) console.log("   flatRT diff sample:", d1.slice(0, 4));
    if (d2.length) console.log("   s2f diff sample:", d2.slice(0, 4));
  } catch (e) {
    console.log(`${entry.name}: ERROR ${(e as Error).message}`);
  }
}
