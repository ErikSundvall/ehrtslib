/**
 * Archetype rules collection and validateArchetypeRules convenience API.
 */

import { assertEquals } from "https://deno.land/std@0.220.0/assert/mod.ts";
import { ADL2Parser } from "../../../parser/adl2_parser.ts";
import { ADL2Tokenizer } from "../../../parser/adl2_tokenizer.ts";
import * as openehr_am from "../../../am/openehr_am.ts";
import { initArchetypeId } from "../../../base/init_helpers.ts";
import type { ArchetypeResolver } from "../../../am/util/mod.ts";
import {
  assertionsFromArchetype,
  collectArchetypeAssertions,
  collectArchetypeAssertionSources,
  validateArchetypeRules,
} from "../../../validation/archetype_rules.ts";

const TEST_DATA = new URL("../../", import.meta.url);

async function loadRulesArchetype(): Promise<openehr_am.ARCHETYPE> {
  const path = "adl2/openEHR-TEST_PKG-WHOLE.minimal_rules.v1.0.0.adls";
  const input = await Deno.readTextFile(new URL(path, TEST_DATA));
  const result = new ADL2Parser(new ADL2Tokenizer(input).tokenize()).parse();
  if (!result.archetype) throw new Error("expected archetype");
  return result.archetype;
}

Deno.test("collectArchetypeAssertions - ADL2 fixture rules", async () => {
  const arch = await loadRulesArchetype();
  assertEquals(assertionsFromArchetype(arch).length, 2);
  assertEquals(collectArchetypeAssertions(arch).length, 2);
  const sources = collectArchetypeAssertionSources(arch);
  assertEquals(sources.length, 1);
  assertEquals(sources[0].assertions.length, 2);
  assertEquals(sources[0].assertions[1].tag, "Value_positive");
});

Deno.test("collectArchetypeAssertions - parent chain via resolver", () => {
  const parent = new openehr_am.ARCHETYPE();
  parent.archetype_id = initArchetypeId("openEHR-TEST.parent.v1");
  const parentRule = new openehr_am.ASSERTION();
  parentRule.tag = "parent_rule";
  parentRule.string_expression = "true";
  parent.invariants = [parentRule];

  const child = new openehr_am.ARCHETYPE();
  child.archetype_id = initArchetypeId("openEHR-TEST.child.v1");
  child.parent_archetype_id = parent.archetype_id;
  const childRule = new openehr_am.ASSERTION();
  childRule.tag = "child_rule";
  childRule.string_expression = "true";
  child.invariants = [childRule];

  const resolver: ArchetypeResolver = {
    resolve(id: string) {
      if (id === parent.archetype_id?.value) return parent;
      if (id === child.archetype_id?.value) return child;
      return undefined;
    },
  };

  const sources = collectArchetypeAssertionSources(child, resolver);
  assertEquals(sources.length, 2);
  assertEquals(sources[0].archetypeId, parent.archetype_id?.value);
  assertEquals(sources[1].archetypeId, child.archetype_id?.value);
  assertEquals(collectArchetypeAssertions(child, { resolver }).length, 2);
});

Deno.test("validateArchetypeRules - failing rule on fixture archetype", async () => {
  const arch = await loadRulesArchetype();
  const definition = arch.definition!;
  const instance = {
    data: {
      archetype_node_id: "at0002",
      value: { magnitude: -1 },
    },
  };
  const msgs = validateArchetypeRules(instance, arch, { definition });
  assertEquals(msgs.length, 1);
  assertEquals(msgs[0].constraintType, "invariant");
  assertEquals(msgs[0].archetypePath, "rules:Value_positive");
});

Deno.test("collectArchetypeAssertions - component archetype rules", () => {
  const root = new openehr_am.OPERATIONAL_TEMPLATE();
  root.archetype_id = initArchetypeId("openEHR-EHR-COMPOSITION.test.v1");
  const component = new openehr_am.ARCHETYPE();
  component.archetype_id = initArchetypeId("openEHR-EHR-OBSERVATION.comp.v1");
  const rule = new openehr_am.ASSERTION();
  rule.tag = "comp_rule";
  rule.string_expression = "true";
  component.invariants = [rule];

  assertEquals(collectArchetypeAssertions(root).length, 0);
  assertEquals(
    collectArchetypeAssertions(root, { componentArchetypes: [component] })
      .length,
    1,
  );
});

Deno.test("validateArchetypeRules - passing instance", () => {
  const arch = new openehr_am.ARCHETYPE();
  const definition = new openehr_am.C_COMPLEX_OBJECT();
  definition.rm_type_name = "OBSERVATION";
  definition.node_id = "id1";
  arch.definition = definition;

  const varDecl = new openehr_am.ASSERTION();
  varDecl.string_expression =
    "$magnitude: Integer := /data[id2]/value/magnitude";
  const rule = new openehr_am.ASSERTION();
  rule.tag = "positive";
  rule.string_expression = "$magnitude >= 0";
  arch.invariants = [varDecl, rule];

  const instance = {
    data: {
      archetype_node_id: "at0002",
      value: { magnitude: 3 },
    },
  };
  assertEquals(validateArchetypeRules(instance, arch).length, 0);
});