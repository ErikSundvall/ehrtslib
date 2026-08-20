/**
 * Serialize AOM OPERATIONAL_TEMPLATE to legacy ADL 1.4 OPT XML.
 *
 * Emits `C_ARCHETYPE_ROOT` (checked before `C_COMPLEX_OBJECT`) and the
 * per-root `<term_definitions>` used by Ocean/CKM OPT files. Terminology is
 * still not a byte-identical round-trip (languages, bindings, value sets).
 */

import { XMLBuilder } from "fast-xml-parser";
import * as openehr_am from "../am/openehr_am.ts";
import * as openehr_base from "../base/openehr_base.ts";
import type { TermBag } from "../am/util/ontology_merge.ts";
import {
  COMPONENT_TERM_DEFINITIONS_KEY,
  type OperationalTemplateWithTermScopes,
  type TermScopeMeta,
} from "./term_scope.ts";

export interface OptXmlSerializerConfig {
  templateNamespace?: string;
}

interface SerializeCtx {
  termsByArchetype: Record<string, TermBag>;
}

function atNodeId(nodeId?: string): string {
  if (!nodeId) return "";
  const m = /^id(\d+(?:\.\d+)*)$/i.exec(nodeId);
  if (m) return `at${m[1].replace(/\./g, "").padStart(4, "0")}`;
  return nodeId;
}

function serializeMultiplicity(
  m?: openehr_base.Multiplicity_interval,
): Record<string, unknown> | undefined {
  if (!m) return undefined;
  return {
    lower_included: m.lower_included ?? true,
    upper_included: m.upper_included ?? true,
    lower_unbounded: m.lower_unbounded ?? false,
    upper_unbounded: m.upper_unbounded ?? false,
    lower: m.lower ?? 1,
    upper: m.upper ?? 1,
  };
}

function serializeTermDefinitions(
  bag: TermBag | undefined,
): Record<string, unknown>[] {
  if (!bag) return [];
  const out: Record<string, unknown>[] = [];
  for (const [code, def] of Object.entries(bag)) {
    const items: Record<string, unknown>[] = [];
    if (def.text) items.push({ "@_id": "text", "#text": def.text });
    if (def.description) {
      items.push({ "@_id": "description", "#text": def.description });
    }
    if (!items.length) continue;
    out.push({ "@_code": code, items });
  }
  return out;
}

function termsForRoot(
  obj: openehr_am.C_ARCHETYPE_ROOT,
  ctx: SerializeCtx,
): TermBag | undefined {
  const local = (obj as TermScopeMeta)[COMPONENT_TERM_DEFINITIONS_KEY];
  if (local && Object.keys(local).length) return local;
  if (obj.archetype_ref && ctx.termsByArchetype[obj.archetype_ref]) {
    return ctx.termsByArchetype[obj.archetype_ref];
  }
  return undefined;
}

function serializeCObject(
  obj: openehr_am.C_OBJECT,
  ctx: SerializeCtx,
): Record<string, unknown> {
  const base: Record<string, unknown> = {
    "@_xsi:type": obj.constructor.name.replace(/^C_/, "C_"),
    rm_type_name: obj.rm_type_name,
    node_id: atNodeId(obj.node_id),
  };
  const occ = serializeMultiplicity(obj.occurrences);
  if (occ) base.occurrences = occ;

  // C_ARCHETYPE_ROOT extends C_COMPLEX_OBJECT — must be checked first.
  if (obj instanceof openehr_am.C_ARCHETYPE_ROOT) {
    base["@_xsi:type"] = "C_ARCHETYPE_ROOT";
    if (obj.archetype_ref) {
      base.archetype_id = { value: obj.archetype_ref };
    }
    const attrs = obj.attributes?.map((a) => serializeAttribute(a, ctx))
      .filter(Boolean);
    if (attrs?.length) base.attributes = attrs;
    const terms = serializeTermDefinitions(termsForRoot(obj, ctx));
    if (terms.length) base.term_definitions = terms;
    return base;
  }

  if (obj instanceof openehr_am.C_COMPLEX_OBJECT) {
    base["@_xsi:type"] = "C_COMPLEX_OBJECT";
    const attrs = obj.attributes?.map((a) => serializeAttribute(a, ctx))
      .filter(Boolean);
    if (attrs?.length) base.attributes = attrs;
    return base;
  }

  if (obj instanceof openehr_am.C_STRING) {
    base["@_xsi:type"] = "C_DV_TEXT";
    if (obj.pattern) base.pattern = obj.pattern;
    const list = (obj as { list?: string[] }).list;
    if (list?.length) {
      base.list = list.map((v) => ({ value: v }));
    }
    return base;
  }

  if (obj instanceof openehr_am.C_PRIMITIVE_OBJECT) {
    if (obj.item instanceof openehr_am.C_OBJECT) {
      return serializeCObject(obj.item, ctx);
    }
    base["@_xsi:type"] = "C_DV_TEXT";
    base.rm_type_name = obj.rm_type_name ?? "DV_TEXT";
    return base;
  }

  return base;
}

function serializeAttribute(
  attr: openehr_am.C_ATTRIBUTE,
  ctx: SerializeCtx,
): Record<string, unknown> {
  const out: Record<string, unknown> = {
    "@_xsi:type": attr instanceof openehr_am.C_MULTIPLE_ATTRIBUTE
      ? "C_MULTIPLE_ATTRIBUTE"
      : "C_SINGLE_ATTRIBUTE",
    rm_attribute_name: attr.rm_attribute_name,
  };
  const existence = serializeMultiplicity(
    (attr as { existence?: openehr_base.Multiplicity_interval }).existence,
  );
  if (existence) out.existence = existence;
  if (attr instanceof openehr_am.C_MULTIPLE_ATTRIBUTE && attr.cardinality) {
    out.cardinality = {
      is_ordered: attr.cardinality.is_ordered ?? false,
      is_unique: attr.cardinality.is_unique ?? false,
      interval: serializeMultiplicity(attr.cardinality.interval),
    };
  }
  const children = (attr as { children?: openehr_am.C_OBJECT[] }).children;
  if (children?.length) {
    out.children = children.map((c) => serializeCObject(c, ctx));
  }
  return out;
}

function termsByArchetypeFromOpt(
  opt: openehr_am.OPERATIONAL_TEMPLATE,
): Record<string, TermBag> {
  const index = (opt as OperationalTemplateWithTermScopes)
    .archetype_term_definitions ?? {};
  const out: Record<string, TermBag> = {};
  for (const [archId, table] of Object.entries(index)) {
    out[archId] = table.en ?? Object.values(table)[0] ?? {};
  }
  return out;
}

export class OptXmlSerializer {
  private config: Required<OptXmlSerializerConfig>;

  constructor(config?: OptXmlSerializerConfig) {
    this.config = {
      templateNamespace: config?.templateNamespace ??
        "http://schemas.openehr.org/v1",
    };
  }

  serialize(opt: openehr_am.OPERATIONAL_TEMPLATE): string {
    const templateId = opt.archetype_id?.value ?? "template.en.v1";
    const ctx: SerializeCtx = {
      termsByArchetype: termsByArchetypeFromOpt(opt),
    };
    const definition = opt.definition
      ? serializeCObject(opt.definition, ctx)
      : { rm_type_name: "COMPOSITION", "@_xsi:type": "C_COMPLEX_OBJECT" };

    const doc = {
      "?xml": { "@_version": "1.0", "@_encoding": "utf-8" },
      template: {
        "@_xmlns": this.config.templateNamespace,
        "@_xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
        "@_xmlns:xsd": "http://www.w3.org/2001/XMLSchema",
        template_id: { value: templateId },
        language: opt.original_language
          ? { code_string: opt.original_language }
          : { code_string: "en" },
        concept: opt.concept ?? templateId,
        definition,
      },
    };

    const builder = new XMLBuilder({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      format: true,
      suppressEmptyNode: false,
    });
    return builder.build(doc) + "\n";
  }
}
