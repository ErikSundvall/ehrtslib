/**
 * Compile OET (Ocean Template Editor) constraint documents to OPERATIONAL_TEMPLATE.
 */

import * as openehr_am from "../../openehr_am.ts";
import * as openehr_base from "../../openehr_base.ts";
import { cloneComplexObject } from "../../am/aom_clone.ts";
import {
  flattenToOperationalTemplate,
  type ArchetypeResolver,
} from "../../am/flattening/template_flattener.ts";
import { replaceAtAomPath, resolveAomPath } from "../../am/aom_path_navigator.ts";
import type { ArchetypeRepository } from "./archetype_repository.ts";
import type { OetParseResult, OetRule, OetItem } from "./oet_xml_parser.ts";

export interface OetCompileOptions {
  repository: ArchetypeRepository;
  templateId?: string;
}

export interface OetCompileResult {
  operationalTemplate: openehr_am.OPERATIONAL_TEMPLATE;
  warnings: string[];
}

function multiplicityFromMaxMin(max?: number, min?: number): openehr_base.Multiplicity_interval {
  const m = new openehr_base.Multiplicity_interval();
  m.lower = min ?? 0;
  m.upper = max ?? 1;
  m.lower_included = true;
  m.upper_included = true;
  m.lower_unbounded = false;
  m.upper_unbounded = max === undefined || max < 0;
  if (max === 0) {
    m.upper = 0;
    m.lower = 0;
  }
  return m;
}

function joinArchetypePaths(base: string, relative: string): string {
  const b = base.trim().replace(/\/+$/, "");
  const r = relative.trim();
  if (!r) return b;
  if (r.startsWith("/")) return r;
  return `${b}/${r}`;
}

function applyRule(
  root: openehr_am.C_COMPLEX_OBJECT,
  rule: OetRule,
  warnings: string[],
  pathPrefix = "",
): void {
  const fullPath = joinArchetypePaths(pathPrefix, rule.path);
  if (!fullPath) return;
  const match = resolveAomPath(root, fullPath);
  if (!match) {
    warnings.push(`OET rule path not found: ${fullPath}`);
    return;
  }

  const obj = match.object;
  if (rule.max !== undefined || rule.min !== undefined) {
    obj.occurrences = multiplicityFromMaxMin(rule.max, rule.min);
  }

  if (rule.includedValues?.length) {
    if (obj instanceof openehr_am.C_STRING) {
      (obj as { list?: string[] }).list = [...rule.includedValues];
    } else if (obj instanceof openehr_am.C_PRIMITIVE_OBJECT) {
      const str = new openehr_am.C_STRING();
      (str as { list?: string[] }).list = [...rule.includedValues];
      obj.item = str;
      obj.rm_type_name = "STRING";
    } else {
      warnings.push(
        `includedValues at ${fullPath} targets non-string constraint (${obj.constructor.name})`,
      );
    }
  }
}

function applyItem(
  root: openehr_am.C_COMPLEX_OBJECT,
  item: OetItem,
  resolver: ArchetypeResolver,
  warnings: string[],
  pathPrefix = "",
): void {
  const itemPath = joinArchetypePaths(pathPrefix, item.path);

  if (itemPath && item.archetypeId) {
    const arch = resolver.resolve(item.archetypeId);
    if (!arch) {
      warnings.push(`OET item archetype not in repository: ${item.archetypeId}`);
    } else {
      const filler = new openehr_am.C_ARCHETYPE_ROOT();
      filler.archetype_ref = item.archetypeId;
      filler.rm_type_name = arch.definition?.rm_type_name ?? item.type ?? "COMPOSITION";
      if (item.max !== undefined || item.min !== undefined) {
        filler.occurrences = multiplicityFromMaxMin(item.max, item.min);
      }
      if (!replaceAtAomPath(root, itemPath, filler)) {
        warnings.push(`OET item path not found: ${itemPath}`);
      }
    }
  }

  for (const rule of item.rules) applyRule(root, rule, warnings, itemPath);
  for (const child of item.items) applyItem(root, child, resolver, warnings, itemPath);
}

/**
 * Compile parsed OET document + archetype repository into an operational template.
 */
export function compileOetToOperational(
  oet: OetParseResult,
  options: OetCompileOptions,
): OetCompileResult {
  const warnings = [...oet.warnings];
  const doc = oet.document;
  const archetypeId = doc.definitionArchetypeId;
  if (!archetypeId) {
    throw new Error("OET missing definition archetype_id");
  }

  const resolver: ArchetypeResolver = {
    resolve: (id) => options.repository.get(id),
  };

  const base = options.repository.get(archetypeId);
  if (!base?.definition) {
    throw new Error(`Archetype not found in repository: ${archetypeId}`);
  }

  const template = new openehr_am.TEMPLATE();
  const aid = new openehr_base.ARCHETYPE_ID();
  aid.value = options.templateId ?? doc.name ?? doc.id ?? `${archetypeId}.template`;
  template.archetype_id = aid;
  template.original_language = base.original_language;
  template.concept = doc.conceptName ?? doc.definitionName;
  template.definition = cloneComplexObject(base.definition);

  for (const rule of doc.rules) applyRule(template.definition!, rule, warnings, "");
  for (const item of doc.items) applyItem(template.definition!, item, resolver, warnings, "");

  const operationalTemplate = flattenToOperationalTemplate(template, resolver);
  operationalTemplate.adl_version = "2.0";
  operationalTemplate.is_generated = true;

  warnings.push(...options.repository.getWarnings());
  return { operationalTemplate, warnings };
}
