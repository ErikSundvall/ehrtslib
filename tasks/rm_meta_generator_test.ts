/**
 * Unit tests for generator helpers (no network).
 */
import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import {
  buildRmMetaTables,
  formatPropertyTypeName,
  formatTypeRef,
  multiplicityFromProperty,
  rootTypeName,
} from "./rm_meta_generator.ts";
import type { BmmModel, BmmProperty } from "./bmm_parser.ts";

Deno.test("formatTypeRef: container List<LINK>", () => {
  assertEquals(
    formatTypeRef({
      container_type: "List",
      type: "LINK",
    }),
    "List<LINK>",
  );
});

Deno.test("formatTypeRef: generic DV_INTERVAL", () => {
  assertEquals(
    formatTypeRef({
      root_type: "DV_INTERVAL",
      generic_parameters: ["DV_QUANTITY"],
    }),
    "DV_INTERVAL<DV_QUANTITY>",
  );
});

Deno.test("formatPropertyTypeName uses type_def over type", () => {
  const prop: BmmProperty = {
    _type: "P_BMM_CONTAINER_PROPERTY",
    name: "links",
    type: "",
    type_def: { _type: "P_BMM_CONTAINER_TYPE", type: "LINK", container_type: "List" },
    cardinality: { lower: 0, upper_unbounded: true },
  };
  assertEquals(formatPropertyTypeName(prop), "List<LINK>");
});

Deno.test("multiplicityFromProperty: optional single", () => {
  const prop: BmmProperty = {
    _type: "P_BMM_SINGLE_PROPERTY",
    name: "value",
    type: "DATA_VALUE",
  };
  assertEquals(multiplicityFromProperty(prop), { min: 0, max: 1 });
});

Deno.test("multiplicityFromProperty: mandatory single", () => {
  const prop: BmmProperty = {
    _type: "P_BMM_SINGLE_PROPERTY",
    name: "name",
    type: "DV_TEXT",
    is_mandatory: true,
  };
  assertEquals(multiplicityFromProperty(prop), { min: 1, max: 1 });
});

Deno.test("multiplicityFromProperty: unbounded list", () => {
  const prop: BmmProperty = {
    _type: "P_BMM_CONTAINER_PROPERTY",
    name: "links",
    type: "LINK",
    cardinality: { lower: 0, upper_unbounded: true },
  };
  assertEquals(multiplicityFromProperty(prop), { min: 0, max: null });
});

Deno.test("rootTypeName strips containers and generics", () => {
  assertEquals(rootTypeName("List<LINK>"), "LINK");
  assertEquals(rootTypeName("DV_INTERVAL<DV_QUANTITY>"), "DV_INTERVAL");
  assertEquals(rootTypeName("DATA_VALUE"), "DATA_VALUE");
});

Deno.test("buildRmMetaTables from minimal model", () => {
  const model: BmmModel = {
    bmm_version: "2.3",
    rm_publisher: "openEHR",
    schema_name: "rm",
    rm_release: "1.2.0",
    schema_revision: "1",
    schema_lifecycle_state: "stable",
    schema_description: "test",
    schema_author: "test",
    packages: {},
    primitive_types: {},
    class_definitions: {
      DATA_VALUE: {
        name: "DATA_VALUE",
        is_abstract: true,
        ancestors: ["Any"],
      },
      DV_TEXT: {
        name: "DV_TEXT",
        ancestors: ["DATA_VALUE"],
        properties: {
          value: {
            _type: "P_BMM_SINGLE_PROPERTY",
            name: "value",
            type: "String",
            is_mandatory: true,
          },
        },
      },
      Any: {
        name: "Any",
        is_abstract: true,
      },
    },
  };

  const tables = buildRmMetaTables([{ model, source: "test://minimal" }]);
  assertEquals(tables.schemaName, "rm");
  assertEquals(tables.rmRelease, "1.2.0");
  assertExists(tables.classes["DV_TEXT"]);
  assertEquals(tables.classes["DATA_VALUE"].isAbstract, true);
  assertEquals(tables.ownAttributes["DV_TEXT"]?.[0]?.name, "value");
  assertEquals(tables.ownAttributes["DV_TEXT"]?.[0]?.mandatory, true);
});
