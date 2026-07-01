/**
 * CodeMirror 6 editors for the demo app.
 * Line numbers and wrapping use native CM6 extensions so gutter rows stay aligned
 * when logical lines wrap.
 */

import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { javascript } from "@codemirror/lang-javascript";
import { json } from "@codemirror/lang-json";
import { xml } from "@codemirror/lang-xml";
import { yaml } from "@codemirror/lang-yaml";
import {
  bracketMatching,
  codeFolding,
  foldGutter,
  foldKeymap,
  HighlightStyle,
  indentOnInput,
  syntaxHighlighting,
} from "@codemirror/language";
import { tags } from "@lezer/highlight";
import {
  Compartment,
  type Extension,
  EditorState,
} from "@codemirror/state";
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

const OUTPUT_EDITOR_LANGUAGES: Partial<Record<
  (typeof OUTPUT_EDITOR_IDS)[number],
  DemoLanguage
>> = {
  "output-json-content": "json",
  "output-yaml-content": "yaml",
  "output-typescript-content": "typescript",
  "output-xml-content": "xml",
  "output-flat-content": "json",
  "output-structured-content": "json",
  "output-webtemplate-content": "json",
};

export type DemoLanguage = "json" | "xml" | "yaml" | "typescript" | "plain";

/** High-contrast palette for dark editor background; avoids red and dark blue. */
const demoHighlightStyle = HighlightStyle.define([
  { tag: tags.keyword, color: "#c792ea" },
  { tag: tags.controlKeyword, color: "#c792ea" },
  { tag: tags.definitionKeyword, color: "#c792ea" },
  { tag: tags.moduleKeyword, color: "#c792ea" },
  { tag: tags.operatorKeyword, color: "#c792ea" },
  { tag: tags.self, color: "#c792ea" },
  { tag: tags.string, color: "#a5d6a7" },
  { tag: tags.special(tags.string), color: "#a5d6a7" },
  { tag: tags.number, color: "#f9ae58" },
  { tag: tags.bool, color: "#4dd0e1" },
  { tag: tags.null, color: "#90a4ae" },
  { tag: tags.propertyName, color: "#80cbc4" },
  { tag: tags.attributeName, color: "#80cbc4" },
  { tag: tags.attributeValue, color: "#a5d6a7" },
  { tag: tags.tagName, color: "#4db6ac" },
  { tag: tags.comment, color: "#78909c", fontStyle: "italic" },
  { tag: tags.meta, color: "#b39ddb" },
  { tag: tags.name, color: "#e8eaed" },
  { tag: tags.typeName, color: "#ce93d8" },
  { tag: tags.className, color: "#ce93d8" },
  { tag: tags.namespace, color: "#ce93d8" },
  { tag: tags.variableName, color: "#e8eaed" },
  { tag: tags.function(tags.variableName), color: "#4dd0e1" },
  { tag: tags.definition(tags.variableName), color: "#4dd0e1" },
  { tag: tags.operator, color: "#b0bec5" },
  { tag: tags.punctuation, color: "#b0bec5" },
  { tag: tags.bracket, color: "#b0bec5" },
  { tag: tags.squareBracket, color: "#b0bec5" },
  { tag: tags.paren, color: "#b0bec5" },
  { tag: tags.brace, color: "#b0bec5" },
  { tag: tags.content, color: "#e8eaed" },
  { tag: tags.heading, color: "#ffb74d" },
  { tag: tags.emphasis, fontStyle: "italic" },
  { tag: tags.strong, fontWeight: "bold" },
  { tag: tags.link, color: "#4dd0e1", textDecoration: "underline" },
  { tag: tags.url, color: "#4dd0e1" },
  { tag: tags.literal, color: "#a5d6a7" },
  { tag: tags.regexp, color: "#ffb74d" },
  { tag: tags.processingInstruction, color: "#b39ddb" },
  { tag: tags.labelName, color: "#80cbc4" },
]);

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
  setLanguage(language: DemoLanguage): void;
}

const editors = new Map<string, DemoEditor>();

const foldingExtensions: Extension[] = [
  codeFolding(),
  foldGutter(),
  bracketMatching(),
  indentOnInput(),
  syntaxHighlighting(demoHighlightStyle),
];

function languageExtension(language: DemoLanguage): Extension {
  switch (language) {
    case "json":
      return json();
    case "xml":
      return xml();
    case "yaml":
      return yaml();
    case "typescript":
      return javascript({ typescript: true });
    default:
      return [];
  }
}

const demoTheme = EditorView.theme({
  "&": {
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
  "&.cm-lineWrapping .cm-scroller": {
    overflowX: "hidden",
  },
  "&.cm-lineWrapping .cm-content": {
    wordBreak: "break-word",
    overflowWrap: "anywhere",
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
  ".cm-foldGutter .cm-gutterElement": {
    minWidth: "1.25rem",
    padding: "0 0.25rem",
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
    language?: DemoLanguage;
  },
): DemoEditor {
  const lineNumbersCompartment = new Compartment();
  const lineWrapCompartment = new Compartment();
  const languageCompartment = new Compartment();
  const changeListeners = new Set<() => void>();

  const extensions = [
    history(),
    keymap.of([...defaultKeymap, ...historyKeymap, ...foldKeymap]),
    demoTheme,
    ...foldingExtensions,
    EditorState.readOnly.of(options.readOnly),
    EditorView.editable.of(!options.readOnly),
    lineNumbersCompartment.of(
      isLineNumbersEnabled() ? lineNumbers() : [],
    ),
    lineWrapCompartment.of(
      isLineWrapEnabled() ? EditorView.lineWrapping : [],
    ),
    languageCompartment.of(
      languageExtension(options.language ?? "plain"),
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
    setLanguage(language: DemoLanguage) {
      view.dispatch({
        effects: languageCompartment.reconfigure(languageExtension(language)),
      });
    },
  };

  editors.set(host.id, editor);
  return editor;
}

export function getDemoEditor(id: string): DemoEditor | null {
  return editors.get(id) ?? null;
}

export function setDemoEditorLanguage(
  id: string,
  language: DemoLanguage,
): void {
  editors.get(id)?.setLanguage(language);
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
      language: id === "input-text" ? "json" : "plain",
    });
  }

  for (const id of OUTPUT_EDITOR_IDS) {
    const host = document.getElementById(id);
    if (!host) continue;
    createEditor(host, {
      readOnly: true,
      language: OUTPUT_EDITOR_LANGUAGES[id] ?? "plain",
    });
  }
}
