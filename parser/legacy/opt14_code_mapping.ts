/**
 * ADL 1.4 → ADL2 code mapping used when up-converting a legacy OPT 1.4 XML
 * into an ADL2 operational template (contribution builder template binding,
 * ADR 0007).
 *
 * Kept in one module on purpose: the openEHR AM specification is still moving
 * here (AM 2.4.0, SPECAM-90, unreleased, moves ADL2 node ids back to at-codes),
 * so a change of rule should be a change of this file plus a bump of
 * {@link OPT14_CODE_MAPPING_VERSION}.
 *
 * Rule (AM 2.x, as applied by Archie's ADL 1.4 converter):
 * - Node ids become id-codes, first segment + 1: `at0000` → `id1`,
 *   `at0004` → `id5`, `at0.1` → `id0.1`, `at0004.1` → `id5.1`.
 * - Codes used as **values** stay at-codes, first segment + 1, without zero
 *   padding: `at0009` → `at10`.
 * - Value-set (constraint) codes stay ac-codes, first segment + 1, without zero
 *   padding: `ac0001` → `ac2`.
 * - Nodes that have no node id in ADL 1.4 (for example a `DV_CODED_TEXT`
 *   object under `ELEMENT.value`), and local code lists that have no value-set
 *   code, get freshly minted codes. Minting is deterministic: per archetype
 *   scope, numbering starts at the highest top-level number already used in
 *   that scope plus one, and codes are handed out in depth-first document
 *   order of the definition.
 */

import { adl14AtToId } from "../adl14_to_adl2_converter.ts";

/** Version of the mapping rule; part of the template binding serialisation version. */
export const OPT14_CODE_MAPPING_VERSION = "am2-archie-1";

const CODE_RE = /^(at|ac|id)(\d+)((?:\.\d+)*)$/i;

/** True for an ADL 1.4 at-code (`at0004`, `at0.1`, `at0004.1`). */
export function isAdl14AtCode(code: string | undefined): code is string {
  return !!code && /^at\d+(?:\.\d+)*$/i.test(code);
}

/** ADL 1.4 node id → ADL2 id-code (`at0000` → `id1`). Other codes unchanged. */
export function opt14NodeIdToAdl2(code: string): string {
  return adl14AtToId(code);
}

function bumpFirstSegment(prefix: string, code: string): string {
  const m = CODE_RE.exec(code);
  if (!m) return code;
  const first = m[2];
  const rest = m[3] ?? "";
  // Specialised-only codes (`at0.1`) keep the 0 top segment, as for node ids.
  if (/^0+$/.test(first) && rest) return `${prefix}0${rest}`;
  return `${prefix}${parseInt(first, 10) + 1}${rest}`;
}

/** ADL 1.4 value code → ADL2 value at-code (`at0009` → `at10`). */
export function opt14ValueCodeToAdl2(code: string): string {
  if (!isAdl14AtCode(code)) return code;
  return bumpFirstSegment("at", code);
}

/** ADL 1.4 value-set code → ADL2 ac-code (`ac0001` → `ac2`). */
export function opt14ValueSetCodeToAdl2(code: string): string {
  if (!/^ac\d+(?:\.\d+)*$/i.test(code)) return code;
  return bumpFirstSegment("ac", code);
}

/** Replace node at-codes inside an archetype path (`/data[at0001]` → `/data[id2]`). */
export function opt14PathToAdl2(path: string): string {
  return path.replace(
    /\[(at\d+(?:\.\d+)*)(?=[\],\s])/gi,
    (_m, code: string) => `[${opt14NodeIdToAdl2(code)}`,
  );
}

/** Top-level number of an at/ac/id code, or 0. */
export function topLevelCodeNumber(code: string | undefined): number {
  if (!code) return 0;
  const m = CODE_RE.exec(code);
  if (!m || m[3]) return 0;
  return parseInt(m[2], 10);
}

/**
 * Deterministic minting of new codes for one archetype scope. Seed it with
 * every code already present in the scope (after mapping), then call
 * {@link nextId} / {@link nextAc} in depth-first document order.
 */
export class Opt14CodeMinter {
  private idCounter = 0;
  private acCounter = 0;

  /** Record an existing ADL2 code so minted codes never collide with it. */
  seen(code: string | undefined): void {
    if (!code) return;
    const m = CODE_RE.exec(code);
    if (!m) return;
    const n = topLevelCodeNumber(code);
    const p = m[1].toLowerCase();
    // id- and at-codes share the term namespace; keep minted id-codes clear of both.
    if (p === "id" || p === "at") this.idCounter = Math.max(this.idCounter, n);
    if (p === "ac") this.acCounter = Math.max(this.acCounter, n);
  }

  nextId(): string {
    this.idCounter += 1;
    return `id${this.idCounter}`;
  }

  nextAc(): string {
    this.acCounter += 1;
    return `ac${this.acCounter}`;
  }
}
