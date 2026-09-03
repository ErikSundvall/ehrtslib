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
 * - occurrences from `min` / `max`,
 * - per-archetype `archetype_term_definitions` from node names (keyed by the
 *   nearest archetype-id ancestor), plus a flat `ontology.term_definitions`
 *   map that still last-wins on colliding at-codes,
 * - best-effort leaf constraints from Web Template `inputs[]`:
 *   `C_QUANTITY.list[].units` and assumed magnitude/units, and
 *   `C_TERMINOLOGY_CODE` `code_list` + `assumed_value` (with labels recorded
 *   as term definitions).
 *
 * Still dropped (not present on a typical Web Template): magnitude/precision
 * *ranges*, invariants, non-unit `C_QUANTITY_ITEM` facets, cardinality of
 * collapsed wrappers, and value-set bindings that were never emitted as
 * `inputs[].list`.
 *
 * The result is sufficient for `buildWebTemplate` to reproduce an equivalent
 * Web Template (structural round-trip plus the input lists above), for RM
 * instance generation, and for FLAT/STRUCTURED (de)serialization.
 */

import * as openehr_am from "../../am/openehr_am.ts";
import * as openehr_base from "../../base/openehr_base.ts";
import type {
  WebTemplate,
  WebTemplateInput,
  WebTemplateNode,
} from "./types.ts";
import {
  type OperationalTemplateWithTermScopes,
  TERM_ARCHETYPE_SCOPE_KEY,
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

interface AqlSegment {
  attr: string;
  nodeId?: string;
}

function parseAqlPath(aqlPath: string): AqlSegment[] {
  const segments = aqlPath.replace(/\/+/g, "/").match(/\/[^/]+/g) ?? [];
  return segments.map((raw) => {
    const m = /^\/([^[]+)(?:\[([^\]]+)\])?$/.exec(raw)!;
    return { attr: m[1], nodeId: m[2] };
  });
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

  convert(webTemplate: WebTemplate): openehr_am.OPERATIONAL_TEMPLATE {
    this.terms = {};
    this.scopedTerms = {};
    this.claimed = new Set();
    this.defaultLang = webTemplate.defaultLanguage || "en";

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
      this.insertNode(root, child, 0);
    }

    opt.definition = root;

    const ontology = new openehr_am.ARCHETYPE_ONTOLOGY();
    ontology.term_definitions = this.terms;
    ontology.term_bindings = {};
    ontology.constraint_bindings = {};
    ontology.value_sets = {};
    opt.ontology = ontology;

    const index: Record<string, TermDefinitionTable> = {};
    for (const [archId, table] of Object.entries(this.scopedTerms)) {
      index[archId] = table;
    }
    (opt as OperationalTemplateWithTermScopes).archetype_term_definitions =
      index;

    // OPT cannot store per-occurrence translations in component_ontologies;
    // emit Better/AD L10n.{lang} path annotations from localizedNames.
    applyPathAnnotationsToOpt(
      opt,
      collectL10nAnnotationsFromWebTemplateTree(tree),
    );

    return opt;
  }

  private recordTerms(node: WebTemplateNode, archetypeScope?: string): void {
    const scope = node.nodeId && isArchetypeId(node.nodeId)
      ? node.nodeId
      : archetypeScope;
    const code = node.nodeId;
    if (!code) return;

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
      if (scope && !isArchetypeId(code)) {
        this.scopedTerms[scope] ??= {};
        this.scopedTerms[scope][lang] ??= {};
        this.scopedTerms[scope][lang][code] ??= {};
        if (text != null) this.scopedTerms[scope][lang][code].text = text;
        if (description != null) {
          this.scopedTerms[scope][lang][code].description = description;
        }
      }
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
        );
        continue;
      }

      if (isLeaf) {
        // Both leaf styles produce ELEMENT { value: <DV constraint> },
        // except when the leaf itself is a non-ELEMENT RM attribute value
        // (e.g. /time on an EVENT) — then the DV constraint sits directly.
        const elementLike = leafValueStyle || seg.attr === "items";
        if (elementLike) {
          const element = this.ensureObject(
            attr,
            seg.nodeId ?? node.nodeId,
            "ELEMENT",
            false,
            this.scopeOf(current),
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
      );
      this.claimed.add(obj);
      obj.occurrences = multiplicity(node.min ?? 0, node.max ?? 1);
      for (const child of node.children ?? []) {
        if (child.inContext) continue;
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

  private stampScope(obj: openehr_am.C_OBJECT, scope?: string): void {
    if (scope) {
      (obj as TermScopeMeta)[TERM_ARCHETYPE_SCOPE_KEY] = scope;
    }
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
      (q as { list?: openehr_am.C_QUANTITY_ITEM[] }).list = units.map(
        (value) => {
          const item = new openehr_am.C_QUANTITY_ITEM();
          item.units = value;
          return item;
        },
      );
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
    return (obj as TermScopeMeta)[TERM_ARCHETYPE_SCOPE_KEY] ??
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
  ): openehr_am.C_COMPLEX_OBJECT {
    attr.children ??= [];
    const existing = attr.children.find((c) =>
      (nodeId ? c.node_id === nodeId : c.rm_type_name === rmType) &&
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
    if (scope) {
      (obj as TermScopeMeta)[TERM_ARCHETYPE_SCOPE_KEY] = scope;
    }
    attr.children.push(obj);
    return obj;
  }
}

export function webTemplateToOpt(
  webTemplate: WebTemplate,
): openehr_am.OPERATIONAL_TEMPLATE {
  return new WebTemplateToOptConverter().convert(webTemplate);
}
