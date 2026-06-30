/**
 * Shared display settings for demo CodeMirror editors.
 * Line wrap and line numbering are controlled from the footer and apply globally.
 */

import type { Compartment } from "@codemirror/state";
import { EditorView, lineNumbers } from "@codemirror/view";

interface RegisteredCodeMirror {
  view: EditorView;
  lineNumbers: Compartment;
  lineWrap: Compartment;
}

const codeMirrorEditors = new Set<RegisteredCodeMirror>();

let lineWrapEnabled = false;
let lineNumbersEnabled = true;

function readCheckbox(selector: string, fallback: boolean): boolean {
  const el = document.querySelector<HTMLInputElement>(selector);
  return el?.checked ?? fallback;
}

function applyLineWrapToAll(wrap: boolean): void {
  lineWrapEnabled = wrap;
  for (const { view, lineWrap } of codeMirrorEditors) {
    view.dispatch({
      effects: lineWrap.reconfigure(wrap ? EditorView.lineWrapping : []),
    });
  }
}

function applyLineNumbersToAll(show: boolean): void {
  lineNumbersEnabled = show;
  for (const { view, lineNumbers: lineNumbersCompartment } of codeMirrorEditors) {
    view.dispatch({
      effects: lineNumbersCompartment.reconfigure(show ? lineNumbers() : []),
    });
  }
}

function applyCurrentSettings(): void {
  applyLineWrapToAll(readCheckbox(".editor-line-wrap", false));
  applyLineNumbersToAll(readCheckbox(".editor-line-numbers", true));
}

/**
 * Register a CodeMirror 6 EditorView for shared display settings.
 */
export function registerCodeMirrorEditor(editor: RegisteredCodeMirror): () => void {
  codeMirrorEditors.add(editor);
  return () => {
    codeMirrorEditors.delete(editor);
  };
}

export function isLineWrapEnabled(): boolean {
  return lineWrapEnabled;
}

export function isLineNumbersEnabled(): boolean {
  return lineNumbersEnabled;
}

/**
 * Wire footer line-wrap and line-numbering controls and apply initial state.
 */
export function initEditorDisplaySettings(): void {
  applyCurrentSettings();

  document.addEventListener("change", (e) => {
    const target = e.target;
    if (!(target instanceof HTMLInputElement)) return;

    if (target.classList.contains("editor-line-wrap")) {
      applyLineWrapToAll(target.checked);
      return;
    }

    if (target.classList.contains("editor-line-numbers")) {
      applyLineNumbersToAll(target.checked);
    }
  });
}
