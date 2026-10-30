/**
 * Late-bound hooks for RM init coercion (`apply_rm_init.ts`).
 *
 * The init code needs modules that import it back (RM classes, init helpers,
 * the model type registry). Each of them registers itself here when it is
 * evaluated, so nothing has to load them on demand. `createRequire` did that
 * before, but it works only for `file:` modules: ehrtslib imported over
 * `https:` (jsDelivr, deno.land) or bundled for a browser failed at load.
 *
 * This module imports nothing, so any module can import it at any point of a
 * cycle.
 */

/** Terse-string and partial-object helpers from `init_helpers.ts`. */
export interface RmInitHelpers {
  initCodePhrase: (value: unknown) => unknown;
  initDvCodedText: (value: unknown) => unknown;
  initDvText: (value: unknown) => unknown;
}

export interface RmInitLate {
  /** `applyRmInit` from `apply_rm_init.ts`. */
  applyRmInit?: (instance: object, init: unknown) => void;
  /** Set by `init_helpers.ts`. */
  initHelpers?: RmInitHelpers;
  /** `registerOpenEhrModelTypes`, set by `openehr_model_registry.ts`. */
  registerModelTypes?: () => void;
  /** Module namespaces whose class exports are RM / BASE constructors. */
  ctorModules: Record<string, unknown>[];
}

export const rmInitLate: RmInitLate = { ctorModules: [] };
