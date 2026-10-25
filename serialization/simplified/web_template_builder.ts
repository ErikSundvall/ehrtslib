/**
 * Build Web Template JSON tree from an operational template (OPT).
 */

import * as openehr_am from "../../am/openehr_am.ts";
import type {
  QuantityItemInterval,
  QuantityItemRuntime,
} from "../../parser/legacy/xml_aom_mapper.ts";
import * as openehr_base from "../../base/openehr_base.ts";
import { isDataValueType as metaIsDataValueType } from "../../meta/mod.ts";
import type {
  WebTemplate,
  WebTemplateInput,
  WebTemplateInputListItem,
  WebTemplateNode,
} from "./types.ts";
import {
  joinAqlPath,
  nodeIdToAtCode,
  normalizeWebTemplateId,
  templateRootId,
} from "./normalize.ts";
import { inputsForRmType, resolveDvType } from "./dv_field_maps.ts";
import {
  type OperationalTemplateWithTermScopes,
  resolveTermEntry,
  TERM_ARCHETYPE_SCOPE_KEY,
  TERM_NAME_FALLBACK_NODE_ID_KEY,
  type TermEntry,
  type TermScopeMeta,
} from "../../generation/term_scope.ts";
import { languageCode } from "../../generation/term_codes.ts";
import {
  readTemplateId,
  type TermBag,
  type TermDefinitionTable,
} from "../../am/util/ontology_merge.ts";
import {
  annotationsForAqlPath,
  applyL10nToLocalizedNames,
  flattenOptPathAnnotations,
  type OptPathAnnotationMap,
} from "../../generation/opt_l10n.ts";

/** Empty complex shell so a slot still appears as a node, as it did when OPT XML mapped slots to `C_COMPLEX_OBJECT`. */
function complexShellFromSlot(
  slot: openehr_am.ARCHETYPE_SLOT,
): openehr_am.C_COMPLEX_OBJECT {
  const obj = new openehr_am.C_COMPLEX_OBJECT();
  obj.rm_type_name = slot.rm_type_name;
  obj.node_id = slot.node_id;
  obj.occurrences = slot.occurrences;
  const src = slot as TermScopeMeta;
  const dest = obj as TermScopeMeta;
  if (src[TERM_ARCHETYPE_SCOPE_KEY]) {
    dest[TERM_ARCHETYPE_SCOPE_KEY] = src[TERM_ARCHETYPE_SCOPE_KEY];
  }
  if (src[TERM_NAME_FALLBACK_NODE_ID_KEY]) {
    dest[TERM_NAME_FALLBACK_NODE_ID_KEY] = src[TERM_NAME_FALLBACK_NODE_ID_KEY];
  }
  return obj;
}

/**
 * Which language supplies Web Template node ids.
 * `"primary"` slugs the resolved label (primary language, then the other
 * listed languages, then `original_language`). `"original"` slugs
 * `original_language` only.
 */
export type WebTemplateIdLanguage = "primary" | "original";

export interface WebTemplateBuilderOptions {
  /**
   * Languages to include, in order. The first entry is the primary language:
   * it drives labels and, unless `idLanguage` is `"original"`, node ids.
   * Further entries are additional languages for `localizedNames`,
   * `localizedDescriptions`, and coded-list `localizedLabels`.
   * Omitted, or an empty list, means the template's `original_language` only.
   */
  languages?: string[];
  /**
   * Language used for node ids, and therefore FLAT path segments.
   * Defaults to `"primary"`. AQL paths stay archetype node ids plus any
   * fixed `name/value` predicate already written in the OPT.
   */
  idLanguage?: WebTemplateIdLanguage;
  /** Mark composition-level metadata nodes as ctx (for FLAT ctx/ prefix). */
  includeContextNodes?: boolean;
  /**
   * Promote OPT `L10n.{lang}` path annotations into node `localizedNames`
   * and attach all path annotations to `node.annotations` (default true).
   */
  applyL10nAnnotations?: boolean;
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
): TermEntry {
  return resolveTermEntry(nodeId, undefined, terms, {}, undefined) ?? {};
}

type TerminologyCodeRuntime = openehr_am.C_TERMINOLOGY_CODE & {
  code_list?: string[];
  terminology_id?: string;
};

function nestedTerminologyCode(
  cObj?: openehr_am.C_OBJECT,
): TerminologyCodeRuntime | undefined {
  if (!cObj) return undefined;
  if (cObj instanceof openehr_am.C_TERMINOLOGY_CODE) {
    return cObj as TerminologyCodeRuntime;
  }
  if (cObj instanceof openehr_am.C_COMPLEX_OBJECT) {
    for (const attr of cObj.attributes ?? []) {
      for (
        const child
          of (attr as { children?: openehr_am.C_OBJECT[] }).children ??
            []
      ) {
        const found = nestedTerminologyCode(child);
        if (found) return found;
      }
    }
  }
  return undefined;
}

function applyStringList(
  inputs: WebTemplateInput[],
  cObj: openehr_am.C_STRING,
): void {
  const list = (cObj as { list?: string[] }).list;
  if (!list?.length) return;
  const target = inputs.find((i) => !i.suffix) ?? inputs[0];
  const items = list.map((v) => ({ value: v }));
  if (target) target.list = items;
  else inputs.push({ type: "TEXT", list: items });
}

type QuantityAssumedValue = {
  magnitude?: number;
  units?: string;
  precision?: number;
};

function intervalToRange(
  interval?: QuantityItemInterval,
): Record<string, unknown> | undefined {
  if (!interval) return undefined;
  const out: Record<string, unknown> = {};
  if (interval.lower !== undefined && !interval.lower_unbounded) {
    out.min = interval.lower;
    out.minOp = interval.lower_included === false ? ">" : ">=";
  }
  if (interval.upper !== undefined && !interval.upper_unbounded) {
    out.max = interval.upper;
    out.maxOp = interval.upper_included === false ? "<" : "<=";
  }
  return Object.keys(out).length ? out : undefined;
}

function validationFromQuantityItem(
  item?: QuantityItemRuntime,
): Record<string, unknown> | undefined {
  if (!item) return undefined;
  const range = intervalToRange(item.magnitude);
  const precision = intervalToRange(item.precision);
  if (!range && !precision) return undefined;
  const validation: Record<string, unknown> = {};
  if (range) validation.range = range;
  if (precision) validation.precision = precision;
  return validation;
}

function applyQuantityInputs(
  inputs: WebTemplateInput[],
  cObj: openehr_am.C_QUANTITY,
): void {
  const items = (cObj as { list?: QuantityItemRuntime[] }).list ?? [];
  const units = items.map((item) => item.units).filter((u): u is string => !!u);
  const assumed = cObj.assumed_value as QuantityAssumedValue | undefined;
  const unitInput = inputs.find((i) => i.suffix === "unit");
  const magInput = inputs.find((i) => i.suffix === "magnitude");
  const validation = validationFromQuantityItem(items[0]);
  if (unitInput && units.length) {
    unitInput.list = units.map((value, index) => {
      const itemValidation = validationFromQuantityItem(items[index]) ??
        validation;
      return itemValidation ? { value, validation: itemValidation } : { value };
    });
    if (units.length === 1) unitInput.defaultValue = units[0];
  }
  if (unitInput && assumed?.units) unitInput.defaultValue = assumed.units;
  if (assumed?.magnitude !== undefined && magInput) {
    magInput.defaultValue = assumed.magnitude;
  }
  if (validation && magInput) magInput.validation = validation;
}

function applyOrdinalInputs(
  inputs: WebTemplateInput[],
  cObj: openehr_am.C_ORDINAL,
): void {
  const list = (cObj as { list?: openehr_am.ORDINAL[] }).list ?? [];
  if (!list.length) return;
  const codeInput = inputs.find((i) => i.suffix === "code") ?? inputs[0];
  if (!codeInput) return;
  codeInput.list = list
    .map((ord) => ({
      value: ord.symbol?.code_string ?? String(ord.value ?? ""),
    }))
    .filter((item) => item.value);
  const tid = list[0]?.symbol?.terminology_id?.value;
  if (tid) codeInput.terminology = tid;
}

function applyTerminologyInputs(
  inputs: WebTemplateInput[],
  term: TerminologyCodeRuntime,
  labelsFor: (code: string, scope?: string) => {
    label?: string;
    localizedLabels?: Record<string, string>;
    localizedDescriptions?: Record<string, string>;
  },
  scope?: string,
): void {
  const codeInput = inputs.find((i) => i.suffix === "code") ?? inputs[0];
  if (!codeInput) return;
  const codes = term.code_list?.length
    ? term.code_list
    : (term.constraint ? [term.constraint] : []);
  if (codes.length) {
    codeInput.list = codes.map((value) => {
      const labels = labelsFor(value, scope);
      const item: WebTemplateInputListItem = { value };
      if (labels.label) item.label = labels.label;
      if (labels.localizedLabels) item.localizedLabels = labels.localizedLabels;
      if (labels.localizedDescriptions) {
        item.localizedDescriptions = labels.localizedDescriptions;
      }
      return item;
    });
  }
  const assumed = term.assumed_value?.code_string;
  if (assumed) codeInput.defaultValue = assumed;
  const terminology = term.terminology_id ?? term.assumed_value?.terminology_id;
  if (terminology) codeInput.terminology = terminology;
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

/**
 * Single fixed value of a `name` constraint (`name/value matches {"X"}`), as
 * written by template tools for renamed archetype occurrences.
 */
export function fixedNameConstraint(
  obj: openehr_am.C_OBJECT,
): string | undefined {
  const attrs = (obj as { attributes?: openehr_am.C_ATTRIBUTE[] }).attributes;
  const nameAttr = attrs?.find((a) => a.rm_attribute_name === "name");
  const dv = (nameAttr as { children?: openehr_am.C_OBJECT[] } | undefined)
    ?.children?.[0] as { attributes?: openehr_am.C_ATTRIBUTE[] } | undefined;
  const valueAttr = dv?.attributes?.find((a) =>
    a.rm_attribute_name === "value"
  );
  const prim = (valueAttr as { children?: unknown[] } | undefined)
    ?.children?.[0] as
      | { list?: unknown; item?: { list?: unknown } }
      | undefined;
  const list = prim?.item?.list ?? prim?.list;
  if (Array.isArray(list) && list.length === 1 && typeof list[0] === "string") {
    return list[0];
  }
  return undefined;
}

/**
 * AQL path predicate for a child: node id, plus `and name/value='…'` when a
 * sibling shares the node id and the child has a fixed name constraint
 * (repeated, renamed archetype occurrences).
 */
function childPathPredicate(
  child: openehr_am.C_OBJECT,
  siblings: openehr_am.C_OBJECT[],
): string | undefined {
  const id = constraintNodeId(child);
  if (!id) return undefined;
  const name = fixedNameConstraint(child);
  if (!name) return id;
  const same = siblings.filter((s) => constraintNodeId(s) === id).length;
  return same > 1 ? `${id} and name/value='${name}'` : id;
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

/** Trim, drop empties, and keep the first occurrence of each language code. */
function orderedLanguages(values: readonly string[] | undefined): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const value of values ?? []) {
    const lang = value.trim();
    if (!lang || seen.has(lang)) continue;
    seen.add(lang);
    out.push(lang);
  }
  return out;
}

export class WebTemplateBuilder {
  private lang = "en";
  private options?: WebTemplateBuilderOptions;
  private includeContext: boolean;
  private applyL10n: boolean;
  private templateTerms: Record<string, TermBag> = {};
  private archetypeTerms: Record<string, TermDefinitionTable> = {};
  /** Primary language first, then the additional languages the caller included. */
  private selectedLanguages: string[] = [];
  private idLanguage: WebTemplateIdLanguage = "primary";
  private bagCache = new Map<
    string,
    { template: TermBag; archetype: Record<string, TermBag> }
  >();
  private pathAnnotations: OptPathAnnotationMap = {};
  private originalLang = "en";

  constructor(options?: WebTemplateBuilderOptions) {
    this.options = options;
    this.includeContext = options?.includeContextNodes ?? true;
    this.applyL10n = options?.applyL10nAnnotations ?? true;
    this.idLanguage = options?.idLanguage === "original"
      ? "original"
      : "primary";
  }

  private bags(lang: string): {
    template: TermBag;
    archetype: Record<string, TermBag>;
  } {
    const cached = this.bagCache.get(lang);
    if (cached) return cached;
    const archetype: Record<string, TermBag> = {};
    for (const [id, table] of Object.entries(this.archetypeTerms)) {
      const bag = table?.[lang];
      if (bag && Object.keys(bag).length) archetype[id] = bag;
    }
    const built = {
      template: this.templateTerms[lang] ?? {},
      archetype,
    };
    this.bagCache.set(lang, built);
    return built;
  }

  private resolveIn(
    obj: openehr_am.C_OBJECT,
    lang: string,
  ): TermEntry | undefined {
    const bags = this.bags(lang);
    const meta = obj as TermScopeMeta;
    return resolveTermEntry(
      obj.node_id,
      meta[TERM_NAME_FALLBACK_NODE_ID_KEY],
      bags.template,
      bags.archetype,
      meta[TERM_ARCHETYPE_SCOPE_KEY],
    ) ?? lookupTerm(bags.template, obj.node_id);
  }

  /** Term in one language. The original language also applies a fixed name. */
  private labelTerm(obj: openehr_am.C_OBJECT, lang: string): TermEntry {
    const resolved = this.resolveIn(obj, lang) ?? {};
    if (lang === this.originalLang) {
      const fixed = fixedNameConstraint(obj);
      if (fixed) return { ...resolved, text: fixed };
    }
    return resolved;
  }

  /**
   * Primary language, then the other listed languages, then
   * `original_language` when it was not already listed.
   */
  private fallbackLanguages(): string[] {
    if (this.selectedLanguages.includes(this.originalLang)) {
      return this.selectedLanguages;
    }
    return [...this.selectedLanguages, this.originalLang];
  }

  /**
   * Label for the primary language. Each missing text or description is
   * filled from the next language in `fallbackLanguages()`.
   */
  private displayTerm(obj: openehr_am.C_OBJECT): TermEntry {
    let text: string | undefined;
    let description: string | undefined;
    for (const lang of this.fallbackLanguages()) {
      const term = this.labelTerm(obj, lang);
      if (!text && term.text) text = term.text;
      if (!description && term.description) description = term.description;
      if (text && description) break;
    }
    return { text, description };
  }

  private localizedMaps(obj: openehr_am.C_OBJECT): {
    names?: Record<string, string>;
    descriptions?: Record<string, string>;
  } {
    const names: Record<string, string> = {};
    const descriptions: Record<string, string> = {};
    for (const lang of this.selectedLanguages) {
      const term = this.labelTerm(obj, lang);
      if (term.text) names[lang] = term.text;
      if (term.description) descriptions[lang] = term.description;
    }
    return {
      names: Object.keys(names).length ? names : undefined,
      descriptions: Object.keys(descriptions).length ? descriptions : undefined,
    };
  }

  private idText(
    obj: openehr_am.C_OBJECT,
    display: TermEntry,
    idHint: string,
  ): string {
    if (this.idLanguage === "original") {
      return this.labelTerm(obj, this.originalLang).text ?? idHint;
    }
    return display.text ?? idHint;
  }

  private termFields(
    obj: openehr_am.C_OBJECT,
    idHint: string,
    nameFallback = true,
  ): Pick<
    WebTemplateNode,
    "id" | "name" | "localizedName" | "localizedNames" | "localizedDescriptions"
  > {
    const display = this.displayTerm(obj);
    const maps = this.localizedMaps(obj);
    return {
      id: normalizeWebTemplateId(this.idText(obj, display, idHint)),
      name: display.text ?? (nameFallback ? idHint : undefined),
      localizedName: display.text,
      localizedNames: maps.names,
      localizedDescriptions: maps.descriptions,
    };
  }

  private textForCode(
    code: string,
    lang: string,
    scope?: string,
  ): TermEntry | undefined {
    const bags = this.bags(lang);
    return resolveTermEntry(
      code,
      undefined,
      bags.template,
      bags.archetype,
      scope,
    );
  }

  private labelForCode(code: string, scope?: string): string | undefined {
    for (const lang of this.fallbackLanguages()) {
      const text = this.textForCode(code, lang, scope)?.text;
      if (text) return text;
    }
    return undefined;
  }

  private codeLabels(
    code: string,
    scope?: string,
  ): {
    label?: string;
    localizedLabels?: Record<string, string>;
    localizedDescriptions?: Record<string, string>;
  } {
    const localizedLabels: Record<string, string> = {};
    const localizedDescriptions: Record<string, string> = {};
    for (const lang of this.selectedLanguages) {
      const entry = this.textForCode(code, lang, scope);
      if (entry?.text) localizedLabels[lang] = entry.text;
      if (entry?.description) localizedDescriptions[lang] = entry.description;
    }
    // One language keeps the previous `{ value, label }` item. Extra maps
    // are the EHRbase shape and only appear when another language exists.
    const multi = Object.keys(localizedLabels).length > 1 ||
      Object.keys(localizedDescriptions).length > 1;
    return {
      label: this.labelForCode(code, scope),
      localizedLabels: multi && Object.keys(localizedLabels).length
        ? localizedLabels
        : undefined,
      localizedDescriptions: multi && Object.keys(localizedDescriptions).length
        ? localizedDescriptions
        : undefined,
    };
  }

  private buildInputs(
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
      applyStringList(inputs, cObj);
    }
    if (cObj instanceof openehr_am.C_QUANTITY) {
      applyQuantityInputs(inputs, cObj);
    }
    if (cObj instanceof openehr_am.C_ORDINAL) {
      applyOrdinalInputs(inputs, cObj);
    }
    const term = nestedTerminologyCode(cObj);
    if (term) {
      const scope = (term as TermScopeMeta)[TERM_ARCHETYPE_SCOPE_KEY] ??
        (cObj as TermScopeMeta | undefined)?.[TERM_ARCHETYPE_SCOPE_KEY];
      applyTerminologyInputs(
        inputs,
        term,
        (code, codeScope) => this.codeLabels(code, codeScope ?? scope),
        scope,
      );
    }

    return inputs;
  }

  /** Attach OPT path annotations and promote L10n.* into localizedNames. */
  private decorateWithAnnotations(node: WebTemplateNode): WebTemplateNode {
    if (!this.applyL10n) return node;
    const items = annotationsForAqlPath(
      this.pathAnnotations,
      node.aqlPath,
      node.name ?? node.localizedName,
    );
    if (!items) return node;
    const localizedNames = applyL10nToLocalizedNames(
      node.localizedNames,
      items,
    );
    const forLang = localizedNames?.[this.lang];
    return {
      ...node,
      annotations: { ...(node.annotations ?? {}), ...items },
      localizedNames,
      // Prefer L10n for the active language when present; keep id stable.
      ...(forLang ? { name: forLang, localizedName: forLang } : {}),
    };
  }

  build(opt: openehr_am.OPERATIONAL_TEMPLATE): WebTemplate {
    const templateId = readTemplateId(opt) ?? opt.archetype_id?.value ??
      "template.en.v1";

    const scoped = opt as OperationalTemplateWithTermScopes;
    this.originalLang = languageCode(opt.original_language) ??
      languageCode(
        (opt.ontology as { original_language?: unknown } | undefined)
          ?.original_language,
      ) ??
      "en";
    const listed = orderedLanguages(this.options?.languages);
    this.selectedLanguages = listed.length ? listed : [this.originalLang];
    this.lang = this.selectedLanguages[0];
    this.templateTerms = (opt.ontology?.term_definitions ?? {}) as Record<
      string,
      TermBag
    >;
    this.archetypeTerms = scoped.archetype_term_definitions ?? {};
    this.bagCache.clear();
    this.pathAnnotations = this.applyL10n ? flattenOptPathAnnotations(opt) : {};

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
      defaultLanguage: this.lang,
      languages: this.selectedLanguages,
      tree: fullTree,
    };
  }

  private buildFromComplex(
    obj: openehr_am.C_COMPLEX_OBJECT,
    aqlPath: string,
    idHint: string,
    isCompositionRoot = false,
  ): WebTemplateNode {
    const { min, max } = multiplicityBounds(obj.occurrences);
    const rmType = obj.rm_type_name ?? "COMPLEX";

    const node: WebTemplateNode = {
      ...this.termFields(obj, idHint || rmType),
      rmType,
      nodeId: constraintNodeId(obj),
      min,
      max,
      aqlPath,
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
        const childId = childPathPredicate(child, children);
        const childPath = joinAqlPath(
          aqlPath,
          childId ? `${attrName}[${childId}]` : attrName,
        );
        const childLabel = child.rm_type_name?.toLowerCase() ?? attrName;
        if (
          child instanceof openehr_am.C_COMPLEX_OBJECT ||
          child instanceof openehr_am.ARCHETYPE_SLOT
        ) {
          const complex = child instanceof openehr_am.ARCHETYPE_SLOT
            ? complexShellFromSlot(child)
            : child;
          if (SKIP_RM_TYPES.has(complex.rm_type_name ?? "")) {
            const flattened = this.flattenDataStructure(
              complex,
              childPath,
              node,
            );
            node.children!.push(...flattened.children ?? []);
          } else if (complex.rm_type_name === "HISTORY") {
            node.children!.push(
              this.flattenHistory(
                complex,
                childPath,
                nodeShell(node, {
                  id: normalizeWebTemplateId(attrName),
                  rmType: "HISTORY",
                  aqlPath: childPath,
                }),
              ),
            );
          } else if (complex.rm_type_name === "ELEMENT") {
            node.children!.push(
              this.buildElement(
                complex,
                childPath,
                this.elementShell(complex, childPath),
              ),
            );
          } else {
            node.children!.push(this.buildFromComplex(
              complex,
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
    return this.decorateWithAnnotations(node);
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
        const childId = childPathPredicate(child, children);
        const childPath = joinAqlPath(
          aqlPath,
          childId ? `${attrName}[${childId}]` : attrName,
        );
        const itemLabel = attrName;
        const complex = child instanceof openehr_am.ARCHETYPE_SLOT
          ? complexShellFromSlot(child)
          : child instanceof openehr_am.C_COMPLEX_OBJECT
          ? child
          : undefined;
        if (complex) {
          if (complex.rm_type_name === "ELEMENT") {
            out.push(this.buildElement(
              complex,
              childPath,
              this.elementShell(complex, childPath),
            ));
          } else {
            out.push(this.buildFromComplex(
              complex,
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
      const { min, max } = multiplicityBounds(ev.occurrences);
      const eventShell: WebTemplateNode = this.decorateWithAnnotations({
        ...this.termFields(ev, "event", false),
        rmType: ev.rm_type_name ?? "EVENT",
        nodeId: constraintNodeId(ev),
        min,
        max,
        aqlPath: evPath,
        children: [],
      });
      const eventChildren: WebTemplateNode[] = [];
      for (const attrName of ["data", "state", "protocol"] as const) {
        const attr = ev.attributes?.find((a) =>
          a.rm_attribute_name === attrName
        );
        const child = (attr as { children?: openehr_am.C_OBJECT[] })
          ?.children?.[0];
        if (!(child instanceof openehr_am.C_COMPLEX_OBJECT)) continue;
        const flattened = this.flattenDataStructure(
          child,
          joinAqlPath(evPath, `${attrName}[${nodeIdToAtCode(child.node_id)}]`),
          eventShell,
        );
        eventChildren.push(...flattened.children ?? []);
      }
      eventNodes.push(
        nodeShell(eventShell, {
          children: eventChildren.length ? eventChildren : undefined,
        }),
      );
    }

    return nodeShell(shell, {
      id: normalizeWebTemplateId(shell.id || "history"),
      children: eventNodes.length ? eventNodes : undefined,
    });
  }

  /** ELEMENT shell uses the element's own term and node id, not the parent's. */
  private elementShell(
    child: openehr_am.C_OBJECT,
    aqlPath: string,
  ): WebTemplateNode {
    const { min, max } = multiplicityBounds(child.occurrences);
    return {
      ...this.termFields(
        child,
        child.rm_type_name?.toLowerCase() ?? "element",
      ),
      rmType: "ELEMENT",
      nodeId: constraintNodeId(child),
      min,
      max,
      aqlPath,
    };
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
        const fields = this.termFields(obj, shell.id);
        if (fields.localizedName && !leaf.localizedName) {
          leaf.name = fields.name;
          leaf.localizedName = fields.localizedName;
          leaf.id = fields.id;
          leaf.localizedNames = fields.localizedNames;
        }
        if (fields.localizedDescriptions && !leaf.localizedDescriptions) {
          leaf.localizedDescriptions = fields.localizedDescriptions;
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
    const { min, max } = multiplicityBounds(obj.occurrences);
    return this.decorateWithAnnotations({
      ...this.termFields(obj, idHint),
      rmType,
      nodeId: constraintNodeId(obj),
      min,
      max,
      aqlPath,
      inputs: this.buildInputs(rmType, obj),
    });
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
      inputs: this.buildInputs(rmType, child),
    }];
  }
}

export function buildWebTemplate(
  opt: openehr_am.OPERATIONAL_TEMPLATE,
  options?: WebTemplateBuilderOptions,
): WebTemplate {
  return new WebTemplateBuilder(options).build(opt);
}
