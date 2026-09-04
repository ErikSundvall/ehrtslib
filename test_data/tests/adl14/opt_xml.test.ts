/**
 * ADL 1.4 OPT XML parse tests — test_data/opt14/
 */

import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.220.0/assert/mod.ts";
import { parseOptXml } from "../../../parser/legacy/opt_xml_parser.ts";
import { RMInstanceGenerator } from "../../../generation/rm_instance_generator.ts";
import { OptXmlSerializer } from "../../../generation/opt_xml_serializer.ts";
import * as openehr_am from "../../../am/openehr_am.ts";
import type { OperationalTemplateWithTermScopes } from "../../../generation/term_scope.ts";
import {
  TERM_ARCHETYPE_SCOPE_KEY,
  type TermScopeMeta,
} from "../../../generation/term_scope.ts";

const OPT_DIR = new URL("../../opt14/", import.meta.url);

async function listOptFiles(): Promise<string[]> {
  const files: string[] = [];
  for await (const entry of Deno.readDir(OPT_DIR)) {
    if (entry.isFile && entry.name.endsWith(".opt")) files.push(entry.name);
  }
  return files.sort();
}

Deno.test("parseOptXml - all test_data/opt14 fixtures", async () => {
  const files = await listOptFiles();
  assert(files.length >= 15, `expected >=15 OPT files, got ${files.length}`);

  const failures: string[] = [];
  for (const name of files) {
    const xml = await Deno.readTextFile(new URL(name, OPT_DIR));
    try {
      const { operationalTemplate } = parseOptXml(xml);
      assert(
        operationalTemplate.definition?.rm_type_name,
        `${name}: missing root rm_type`,
      );
      assert(
        operationalTemplate.archetype_id?.value,
        `${name}: missing template/archetype id`,
      );
    } catch (e) {
      failures.push(`${name}: ${(e as Error).message}`);
    }
  }

  if (failures.length) {
    throw new Error(
      `OPT parse failures (${failures.length}/${files.length}):\n` +
        failures.join("\n"),
    );
  }
});

Deno.test("parseOptXml - minimal_evaluation generates instance", async () => {
  const xml = await Deno.readTextFile(
    new URL("minimal_evaluation.opt", OPT_DIR),
  );
  const { operationalTemplate } = parseOptXml(xml);
  const gen = new RMInstanceGenerator({ mode: "minimal" });
  const instance = gen.generate(operationalTemplate);
  assertEquals(instance._type, "COMPOSITION");
});

Deno.test("parseOptXml - blood pressure template structure", async () => {
  const xml = await Deno.readTextFile(
    new URL("ehrbase_blood_pressure_simple.de.v0.opt", OPT_DIR),
  );
  const { operationalTemplate } = parseOptXml(xml);
  assertEquals(operationalTemplate.definition?.rm_type_name, "COMPOSITION");
  const content = operationalTemplate.definition?.attributes?.find(
    (a) => a.rm_attribute_name === "content",
  );
  assert(content, "expected content attribute");
});

Deno.test("parseOptXml - blood pressure terminology uses archetype text not RM type names", async () => {
  const xml = await Deno.readTextFile(
    new URL("ehrbase_blood_pressure_simple.de.v0.opt", OPT_DIR),
  );
  const { operationalTemplate } = parseOptXml(xml);
  const terms = operationalTemplate.ontology?.term_definitions?.en;
  assert(terms?.at0005?.text, "expected parsed term text for at0005");
  assert(
    terms.at0005.text !== "[object Object]",
    "term text must not be a broken object stringification",
  );
  // Flat merged ontology is last-wins: composition at0005 ("Admin detail")
  // is overwritten by observation at0005 ("Diastolic"). Prefer scoped lookup.
  assertEquals(terms.at0005.text, "Diastolic");

  const instance = new RMInstanceGenerator({ mode: "example" }).generate(
    operationalTemplate,
  );
  const observation = instance.content?.[0];
  assertEquals(observation?._type, "OBSERVATION");
  assertEquals(
    observation?.name?.value,
    "Blood pressure (Training sample)",
    "observation name should come from template terminology",
  );
});

function findLocatable(
  node: unknown,
  pred: (
    item: { archetype_node_id?: string; name?: { value?: string } },
  ) => boolean,
): { archetype_node_id?: string; name?: { value?: string } } | undefined {
  if (!node || typeof node !== "object") return undefined;
  const rec = node as { archetype_node_id?: string; name?: { value?: string } };
  if (pred(rec)) return rec;
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findLocatable(item, pred);
      if (found) return found;
    }
    return undefined;
  }
  for (const value of Object.values(node as Record<string, unknown>)) {
    const found = findLocatable(value, pred);
    if (found) return found;
  }
  return undefined;
}

function collectArchetypeRoots(
  obj: openehr_am.C_OBJECT | undefined,
  out: openehr_am.C_ARCHETYPE_ROOT[] = [],
): openehr_am.C_ARCHETYPE_ROOT[] {
  if (!obj) return out;
  if (obj instanceof openehr_am.C_ARCHETYPE_ROOT) out.push(obj);
  if (obj instanceof openehr_am.C_COMPLEX_OBJECT) {
    for (const attr of obj.attributes ?? []) {
      for (
        const child
          of (attr as { children?: openehr_am.C_OBJECT[] }).children ?? []
      ) {
        collectArchetypeRoots(child, out);
      }
    }
  }
  return out;
}

Deno.test("parseOptXml - scoped term bags keep colliding at0001 per archetype", async () => {
  const xml = await Deno.readTextFile(
    new URL("ehrbase_blood_pressure_simple.de.v0.opt", OPT_DIR),
  );
  const { operationalTemplate } = parseOptXml(xml);
  const scoped = (operationalTemplate as OperationalTemplateWithTermScopes)
    .archetype_term_definitions ?? {};

  assert(
    operationalTemplate.definition instanceof openehr_am.C_ARCHETYPE_ROOT,
    "OPT <definition> with archetype_id is a C_ARCHETYPE_ROOT",
  );
  assertEquals(
    (operationalTemplate.definition as openehr_am.C_ARCHETYPE_ROOT)
      .archetype_ref,
    "openEHR-EHR-COMPOSITION.sample_encounter.v1",
  );

  assertEquals(
    scoped["openEHR-EHR-CLUSTER.sample_device.v1"]?.en?.at0001?.text,
    "Name",
  );
  assertEquals(
    scoped["openEHR-EHR-OBSERVATION.sample_blood_pressure.v1"]?.en?.at0001
      ?.text,
    "history",
  );
  assertEquals(
    scoped["openEHR-EHR-COMPOSITION.sample_encounter.v1"]?.en?.at0001?.text,
    "Tree",
  );

  const device = collectArchetypeRoots(operationalTemplate.definition).find(
    (r) => r.archetype_ref === "openEHR-EHR-CLUSTER.sample_device.v1",
  );
  assert(device, "expected inlined sample_device C_ARCHETYPE_ROOT");
  assertEquals(
    (device as TermScopeMeta)[TERM_ARCHETYPE_SCOPE_KEY],
    "openEHR-EHR-CLUSTER.sample_device.v1",
  );

  const instance = new RMInstanceGenerator({ mode: "example" }).generate(
    operationalTemplate,
  );
  const deviceCluster = findLocatable(
    instance,
    (item) =>
      typeof item.archetype_node_id === "string" &&
      item.archetype_node_id.includes("sample_device"),
  );
  assert(deviceCluster, "expected sample_device cluster in generated instance");
  assertEquals(
    deviceCluster.name?.value,
    "Device details (training sample)",
    "device cluster must not inherit the observation at0000 label",
  );
});

function findCObject(
  obj: openehr_am.C_OBJECT | undefined,
  pred: (item: openehr_am.C_OBJECT) => boolean,
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

function elementValue(
  opt: openehr_am.OPERATIONAL_TEMPLATE,
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

Deno.test("parseOptXml - C_CODE_PHRASE keeps multi-value code_list and assumed_value", async () => {
  const xml = await Deno.readTextFile(
    new URL("ehrbase_blood_pressure_simple.de.v0.opt", OPT_DIR),
  );
  const { operationalTemplate } = parseOptXml(xml);
  const value = elementValue(operationalTemplate, "at0008");
  assert(value, "expected Position ELEMENT value constraint");
  const defining = value instanceof openehr_am.C_COMPLEX_OBJECT
    ? value.attributes?.find((a) => a.rm_attribute_name === "defining_code")
    : undefined;
  const term = (defining as { children?: openehr_am.C_OBJECT[] })?.children
    ?.[0];
  assert(
    term instanceof openehr_am.C_TERMINOLOGY_CODE,
    "expected C_TERMINOLOGY_CODE",
  );
  const runtime = term as openehr_am.C_TERMINOLOGY_CODE & {
    code_list?: string[];
  };
  assertEquals(
    runtime.code_list,
    ["at1000", "at1001", "at1002", "at1003", "at1013", "at1014"],
  );
  assertEquals(runtime.assumed_value?.code_string, "at1001");
  assertEquals(runtime.assumed_value?.terminology_id, "local");
});

Deno.test("parseOptXml - C_QUANTITY keeps assumed_value magnitude and units", async () => {
  const xml = await Deno.readTextFile(
    new URL("ehrbase_blood_pressure_simple.de.v0.opt", OPT_DIR),
  );
  const { operationalTemplate } = parseOptXml(xml);
  const value = elementValue(operationalTemplate, "at1005");
  assert(value instanceof openehr_am.C_QUANTITY, "expected Tilt C_QUANTITY");
  const assumed = value.assumed_value as
    | { magnitude?: number; units?: string; precision?: number }
    | undefined;
  assertEquals(assumed?.magnitude, 0);
  assertEquals(assumed?.units, "°");
  assertEquals(assumed?.precision, 0);
  const units = ((value as { list?: Array<{ units?: string }> }).list ?? [])
    .map((item) => item.units);
  assertEquals(units, ["°"]);
});

Deno.test("parseOptXml - C_QUANTITY list items keep magnitude and precision intervals", async () => {
  const xml = await Deno.readTextFile(
    new URL("ehrbase_blood_pressure_simple.de.v0.opt", OPT_DIR),
  );
  const { operationalTemplate } = parseOptXml(xml);
  const value = elementValue(operationalTemplate, "at0004");
  assert(
    value instanceof openehr_am.C_QUANTITY,
    "expected Systolic C_QUANTITY",
  );
  const item = (value as {
    list?: Array<{
      units?: string;
      magnitude?: { lower?: number; upper?: number; upper_included?: boolean };
      precision?: { lower?: number; upper?: number };
    }>;
  }).list?.[0];
  assertEquals(item?.units, "mm[Hg]");
  assertEquals(item?.magnitude?.lower, 0);
  assertEquals(item?.magnitude?.upper, 1000);
  assertEquals(item?.magnitude?.upper_included, false);
  assertEquals(item?.precision?.lower, 0);
  assertEquals(item?.precision?.upper, 0);
});

Deno.test("parseOptXml - C_DV_CODED_TEXT nested defining_code becomes C_TERMINOLOGY_CODE", () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<template xmlns="http://schemas.openehr.org/v1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <template_id><value>coded_text_dialect.en.v1</value></template_id>
  <language><code_string>en</code_string></language>
  <concept>test</concept>
  <definition xsi:type="C_COMPLEX_OBJECT">
    <rm_type_name>COMPOSITION</rm_type_name>
    <node_id>at0000</node_id>
    <attributes xsi:type="C_SINGLE_ATTRIBUTE">
      <rm_attribute_name>content</rm_attribute_name>
      <children xsi:type="C_COMPLEX_OBJECT">
        <rm_type_name>ELEMENT</rm_type_name>
        <node_id>at0001</node_id>
        <attributes xsi:type="C_SINGLE_ATTRIBUTE">
          <rm_attribute_name>value</rm_attribute_name>
          <children xsi:type="C_DV_CODED_TEXT">
            <rm_type_name>DV_CODED_TEXT</rm_type_name>
            <defining_code>
              <terminology_id><value>local</value></terminology_id>
              <code_list>at0002</code_list>
              <code_list>at0003</code_list>
              <assumed_value>
                <terminology_id><value>local</value></terminology_id>
                <code_string>at0002</code_string>
              </assumed_value>
            </defining_code>
          </children>
        </attributes>
      </children>
    </attributes>
  </definition>
</template>`;
  const { operationalTemplate } = parseOptXml(xml);
  const value = elementValue(operationalTemplate, "at0001");
  assert(
    value instanceof openehr_am.C_COMPLEX_OBJECT,
    "expected wrapped DV_CODED_TEXT",
  );
  const defining = value.attributes?.find((a) =>
    a.rm_attribute_name === "defining_code"
  );
  const term = (defining as { children?: openehr_am.C_OBJECT[] })?.children
    ?.[0];
  assert(
    term instanceof openehr_am.C_TERMINOLOGY_CODE,
    "expected nested C_TERMINOLOGY_CODE",
  );
  const runtime = term as openehr_am.C_TERMINOLOGY_CODE & {
    code_list?: string[];
  };
  assertEquals(runtime.code_list, ["at0002", "at0003"]);
  assertEquals(runtime.assumed_value?.code_string, "at0002");
});

Deno.test("parseOptXml - C_DV_ORDINAL keeps list values and symbols", async () => {
  const xml = await Deno.readTextFile(
    new URL("constrain_test.opt", OPT_DIR),
  );
  const { operationalTemplate } = parseOptXml(xml);
  const value = findCObject(
    operationalTemplate.definition,
    (obj) =>
      obj instanceof openehr_am.C_ORDINAL &&
      ((obj as { list?: openehr_am.ORDINAL[] }).list?.length ?? 0) >= 4,
  );
  assert(value instanceof openehr_am.C_ORDINAL, "expected C_ORDINAL with list");
  const list = (value as { list?: openehr_am.ORDINAL[] }).list ?? [];
  assertEquals(list.slice(0, 4).map((item) => item.value), [0, 1, 2, 3]);
  assertEquals(
    list.slice(0, 4).map((item) => item.symbol?.code_string),
    ["at0010", "at0011", "at0012", "at0013"],
  );

  const xml2 = new OptXmlSerializer().serialize(operationalTemplate);
  const second = parseOptXml(xml2);
  const again = findCObject(
    second.operationalTemplate.definition,
    (obj) =>
      obj instanceof openehr_am.C_ORDINAL &&
      ((obj as { list?: openehr_am.ORDINAL[] }).list?.length ?? 0) >= 4,
  );
  const list2 = (again as { list?: openehr_am.ORDINAL[] })?.list ?? [];
  assertEquals(list2.slice(0, 4).map((item) => item.symbol?.code_string), [
    "at0010",
    "at0011",
    "at0012",
    "at0013",
  ]);
});
