/**
 * Map ADL2 id/ac-style codes toward ADL 1.4 at-codes for down-conversion.
 * @see https://github.com/ErikSundvall/ehrtslib/issues/116
 */

const ID_OR_AC = /^(id|ac|at)(\d+)((?:\.\d+)*)$/i;

/** id1 → at0001; id0.1 → at0000.1; ac* unchanged until value-set expansion. */
export function idToAtCode(code: string | undefined | null): string {
  if (!code) return code ?? "";
  const m = ID_OR_AC.exec(code);
  if (!m) return code;
  const leader = m[1].toLowerCase();
  if (leader === "ac") return code; // keep until expanded
  if (leader === "at") {
    // normalise padding on first segment
    return `at${m[2].padStart(4, "0")}${m[3] ?? ""}`;
  }
  return `at${m[2].padStart(4, "0")}${m[3] ?? ""}`;
}

/** Rewrite [idN] / bare id codes inside free-form text. */
export function rewriteEmbeddedIds(text: string): string {
  return text.replace(/\bid(\d+(?:\.\d+)*)\b/gi, (_m, n: string) => idToAtCode("id" + n));
}

export type ValueSetBag = Record<
  string,
  { id?: string; members?: string | string[] }
>;

/** Expand ac-code uses in ADL text to [local::at…, …] using value_sets. */
export function expandAcConstraintsInAdl(
  adl: string,
  valueSets: ValueSetBag | undefined,
): { adl: string; expanded: string[]; missing: string[] } {
  const expanded: string[] = [];
  const missing: string[] = [];
  if (!valueSets || Object.keys(valueSets).length === 0) {
    return { adl, expanded, missing };
  }

  const out = adl.replace(/\[(ac[0-9]+(?:\.[0-9]+)*)\]/gi, (full, ac: string) => {
    const vs = valueSets[ac] ?? valueSets[ac.toLowerCase()];
    if (!vs) {
      missing.push(ac);
      return full;
    }
    let members = vs.members;
    if (typeof members === "string") {
      members = members.split(",").map((s) => s.trim().replace(/^["']|["']$/g, ""));
    }
    if (!Array.isArray(members) || members.length === 0) {
      missing.push(ac);
      return full;
    }
    const mapped = members.map((m) => idToAtCode(String(m).replace(/^["']|["']$/g, "")));
    expanded.push(ac);
    return `[local::${mapped.join(", ")}]`;
  });

  return { adl: out, expanded, missing };
}

/** Drop value_sets = <…> blocks from ADL text (ADL 1.4 has no equivalent). */
export function stripValueSetsBlock(adl: string): string {
  return adl.replace(
    /^([ \t]*)value_sets\s*=\s*<[\s\S]*?\n\1>/gm,
    "",
  );
}

/** Rewrite ontology/term_definitions keys idN → atNNNN. */
export function rewriteOntologyTermKeys(adl: string): string {
  return adl.replace(
    /(\[["'])(id)(\d+(?:\.\d+)*)(["']\])/gi,
    (_m, pre: string, _id: string, nums: string, post: string) =>
      `${pre}${idToAtCode("id" + nums).replace(/^at/, "at")}${post}`.replace(
        /(\[["'])at/,
        "$1at",
      ),
  ).replace(
    /\[["']id(\d+(?:\.\d+)*)["']\]/gi,
    (_m, nums: string) => `["${idToAtCode("id" + nums)}"]`,
  );
}
