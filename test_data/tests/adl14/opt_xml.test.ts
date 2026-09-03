/**
 * ADL 1.4 OPT XML parse tests — test_data/opt14/
 */

import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.220.0/assert/mod.ts";
import { parseOptXml } from "../../../parser/legacy/opt_xml_parser.ts";
import { RMInstanceGenerator } from "../../../generation/rm_instance_generator.ts";
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
