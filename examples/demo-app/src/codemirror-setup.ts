/**
 * CodeMirror 6 editors for the demo app.
 * Line numbers and wrapping use native CM6 extensions so gutter rows stay aligned
 * when logical lines wrap.
 */

import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { Compartment, EditorState } from "@codemirror/state";
import {
  EditorView,
  keymap,
  lineNumbers,
  placeholder,
} from "@codemirror/view";
import {
  isLineNumbersEnabled,
  isLineWrapEnabled,
  registerCodeMirrorEditor,
} from "./editor-settings.ts";

const INPUT_EDITOR_IDS = ["input-text", "template-input-text"] as const;
const OUTPUT_EDITOR_IDS = [
  "output-json-content",
  "output-yaml-content",
  "output-markdown-content",
  "output-asciidoc-content",
  "output-typescript-content",
  "output-xml-content",
  "output-flat-content",
  "output-structured-content",
  "output-webtemplate-content",
] as const;

export const DEFAULT_TEMPLATE_INPUT = `operational_template (adl_version=2.0.5)
    openEHR-EHR-COMPOSITION.demo_generated.v1.0.0

language
    original_language = <"ISO_639-1::en">

definition
    COMPOSITION[id1] matches {
        content matches {
            SECTION[id2]
        }
    }

terminology
    term_definitions = <
        ["en"] = <
            ["id1"] = < text = <"Demo composition"> >
            ["id2"] = < text = <"Generated section"> >
        >
    >`;

export interface DemoEditor {
  readonly id: string;
  readonly host: HTMLElement;
  readonly view: EditorView;
  get value(): string;
  set value(text: string);
  onChange(callback: () => void): void;
}

const editors = new Map<string, DemoEditor>();

const demoTheme = EditorView.theme({
  "&": {
    height: "100%",
    fontSize: "0.875rem",
    backgroundColor: "var(--bg-code)",
    color: "var(--text-code)",
  },
  "&.cm-focused": {
    outline: "none",
  },
  ".cm-scroller": {
    overflow: "auto",
    fontFamily: "var(--font-mono)",
    lineHeight: "1.6",
  },
  ".cm-content": {
    padding: "var(--spacing-md)",
    caretColor: "var(--text-code)",
  },
  ".cm-gutters": {
    backgroundColor: "#1e293b",
    color: "var(--text-secondary)",
    border: "none",
    borderRight: "1px solid #334155",
  },
  ".cm-gutters .cm-gutterElement": {
    padding: "0 0.5rem 0 var(--spacing-md)",
    minWidth: "2.5rem",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "transparent",
  },
  ".cm-cursor, .cm-dropCursor": {
    borderLeftColor: "var(--text-code)",
  },
  ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": {
    backgroundColor: "rgba(37, 99, 235, 0.25) !important",
  },
}, { dark: true });

function createEditor(
  host: HTMLElement,
  options: {
    readOnly: boolean;
    initial?: string;
    placeholderText?: string;
  },
): DemoEditor {
  const lineNumbersCompartment = new Compartment();
  const lineWrapCompartment = new Compartment();
  const changeListeners = new Set<() => void>();

  const extensions = [
    history(),
    keymap.of([...defaultKeymap, ...historyKeymap]),
    demoTheme,
    EditorState.readOnly.of(options.readOnly),
    EditorView.editable.of(!options.readOnly),
    lineNumbersCompartment.of(
      isLineNumbersEnabled() ? lineNumbers() : [],
    ),
    lineWrapCompartment.of(
      isLineWrapEnabled() ? EditorView.lineWrapping : [],
    ),
    EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        for (const listener of changeListeners) listener();
      }
    }),
  ];

  if (options.placeholderText) {
    extensions.push(placeholder(options.placeholderText));
  }

  const state = EditorState.create({
    doc: options.initial ?? "",
    extensions,
  });

  const view = new EditorView({ state, parent: host });

  registerCodeMirrorEditor({
    view,
    lineNumbers: lineNumbersCompartment,
    lineWrap: lineWrapCompartment,
  });

  const editor: DemoEditor = {
    id: host.id,
    host,
    view,
    get value() {
      return view.state.doc.toString();
    },
    set value(text: string) {
      const current = view.state.doc.toString();
      if (current === text) return;
      view.dispatch({
        changes: { from: 0, to: current.length, insert: text },
      });
    },
    onChange(callback: () => void) {
      changeListeners.add(callback);
    },
  };

  editors.set(host.id, editor);
  return editor;
}

export function getDemoEditor(id: string): DemoEditor | null {
  return editors.get(id) ?? null;
}

export function initDemoEditors(options?: { instanceInitial?: string }): void {
  for (const id of INPUT_EDITOR_IDS) {
    const host = document.getElementById(id);
    if (!host) continue;

    const initial = id === "template-input-text"
      ? DEFAULT_TEMPLATE_INPUT
      : (options?.instanceInitial ?? "");
    const placeholderText = id === "template-input-text"
      ? "Paste operational template: ADL2/ADL1.4 operational_template, legacy OPT XML (.opt), or OET XML (.oet)..."
      : "Paste your XML, JSON, or YAML here...";

    createEditor(host, {
      readOnly: false,
      initial,
      placeholderText,
    });
  }

  for (const id of OUTPUT_EDITOR_IDS) {
    const host = document.getElementById(id);
    if (!host) continue;
    createEditor(host, { readOnly: true });
  }
}
