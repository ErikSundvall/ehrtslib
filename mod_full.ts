/**
 * Full public barrel: same as {@link ./mod.ts} plus contribution builder.
 * Used for the legacy full runtime bundle; prefer `mod.ts` or subpath imports
 * when tree-shaking matters.
 */

export * from "./mod.ts";
export * as contributionBuilder from "./contribution_builder/mod.ts";
