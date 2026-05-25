/**
 * Convert ADL 1.4 (and transitional 1.5) archetype text toward ADL 2.0 syntax.
 *
 * Based on openEHR ADL2 spec §7.13.5 and ADL 1.4 conversion notes (ontology → terminology,
 * merged term tables, id-codes for node ids, deprecated `matches {*}`, etc.).
 *
 * Full AOM semantic migration (value_sets, ac-code reshaping) is not applied here — only
 * syntactic normalisation so the ADL2 parser can consume community legacy files.
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
  text = mergeConstraintDefinitionsIntoTermDefinitions(text, warnings);
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

function mergeConstraintDefinitionsIntoTermDefinitions(
  text: string,
  warnings: string[],
): string {
  const re =
    /^[ \t]*constraint_definitions\s*=\s*<([\s\S]*?)>\s*(?=\n[ \t]*(?:term_bindings|constraint_bindings|value_sets|terminology|ontology|definition|rules|annotations|rm_overlay)\b|\n[ \t]*\w|\Z)/gim;
  if (!re.test(text)) return text;
  warnings.push(
    "constraint_definitions merged into term_definitions by name (ADL 1.4 → 2).",
  );
  return text.replace(re, (_full, inner: string) => {
    return inner.trim() ? `    /* merged constraint_definitions */\n${inner}` : "";
  }).replace(
    /^[ \t]*constraint_definitions\s*=\s*<\s*>/gim,
    "",
  );
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
