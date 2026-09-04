/**
 * Serialize AOM OPERATIONAL_TEMPLATE to legacy ADL 1.4 OPT XML.
 *
 * Emits `C_ARCHETYPE_ROOT` (checked before `C_COMPLEX_OBJECT`) and the
 * per-root `<term_definitions>` used by Ocean/CKM OPT files. Terminology is
 * still not a byte-identical round-trip (languages, bindings, value sets).
 *
 * Path annotations (including Better/AD `L10n.{lang}` multilingual name
 * overrides for repeated renamed archetype occurrences) are emitted when
 * present on the OPT, or synthesized when `emitL10nAnnotations` is true.
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
import {
  applyPathAnnotationsToOpt,
  collectL10nAnnotationsFromWebTemplateTree,
  flattenOptPathAnnotations,
  optAnnotationsForXml,
  type OptPathAnnotationMap,
} from "./opt_l10n.ts";
import type { WebTemplate } from "../serialization/simplified/types.ts";

export interface OptXmlSerializerConfig {
  templateNamespace?: string;
  /**
   * When true (default), emit path `<annotations>` including any `L10n.*`
   * entries already on the OPT. Set false to omit the annotations section.
   */
  includeAnnotations?: boolean;
  /**
   * When set, synthesize `L10n.{lang}` annotations from the Web Template
   * tree's `localizedNames` (workaround for OPT's single ontology-per-
   * archetype-id limit). Merged with existing OPT annotations.
   */
  l10nFromWebTemplate?: WebTemplate;
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

function serializeNumericInterval(
  interval?: {
    lower?: number;
    upper?: number;
    lower_included?: boolean;
    upper_included?: boolean;
    lower_unbounded?: boolean;
    upper_unbounded?: boolean;
  },
): Record<string, unknown> | undefined {
  if (!interval) return undefined;
  const out: Record<string, unknown> = {};
  if (interval.lower_included !== undefined) {
    out.lower_included = interval.lower_included;
  }
  if (interval.upper_included !== undefined) {
    out.upper_included = interval.upper_included;
  }
  if (interval.lower_unbounded !== undefined) {
    out.lower_unbounded = interval.lower_unbounded;
  }
  if (interval.upper_unbounded !== undefined) {
    out.upper_unbounded = interval.upper_unbounded;
  }
  if (interval.lower !== undefined) out.lower = interval.lower;
  if (interval.upper !== undefined) out.upper = interval.upper;
  return Object.keys(out).length ? out : undefined;
}

type TerminologyCodeRuntime = openehr_am.C_TERMINOLOGY_CODE & {
  code_list?: string[];
  terminology_id?: string;
};

type QuantityItemRuntime = Omit<openehr_am.C_QUANTITY_ITEM, "magnitude"> & {
  magnitude?: {
    lower?: number;
    upper?: number;
    lower_included?: boolean;
    upper_included?: boolean;
    lower_unbounded?: boolean;
    upper_unbounded?: boolean;
  };
  precision?: {
    lower?: number;
    upper?: number;
    lower_included?: boolean;
    upper_included?: boolean;
    lower_unbounded?: boolean;
    upper_unbounded?: boolean;
  };
};

type QuantityAssumedValue = {
  magnitude?: number;
  units?: string;
  precision?: number;
};

type OrdinalRuntime = Omit<openehr_am.C_ORDINAL, "list"> & {
  list?: openehr_am.ORDINAL[];
};

function terminologyIdValue(
  tid: openehr_base.TERMINOLOGY_ID | string | undefined,
): string | undefined {
  if (!tid) return undefined;
  if (typeof tid === "string") return tid;
  return tid.value;
}

function serializeCTerminologyCode(
  obj: TerminologyCodeRuntime,
  base: Record<string, unknown>,
): Record<string, unknown> {
  base["@_xsi:type"] = "C_CODE_PHRASE";
  base.rm_type_name = obj.rm_type_name ?? "CODE_PHRASE";
  const tid = obj.terminology_id ??
    obj.assumed_value?.terminology_id;
  if (tid) base.terminology_id = { value: tid };
  const codes = obj.code_list?.length
    ? obj.code_list
    : (obj.constraint ? [obj.constraint] : []);
  if (codes.length) base.code_list = codes;
  if (obj.assumed_value?.code_string) {
    const assumed: Record<string, unknown> = {
      code_string: obj.assumed_value.code_string,
    };
    const assumedTid = obj.assumed_value.terminology_id ?? tid;
    if (assumedTid) assumed.terminology_id = { value: assumedTid };
    base.assumed_value = assumed;
  }
  return base;
}

function serializeCQuantity(
  obj: openehr_am.C_QUANTITY,
  base: Record<string, unknown>,
): Record<string, unknown> {
  base["@_xsi:type"] = "C_DV_QUANTITY";
  base.rm_type_name = obj.rm_type_name ?? "DV_QUANTITY";
  if (obj.property) {
    base.property = {
      terminology_id: { value: "openehr" },
      code_string: obj.property,
    };
  }
  const items = ((obj as { list?: QuantityItemRuntime[] }).list ?? []).map(
    (item) => {
      const rec: Record<string, unknown> = {};
      const mag = serializeNumericInterval(item.magnitude);
      if (mag) rec.magnitude = mag;
      const prec = serializeNumericInterval(item.precision);
      if (prec) rec.precision = prec;
      if (item.units) rec.units = item.units;
      return rec;
    },
  ).filter((rec) => Object.keys(rec).length);
  if (items.length) base.list = items;
  const assumed = obj.assumed_value as QuantityAssumedValue | undefined;
  if (
    assumed &&
    (assumed.magnitude !== undefined || assumed.units !== undefined ||
      assumed.precision !== undefined)
  ) {
    const rec: Record<string, unknown> = {};
    if (assumed.magnitude !== undefined) rec.magnitude = assumed.magnitude;
    if (assumed.units !== undefined) rec.units = assumed.units;
    if (assumed.precision !== undefined) rec.precision = assumed.precision;
    base.assumed_value = rec;
  }
  return base;
}

function serializeOrdinalSymbol(
  symbol?: openehr_base.CODE_PHRASE,
): Record<string, unknown> | undefined {
  if (!symbol?.code_string) return undefined;
  const defining: Record<string, unknown> = {
    code_string: symbol.code_string,
  };
  const tid = terminologyIdValue(symbol.terminology_id);
  if (tid) defining.terminology_id = { value: tid };
  return { defining_code: defining };
}

function serializeCOrdinal(
  obj: OrdinalRuntime,
  base: Record<string, unknown>,
): Record<string, unknown> {
  base["@_xsi:type"] = "C_DV_ORDINAL";
  base.rm_type_name = obj.rm_type_name ?? "DV_ORDINAL";
  const items = (obj.list ?? []).map((ord) => {
    const rec: Record<string, unknown> = {};
    if (ord.value !== undefined) rec.value = ord.value;
    const symbol = serializeOrdinalSymbol(ord.symbol);
    if (symbol) rec.symbol = symbol;
    return rec;
  }).filter((rec) => Object.keys(rec).length);
  if (items.length) base.list = items;
  const assumed = obj.assumed_value as openehr_am.ORDINAL | undefined;
  if (assumed && (assumed.value !== undefined || assumed.symbol)) {
    const rec: Record<string, unknown> = {};
    if (assumed.value !== undefined) rec.value = assumed.value;
    const symbol = serializeOrdinalSymbol(assumed.symbol);
    if (symbol) rec.symbol = symbol;
    base.assumed_value = rec;
  }
  return base;
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

  if (obj instanceof openehr_am.C_TERMINOLOGY_CODE) {
    return serializeCTerminologyCode(obj as TerminologyCodeRuntime, base);
  }

  if (obj instanceof openehr_am.C_QUANTITY) {
    return serializeCQuantity(obj, base);
  }

  if (obj instanceof openehr_am.C_ORDINAL) {
    return serializeCOrdinal(obj as OrdinalRuntime, base);
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
  private config: {
    templateNamespace: string;
    includeAnnotations: boolean;
    l10nFromWebTemplate?: WebTemplate;
  };

  constructor(config?: OptXmlSerializerConfig) {
    this.config = {
      templateNamespace: config?.templateNamespace ??
        "http://schemas.openehr.org/v1",
      includeAnnotations: config?.includeAnnotations ?? true,
      l10nFromWebTemplate: config?.l10nFromWebTemplate,
    };
  }

  serialize(opt: openehr_am.OPERATIONAL_TEMPLATE): string {
    // Merge synthesized L10n into a throwaway annotation map for XML only —
    // do not mutate the caller's OPT.
    let annotationSource = opt;
    if (this.config.l10nFromWebTemplate?.tree) {
      const fromWt: OptPathAnnotationMap =
        collectL10nAnnotationsFromWebTemplateTree(
          this.config.l10nFromWebTemplate.tree,
        );
      // Clone annotation documentation onto a shallow shell for emit.
      const shell = Object.create(
        Object.getPrototypeOf(opt),
        Object.getOwnPropertyDescriptors(opt),
      ) as openehr_am.OPERATIONAL_TEMPLATE;
      (shell as { annotations?: unknown }).annotations = undefined;
      applyPathAnnotationsToOpt(shell, flattenOptPathAnnotations(opt));
      applyPathAnnotationsToOpt(shell, fromWt);
      annotationSource = shell;
    }

    const templateId = opt.archetype_id?.value ?? "template.en.v1";
    const ctx: SerializeCtx = {
      termsByArchetype: termsByArchetypeFromOpt(opt),
    };
    const definition = opt.definition
      ? serializeCObject(opt.definition, ctx)
      : { rm_type_name: "COMPOSITION", "@_xsi:type": "C_COMPLEX_OBJECT" };

    const template: Record<string, unknown> = {
      "@_xmlns": this.config.templateNamespace,
      "@_xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
      "@_xmlns:xsd": "http://www.w3.org/2001/XMLSchema",
      template_id: { value: templateId },
      language: opt.original_language
        ? { code_string: opt.original_language }
        : { code_string: "en" },
      concept: opt.concept ?? templateId,
      definition,
    };

    if (this.config.includeAnnotations) {
      const annotations = optAnnotationsForXml(annotationSource).map(
        ({ path, items }) => ({
          "@_path": path,
          items: Object.entries(items).map(([id, text]) => ({
            "@_id": id,
            "#text": text,
          })),
        }),
      );
      if (annotations.length) template.annotations = annotations;
    }

    const doc = {
      "?xml": { "@_version": "1.0", "@_encoding": "utf-8" },
      template,
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
