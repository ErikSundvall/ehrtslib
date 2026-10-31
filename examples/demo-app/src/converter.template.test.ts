import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.220.0/assert/mod.ts";
import { ClinicalModelWorkspace } from "../../../parser/mod.ts";
import {
  type ConversionOptions,
  convert,
  getAsciidocConfigPreset,
  getJsonConfigPreset,
  getJsonDeserializeConfigPreset,
  getMarkdownConfigPreset,
  getYamlConfigPreset,
  INPUT_DESERIALIZER_PRESETS,
  resolveInputDeserializerSettings,
  type SimplifiedInputSettings,
  validateTemplateInput,
  workspaceForConversion,
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
  // Output flavour (default): RM attributes at their paths, no ctx/.
  const flat = JSON.parse(result.outputs?.flat || "{}");
  assertEquals(Object.keys(flat).some((k) => k.startsWith("ctx/")), false);
  assert(Object.keys(flat).some((k) => k.endsWith("/language|code")));
  assert(JSON.parse(result.outputs?.webtemplate || "{}").templateId);
});

Deno.test("convert template input generates OPT XML with optional L10n annotations", async () => {
  const result = await convert(OPERATIONAL_TEMPLATE_ADL, {
    inputMode: "template",
    inputFormat: "json",
    inputDeserializerConfig: getJsonDeserializeConfigPreset("default"),
    outputFormats: ["opt.xml"],
    templateGenerationMode: "minimal",
    optXmlIncludeAnnotations: true,
    optXmlEmitL10n: true,
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
  assert(result.outputs?.["opt.xml"]?.includes("<template"));
  assert(result.outputs?.["opt.xml"]?.includes("demo_generated"));
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
    simplifiedFlavor: "input",
  });

  assertEquals(flatResult.success, true, flatResult.error);
  assert(JSON.parse(flatResult.outputs?.flat || "{}")["ctx/language"]);
});

Deno.test("convert FLAT input with template workspace deserializes to RM JSON", async () => {
  const workspace = new ClinicalModelWorkspace();
  workspace.addFile("demo_generated.opt", OPERATIONAL_TEMPLATE_ADL);

  const flatSource = await convert(OPERATIONAL_TEMPLATE_ADL, {
    inputMode: "template",
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
  assertEquals(flatSource.success, true, flatSource.error);

  const result = await convert(flatSource.outputs?.flat ?? "", {
    inputMode: "instance",
    inputFormat: "flat",
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
    templateWorkspace: workspace,
  });

  assertEquals(result.success, true, result.error);
  const json = JSON.parse(result.outputs?.json || "{}");
  assertEquals(json._type, "COMPOSITION");
});

Deno.test("convert FLAT input without template workspace fails with guidance", async () => {
  const workspace = new ClinicalModelWorkspace();
  workspace.addFile("demo_generated.opt", OPERATIONAL_TEMPLATE_ADL);

  const flatSource = await convert(OPERATIONAL_TEMPLATE_ADL, {
    inputMode: "template",
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
  assertEquals(flatSource.success, true);

  const result = await convert(flatSource.outputs?.flat ?? "", {
    inputMode: "instance",
    inputFormat: "flat",
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

  assertEquals(result.success, false);
  assert(result.error?.includes("Web Template"));
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

const MULTILINGUAL_TEMPLATE_ADL = `operational_template (adl_version=2.0.5)
    openEHR-EHR-COMPOSITION.demo_multilingual.v1.0.0

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
            ["id1"] = < text = <"English composition"> >
            ["id2"] = < text = <"English section"> >
        >
        ["sv"] = <
            ["id1"] = < text = <"Svensk komposition"> >
            ["id2"] = < text = <"Svensk sektion"> >
        >
    >`;

Deno.test("convert templateLanguage selects terminology language for generated names", async () => {
  const enResult = await convert(MULTILINGUAL_TEMPLATE_ADL, {
    inputMode: "template",
    inputFormat: "json",
    inputDeserializerConfig: getJsonDeserializeConfigPreset("default"),
    outputFormats: ["json"],
    templateGenerationMode: "minimal",
    templateLanguage: "en",
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
  const svResult = await convert(MULTILINGUAL_TEMPLATE_ADL, {
    inputMode: "template",
    inputFormat: "json",
    inputDeserializerConfig: getJsonDeserializeConfigPreset("default"),
    outputFormats: ["json"],
    templateGenerationMode: "minimal",
    templateLanguage: "sv",
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

  assertEquals(enResult.success, true, enResult.error);
  assertEquals(svResult.success, true, svResult.error);

  const enJson = JSON.parse(enResult.outputs?.json || "{}");
  const svJson = JSON.parse(svResult.outputs?.json || "{}");
  assertEquals(enJson.name?.value, "English composition");
  assertEquals(svJson.name?.value, "Svensk komposition");
  assert(enJson.name?.value !== svJson.name?.value);
});

const WEB_TEMPLATE_ONLY_JSON = JSON.stringify({
  templateId: "accident_report_including_vital_signs",
  defaultLanguage: "en",
  tree: { id: "root", name: "Accident report", children: [] },
});

function convertTestOptions(
  overrides:
    & Partial<ConversionOptions>
    & Pick<ConversionOptions, "inputMode" | "outputFormats">,
): ConversionOptions {
  return {
    inputFormat: "json",
    inputDeserializerConfig: getJsonDeserializeConfigPreset("default"),
    templateGenerationMode: "example",
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
    ...overrides,
  };
}

Deno.test("workspaceForConversion uses clinical file set for template and AD@git modes", () => {
  const clinical = new ClinicalModelWorkspace();
  clinical.addFile("lung.opt", OPERATIONAL_TEMPLATE_ADL);
  const simplified = new ClinicalModelWorkspace();
  simplified.addFile("accident.wt.json", WEB_TEMPLATE_ONLY_JSON);

  const templateWs = workspaceForConversion("template", clinical, simplified);
  assertEquals(templateWs.listFiles()[0]?.path, "lung.opt");

  const adgitWs = workspaceForConversion(
    "template-adgit",
    clinical,
    simplified,
  );
  assertEquals(adgitWs.listFiles()[0]?.path, "lung.opt");

  const instanceWs = workspaceForConversion("instance", clinical, simplified);
  assertEquals(instanceWs.listFiles()[0]?.path, "accident.wt.json");
});

Deno.test("convert template input ignores a Web Template-only workspace and uses the OPT text", async () => {
  const wtOnly = new ClinicalModelWorkspace();
  wtOnly.addFile("accident.wt.json", WEB_TEMPLATE_ONLY_JSON);

  const result = await convert(
    OPERATIONAL_TEMPLATE_ADL,
    convertTestOptions({
      inputMode: "template",
      outputFormats: ["json"],
      templateWorkspace: wtOnly,
    }),
  );

  assertEquals(result.success, true, result.error);
  const generated = JSON.parse(result.outputs?.json || "{}");
  assertEquals(generated._type, "COMPOSITION");
  assertEquals(generated.name?.value, "Demo composition");
});

Deno.test("convert template-adgit with clinical workspace is not shadowed by a Web Template file set", async () => {
  const clinical = new ClinicalModelWorkspace();
  clinical.addFile("lung.opt", OPERATIONAL_TEMPLATE_ADL);
  const simplified = new ClinicalModelWorkspace();
  simplified.addFile("accident.wt.json", WEB_TEMPLATE_ONLY_JSON);

  const result = await convert(
    "",
    convertTestOptions({
      inputMode: "template-adgit",
      outputFormats: ["json"],
      templateWorkspace: workspaceForConversion(
        "template-adgit",
        clinical,
        simplified,
      ),
    }),
  );

  assertEquals(result.success, true, result.error);
  const generated = JSON.parse(result.outputs?.json || "{}");
  assertEquals(generated._type, "COMPOSITION");
  assertEquals(generated.name?.value, "Demo composition");
});

const SHARED_SYMPTOM_ARCHETYPE = "openEHR-EHR-CLUSTER.symptom_sign.v1";

function symptomQuestionTemplate(
  templateId: string,
  labels: {
    enConcept: string;
    enQuestion: string;
    svConcept: string;
    svQuestion: string;
  },
): string {
  return JSON.stringify({
    "@type": "TEMPLATE",
    templateId,
    archetypeId: { "@type": "ARCHETYPE_HRID", value: SHARED_SYMPTOM_ARCHETYPE },
    definition: {
      "@type": "C_COMPLEX_OBJECT",
      rmTypeName: "CLUSTER",
      nodeId: "at0000.1",
      attributes: [{
        "@type": "C_ATTRIBUTE",
        rmAttributeName: "items",
        children: [{
          "@type": "C_COMPLEX_OBJECT",
          rmTypeName: "ELEMENT",
          nodeId: "at0005.1",
        }],
      }],
    },
    terminology: {
      "@type": "ARCHETYPE_TERMINOLOGY",
      termDefinitions: {
        en: {
          "at0000.1": { text: labels.enConcept },
          "at0005.1": { text: labels.enQuestion },
        },
        sv: {
          "at0000.1": { text: labels.svConcept },
          "at0005.1": { text: labels.svQuestion },
        },
      },
    },
  });
}

Deno.test("demo names nested Better templates that share an archetype id", async () => {
  const workspace = new ClinicalModelWorkspace();
  workspace.addFile(
    "ChemoForm-MBA.v8.t.json",
    JSON.stringify({
      "@type": "TEMPLATE",
      templateId: "ChemoForm-MBA.v8",
      archetypeId: {
        "@type": "ARCHETYPE_HRID",
        value: "openEHR-EHR-COMPOSITION.t_self_reported_data.v1",
      },
      definition: {
        "@type": "C_COMPLEX_OBJECT",
        rmTypeName: "COMPOSITION",
        nodeId: "at0000",
        attributes: [{
          "@type": "C_ATTRIBUTE",
          rmAttributeName: "content",
          children: [
            {
              "@type": "C_ARCHETYPE_ROOT",
              rmTypeName: "CLUSTER",
              nodeId: "at0039.1",
              archetypeRef: "ChemoQ-fatigue",
              referenceType: "templateId",
            },
            {
              "@type": "C_ARCHETYPE_ROOT",
              rmTypeName: "CLUSTER",
              nodeId: "at0039.2",
              archetypeRef: "ChemoQ-weight",
              referenceType: "templateId",
            },
          ],
        }],
      },
    }),
  );
  workspace.addFile(
    "ChemoQ-fatigue.t.json",
    symptomQuestionTemplate("ChemoQ-fatigue", {
      enConcept: "Fatigue",
      enQuestion: "Do you experience fatigue that affects your daily life?",
      svConcept: "Trötthet",
      svQuestion: "Upplever du trötthet som påverkar ditt dagliga liv?",
    }),
  );
  workspace.addFile(
    "ChemoQ-weight.t.json",
    symptomQuestionTemplate("ChemoQ-weight", {
      enConcept: "Weight",
      enQuestion: "Have your weight changed in recent weeks?",
      svConcept: "Vikt",
      svQuestion: "Har din vikt förändrats de senaste veckorna?",
    }),
  );

  const validation = validateTemplateInput("", workspace);
  assertEquals(validation.valid, true);
  assert(validation.message.includes("ChemoForm-MBA.v8"));
  assert(
    validation.message.includes(
      "openEHR-EHR-COMPOSITION.t_self_reported_data.v1",
    ),
  );

  const english = await convert(
    "",
    convertTestOptions({
      inputMode: "template",
      outputFormats: ["webtemplate"],
      templateLanguage: "en",
      templateWorkspace: workspace,
    }),
  );
  assertEquals(english.success, true, english.error);
  const webTemplate = JSON.parse(english.outputs?.webtemplate || "{}");
  assertEquals(webTemplate.templateId, "ChemoForm-MBA.v8");
  const englishText = JSON.stringify(webTemplate);
  assert(englishText.includes('"Fatigue"'));
  assert(englishText.includes(
    "Do you experience fatigue that affects your daily life?",
  ));
  assert(englishText.includes('"Weight"'));
  assert(englishText.includes("Have your weight changed in recent weeks?"));

  const swedish = await convert(
    "",
    convertTestOptions({
      inputMode: "template",
      outputFormats: ["webtemplate"],
      templateLanguage: "sv",
      templateWorkspace: workspace,
    }),
  );
  assertEquals(swedish.success, true, swedish.error);
  const swedishText = swedish.outputs?.webtemplate || "";
  assert(swedishText.includes("Trötthet"));
  assert(swedishText.includes(
    "Upplever du trötthet som påverkar ditt dagliga liv?",
  ));
  assert(swedishText.includes("Vikt"));
  assert(swedishText.includes("Har din vikt förändrats de senaste veckorna?"));
  assert(!swedishText.includes("Do you experience fatigue"));
});

// --- Deserializer settings (#237) ---------------------------------------

Deno.test("deserializer presets differ and set codedTextMismatch", () => {
  const { default: def, compact, canonical, hybrid } =
    INPUT_DESERIALIZER_PRESETS;
  assert(JSON.stringify(def) !== JSON.stringify(compact));
  assertEquals(canonical.checks.strict, true);
  assertEquals(canonical.simplified.codedTextMismatch, "reject");
  assertEquals(def.simplified.codedTextMismatch, "reject");
  assertEquals(compact.simplified.codedTextMismatch, "correct");
  assertEquals(hybrid.simplified.codedTextMismatch, "keep");
  for (const preset of Object.values(INPUT_DESERIALIZER_PRESETS)) {
    assert(preset.description.length > 0);
  }
  const compactConfig = resolveInputDeserializerSettings("compact")
    .deserializerConfig;
  assertEquals(compactConfig.parseTerseFormat, true);
});

Deno.test("Custom preset applies its checkboxes and selects", () => {
  const custom = {
    checks: { strict: true, parseTerseFormat: true, allowIncomplete: true },
    simplified: {
      codedTextMismatch: "keep",
      codedTextDisplayValue: "keep-and-set-preferred-term",
      contextDefaults: "none",
      unknownKeys: "ignore",
    } as SimplifiedInputSettings,
  };
  const resolved = resolveInputDeserializerSettings("custom", custom);
  assertEquals(resolved.deserializerConfig.strict, true);
  assertEquals(resolved.deserializerConfig.parseTerseFormat, true);
  assertEquals(resolved.deserializerConfig.allowIncomplete, true);
  assertEquals(resolved.simplifiedInput, custom.simplified);

  // A named preset ignores the custom values.
  const named = resolveInputDeserializerSettings("default", custom);
  assertEquals(named.deserializerConfig.strict, false);
  assertEquals(named.simplifiedInput.codedTextMismatch, "reject");
});

const BP_OPT_URL = new URL(
  "../../../test_data/opt14/ehrbase_blood_pressure_simple.de.v0.opt",
  import.meta.url,
);
const BP_OBS =
  "encounter_training_sample/blood_pressure_training_sample:0";

function flatInputOptions(
  workspace: ClinicalModelWorkspace,
  simplifiedInput: SimplifiedInputSettings,
): ConversionOptions {
  return {
    inputMode: "instance",
    inputFormat: "flat",
    inputDeserializerConfig: getJsonDeserializeConfigPreset("default"),
    simplifiedInput,
    outputFormats: ["json"],
    templateGenerationMode: "minimal",
    jsonSerializerType: "configurable",
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
      archetypeNodeIdLocation: "after_name",
    },
    templateWorkspace: workspace,
  };
}

async function bpWorkspace(): Promise<ClinicalModelWorkspace> {
  const workspace = new ClinicalModelWorkspace();
  workspace.addFile(
    "ehrbase_blood_pressure_simple.de.v0.opt",
    await Deno.readTextFile(BP_OPT_URL),
  );
  return workspace;
}

const BP_FLAT = {
  "ctx/language": "de",
  "ctx/territory": "DE",
  "ctx/composer_name": "Erik Test",
  "ctx/time": "2026-10-30T10:00:00+01:00",
  [`${BP_OBS}/systolic|magnitude`]: 120,
  [`${BP_OBS}/systolic|unit`]: "mm[Hg]",
};

Deno.test("FLAT input passes codedTextMismatch through to the deserializer", async () => {
  const workspace = await bpWorkspace();
  // Case-only mismatch: the template rubric is "Sitting".
  const input = JSON.stringify({
    ...BP_FLAT,
    [`${BP_OBS}/position|value`]: "sitting",
  });

  const rejected = await convert(
    input,
    flatInputOptions(workspace, { codedTextMismatch: "reject" }),
  );
  assertEquals(rejected.success, false);
  assert(rejected.error?.startsWith("Coded text mismatch (1):"), rejected.error);
  assert(rejected.error?.includes('"sitting"'), rejected.error);

  const kept = await convert(
    input,
    flatInputOptions(workspace, { codedTextMismatch: "keep" }),
  );
  assertEquals(kept.success, true, kept.error);
  assert(kept.outputs?.json?.includes('"sitting"'));
  assert(
    kept.inputIssues?.some((i) =>
      i.kind === "coded-text-mismatch" && i.severity === "warning"
    ),
  );

  const corrected = await convert(
    input,
    flatInputOptions(workspace, { codedTextMismatch: "correct" }),
  );
  assertEquals(corrected.success, true, corrected.error);
  assert(corrected.outputs?.json?.includes('"Sitting"'));
});

Deno.test("FLAT input passes unknownKeys and contextDefaults through", async () => {
  const workspace = await bpWorkspace();
  const input = JSON.stringify({ ...BP_FLAT, [`${BP_OBS}/no_such_node`]: 1 });

  const failed = await convert(
    input,
    flatInputOptions(workspace, { unknownKeys: "error" }),
  );
  assertEquals(failed.success, false);
  assert(failed.error?.startsWith("Unknown FLAT keys (1):"), failed.error);

  const warned = await convert(
    input,
    flatInputOptions(workspace, { unknownKeys: "warning" }),
  );
  assertEquals(warned.success, true, warned.error);
  assert(warned.inputIssues?.some((i) => i.kind === "unknown-key"));

  const noDefaults = await convert(
    JSON.stringify(BP_FLAT),
    flatInputOptions(workspace, { contextDefaults: "none" }),
  );
  assertEquals(noDefaults.success, true, noDefaults.error);
  assert(noDefaults.inputIssues?.some((i) => i.kind === "missing-mandatory"));
});

Deno.test("Auto detect recognises output-flavour FLAT and STRUCTURED", async () => {
  const { resolveInputFormat } = await import("./converter.ts");
  const flat = JSON.stringify({
    [`${BP_OBS}/systolic|magnitude`]: 120,
    "encounter_training_sample/context/start_time": "2026-10-30T10:00:00Z",
  });
  assertEquals(resolveInputFormat(flat, "auto").format, "flat");
  const pathsOnly = JSON.stringify({
    "encounter_training_sample/context/start_time": "2026-10-30T10:00:00Z",
  });
  assertEquals(resolveInputFormat(pathsOnly, "auto").format, "flat");
  const structured = JSON.stringify({
    encounter_training_sample: {
      blood_pressure_training_sample: [{
        systolic: [{ "|magnitude": 120, "|unit": "mm[Hg]" }],
      }],
    },
  });
  assertEquals(resolveInputFormat(structured, "auto").format, "structured");
  assertEquals(
    resolveInputFormat('{"_type":"DV_TEXT","value":"x"}', "auto").format,
    "json",
  );
});
