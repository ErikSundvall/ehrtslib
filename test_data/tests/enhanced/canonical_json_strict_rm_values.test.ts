/**
 * Canonical JSON must not accept values that are not canonical openEHR JSON.
 * Issue #219.
 */

import {
  assert,
  assertEquals,
  assertStringIncludes,
  assertThrows,
} from "@std/assert";
import { registerOpenEhrModelTypes } from "../../../serialization/common/openehr_model_registry.ts";
import {
  DeserializationError,
  SerializationError,
} from "../../../serialization/common/errors.ts";
import {
  CANONICAL_JSON_DESERIALIZE_CONFIG,
  COMPACT_JSON_DESERIALIZE_CONFIG,
  HYBRID_JSON_DESERIALIZE_CONFIG,
  JsonCanonicalSerializer,
  JsonConfigurableDeserializer,
  NON_STANDARD_VERY_COMPACT_JSON_DESERIALIZE_CONFIG,
} from "../../../serialization/json/mod.ts";
import { YamlSerializer } from "../../../serialization/yaml/yaml_serializer.ts";
import * as rm from "../../../rm/mod.ts";

function registered(): void {
  registerOpenEhrModelTypes();
}

// RM instances coerce terse strings on assignment (#216). Define the raw
// values directly so these tests still see a non-RM value in an RM slot,
// as code that bypasses the setters (or an older instance) could produce.
function observationWith(values: Record<string, unknown>): rm.OBSERVATION {
  registered();
  const obs = new rm.OBSERVATION();
  for (const [key, value] of Object.entries(values)) {
    Object.defineProperty(obs, key, {
      value,
      writable: true,
      enumerable: true,
      configurable: true,
    });
  }
  return obs;
}

Deno.test("canonical serialize throws on a terse string in a CODE_PHRASE attribute", () => {
  const obs = observationWith({ language: "ISO_639-1::en" });
  const err = assertThrows(
    () => new JsonCanonicalSerializer().serialize(obs),
    SerializationError,
    "Non-RM value",
  );
  assertStringIncludes(err.message, "language");
});

Deno.test("strict canonical deserialize throws on a terse string in language", () => {
  registered();
  const json = JSON.stringify({
    _type: "OBSERVATION",
    language: "ISO_639-1::en",
  });
  const err = assertThrows(
    () =>
      new JsonConfigurableDeserializer(CANONICAL_JSON_DESERIALIZE_CONFIG)
        .deserialize(json),
    DeserializationError,
    "language",
  );
  assertStringIncludes(err.message, "CODE_PHRASE");
});

Deno.test("canonical serialize throws on subject object without _type", () => {
  const obs = observationWith({ subject: { rmType: "PARTY_SELF" } });
  const err = assertThrows(
    () => new JsonCanonicalSerializer().serialize(obs),
    SerializationError,
    "Non-RM value",
  );
  assertStringIncludes(err.message, "subject");
  assertStringIncludes(err.message, "abstract or polymorphic");
});

Deno.test("strict canonical deserialize throws on subject without _type and does not guess PARTY_PROXY", () => {
  registered();
  const json = JSON.stringify({
    _type: "OBSERVATION",
    subject: { rmType: "PARTY_SELF" },
  });
  const debugCalls: string[] = [];
  const original = console.debug;
  console.debug = (...args: unknown[]) => {
    debugCalls.push(args.map((part) => String(part)).join(" "));
  };
  try {
    const err = assertThrows(
      () =>
        new JsonConfigurableDeserializer(CANONICAL_JSON_DESERIALIZE_CONFIG)
          .deserialize(json),
      DeserializationError,
      "subject",
    );
    assertStringIncludes(err.message, "abstract or polymorphic");
    assert(!err.message.includes("best guess"));
  } finally {
    console.debug = original;
  }
  assertEquals(
    debugCalls.some((line) =>
      line.includes("best guess") && line.includes("PARTY_PROXY")
    ),
    false,
  );
});

Deno.test("strict canonical deserialize throws on unknown CODE_PHRASE attribute value", () => {
  registered();
  const json = JSON.stringify({
    _type: "CODE_PHRASE",
    value: "en",
    terminology_id: { _type: "TERMINOLOGY_ID", value: "ISO_639-1" },
  });
  const err = assertThrows(
    () =>
      new JsonConfigurableDeserializer(CANONICAL_JSON_DESERIALIZE_CONFIG)
        .deserialize(json),
    DeserializationError,
    "Unknown attribute 'value'",
  );
  assertStringIncludes(err.message, "CODE_PHRASE");
});

Deno.test("strict canonical deserialize keeps derived EVENT.offset", () => {
  registered();
  const json = JSON.stringify({
    _type: "POINT_EVENT",
    name: { _type: "DV_TEXT", value: "Any event" },
    archetype_node_id: "at0002",
    time: { _type: "DV_DATE_TIME", value: "2026-01-01T12:00:00Z" },
    offset: { _type: "DV_DURATION", value: "PT0S" },
  });
  const event = new JsonConfigurableDeserializer(CANONICAL_JSON_DESERIALIZE_CONFIG)
    .deserialize(json) as { offset?: { value?: string } };
  assertEquals(event.offset?.value, "PT0S");
});

Deno.test("strict canonical deserialize throws on unknown EVENT_CONTEXT attribute name", () => {
  registered();
  const json = JSON.stringify({
    _type: "EVENT_CONTEXT",
    name: { _type: "DV_TEXT", value: "EVENT_CONTEXT" },
    start_time: { _type: "DV_DATE_TIME", value: "2026-01-01T12:00:00Z" },
  });
  const err = assertThrows(
    () =>
      new JsonConfigurableDeserializer(CANONICAL_JSON_DESERIALIZE_CONFIG)
        .deserialize(json),
    DeserializationError,
    "Unknown attribute 'name'",
  );
  assertStringIncludes(err.message, "EVENT_CONTEXT");
});

Deno.test("onNonRmValue pass still emits the raw language string", () => {
  const obs = observationWith({ language: "ISO_639-1::en" });
  const parsed = JSON.parse(
    new JsonCanonicalSerializer({ onNonRmValue: "pass" }).serialize(obs),
  );
  assertEquals(parsed.language, "ISO_639-1::en");
  assertEquals(parsed._type, "OBSERVATION");

  const perCall = JSON.parse(
    new JsonCanonicalSerializer().serialize(obs, { onNonRmValue: "pass" }),
  );
  assertEquals(perCall.language, "ISO_639-1::en");
});

Deno.test("onNonRmValue coerce turns terse strings into RM objects with _type", () => {
  const language = observationWith({ language: "ISO_639-1::en" });
  const parsed = JSON.parse(
    new JsonCanonicalSerializer({ onNonRmValue: "coerce" }).serialize(language),
  );
  assertEquals(parsed.language._type, "CODE_PHRASE");
  assertEquals(parsed.language.code_string, "en");
  assertEquals(parsed.language.terminology_id._type, "TERMINOLOGY_ID");
  assertEquals(parsed.language.terminology_id.value, "ISO_639-1");

  const named = observationWith({ name: "Pulse" });
  const namedJson = JSON.parse(
    new JsonCanonicalSerializer({ onNonRmValue: "coerce" }).serialize(named),
  );
  assertEquals(namedJson.name._type, "DV_TEXT");
  assertEquals(namedJson.name.value, "Pulse");

  const composition = Object.assign(new rm.COMPOSITION(), {
    category: "openehr::433|event|",
  });
  const categoryJson = JSON.parse(
    new JsonCanonicalSerializer({ onNonRmValue: "coerce" }).serialize(
      composition,
    ),
  );
  assertEquals(categoryJson.category._type, "DV_CODED_TEXT");
  assertEquals(categoryJson.category.value, "event");
  assertEquals(categoryJson.category.defining_code._type, "CODE_PHRASE");
  assertEquals(categoryJson.category.defining_code.code_string, "433");
});

Deno.test("real OBSERVATION and CODE_PHRASE round-trip under canonical strict JSON", () => {
  registered();
  const phrase = new rm.CODE_PHRASE("ISO_639-1::en");
  const phraseJson = new JsonCanonicalSerializer().serialize(phrase);
  const phraseParsed = JSON.parse(phraseJson);
  assertEquals(phraseParsed._type, "CODE_PHRASE");
  assertEquals(phraseParsed.code_string, "en");
  assertEquals(phraseParsed.terminology_id._type, "TERMINOLOGY_ID");

  const obs = new rm.OBSERVATION();
  obs.name = new rm.DV_TEXT("Pulse");
  obs.archetype_node_id = "at0001";
  obs.language = phrase;
  obs.subject = new rm.PARTY_SELF();

  const json = new JsonCanonicalSerializer().serialize(obs);
  const parsed = JSON.parse(json);
  assertEquals(parsed._type, "OBSERVATION");
  assertEquals(parsed.language._type, "CODE_PHRASE");
  assertEquals(parsed.language.code_string, "en");
  assertEquals(parsed.subject._type, "PARTY_SELF");
  assertEquals(parsed.name._type, "DV_TEXT");
  assertEquals(parsed.name.value, "Pulse");

  const restored = new JsonConfigurableDeserializer(
    CANONICAL_JSON_DESERIALIZE_CONFIG,
  )
    .deserialize(json);
  assertEquals(restored.constructor.name, "OBSERVATION");
  assertEquals(restored.language.constructor.name, "CODE_PHRASE");
  assertEquals(restored.language.code_string, "en");
  assertEquals(restored.language.terminology_id.value, "ISO_639-1");
  assertEquals(restored.subject.constructor.name, "PARTY_SELF");
  assertEquals(restored.name.value, "Pulse");
  assertEquals(restored.archetype_node_id, "at0001");

  const phraseRestored = new JsonConfigurableDeserializer(
    CANONICAL_JSON_DESERIALIZE_CONFIG,
  )
    .deserialize(phraseJson);
  assertEquals(phraseRestored.constructor.name, "CODE_PHRASE");
  assertEquals(phraseRestored.code_string, "en");
});

Deno.test("strict mode still infers a concrete non-polymorphic CODE_PHRASE without _type", () => {
  registered();
  const json = JSON.stringify({
    _type: "OBSERVATION",
    language: {
      code_string: "en",
      terminology_id: { value: "ISO_639-1" },
    },
  });
  const restored = new JsonConfigurableDeserializer(
    CANONICAL_JSON_DESERIALIZE_CONFIG,
  )
    .deserialize(json);
  assertEquals(restored.language.constructor.name, "CODE_PHRASE");
  assertEquals(restored.language.code_string, "en");
  assertEquals(
    restored.language.terminology_id.constructor.name,
    "TERMINOLOGY_ID",
  );
  assertEquals(restored.language.terminology_id.value, "ISO_639-1");
});

Deno.test("lenient JSON presets still accept non-canonical values", () => {
  registered();
  const observation = JSON.stringify({
    _type: "OBSERVATION",
    language: "ISO_639-1::en",
    subject: { rmType: "PARTY_SELF" },
  });
  const context = JSON.stringify({
    _type: "EVENT_CONTEXT",
    name: { _type: "DV_TEXT", value: "EVENT_CONTEXT" },
  });
  const phrase = JSON.stringify({
    _type: "CODE_PHRASE",
    value: "en",
    terminology_id: { _type: "TERMINOLOGY_ID", value: "ISO_639-1" },
  });

  for (
    const config of [
      COMPACT_JSON_DESERIALIZE_CONFIG,
      HYBRID_JSON_DESERIALIZE_CONFIG,
      NON_STANDARD_VERY_COMPACT_JSON_DESERIALIZE_CONFIG,
    ]
  ) {
    const deser = new JsonConfigurableDeserializer(config);
    const obs = deser.deserialize(observation);
    // The terse string is coerced to CODE_PHRASE on assignment (#216).
    assertEquals(obs.language.constructor.name, "CODE_PHRASE");
    assertEquals(obs.language.code_string, "en");
    assertEquals(obs.language.terminology_id.value, "ISO_639-1");
    assertEquals(obs.subject.constructor.name, "PARTY_PROXY");
    const ctx = deser.deserialize(context);
    assertEquals(ctx.name.value, "EVENT_CONTEXT");
    const cp = deser.deserialize(phrase);
    assertEquals(cp.value, "en");
  }
});

Deno.test("YAML serializer still emits a terse language string", () => {
  const obs = observationWith({ language: "ISO_639-1::en" });
  const yaml = new YamlSerializer().serialize(obs);
  assertStringIncludes(yaml, "ISO_639-1::en");
});
