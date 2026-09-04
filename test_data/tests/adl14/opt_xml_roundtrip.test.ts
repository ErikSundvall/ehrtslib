/**
 * OPT XML serialize → parse round-trip tests.
 */

import {
  assert,
  assertEquals,
  assertStringIncludes,
} from "https://deno.land/std@0.220.0/assert/mod.ts";
import { parseOptXml } from "../../../parser/mod.ts";
import { OptXmlSerializer } from "../../../generation/opt_xml_serializer.ts";
import type { OperationalTemplateWithTermScopes } from "../../../generation/term_scope.ts";
import * as openehr_am from "../../../am/openehr_am.ts";

const TEST_DATA = new URL("../../opt14/", import.meta.url);

Deno.test("OPT XML round-trip - minimal_evaluation", async () => {
  const original = await Deno.readTextFile(
    new URL("minimal_evaluation.opt", TEST_DATA),
  );
  const { operationalTemplate } = parseOptXml(original);
  const xml = new OptXmlSerializer().serialize(operationalTemplate);
  assert(xml.includes("<template"));
  assert(xml.includes("minimal_evaluation.en.v1"));

  const reparsed = parseOptXml(xml);
  assertEquals(
    reparsed.operationalTemplate.definition?.rm_type_name,
    operationalTemplate.definition?.rm_type_name,
  );
  assertEquals(
    reparsed.operationalTemplate.archetype_id?.value,
    operationalTemplate.archetype_id?.value,
  );
});

Deno.test("OPT XML round-trip - sample from opt14 corpus", async () => {
  const serializer = new OptXmlSerializer();
  let count = 0;
  for await (const entry of Deno.readDir(TEST_DATA)) {
    if (!entry.name.endsWith(".opt")) continue;
    const original = await Deno.readTextFile(new URL(entry.name, TEST_DATA));
    const first = parseOptXml(original);
    const xml = serializer.serialize(first.operationalTemplate);
    const second = parseOptXml(xml);
    assertEquals(
      second.operationalTemplate.definition?.rm_type_name,
      first.operationalTemplate.definition?.rm_type_name,
    );
    count++;
    if (count >= 5) break;
  }
  assert(count >= 1);
});

Deno.test("OPT XML serialize emits C_ARCHETYPE_ROOT and per-root term_definitions", async () => {
  const original = await Deno.readTextFile(
    new URL("ehrbase_blood_pressure_simple.de.v0.opt", TEST_DATA),
  );
  const { operationalTemplate } = parseOptXml(original);
  const xml = new OptXmlSerializer().serialize(operationalTemplate);

  assertStringIncludes(xml, 'xsi:type="C_ARCHETYPE_ROOT"');
  assertStringIncludes(xml, "openEHR-EHR-CLUSTER.sample_device.v1");
  assertStringIncludes(xml, 'code="at0001"');
  assertStringIncludes(xml, "Device details (training sample)");

  const reparsed = parseOptXml(xml);
  const scoped =
    (reparsed.operationalTemplate as OperationalTemplateWithTermScopes)
      .archetype_term_definitions ?? {};
  assertEquals(
    scoped["openEHR-EHR-CLUSTER.sample_device.v1"]?.en?.at0001?.text,
    "Name",
  );
  assertEquals(
    scoped["openEHR-EHR-OBSERVATION.sample_blood_pressure.v1"]?.en?.at0001
      ?.text,
    "history",
  );
});

Deno.test("OPT XML round-trip preserves Position code_list and Tilt assumed_value", async () => {
  const original = await Deno.readTextFile(
    new URL("ehrbase_blood_pressure_simple.de.v0.opt", TEST_DATA),
  );
  const first = parseOptXml(original);
  const xml = new OptXmlSerializer().serialize(first.operationalTemplate);
  assertStringIncludes(xml, 'xsi:type="C_CODE_PHRASE"');
  assertStringIncludes(xml, "<code_list>at1001</code_list>");
  assertStringIncludes(xml, "<code_list>at1000</code_list>");
  assertStringIncludes(xml, 'xsi:type="C_DV_QUANTITY"');
  assertStringIncludes(xml, "<units>mm[Hg]</units>");

  const second = parseOptXml(xml);
  const position = elementValue(second.operationalTemplate, "at0008");
  const defining = position instanceof openehr_am.C_COMPLEX_OBJECT
    ? position.attributes?.find((a) => a.rm_attribute_name === "defining_code")
    : undefined;
  const term = (defining as { children?: openehr_am.C_OBJECT[] })?.children
    ?.[0] as
      | (openehr_am.C_TERMINOLOGY_CODE & { code_list?: string[] })
      | undefined;
  assertEquals(
    term?.code_list,
    ["at1000", "at1001", "at1002", "at1003", "at1013", "at1014"],
  );
  assertEquals(term?.assumed_value?.code_string, "at1001");

  const tilt = elementValue(second.operationalTemplate, "at1005");
  assert(tilt instanceof openehr_am.C_QUANTITY);
  const assumed = tilt.assumed_value as
    | { magnitude?: number; units?: string }
    | undefined;
  assertEquals(assumed?.magnitude, 0);
  assertEquals(assumed?.units, "°");

  const systolic = elementValue(second.operationalTemplate, "at0004");
  const item = (systolic as {
    list?: Array<{ magnitude?: { lower?: number; upper?: number } }>;
  })?.list?.[0];
  assertEquals(item?.magnitude?.lower, 0);
  assertEquals(item?.magnitude?.upper, 1000);
});

function elementValue(
  opt: { definition?: openehr_am.C_OBJECT },
  nodeId: string,
): openehr_am.C_OBJECT | undefined {
  const element = findCObject(
    opt.definition,
    (obj) => obj.node_id === nodeId && obj.rm_type_name === "ELEMENT",
  );
  if (!(element instanceof openehr_am.C_COMPLEX_OBJECT)) return undefined;
  const valueAttr = element.attributes?.find((a) =>
    a.rm_attribute_name === "value"
  );
  return (valueAttr as { children?: openehr_am.C_OBJECT[] })?.children?.[0];
}

function findCObject(
  obj: openehr_am.C_OBJECT | undefined,
  pred: (o: openehr_am.C_OBJECT) => boolean,
): openehr_am.C_OBJECT | undefined {
  if (!obj) return undefined;
  if (pred(obj)) return obj;
  if (obj instanceof openehr_am.C_COMPLEX_OBJECT) {
    for (const attr of obj.attributes ?? []) {
      for (
        const child
          of (attr as { children?: openehr_am.C_OBJECT[] }).children ??
            []
      ) {
        const found = findCObject(child, pred);
        if (found) return found;
      }
    }
  }
  return undefined;
}
