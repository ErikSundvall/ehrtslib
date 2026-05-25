/**
 * Template / archetype flattening and differential extraction.
 */

import { assertEquals, assert } from "https://deno.land/std@0.220.0/assert/mod.ts";
import * as openehr_am from "../../enhanced/openehr_am.ts";
import { initArchetypeId } from "../../enhanced/init_helpers.ts";
import {
  extractDifferentialDefinition,
  flattenArchetypeDefinition,
  flattenToOperationalTemplate,
  specializeComplexObject,
  type ArchetypeResolver,
} from "../../enhanced/am/mod.ts";

function obsRoot(id = "id1"): openehr_am.C_COMPLEX_OBJECT {
  const o = new openehr_am.C_COMPLEX_OBJECT();
  o.rm_type_name = "OBSERVATION";
  o.node_id = id;
  return o;
}

function singleAttr(
  name: string,
  children: openehr_am.C_OBJECT[],
): openehr_am.C_SINGLE_ATTRIBUTE {
  const a = new openehr_am.C_SINGLE_ATTRIBUTE();
  a.rm_attribute_name = name;
  (a as { children: openehr_am.C_OBJECT[] }).children = children;
  return a;
}

Deno.test("specialize — child adds attribute", () => {
  const parent = obsRoot();
  parent.attributes = [
    singleAttr("data", [
      (() => {
        const h = new openehr_am.C_COMPLEX_OBJECT();
        h.rm_type_name = "HISTORY";
        h.node_id = "id2";
        return h;
      })(),
    ]),
  ];

  const child = obsRoot();
  child.attributes = [
    singleAttr("protocol", [
      (() => {
        const t = new openehr_am.C_COMPLEX_OBJECT();
        t.rm_type_name = "ITEM_TREE";
        t.node_id = "id9";
        return t;
      })(),
    ]),
  ];

  const flat = specializeComplexObject(parent, child);
  assertEquals(flat.attributes?.length, 2);
  assert(flat.attributes?.some((a) => a.rm_attribute_name === "protocol"));
});

Deno.test("specialize — child narrows nested node", () => {
  const history = new openehr_am.C_COMPLEX_OBJECT();
  history.rm_type_name = "HISTORY";
  history.node_id = "id2";

  const parent = obsRoot();
  parent.attributes = [singleAttr("data", [history])];

  const narrow = new openehr_am.C_COMPLEX_OBJECT();
  narrow.rm_type_name = "HISTORY";
  narrow.node_id = "id2";
  const event = new openehr_am.C_COMPLEX_OBJECT();
  event.rm_type_name = "EVENT";
  event.node_id = "id3";
  narrow.attributes = [
    singleAttr("events", [event]),
  ];

  const child = obsRoot();
  child.attributes = [singleAttr("data", [narrow])];

  const flat = specializeComplexObject(parent, child);
  const data = flat.attributes?.find((a) => a.rm_attribute_name === "data");
  const hist = (data as { children?: openehr_am.C_OBJECT[] }).children?.[0] as
    openehr_am.C_COMPLEX_OBJECT;
  assertEquals(hist?.attributes?.length, 1);
  assertEquals(hist?.attributes?.[0].rm_attribute_name, "events");
});

Deno.test("flattenArchetype — parent chain", () => {
  const parentArch = new openehr_am.ARCHETYPE();
  parentArch.archetype_id = initArchetypeId("openEHR-EHR-OBSERVATION.parent.v1");
  parentArch.definition = obsRoot();
  parentArch.definition.attributes = [
    singleAttr("data", [
      (() => {
        const h = new openehr_am.C_COMPLEX_OBJECT();
        h.rm_type_name = "HISTORY";
        h.node_id = "id2";
        return h;
      })(),
    ]),
  ];

  const childArch = new openehr_am.ARCHETYPE();
  childArch.archetype_id = initArchetypeId("openEHR-EHR-OBSERVATION.child.v1");
  childArch.parent_archetype_id = parentArch.archetype_id;
  childArch.definition = obsRoot();
  childArch.definition.attributes = [
    singleAttr("protocol", [
      (() => {
        const t = new openehr_am.C_COMPLEX_OBJECT();
        t.rm_type_name = "ITEM_TREE";
        t.node_id = "id8";
        return t;
      })(),
    ]),
  ];

  const resolver: ArchetypeResolver = {
    resolve(id: string) {
      if (id.includes("parent")) return parentArch;
      return undefined;
    },
  };

  const flat = flattenArchetypeDefinition(childArch, resolver);
  assertEquals(flat?.attributes?.length, 2);
});

Deno.test("extractDifferential — round-trip overlay", () => {
  const parent = obsRoot();
  parent.attributes = [
    singleAttr("data", [
      (() => {
        const h = new openehr_am.C_COMPLEX_OBJECT();
        h.rm_type_name = "HISTORY";
        h.node_id = "id2";
        return h;
      })(),
    ]),
  ];

  const flat = specializeComplexObject(parent, (() => {
    const c = obsRoot();
    c.attributes = [
      singleAttr("protocol", [
        (() => {
          const t = new openehr_am.C_COMPLEX_OBJECT();
          t.rm_type_name = "ITEM_TREE";
          t.node_id = "id8";
          return t;
        })(),
      ]),
    ];
    return c;
  })());

  const diff = extractDifferentialDefinition(flat, parent);
  assert(diff);
  assertEquals(diff.attributes?.length, 1);
  assertEquals(diff.attributes?.[0].rm_attribute_name, "protocol");

  const restored = specializeComplexObject(parent, diff);
  assertEquals(restored.attributes?.length, flat.attributes?.length);
});

Deno.test("flattenToOperationalTemplate — from archetype", () => {
  const arch = new openehr_am.ARCHETYPE();
  arch.archetype_id = initArchetypeId("openEHR-EHR-OBSERVATION.flat.v1");
  arch.definition = obsRoot();
  const opt = flattenToOperationalTemplate(arch, { resolve: () => undefined });
  assert(opt instanceof openehr_am.OPERATIONAL_TEMPLATE);
  assertEquals(opt.definition?.rm_type_name, "OBSERVATION");
  assertEquals(opt.is_generated, true);
});
