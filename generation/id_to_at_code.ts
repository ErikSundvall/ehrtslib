/**
 * Map ADL2 id/ac-style codes toward ADL 1.4 at-codes for down-conversion.
 * @see https://github.com/ErikSundvall/ehrtslib/issues/116
 */

const ID_OR_AC = /^(id|ac|at)(\d+)((?:\.\d+)*)$/i;

/**
 * ADL2 → ADL 1.4 code, per the openEHR ADL2 specification: ADL2 codes are
 * 1-based and ADL 1.4 codes 0-based, so the top-level segment shifts by one
 * (`[at0000]` (`[id1]`), `[at0001]` (`[id2]`), `[at0000.1]` (`[id1.1]`); see
 * ADL2 spec sections 9.3 and 9.5). This matches Archie's ADL 1.4 converter.
 *
 * - `id1` → `at0000`, `id5.2` → `at0004.2`, `id0.3` → `at0.3`
 * - value codes `at7` → `at0006`
 * - already-1.4 codes (zero-padded, e.g. `at0001`) are returned unchanged
 * - `ac` codes are returned unchanged (expanded from value_sets separately)
 */
export function idToAtCode(code: string | undefined | null): string {
  if (!code) return code ?? "";
  const m = ID_OR_AC.exec(code);
  if (!m) return code;
  const leader = m[1].toLowerCase();
  if (leader === "ac") return code;
  if (leader === "at" && m[2].length >= 4 && m[2].startsWith("0")) return code;
  const first = m[2] === "0" ? "0" : String(+m[2] - 1).padStart(4, "0");
  return `at${first}${m[3] ?? ""}`;
}

/**
 * Build a collision-free ADL2 → ADL 1.4 code map for one archetype.
 *
 * ADL2 keeps node ids (`idN`) and value codes (`atN`) in separate code
 * spaces; ADL 1.4 has a single at-code space. Node ids map with
 * {@link idToAtCode}. A value code whose mapped code would clash with a node
 * code is renumbered to the next free top-level at-code (codes ≥ 9000 are
 * ignored when choosing the next number). Archetypes converted from 1.4
 * never clash, so their codes round-trip unchanged.
 *
 * `normalise` lets callers fold codes first (e.g. template overlay codes
 * onto their base archetype depth); codes that normalise to the same value
 * get the same target.
 */
export function buildAdl14CodeMap(
  codes: Iterable<string>,
  normalise: (code: string) => string = (c) => c,
): Map<string, string> {
  const ids = new Set<string>();
  const ats = new Set<string>();
  for (const c of codes) {
    if (/^id\d/i.test(c)) ids.add(c);
    else if (/^at\d/i.test(c)) ats.add(c);
  }
  const map = new Map<string, string>();
  const nodeTargets = new Set<string>();
  for (const c of ids) {
    const t = idToAtCode(normalise(c));
    map.set(c, t);
    nodeTargets.add(t);
  }
  const firstNum = (t: string) => +(/^at(\d+)/.exec(t)?.[1] ?? 0);
  let next = Math.max(
    0,
    ...[...nodeTargets].map(firstNum).filter((n) => n < 9000),
  ) + 1;
  const sorted = [...ats].sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true })
  );
  const valueTargets = new Map<string, string>();
  for (const c of sorted) {
    const n = normalise(c);
    let t = valueTargets.get(n) ?? idToAtCode(n);
    if (nodeTargets.has(t) && !valueTargets.has(n)) {
      t = "at" + String(next++).padStart(4, "0");
    }
    valueTargets.set(n, t);
    map.set(c, t);
  }
  return map;
}

/** Code tokens in ADL text: `[id2]`, `["at3"]`, `local::at1`, `<"at1", "at2">`. */
const ADL_CODE_TOKEN = /(?<=[\["':,]\s*)(id|at)(\d+(?:\.\d+)*)(?=\s*[\]"',>])/gi;

/** Rewrite every ADL2 id/at code token in ADL text using one collision-free map. */
export function rewriteAdl2CodesInText(adl: string): string {
  return rewriteAdl2CodesInTextWithMap(adl).adl;
}

/** As {@link rewriteAdl2CodesInText}, also returning the code map used. */
export function rewriteAdl2CodesInTextWithMap(
  adl: string,
): { adl: string; map: Map<string, string> } {
  const codes = new Set<string>();
  for (const m of adl.matchAll(ADL_CODE_TOKEN)) {
    const c = m[0];
    if (/^at0\d{3}/i.test(c)) continue; // already ADL 1.4
    codes.add(c);
  }
  const map = buildAdl14CodeMap(codes);
  return { adl: adl.replace(ADL_CODE_TOKEN, (c) => map.get(c) ?? c), map };
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
  mapCode: (code: string) => string = idToAtCode,
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
    const mapped = members.map((m) => mapCode(String(m).replace(/^["']|["']$/g, "")));
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
