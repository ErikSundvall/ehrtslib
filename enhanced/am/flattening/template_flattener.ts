/**
 * Template / archetype flattening and differential extraction (editor round-trip).
 *
 * Uses ADL2 AOM; legacy ADL 1.4 text should be converted first via `parseAdl()` (see ROADMAP Phase 6b for deep migration).
 */

import * as openehr_am from "../../openehr_am.ts";
import * as openehr_base from "../../openehr_base.ts";
import { cloneAttribute, cloneComplexObject } from "../aom_clone.ts";
import {
  applyMergedTerminology,
  buildMergedTerminology,
} from "../ontology_merge.ts";
import { specializeComplexObject } from "./specialize.ts";

export type { ArchetypeResolver } from "../ontology_merge.ts";
import type { ArchetypeResolver } from "../ontology_merge.ts";

function archetypeIdString(arch: openehr_am.ARCHETYPE): string | undefined {
  return arch.archetype_id?.value ?? arch.archetype_id?.toString();
}

/**
 * Flatten an archetype: merge parent chain and resolve external references / slots.
 */
export function flattenArchetypeDefinition(
  archetype: openehr_am.ARCHETYPE,
  resolver: ArchetypeResolver,
  inlined: openehr_am.ARCHETYPE[] = [],
): openehr_am.C_COMPLEX_OBJECT | undefined {
  if (!archetype.definition) return undefined;

  let flat: openehr_am.C_COMPLEX_OBJECT = cloneComplexObject(archetype.definition);

  const parentId = archetype.parent_archetype_id?.value ??
    archetype.parent_archetype_id?.toString();
  if (parentId) {
    const parent = resolver.resolve(parentId);
    if (parent?.definition) {
      const parentFlat = flattenArchetypeDefinition(parent, resolver, inlined) ??
        parent.definition;
      flat = specializeComplexObject(parentFlat, archetype.definition);
    }
  }

  return resolveSlotsInTree(flat, resolver, inlined);
}

function resolveSlotsInTree(
  root: openehr_am.C_COMPLEX_OBJECT,
  resolver: ArchetypeResolver,
  inlined: openehr_am.ARCHETYPE[],
): openehr_am.C_COMPLEX_OBJECT {
  const walkObject = (obj: openehr_am.C_OBJECT): openehr_am.C_OBJECT => {
    if (obj instanceof openehr_am.ARCHETYPE_SLOT) {
      return resolveArchetypeSlot(obj, resolver, inlined);
    }
    if (obj instanceof openehr_am.C_ARCHETYPE_ROOT) {
      return inlineArchetypeRoot(obj, resolver, inlined);
    }
    if (obj instanceof openehr_am.C_COMPLEX_OBJECT) {
      if (!obj.attributes) return obj;
      for (const attr of obj.attributes) {
        const children = (attr as { children?: openehr_am.C_OBJECT[] }).children;
        if (!children) continue;
        (attr as { children: openehr_am.C_OBJECT[] }).children = children.map(
          walkObject,
        );
      }
    }
    return obj;
  };

  if (!root.attributes) return root;
  for (const attr of root.attributes) {
    const children = (attr as { children?: openehr_am.C_OBJECT[] }).children;
    if (!children) continue;
    (attr as { children: openehr_am.C_OBJECT[] }).children = children.map(
      walkObject,
    );
  }
  return root;
}

function firstIncludePattern(
  slot: openehr_am.ARCHETYPE_SLOT,
): string | undefined {
  const includes = (slot as {
    includes?: openehr_am.ARCHETYPE_ID_CONSTRAINT[];
  }).includes;
  const first = includes?.[0];
  return first?.constraint?.pattern;
}

function resolveArchetypeSlot(
  slot: openehr_am.ARCHETYPE_SLOT,
  resolver: ArchetypeResolver,
  inlined: openehr_am.ARCHETYPE[],
): openehr_am.C_OBJECT {
  const pattern = firstIncludePattern(slot);
  if (!pattern) return slot;

  const arch = resolver.resolve(pattern);
  if (!arch?.definition) return slot;

  inlined.push(arch);
  const filler = flattenArchetypeDefinition(arch, resolver, inlined) ??
    arch.definition;
  const result = cloneComplexObject(filler);
  result.node_id = slot.node_id ?? result.node_id;
  result.rm_type_name = slot.rm_type_name ?? result.rm_type_name;
  if (slot.occurrences) result.occurrences = slot.occurrences;
  return result;
}

function inlineArchetypeRoot(
  root: openehr_am.C_ARCHETYPE_ROOT,
  resolver: ArchetypeResolver,
  inlined: openehr_am.ARCHETYPE[],
): openehr_am.C_OBJECT {
  const ref = root.archetype_ref;
  if (!ref) return root;

  const arch = resolver.resolve(ref);
  if (!arch?.definition) return root;

  inlined.push(arch);
  const filler = flattenArchetypeDefinition(arch, resolver, inlined) ??
    arch.definition;
  const result = cloneComplexObject(filler);
  result.node_id = root.node_id ?? result.node_id;
  result.rm_type_name = root.rm_type_name ?? result.rm_type_name;
  if (root.occurrences) result.occurrences = root.occurrences;
  if (root.attributes?.length) {
    return specializeComplexObject(result, root);
  }
  return result;
}

/**
 * Build an operational template from a source template or archetype.
 */
export function flattenToOperationalTemplate(
  source: openehr_am.TEMPLATE | openehr_am.ARCHETYPE,
  resolver: ArchetypeResolver,
): openehr_am.OPERATIONAL_TEMPLATE {
  const opt = new openehr_am.OPERATIONAL_TEMPLATE();

  opt.archetype_id = source.archetype_id;
  opt.uid = source.uid;
  opt.concept = source.concept;
  opt.parent_archetype_id = source.parent_archetype_id;
  opt.original_language = source.original_language;
  opt.description = source.description;
  opt.ontology = source.ontology;
  opt.adl_version = source.adl_version ?? "2.0";
  opt.rm_release = source.rm_release;
  opt.is_generated = true;

  const inlinedArchetypes: openehr_am.ARCHETYPE[] = [];
  if (source instanceof openehr_am.TEMPLATE) {
    opt.definition = source.definition
      ? resolveSlotsInTree(
        cloneComplexObject(source.definition),
        resolver,
        inlinedArchetypes,
      )
      : undefined;
  } else {
    opt.definition = flattenArchetypeDefinition(source, resolver, inlinedArchetypes);
  }

  applyMergedTerminology(
    opt,
    buildMergedTerminology(source, resolver, inlinedArchetypes),
  );

  return opt;
}

function multiplicityEqual(
  a: openehr_base.Multiplicity_interval | undefined,
  b: openehr_base.Multiplicity_interval | undefined,
): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return a.lower === b.lower && a.upper === b.upper;
}

function objectsStructurallyEqual(
  a: openehr_am.C_OBJECT,
  b: openehr_am.C_OBJECT,
): boolean {
  if (a.rm_type_name !== b.rm_type_name || a.node_id !== b.node_id) {
    return false;
  }
  if (!multiplicityEqual(a.occurrences, b.occurrences)) return false;

  if (
    a instanceof openehr_am.C_COMPLEX_OBJECT &&
    b instanceof openehr_am.C_COMPLEX_OBJECT
  ) {
    const attrsA = a.attributes ?? [];
    const attrsB = b.attributes ?? [];
    if (attrsA.length !== attrsB.length) return false;
    for (const attrA of attrsA) {
      const attrB = attrsB.find(
        (x) => x.rm_attribute_name === attrA.rm_attribute_name,
      );
      if (!attrB) return false;
      const chA = (attrA as { children?: openehr_am.C_OBJECT[] }).children ?? [];
      const chB = (attrB as { children?: openehr_am.C_OBJECT[] }).children ?? [];
      if (chA.length !== chB.length) return false;
      for (let i = 0; i < chA.length; i++) {
        if (!objectsStructurallyEqual(chA[i], chB[i])) return false;
      }
    }
    return true;
  }

  return a.constructor.name === b.constructor.name;
}

/**
 * Extract template overlay / differential constraints vs a flat parent definition.
 * Used when saving editor changes back to a TEMPLATE (bidirectional path).
 */
export function extractDifferentialDefinition(
  flat: openehr_am.C_COMPLEX_OBJECT,
  parentFlat: openehr_am.C_COMPLEX_OBJECT,
): openehr_am.C_COMPLEX_OBJECT | undefined {
  const diff = new openehr_am.C_COMPLEX_OBJECT();
  diff.rm_type_name = flat.rm_type_name;
  diff.node_id = flat.node_id;

  let hasContent = false;

  if (!multiplicityEqual(flat.occurrences, parentFlat.occurrences)) {
    diff.occurrences = flat.occurrences;
    hasContent = true;
  }

  const diffAttrs: openehr_am.C_ATTRIBUTE[] = [];

  for (const flatAttr of flat.attributes ?? []) {
    const name = flatAttr.rm_attribute_name;
    if (!name) continue;
    const parentAttr = parentFlat.attributes?.find(
      (a) => a.rm_attribute_name === name,
    );
    if (!parentAttr) {
      diffAttrs.push(cloneAttribute(flatAttr));
      hasContent = true;
      continue;
    }

    const flatChildren =
      (flatAttr as { children?: openehr_am.C_OBJECT[] }).children ?? [];
    const parentChildren =
      (parentAttr as { children?: openehr_am.C_OBJECT[] }).children ?? [];

    const childDiffs: openehr_am.C_OBJECT[] = [];
    for (const flatChild of flatChildren) {
      const match = parentChildren.find(
        (p) =>
          p.node_id === flatChild.node_id &&
          p.rm_type_name === flatChild.rm_type_name,
      );
      if (!match) {
        childDiffs.push(cloneComplexObject(flatChild as openehr_am.C_COMPLEX_OBJECT));
        continue;
      }
      if (
        flatChild instanceof openehr_am.C_COMPLEX_OBJECT &&
        match instanceof openehr_am.C_COMPLEX_OBJECT &&
        !objectsStructurallyEqual(flatChild, match)
      ) {
        const nested = extractDifferentialDefinition(flatChild, match);
        if (nested) childDiffs.push(nested);
      }
    }

    if (childDiffs.length) {
      const attrClone = cloneAttribute(flatAttr);
      (attrClone as { children: openehr_am.C_OBJECT[] }).children = childDiffs;
      diffAttrs.push(attrClone);
      hasContent = true;
    }
  }

  if (!hasContent) return undefined;
  diff.attributes = diffAttrs;
  return diff;
}
