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
 * - the ontology `term_definitions` from node names/descriptions
 *   (per language when `localizedNames` are present).
 *
 * The result is sufficient for `buildWebTemplate` to reproduce an equivalent
 * Web Template (structural round-trip), for RM instance generation, and for
 * FLAT/STRUCTURED (de)serialization.
 */

import * as openehr_am from "../../openehr_am.ts";
import * as openehr_base from "../../openehr_base.ts";
import type { WebTemplate, WebTemplateNode } from "./types.ts";

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
  if (attr === "data" || attr === "state" || attr === "protocol" ||
    attr === "description") return "ITEM_TREE";
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
  private defaultLang = "en";
  /**
   * Constraint objects already claimed by a Web Template node. Sibling WT
   * nodes with identical node ids (e.g. the same archetype slotted several
   * times, disambiguated by name) must map to *separate* constraint objects.
   */
  private claimed = new Set<openehr_am.C_COMPLEX_OBJECT>();

  convert(webTemplate: WebTemplate): openehr_am.OPERATIONAL_TEMPLATE {
    this.terms = {};
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
    this.recordTerms(tree);

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

    return opt;
  }

  private recordTerms(node: WebTemplateNode): void {
    // Archetype roots are keyed by their archetype id so that
    // buildWebTemplate can recover their display names too.
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

    this.recordTerms(node);

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
          );
          element.occurrences = multiplicity(node.min ?? 0, node.max ?? 1);
          const valueAttr = this.ensureAttribute(element, "value");
          const dv = this.ensureObject(valueAttr, undefined, node.rmType);
          dv.occurrences = multiplicity(1, 1);
        } else {
          const dv = this.ensureObject(
            attr,
            seg.nodeId ?? node.nodeId,
            node.rmType,
          );
          dv.occurrences = multiplicity(node.min ?? 0, node.max ?? 1);
        }
        return;
      }

      const obj = this.ensureObject(
        attr,
        seg.nodeId ?? node.nodeId,
        node.rmType,
        /* forceUnclaimed */ true,
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

  private ensureObject(
    attr: openehr_am.C_ATTRIBUTE,
    nodeId: string | undefined,
    rmType: string,
    forceUnclaimed = false,
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
    attr.children.push(obj);
    return obj;
  }
}

export function webTemplateToOpt(
  webTemplate: WebTemplate,
): openehr_am.OPERATIONAL_TEMPLATE {
  return new WebTemplateToOptConverter().convert(webTemplate);
}
