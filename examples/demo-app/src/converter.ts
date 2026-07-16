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
  deserializeFromFlat,
  deserializeFromStructured,
  isWebTemplateJson,
  parseWebTemplate,
  serializeToFlatJson,
  serializeToStructuredJson,
  type WebTemplate,
} from "../../../enhanced/serialization/simplified/mod.ts";
import {
  type ClinicalModelWorkspace,
  getOperationalTemplateFromInput,
  parseTemplateInput,
  type TemplateWorkspace,
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

import {
  detectInputFormat,
  serializeToHtml5Variant,
  serializeToJZipehr,
  serializeToXZipehr,
  serializeToYZipehr,
  zipehrTextToCanonical,
} from "../../../enhanced/serialization/zipehr/mod.ts";

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
export type InputFormat =
  | "auto"
  | "xml"
  | "json"
  | "yaml"
  | "zipehr"
  | "flat"
  | "structured";

/** Shown when FLAT/STRUCTURED (de)serialization needs a schema that is not loaded. */
export const MISSING_WEB_TEMPLATE_ERROR =
  "FLAT/STRUCTURED conversion requires a Web Template. Upload an operational template " +
  "(.opt, .oet, .adl, .adls, .zip, .t.json) or a Web Template JSON file using the " +
  "template upload control in the input panel (when using FLAT/STRUCTURED input) or " +
  "the Simplified output tab, or load a template on the Template input tab.";
export type InputMode = "instance" | "template" | "template-adgit";
export type TemplateGenerationMode = GenerationMode;

/**
 * Output format types
 */
export type OutputFormat =
  | "xml"
  | "json"
  | "yaml"
  | "zipehr.json"
  | "zipehr.yaml"
  | "zipehr.xhtml"
  | "zipehr.html5.short"
  | "zipehr.html5.full"
  | "zipehr.html5.emoji"
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
  /** ZipEHR symbols for `zipehr.json` / `zipehr.yaml`, and for `zipehr.xhtml` title codes. */
  zipehrSymbolVariant?: "emoji" | "lettercode";
  /** ZipEHR HTML5 layout: oneliner | linesaving | fluffy. */
  zipehrHtml5Layout?: "oneliner" | "linesaving" | "fluffy";
  /**
   * How (X)HTML formats emit RM property names (`context`, `start_time`, …).
   * Default: omit when possible.
   */
  zipehrPropertyMode?: "omit" | "attribute" | "comment";
  templateGenerationMode: TemplateGenerationMode;
  templateLanguage?: string;
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
    "zipehr.json"?: string;
    "zipehr.yaml"?: string;
    "zipehr.xhtml"?: string;
    "zipehr.html5.short"?: string;
    "zipehr.html5.full"?: string;
    "zipehr.html5.emoji"?: string;
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

const SIMPLIFIED_OUTPUT_FORMATS = new Set<OutputFormat>([
  "flat",
  "structured",
  "webtemplate",
]);

function writeSimplifiedOutputs(
  instance: unknown,
  webTemplate: WebTemplate,
  outputFormats: OutputFormat[],
  outputs: Record<string, string>,
): void {
  for (const format of outputFormats) {
    switch (format) {
      case "flat":
        outputs.flat = serializeToFlatJson(instance, webTemplate, {
          prettyPrint: true,
        });
        break;
      case "structured":
        outputs.structured = serializeToStructuredJson(instance, webTemplate, {
          prettyPrint: true,
        });
        break;
      case "webtemplate":
        outputs.webtemplate = JSON.stringify(webTemplate, null, 2);
        break;
    }
  }
}

/** Resolve a Web Template from the workspace (JSON file or OPT-derived). */
export function resolveWebTemplate(
  options: ConversionOptions,
): WebTemplate {
  const ws = options.templateWorkspace;
  if (!ws?.listFiles().length) {
    throw new Error(MISSING_WEB_TEMPLATE_ERROR);
  }

  for (const file of ws.listFiles()) {
    if (!file.path.toLowerCase().endsWith(".json")) continue;
    try {
      const parsed = JSON.parse(file.content);
      if (isWebTemplateJson(parsed)) {
        return parseWebTemplate(parsed);
      }
    } catch {
      // not a web template JSON file
    }
  }

  try {
    const { operationalTemplate } = ws.resolveOperational();
    return buildWebTemplate(operationalTemplate);
  } catch (error) {
    throw new Error(
      `${MISSING_WEB_TEMPLATE_ERROR} (${
        error instanceof Error ? error.message : String(error)
      })`,
    );
  }
}

function resolveOperationalTemplate(
  input: string,
  options: ConversionOptions,
): unknown {
  if (options.templateWorkspace?.listFiles().length) {
    return options.templateWorkspace.resolveOperational().operationalTemplate;
  }

  try {
    return getOperationalTemplateFromInput(input, {
      archetypeRepository: options.templateWorkspace?.repository,
    });
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
    const inputMode = options.inputMode === "template-adgit"
      ? "template"
      : options.inputMode;

    if (inputMode === "template") {
      return await convertTemplateInput(input, options);
    }

    // Step 1: Deserialize input to RM object
    const rmObject = await deserializeInput(input, options);

    // Step 2: Serialize to requested output formats
    const outputs: Record<string, string> = {};
    const simplifiedFormats = options.outputFormats.filter((format) =>
      SIMPLIFIED_OUTPUT_FORMATS.has(format)
    );

    for (const format of options.outputFormats) {
      if (SIMPLIFIED_OUTPUT_FORMATS.has(format)) continue;
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
          case "zipehr.json":
            outputs["zipehr.json"] = await serializeToJZipehr(
              rmObject,
              options.zipehrSymbolVariant,
            );
            break;
          case "zipehr.yaml":
            outputs["zipehr.yaml"] = await serializeToYZipehr(
              rmObject,
              options.zipehrSymbolVariant,
            );
            break;
          case "zipehr.xhtml":
            outputs["zipehr.xhtml"] = await serializeToXZipehr(rmObject, {
              symbolVariant: options.zipehrSymbolVariant ?? "lettercode",
              propertyMode: options.zipehrPropertyMode,
            });
            break;
          case "zipehr.html5.short":
          case "zipehr.html5.full":
          case "zipehr.html5.emoji":
            outputs[format] = await serializeToHtml5Variant(
              rmObject,
              format,
              {
                layout: options.zipehrHtml5Layout,
                propertyMode: options.zipehrPropertyMode,
              },
            );
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

    if (simplifiedFormats.length) {
      const webTemplate = resolveWebTemplate(options);
      writeSimplifiedOutputs(rmObject, webTemplate, simplifiedFormats, outputs);
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

async function convertTemplateInput(
  input: string,
  options: ConversionOptions,
): Promise<ConversionResult> {
  const template = resolveOperationalTemplate(input, options);

  const generator = new RMInstanceGenerator({
    mode: options.templateGenerationMode,
    language: options.templateLanguage,
  });

  const generatedInstance = generator.generate(template);
  const outputs: Record<string, string> = {};

  for (const format of options.outputFormats) {
    if (SIMPLIFIED_OUTPUT_FORMATS.has(format)) continue;
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
      case "zipehr.json":
        outputs["zipehr.json"] = await serializeToJZipehr(
          generatedInstance,
          options.zipehrSymbolVariant,
        );
        break;
      case "zipehr.yaml":
        outputs["zipehr.yaml"] = await serializeToYZipehr(
          generatedInstance,
          options.zipehrSymbolVariant,
        );
        break;
      case "zipehr.xhtml":
        outputs["zipehr.xhtml"] = await serializeToXZipehr(generatedInstance, {
          symbolVariant: options.zipehrSymbolVariant ?? "lettercode",
          propertyMode: options.zipehrPropertyMode,
        });
        break;
      case "zipehr.html5.short":
      case "zipehr.html5.full":
      case "zipehr.html5.emoji":
        outputs[format] = await serializeToHtml5Variant(
          generatedInstance,
          format,
          {
            layout: options.zipehrHtml5Layout,
            propertyMode: options.zipehrPropertyMode,
          },
        );
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
        const tsGenerator = new TypeScriptGenerator({
          language: options.templateLanguage || "en",
        });
        outputs.typescript = tsGenerator.generate(template);
        break;
      }
    }
  }

  writeSimplifiedOutputs(
    generatedInstance,
    buildWebTemplate(template),
    options.outputFormats,
    outputs,
  );

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

function formatLabelForLoadKind(
  loadKind: string | undefined,
  sourceKind: string,
): string {
  switch (loadKind) {
    case "template_json":
      return "Better template JSON";
    case "template":
      return "ADL2 template";
    case "operational_template":
      return "operational template";
    case "oet_xml":
      return "OET XML";
    case "opt_xml":
      return "OPT XML";
    default:
      switch (sourceKind) {
        case "adl2_template":
          return "ADL2 template";
        case "adl14_operational":
          return "ADL 1.4 operational template";
        case "oet_compiled":
          return "compiled OET";
        case "opt_xml":
          return "OPT XML";
        case "operational_template":
          return "operational template";
        default:
          return "template";
      }
  }
}

function formatLabelForFormat(format: string | undefined): string {
  switch (format) {
    case "template_json":
      return "Better template JSON";
    case "adl14":
      return "ADL 1.4 operational template";
    case "adl2":
      return "ADL2";
    case "oet_xml":
      return "OET XML";
    case "opt_xml":
      return "OPT XML";
    default:
      return "template";
  }
}

export function isSimplifiedInputFormat(
  format: string,
): format is "flat" | "structured" {
  return format === "flat" || format === "structured";
}

function detectSimplifiedJson(
  input: string,
): "flat" | "structured" | null {
  try {
    const obj = JSON.parse(input.trim()) as Record<string, unknown>;
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) return null;
    const keys = Object.keys(obj);
    if (keys.some((k) => k.startsWith("ctx/"))) return "flat";
    if (
      "ctx" in obj && typeof obj.ctx === "object" && obj.ctx != null &&
      !Array.isArray(obj.ctx)
    ) {
      return "structured";
    }
    if (keys.some((k) => k.includes("|"))) return "flat";
  } catch {
    // not JSON
  }
  return null;
}

type ResolvedWireFormat = "xml" | "json" | "yaml" | "flat" | "structured";

function zipehrWireFormat(
  variant: string,
): ResolvedWireFormat {
  if (variant === "zipehr.yaml") return "yaml";
  if (
    variant === "zipehr.xhtml" ||
    variant === "zipehr.html5.short" ||
    variant === "zipehr.html5.full" ||
    variant === "zipehr.html5.emoji"
  ) {
    return "xml";
  }
  return "json";
}

/**
 * Resolve effective input format (auto-detect zipehr, simplified, canonical).
 */
export function resolveInputFormat(
  input: string,
  requested: InputFormat,
): {
  format: ResolvedWireFormat;
  isZipehr: boolean;
  zipehrVariant?: string;
} {
  if (requested === "flat" || requested === "structured") {
    return { format: requested, isZipehr: false };
  }

  if (requested === "zipehr") {
    const detected = detectInputFormat(input);
    if (detected.kind === "zipehr") {
      return {
        format: zipehrWireFormat(detected.variant),
        isZipehr: true,
        zipehrVariant: detected.variant,
      };
    }
    throw new Error(
      "Input format set to ZipEHR but content does not look like zipehr.json, zipehr.yaml, zipehr.xhtml, or zipehr.html5.",
    );
  }

  if (requested !== "auto") {
    return { format: requested, isZipehr: false };
  }

  const detected = detectInputFormat(input);
  if (detected.kind === "zipehr") {
    return {
      format: zipehrWireFormat(detected.variant),
      isZipehr: true,
      zipehrVariant: detected.variant,
    };
  }
  if (detected.kind === "canonical") {
    return { format: detected.format, isZipehr: false };
  }

  const simplified = detectSimplifiedJson(input);
  if (simplified) {
    return { format: simplified, isZipehr: false };
  }

  // Fallback: try JSON then YAML
  try {
    JSON.parse(input.trim());
    return { format: "json", isZipehr: false };
  } catch {
    return { format: "yaml", isZipehr: false };
  }
}

/**
 * Deserialize input based on format
 */
async function deserializeInput(
  input: string,
  options: ConversionOptions,
): Promise<any> {
  const config = options.inputDeserializerConfig;
  const resolved = resolveInputFormat(input, options.inputFormat);

  if (resolved.isZipehr) {
    const canonical = await zipehrTextToCanonical(input);
    const deserializer = new JsonConfigurableDeserializer(
      config as JsonDeserializationConfig,
    );
    return deserializer.deserialize(JSON.stringify(canonical));
  }

  switch (resolved.format) {
    case "flat": {
      const webTemplate = resolveWebTemplate(options);
      return deserializeFromFlat(
        JSON.parse(input) as Record<string, string | number | boolean | null>,
        webTemplate,
      );
    }
    case "structured": {
      const webTemplate = resolveWebTemplate(options);
      return deserializeFromStructured(
        JSON.parse(input) as Record<string, unknown>,
        webTemplate,
      );
    }
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
      throw new Error(`Unsupported input format: ${resolved.format}`);
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
      nameLocation: config.nameLocation,
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
