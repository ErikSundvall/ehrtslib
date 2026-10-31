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
  CollapsedRmObject,
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
  instructionStateCodes,
  instructionStateRubric,
} from "../../term/openehr_group_rubrics.ts";
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
import {
  useRmAttributeAsWebTemplateId,
  webTemplateChildIdHint,
} from "./web_template_id_hints.ts";

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
  /**
   * Add `inContext` nodes for RM attributes the template does not constrain
   * but the RM requires (composition `category`, `context/start_time`,
   * `context/setting`, `composer`, `language`, `territory`; entry `language`,
   * `encoding`, `subject`; event `time`; observation `history_origin`; action
   * `time`; instruction `narrative`; activity `timing`). Default true.
   * The nodes sit at their own paths, so the output flavour can write these
   * values there and the input flavour can supply them from `ctx/`.
   */
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

/** ENTRY subtypes that get `language`, `encoding` and `subject` nodes. */
const ENTRY_RM_TYPES = new Set([
  "OBSERVATION",
  "EVALUATION",
  "INSTRUCTION",
  "ACTION",
  "ADMIN_ENTRY",
]);

const CONTEXT_NODE_NAMES: Record<string, string> = {
  category: "Category",
  start_time: "Start_time",
  setting: "Setting",
  composer: "Composer",
  language: "Language",
  territory: "Territory",
  encoding: "Encoding",
  subject: "Subject",
  time: "Time",
  history_origin: "History origin",
  narrative: "Narrative",
  timing: "Timing",
  width: "Width",
  math_function: "Math function",
  action_archetype_id: "Action archetype id",
  current_state: "Current_state",
  transition: "Transition",
  careflow_step: "Careflow_step",
};

/**
 * `inContext` node for an RM attribute that the template does not constrain.
 * Its value may come from the node path, from `ctx/`, or from a default.
 */
function rmContextNode(
  id: string,
  rmType: string,
  aqlPath: string,
  inputs?: WebTemplateInput[],
  min = 1,
): WebTemplateNode {
  return {
    id,
    name: CONTEXT_NODE_NAMES[id] ?? id,
    rmType,
    min,
    max: 1,
    aqlPath,
    inContext: true,
    inputs: inputs ?? inputsForRmType(resolveDvType(rmType)),
  };
}

/**
 * Input of an ACTIVITY `action_archetype_id` node. A template pattern (C_STRING
 * on the attribute) becomes `validation.pattern` and the default value
 * `/pattern/`, which the deserializer uses when the payload has none.
 */
function actionArchetypeIdInput(obj?: openehr_am.C_COMPLEX_OBJECT): WebTemplateInput {
  const attr = (obj?.attributes ?? []).find((a) => a.rm_attribute_name === "action_archetype_id");
  const child = attr?.children?.[0] as { item?: { pattern?: string; list?: string[] }; pattern?: string; list?: string[] } | undefined;
  const constraint = child?.item ?? child;
  const pattern = constraint?.pattern ?? (constraint?.list?.length === 1 ? constraint.list[0] : undefined);
  if (!pattern) return { type: "TEXT" };
  const bare = pattern.replace(/^\/(.*)\/$/, "$1");
  return { type: "TEXT", validation: { pattern: bare }, defaultValue: `/${bare}/` };
}

/**
 * ISM_TRANSITION of an ACTION whose template does not constrain it: any
 * openEHR instruction state as `current_state`.
 */
function defaultIsmTransitionNode(aqlPath: string): WebTemplateNode {
  const currentInputs = inputsForRmType("DV_CODED_TEXT").map((input) =>
    input.suffix === "code"
      ? {
        ...input,
        terminology: "openehr",
        list: instructionStateCodes().map((code) => ({
          value: code,
          label: instructionStateRubric(code) ?? code,
        })),
      }
      : input
  );
  return {
    id: "ism_transition",
    name: "Ism_transition",
    rmType: "ISM_TRANSITION",
    min: 1,
    max: 1,
    aqlPath,
    inContext: true,
    children: [
      rmContextNode("current_state", "DV_CODED_TEXT", `${aqlPath}/current_state`, currentInputs),
      rmContextNode("transition", "DV_CODED_TEXT", `${aqlPath}/transition`, undefined, 0),
      rmContextNode("careflow_step", "DV_CODED_TEXT", `${aqlPath}/careflow_step`, undefined, 0),
    ],
  };
}

/** Append nodes whose id is not already a child of `node`. */
function appendMissing(node: WebTemplateNode, extra: WebTemplateNode[]): void {
  const children = node.children ?? [];
  const ids = new Set(children.map((c) => c.id));
  for (const child of extra) {
    if (!ids.has(child.id)) children.push(child);
  }
  node.children = children;
}

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

function attributeExistenceBounds(
  attr: openehr_am.C_ATTRIBUTE,
): { min: number; max: number } {
  const existence = (attr as { existence?: openehr_base.Multiplicity_interval })
    .existence;
  return multiplicityBounds(existence);
}

function rmAttributeIdentity(
  attrName: string,
): Pick<WebTemplateNode, "id" | "name"> {
  const id = normalizeWebTemplateId(attrName);
  return { id, name: attrName };
}

function isRmAttributeValueLeaf(obj: openehr_am.C_COMPLEX_OBJECT): boolean {
  const rmType = obj.rm_type_name ?? "";
  return isDataValueType(rmType);
}

function singleConstrainedCode(
  ism: openehr_am.C_COMPLEX_OBJECT,
  attrName: string,
): string | undefined {
  const attr = ism.attributes?.find((a) => a.rm_attribute_name === attrName);
  const dv = (attr as { children?: openehr_am.C_OBJECT[] })?.children?.[0];
  if (!(dv instanceof openehr_am.C_COMPLEX_OBJECT)) return undefined;
  const dcAttr = dv.attributes?.find((a) =>
    a.rm_attribute_name === "defining_code"
  );
  const phrase = (dcAttr as { children?: openehr_am.C_OBJECT[] })?.children?.[0];
  const list = (phrase as { code_list?: string[] } | undefined)?.code_list;
  if (list?.length === 1) return list[0];
  return (phrase as { constraint?: string } | undefined)?.constraint;
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
  const terminology = term.terminology_id ?? term.assumed_value?.terminology_id;
  if (codes.length) {
    codeInput.list = codes.map((value) => {
      const labels = labelsFor(value, scope);
      const item: WebTemplateInputListItem = { value };
      const openehrRubric = terminology === "openehr"
        ? instructionStateRubric(value)
        : undefined;
      if (openehrRubric) item.label = openehrRubric;
      else if (labels.label) item.label = labels.label;
      if (labels.localizedLabels) item.localizedLabels = labels.localizedLabels;
      if (labels.localizedDescriptions) {
        item.localizedDescriptions = labels.localizedDescriptions;
      }
      return item;
    });
  }
  const assumed = term.assumed_value?.code_string;
  if (assumed) codeInput.defaultValue = assumed;
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
  /** RM objects without a node of their own, by AQL path. */
  private collapsed: Record<string, CollapsedRmObject> = {};
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
    this.collapsed = {};
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

    const children = isComposition && this.includeContext
      ? this.orderCompositionChildren(tree.children ?? [])
      : (tree.children ?? []);

    const fullTree: WebTemplateNode = {
      ...tree,
      id: rootId,
      rmType: opt.definition.rm_type_name ?? "COMPOSITION",
      aqlPath: "/",
      children,
      ...(Object.keys(this.collapsed).length ? { collapsed: this.collapsed } : {}),
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

  private buildRmAttributeLeaf(
    obj: openehr_am.C_OBJECT,
    aqlPath: string,
    attrName: string,
    attrBounds: { min: number; max: number },
  ): WebTemplateNode {
    const leaf = this.buildLeaf(obj, aqlPath, attrName);
    return {
      ...leaf,
      ...rmAttributeIdentity(attrName),
      min: attrBounds.min,
      max: attrBounds.max,
    };
  }

  private buildIsmTransitionObject(
    obj: openehr_am.C_COMPLEX_OBJECT,
    aqlPath: string,
    attrBounds: { min: number; max: number },
  ): WebTemplateNode {
    const shell: WebTemplateNode = {
      ...rmAttributeIdentity("ism_transition"),
      rmType: "ISM_TRANSITION",
      nodeId: constraintNodeId(obj),
      min: attrBounds.min,
      max: attrBounds.max,
      aqlPath,
      children: [],
    };
    for (const attr of obj.attributes ?? []) {
      const attrName = attr.rm_attribute_name;
      if (!attrName) continue;
      const bounds = attributeExistenceBounds(attr);
      const child = (attr as { children?: openehr_am.C_OBJECT[] }).children
        ?.[0];
      if (!(child instanceof openehr_am.C_COMPLEX_OBJECT)) continue;
      if (isRmAttributeValueLeaf(child)) {
        shell.children!.push(
          this.buildRmAttributeLeaf(
            child,
            joinAqlPath(aqlPath, attrName),
            attrName,
            bounds,
          ),
        );
      }
    }
    if (!shell.children?.length) delete shell.children;
    return this.decorateWithAnnotations(shell);
  }

  private mergeIsmCodedAttribute(
    ismObjects: openehr_am.C_COMPLEX_OBJECT[],
    attrName: string,
    ismAqlPath: string,
  ): WebTemplateNode | undefined {
    let bounds = { min: 0, max: 1 };
    for (const ism of ismObjects) {
      const attr = ism.attributes?.find((a) => a.rm_attribute_name === attrName);
      if (attr) {
        bounds = attributeExistenceBounds(attr);
        break;
      }
    }
    const dvObjects: openehr_am.C_COMPLEX_OBJECT[] = [];
    for (const ism of ismObjects) {
      const attr = ism.attributes?.find((a) => a.rm_attribute_name === attrName);
      const child = (attr as { children?: openehr_am.C_OBJECT[] })?.children?.[0];
      if (child instanceof openehr_am.C_COMPLEX_OBJECT) dvObjects.push(child);
    }
    if (!dvObjects.length) return undefined;
    const leaf = this.buildRmAttributeLeaf(
      dvObjects[0],
      joinAqlPath(ismAqlPath, attrName),
      attrName,
      bounds,
    );
    const mergedCodes = new Map<string, WebTemplateInputListItem>();
    for (const dv of dvObjects) {
      const inputs = this.buildInputs(dv.rm_type_name ?? "DV_CODED_TEXT", dv);
      for (const input of inputs) {
        if (input.suffix && input.suffix !== "code") continue;
        for (const item of input.list ?? []) {
          if (item.value) mergedCodes.set(item.value, item);
        }
      }
    }
    if (mergedCodes.size) {
      const variants = ismObjects.map((ism) => ({
        careflowStep: singleConstrainedCode(ism, "careflow_step"),
        currentState: singleConstrainedCode(ism, "current_state"),
      }));
      leaf.inputs = (leaf.inputs ?? []).map((input) => {
        if (input.suffix && input.suffix !== "code") return input;
        const list = [...mergedCodes.values()].map((item) => {
          if (attrName !== "careflow_step") return item;
          const variant = variants.find((v) => v.careflowStep === item.value);
          if (!variant?.currentState) return item;
          return {
            ...item,
            currentStates: [variant.currentState],
          };
        });
        return { ...input, list };
      });
    }
    if (attrName === "careflow_step" && ismObjects.length === 1) {
      const current = singleConstrainedCode(ismObjects[0], "current_state");
      if (current) {
        leaf.inputs = (leaf.inputs ?? []).map((input) => {
          if (input.suffix && input.suffix !== "code") return input;
          return {
            ...input,
            list: (input.list ?? []).map((item) => ({
              ...item,
              currentStates: [current],
            })),
          };
        });
      }
    }
    return leaf;
  }

  private buildIsmTransitionAttribute(
    attr: openehr_am.C_ATTRIBUTE,
    parentAqlPath: string,
    ismObjects: openehr_am.C_COMPLEX_OBJECT[],
  ): WebTemplateNode {
    const attrBounds = attributeExistenceBounds(attr);
    const single = ismObjects.length === 1;
    const first = ismObjects[0];
    const nodeId = single ? constraintNodeId(first) : undefined;
    const ismPath = nodeId
      ? joinAqlPath(parentAqlPath, `ism_transition[${nodeId}]`)
      : joinAqlPath(parentAqlPath, "ism_transition");

    const shell: WebTemplateNode = {
      ...rmAttributeIdentity("ism_transition"),
      rmType: "ISM_TRANSITION",
      nodeId,
      min: attrBounds.min,
      max: attrBounds.max,
      aqlPath: ismPath,
      children: [],
    };

    for (const attrName of ["current_state", "transition", "careflow_step"]) {
      const child = single
        ? (() => {
          const a = first.attributes?.find((x) => x.rm_attribute_name === attrName);
          const c = (a as { children?: openehr_am.C_OBJECT[] })?.children?.[0];
          if (!(c instanceof openehr_am.C_COMPLEX_OBJECT)) return undefined;
          if (!isRmAttributeValueLeaf(c)) return undefined;
          const bounds = attributeExistenceBounds(a!);
          const leaf = this.buildRmAttributeLeaf(
            c,
            joinAqlPath(ismPath, attrName),
            attrName,
            bounds,
          );
          if (attrName === "careflow_step") {
            const current = singleConstrainedCode(first, "current_state");
            if (current && leaf.inputs) {
              for (const input of leaf.inputs) {
                if (input.suffix && input.suffix !== "code") continue;
                input.list = (input.list ?? []).map((item) => ({
                  ...item,
                  currentStates: [current],
                }));
              }
            }
          }
          return leaf;
        })()
        : this.mergeIsmCodedAttribute(ismObjects, attrName, ismPath);
      if (child) shell.children!.push(child);
    }

    if (!shell.children?.length) delete shell.children;
    if (ismObjects.length > 1) {
      shell.annotations = {
        ...(shell.annotations ?? {}),
        ismVariants: ismObjects.map((ism) => ({
          nodeId: constraintNodeId(ism),
          currentState: singleConstrainedCode(ism, "current_state"),
          careflowStep: singleConstrainedCode(ism, "careflow_step"),
        })),
      };
    }
    return this.decorateWithAnnotations(shell);
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
        const ctxNode = this.buildCompositionAttributeNode(attr);
        if (ctxNode) node.children!.push(ctxNode);
        continue;
      }

      const children =
        (attr as { children?: openehr_am.C_OBJECT[] }).children ?? [];

      if (attrName === "ism_transition") {
        const ismObjects = children.filter(
          (c): c is openehr_am.C_COMPLEX_OBJECT =>
            c instanceof openehr_am.C_COMPLEX_OBJECT &&
            c.rm_type_name === "ISM_TRANSITION",
        );
        if (ismObjects.length) {
          node.children!.push(
            this.buildIsmTransitionAttribute(attr, aqlPath, ismObjects),
          );
          continue;
        }
      }

      const attrBounds = attributeExistenceBounds(attr);

      for (const child of children) {
        const childId = childPathPredicate(child, children);
        const childPath = joinAqlPath(
          aqlPath,
          childId ? `${attrName}[${childId}]` : attrName,
        );
        const childLabel = webTemplateChildIdHint(rmType, attrName, child);
        if (
          child instanceof openehr_am.C_COMPLEX_OBJECT ||
          child instanceof openehr_am.ARCHETYPE_SLOT
        ) {
          const complex = child instanceof openehr_am.C_COMPLEX_OBJECT
            ? child
            : child instanceof openehr_am.ARCHETYPE_SLOT
            ? complexShellFromSlot(child)
            : undefined;
          if (!complex) continue;
          if (useRmAttributeAsWebTemplateId(rmType, attrName, complex)) {
            node.children!.push(
              this.buildRmAttributeLeaf(complex, childPath, attrName, attrBounds),
            );
          } else if (SKIP_RM_TYPES.has(complex.rm_type_name ?? "")) {
            const flattened = this.flattenDataStructure(
              complex,
              childPath,
              node,
            );
            node.children!.push(...flattened.children ?? []);
          } else if (complex.rm_type_name === "HISTORY") {
            // Spec "Level Removal": HISTORY is always collapsed; an EVENT is
            // collapsed too when it is the only event node and max = 1.
            const history = this.flattenHistory(
              complex,
              childPath,
              nodeShell(node, {
                id: normalizeWebTemplateId(attrName),
                rmType: "HISTORY",
                aqlPath: childPath,
              }),
            );
            this.registerCollapsed(complex, childPath, "HISTORY");
            const events = history.children ?? [];
            if (events.length === 1 && events[0].max === 1) {
              this.registerCollapsed(events[0], events[0].aqlPath, events[0].rmType);
              node.children!.push(...events[0].children ?? []);
            } else {
              node.children!.push(...events);
            }
            if (this.includeContext) {
              node.children!.push(
                rmContextNode(
                  "history_origin",
                  "DV_DATE_TIME",
                  joinAqlPath(childPath, "origin"),
                ),
              );
            }
          } else if (complex.rm_type_name === "ELEMENT") {
            node.children!.push(
              this.buildElement(
                complex,
                childPath,
                this.elementShell(complex, childPath),
              ),
            );
          } else if (complex.rm_type_name === "ISM_TRANSITION") {
            node.children!.push(
              this.buildIsmTransitionObject(complex, childPath, attrBounds),
            );
          } else {
            node.children!.push(this.buildFromComplex(
              complex,
              childPath,
              childLabel,
            ));
          }
        } else if (
          isDataValueType(child.rm_type_name ?? "") &&
          useRmAttributeAsWebTemplateId(rmType, attrName, child)
        ) {
          node.children!.push(
            this.buildRmAttributeLeaf(child, childPath, attrName, attrBounds),
          );
        } else if (isDataValueType(child.rm_type_name ?? "")) {
          node.children!.push(this.buildLeaf(child, childPath, childLabel));
        }
      }
    }

    if (this.includeContext) this.appendRmContextNodes(node, obj);

    if (!node.children?.length) delete node.children;
    return this.decorateWithAnnotations(node);
  }

  /** RM-mandatory attributes of entries and activities as `inContext` nodes. */
  private appendRmContextNodes(node: WebTemplateNode, obj?: openehr_am.C_COMPLEX_OBJECT): void {
    const path = node.aqlPath;
    const extra: WebTemplateNode[] = [];
    if (node.rmType === "ACTION") {
      extra.push(rmContextNode("time", "DV_DATE_TIME", joinAqlPath(path, "time")));
    }
    if (node.rmType === "INSTRUCTION") {
      extra.push(rmContextNode("narrative", "DV_TEXT", joinAqlPath(path, "narrative")));
    }
    if (node.rmType === "ACTIVITY") {
      extra.push(
        rmContextNode("timing", "DV_PARSABLE", joinAqlPath(path, "timing"), undefined, 0),
        rmContextNode(
          "action_archetype_id",
          "STRING",
          joinAqlPath(path, "action_archetype_id"),
          [actionArchetypeIdInput(obj)],
        ),
      );
    }
    if (
      node.rmType === "ACTION" &&
      !node.children?.some((c) => c.id === "ism_transition")
    ) {
      extra.push(defaultIsmTransitionNode(joinAqlPath(path, "ism_transition")));
    }
    if (ENTRY_RM_TYPES.has(node.rmType)) {
      extra.push(
        rmContextNode("language", "CODE_PHRASE", joinAqlPath(path, "language")),
        rmContextNode("encoding", "CODE_PHRASE", joinAqlPath(path, "encoding")),
        rmContextNode("subject", "PARTY_PROXY", joinAqlPath(path, "subject")),
      );
    }
    if (extra.length) appendMissing(node, extra);
  }

  /** Record an RM object that gets no Web Template node of its own. */
  private registerCollapsed(
    obj: openehr_am.C_OBJECT | WebTemplateNode,
    aqlPath: string,
    rmType: string,
  ): void {
    const terms = "aqlPath" in obj
      ? { name: obj.name, localizedNames: obj.localizedNames }
      : this.termFields(obj, rmType.toLowerCase(), false);
    this.collapsed[aqlPath] = {
      rmType,
      ...(terms.name ? { name: terms.name } : {}),
      ...(terms.localizedNames && Object.keys(terms.localizedNames).length
        ? { localizedNames: terms.localizedNames }
        : {}),
    };
  }

  private flattenDataStructure(
    obj: openehr_am.C_COMPLEX_OBJECT,
    aqlPath: string,
    parent: WebTemplateNode,
  ): WebTemplateNode {
    if (obj.rm_type_name?.startsWith("ITEM_")) {
      this.registerCollapsed(obj, aqlPath, obj.rm_type_name);
    }
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
        const parentRm = obj.rm_type_name ?? "";
        const itemLabel = webTemplateChildIdHint(parentRm, attrName, child);
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
      if (this.includeContext) {
        const ctx = [rmContextNode("time", "DV_DATE_TIME", joinAqlPath(evPath, "time"))];
        if (ev.rm_type_name === "INTERVAL_EVENT") {
          ctx.push(
            rmContextNode("width", "DV_DURATION", joinAqlPath(evPath, "width")),
            rmContextNode("math_function", "DV_CODED_TEXT", joinAqlPath(evPath, "math_function")),
          );
        }
        const ids = new Set(eventChildren.map((c) => c.id));
        eventChildren.push(...ctx.filter((c) => !ids.has(c.id)));
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

  /**
   * Composition children in Better/EHRbase order: `category`, `context`,
   * content, then `composer`, `language`, `territory`. Missing RM-mandatory
   * nodes are added as `inContext` nodes.
   */
  private orderCompositionChildren(children: WebTemplateNode[]): WebTemplateNode[] {
    const byId = (id: string) =>
      children.find((c) => c.id === id && (c.inContext || c.rmType === "EVENT_CONTEXT"));
    const category = byId("category") ??
      rmContextNode("category", "DV_CODED_TEXT", "/category");
    const context = children.find((c) => c.rmType === "EVENT_CONTEXT" && c.aqlPath === "/context") ??
      this.buildEventContextNode(undefined, { min: 0, max: 1 });
    const special = new Set([category, context]);
    const content = children.filter((c) => !special.has(c));
    return [
      category,
      context,
      ...content,
      rmContextNode("composer", "PARTY_PROXY", "/composer"),
      rmContextNode("language", "CODE_PHRASE", "/language"),
      rmContextNode("territory", "CODE_PHRASE", "/territory"),
    ];
  }

  /** Node for a constrained COMPOSITION attribute (category, context). */
  private buildCompositionAttributeNode(
    attr: openehr_am.C_ATTRIBUTE,
  ): WebTemplateNode | undefined {
    const name = attr.rm_attribute_name ?? "";
    const child = attr.children?.[0];
    if (name === "context") {
      return this.buildEventContextNode(
        child instanceof openehr_am.C_COMPLEX_OBJECT ? child : undefined,
        attributeExistenceBounds(attr),
      );
    }
    if (name === "category") {
      const rmType = child?.rm_type_name ?? "DV_CODED_TEXT";
      return rmContextNode("category", rmType, "/category", this.buildInputs(rmType, child));
    }
    // composer, language, territory: added in orderCompositionChildren.
    return undefined;
  }

  /**
   * EVENT_CONTEXT node: `start_time` and `setting` as `inContext` nodes, and
   * the `other_context` content flattened like any item structure.
   */
  private buildEventContextNode(
    obj: openehr_am.C_COMPLEX_OBJECT | undefined,
    bounds: { min: number; max: number },
  ): WebTemplateNode {
    const node: WebTemplateNode = {
      id: "context",
      name: "Context",
      rmType: "EVENT_CONTEXT",
      min: bounds.min,
      max: 1,
      aqlPath: "/context",
      children: [],
    };
    const startTime = rmContextNode("start_time", "DV_DATE_TIME", "/context/start_time");
    const setting = rmContextNode("setting", "DV_CODED_TEXT", "/context/setting");
    const content: WebTemplateNode[] = [];
    for (const attr of obj?.attributes ?? []) {
      const name = attr.rm_attribute_name;
      const child = (attr as { children?: openehr_am.C_OBJECT[] }).children?.[0];
      if (name === "other_context" && child instanceof openehr_am.C_COMPLEX_OBJECT) {
        const id = nodeIdToAtCode(child.node_id);
        const path = joinAqlPath("/context", id ? `other_context[${id}]` : "other_context");
        content.push(...this.flattenDataStructure(child, path, node).children ?? []);
      } else if (name === "setting" && child) {
        const inputs = this.buildInputs(child.rm_type_name ?? "DV_CODED_TEXT", child);
        if (inputs.some((i) => i.list?.length)) setting.inputs = inputs;
      }
    }
    node.children = [...content, startTime, setting];
    return node;
  }
}

export function buildWebTemplate(
  opt: openehr_am.OPERATIONAL_TEMPLATE,
  options?: WebTemplateBuilderOptions,
): WebTemplate {
  return new WebTemplateBuilder(options).build(opt);
}
