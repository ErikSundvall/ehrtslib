/**
 * Parse Better Archetype Designer `.t.json` (JSON serialisation of AOM TEMPLATE).
 */

import * as openehr_am from "../../openehr_am.ts";
import * as openehr_base from "../../openehr_base.ts";
import {
  asArray,
  parseAttribute,
  parseCObject,
  textValue,
} from "./xml_aom_mapper.ts";
import {
  jsonType,
  normalizeJsonNode,
  parseArchetypeIdField,
  parseCodePhrase,
} from "./json_aom_util.ts";
import { applyTerminologyOdin } from "../odin_aom_mapper.ts";
import {
  collectBetterJsonLintWarnings,
  normalizeBetterTemplateJson,
} from "./template_json_normalize.ts";

export interface TemplateJsonParseResult {
  template: openehr_am.TEMPLATE;
  overlays: openehr_am.TEMPLATE_OVERLAY[];
  warnings: string[];
}

export function isTemplateJson(source: string): boolean {
  const t = source.trimStart();
  if (!t.startsWith("{")) return false;
  try {
    const obj = JSON.parse(t) as Record<string, unknown>;
    const type = jsonType(obj);
    return type === "TEMPLATE" || type === "OPERATIONAL_TEMPLATE";
  } catch {
    return false;
  }
}

export function parseTemplateJson(source: string): TemplateJsonParseResult {
  const warnings: string[] = [];
  const raw = JSON.parse(source) as Record<string, unknown>;
  const root = normalizeBetterTemplateJson(raw) as Record<string, unknown>;
  warnings.push(...collectBetterJsonLintWarnings(raw));
  const type = jsonType(root);

  if (type === "OPERATIONAL_TEMPLATE") {
    warnings.push("JSON operational template treated as template for flattening");
  }

  const template = parseTemplateObject(root, warnings);
  const overlays: openehr_am.TEMPLATE_OVERLAY[] = [];
  for (const raw of asArray(root.template_overlays ?? root.templateOverlays)) {
    if (!raw || typeof raw !== "object") continue;
    const rec = raw as Record<string, unknown>;
    if (jsonType(rec) !== "TEMPLATE_OVERLAY") {
      warnings.push(`Skipped non-overlay in templateOverlays: ${jsonType(rec)}`);
      continue;
    }
    overlays.push(parseTemplateOverlay(rec, warnings));
  }

  return { template, overlays, warnings };
}

function parseTemplateObject(
  root: Record<string, unknown>,
  warnings: string[],
): openehr_am.TEMPLATE {
  const template = new openehr_am.TEMPLATE();
  applyAuthoredArchetypeFields(template, root, warnings);
  const tplId = root.template_id ?? root.templateId;
  if (tplId !== undefined) {
    (template as { template_id?: string }).template_id = String(tplId);
  }
  return template;
}

function parseTemplateOverlay(
  root: Record<string, unknown>,
  warnings: string[],
): openehr_am.TEMPLATE_OVERLAY {
  const overlay = new openehr_am.TEMPLATE_OVERLAY();
  applyAuthoredArchetypeFields(overlay, root, warnings);
  return overlay;
}

function applyAuthoredArchetypeFields(
  target: openehr_am.ARCHETYPE,
  root: Record<string, unknown>,
  warnings: string[],
): void {
  if (root.uid !== undefined) {
    const uid = new openehr_base.HIER_OBJECT_ID();
    uid.value = String(root.uid);
    target.uid = uid;
  }

  target.archetype_id = parseArchetypeIdField(root.archetypeId);
  target.parent_archetype_id = parseArchetypeIdField(root.parentArchetypeId);

  if (root.adlVersion !== undefined) target.adl_version = String(root.adlVersion);
  if (root.adl_version !== undefined) target.adl_version = String(root.adl_version);

  const def = root.definition;
  if (def && typeof def === "object") {
    target.definition = parseCObject(
      normalizeJsonNode(def as Record<string, unknown>),
    ) as openehr_am.C_COMPLEX_OBJECT;
  }

  const term = root.terminology;
  if (term && typeof term === "object") {
    target.ontology = parseJsonOntology(term as Record<string, unknown>, warnings);
  }

  if (root.originalLanguage && typeof root.originalLanguage === "object") {
    const lang = parseCodePhrase(root.originalLanguage);
    if (lang && target.ontology) {
      target.ontology.original_language = lang;
    }
  }
}

function parseJsonOntology(
  node: Record<string, unknown>,
  _warnings: string[],
): openehr_am.ARCHETYPE_ONTOLOGY {
  const shell = new openehr_am.ARCHETYPE();
  const termDefs = node.termDefinitions ?? node.term_definitions;
  if (termDefs && typeof termDefs === "object") {
    applyTerminologyOdin(shell, { term_definitions: termDefs });
  }
  const onto = shell.ontology ?? new openehr_am.ARCHETYPE_ONTOLOGY();
  if (node.conceptCode !== undefined) {
    (onto as Record<string, unknown>).concept_code = String(node.conceptCode);
  }
  return onto;
}
