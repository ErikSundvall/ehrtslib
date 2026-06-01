import { assert, assertEquals } from "https://deno.land/std@0.220.0/assert/mod.ts";
import {
  convert,
  getAsciidocConfigPreset,
  getJsonConfigPreset,
  getJsonDeserializeConfigPreset,
  getMarkdownConfigPreset,
  getYamlConfigPreset,
  validateTemplateInput,
} from "./converter.ts";

const OPERATIONAL_TEMPLATE_ADL = `operational_template (adl_version=2.0.5)
    openEHR-EHR-COMPOSITION.demo_generated.v1.0.0

language
    original_language = <"ISO_639-1::en">

definition
    COMPOSITION[id1] matches {
        content matches {
            SECTION[id2]
        }
    }

terminology
    term_definitions = <
        ["en"] = <
            ["id1"] = < text = <"Demo composition"> >
            ["id2"] = < text = <"Generated section"> >
        >
    >`;

Deno.test("validateTemplateInput accepts operational_template input", () => {
  const result = validateTemplateInput(OPERATIONAL_TEMPLATE_ADL);
  assertEquals(result.valid, true);
});

Deno.test("validateTemplateInput rejects plain archetype (non-template) input", () => {
  const result = validateTemplateInput(OPERATIONAL_TEMPLATE_ADL.replace("operational_template", "archetype"));
  assertEquals(result.valid, false);
  assert(result.message.includes("archetype") || result.message.includes("Invalid"));
});

Deno.test("convert template input generates RM example outputs and TypeScript stubs", async () => {
  const result = await convert(OPERATIONAL_TEMPLATE_ADL, {
    inputMode: "template",
    inputFormat: "json",
    inputDeserializerConfig: getJsonDeserializeConfigPreset("default"),
    outputFormats: ["json", "typescript"],
    templateGenerationMode: "minimal",
    jsonSerializerType: "configurable",
    jsonConfig: getJsonConfigPreset("canonical"),
    yamlConfig: getYamlConfigPreset("default"),
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
      archetypeNodeIdLocation: "after_name",
    },
  });

  assertEquals(result.success, true);
  assert(result.outputs?.json);
  assert(result.outputs?.typescript);

  const generatedJson = JSON.parse(result.outputs?.json || "{}");
  assertEquals(generatedJson._type, "COMPOSITION");
  assert(result.outputs?.typescript?.includes("export interface"));
});

Deno.test("convert template input generates simplified format outputs", async () => {
  const result = await convert(OPERATIONAL_TEMPLATE_ADL, {
    inputMode: "template",
    inputFormat: "json",
    inputDeserializerConfig: getJsonDeserializeConfigPreset("default"),
    outputFormats: ["flat", "structured", "webtemplate"],
    templateGenerationMode: "minimal",
    jsonSerializerType: "configurable",
    jsonConfig: getJsonConfigPreset("canonical"),
    yamlConfig: getYamlConfigPreset("default"),
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
      archetypeNodeIdLocation: "after_name",
    },
  });

  assertEquals(result.success, true);
  assert(result.outputs?.flat);
  assert(result.outputs?.structured);
  assert(result.outputs?.webtemplate);
  assert(JSON.parse(result.outputs?.flat || "{}")["ctx/language"]);
  assert(JSON.parse(result.outputs?.webtemplate || "{}").templateId);
});

Deno.test("convert template input generates markdown and asciidoc outputs", async () => {
  const result = await convert(OPERATIONAL_TEMPLATE_ADL, {
    inputMode: "template",
    inputFormat: "json",
    inputDeserializerConfig: getJsonDeserializeConfigPreset("default"),
    outputFormats: ["markdown", "asciidoc"],
    templateGenerationMode: "minimal",
    jsonSerializerType: "configurable",
    jsonConfig: getJsonConfigPreset("canonical"),
    yamlConfig: getYamlConfigPreset("default"),
    markdownConfig: getMarkdownConfigPreset("structural"),
    asciidocConfig: getAsciidocConfigPreset("lossless"),
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
      archetypeNodeIdLocation: "after_name",
    },
  });

  assertEquals(result.success, true);
  assert(result.outputs?.markdown);
  assert(result.outputs?.asciidoc);
  assert(result.outputs?.markdown?.includes("Demo composition"));
  assert(result.outputs?.asciidoc?.includes("Demo composition"));
});
