import {
  assert,
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.220.0/assert/mod.ts";
import { parse as parseYaml } from "yaml";
import * as openehr_base from "../../enhanced/openehr_base.ts";
import * as openehr_rm from "../../enhanced/openehr_rm.ts";
import { JsonConfigurableDeserializer } from "../../enhanced/serialization/json/mod.ts";
import { TypeRegistry } from "../../enhanced/serialization/common/mod.ts";
import {
  compactArchetypeDetails,
  convertObjectDirect,
  convertObjectEhrtslib,
  detectInputFormat,
  expandZipehrToCanonical,
  jsonToCompactPlain,
  loadDefaultSymbolMap,
  parseZipehrText,
  serializeToJZipehr,
  serializeToYZipehr,
  shortenTerseString,
  zipehrTextToCanonical,
} from "../../enhanced/serialization/zipehr/mod.ts";
import {
  convert,
  getJsonDeserializeConfigPreset,
  getYamlConfigPreset,
  initializeTypeRegistry,
  resolveInputFormat,
} from "../../../examples/demo-app/src/converter.ts";

const EXAMPLE_A_PATH = new URL(
  "../../zipehr/example_a.json",
  import.meta.url,
);

let exampleA: Record<string, unknown>;

Deno.test("zipehr: load fixture and symbol map", async () => {
  exampleA = JSON.parse(await Deno.readTextFile(EXAMPLE_A_PATH));
  const map = await loadDefaultSymbolMap();
  assertExists(map.COMPOSITION);
  assertExists(map.OBSERVATION);
});

Deno.test("zipehr: terminology shortcuts", () => {
  assertEquals(shortenTerseString("openehr::433"), "🪟433");
  assertEquals(shortenTerseString("ISO_639-1::en"), "💬en");
  const compacted = compactArchetypeDetails({
    archetype_id: { value: "openEHR-EHR-COMPOSITION.encounter.v1" },
    template_id: { value: "Vital Signs" },
    rm_version: "1.0.4",
  }) as Record<string, unknown>;
  assertEquals(compacted["Ⓣ"], "Vital Signs");
  assertEquals(compacted["Ⓐ"], "openEHR-EHR-COMPOSITION.encounter.v1");
  assertEquals(compacted["⚙️"], "1.0.4");
});

Deno.test("zipehr: compact plain object (y-zipehr pre-pass)", async () => {
  if (!exampleA) {
    exampleA = JSON.parse(await Deno.readTextFile(EXAMPLE_A_PATH));
  }
  const compact = jsonToCompactPlain(exampleA) as Record<string, unknown>;
  assertEquals(compact.language, "ISO_639-1::en");
  assertEquals(compact.name, "Vital Signs");
  assertEquals((compact as { _type?: string })._type, undefined);
});

Deno.test("zipehr: ehrtslib path shorthands", async () => {
  if (!exampleA) {
    exampleA = JSON.parse(await Deno.readTextFile(EXAMPLE_A_PATH));
  }
  const map = await loadDefaultSymbolMap();
  const converted = convertObjectEhrtslib(exampleA, map) as Record<
    string,
    unknown
  >;
  assertEquals(converted["🖂"], "Vital Signs");
  const details = converted.archetype_details as Record<string, unknown>;
  assertEquals(details["Ⓣ"], "Vital Signs");
  assertEquals(converted["💬"], "en");
  assertEquals(converted["🌐"], "US");
  const obs = (converted.content as Record<string, unknown>[])[0];
  assertEquals(obs["💬"], "en");
  assertEquals(obs["🔤"], "UTF-8");
});

Deno.test("zipehr: ehrtslib path YAML re-parse roundtrip", async () => {
  if (!exampleA) {
    exampleA = JSON.parse(await Deno.readTextFile(EXAMPLE_A_PATH));
  }
  const map = await loadDefaultSymbolMap();
  const converted = convertObjectEhrtslib(exampleA, map);
  const serialized = JSON.stringify(converted);
  const reparsed = JSON.parse(serialized);
  assertEquals(JSON.stringify(reparsed), JSON.stringify(converted));
});

Deno.test("zipehr: expand to canonical and detect variants", async () => {
  if (!exampleA) {
    exampleA = JSON.parse(await Deno.readTextFile(EXAMPLE_A_PATH));
  }
  initializeTypeRegistry();
  const map = await loadDefaultSymbolMap();
  const zipehrObj = convertObjectEhrtslib(exampleA, map);
  const canonical = expandZipehrToCanonical(zipehrObj, map) as Record<
    string,
    unknown
  >;
  assertEquals(canonical._type, "COMPOSITION");
  assertEquals((canonical.name as { value: string }).value, "Vital Signs");

  const jText = JSON.stringify(zipehrObj);
  const yText = await serializeToYZipehr(
    await deserializeExampleA(),
  );

  assertEquals(detectInputFormat(jText).kind, "zipehr");
  assertEquals(detectInputFormat(yText).kind, "zipehr");
  assertEquals(detectInputFormat(yText).variant, "y-zipehr");
});

async function deserializeExampleA(): Promise<unknown> {
  if (!exampleA) {
    exampleA = JSON.parse(await Deno.readTextFile(EXAMPLE_A_PATH));
  }
  TypeRegistry.registerModule(openehr_rm);
  TypeRegistry.registerModule(openehr_base);
  const deser = new JsonConfigurableDeserializer(
    getJsonDeserializeConfigPreset("hybrid"),
  );
  return deser.deserialize(JSON.stringify(exampleA));
}
Deno.test("zipehr: RM roundtrip via j-zipehr and y-zipehr", async () => {
  initializeTypeRegistry();
  const rm = await deserializeExampleA();
  const jOut = await serializeToJZipehr(rm);
  const yOut = await serializeToYZipehr(rm);

  assert(jOut.includes("🖂") || jOut.includes("Vital Signs"));
  assert(yOut.includes("🖂") || yOut.includes("Vital Signs"));
  const jParsed = JSON.parse(jOut) as Record<string, unknown>;
  const jDetails = jParsed.archetype_details as Record<string, unknown>;
  assertEquals(jDetails["Ⓣ"], "Vital Signs");
  assertEquals(jDetails["Ⓐ"], "openEHR-EHR-COMPOSITION.encounter.v1");

  const fromJ = await zipehrTextToCanonical(jOut);
  const fromY = await zipehrTextToCanonical(yOut);
  const fromJDetails = (fromJ as Record<string, unknown>)
    .archetype_details as Record<string, unknown>;
  assertEquals(
    (fromJDetails.template_id as { value?: string }).value,
    "Vital Signs",
  );
  const deser = new JsonConfigurableDeserializer(
    getJsonDeserializeConfigPreset("hybrid"),
  );
  const restoredJ = deser.deserialize(JSON.stringify(fromJ));
  const restoredY = deser.deserialize(JSON.stringify(fromY));

  assertEquals(
    (restoredJ as { name?: { value?: string } }).name?.value,
    "Vital Signs",
  );
  assertEquals(
    (restoredY as { name?: { value?: string } }).name?.value,
    "Vital Signs",
  );
});

Deno.test("zipehr: demo convert with auto-detect input", async () => {
  if (!exampleA) {
    exampleA = JSON.parse(await Deno.readTextFile(EXAMPLE_A_PATH));
  }
  initializeTypeRegistry();
  const map = await loadDefaultSymbolMap();
  const zipehrYaml = await serializeToYZipehr(await deserializeExampleA());

  const resolved = resolveInputFormat(zipehrYaml, "auto");
  assert(resolved.isZipehr);
  assertEquals(resolved.zipehrVariant, "y-zipehr");

  const result = await convert(zipehrYaml, {
    inputMode: "instance",
    inputFormat: "auto",
    inputDeserializerConfig: getJsonDeserializeConfigPreset("hybrid"),
    outputFormats: ["json", "j-zipehr", "y-zipehr"],
    templateGenerationMode: "example",
    jsonSerializerType: "configurable",
    jsonConfig: { prettyPrint: true, indent: 2 },
    yamlConfig: getYamlConfigPreset("flow"),
    markdownConfig: { style: "structural" },
    asciidocConfig: { style: "lossless" },
    xmlConfig: {
      prettyPrint: true,
      indent: 2,
      includeDeclaration: true,
      includeNamespaces: true,
    },
    typescriptConfig: {
      useTerseFormat: true,
      usePrimitiveConstructors: true,
      includeComments: false,
      indent: 2,
    },
  });

  assertEquals(result.success, true);
  assertExists(result.outputs?.["j-zipehr"]);
  assertExists(result.outputs?.["y-zipehr"]);
  assert((result.outputs?.["j-zipehr"] ?? "").length > 10);
});
