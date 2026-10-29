/**
 * RM constructor init objects (#216).
 *
 * Concrete classes must keep attributes passed to `new`. Terse strings in
 * DATA_VALUE slots become DV_CODED_TEXT / DV_TEXT. Unknown keys throw.
 */

import { assert, assertEquals, assertThrows } from "jsr:@std/assert";
import { JsonCanonicalSerializer } from "../../../serialization/json/json_canonical_serializer.ts";
import { TypeScriptConstructorSerializer } from "../../../serialization/typescript/typescript_constructor_serializer.ts";
import { registerOpenEhrModelTypes } from "../../../serialization/common/openehr_model_registry.ts";
import {
  attributesFor,
  hasRmType,
  isAbstractType,
} from "../../../meta/rm_attributes.ts";
import {
  CLUSTER,
  DV_BOOLEAN,
  DV_CODED_TEXT,
  DV_QUANTITY,
  ELEMENT,
  OBSERVATION,
  PARTY_SELF,
} from "../../../rm/openehr_rm.ts";
import * as rm from "../../../rm/mod.ts";
import * as base from "../../../base/mod.ts";

registerOpenEhrModelTypes();

function canonical(value: unknown): Record<string, unknown> {
  return JSON.parse(new JsonCanonicalSerializer().serialize(value));
}

Deno.test("ELEMENT init object coerces a terse DV_CODED_TEXT value", () => {
  const element = new ELEMENT({
    archetype_node_id: "at0008",
    name: "Position",
    value: "local::at1001|Sitting|",
  });
  const json = canonical(element);
  assertEquals(json._type, "ELEMENT");
  assertEquals(json.archetype_node_id, "at0008");
  const name = json.name as Record<string, unknown>;
  assertEquals(name._type, "DV_TEXT");
  assertEquals(name.value, "Position");
  const value = json.value as Record<string, unknown>;
  assertEquals(value._type, "DV_CODED_TEXT");
  assertEquals(value.value, "Sitting");
  const defining = value.defining_code as Record<string, unknown>;
  assertEquals(defining._type, "CODE_PHRASE");
  assertEquals(defining.code_string, "at1001");
  const terminology = defining.terminology_id as Record<string, unknown>;
  assertEquals(terminology.value, "local");
});

Deno.test("DV_QUANTITY init object keeps magnitude and units", () => {
  const quantity = new DV_QUANTITY({ magnitude: 120, units: "mm[Hg]" });
  const json = canonical(quantity);
  assertEquals(json._type, "DV_QUANTITY");
  assertEquals(json.magnitude, 120);
  assertEquals(json.units, "mm[Hg]");
});

Deno.test("ELEMENT init keeps an existing DV_CODED_TEXT instance", () => {
  const coded = new DV_CODED_TEXT("local::at1001|Sitting|");
  const element = new ELEMENT({
    archetype_node_id: "at0008",
    value: coded,
  });
  assertEquals(element.value, coded);
  const json = canonical(element);
  const value = json.value as Record<string, unknown>;
  const defining = value.defining_code as Record<string, unknown>;
  assertEquals(defining.code_string, "at1001");
});

Deno.test("unknown init key throws and names the attribute and type", () => {
  const error = assertThrows(
    () => new ELEMENT({ archetype_node_id: "at0008", not_a_field: true }),
    Error,
  );
  assert(error.message.includes("not_a_field"));
  assert(error.message.includes("ELEMENT"));
});

Deno.test("empty constructors still build an instance", () => {
  const element = new ELEMENT();
  const quantity = new DV_QUANTITY();
  assertEquals(element.archetype_node_id, undefined);
  assertEquals(element.value, undefined);
  assertEquals(quantity.magnitude, undefined);
  assertEquals(quantity.units, undefined);
  assertEquals(canonical(element)._type, "ELEMENT");
  assertEquals(canonical(quantity)._type, "DV_QUANTITY");
});

Deno.test("DV_BOOLEAN init uses the value setter", () => {
  const flag = new DV_BOOLEAN({ value: true });
  assertEquals(flag.value, true);
});

Deno.test("parent calls setParent and is optional", () => {
  const cluster = new CLUSTER({ archetype_node_id: "at0002", name: "Group" });
  const element = new ELEMENT({
    archetype_node_id: "at0008",
    name: "Position",
    parent: cluster,
  });
  assertEquals(element.parent(), cluster);
  assertEquals(new ELEMENT({ archetype_node_id: "at0001" }).parent(), undefined);
});

Deno.test("parent without setParent throws", () => {
  const error = assertThrows(
    () => new DV_QUANTITY({ magnitude: 1, units: "m", parent: new CLUSTER() }),
    Error,
  );
  assert(error.message.includes("parent"));
  assert(error.message.includes("DV_QUANTITY"));
});

Deno.test("plain object for abstract PARTY_PROXY throws", () => {
  const error = assertThrows(
    () => new OBSERVATION({ subject: { name: "Dr. Smith" } }),
    Error,
  );
  assert(error.message.includes("PARTY_PROXY"));
  assert(error.message.includes("_type"));
});

Deno.test("abstract PARTY_PROXY accepts an existing instance", () => {
  const subject = new PARTY_SELF();
  const observation = new OBSERVATION({ subject });
  assertEquals(observation.subject, subject);
});

Deno.test("TypeScript constructor serializer round-trips ELEMENT coded text", () => {
  const original = new ELEMENT({
    archetype_node_id: "at0008",
    name: "Position",
    value: new DV_CODED_TEXT("local::at1001|Sitting|"),
  });
  const code = new TypeScriptConstructorSerializer().serialize(original);
  assert(code.includes("new ELEMENT"));
  assert(code.includes("local::at1001|Sitting|"));

  const withoutImports = code
    .replace(
      /import\s*\{([^}]+)\}\s*from\s*'\.\/openehr_rm\.ts';\n/g,
      "const {$1} = rm;\n",
    )
    .replace(
      /import\s*\{([^}]+)\}\s*from\s*'\.\/openehr_base\.ts';\n/g,
      "const {$1} = base;\n",
    );
  const varName = withoutImports.match(/const\s+(\w+)\s*=/)?.[1];
  assert(varName, "serializer should bind a const");
  const built = new Function(
    "rm",
    "base",
    `${withoutImports}\nreturn ${varName};`,
  )(rm, base);
  const json = canonical(built);
  assertEquals(json._type, "ELEMENT");
  const value = json.value as Record<string, unknown>;
  assertEquals(value._type, "DV_CODED_TEXT");
  const defining = value.defining_code as Record<string, unknown>;
  assertEquals(defining.code_string, "at1001");
  const terminology = defining.terminology_id as Record<string, unknown>;
  assertEquals(terminology.value, "local");
  assertEquals(value.value, "Sitting");
});

Deno.test("primitive wrappers still accept their own values", () => {
  assertEquals(new base.String("hi").value, "hi");
  assertEquals(new base.Integer(3).value, 3);
  assertEquals(new base.Boolean(false).value, false);
});

function typeBase(typeName: string): string {
  const list = typeName.match(/^(?:List|Array)<(.+)>$/);
  const inner = list ? list[1] : typeName;
  const lt = inner.indexOf("<");
  return lt > 0 ? inner.slice(0, lt) : inner;
}

function sampleFor(
  typeName: string,
  depth = 0,
): unknown {
  if (depth > 4) return undefined;
  const list = typeName.match(/^(?:List|Array)<(.+)>$/);
  if (list) {
    const inner = sampleFor(list[1], depth + 1);
    return inner === undefined ? undefined : [inner];
  }
  const baseName = typeBase(typeName);
  if (baseName === "String" || baseName === "Character") return "x";
  if (
    baseName === "Integer" || baseName === "Integer64" ||
    baseName === "Real" || baseName === "Double"
  ) {
    return 1;
  }
  if (baseName === "Boolean") return true;
  if (baseName === "DV_TEXT" || (isAbstractType(baseName) && baseName === "DATA_VALUE")) {
    return "hello";
  }
  if (baseName === "CODE_PHRASE") return "local::at0001";
  if (baseName === "DV_CODED_TEXT") return "local::at0001|Yes|";
  if (baseName === "PARTY_PROXY" || baseName === "PARTY_IDENTIFIED") {
    return new rm.PARTY_SELF();
  }
  if (baseName === "UID_BASED_ID" || baseName === "OBJECT_ID") {
    const id = new base.HIER_OBJECT_ID();
    id.value = "1.2.3";
    return id;
  }
  if (baseName === "T" || baseName === "X") return undefined;
  if (hasRmType(baseName) && isAbstractType(baseName)) return undefined;
  const ctor = (rm as Record<string, unknown>)[baseName] ??
    (base as Record<string, unknown>)[baseName];
  if (typeof ctor === "function") {
    try {
      return new (ctor as new () => object)();
    } catch {
      return undefined;
    }
  }
  return undefined;
}

function readBack(got: unknown, sample: unknown): boolean {
  if (got === undefined) return false;
  if (got === sample) return true;
  if (typeof sample === "string" && got && typeof got === "object") {
    const record = got as {
      value?: unknown;
      code_string?: unknown;
      defining_code?: { code_string?: unknown };
    };
    if (sample.includes("|") && typeof record.defining_code?.code_string === "string") {
      return true;
    }
    if (sample.includes("::") && typeof record.code_string === "string") {
      return true;
    }
    if ("value" in record && record.value === sample) return true;
    return false;
  }
  if (typeof sample === "number" || typeof sample === "boolean") {
    if (got === sample) return true;
    if (got && typeof got === "object" && "value" in got) {
      return (got as { value?: unknown }).value === sample;
    }
    return false;
  }
  if (Array.isArray(sample) && Array.isArray(got)) {
    return got.length === sample.length && got.every((item, i) => readBack(item, sample[i]));
  }
  return got !== undefined;
}

Deno.test("every concrete RM class with BMM attributes keeps a known init value", () => {
  const failures: string[] = [];
  const uncovered: string[] = [];
  for (const [name, value] of Object.entries(rm)) {
    if (typeof value !== "function" || !value.prototype) continue;
    if (!hasRmType(name) || isAbstractType(name)) continue;
    const attrs = attributesFor(name).filter((attr) => attr.name !== "parent");
    try {
      new (value as new () => object)();
    } catch (error) {
      failures.push(`${name} empty ctor: ${error instanceof Error ? error.message : error}`);
      continue;
    }
    if (attrs.length === 0) continue;
    let chosen: { name: string; sample: unknown } | undefined;
    for (const attr of attrs) {
      const sample = sampleFor(attr.typeName);
      if (sample === undefined) continue;
      chosen = { name: attr.name, sample };
      if (
        attr.typeName === "String" || attr.typeName === "Boolean" ||
        attr.typeName === "Real" || attr.typeName === "Integer" ||
        attr.typeName === "Integer64"
      ) {
        break;
      }
    }
    if (!chosen) {
      uncovered.push(name);
      continue;
    }
    try {
      const inst = new (value as new (init?: object) => Record<string, unknown>)({
        [chosen.name]: chosen.sample,
      });
      if (!readBack(inst[chosen.name], chosen.sample)) {
        failures.push(
          `${name}.${chosen.name} dropped ${JSON.stringify(chosen.sample)} got ${String(inst[chosen.name])}`,
        );
      }
    } catch (error) {
      failures.push(
        `${name}.${chosen.name}: ${error instanceof Error ? error.message : error}`,
      );
    }
  }
  if (uncovered.length > 0) {
    console.log("RM classes with attributes but no safe init sample:", uncovered.join(", "));
  }
  assertEquals(failures, []);
});

Deno.test("Object.assign coerces terse strings the way the constructor does", () => {
  const element = Object.assign(new ELEMENT(), {
    archetype_node_id: "at0008",
    value: "local::at1001|Sitting|",
  });
  const json = canonical(element);
  const value = json.value as Record<string, unknown>;
  assertEquals(value._type, "DV_CODED_TEXT");
  const defining = value.defining_code as Record<string, unknown>;
  assertEquals(defining.code_string, "at1001");
  assertEquals(value.value, "Sitting");

  const coded = Object.assign(new DV_CODED_TEXT(), {
    value: "Sitting",
    defining_code: "local::at1001",
  });
  const codedJson = canonical(coded);
  const codedDefining = codedJson.defining_code as Record<string, unknown>;
  assertEquals(codedDefining.code_string, "at1001");

  const fromObject = Object.assign(new DV_CODED_TEXT(), {
    value: "Sitting",
    defining_code: { terminology_id: "local", code_string: "at1001" },
  });
  const fromObjectJson = canonical(fromObject);
  const fromObjectDefining = fromObjectJson.defining_code as Record<string, unknown>;
  assertEquals(
    (fromObjectDefining.terminology_id as Record<string, unknown>).value,
    "local",
  );
  assertEquals(fromObjectDefining.code_string, "at1001");

  const observation = Object.assign(new OBSERVATION(), {
    language: "ISO_639-1::en",
  });
  const language = canonical(observation).language as Record<string, unknown>;
  assertEquals(language._type, "CODE_PHRASE");
  assertEquals(language.code_string, "en");
});
