/**
 * Regression: canonical-strict JSON deserialization must resolve BASE `_type` values
 * (e.g. TERMINOLOGY_ID) when consumers only registered the RM barrel — as intehrgrator did.
 */

import { assert, assertEquals } from "https://deno.land/std@0.177.0/testing/asserts.ts";
import { TypeRegistry } from "../../../serialization/common/type_registry.ts";
import {
  collectTypeNamesFromJsonTree,
  registerOpenEhrModelTypes,
} from "../../../serialization/common/openehr_model_registry.ts";
import { JsonConfigurableDeserializer } from "../../../serialization/json/json_configurable_deserializer.ts";
import { CANONICAL_JSON_DESERIALIZE_CONFIG } from "../../../serialization/json/json_config.ts";
import * as rm from "../../../rm/mod.ts";
import { TERMINOLOGY_ID } from "../../../base/mod.ts";
import { CODE_PHRASE, COMPOSITION } from "../../../rm/mod.ts";

const BP_LIKE_CANONICAL = JSON.stringify({
  _type: "COMPOSITION",
  name: { _type: "DV_TEXT", value: "Blood pressure" },
  uid: {
    _type: "OBJECT_VERSION_ID",
    value: "12345678-1234-1234-1234-123456789abc::test.ehr::1",
  },
  archetype_details: {
    _type: "ARCHETYPED",
    archetype_id: {
      _type: "ARCHETYPE_ID",
      value: "openEHR-EHR-COMPOSITION.encounter.v1",
    },
    template_id: { _type: "TEMPLATE_ID", value: "blood_pressure.v1" },
    rm_version: "1.1.0",
  },
  archetype_node_id: "openEHR-EHR-COMPOSITION.encounter.v1",
  language: {
    _type: "CODE_PHRASE",
    terminology_id: { _type: "TERMINOLOGY_ID", value: "ISO_639-1" },
    code_string: "en",
  },
  territory: {
    _type: "CODE_PHRASE",
    terminology_id: { _type: "TERMINOLOGY_ID", value: "ISO_3166-1" },
    code_string: "GB",
  },
  category: {
    _type: "DV_CODED_TEXT",
    value: "event",
    defining_code: {
      _type: "CODE_PHRASE",
      terminology_id: { _type: "TERMINOLOGY_ID", value: "openehr" },
      code_string: "433",
    },
  },
  composer: {
    _type: "PARTY_IDENTIFIED",
    name: "Test Composer",
    external_ref: {
      _type: "PARTY_REF",
      id: { _type: "HIER_OBJECT_ID", value: "composer-1" },
      namespace: "DEMO",
      type: "PERSON",
    },
  },
  context: {
    _type: "EVENT_CONTEXT",
    start_time: { _type: "DV_DATE_TIME", value: "2026-01-01T12:00:00Z" },
    setting: {
      _type: "DV_CODED_TEXT",
      value: "primary medical care",
      defining_code: {
        _type: "CODE_PHRASE",
        terminology_id: { _type: "TERMINOLOGY_ID", value: "openehr" },
        code_string: "228",
      },
    },
  },
  content: [],
});

Deno.test("canonical-strict — deserializes BP-like JSON when only RM was pre-registered", () => {
  TypeRegistry.clear();
  TypeRegistry.registerModule(rm as Record<string, unknown>);

  assert(!TypeRegistry.hasType("TERMINOLOGY_ID"));
  assert(TypeRegistry.hasType("CODE_PHRASE"));

  const deserializer = new JsonConfigurableDeserializer(CANONICAL_JSON_DESERIALIZE_CONFIG);
  const instance = deserializer.deserialize(BP_LIKE_CANONICAL) as COMPOSITION;

  assertEquals(instance.constructor.name, "COMPOSITION");
  const language = instance.language as CODE_PHRASE;
  assert(language.terminology_id instanceof TERMINOLOGY_ID);
  assertEquals(language.terminology_id?.value, "ISO_639-1");
});

Deno.test("canonical-strict — registerOpenEhrModelTypes covers BASE id types in fixture", () => {
  TypeRegistry.clear();
  registerOpenEhrModelTypes();

  const typeNames = collectTypeNamesFromJsonTree(JSON.parse(BP_LIKE_CANONICAL));
  const missing: string[] = [];
  for (const name of typeNames) {
    if (!TypeRegistry.hasType(name)) {
      missing.push(name);
    }
  }
  assertEquals(missing, []);
});

Deno.test("registerOpenEhrModelTypes does not register base helper exports", () => {
  TypeRegistry.clear();
  registerOpenEhrModelTypes();

  assert(!TypeRegistry.hasType("registerType"));
  assert(!TypeRegistry.hasType("getRegisteredTypes"));
  assert(TypeRegistry.hasType("TERMINOLOGY_ID"));
  assert(TypeRegistry.hasType("GENERIC_ID"));
  assert(TypeRegistry.hasType("PARTY_REF"));
});

Deno.test("canonical fixture audit — real Better sandbox composition", async () => {
  const path = new URL(
    "../v7_rc1_some_yes-Better_Sandbox-response1693499899288.canonical.json",
    import.meta.url,
  );
  const json = await Deno.readTextFile(path);
  TypeRegistry.clear();
  registerOpenEhrModelTypes();

  const typeNames = collectTypeNamesFromJsonTree(JSON.parse(json));
  const missing: string[] = [];
  for (const name of typeNames) {
    if (!TypeRegistry.hasType(name)) {
      missing.push(name);
    }
  }
  assertEquals(missing, []);
});
