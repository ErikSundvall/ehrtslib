/**
 * Convert ADL 1.4 (and transitional 1.5) archetype text toward ADL 2.0 syntax.
 *
 * Based on openEHR ADL2 spec §7.13.5 and ADL 1.4 conversion notes (ontology → terminology,
 * merged term tables, id-codes for node ids, deprecated `matches {*}`, etc.).
 *
 * Semantic migration covers at-code → id-code shift (ADL 1.4 is 0-based, ADL2
 * id-codes are 1-based: `at0000` → `id1`, `at0001` → `id2`), value_sets
 * reshaping, and merging `constraint_definitions` into `term_definitions`.
 */

import { detectAdlVersion } from "./adl_version.ts";
import {
  type Adl2CodingOptions,
  collectAdl14NodeAndValueCodes,
  opt14TerminologyKeyToAdl2,
  resolveAdl2CodingSystem,
} from "./legacy/opt14_code_mapping.ts";
import { adl2VersionFor } from "./legacy/adl2_coding_system.ts";

export interface Adl14ConversionOptions extends Adl2CodingOptions {
  /** Header `adl_version`; default `2.4.0` when at-coded, `2.0.6` when id-coded. */
  targetAdlVersion?: string;
  rmRelease?: string;
  /** Mark output as machine-converted (openEHR `generated` metadata flag). */
  markGenerated?: boolean;
}

export interface Adl14ConversionResult {
  adl2Text: string;
  converted: boolean;
  warnings: string[];
}

const DEFAULT_OPTS: Omit<
  Required<
    Pick<Adl14ConversionOptions, "targetAdlVersion" | "rmRelease" | "markGenerated">
  >,
  "targetAdlVersion"
> = {
  rmRelease: "1.0.4",
  markGenerated: true,
};

/**
 * Convert ADL 1.4 source to ADL 2 syntax when needed; pass through ADL2 unchanged.
 */
export function convertAdl14ToAdl2(
  source: string,
  options?: Adl14ConversionOptions,
): Adl14ConversionResult {
  const opts = {
    ...DEFAULT_OPTS,
    ...options,
    targetAdlVersion: options?.targetAdlVersion ??
      adl2VersionFor(resolveAdl2CodingSystem(options), "2.0.6"),
  };
  const warnings: string[] = [];
  const version = detectAdlVersion(source);

  if (version === "2.x") {
    return { adl2Text: source, converted: false, warnings };
  }

  if (version === "unknown") {
    warnings.push(
      "ADL version not detected; applying light ADL 1.4 normalisation heuristics.",
    );
  }

  let text = source.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");

  text = normalizeArchetypeHeader(text, opts, warnings);
  text = removeStandaloneSections(text, ["concept", "revision"], warnings);
  text = renameSectionKeyword(text, "ontology", "terminology");
  text = renameSectionKeyword(text, "constraint_bindings", "term_bindings");
  text = stripTerminologiesAvailable(text);
  text = flattenTermDefinitionItemsWrappers(text);
  const coding = resolveAdl2CodingSystem(options);
  const codeScopes = collectAdl14NodeAndValueCodesFromArchetype(text);
  text = convertTerminologyAcCodes(text, warnings, codeScopes, options);
  text = mergeConstraintDefinitionsIntoTermDefinitions(text, warnings, codeScopes);
  text = migrateValueSetsSection(text, warnings, codeScopes, options);
  text = convertAdl14DomainTypeBlocks(text, warnings);
  if (coding === "id-coded") {
    text = convertDefinitionNodeIds(text);
  }
  text = stripDeprecatedMatchesAny(text);
  text = normalizeArchetypeHridVersion(text, warnings);

  return { adl2Text: text, converted: true, warnings };
}

function normalizeArchetypeHeader(
  text: string,
  opts: Required<
    Pick<Adl14ConversionOptions, "targetAdlVersion" | "rmRelease" | "markGenerated">
  >,
  warnings: string[],
): string {
  const lines = text.split("\n");
  const out: string[] = [];
  let headerDone = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!headerDone && /^archetype\b/i.test(trimmed)) {
      if (trimmed.includes("(") && /adl_version/i.test(trimmed)) {
        if (!/adl_version\s*=\s*2/i.test(trimmed)) {
          warnings.push("Updated adl_version in header to ADL 2.x.");
          out.push(
            line.replace(
              /adl_version\s*=\s*[^;)]+/i,
              `adl_version=${opts.targetAdlVersion}`,
            ),
          );
        } else {
          out.push(line);
        }
        headerDone = true;
        continue;
      }

      const meta: string[] = [
        `adl_version=${opts.targetAdlVersion}`,
        `rm_release=${opts.rmRelease}`,
      ];
      if (opts.markGenerated) meta.push("generated");
      out.push(`archetype (${meta.join("; ")})`);
      warnings.push("Inserted ADL 2 metadata on archetype header.");
      headerDone = true;
      continue;
    }

    out.push(line);
  }

  return out.join("\n");
}

function removeStandaloneSections(
  text: string,
  sectionNames: string[],
  warnings: string[],
): string {
  let result = text;
  for (const name of sectionNames) {
    const re = new RegExp(
      `^(${name})[ \\t]*\\n([\\s\\S]*?)(?=^(?:language|description|definition|ontology|terminology|rules|annotations|rm_overlay|concept|revision|archetype|template|operational_template)\\b|\\Z)`,
      "gim",
    );
    if (re.test(result)) {
      warnings.push(`Removed ADL 1.4 '${name}' section.`);
      result = result.replace(re, "");
    }
  }
  return result;
}

function renameSectionKeyword(
  text: string,
  from: string,
  to: string,
): string {
  return text.replace(
    new RegExp(`^([ \\t]*)${from}\\b`, "gim"),
    `$1${to}`,
  );
}

function stripTerminologiesAvailable(text: string): string {
  return text.replace(
    /^[ \t]*terminologies_available\s*=\s*<[^>]*>\s*\n?/gim,
    "",
  );
}

/** Unwrap ADL 1.4 `items = < ... >` inside term_definitions. */
function flattenTermDefinitionItemsWrappers(text: string): string {
  return text.replace(
    /^([ \t]*)items\s*=\s*<\s*\n([\s\S]*?)^\1>/gm,
    (_match, indent: string, body: string) => {
      const inner = body.split("\n").map((l) => `${indent}    ${l.trimStart()}`);
      return inner.join("\n") + "\n";
    },
  );
}

/** Convert `[at0001]` / `[ac1]` keys in terminology blocks to ADL2 `[id1]` form. */
function collectAdl14NodeAndValueCodesFromArchetype(text: string): {
  nodeIds: Set<string>;
  valueCodes: Set<string>;
} {
  const nodeIds = new Set<string>();
  const valueCodes = new Set<string>();
  const sections = splitTopLevelSections(text);
  for (const sec of sections) {
    const header = sec.header.trim().toLowerCase();
    if (header !== "definition" && header !== "rules") continue;
    const part = collectAdl14NodeAndValueCodes(sec.body);
    part.nodeIds.forEach((c) => nodeIds.add(c));
    part.valueCodes.forEach((c) => valueCodes.add(c));
  }
  return { nodeIds, valueCodes };
}

function convertTerminologyAcCodes(
  text: string,
  warnings: string[],
  codeScopes: { nodeIds: Set<string>; valueCodes: Set<string> },
  options?: Adl2CodingOptions,
): string {
  const sections = splitTopLevelSections(text);
  let changed = false;
  const converted = sections.map((sec) => {
    const header = sec.header.trim().toLowerCase();
    if (header !== "ontology" && header !== "terminology") return sec.raw;
    const body = convertAcCodeKeysInTerminologyBody(
      sec.body,
      codeScopes.nodeIds,
      codeScopes.valueCodes,
      options,
    );
    if (body !== sec.body) changed = true;
    return sec.header + "\n" + body;
  });
  if (changed && resolveAdl2CodingSystem(options) === "id-coded") {
    warnings.push(
      "Converted ADL 1.4 at-codes in terminology to ADL2 id-codes (at0000 → id1).",
    );
  } else if (changed) {
    warnings.push(
      "Normalised ADL 1.4 terminology keys for at-coded ADL2.",
    );
  }
  return converted.join("\n");
}

function convertAcCodeKeysInTerminologyBody(
  body: string,
  nodeIds: Set<string>,
  valueCodes: Set<string>,
  options?: Adl2CodingOptions,
): string {
  const mapKey = (code: string) =>
    opt14TerminologyKeyToAdl2(code, nodeIds, valueCodes, options);
  return body
    .replace(
      /\["(at\d+(?:\.\d+)*|ac[\d.]+)"\]/gi,
      (_m, code: string) => `["${mapKey(code)}"]`,
    )
    .replace(
      /\[(at\d+(?:\.\d+)*|ac[\d.]+)\]/gi,
      (_m, code: string) => `[${mapKey(code)}]`,
    );
}

/**
 * ADL 1.4 at-code → ADL2 id-code. ADL 1.4 codes are 0-based and ADL2 id-codes
 * are 1-based (`at0000` → `id1`, `at0003` → `id4`, `at0000.1` → `id1.1`),
 * matching {@link idToAtCode} in reverse and Archie's `ADL14NodeIDConverter`.
 * Codes minted in a specialisation (`at0.1`) are not shifted.
 */
export function adl14AtToId(code: string): string {
  const m = /^at(\d+)((?:\.\d+)*)$/i.exec(code);
  if (!m) return code;
  if (/^at0\./i.test(code)) return `id0${m[2]}`;
  return `id${parseInt(m[1], 10) + 1}${m[2] ?? ""}`;
}


interface TermEntry {
  code: string;
  lines: string[];
}

function parseTermTableEntries(block: string): TermEntry[] {
  const entries: TermEntry[] = [];
  const re = /\["([^"]+)"\]\s*=\s*</g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(block)) !== null) {
    const open = block.indexOf("<", m.index);
    let depth = 0;
    let close = open;
    for (let i = open; i < block.length; i++) {
      if (block[i] === "<") depth++;
      else if (block[i] === ">") {
        depth--;
        if (depth === 0) {
          close = i;
          break;
        }
      }
    }
    const body = block.slice(open + 1, close).trim();
    entries.push({
      code: m[1],
      lines: body ? body.split("\n").map((l) => l.trimEnd()) : [],
    });
  }
  return entries;
}

function mergeTermEntryLines(
  existing: string[],
  incoming: string[],
): string[] {
  const map = new Map<string, string>();
  for (const line of existing) {
    const kv = /^(\w+)\s*=/.exec(line.trim());
    if (kv) map.set(kv[1], line);
  }
  for (const line of incoming) {
    const kv = /^(\w+)\s*=/.exec(line.trim());
    if (kv) map.set(kv[1], line);
    else if (line.trim()) map.set(`__${map.size}`, line);
  }
  return [...map.values()];
}

function parseLanguageBlocks(block: string): Map<string, string> {
  const langs = new Map<string, string>();
  const re = /\["([^"]+)"\]\s*=\s*</g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(block)) !== null) {
    const open = block.indexOf("<", m.index);
    let depth = 0;
    for (let i = open; i < block.length; i++) {
      if (block[i] === "<") depth++;
      else if (block[i] === ">") {
        depth--;
        if (depth === 0) {
          langs.set(m[1], block.slice(open + 1, i));
          break;
        }
      }
    }
  }
  return langs;
}

function mergeLanguageTermBlocks(
  termDefsBlock: string,
  constraintDefsBlock: string,
  codeScopes: { nodeIds: Set<string>; valueCodes: Set<string> },
): string {
  const termLangs = parseLanguageBlocks(termDefsBlock);
  const constraintLangs = parseLanguageBlocks(constraintDefsBlock);

  for (const [lang, constraintInner] of constraintLangs) {
    const termInner = termLangs.get(lang) ?? "";
    const termEntries = parseTermTableEntries(termInner);
    const constraintEntries = parseTermTableEntries(constraintInner);
    const byCode = new Map(termEntries.map((e) => [e.code, e]));

    for (const ce of constraintEntries) {
      const idCode = opt14TerminologyKeyToAdl2(
        ce.code,
        codeScopes.nodeIds,
        codeScopes.valueCodes,
      );
      const existing = byCode.get(idCode) ?? byCode.get(ce.code);
      if (existing) {
        existing.lines = mergeTermEntryLines(existing.lines, ce.lines);
        byCode.set(existing.code, existing);
      } else {
        byCode.set(idCode, { code: idCode, lines: ce.lines });
      }
    }

    const mergedEntries = [...byCode.values()]
      .map((e) => {
        const inner = e.lines.map((l) => `            ${l.trim()}`).join("\n");
        return `        ["${e.code}"] = <\n${inner}\n        >`;
      })
      .join("\n");

    termLangs.set(lang, mergedEntries || termInner.trim());
  }

  return [...termLangs.entries()]
    .map(([lang, inner]) => {
      const body = inner.includes('["')
        ? inner
        : inner.trim();
      return `    ["${lang}"] = <\n${body}\n    >`;
    })
    .join("\n");
}

function extractOdinAssignmentBlock(text: string, key: string): string | undefined {
  const re = new RegExp(`\\b${key}\\s*=\\s*<`, "i");
  const match = re.exec(text);
  if (!match) return undefined;
  const open = text.indexOf("<", match.index);
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    if (text[i] === "<") depth++;
    else if (text[i] === ">") {
      depth--;
      if (depth === 0) return text.slice(open + 1, i);
    }
  }
  return undefined;
}

function mergeConstraintDefinitionsIntoTermDefinitions(
  text: string,
  warnings: string[],
  codeScopes: { nodeIds: Set<string>; valueCodes: Set<string> },
): string {
  const termBody = extractOdinAssignmentBlock(text, "term_definitions");
  const constraintBody = extractOdinAssignmentBlock(text, "constraint_definitions");
  if (!termBody || !constraintBody) {
    return text.replace(/\s*constraint_definitions\s*=\s*<[\s\S]*?>\s*/gi, "");
  }

  warnings.push(
    "constraint_definitions merged into term_definitions by code (ADL 1.4 → 2).",
  );
  const merged = mergeLanguageTermBlocks(termBody, constraintBody, codeScopes);
  const termStart = text.search(/\bterm_definitions\s*=/i);
  const termOpen = text.indexOf("<", termStart);
  let depth = 0;
  let termClose = -1;
  for (let i = termOpen; i < text.length; i++) {
    if (text[i] === "<") depth++;
    else if (text[i] === ">") {
      depth--;
      if (depth === 0) {
        termClose = i;
        break;
      }
    }
  }
  const before = text.slice(0, termOpen + 1);
  const after = text.slice(termClose);
  const withoutConstraint = after.replace(
    /\s*constraint_definitions\s*=\s*<[\s\S]*?>\s*/i,
    "",
  );
  return `${before}\n${merged}\n    ${withoutConstraint}`;
}

/** ADL 1.4 value_sets under ontology: ensure block survives terminology rename. */
function migrateValueSetsSection(
  text: string,
  warnings: string[],
  codeScopes: { nodeIds: Set<string>; valueCodes: Set<string> },
  options?: Adl2CodingOptions,
): string {
  const re = /^([ \t]*)value_sets\s*=\s*<\s*\n([\s\S]*?)^\1>/gim;
  if (!re.test(text)) return text;
  warnings.push("Normalised value_sets block under terminology.");
  const mapKey = (code: string) =>
    opt14TerminologyKeyToAdl2(code, codeScopes.nodeIds, codeScopes.valueCodes, options);
  return text.replace(re, (_full, indent: string, body: string) => {
    const inner = body.replace(
      /\[(at\d+|ac[\d.]+)\]/gi,
      (_m, code: string) => `[${mapKey(code)}]`,
    );
    return `${indent}value_sets = <\n${inner}${indent}>`;
  });
}

interface Adl14QuantityListItem {
  units?: string;
  magnitude?: string;
  precision?: string;
}

interface Adl14QuantityAssumedValue {
  units?: string;
  magnitude?: string;
  precision?: string;
}

interface ParsedCDvQuantity {
  property?: string;
  list: Adl14QuantityListItem[];
  assumedValue?: Adl14QuantityAssumedValue;
}

/**
 * Convert ADL 1.4 domain-type ODIN blocks (`C_DV_QUANTITY < ... >`) inside the
 * `definition` section to ADL2 `DV_QUANTITY` constraints with attribute tuples.
 */
function convertAdl14DomainTypeBlocks(
  text: string,
  warnings: string[],
): string {
  const sections = splitTopLevelSections(text);
  let convertedCount = 0;
  const updated = sections.map((sec) => {
    if (!/^definition\b/i.test(sec.header.trim())) return sec.raw;
    const { body, count } = convertCDvQuantityBlocksInBody(sec.body);
    convertedCount += count;
    return count > 0 ? sec.header + "\n" + body : sec.raw;
  });
  if (convertedCount > 0) {
    warnings.push(
      `Converted ${convertedCount} ADL 1.4 C_DV_QUANTITY block(s) to ADL2 DV_QUANTITY tuple form.`,
    );
  }
  return updated.join("\n");
}

function convertCDvQuantityBlocksInBody(
  body: string,
): { body: string; count: number } {
  let out = "";
  let pos = 0;
  let count = 0;
  const len = body.length;

  while (pos < len) {
    const ch = body[pos];
    // Skip line comments (`-- ...`)
    if (ch === "-" && body[pos + 1] === "-") {
      const nl = body.indexOf("\n", pos);
      const end = nl === -1 ? len : nl + 1;
      out += body.slice(pos, end);
      pos = end;
      continue;
    }
    // Skip quoted strings
    if (ch === '"') {
      const end = skipQuotedString(body, pos);
      out += body.slice(pos, end);
      pos = end;
      continue;
    }

    if (
      body.startsWith("C_DV_QUANTITY", pos) &&
      (pos === 0 || !/[A-Za-z0-9_]/.test(body[pos - 1])) &&
      (pos + 13 >= len || !/[A-Za-z0-9_]/.test(body[pos + 13]))
    ) {
      let cursor = pos + 13;
      while (cursor < len && /\s/.test(body[cursor])) cursor++;
      if (body[cursor] === "<") {
        const closeIdx = findMatchingOdinAngleClose(body, cursor);
        if (closeIdx > cursor) {
          const inner = body.slice(cursor + 1, closeIdx);
          const lineStart = body.lastIndexOf("\n", pos - 1) + 1;
          const linePrefix = body.slice(lineStart, pos);
          const baseIndent = /^[ \t]*$/.test(linePrefix)
            ? linePrefix
            : (/^[ \t]*/.exec(linePrefix)?.[0] ?? "");
          const parsed = parseAdl14CDvQuantityOdin(inner);
          out += formatAdl2DvQuantity(parsed, baseIndent);
          pos = closeIdx + 1;
          count++;
          continue;
        }
      }
    }

    out += ch;
    pos++;
  }

  return { body: out, count };
}

function skipQuotedString(text: string, openQuoteIdx: number): number {
  let i = openQuoteIdx + 1;
  while (i < text.length) {
    if (text[i] === "\\") {
      i += 2;
      continue;
    }
    if (text[i] === '"') return i + 1;
    i++;
  }
  return text.length;
}

/**
 * Find the matching `>` for an ODIN `<` at `openIdx`, skipping `--` comments,
 * `"..."` string literals, and `|...|` interval literals (which may contain
 * `<`, `>`, `<=`, `>=`).
 */
function findMatchingOdinAngleClose(text: string, openIdx: number): number {
  let depth = 0;
  let i = openIdx;
  while (i < text.length) {
    const ch = text[i];
    if (ch === "-" && text[i + 1] === "-") {
      const nl = text.indexOf("\n", i);
      i = nl === -1 ? text.length : nl + 1;
      continue;
    }
    if (ch === '"') {
      i = skipQuotedString(text, i);
      continue;
    }
    if (ch === "|") {
      const closePipe = text.indexOf("|", i + 1);
      if (closePipe !== -1) {
        i = closePipe + 1;
        continue;
      }
    }
    if (ch === "<") depth++;
    else if (ch === ">") {
      depth--;
      if (depth === 0) return i;
    }
    i++;
  }
  return -1;
}

/** Parse top-level `key = <...>` or `["key"] = <...>` assignments in an ODIN block. */
function parseOdinBlockEntries(
  inner: string,
): Array<{ key: string; keyed: boolean; body: string }> {
  const entries: Array<{ key: string; keyed: boolean; body: string }> = [];
  let i = 0;
  const len = inner.length;

  const skipWsAndComments = () => {
    while (i < len) {
      if (/\s/.test(inner[i])) {
        i++;
      } else if (inner[i] === "-" && inner[i + 1] === "-") {
        const nl = inner.indexOf("\n", i);
        i = nl === -1 ? len : nl + 1;
      } else {
        break;
      }
    }
  };

  while (i < len) {
    skipWsAndComments();
    if (i >= len) break;

    let key = "";
    let keyed = false;
    if (inner[i] === "[") {
      keyed = true;
      const closeBracket = inner.indexOf("]", i + 1);
      if (closeBracket === -1) break;
      key = inner.slice(i + 1, closeBracket).trim().replace(/^["']|["']$/g, "");
      i = closeBracket + 1;
    } else if (/[A-Za-z_]/.test(inner[i])) {
      const start = i;
      while (i < len && /[A-Za-z0-9_]/.test(inner[i])) i++;
      key = inner.slice(start, i);
    } else {
      i++;
      continue;
    }

    skipWsAndComments();
    if (inner[i] !== "=") continue;
    i++;
    skipWsAndComments();
    if (inner[i] !== "<") continue;
    const closeIdx = findMatchingOdinAngleClose(inner, i);
    if (closeIdx === -1) break;
    entries.push({
      key,
      keyed,
      body: inner.slice(i + 1, closeIdx),
    });
    i = closeIdx + 1;
  }

  return entries;
}

function unquoteOdinString(raw: string): string | undefined {
  const trimmed = raw.trim();
  if (trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"')) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, "\\");
    }
  }
  return undefined;
}

function extractOdinInterval(raw: string): string | undefined {
  const trimmed = raw.trim();
  const m = /^\|([\s\S]*)\|$/.exec(trimmed);
  if (m) return m[1].trim();
  if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) return trimmed;
  return undefined;
}

function extractOdinNumberLiteral(raw: string): string | undefined {
  const trimmed = raw.trim();
  if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) return trimmed;
  return undefined;
}

function parseAdl14CDvQuantityOdin(inner: string): ParsedCDvQuantity {
  const parsed: ParsedCDvQuantity = { list: [] };
  for (const entry of parseOdinBlockEntries(inner)) {
    const key = entry.key.toLowerCase();
    if (key === "property") {
      const trimmed = entry.body.trim();
      if (trimmed) parsed.property = trimmed;
    } else if (key === "list") {
      for (const listEntry of parseOdinBlockEntries(entry.body)) {
        const item: Adl14QuantityListItem = {};
        for (const field of parseOdinBlockEntries(listEntry.body)) {
          const fk = field.key.toLowerCase();
          if (fk === "units") {
            const u = unquoteOdinString(field.body);
            if (u !== undefined) item.units = u;
          } else if (fk === "magnitude") {
            const mag = extractOdinInterval(field.body);
            if (mag !== undefined) item.magnitude = mag;
          } else if (fk === "precision") {
            const prc = extractOdinInterval(field.body);
            if (prc !== undefined) item.precision = prc;
          }
        }
        if (
          item.units !== undefined ||
          item.magnitude !== undefined ||
          item.precision !== undefined
        ) {
          parsed.list.push(item);
        }
      }
    } else if (key === "assumed_value") {
      const av: Adl14QuantityAssumedValue = {};
      for (const field of parseOdinBlockEntries(entry.body)) {
        const fk = field.key.toLowerCase();
        if (fk === "units") {
          const u = unquoteOdinString(field.body);
          if (u !== undefined) av.units = u;
        } else if (fk === "magnitude") {
          const mag = extractOdinNumberLiteral(field.body);
          if (mag !== undefined) av.magnitude = mag;
        } else if (fk === "precision") {
          const prc = extractOdinNumberLiteral(field.body);
          if (prc !== undefined) av.precision = prc;
        }
      }
      if (
        av.units !== undefined ||
        av.magnitude !== undefined ||
        av.precision !== undefined
      ) {
        parsed.assumedValue = av;
      }
    }
  }
  return parsed;
}

function formatAdl2DvQuantity(
  parsed: ParsedCDvQuantity,
  baseIndent: string,
): string {
  const step = baseIndent.includes("\t") ? "\t" : "    ";
  const innerIndent = baseIndent + step;
  const rowIndent = innerIndent + step;
  const lines: string[] = [];

  if (parsed.property) {
    lines.push(`${innerIndent}property matches {${parsed.property}}`);
  }

  const av = parsed.assumedValue;
  const rowsSource: Adl14QuantityListItem[] = parsed.list.length > 0
    ? parsed.list
    : av
    ? [{}]
    : [];

  if (rowsSource.length > 0) {
    const columns: Array<"units" | "magnitude" | "precision"> = [];
    if (
      rowsSource.some((i) => i.units !== undefined) || av?.units !== undefined
    ) {
      columns.push("units");
    }
    if (
      rowsSource.some((i) => i.magnitude !== undefined) ||
      av?.magnitude !== undefined
    ) {
      columns.push("magnitude");
    }
    if (
      rowsSource.some((i) => i.precision !== undefined) ||
      av?.precision !== undefined
    ) {
      columns.push("precision");
    }

    if (columns.length > 0) {
      let assumedIdx = -1;
      if (av) {
        if (av.units !== undefined) {
          assumedIdx = rowsSource.findIndex((i) => i.units === av.units);
        }
        if (assumedIdx < 0) assumedIdx = 0;
      }

      const formattedRows = rowsSource.map((item, idx) => {
        const isAssumed = idx === assumedIdx;
        const cells = columns.map((col) => {
          if (col === "units") {
            const base = item.units !== undefined
              ? JSON.stringify(item.units)
              : "*";
            const suffix = isAssumed && av?.units !== undefined
              ? `; ${JSON.stringify(av.units)}`
              : "";
            return `{${base}${suffix}}`;
          }
          if (col === "magnitude") {
            const base = item.magnitude !== undefined
              ? `|${item.magnitude}|`
              : "*";
            const suffix = isAssumed && av?.magnitude !== undefined
              ? `; ${av.magnitude}`
              : "";
            return `{${base}${suffix}}`;
          }
          const base = item.precision !== undefined
            ? `|${item.precision}|`
            : "*";
          const suffix = isAssumed && av?.precision !== undefined
            ? `; ${av.precision}`
            : "";
          return `{${base}${suffix}}`;
        });
        return `${rowIndent}[${cells.join(", ")}]`;
      });

      lines.push(
        `${innerIndent}[${columns.join(", ")}] matches {\n${
          formattedRows.join(",\n")
        }\n${innerIndent}}`,
      );
    }
  }

  if (lines.length === 0) {
    return "DV_QUANTITY";
  }
  return `DV_QUANTITY matches {\n${lines.join("\n")}\n${baseIndent}}`;
}

/** Convert node id brackets in definition/rules: [at0001] → [id1]. */
function convertDefinitionNodeIds(text: string): string {
  const sections = splitTopLevelSections(text);
  const converted = sections.map((sec) => {
    if (!/^(definition|rules)\b/i.test(sec.header.trim())) return sec.raw;
    return sec.header + "\n" + convertAtNodeIdsInBody(sec.body);
  });
  return converted.join("\n");
}

function convertAtNodeIdsInBody(body: string): string {
  return body.replace(
    /\[(at\d+(?:\.\d+)*)\]/gi,
    (_m, code: string) => `[${adl14AtToId(code)}]`,
  );
}

function stripDeprecatedMatchesAny(text: string): string {
  return text.replace(/\s+matches\s*\{\s*\*\s*\}/g, "");
}

/** Normalise `openEHR-....v1` → `openEHR-....v1.0.0` on the HRID line. */
function normalizeArchetypeHridVersion(
  text: string,
  warnings: string[],
): string {
  const updated = text.replace(
    /^([ \t]+)(openEHR-[^\s]+)\.v(\d+)\s*$/gim,
    (_line, indent: string, base: string, major: string) => {
      warnings.push(`Normalised HRID version v${major} → v${major}.0.0.`);
      return `${indent}${base}.v${major}.0.0`;
    },
  );
  return updated;
}

interface SectionSlice {
  header: string;
  body: string;
  raw: string;
}

function splitTopLevelSections(text: string): SectionSlice[] {
  const lines = text.split("\n");
  const slices: SectionSlice[] = [];
  let currentHeader = "";
  let currentBody: string[] = [];
  let startIdx = 0;
  const preamble: string[] = [];

  // Column 0 only. Indented `description = <…>` and `description matches {`
  // are ODIN keys and RM attributes, not ADL sections (#142).
  const isSectionStart = (line: string) =>
    /^(archetype|template|operational_template|language|description|definition|ontology|terminology|rules|annotations|rm_overlay)\b/i
      .test(line.replace(/^\uFEFF/, ""));

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (isSectionStart(line)) {
      if (currentHeader || currentBody.length) {
        const raw = lines.slice(startIdx, i).join("\n");
        slices.push({
          header: currentHeader,
          body: currentBody.join("\n"),
          raw,
        });
      }
      currentHeader = lines[i];
      currentBody = [];
      startIdx = i;
    } else if (currentHeader) {
      currentBody.push(lines[i]);
    } else {
      preamble.push(line);
    }
  }

  if (currentHeader || currentBody.length) {
    slices.push({
      header: currentHeader,
      body: currentBody.join("\n"),
      raw: lines.slice(startIdx).join("\n"),
    });
  }

  if (slices.length === 0) {
    return [{ header: "", body: text, raw: text }];
  }
  if (preamble.some((l) => l.trim() !== "")) {
    const raw = preamble.join("\n");
    slices.unshift({ header: "", body: "", raw });
  }
  return slices;
}
