/**
 * Reconstruct an AOM OPERATIONAL_TEMPLATE from a Web Template.
 *
 * A Web Template is a *derived* artefact: it flattens wrapper nodes
 * (ITEM_STRUCTURE family, HISTORY, single EVENTs) and drops most constraint
 * detail, so the reconstruction is necessarily approximate. It rebuilds:
 *
 * - the `C_COMPLEX_OBJECT` / `C_ATTRIBUTE` definition tree by re-expanding
 *   each node's `aqlPath` (which retains the collapsed wrapper segments),
 * - `C_ARCHETYPE_ROOT` nodes for archetype-id node ids,
 * - occurrences from `min` / `max`, and attribute existence for
 *   `ism_transition` and its children (the Web Template min of those nodes
 *   is the attribute existence; an ACTION's is 1..1),
 * - per-archetype `archetype_term_definitions` from node names, keyed by the
 *   nearest archetype id on the node's path (or by its occurrence scope).
 *   A sibling with a `name/value` predicate does not replace that code's
 *   term; its name stays on the `name` constraint, which is what the id
 *   slug uses. A node whose only name is a fallback (`cluster`, `element`)
 *   still records that text, so the next build does not slug another
 *   archetype's flat term. Sibling objects stay in Web Template order, which
 *   is what `_1`, `_2`, … suffixes are counted from. The flat
 *   `ontology.term_definitions` map still last-wins on colliding at-codes,
 * - best-effort leaf constraints from Web Template `inputs[]`:
 *   `C_QUANTITY.list[].units`, assumed magnitude/units, magnitude/precision
 *   ranges from `inputs[].validation`, and `C_TERMINOLOGY_CODE` `code_list` +
 *   `assumed_value` (with labels recorded as term definitions).
 *
 * Still dropped: invariants, cardinality of collapsed wrappers, and value-set
 * bindings that were never emitted as `inputs[].list`.
 *
 * The result is sufficient for `buildWebTemplate` to reproduce an equivalent
 * Web Template (structural round-trip plus the input lists above), for RM
 * instance generation, and for FLAT/STRUCTURED (de)serialization.
 */

import * as openehr_am from "../../am/openehr_am.ts";
import * as openehr_base from "../../base/openehr_base.ts";
import { aqlPathSegments } from "./normalize.ts";
import { isUnconstrainedElement } from "./element_value_choice.ts";
import { fixedNameConstraint } from "./web_template_builder.ts";
import type {
  QuantityItemInterval,
  QuantityItemRuntime,
} from "../../parser/legacy/xml_aom_mapper.ts";
import type {
  WebTemplate,
  WebTemplateInput,
  WebTemplateNode,
} from "./types.ts";
import {
  type OperationalTemplateWithTermScopes,
  TERM_ARCHETYPE_SCOPE_KEY,
  TERM_OCCURRENCE_SCOPE_KEY,
  type TermScopeMeta,
} from "../../generation/term_scope.ts";
import type { TermDefinitionTable } from "../../am/util/ontology_merge.ts";
import {
  applyPathAnnotationsToOpt,
  collectL10nAnnotationsFromWebTemplateTree,
} from "../../generation/opt_l10n.ts";

const MULTIPLE_ATTRS = new Set([
  "content",
  "items",
  "events",
  "activities",
  "rows",
  "other_participations",
]);

function intervalFromValidationRange(
  range: unknown,
): QuantityItemInterval | undefined {
  if (!range || typeof range !== "object") return undefined;
  const rec = range as Record<string, unknown>;
  const interval: QuantityItemInterval = {};
  if (typeof rec.min === "number") {
    interval.lower = rec.min;
    interval.lower_included = rec.minOp !== ">";
  }
  if (typeof rec.max === "number") {
    interval.upper = rec.max;
    interval.upper_included = rec.maxOp !== "<";
  }
  if (interval.lower === undefined && interval.upper === undefined) {
    return undefined;
  }
  return interval;
}

interface AqlSegment {
  attr: string;
  nodeId?: string;
  /** `name/value` predicate: a name-constrained sibling (e.g. two SECTION.adhoc). */
  nameValue?: string;
}

function parseAqlPath(aqlPath: string): AqlSegment[] {
  return aqlPathSegments(aqlPath).map(({ attr, nodeId, nameValue }) => ({
    attr,
    nodeId,
    nameValue,
  }));
}

function isArchetypeId(nodeId?: string): boolean {
  return !!nodeId && /^openEHR-/i.test(nodeId);
}

function multiplicity(
  min: number,
  max: number,
): openehr_base.Multiplicity_interval {
  const m = new openehr_base.Multiplicity_interval();
  // Store plain numbers, matching the runtime convention used by the legacy
  // OPT parsers and consumed by RMInstanceGenerator / WebTemplateBuilder.
  m.lower = Math.max(min, 0) as unknown as openehr_base.Integer;
  m.lower_unbounded = false;
  if (max === -1) {
    m.upper_unbounded = true;
  } else {
    m.upper = max as unknown as openehr_base.Integer;
    m.upper_unbounded = false;
  }
  return m;
}

/** Infer the RM type of a collapsed wrapper segment from its context. */
function wrapperRmType(parentRmType: string, attr: string): string {
  if (attr === "data" && parentRmType === "OBSERVATION") return "HISTORY";
  if (attr === "events") return "POINT_EVENT";
  if (
    attr === "data" || attr === "state" || attr === "protocol" ||
    attr === "description"
  ) return "ITEM_TREE";
  if (attr === "items") return "CLUSTER";
  if (attr === "content") return "OBSERVATION";
  if (attr === "activities") return "ACTIVITY";
  if (attr === "context") return "EVENT_CONTEXT";
  return "CLUSTER";
}

/**
 * Put `name` constraints after the other attributes, where template tools
 * write them, so the Web Template children keep their order.
 */
function moveNameConstraintsLast(obj: openehr_am.C_OBJECT): void {
  const attrs = (obj as { attributes?: openehr_am.C_ATTRIBUTE[] }).attributes;
  if (!attrs?.length) return;
  const name = attrs.findIndex((a) => a.rm_attribute_name === "name");
  if (name !== -1 && name !== attrs.length - 1) {
    attrs.push(...attrs.splice(name, 1));
  }
  for (const attr of attrs) {
    for (const child of attr.children ?? []) moveNameConstraintsLast(child);
  }
}

type TermBag = Record<
  string,
  Record<string, { text?: string; description?: string }>
>;

/**
 * Context nodes that `WebTemplateBuilder` emits unconditionally for every
 * COMPOSITION; they carry no constraint information worth reconstructing.
 */
const DEFAULT_CTX_PATHS = new Set([
  "/language",
  "/territory",
  "/composer",
  "/context/start_time",
]);

export class WebTemplateToOptConverter {
  private terms: TermBag = {};
  /** Per-archetype term tables (language → at-code → text). */
  private scopedTerms: Record<string, TermDefinitionTable> = {};
  private defaultLang = "en";
  /**
   * Constraint objects already claimed by a Web Template node. Sibling WT
   * nodes with identical node ids (e.g. the same archetype slotted several
   * times, disambiguated by name) must map to *separate* constraint objects.
   */
  private claimed = new Set<openehr_am.C_COMPLEX_OBJECT>();
  /**
   * Occurrence scope (`<archetype id>#<n>`) of an archetype-root Web Template
   * node whose names differ from the first occurrence of its archetype.
   */
  private occurrenceOf = new Map<WebTemplateNode, string>();

  convert(webTemplate: WebTemplate): openehr_am.OPERATIONAL_TEMPLATE {
    this.terms = {};
    this.scopedTerms = {};
    this.claimed = new Set();
    this.defaultLang = webTemplate.defaultLanguage || "en";
    this.occurrenceOf = occurrenceScopes(webTemplate.tree, this.defaultLang);

    const opt = new openehr_am.OPERATIONAL_TEMPLATE();
    opt.adl_version = "1.4";
    opt.rm_release = "1.0.4";
    // Runtime convention across the codebase: plain language code string
    // (the generated type declares Terminology_code).
    opt.original_language = this
      .defaultLang as unknown as openehr_base.Terminology_code;

    const archetypeId = new openehr_base.ARCHETYPE_ID();
    archetypeId.value = webTemplate.templateId;
    opt.archetype_id = archetypeId;

    const tree = webTemplate.tree;
    const root = new openehr_am.C_ARCHETYPE_ROOT();
    root.rm_type_name = tree.rmType || "COMPOSITION";
    if (tree.nodeId) {
      root.node_id = tree.nodeId;
      if (isArchetypeId(tree.nodeId)) root.archetype_ref = tree.nodeId;
    }
    root.occurrences = multiplicity(tree.min ?? 1, tree.max ?? 1);
    if (tree.nodeId && isArchetypeId(tree.nodeId)) {
      (root as TermScopeMeta)[TERM_ARCHETYPE_SCOPE_KEY] = tree.nodeId;
    }
    this.recordTerms(
      tree,
      tree.nodeId && isArchetypeId(tree.nodeId) ? tree.nodeId : undefined,
    );

    for (const child of tree.children ?? []) {
      // Template-specific context nodes (e.g. category, other_context) carry
      // real constraints; re-insert them so the OPT round-trips. Only the
      // builder's unconditional defaults are skipped.
      if (child.inContext && DEFAULT_CTX_PATHS.has(child.aqlPath)) continue;
      // EVENT_CONTEXT with only RM attributes (start_time, setting) has no
      // template constraint of its own.
      if (
        child.rmType === "EVENT_CONTEXT" &&
        !(child.children ?? []).some((c) => !c.inContext)
      ) continue;
      this.insertNode(root, child, 0);
    }

    moveNameConstraintsLast(root);
    opt.definition = root;

    const ontology = new openehr_am.ARCHETYPE_ONTOLOGY();
    ontology.term_definitions = this.terms;
    ontology.term_bindings = {};
    ontology.constraint_bindings = {};
    ontology.value_sets = {};
    opt.ontology = ontology;

    const index: Record<string, TermDefinitionTable> = {};
    const occurrences: Record<string, TermDefinitionTable> = {};
    for (const [scope, table] of Object.entries(this.scopedTerms)) {
      (scope.includes("#") ? occurrences : index)[scope] = table;
    }
    const scoped = opt as OperationalTemplateWithTermScopes;
    scoped.archetype_term_definitions = index;
    if (Object.keys(occurrences).length) {
      scoped.occurrence_term_definitions = occurrences;
    }

    // OPT cannot store per-occurrence translations in component_ontologies;
    // emit Better/AD L10n.{lang} path annotations from localizedNames.
    applyPathAnnotationsToOpt(
      opt,
      collectL10nAnnotationsFromWebTemplateTree(tree),
    );

    return opt;
  }

  /**
   * Scope the id slug reads: this node's occurrence, else the nearest
   * archetype id on its path. A parent occurrence scope (`<id>#<n>`) applies
   * only while the path is still inside that archetype. A nested archetype
   * (collapsed ITEM_TREE under an activity, for example) keeps its own bag,
   * so `at0002` is not taken from the parent or from the flat last-wins map.
   */
  private termScopeFor(
    node: WebTemplateNode,
    parentScope?: string,
  ): string | undefined {
    const own = this.occurrenceOf.get(node);
    if (own) return own;
    if (node.nodeId && isArchetypeId(node.nodeId)) return node.nodeId;
    const segs = parseAqlPath(node.aqlPath);
    let nearest: string | undefined;
    for (let i = segs.length - 1; i >= 0; i--) {
      const id = segs[i].nodeId;
      if (isArchetypeId(id)) {
        nearest = id;
        break;
      }
    }
    if (parentScope?.includes("#")) {
      const arch = parentScope.slice(0, parentScope.indexOf("#"));
      if (!nearest || nearest === arch) return parentScope;
    }
    return nearest ?? parentScope;
  }

  /**
   * `name/value` predicate on this node: a renamed sibling, not the shared
   * term. A leaf path may end in `/value`; the predicate sits on the element.
   */
  private nameValueOf(node: WebTemplateNode): string | undefined {
    const segs = parseAqlPath(node.aqlPath);
    for (let i = segs.length - 1; i >= 0; i--) {
      if (segs[i].nodeId || segs[i].nameValue) return segs[i].nameValue;
    }
    return undefined;
  }

  private recordTerms(node: WebTemplateNode, archetypeScope?: string): void {
    const scope = this.termScopeFor(node, archetypeScope);
    const code = node.nodeId;
    if (!code) return;
    // Renamed siblings share an at-code. Their text belongs on the name
    // constraint; writing it here would make the other sibling slug that name.
    const nameConstrained = this.nameValueOf(node) != null;

    const languages = node.localizedNames &&
        Object.keys(node.localizedNames).length
      ? Object.keys(node.localizedNames)
      : [this.defaultLang];
    for (const lang of languages) {
      const text = node.localizedNames?.[lang] ?? node.name ??
        node.localizedName;
      const description = node.localizedDescriptions?.[lang];
      if (text == null && description == null) continue;
      this.terms[lang] ??= {};
      this.terms[lang][code] ??= {};
      if (text != null) this.terms[lang][code].text = text;
      if (description != null) {
        this.terms[lang][code].description = description;
      }
      // An archetype root's own name goes in its own scope only.
      if (scope && (!isArchetypeId(code) || code === scope.split("#")[0])) {
        this.scopedTerms[scope] ??= {};
        this.scopedTerms[scope][lang] ??= {};
        this.scopedTerms[scope][lang][code] ??= {};
        this.writeScopedTerm(
          this.scopedTerms[scope][lang][code],
          text,
          description,
          nameConstrained,
        );
      }
    }
  }

  /**
   * Keep the first text for a code, and let a node that is not
   * name-constrained replace a different one. That node is the archetype
   * term (including a fallback name such as "cluster"); the renamed
   * sibling keeps its text on the name constraint.
   */
  private writeScopedTerm(
    cell: { text?: string; description?: string },
    text: string | undefined,
    description: string | undefined,
    nameConstrained: boolean,
  ): void {
    if (text != null) {
      const replace = cell.text != null && cell.text !== text &&
        !nameConstrained;
      if (cell.text == null || replace) {
        cell.text = text;
        if (description != null) cell.description = description;
        else if (replace) delete cell.description;
        return;
      }
    }
    if (description != null && cell.description == null && !nameConstrained) {
      cell.description = description;
    }
  }

  /**
   * Insert a web template node into the constraint tree by re-expanding the
   * relative AQL path between its parent constraint and itself.
   */
  private insertNode(
    parent: openehr_am.C_COMPLEX_OBJECT,
    node: WebTemplateNode,
    parentAqlDepth: number,
  ): void {
    const allSegments = parseAqlPath(node.aqlPath);
    const segments = allSegments.slice(parentAqlDepth);
    if (!segments.length) return;

    this.recordTerms(node, this.scopeOf(parent));

    const isLeaf = !!node.inputs?.length && !node.children?.length;
    // Spec-style leaves address ELEMENT.value; the element is the
    // second-to-last segment.
    const leafValueStyle = isLeaf &&
      segments[segments.length - 1].attr === "value" &&
      !segments[segments.length - 1].nodeId &&
      segments.length >= 2;
    const walkSegments = leafValueStyle ? segments.slice(0, -1) : segments;

    let current = parent;
    for (let i = 0; i < walkSegments.length; i++) {
      const seg = walkSegments[i];
      const isLast = i === walkSegments.length - 1;
      const attr = this.ensureAttribute(current, seg.attr);

      if (!isLast) {
        current = this.ensureObject(
          attr,
          seg.nodeId,
          wrapperRmType(current.rm_type_name ?? "", seg.attr),
          false,
          this.scopeOf(current),
          seg.nameValue,
        );
        continue;
      }

      // Web Template min/max of ism_transition and its children are the
      // attribute existence. Occurrences alone come back as min 0.
      this.pinAttributeExistence(attr, node, current.rm_type_name ?? "");

      if (isLeaf) {
        // Both leaf styles produce ELEMENT { value: <DV constraint> },
        // except when the leaf itself is a non-ELEMENT RM attribute value
        // (e.g. /time on an EVENT) — then the DV constraint sits directly.
        const elementLike = leafValueStyle || seg.attr === "items" ||
          seg.attr === "item";
        if (elementLike) {
          const element = this.ensureObject(
            attr,
            seg.nodeId ?? node.nodeId,
            "ELEMENT",
            false,
            this.scopeOf(current),
            seg.nameValue,
          );
          element.occurrences = multiplicity(node.min ?? 0, node.max ?? 1);
          const valueAttr = this.ensureAttribute(element, "value");
          this.createLeafConstraint(
            valueAttr,
            node,
            undefined,
            multiplicity(1, 1),
            this.scopeOf(element),
          );
        } else {
          this.createLeafConstraint(
            attr,
            node,
            seg.nodeId ?? node.nodeId,
            multiplicity(node.min ?? 0, node.max ?? 1),
            this.scopeOf(current),
          );
        }
        return;
      }

      const obj = this.ensureObject(
        attr,
        seg.nodeId ?? node.nodeId,
        node.rmType,
        /* forceUnclaimed */ true,
        this.scopeOf(current),
        seg.nameValue,
      );
      this.claimed.add(obj);
      const occurrence = this.occurrenceOf.get(node);
      if (occurrence) this.stampScope(obj, occurrence);
      obj.occurrences = multiplicity(node.min ?? 0, node.max ?? 1);
      for (const child of node.children ?? []) {
        if (child.inContext) continue;
        // The shared `<type>_value` list is not a value choice (#267).
        if (isUnconstrainedElement(node)) continue;
        this.insertNode(obj, child, allSegments.length);
      }
      return;
    }
  }

  private createLeafConstraint(
    attr: openehr_am.C_ATTRIBUTE,
    node: WebTemplateNode,
    nodeId: string | undefined,
    occ: openehr_base.Multiplicity_interval,
    inheritedScope?: string,
  ): openehr_am.C_OBJECT {
    const rmType = node.rmType || "DV_TEXT";
    if (rmType === "DV_QUANTITY") {
      const q = new openehr_am.C_QUANTITY();
      q.rm_type_name = "DV_QUANTITY";
      if (nodeId) q.node_id = nodeId;
      q.occurrences = occ;
      this.stampScope(q, inheritedScope);
      this.applyQuantityInputs(q, node.inputs);
      attr.children ??= [];
      attr.children.push(q);
      return q;
    }
    if (rmType === "CODE_PHRASE") {
      const t = this.newTerminologyCode(inheritedScope);
      if (nodeId) t.node_id = nodeId;
      t.occurrences = occ;
      this.applyTerminologyInputs(t, node.inputs, inheritedScope);
      attr.children ??= [];
      attr.children.push(t);
      return t;
    }
    const dv = this.ensureObject(
      attr,
      nodeId,
      rmType,
      false,
      inheritedScope,
    );
    dv.occurrences = occ;
    if (rmType === "DV_CODED_TEXT") {
      this.applyCodedTextInputs(dv, node.inputs, inheritedScope);
    }
    return dv;
  }

  /** Stamp an archetype scope, or an occurrence scope `<id>#<n>`. */
  private stampScope(obj: openehr_am.C_OBJECT, scope?: string): void {
    if (!scope) return;
    const meta = obj as TermScopeMeta;
    const hash = scope.indexOf("#");
    meta[TERM_ARCHETYPE_SCOPE_KEY] = hash < 0 ? scope : scope.slice(0, hash);
    if (hash < 0) delete meta[TERM_OCCURRENCE_SCOPE_KEY];
    else meta[TERM_OCCURRENCE_SCOPE_KEY] = scope;
  }

  private newTerminologyCode(
    scope?: string,
  ): openehr_am.C_TERMINOLOGY_CODE {
    const t = new openehr_am.C_TERMINOLOGY_CODE();
    t.rm_type_name = "CODE_PHRASE";
    this.stampScope(t, scope);
    return t;
  }

  private applyQuantityInputs(
    q: openehr_am.C_QUANTITY,
    inputs?: WebTemplateInput[],
  ): void {
    const unit = inputs?.find((i) => i.suffix === "unit");
    const mag = inputs?.find((i) => i.suffix === "magnitude");
    const units = (unit?.list ?? []).map((item) => item.value).filter(Boolean);
    if (units.length) {
      (q as { list?: QuantityItemRuntime[] }).list = units.map(
        (value, index) => {
          const item = new openehr_am.C_QUANTITY_ITEM() as QuantityItemRuntime;
          item.units = value;
          const validation = (unit?.list?.[index]?.validation ??
            mag?.validation) as Record<string, unknown> | undefined;
          const magnitude = intervalFromValidationRange(validation?.range);
          if (magnitude) item.magnitude = magnitude;
          const precision = intervalFromValidationRange(validation?.precision);
          if (precision) item.precision = precision;
          return item;
        },
      );
    } else if (mag?.validation) {
      const item = new openehr_am.C_QUANTITY_ITEM() as QuantityItemRuntime;
      const magnitude = intervalFromValidationRange(
        (mag.validation as Record<string, unknown>).range,
      );
      if (magnitude) item.magnitude = magnitude;
      const precision = intervalFromValidationRange(
        (mag.validation as Record<string, unknown>).precision,
      );
      if (precision) item.precision = precision;
      if (item.magnitude || item.precision) {
        (q as { list?: QuantityItemRuntime[] }).list = [item];
      }
    }
    const assumedUnits = typeof unit?.defaultValue === "string"
      ? unit.defaultValue
      : undefined;
    const assumedMag = typeof mag?.defaultValue === "number"
      ? mag.defaultValue
      : (typeof mag?.defaultValue === "string" && mag.defaultValue !== ""
        ? Number(mag.defaultValue)
        : undefined);
    if (
      assumedUnits !== undefined ||
      (assumedMag !== undefined && Number.isFinite(assumedMag))
    ) {
      q.assumed_value = {
        magnitude: Number.isFinite(assumedMag) ? assumedMag : undefined,
        units: assumedUnits,
      } as unknown as openehr_base.Any;
    }
  }

  private applyCodedTextInputs(
    obj: openehr_am.C_COMPLEX_OBJECT,
    inputs?: WebTemplateInput[],
    scope?: string,
  ): void {
    const code = inputs?.find((i) => i.suffix === "code");
    if (
      !code?.list?.length && code?.defaultValue == null && !code?.terminology
    ) {
      return;
    }
    const defining = this.ensureAttribute(obj, "defining_code");
    const t = this.newTerminologyCode(scope);
    t.occurrences = multiplicity(1, 1);
    this.applyTerminologyInputs(t, inputs, scope);
    defining.children ??= [];
    defining.children.push(t);
  }

  private applyTerminologyInputs(
    t: openehr_am.C_TERMINOLOGY_CODE,
    inputs?: WebTemplateInput[],
    scope?: string,
  ): void {
    const code = inputs?.find((i) => i.suffix === "code") ??
      inputs?.find((i) => !i.suffix) ??
      inputs?.[0];
    if (!code) return;
    const runtime = t as openehr_am.C_TERMINOLOGY_CODE & {
      code_list?: string[];
      terminology_id?: string;
    };
    const codes = (code.list ?? []).map((item) => item.value).filter(Boolean);
    if (codes.length === 1) runtime.constraint = codes[0];
    if (codes.length) runtime.code_list = codes;
    if (code.terminology) runtime.terminology_id = code.terminology;
    if (code.defaultValue != null && String(code.defaultValue) !== "") {
      const assumed = new openehr_base.Terminology_code();
      assumed.code_string = String(code.defaultValue);
      if (code.terminology) assumed.terminology_id = code.terminology;
      runtime.assumed_value = assumed;
    }
    for (const item of code.list ?? []) {
      if (!item.label) continue;
      this.recordCodeTerm(item.value, item.label, scope);
    }
  }

  private recordCodeTerm(
    code: string,
    text: string,
    scope?: string,
  ): void {
    const lang = this.defaultLang;
    this.terms[lang] ??= {};
    this.terms[lang][code] ??= {};
    this.terms[lang][code].text = text;
    if (scope && !isArchetypeId(code)) {
      this.scopedTerms[scope] ??= {};
      this.scopedTerms[scope][lang] ??= {};
      this.scopedTerms[scope][lang][code] ??= {};
      this.scopedTerms[scope][lang][code].text = text;
    }
  }

  /**
   * `ism_transition` on an ACTION, and `current_state` / `transition` /
   * `careflow_step` on that ISM_TRANSITION, are read back from attribute
   * existence. Write the Web Template min/max there (1..1 for Test_all_types).
   */
  private pinAttributeExistence(
    attr: openehr_am.C_ATTRIBUTE,
    node: WebTemplateNode,
    parentRmType: string,
  ): void {
    const name = attr.rm_attribute_name;
    if (name !== "ism_transition" && parentRmType !== "ISM_TRANSITION") return;
    attr.existence = multiplicity(node.min ?? 0, node.max ?? 1);
  }

  private ensureAttribute(
    obj: openehr_am.C_COMPLEX_OBJECT,
    attrName: string,
  ): openehr_am.C_ATTRIBUTE {
    obj.attributes ??= [];
    const existing = obj.attributes.find(
      (a) => a.rm_attribute_name === attrName,
    );
    if (existing) return existing;

    const attr = MULTIPLE_ATTRS.has(attrName)
      ? new openehr_am.C_MULTIPLE_ATTRIBUTE()
      : new openehr_am.C_SINGLE_ATTRIBUTE();
    attr.rm_attribute_name = attrName;
    obj.attributes.push(attr);
    return attr;
  }

  private scopeOf(obj: openehr_am.C_OBJECT): string | undefined {
    const meta = obj as TermScopeMeta;
    return meta[TERM_OCCURRENCE_SCOPE_KEY] ?? meta[TERM_ARCHETYPE_SCOPE_KEY] ??
      (obj instanceof openehr_am.C_ARCHETYPE_ROOT
        ? obj.archetype_ref
        : undefined);
  }

  private ensureObject(
    attr: openehr_am.C_ATTRIBUTE,
    nodeId: string | undefined,
    rmType: string,
    forceUnclaimed = false,
    inheritedScope?: string,
    nameValue?: string,
  ): openehr_am.C_COMPLEX_OBJECT {
    attr.children ??= [];
    const existing = attr.children.find((c) =>
      (nodeId ? c.node_id === nodeId : c.rm_type_name === rmType) &&
      fixedNameConstraint(c) === nameValue &&
      !(forceUnclaimed &&
        this.claimed.has(c as openehr_am.C_COMPLEX_OBJECT))
    );
    if (existing instanceof openehr_am.C_COMPLEX_OBJECT) return existing;

    const obj = isArchetypeId(nodeId)
      ? new openehr_am.C_ARCHETYPE_ROOT()
      : new openehr_am.C_COMPLEX_OBJECT();
    if (obj instanceof openehr_am.C_ARCHETYPE_ROOT && nodeId) {
      obj.archetype_ref = nodeId;
    }
    obj.rm_type_name = rmType;
    if (nodeId) obj.node_id = nodeId;
    const scope = isArchetypeId(nodeId) ? nodeId : inheritedScope;
    this.stampScope(obj, scope);
    if (nameValue !== undefined) this.addNameConstraint(obj, nameValue, scope);
    attr.children.push(obj);
    return obj;
  }

  /**
   * `name matches {DV_TEXT matches {value matches {"…"}}}`, as template
   * tools write it for a renamed archetype or node occurrence; it is what
   * gives the sibling its `name/value` path predicate.
   */
  private addNameConstraint(
    obj: openehr_am.C_COMPLEX_OBJECT,
    name: string,
    scope?: string,
  ): void {
    const nameAttr = this.ensureAttribute(obj, "name");
    nameAttr.existence = multiplicity(1, 1);
    const text = new openehr_am.C_COMPLEX_OBJECT();
    text.rm_type_name = "DV_TEXT";
    text.occurrences = multiplicity(1, 1);
    this.stampScope(text, scope);
    const valueAttr = this.ensureAttribute(text, "value");
    valueAttr.existence = multiplicity(1, 1);
    const prim = new openehr_am.C_PRIMITIVE_OBJECT();
    prim.rm_type_name = "STRING";
    prim.occurrences = multiplicity(1, 1);
    this.stampScope(prim, scope);
    const str = new openehr_am.C_STRING();
    (str as { list?: string[] }).list = [name];
    (str as unknown as { rm_type_name?: string }).rm_type_name = "STRING";
    prim.item = str;
    valueAttr.children = [prim];
    nameAttr.children = [text];
  }
}

/** Names of an archetype occurrence by node id, down to nested archetypes. */
function occurrenceNames(
  root: WebTemplateNode,
  lang: string,
): Map<string, string> {
  const names = new Map<string, string>();
  const visit = (node: WebTemplateNode) => {
    const name = node.localizedNames?.[lang] ?? node.name;
    if (node.nodeId && name != null && !names.has(node.nodeId)) {
      names.set(node.nodeId, name);
    }
    for (const child of node.children ?? []) {
      if (child.inContext || isArchetypeId(child.nodeId)) continue;
      visit(child);
    }
  };
  visit(root);
  return names;
}

/**
 * Give each archetype-root node whose names differ from the first
 * occurrence of its archetype an occurrence scope `<id>#<n>`, so a reused
 * archetype (ACTION.medication as "Medication statement" and "Immunization
 * statement") keeps each occurrence's names.
 */
function occurrenceScopes(
  tree: WebTemplateNode,
  lang: string,
): Map<WebTemplateNode, string> {
  const out = new Map<WebTemplateNode, string>();
  const first = new Map<string, Map<string, string>>();
  const counts = new Map<string, number>();
  const visit = (node: WebTemplateNode) => {
    const id = node.nodeId;
    if (id && isArchetypeId(id)) {
      const names = occurrenceNames(node, lang);
      const seen = first.get(id);
      if (!seen) first.set(id, names);
      else if (
        [...names].some(([code, name]) =>
          seen.has(code) && seen.get(code) !== name
        )
      ) {
        const n = (counts.get(id) ?? 1) + 1;
        counts.set(id, n);
        out.set(node, `${id}#${n}`);
      }
    }
    for (const child of node.children ?? []) {
      if (!child.inContext) visit(child);
    }
  };
  visit(tree);
  return out;
}

export function webTemplateToOpt(
  webTemplate: WebTemplate,
): openehr_am.OPERATIONAL_TEMPLATE {
  return new WebTemplateToOptConverter().convert(webTemplate);
}
