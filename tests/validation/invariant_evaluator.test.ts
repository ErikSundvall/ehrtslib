/**
 * Archetype rules / invariant evaluation tests.
 */

import { assertEquals } from "https://deno.land/std@0.220.0/assert/mod.ts";
import { InvariantEvaluator } from "../../enhanced/validation/invariant_evaluator.ts";
import { ArchetypePathResolver } from "../../enhanced/validation/archetype_path_resolver.ts";
import { TemplateValidator } from "../../enhanced/validation/template_validator.ts";
import * as openehr_am from "../../enhanced/openehr_am.ts";

function buildObservationWithDataRule(): openehr_am.ARCHETYPE {
  const template = new openehr_am.ARCHETYPE();
  const definition = new openehr_am.C_COMPLEX_OBJECT();
  definition.rm_type_name = "OBSERVATION";
  definition.node_id = "id1";

  const dataAttr = new openehr_am.C_SINGLE_ATTRIBUTE();
  dataAttr.rm_attribute_name = "data";
  const history = new openehr_am.C_COMPLEX_OBJECT();
  history.rm_type_name = "HISTORY";
  history.node_id = "id2";
  dataAttr.children = [history];
  definition.attributes = [dataAttr];
  template.definition = definition;

  const varDecl = new openehr_am.ASSERTION();
  varDecl.string_expression =
    "$magnitude: Integer := /data[id2]/value/magnitude";

  const rule = new openehr_am.ASSERTION();
  rule.tag = "positive";
  rule.string_expression = "$magnitude >= 0";

  template.invariants = [varDecl, rule];
  return template;
}

Deno.test("Path resolver - archetype path with node id", () => {
  const instance = {
    data: {
      archetype_node_id: "at0002",
      value: { magnitude: 42 },
    },
  };
  const resolver = new ArchetypePathResolver();
  assertEquals(
    resolver.resolve(instance, "/data[id2]/value/magnitude"),
    42,
  );
});

Deno.test("InvariantEvaluator - passing rule", () => {
  const template = buildObservationWithDataRule();
  const instance = {
    data: {
      archetype_node_id: "at0002",
      value: { magnitude: 5 },
    },
  };
  const msgs = new InvariantEvaluator({
    definition: template.definition,
  }).validateInvariants(instance, template.invariants!, template.definition);
  assertEquals(msgs.length, 0);
});

Deno.test("InvariantEvaluator - failing rule", () => {
  const template = buildObservationWithDataRule();
  const instance = {
    data: {
      archetype_node_id: "at0002",
      value: { magnitude: -3 },
    },
  };
  const msgs = new InvariantEvaluator({
    definition: template.definition,
  }).validateInvariants(instance, template.invariants!, template.definition);
  assertEquals(msgs.length, 1);
  assertEquals(msgs[0].constraintType, "invariant");
  assertEquals(msgs[0].archetypePath, "rules:positive");
});

Deno.test("InvariantEvaluator - for_all quantifier via expression tree", () => {
  const template = new openehr_am.ARCHETYPE();
  const definition = new openehr_am.C_COMPLEX_OBJECT();
  definition.rm_type_name = "OBSERVATION";
  definition.node_id = "id1";

  const dataAttr = new openehr_am.C_SINGLE_ATTRIBUTE();
  dataAttr.rm_attribute_name = "data";
  const history = new openehr_am.C_COMPLEX_OBJECT();
  history.rm_type_name = "HISTORY";
  history.node_id = "id2";

  const eventsAttr = new openehr_am.C_MULTIPLE_ATTRIBUTE();
  eventsAttr.rm_attribute_name = "events";
  const event = new openehr_am.C_COMPLEX_OBJECT();
  event.rm_type_name = "EVENT";
  event.node_id = "id3";

  const eventDataAttr = new openehr_am.C_SINGLE_ATTRIBUTE();
  eventDataAttr.rm_attribute_name = "data";
  const tree = new openehr_am.C_COMPLEX_OBJECT();
  tree.rm_type_name = "ITEM_TREE";
  tree.node_id = "id4";

  const itemsAttr = new openehr_am.C_MULTIPLE_ATTRIBUTE();
  itemsAttr.rm_attribute_name = "items";
  const element = new openehr_am.C_COMPLEX_OBJECT();
  element.rm_type_name = "ELEMENT";
  element.node_id = "id5";
  const valueAttr = new openehr_am.C_SINGLE_ATTRIBUTE();
  valueAttr.rm_attribute_name = "value";
  (element as { attributes: openehr_am.C_ATTRIBUTE[] }).attributes = [valueAttr];
  (itemsAttr as { children: openehr_am.C_OBJECT[] }).children = [element];
  (tree as { attributes: openehr_am.C_ATTRIBUTE[] }).attributes = [itemsAttr];
  (eventDataAttr as { children: openehr_am.C_OBJECT[] }).children = [tree];
  (event as { attributes: openehr_am.C_ATTRIBUTE[] }).attributes = [eventDataAttr];
  (eventsAttr as { children: openehr_am.C_OBJECT[] }).children = [event];
  (history as { attributes: openehr_am.C_ATTRIBUTE[] }).attributes = [eventsAttr];
  dataAttr.children = [history];
  definition.attributes = [dataAttr];
  template.definition = definition;

  const forAll = new openehr_am.ASSERTION();
  forAll.string_expression =
    "for_all /data[id2]/events[id3] implies exists /data";

  const instance = {
    data: {
      archetype_node_id: "at0002",
      events: [
        {
          archetype_node_id: "at0003",
          data: { items: [{ value: { magnitude: 1 } }] },
        },
        {
          archetype_node_id: "at0003",
          data: { items: [{ value: { magnitude: 2 } }] },
        },
      ],
    },
  };

  const msgs = new InvariantEvaluator({ definition }).validateInvariants(
    instance,
    [forAll],
    definition,
  );
  assertEquals(msgs.length, 0);
});

Deno.test("TemplateValidator - evaluates invariants by default", () => {
  const template = buildObservationWithDataRule();
  const validator = new TemplateValidator({ validateUnits: false });
  const bad = {
    _type: "OBSERVATION",
    data: {
      _type: "HISTORY",
      archetype_node_id: "at0002",
      value: { magnitude: -1 },
    },
  };
  const result = validator.validate(bad, template);
  assertEquals(result.valid, false);
  assertEquals(
    result.errors.some((e) => e.constraintType === "invariant"),
    true,
  );
});
