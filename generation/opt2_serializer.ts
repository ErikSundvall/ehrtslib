/**
 * Serialize OPERATIONAL_TEMPLATE to ADL2 OPT2 (cADL + ODIN).
 */

import * as openehr_am from "../am/openehr_am.ts";
import { ADL2Serializer, type ADL2SerializerConfig } from "./adl2_serializer.ts";
import {
  serializeAnnotationsSection,
  serializeComponentTerminologiesSection,
  serializeDescriptionSection,
  serializeLanguageSection,
  serializeRmOverlaySection,
  serializeTerminologySection,
} from "../parser/odin_serializer.ts";
import type { OdinValue } from "../parser/odin_parser.ts";
import {
  getAnnotationsDocumentation,
  getRmOverlayVisibility,
} from "../parser/aom_odin_sections.ts";
import { serializeRulesSection } from "../parser/rules_serializer.ts";
import {
  archetypeTermBagsForLanguage,
  type OperationalTemplateWithTermScopes,
  resolveLocatableLabel,
  type TermScopeMeta,
  TERM_NAME_FALLBACK_NODE_ID_KEY,
} from "./term_scope.ts";
import { resolveTemplateLanguage } from "./term_codes.ts";
import type { TermBag } from "../am/util/ontology_merge.ts";
import { filterOperationalTemplateLanguages } from "./opt2_trim.ts";

/** Options for {@link OPT2Serializer.serializeOperationalTemplate}. */
export interface Opt2SerializeOptions {
  indent?: string;
  adlVersion?: string;
  rmRelease?: string;
  /**
   * Keep only these language codes in terminology / component_terminologies /
   * localized description and annotation bags (clone + filter before serialize).
   */
  languages?: string[];
  /**
   * Add human-readable `-- label` comments on cADL nodes using template /
   * component terminology (increases output size; does not remove ODIN sections).
   */
  inlineTermLabels?: boolean;
  /** Language for {@link Opt2SerializeOptions.inlineTermLabels}; defaults to first `languages` entry or template primary. */
  inlineTermLabelLanguage?: string;
}

export interface CadlLabelContext {
  inlineLabels: boolean;
  resolveLabel(node: openehr_am.C_OBJECT): string | undefined;
}

export interface OPT2SerializerConfig extends ADL2SerializerConfig {
  labelContext?: CadlLabelContext;
}

/**
 * ADL2 serializer with OPT2 `operational_template` metadata sections.
 */
export class OPT2Serializer extends ADL2Serializer {
  private labelContext?: CadlLabelContext;

  constructor(config?: OPT2SerializerConfig) {
    super(config);
    this.labelContext = config?.labelContext;
  }

  setLabelContext(ctx: CadlLabelContext | undefined): void {
    this.labelContext = ctx;
  }

  /**
   * Serialize an operational template to ADL2 `operational_template` text.
   */
  serializeOperationalTemplate(
    opt: openehr_am.OPERATIONAL_TEMPLATE,
    options?: Opt2SerializeOptions,
  ): string {
    const working = options?.languages?.length
      ? filterOperationalTemplateLanguages(opt, options.languages)
      : opt;

    if (options?.inlineTermLabels) {
      const language = resolveTemplateLanguage(
        working,
        options.inlineTermLabelLanguage ?? options.languages?.[0],
      );
      const templateTerms = ((working.ontology as {
        term_definitions?: Record<string, TermBag>;
      } | undefined)?.term_definitions?.[language] ?? {}) as TermBag;
      const archetypeTerms = archetypeTermBagsForLanguage(
        working as OperationalTemplateWithTermScopes,
        language,
      );
      this.setLabelContext({
        inlineLabels: true,
        resolveLabel: (node) =>
          resolveLocatableLabel(
            node.node_id,
            (node as TermScopeMeta)[TERM_NAME_FALLBACK_NODE_ID_KEY],
            templateTerms,
            archetypeTerms,
            (node as TermScopeMeta).term_archetype_scope,
          ),
      });
    } else {
      this.setLabelContext(undefined);
    }

    const indent = this.config.indent || "    ";
    let adl = "operational_template";
    const adlVer = options?.adlVersion ?? "2.0.5";
    const rmRel = options?.rmRelease ?? working.rm_release ?? "1.0.4";
    adl += ` (adl_version=${adlVer}; rm_release=${rmRel})`;
    adl += "\n";

    const templateId = working.template_id ?? working.archetype_id?.value;
    if (templateId) {
      adl += `    ${templateId}\n\n`;
    }

    const parentId = working.parent_archetype_id?.value;
    if (parentId) {
      adl += `specialize\n    ${parentId}\n\n`;
    }

    const translations = (working as { translations?: unknown }).translations;
    adl += serializeLanguageSection(
      working.original_language,
      indent,
      translations as OdinValue | undefined,
    );
    adl += serializeDescriptionSection(working.description, indent);

    adl += "definition\n";
    if (working.definition) {
      adl += this.serializeCObject(working.definition, 1);
    }
    adl += "\n";

    adl += serializeRulesSection(working.invariants, indent);

    const ontologyBag = working.ontology as Record<string, unknown> | undefined;
    adl += serializeTerminologySection(ontologyBag, indent);

    const scoped = working as OperationalTemplateWithTermScopes;
    adl += serializeComponentTerminologiesSection(
      scoped.archetype_term_definitions,
      indent,
    );

    adl += serializeAnnotationsSection(
      getAnnotationsDocumentation(working),
      indent,
    );
    adl += serializeRmOverlaySection(
      getRmOverlayVisibility(working),
      indent,
    );

    return adl;
  }

  protected override decorateObjectLine(
    node: openehr_am.C_OBJECT,
    line: string,
  ): string {
    if (!this.labelContext?.inlineLabels) return line;
    const label = this.labelContext.resolveLabel(node);
    if (!label) return line;
    const safe = label.replace(/\r?\n/g, " ").trim();
    return `${line}  -- ${safe}`;
  }
}

/** Byte / line size comparison for OPT XML vs OPT2 exports. */
export function opt2SizeMetrics(
  xmlOrOther: string,
  opt2: string,
): {
  xmlBytes: number;
  opt2Bytes: number;
  byteRatio: number;
  xmlLines: number;
  opt2Lines: number;
  lineRatio: number;
} {
  const xmlBytes = new TextEncoder().encode(xmlOrOther).length;
  const opt2Bytes = new TextEncoder().encode(opt2).length;
  const xmlLines = xmlOrOther.split("\n").length;
  const opt2Lines = opt2.split("\n").length;
  return {
    xmlBytes,
    opt2Bytes,
    byteRatio: xmlBytes / Math.max(opt2Bytes, 1),
    xmlLines,
    opt2Lines,
    lineRatio: xmlLines / Math.max(opt2Lines, 1),
  };
}
