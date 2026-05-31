/**
 * Parse Ocean Template Editor (OET) XML — CKM export format.
 * Produces a structured template definition; full AOM compilation requires archetype repository.
 */

import { XMLParser } from "fast-xml-parser";
import * as openehr_am from "../../openehr_am.ts";
import * as openehr_base from "../../openehr_base.ts";
import { asArray, textValue } from "./xml_aom_mapper.ts";

export interface OetRule {
  path: string;
  max?: number;
  min?: number;
  includedValues?: string[];
}

export interface OetItem {
  path: string;
  archetypeId: string;
  max?: number;
  min?: number;
  type?: string;
  rules: OetRule[];
  items: OetItem[];
}

export interface OetTemplateDocument {
  id?: string;
  name?: string;
  definitionArchetypeId?: string;
  conceptName?: string;
  definitionName?: string;
  rules: OetRule[];
  items: OetItem[];
}

export interface OetParseResult {
  document: OetTemplateDocument;
  /** Partial TEMPLATE shell when metadata is present. */
  template?: openehr_am.TEMPLATE;
  warnings: string[];
}

export function isOetXml(source: string): boolean {
  const t = source.trimStart();
  return (t.startsWith("<?xml") || t.startsWith("<")) &&
    /<template[\s>]/i.test(t) &&
    t.includes("openEHR/v1/Template");
}

function parseOetXmlDocument(xml: string): Record<string, unknown> {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    removeNSPrefix: true,
    parseTagValue: true,
    trimValues: true,
    isArray: (_n, jpath) => {
      const p = jpath as string;
      return p.endsWith(".Rule") || p.endsWith(".Items") || p.endsWith(".item") ||
        p.endsWith(".includedValues");
    },
  });
  const doc = parser.parse(xml) as Record<string, unknown>;
  const root = doc.template;
  if (!root || typeof root !== "object") throw new Error("Expected OET <template> root");
  return root as Record<string, unknown>;
}

function parseRule(node: Record<string, unknown>): OetRule {
  const rule: OetRule = { path: String(node["@_path"] ?? node.path ?? "") };
  if (node["@_max"] !== undefined) rule.max = Number(node["@_max"]);
  if (node["@_min"] !== undefined) rule.min = Number(node["@_min"]);
  const constraint = node.constraint as Record<string, unknown> | undefined;
  if (constraint) {
    rule.includedValues = asArray(constraint.includedValues).map(String);
  }
  return rule;
}

function parseItems(node: Record<string, unknown>): OetItem {
  const item: OetItem = {
    path: String(node["@_path"] ?? ""),
    archetypeId: String(node["@_archetype_id"] ?? node.archetype_id ?? ""),
    rules: asArray(node.Rule).map((r) => parseRule(r as Record<string, unknown>)),
    items: asArray(node.Items).map((c) => parseItems(c as Record<string, unknown>)),
  };
  if (node["@_max"] !== undefined) item.max = Number(node["@_max"]);
  if (node["@_min"] !== undefined) item.min = Number(node["@_min"]);
  item.type = String(node["@_type"] ?? "").replace(/^.*:/, "");
  return item;
}

export function parseOetXml(source: string): OetParseResult {
  const warnings: string[] = [];
  const root = parseOetXmlDocument(source);
  const def = root.definition as Record<string, unknown> | undefined;

  const document: OetTemplateDocument = {
    id: textValue(root.id) ?? String(root.id ?? ""),
    name: String(root.name ?? ""),
    rules: [],
    items: [],
  };

  if (def) {
    document.definitionArchetypeId = String(def["@_archetype_id"] ?? def.archetype_id ?? "");
    document.conceptName = String(def["@_concept_name"] ?? def.concept_name ?? "");
    document.definitionName = String(def["@_name"] ?? def.name ?? "");
    document.rules = asArray(def.Rule).map((r) => parseRule(r as Record<string, unknown>));
    document.items = asArray(def.Items).map((i) => parseItems(i as Record<string, unknown>));
  }

  const template = new openehr_am.TEMPLATE();
  if (document.definitionArchetypeId) {
    const aid = new openehr_base.ARCHETYPE_ID();
    aid.value = document.definitionArchetypeId;
    template.archetype_id = aid;
  }

  if (!document.definitionArchetypeId) {
    warnings.push("OET missing definition archetype_id");
  } else {
    warnings.push(
      "OET parsed as constraint document; compile to operational AOM with ArchetypeRepository + flattening.",
    );
  }

  return { document, template, warnings };
}
