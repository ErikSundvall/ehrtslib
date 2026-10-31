/**
 * FLAT/STRUCTURED input and output flavours, RM-mandatory defaults, clock,
 * unknown keys (#239).
 */
import { assert, assertEquals, assertThrows } from "@std/assert";
import { parseOptXml } from "../../../../parser/legacy/opt_xml_parser.ts";
import { RMInstanceGenerator } from "../../../../generation/rm_instance_generator.ts";
import { TemplateValidator } from "../../../../validation/template_validator.ts";
import {
  buildWebTemplate,
  deserializeFromFlat,
  deserializeFromFlatWithIssues,
  deserializeFromStructuredWithIssues,
  type FlatPayload,
  serializeToFlat,
  serializeToStructured,
  UnknownFlatKeyError,
} from "../../../../serialization/simplified/mod.ts";

type Rm = Record<string, any>;

const OPT_DIR = new URL("../../../opt14/", import.meta.url);
const CLOCK = () => "2026-10-30T12:00:00Z";

async function load(name: string) {
  const xml = await Deno.readTextFile(new URL(name, OPT_DIR));
  const { operationalTemplate } = parseOptXml(xml);
  return { opt: operationalTemplate, wt: buildWebTemplate(operationalTemplate) };
}

function rmMandatory(composition: unknown, opt: unknown): string[] {
  const result = new TemplateValidator({ validateUnits: false })
    .validate(composition as never, opt as never);
  return result.errors
    .filter((e) => /required by RM specification|Required attribute missing/.test(e.message))
    .map((e) => `${e.path} ${e.message}`);
}

/** EHRbase 2.x FLAT output for ehrbase_blood_pressure_simple.de.v0 (POST of INPUT below, then GET). */
const EHRBASE_OUTPUT: FlatPayload = {
  "encounter_training_sample/category|code": "433",
  "encounter_training_sample/category|terminology": "openehr",
  "encounter_training_sample/category|value": "event",
  "encounter_training_sample/context/start_time": "2026-10-30T10:00:00.0+01:00",
  "encounter_training_sample/context/setting|terminology": "openehr",
  "encounter_training_sample/context/setting|code": "238",
  "encounter_training_sample/context/setting|value": "other care",
  "encounter_training_sample/blood_pressure_training_sample:0/systolic|magnitude": 120.0,
  "encounter_training_sample/blood_pressure_training_sample:0/systolic|unit": "mm[Hg]",
  "encounter_training_sample/blood_pressure_training_sample:0/position|code": "at1001",
  "encounter_training_sample/blood_pressure_training_sample:0/position|terminology": "local",
  "encounter_training_sample/blood_pressure_training_sample:0/position|value": "Sitting",
  "encounter_training_sample/blood_pressure_training_sample:0/time": "2026-10-30T10:00:00.0+01:00",
  "encounter_training_sample/blood_pressure_training_sample:0/language|code": "de",
  "encounter_training_sample/blood_pressure_training_sample:0/language|terminology": "ISO_639-1",
  "encounter_training_sample/blood_pressure_training_sample:0/encoding|code": "UTF-8",
  "encounter_training_sample/blood_pressure_training_sample:0/encoding|terminology": "IANA_character-sets",
  "encounter_training_sample/language|terminology": "ISO_639-1",
  "encounter_training_sample/language|code": "de",
  "encounter_training_sample/territory|terminology": "ISO_3166-1",
  "encounter_training_sample/territory|code": "DE",
  "encounter_training_sample/composer|name": "Erik Test",
  "encounter_training_sample/_uid": "289dbeeb-b3ee-4472-ad74-855b575cd53d::local.ehrbase.org::1",
};

const ROOT = "ehrbase_blood_pressure_simple.de.v0";
const OBS = `${ROOT}/blood_pressure_training_sample`;

/** Input flavour: composition values in ctx/, entry and event values defaulted. */
const INPUT: FlatPayload = {
  "ctx/language": "de",
  "ctx/territory": "DE",
  "ctx/composer_name": "Erik Test",
  "ctx/time": "2026-10-30T10:00:00+01:00",
  [`${OBS}/systolic|magnitude`]: 120,
  [`${OBS}/systolic|unit`]: "mm[Hg]",
  [`${OBS}/position|code`]: "at1001",
};

Deno.test("#239 canonical → FLAT → RM keeps every RM-mandatory attribute", async () => {
  for (const name of ["ehrbase_blood_pressure_simple.de.v0.opt", "test-ism.vitagroup.de.v1.opt"]) {
    const { opt, wt } = await load(name);
    const instance = new RMInstanceGenerator({ mode: "example" }).generate(opt);
    assertEquals(rmMandatory(instance, opt), [], `${name}: generated instance`);
    for (const flavor of ["output", "input"] as const) {
      const flat = serializeToFlat(instance, wt, { flavor });
      const { composition, issues } = deserializeFromFlatWithIssues(flat, wt, { clock: CLOCK });
      assertEquals(issues.filter((i) => i.severity === "error"), [], `${name} ${flavor}`);
      assertEquals(rmMandatory(composition, opt), [], `${name} ${flavor}`);
      assertEquals(serializeToFlat(composition, wt, { flavor }), flat, `${name} ${flavor} stable`);
    }
  }
});

Deno.test("#239 output flavour writes RM attributes at their paths, no ctx/", async () => {
  const { opt, wt } = await load("ehrbase_blood_pressure_simple.de.v0.opt");
  const instance = new RMInstanceGenerator({ mode: "example" }).generate(opt);
  const flat = serializeToFlat(instance, wt);
  assertEquals(Object.keys(flat).filter((k) => k.startsWith("ctx/")), []);
  for (const key of [
    `${ROOT}/language|code`,
    `${ROOT}/territory|code`,
    `${ROOT}/composer|name`,
    `${ROOT}/context/start_time`,
    `${ROOT}/context/setting|code`,
    `${OBS}:0/language|code`,
    `${OBS}:0/encoding|code`,
    `${OBS}:0/time`,
    `${OBS}:0/history_origin`,
  ]) {
    assert(key in flat, key);
  }
  // HISTORY and the single max=1 EVENT are collapsed (spec "Level Removal").
  assertEquals(Object.keys(flat).filter((k) => k.includes("/data/") || k.includes("any_event")), []);
});

Deno.test("#239 EHRbase output-style FLAT is accepted and complete", async () => {
  const { opt, wt } = await load("ehrbase_blood_pressure_simple.de.v0.opt");
  const { composition, issues } = deserializeFromFlatWithIssues(EHRBASE_OUTPUT, wt, { clock: CLOCK });
  assertEquals(issues, []);
  assertEquals(rmMandatory(composition, opt), []);
  const c = composition as Rm;
  assertEquals(c.uid.value, "289dbeeb-b3ee-4472-ad74-855b575cd53d::local.ehrbase.org::1");
  assertEquals(c.context.start_time.value, "2026-10-30T10:00:00.0+01:00");
  const obs = c.content[0];
  // No history_origin in the payload: HISTORY.origin = earliest event time.
  assertEquals(obs.data.origin.value, "2026-10-30T10:00:00.0+01:00");
  assertEquals(obs.subject._type, "PARTY_SELF");
});

Deno.test("#239 input flavour: ctx/ and defaults fill RM-mandatory attributes", async () => {
  const { opt, wt } = await load("ehrbase_blood_pressure_simple.de.v0.opt");
  const { composition, issues } = deserializeFromFlatWithIssues(INPUT, wt, { clock: CLOCK });
  assertEquals(issues, []);
  assertEquals(rmMandatory(composition, opt), []);
  const c = composition as Rm;
  assertEquals(c.language.code_string, "de");
  assertEquals(c.territory.code_string, "DE");
  assertEquals(c.composer.name, "Erik Test");
  assertEquals(c.category.defining_code.code_string, "433");
  assertEquals(c.context.start_time.value, "2026-10-30T10:00:00+01:00");
  assertEquals(c.context.setting.defining_code.code_string, "238");
  assertEquals(c.context.setting.value, "other care");
  const obs = c.content[0];
  assertEquals(obs.language.code_string, "de");
  assertEquals(obs.encoding.code_string, "UTF-8");
  assertEquals(obs.subject._type, "PARTY_SELF");
  assertEquals(obs.data._type, "HISTORY");
  assertEquals(obs.data.origin.value, "2026-10-30T10:00:00+01:00");
  assertEquals(obs.data.events[0]._type, "POINT_EVENT");
  assertEquals(obs.data.events[0].time.value, "2026-10-30T10:00:00+01:00");
  assertEquals(obs.data.events[0].data._type, "ITEM_LIST");
  assert(obs.name.value && obs.data.name.value && obs.data.events[0].name.value);

  // The same composition in both flavours; output re-reads to the same RM.
  const output = serializeToFlat(composition, wt);
  assertEquals(output[`${OBS}:0/time`], "2026-10-30T10:00:00+01:00");
  const again = deserializeFromFlat(output, wt, { clock: CLOCK });
  assertEquals(serializeToFlat(again, wt), output);
});

Deno.test("#239 fill order: explicit path, then ctx/, then default", async () => {
  const { wt } = await load("ehrbase_blood_pressure_simple.de.v0.opt");
  const c = deserializeFromFlat({
    ...INPUT,
    [`${ROOT}/language|code`]: "sv",
    [`${ROOT}/language|terminology`]: "ISO_639-1",
    [`${OBS}/time`]: "2026-10-30T09:00:00+01:00",
    "ctx/history_origin": "2026-10-30T08:00:00+01:00",
  }, wt, { clock: CLOCK }) as Rm;
  assertEquals(c.language.code_string, "sv", "path wins over ctx/language");
  const obs = c.content[0];
  assertEquals(obs.language.code_string, "sv", "entry language defaults to the composition language");
  assertEquals(obs.data.events[0].time.value, "2026-10-30T09:00:00+01:00");
  assertEquals(obs.data.origin.value, "2026-10-30T08:00:00+01:00");
});

Deno.test("#239 clock: injectable, null reports, contextDefaults none reports", async () => {
  const { wt } = await load("ehrbase_blood_pressure_simple.de.v0.opt");
  const noTime = { ...INPUT };
  delete noTime["ctx/time"];

  const c = deserializeFromFlat(noTime, wt, { clock: CLOCK }) as Rm;
  assertEquals(c.context.start_time.value, "2026-10-30T12:00:00Z");
  assertEquals(c.content[0].data.events[0].time.value, "2026-10-30T12:00:00Z");

  const nullClock = deserializeFromFlatWithIssues(noTime, wt, { clock: null });
  assert(nullClock.issues.some((i) => i.kind === "missing-mandatory" && i.path === "/context/start_time"));

  const none = deserializeFromFlatWithIssues(INPUT, wt, { contextDefaults: "none" });
  const paths = none.issues.filter((i) => i.kind === "missing-mandatory").map((i) => i.path);
  assert(paths.some((p) => p.endsWith("/encoding")), paths.join());
  assert(paths.some((p) => p.endsWith("/subject")), paths.join());
  assertEquals((none.composition as Rm).content[0].encoding, undefined);
});

Deno.test("#239 unknown keys are reported, not dropped silently", async () => {
  const { wt } = await load("ehrbase_blood_pressure_simple.de.v0.opt");
  const flat = { ...INPUT, [`${OBS}/no_such_node|magnitude`]: 1, "ctx/no_such_ctx": "x", "other_root/x": 1 };

  const { issues } = deserializeFromFlatWithIssues(flat, wt, { clock: CLOCK });
  const unknown = issues.filter((i) => i.kind === "unknown-key");
  assertEquals(unknown.map((i) => [i.path, i.severity]), [
    [`${OBS}/no_such_node|magnitude`, "error"],
    ["ctx/no_such_ctx", "warning"],
    ["other_root/x", "error"],
  ]);
  assertThrows(() => deserializeFromFlat(flat, wt, { clock: CLOCK }), UnknownFlatKeyError);

  const warn = deserializeFromFlatWithIssues(flat, wt, { clock: CLOCK, unknownKeys: "warning" });
  assert(warn.issues.filter((i) => i.kind === "unknown-key").every((i) => i.severity === "warning"));
  deserializeFromFlat(flat, wt, { clock: CLOCK, unknownKeys: "warning" });

  const ignore = deserializeFromFlatWithIssues(flat, wt, { clock: CLOCK, unknownKeys: "ignore" });
  assertEquals(ignore.issues.filter((i) => i.kind === "unknown-key"), []);
});

Deno.test("#239 older ehrtslib paths with a HISTORY data segment are accepted", async () => {
  const { wt } = await load("ehrbase_blood_pressure_simple.de.v0.opt");
  const { composition, issues } = deserializeFromFlatWithIssues({
    ...INPUT,
    [`${OBS}/systolic|magnitude`]: undefined as never,
    [`${OBS}/data/any_event/systolic|magnitude`]: 130,
  }, wt, { clock: CLOCK });
  assertEquals(issues.map((i) => i.kind), ["legacy-path"]);
  const items = (composition as Rm).content[0].data.events[0].data.items as Rm[];
  assert(items.some((e) => e.value?.magnitude === 130));
});

Deno.test("#239 ELEMENT null_flavour round trips via _null_flavour", async () => {
  const { opt, wt } = await load("ehrbase_blood_pressure_simple.de.v0.opt");
  const flat = {
    ...INPUT,
    [`${OBS}/diastolic/_null_flavour|code`]: "271",
    [`${OBS}/diastolic/_null_flavour|value`]: "no information",
  };
  const { composition, issues } = deserializeFromFlatWithIssues(flat, wt, { clock: CLOCK });
  assertEquals(issues, []);
  assertEquals(rmMandatory(composition, opt), []);
  const out = serializeToFlat(composition, wt);
  assertEquals(out[`${OBS}:0/diastolic/_null_flavour|code`], "271");
  assertEquals(out[`${OBS}:0/diastolic/_null_flavour|terminology`], "openehr");
});

Deno.test("#239 STRUCTURED: both flavours round trip, input ctx is applied", async () => {
  const { opt, wt } = await load("ehrbase_blood_pressure_simple.de.v0.opt");
  const instance = new RMInstanceGenerator({ mode: "example" }).generate(opt);
  for (const flavor of ["output", "input"] as const) {
    const structured = serializeToStructured(instance, wt, { flavor });
    assertEquals("ctx" in structured, flavor === "input");
    const { composition, issues } = deserializeFromStructuredWithIssues(structured, wt, { clock: CLOCK });
    assertEquals(issues.filter((i) => i.severity === "error"), [], flavor);
    assertEquals(rmMandatory(composition, opt), [], flavor);
    assertEquals(serializeToStructured(composition, wt, { flavor }), structured, flavor);
  }

  const { composition, issues } = deserializeFromStructuredWithIssues({
    ctx: { language: "de", territory: "DE", composer_name: "Erik Test", time: "2026-10-30T10:00:00+01:00" },
    encounter_training_sample: {
      blood_pressure_training_sample: [{ systolic: [{ "|magnitude": 120, "|unit": "mm[Hg]" }] }],
    },
  }, wt, { clock: CLOCK });
  assertEquals(issues, []);
  assertEquals(rmMandatory(composition, opt), []);
  assertEquals((composition as Rm).content[0].data.events[0].time.value, "2026-10-30T10:00:00+01:00");
});

/** The blood pressure Web Template with its category fixed to persistent (431). */
async function loadPersistent() {
  const { opt, wt } = await load("ehrbase_blood_pressure_simple.de.v0.opt");
  const persistent = structuredClone(wt);
  const category = persistent.tree.children!.find((n) => n.aqlPath === "/category")!;
  for (const input of category.inputs ?? []) {
    if (input.list?.length) input.list = [{ value: "431", label: "persistent" }];
  }
  return { opt, wt: persistent };
}

Deno.test("#239 composer PARTY_SELF: output writes composer|_type, no ctx/", async () => {
  const { opt, wt } = await load("ehrbase_blood_pressure_simple.de.v0.opt");
  const instance = new RMInstanceGenerator({ mode: "example" }).generate(opt) as Rm;
  for (const composer of [
    { _type: "PARTY_SELF" },
    {
      _type: "PARTY_SELF",
      external_ref: {
        _type: "PARTY_REF",
        id: { _type: "GENERIC_ID", value: "p-1", scheme: "local" },
        namespace: "demographic",
        type: "PARTY",
      },
    },
  ]) {
    instance.composer = composer;
    const flat = serializeToFlat(instance, wt);
    assertEquals(Object.keys(flat).filter((k) => k.startsWith("ctx/")), []);
    assertEquals(flat[`${ROOT}/composer|_type`], "PARTY_SELF");
    const { composition, issues } = deserializeFromFlatWithIssues(flat, wt, { clock: CLOCK });
    assertEquals(issues, []);
    const c = composition as Rm;
    assertEquals(c.composer._type, "PARTY_SELF");
    assertEquals(c.composer.name, undefined);
    assertEquals(serializeToFlat(composition, wt), flat);

    // Input flavour keeps the spec form ctx/composer_self.
    const input = serializeToFlat(instance, wt, { flavor: "input" });
    assertEquals(input["ctx/composer_self"], true);
    assertEquals(input[`${ROOT}/composer|_type`], undefined);
    const fromInput = deserializeFromFlat(input, wt, { clock: CLOCK }) as Rm;
    assertEquals(fromInput.composer._type, "PARTY_SELF");
  }

  // ctx/composer_self (EHRbase output) is still accepted.
  const self = { ...INPUT, "ctx/composer_self": true };
  delete self["ctx/composer_name"];
  assertEquals((deserializeFromFlat(self, wt, { clock: CLOCK }) as Rm).composer._type, "PARTY_SELF");
});

Deno.test("#239 context by category: event gets one, persistent only from context/ paths", async () => {
  // Event composition (433): a context is created even without ctx/ keys.
  const { wt } = await load("ehrbase_blood_pressure_simple.de.v0.opt");
  const noCtx: FlatPayload = Object.fromEntries(
    Object.entries(INPUT).filter(([k]) => !k.startsWith("ctx/time")),
  );
  const event = deserializeFromFlatWithIssues(
    { ...noCtx, [`${ROOT}/language|code`]: "de", [`${ROOT}/language|terminology`]: "ISO_639-1" },
    wt,
    { clock: CLOCK },
  );
  assertEquals((event.composition as Rm).context.start_time.value, CLOCK());

  // contextDefaults "none": ctx/ context keys still fill the event context;
  // without them the missing context is reported.
  const none = deserializeFromFlatWithIssues(INPUT, wt, { contextDefaults: "none" });
  assertEquals((none.composition as Rm).context.start_time.value, "2026-10-30T10:00:00+01:00");
  const noneNoCtx = deserializeFromFlatWithIssues(noCtx, wt, { contextDefaults: "none" });
  assertEquals((noneNoCtx.composition as Rm).context, undefined);
  assert(noneNoCtx.issues.some((i) => i.path === "/context" && i.severity === "warning"));

  // Persistent composition (431): ctx/ context keys are ignored with a warning.
  const p = await loadPersistent();
  const persistent = deserializeFromFlatWithIssues(
    { ...INPUT, "ctx/setting": "238" },
    p.wt,
    { clock: CLOCK },
  );
  const pc = persistent.composition as Rm;
  assertEquals(pc.category.defining_code.code_string, "431");
  assertEquals(pc.context, undefined);
  const warning = persistent.issues.find((i) => i.kind === "context-rule");
  assert(warning && warning.severity === "warning" && /ctx\/time, ctx\/setting/.test(warning.message), warning?.message);
  assertEquals(persistent.issues.filter((i) => i.severity === "error"), []);

  // ... and explicit context/ paths are kept without a warning (RM 1.0.4+).
  const explicit = deserializeFromFlatWithIssues(
    { ...INPUT, [`${ROOT}/context/start_time`]: "2026-10-30T09:00:00+01:00" },
    p.wt,
    { clock: CLOCK },
  );
  const ec = explicit.composition as Rm;
  assertEquals(ec.context.start_time.value, "2026-10-30T09:00:00+01:00");
  assertEquals(ec.context.setting.defining_code.code_string, "238");
  assertEquals(explicit.issues.filter((i) => i.kind === "context-rule"), []);
  const explicitFlat = serializeToFlat(ec, p.wt);
  assertEquals(explicitFlat[`${ROOT}/context/start_time`], "2026-10-30T09:00:00+01:00");
  const explicitAgain = deserializeFromFlatWithIssues(explicitFlat, p.wt, { clock: CLOCK });
  assertEquals(explicitAgain.issues.filter((i) => i.kind === "context-rule"), []);
  assertEquals(serializeToFlat(explicitAgain.composition, p.wt), explicitFlat);

  // Both flavours round trip a persistent composition without context.
  const instance = deserializeFromFlat({ ...INPUT }, p.wt, { clock: CLOCK, unknownKeys: "ignore" });
  for (const flavor of ["output", "input"] as const) {
    const flat = serializeToFlat(instance, p.wt, { flavor });
    assertEquals(Object.keys(flat).filter((k) => /context|ctx\/time/.test(k)), [], flavor);
    const again = deserializeFromFlatWithIssues(flat, p.wt, { clock: CLOCK });
    assertEquals((again.composition as Rm).context, undefined, flavor);
    assertEquals(again.issues.filter((i) => i.kind === "context-rule"), [], flavor);
    assertEquals(serializeToFlat(again.composition, p.wt, { flavor }), flat, `${flavor} stable`);
  }
});
