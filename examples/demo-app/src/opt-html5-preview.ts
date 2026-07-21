/**
 * OPT HTML5 browser preview: CSS + hydrate mode, iframe sync.
 */

import {
  wrapOptHtml5PreviewDocument,
  type OptHydrateMode,
} from "../../../enhanced/serialization/zipehr/opt_html5_hydrate.ts";
import {
  createDemoEditor,
  getDemoEditor,
  type DemoEditor,
} from "./codemirror-setup.ts";

export type OptHtml5Variant =
  | "opt.html5.short"
  | "opt.html5.full"
  | "opt.html5.emoji";

const DEFAULT_CSS_BY_VARIANT: Record<OptHtml5Variant, string> = {
  "opt.html5.short": "opt-html5-short.css",
  "opt.html5.full": "opt-html5-full.css",
  "opt.html5.emoji": "opt-html5-emoji.css",
};

const CSS_BASE = "zipehr-css";
const cssCache = new Map<string, string>();
let customCssText = "";
let cssEditor: DemoEditor | null = null;
let previewPopup: Window | null = null;
let syncTimer: ReturnType<typeof setTimeout> | undefined;
let loadingCss = false;
let suppressCssEditorSync = false;
let hydrateMode: OptHydrateMode = "off";

function isOptVariant(v: string): v is OptHtml5Variant {
  return v in DEFAULT_CSS_BY_VARIANT;
}

function previewRoot(): HTMLElement | null {
  return document.getElementById("opt-html5-preview");
}

function cssSelect(): HTMLSelectElement | null {
  return document.getElementById(
    "opt-html5-css-select",
  ) as HTMLSelectElement | null;
}

function previewFrame(): HTMLIFrameElement | null {
  return document.getElementById(
    "opt-html5-preview-frame",
  ) as HTMLIFrameElement | null;
}

async function fetchDefaultCss(filename: string): Promise<string> {
  const cached = cssCache.get(filename);
  if (cached !== undefined) return cached;
  const res = await fetch(`${CSS_BASE}/${filename}`);
  if (!res.ok) {
    throw new Error(`Failed to load ${filename}: ${res.status}`);
  }
  const text = await res.text();
  cssCache.set(filename, text);
  return text;
}

function resolveCssFilename(
  variant: OptHtml5Variant,
  selectValue: string,
): string | null {
  if (selectValue === "none" || selectValue === "custom") return null;
  if (selectValue === "default") return DEFAULT_CSS_BY_VARIANT[variant];
  return selectValue;
}

async function loadCssIntoEditor(variant: OptHtml5Variant): Promise<void> {
  if (!cssEditor) return;
  const select = cssSelect();
  const value = select?.value ?? "default";
  loadingCss = true;
  suppressCssEditorSync = true;
  try {
    if (value === "none") {
      cssEditor.value = "/* No stylesheet */\n";
      return;
    }
    if (value === "custom") {
      cssEditor.value = customCssText || "/* Upload a CSS file */\n";
      return;
    }
    const file = resolveCssFilename(variant, value);
    if (!file) {
      cssEditor.value = "";
      return;
    }
    cssEditor.value = await fetchDefaultCss(file);
  } catch (err) {
    cssEditor.value = `/* Error loading CSS: ${
      err instanceof Error ? err.message : String(err)
    } */\n`;
  } finally {
    loadingCss = false;
    queueMicrotask(() => {
      suppressCssEditorSync = false;
    });
  }
}

function syncPreviewNow(html: string): void {
  const css = cssEditor?.value ?? "";
  const docHtml = wrapOptHtml5PreviewDocument(html, css, { hydrateMode });
  const frame = previewFrame();
  if (frame) frame.srcdoc = docHtml;
  if (previewPopup && !previewPopup.closed) {
    try {
      previewPopup.document.open();
      previewPopup.document.write(docHtml);
      previewPopup.document.close();
    } catch (err) {
      console.warn("OPT HTML5 preview write failed:", err);
    }
  } else {
    previewPopup = null;
  }
}

function schedulePreviewSync(getHtml: () => string): void {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => syncPreviewNow(getHtml()), 120);
}

export function setOptHtml5PreviewVisible(visible: boolean): void {
  previewRoot()?.classList.toggle("hidden", !visible);
}

export async function refreshOptHtml5Preview(options: {
  variant: string;
  html: string;
  forceReloadCss?: boolean;
}): Promise<void> {
  if (!isOptVariant(options.variant)) {
    setOptHtml5PreviewVisible(false);
    return;
  }
  setOptHtml5PreviewVisible(true);
  if (options.forceReloadCss || !cssEditor?.value) {
    await loadCssIntoEditor(options.variant);
  }
  syncPreviewNow(options.html);
}

export function initOptHtml5Preview(options: {
  getActiveVariant: () => string;
  getActiveHtml: () => string;
}): void {
  const host = document.getElementById("opt-html5-css-editor");
  if (host && !getDemoEditor("opt-html5-css-editor")) {
    cssEditor = createDemoEditor(host, {
      readOnly: false,
      language: "plain",
      placeholderText: "CSS for the rendered OPT HTML5 preview…",
      compact: true,
    });
    cssEditor.onChange(() => {
      if (suppressCssEditorSync || loadingCss) return;
      const select = cssSelect();
      if (select && select.value !== "custom" && select.value !== "none") {
        customCssText = cssEditor?.value ?? "";
        const customOpt = select.querySelector(
          'option[value="custom"]',
        ) as HTMLOptionElement | null;
        if (customOpt) customOpt.disabled = false;
        select.value = "custom";
      } else if (select?.value === "custom") {
        customCssText = cssEditor?.value ?? "";
      }
      schedulePreviewSync(options.getActiveHtml);
    });
  } else {
    cssEditor = getDemoEditor("opt-html5-css-editor");
  }

  cssSelect()?.addEventListener("change", async () => {
    const variant = options.getActiveVariant();
    if (!isOptVariant(variant)) return;
    await loadCssIntoEditor(variant);
    syncPreviewNow(options.getActiveHtml());
  });

  document.querySelectorAll('input[name="opt-html5-hydrate-mode"]').forEach(
    (el) => {
      el.addEventListener("change", () => {
        const checked = document.querySelector(
          'input[name="opt-html5-hydrate-mode"]:checked',
        ) as HTMLInputElement | null;
        const v = checked?.value;
        hydrateMode = v === "all" || v === "focus" ? v : "off";
        syncPreviewNow(options.getActiveHtml());
      });
    },
  );

  document.getElementById("opt-html5-preview-popup-btn")?.addEventListener(
    "click",
    () => {
      if (previewPopup && !previewPopup.closed) {
        previewPopup.focus();
        syncPreviewNow(options.getActiveHtml());
        return;
      }
      previewPopup = window.open(
        "",
        "opt-html5-preview",
        "noopener,noreferrer,width=720,height=900",
      );
      if (previewPopup) syncPreviewNow(options.getActiveHtml());
    },
  );

  const variant = options.getActiveVariant();
  if (isOptVariant(variant)) {
    void loadCssIntoEditor(variant).then(() => {
      syncPreviewNow(options.getActiveHtml());
    });
  }
}

export function onOptHtml5VariantChanged(variant: string, html: string): void {
  if (!isOptVariant(variant)) {
    setOptHtml5PreviewVisible(false);
    return;
  }
  setOptHtml5PreviewVisible(true);
  const select = cssSelect();
  if (select && select.value !== "custom") select.value = "default";
  void loadCssIntoEditor(variant).then(() => syncPreviewNow(html));
}
