/**
 * Composition-wide ENTRY defaults (language, encoding, subject) for document codecs.
 */

import { parseCodePhraseDisplay } from "./value_parse.ts";
import { mergeRmPatchPayload } from "./oe_rm_sparse.ts";
import { renderRmValue } from "./document_rm_render.ts";
import { formatSparseRmAsciidoc, formatSparseRmMarkdown } from "./oe_rm_sparse.ts";
import type { DocumentMetadata } from "./document_to_rm.ts";
import { ENTRY_TYPES } from "./document_blocks.ts";

export type CompositionEntryDefaults = {
  language?: Record<string, unknown>;
  encoding?: Record<string, unknown>;
  subject?: Record<string, unknown>;
};

function codePhraseKey(cp: unknown): string | undefined {
  if (!cp || typeof cp !== "object") return undefined;
  const o = cp as Record<string, unknown>;
  const term = (o.terminology_id as Record<string, unknown> | undefined)?.value;
  const code = o.code_string;
  if (typeof term !== "string" || typeof code !== "string") return undefined;
  return `${term}::${code}`;
}

export function codePhrasesEqual(a: unknown, b: unknown): boolean {
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;
  return codePhraseKey(a) === codePhraseKey(b);
}

function subjectKey(subject: unknown): string {
  if (!subject || typeof subject !== "object") return "";
  const o = subject as Record<string, unknown>;
  const type = String(o._type ?? "");
  if (type === "PARTY_IDENTIFIED" && typeof o.name === "string") {
    return `${type}:${o.name}`;
  }
  if (o.external_ref) {
    return `${type}:ref:${JSON.stringify(o.external_ref)}`;
  }
  return type;
}

export function subjectsEqual(a: unknown, b: unknown): boolean {
  return subjectKey(a) === subjectKey(b);
}

const SUBJECT_REF_PREFIX = ";ref=b64:";

export function formatSubjectMeta(subject: Record<string, unknown>): string {
  const type = String(subject._type ?? "PARTY_SELF");
  if (type === "PARTY_IDENTIFIED" && typeof subject.name === "string") {
    return `PARTY_IDENTIFIED:${subject.name}`;
  }
  if (subject.external_ref) {
    const b64 = btoa(JSON.stringify(subject.external_ref))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    return `${type}${SUBJECT_REF_PREFIX}${b64}`;
  }
  return type;
}

export function parseSubjectMeta(raw: string): Record<string, unknown> {
  const trimmed = raw.trim();
  if (trimmed.startsWith("PARTY_IDENTIFIED:")) {
    return {
      _type: "PARTY_IDENTIFIED",
      name: trimmed.slice("PARTY_IDENTIFIED:".length),
    };
  }
  const refIdx = trimmed.indexOf(SUBJECT_REF_PREFIX);
  if (refIdx >= 0) {
    const type = trimmed.slice(0, refIdx) || "PARTY_SELF";
    const b64 = trimmed.slice(refIdx + SUBJECT_REF_PREFIX.length);
    try {
      const json = atob(b64.replace(/-/g, "+").replace(/_/g, "/"));
      const external_ref = JSON.parse(json);
      return { _type: type, external_ref };
    } catch {
      /* fall through */
    }
  }
  return { _type: trimmed || "PARTY_SELF" };
}

const SUBJECT_RENDER_OPTS = {
  lossy: false,
  useTerseFormat: false,
  codeRendering: "inline_bracket" as const,
  includeTypeAnnotations: false,
};

export function formatSubjectStructural(
  subject: Record<string, unknown>,
  codec: "markdown" | "asciidoc",
): string {
  const vis = renderRmValue(subject, SUBJECT_RENDER_OPTS, 0);
  const recovered: Record<string, unknown> = {};
  if (subject._type === "PARTY_IDENTIFIED" && typeof subject.name === "string") {
    recovered._type = "PARTY_IDENTIFIED";
    recovered.name = subject.name;
  } else if (subject.external_ref) {
    recovered._type = typeof subject._type === "string" ? subject._type : "PARTY_SELF";
    recovered.external_ref = subject.external_ref;
  } else if (typeof subject._type === "string") {
    recovered._type = subject._type;
  }
  const ann = codec === "markdown"
    ? formatSparseRmMarkdown(subject, recovered)
    : formatSparseRmAsciidoc(subject, recovered);
  return `${vis}${ann}`;
}

export function parseSubjectFromList(
  visible: string,
  oeRmPayload?: string,
): Record<string, unknown> {
  const vis = visible.trim();
  if (vis && vis !== "—") {
    if (vis.startsWith("PARTY_IDENTIFIED:")) {
      return mergeRmPatchPayload(parseSubjectMeta(vis), oeRmPayload);
    }
    const base: Record<string, unknown> = {};
    if (typeof vis === "string" && vis.split(" · ")[0]) {
      base.name = vis.split(" · ")[0].trim();
    }
    if (oeRmPayload) return mergeRmPatchPayload(base, oeRmPayload);
    return parseSubjectMeta(vis);
  }
  return mergeRmPatchPayload(parseSubjectMeta("PARTY_SELF"), oeRmPayload);
}

function walkEntries(
  nodes: unknown[],
  visit: (entry: Record<string, unknown>) => void,
): void {
  for (const node of nodes) {
    if (!node || typeof node !== "object") continue;
    const o = node as Record<string, unknown>;
    const type = o._type;
    if (typeof type === "string" && ENTRY_TYPES.has(type)) {
      visit(o);
    }
    if (Array.isArray(o.items)) walkEntries(o.items, visit);
    if (Array.isArray(o.content)) walkEntries(o.content, visit);
  }
}

export function computeCompositionEntryDefaults(
  comp: Record<string, unknown>,
): CompositionEntryDefaults {
  const entries: Record<string, unknown>[] = [];
  if (Array.isArray(comp.content)) {
    walkEntries(comp.content, (e) => entries.push(e));
  }
  const defaults: CompositionEntryDefaults = {};
  if (comp.language) defaults.language = comp.language as Record<string, unknown>;

  let enc: Record<string, unknown> | undefined;
  let encUniform = true;
  let subj: Record<string, unknown> | undefined;
  let subjUniform = true;

  for (const entry of entries) {
    if (entry.encoding) {
      if (!enc) enc = entry.encoding as Record<string, unknown>;
      else if (!codePhrasesEqual(enc, entry.encoding)) encUniform = false;
    }
    if (entry.subject) {
      if (!subj) subj = entry.subject as Record<string, unknown>;
      else if (!subjectsEqual(subj, entry.subject)) subjUniform = false;
    }
  }
  if (encUniform && enc) defaults.encoding = enc;
  if (subjUniform && subj) defaults.subject = subj;
  return defaults;
}

function formatCodePhraseMeta(cp: Record<string, unknown>): string {
  const term = (cp.terminology_id as Record<string, unknown> | undefined)?.value;
  const code = cp.code_string;
  if (typeof term === "string" && typeof code === "string") {
    return `${term}::${code}`;
  }
  return JSON.stringify(cp);
}

export function writeEntryDefaultsToFrontmatter(
  defaults: CompositionEntryDefaults,
  emit: (key: string, value: string) => void,
): void {
  if (defaults.encoding) {
    emit("entry_encoding", `"${formatCodePhraseMeta(defaults.encoding)}"`);
  }
  if (defaults.subject) {
    emit("default_subject", `"${formatSubjectMeta(defaults.subject)}"`);
  }
}

export function writeEntryDefaultsToAsciidocAttrs(
  defaults: CompositionEntryDefaults,
  lines: string[],
): void {
  if (defaults.encoding) {
    lines.push(`:entry-encoding: ${formatCodePhraseMeta(defaults.encoding)}`);
  }
  if (defaults.subject) {
    lines.push(`:default-subject: ${formatSubjectMeta(defaults.subject)}`);
  }
}

function parseFrontmatterEncoding(raw: string): Record<string, unknown> | undefined {
  const cp = parseCodePhraseDisplay(raw.replace(/^"(.*)"$/, "$1"));
  return cp ?? undefined;
}

/** Fill missing ENTRY.language from composition (canonical RM) for comparisons. */
export function normalizeCompositionEntryDefaultsInPlace(root: unknown): void {
  if (!root || typeof root !== "object") return;
  const comp = root as Record<string, unknown>;
  if (comp._type !== "COMPOSITION" || !Array.isArray(comp.content)) return;
  const lang = comp.language;
  if (!lang) return;
  walkEntries(comp.content, (entry) => {
    if (!entry.language) {
      entry.language = structuredClone(lang as Record<string, unknown>);
    }
  });
}

export function applyCompositionEntryDefaults(
  root: Record<string, unknown>,
  meta: DocumentMetadata,
): void {
  if (root._type !== "COMPOSITION" || !Array.isArray(root.content)) return;

  const lang = root.language as Record<string, unknown> | undefined;
  const encRaw = meta.frontmatter.entry_encoding;
  const enc = encRaw ? parseFrontmatterEncoding(encRaw) : undefined;
  const subjRaw = meta.frontmatter.default_subject;
  const subj = subjRaw
    ? parseSubjectMeta(subjRaw.replace(/^"(.*)"$/, "$1"))
  : undefined;

  walkEntries(root.content, (entry) => {
    if (!entry.language && lang) entry.language = structuredClone(lang);
    if (!entry.encoding && enc) entry.encoding = structuredClone(enc);
    if (!entry.subject && subj) entry.subject = structuredClone(subj);
  });
}

export function entryMetadataDiffersFromDefaults(
  entry: Record<string, unknown>,
  defaults: CompositionEntryDefaults,
): { language?: boolean; encoding?: boolean; subject?: boolean } {
  const out: { language?: boolean; encoding?: boolean; subject?: boolean } = {};
  if (entry.language && defaults.language &&
    !codePhrasesEqual(entry.language, defaults.language)) {
    out.language = true;
  } else if (entry.language && !defaults.language) {
    out.language = true;
  }
  if (entry.encoding && defaults.encoding &&
    !codePhrasesEqual(entry.encoding, defaults.encoding)) {
    out.encoding = true;
  } else if (entry.encoding && !defaults.encoding) {
    out.encoding = true;
  }
  if (entry.subject && defaults.subject &&
    !subjectsEqual(entry.subject, defaults.subject)) {
    out.subject = true;
  } else if (entry.subject && !defaults.subject) {
    out.subject = true;
  }
  return out;
}
