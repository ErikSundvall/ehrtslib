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
  buildLocatableBracket,
  buildLocatableFoldedString,
  compactArchetypeDetails,
  convertObjectDirect,
  convertObjectEhrtslib,
  detectInputFormat,
  expandZipehrToCanonical,
  jsonToCompactPlain,
  loadDefaultSymbolMap,
  parseLocatableBracket,
  parseLocatableFolded,
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

Deno.test("zipehr: folded locatable bracket", () => {
  const chemoDetails = {
    archetype_id: { value: "openEHR-EHR-COMPOSITION.self_reported_data.v1" },
    template_id: { value: "ChemoForm-MBA.v7" },
    rm_version: "1.1.0",
  };
  const bracket = buildLocatableBracket(
    "ChemoForm-MBA.v7",
    "openEHR-EHR-COMPOSITION.self_reported_data.v1",
    chemoDetails,
  );
  assertEquals(
    bracket,
    "Ⓣ ChemoForm-MBA.v7 Ⓐ openEHR-EHR-COMPOSITION.self_reported_data.v1 ⚙️1.1.0",
  );
  assertEquals(
    buildLocatableFoldedString(
      "ChemoForm-MBA.v7",
      "openEHR-EHR-COMPOSITION.self_reported_data.v1",
      chemoDetails,
    ),
    "ChemoForm-MBA.v7[Ⓣ ChemoForm-MBA.v7 Ⓐ openEHR-EHR-COMPOSITION.self_reported_data.v1 ⚙️1.1.0]",
  );

  const clusterBracket = buildLocatableBracket(
    "Vårdenhet",
    "openEHR-EHR-CLUSTER.organisation.v1",
    {
      archetype_id: { value: "openEHR-EHR-CLUSTER.organisation.v1" },
      rm_version: "1.1.0",
    },
  );
  assertEquals(
    clusterBracket,
    "Ⓐ openEHR-EHR-CLUSTER.organisation.v1 ⚙️1.1.0",
  );

  const parsed = parseLocatableBracket(clusterBracket, "Vårdenhet");
  assertEquals(parsed.archetypeNodeId, "openEHR-EHR-CLUSTER.organisation.v1");
  assertEquals(
    (parsed.archetypeDetails as Record<string, unknown>)["Ⓐ"],
    "openEHR-EHR-CLUSTER.organisation.v1",
  );
  assertEquals(
    (parsed.archetypeDetails as Record<string, unknown>)["⚙️"],
    "1.1.0",
  );

  const sameNameBracket = buildLocatableBracket(
    "openEHR-EHR-CLUSTER.organisation.v1",
    "openEHR-EHR-CLUSTER.organisation.v1",
    {
      archetype_id: { value: "openEHR-EHR-CLUSTER.organisation.v1" },
      rm_version: "1.1.0",
    },
  );
  assertEquals(sameNameBracket, "⚙️1.1.0");
  const restored = parseLocatableBracket(sameNameBracket, "openEHR-EHR-CLUSTER.organisation.v1");
  assertEquals(
    (restored.archetypeDetails as Record<string, unknown>)["Ⓐ"],
    "openEHR-EHR-CLUSTER.organisation.v1",
  );

  const folded = parseLocatableFolded("Item tree[at0003]");
  assertEquals(folded?.name, "Item tree");
  assertEquals(folded?.bracket, "at0003");
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
  assertEquals(
    converted["🖂"],
    "Vital Signs[Ⓣ Vital Signs Ⓐ openEHR-EHR-COMPOSITION.encounter.v1 ⚙️1.0.4]",
  );
  assertEquals(converted.archetype_details, undefined);
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
  assertEquals(
    jParsed["🖂"],
    "Vital Signs[Ⓣ Vital Signs Ⓐ openEHR-EHR-COMPOSITION.encounter.v1 ⚙️1.0.4]",
  );
  assertEquals(jParsed.archetype_details, undefined);

  const fromJ = await zipehrTextToCanonical(jOut);
  const fromY = await zipehrTextToCanonical(yOut);
  const fromJDetails = (fromJ as Record<string, unknown>)
    .archetype_details as Record<string, unknown>;
  assertEquals(
    (fromJDetails.template_id as { value?: string }).value,
    "Vital Signs",
  );
  assertEquals(
    (fromJDetails.archetype_id as { value?: string }).value,
    "openEHR-EHR-COMPOSITION.encounter.v1",
  );
  assertEquals(fromJDetails.rm_version, "1.0.4");
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

const CHEMO_FIXTURE: Record<string, unknown> = {
  "_type": "COMPOSITION",
  "name": { "_type": "DV_TEXT", "value": "ChemoForm-MBA.v7" },
  "archetype_details": {
    "_type": "ARCHETYPED",
    "archetype_id": {
      "_type": "ARCHETYPE_ID",
      "value": "openEHR-EHR-COMPOSITION.self_reported_data.v1",
    },
    "template_id": {
      "_type": "TEMPLATE_ID",
      "value": "ChemoForm-MBA.v7",
    },
    "rm_version": "1.1.0",
  },
  "archetype_node_id": "openEHR-EHR-COMPOSITION.self_reported_data.v1",
  "context": {
    "_type": "EVENT_CONTEXT",
    "other_context": {
      "_type": "ITEM_TREE",
      "name": { "_type": "DV_TEXT", "value": "Item tree" },
      "archetype_node_id": "at0003",
      "items": [
        {
          "_type": "CLUSTER",
          "name": { "_type": "DV_TEXT", "value": "Vårdenhet" },
          "archetype_details": {
            "_type": "ARCHETYPED",
            "archetype_id": {
              "_type": "ARCHETYPE_ID",
              "value": "openEHR-EHR-CLUSTER.organisation.v1",
            },
            "rm_version": "1.1.0",
          },
          "archetype_node_id": "openEHR-EHR-CLUSTER.organisation.v1",
          "items": [],
        },
      ],
    },
  },
};

Deno.test("zipehr: chemo fixture bracket roundtrip (j and y)", async () => {
  const map = await loadDefaultSymbolMap();
  const jObj = convertObjectDirect(CHEMO_FIXTURE, map) as Record<string, unknown>;
  const yObj = convertObjectEhrtslib(CHEMO_FIXTURE, map) as Record<string, unknown>;

  assertEquals(
    jObj["🖂"],
    "ChemoForm-MBA.v7[Ⓣ ChemoForm-MBA.v7 Ⓐ openEHR-EHR-COMPOSITION.self_reported_data.v1 ⚙️1.1.0]",
  );
  assertEquals(
    yObj["🖂"],
    "ChemoForm-MBA.v7[Ⓣ ChemoForm-MBA.v7 Ⓐ openEHR-EHR-COMPOSITION.self_reported_data.v1 ⚙️1.1.0]",
  );

  const context = (jObj.context as Record<string, unknown>).other_context as Record<
    string,
    unknown
  >;
  assertEquals(context["🌳"], "Item tree[at0003]");

  const cluster = ((context.items as Record<string, unknown>[])[0]);
  assertEquals(
    cluster["📁"],
    "Vårdenhet[Ⓐ openEHR-EHR-CLUSTER.organisation.v1 ⚙️1.1.0]",
  );

  const fromJ = expandZipehrToCanonical(jObj, map) as Record<string, unknown>;
  const fromY = expandZipehrToCanonical(yObj, map) as Record<string, unknown>;

  assertEquals(
    (fromJ.name as { value: string }).value,
    "ChemoForm-MBA.v7",
  );
  assertEquals(
    (fromJ.archetype_details as { archetype_id: { value: string } }).archetype_id
      .value,
    "openEHR-EHR-COMPOSITION.self_reported_data.v1",
  );
  assertEquals(fromJ.archetype_node_id, "openEHR-EHR-COMPOSITION.self_reported_data.v1");

  const restoredCluster = (
    (
      (
        (fromY.context as Record<string, unknown>).other_context as Record<
          string,
          unknown
        >
      ).items as Record<string, unknown>[]
    )[0]
  );
  assertEquals(
    (restoredCluster.name as { value: string }).value,
    "Vårdenhet",
  );
  assertEquals(
    (restoredCluster.archetype_details as { archetype_id: { value: string } })
      .archetype_id.value,
    "openEHR-EHR-CLUSTER.organisation.v1",
  );
  assertEquals(restoredCluster.archetype_node_id, "openEHR-EHR-CLUSTER.organisation.v1");
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
