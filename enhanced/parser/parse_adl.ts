/**
 * Unified ADL parse entry: ADL 1.4 → normalise → ADL2 tokenizer/parser.
 */

import { ADL2Tokenizer } from "./adl2_tokenizer.ts";
import { ADL2Parser, type ADL2ParseResult } from "./adl2_parser.ts";
import { convertAdl14ToAdl2 } from "./adl14_to_adl2_converter.ts";
import { detectAdlVersion, type AdlDetectedVersion } from "./adl_version.ts";

export interface ParseAdlOptions {
  /** When true (default), run ADL 1.4 syntactic conversion before parsing. */
  convertAdl14?: boolean;
  targetAdlVersion?: string;
  rmRelease?: string;
}

export interface ParseAdlResult extends ADL2ParseResult {
  detectedVersion: AdlDetectedVersion;
  convertedFrom14: boolean;
  conversionWarnings: string[];
  /** ADL2 text used for parsing (after any conversion). */
  adl2Source: string;
}

/**
 * Parse archetype, template, or operational_template from ADL 1.4 or ADL2 source.
 */
export function parseAdl(
  source: string,
  options?: ParseAdlOptions,
): ParseAdlResult {
  const convert = options?.convertAdl14 !== false;
  const detectedVersion = detectAdlVersion(source);

  let adl2Source = source;
  let convertedFrom14 = false;
  let conversionWarnings: string[] = [];

  if (convert && detectedVersion === "1.4") {
    const conv = convertAdl14ToAdl2(source, {
      targetAdlVersion: options?.targetAdlVersion,
      rmRelease: options?.rmRelease,
    });
    adl2Source = conv.adl2Text;
    convertedFrom14 = conv.converted;
    conversionWarnings = conv.warnings;
  }

  const tokenizer = new ADL2Tokenizer(adl2Source);
  const parseResult = new ADL2Parser(tokenizer.tokenize()).parse();

  return {
    ...parseResult,
    warnings: [...conversionWarnings, ...parseResult.warnings],
    detectedVersion,
    convertedFrom14,
    conversionWarnings,
    adl2Source,
  };
}
