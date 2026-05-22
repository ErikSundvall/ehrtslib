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
