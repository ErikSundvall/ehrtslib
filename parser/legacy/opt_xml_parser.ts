/**
 * Parse ADL 1.4 legacy operational template XML (.opt) into AOM OPERATIONAL_TEMPLATE.
 */

import * as openehr_am from "../../am/openehr_am.ts";
import * as openehr_base from "../../base/openehr_base.ts";
import {
  asArray,
  collectTermDefinitions,
  parseCObject,
  parseLegacyTemplateXml,
  textValue,
} from "./xml_aom_mapper.ts";
import { applyOperationalTemplateTermScopes } from "../../generation/term_scope.ts";
import { setOptPathAnnotationItems } from "../../generation/opt_l10n.ts";

export interface OptXmlParseResult {
  operationalTemplate: openehr_am.OPERATIONAL_TEMPLATE;
  warnings: string[];
}

function setArchetypeId(
  target: openehr_am.OPERATIONAL_TEMPLATE,
  id: string,
): void {
  const aid = new openehr_base.ARCHETYPE_ID();
  aid.value = id;
  target.archetype_id = aid;
}

export function isOptXml(source: string): boolean {
  const t = source.trimStart();
  if (!t.startsWith("<?xml") && !t.startsWith("<")) return false;
  if (t.includes("openEHR/v1/Template")) return false;
  return /<template[\s>]/i.test(t) &&
    (t.includes("schemas.openehr.org/v1") ||
      t.includes("C_ARCHETYPE_ROOT") ||
      t.includes("C_COMPLEX_OBJECT") ||
      t.includes("template_id"));
}

export function parseOptXml(source: string): OptXmlParseResult {
  const warnings: string[] = [];
  const root = parseLegacyTemplateXml(source);

  const opt = new openehr_am.OPERATIONAL_TEMPLATE();
  opt.adl_version = "1.4";
  opt.rm_release = "1.0.4";

  const templateId = textValue(root.template_id);
  if (templateId) setArchetypeId(opt, templateId);

  const langCode = textValue(
    (root.language as Record<string, unknown> | undefined)?.code_string ??
      root.language,
  );
  if (langCode) {
    // Runtime convention across the codebase: plain language code string
    // (the generated type declares Terminology_code).
    opt.original_language = langCode as unknown as openehr_base.Terminology_code;
  }

  const defNode = root.definition;
  if (!defNode || typeof defNode !== "object") {
    throw new Error("OPT missing <definition>");
  }

  const definition = parseCObject(defNode);
  if (!(definition instanceof openehr_am.C_COMPLEX_OBJECT)) {
    throw new Error("OPT definition root must be C_COMPLEX_OBJECT");
  }

  const defRec = defNode as Record<string, unknown>;
  const archId = textValue(defRec.archetype_id);
  if (archId && !opt.archetype_id?.value) setArchetypeId(opt, archId);

  opt.definition = definition;

  const termBag: Record<string, Record<string, { text?: string; description?: string }>> = {};
  collectTermDefinitions(defNode, termBag);
  if (Object.keys(termBag).length) {
    const ontology = new openehr_am.ARCHETYPE_ONTOLOGY();
    ontology.term_definitions = termBag;
    ontology.term_bindings = {};
    ontology.constraint_bindings = {};
    ontology.value_sets = {};
    opt.ontology = ontology;
  }

  // Per-archetype bags + term_archetype_scope on every inlined node.
  // The merged ontology above is last-wins on colliding at-codes.
  applyOperationalTemplateTermScopes(opt, "en");

  // Path annotations (including Better/AD `L10n.{lang}` name overrides).
  parseOptAnnotations(root, opt);

  if (root.concept) {
    warnings.push("OPT concept metadata preserved in description only (not full round-trip).");
  }

  return { operationalTemplate: opt, warnings };
}

/**
 * Parse top-level OPT `<annotations path="...">` into RESOURCE_ANNOTATIONS.
 * Items use `id` as the key (e.g. `L10n.sv`, `FHIR`).
 */
function parseOptAnnotations(
  root: Record<string, unknown>,
  opt: openehr_am.OPERATIONAL_TEMPLATE,
): void {
  for (const raw of asArray(root.annotations)) {
    if (!raw || typeof raw !== "object") continue;
    const rec = raw as Record<string, unknown>;
    const path = String(rec["@_path"] ?? rec.path ?? "").trim();
    if (!path) continue;
    const items: Record<string, string> = {};
    for (const it of asArray(rec.items)) {
      if (!it || typeof it !== "object") continue;
      const item = it as Record<string, unknown>;
      const id = String(item["@_id"] ?? item.id ?? "").trim();
      const val = textValue(item);
      if (!id || !val) continue;
      items[id] = val;
    }
    setOptPathAnnotationItems(opt, path, items);
  }
}
