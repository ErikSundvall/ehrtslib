/**
 * The `_<rm_attribute>` prefix: any RM attribute not given its own FLAT path
 * is written and read as `/_attr` (BMM-driven), so RM → FLAT → RM is
 * lossless. Payloads follow the conformance examples in
 * docs/vendor/simplified_formats.md (template conformance-ehrbase.de.v0).
 */
import { assert, assertEquals } from "@std/assert";
import { parseOptXml } from "../../../../parser/legacy/opt_xml_parser.ts";
import {
  buildWebTemplate,
  deserializeFromFlatWithIssues,
  deserializeFromStructuredWithIssues,
  type FlatPayload,
  serializeToFlat,
  serializeToStructured,
  type WebTemplate,
} from "../../../../serialization/simplified/mod.ts";

type Rm = Record<string, any>;

const OPT_DIR = new URL("../../../opt14/", import.meta.url);
const SPEC = new URL("../../../../docs/vendor/simplified_formats.md", import.meta.url);
const CLOCK = () => "2026-10-30T12:00:00Z";

async function load(name: string) {
  const xml = await Deno.readTextFile(new URL(name, OPT_DIR));
  const { operationalTemplate } = parseOptXml(xml);
  return { opt: operationalTemplate, wt: buildWebTemplate(operationalTemplate) };
}

const R = "conformance-ehrbase.de.v0";
const SEC = `${R}/conformance_section`;
const OBS = `${SEC}/conformance_observation`;
const ACT = `${SEC}/conformance_action`;
const EV = `${OBS}/any_event:0`;

const BASE: FlatPayload = {
  [`${R}/category|code`]: "433",
  [`${R}/category|value`]: "event",
  [`${R}/category|terminology`]: "openehr",
  [`${R}/context/start_time`]: "2022-01-31T10:33:28+01:00",
  [`${R}/context/setting|code`]: "238",
  [`${R}/context/setting|value`]: "other care",
  [`${R}/context/setting|terminology`]: "openehr",
  [`${R}/language|code`]: "en",
  [`${R}/language|terminology`]: "ISO_639-1",
  [`${R}/territory|code`]: "DE",
  [`${R}/territory|terminology`]: "ISO_3166-1",
  [`${R}/composer|name`]: "Silvia Blake",
};

const OBS_BASE: FlatPayload = {
  [`${EV}/time`]: "2022-01-31T10:33:28+01:00",
  [`${OBS}/language|code`]: "en",
  [`${OBS}/language|terminology`]: "ISO_639-1",
  [`${OBS}/encoding|code`]: "UTF-8",
  [`${OBS}/encoding|terminology`]: "IANA_character-sets",
};

const ACT_BASE: FlatPayload = {
  [`${ACT}/ism_transition/current_state|code`]: "532",
  [`${ACT}/ism_transition/current_state|value`]: "completed",
  [`${ACT}/ism_transition/current_state|terminology`]: "openehr",
  [`${ACT}/time`]: "2022-01-31T10:33:28+01:00",
  [`${ACT}/language|code`]: "en",
  [`${ACT}/language|terminology`]: "ISO_639-1",
  [`${ACT}/encoding|code`]: "UTF-8",
  [`${ACT}/encoding|terminology`]: "IANA_character-sets",
};

function read(flat: FlatPayload, wt: WebTemplate) {
  return deserializeFromFlatWithIssues(flat, wt, { clock: CLOCK, unknownKeys: "warning" });
}

/** FLAT → RM → FLAT → RM: no issues, same RM, and every input key written back. */
function roundTrip(flat: FlatPayload, wt: WebTemplate) {
  const first = read(flat, wt);
  assertEquals(first.issues.filter((i) => i.severity === "error" || i.kind === "unknown-key"), []);
  const out = serializeToFlat(first.composition, wt);
  const second = read(out, wt);
  assertEquals(second.composition, first.composition);
  for (const [k, v] of Object.entries(flat)) assertEquals(out[k], v, k);
  return { rm: first.composition as Rm, out };
}

const action = (rm: Rm) => rm.content[0].items.find((i: Rm) => i._type === "ACTION");
const observation = (rm: Rm) => rm.content[0].items.find((i: Rm) => i._type === "OBSERVATION");

Deno.test("_ prefix: composition _uid, _link:i, _feeder_audit, context/_participation, context/_end_time", async () => {
  const { wt } = await load("conformance_ehrbase.de.v0.opt");
  const { rm } = roundTrip({
    ...BASE,
    [`${R}/_uid`]: "6e3a9506-b81c-4d74-a37f-1464fb7106b2::ehrbase.org::1",
    [`${R}/_link:0|type`]: "problem",
    [`${R}/_link:0|meaning`]: "problem related note",
    [`${R}/_link:0|target`]: "ehr://ehr.network/347a5490-55ee-4da9-b91a-9bba710f730e",
    [`${R}/_feeder_audit/originating_system_audit|system_id`]: "orig",
    [`${R}/_feeder_audit/originating_system_audit|version_id`]: "final",
    [`${R}/_feeder_audit/originating_system_item_id:0|id`]: "id1",
    [`${R}/_feeder_audit/originating_system_item_id:0|type`]: "type1",
    [`${R}/context/_end_time`]: "2022-01-31T11:33:28+01:00",
    [`${R}/context/_participation:0|function`]: "requester",
    [`${R}/context/_participation:0|mode`]: "face-to-face communication",
    [`${R}/context/_participation:0|name`]: "Dr. Marcus Johnson",
    [`${R}/context/_participation:0|id`]: "199",
    [`${R}/context/_participation:0|id_scheme`]: "HOSPITAL-NS",
    [`${R}/context/_participation:0|id_namespace`]: "HOSPITAL-NS",
  }, wt);
  assertEquals(rm.uid, { _type: "OBJECT_VERSION_ID", value: "6e3a9506-b81c-4d74-a37f-1464fb7106b2::ehrbase.org::1" });
  assertEquals(rm.links[0].target, { _type: "DV_EHR_URI", value: "ehr://ehr.network/347a5490-55ee-4da9-b91a-9bba710f730e" });
  assertEquals(rm.feeder_audit.originating_system_audit.system_id, "orig");
  assertEquals(rm.feeder_audit.originating_system_item_ids[0].id, "id1");
  assertEquals(rm.context.end_time.value, "2022-01-31T11:33:28+01:00");
  const p = rm.context.participations[0];
  assertEquals(p.mode.defining_code.code_string, "216");
  assertEquals(p.performer.external_ref.id, { _type: "GENERIC_ID", value: "199", scheme: "HOSPITAL-NS" });
});

Deno.test("_ prefix: entry _other_participation:i, _work_flow_id, _guideline_id, _instruction_details, _uid", async () => {
  const { wt } = await load("conformance_ehrbase.de.v0.opt");
  const { rm } = roundTrip({
    ...BASE,
    ...ACT_BASE,
    [`${ACT}/_instruction_details|path`]: "/content[openEHR-EHR-SECTION.conformance_section.v0]/items[openEHR-EHR-INSTRUCTION.conformance_instruction.v0]",
    [`${ACT}/_instruction_details|composition_uid`]: "4cdc3017-d8c5-4cd3-9900-f3bb7171d006",
    [`${ACT}/_instruction_details|activity_id`]: "activities[at0001]",
    [`${ACT}/_other_participation:0|function`]: "performer",
    [`${ACT}/_other_participation:0|mode`]: "not specified",
    [`${ACT}/_other_participation:0|name`]: "Lara Markham",
    [`${ACT}/_guideline_id|type`]: "GUIDELINE",
    [`${ACT}/_guideline_id|namespace`]: "HOSPITAL-NS",
    [`${ACT}/_guideline_id|id`]: "3445",
    [`${ACT}/_guideline_id|id_scheme`]: "HOSPITAL-NS",
    [`${ACT}/_work_flow_id|type`]: "WORKFLOW",
    [`${ACT}/_work_flow_id|namespace`]: "HOSPITAL-NS",
    [`${ACT}/_work_flow_id|id`]: "335645",
    [`${ACT}/_work_flow_id|id_scheme`]: "HOSPITAL-NS",
    [`${ACT}/_uid`]: "9fcc1c70-9349-444d-b9cb-8fa817697f5e",
  }, wt);
  const a = action(rm);
  assertEquals(a.instruction_details.instruction_id.id.value, "4cdc3017-d8c5-4cd3-9900-f3bb7171d006");
  assertEquals(a.other_participations[0].mode.defining_code.code_string, "193");
  assertEquals(a.workflow_id.id.value, "335645");
  assertEquals(a.guideline_id.type, "GUIDELINE");
  assertEquals(a.uid, { _type: "HIER_OBJECT_ID", value: "9fcc1c70-9349-444d-b9cb-8fa817697f5e" });
});

Deno.test("_ prefix: DV_INTERVAL bounds and flags; _normal_range and _other_reference_ranges", async () => {
  const { wt } = await load("conformance_ehrbase.de.v0.opt");
  const IOBS = `${SEC}/conformance_interval`;
  const IV = `${IOBS}/any_event:0/interval_dv_quantity`;
  const { rm, out } = roundTrip({
    ...BASE,
    [`${IOBS}/any_event:0/time`]: "2022-01-31T10:33:28+01:00",
    [`${IOBS}/language|code`]: "en",
    [`${IOBS}/language|terminology`]: "ISO_639-1",
    [`${IOBS}/encoding|code`]: "UTF-8",
    [`${IOBS}/encoding|terminology`]: "IANA_character-sets",
    [`${IV}/lower|magnitude`]: 72.83,
    [`${IV}/lower|unit`]: "Unit",
    [`${IV}|lower_included`]: false,
    [`${IV}|upper_unbounded`]: true,
    [`${IV}|upper_included`]: false,
  }, wt);
  const { rm: rm2, out: out2 } = roundTrip({
    ...BASE,
    ...OBS_BASE,
    [`${EV}/dv_quantity|magnitude`]: 65.9,
    [`${EV}/dv_quantity|unit`]: "kg",
    [`${EV}/dv_quantity/_normal_range/lower|magnitude`]: 50,
    [`${EV}/dv_quantity/_normal_range/lower|unit`]: "kg",
    [`${EV}/dv_quantity/_other_reference_ranges:0/lower|magnitude`]: 80,
    [`${EV}/dv_quantity/_other_reference_ranges:0/lower|unit`]: "kg",
    [`${EV}/dv_quantity/_other_reference_ranges:0|upper_unbounded`]: true,
    [`${EV}/dv_quantity/_other_reference_ranges:0|upper_included`]: false,
    [`${EV}/dv_quantity/_other_reference_ranges:0/meaning`]: "high",
  }, wt);
  const iobs = rm.content[0].items.find((i: Rm) => i.archetype_node_id?.includes("conformance_interval"));
  const interval = iobs.data.events[0].data.items[0].value;
  assertEquals(interval._type, "DV_INTERVAL");
  assertEquals(interval.lower.magnitude, 72.83);
  assertEquals(interval.upper, undefined);
  assertEquals([interval.lower_included, interval.upper_included, interval.upper_unbounded, interval.lower_unbounded], [false, false, true, false]);
  const q = observation(rm2).data.events[0].data.items.find((i: Rm) => i.value?._type === "DV_QUANTITY").value;
  assertEquals(q.normal_range.upper_unbounded, true);
  assertEquals(q.other_reference_ranges[0].meaning.value, "high");
  assertEquals(q.other_reference_ranges[0].range.upper_unbounded, true);
  // Spec defaults (bounded, included) are not written.
  assert(!(`${IV}|lower_unbounded` in out));
  assert(!(`${EV}/dv_quantity/_normal_range|lower_included` in out2));
});

Deno.test("_ prefix: attributes of subtypes (INTERVAL_EVENT width, PARTY_RELATED relationship)", async () => {
  const { wt } = await load("conformance_ehrbase.de.v0.opt");
  const { rm } = roundTrip({
    ...BASE,
    ...OBS_BASE,
    [`${EV}/width`]: "PT30M",
    [`${EV}/math_function|code`]: "146",
    [`${EV}/math_function|value`]: "mean",
    [`${EV}/math_function|terminology`]: "openehr",
    [`${EV}|sample_count`]: 5,
    [`${OBS}/subject|name`]: "Lara Markham",
    [`${OBS}/subject/relationship|code`]: "10",
    [`${OBS}/subject/relationship|value`]: "mother",
    [`${OBS}/subject/relationship|terminology`]: "openehr",
  }, wt);
  const o = observation(rm);
  assertEquals(o.data.events[0]._type, "INTERVAL_EVENT");
  assertEquals(o.data.events[0].width.value, "PT30M");
  assertEquals(o.data.events[0].sample_count, 5);
  assertEquals(o.subject._type, "PARTY_RELATED");
  assertEquals(o.subject.relationship.defining_code.code_string, "10");
});

Deno.test("_ prefix: an attribute with no named FLAT form round-trips as _attr", async () => {
  const { wt } = await load("conformance_ehrbase.de.v0.opt");
  const { rm, out } = roundTrip({
    ...BASE,
    ...OBS_BASE,
    [`${EV}/dv_text`]: "see link",
    [`${EV}/dv_text/_hyperlink`]: "https://example.org/doc",
    [`${EV}/dv_text/_language|code`]: "sv",
    [`${EV}/dv_text/_language|terminology`]: "ISO_639-1",
    [`${OBS}/_feeder_audit/originating_system_audit|system_id`]: "lab",
  }, wt);
  const text = observation(rm).data.events[0].data.items.find((i: Rm) => i.value?._type === "DV_TEXT").value;
  assertEquals(text.hyperlink, { _type: "DV_URI", value: "https://example.org/doc" });
  assertEquals(text.language.code_string, "sv");
  assertEquals(out[`${EV}/dv_text/_hyperlink`], "https://example.org/doc");
});

Deno.test("_ prefix: set RM attributes without a FLAT path are emitted (RM → FLAT → RM)", async () => {
  const { wt } = await load("conformance_ehrbase.de.v0.opt");
  const { composition } = read({ ...BASE, ...OBS_BASE, [`${EV}/dv_text`]: "x" }, wt);
  const rm = structuredClone(composition) as Rm;
  const o = observation(rm);
  o.uid = { _type: "HIER_OBJECT_ID", value: "c4a1e9b6-0000-4000-8000-000000000001" };
  const element = o.data.events[0].data.items.find((i: Rm) => i.value?._type === "DV_TEXT");
  element.uid = { _type: "HIER_OBJECT_ID", value: "c4a1e9b6-0000-4000-8000-000000000002" };
  element.value.mappings = [{
    _type: "TERM_MAPPING",
    match: "=",
    target: { _type: "CODE_PHRASE", terminology_id: { _type: "TERMINOLOGY_ID", value: "SNOMED-CT" }, code_string: "123" },
  }];
  const out = serializeToFlat(rm, wt);
  assertEquals(out[`${OBS}/_uid`], "c4a1e9b6-0000-4000-8000-000000000001");
  assertEquals(out[`${EV}/dv_text/_uid`], "c4a1e9b6-0000-4000-8000-000000000002");
  assertEquals(out[`${EV}/dv_text/_mapping:0|match`], "=");
  assertEquals(out[`${EV}/dv_text/_mapping:0/target|code`], "123");
  assertEquals(read(out, wt).composition, rm);
});

Deno.test("_ prefix: EVENT offset is computed — not written, ignored with a warning on input", async () => {
  const { wt } = await load("conformance_ehrbase.de.v0.opt");
  const { composition, issues } = read({ ...BASE, ...OBS_BASE, [`${EV}/_offset`]: "PT1H" }, wt);
  assert(issues.some((i) => i.severity === "warning" && /EVENT\.offset is computed/.test(i.message)));
  const rm = structuredClone(composition) as Rm;
  observation(rm).data.events[0].offset = { _type: "DV_DURATION", value: "PT0S" };
  const out = serializeToFlat(rm, wt);
  assert(!Object.keys(out).some((k) => /offset/.test(k)));
});

Deno.test("_ prefix: STRUCTURED round trip of _ attributes", async () => {
  const { wt } = await load("conformance_ehrbase.de.v0.opt");
  const flat: FlatPayload = {
    ...BASE,
    ...ACT_BASE,
    [`${R}/_link:0|type`]: "problem",
    [`${R}/_link:0|meaning`]: "problem related note",
    [`${R}/_link:0|target`]: "ehr://ehr.network/347a5490-55ee-4da9-b91a-9bba710f730e",
    [`${ACT}/_work_flow_id|id`]: "335645",
    [`${ACT}/_work_flow_id|namespace`]: "HOSPITAL-NS",
    [`${ACT}/_work_flow_id|type`]: "WORKFLOW",
    [`${R}/context/_end_time`]: "2022-01-31T11:33:28+01:00",
  };
  const rm = read(flat, wt).composition;
  const structured = serializeToStructured(rm, wt);
  const back = deserializeFromStructuredWithIssues(structured, wt, { clock: CLOCK });
  assertEquals(back.issues.filter((i) => i.severity === "error"), []);
  assertEquals(back.composition, rm);
});

Deno.test("_ prefix: every conformance spec example reads, and RM → FLAT → RM is stable", async () => {
  const { wt } = await load("conformance_ehrbase.de.v0.opt");
  const md = (await Deno.readTextFile(SPEC)).split("\n");
  let blocks = 0;
  for (let i = 0; i < md.length; i++) {
    if (md[i].trim() !== "```json") continue;
    let end = i + 1;
    while (md[end].trim() !== "```") end++;
    const text = md.slice(i + 1, end).join("\n");
    i = end;
    if (!text.includes(`"${R}/`)) continue;
    let flat: FlatPayload;
    try {
      flat = JSON.parse(text);
    } catch {
      continue; // snippets with "…" placeholders
    }
    blocks++;
    const first = deserializeFromFlatWithIssues(flat, wt, {
      clock: CLOCK,
      unknownKeys: "warning",
      codedTextMismatch: "keep",
    });
    const out = serializeToFlat(first.composition, wt);
    const second = deserializeFromFlatWithIssues(out, wt, { clock: CLOCK, codedTextMismatch: "keep" });
    assertEquals(second.issues.filter((x) => x.kind === "unknown-key"), [], `line ${i}`);
    assertEquals(second.composition, first.composition, `line ${i}`);
  }
  assert(blocks > 50, `only ${blocks} examples`);
});

Deno.test("ACTIVITY.action_archetype_id defaults to the template pattern", async () => {
  const { wt } = await load("minimal_instruction.opt");
  const flat: FlatPayload = {
    "ctx/language": "en",
    "ctx/territory": "SE",
    "ctx/composer_name": "Erik Test",
    "ctx/time": "2026-10-30T10:00:00+01:00",
  };
  const paths = (n: any, acc: Rm[] = []): Rm[] => {
    acc.push(n);
    for (const c of n.children ?? []) paths(c, acc);
    return acc;
  };
  const aai = paths(wt.tree).find((n) => n.id === "action_archetype_id");
  assertEquals(aai?.inputs?.[0]?.defaultValue, "/openEHR-EHR-ACTION\\.minimal\\.v1/");
  // Write a value under the activity so the ACTIVITY exists.
  const activity = paths(wt.tree).find((n) => n.rmType === "ACTIVITY")!;
  const leaf = paths(activity).find((n) => n.rmType === "DV_DURATION");
  const fullPath = (target: Rm): string | undefined => {
    const walk = (n: any, base: string): string | undefined => {
      const p = base ? `${base}/${n.id}` : n.id;
      if (n === target) return p;
      for (const c of n.children ?? []) {
        const r = walk(c, p);
        if (r) return r;
      }
    };
    return walk(wt.tree, "");
  };
  flat[fullPath(leaf!)!] = "PT1H";
  const { composition } = deserializeFromFlatWithIssues(flat, wt, { clock: CLOCK, unknownKeys: "warning" });
  const found: Rm[] = [];
  const scan = (o: unknown) => {
    if (!o || typeof o !== "object") return;
    if ((o as Rm)._type === "ACTIVITY") found.push(o as Rm);
    for (const v of Object.values(o)) scan(v);
  };
  scan(composition);
  assert(found.length > 0, "no ACTIVITY built");
  assertEquals(found[0].action_archetype_id, "/openEHR-EHR-ACTION\\.minimal\\.v1/");
});

Deno.test("ACTIVITY.action_archetype_id falls back to /.*/ without a template pattern", async () => {
  const { wt } = await load("conformance_ehrbase.de.v0.opt");
  const { composition } = read({
    ...BASE,
    [`${SEC}/conformance_instruction/narrative`]: "narrative",
    [`${SEC}/conformance_instruction/current_activity/timing`]: "R2/2022-01-31T10:00:00Z/P1D",
    [`${SEC}/conformance_instruction/current_activity/timing|formalism`]: "timing",
    [`${SEC}/conformance_instruction/language|code`]: "en",
    [`${SEC}/conformance_instruction/language|terminology`]: "ISO_639-1",
    [`${SEC}/conformance_instruction/encoding|code`]: "UTF-8",
    [`${SEC}/conformance_instruction/encoding|terminology`]: "IANA_character-sets",
  }, wt);
  const instr = (composition as Rm).content[0].items.find((i: Rm) => i._type === "INSTRUCTION");
  assertEquals(instr.activities[0].action_archetype_id, "/.*/");
});
