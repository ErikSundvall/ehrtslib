/**
 * Convert ADL 1.4 (and transitional 1.5) archetype text toward ADL 2.0 syntax.
 *
 * Based on openEHR ADL2 spec §7.13.5 and ADL 1.4 conversion notes (ontology → terminology,
 * merged term tables, id-codes for node ids, deprecated `matches {*}`, etc.).
 *
 * Semantic migration covers ac-code / value_sets reshaping in terminology sections and
 * merging `constraint_definitions` into `term_definitions` by code key.
 */

import { detectAdlVersion } from "./adl_version.ts";

export interface Adl14ConversionOptions {
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

const DEFAULT_OPTS: Required<
  Pick<Adl14ConversionOptions, "targetAdlVersion" | "rmRelease" | "markGenerated">
> = {
  targetAdlVersion: "2.0.6",
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
  const opts = { ...DEFAULT_OPTS, ...options };
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

  let text = source.replace(/\r\n/g, "\n");

  text = normalizeArchetypeHeader(text, opts, warnings);
  text = removeStandaloneSections(text, ["concept", "revision"], warnings);
  text = renameSectionKeyword(text, "ontology", "terminology");
  text = renameSectionKeyword(text, "constraint_bindings", "term_bindings");
  text = stripTerminologiesAvailable(text);
  text = flattenTermDefinitionItemsWrappers(text);
  text = convertTerminologyAcCodes(text, warnings);
  text = mergeConstraintDefinitionsIntoTermDefinitions(text, warnings);
  text = migrateValueSetsSection(text, warnings);
  text = convertDefinitionNodeIds(text);
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
      `^([ \\t]*)${name}[ \\t]*\\n([\\s\\S]*?)(?=^[ \\t]*(?:language|description|definition|ontology|terminology|rules|annotations|rm_overlay|concept|revision|archetype|template|operational_template)\\b|\\Z)`,
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
function convertTerminologyAcCodes(text: string, warnings: string[]): string {
  const sections = splitTopLevelSections(text);
  let changed = false;
  const converted = sections.map((sec) => {
    const header = sec.header.trim().toLowerCase();
    if (header !== "ontology" && header !== "terminology") return sec.raw;
    const body = convertAcCodeKeysInTerminologyBody(sec.body);
    if (body !== sec.body) changed = true;
    return sec.header + "\n" + body;
  });
  if (changed) {
    warnings.push("Converted ac-code keys in terminology to ADL2 id form.");
  }
  return converted.join("\n");
}

function convertAcCodeKeysInTerminologyBody(body: string): string {
  return body
    .replace(
      /\["(at\d+|ac[\d.]+)"\]/gi,
      (_m, code: string) => `["${acCodeToIdKey(code)}"]`,
    )
    .replace(
      /\[(at\d+|ac[\d.]+)\]/gi,
      (_m, code: string) => `[${acCodeToIdKey(code)}]`,
    );
}

function acCodeToIdKey(code: string): string {
  const at = /^at(\d+)$/i.exec(code);
  if (at) return `id${parseInt(at[1], 10)}`;
  const ac = /^ac([\d.]+)$/i.exec(code);
  if (ac) return `ac${ac[1]}`;
  return code;
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
): string {
  const termLangs = parseLanguageBlocks(termDefsBlock);
  const constraintLangs = parseLanguageBlocks(constraintDefsBlock);

  for (const [lang, constraintInner] of constraintLangs) {
    const termInner = termLangs.get(lang) ?? "";
    const termEntries = parseTermTableEntries(termInner);
    const constraintEntries = parseTermTableEntries(constraintInner);
    const byCode = new Map(termEntries.map((e) => [e.code, e]));

    for (const ce of constraintEntries) {
      const idCode = acCodeToIdKey(ce.code);
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
): string {
  const termBody = extractOdinAssignmentBlock(text, "term_definitions");
  const constraintBody = extractOdinAssignmentBlock(text, "constraint_definitions");
  if (!termBody || !constraintBody) {
    return text.replace(/\s*constraint_definitions\s*=\s*<[\s\S]*?>\s*/gi, "");
  }

  warnings.push(
    "constraint_definitions merged into term_definitions by code (ADL 1.4 → 2).",
  );
  const merged = mergeLanguageTermBlocks(termBody, constraintBody);
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
function migrateValueSetsSection(text: string, warnings: string[]): string {
  const re = /^([ \t]*)value_sets\s*=\s*<\s*\n([\s\S]*?)^\1>/gim;
  if (!re.test(text)) return text;
  warnings.push("Normalised value_sets block under terminology.");
  return text.replace(re, (_full, indent: string, body: string) => {
    const inner = body.replace(
      /\[(at\d+|ac[\d.]+)\]/gi,
      (_m, code: string) => `[${acCodeToIdKey(code)}]`,
    );
    return `${indent}value_sets = <\n${inner}${indent}>`;
  });
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
    /\[(at)(\d+)\]/gi,
    (_m, _at: string, digits: string) => `[id${parseInt(digits, 10)}]`,
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

  const isSectionStart = (trimmed: string) =>
    /^(archetype|template|operational_template|language|description|definition|ontology|terminology|rules|annotations|rm_overlay)\b/i
      .test(trimmed);

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (isSectionStart(trimmed)) {
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
  return slices;
}
