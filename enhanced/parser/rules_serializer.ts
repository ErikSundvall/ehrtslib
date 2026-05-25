/**
 * Serialize `ARCHETYPE.invariants` back to an ADL2 `rules` section.
 */

import * as openehr_am from "../openehr_am.ts";

export function serializeRulesSection(
  invariants: openehr_am.ASSERTION[] | undefined,
  indent: string,
): string {
  if (!invariants?.length) return "";

  let out = "rules\n";
  const bodyIndent = indent;

  for (const assertion of invariants) {
    const expr = assertion.string_expression?.trim();
    if (!expr) continue;

    if (assertion.tag) {
      out += `${bodyIndent}${assertion.tag}: ${expr}\n`;
    } else {
      out += `${bodyIndent}${expr}\n`;
    }
  }

  return out + "\n";
}
