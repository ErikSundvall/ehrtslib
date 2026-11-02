/**
 * A collapsed ELEMENT leaf has the ELEMENT's occurrences, not its value's
 * (a value is always 1..1 in its ELEMENT), as EHRbase (`Filter.java`) and
 * Better give.
 */
import { assertEquals } from "@std/assert";
import { parseOptXml } from "../../../../parser/legacy/opt_xml_parser.ts";
import {
  buildWebTemplate,
  validateFlatPayload,
} from "../../../../serialization/simplified/mod.ts";
import type { WebTemplateNode } from "../../../../serialization/simplified/types.ts";

const wt = buildWebTemplate(
  parseOptXml(
    Deno.readTextFileSync(
      new URL(
        "../../../opt14/ehrbase_blood_pressure_simple.de.v0.opt",
        import.meta.url,
      ),
    ),
  ).operationalTemplate!,
);

function find(
  id: string,
  node: WebTemplateNode = wt.tree,
): WebTemplateNode | undefined {
  if (node.id === id) return node;
  for (const child of node.children ?? []) {
    const found = find(id, child);
    if (found) return found;
  }
}

Deno.test("Web Template: an optional ELEMENT leaf has min 0", () => {
  for (const id of ["systolic", "diastolic"]) {
    const leaf = find(id)!;
    assertEquals([leaf.rmType, leaf.min, leaf.max], ["DV_QUANTITY", 0, 1], id);
  }
});

Deno.test("FLAT validator: no missing-field warning for an optional ELEMENT", () => {
  const result = validateFlatPayload({
    "ctx/language": "de",
    "ctx/territory": "DE",
  }, wt);
  assertEquals(
    result.warnings.filter((w) => /\/(systolic|diastolic)$/.test(w.path)),
    [],
  );
});
