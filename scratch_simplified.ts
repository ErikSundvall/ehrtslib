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

const xml = await Deno.readTextFile(
  "test_data/opt14/ehrbase_blood_pressure_simple.de.v0.opt",
);
const { operationalTemplate } = parseOptXml(xml);
const wt = buildWebTemplate(operationalTemplate);
console.log("=== web template tree (ids/rmType/aqlPath) ===");
function show(n: any, d = 0) {
  console.log(
    "  ".repeat(d) + `${n.id} [${n.rmType}] ${n.aqlPath}` +
      (n.inputs ? " inputs=" + JSON.stringify(n.inputs.map((i: any) => i.suffix ?? "(bare)")) : "") +
      (n.inContext ? " ctx" : ""),
  );
  for (const c of n.children ?? []) show(c, d + 1);
}
show(wt.tree);

const instance = new RMInstanceGenerator({ mode: "maximal" }).generate(
  operationalTemplate,
);
const flat = serializeToFlat(instance, wt);
console.log("=== FLAT ===");
console.log(JSON.stringify(flat, null, 2));

const restored = deserializeFromFlat(flat, wt);
const flat2 = serializeToFlat(restored, wt);
console.log("=== FLAT after roundtrip ===");
console.log(JSON.stringify(flat2, null, 2));

const structured = serializeToStructured(instance, wt);
console.log("=== STRUCTURED ===");
console.log(JSON.stringify(structured, null, 2));
const convFlat = structuredToFlat(structured as any, wt);
console.log("=== structuredToFlat ===");
console.log(JSON.stringify(convFlat, null, 2));

console.log("=== WT -> OPT -> WT ===");
const rebuiltOpt = webTemplateToOpt(parseWebTemplate(JSON.stringify(wt)));
const wt2 = buildWebTemplate(rebuiltOpt);
show(wt2.tree);
