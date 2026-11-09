/**
 * Code / Document view switcher for renderable demo output formats.
 */

import { getDemoEditor } from "./codemirror-setup.ts";
import {
  documentRenderKind,
  editorHostIdForFormat,
  formatKeyFromEditorHostId,
  isRenderableOutputFormat,
  listRenderableOutputFormats,
} from "./output-render-sources.ts";
import {
  buildOptDocumentHtml,
  buildZipehrDocumentHtml,
  getOptCssSession,
  getZipehrCssSession,
  isOptHtml5Variant,
  isZipehrMarkupVariant,
  loadOptCssForVariant,
  loadZipehrCssForVariant,
  optCssSelectOptions,
  type HtmlCssSession,
  zipehrCssSelectOptions,
} from "./html-document-view-backend.ts";

const ICON_CODE =
  `<svg class="output-view-tab-icon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="m4.72 12.53 2.52-3.58L4.72 5.47a.75.75 0 0 1 1.06-1.06l3.12 3.18a.75.75 0 0 1 0 1.06l-3.12 3.18a.75.75 0 0 1-1.06-1.06Zm6.56-7.06a.75.75 0 0 0-1.06-1.06L7.1 7.65a.75.75 0 0 0 0 1.06l3.12 3.18a.75.75 0 1 0 1.06-1.06L8.31 8.53l2.97-3.06Z"/></svg>`;

const ICON_FILE =
  `<svg class="output-view-tab-icon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.772.513 1.237v9.586A1.75 1.75 0 0 1 13 16H3.75A1.75 1.75 0 0 1 2 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h9.5a.25.25 0 0 0 .25-.25V6h-2.75A1.75 1.75 0 0 1 9 4.25V1.5Z"/></svg>`;

type OutputViewMode = "code" | "document";

const sessionViewByFormat = new Map<string, OutputViewMode>();

type FormatViewState = {
  formatKey: string;
  root: HTMLElement;
  codePanel: HTMLElement;
  documentPanel: HTMLElement;
  frame: HTMLIFrameElement;
  codeTab: HTMLButtonElement;
  documentTab: HTMLButtonElement;
  htmlToolbar?: HTMLElement;
  cssTextarea?: HTMLTextAreaElement;
  cssSelect?: HTMLSelectElement;
};

const viewsByFormat = new Map<string, FormatViewState>();

function sandboxForKind(
  kind: ReturnType<typeof documentRenderKind>,
): string {
  if (kind === "html-opt") {
    return "allow-scripts allow-same-origin";
  }
  return "allow-same-origin";
}

function createViewTabs(formatKey: string): {
  bar: HTMLElement;
  codeTab: HTMLButtonElement;
  documentTab: HTMLButtonElement;
} {
  const bar = document.createElement("div");
  bar.className = "output-view-tabs";
  bar.setAttribute("role", "tablist");
  bar.setAttribute("aria-label", `View mode for ${formatKey}`);

  const codeTab = document.createElement("button");
  codeTab.type = "button";
  codeTab.className = "output-view-tab active";
  codeTab.setAttribute("role", "tab");
  codeTab.setAttribute("aria-selected", "true");
  codeTab.setAttribute("aria-label", "Code view");
  codeTab.dataset.view = "code";
  codeTab.innerHTML = `${ICON_CODE}<span>Code</span>`;

  const documentTab = document.createElement("button");
  documentTab.type = "button";
  documentTab.className = "output-view-tab";
  documentTab.setAttribute("role", "tab");
  documentTab.setAttribute("aria-selected", "false");
  documentTab.setAttribute("aria-label", "Document view");
  documentTab.dataset.view = "document";
  documentTab.innerHTML = `${ICON_FILE}<span>Document</span>`;

  bar.append(codeTab, documentTab);
  return { bar, codeTab, documentTab };
}

function createHtmlToolbar(
  family: "zipehr" | "opt",
  formatKey: string,
  cssTextarea: HTMLTextAreaElement,
  cssSelect: HTMLSelectElement,
): HTMLElement {
  const toolbar = document.createElement("div");
  toolbar.className = "output-document-html-toolbar";

  const label = document.createElement("label");
  label.className = "output-document-css-label";
  label.textContent = "Stylesheet:";
  label.htmlFor = `doc-css-select-${family}-${formatKey.replace(/\./g, "-")}`;

  cssSelect.className = "config-dropdown output-document-css-select";
  cssSelect.id = label.htmlFor;

  const options = family === "zipehr"
    ? zipehrCssSelectOptions()
    : optCssSelectOptions();
  for (const opt of options) {
    const el = document.createElement("option");
    el.value = opt.value;
    el.textContent = opt.label;
    if (opt.value === "custom") el.disabled = true;
    cssSelect.appendChild(el);
  }
  cssSelect.value = family === "zipehr"
    ? getZipehrCssSession().selectValue
    : getOptCssSession().selectValue;

  cssTextarea.className = "output-document-css-editor";
  cssTextarea.rows = 4;
  cssTextarea.spellcheck = false;
  cssTextarea.placeholder = "CSS for rendered HTML…";

  const session = family === "zipehr" ? getZipehrCssSession() : getOptCssSession();
  cssTextarea.value = session.loadedCssText || session.customCssText;

  toolbar.append(label, cssSelect);
  const details = document.createElement("details");
  details.className = "output-document-css-details";
  const summary = document.createElement("summary");
  summary.textContent = "Edit stylesheet";
  details.append(summary, cssTextarea);
  toolbar.append(details);

  return toolbar;
}

function wrapEditorHost(host: HTMLElement, formatKey: string): FormatViewState {
  const kind = documentRenderKind(formatKey);
  if (!kind) {
    throw new Error(`Not renderable: ${formatKey}`);
  }

  const parent = host.parentElement;
  if (!parent) throw new Error(`No parent for ${host.id}`);

  const { bar, codeTab, documentTab } = createViewTabs(formatKey);

  const panels = document.createElement("div");
  panels.className = "output-view-panels";

  const codePanel = document.createElement("div");
  codePanel.className = "output-view-panel output-view-panel--code";
  codePanel.dataset.view = "code";

  const documentPanel = document.createElement("div");
  documentPanel.className =
    "output-view-panel output-view-panel--document hidden";
  documentPanel.dataset.view = "document";

  const frame = document.createElement("iframe");
  frame.className = "output-document-frame";
  frame.title = `Document preview (${formatKey})`;
  frame.setAttribute("sandbox", sandboxForKind(kind));

  let htmlToolbar: HTMLElement | undefined;
  let cssTextarea: HTMLTextAreaElement | undefined;
  let cssSelect: HTMLSelectElement | undefined;

  if (kind === "html-zipehr" || kind === "html-opt") {
    cssTextarea = document.createElement("textarea");
    cssSelect = document.createElement("select");
    htmlToolbar = createHtmlToolbar(
      kind === "html-zipehr" ? "zipehr" : "opt",
      formatKey,
      cssTextarea,
      cssSelect,
    );
    documentPanel.append(htmlToolbar, frame);
  } else {
    documentPanel.append(frame);
  }

  const info = parent.querySelector(":scope > .output-info");
  if (info) {
    bar.classList.add("output-view-tabs--inline");
    info.append(bar);
  } else {
    parent.insertBefore(bar, host);
  }
  codePanel.append(host);
  panels.append(codePanel, documentPanel);
  parent.append(panels);

  parent.classList.add("has-output-document-view");

  const state: FormatViewState = {
    formatKey,
    root: parent,
    codePanel,
    documentPanel,
    frame,
    codeTab,
    documentTab,
    htmlToolbar,
    cssTextarea,
    cssSelect,
  };
  viewsByFormat.set(formatKey, state);

  const setMode = (mode: OutputViewMode) => {
    sessionViewByFormat.set(formatKey, mode);
    const isDoc = mode === "document";
    codePanel.classList.toggle("hidden", isDoc);
    documentPanel.classList.toggle("hidden", !isDoc);
    codeTab.classList.toggle("active", !isDoc);
    documentTab.classList.toggle("active", isDoc);
    codeTab.setAttribute("aria-selected", isDoc ? "false" : "true");
    documentTab.setAttribute("aria-selected", isDoc ? "true" : "false");
    if (isDoc) {
      void renderDocumentForFormat(formatKey, undefined);
    }
  };

  codeTab.addEventListener("click", () => setMode("code"));
  documentTab.addEventListener("click", () => setMode("document"));

  if (cssSelect && cssTextarea) {
    const family = kind === "html-zipehr" ? "zipehr" : "opt";
    const session = family === "zipehr" ? getZipehrCssSession() : getOptCssSession();

    const applyCssChange = () => {
      void renderDocumentForFormat(formatKey, undefined);
    };

    cssSelect.addEventListener("change", async () => {
      session.selectValue = cssSelect!.value;
      if (session.selectValue === "custom") {
        cssTextarea!.value = session.customCssText;
      } else if (isZipehrMarkupVariant(formatKey)) {
        await loadZipehrCssForVariant(formatKey, session);
        cssTextarea!.value = session.loadedCssText;
      } else if (isOptHtml5Variant(formatKey)) {
        await loadOptCssForVariant(formatKey, session);
        cssTextarea!.value = session.loadedCssText;
      }
      applyCssChange();
    });

    cssTextarea.addEventListener("input", () => {
      if (cssSelect!.value !== "custom" && cssSelect!.value !== "none") {
        session.selectValue = "custom";
        const customOpt = cssSelect!.querySelector(
          'option[value="custom"]',
        ) as HTMLOptionElement | null;
        if (customOpt) customOpt.disabled = false;
        cssSelect!.value = "custom";
      }
      session.customCssText = cssTextarea!.value;
      session.loadedCssText = cssTextarea!.value;
      applyCssChange();
    });
  }

  const initial = sessionViewByFormat.get(formatKey) ?? "code";
  setMode(initial);

  return state;
}

function enhanceEditorBlock(
  block: HTMLElement,
  formatKey: string,
  host: HTMLElement,
): void {
  if (!block.contains(host) || viewsByFormat.has(formatKey)) return;
  wrapEditorHost(host, formatKey);
}

function enhanceBareHost(host: HTMLElement, formatKey: string): void {
  if (viewsByFormat.has(formatKey)) return;
  const wrapper = document.createElement("div");
  wrapper.className = "editor-block";
  const parent = host.parentElement;
  if (!parent) return;
  parent.insertBefore(wrapper, host);
  const info = parent.querySelector(":scope > .output-info");
  if (info && info.parentElement === parent) {
    wrapper.append(info);
  }
  wrapper.append(host);
  wrapEditorHost(host, formatKey);
}

function wireOptHydrateListeners(): void {
  document.querySelectorAll('input[name="opt-html5-hydrate-mode"]').forEach(
    (el) => {
      el.addEventListener("change", () => {
        for (const key of [
          "opt.html5.short",
          "opt.html5.full",
          "opt.html5.emoji",
        ]) {
          void renderDocumentForFormat(key, undefined);
        }
      });
    },
  );
}

export function initOutputDocumentViews(): void {
  for (const formatKey of listRenderableOutputFormats()) {
    const hostId = editorHostIdForFormat(formatKey);
    const host = document.getElementById(hostId);
    if (!host) continue;

    const block = host.closest(".editor-block");
    if (block) {
      enhanceEditorBlock(block, formatKey, host);
    } else {
      enhanceBareHost(host, formatKey);
    }
  }
  wireOptHydrateListeners();
}

function getSourceText(
  formatKey: string,
  sourceOverride?: string,
): string {
  if (sourceOverride !== undefined) return sourceOverride;
  const hostId = editorHostIdForFormat(formatKey);
  return getDemoEditor(hostId)?.value ?? "";
}

export async function renderDocumentForFormat(
  formatKey: string,
  source?: string,
): Promise<void> {
  if (!isRenderableOutputFormat(formatKey)) return;
  const state = viewsByFormat.get(formatKey);
  if (!state) return;
  const mode = sessionViewByFormat.get(formatKey) ?? "code";
  if (mode !== "document") return;

  const text = getSourceText(formatKey, source);
  const kind = documentRenderKind(formatKey);
  if (!kind) return;

  try {
    let docHtml = "";
    if (kind === "markdown") {
      const { renderMarkdownDocumentHtml } = await import(
        "./output-document-view-markdown.ts"
      );
      docHtml = await renderMarkdownDocumentHtml(text);
    } else if (kind === "asciidoc") {
      const { renderAsciidocDocumentHtml } = await import(
        "./output-document-view-asciidoc.ts"
      );
      docHtml = await renderAsciidocDocumentHtml(text);
    } else if (kind === "html-zipehr" && isZipehrMarkupVariant(formatKey)) {
      const session = getZipehrCssSession();
      await loadZipehrCssForVariant(formatKey, session);
      if (state.cssTextarea && session.selectValue !== "custom") {
        state.cssTextarea.value = session.loadedCssText;
      }
      const css = state.cssTextarea?.value ?? session.loadedCssText;
      docHtml = buildZipehrDocumentHtml(text, css);
    } else if (kind === "html-opt" && isOptHtml5Variant(formatKey)) {
      const session = getOptCssSession();
      await loadOptCssForVariant(formatKey, session);
      if (state.cssTextarea && session.selectValue !== "custom") {
        state.cssTextarea.value = session.loadedCssText;
      }
      const css = state.cssTextarea?.value ?? session.loadedCssText;
      docHtml = buildOptDocumentHtml(text, css);
    }
    state.frame.srcdoc = docHtml;
  } catch (err) {
  const msg = err instanceof Error ? err.message : String(err);
    state.frame.srcdoc = `<!DOCTYPE html><html><body><p class="error">Document render failed: ${msg}</p></body></html>`;
    console.error("Document view render failed:", err);
  }
}

export function refreshActiveDocumentViews(
  getText: (formatKey: string) => string,
): void {
  for (const [formatKey, state] of viewsByFormat) {
    const mode = sessionViewByFormat.get(formatKey) ?? "code";
    if (mode !== "document") continue;
    if (!state.documentPanel.classList.contains("hidden")) {
      void renderDocumentForFormat(formatKey, getText(formatKey));
    }
  }
}

export function onHtmlOutputVariantChanged(
  formatKey: string,
  source: string,
): void {
  const session = isZipehrMarkupVariant(formatKey)
    ? getZipehrCssSession()
    : isOptHtml5Variant(formatKey)
    ? getOptCssSession()
    : undefined;
  if (session && session.selectValue === "default") {
    void (async () => {
      if (isZipehrMarkupVariant(formatKey)) {
        await loadZipehrCssForVariant(formatKey, session);
      } else if (isOptHtml5Variant(formatKey)) {
        await loadOptCssForVariant(formatKey, session as HtmlCssSession);
      }
      const state = viewsByFormat.get(formatKey);
      if (state?.cssTextarea && session.selectValue !== "custom") {
        state.cssTextarea.value = session.loadedCssText;
      }
      void renderDocumentForFormat(formatKey, source);
    })();
  } else {
    void renderDocumentForFormat(formatKey, source);
  }
}

export function outputDocumentViewShowsToggle(formatKey: string): boolean {
  return isRenderableOutputFormat(formatKey) &&
    viewsByFormat.has(formatKey);
}

export function getOutputViewMode(formatKey: string): OutputViewMode {
  return sessionViewByFormat.get(formatKey) ?? "code";
}

export function formatKeysWithDocumentToggle(): string[] {
  return [...viewsByFormat.keys()];
}

export function hostIdsForRenderIntegration(): string[] {
  return listRenderableOutputFormats().map(editorHostIdForFormat);
}

export function parseFormatFromHostId(hostId: string): string | undefined {
  return formatKeyFromEditorHostId(hostId);
}
