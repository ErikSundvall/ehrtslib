import { parseOptXml } from "./enhanced/parser/legacy/opt_xml_parser.ts";
import { RMInstanceGenerator } from "./enhanced/generation/rm_instance_generator.ts";
import {
  buildWebTemplate,
  deserializeFromFlat,
  serializeToFlat,
  serializeToStructured,
  structuredToFlat,
} from "./enhanced/serialization/simplified/mod.ts";

const xml = await Deno.readTextFile(
  "test_data/opt14/ehrbase_blood_pressure_simple.de.v0.opt",
);
const { operationalTemplate } = parseOptXml(xml);
const wt = buildWebTemplate(operationalTemplate);
const instance = new RMInstanceGenerator({ mode: "maximal" }).generate(
  operationalTemplate,
);
const flat = serializeToFlat(instance, wt);
const restored = deserializeFromFlat(flat, wt);
const flat2 = serializeToFlat(restored, wt);

let same = true;
for (const k of Object.keys(flat)) {
  if (!(k in flat2)) {
    console.log("MISSING in flat2:", k);
    same = false;
  } else if (flat[k] !== flat2[k]) {
    console.log("DIFF", k, JSON.stringify(flat[k]), "!=", JSON.stringify(flat2[k]));
    same = false;
  }
}
for (const k of Object.keys(flat2)) {
  if (!(k in flat)) {
    console.log("EXTRA in flat2:", k);
    same = false;
  }
}
console.log("FLAT roundtrip identical:", same, `(${Object.keys(flat).length} keys)`);

// structured -> flat should match direct flat too
const structured = serializeToStructured(instance, wt);
const flat3 = structuredToFlat(structured, wt);
let same2 = true;
for (const k of Object.keys(flat)) {
  if (!(k in flat3)) {
    console.log("MISSING in structured->flat:", k);
    same2 = false;
  } else if (flat[k] !== flat3[k]) {
    console.log("DIFF s2f", k, JSON.stringify(flat[k]), "!=", JSON.stringify(flat3[k]));
    same2 = false;
  }
}
for (const k of Object.keys(flat3)) {
  if (!(k in flat)) {
    console.log("EXTRA in structured->flat:", k);
    same2 = false;
  }
}
console.log("STRUCTURED->FLAT matches FLAT:", same2, `(${Object.keys(flat3).length} keys)`);
