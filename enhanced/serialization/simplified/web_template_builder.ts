/**
 * Build Web Template JSON tree from an operational template (OPT).
 */

import * as openehr_am from "../../openehr_am.ts";
import * as openehr_base from "../../openehr_base.ts";
import { isDataValueType as metaIsDataValueType } from "../../meta/mod.ts";
import type {
  WebTemplate,
  WebTemplateInput,
  WebTemplateNode,
} from "./types.ts";
import {
  joinAqlPath,
  nodeIdToAtCode,
  normalizeWebTemplateId,
  templateRootId,
} from "./normalize.ts";
import { inputsForRmType, resolveDvType } from "./dv_field_maps.ts";

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

const CONTEXT_ATTRS = new Set([
  "category",
  "composer",
  "language",
  "territory",
  "context",
]);

/** Unwrap plain numbers or primitive wrapper objects (Integer) to number. */
function boundValue(v: unknown): number | undefined {
  if (typeof v === "number") return v;
  if (v && typeof v === "object") {
    const inner = (v as { value?: unknown }).value;
    if (typeof inner === "number") return inner;
  }
  return undefined;
}

function multiplicityBounds(
  m?: openehr_base.Multiplicity_interval,
): { min: number; max: number } {
  if (!m) return { min: 0, max: 1 };
  const min = boundValue(m.lower) ?? 0;
  const max = m.upper_unbounded ? -1 : (boundValue(m.upper) ?? 1);
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

function buildInputs(
  rmType: string,
  cObj?: openehr_am.C_OBJECT,
): WebTemplateInput[] {
  const resolved = resolveDvType(rmType);
  const inputs: WebTemplateInput[] = resolved.startsWith("DV_") ||
      resolved === "CODE_PHRASE" || resolved.startsWith("PARTY_") ||
      rmType.startsWith("C_")
    ? inputsForRmType(resolved)
    : [];

  if (cObj instanceof openehr_am.C_STRING) {
    const list = (cObj as { list?: string[] }).list;
    if (list?.length) {
      const target = inputs.find((i) => !i.suffix) ?? inputs[0];
      if (target) {
        target.list = list.map((v) => ({ value: v }));
      } else {
        inputs.push({ type: "TEXT", list: list.map((v) => ({ value: v })) });
      }
    }
  }

  return inputs;
}

function isDataValueType(rmType: string): boolean {
  // Web Template also treats AM constraint types (C_*) as "value-like" leaves.
  return metaIsDataValueType(rmType) || rmType === "CODE_PHRASE" ||
    rmType.startsWith("C_");
}

/**
 * Node id used in AQL path predicates and as the WT nodeId: archetype roots
 * are addressed by their archetype id, other nodes by their at-code.
 */
function constraintNodeId(obj: openehr_am.C_OBJECT): string | undefined {
  const ref = (obj as openehr_am.C_ARCHETYPE_ROOT).archetype_ref;
  if (obj instanceof openehr_am.C_ARCHETYPE_ROOT && ref) return ref;
  return nodeIdToAtCode(obj.node_id) || undefined;
}

/** Copy node metadata without inheriting `children`/`inputs` from base. */
function nodeShell(
  base: WebTemplateNode,
  patch: Partial<WebTemplateNode>,
): WebTemplateNode {
  const {
    children: _children,
    inputs: _inputs,
    inContext: _inContext,
    ...rest
  } = base;
  return { ...rest, ...patch };
}

/**
 * Ensure sibling ids are unique by appending `_1`, `_2`, ... to duplicates
 * (spec: node id generation rule 7 — uniqueness among siblings).
 */
function dedupeSiblingIds(node: WebTemplateNode): void {
  if (!node.children?.length) return;
  const seen = new Map<string, number>();
  for (const child of node.children) {
    const count = seen.get(child.id) ?? 0;
    seen.set(child.id, count + 1);
    if (count > 0) child.id = `${child.id}_${count}`;
  }
  for (const child of node.children) dedupeSiblingIds(child);
}

export class WebTemplateBuilder {
  private lang: string;
  private requestedLang?: string;
  private includeContext: boolean;
  private terms: TermBag = {};

  constructor(options?: WebTemplateBuilderOptions) {
    this.requestedLang = options?.defaultLanguage;
    this.lang = options?.defaultLanguage ?? "en";
    this.includeContext = options?.includeContextNodes ?? true;
  }

  build(opt: openehr_am.OPERATIONAL_TEMPLATE): WebTemplate {
    const templateId = opt.archetype_id?.value ?? "template.en.v1";

    const origLang = opt.original_language;
    const defaultLanguage =
      (typeof origLang === "string"
        ? origLang
        : (origLang as { code_string?: string } | undefined)?.code_string) ??
        this.requestedLang ?? "en";

    // Pick a term language that actually has definitions: the requested one,
    // else the template's original language, else the first available.
    const termDefs = (opt.ontology?.term_definitions ?? {}) as Record<
      string,
      TermBag
    >;
    const available = Object.keys(termDefs);
    this.lang = [this.requestedLang, defaultLanguage, ...available].find(
      (l): l is string => !!l && !!termDefs[l],
    ) ?? this.requestedLang ?? defaultLanguage;
    this.terms = termDefs[this.lang] ?? {};

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

    const fullTree: WebTemplateNode = {
      ...tree,
      id: rootId,
      rmType: opt.definition.rm_type_name ?? "COMPOSITION",
      aqlPath: "/",
      children: [...mergedCtx, ...contentChildren],
    };
    dedupeSiblingIds(fullTree);

    return {
      templateId,
      version: "1.0.0",
      defaultLanguage,
      tree: fullTree,
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
      nodeId: constraintNodeId(obj),
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

      if (
        isCompositionRoot && this.includeContext && CONTEXT_ATTRS.has(attrName)
      ) {
        node.children!.push(...this.buildContextNodes(attr));
        continue;
      }

      const children =
        (attr as { children?: openehr_am.C_OBJECT[] }).children ?? [];

      for (const child of children) {
        const childId = constraintNodeId(child);
        const childPath = joinAqlPath(
          aqlPath,
          childId ? `${attrName}[${childId}]` : attrName,
        );
        const childLabel = lookupTerm(this.terms, child.node_id).text ??
          child.rm_type_name?.toLowerCase() ??
          attrName;
        if (child instanceof openehr_am.C_COMPLEX_OBJECT) {
          if (SKIP_RM_TYPES.has(child.rm_type_name ?? "")) {
            const flattened = this.flattenDataStructure(child, childPath, node);
            node.children!.push(...flattened.children ?? []);
          } else if (child.rm_type_name === "HISTORY") {
            node.children!.push(
              this.flattenHistory(
                child,
                childPath,
                nodeShell(node, {
                  id: normalizeWebTemplateId(attrName),
                  rmType: "HISTORY",
                  aqlPath: childPath,
                }),
              ),
            );
          } else if (child.rm_type_name === "ELEMENT") {
            node.children!.push(
              this.buildElement(
                child,
                childPath,
                nodeShell(node, {
                  id: normalizeWebTemplateId(childLabel),
                  rmType: "ELEMENT",
                  aqlPath: childPath,
                }),
              ),
            );
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
      const children =
        (attr as { children?: openehr_am.C_OBJECT[] }).children ?? [];
      for (const child of children) {
        const childId = constraintNodeId(child);
        const childPath = joinAqlPath(
          aqlPath,
          childId ? `${attrName}[${childId}]` : attrName,
        );
        const itemLabel = lookupTerm(this.terms, child.node_id).text ??
          attrName;
        const isComplex = child instanceof openehr_am.C_COMPLEX_OBJECT;
        if (isComplex) {
          if (child.rm_type_name === "ELEMENT") {
            out.push(this.buildElement(
              child,
              childPath,
              nodeShell(parent, {
                id: normalizeWebTemplateId(itemLabel),
                rmType: "ELEMENT",
                aqlPath: childPath,
              }),
            ));
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
    return nodeShell(parent, { children: out.length ? out : undefined });
  }

  private flattenHistory(
    obj: openehr_am.C_COMPLEX_OBJECT,
    aqlPath: string,
    shell: WebTemplateNode,
  ): WebTemplateNode {
    const eventsAttr = obj.attributes?.find((a) =>
      a.rm_attribute_name === "events"
    );
    const events =
      (eventsAttr as { children?: openehr_am.C_OBJECT[] })?.children ?? [];
    const eventNodes: WebTemplateNode[] = [];

    for (const ev of events) {
      if (!(ev instanceof openehr_am.C_COMPLEX_OBJECT)) continue;
      const evPath = joinAqlPath(
        aqlPath,
        `events[${nodeIdToAtCode(ev.node_id)}]`,
      );
      const term = lookupTerm(this.terms, ev.node_id);
      const { min, max } = multiplicityBounds(ev.occurrences);
      const eventShell: WebTemplateNode = {
        id: normalizeWebTemplateId(term.text ?? "event"),
        name: term.text,
        localizedName: term.text,
        rmType: ev.rm_type_name ?? "EVENT",
        nodeId: constraintNodeId(ev),
        min,
        max,
        aqlPath: evPath,
        localizedNames: term.text ? { [this.lang]: term.text } : undefined,
        localizedDescriptions: term.description
          ? { [this.lang]: term.description }
          : undefined,
        children: [],
      };
      const dataAttr = ev.attributes?.find((a) =>
        a.rm_attribute_name === "data"
      );
      const dataChild = (dataAttr as { children?: openehr_am.C_OBJECT[] })
        ?.children?.[0];
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

    return nodeShell(shell, {
      id: normalizeWebTemplateId(shell.id || "history"),
      children: eventNodes.length ? eventNodes : undefined,
    });
  }

  private buildElement(
    obj: openehr_am.C_COMPLEX_OBJECT,
    aqlPath: string,
    shell: WebTemplateNode,
  ): WebTemplateNode {
    const valueAttr = obj.attributes?.find((a) =>
      a.rm_attribute_name === "value"
    );
    const valueChild = (valueAttr as { children?: openehr_am.C_OBJECT[] })
      ?.children?.[0];
    if (valueChild) {
      const leaf = this.buildLeaf(valueChild, aqlPath, shell.id);
      // The value constraint usually has no node id of its own; keep the
      // ELEMENT's at-code so instances can be matched/rebuilt correctly.
      const elementNodeId = nodeIdToAtCode(obj.node_id);
      if (!leaf.nodeId && elementNodeId) {
        leaf.nodeId = elementNodeId;
        const term = lookupTerm(this.terms, obj.node_id);
        if (term.text && !leaf.localizedName) {
          leaf.name = term.text;
          leaf.localizedName = term.text;
          leaf.id = normalizeWebTemplateId(term.text);
          leaf.localizedNames = { [this.lang]: term.text };
        }
        if (term.description && !leaf.localizedDescriptions) {
          leaf.localizedDescriptions = { [this.lang]: term.description };
        }
      }
      return leaf;
    }
    return nodeShell(shell, { aqlPath, rmType: shell.rmType ?? "ELEMENT" });
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
      nodeId: constraintNodeId(obj),
      min,
      max,
      aqlPath,
      localizedNames: term.text ? { [this.lang]: term.text } : undefined,
      localizedDescriptions: term.description
        ? { [this.lang]: term.description }
        : undefined,
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
        inputs: [{ type: "TEXT" }],
      },
      {
        id: "territory",
        rmType: "CODE_PHRASE",
        min: 1,
        max: 1,
        aqlPath: "/territory",
        inContext: true,
        inputs: [{ type: "TEXT" }],
      },
      {
        id: "composer_name",
        rmType: "DV_TEXT",
        min: 0,
        max: 1,
        aqlPath: "/composer",
        inContext: true,
        inputs: [{ type: "TEXT" }],
      },
      {
        id: "time",
        rmType: "DV_DATE_TIME",
        min: 0,
        max: 1,
        aqlPath: "/context/start_time",
        inContext: true,
        inputs: [{ type: "DATETIME" }],
      },
    ];
  }

  private buildContextNodes(attr: openehr_am.C_ATTRIBUTE): WebTemplateNode[] {
    const name = attr.rm_attribute_name ?? "context";
    const child = attr.children?.[0];
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
          inputs: [{ type: "TEXT" }],
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
