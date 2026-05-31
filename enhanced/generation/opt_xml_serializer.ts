/**
 * Serialize AOM OPERATIONAL_TEMPLATE to legacy ADL 1.4 OPT XML.
 */

import { XMLBuilder } from "fast-xml-parser";
import * as openehr_am from "../openehr_am.ts";
import * as openehr_base from "../openehr_base.ts";

export interface OptXmlSerializerConfig {
  templateNamespace?: string;
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

function serializeCObject(obj: openehr_am.C_OBJECT): Record<string, unknown> {
  const base: Record<string, unknown> = {
    "@_xsi:type": obj.constructor.name.replace(/^C_/, "C_"),
    rm_type_name: obj.rm_type_name,
    node_id: atNodeId(obj.node_id),
  };
  const occ = serializeMultiplicity(obj.occurrences);
  if (occ) base.occurrences = occ;

  if (obj instanceof openehr_am.C_COMPLEX_OBJECT) {
    base["@_xsi:type"] = "C_COMPLEX_OBJECT";
    const attrs = obj.attributes?.map(serializeAttribute).filter(Boolean);
    if (attrs?.length) base.attributes = attrs;
    return base;
  }

  if (obj instanceof openehr_am.C_ARCHETYPE_ROOT) {
    base["@_xsi:type"] = "C_ARCHETYPE_ROOT";
    if (obj.archetype_ref) {
      base.archetype_id = { value: obj.archetype_ref };
    }
    const attrs = obj.attributes?.map(serializeAttribute).filter(Boolean);
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
      return serializeCObject(obj.item);
    }
    base["@_xsi:type"] = "C_DV_TEXT";
    base.rm_type_name = obj.rm_type_name ?? "DV_TEXT";
    return base;
  }

  return base;
}

function serializeAttribute(attr: openehr_am.C_ATTRIBUTE): Record<string, unknown> {
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
    out.children = children.map(serializeCObject);
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
    const definition = opt.definition
      ? serializeCObject(opt.definition)
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
