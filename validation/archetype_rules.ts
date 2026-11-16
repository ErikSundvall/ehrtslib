/**
 * Collect archetype `rules` / `ARCHETYPE.invariants` (BEOM assertions) for
 * evaluation. These are archetype-authored rules, not RM class invariants —
 * use {@link RMSpecificationValidator} for the latter.
 */

import * as openehr_am from "../am/openehr_am.ts";
import type { ArchetypeResolver } from "../am/util/mod.ts";
import { InvariantEvaluator } from "./invariant_evaluator.ts";
import type { ValidationMessage } from "./template_validator.ts";

export type ArchetypeRulesSource =
  | openehr_am.ARCHETYPE
  | openehr_am.TEMPLATE
  | openehr_am.OPERATIONAL_TEMPLATE;

/** One archetype's rules block and its identifier (when known). */
export interface ArchetypeAssertionSource {
  archetypeId: string;
  assertions: openehr_am.ASSERTION[];
}

export interface CollectArchetypeAssertionsOptions {
  /** Resolve parent archetypes and OPT component archetype ids. */
  resolver?: ArchetypeResolver;
  /**
   * Inlined archetypes from flattening (e.g. `flattenToOperationalTemplate`);
   * rules from these are merged when not already present from the parent walk.
   */
  componentArchetypes?: openehr_am.ARCHETYPE[];
}

export interface ValidateArchetypeRulesOptions
  extends CollectArchetypeAssertionsOptions {
  /** Constraint tree for path resolution; defaults to `source.definition`. */
  definition?: openehr_am.C_COMPLEX_OBJECT;
}

function archetypeIdString(
  arch: openehr_am.ARCHETYPE,
): string | undefined {
  return arch.archetype_id?.value ?? arch.archetype_id?.toString();
}

function copyAssertions(
  list: openehr_am.ASSERTION[] | undefined,
): openehr_am.ASSERTION[] {
  return list?.length ? [...list] : [];
}

/**
 * Rules stored directly on one archetype artefact (no parent or component walk).
 */
export function assertionsFromArchetype(
  archetype: openehr_am.ARCHETYPE,
): openehr_am.ASSERTION[] {
  return copyAssertions(archetype.invariants);
}

/**
 * Rules from an archetype and its specialisation parents (parent rules first,
 * per AOM2 rules inheritance).
 */
export function collectArchetypeAssertionSources(
  archetype: openehr_am.ARCHETYPE,
  resolver?: ArchetypeResolver,
): ArchetypeAssertionSource[] {
  const chain: openehr_am.ARCHETYPE[] = [];
  const seen = new Set<string>();
  let current: openehr_am.ARCHETYPE | undefined = archetype;

  while (current) {
    const id = archetypeIdString(current);
    if (id) {
      if (seen.has(id)) break;
      seen.add(id);
    }
    chain.unshift(current);
    const parentId = current.parent_archetype_id?.value ??
      current.parent_archetype_id?.toString();
    if (!parentId || !resolver) break;
    current = resolver.resolve(parentId);
    if (!current) break;
  }

  const sources: ArchetypeAssertionSource[] = [];
  for (const arch of chain) {
    const assertions = copyAssertions(arch.invariants);
    if (!assertions.length) continue;
    sources.push({
      archetypeId: archetypeIdString(arch) ?? "(unknown)",
      assertions,
    });
  }
  return sources;
}

/** Flatten {@link collectArchetypeAssertionSources} into one assertion list. */
export function flattenArchetypeAssertionSources(
  sources: ArchetypeAssertionSource[],
): openehr_am.ASSERTION[] {
  return sources.flatMap((s) => s.assertions);
}

/**
 * All archetype rules for a template or operational template: root/template
 * rules (with parent chain when `resolver` is set), plus component archetypes
 * from `componentArchetypes` or ids found in `archetype_term_definitions`.
 */
export function collectTemplateAssertionSources(
  source: ArchetypeRulesSource,
  options?: CollectArchetypeAssertionsOptions,
): ArchetypeAssertionSource[] {
  const sources = collectArchetypeAssertionSources(source, options?.resolver);
  const seen = new Set(sources.map((s) => s.archetypeId));

  const mergeComponent = (arch: openehr_am.ARCHETYPE) => {
    for (
      const src of collectArchetypeAssertionSources(arch, options?.resolver)
    ) {
      if (seen.has(src.archetypeId)) continue;
      seen.add(src.archetypeId);
      sources.push(src);
    }
  };

  for (const arch of options?.componentArchetypes ?? []) {
    mergeComponent(arch);
  }

  if (options?.resolver) {
    const scoped = source as {
      archetype_term_definitions?: Record<string, unknown>;
    };
    const rootId = archetypeIdString(source);
    for (const key of Object.keys(scoped.archetype_term_definitions ?? {})) {
      if (key === rootId) continue;
      const arch = options.resolver.resolve(key);
      if (arch) mergeComponent(arch);
    }
  }

  return sources;
}

/**
 * Ordered assertion list for a template, OPT, or archetype (see
 * {@link collectTemplateAssertionSources}).
 */
export function collectArchetypeAssertions(
  source: ArchetypeRulesSource,
  options?: CollectArchetypeAssertionsOptions,
): openehr_am.ASSERTION[] {
  return flattenArchetypeAssertionSources(
    collectTemplateAssertionSources(source, options),
  );
}

/**
 * Evaluate archetype rules (`ARCHETYPE.invariants`) on an RM instance in one
 * call. For RM specification class invariants use
 * {@link RMSpecificationValidator.validateInstance}.
 */
export function validateArchetypeRules(
  rmInstance: unknown,
  source: ArchetypeRulesSource,
  options?: ValidateArchetypeRulesOptions,
): ValidationMessage[] {
  const definition = options?.definition ?? source.definition;
  const assertions = collectArchetypeAssertions(source, options);
  if (!assertions.length) return [];
  return new InvariantEvaluator({ definition }).validateInvariants(
    rmInstance,
    assertions,
    definition,
  );
}