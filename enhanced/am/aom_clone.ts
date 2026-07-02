/**
 * Deep clone helpers for AOM constraint trees (used by flattening / extraction).
 */

import * as openehr_am from "../openehr_am.ts";
import * as openehr_base from "../openehr_base.ts";
import {
  TERM_ARCHETYPE_SCOPE_KEY,
  TERM_NAME_FALLBACK_NODE_ID_KEY,
  type TermScopeMeta,
} from "../generation/term_scope.ts";

function cloneMultiplicity(
  src: openehr_base.Multiplicity_interval | undefined,
): openehr_base.Multiplicity_interval | undefined {
  if (!src) return undefined;
  const m = new openehr_base.Multiplicity_interval();
  m.lower = src.lower;
  m.upper = src.upper;
  m.lower_unbounded = src.lower_unbounded;
  m.upper_unbounded = src.upper_unbounded;
  return m;
}

export function cloneCObject(obj: openehr_am.C_OBJECT): openehr_am.C_OBJECT {
  if (obj instanceof openehr_am.C_COMPLEX_OBJECT) {
    return cloneComplexObject(obj);
  }
  if (obj instanceof openehr_am.C_ARCHETYPE_ROOT) {
    const root = new openehr_am.C_ARCHETYPE_ROOT();
    copyComplexFields(obj, root);
    root.archetype_ref = obj.archetype_ref;
    return root;
  }
  if (obj instanceof openehr_am.ARCHETYPE_SLOT) {
    const slot = new openehr_am.ARCHETYPE_SLOT();
    copyObjectFields(obj, slot);
    const includes = (obj as { includes?: openehr_am.ARCHETYPE_ID_CONSTRAINT[] })
      .includes;
    if (includes) {
      (slot as { includes: openehr_am.ARCHETYPE_ID_CONSTRAINT[] }).includes =
        includes.map(cloneArchetypeIdConstraint);
    }
    const excludes = (obj as { excludes?: openehr_am.ARCHETYPE_ID_CONSTRAINT[] })
      .excludes;
    if (excludes) {
      (slot as { excludes: openehr_am.ARCHETYPE_ID_CONSTRAINT[] }).excludes =
        excludes.map(cloneArchetypeIdConstraint);
    }
    return slot;
  }
  if (obj instanceof openehr_am.C_PRIMITIVE_OBJECT) {
    const prim = new openehr_am.C_PRIMITIVE_OBJECT();
    copyObjectFields(obj, prim);
    return prim;
  }
  return obj;
}

function cloneArchetypeIdConstraint(
  c: openehr_am.ARCHETYPE_ID_CONSTRAINT,
): openehr_am.ARCHETYPE_ID_CONSTRAINT {
  const out = new openehr_am.ARCHETYPE_ID_CONSTRAINT();
  if (c.constraint) {
    const s = new openehr_am.C_STRING();
    s.pattern = c.constraint.pattern;
    out.constraint = s;
  }
  return out;
}

function copyObjectFields(
  src: openehr_am.C_OBJECT,
  dest: openehr_am.C_OBJECT,
): void {
  dest.rm_type_name = src.rm_type_name;
  dest.node_id = src.node_id;
  if (src.occurrences) {
    dest.occurrences = cloneMultiplicity(src.occurrences);
  }
  const srcMeta = src as TermScopeMeta;
  const destMeta = dest as TermScopeMeta;
  if (srcMeta[TERM_ARCHETYPE_SCOPE_KEY]) {
    destMeta[TERM_ARCHETYPE_SCOPE_KEY] = srcMeta[TERM_ARCHETYPE_SCOPE_KEY];
  }
  if (srcMeta[TERM_NAME_FALLBACK_NODE_ID_KEY]) {
    destMeta[TERM_NAME_FALLBACK_NODE_ID_KEY] =
      srcMeta[TERM_NAME_FALLBACK_NODE_ID_KEY];
  }
}

function copyComplexFields(
  src: openehr_am.C_COMPLEX_OBJECT,
  dest: openehr_am.C_COMPLEX_OBJECT,
): void {
  copyObjectFields(src, dest);
  if (src.attributes) {
    dest.attributes = src.attributes.map(cloneAttribute);
  }
}

export function cloneComplexObject(
  obj: openehr_am.C_COMPLEX_OBJECT,
): openehr_am.C_COMPLEX_OBJECT {
  if (obj instanceof openehr_am.C_ARCHETYPE_ROOT) {
    const root = new openehr_am.C_ARCHETYPE_ROOT();
    copyComplexFields(obj, root);
    root.archetype_ref = obj.archetype_ref;
    return root;
  }
  const out = new openehr_am.C_COMPLEX_OBJECT();
  copyComplexFields(obj, out);
  return out;
}

export function cloneAttribute(
  attr: openehr_am.C_ATTRIBUTE,
): openehr_am.C_ATTRIBUTE {
  const out: openehr_am.C_ATTRIBUTE = attr instanceof
      openehr_am.C_MULTIPLE_ATTRIBUTE
    ? new openehr_am.C_MULTIPLE_ATTRIBUTE()
    : new openehr_am.C_SINGLE_ATTRIBUTE();

  out.rm_attribute_name = attr.rm_attribute_name;
  const existence = (attr as { existence?: openehr_base.Multiplicity_interval })
    .existence;
  if (existence) {
    (out as { existence: openehr_base.Multiplicity_interval }).existence =
      cloneMultiplicity(existence);
  }
  if (attr instanceof openehr_am.C_MULTIPLE_ATTRIBUTE && attr.cardinality) {
    const ma = out as openehr_am.C_MULTIPLE_ATTRIBUTE;
    const card = new openehr_am.CARDINALITY();
    const interval = (attr.cardinality as {
      interval?: openehr_base.Multiplicity_interval;
    }).interval ?? attr.cardinality.interval;
    if (interval) {
      (card as { interval: openehr_base.Multiplicity_interval }).interval =
        cloneMultiplicity(interval);
    }
    card.is_ordered = attr.cardinality.is_ordered;
    card.is_unique = (attr.cardinality as { is_unique?: boolean }).is_unique;
    ma.cardinality = card;
  }
  const children = (attr as { children?: openehr_am.C_OBJECT[] }).children;
  if (children) {
    (out as { children: openehr_am.C_OBJECT[] }).children = children.map(
      cloneCObject,
    );
  }
  return out;
}
