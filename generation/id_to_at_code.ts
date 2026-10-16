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

/** Term table shape: language → code → term (text/description/…). */
export type Adl2TermTable = Record<string, Record<string, Record<string, unknown> | undefined> | undefined>;

export interface Adl14CodeMapOptions {
  /** Fold codes first (e.g. template overlay codes onto their base depth). */
  normalise?: (code: string) => string;
  /** ADL2 term_definitions, used to detect identical node/value terms and synthetic ids. */
  terms?: Adl2TermTable;
  /** Called for every renumbered or dropped node id. */
  warn?: (message: string) => void;
}

/** Marker for a node id that is dropped in ADL 1.4 (no `[code]` emitted). */
export const DROPPED_NODE_ID = "";

/**
 * Build a collision-free ADL2 → ADL 1.4 code map for one archetype
 * (https://github.com/ErikSundvall/ehrtslib/issues/127).
 *
 * ADL2 id-coded archetypes keep node ids (`idN`) and value codes (`atN`) in
 * separate spaces; ADL 1.4 / at-coded ADL2 have one at-code space (AOM 1.4:
 * one term list per language). Rule, aligned with the parallel at-/id-coded
 * examples in the ADL2 spec (master09.09: `DV_CODED_TEXT[id4]` ↔ `[at9000]`,
 * value `at4` ↔ `at0003`):
 *
 * 1. Value codes always get the shifted code ({@link idToAtCode}) — they are
 *    persisted in data (`DV_CODED_TEXT.defining_code`).
 * 2. A node id whose shifted code equals a value code's shifted code shares
 *    it when both have identical terms in every language (they came from one
 *    ADL 1.4 code, as Archie's 1.4 → 2 converter produces); otherwise the
 *    node gets the next unused `at9000+` code at the same specialisation level
 *    (`at0.9000+` in a specialised archetype) and a warning is emitted.
 *    Exception: root node codes (`id1{.1}*` → `at0000{.1}*`, AOM2 VARCN) never
 *    move; a value code that would take the root code is renumbered instead.
 * 3. Synthetic node ids (`id9000+` without any term, created by 1.4 → 2
 *    converters for nodes that had no id in 1.4) are dropped
 *    ({@link DROPPED_NODE_ID}) instead of becoming `at8999`….
 */
export function buildAdl14CodeMap(
  codes: Iterable<string>,
  options: Adl14CodeMapOptions | ((code: string) => string) = {},
): Map<string, string> {
  const opts: Adl14CodeMapOptions = typeof options === "function"
    ? { normalise: options }
    : options;
  const normalise = opts.normalise ?? ((c: string) => c);
  const terms = opts.terms ?? {};
  const langs = Object.keys(terms);
  const termKey = (code: string): string | undefined => {
    const parts = langs.map((l) => terms[l]?.[code]);
    if (parts.every((p) => p === undefined)) return undefined;
    return JSON.stringify(parts.map((p) => p ? { text: p.text, description: p.description } : null));
  };
  const ids: string[] = [];
  const ats: string[] = [];
  for (const c of new Set(codes)) {
    if (/^id\d/i.test(c)) ids.push(c);
    else if (/^at\d/i.test(c)) ats.push(c);
  }
  const byNum = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true });
  ids.sort(byNum);
  ats.sort(byNum);

  const map = new Map<string, string>();
  const used = new Set<string>();
  // Next unused code ≥ 9000 at the same specialisation level as `t`
  // (`at0003` → `at9000`; `at0.3` → `at0.9000`), so specialised archetypes
  // keep valid code depth.
  const nextFree = (t: string) => {
    const segs = t.replace(/^at/i, "").split(".");
    const prefix = segs.length > 1 ? segs.slice(0, -1).join(".") + "." : "";
    for (let n = 9000;; n++) {
      const c = `at${prefix}${n}`;
      if (!used.has(c)) {
        used.add(c);
        return c;
      }
    }
  };
  // Root node codes (id1, id1.1, …) must stay at0000{.1}* (AOM2 VARCN).
  const isRoot = (c: string) => /^id1(\.1)*$/i.test(normalise(c));
  const rootTargets = new Set(ids.filter(isRoot).map((c) => idToAtCode(normalise(c))));
  const nodeShift = new Map<string, string>();
  for (const c of ids) nodeShift.set(c, idToAtCode(normalise(c)));
  const isSynthetic = (c: string) => {
    const n = normalise(c);
    return +(/^id(\d+)/i.exec(n)?.[1] ?? 0) >= 9000 &&
      termKey(c) === undefined && termKey(n) === undefined;
  };
  for (const [c, t] of nodeShift) if (!isSynthetic(c)) used.add(t);
  for (const c of ats) used.add(idToAtCode(normalise(c)));
  const valueSource = new Map<string, string>(); // 1.4 target → ADL2 value code
  const rootMoved = new Map<string, string>();
  for (const c of ats) {
    let t = idToAtCode(normalise(c));
    if (rootTargets.has(t)) {
      // Only case where a value code moves: it would take the root code.
      const key = normalise(c);
      t = rootMoved.get(key) ?? nextFree(t);
      if (!rootMoved.has(key)) {
        rootMoved.set(key, t);
        opts.warn?.(`value code ${c} would collide with the root node code; renumbered to ${t}`);
      }
    }
    map.set(c, t);
    if (!valueSource.has(t)) valueSource.set(t, c);
  }

  for (const c of ids) {
    const n = normalise(c);
    if (isSynthetic(c)) {
      map.set(c, DROPPED_NODE_ID);
      continue;
    }
    const t = nodeShift.get(c)!;
    const v = valueSource.get(t);
    if (v === undefined || isRoot(c)) {
      map.set(c, t);
      continue;
    }
    const nk = termKey(c) ?? termKey(n);
    if (nk !== undefined && nk === (termKey(v) ?? termKey(normalise(v)))) {
      map.set(c, t); // same ADL 1.4 code, used as node and value
      continue;
    }
    const r = nextFree(t);
    map.set(c, r);
    opts.warn?.(
      `node id ${c} → ${t} would collide with value code ${v} → ${t}; node renumbered to ${r}`,
    );
  }
  return map;
}

/** Code tokens in ADL text: `[id2]`, `["at3"]`, `local::at1`, `<"at1", "at2">`. */
const ADL_CODE_TOKEN = /(?<=[\["':,]\s*)(id|at)(\d+(?:\.\d+)*)(?=\s*[\]"',>])/gi;

/** Rewrite every ADL2 id/at code token in ADL text using one collision-free map. */
export function rewriteAdl2CodesInText(adl: string, options: Adl14CodeMapOptions = {}): string {
  return rewriteAdl2CodesInTextWithMap(adl, options).adl;
}

/** As {@link rewriteAdl2CodesInText}, also returning the code map used. */
export function rewriteAdl2CodesInTextWithMap(
  adl: string,
  options: Adl14CodeMapOptions = {},
): { adl: string; map: Map<string, string> } {
  const codes = new Set<string>();
  for (const m of adl.matchAll(ADL_CODE_TOKEN)) {
    const c = m[0];
    if (/^at0\d{3}/i.test(c)) continue; // already ADL 1.4
    codes.add(c);
  }
  const map = buildAdl14CodeMap(codes, options);
  let out = adl.replace(ADL_CODE_TOKEN, (c) => map.get(c) ?? c);
  // Dropped node ids: `DV_TEXT[]` → `DV_TEXT`, `/value[]` → `/value`.
  out = out.replace(/(?<=[\w>])\[\]/g, "");
  return { adl: out, map };
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
