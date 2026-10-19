/**
 * OPT2 (ADL2 operational_template) serialization tests — #130
 */

import { assert, assertEquals, assertGreater } from "https://deno.land/std@0.220.0/assert/mod.ts";
import { parseTemplateInput } from "../../../parser/mod.ts";
import { ADL2Tokenizer } from "../../../parser/adl2_tokenizer.ts";
import { ADL2Parser } from "../../../parser/adl2_parser.ts";
import {
  filterOperationalTemplateLanguages,
  OPT2Serializer,
  opt2SizeMetrics,
} from "../../../generation/mod.ts";

const TEST_DATA = new URL("../../", import.meta.url);

function parseOpt2(adl: string) {
  const tokenizer = new ADL2Tokenizer(adl);
  const parser = new ADL2Parser(tokenizer.tokenize());
  return parser.parse();
}

Deno.test("OPT2 — minimal_evaluation.opt XML round-trip via OPT2", async () => {
  const xml = await Deno.readTextFile(
    new URL("opt14/minimal_evaluation.opt", TEST_DATA),
  );
  const loaded = parseTemplateInput(xml);
  assert(loaded.operationalTemplate);
  const opt = loaded.operationalTemplate!;

  const serializer = new OPT2Serializer();
  const opt2 = serializer.serializeOperationalTemplate(opt);
  assert(opt2.startsWith("operational_template"));
  assert(opt2.includes("definition"));
  assert(opt2.includes("use_archetype") || opt2.includes("EVALUATION["), opt2.slice(0, 500));

  const reparsed = parseOpt2(opt2);
  assertEquals(reparsed.kind, "operational_template");
  assert(reparsed.operationalTemplate?.definition);
  assertEquals(
    reparsed.operationalTemplate?.archetype_id?.value,
    opt.archetype_id?.value,
  );
  assertEquals(
    reparsed.operationalTemplate?.definition?.rm_type_name,
    opt.definition?.rm_type_name,
  );
});

Deno.test("OPT2 — blood pressure template smaller than legacy XML", async () => {
  const xml = await Deno.readTextFile(
    new URL("opt14/ehrbase_blood_pressure_simple.de.v0.opt", TEST_DATA),
  );
  const opt = parseTemplateInput(xml).operationalTemplate!;
  const serializer = new OPT2Serializer();
  const opt2 = serializer.serializeOperationalTemplate(opt);
  const metrics = opt2SizeMetrics(xml, opt2);

  assertGreater(metrics.byteRatio, 2, `expected OPT2 much smaller: ${JSON.stringify(metrics)}`);
  assertGreater(metrics.lineRatio, 2);
});

Deno.test("OPT2 — filterOperationalTemplateLanguages keeps chosen languages", async () => {
  const xml = await Deno.readTextFile(
    new URL("opt14/language_test.opt", TEST_DATA),
  );
  const opt = parseTemplateInput(xml).operationalTemplate!;
  const filtered = filterOperationalTemplateLanguages(opt, ["en"]);
  const defs = (filtered.ontology as { term_definitions?: Record<string, unknown> })
    ?.term_definitions ?? {};
  assert("en" in defs || Object.keys(defs).length <= 1);
  for (const lang of Object.keys(defs)) {
    assertEquals(lang.toLowerCase(), "en");
  }
});

Deno.test("OPT2 — inlineTermLabels adds comment enrichment", async () => {
  const xml = await Deno.readTextFile(
    new URL("opt14/minimal_evaluation.opt", TEST_DATA),
  );
  const opt = parseTemplateInput(xml).operationalTemplate!;
  const serializer = new OPT2Serializer();
  const plain = serializer.serializeOperationalTemplate(opt);
  const enriched = serializer.serializeOperationalTemplate(opt, {
    inlineTermLabels: true,
    inlineTermLabelLanguage: "en",
  });
  assertGreater(enriched.length, plain.length);
  assert(enriched.includes(" -- "), "expected inline term label comments");
});
