/**
 * ZipEHR / OPT HTML5 document iframe payloads and shared CSS session state.
 */

import {
  wrapOptHtml5PreviewDocument,
  type OptHydrateMode,
} from "../../../serialization/zipehr/opt_html5_hydrate.ts";

export type ZipehrMarkupVariant =
  | "zipehr.xhtml"
  | "zipehr.html5.short"
  | "zipehr.html5.full"
  | "zipehr.html5.emoji";

export type OptHtml5Variant =
  | "opt.html5.short"
  | "opt.html5.full"
  | "opt.html5.emoji";

const ZIP_DEFAULT_CSS: Record<ZipehrMarkupVariant, string> = {
  "zipehr.xhtml": "zipehr-xhtml.css",
  "zipehr.html5.short": "zipehr-html5-short.css",
  "zipehr.html5.full": "zipehr-html5-full.css",
  "zipehr.html5.emoji": "zipehr-html5-emoji.css",
};

const OPT_DEFAULT_CSS: Record<OptHtml5Variant, string> = {
  "opt.html5.short": "opt-html5-short.css",
  "opt.html5.full": "opt-html5-full.css",
  "opt.html5.emoji": "opt-html5-emoji.css",
};

const CSS_BASE = "zipehr-css";
const cssCache = new Map<string, string>();

export type HtmlCssSession = {
  selectValue: string;
  customCssText: string;
  loadedCssText: string;
};

const zipehrCssSession: HtmlCssSession = {
  selectValue: "default",
  customCssText: "",
  loadedCssText: "",
};

const optCssSession: HtmlCssSession = {
  selectValue: "default",
  customCssText: "",
  loadedCssText: "",
};

export function isZipehrMarkupVariant(v: string): v is ZipehrMarkupVariant {
  return v in ZIP_DEFAULT_CSS;
}

export function isOptHtml5Variant(v: string): v is OptHtml5Variant {
  return v in OPT_DEFAULT_CSS;
}

async function fetchCssFile(filename: string): Promise<string> {
  const cached = cssCache.get(filename);
  if (cached !== undefined) return cached;
  const res = await fetch(`${CSS_BASE}/${filename}`);
  if (!res.ok) throw new Error(`Failed to load ${filename}: ${res.status}`);
  const text = await res.text();
  cssCache.set(filename, text);
  return text;
}

function resolveCssFilename(
  variant: string,
  defaults: Record<string, string>,
  selectValue: string,
): string | null {
  if (selectValue === "none" || selectValue === "custom") return null;
  if (selectValue === "default") {
    return defaults[variant] ?? null;
  }
  return selectValue;
}

export async function loadZipehrCssForVariant(
  variant: ZipehrMarkupVariant,
  session = zipehrCssSession,
): Promise<string> {
  const select = session.selectValue;
  if (select === "none") {
    session.loadedCssText = "";
    return "";
  }
  if (select === "custom") {
    session.loadedCssText = session.customCssText;
    return session.loadedCssText;
  }
  const file = resolveCssFilename(variant, ZIP_DEFAULT_CSS, select);
  if (!file) {
    session.loadedCssText = "";
    return "";
  }
  session.loadedCssText = await fetchCssFile(file);
  return session.loadedCssText;
}

export async function loadOptCssForVariant(
  variant: OptHtml5Variant,
  session = optCssSession,
): Promise<string> {
  const select = session.selectValue;
  if (select === "none") {
    session.loadedCssText = "";
    return "";
  }
  if (select === "custom") {
    session.loadedCssText = session.customCssText;
    return session.loadedCssText;
  }
  const file = resolveCssFilename(variant, OPT_DEFAULT_CSS, select);
  if (!file) {
    session.loadedCssText = "";
    return "";
  }
  session.loadedCssText = await fetchCssFile(file);
  return session.loadedCssText;
}

export function buildZipehrDocumentHtml(
  markup: string,
  css: string,
): string {
  const body = markup.trim() || "<!-- empty ZipEHR markup -->";
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

export function readOptHydrateMode(): OptHydrateMode {
  const checked = document.querySelector(
    'input[name="opt-html5-hydrate-mode"]:checked',
  ) as HTMLInputElement | null;
  const v = checked?.value;
  return v === "all" || v === "focus" ? v : "off";
}

export function buildOptDocumentHtml(markup: string, css: string): string {
  return wrapOptHtml5PreviewDocument(markup, css, {
    hydrateMode: readOptHydrateMode(),
  });
}

export function getZipehrCssSession(): HtmlCssSession {
  return zipehrCssSession;
}

export function getOptCssSession(): HtmlCssSession {
  return optCssSession;
}

export function zipehrCssSelectOptions(): { value: string; label: string }[] {
  return [
    { value: "default", label: "Default for dialect" },
    { value: "zipehr-xhtml.css", label: "zipehr-xhtml.css" },
    { value: "zipehr-html5-short.css", label: "zipehr-html5-short.css" },
    { value: "zipehr-html5-full.css", label: "zipehr-html5-full.css" },
    { value: "zipehr-html5-emoji.css", label: "zipehr-html5-emoji.css" },
    { value: "none", label: "None" },
    { value: "custom", label: "Custom" },
  ];
}

export function optCssSelectOptions(): { value: string; label: string }[] {
  return [
    { value: "default", label: "Default for dialect" },
    { value: "opt-html5-short.css", label: "opt-html5-short.css" },
    { value: "opt-html5-full.css", label: "opt-html5-full.css" },
    { value: "opt-html5-emoji.css", label: "opt-html5-emoji.css" },
    { value: "none", label: "None" },
    { value: "custom", label: "Custom" },
  ];
}
