/**
 * Web Template ↔ OPT and extended FLAT/STRUCTURED round-trip tests.
 */

import {
  assert,
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.220.0/assert/mod.ts";
import { parseOptXml } from "../../../enhanced/parser/legacy/opt_xml_parser.ts";
import { RMInstanceGenerator } from "../../../enhanced/generation/rm_instance_generator.ts";
import {
  JsonCanonicalDeserializer,
  JsonCanonicalSerializer,
} from "../../../enhanced/serialization/json/mod.ts";
import { TypeRegistry } from "../../../enhanced/serialization/common/type_registry.ts";
import * as rm from "../../../enhanced/openehr_rm.ts";
import * as base from "../../../enhanced/openehr_base.ts";
import type { WebTemplateNode } from "../../../enhanced/serialization/simplified/types.ts";
import {
  buildWebTemplate,
  deserializeFromFlat,
  deserializeFromStructured,
  isWebTemplateJson,
  parseWebTemplate,
  serializeToFlat,
  serializeToStructured,
  structuredToFlat,
  toTypedRm,
  webTemplateToOpt,
} from "../../../enhanced/serialization/simplified/mod.ts";

TypeRegistry.registerModule(rm);
TypeRegistry.registerModule(base);

const OPT_DIR = new URL("../../../opt14/", import.meta.url);

function leafAqlPaths(node: WebTemplateNode): string[] {
  const paths: string[] = [];
  if (node.inputs?.length && !node.children?.length) {
    paths.push(node.aqlPath);
  }
  for (const child of node.children ?? []) {
    paths.push(...leafAqlPaths(child));
  }
  return paths;
}

function ctxCode(
  instance: Record<string, unknown>,
  field: "language" | "territory",
): string | undefined {
  const obj = instance[field] as Record<string, unknown> | undefined;
  return obj?.code_string as string | undefined;
}

async function loadOpt(name: string) {
  const xml = await Deno.readTextFile(new URL(name, OPT_DIR));
  const { operationalTemplate } = parseOptXml(xml);
  const wt = buildWebTemplate(operationalTemplate);
  const instance = new RMInstanceGenerator({ mode: "maximal" }).generate(
    operationalTemplate,
  );
  return { operationalTemplate, wt, instance };
}

Deno.test("parseWebTemplate accepts EHRBase webTemplate wrapper", () => {
  const inner = {
    templateId: "demo.en.v1",
    defaultLanguage: "en",
    tree: {
      id: "demo",
      rmType: "COMPOSITION",
      min: 1,
      max: 1,
      aqlPath: "/",
      children: [{
        id: "language",
        rmType: "CODE_PHRASE",
        min: 1,
        max: 1,
        aqlPath: "/language",
        inContext: true,
        inputs: [{ type: "TEXT" }],
      }],
    },
  };
  const wrapped = { webTemplate: inner };
  assert(isWebTemplateJson(wrapped));
  const parsed = parseWebTemplate(wrapped);
  assertEquals(parsed.templateId, "demo.en.v1");
  assertEquals(parsed.tree.rmType, "COMPOSITION");
});

Deno.test("OPT → WT → OPT → WT preserves leaf aqlPaths (minimal_evaluation)", async () => {
  const { wt } = await loadOpt("minimal_evaluation.opt");
  const rebuiltOpt = webTemplateToOpt(parseWebTemplate(JSON.stringify(wt)));
  const wt2 = buildWebTemplate(rebuiltOpt);

  assertEquals(rebuiltOpt.archetype_id?.value, wt.templateId);
  assertExists(rebuiltOpt.definition);

  const before = leafAqlPaths(wt.tree).sort();
  const after = leafAqlPaths(wt2.tree).sort();
  assertEquals(after, before);
});

Deno.test("OPT → WT → OPT → WT preserves leaf aqlPaths (blood pressure)", async () => {
  const { wt } = await loadOpt("ehrbase_blood_pressure_simple.de.v0.opt");
  const wt2 = buildWebTemplate(
    webTemplateToOpt(parseWebTemplate(JSON.stringify(wt))),
  );

  const before = leafAqlPaths(wt.tree).sort();
  const after = leafAqlPaths(wt2.tree).sort();
  assertEquals(after.length, before.length);
  assertEquals(after, before);
});

Deno.test("FLAT full roundtrip preserves all keys (minimal_evaluation)", async () => {
  const { wt, instance } = await loadOpt("minimal_evaluation.opt");
  const flat = serializeToFlat(instance, wt);
  const flat2 = serializeToFlat(deserializeFromFlat(flat, wt), wt);

  const keys = Object.keys(flat).sort();
  assert(keys.length > 0);
  for (const key of keys) {
    assertEquals(flat2[key], flat[key], `key ${key}`);
  }
});

Deno.test("STRUCTURED roundtrip preserves ctx and root branch keys", async () => {
  const { wt, instance } = await loadOpt("minimal_evaluation.opt");
  const structured = serializeToStructured(instance, wt);
  const restored = deserializeFromStructured(structured, wt);
  const structured2 = serializeToStructured(restored, wt);

  assertExists(structured.ctx);
  assertEquals(ctxCode(restored, "language"), "en");
  assertEquals(
    JSON.stringify(structured2.ctx),
    JSON.stringify(structured.ctx),
  );
});

Deno.test("structuredToFlat matches serializeToFlat for clinical keys", async () => {
  const { wt, instance } = await loadOpt("minimal_evaluation.opt");
  const flat = serializeToFlat(instance, wt);
  const fromStructured = structuredToFlat(
    serializeToStructured(instance, wt) as Record<string, unknown>,
    wt,
  );

  for (const key of Object.keys(flat)) {
    if (key.startsWith("ctx/")) {
      assertEquals(fromStructured[key], flat[key], key);
    }
  }
});

Deno.test("toTypedRm produces typed COMPOSITION from FLAT deserialize", async () => {
  const { wt, instance } = await loadOpt("minimal_evaluation.opt");
  const flat = serializeToFlat(instance, wt);
  const plain = deserializeFromFlat(flat, wt);
  const typed = toTypedRm<rm.COMPOSITION>(plain);

  assertEquals(typed.constructor.name, "COMPOSITION");
  assertEquals(typed.language?.code_string, "en");
  assertEquals(typed.territory?.code_string, "US");
});

Deno.test("FLAT → typed RM → canonical JSON roundtrip", async () => {
  const { wt, instance } = await loadOpt("minimal_evaluation.opt");
  const serializer = new JsonCanonicalSerializer();
  const deserializer = new JsonCanonicalDeserializer();

  const flat = serializeToFlat(instance, wt);
  const typed = toTypedRm<rm.COMPOSITION>(deserializeFromFlat(flat, wt));
  const reparsed = deserializer.deserialize<Record<string, unknown>>(
    serializer.serialize(typed),
  );

  assertEquals(ctxCode(reparsed, "language"), "en");
  assertEquals(ctxCode(reparsed, "territory"), "US");
});
