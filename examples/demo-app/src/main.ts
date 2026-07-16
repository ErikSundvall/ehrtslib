/**
 * ehrtslib Format Converter Demo App
 *
 * Main entry point for the browser application.
 *
 * Layout note: config panels and status bars sit above editors (not below), because
 * users rarely scroll to the bottom of long instance payloads.
 */

import { EXAMPLES } from "./examples.ts";
import {
  resolveInputFormat,
  type ConversionOptions,
  convert,
  getAsciidocConfigPreset,
  getJsonConfigPreset,
  getJsonDeserializeConfigPreset,
  getMarkdownConfigPreset,
  getYamlConfigPreset,
  getYamlDeserializeConfigPreset,
  initializeTypeRegistry,
  isSimplifiedInputFormat,
  MISSING_WEB_TEMPLATE_ERROR,
  type InputFormat,
  type InputMode,
  type OutputFormat,
  type TemplateGenerationMode,
  validateTemplateInput,
} from "./converter.ts";

import type {
  JsonDeserializationConfig,
  JsonSerializationConfig,
} from "../../../enhanced/serialization/json/mod.ts";

import type {
  YamlDeserializationConfig,
  YamlSerializationConfig,
} from "../../../enhanced/serialization/yaml/mod.ts";

import type { MarkdownSerializationConfig } from "../../../enhanced/serialization/markdown/mod.ts";
import type { AsciidocSerializationConfig } from "../../../enhanced/serialization/asciidoc/mod.ts";

import { strFromU8, unzipSync } from "fflate";
import { ClinicalModelWorkspace } from "../../../enhanced/parser/clinical_model_workspace.ts";
import { availableTemplateLanguages } from "../../../enhanced/generation/term_codes.ts";
import {
  getDemoEditor,
  initDemoEditors,
  setDemoEditorLanguage,
  type DemoEditor,
  type DemoLanguage,
} from "./codemirror-setup.ts";
import { initEditorDisplaySettings } from "./editor-settings.ts";

const DEFAULT_INSTANCE_EXAMPLE = "complex-composition";

// Application state
let currentInputFormat = "json";
let currentInputTab: InputMode = "instance";
let currentOutputs: any = {};
let autoConvertEnabled = true;
let autoConvertDebounceTimer: ReturnType<typeof setTimeout> | undefined;
const AUTO_CONVERT_DEBOUNCE_MS = 350;

/** In-browser template/archetype file set (ADL2 + legacy OPT/OET). */
const clinicalWorkspace = new ClinicalModelWorkspace();
/** Optional OPT/template uploaded directly in the Simplified output tab. */
const simplifiedWorkspace = new ClinicalModelWorkspace();

// Declare build info injected by esbuild
declare const __BUILD_INFO__: {
  timestamp: string;
  buildId: string;
};

/**
 * Initialize the application when DOM is loaded
 */
function init() {
  console.log("🚀 ehrtslib Format Converter initialized");

  // Initialize TypeRegistry
  try {
    initializeTypeRegistry();
  } catch (error) {
    console.error("Failed to initialize TypeRegistry:", error);
    showError("Failed to initialize application. Please refresh the page.");
    return;
  }

  // Display build info
  displayBuildInfo();

  initDemoEditors({
    instanceInitial: EXAMPLES[DEFAULT_INSTANCE_EXAMPLE as keyof typeof EXAMPLES]
      .json,
  });
  syncInputEditorLanguage();
  setupEventListeners();
  updateAutoConvertButtonUi();
  updateTemplateLanguageOptions();

  // Load default example (triggers debounced auto-convert via handleInputChange)
  loadExample(DEFAULT_INSTANCE_EXAMPLE);
  handleInputChange("template");

  console.log("✓ Application ready");
}

/**
 * Set up all event listeners for the UI
 */
function setupEventListeners() {
  // Input format selector
  const inputFormatSelect = document.getElementById(
    "input-format",
  ) as HTMLSelectElement;
  if (inputFormatSelect) {
    inputFormatSelect.addEventListener("change", handleInputFormatChange);
  }

  // Load example button and menu
  const loadExampleBtn = document.getElementById("load-example");
  const exampleMenu = document.getElementById("example-menu");
  if (loadExampleBtn && exampleMenu) {
    loadExampleBtn.addEventListener("click", () => {
      exampleMenu.classList.toggle("hidden");
    });

    // Example menu items
    const exampleItems = exampleMenu.querySelectorAll(".example-item");
    exampleItems.forEach((item) => {
      item.addEventListener("click", (e) => {
        const exampleKey = (e.target as HTMLElement).getAttribute(
          "data-example",
        );
        if (exampleKey) {
          loadExample(exampleKey);
          exampleMenu.classList.add("hidden");
        }
      });
    });
  }

  // Upload file button
  const uploadBtn = document.getElementById("upload-file");
  const fileInput = document.getElementById("file-input") as HTMLInputElement;
  if (uploadBtn && fileInput) {
    uploadBtn.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", handleFileUpload);
  }

  // Clear input button
  const clearBtn = document.getElementById("clear-input");
  if (clearBtn) {
    clearBtn.addEventListener("click", clearInput);
  }
  const clearTemplateBtn = document.getElementById("clear-template-input");
  if (clearTemplateBtn) {
    clearTemplateBtn.addEventListener("click", clearInput);
  }

  setupTemplateFileUpload();
  setupTemplateAdGitLoad();

  // Input editors
  const inputEditor = getDemoEditor("input-text");
  if (inputEditor) {
    inputEditor.onChange(() => handleInputChange("instance"));
  }

  const templateEditor = getDemoEditor("template-input-text");
  if (templateEditor) {
    templateEditor.onChange(() => handleInputChange("template"));
  }

  initEditorDisplaySettings();

  const autoConvertBtn = document.getElementById("auto-convert-btn");
  if (autoConvertBtn) {
    autoConvertBtn.addEventListener("click", toggleAutoConvert);
  }

  const outputPanelBody = document.querySelector(".output-panel .panel-body");
  const inputPanelBody = document.querySelector(".input-panel .panel-body");
  if (outputPanelBody) {
    outputPanelBody.addEventListener("change", () => scheduleAutoConvert());
  }
  if (inputPanelBody) {
    inputPanelBody.addEventListener("change", () => scheduleAutoConvert());
  }

  const templateModeSelect = document.getElementById(
    "template-generation-mode",
  ) as HTMLSelectElement;
  if (templateModeSelect) {
    templateModeSelect.addEventListener("change", () => scheduleAutoConvert());
  }

  const templateLanguageSelect = document.getElementById(
    "template-generation-language",
  ) as HTMLSelectElement;
  if (templateLanguageSelect) {
    templateLanguageSelect.addEventListener("change", () => scheduleAutoConvert());
  }

  const outputFormatSection = document.getElementById(
    "output-tab-enable-section",
  );
  if (outputFormatSection) {
    outputFormatSection.addEventListener("change", () => scheduleAutoConvert());
  }

  // Preset dropdowns
  setupPresetListeners();

  // Output tabs
  setupOutputTabs();

  setupInputTabs();

  // Splitters
  setupSplitters();

  // Copy and download buttons
  setupCopyDownloadButtons();

  // Dismiss error button
  const dismissErrorBtn = document.getElementById("dismiss-error");
  if (dismissErrorBtn) {
    dismissErrorBtn.addEventListener("click", hideError);
  }

  // Output visibility
  setupOutputVisibilityListeners();
  setupZipehrVariantListener();
  setupZipehrSymbolVariantListener();
  setupSimplifiedVariantListener();
  setupSimplifiedOptUpload();
  setupInputSimplifiedTemplateUpload();
  syncInputFormatUi();

  // Collapsible sections
  setupCollapsibleSections();
}

/**
 * Set up listeners for output format checkboxes to toggle tabs
 */
function setupOutputVisibilityListeners() {
  const formats = [
    "xml",
    "json",
    "yaml",
    "zipehr",
    "markdown",
    "asciidoc",
    "typescript",
    "simplified",
    "webtemplate",
  ];

  formats.forEach((format) => {
    const checkbox = document.getElementById(
      `output-${format}`,
    ) as HTMLInputElement;
    if (checkbox) {
      // Initial state
      toggleOutputTab(format, checkbox.checked);

      // Change listener
      checkbox.addEventListener("change", () => {
        toggleOutputTab(format, checkbox.checked);
      });
    }
  });
}

type ZipehrOutputVariant =
  | "zipehr.json"
  | "zipehr.yaml"
  | "zipehr.xhtml"
  | "zipehr.html5.short"
  | "zipehr.html5.full"
  | "zipehr.html5.emoji";

function getActiveZipehrVariant(): ZipehrOutputVariant {
  const select = document.getElementById("zipehr-variant") as HTMLSelectElement;
  const value = select?.value;
  if (value === "zipehr.json") return "zipehr.json";
  if (value === "zipehr.xhtml") return "zipehr.xhtml";
  if (value === "zipehr.html5.short") return "zipehr.html5.short";
  if (value === "zipehr.html5.full") return "zipehr.html5.full";
  if (value === "zipehr.html5.emoji") return "zipehr.html5.emoji";
  return "zipehr.yaml";
}

function isZipehrHtml5VariantSelected(): boolean {
  const v = getActiveZipehrVariant();
  return (
    v === "zipehr.html5.short" ||
    v === "zipehr.html5.full" ||
    v === "zipehr.html5.emoji"
  );
}

function getActiveZipehrHtml5Layout():
  | "oneliner"
  | "linesaving"
  | "fluffy"
  | undefined {
  if (!isZipehrHtml5VariantSelected()) return undefined;
  const select = document.getElementById(
    "zipehr-html5-layout",
  ) as HTMLSelectElement | null;
  const value = select?.value;
  if (value === "oneliner" || value === "linesaving" || value === "fluffy") {
    return value;
  }
  const variant = getActiveZipehrVariant();
  return variant === "zipehr.html5.short" ? "oneliner" : "linesaving";
}

function isZipehrMarkupVariantSelected(): boolean {
  const v = getActiveZipehrVariant();
  return v === "zipehr.xhtml" || isZipehrHtml5VariantSelected();
}

function getActiveZipehrPropertyMode():
  | "omit"
  | "attribute"
  | "comment"
  | undefined {
  if (!isZipehrMarkupVariantSelected()) return undefined;
  const select = document.getElementById(
    "zipehr-property-mode",
  ) as HTMLSelectElement | null;
  const value = select?.value;
  if (value === "omit" || value === "attribute" || value === "comment") {
    return value;
  }
  return "omit";
}

function getActiveSimplifiedVariant(): "flat" | "structured" {
  const select = document.getElementById(
    "simplified-variant",
  ) as HTMLSelectElement;
  return select?.value === "flat" ? "flat" : "structured";
}

function switchZipehrVariantPane(): void {
  const variant = getActiveZipehrVariant();
  document.querySelectorAll(".zipehr-variant-pane").forEach((pane) => {
    pane.classList.toggle(
      "hidden",
      pane.getAttribute("data-zipehr-variant") !== variant,
    );
  });
  const prettyGroup = document.getElementById("zipehr-html5-pretty-group");
  prettyGroup?.classList.toggle("hidden", !isZipehrHtml5VariantSelected());
  const propertyGroup = document.getElementById("zipehr-property-mode-group");
  propertyGroup?.classList.toggle("hidden", !isZipehrMarkupVariantSelected());
  if (getActiveOutputFormat() === variant) {
    updateOutputInfo();
  }
}

function switchSimplifiedVariantPane(): void {
  const variant = getActiveSimplifiedVariant();
  document.querySelectorAll(".simplified-variant-pane").forEach((pane) => {
    pane.classList.toggle(
      "hidden",
      pane.getAttribute("data-simplified-variant") !== variant,
    );
  });
  if (
    document.querySelector("#output-tabs .tab.active")?.getAttribute(
      "data-tab",
    ) === "simplified"
  ) {
    updateOutputInfo();
  }
}

function setupZipehrVariantListener(): void {
  const select = document.getElementById("zipehr-variant");
  select?.addEventListener("change", () => {
    const layout = document.getElementById(
      "zipehr-html5-layout",
    ) as HTMLSelectElement | null;
    if (layout && isZipehrHtml5VariantSelected()) {
      const v = getActiveZipehrVariant();
      // Seed dialect default when switching into HTML5 (user can override).
      layout.value = v === "zipehr.html5.short" ? "oneliner" : "linesaving";
    }
    syncZipehrSymbolVariantControls();
    switchZipehrVariantPane();
    scheduleAutoConvert();
  });
  const layoutSelect = document.getElementById("zipehr-html5-layout");
  layoutSelect?.addEventListener("change", () => {
    if (isZipehrHtml5VariantSelected()) scheduleAutoConvert();
  });
  const propertyModeSelect = document.getElementById("zipehr-property-mode");
  propertyModeSelect?.addEventListener("change", () => {
    if (isZipehrMarkupVariantSelected()) scheduleAutoConvert();
  });
  syncZipehrSymbolVariantControls();
  switchZipehrVariantPane();
}

function getActiveZipehrSymbolVariant(): "emoji" | "lettercode" {
  if (isZipehrHtml5VariantSelected()) {
    // HTML5 short/full use letter tags; emoji dialect uses emoji tags.
    return getActiveZipehrVariant() === "zipehr.html5.emoji"
      ? "emoji"
      : "lettercode";
  }
  const selected = document.querySelector(
    'input[name="zipehr-symbol-variant"]:checked',
  ) as HTMLInputElement | null;
  return selected?.value === "lettercode" ? "lettercode" : "emoji";
}

function syncZipehrSymbolVariantControls(): void {
  const group = document.getElementById("zipehr-symbol-variant-group");
  const hint = document.getElementById("zipehr-symbol-variant-hint");
  const emojiRadio = document.getElementById(
    "zipehr-symbol-variant-emoji",
  ) as HTMLInputElement | null;
  const letterRadio = document.getElementById(
    "zipehr-symbol-variant-lettercode",
  ) as HTMLInputElement | null;
  // HTML5 dialects fix their own symbols; json/yaml/xhtml use the radios.
  const lockSymbols = isZipehrHtml5VariantSelected();
  const showXhtmlHint = getActiveZipehrVariant() === "zipehr.xhtml";

  if (emojiRadio) emojiRadio.disabled = lockSymbols;
  if (letterRadio) letterRadio.disabled = lockSymbols;
  group?.classList.toggle("is-disabled", lockSymbols);
  group?.setAttribute("aria-disabled", lockSymbols ? "true" : "false");
  if (hint) hint.hidden = !showXhtmlHint;
}

function setupZipehrSymbolVariantListener(): void {
  document
    .querySelectorAll('input[name="zipehr-symbol-variant"]')
    .forEach((input) => {
      input.addEventListener("change", () => {
        if (!isZipehrHtml5VariantSelected()) {
          scheduleAutoConvert();
        }
      });
    });
}

function setupSimplifiedVariantListener(): void {
  const select = document.getElementById("simplified-variant");
  select?.addEventListener("change", () => {
    switchSimplifiedVariantPane();
    scheduleAutoConvert();
  });
  switchSimplifiedVariantPane();
}

function getEffectiveTemplateWorkspace(): ClinicalModelWorkspace {
  if (simplifiedWorkspace.listFiles().length > 0) {
    return simplifiedWorkspace;
  }
  return clinicalWorkspace;
}

function syncSimplifiedTemplateUi(): void {
  const outputInfo = document.getElementById("simplified-template-info");
  const outputClearBtn = document.getElementById("simplified-opt-clear-btn");
  const inputInfo = document.getElementById("input-simplified-template-info");
  const inputClearBtn = document.getElementById(
    "input-simplified-opt-clear-btn",
  );

  const describeWorkspace = (): string => {
    if (simplifiedWorkspace.listFiles().length > 0) {
      const path = simplifiedWorkspace.getGenerationRootPath() ??
        simplifiedWorkspace.getActivePath() ??
        simplifiedWorkspace.listFiles()[0]?.path;
      return path
        ? `Uploaded: ${path.split("/").pop()}`
        : "Custom template loaded";
    }
    if (
      currentInputTab === "template" && clinicalWorkspace.listFiles().length > 0
    ) {
      const path = clinicalWorkspace.getActivePath() ??
        clinicalWorkspace.getGenerationRootPath() ??
        clinicalWorkspace.listFiles()[0]?.path;
      return path
        ? `Linked from template tab: ${path.split("/").pop()}`
        : "Linked from template tab";
    }
    if (clinicalWorkspace.listFiles().length > 0) {
      const path = clinicalWorkspace.getGenerationRootPath();
      return path
        ? `Available from input: ${path.split("/").pop()}`
        : "Template available from input tab";
    }
    return "No template loaded — upload OPT or Web Template JSON";
  };

  const text = describeWorkspace();
  const hasUpload = simplifiedWorkspace.listFiles().length > 0;
  const hasAnyTemplate = hasUpload || clinicalWorkspace.listFiles().length > 0;

  if (outputInfo) outputInfo.textContent = text;
  if (inputInfo) inputInfo.textContent = text;
  outputClearBtn?.classList.toggle("hidden", !hasUpload);
  inputClearBtn?.classList.toggle("hidden", !hasUpload);

  const section = document.getElementById("input-simplified-template-section");
  if (section && isSimplifiedInputFormat(currentInputFormat)) {
    section.classList.toggle("needs-attention", !hasAnyTemplate);
  }
}

async function loadFileIntoSimplifiedWorkspace(file: File): Promise<void> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".zip")) {
    const buf = new Uint8Array(await file.arrayBuffer());
    const entries = unzipSync(buf);
    const batch: Array<{ path: string; content: string }> = [];
    for (const [entryName, data] of Object.entries(entries)) {
      batch.push({
        path: entryName.replace(/\\/g, "/").replace(/^\/+/, ""),
        content: strFromU8(data),
      });
    }
    if (batch.length) {
      simplifiedWorkspace.clear();
      simplifiedWorkspace.loadFromZipEntries(batch);
      const root = ClinicalModelWorkspace.suggestGenerationRoot(
        simplifiedWorkspace.listFiles(),
      );
      if (root) simplifiedWorkspace.setGenerationRootPath(root);
    }
  } else if (/\.(opt|oet|adl|adls|t\.json|xml)$/i.test(name)) {
    simplifiedWorkspace.clear();
    simplifiedWorkspace.addFile(file.name, await file.text());
    const root = ClinicalModelWorkspace.suggestGenerationRoot(
      simplifiedWorkspace.listFiles(),
    );
    if (root) simplifiedWorkspace.setGenerationRootPath(root);
  } else if (name.endsWith(".json")) {
    const content = await file.text();
    const parsed = JSON.parse(content);
    const { isWebTemplateJson } = await import(
      "../../../enhanced/serialization/simplified/mod.ts"
    );
    if (!isWebTemplateJson(parsed)) {
      throw new Error(
        "JSON file is not a Web Template (expected templateId and tree).",
      );
    }
    simplifiedWorkspace.clear();
    simplifiedWorkspace.addFile(file.name, content);
  } else {
    throw new Error(
      "Unsupported file type. Use .opt, .oet, .adl, .zip, or Web Template JSON.",
    );
  }
  syncSimplifiedTemplateUi();
  syncInputFormatUi();
  scheduleAutoConvert();
}

function setupSimplifiedOptUpload(): void {
  const uploadBtn = document.getElementById("simplified-opt-upload-btn");
  const fileInput = document.getElementById(
    "simplified-opt-upload",
  ) as HTMLInputElement;
  const clearBtn = document.getElementById("simplified-opt-clear-btn");

  uploadBtn?.addEventListener("click", () => fileInput?.click());
  fileInput?.addEventListener("change", async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    await loadFileIntoSimplifiedWorkspace(file);
    fileInput.value = "";
  });
  clearBtn?.addEventListener("click", () => {
    simplifiedWorkspace.clear();
    syncSimplifiedTemplateUi();
    syncInputFormatUi();
    scheduleAutoConvert();
  });
  syncSimplifiedTemplateUi();
}

function setupInputSimplifiedTemplateUpload(): void {
  const uploadBtn = document.getElementById("input-simplified-opt-upload-btn");
  const fileInput = document.getElementById(
    "input-simplified-opt-upload",
  ) as HTMLInputElement;
  const clearBtn = document.getElementById("input-simplified-opt-clear-btn");

  uploadBtn?.addEventListener("click", () => fileInput?.click());
  fileInput?.addEventListener("change", async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    try {
      await loadFileIntoSimplifiedWorkspace(file);
    } catch (error) {
      showError((error as Error).message);
    }
    fileInput.value = "";
  });
  clearBtn?.addEventListener("click", () => {
    simplifiedWorkspace.clear();
    syncSimplifiedTemplateUi();
    syncInputFormatUi();
    scheduleAutoConvert();
  });
}

function syncInputFormatUi(): void {
  const isSimplified = isSimplifiedInputFormat(currentInputFormat);
  document.getElementById("input-deserializer-section")?.classList.toggle(
    "hidden",
    isSimplified,
  );
  document.getElementById("input-simplified-template-section")?.classList
    .toggle("hidden", !isSimplified);
  syncSimplifiedTemplateUi();
}

function highlightTemplateUploadRequired(): void {
  if (!isSimplifiedInputFormat(currentInputFormat)) return;
  const section = document.getElementById("input-simplified-template-section");
  section?.classList.add("needs-attention");
  section?.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

/**
 * Toggle visibility of an output tab and its options section
 */
function toggleOutputTab(format: string, visible: boolean) {
  // Find the tab button
  const tabs = document.querySelectorAll("#output-tabs .tab");
  let tabBtn: HTMLElement | null = null;

  tabs.forEach((t) => {
    if (t.getAttribute("data-tab") === format) {
      tabBtn = t as HTMLElement;
    }
  });

  // Find the options section
  const optionsSection = document.getElementById(`${format}-options`);

  if (!tabBtn) return;

  if (visible) {
    (tabBtn as HTMLElement).classList.remove("hidden");
    if (optionsSection) {
      optionsSection.classList.remove("hidden");
    }
  } else {
    (tabBtn as HTMLElement).classList.add("hidden");
    if (optionsSection) {
      optionsSection.classList.add("hidden");
    }

    // If we just hid the active tab, switch to another one
    if ((tabBtn as HTMLElement).classList.contains("active")) {
      // Find first visible tab
      const visibleTab = Array.from(
        document.querySelectorAll("#output-tabs .tab"),
      )
        .find((t) => !t.classList.contains("hidden"));

      if (visibleTab) {
        const targetFormat = visibleTab.getAttribute("data-tab");
        if (targetFormat) {
          switchOutputTab(targetFormat);
        }
      }
    }
  }
}

/**
 * Set up resizable splitters
 */
function setupSplitters() {
  const splitter = document.getElementById("splitter-main");
  if (splitter) {
    setupSplitter(splitter, "input-panel", "output-panel");
  }
}

function getActiveOutputFormat(): string {
  const activeTab = document.querySelector("#output-tabs .tab.active");
  const tab = activeTab?.getAttribute("data-tab") || "yaml";
  if (tab === "zipehr") return getActiveZipehrVariant();
  if (tab === "simplified") return getActiveSimplifiedVariant();
  return tab;
}

/**
 * Set up a single splitter
 */
function setupSplitter(
  splitter: HTMLElement,
  leftClass: string,
  rightClass: string,
) {
  let isDragging = false;
  let startX: number;
  let leftWidth: number;
  let rightWidth: number;

  const mainContent = document.querySelector(".main-content") as HTMLElement;

  splitter.addEventListener("mousedown", (e) => {
    isDragging = true;
    startX = e.clientX;
    splitter.classList.add("active");

    // Get panels
    // We navigate DOM or query
    const panels = Array.from(document.querySelectorAll(".panel"));
    // Find the panels adjacent to this splitter
    // Assuming DOM order: Input, Splitter1, Options, Splitter2, Output

    // But easier to find by class if we know them
    // Actually, simple resize logic:
    // Left element is previousSibling, Right is nextSibling?
    // Intermediate text nodes might exist.

    e.preventDefault(); // Prevent text selection
    document.body.style.cursor = "col-resize";

    // Disable iframe pointer events if any (none here)
  });

  document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;

    const deltaX = e.clientX - startX;
    startX = e.clientX; // Update for incremental change or use accumulative?
    // Incremental is easier if we rely on flex-basis or width

    // Let's use simple logic:
    // Previous Element Width += deltaX
    // Next Element Width -= deltaX
    // But dealing with flex: 1 and fixed widths is tricky.

    // Better approach:
    // When dragging Splitter 1 (Input | Options):
    // Resize Input Panel (flex-grow/basis) and Options Panel (width).

    // Let's find the elements dynamically
    const prev = splitter.previousElementSibling as HTMLElement;
    const next = splitter.nextElementSibling as HTMLElement;

    if (prev && next) {
      const prevRect = prev.getBoundingClientRect();
      const nextRect = next.getBoundingClientRect();

      // Apply new widths. Note: We need to switch from flex 1 to explicit px or % during drag?
      // Or simply adjust flex-basis?

      const newPrevWidth = prevRect.width + deltaX;
      const newNextWidth = nextRect.width - deltaX;

      // Minimum width check
      if (newPrevWidth > 200 && newNextWidth > 200) {
        prev.style.flex = `0 0 ${newPrevWidth}px`;
        next.style.flex = `0 0 ${newNextWidth}px`;
        // Also explicit width to be safe
        prev.style.width = `${newPrevWidth}px`;
        next.style.width = `${newNextWidth}px`;
      }

      startX = e.clientX; // Reset startX to current to avoid accumulation drift
    }
  });

  document.addEventListener("mouseup", () => {
    if (isDragging) {
      isDragging = false;
      splitter.classList.remove("active");
      document.body.style.cursor = "";
    }
  });
}

/**
 * Set up preset configuration listeners
 */
function setupPresetListeners() {
  // Input deserializer preset
  const inputDeserializerPreset = document.getElementById(
    "input-deserializer-preset",
  ) as HTMLSelectElement;
  if (inputDeserializerPreset) {
    inputDeserializerPreset.addEventListener("change", (e) => {
      const preset = (e.target as HTMLSelectElement).value;
      updateInputDeserializerOptions(preset);
    });
  }

  // JSON config preset
  const jsonConfigPreset = document.getElementById(
    "json-config-preset",
  ) as HTMLSelectElement;
  if (jsonConfigPreset) {
    jsonConfigPreset.addEventListener("change", (e) => {
      const preset = (e.target as HTMLSelectElement).value;
      updateJsonOptions(preset);
    });
  }

  // JSON serializer type
  const jsonSerializerType = document.getElementById(
    "json-serializer-type",
  ) as HTMLSelectElement;
  if (jsonSerializerType) {
    jsonSerializerType.addEventListener("change", () => {
      // Trigger update of options based on current preset and serializer
      const preset = jsonConfigPreset?.value || "custom";
      updateJsonOptions(preset);
    });
  }

  // YAML config preset
  const yamlConfigPreset = document.getElementById(
    "yaml-config-preset",
  ) as HTMLSelectElement;
  if (yamlConfigPreset) {
    yamlConfigPreset.addEventListener("change", (e) => {
      const preset = (e.target as HTMLSelectElement).value;
      updateYamlOptions(preset);
    });
    updateYamlOptions(yamlConfigPreset.value || "custom");
  }

  // XML config preset
  const xmlConfigPreset = document.getElementById(
    "xml-config-preset",
  ) as HTMLSelectElement;
  if (xmlConfigPreset) {
    xmlConfigPreset.addEventListener("change", (e) => {
      const preset = (e.target as HTMLSelectElement).value;
      updateXmlOptions(preset);
    });
  }

  const markdownConfigPreset = document.getElementById(
    "markdown-config-preset",
  ) as HTMLSelectElement;
  if (markdownConfigPreset) {
    markdownConfigPreset.addEventListener("change", (e) => {
      const preset = (e.target as HTMLSelectElement).value;
      updateMarkdownOptions(preset);
    });
  }

  const asciidocConfigPreset = document.getElementById(
    "asciidoc-config-preset",
  ) as HTMLSelectElement;
  if (asciidocConfigPreset) {
    asciidocConfigPreset.addEventListener("change", (e) => {
      const preset = (e.target as HTMLSelectElement).value;
      updateAsciidocOptions(preset);
    });
  }
}

/**
 * Template tab: upload OPT/OET/ADL files or ZIP archives (browser-only; no server upload).
 */
function setupTemplateFileUpload() {
  const uploadBtn = document.getElementById("upload-template-files");
  const fileInput = document.getElementById("template-file-input") as
    | HTMLInputElement
    | null;
  const templateEditor = getDemoEditor("template-input-text");
  const tabsScroll = document.getElementById("template-file-tabs-scroll");
  if (!uploadBtn || !fileInput || !templateEditor) return;

  uploadBtn.addEventListener("click", () => fileInput.click());

  tabsScroll?.addEventListener("change", (e) => {
    const target = e.target as HTMLInputElement;
    if (
      target.name === "template-generation-root" &&
      target.type === "radio" &&
      target.checked
    ) {
      clinicalWorkspace.setGenerationRootPath(target.value);
      updateTemplateFileSetUi();
      handleInputChange("template");
    }
  });

  tabsScroll?.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest(
      ".template-file-tab-btn",
    ) as HTMLButtonElement | null;
    if (!btn?.dataset.path) return;
    selectTemplateFileTab(btn.dataset.path);
  });

  templateEditor.onChange(() => {
    const path = clinicalWorkspace.getActivePath();
    if (path) {
      clinicalWorkspace.updateFileContent(path, templateEditor.value);
      updateTemplateFileSetUi();
    }
  });

  fileInput.addEventListener("change", async () => {
    const files = fileInput.files;
    if (!files?.length) return;

    let lastPath: string | undefined;
    for (const file of Array.from(files)) {
      const name = file.name.toLowerCase();
      if (name.endsWith(".zip")) {
        const buf = new Uint8Array(await file.arrayBuffer());
        const entries = unzipSync(buf);
        const batch: Array<{ path: string; content: string }> = [];
        for (const [entryName, data] of Object.entries(entries)) {
          batch.push({
            path: entryName.replace(/\\/g, "/").replace(/^\/+/, ""),
            content: strFromU8(data),
          });
        }
        if (batch.length) {
          const results = clinicalWorkspace.loadFromZipEntries(batch);
          if (results.length) {
            lastPath = results[results.length - 1]?.path;
          }
        }
        continue;
      }
      if (/\.(opt|oet|adl|adls|t\.json|xml)$/i.test(name)) {
        const result = clinicalWorkspace.addFile(file.name, await file.text());
        lastPath = result.path;
      }
    }

    if (clinicalWorkspace.listFiles().length) {
      const root = ClinicalModelWorkspace.suggestGenerationRoot(
        clinicalWorkspace.listFiles(),
      );
      if (root) clinicalWorkspace.setGenerationRootPath(root);
      selectTemplateFileTab(
        lastPath ?? root ?? clinicalWorkspace.getActivePath() ?? "",
      );
      activateInputTab("template");
      handleInputChange("template");
    }
    fileInput.value = "";
  });
}

function setupTemplateAdGitLoad() {
  const loadBtn = document.getElementById("load-github-template");
  const urlInput = document.getElementById("github-template-url") as
    | HTMLInputElement
    | null;
  if (!loadBtn || !urlInput) return;

  const defaultUrl =
    "https://github.com/regionstockholm/CKM-mirror-via-modellbibliotek/blob/MultiDiciplinery_Tumor_meetings/local/Diagnostic_MDT_Lung_cancer.t.json";
  if (!urlInput.value.trim()) urlInput.value = defaultUrl;

  loadBtn.addEventListener("click", async () => {
    const url = urlInput.value.trim();
    if (!url) {
      alert("Paste a GitHub blob or raw URL to a .t.json template file.");
      return;
    }
    loadBtn.setAttribute("disabled", "true");
    clearAdGitProgress();
    appendAdGitProgress("Starting…", "parse-url");
    try {
      const result = await clinicalWorkspace.loadFromGitHubTemplateUrl(url, {
        onProgress: (e) => {
          appendAdGitProgress(e.message, e.phase, e.path);
        },
        maxFiles: 200,
      });
      for (const w of result.warnings) {
        appendAdGitProgress(w, "resolve");
      }
      appendAdGitProgress(
        `Done — ${result.fetched} files loaded (root: ${result.rootPath})`,
        "complete",
      );
      if (result.rootPath) selectTemplateFileTab(result.rootPath);
      updateTemplateFileSetUi();
      activateInputTab("template");
      handleInputChange("template");
      void handleConvert();
    } catch (e) {
      appendAdGitProgress((e as Error).message, "fetch");
      alert(`Template load failed: ${(e as Error).message}`);
    } finally {
      loadBtn.removeAttribute("disabled");
    }
  });
}

function clearAdGitProgress() {
  const empty = document.getElementById("adgit-progress-empty");
  const list = document.getElementById("adgit-progress-list");
  if (empty) empty.classList.remove("hidden");
  if (list) {
    list.innerHTML = "";
    list.classList.add("hidden");
  }
}

function appendAdGitProgress(
  message: string,
  phase?: string,
  _path?: string,
) {
  const empty = document.getElementById("adgit-progress-empty");
  const list = document.getElementById("adgit-progress-list");
  if (!list) return;
  if (empty) empty.classList.add("hidden");
  list.classList.remove("hidden");
  const li = document.createElement("li");
  if (phase === "complete") li.classList.add("adgit-phase-complete");
  if (phase === "fetch" && message.startsWith("Failed")) {
    li.classList.add("adgit-phase-error");
  }
  li.textContent = message;
  list.appendChild(li);
  list.scrollTop = list.scrollHeight;
}

function selectTemplateFileTab(path: string) {
  if (!path) return;
  const templateEditor = getDemoEditor("template-input-text");
  clinicalWorkspace.setActivePath(path);
  const file = clinicalWorkspace.getFile(path);
  if (templateEditor && file) templateEditor.value = file.content;
  updateTemplateFileSetUi();
  syncSimplifiedTemplateUi();
  handleInputChange('template');
}

/** Badge label + CSS class for file-set tab by load result. */
function fileTabBadgeInfo(
  path: string,
  loadResult?: { kind?: string; message?: string },
): { label: string; className: string; title?: string } {
  const kind = loadResult?.kind;
  if (kind === "archetype" || kind === "template" || kind === "operational_template") {
    return { label: kind, className: "kind-badge kind-badge--model", title: loadResult?.message };
  }
  if (kind === "oet_xml") {
    return { label: "oet", className: "kind-badge kind-badge--model", title: loadResult?.message };
  }
  if (kind === "opt_xml") {
    return { label: "opt", className: "kind-badge kind-badge--model", title: loadResult?.message };
  }
  if (kind === "template_json") {
    return { label: "t.json", className: "kind-badge kind-badge--model", title: loadResult?.message };
  }
  if (kind === "error") {
    return { label: "error", className: "kind-badge kind-badge--error", title: loadResult?.message };
  }
  if (kind === "skipped") {
    return { label: "skipped", className: "kind-badge kind-badge--skipped", title: loadResult?.message };
  }
  if (/\.opt$/i.test(path)) {
    return { label: "opt", className: "kind-badge kind-badge--model" };
  }
  if (/\.oet$/i.test(path)) {
    return { label: "oet", className: "kind-badge kind-badge--model" };
  }
  return { label: "?", className: "kind-badge" };
}

function updateTemplateFileSetUi() {
  const fileSetEl = document.getElementById('template-file-set');
  const tabsScroll = document.getElementById('template-file-tabs-scroll');
  const summary = document.getElementById('template-file-set-summary');
  if (!tabsScroll) return;

  const files = clinicalWorkspace.listFiles();
  const active = clinicalWorkspace.getActivePath();
  const generationRoot = clinicalWorkspace.getGenerationRootPath();

  if (fileSetEl) {
    fileSetEl.hidden = files.length === 0;
  }

  tabsScroll.innerHTML = '';
  for (const f of files) {
    const badgeInfo = fileTabBadgeInfo(f.path, f.loadResult);
    const tab = document.createElement('div');
    tab.className = 'template-file-tab' + (f.path === active ? ' active' : '');
    tab.setAttribute('role', 'presentation');

    const radioLabel = document.createElement('label');
    radioLabel.className = 'template-root-radio';
    radioLabel.title = 'Use as generation root for example output';
    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'template-generation-root';
    radio.value = f.path;
    radio.checked = f.path === generationRoot;
    radio.setAttribute('aria-label', `Generation root: ${f.path}`);
    radioLabel.appendChild(radio);

    const tabBtn = document.createElement('button');
    tabBtn.type = 'button';
    tabBtn.className = 'template-file-tab-btn';
    tabBtn.dataset.path = f.path;
    tabBtn.setAttribute('role', 'tab');
    tabBtn.setAttribute('aria-selected', f.path === active ? 'true' : 'false');
    const baseName = f.path.split('/').pop() ?? f.path;
    tabBtn.textContent = baseName;
    tabBtn.title = f.path;

    const badge = document.createElement('span');
    badge.className = badgeInfo.className;
    badge.textContent = badgeInfo.label;
    if (badgeInfo.title) badge.title = badgeInfo.title;

    tab.appendChild(radioLabel);
    tab.appendChild(tabBtn);
    tab.appendChild(badge);
    tabsScroll.appendChild(tab);
  }

  if (summary) {
    const nArch = clinicalWorkspace.repository.listIds().length;
    const nTpl = clinicalWorkspace.repository.listTemplateIds().length;
    const rootLabel = generationRoot ? generationRoot.split('/').pop() : '—';
    summary.textContent = files.length
      ? `${files.length} files · ${nArch} archetypes · ${nTpl} templates · root: ${rootLabel}`
      : '';
  }

  updateTemplateLanguageOptions();
  syncSimplifiedTemplateUi();
}

function updateTemplateLanguageOptions() {
  const select = document.getElementById(
    "template-generation-language",
  ) as HTMLSelectElement | null;
  if (!select) return;

  const previous = select.value;
  let languages: string[] = [];

  try {
    if (clinicalWorkspace.listFiles().length) {
      const { operationalTemplate } = clinicalWorkspace.resolveOperational();
      languages = availableTemplateLanguages(operationalTemplate);
    }
  } catch {
    // resolve can fail while the user is still editing
  }

  if (languages.length === 0) {
    languages = ["en"];
  }

  select.replaceChildren();
  for (const code of languages) {
    const option = document.createElement("option");
    option.value = code;
    option.textContent = code;
    select.appendChild(option);
  }

  if (previous && languages.includes(previous)) {
    select.value = previous;
  } else {
    select.value = languages[0];
  }
}

/**
 * Input column tabs: Instance (current) vs Template (schema) prototype.
 */
function setupInputTabs() {
  const tabs = document.querySelectorAll("#input-tabs .tab");
  tabs.forEach((tab) => {
    tab.addEventListener("click", (e) => {
      const name = (e.currentTarget as HTMLElement).getAttribute(
        "data-input-tab",
      );
      if (!name) return;
      activateInputTab(name as InputMode);
    });
  });
}

function activateInputTab(mode: InputMode) {
  const tabs = document.querySelectorAll("#input-tabs .tab");
  tabs.forEach((t) => {
    const el = t as HTMLElement;
    const active = el.getAttribute("data-input-tab") === mode;
    el.classList.toggle("active", active);
    el.setAttribute("aria-selected", active ? "true" : "false");
  });
  document.querySelectorAll(".input-tab-pane").forEach((pane) => {
    pane.classList.toggle("active", pane.id === `input-tab-${mode}`);
  });
  currentInputTab = mode;
  syncSimplifiedTemplateUi();
  validateInput();
  scheduleAutoConvert();
}

/**
 * Set up output tab switching
 */
function setupOutputTabs() {
  const tabs = document.querySelectorAll("#output-tabs .tab");
  tabs.forEach((tab) => {
    tab.addEventListener("click", (e) => {
      const tabName = (e.target as HTMLElement).getAttribute("data-tab");
      if (tabName) {
        switchOutputTab(tabName);
      }
    });
  });
}

/**
 * Set up copy and download button handlers
 */
function setupCopyDownloadButtons() {
  document.addEventListener("click", (e) => {
    const target = (e.target as HTMLElement).closest(
      ".copy-output-btn, .download-output-btn",
    ) as HTMLElement | null;
    if (!target) return;

    const format = target.getAttribute("data-format");
    if (!format) return;

    if (target.classList.contains("copy-output-btn")) {
      copyToClipboard(format);
    } else {
      downloadOutput(format);
    }
  });
}

function syncInputEditorLanguage(): void {
  const language = currentInputFormat as DemoLanguage;
  if (
    language === "json" || language === "xml" || language === "yaml" ||
    isSimplifiedInputFormat(currentInputFormat)
  ) {
    setDemoEditorLanguage(
      "input-text",
      isSimplifiedInputFormat(currentInputFormat) ? "json" : language,
    );
  } else {
    setDemoEditorLanguage("input-text", "plain");
  }
}

/**
 * Handle input format change
 */
function handleInputFormatChange(e: Event) {
  currentInputFormat = (e.target as HTMLSelectElement).value;
  syncInputFormatUi();
  syncInputEditorLanguage();
  validateInput();
  scheduleAutoConvert();
}

/**
 * Load an example into the input textarea
 */
function loadExample(exampleKey: string) {
  const example = EXAMPLES[exampleKey as keyof typeof EXAMPLES];
  if (!example) {
    console.error("Example not found:", exampleKey);
    return;
  }

  const inputEditor = getDemoEditor("input-text");
  const formatSelect = document.getElementById(
    "input-format",
  ) as HTMLSelectElement;

  if (inputEditor && formatSelect) {
    activateInputTab("instance");
    // Load the appropriate format
    const format = formatSelect.value;
    inputEditor.value = example[format as keyof typeof example] as string ||
      example.json;
    currentInputFormat = format;

    syncInputEditorLanguage();
    // Update character count and validation
    handleInputChange("instance");
  }
}

/**
 * Handle file upload
 */
async function handleFileUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;

  try {
    const text = await file.text();
    const inputEditor = getDemoEditor("input-text");
    if (inputEditor) {
      activateInputTab("instance");
      inputEditor.value = text;
      handleInputChange("instance");

      // Try to detect format from file extension or content
      const ext = file.name.split(".").pop()?.toLowerCase();
      const formatSelect = document.getElementById(
        "input-format",
      ) as HTMLSelectElement;
      if (formatSelect) {
        if (ext === "xml" || ext === "json" || ext === "yaml" || ext === "yml") {
          if (ext === "json") {
            try {
              const parsed = JSON.parse(text);
              const keys = Object.keys(parsed);
              if (keys.some((k) => k.startsWith("ctx/"))) {
                formatSelect.value = "flat";
              } else if (
                "ctx" in parsed &&
                typeof parsed.ctx === "object" &&
                parsed.ctx != null
              ) {
                formatSelect.value = "structured";
              } else {
                formatSelect.value = "json";
              }
            } catch {
              formatSelect.value = "json";
            }
          } else {
            formatSelect.value = ext === "yml" ? "yaml" : ext;
          }
          currentInputFormat = formatSelect.value;
          syncInputFormatUi();
          syncInputEditorLanguage();
        }
      }
    }
  } catch (error) {
    console.error("Error reading file:", error);
    showError("Failed to read file: " + (error as Error).message);
  }
}

/**
 * Clear the input textarea
 */
function clearInput() {
  const editor = getCurrentInputEditor();
  if (editor) {
    editor.value = "";
    if (currentInputTab === "template") {
      clinicalWorkspace.clear();
      updateTemplateFileSetUi();
    }
    handleInputChange(currentInputTab);
  }
}

function getInputEditor(mode: InputMode): DemoEditor | null {
  if (mode === "template-adgit") return null;
  const id = mode === "template" ? "template-input-text" : "input-text";
  return getDemoEditor(id);
}

function hasTemplateWorkspace(): boolean {
  return clinicalWorkspace.listFiles().length > 0;
}

/** Whether the active input tab can drive a conversion run. */
function canConvertFromInputTab(tab: InputMode = currentInputTab): boolean {
  if (tab === "template-adgit") return hasTemplateWorkspace();
  return true;
}

/** Map AD@git tab to template conversion when a file set is loaded. */
function effectiveInputMode(): InputMode {
  if (currentInputTab === "template-adgit" && hasTemplateWorkspace()) {
    return "template";
  }
  return currentInputTab;
}

function getCurrentInputEditor(): DemoEditor | null {
  return getInputEditor(currentInputTab);
}

/**
 * Handle input text change
 */
function handleInputChange(tab: InputMode = currentInputTab) {
  if (tab === "template-adgit") {
    validateInput();
    scheduleAutoConvert();
    return;
  }
  const inputEditor = getInputEditor(tab);
  if (!inputEditor) return;

  const text = inputEditor.value;

  const charCount = document.getElementById(
    tab === "template" ? "template-char-count" : "char-count",
  );
  if (charCount) {
    charCount.textContent = text.length.toString();
  }

  const lineCount = document.getElementById(
    tab === "template" ? "template-line-count" : "line-count",
  );
  if (lineCount) {
    lineCount.textContent = text.split("\n").length.toString();
  }

  validateInput();
  scheduleAutoConvert();
}

/**
 * Validate the input text
 */
function validateInput() {
  if (currentInputTab === "template-adgit") {
    const validationIcon = document.getElementById("template-validation-icon");
    const validationText = document.getElementById("template-validation-text");
    if (!validationIcon || !validationText) return;

    if (!hasTemplateWorkspace()) {
      validationIcon.textContent = "radio_button_unchecked";
      validationIcon.className = "material-icons status-icon";
      validationText.textContent = "Load a template from GitHub";
      return;
    }

    try {
      const templateValidation = validateTemplateInput("", clinicalWorkspace);
      if (!templateValidation.valid) {
        throw new Error(templateValidation.message);
      }
      validationIcon.textContent = "check";
      validationIcon.className = "material-icons status-icon valid";
      validationText.textContent = templateValidation.message;
      updateTemplateLanguageOptions();
    } catch (error) {
      validationIcon.textContent = "error";
      validationIcon.className = "material-icons status-icon invalid";
      validationText.textContent = (error as Error).message;
    }
    return;
  }

  const inputEditor = getCurrentInputEditor();
  const validationIcon = document.getElementById(
    currentInputTab === "template"
      ? "template-validation-icon"
      : "validation-icon",
  );
  const validationText = document.getElementById(
    currentInputTab === "template"
      ? "template-validation-text"
      : "validation-text",
  );

  if (!inputEditor || !validationIcon || !validationText) return;

  const text = inputEditor.value.trim();
  if (!text) {
    validationIcon.textContent = "radio_button_unchecked";
    validationIcon.className = "material-icons status-icon";
    validationText.textContent = "Empty";
    return;
  }

  // Simple format validation
  try {
    if (currentInputTab === "template") {
      const templateValidation = validateTemplateInput(text, clinicalWorkspace);
      if (!templateValidation.valid) {
        throw new Error(templateValidation.message);
      }
      validationIcon.textContent = "check";
      validationIcon.className = "material-icons status-icon valid";
      validationText.textContent = templateValidation.message;
      updateTemplateLanguageOptions();
      return;
    }

    if (
      currentInputFormat === "auto" || currentInputFormat === "zipehr"
    ) {
      const resolved = resolveInputFormat(text, currentInputFormat as InputFormat);
      if (resolved.isZipehr) {
        validationText.textContent = `ZipEHR ${resolved.zipehrVariant ?? "detected"}`;
      } else {
        validationText.textContent = `Auto: ${resolved.format.toUpperCase()}`;
      }
      validationIcon.textContent = "check";
      validationIcon.className = "material-icons status-icon valid";
    } else if (currentInputFormat === "json") {
      JSON.parse(text);
      validationIcon.textContent = "check";
      validationIcon.className = "material-icons status-icon valid";
      validationText.textContent = "Valid JSON";
    } else if (currentInputFormat === "xml") {
      // Basic XML check
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, "text/xml");
      const parseError = doc.querySelector("parsererror");
      if (parseError) {
        throw new Error("XML parse error");
      }
      validationIcon.textContent = "check";
      validationIcon.className = "material-icons status-icon valid";
      validationText.textContent = "Valid XML";
    } else if (currentInputFormat === "yaml") {
      // YAML validation will be done during conversion
      validationIcon.textContent = "check";
      validationIcon.className = "material-icons status-icon valid";
      validationText.textContent = "Assumed valid YAML";
    } else if (isSimplifiedInputFormat(currentInputFormat)) {
      const parsed = JSON.parse(text);
      if (currentInputFormat === "flat") {
        if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
          throw new Error("FLAT payload must be a JSON object");
        }
        validationText.textContent = "Valid FLAT JSON";
      } else {
        if (
          typeof parsed !== "object" || parsed === null || Array.isArray(parsed) ||
          !("ctx" in parsed)
        ) {
          throw new Error("STRUCTURED payload must include a ctx object");
        }
        validationText.textContent = "Valid STRUCTURED JSON";
      }
      validationIcon.textContent = "check";
      validationIcon.className = "material-icons status-icon valid";

      const hasTemplate = getEffectiveTemplateWorkspace().listFiles().length > 0;
      const section = document.getElementById("input-simplified-template-section");
      section?.classList.toggle("needs-attention", !hasTemplate);
      if (!hasTemplate) {
        validationText.textContent += " — template required for conversion";
      }
    }
  } catch (error) {
    validationIcon.textContent = "error";
    validationIcon.className = "material-icons status-icon invalid";
    validationText.textContent = currentInputTab === "template"
      ? (error as Error).message
      : `Invalid ${currentInputFormat.toUpperCase()}`;
  }
}

/**
 * Toggle live auto-convert (play = off, pause = on).
 */
function toggleAutoConvert() {
  autoConvertEnabled = !autoConvertEnabled;
  updateAutoConvertButtonUi();
  if (autoConvertEnabled) {
    scheduleAutoConvert();
  } else if (autoConvertDebounceTimer !== undefined) {
    clearTimeout(autoConvertDebounceTimer);
    autoConvertDebounceTimer = undefined;
  }
}

function updateAutoConvertButtonUi() {
  const btn = document.getElementById("auto-convert-btn");
  const icon = document.getElementById("auto-convert-icon");
  const label = document.getElementById("auto-convert-label");
  if (!btn || !icon) return;

  if (autoConvertEnabled) {
    icon.textContent = "pause";
    btn.classList.add("is-active");
    btn.classList.remove("btn-secondary");
    btn.classList.add("btn-primary");
    btn.setAttribute("aria-pressed", "true");
    btn.title = "Pause auto-convert";
    if (label) label.textContent = "Auto-convert";
  } else {
    icon.textContent = "play_arrow";
    btn.classList.remove("is-active");
    btn.classList.remove("btn-primary");
    btn.classList.add("btn-secondary");
    btn.setAttribute("aria-pressed", "false");
    btn.title = "Resume auto-convert";
    if (label) label.textContent = "Paused";
  }
}

function scheduleAutoConvert() {
  if (!autoConvertEnabled) return;
  if (!canConvertFromInputTab()) return;
  if (autoConvertDebounceTimer !== undefined) {
    clearTimeout(autoConvertDebounceTimer);
  }
  autoConvertDebounceTimer = setTimeout(() => {
    autoConvertDebounceTimer = undefined;
    void handleConvert();
  }, AUTO_CONVERT_DEBOUNCE_MS);
}

/**
 * Run conversion (debounced when auto-convert is on).
 */
async function handleConvert() {
  if (!canConvertFromInputTab()) return;
  console.log("🔄 Converting...");
  showLoading();
  hideError();

  try {
    const inputMode = effectiveInputMode();
    const inputEditor = getInputEditor(inputMode);
    const inputText = inputEditor?.value.trim() ?? "";
    const hasTemplateWorkspace = clinicalWorkspace.listFiles().length > 0;
    if (
      !inputText &&
      !(inputMode === "template" && hasTemplateWorkspace)
    ) {
      throw new Error("Input is empty");
    }

    // Gather conversion options from UI
    const options = gatherConversionOptions();

    // Perform conversion
    const result = await convert(inputText, options);

    hideLoading();

    if (!result.success) {
      if (result.error?.includes(MISSING_WEB_TEMPLATE_ERROR)) {
        highlightTemplateUploadRequired();
      }
      showError(result.error || "Conversion failed");
      return;
    }

    // Update output panels
    if (result.outputs) {
      updateOutputs(result.outputs);
    }

    console.log("✅ Conversion successful");
  } catch (error) {
    hideLoading();
    console.error("Conversion error:", error);
    const message = (error as Error).message;
    if (message.includes(MISSING_WEB_TEMPLATE_ERROR)) {
      highlightTemplateUploadRequired();
    }
    showError(message);
  }
}

/**
 * Gather conversion options from UI controls
 */
function gatherConversionOptions(): ConversionOptions {
  const inputMode = effectiveInputMode();

  // Input format
  const inputFormatSelect = document.getElementById(
    "input-format",
  ) as HTMLSelectElement;
  const inputFormat = (inputFormatSelect?.value || "json") as InputFormat;

  // Input deserializer config
  const inputDeserializerPreset =
    (document.getElementById("input-deserializer-preset") as HTMLSelectElement)
      ?.value || "default";
  const inputDeserializerConfig = getJsonDeserializeConfigPreset(
    inputDeserializerPreset,
  );

  const templateGenerationMode = (
    (document.getElementById("template-generation-mode") as HTMLSelectElement)
      ?.value || "example"
  ) as TemplateGenerationMode;

  const templateLanguage = (
    document.getElementById("template-generation-language") as HTMLSelectElement
  )?.value || undefined;

  // Output formats
  const outputFormats: OutputFormat[] = [];
  if ((document.getElementById("output-xml") as HTMLInputElement)?.checked) {
    outputFormats.push("xml");
  }
  if ((document.getElementById("output-yaml") as HTMLInputElement)?.checked) {
    outputFormats.push("yaml");
  }
  if ((document.getElementById("output-zipehr") as HTMLInputElement)?.checked) {
    outputFormats.push(getActiveZipehrVariant());
  }
  if ((document.getElementById("output-json") as HTMLInputElement)?.checked) {
    outputFormats.push("json");
  }
  if (
    (document.getElementById("output-markdown") as HTMLInputElement)?.checked
  ) {
    outputFormats.push("markdown");
  }
  if (
    (document.getElementById("output-asciidoc") as HTMLInputElement)?.checked
  ) {
    outputFormats.push("asciidoc");
  }
  if (
    (document.getElementById("output-typescript") as HTMLInputElement)?.checked
  ) {
    outputFormats.push("typescript");
  }
  if (
    (document.getElementById("output-simplified") as HTMLInputElement)?.checked
  ) {
    outputFormats.push(getActiveSimplifiedVariant());
  }
  if (
    (document.getElementById("output-webtemplate") as HTMLInputElement)?.checked
  ) {
    outputFormats.push("webtemplate");
  }

  // JSON serializer type and config
  const jsonSerializerType =
    ((document.getElementById("json-serializer-type") as HTMLSelectElement)
      ?.value || "configurable") as "canonical" | "configurable";
  const jsonConfigPreset =
    (document.getElementById("json-config-preset") as HTMLSelectElement)
      ?.value || "canonical";
  const jsonConfig = getJsonConfigPreset(jsonConfigPreset);
  const jsonArchIdLoc =
    (document.getElementById("json-arch-id-location") as HTMLSelectElement)
      ?.value as any;
  if (jsonArchIdLoc) jsonConfig.archetypeNodeIdLocation = jsonArchIdLoc;
  const jsonNameLoc =
    (document.getElementById("json-name-location") as HTMLSelectElement)
      ?.value as "default" | "beginning" | undefined;
  if (jsonNameLoc) jsonConfig.nameLocation = jsonNameLoc;

  // Apply custom JSON settings if preset is 'custom'
  if (jsonConfigPreset === "custom") {
    const indent = parseInt(
      (document.getElementById("json-indent") as HTMLInputElement)?.value ||
        "2",
    );
    jsonConfig.indent = indent;
    jsonConfig.useTerseFormat =
      (document.getElementById("json-terse") as HTMLInputElement)?.checked ||
      false;
    jsonConfig.useHybridStyle =
      (document.getElementById("json-hybrid") as HTMLInputElement)?.checked ||
      false;
    // jsonConfig.useTypeInference = (document.getElementById('json-type-inference') as HTMLInputElement)?.checked || false;
  }

  // YAML config
  const yamlConfigPreset =
    (document.getElementById("yaml-config-preset") as HTMLSelectElement)
      ?.value || "custom";
  const yamlConfig = getYamlConfigPreset(yamlConfigPreset);
  const yamlArchIdLoc =
    (document.getElementById("yaml-arch-id-location") as HTMLSelectElement)
      ?.value as any;
  if (yamlArchIdLoc) yamlConfig.archetypeNodeIdLocation = yamlArchIdLoc;
  const yamlNameLoc =
    (document.getElementById("yaml-name-location") as HTMLSelectElement)
      ?.value as "default" | "beginning" | undefined;
  if (yamlNameLoc) yamlConfig.nameLocation = yamlNameLoc;

  // Apply custom YAML settings if preset is 'custom'
  if (yamlConfigPreset === "custom") {
    const indent = parseInt(
      (document.getElementById("yaml-indent") as HTMLInputElement)?.value ||
        "2",
    );
    const maxInlineProps = parseInt(
      (document.getElementById("yaml-max-inline-props") as HTMLInputElement)
        ?.value || "3",
    );
    const mainStyle =
      (document.getElementById("yaml-main-style") as HTMLSelectElement)
        ?.value as "block" | "flow" | "hybrid";
    yamlConfig.indent = indent;
    yamlConfig.maxInlineProperties = maxInlineProps;
    yamlConfig.mainStyle = mainStyle || "hybrid";
    yamlConfig.useTerseFormat =
      (document.getElementById("yaml-terse") as HTMLInputElement)?.checked !==
        false;
    yamlConfig.useTypeInference =
      (document.getElementById("yaml-type-inference") as HTMLInputElement)
        ?.checked !== false;
    // Only apply keepArchetypeDetailsInline if flow style
    if (mainStyle === "flow") {
      yamlConfig.keepArchetypeDetailsInline =
        (document.getElementById("yaml-archetype-inline") as HTMLInputElement)
          ?.checked !== false;
    } else {
      yamlConfig.keepArchetypeDetailsInline = false;
    }
  }

  const markdownConfigPreset =
    (document.getElementById("markdown-config-preset") as HTMLSelectElement)
      ?.value || "structural";
  const markdownConfig: MarkdownSerializationConfig = getMarkdownConfigPreset(
    markdownConfigPreset,
  );
  if (markdownConfigPreset === "custom") {
    markdownConfig.style =
      ((document.getElementById("markdown-style") as HTMLSelectElement)
        ?.value || "structural") as MarkdownSerializationConfig["style"];
    markdownConfig.codeRendering =
      ((document.getElementById("markdown-code-rendering") as HTMLSelectElement)
        ?.value || "inline_bracket") as MarkdownSerializationConfig[
          "codeRendering"
        ];
    markdownConfig.dataValueRendering =
      ((document.getElementById("markdown-data-rendering") as HTMLSelectElement)
        ?.value || "list") as MarkdownSerializationConfig["dataValueRendering"];
    markdownConfig.includeFrontmatter =
      (document.getElementById("markdown-frontmatter") as HTMLInputElement)
        ?.checked !== false;
    markdownConfig.includeArchetypeNodeIds =
      !!(document.getElementById("markdown-node-ids") as HTMLInputElement)
        ?.checked;
    markdownConfig.includeTypeAnnotations = !!(document.getElementById(
      "markdown-type-annotations",
    ) as HTMLInputElement)?.checked;
    markdownConfig.useOpenehrUrnWikilinks =
      !!(document.getElementById("markdown-urn-wikilinks") as HTMLInputElement)
        ?.checked;
    markdownConfig.hideTypeAnnotationsForDisplay = !!(document.getElementById(
      "markdown-hide-type-annotations",
    ) as HTMLInputElement)?.checked;
    markdownConfig.maxHeadingDepth = parseInt(
      (document.getElementById(
        "markdown-max-heading-depth",
      ) as HTMLInputElement)?.value || "4",
    );
  }

  const asciidocConfigPreset =
    (document.getElementById("asciidoc-config-preset") as HTMLSelectElement)
      ?.value || "lossless";
  const asciidocConfig: AsciidocSerializationConfig = getAsciidocConfigPreset(
    asciidocConfigPreset,
  );
  if (asciidocConfigPreset === "custom") {
    asciidocConfig.style =
      ((document.getElementById("asciidoc-style") as HTMLSelectElement)
        ?.value || "lossless") as AsciidocSerializationConfig["style"];
    asciidocConfig.nodeIdRendering = ((document.getElementById(
      "asciidoc-node-id-rendering",
    ) as HTMLSelectElement)?.value ||
      "comment") as AsciidocSerializationConfig["nodeIdRendering"];
    asciidocConfig.codeRendering =
      ((document.getElementById("asciidoc-code-rendering") as HTMLSelectElement)
        ?.value || "inline_bracket") as AsciidocSerializationConfig[
          "codeRendering"
        ];
    asciidocConfig.dataValueRendering =
      ((document.getElementById("asciidoc-data-rendering") as HTMLSelectElement)
        ?.value || "list") as AsciidocSerializationConfig["dataValueRendering"];
    asciidocConfig.includeHeader =
      (document.getElementById("asciidoc-header") as HTMLInputElement)
        ?.checked !== false;
    asciidocConfig.includeArchetypeNodeIds =
      !!(document.getElementById("asciidoc-node-ids") as HTMLInputElement)
        ?.checked;
    asciidocConfig.includeTypeAnnotations = !!(document.getElementById(
      "asciidoc-type-annotations",
    ) as HTMLInputElement)?.checked;
    asciidocConfig.useOpenehrUrnLinks =
      !!(document.getElementById("asciidoc-urn-links") as HTMLInputElement)
        ?.checked;
    asciidocConfig.maxHeadingDepth = parseInt(
      (document.getElementById(
        "asciidoc-max-heading-depth",
      ) as HTMLInputElement)?.value || "5",
    );
  }

  // XML config
  const xmlConfigPreset =
    (document.getElementById("xml-config-preset") as HTMLSelectElement)
      ?.value || "default";
  const xmlIndent = parseInt(
    (document.getElementById("xml-indent") as HTMLInputElement)?.value || "2",
  );
  const xmlConfig = {
    prettyPrint:
      (document.getElementById("xml-pretty") as HTMLInputElement)?.checked !==
        false,
    indent: xmlIndent,
    includeDeclaration:
      (document.getElementById("xml-declaration") as HTMLInputElement)
        ?.checked !== false,
    includeNamespaces:
      (document.getElementById("xml-namespaces") as HTMLInputElement)
        ?.checked !== false,
  };

  // TypeScript config
  const tsIndent = parseInt(
    (document.getElementById("ts-indent") as HTMLInputElement)?.value || "2",
  );
  const typescriptConfig = {
    useTerseFormat:
      (document.getElementById("ts-terse") as HTMLInputElement)?.checked !==
        false,
    usePrimitiveConstructors:
      (document.getElementById("ts-compact") as HTMLInputElement)?.checked !==
        false,
    includeComments:
      (document.getElementById("ts-comments") as HTMLInputElement)?.checked ||
      false,
    indent: tsIndent,
    includeUndefinedAttributes:
      (document.getElementById("ts-include-undefined") as HTMLInputElement)
        ?.checked || false,
    archetypeNodeIdLocation:
      (document.getElementById("ts-arch-id-location") as HTMLSelectElement)
        ?.value as "beginning" | "after_name" | "end" || "after_name",
    nameLocation:
      (document.getElementById("ts-name-location") as HTMLSelectElement)
        ?.value as "default" | "beginning" || "beginning",
  };

  return {
    inputMode,
    inputFormat,
    inputDeserializerConfig,
    outputFormats,
    templateGenerationMode,
    templateLanguage,
    jsonSerializerType,
    jsonConfig,
    yamlConfig,
    markdownConfig,
    asciidocConfig,
    xmlConfig,
    typescriptConfig,
    zipehrSymbolVariant: getActiveZipehrSymbolVariant(),
    zipehrHtml5Layout: getActiveZipehrHtml5Layout(),
    zipehrPropertyMode: getActiveZipehrPropertyMode(),
    templateWorkspace: getEffectiveTemplateWorkspace(),
  };
}

/**
 * Update output panels with converted data
 */
function updateOutputs(outputs: Record<string, string>) {
  currentOutputs = outputs;
  const outputFormats: OutputFormat[] = [
    "xml",
    "json",
    "yaml",
    "zipehr.json",
    "zipehr.yaml",
    "zipehr.xhtml",
    "zipehr.html5.short",
    "zipehr.html5.full",
    "zipehr.html5.emoji",
    "markdown",
    "asciidoc",
    "typescript",
    "flat",
    "structured",
    "webtemplate",
  ];

  outputFormats.forEach((format) => {
    const editor = getDemoEditor(`output-${format}-content`);
    if (editor) {
      editor.value = outputs[format] ?? "";
    }
  });
  // Refresh output info (counts and styles) for current active tab
  updateOutputInfo();
}

/**
 * Update input deserializer options based on preset
 */
function updateInputDeserializerOptions(preset: string) {
  const strictCheckbox = document.getElementById(
    "input-strict",
  ) as HTMLInputElement;
  const terseCheckbox = document.getElementById(
    "input-parse-terse",
  ) as HTMLInputElement;
  const incompleteCheckbox = document.getElementById(
    "input-allow-incomplete",
  ) as HTMLInputElement;

  const isCustom = preset === "custom";

  [strictCheckbox, terseCheckbox, incompleteCheckbox].forEach((checkbox) => {
    if (checkbox) checkbox.disabled = !isCustom;
  });

  if (!isCustom && strictCheckbox && terseCheckbox && incompleteCheckbox) {
    // Set values based on preset
    switch (preset) {
      case "canonical":
        strictCheckbox.checked = true;
        terseCheckbox.checked = false;
        incompleteCheckbox.checked = false;
        break;
      case "compact":
        strictCheckbox.checked = false;
        terseCheckbox.checked = true;
        incompleteCheckbox.checked = false;
        break;
      case "hybrid":
        strictCheckbox.checked = false;
        terseCheckbox.checked = true;
        incompleteCheckbox.checked = true;
        break;
      default: // 'default'
        strictCheckbox.checked = false;
        terseCheckbox.checked = false;
        incompleteCheckbox.checked = false;
    }
  }
}

/**
 * Update JSON options based on preset
 */
function updateJsonOptions(preset: string) {
  // Get all JSON option checkboxes and inputs
  const prettyCheckbox = document.getElementById(
    "json-pretty",
  ) as HTMLInputElement;
  const indentInput = document.getElementById(
    "json-indent",
  ) as HTMLInputElement;
  const terseCheckbox = document.getElementById(
    "json-terse",
  ) as HTMLInputElement;
  const hybridCheckbox = document.getElementById(
    "json-hybrid",
  ) as HTMLInputElement;
  const typeInferenceCheckbox = document.getElementById(
    "json-type-inference",
  ) as HTMLInputElement;
  const includeNullCheckbox = document.getElementById(
    "json-include-null",
  ) as HTMLInputElement;
  const includeEmptyCheckbox = document.getElementById(
    "json-include-empty",
  ) as HTMLInputElement;
  const configPresetSelect = document.getElementById(
    "json-config-preset",
  ) as HTMLSelectElement;
  const archIdLocSelect = document.getElementById(
    "json-arch-id-location",
  ) as HTMLSelectElement;
  const nameLocSelect = document.getElementById(
    "json-name-location",
  ) as HTMLSelectElement;

  // Name location is a readability-only toggle that applies to every preset.
  if (nameLocSelect) nameLocSelect.disabled = false;

  const serializerType =
    (document.getElementById("json-serializer-type") as HTMLSelectElement)
      ?.value || "configurable";
  const isCanonicalSerializer = serializerType === "canonical";

  if (isCanonicalSerializer) {
    // If Canonical Serializer is selected:
    // - Config preset is disabled
    // - Pretty print and indent are enabled (customizable)
    // - All other configurable options are disabled
    if (configPresetSelect) configPresetSelect.disabled = true;

    if (prettyCheckbox) prettyCheckbox.disabled = false;
    if (indentInput) indentInput.disabled = false;
    if (archIdLocSelect) archIdLocSelect.disabled = false;

    // Disable irrelevant options
    [
      terseCheckbox,
      hybridCheckbox,
      typeInferenceCheckbox,
      includeNullCheckbox,
      includeEmptyCheckbox,
    ].forEach((elem) => {
      if (elem) elem.disabled = true;
    });
  } else {
    // Configurable Serializer
    if (configPresetSelect) configPresetSelect.disabled = false;

    const isCustom = preset === "custom";

    // Enable/disable based on custom
    [
      prettyCheckbox,
      indentInput,
      terseCheckbox,
      hybridCheckbox,
      typeInferenceCheckbox,
      includeNullCheckbox,
      includeEmptyCheckbox,
      archIdLocSelect,
    ].forEach((elem) => {
      if (elem) elem.disabled = !isCustom;
    });

    if (!isCustom) {
      // Apply preset values
      switch (preset) {
        case "canonical":
          if (prettyCheckbox) prettyCheckbox.checked = true;
          if (terseCheckbox) terseCheckbox.checked = false;
          if (hybridCheckbox) hybridCheckbox.checked = false;
          if (typeInferenceCheckbox) typeInferenceCheckbox.checked = false;
          if (includeEmptyCheckbox) includeEmptyCheckbox.checked = true;
          break;
        case "compact":
          if (prettyCheckbox) prettyCheckbox.checked = true;
          if (terseCheckbox) terseCheckbox.checked = false;
          if (hybridCheckbox) hybridCheckbox.checked = false;
          if (typeInferenceCheckbox) typeInferenceCheckbox.checked = true;
          if (includeEmptyCheckbox) includeEmptyCheckbox.checked = false;
          break;
        case "hybrid":
          if (prettyCheckbox) prettyCheckbox.checked = true;
          if (terseCheckbox) terseCheckbox.checked = true;
          if (hybridCheckbox) hybridCheckbox.checked = true;
          if (typeInferenceCheckbox) typeInferenceCheckbox.checked = true;
          if (includeEmptyCheckbox) includeEmptyCheckbox.checked = false;
          break;
        case "very-compact":
          if (prettyCheckbox) prettyCheckbox.checked = true;
          if (terseCheckbox) terseCheckbox.checked = true;
          if (hybridCheckbox) hybridCheckbox.checked = false;
          if (typeInferenceCheckbox) typeInferenceCheckbox.checked = true;
          if (includeEmptyCheckbox) includeEmptyCheckbox.checked = false;
          break;
      }
    }
  }
}

/**
 * Update YAML options based on preset
 */
function updateYamlOptions(preset: string) {
  const mainStyleSelect = document.getElementById(
    "yaml-main-style",
  ) as HTMLSelectElement;
  const terseCheckbox = document.getElementById(
    "yaml-terse",
  ) as HTMLInputElement;
  const typeInferenceCheckbox = document.getElementById(
    "yaml-type-inference",
  ) as HTMLInputElement;
  const indentInput = document.getElementById(
    "yaml-indent",
  ) as HTMLInputElement;
  const maxInlinePropsInput = document.getElementById(
    "yaml-max-inline-props",
  ) as HTMLInputElement;
  const archetypeInlineCheckbox = document.getElementById(
    "yaml-archetype-inline",
  ) as HTMLInputElement;
  const archIdLocSelect = document.getElementById(
    "yaml-arch-id-location",
  ) as HTMLSelectElement;
  const nameLocSelect = document.getElementById(
    "yaml-name-location",
  ) as HTMLSelectElement;

  const isCustom = preset === "custom";

  [
    mainStyleSelect,
    terseCheckbox,
    typeInferenceCheckbox,
    indentInput,
    maxInlinePropsInput,
    archetypeInlineCheckbox,
    archIdLocSelect,
  ].forEach((elem) => {
    if (elem) elem.disabled = !isCustom;
  });

  // Name location is a readability-only toggle that applies to every preset.
  if (nameLocSelect) nameLocSelect.disabled = false;

  // Update archetype inline visibility based on main style
  const updateArchetypeInlineVisibility = () => {
    const mainStyle = mainStyleSelect?.value || "hybrid";
    const archetypeInlineGroup = document.getElementById(
      "yaml-archetype-inline-group",
    );
    if (archetypeInlineGroup) {
      // Only show for flow style
      if (mainStyle === "flow") {
        archetypeInlineGroup.style.display = "";
      } else {
        archetypeInlineGroup.style.display = "none";
      }
    }
  };

  if (!isCustom) {
    switch (preset) {
      case "default":
        if (mainStyleSelect) mainStyleSelect.value = "hybrid";
        if (terseCheckbox) terseCheckbox.checked = true;
        if (typeInferenceCheckbox) typeInferenceCheckbox.checked = true;
        if (archetypeInlineCheckbox) archetypeInlineCheckbox.checked = false;
        break;
      case "verbose":
        if (mainStyleSelect) mainStyleSelect.value = "block";
        if (terseCheckbox) terseCheckbox.checked = false;
        if (typeInferenceCheckbox) typeInferenceCheckbox.checked = false;
        if (archetypeInlineCheckbox) archetypeInlineCheckbox.checked = false;
        break;
      case "hybrid":
        if (mainStyleSelect) mainStyleSelect.value = "hybrid";
        if (terseCheckbox) terseCheckbox.checked = true;
        if (typeInferenceCheckbox) typeInferenceCheckbox.checked = true;
        if (archetypeInlineCheckbox) archetypeInlineCheckbox.checked = false;
        break;
      case "flow":
        if (mainStyleSelect) mainStyleSelect.value = "flow";
        if (terseCheckbox) terseCheckbox.checked = true;
        if (typeInferenceCheckbox) typeInferenceCheckbox.checked = true;
        if (archetypeInlineCheckbox) archetypeInlineCheckbox.checked = true;
        break;
      case "block":
        if (mainStyleSelect) mainStyleSelect.value = "block";
        if (terseCheckbox) terseCheckbox.checked = true;
        if (typeInferenceCheckbox) typeInferenceCheckbox.checked = true;
        if (archetypeInlineCheckbox) archetypeInlineCheckbox.checked = false;
        break;
    }
  }

  updateArchetypeInlineVisibility();

  // Add event listener only if not already attached
  // Use a data attribute to track if listener is attached
  if (mainStyleSelect && !mainStyleSelect.dataset.listenerAttached) {
    mainStyleSelect.addEventListener("change", updateArchetypeInlineVisibility);
    mainStyleSelect.dataset.listenerAttached = "true";
  }
}

/**
 * Update XML options based on preset
 */
function updateXmlOptions(preset: string) {
  const prettyCheckbox = document.getElementById(
    "xml-pretty",
  ) as HTMLInputElement;
  const namespacesCheckbox = document.getElementById(
    "xml-namespaces",
  ) as HTMLInputElement;
  const declarationCheckbox = document.getElementById(
    "xml-declaration",
  ) as HTMLInputElement;
  const indentInput = document.getElementById("xml-indent") as HTMLInputElement;

  const isCustom = preset === "custom";

  [prettyCheckbox, namespacesCheckbox, declarationCheckbox, indentInput]
    .forEach((elem) => {
      if (elem) elem.disabled = !isCustom;
    });

  if (
    !isCustom && prettyCheckbox && namespacesCheckbox && declarationCheckbox
  ) {
    // Default preset
    prettyCheckbox.checked = true;
    namespacesCheckbox.checked = true;
    declarationCheckbox.checked = true;
  }
}

/**
 * Update Markdown options based on preset
 */
function updateMarkdownOptions(preset: string) {
  const styleSelect = document.getElementById(
    "markdown-style",
  ) as HTMLSelectElement;
  const codeRenderingSelect = document.getElementById(
    "markdown-code-rendering",
  ) as HTMLSelectElement;
  const dataRenderingSelect = document.getElementById(
    "markdown-data-rendering",
  ) as HTMLSelectElement;
  const frontmatterCheckbox = document.getElementById(
    "markdown-frontmatter",
  ) as HTMLInputElement;
  const nodeIdsCheckbox = document.getElementById(
    "markdown-node-ids",
  ) as HTMLInputElement;
  const typeAnnotationsCheckbox = document.getElementById(
    "markdown-type-annotations",
  ) as HTMLInputElement;
  const urnWikilinksCheckbox = document.getElementById(
    "markdown-urn-wikilinks",
  ) as HTMLInputElement;
  const hideTypeAnnotationsCheckbox = document.getElementById(
    "markdown-hide-type-annotations",
  ) as HTMLInputElement;
  const maxHeadingDepthInput = document.getElementById(
    "markdown-max-heading-depth",
  ) as HTMLInputElement;

  const isCustom = preset === "custom";
  [
    styleSelect,
    codeRenderingSelect,
    dataRenderingSelect,
    frontmatterCheckbox,
    nodeIdsCheckbox,
    typeAnnotationsCheckbox,
    urnWikilinksCheckbox,
    hideTypeAnnotationsCheckbox,
    maxHeadingDepthInput,
  ].forEach((elem) => {
    if (elem) elem.disabled = !isCustom;
  });

  if (!isCustom) {
    const config = getMarkdownConfigPreset(preset);
    if (styleSelect && config.style) styleSelect.value = config.style;
    if (codeRenderingSelect && config.codeRendering) {
      codeRenderingSelect.value = config.codeRendering;
    }
    if (dataRenderingSelect && config.dataValueRendering) {
      dataRenderingSelect.value = config.dataValueRendering;
    }
    if (frontmatterCheckbox) {
      frontmatterCheckbox.checked = config.includeFrontmatter !== false;
    }
    if (nodeIdsCheckbox) {
      nodeIdsCheckbox.checked = !!config.includeArchetypeNodeIds;
    }
    if (typeAnnotationsCheckbox) {
      typeAnnotationsCheckbox.checked = !!config.includeTypeAnnotations;
    }
    if (urnWikilinksCheckbox) {
      urnWikilinksCheckbox.checked = !!config.useOpenehrUrnWikilinks;
    }
    if (hideTypeAnnotationsCheckbox) {
      hideTypeAnnotationsCheckbox.checked = !!config
        .hideTypeAnnotationsForDisplay;
    }
    if (maxHeadingDepthInput && config.maxHeadingDepth) {
      maxHeadingDepthInput.value = String(config.maxHeadingDepth);
    }
  }
}

/**
 * Update AsciiDoc options based on preset
 */
function updateAsciidocOptions(preset: string) {
  const styleSelect = document.getElementById(
    "asciidoc-style",
  ) as HTMLSelectElement;
  const nodeIdRenderingSelect = document.getElementById(
    "asciidoc-node-id-rendering",
  ) as HTMLSelectElement;
  const codeRenderingSelect = document.getElementById(
    "asciidoc-code-rendering",
  ) as HTMLSelectElement;
  const dataRenderingSelect = document.getElementById(
    "asciidoc-data-rendering",
  ) as HTMLSelectElement;
  const headerCheckbox = document.getElementById(
    "asciidoc-header",
  ) as HTMLInputElement;
  const nodeIdsCheckbox = document.getElementById(
    "asciidoc-node-ids",
  ) as HTMLInputElement;
  const typeAnnotationsCheckbox = document.getElementById(
    "asciidoc-type-annotations",
  ) as HTMLInputElement;
  const urnLinksCheckbox = document.getElementById(
    "asciidoc-urn-links",
  ) as HTMLInputElement;
  const maxHeadingDepthInput = document.getElementById(
    "asciidoc-max-heading-depth",
  ) as HTMLInputElement;

  const isCustom = preset === "custom";
  [
    styleSelect,
    nodeIdRenderingSelect,
    codeRenderingSelect,
    dataRenderingSelect,
    headerCheckbox,
    nodeIdsCheckbox,
    typeAnnotationsCheckbox,
    urnLinksCheckbox,
    maxHeadingDepthInput,
  ].forEach((elem) => {
    if (elem) elem.disabled = !isCustom;
  });

  if (!isCustom) {
    const config = getAsciidocConfigPreset(preset);
    if (styleSelect && config.style) styleSelect.value = config.style;
    if (nodeIdRenderingSelect && config.nodeIdRendering) {
      nodeIdRenderingSelect.value = config.nodeIdRendering;
    }
    if (codeRenderingSelect && config.codeRendering) {
      codeRenderingSelect.value = config.codeRendering;
    }
    if (dataRenderingSelect && config.dataValueRendering) {
      dataRenderingSelect.value = config.dataValueRendering;
    }
    if (headerCheckbox) headerCheckbox.checked = config.includeHeader !== false;
    if (nodeIdsCheckbox) {
      nodeIdsCheckbox.checked = !!config.includeArchetypeNodeIds;
    }
    if (typeAnnotationsCheckbox) {
      typeAnnotationsCheckbox.checked = !!config.includeTypeAnnotations;
    }
    if (urnLinksCheckbox) {
      urnLinksCheckbox.checked = !!config.useOpenehrUrnLinks;
    }
    if (maxHeadingDepthInput && config.maxHeadingDepth) {
      maxHeadingDepthInput.value = String(config.maxHeadingDepth);
    }
  }
}

/**
 * Switch to a different output tab
 */
function switchOutputTab(tabName: string) {
  // Update tab buttons
  const tabs = document.querySelectorAll("#output-tabs .tab");
  tabs.forEach((tab) => {
    if (tab.getAttribute("data-tab") === tabName) {
      tab.classList.add("active");
    } else {
      tab.classList.remove("active");
    }
  });

  // Update tab panes
  const panes = document.querySelectorAll(".tab-pane");
  panes.forEach((pane) => {
    if (pane.id === `tab-${tabName}`) {
      pane.classList.add("active");
    } else {
      pane.classList.remove("active");
    }
  });

  // Update counts/info for newly selected tab
  if (tabName === "zipehr") switchZipehrVariantPane();
  if (tabName === "simplified") switchSimplifiedVariantPane();
  updateOutputInfo();
}

/**
 * Update output info panel (characters and lines) for active output tab
 */
function updateOutputInfo() {
  const tabName = getActiveOutputFormat();
  const rootTab =
    tabName.startsWith("zipehr.") ? "tab-zipehr" : `tab-${tabName}`;
  const root = document.getElementById(rootTab);

  // `tab-zipehr` contains hidden panes per ZipEHR variant.
  const countsRoot =
    tabName.startsWith("zipehr.")
      ? (document.querySelector(
          `.zipehr-variant-pane[data-zipehr-variant="${tabName}"]`,
        ) as HTMLElement | null) ?? root
      : root;

  const outputChar = countsRoot?.querySelector(".output-char-count");
  const outputLine = countsRoot?.querySelector(".output-line-count");

  if (!countsRoot || !outputChar || !outputLine) return;

  const editor = getDemoEditor(`output-${tabName}-content`);
  if (!editor) return;

  const text = editor.value;
  outputChar.textContent = String(text.length);
  outputLine.textContent = String(text.split("\n").length);
}

/**
 * Copy output to clipboard
 */
async function copyToClipboard(format: string) {
  const outputEditor = getDemoEditor(`output-${format}-content`);
  if (!outputEditor) {
    console.error("Output editor not found:", format);
    return;
  }

  const text = outputEditor.value;

  try {
    await navigator.clipboard.writeText(text);
    showSuccessMessage(format);
  } catch (error) {
    console.error("Failed to copy:", error);
    showError("Failed to copy to clipboard");
  }
}

/**
 * Download output as a file
 */
function downloadOutput(format: string) {
  const outputEditor = getDemoEditor(`output-${format}-content`);
  if (!outputEditor) {
    console.error("Output editor not found:", format);
    return;
  }

  const text = outputEditor.value;
  const extensions: Record<string, string> = {
    xml: "xml",
    json: "json",
    yaml: "yaml",
    "zipehr.json": "zipehr.json",
    "zipehr.yaml": "zipehr.yaml",
    "zipehr.xhtml": "zipehr.xhtml",
    "zipehr.html5.short": "html",
    "zipehr.html5.full": "html",
    "zipehr.html5.emoji": "html",
    markdown: "md",
    asciidoc: "adoc",
    typescript: "ts",
  };

  const ext = extensions[format] || "txt";
  const filename = `openehr_output.${ext}`;

  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Show success message after copy
 */
function showSuccessMessage(format: string) {
  const successElement = document.getElementById(`success-${format}`);
  if (successElement) {
    successElement.classList.remove("hidden");
    setTimeout(() => {
      successElement.classList.add("hidden");
    }, 2000);
  }
}

/**
 * Show loading state
 */
function showLoading() {
  const loadingState = document.getElementById("loading-state");
  if (loadingState) {
    loadingState.classList.remove("hidden");
  }
}

/**
 * Hide loading state
 */
function hideLoading() {
  const loadingState = document.getElementById("loading-state");
  if (loadingState) {
    loadingState.classList.add("hidden");
  }
}

/**
 * Show error message
 */
function showError(message: string) {
  const errorState = document.getElementById("error-state");
  const errorText = document.getElementById("error-text");

  if (errorState && errorText) {
    errorText.textContent = message;
    errorState.classList.remove("hidden");
  }
}

/**
 * Hide error message
 */
function hideError() {
  const errorState = document.getElementById("error-state");
  if (errorState) {
    errorState.classList.add("hidden");
  }
}

/**
 * Set up collapsible option sections
 */
function setupCollapsibleSections() {
  const collapsibleSections = document.querySelectorAll(
    ".option-section.collapsible",
  );

  collapsibleSections.forEach((section) => {
    const header = section.querySelector(".section-header");
    if (header) {
      header.addEventListener("click", () => {
        section.classList.toggle("collapsed");
      });
    }
  });
}

/**
 * Display build information in the footer
 */
function displayBuildInfo() {
  const buildInfoElem = document.getElementById("build-info");
  if (buildInfoElem && typeof __BUILD_INFO__ !== "undefined") {
    const date = new Date(__BUILD_INFO__.timestamp);
    const dateStr = date.toLocaleDateString();
    const timeStr = date.toLocaleTimeString();
    buildInfoElem.textContent =
      `Build: ${__BUILD_INFO__.buildId} (${dateStr} ${timeStr})`;
  }
}

// Initialize app when DOM is loaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
