/**
 * ADL2 coding system (SPECAM-90 / AM 2.4): at-coded (openEHR RM default) vs
 * id-coded (legacy ADL2 2.0–2.3 style).
 */

/** Node and terminology coding for ADL2 operational templates and conversions. */
export type Adl2CodingSystem = "at-coded" | "id-coded";

/** Default per issue #181 / SPECAM-90: at-coded ADL2 for openEHR RM conformance. */
export const DEFAULT_ADL2_CODING_SYSTEM: Adl2CodingSystem = "at-coded";

export interface Adl2CodingOptions {
  /**
   * Which ADL2 coding system to emit when converting from ADL 1.4 / OPT 1.4.
   * Parsing accepts both id- and at-coded ADL2 text regardless of this option.
   */
  adl2CodingSystem?: Adl2CodingSystem;
}

export function resolveAdl2CodingSystem(
  options?: Adl2CodingOptions,
): Adl2CodingSystem {
  return options?.adl2CodingSystem ?? DEFAULT_ADL2_CODING_SYSTEM;
}

/** Version token recorded in template-binding serialisation (`opt14-codes=…`). */
export function opt14CodeMappingVersion(
  coding: Adl2CodingSystem = DEFAULT_ADL2_CODING_SYSTEM,
): string {
  return coding === "id-coded" ? "am2-archie-id" : "am24-at";
}
