/**
 * In-memory session for the throwaway TAAAT UI prototype.
 * Surfaces enough state to judge layout + L10n generation safety.
 */

import type { AnnotationDocumentation } from "../../../../parser/clinical_model_annotations.ts";
import {
  applyL10nWrites,
  proposeL10nWrites,
  type ApplyL10nResult,
  type L10nWrite,
} from "../../../../parser/l10n_annotation_generate.ts";
import {
  asL10nSources,
  cloneSampleDocumentation,
  cloneSampleTree,
  findNode,
  PROTO_LANGUAGES,
  type ProtoNode,
} from "./sample-model.ts";

export interface ProtoSession {
  tree: ProtoNode;
  documentation: AnnotationDocumentation;
  languages: string[];
  selectedPath: string;
  editorLanguage: string;
  overwrite: boolean;
  repeatedOnly: boolean;
  copyToAllBags: boolean;
  lastWrites: L10nWrite[];
  lastResult?: ApplyL10nResult;
}

export function createSession(): ProtoSession {
  const tree = cloneSampleTree();
  return {
    tree,
    documentation: cloneSampleDocumentation(),
    languages: [...PROTO_LANGUAGES],
    selectedPath: tree.path,
    editorLanguage: "en",
    overwrite: false,
    repeatedOnly: true,
    copyToAllBags: true,
    lastWrites: [],
  };
}

export function selectedNode(session: ProtoSession): ProtoNode | undefined {
  return findNode(session.tree, session.selectedPath);
}

export function annotationsFor(
  session: ProtoSession,
  path: string,
  language = session.editorLanguage,
): Record<string, string> {
  return { ...(session.documentation[language]?.[path] ?? {}) };
}

export function setAnnotation(
  session: ProtoSession,
  path: string,
  key: string,
  value: string,
  language = session.editorLanguage,
): void {
  const k = key.trim();
  if (!k) return;
  session.documentation[language] ??= {};
  session.documentation[language][path] ??= {};
  session.documentation[language][path][k] = value;
}

export function removeAnnotation(
  session: ProtoSession,
  path: string,
  key: string,
  language = session.editorLanguage,
): void {
  const bag = session.documentation[language]?.[path];
  if (!bag) return;
  delete bag[key];
  if (Object.keys(bag).length === 0) {
    delete session.documentation[language][path];
  }
}

export function previewL10n(session: ProtoSession): L10nWrite[] {
  const writes = proposeL10nWrites(session.documentation, asL10nSources(session.tree), {
    languageBags: session.languages,
    overwrite: session.overwrite,
    repeatedOccurrencesOnly: session.repeatedOnly,
    copyToAllLanguageBags: session.copyToAllBags,
  });
  session.lastWrites = writes;
  return writes;
}

export function applyL10n(session: ProtoSession): ApplyL10nResult {
  const writes = previewL10n(session);
  const result = applyL10nWrites(
    session.documentation,
    writes,
    session.overwrite,
  );
  session.lastResult = result;
  return result;
}

export function resetSession(session: ProtoSession): void {
  const fresh = createSession();
  session.tree = fresh.tree;
  session.documentation = fresh.documentation;
  session.selectedPath = fresh.selectedPath;
  session.lastWrites = [];
  session.lastResult = undefined;
}

export function sessionSnapshot(session: ProtoSession): unknown {
  return {
    selectedPath: session.selectedPath,
    editorLanguage: session.editorLanguage,
    generate: {
      overwrite: session.overwrite,
      repeatedOnly: session.repeatedOnly,
      copyToAllBags: session.copyToAllBags,
      lastResult: session.lastResult ?? null,
      writeCounts: {
        add: session.lastWrites.filter((w) => w.kind === "add").length,
        unchanged: session.lastWrites.filter((w) => w.kind === "unchanged").length,
        conflict: session.lastWrites.filter((w) => w.kind === "conflict").length,
      },
    },
    documentation: session.documentation,
  };
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
