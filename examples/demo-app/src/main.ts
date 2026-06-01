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
  type ConversionOptions,
  convert,
  getAsciidocConfigPreset,
  getJsonConfigPreset,
  getJsonDeserializeConfigPreset,
  getMarkdownConfigPreset,
  getYamlConfigPreset,
  getYamlDeserializeConfigPreset,
  initializeTypeRegistry,
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
import { TemplateWorkspace } from "../../../enhanced/parser/template_workspace.ts";

// Application state
let currentInputFormat = "json";
let currentInputTab: InputMode = "instance";
let currentOutputs: any = {};
let autoConvertEnabled = true;
let autoConvertDebounceTimer: ReturnType<typeof setTimeout> | undefined;
const AUTO_CONVERT_DEBOUNCE_MS = 350;

/** In-browser template/archetype file set (ADL2 + legacy OPT/OET). */
const templateWorkspace = new TemplateWorkspace();

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

  setupEventListeners();
  updateAutoConvertButtonUi();

  // Load default example (triggers debounced auto-convert via handleInputChange)
  loadExample("section");
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

  // Input textarea
  const inputTextarea = document.getElementById(
    "input-text",
  ) as HTMLTextAreaElement;
  if (inputTextarea) {
    inputTextarea.addEventListener(
      "input",
      () => handleInputChange("instance"),
    );
  }

  const templateTextarea = document.getElementById(
    "template-input-text",
  ) as HTMLTextAreaElement;
  if (templateTextarea) {
    templateTextarea.addEventListener(
      "input",
      () => handleInputChange("template"),
    );
  }

  // Input line-wrap toggle (default: false => wrapping enabled = unchecked)
  const inputDisableLinebreaks = document.getElementById(
    "input-disable-linebreaks",
  ) as HTMLInputElement;
  if (inputDisableLinebreaks) {
    // apply initial state
    applyTextareaLineWrap("input-text", !!inputDisableLinebreaks.checked);
    inputDisableLinebreaks.addEventListener("change", () => {
      applyTextareaLineWrap("input-text", !!inputDisableLinebreaks.checked);
      // update counts/layout as necessary
      handleInputChange();
    });
  }

  const templateDisableLinebreaks = document.getElementById(
    "template-disable-linebreaks",
  ) as HTMLInputElement;
  if (templateDisableLinebreaks) {
    applyTextareaLineWrap(
      "template-input-text",
      !!templateDisableLinebreaks.checked,
    );
    templateDisableLinebreaks.addEventListener("change", () => {
      applyTextareaLineWrap(
        "template-input-text",
        !!templateDisableLinebreaks.checked,
      );
      handleInputChange("template");
    });
  }

  const autoConvertBtn = document.getElementById("auto-convert-btn");
  if (autoConvertBtn) {
    autoConvertBtn.addEventListener("click", toggleAutoConvert);
  }

  const outputPanelBody = document.querySelector(".output-panel .panel-body");
  const inputPanelBody = document.querySelector(".input-panel .panel-body");
  if (outputPanelBody) {
    outputPanelBody.addEventListener("change", (e) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains("output-disable-linebreaks")) {
        const checked = (target as HTMLInputElement).checked;
        document.querySelectorAll(".output-disable-linebreaks").forEach(
          (cb) => {
            (cb as HTMLInputElement).checked = checked;
          },
        );
        applyOutputLineWrap(checked);
      }
      scheduleAutoConvert();
    });
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
    "markdown",
    "asciidoc",
    "typescript",
    "flat",
    "structured",
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
  return activeTab?.getAttribute("data-tab") || "json";
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
  const textarea = document.getElementById("template-input-text") as
    | HTMLTextAreaElement
    | null;
  const tabsScroll = document.getElementById("template-file-tabs-scroll");
  if (!uploadBtn || !fileInput || !textarea) return;

  uploadBtn.addEventListener("click", () => fileInput.click());

  tabsScroll?.addEventListener("change", (e) => {
    const target = e.target as HTMLInputElement;
    if (
      target.name === "template-generation-root" &&
      target.type === "radio" &&
      target.checked
    ) {
      templateWorkspace.setGenerationRootPath(target.value);
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

  textarea.addEventListener("input", () => {
    const path = templateWorkspace.getActivePath();
    if (path) {
      templateWorkspace.addFile(path, textarea.value);
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
          const lower = entryName.toLowerCase();
          if (
            /\.(opt|oet|adl|adls|xml)$/.test(lower) &&
            !lower.includes("__macosx")
          ) {
            const path = entryName.replace(/\\/g, "/").replace(/^\/+/, "");
            batch.push({ path, content: strFromU8(data) });
          }
        }
        if (batch.length) {
          templateWorkspace.addFiles(batch);
          lastPath = batch[batch.length - 1]?.path;
        }
        continue;
      }
      if (/\.(opt|oet|adl|adls|xml)$/.test(name)) {
        templateWorkspace.addFile(file.name, await file.text());
        lastPath = file.name;
      }
    }

    if (templateWorkspace.listFiles().length) {
      const root = TemplateWorkspace.suggestGenerationRoot(
        templateWorkspace.listFiles(),
      );
      if (root) templateWorkspace.setGenerationRootPath(root);
      selectTemplateFileTab(
        lastPath ?? root ?? templateWorkspace.getActivePath() ?? "",
      );
      activateInputTab("template");
      handleInputChange("template");
    }
    fileInput.value = "";
  });
}

function selectTemplateFileTab(path: string) {
  if (!path) return;
  const textarea = document.getElementById('template-input-text') as HTMLTextAreaElement | null;
  templateWorkspace.setActivePath(path);
  const file = templateWorkspace.getFile(path);
  if (textarea && file) textarea.value = file.content;
  updateTemplateFileSetUi();
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

  const files = templateWorkspace.listFiles();
  const active = templateWorkspace.getActivePath();
  const generationRoot = templateWorkspace.getGenerationRootPath();

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
    const nArch = templateWorkspace.repository.listIds().length;
    const nTpl = templateWorkspace.repository.listTemplateIds().length;
    const rootLabel = generationRoot ? generationRoot.split('/').pop() : '—';
    summary.textContent = files.length
      ? `${files.length} files · ${nArch} archetypes · ${nTpl} templates · root: ${rootLabel}`
      : '';
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
  document.querySelectorAll(".input-toolbar").forEach((toolbar) => {
    const el = toolbar as HTMLElement;
    el.classList.toggle(
      "active",
      el.getAttribute("data-input-toolbar") === mode,
    );
  });
  currentInputTab = mode;
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
  const copyBtn = document.getElementById("copy-output");
  const downloadBtn = document.getElementById("download-output");

  if (copyBtn) {
    copyBtn.addEventListener(
      "click",
      () => copyToClipboard(getActiveOutputFormat()),
    );
  }

  if (downloadBtn) {
    downloadBtn.addEventListener(
      "click",
      () => downloadOutput(getActiveOutputFormat()),
    );
  }
}

/**
 * Handle input format change
 */
function handleInputFormatChange(e: Event) {
  currentInputFormat = (e.target as HTMLSelectElement).value;
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

  const inputTextarea = document.getElementById(
    "input-text",
  ) as HTMLTextAreaElement;
  const formatSelect = document.getElementById(
    "input-format",
  ) as HTMLSelectElement;

  if (inputTextarea && formatSelect) {
    activateInputTab("instance");
    // Load the appropriate format
    const format = formatSelect.value;
    inputTextarea.value = example[format as keyof typeof example] as string ||
      example.json;
    currentInputFormat = format;

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
    const inputTextarea = document.getElementById(
      "input-text",
    ) as HTMLTextAreaElement;
    if (inputTextarea) {
      activateInputTab("instance");
      inputTextarea.value = text;
      handleInputChange("instance");

      // Try to detect format from file extension
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (ext === "xml" || ext === "json" || ext === "yaml" || ext === "yml") {
        const formatSelect = document.getElementById(
          "input-format",
        ) as HTMLSelectElement;
        if (formatSelect) {
          formatSelect.value = ext === "yml" ? "yaml" : ext;
          currentInputFormat = formatSelect.value;
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
  const textarea = getCurrentInputTextarea();
  if (textarea) {
    textarea.value = "";
    if (currentInputTab === "template") {
      templateWorkspace.clear();
      updateTemplateFileSetUi();
    }
    handleInputChange(currentInputTab);
  }
}

function getInputTextarea(mode: InputMode): HTMLTextAreaElement | null {
  const id = mode === "template" ? "template-input-text" : "input-text";
  return document.getElementById(id) as HTMLTextAreaElement | null;
}

function getCurrentInputTextarea(): HTMLTextAreaElement | null {
  return getInputTextarea(currentInputTab);
}

/**
 * Handle input text change
 */
function handleInputChange(tab: InputMode = currentInputTab) {
  const inputTextarea = getInputTextarea(tab);
  if (!inputTextarea) return;

  const text = inputTextarea.value;

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
  const inputTextarea = getCurrentInputTextarea();
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

  if (!inputTextarea || !validationIcon || !validationText) return;

  const text = inputTextarea.value.trim();
  if (!text) {
    validationIcon.textContent = "radio_button_unchecked";
    validationIcon.className = "material-icons status-icon";
    validationText.textContent = "Empty";
    return;
  }

  // Simple format validation
  try {
    if (currentInputTab === "template") {
      const templateValidation = validateTemplateInput(text, templateWorkspace);
      if (!templateValidation.valid) {
        throw new Error(templateValidation.message);
      }
      validationIcon.textContent = "check";
      validationIcon.className = "material-icons status-icon valid";
      validationText.textContent = templateValidation.message;
      return;
    }

    if (currentInputFormat === "json") {
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
  console.log("🔄 Converting...");
  showLoading();
  hideError();

  try {
    const inputTextarea = getCurrentInputTextarea();
    if (!inputTextarea) throw new Error("Input textarea not found");

    const inputText = inputTextarea.value.trim();
    if (!inputText) throw new Error("Input is empty");

    // Gather conversion options from UI
    const options = gatherConversionOptions();

    // Perform conversion
    const result = await convert(inputText, options);

    hideLoading();

    if (!result.success) {
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
    showError((error as Error).message);
  }
}

/**
 * Gather conversion options from UI controls
 */
function gatherConversionOptions(): ConversionOptions {
  const inputMode = currentInputTab;

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

  // Output formats
  const outputFormats: OutputFormat[] = [];
  if ((document.getElementById("output-xml") as HTMLInputElement)?.checked) {
    outputFormats.push("xml");
  }
  if ((document.getElementById("output-json") as HTMLInputElement)?.checked) {
    outputFormats.push("json");
  }
  if ((document.getElementById("output-yaml") as HTMLInputElement)?.checked) {
    outputFormats.push("yaml");
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
  if ((document.getElementById("output-flat") as HTMLInputElement)?.checked) {
    outputFormats.push("flat");
  }
  if (
    (document.getElementById("output-structured") as HTMLInputElement)?.checked
  ) {
    outputFormats.push("structured");
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
      ?.value || "default";
  const yamlConfig = getYamlConfigPreset(yamlConfigPreset);
  const yamlArchIdLoc =
    (document.getElementById("yaml-arch-id-location") as HTMLSelectElement)
      ?.value as any;
  if (yamlArchIdLoc) yamlConfig.archetypeNodeIdLocation = yamlArchIdLoc;

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
  };

  return {
    inputMode,
    inputFormat,
    inputDeserializerConfig,
    outputFormats,
    templateGenerationMode,
    jsonSerializerType,
    jsonConfig,
    yamlConfig,
    markdownConfig,
    asciidocConfig,
    xmlConfig,
    typescriptConfig,
    templateWorkspace,
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
    "markdown",
    "asciidoc",
    "typescript",
    "flat",
    "structured",
    "webtemplate",
  ];

  outputFormats.forEach((format) => {
    const content = document.getElementById(`output-${format}-content`);
    if (content) {
      content.textContent = outputs[format] ?? "";
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
  updateOutputInfo();
}

/**
 * Apply or remove textarea line-wrapping disabling
 */
function applyTextareaLineWrap(textareaId: string, disable: boolean) {
  const textarea = document.getElementById(textareaId) as HTMLTextAreaElement;
  if (!textarea) return;
  if (disable) {
    textarea.classList.add("no-linebreak");
    textarea.setAttribute("wrap", "off");
    textarea.style.whiteSpace = "pre";
  } else {
    textarea.classList.remove("no-linebreak");
    textarea.setAttribute("wrap", "soft");
    textarea.style.whiteSpace = "";
  }
}

/**
 * Apply or remove output pre elements line-wrapping disabling
 */
function applyOutputLineWrap(disable: boolean) {
  const outputs = document.querySelectorAll(".output-content");
  outputs.forEach((o) => {
    const el = o as HTMLElement;
    if (disable) {
      el.classList.add("no-linebreak");
      el.style.whiteSpace = "pre";
      el.style.wordWrap = "normal";
    } else {
      el.classList.remove("no-linebreak");
      el.style.whiteSpace = "";
      el.style.wordWrap = "";
    }
  });
}

/**
 * Update output info panel (characters and lines) for active output tab
 */
function updateOutputInfo() {
  const tabName = getActiveOutputFormat();
  const pane = document.getElementById(`tab-${tabName}`);
  const outputChar = pane?.querySelector(".output-char-count");
  const outputLine = pane?.querySelector(".output-line-count");
  const outputDisable = pane?.querySelector(".output-disable-linebreaks") as
    | HTMLInputElement
    | null;

  if (!pane || !outputChar || !outputLine) return;

  const contentElem = document.getElementById(`output-${tabName}-content`);
  if (!contentElem) return;

  const text = contentElem.textContent || "";
  outputChar.textContent = String(text.length);
  outputLine.textContent = String(text.split("\n").length);

  if (outputDisable) {
    applyOutputLineWrap(!!outputDisable.checked);
  }
}

const outputDisableCheckbox = document.getElementById(
  "output-disable-linebreaks",
) as HTMLInputElement | null;
if (outputDisableCheckbox) {
  applyOutputLineWrap(!!outputDisableCheckbox.checked);
}

/**
 * Copy output to clipboard
 */
async function copyToClipboard(format: string) {
  const outputElement = document.getElementById(`output-${format}-content`);
  if (!outputElement) {
    console.error("Output element not found:", format);
    return;
  }

  const text = outputElement.textContent || "";

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
  const outputElement = document.getElementById(`output-${format}-content`);
  if (!outputElement) {
    console.error("Output element not found:", format);
    return;
  }

  const text = outputElement.textContent || "";
  const extensions: Record<string, string> = {
    xml: "xml",
    json: "json",
    yaml: "yaml",
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
