/**
 * Build Web Template JSON tree from an operational template (OPT).
 */

import * as openehr_am from "../../openehr_am.ts";
import * as openehr_base from "../../openehr_base.ts";
import type { WebTemplate, WebTemplateInput, WebTemplateNode } from "./types.ts";
import { nodeIdToAtCode, normalizeWebTemplateId, templateRootId, joinAqlPath } from "./normalize.ts";

export interface WebTemplateBuilderOptions {
  defaultLanguage?: string;
  /** Mark composition-level metadata nodes as ctx (for FLAT ctx/ prefix). */
  includeContextNodes?: boolean;
}

type TermBag = Record<string, { text?: unknown; description?: unknown }>;

function termLabel(val: unknown): string | undefined {
  if (typeof val === "string" && val && val !== "[object Object]") return val;
  if (val && typeof val === "object") {
    const o = val as Record<string, unknown>;
    return termLabel(o.value) ?? termLabel(o.text) ?? termLabel(o["#text"]);
  }
  return undefined;
}

const SKIP_RM_TYPES = new Set([
  "ITEM_TREE",
  "ITEM_LIST",
  "ITEM_SINGLE",
  "ITEM_TABLE",
]);

const DV_LEAF_TYPES = new Set([
  "DV_TEXT",
  "DV_CODED_TEXT",
  "DV_QUANTITY",
  "DV_COUNT",
  "DV_PROPORTION",
  "DV_DATE",
  "DV_TIME",
  "DV_DATE_TIME",
  "DV_DURATION",
  "DV_BOOLEAN",
  "DV_IDENTIFIER",
  "DV_URI",
  "DV_EHR_URI",
  "DV_MULTIMEDIA",
  "DV_PARSABLE",
  "CODE_PHRASE",
]);

const CONTEXT_ATTRS = new Set([
  "category",
  "composer",
  "language",
  "territory",
  "context",
]);

function multiplicityBounds(
  m?: openehr_base.Multiplicity_interval,
): { min: number; max: number } {
  if (!m) return { min: 0, max: 1 };
  const min = m.lower ?? 0;
  const max = m.upper_unbounded ? -1 : (m.upper ?? 1);
  return { min, max };
}

function lookupTerm(
  terms: TermBag,
  nodeId?: string,
): { text?: string; description?: string } {
  if (!nodeId) return {};
  const at = nodeIdToAtCode(nodeId);
  const raw = terms[nodeId] ?? terms[at];
  if (!raw) return {};
  return {
    text: termLabel(raw.text),
    description: termLabel(raw.description),
  };
}

function buildInputs(rmType: string, cObj?: openehr_am.C_OBJECT): WebTemplateInput[] {
  const inputs: WebTemplateInput[] = [];
  if (rmType === "DV_QUANTITY" || rmType === "C_QUANTITY") {
    inputs.push({ type: "DECIMAL", suffix: "magnitude" });
    inputs.push({ type: "TEXT", suffix: "unit" });
  } else if (rmType === "DV_CODED_TEXT" || rmType === "C_CODED_TEXT") {
    inputs.push({ type: "TEXT", suffix: "code" });
    inputs.push({ type: "TEXT", suffix: "value" });
    inputs.push({ type: "TEXT", suffix: "terminology" });
  } else if (rmType.startsWith("DV_") || rmType === "C_STRING") {
    inputs.push({ type: "TEXT", suffix: "value" });
  } else if (rmType === "CODE_PHRASE" || rmType === "C_TERMINOLOGY_CODE") {
    inputs.push({ type: "TEXT", suffix: "code" });
    inputs.push({ type: "TEXT", suffix: "terminology" });
  }

  if (cObj instanceof openehr_am.C_STRING) {
    const list = (cObj as { list?: string[] }).list;
    if (list?.length) {
      inputs.push({ type: "TEXT", suffix: "value", list: list.map((v) => ({ value: v })) });
    }
  }

  return inputs;
}

function isDataValueType(rmType: string): boolean {
  return DV_LEAF_TYPES.has(rmType) || rmType.startsWith("C_");
}

export class WebTemplateBuilder {
  private lang: string;
  private includeContext: boolean;
  private terms: TermBag = {};

  constructor(options?: WebTemplateBuilderOptions) {
    this.lang = options?.defaultLanguage ?? "en";
    this.includeContext = options?.includeContextNodes ?? true;
  }

  build(opt: openehr_am.OPERATIONAL_TEMPLATE): WebTemplate {
    const templateId = opt.archetype_id?.value ?? "template.en.v1";
    this.terms = (opt.ontology?.term_definitions?.[this.lang] ?? {}) as TermBag;

    if (!opt.definition) {
      throw new Error("Operational template has no definition");
    }

    const rootId = templateRootId(templateId);
    const isComposition = opt.definition.rm_type_name === "COMPOSITION";
    const tree = this.buildFromComplex(
      opt.definition,
      "/",
      rootId,
      isComposition,
    );

    const ctxNodes = isComposition && this.includeContext
      ? this.defaultCompositionContextNodes()
      : [];
    const existingCtxIds = new Set(
      (tree.children ?? []).filter((c) => c.inContext).map((c) => c.id),
    );
    const mergedCtx = [
      ...ctxNodes.filter((n) => !existingCtxIds.has(n.id)),
      ...(tree.children ?? []).filter((c) => c.inContext),
    ];
    const contentChildren = (tree.children ?? []).filter((c) => !c.inContext);

    return {
      templateId,
      version: "1.0.0",
      defaultLanguage: opt.original_language ?? this.lang,
      tree: {
        ...tree,
        id: rootId,
        rmType: opt.definition.rm_type_name ?? "COMPOSITION",
        aqlPath: "/",
        children: [...mergedCtx, ...contentChildren],
      },
    };
  }

  private buildFromComplex(
    obj: openehr_am.C_COMPLEX_OBJECT,
    aqlPath: string,
    idHint: string,
    isCompositionRoot = false,
  ): WebTemplateNode {
    const term = lookupTerm(this.terms, obj.node_id);
    const { min, max } = multiplicityBounds(obj.occurrences);
    const rmType = obj.rm_type_name ?? "COMPLEX";

    const node: WebTemplateNode = {
      id: normalizeWebTemplateId(term.text ?? idHint ?? rmType),
      name: term.text ?? idHint,
      localizedName: term.text,
      rmType,
      nodeId: nodeIdToAtCode(obj.node_id),
      min,
      max,
      aqlPath,
      localizedNames: term.text ? { [this.lang]: term.text } : undefined,
      localizedDescriptions: term.description
        ? { [this.lang]: term.description }
        : undefined,
      children: [],
    };

    if (SKIP_RM_TYPES.has(rmType)) {
      return this.flattenDataStructure(obj, aqlPath, node);
    }

    if (rmType === "HISTORY") {
      return this.flattenHistory(obj, aqlPath, node);
    }

    if (rmType === "ELEMENT") {
      return this.buildElement(obj, aqlPath, node);
    }

    for (const attr of obj.attributes ?? []) {
      const attrName = attr.rm_attribute_name;
      if (!attrName) continue;

      if (isCompositionRoot && this.includeContext && CONTEXT_ATTRS.has(attrName)) {
        node.children!.push(...this.buildContextNodes(attr));
        continue;
      }

      const children = (attr as { children?: openehr_am.C_OBJECT[] }).children ?? [];

      for (const child of children) {
        const childPath = joinAqlPath(
          aqlPath,
          `${attrName}[${nodeIdToAtCode(child.node_id) || "at0000"}]`,
        );
        const childLabel = lookupTerm(this.terms, child.node_id).text ??
          child.rm_type_name?.toLowerCase() ??
          attrName;
        if (child instanceof openehr_am.C_COMPLEX_OBJECT) {
          if (SKIP_RM_TYPES.has(child.rm_type_name ?? "")) {
            node.children!.push(...this.flattenDataStructure(child, childPath, node).children ?? []);
          } else if (child.rm_type_name === "HISTORY") {
            node.children!.push(this.flattenHistory(child, childPath, {
              ...node,
              id: normalizeWebTemplateId(attrName),
              rmType: "HISTORY",
              aqlPath: childPath,
              children: [],
            }));
          } else if (child.rm_type_name === "ELEMENT") {
            node.children!.push(this.buildElement(child, childPath, {
              ...node,
              id: normalizeWebTemplateId(childLabel),
              rmType: "ELEMENT",
              aqlPath: childPath,
            }));
          } else {
            node.children!.push(this.buildFromComplex(
              child,
              childPath,
              childLabel,
            ));
          }
        } else if (isDataValueType(child.rm_type_name ?? "")) {
          node.children!.push(this.buildLeaf(child, childPath, childLabel));
        }
      }
    }

    if (!node.children?.length) delete node.children;
    return node;
  }

  private flattenDataStructure(
    obj: openehr_am.C_COMPLEX_OBJECT,
    aqlPath: string,
    parent: WebTemplateNode,
  ): WebTemplateNode {
    const out: WebTemplateNode[] = [];
    for (const attr of obj.attributes ?? []) {
      const attrName = attr.rm_attribute_name;
      if (!attrName) continue;
      const children = (attr as { children?: openehr_am.C_OBJECT[] }).children ?? [];
      for (const child of children) {
        const childPath = joinAqlPath(
          aqlPath,
          `${attrName}[${nodeIdToAtCode(child.node_id) || "at0000"}]`,
        );
        const itemLabel = lookupTerm(this.terms, child.node_id).text ?? attrName;
        if (child instanceof openehr_am.C_COMPLEX_OBJECT) {
          if (child.rm_type_name === "ELEMENT") {
            out.push(this.buildElement(child, childPath, {
              ...parent,
              id: normalizeWebTemplateId(itemLabel),
              rmType: "ELEMENT",
              aqlPath: childPath,
            }));
          } else {
            out.push(this.buildFromComplex(
              child,
              childPath,
              itemLabel,
            ));
          }
        }
      }
    }
    return { ...parent, children: out.length ? out : undefined };
  }

  private flattenHistory(
    obj: openehr_am.C_COMPLEX_OBJECT,
    aqlPath: string,
    shell: WebTemplateNode,
  ): WebTemplateNode {
    const eventsAttr = obj.attributes?.find((a) => a.rm_attribute_name === "events");
    const events = (eventsAttr as { children?: openehr_am.C_OBJECT[] })?.children ?? [];
    const eventNodes: WebTemplateNode[] = [];

    for (const ev of events) {
      if (!(ev instanceof openehr_am.C_COMPLEX_OBJECT)) continue;
      const evPath = joinAqlPath(aqlPath, `events[${nodeIdToAtCode(ev.node_id)}]`);
      const term = lookupTerm(this.terms, ev.node_id);
      const { min, max } = multiplicityBounds(ev.occurrences);
      const eventShell: WebTemplateNode = {
        id: normalizeWebTemplateId(term.text ?? "event"),
        name: term.text,
        localizedName: term.text,
        rmType: ev.rm_type_name ?? "EVENT",
        nodeId: nodeIdToAtCode(ev.node_id),
        min,
        max,
        aqlPath: evPath,
        children: [],
      };
      const dataAttr = ev.attributes?.find((a) => a.rm_attribute_name === "data");
      const dataChild = (dataAttr as { children?: openehr_am.C_OBJECT[] })?.children?.[0];
      if (dataChild instanceof openehr_am.C_COMPLEX_OBJECT) {
        eventNodes.push(this.flattenDataStructure(
          dataChild,
          joinAqlPath(evPath, `data[${nodeIdToAtCode(dataChild.node_id)}]`),
          eventShell,
        ));
      } else {
        eventNodes.push(eventShell);
      }
    }

    return {
      ...shell,
      id: normalizeWebTemplateId(shell.id || "history"),
      children: eventNodes.length ? eventNodes : undefined,
    };
  }

  private buildElement(
    obj: openehr_am.C_COMPLEX_OBJECT,
    aqlPath: string,
    shell: WebTemplateNode,
  ): WebTemplateNode {
    const valueAttr = obj.attributes?.find((a) => a.rm_attribute_name === "value");
    const valueChild = (valueAttr as { children?: openehr_am.C_OBJECT[] })?.children?.[0];
    if (valueChild) {
      return this.buildLeaf(valueChild, aqlPath, shell.id);
    }
    return shell;
  }

  private buildLeaf(
    obj: openehr_am.C_OBJECT,
    aqlPath: string,
    idHint: string,
  ): WebTemplateNode {
    const rmType = obj.rm_type_name ?? "DV_TEXT";
    const term = lookupTerm(this.terms, obj.node_id);
    const { min, max } = multiplicityBounds(obj.occurrences);
    return {
      id: normalizeWebTemplateId(term.text ?? idHint),
      name: term.text ?? idHint,
      localizedName: term.text,
      rmType,
      nodeId: nodeIdToAtCode(obj.node_id),
      min,
      max,
      aqlPath,
      inputs: buildInputs(rmType, obj),
    };
  }

  private defaultCompositionContextNodes(): WebTemplateNode[] {
    return [
      {
        id: "language",
        rmType: "CODE_PHRASE",
        min: 1,
        max: 1,
        aqlPath: "/language",
        inContext: true,
        inputs: [{ type: "TEXT", suffix: "value" }],
      },
      {
        id: "territory",
        rmType: "CODE_PHRASE",
        min: 1,
        max: 1,
        aqlPath: "/territory",
        inContext: true,
        inputs: [{ type: "TEXT", suffix: "value" }],
      },
      {
        id: "composer_name",
        rmType: "DV_TEXT",
        min: 0,
        max: 1,
        aqlPath: "/composer",
        inContext: true,
        inputs: [{ type: "TEXT", suffix: "value" }],
      },
      {
        id: "time",
        rmType: "DV_DATE_TIME",
        min: 0,
        max: 1,
        aqlPath: "/context/start_time",
        inContext: true,
        inputs: [{ type: "TEXT", suffix: "value" }],
      },
    ];
  }

  private buildContextNodes(attr: openehr_am.C_ATTRIBUTE): WebTemplateNode[] {
    const name = attr.rm_attribute_name ?? "context";
    const child = (attr as { children?: openehr_am.C_OBJECT[] }).children?.[0];
    const rmType = child?.rm_type_name ?? name.toUpperCase();

    if (name === "context" && child instanceof openehr_am.C_COMPLEX_OBJECT) {
      const nodes: WebTemplateNode[] = [];
      for (const ctxAttr of child.attributes ?? []) {
        const ctxName = ctxAttr.rm_attribute_name;
        if (!ctxName) continue;
        nodes.push({
          id: ctxName,
          rmType: "DV_TEXT",
          min: 0,
          max: 1,
          aqlPath: `/context/${ctxName}`,
          inContext: true,
          inputs: [{ type: "TEXT", suffix: "value" }],
        });
      }
      return nodes;
    }

    return [{
      id: name,
      rmType,
      min: 1,
      max: 1,
      aqlPath: `/${name}`,
      inContext: true,
      inputs: buildInputs(rmType, child),
    }];
  }
}

export function buildWebTemplate(
  opt: openehr_am.OPERATIONAL_TEMPLATE,
  options?: WebTemplateBuilderOptions,
): WebTemplate {
  return new WebTemplateBuilder(options).build(opt);
}
