/**
 * Converter Module
 *
 * Handles conversion between different openEHR formats using ehrtslib serialization modules.
 */

import {
  CANONICAL_JSON_CONFIG,
  CANONICAL_JSON_DESERIALIZE_CONFIG,
  COMPACT_JSON_CONFIG,
  COMPACT_JSON_DESERIALIZE_CONFIG,
  DEFAULT_JSON_DESERIALIZATION_CONFIG,
  DEFAULT_JSON_SERIALIZATION_CONFIG,
  HYBRID_JSON_CONFIG,
  HYBRID_JSON_DESERIALIZE_CONFIG,
  JsonCanonicalDeserializer,
  JsonCanonicalSerializer,
  JsonConfigurableDeserializer,
  JsonConfigurableSerializer,
  type JsonDeserializationConfig,
  type JsonSerializationConfig,
  NON_STANDARD_VERY_COMPACT_JSON_CONFIG,
  NON_STANDARD_VERY_COMPACT_JSON_DESERIALIZE_CONFIG,
} from "../../../enhanced/serialization/json/mod.ts";

import {
  BLOCK_YAML_CONFIG,
  DEFAULT_YAML_DESERIALIZATION_CONFIG,
  DEFAULT_YAML_SERIALIZATION_CONFIG,
  FLOW_YAML_CONFIG,
  HYBRID_YAML_CONFIG,
  VERBOSE_YAML_CONFIG,
  type YamlDeserializationConfig,
  YamlDeserializer,
  type YamlSerializationConfig,
  YamlSerializer,
} from "../../../enhanced/serialization/yaml/mod.ts";

import {
  XmlDeserializer,
  XmlSerializer,
} from "../../../enhanced/serialization/xml/mod.ts";

import {
  CLINICAL_MARKDOWN_CONFIG,
  COMPACT_MARKDOWN_CONFIG,
  DEFAULT_MARKDOWN_SERIALIZATION_CONFIG,
  type MarkdownSerializationConfig,
  MarkdownSerializer,
  STRUCTURAL_MARKDOWN_CONFIG,
  WIKILINK_MARKDOWN_CONFIG,
} from "../../../enhanced/serialization/markdown/mod.ts";

import {
  type AsciidocSerializationConfig,
  AsciidocSerializer,
  COMPACT_ASCIIDOC_CONFIG,
  DEFAULT_ASCIIDOC_SERIALIZATION_CONFIG,
  LOSSLESS_ASCIIDOC_CONFIG,
} from "../../../enhanced/serialization/asciidoc/mod.ts";

import {
  type TypeScriptConstructorSerializationConfig,
  TypeScriptConstructorSerializer,
} from "../../../enhanced/serialization/typescript/mod.ts";

import {
  buildWebTemplate,
  serializeToFlatJson,
  serializeToStructuredJson,
} from "../../../enhanced/serialization/simplified/mod.ts";
import {
  getOperationalTemplateFromInput,
  parseTemplateInput,
  type TemplateWorkspace,
  type ClinicalModelWorkspace,
} from "../../../enhanced/parser/mod.ts";
import {
  type GenerationMode,
  RMInstanceGenerator,
  TypeScriptGenerator,
} from "../../../enhanced/generation/mod.ts";

import {
  DeserializationError,
  SerializationError,
  TypeRegistry,
} from "../../../enhanced/serialization/common/mod.ts";

// Import RM and Base modules for type registration
import * as openehr_rm from "../../../enhanced/openehr_rm.ts";
import * as openehr_base from "../../../enhanced/openehr_base.ts";

// Global flag to track if TypeRegistry is initialized
let typeRegistryInitialized = false;

/**
 * Initialize the TypeRegistry with all RM types
 */
export function initializeTypeRegistry() {
  if (typeRegistryInitialized) {
    return;
  }

  try {
    // Register RM types
    TypeRegistry.registerModule(openehr_rm);

    // Register BASE types
    TypeRegistry.registerModule(openehr_base);

    typeRegistryInitialized = true;
    console.log(
      "✓ TypeRegistry initialized with",
      TypeRegistry.getAllTypeNames().length,
      "types",
    );
  } catch (error) {
    console.error("Failed to initialize TypeRegistry:", error);
    throw error;
  }
}

/**
 * Input format types
 */
export type InputFormat = "xml" | "json" | "yaml";
export type InputMode = "instance" | "template" | "template-adgit";
export type TemplateGenerationMode = GenerationMode;

/**
 * Output format types
 */
export type OutputFormat =
  | "xml"
  | "json"
  | "yaml"
  | "markdown"
  | "asciidoc"
  | "typescript"
  | "flat"
  | "structured"
  | "webtemplate";

/**
 * Conversion options
 */
export interface ConversionOptions {
  inputMode: InputMode;
  inputFormat: InputFormat;
  inputDeserializerConfig:
    | JsonDeserializationConfig
    | YamlDeserializationConfig;
  outputFormats: OutputFormat[];
  templateGenerationMode: TemplateGenerationMode;
  jsonSerializerType: "canonical" | "configurable";
  jsonConfig: JsonSerializationConfig;
  yamlConfig: YamlSerializationConfig;
  markdownConfig: MarkdownSerializationConfig;
  asciidocConfig: AsciidocSerializationConfig;
  xmlConfig: {
    prettyPrint: boolean;
    indent: number;
    includeDeclaration: boolean;
    includeNamespaces: boolean;
  };
  typescriptConfig: TypeScriptConstructorSerializationConfig;
  /** Loaded template/archetype file set (ADL2, OPT/OET, `.t.json`). */
  templateWorkspace?: TemplateWorkspace | ClinicalModelWorkspace;
}

/**
 * Conversion result
 */
export interface ConversionResult {
  success: boolean;
  outputs?: {
    xml?: string;
    json?: string;
    yaml?: string;
    markdown?: string;
    asciidoc?: string;
    typescript?: string;
    flat?: string;
    structured?: string;
    webtemplate?: string;
  };
  error?: string;
  errorDetails?: any;
}

/**
 * Convert input data to requested output formats
 */
export async function convert(
  input: string,
  options: ConversionOptions,
): Promise<ConversionResult> {
  // Initialize TypeRegistry if not done yet
  if (!typeRegistryInitialized) {
    initializeTypeRegistry();
  }

  try {
    if (options.inputMode === "template") {
      return convertTemplateInput(input, options);
    }

    // Step 1: Deserialize input to RM object
    const rmObject = await deserializeInput(
      input,
      options.inputFormat,
      options.inputDeserializerConfig,
    );

    // Step 2: Serialize to requested output formats
    const outputs: Record<string, string> = {};

    for (const format of options.outputFormats) {
      try {
        switch (format) {
          case "xml":
            outputs.xml = serializeToXml(rmObject, options.xmlConfig);
            break;
          case "json":
            outputs.json = serializeToJson(
              rmObject,
              options.jsonSerializerType,
              options.jsonConfig,
            );
            break;
          case "yaml":
            outputs.yaml = serializeToYaml(rmObject, options.yamlConfig);
            break;
          case "markdown":
            outputs.markdown = serializeToMarkdown(
              rmObject,
              options.markdownConfig,
            );
            break;
          case "asciidoc":
            outputs.asciidoc = serializeToAsciidoc(
              rmObject,
              options.asciidocConfig,
            );
            break;
          case "typescript":
            outputs.typescript = generateTypeScriptCode(
              rmObject,
              options.typescriptConfig,
            );
            break;
        }
      } catch (error) {
        console.error(`Failed to serialize to ${format}:`, error);
        throw new Error(
          `Failed to convert to ${format}: ${(error as Error).message}`,
        );
      }
    }

    return {
      success: true,
      outputs,
    };
  } catch (error) {
    console.error("Conversion error:", error);
    return {
      success: false,
      error: (error as Error).message,
      errorDetails: error,
    };
  }
}

function convertTemplateInput(
  input: string,
  options: ConversionOptions,
): ConversionResult {
  let template;
  try {
    if (options.templateWorkspace?.listFiles().length) {
      template = options.templateWorkspace.resolveOperational().operationalTemplate;
    } else {
      template = getOperationalTemplateFromInput(input, {
        archetypeRepository: options.templateWorkspace?.repository,
      });
    }
  } catch (firstError) {
    const parsed = parseTemplateInput(input, {
      archetypeRepository: options.templateWorkspace?.repository,
    });
    if (parsed.kind === "oet_document") {
      throw new Error(
        "OET template loaded but requires referenced archetypes to compile. " +
          `Base archetype: ${
            parsed.oet?.document.definitionArchetypeId ?? "unknown"
          }. ` +
          "Upload archetype .adl files or a ZIP containing the full file set. " +
          (firstError as Error).message,
      );
    }
    throw firstError;
  }

  const generator = new RMInstanceGenerator({
    mode: options.templateGenerationMode,
  });

  const generatedInstance = generator.generate(template);
  const webTemplate = buildWebTemplate(template);
  const outputs: Record<string, string> = {};

  for (const format of options.outputFormats) {
    switch (format) {
      case "xml":
        outputs.xml = serializeToXml(generatedInstance, options.xmlConfig);
        break;
      case "json":
        outputs.json = serializeToJson(
          generatedInstance,
          options.jsonSerializerType,
          options.jsonConfig,
        );
        break;
      case "yaml":
        outputs.yaml = serializeToYaml(generatedInstance, options.yamlConfig);
        break;
      case "markdown":
        outputs.markdown = serializeToMarkdown(
          generatedInstance,
          options.markdownConfig,
        );
        break;
      case "asciidoc":
        outputs.asciidoc = serializeToAsciidoc(
          generatedInstance,
          options.asciidocConfig,
        );
        break;
      case "typescript": {
        const tsGenerator = new TypeScriptGenerator({ language: "en" });
        outputs.typescript = tsGenerator.generate(template);
        break;
      }
      case "flat":
        outputs.flat = serializeToFlatJson(generatedInstance, webTemplate, {
          prettyPrint: true,
        });
        break;
      case "structured":
        outputs.structured = serializeToStructuredJson(
          generatedInstance,
          webTemplate,
          { prettyPrint: true },
        );
        break;
      case "webtemplate":
        outputs.webtemplate = JSON.stringify(webTemplate, null, 2);
        break;
    }
  }

  return { success: true, outputs };
}

export function validateTemplateInput(
  input: string,
  workspace?: TemplateWorkspace | ClinicalModelWorkspace,
): { valid: boolean; message: string } {
  const text = input.trim();
  if (!text && !workspace?.listFiles().length) {
    return { valid: false, message: "Empty template" };
  }

  try {
    if (workspace?.listFiles().length) {
      const resolved = workspace.resolveOperational();
      const id = resolved.operationalTemplate.archetype_id?.value ??
        "operational template";
      const kind = resolved.sourceKind;
      const fileCount = workspace.listFiles().length;
      const archCount = workspace.repository.listIds().length;
      const rootPath = workspace.getGenerationRootPath();
      const root = rootPath?.split("/").pop() ?? "?";
      const rootFile = rootPath ? workspace.getFile(rootPath) : undefined;
      const fmt = formatLabelForLoadKind(rootFile?.loadResult?.kind, kind);
      return {
        valid: true,
        message:
          `Valid ${fmt}: ${id} (root: ${root}, ${fileCount} files, ${archCount} archetypes)`,
      };
    }

    const parsed = parseTemplateInput(text, {
      archetypeRepository: workspace?.repository,
    });
    if (parsed.kind === "operational_template" && parsed.operationalTemplate) {
      const id = parsed.operationalTemplate.archetype_id?.value ??
        "operational template";
      const fmt = formatLabelForFormat(parsed.format);
      return { valid: true, message: `Valid ${fmt}: ${id}` };
    }
    if (parsed.kind === "oet_document" && parsed.oet) {
      const id = parsed.oet.document.definitionArchetypeId ??
        parsed.oet.document.name;
      return { valid: true, message: `Valid OET (needs archetypes): ${id}` };
    }
    if (parsed.kind === "template") {
      const fmt = formatLabelForFormat(parsed.format);
      return {
        valid: true,
        message: `Valid ${fmt} (flatten to operational for instances)`,
      };
    }
    return {
      valid: false,
      message: `Unsupported template kind: ${parsed.kind}`,
    };
  } catch (error) {
    return {
      valid: false,
      message: `Invalid template: ${(error as Error).message}`,
    };
  }
}

/**
 * Deserialize input based on format
 */
async function deserializeInput(
  input: string,
  format: InputFormat,
  config: JsonDeserializationConfig | YamlDeserializationConfig,
): Promise<any> {
  switch (format) {
    case "json": {
      const deserializer = new JsonConfigurableDeserializer(
        config as JsonDeserializationConfig,
      );
      return deserializer.deserialize(input);
    }
    case "yaml": {
      const deserializer = new YamlDeserializer(
        config as YamlDeserializationConfig,
      );
      return deserializer.deserialize(input);
    }
    case "xml": {
      const deserializer = new XmlDeserializer();
      return deserializer.deserialize(input);
    }
    default:
      throw new Error(`Unsupported input format: ${format}`);
  }
}

/**
 * Serialize RM object to JSON
 */
function serializeToJson(
  obj: any,
  serializerType: "canonical" | "configurable",
  config: JsonSerializationConfig,
): string {
  if (serializerType === "canonical") {
    const serializer = new JsonCanonicalSerializer();
    return serializer.serialize(obj, {
      prettyPrint: config.prettyPrint,
      indent: config.indent,
      archetypeNodeIdLocation: config.archetypeNodeIdLocation,
    });
  } else {
    const serializer = new JsonConfigurableSerializer(config);
    return serializer.serialize(obj);
  }
}

/**
 * Serialize RM object to YAML
 */
function serializeToYaml(obj: any, config: YamlSerializationConfig): string {
  const serializer = new YamlSerializer(config);
  return serializer.serialize(obj);
}

/**
 * Serialize RM object to Markdown
 */
function serializeToMarkdown(
  obj: any,
  config: MarkdownSerializationConfig,
): string {
  const serializer = new MarkdownSerializer(config);
  return serializer.serialize(obj);
}

/**
 * Serialize RM object to AsciiDoc
 */
function serializeToAsciidoc(
  obj: any,
  config: AsciidocSerializationConfig,
): string {
  const serializer = new AsciidocSerializer(config);
  return serializer.serialize(obj);
}

/**
 * Serialize RM object to XML
 */
function serializeToXml(
  obj: any,
  config: {
    prettyPrint: boolean;
    indent: number;
    includeDeclaration: boolean;
    includeNamespaces: boolean;
  },
): string {
  const serializer = new XmlSerializer({
    prettyPrint: config.prettyPrint,
    indent: " ".repeat(config.indent), // Convert number to string of spaces
    includeDeclaration: config.includeDeclaration,
    useNamespaces: config.includeNamespaces,
  });
  return serializer.serialize(obj);
}

/**
 * Generate TypeScript initialization code
 */
function generateTypeScriptCode(
  obj: any,
  config: TypeScriptConstructorSerializationConfig,
): string {
  const serializer = new TypeScriptConstructorSerializer(config);
  return serializer.serialize(obj);
}

/**
 * Get configuration presets
 */
export function getJsonConfigPreset(preset: string): JsonSerializationConfig {
  switch (preset) {
    case "canonical":
      return { ...CANONICAL_JSON_CONFIG };
    case "compact":
      return { ...COMPACT_JSON_CONFIG };
    case "hybrid":
      return { ...HYBRID_JSON_CONFIG };
    case "very-compact":
      return { ...NON_STANDARD_VERY_COMPACT_JSON_CONFIG };
    default:
      return { ...DEFAULT_JSON_SERIALIZATION_CONFIG };
  }
}

export function getJsonDeserializeConfigPreset(
  preset: string,
): JsonDeserializationConfig {
  switch (preset) {
    case "canonical":
      return { ...CANONICAL_JSON_DESERIALIZE_CONFIG };
    case "compact":
      return { ...COMPACT_JSON_DESERIALIZE_CONFIG };
    case "hybrid":
      return { ...HYBRID_JSON_DESERIALIZE_CONFIG };
    default:
      return { ...DEFAULT_JSON_DESERIALIZATION_CONFIG };
  }
}

export function getYamlConfigPreset(preset: string): YamlSerializationConfig {
  switch (preset) {
    case "verbose":
      return { ...VERBOSE_YAML_CONFIG };
    case "hybrid":
      return { ...HYBRID_YAML_CONFIG };
    case "flow":
      return { ...FLOW_YAML_CONFIG };
    case "block":
      return { ...BLOCK_YAML_CONFIG };
    default:
      return { ...DEFAULT_YAML_SERIALIZATION_CONFIG };
  }
}

export function getYamlDeserializeConfigPreset(
  preset: string,
): YamlDeserializationConfig {
  // For now, use default for all presets
  return { ...DEFAULT_YAML_DESERIALIZATION_CONFIG };
}

export function getMarkdownConfigPreset(
  preset: string,
): MarkdownSerializationConfig {
  switch (preset) {
    case "clinical":
      return { ...CLINICAL_MARKDOWN_CONFIG };
    case "compact":
      return { ...COMPACT_MARKDOWN_CONFIG };
    case "wikilink":
      return { ...WIKILINK_MARKDOWN_CONFIG };
    case "structural":
    default:
      return {
        ...DEFAULT_MARKDOWN_SERIALIZATION_CONFIG,
        ...STRUCTURAL_MARKDOWN_CONFIG,
      };
  }
}

export function getAsciidocConfigPreset(
  preset: string,
): AsciidocSerializationConfig {
  switch (preset) {
    case "compact":
      return { ...COMPACT_ASCIIDOC_CONFIG };
    case "lossless":
    default:
      return {
        ...DEFAULT_ASCIIDOC_SERIALIZATION_CONFIG,
        ...LOSSLESS_ASCIIDOC_CONFIG,
      };
  }
}
