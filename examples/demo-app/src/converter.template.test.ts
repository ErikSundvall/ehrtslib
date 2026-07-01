import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.220.0/assert/mod.ts";
import { ClinicalModelWorkspace } from "../../../enhanced/parser/mod.ts";
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

Deno.test("validateTemplateInput accepts loaded workspace root", () => {
  const workspace = new ClinicalModelWorkspace();
  workspace.addFile("demo_generated.opt", OPERATIONAL_TEMPLATE_ADL);

  const result = validateTemplateInput("", workspace);
  assertEquals(result.valid, true);
  assert(result.message.includes("Valid operational template"));
});

Deno.test("validateTemplateInput rejects plain archetype (non-template) input", () => {
  const result = validateTemplateInput(
    OPERATIONAL_TEMPLATE_ADL.replace("operational_template", "archetype"),
  );
  assertEquals(result.valid, false);
  assert(
    result.message.includes("archetype") || result.message.includes("Invalid"),
  );
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

Deno.test("convert instance mode without template workspace errors on simplified outputs", async () => {
  const templateJson = await convert(OPERATIONAL_TEMPLATE_ADL, {
    inputMode: "template",
    inputFormat: "json",
    inputDeserializerConfig: getJsonDeserializeConfigPreset("default"),
    outputFormats: ["json"],
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
  assertEquals(templateJson.success, true);

  const result = await convert(templateJson.outputs?.json ?? "", {
    inputMode: "instance",
    inputFormat: "json",
    inputDeserializerConfig: getJsonDeserializeConfigPreset("default"),
    outputFormats: ["flat"],
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

  assertEquals(result.success, false);
  assert(result.error?.includes("Template input tab"));
});

Deno.test("convert instance mode with loaded template workspace produces FLAT", async () => {
  const workspace = new ClinicalModelWorkspace();
  workspace.addFile("demo_generated.opt", OPERATIONAL_TEMPLATE_ADL);

  const jsonResult = await convert(OPERATIONAL_TEMPLATE_ADL, {
    inputMode: "template",
    inputFormat: "json",
    inputDeserializerConfig: getJsonDeserializeConfigPreset("default"),
    outputFormats: ["json"],
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
  assertEquals(jsonResult.success, true);

  const flatResult = await convert(jsonResult.outputs?.json ?? "", {
    inputMode: "instance",
    inputFormat: "json",
    inputDeserializerConfig: getJsonDeserializeConfigPreset("default"),
    outputFormats: ["flat"],
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
    templateWorkspace: workspace,
  });

  assertEquals(flatResult.success, true, flatResult.error);
  assert(JSON.parse(flatResult.outputs?.flat || "{}")["ctx/language"]);
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
  assert(result.outputs?.markdown?.includes("composer:"));
  assert(result.outputs?.asciidoc?.includes(":composer:"));
});

Deno.test("convert treats template-adgit like template when workspace is loaded", async () => {
  const workspace = new ClinicalModelWorkspace();
  workspace.addFile("demo_generated.opt", OPERATIONAL_TEMPLATE_ADL);

  const result = await convert("", {
    inputMode: "template-adgit",
    inputFormat: "json",
    inputDeserializerConfig: getJsonDeserializeConfigPreset("default"),
    outputFormats: ["json", "xml"],
    templateGenerationMode: "example",
    jsonSerializerType: "configurable",
    jsonConfig: getJsonConfigPreset("canonical"),
    yamlConfig: getYamlConfigPreset("default"),
    xmlConfig: {
      prettyPrint: true,
      indent: 2,
      includeDeclaration: false,
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
    templateWorkspace: workspace,
  });

  assertEquals(result.success, true);
  assert(result.outputs?.json?.includes("SECTION"));
  assert(result.outputs?.xml?.includes("SECTION"));
  assert(result.outputs?.xml?.includes('archetype_node_id="id2"'));
});

Deno.test("convert JSON instance to XML preserves accessor-backed id values", async () => {
  const result = await convert(
    JSON.stringify({
      _type: "COMPOSITION",
      archetype_details: {
        _type: "ARCHETYPED",
        archetype_id: {
          _type: "ARCHETYPE_ID",
          value: "openEHR-EHR-COMPOSITION.self_reported_data.v1",
        },
        template_id: {
          _type: "TEMPLATE_ID",
          value: "ChemoForm-MBA.v7",
        },
        rm_version: "1.1.0",
      },
    }),
    {
      inputMode: "instance",
      inputFormat: "json",
      inputDeserializerConfig: getJsonDeserializeConfigPreset("default"),
      outputFormats: ["xml"],
      templateGenerationMode: "minimal",
      jsonSerializerType: "configurable",
      jsonConfig: getJsonConfigPreset("canonical"),
      yamlConfig: getYamlConfigPreset("default"),
      xmlConfig: {
        prettyPrint: true,
        indent: 2,
        includeDeclaration: false,
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
    },
  );

  assertEquals(result.success, true, result.error);
  assert(
    result.outputs?.xml?.includes(
      "<value>openEHR-EHR-COMPOSITION.self_reported_data.v1</value>",
    ),
  );
  assert(result.outputs?.xml?.includes("<value>ChemoForm-MBA.v7</value>"));
  assert(result.outputs?.xml?.includes("<rm_version>1.1.0</rm_version>"));
});
