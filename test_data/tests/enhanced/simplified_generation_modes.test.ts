import {
  assert,
} from "https://deno.land/std@0.220.0/assert/mod.ts";
import { RMInstanceGenerator } from "../../../enhanced/generation/mod.ts";
import { parseOptXml } from "../../../enhanced/parser/legacy/opt_xml_parser.ts";
import {
  buildWebTemplate,
  serializeToFlat,
  serializeToStructured,
} from "../../../enhanced/serialization/simplified/mod.ts";
import type { WebTemplateNode } from "../../../enhanced/serialization/simplified/types.ts";

const OPT_DIR = new URL("../../opt14/", import.meta.url);

const OPT_FIXTURES = [
  "minimal_evaluation.opt",
  "ehrbase_blood_pressure_simple.de.v0.opt",
  "Test_all_types.opt",
  "minimal_instruction.opt",
  "nested.en.v1.opt",
];

function countWebTemplateNodes(node: WebTemplateNode): number {
  const stack: WebTemplateNode[] = [node];
  const seen = new Set<WebTemplateNode>();
  let count = 0;
  while (stack.length) {
    const current = stack.pop()!;
    if (seen.has(current)) continue;
    seen.add(current);
    count++;
    for (const child of current.children ?? []) stack.push(child);
  }
  return count;
}

function countStructuredLeaves(value: unknown): number {
  if (value == null || typeof value !== "object") return 1;
  if (Array.isArray(value)) {
    return value.reduce((n, item) => n + countStructuredLeaves(item), 0);
  }
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record);
  if (!keys.length) return 0;
  return keys.reduce((n, key) => n + countStructuredLeaves(record[key]), 0);
}

for (const fixture of OPT_FIXTURES) {
  Deno.test(`simplified formats across modes — ${fixture}`, async () => {
    const xml = await Deno.readTextFile(new URL(fixture, OPT_DIR));
    const { operationalTemplate } = parseOptXml(xml);
    const webTemplate = buildWebTemplate(operationalTemplate);

    const flatKeyCounts: Record<string, number> = {};
    const structuredLeafCounts: Record<string, number> = {};

    for (const mode of ["minimal", "example", "maximal"] as const) {
      const instance = new RMInstanceGenerator({ mode }).generate(
        operationalTemplate,
      );
      const flat = serializeToFlat(instance, webTemplate);
      const structured = serializeToStructured(instance, webTemplate);

      flatKeyCounts[mode] = Object.keys(flat).length;
      structuredLeafCounts[mode] = countStructuredLeaves(structured);
    }

    assert(
      flatKeyCounts.maximal >= flatKeyCounts.minimal,
      `${fixture}: maximal flat keys (${flatKeyCounts.maximal}) should be >= minimal (${flatKeyCounts.minimal})`,
    );
    assert(
      structuredLeafCounts.maximal >= structuredLeafCounts.minimal,
      `${fixture}: maximal structured leaves (${structuredLeafCounts.maximal}) should be >= minimal (${structuredLeafCounts.minimal})`,
    );

    if (fixture === "ehrbase_blood_pressure_simple.de.v0.opt") {
      assert(
        flatKeyCounts.example >= flatKeyCounts.minimal,
        "blood pressure template should not shrink flat keys in example mode",
      );
    }
  });
}

Deno.test("buildWebTemplate tree has no cyclic node references", async () => {
  const xml = await Deno.readTextFile(new URL("nested.en.v1.opt", OPT_DIR));
  const { operationalTemplate } = parseOptXml(xml);
  const webTemplate = buildWebTemplate(operationalTemplate);
  const nodeCount = countWebTemplateNodes(webTemplate.tree);
  assert(nodeCount > 0);
});
