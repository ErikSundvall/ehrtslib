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
import * as openehr_am from "../../../am/openehr_am.ts";
import { buildWebTemplate } from "../../../serialization/simplified/web_template_builder.ts";

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

function definitionSection(adl: string): string {
  const start = adl.indexOf("\ndefinition\n");
  if (start < 0) return "";
  const rest = adl.slice(start + 1);
  const next = rest.search(
    /\n(?:terminology|rules|annotations|component_terminologies|rm_overlay)\n/,
  );
  return next < 0 ? rest : rest.slice(0, next);
}

function countInstances(node: unknown, pred: (value: object) => boolean): number {
  const seen = new Set<object>();
  let count = 0;
  const walk = (value: unknown) => {
    if (!value || typeof value !== "object" || seen.has(value)) return;
    seen.add(value);
    if (pred(value)) count++;
    const rec = value as Record<string, unknown>;
    if (Array.isArray(rec.children)) for (const child of rec.children) walk(child);
    if (Array.isArray(rec.attributes)) for (const attr of rec.attributes) walk(attr);
  };
  walk(node);
  return count;
}

Deno.test("OPT2 — language filter keeps definition prototypes (#157)", async () => {
  const xml = await Deno.readTextFile(
    new URL("opt14/language_test.opt", TEST_DATA),
  );
  const opt = parseTemplateInput(xml).operationalTemplate!;
  const filtered = filterOperationalTemplateLanguages(opt, ["en"]);
  assert(filtered.definition instanceof openehr_am.C_OBJECT);
  assertEquals(
    Object.getPrototypeOf(filtered.definition).constructor,
    Object.getPrototypeOf(opt.definition).constructor,
  );

  const serializer = new OPT2Serializer();
  const all = serializer.serializeOperationalTemplate(opt);
  const en = serializer.serializeOperationalTemplate(opt, { languages: ["en"] });
  assertEquals(definitionSection(en), definitionSection(all));
  assertGreater(definitionSection(en).split("\n").length, 2);

  const web = buildWebTemplate(filtered);
  assertGreater(JSON.stringify(web).length, 400);
});

Deno.test("OPT2 — constraints, slots, and at-coded root (#157)", async () => {
  const xml = await Deno.readTextFile(
    new URL("opt14/ehrbase_blood_pressure_simple.de.v0.opt", TEST_DATA),
  );
  const opt = parseTemplateInput(xml).operationalTemplate!;
  const slots = countInstances(
    opt.definition,
    (value) => value instanceof openehr_am.ARCHETYPE_SLOT,
  );
  const quantities = countInstances(
    opt.definition,
    (value) => value instanceof openehr_am.C_QUANTITY,
  );
  assertGreater(slots, 0);
  assertGreater(quantities, 0);

  const opt2 = new OPT2Serializer().serializeOperationalTemplate(opt);
  const definition = definitionSection(opt2);
  assertEquals((definition.match(/allow_archetype/g) ?? []).length, slots);
  assertGreater((definition.match(/DV_QUANTITY/g) ?? []).length, 0);
  assert(definition.includes("magnitude"));
  assert(definition.includes("units"));
  assert(definition.includes("property"));
  assert(/allow_archetype \w+.*matches \{\s*include/s.test(definition));
  assert(/archetype_id\/value matches \{\/.*\/\}/.test(definition));

  for (const line of definition.split("\n")) {
    if (!line.includes("use_archetype")) continue;
    assert(/use_archetype \w+\[[^\]]*\]/.test(line), line);
    assert(!line.includes("],"), line);
    assert(/\[at\d+/.test(line), line);
  }
  assert((definition.match(/\[at\d+/g) ?? []).length > 0);

  const reparsed = parseOpt2(opt2);
  assertEquals(reparsed.kind, "operational_template");
  assert(reparsed.operationalTemplate?.definition);
});

Deno.test("OPT2 — ordinals, durations, and value codes stay at-codes (#157)", async () => {
  const typesXml = await Deno.readTextFile(
    new URL("opt14/Test_all_types.opt", TEST_DATA),
  );
  const types = new OPT2Serializer().serializeOperationalTemplate(
    parseTemplateInput(typesXml).operationalTemplate!,
  );
  const typesDef = definitionSection(types);
  assert(typesDef.includes("DV_ORDINAL"));
  assert(typesDef.includes("[at0014]"));
  assert(types.includes('["at0014"]') || types.includes("[at0014]"));
  assert(/\[at\d+/.test(typesDef));
  const typesParsed = parseOpt2(types);
  assertEquals(typesParsed.kind, "operational_template");

  const durationXml = await Deno.readTextFile(
    new URL("opt14/duration_validation.opt", TEST_DATA),
  );
  const duration = new OPT2Serializer().serializeOperationalTemplate(
    parseTemplateInput(durationXml).operationalTemplate!,
  );
  assert(definitionSection(duration).includes("|PT24H"));
  const durationParsed = parseOpt2(duration);
  assertEquals(durationParsed.kind, "operational_template");
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
