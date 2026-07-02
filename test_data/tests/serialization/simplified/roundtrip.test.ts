/**
 * Round-trip tests: canonical JSON ↔ FLAT / STRUCTURED simplified formats.
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.220.0/assert/mod.ts";
import { parseOptXml } from "../../../enhanced/parser/legacy/opt_xml_parser.ts";
import { RMInstanceGenerator } from "../../../enhanced/generation/rm_instance_generator.ts";
import {
  JsonCanonicalDeserializer,
  JsonCanonicalSerializer,
} from "../../../enhanced/serialization/json/mod.ts";
import { TypeRegistry } from "../../../enhanced/serialization/common/type_registry.ts";
import * as rm from "../../../enhanced/openehr_rm.ts";
import * as base from "../../../enhanced/openehr_base.ts";
import {
  buildWebTemplate,
  serializeToFlat,
  deserializeFromFlat,
  serializeToStructured,
  deserializeFromStructured,
  structuredToFlat,
} from "../../../enhanced/serialization/simplified/mod.ts";

TypeRegistry.registerModule(rm);
TypeRegistry.registerModule(base);

const OPT_DIR = new URL("../../../opt14/", import.meta.url);

function ctxCode(instance: Record<string, unknown>, field: "language" | "territory"): string | undefined {
  const obj = instance[field] as Record<string, unknown> | undefined;
  return obj?.code_string as string | undefined;
}

async function loadMinimalEvaluationFixture() {
  const xml = await Deno.readTextFile(new URL("minimal_evaluation.opt", OPT_DIR));
  const { operationalTemplate } = parseOptXml(xml);
  const wt = buildWebTemplate(operationalTemplate);
  const instance = new RMInstanceGenerator({ mode: "maximal" }).generate(operationalTemplate);
  return { operationalTemplate, wt, instance };
}

Deno.test("FLAT roundtrip preserves ctx fields", async () => {
  const { wt, instance } = await loadMinimalEvaluationFixture();
  const flat = serializeToFlat(instance, wt);
  const restored = deserializeFromFlat(flat, wt);
  const flat2 = serializeToFlat(restored, wt);

  assertEquals(flat["ctx/language"], "en");
  assertEquals(flat2["ctx/language"], flat["ctx/language"]);
  assertEquals(flat2["ctx/territory"], flat["ctx/territory"]);
  assertEquals(ctxCode(restored, "language"), "en");
  assertEquals(ctxCode(restored, "territory"), "US");
});

Deno.test("STRUCTURED roundtrip preserves ctx fields", async () => {
  const { wt, instance } = await loadMinimalEvaluationFixture();
  const structured = serializeToStructured(instance, wt);
  const restored = deserializeFromStructured(structured, wt);
  const structured2 = serializeToStructured(restored, wt);

  assertExists(structured.ctx);
  assertEquals((structured.ctx as Record<string, unknown>).language, "en");
  assertEquals(ctxCode(restored, "language"), "en");
  assertEquals(
    (structured2.ctx as Record<string, unknown>).language,
    (structured.ctx as Record<string, unknown>).language,
  );
});

Deno.test("FLAT and STRUCTURED deserialize to equivalent ctx", async () => {
  const { wt, instance } = await loadMinimalEvaluationFixture();
  const flat = serializeToFlat(instance, wt);
  const structured = serializeToStructured(instance, wt);

  const fromFlat = deserializeFromFlat(flat, wt);
  const fromStructured = deserializeFromStructured(structured, wt);

  assertEquals(ctxCode(fromFlat, "language"), ctxCode(fromStructured, "language"));
  assertEquals(ctxCode(fromFlat, "territory"), ctxCode(fromStructured, "territory"));
});

Deno.test("structuredToFlat matches direct FLAT serialization ctx keys", async () => {
  const { wt, instance } = await loadMinimalEvaluationFixture();
  const flat = serializeToFlat(instance, wt);
  const structured = serializeToStructured(instance, wt);
  const converted = structuredToFlat(structured, wt);

  assertEquals(converted["ctx/language"], flat["ctx/language"]);
  assertEquals(converted["ctx/territory"], flat["ctx/territory"]);
});

Deno.test("FLAT → RM → canonical JSON preserves ctx", async () => {
  const { wt, instance } = await loadMinimalEvaluationFixture();
  const serializer = new JsonCanonicalSerializer();
  const deserializer = new JsonCanonicalDeserializer();

  const flat = serializeToFlat(instance, wt);
  const restored = deserializeFromFlat(flat, wt);
  const canonicalJson = serializer.serialize(restored);
  const reparsed = deserializer.deserialize<Record<string, unknown>>(canonicalJson);

  assertEquals(ctxCode(reparsed, "language"), "en");
  assertEquals(ctxCode(reparsed, "territory"), "US");
});

Deno.test("STRUCTURED → RM → canonical JSON preserves ctx", async () => {
  const { wt, instance } = await loadMinimalEvaluationFixture();
  const serializer = new JsonCanonicalSerializer();
  const deserializer = new JsonCanonicalDeserializer();

  const structured = serializeToStructured(instance, wt);
  const restored = deserializeFromStructured(structured, wt);
  const reparsed = deserializer.deserialize<Record<string, unknown>>(
    serializer.serialize(restored),
  );

  assertEquals(ctxCode(restored, "language"), "en");
  assertEquals(ctxCode(reparsed, "language"), "en");
  assertEquals(ctxCode(reparsed, "territory"), "US");
});

Deno.test("blood pressure template FLAT roundtrip ctx", async () => {
  const xml = await Deno.readTextFile(
    new URL("ehrbase_blood_pressure_simple.de.v0.opt", OPT_DIR),
  );
  const { operationalTemplate } = parseOptXml(xml);
  const wt = buildWebTemplate(operationalTemplate);
  const instance = new RMInstanceGenerator({ mode: "minimal" }).generate(operationalTemplate);

  const flat = serializeToFlat(instance, wt);
  const restored = deserializeFromFlat(flat, wt);
  const flat2 = serializeToFlat(restored, wt);

  if (flat["ctx/language"] != null) {
    assertEquals(flat2["ctx/language"], flat["ctx/language"]);
    assertEquals(ctxCode(restored, "language"), flat["ctx/language"]);
  }
});
