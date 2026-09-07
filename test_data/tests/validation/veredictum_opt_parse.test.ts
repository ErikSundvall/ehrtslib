/**
 * Parse Veredictum CNF content OPTs — C_PRIMITIVE_OBJECT.item must surface
 * C_INTEGER range/list constraints used by CONT-DV_COUNT cases.
 */

import { assert, assertEquals } from "https://deno.land/std@0.220.0/assert/mod.ts";
import * as openehr_am from "../../../am/openehr_am.ts";
import { parseOptXml } from "../../../parser/legacy/opt_xml_parser.ts";
import { VEREDICTUM_ROOT } from "./veredictum_harness.ts";

function observationValue(
  opt: openehr_am.OPERATIONAL_TEMPLATE,
): openehr_am.C_OBJECT | undefined {
  const walk = (
    obj: openehr_am.C_COMPLEX_OBJECT | undefined,
    attr: string,
  ): openehr_am.C_OBJECT | undefined =>
    obj?.attributes?.find((a) => a.rm_attribute_name === attr)?.children?.[0];
  const content = walk(opt.definition, "content");
  if (!(content instanceof openehr_am.C_COMPLEX_OBJECT)) return undefined;
  const data = walk(content, "data");
  if (!(data instanceof openehr_am.C_COMPLEX_OBJECT)) return undefined;
  const events = walk(data, "events");
  if (!(events instanceof openehr_am.C_COMPLEX_OBJECT)) return undefined;
  const eventData = walk(events, "data");
  if (!(eventData instanceof openehr_am.C_COMPLEX_OBJECT)) return undefined;
  const items = walk(eventData, "items");
  if (!(items instanceof openehr_am.C_COMPLEX_OBJECT)) return undefined;
  const element = items;
  return walk(element, "value");
}

Deno.test("parseOptXml unwraps C_PRIMITIVE_OBJECT C_INTEGER range (count_range.opt)", async () => {
  const xml = await Deno.readTextFile(
    new URL("templates/count_range.opt", VEREDICTUM_ROOT),
  );
  const { operationalTemplate } = parseOptXml(xml);
  const value = observationValue(operationalTemplate);
  assert(value instanceof openehr_am.C_COMPLEX_OBJECT, "expected DV_COUNT CCO");
  const mag = value.attributes?.find((a) => a.rm_attribute_name === "magnitude")
    ?.children?.[0];
  assert(mag instanceof openehr_am.C_PRIMITIVE_OBJECT, "expected C_PRIMITIVE_OBJECT");
  assert(mag.item instanceof openehr_am.C_INTEGER, "expected C_INTEGER item");
  const range = (mag.item as { range?: { lower?: number; upper?: number } }).range;
  assertEquals(range?.lower, 10);
  assertEquals(range?.upper, 20);
});

Deno.test("parseOptXml unwraps C_INTEGER list (count_list.opt)", async () => {
  const xml = await Deno.readTextFile(
    new URL("templates/count_list.opt", VEREDICTUM_ROOT),
  );
  const { operationalTemplate } = parseOptXml(xml);
  const value = observationValue(operationalTemplate);
  assert(value instanceof openehr_am.C_COMPLEX_OBJECT);
  const mag = value.attributes?.find((a) => a.rm_attribute_name === "magnitude")
    ?.children?.[0];
  assert(mag instanceof openehr_am.C_PRIMITIVE_OBJECT);
  const list = (mag.item as { list?: number[] } | undefined)?.list;
  assertEquals(list, [10, 15, 20]);
});
