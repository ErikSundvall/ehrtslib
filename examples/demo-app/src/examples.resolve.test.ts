import {
  assertEquals,
  assertThrows,
} from "https://deno.land/std@0.220.0/assert/mod.ts";
import {
  EXAMPLES,
  resolveExampleInput,
  type DemoExample,
} from "./examples.ts";
import {
  convert,
  getAsciidocConfigPreset,
  getJsonConfigPreset,
  getJsonDeserializeConfigPreset,
  getMarkdownConfigPreset,
  getYamlConfigPreset,
} from "./converter.ts";
import { ClinicalModelWorkspace } from "../../../parser/mod.ts";

Deno.test("resolveExampleInput switches to json when current format is flat but only json exists", () => {
  const example = EXAMPLES["dv-text"];
  const resolved = resolveExampleInput(example, "flat");
  assertEquals(resolved.format, "json");
  assertEquals(resolved.payload.includes("DV_TEXT"), true);
});

Deno.test("resolveExampleInput keeps preferred flat for accident-report preset", () => {
  const example = EXAMPLES["accident-report-vitals"];
  const resolved = resolveExampleInput(example, "json");
  assertEquals(resolved.format, "flat");
  assertEquals(resolved.payload.includes("ctx/language"), true);
});

Deno.test("resolveExampleInput prefers current format when that payload exists", () => {
  const example: DemoExample = {
    name: "dual",
    description: "has both",
    preferredFormat: "flat",
    flat: `{"ctx/language":"en"}`,
    json: `{"_type":"DV_TEXT","value":"x"}`,
  };
  // preferredFormat wins over currentFormat
  assertEquals(resolveExampleInput(example, "json").format, "flat");

  const noPreferred: DemoExample = {
    name: "dual-no-pref",
    description: "has both",
    flat: `{"ctx/language":"en"}`,
    json: `{"_type":"DV_TEXT","value":"x"}`,
  };
  assertEquals(resolveExampleInput(noPreferred, "json").format, "json");
  assertEquals(resolveExampleInput(noPreferred, "flat").format, "flat");
});

Deno.test("resolveExampleInput throws when example has no payload", () => {
  assertThrows(
    () =>
      resolveExampleInput({
        name: "empty",
        description: "none",
      }),
    Error,
    "no usable payload",
  );
});

Deno.test("all dropdown presets convert to non-null YAML when format is resolved", async () => {
  const workspace = new ClinicalModelWorkspace();
  // Only needed for the FLAT accident-report preset
  const WT_URL =
    "https://raw.githubusercontent.com/Ehrlibs/openEHR-model-examples/main/local/theme-packs/sport-event-details/templates/Accident%20report%20including%20vital%20signs.wt.json";
  const wtText = await (await fetch(WT_URL)).text();
  workspace.addFile("accident.wt.json", wtText);

  const baseOptions = {
    inputMode: "instance" as const,
    inputDeserializerConfig: getJsonDeserializeConfigPreset("default"),
    outputFormats: ["yaml"] as ["yaml"],
    templateGenerationMode: "example" as const,
    jsonSerializerType: "configurable" as const,
    jsonConfig: getJsonConfigPreset("canonical"),
    yamlConfig: getYamlConfigPreset("default"),
    markdownConfig: getMarkdownConfigPreset("default"),
    asciidocConfig: getAsciidocConfigPreset("default"),
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
      includeUndefinedAttributes: false,
      archetypeNodeIdLocation: "after_name" as const,
      nameLocation: "beginning" as const,
    },
    templateWorkspace: workspace,
  };

  // Mimic UI: start on flat (default after accident-report), then resolve each preset
  let currentFormat = "flat";
  for (const [key, example] of Object.entries(EXAMPLES)) {
    const { format, payload } = resolveExampleInput(example, currentFormat);
    currentFormat = format;
    const result = await convert(payload, {
      ...baseOptions,
      inputFormat: format,
    });
    assertEquals(result.success, true, `${key} should convert successfully`);
    const yaml = result.outputs?.yaml ?? "";
    assertEquals(
      yaml.trim() !== "null" && yaml.trim().length > 0,
      true,
      `${key} YAML must not be null (got ${JSON.stringify(yaml.slice(0, 40))})`,
    );
  }
});
