/**
 * ADL 1.4 → ADL2 code mapping used when up-converting a legacy OPT 1.4 XML
 * into an ADL2 operational template (contribution builder template binding,
 * ADR 0007).
 *
 * Kept in one module on purpose: SPECAM-90 adds an at-coded ADL2 coding system
 * (default since #181) alongside id-coding. A rule change bumps
 * {@link opt14CodeMappingVersion}.
 *
 * **id-coded** (legacy ADL2 2.0–2.3, Archie ADL 1.4 converter):
 * - Node ids: `at0000` → `id1`, `at0004` → `id5`, `at0.1` → `id0.1`.
 * - Value at-codes: `at0009` → `at10` (unpadded bump).
 * - Value-set ac-codes: `ac0001` → `ac2`.
 *
 * **at-coded** (SPECAM-90 / AM 2.4 default for openEHR RM):
 * - Node, value and value-set codes from ADL 1.4 are kept as at/ac codes
 *   (same strings as in the OPT 1.4 / ADL 1.4 source).
 * - Minted node codes are new at-codes in the archetype scope.
 */

import { adl14AtToId } from "../adl14_to_adl2_converter.ts";
import {
  type Adl2CodingOptions,
  type Adl2CodingSystem,
  DEFAULT_ADL2_CODING_SYSTEM,
  opt14CodeMappingVersion,
  resolveAdl2CodingSystem,
} from "./adl2_coding_system.ts";

export {
  DEFAULT_ADL2_CODING_SYSTEM,
  opt14CodeMappingVersion,
  type Adl2CodingOptions,
  type Adl2CodingSystem,
  resolveAdl2CodingSystem,
} from "./adl2_coding_system.ts";

/**
 * Default mapping version token (at-coded). Prefer
 * {@link opt14CodeMappingVersion} with an explicit {@link Adl2CodingSystem}.
 */
export const OPT14_CODE_MAPPING_VERSION = opt14CodeMappingVersion(
  DEFAULT_ADL2_CODING_SYSTEM,
);

const CODE_RE = /^(at|ac|id)(\d+)((?:\.\d+)*)$/i;

/** True for an ADL 1.4 at-code (`at0004`, `at0.1`, `at0004.1`). */
export function isAdl14AtCode(code: string | undefined): code is string {
  return !!code && /^at\d+(?:\.\d+)*$/i.test(code);
}

export class Opt14CodeMapper {
  readonly coding: Adl2CodingSystem;

  constructor(coding: Adl2CodingSystem = DEFAULT_ADL2_CODING_SYSTEM) {
    this.coding = coding;
  }

  /** ADL 1.4 node id → ADL2 node code for the chosen coding system. */
  nodeIdToAdl2(code: string): string {
    if (!isAdl14AtCode(code)) return code;
    if (this.coding === "at-coded") return code;
    return adl14AtToId(code);
  }

  /** ADL 1.4 value at-code → ADL2 value code. */
  valueCodeToAdl2(code: string): string {
    if (!isAdl14AtCode(code)) return code;
    if (this.coding === "at-coded") return code;
    return bumpFirstSegment("at", code);
  }

  /** ADL 1.4 value-set ac-code → ADL2 ac-code. */
  valueSetCodeToAdl2(code: string): string {
    if (!/^ac\d+(?:\.\d+)*$/i.test(code)) return code;
    if (this.coding === "at-coded") return code;
    return bumpFirstSegment("ac", code);
  }

  /** Replace node at-codes inside an archetype path. */
  pathToAdl2(path: string): string {
    return path.replace(
      /\[(at\d+(?:\.\d+)*)(?=[\],\s])/gi,
      (_m, code: string) => `[${this.nodeIdToAdl2(code)}`,
    );
  }

  terminologyKeyToAdl2(
    code: string,
    nodeIds: Set<string>,
    valueCodes: Set<string>,
  ): string {
    if (/^ac\d+(?:\.\d+)*$/i.test(code)) {
      return this.valueSetCodeToAdl2(code);
    }
    if (!isAdl14AtCode(code)) return code;
    if (valueCodes.has(code)) return this.valueCodeToAdl2(code);
    if (nodeIds.has(code)) return this.nodeIdToAdl2(code);
    return this.nodeIdToAdl2(code);
  }

  createMinter(): Opt14CodeMinter {
    return new Opt14CodeMinter(this.coding);
  }
}

export function opt14CodeMapper(options?: Adl2CodingOptions): Opt14CodeMapper {
  return new Opt14CodeMapper(resolveAdl2CodingSystem(options));
}

/** ADL 1.4 node id → ADL2 node code (`at0000` → `id1` when id-coded). */
export function opt14NodeIdToAdl2(
  code: string,
  options?: Adl2CodingOptions,
): string {
  return opt14CodeMapper(options).nodeIdToAdl2(code);
}

function bumpFirstSegment(prefix: string, code: string): string {
  const m = CODE_RE.exec(code);
  if (!m) return code;
  const first = m[2];
  const rest = m[3] ?? "";
  if (/^0+$/.test(first) && rest) return `${prefix}0${rest}`;
  return `${prefix}${parseInt(first, 10) + 1}${rest}`;
}

/** ADL 1.4 value code → ADL2 value at-code (`at0009` → `at10` when id-coded). */
export function opt14ValueCodeToAdl2(
  code: string,
  options?: Adl2CodingOptions,
): string {
  return opt14CodeMapper(options).valueCodeToAdl2(code);
}

/** ADL 1.4 value-set code → ADL2 ac-code (`ac0001` → `ac2` when id-coded). */
export function opt14ValueSetCodeToAdl2(
  code: string,
  options?: Adl2CodingOptions,
): string {
  return opt14CodeMapper(options).valueSetCodeToAdl2(code);
}

/** Replace node at-codes inside an archetype path. */
export function opt14PathToAdl2(
  path: string,
  options?: Adl2CodingOptions,
): string {
  return opt14CodeMapper(options).pathToAdl2(path);
}

/** Top-level number of an at/ac/id code, or 0. */
export function topLevelCodeNumber(code: string | undefined): number {
  if (!code) return 0;
  const m = CODE_RE.exec(code);
  if (!m || m[3]) return 0;
  return parseInt(m[2], 10);
}

function mintAtNodeCode(n: number): string {
  if (n < 1000) return `at${String(n).padStart(4, "0")}`;
  return `at${n}`;
}

/**
 * Deterministic minting of new codes for one archetype scope. Seed with every
 * code already present in the scope (after mapping), then call {@link nextNodeId}
 * / {@link nextAc} in depth-first document order.
 */
export class Opt14CodeMinter {
  private nodeCounter = 0;
  private acCounter = 0;
  private readonly coding: Adl2CodingSystem;

  constructor(coding: Adl2CodingSystem = DEFAULT_ADL2_CODING_SYSTEM) {
    this.coding = coding;
  }

  /** Record an existing ADL2 code so minted codes never collide with it. */
  seen(code: string | undefined): void {
    if (!code) return;
    const m = CODE_RE.exec(code);
    if (!m) return;
    const n = topLevelCodeNumber(code);
    const p = m[1].toLowerCase();
    if (this.coding === "at-coded") {
      if (p === "at") this.nodeCounter = Math.max(this.nodeCounter, n);
    } else {
      if (p === "id" || p === "at") {
        this.nodeCounter = Math.max(this.nodeCounter, n);
      }
    }
    if (p === "ac") this.acCounter = Math.max(this.acCounter, n);
  }

  /** Mint a new node id (id-code or at-code depending on coding system). */
  nextNodeId(): string {
    this.nodeCounter += 1;
    if (this.coding === "at-coded") return mintAtNodeCode(this.nodeCounter);
    return `id${this.nodeCounter}`;
  }

  /** @deprecated Use {@link nextNodeId}. */
  nextId(): string {
    return this.nextNodeId();
  }

  nextAc(): string {
    this.acCounter += 1;
    return `ac${this.acCounter}`;
  }
}

export function collectAdl14NodeAndValueCodes(
  definitionOrRules: string,
): { nodeIds: Set<string>; valueCodes: Set<string> } {
  const nodeIds = new Set<string>();
  const allAt = new Set<string>();
  for (const m of definitionOrRules.matchAll(
    /\b[A-Z][A-Z0-9_]*\[(at\d+(?:\.\d+)*)\]/gi,
  )) {
    nodeIds.add(m[1]);
  }
  for (const m of definitionOrRules.matchAll(/\[(at\d+(?:\.\d+)*)\]/gi)) {
    allAt.add(m[1]);
  }
  const valueCodes = new Set<string>();
  for (const code of allAt) {
    if (!nodeIds.has(code)) valueCodes.add(code);
  }
  return { nodeIds, valueCodes };
}

export function opt14TerminologyKeyToAdl2(
  code: string,
  nodeIds: Set<string>,
  valueCodes: Set<string>,
  options?: Adl2CodingOptions,
): string {
  return opt14CodeMapper(options).terminologyKeyToAdl2(
    code,
    nodeIds,
    valueCodes,
  );
}
