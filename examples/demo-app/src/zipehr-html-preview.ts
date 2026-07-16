/**
 * ZipEHR (x)HTML browser preview: CSS picker, small editor, iframe + popup sync.
 */

import {
  createDemoEditor,
  getDemoEditor,
  type DemoEditor,
} from "./codemirror-setup.ts";

export type ZipehrMarkupVariant =
  | "zipehr.xhtml"
  | "zipehr.html5.short"
  | "zipehr.html5.full"
  | "zipehr.html5.emoji";

const DEFAULT_CSS_BY_VARIANT: Record<ZipehrMarkupVariant, string> = {
  "zipehr.xhtml": "zipehr-xhtml.css",
  "zipehr.html5.short": "zipehr-html5-short.css",
  "zipehr.html5.full": "zipehr-html5-full.css",
  "zipehr.html5.emoji": "zipehr-html5-emoji.css",
};

const CSS_BASE = "zipehr-css";

const cssCache = new Map<string, string>();
let customCssText = "";
let cssEditor: DemoEditor | null = null;
let previewPopup: Window | null = null;
let syncTimer: ReturnType<typeof setTimeout> | undefined;
let loadingCss = false;
let suppressCssEditorSync = false;

function isMarkupVariant(v: string): v is ZipehrMarkupVariant {
  return v in DEFAULT_CSS_BY_VARIANT;
}

function previewRoot(): HTMLElement | null {
  return document.getElementById("zipehr-html-preview");
}

function cssSelect(): HTMLSelectElement | null {
  return document.getElementById("zipehr-css-select") as HTMLSelectElement | null;
}

function previewFrame(): HTMLIFrameElement | null {
  return document.getElementById(
    "zipehr-preview-frame",
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
  variant: ZipehrMarkupVariant,
  selectValue: string,
): string | null {
  if (selectValue === "none") return null;
  if (selectValue === "custom") return null;
  if (selectValue === "default") return DEFAULT_CSS_BY_VARIANT[variant];
  return selectValue;
}

async function loadCssIntoEditor(
  variant: ZipehrMarkupVariant,
): Promise<void> {
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
    // Allow one tick so CM6 settles before re-enabling sync.
    queueMicrotask(() => {
      suppressCssEditorSync = false;
    });
  }
}

function buildPreviewDocument(html: string, css: string): string {
  const body = html.trim() || "<!-- empty ZipEHR markup -->";
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>ZipEHR preview</title>
<style>
${css}
</style>
</head>
<body>
${body}
</body>
</html>`;
}

function writeToWindow(win: Window, docHtml: string): void {
  try {
    win.document.open();
    win.document.write(docHtml);
    win.document.close();
  } catch (err) {
    console.warn("ZipEHR preview write failed:", err);
  }
}

function syncPreviewNow(html: string): void {
  const css = cssEditor?.value ?? "";
  const docHtml = buildPreviewDocument(html, css);
  const frame = previewFrame();
  if (frame) {
    // srcdoc is the reliable same-origin path for sandboxed iframes.
    frame.srcdoc = docHtml;
  }
  if (previewPopup && !previewPopup.closed) {
    writeToWindow(previewPopup, docHtml);
  } else {
    previewPopup = null;
  }
}

function schedulePreviewSync(getHtml: () => string): void {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    syncPreviewNow(getHtml());
  }, 120);
}

export function setZipehrHtmlPreviewVisible(visible: boolean): void {
  previewRoot()?.classList.toggle("hidden", !visible);
}

export async function refreshZipehrHtmlPreview(options: {
  variant: string;
  html: string;
  forceReloadCss?: boolean;
}): Promise<void> {
  if (!isMarkupVariant(options.variant)) {
    setZipehrHtmlPreviewVisible(false);
    return;
  }
  setZipehrHtmlPreviewVisible(true);
  if (options.forceReloadCss || !cssEditor?.value) {
    await loadCssIntoEditor(options.variant);
  }
  syncPreviewNow(options.html);
}

export function initZipehrHtmlPreview(options: {
  getActiveVariant: () => string;
  getActiveHtml: () => string;
}): void {
  const host = document.getElementById("zipehr-css-editor");
  if (host && !getDemoEditor("zipehr-css-editor")) {
    cssEditor = createDemoEditor(host, {
      readOnly: false,
      language: "plain",
      placeholderText: "CSS for the rendered ZipEHR preview…",
      compact: true,
    });
    cssEditor.onChange(() => {
      if (suppressCssEditorSync || loadingCss) return;
      const select = cssSelect();
      if (select && select.value !== "custom" && select.value !== "none") {
        // User edited a shipped default → treat as custom session stylesheet.
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
    cssEditor = getDemoEditor("zipehr-css-editor");
  }

  const select = cssSelect();
  select?.addEventListener("change", async () => {
    const variant = options.getActiveVariant();
    if (!isMarkupVariant(variant)) return;
    await loadCssIntoEditor(variant);
    syncPreviewNow(options.getActiveHtml());
  });

  const uploadBtn = document.getElementById("zipehr-css-upload-btn");
  const fileInput = document.getElementById(
    "zipehr-css-file-input",
  ) as HTMLInputElement | null;
  uploadBtn?.addEventListener("click", () => fileInput?.click());
  fileInput?.addEventListener("change", async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    customCssText = await file.text();
    const sel = cssSelect();
    if (sel) {
      const customOpt = sel.querySelector(
        'option[value="custom"]',
      ) as HTMLOptionElement | null;
      if (customOpt) {
        customOpt.disabled = false;
        customOpt.textContent = `Custom (${file.name})`;
      }
      sel.value = "custom";
    }
    if (cssEditor) {
      suppressCssEditorSync = true;
      cssEditor.value = customCssText;
      queueMicrotask(() => {
        suppressCssEditorSync = false;
      });
    }
    syncPreviewNow(options.getActiveHtml());
    fileInput.value = "";
  });

  const popupBtn = document.getElementById("zipehr-preview-popup-btn");
  popupBtn?.addEventListener("click", () => {
    if (previewPopup && !previewPopup.closed) {
      previewPopup.focus();
      syncPreviewNow(options.getActiveHtml());
      return;
    }
    previewPopup = window.open(
      "",
      "zipehr-html-preview",
      "noopener,noreferrer,width=720,height=900",
    );
    if (previewPopup) {
      syncPreviewNow(options.getActiveHtml());
    }
  });

  // Initial load for current dialect when preview is shown later.
  const variant = options.getActiveVariant();
  if (isMarkupVariant(variant)) {
    void loadCssIntoEditor(variant).then(() => {
      syncPreviewNow(options.getActiveHtml());
    });
  }
}

export function onZipehrMarkupVariantChanged(
  variant: string,
  html: string,
): void {
  if (!isMarkupVariant(variant)) {
    setZipehrHtmlPreviewVisible(false);
    return;
  }
  setZipehrHtmlPreviewVisible(true);
  const select = cssSelect();
  // When switching dialect, snap back to "default for dialect" unless custom.
  if (select && select.value !== "custom") {
    select.value = "default";
  }
  void loadCssIntoEditor(variant).then(() => syncPreviewNow(html));
}

export function defaultCssFilenameFor(
  variant: ZipehrMarkupVariant,
): string {
  return DEFAULT_CSS_BY_VARIANT[variant];
}
