/**
 * #314: a DV_BOOLEAN value is a boolean. A C_STRING pattern "True" left by an
 * older OPT export, or no value constraint at all, must not report
 * "Expected string, got boolean".
 */
import { assert, assertEquals } from "@std/assert";
import * as openehr_am from "../../../am/openehr_am.ts";
import { parseOptXml } from "../../../parser/legacy/opt_xml_parser.ts";
import { TemplateValidator } from "../../../validation/template_validator.ts";

const OPT = new URL(
  "../../fixtures/ferroehr/thumb-pain-encounter.v2-coded.opt",
  import.meta.url,
);

function booleanNode(pattern: string | undefined): openehr_am.C_COMPLEX_OBJECT {
  const dv = new openehr_am.C_COMPLEX_OBJECT();
  dv.rm_type_name = "DV_BOOLEAN";
  if (pattern === undefined) return dv;
  const attr = new openehr_am.C_SINGLE_ATTRIBUTE();
  attr.rm_attribute_name = "value";
  const prim = new openehr_am.C_PRIMITIVE_OBJECT();
  prim.rm_type_name = "STRING";
  const str = new openehr_am.C_STRING();
  str.pattern = pattern;
  prim.item = str;
  attr.children = [prim];
  dv.attributes = [attr];
  return dv;
}

function messages(node: openehr_am.C_OBJECT, value: boolean): string[] {
  const result = new TemplateValidator({
    validateRMSpecification: false,
    validateUnits: false,
  }).validateObject({ _type: "DV_BOOLEAN", value }, node);
  return result.errors.map((m) => m.message);
}

Deno.test("#314 DV_BOOLEAN accepts a boolean when the OPT stored True as a string", () => {
  const node = booleanNode("True");
  assertEquals(messages(node, true), []);
  assert(
    messages(node, false).some((m) => m.includes("Boolean value 'false' is not allowed")),
  );
  assert(messages(node, true).every((m) => !m.includes("Expected string")));
});

Deno.test("#314 unconstrained DV_BOOLEAN accepts true and false", () => {
  const node = booleanNode(undefined);
  assertEquals(messages(node, true), []);
  assertEquals(messages(node, false), []);
});

Deno.test("#314 a real string constraint still rejects a boolean", () => {
  const text = new openehr_am.C_COMPLEX_OBJECT();
  text.rm_type_name = "DV_TEXT";
  const attr = new openehr_am.C_SINGLE_ATTRIBUTE();
  attr.rm_attribute_name = "value";
  const prim = new openehr_am.C_PRIMITIVE_OBJECT();
  prim.rm_type_name = "STRING";
  const str = new openehr_am.C_STRING();
  str.pattern = ".*";
  prim.item = str;
  attr.children = [prim];
  text.attributes = [attr];
  const result = new TemplateValidator({
    validateRMSpecification: false,
    validateUnits: false,
  }).validateObject({ _type: "DV_TEXT", value: true }, text);
  assert(result.errors.some((m) => m.message === "Expected string, got boolean"));
});

Deno.test("#314 thumb-pain OPT: Examination not done accepts boolean true", async () => {
  const xml = await Deno.readTextFile(OPT);
  const { operationalTemplate } = parseOptXml(xml);
  const found = findStringPatternBoolean(operationalTemplate?.definition);
  assert(found, "expected a DV_BOOLEAN whose value is C_STRING pattern True");
  assertEquals(messages(found, true), []);
  assert(
    messages(found, false).some((m) => m.includes("not allowed")),
  );

  const open = findOpenBoolean(operationalTemplate?.definition);
  assert(open, "expected a DV_BOOLEAN with no value constraint");
  assertEquals(messages(open, true), []);
  assertEquals(messages(open, false), []);
});

function findStringPatternBoolean(
  node: openehr_am.C_OBJECT | undefined,
): openehr_am.C_COMPLEX_OBJECT | undefined {
  if (!node) return undefined;
  if (node.rm_type_name === "DV_BOOLEAN" && hasTrueString(node)) {
    return node as openehr_am.C_COMPLEX_OBJECT;
  }
  for (const attr of node.attributes ?? []) {
    for (const child of attr.children ?? []) {
      const found = findStringPatternBoolean(child);
      if (found) return found;
    }
  }
  return undefined;
}

function hasTrueString(node: openehr_am.C_OBJECT): boolean {
  for (const attr of node.attributes ?? []) {
    if (attr.rm_attribute_name !== "value") continue;
    for (const child of attr.children ?? []) {
      const item = child instanceof openehr_am.C_PRIMITIVE_OBJECT
        ? child.item
        : child;
      if (item instanceof openehr_am.C_STRING && item.pattern === "True") {
        return true;
      }
    }
  }
  return false;
}

function findOpenBoolean(
  node: openehr_am.C_OBJECT | undefined,
): openehr_am.C_COMPLEX_OBJECT | undefined {
  if (!node) return undefined;
  if (
    node.rm_type_name === "DV_BOOLEAN" &&
    !(node.attributes ?? []).some((a) => a.rm_attribute_name === "value")
  ) {
    return node as openehr_am.C_COMPLEX_OBJECT;
  }
  for (const attr of node.attributes ?? []) {
    for (const child of attr.children ?? []) {
      const found = findOpenBoolean(child);
      if (found) return found;
    }
  }
  return undefined;
}
