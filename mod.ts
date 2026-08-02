/**
 * ehrtslib public barrel.
 *
 * Each openEHR component and each tooling layer is exposed as a namespace so
 * that the (deliberately overlapping) class names — `CODE_PHRASE` in both BASE
 * and RM, for example — never collide.
 *
 * ```typescript
 * import { rm, parser, serialization } from "./mod.ts";
 *
 * const archetype = parser.parseAdl(source);
 * ```
 *
 * The flat root modules `openehr_base.ts`, `openehr_rm.ts`, `openehr_am.ts`,
 * `openehr_lang.ts` and `openehr_term.ts` remain available for code that wants
 * a single component without namespacing.
 */

export * as base from "./base/mod.ts";
export * as rm from "./rm/mod.ts";
export * as am from "./am/mod.ts";
export * as lang from "./lang/mod.ts";
export * as term from "./term/mod.ts";

export * as amUtil from "./am/util/mod.ts";
export * as parser from "./parser/mod.ts";
export * as serialization from "./serialization/mod.ts";
export * as validation from "./validation/mod.ts";
export * as generation from "./generation/mod.ts";
export * as meta from "./meta/mod.ts";
