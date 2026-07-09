import {
  assert,
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.220.0/assert/mod.ts";
import * as openehr_base from "../../enhanced/openehr_base.ts";
import * as openehr_rm from "../../enhanced/openehr_rm.ts";
import { JsonConfigurableDeserializer } from "../../enhanced/serialization/json/mod.ts";
import { TypeRegistry } from "../../enhanced/serialization/common/mod.ts";
import {
  buildLocatableStructuredObject,
  compactArchetypeDetails,
  convertObjectDirect,
  convertObjectEhrtslib,
  detectInputFormat,
  expandTerseString,
  expandZipehrToCanonical,
  jsonToCompactPlain,
  loadDefaultSymbolMap,
  parseLocatableStructuredObject,
  parseZipehrText,
  serializeToJZipehr,
  serializeToYZipehr,
  serializeZipehrPlainToJson,
  serializeZipehrPlainToYaml,
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

Deno.test("zipehr: structured LOCATABLE object", async () => {
  const map = await loadDefaultSymbolMap();
  const chemoDetails = {
    archetype_id: { value: "openEHR-EHR-COMPOSITION.self_reported_data.v1" },
    template_id: { value: "ChemoForm-MBA.v7" },
    rm_version: "1.1.0",
  };
  assertEquals(
    buildLocatableStructuredObject(
      "ChemoForm-MBA.v7",
      "openEHR-EHR-COMPOSITION.self_reported_data.v1",
      chemoDetails,
      map,
    ),
    {
      "🪧": "ChemoForm-MBA.v7",
      "Ⓣ": "ChemoForm-MBA.v7",
      "Ⓐ": "openEHR-EHR-COMPOSITION.self_reported_data.v1",
      "⚙️": "1.1.0",
    },
  );

  const clusterStructured = buildLocatableStructuredObject(
    "Vårdenhet",
    "openEHR-EHR-CLUSTER.organisation.v1",
    {
      archetype_id: { value: "openEHR-EHR-CLUSTER.organisation.v1" },
      rm_version: "1.1.0",
    },
    map,
  );
  assertEquals(clusterStructured, {
    "🪧": "Vårdenhet",
    "Ⓐ": "openEHR-EHR-CLUSTER.organisation.v1",
    "⚙️": "1.1.0",
  });

  const parsed = parseLocatableStructuredObject(clusterStructured, map);
  assertEquals(parsed.archetypeNodeId, "openEHR-EHR-CLUSTER.organisation.v1");
  assertEquals(
    (parsed.archetypeDetails as Record<string, unknown>)["Ⓐ"],
    "openEHR-EHR-CLUSTER.organisation.v1",
  );
  assertEquals(
    (parsed.archetypeDetails as Record<string, unknown>)["⚙️"],
    "1.1.0",
  );

  const sameNameStructured = buildLocatableStructuredObject(
    "openEHR-EHR-CLUSTER.organisation.v1",
    "openEHR-EHR-CLUSTER.organisation.v1",
    {
      archetype_id: { value: "openEHR-EHR-CLUSTER.organisation.v1" },
      rm_version: "1.1.0",
    },
    map,
  );
  assertEquals(sameNameStructured, {
    "🪧": "openEHR-EHR-CLUSTER.organisation.v1",
    "⚙️": "1.1.0",
  });
  const restored = parseLocatableStructuredObject(sameNameStructured, map);
  assertEquals(
    (restored.archetypeDetails as Record<string, unknown>)["Ⓐ"],
    "openEHR-EHR-CLUSTER.organisation.v1",
  );

  const treeStructured = buildLocatableStructuredObject(
    "Item tree",
    "at0003",
    undefined,
    map,
  );
  assertEquals(treeStructured, { "🪧": "Item tree", "🆔": "at0003" });
});

Deno.test("zipehr: terminology shortcuts", () => {
  assertEquals(shortenTerseString("openehr::433"), "🌬️433");
  assertEquals(shortenTerseString("ISO_639-1::en"), "💬en");
  assertEquals(shortenTerseString("local::at0023|Ja|"), "📍at0023|Ja|");
  assertEquals(expandTerseString("📍at0023|Ja|"), "local::at0023|Ja|");
  const compacted = compactArchetypeDetails({
    archetype_id: { value: "openEHR-EHR-COMPOSITION.encounter.v1" },
    template_id: { value: "Vital Signs" },
    rm_version: "1.0.4",
  }) as Record<string, unknown>;
  assertEquals(compacted["Ⓣ"], "Vital Signs");
  assertEquals(compacted["Ⓐ"], "openEHR-EHR-COMPOSITION.encounter.v1");
  assertEquals(compacted["⚙️"], "1.0.4");
});

Deno.test("zipehr: DV_CODED_TEXT terse in zipehr.json and zipehr.yaml", async () => {
  if (!exampleA) {
    exampleA = JSON.parse(await Deno.readTextFile(EXAMPLE_A_PATH));
  }
  const map = await loadDefaultSymbolMap();
  const jObj = convertObjectDirect(exampleA, map) as Record<string, unknown>;
  const yObj = convertObjectEhrtslib(exampleA, map) as Record<string, unknown>;

  const jContext = jObj.context as Record<string, unknown>;
  const jSetting = jContext.setting as Record<string, unknown>;
  assertEquals(jSetting["🗈"], "🌬️238|other care|");
  assertEquals(jSetting.defining_code, undefined);

  const yContext = yObj.context as Record<string, unknown>;
  assertEquals(yContext.setting, "🌬️238|other care|");
  assertEquals(yContext.start_time, "2024-01-15T10:30:00Z");
  assertEquals(
    typeof yContext.start_time,
    "string",
  );

  const fromJ = expandZipehrToCanonical(jObj, map) as Record<string, unknown>;
  const fromY = expandZipehrToCanonical(yObj, map) as Record<string, unknown>;
  const jSettingCanon = (fromJ.context as Record<string, unknown>)
    .setting as Record<string, unknown>;
  const ySettingCanon = (fromY.context as Record<string, unknown>)
    .setting as Record<string, unknown>;
  assertEquals(jSettingCanon.value, "other care");
  assertEquals(ySettingCanon.value, "other care");
  assertEquals(
    (fromY.context as Record<string, unknown>).start_time as Record<
      string,
      unknown
    >,
    { _type: "DV_DATE_TIME", value: "2024-01-15T10:30:00Z" },
  );
  assertEquals(
    (jSettingCanon.defining_code as { code_string: string }).code_string,
    "238",
  );
});

Deno.test("zipehr: compact plain object (zipehr.yaml pre-pass)", async () => {
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
    {
      "🪧": "Vital Signs",
      "Ⓣ": "Vital Signs",
      "Ⓐ": "openEHR-EHR-COMPOSITION.encounter.v1",
      "⚙️": "1.0.4",
    },
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
  assertEquals(detectInputFormat(yText).variant, "zipehr.yaml");
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
Deno.test("zipehr: RM roundtrip via zipehr.json and zipehr.yaml", async () => {
  initializeTypeRegistry();
  const rm = await deserializeExampleA();
  const jOut = await serializeToJZipehr(rm);
  const yOut = await serializeToYZipehr(rm);

  assert(jOut.includes("🖂") || jOut.includes("Vital Signs"));
  assert(yOut.includes("🖂") || yOut.includes("Vital Signs"));
  const jParsed = JSON.parse(jOut) as Record<string, unknown>;
  assertEquals(
    jParsed["🖂"],
    {
      "🪧": "Vital Signs",
      "Ⓣ": "Vital Signs",
      "Ⓐ": "openEHR-EHR-COMPOSITION.encounter.v1",
      "⚙️": "1.0.4",
    },
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
          "items": [
            {
              "_type": "ELEMENT",
              "name": { "_type": "DV_TEXT", "value": "Namn" },
              "archetype_node_id": "at0001",
              "value": {
                "_type": "DV_TEXT",
                "value": "Brandbergens vårdcentral",
              },
            },
            {
              "_type": "ELEMENT",
              "name": { "_type": "DV_TEXT", "value": "Identifierare" },
              "archetype_node_id": "at0003",
              "value": {
                "_type": "DV_IDENTIFIER",
                "id": "SE2321000016-1003",
                "type": "urn:oid:1.2.752.29.4.19",
              },
            },
          ],
        },
      ],
    },
  },
};

Deno.test("zipehr: chemo fixture structured locatable roundtrip (j and y)", async () => {
  const map = await loadDefaultSymbolMap();
  const jObj = convertObjectDirect(CHEMO_FIXTURE, map) as Record<
    string,
    unknown
  >;
  const yObj = convertObjectEhrtslib(CHEMO_FIXTURE, map) as Record<
    string,
    unknown
  >;

  assertEquals(
    jObj["🖂"],
    {
      "🪧": "ChemoForm-MBA.v7",
      "Ⓣ": "ChemoForm-MBA.v7",
      "Ⓐ": "openEHR-EHR-COMPOSITION.self_reported_data.v1",
      "⚙️": "1.1.0",
    },
  );
  assertEquals(
    yObj["🖂"],
    {
      "🪧": "ChemoForm-MBA.v7",
      "Ⓣ": "ChemoForm-MBA.v7",
      "Ⓐ": "openEHR-EHR-COMPOSITION.self_reported_data.v1",
      "⚙️": "1.1.0",
    },
  );

  const context = (jObj.context as Record<string, unknown>)
    .other_context as Record<
      string,
      unknown
    >;
  assertEquals(context["🌳"], { "🪧": "Item tree", "🆔": "at0003" });

  const cluster = (context.items as Record<string, unknown>[])[0];
  assertEquals(cluster["📁"], {
    "🪧": "Vårdenhet",
    "Ⓐ": "openEHR-EHR-CLUSTER.organisation.v1",
    "⚙️": "1.1.0",
  });
  const elements = cluster.items as Record<string, unknown>[];
  assertEquals(elements[0]["🔹"], { "🪧": "Namn", "🆔": "at0001" });
  assertEquals(elements[0]["🗉"], "Brandbergens vårdcentral");
  assertEquals(
    (elements[1]["🪪"] as Record<string, unknown>).id,
    "SE2321000016-1003",
  );

  const fromJ = expandZipehrToCanonical(jObj, map) as Record<string, unknown>;
  const fromY = expandZipehrToCanonical(yObj, map) as Record<string, unknown>;

  assertEquals(
    (fromJ.name as { value: string }).value,
    "ChemoForm-MBA.v7",
  );
  assertEquals(
    (fromJ.archetype_details as { archetype_id: { value: string } })
      .archetype_id
      .value,
    "openEHR-EHR-COMPOSITION.self_reported_data.v1",
  );
  assertEquals(
    fromJ.archetype_node_id,
    "openEHR-EHR-COMPOSITION.self_reported_data.v1",
  );

  const restoredCluster = (
    (
      (fromY.context as Record<string, unknown>).other_context as Record<
        string,
        unknown
      >
    ).items as Record<string, unknown>[]
  )[0];
  assertEquals(
    (restoredCluster.name as { value: string }).value,
    "Vårdenhet",
  );
  const restoredElements = restoredCluster.items as Record<string, unknown>[];
  assertEquals(
    (restoredElements[0].value as Record<string, unknown>).value,
    "Brandbergens vårdcentral",
  );
  assertEquals(
    (restoredElements[1].value as Record<string, unknown>).id,
    "SE2321000016-1003",
  );
  assertEquals(
    (restoredCluster.archetype_details as { archetype_id: { value: string } })
      .archetype_id.value,
    "openEHR-EHR-CLUSTER.organisation.v1",
  );
  assertEquals(
    restoredCluster.archetype_node_id,
    "openEHR-EHR-CLUSTER.organisation.v1",
  );
});

Deno.test("zipehr: hybrid JSON/YAML formatting stays valid and roundtrips", async () => {
  const map = await loadDefaultSymbolMap();
  const zipehrObj = convertObjectDirect(CHEMO_FIXTURE, map);

  const jsonText = serializeZipehrPlainToJson(zipehrObj);
  const yamlText = serializeZipehrPlainToYaml(
    convertObjectEhrtslib(CHEMO_FIXTURE, map),
  );

  assert(
    jsonText.includes(
      `{ "🔹": { "🪧": "Namn", "🆔": "at0001" }, "🗉": "Brandbergens vårdcentral" }`,
    ),
  );

  const parsedJson = JSON.parse(jsonText);
  const parsedYaml = parseZipehrText(yamlText);

  const yamlCluster = (
    (parsedYaml as Record<string, unknown>).context as Record<string, unknown>
  ).other_context as Record<string, unknown>;
  const yamlElement = (yamlCluster.items as Record<string, unknown>[])[0]
    .items as Record<string, unknown>[];
  assertEquals(yamlElement[0]["🔹"], { "🪧": "Namn", "🆔": "at0001" });
  assertEquals(yamlElement[0]["🗉"], "Brandbergens vårdcentral");

  const fromJson = expandZipehrToCanonical(parsedJson, map) as Record<
    string,
    unknown
  >;
  const fromYaml = expandZipehrToCanonical(parsedYaml, map) as Record<
    string,
    unknown
  >;

  assertEquals((fromJson.name as { value: string }).value, "ChemoForm-MBA.v7");
  assertEquals((fromYaml.name as { value: string }).value, "ChemoForm-MBA.v7");
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
  assertEquals(resolved.zipehrVariant, "zipehr.yaml");

  const result = await convert(zipehrYaml, {
    inputMode: "instance",
    inputFormat: "auto",
    inputDeserializerConfig: getJsonDeserializeConfigPreset("hybrid"),
    outputFormats: ["json", "zipehr.json", "zipehr.yaml"],
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
  assertExists(result.outputs?.["zipehr.json"]);
  assertExists(result.outputs?.["zipehr.yaml"]);
  assert((result.outputs?.["zipehr.json"] ?? "").length > 10);
});
