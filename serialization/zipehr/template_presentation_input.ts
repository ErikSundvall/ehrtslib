/**
 * Resolve ZipEHR HTML5 template presentation input (OPT / Web Template / ADL2).
 */

import * as openehr_am from "../../am/openehr_am.ts";
import type { ArchetypeRepository } from "../../parser/legacy/archetype_repository.ts";
import {
  detectTemplateInputFormat,
  parseTemplateInput,
} from "../../parser/legacy/parse_template_input.ts";
import { isOptXml, parseOptXml } from "../../parser/legacy/opt_xml_parser.ts";
import { buildWebTemplate } from "../simplified/web_template_builder.ts";
import { parseWebTemplate } from "../simplified/web_template_parser.ts";
import type { OptPathAnnotationMap } from "../../generation/opt_l10n.ts";
import type { WebTemplate } from "../simplified/types.ts";
import { languageCode } from "../../generation/term_codes.ts";

export type ZipEhrTemplatePresentationSource =
  | string
  | WebTemplate
  | openehr_am.OPERATIONAL_TEMPLATE
  | {
    operationalTemplate: openehr_am.OPERATIONAL_TEMPLATE;
    webTemplate?: WebTemplate;
    renderLang?: string;
    pathAnnotations?: OptPathAnnotationMap;
  };

export type ZipEhrTemplatePresentationContext = {
  operationalTemplate: openehr_am.OPERATIONAL_TEMPLATE;
  webTemplate: WebTemplate;
  renderLang: string;
  pathAnnotations?: OptPathAnnotationMap;
};

function isOperationalTemplate(value: unknown): value is openehr_am.OPERATIONAL_TEMPLATE {
  if (value == null || typeof value !== "object") return false;
  const rec = value as Record<string, unknown>;
  return rec._type === "OPERATIONAL_TEMPLATE" ||
    (typeof rec.template_id === "object" && rec.definition != null);
}

function isResolvedSource(
  value: unknown,
): value is Exclude<ZipEhrTemplatePresentationSource, string | WebTemplate | openehr_am.OPERATIONAL_TEMPLATE> {
  return value != null && typeof value === "object" && !Array.isArray(value) &&
    "operationalTemplate" in value;
}

function isWebTemplateShape(value: unknown): value is WebTemplate {
  if (value == null || typeof value !== "object") return false;
  const rec = value as Record<string, unknown>;
  return rec.tree != null && typeof rec.tree === "object";
}

function tryParseWebTemplateJson(text: string): WebTemplate | undefined {
  const t = text.trim();
  if (!t.startsWith("{")) return undefined;
  try {
    const raw = JSON.parse(t) as unknown;
    if (!raw || typeof raw !== "object") return undefined;
    const obj = raw as Record<string, unknown>;
    if (obj.webTemplate) return parseWebTemplate(obj.webTemplate);
    if (isWebTemplateShape(raw)) return parseWebTemplate(raw);
  } catch {
    return undefined;
  }
  return undefined;
}

function renderLangFromOpt(
  opt: openehr_am.OPERATIONAL_TEMPLATE,
  override?: string,
): string {
  if (override) return override;
  return languageCode(opt.original_language) ?? "en";
}

/**
 * Build operational + web template for presentation indexing.
 * Returns `null` when input cannot yield both (no presentation attrs).
 */
export function resolveZipEhrTemplatePresentation(
  source: ZipEhrTemplatePresentationSource,
  options?: {
    archetypeRepository?: ArchetypeRepository;
    defaultRenderLang?: string;
  },
): ZipEhrTemplatePresentationContext | null {
  if (isResolvedSource(source)) {
    const wt = source.webTemplate ?? buildWebTemplate(source.operationalTemplate);
    return {
      operationalTemplate: source.operationalTemplate,
      webTemplate: wt,
      renderLang: source.renderLang ?? options?.defaultRenderLang ??
        wt.defaultLanguage ??
        renderLangFromOpt(source.operationalTemplate, options?.defaultRenderLang),
      pathAnnotations: source.pathAnnotations,
    };
  }

  if (isWebTemplateShape(source)) {
    return null;
  }

  if (isOperationalTemplate(source)) {
    const wt = buildWebTemplate(source);
    return {
      operationalTemplate: source,
      webTemplate: wt,
      renderLang: options?.defaultRenderLang ?? wt.defaultLanguage ??
        renderLangFromOpt(source, options?.defaultRenderLang),
    };
  }

  const text = source.trim();
  if (!text) return null;

  const wtOnly = tryParseWebTemplateJson(text);
  if (wtOnly) return null;

  if (isOptXml(text)) {
    const { operationalTemplate: opt } = parseOptXml(text);
    const wt = buildWebTemplate(opt);
    return {
      operationalTemplate: opt,
      webTemplate: wt,
      renderLang: options?.defaultRenderLang ?? wt.defaultLanguage ??
        renderLangFromOpt(opt, options?.defaultRenderLang),
    };
  }

  const format = detectTemplateInputFormat(text);
  if (format !== "unknown") {
    const parsed = parseTemplateInput(text, {
      archetypeRepository: options?.archetypeRepository,
    });
    const opt = parsed.operationalTemplate;
    if (!opt) return null;
    const wt = buildWebTemplate(opt);
    return {
      operationalTemplate: opt,
      webTemplate: wt,
      renderLang: options?.defaultRenderLang ?? wt.defaultLanguage ??
        renderLangFromOpt(opt, options?.defaultRenderLang),
    };
  }

  return null;
}