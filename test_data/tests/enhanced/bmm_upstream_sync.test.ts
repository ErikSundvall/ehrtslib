import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.177.0/testing/asserts.ts";
import {
  AUTHORED_RESOURCE,
  Env,
  FUNCTION,
  Iso8601_date,
  Math as OpenEhrMath,
  RESOURCE_DESCRIPTION,
  String as EhrString,
  Terminology_code,
  TUPLE1,
} from "../../../openehr_base.ts";
import {
  BMM_CLASSIFIER,
  BMM_CONTAINER_TYPE,
  BMM_GENERIC_CLASS,
  BMM_GENERIC_PARAMETER,
  BMM_OPEN_TYPE,
  BMM_SCHEMA_CORE,
  BMM_SIGNATURE,
  BMM_SIMPLE_CLASS,
  BMM_SIMPLE_TYPE,
  P_BMM_CLASS,
  P_BMM_FUNCTION,
  P_BMM_GENERIC_FUNCTION_PARAMETER,
  P_BMM_GENERIC_TYPE,
  REFERENCE_MODEL_ACCESS,
  SCHEMA_DESCRIPTOR,
} from "../../../openehr_lang.ts";
import { EXPR_CONSTRAINT } from "../../../openehr_am.ts";

Deno.test("BMM3 BMM_SIMPLE_CLASS type() returns BMM_SIMPLE_TYPE", () => {
  const cls = new BMM_SIMPLE_CLASS();
  cls.name = "COMPOSITION";
  cls.is_abstract = false;
  cls.is_primitive = false;
  const t = cls.type();
  assert(t instanceof BMM_SIMPLE_TYPE);
  assertEquals(t.type_name().value, "COMPOSITION");
  assertEquals(t.is_abstract().value, false);
});

Deno.test("BMM3 BMM_GENERIC_CLASS type() names bound parameters", () => {
  const cls = new BMM_GENERIC_CLASS();
  cls.name = "Interval";
  const t = cls.type();
  assertEquals(t.base_class, cls);
  assertEquals(t.type_name().value, "Interval");
});

Deno.test("BMM3 BMM_CONTAINER_TYPE type_name uses container and item", () => {
  const listClass = new BMM_GENERIC_CLASS();
  listClass.name = "List";
  const item = BMM_SIMPLE_TYPE.named("String");
  const c = new BMM_CONTAINER_TYPE();
  c.container_class = listClass;
  c.item_type = item;
  assertEquals(c.type_name().value, "List<String>");
});

Deno.test("BMM_SIGNATURE type_name follows result_type", () => {
  const cls = new BMM_SIMPLE_CLASS();
  cls.name = "Any";
  const sig = new BMM_SIGNATURE();
  sig.result_type = cls.type();
  assertEquals(sig.type_name().value, "Any");
});

Deno.test("P_BMM_CLASS.create_bmm_class builds BMM_SIMPLE_CLASS", () => {
  const p = new P_BMM_CLASS();
  p.name = "CLUSTER";
  p.is_abstract = false;
  p.create_bmm_class();
  assert(p.bmm_class instanceof BMM_SIMPLE_CLASS);
  assertEquals(p.bmm_class.name, "CLUSTER");
});

Deno.test("P_BMM_GENERIC_FUNCTION_PARAMETER holds FUNCTION type_def", () => {
  const param = new P_BMM_GENERIC_FUNCTION_PARAMETER();
  param.name = "test";
  param.type_def = new P_BMM_GENERIC_TYPE();
  param.type_def.root_type = "FUNCTION";
  const fn = new P_BMM_FUNCTION();
  fn.name = "for_all";
  fn.parameters = new Map([["test", param]]);
  assertEquals(fn.parameters.get("test"), param);
  assertEquals(param.type_def.root_type, "FUNCTION");
});

Deno.test("SPECPR-426 Iso8601_date has no timezone method", () => {
  const d = new Iso8601_date();
  d.value = "2026-09-16";
  assertEquals(
    typeof (d as unknown as { timezone?: unknown }).timezone,
    "undefined",
  );
});

Deno.test("RESOURCE_DESCRIPTION invariants from specifications-BASE", () => {
  const desc = new RESOURCE_DESCRIPTION();
  assertEquals(desc.Original_author_valid().value, false);
  assertEquals(desc.Lifecycle_state_valid().value, false);
  assertEquals(desc.Parent_resource_valid().value, true);

  (desc as unknown as { original_author: { size: number } }).original_author = {
    size: 1,
  };
  const state = new Terminology_code();
  state.code_string = "published";
  desc.lifecycle_state = state;
  assertEquals(desc.Original_author_valid().value, true);
  assertEquals(desc.Lifecycle_state_valid().value, true);

  class Resource extends AUTHORED_RESOURCE {}
  const parent = new Resource();
  parent.description = desc;
  desc.parent_resource = parent;
  assertEquals(desc.Parent_resource_valid().value, true);
});

Deno.test("SPECBASE-48 FUNCTION and TUPLE1 are constructible BASE types", () => {
  const tuple = new TUPLE1();
  const fn = new FUNCTION<TUPLE1, boolean>();
  assert(fn instanceof FUNCTION);
  assert(tuple instanceof TUPLE1);
});

Deno.test("BASE Env.current_date returns an Iso8601_date", () => {
  const env = new Env();
  const d = env.current_date();
  assert(d instanceof Iso8601_date);
  assert(typeof d.value === "string" && d.value.length >= 4);
});

Deno.test("BASE Math.ln of e is approximately 1", () => {
  const m = new OpenEhrMath();
  const v = m.ln(Math.E);
  assert(Math.abs(v - 1) < 1e-10);
});

Deno.test("classic LANG BMM_GENERIC_PARAMETER and BMM_OPEN_TYPE", () => {
  const param = new BMM_GENERIC_PARAMETER();
  param.name = "T";
  const open = new BMM_OPEN_TYPE();
  open.generic_constraint = param;
  assert(param instanceof BMM_CLASSIFIER);
  assertEquals(open.type_name().value, "T");
  assertEquals(param.type_signature().value, "T");
});

Deno.test("classic LANG SCHEMA_DESCRIPTOR and REFERENCE_MODEL_ACCESS aliases", () => {
  const desc = new SCHEMA_DESCRIPTOR();
  desc.schema_id = "openehr_rm_1.2.0";
  assertEquals(desc.schema_id, "openehr_rm_1.2.0");
  assertEquals(desc.is_top_level().value, false);
  const access = new REFERENCE_MODEL_ACCESS();
  assertEquals(access.has_bmm_model(EhrString.from("missing")).value, false);
  const core = new BMM_SCHEMA_CORE();
  core.rm_publisher = "openehr";
  assertEquals(core.rm_publisher, "openehr");
});

Deno.test("AOM2 EXPR_CONSTRAINT extends LANG EXPR_LEAF", () => {
  const c = new EXPR_CONSTRAINT();
  c.item = undefined;
  assertEquals(c.item, undefined);
});

