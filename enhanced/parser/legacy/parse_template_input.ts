/**
 * Unified template / operational template input parsing (ADL 1.4, ADL2, OPT XML, OET XML).
 */

import { parseAdl, type ParseAdlResult } from "../parse_adl.ts";
import { detectAdlVersion } from "../adl_version.ts";
import { isOptXml, parseOptXml } from "./opt_xml_parser.ts";
import { isOetXml, parseOetXml, type OetParseResult } from "./oet_xml_parser.ts";
import { compileOetToOperational } from "./oet_compiler.ts";
import { isTemplateJson, parseTemplateJson } from "./template_json_parser.ts";
import { flattenToOperationalTemplate } from "../../am/flattening/template_flattener.ts";
import * as openehr_am from "../../openehr_am.ts";

export type TemplateInputFormat =
  | "adl14"
  | "adl2"
  | "opt_xml"
  | "oet_xml"
  | "template_json"
  | "unknown";

export interface ParseTemplateInputOptions {
  /** When set, OET XML is compiled to operational template using this repository. */
  archetypeRepository?: import("./archetype_repository.ts").ArchetypeRepository;
}

export interface ParseTemplateInputResult {
  format: TemplateInputFormat;
  kind: "operational_template" | "template" | "oet_document";
  operationalTemplate?: openehr_am.OPERATIONAL_TEMPLATE;
  template?: openehr_am.TEMPLATE;
  oet?: OetParseResult;
  adl?: ParseAdlResult;
  warnings: string[];
}

export function detectTemplateInputFormat(source: string): TemplateInputFormat {
  const t = source.trim();
  if (!t) return "unknown";
  if (isTemplateJson(t)) return "template_json";
  if (isOetXml(t)) return "oet_xml";
  if (isOptXml(t)) return "opt_xml";
  if (t.startsWith("operational_template") || t.startsWith("template") ||
    t.startsWith("archetype")) {
    const v = detectAdlVersion(t);
    if (v === "1.4") return "adl14";
    if (v === "2.x") return "adl2";
  }
  if (t.startsWith("<?xml") || t.startsWith("<")) {
    if (isOptXml(t)) return "opt_xml";
    if (isOetXml(t)) return "oet_xml";
  }
  const v = detectAdlVersion(t);
  if (v === "1.4") return "adl14";
  if (v === "2.x") return "adl2";
  return "unknown";
}

/**
 * Parse template input from any supported legacy or ADL2 format.
 * Returns operational_template when possible (OPT XML, ADL operational_template).
 */
export function parseTemplateInput(
  source: string,
  options?: ParseTemplateInputOptions,
): ParseTemplateInputResult {
  const format = detectTemplateInputFormat(source);
  const warnings: string[] = [];

  if (format === "opt_xml") {
    const { operationalTemplate, warnings: w } = parseOptXml(source);
    return {
      format,
      kind: "operational_template",
      operationalTemplate,
      warnings: [...w],
    };
  }

  if (format === "oet_xml") {
    const oet = parseOetXml(source);
    if (options?.archetypeRepository) {
      try {
        const compiled = compileOetToOperational(oet, {
          repository: options.archetypeRepository,
        });
        return {
          format,
          kind: "operational_template",
          operationalTemplate: compiled.operationalTemplate,
          oet,
          warnings: compiled.warnings,
        };
      } catch (e) {
        return {
          format,
          kind: "oet_document",
          template: oet.template,
          oet,
          warnings: [
            ...oet.warnings,
            `OET compile failed: ${(e as Error).message}`,
          ],
        };
      }
    }
    return {
      format,
      kind: "oet_document",
      template: oet.template,
      oet,
      warnings: oet.warnings,
    };
  }

  if (format === "template_json") {
    const { template, overlays, warnings: w } = parseTemplateJson(source);
    warnings.push(...w);
    if (options?.archetypeRepository) {
      for (const overlay of overlays) {
        options.archetypeRepository.add(overlay);
      }
      try {
        const operationalTemplate = flattenToOperationalTemplate(
          template,
          options.archetypeRepository,
        );
        return {
          format,
          kind: "operational_template",
          operationalTemplate,
          template,
          warnings,
        };
      } catch (e) {
        warnings.push(`Flatten failed: ${(e as Error).message}`);
      }
    }
    return {
      format,
      kind: "template",
      template,
      warnings,
    };
  }

  if (format === "adl14" || format === "adl2" || format === "unknown") {
    const adl = parseAdl(source, { convertAdl14: true });
    warnings.push(...adl.warnings, ...adl.conversionWarnings);

    if (adl.kind === "operational_template" && adl.operationalTemplate) {
      return {
        format: adl.convertedFrom14 ? "adl14" : "adl2",
        kind: "operational_template",
        operationalTemplate: adl.operationalTemplate,
        adl,
        warnings,
      };
    }
    if (adl.kind === "template" && adl.template) {
      if (options?.archetypeRepository) {
        const operationalTemplate = flattenToOperationalTemplate(
          adl.template,
          options.archetypeRepository,
        );
        return {
          format: adl.convertedFrom14 ? "adl14" : "adl2",
          kind: "operational_template",
          operationalTemplate,
          template: adl.template,
          adl,
          warnings,
        };
      }
      return {
        format: adl.convertedFrom14 ? "adl14" : "adl2",
        kind: "template",
        template: adl.template,
        adl,
        warnings,
      };
    }

    throw new Error(
      `ADL input parsed as ${adl.kind}; expected template or operational_template`,
    );
  }

  throw new Error(`Unsupported template input format: ${format}`);
}

export function getOperationalTemplateFromInput(
  source: string,
  options?: ParseTemplateInputOptions,
): openehr_am.OPERATIONAL_TEMPLATE {
  const parsed = parseTemplateInput(source, options);
  if (parsed.operationalTemplate) return parsed.operationalTemplate;
  if (parsed.kind === "template" && parsed.template && options?.archetypeRepository) {
    return flattenToOperationalTemplate(
      parsed.template,
      options.archetypeRepository,
    );
  }
  throw new Error(
    parsed.kind === "oet_document"
      ? "OET source templates require archetype repository compilation before use as operational template"
      : parsed.kind === "template"
      ? "ADL source template requires archetype repository (file set) to flatten to operational template"
      : `Input is ${parsed.kind}, not operational_template`,
  );
}
