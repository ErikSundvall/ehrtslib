/**
 * Hydrate OPT HTML5 markup into an editable clinical form.
 *
 * Modes:
 * - `all` — every `data-opt-field` becomes an editor immediately
 * - `focus` — display stays compact until the field is focused (click / touch / tab);
 *   transitions use max-height + opacity to avoid layout jump / motion sickness
 */

/// <reference lib="dom" />

export type OptHydrateMode = "all" | "focus" | "off";

export type OptHydrateOptions = {
  mode: OptHydrateMode;
  /** Root element containing OPT HTML5 (`a-*` tree). */
  root: ParentNode;
  /** Called when a field value changes (for future contribution builder). */
  onChange?: (detail: {
    field: Element;
    value: string;
    code?: string;
  }) => void;
};

const STYLE_ID = "opt-html5-hydrate-style";

function ensureStyles(): void {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
.opt-hydrated [data-opt-field] {
  position: relative;
  transition: max-height 220ms ease, padding 220ms ease, background-color 180ms ease,
    box-shadow 180ms ease, opacity 180ms ease;
  max-height: 3.2rem;
  overflow: hidden;
}
.opt-hydrated[data-opt-mode="focus"] [data-opt-field]:not(.opt-field-active) .opt-editor {
  opacity: 0;
  pointer-events: none;
  max-height: 0;
  margin: 0;
  padding: 0;
  border: 0;
}
.opt-hydrated[data-opt-mode="focus"] [data-opt-field].opt-field-active {
  max-height: 24rem;
  overflow: visible;
  background: color-mix(in srgb, Canvas 88%, Highlight 12%);
  box-shadow: 0 0 0 1px color-mix(in srgb, Highlight 35%, transparent);
  border-radius: 0.35rem;
  padding: 0.35rem 0.45rem;
}
.opt-hydrated [data-opt-field] .opt-editor {
  display: block;
  width: 100%;
  margin-top: 0.35rem;
  transition: opacity 200ms ease, max-height 220ms ease, margin 220ms ease;
  max-height: 16rem;
  opacity: 1;
  font: inherit;
  line-height: 1.4;
  box-sizing: border-box;
}
.opt-hydrated [data-opt-field] select.opt-editor,
.opt-hydrated [data-opt-field] input.opt-editor,
.opt-hydrated [data-opt-field] textarea.opt-editor {
  border: 1px solid #9aa8b8;
  border-radius: 0.3rem;
  padding: 0.35rem 0.5rem;
  background: Canvas;
  color: CanvasText;
}
.opt-hydrated [data-opt-optional]::before {
  content: "(optional) ";
  font-size: 0.75em;
  opacity: 0.65;
}
.opt-hydrated [data-opt-choices] > [data-opt-field],
.opt-hydrated [data-opt-choices] > :is([rt], [rm-type-name], [🅁]) {
  /* alternatives: leave visual grouping to CSS sheet */
}
.opt-display-label {
  font-weight: 600;
}
`;
  document.head.appendChild(style);
}

function choiceElements(field: Element): Element[] {
  return [...field.querySelectorAll(":scope > ch")];
}

function buildEditor(field: Element): HTMLElement {
  const choices = choiceElements(field);
  if (choices.length > 0) {
    const select = document.createElement("select");
    select.className = "opt-editor";
    select.setAttribute("aria-label", "Choose value");
    const empty = document.createElement("option");
    empty.value = "";
    empty.textContent = field.hasAttribute("data-opt-optional")
      ? "— optional —"
      : "— select —";
    select.appendChild(empty);
    for (const ch of choices) {
      const opt = document.createElement("option");
      const dc = ch.getAttribute("dc") ??
        ch.getAttribute("defining-code") ??
        ch.getAttribute("🏷️") ??
        "";
      opt.value = dc || (ch.textContent?.trim() ?? "");
      opt.textContent = ch.textContent?.trim() || dc;
      select.appendChild(opt);
    }
    return select;
  }

  // Heuristic: quantity-like → number; otherwise text
  const tag = (field.localName ?? "").toLowerCase();
  const looksNumeric = /🌡️|🔢|q\b|count|quantity|integer|real|◆🌡️|◆🔢/i
    .test(tag) ||
    field.getAttribute("rt")?.includes("QUANTITY") ||
    field.getAttribute("rm-type-name")?.includes("QUANTITY");

  if (looksNumeric) {
    const input = document.createElement("input");
    input.type = "number";
    input.className = "opt-editor";
    input.setAttribute("aria-label", "Enter magnitude");
    return input;
  }

  const input = document.createElement("input");
  input.type = "text";
  input.className = "opt-editor";
  input.setAttribute("aria-label", "Enter value");
  return input;
}

function fieldsOf(root: ParentNode): Element[] {
  return [...root.querySelectorAll("[data-opt-field]")];
}

function deactivateAll(root: ParentNode): void {
  for (const f of fieldsOf(root)) f.classList.remove("opt-field-active");
}

/**
 * Activate hydration on an OPT HTML5 tree. Idempotent for a given root.
 * Pass `mode: "off"` to tear down editors.
 */
export function hydrateOptHtml5(options: OptHydrateOptions): () => void {
  const { root, mode, onChange } = options;
  const host = root instanceof Element ? root : (root as Document).body;
  if (!host) return () => {};

  ensureStyles();
  teardown(host);

  if (mode === "off") return () => {};

  host.classList.add("opt-hydrated");
  host.setAttribute("data-opt-mode", mode);

  const cleanups: Array<() => void> = [];

  for (const field of fieldsOf(host)) {
    if (field.querySelector(":scope > .opt-editor")) continue;
    const editor = buildEditor(field);
    field.appendChild(editor);

    const onInput = () => {
      const value = "value" in editor
        ? String((editor as HTMLInputElement | HTMLSelectElement).value)
        : "";
      const code = editor instanceof HTMLSelectElement
        ? editor.value
        : undefined;
      onChange?.({ field, value, code });
    };
    editor.addEventListener("input", onInput);
    editor.addEventListener("change", onInput);
    cleanups.push(() => {
      editor.removeEventListener("input", onInput);
      editor.removeEventListener("change", onInput);
    });

    if (mode === "focus") {
      const activate = () => {
        deactivateAll(host);
        field.classList.add("opt-field-active");
        // Defer focus so max-height transition can start first
        requestAnimationFrame(() => {
          (editor as HTMLElement).focus({ preventScroll: true });
        });
      };
      const fieldEl = field as HTMLElement;
      fieldEl.tabIndex = 0;
      fieldEl.addEventListener("click", activate);
      fieldEl.addEventListener("focusin", activate);
      cleanups.push(() => {
        fieldEl.removeEventListener("click", activate);
        fieldEl.removeEventListener("focusin", activate);
        fieldEl.removeAttribute("tabindex");
      });
    } else {
      field.classList.add("opt-field-active");
    }
  }

  // Click outside collapses focus mode
  if (mode === "focus") {
    const onDoc = (ev: Event) => {
      const t = ev.target as Node | null;
      if (t && host.contains(t)) {
        const field = (t as Element).closest?.("[data-opt-field]");
        if (field && host.contains(field)) return;
      }
      deactivateAll(host);
    };
    document.addEventListener("pointerdown", onDoc, true);
    cleanups.push(() => document.removeEventListener("pointerdown", onDoc, true));
  }

  return () => {
    for (const c of cleanups) c();
    teardown(host);
  };
}

function teardown(host: Element): void {
  host.classList.remove("opt-hydrated");
  host.removeAttribute("data-opt-mode");
  for (const field of fieldsOf(host)) {
    field.classList.remove("opt-field-active");
    field.removeAttribute("tabindex");
    for (const ed of field.querySelectorAll(":scope > .opt-editor")) {
      ed.remove();
    }
  }
}

/**
 * Inject hydrate controls + script into a standalone preview HTML document string.
 */
export function wrapOptHtml5PreviewDocument(
  markup: string,
  css: string,
  options?: { hydrateMode?: OptHydrateMode },
): string {
  const mode = options?.hydrateMode ?? "off";
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>OPT HTML5 preview</title>
<style>
${css}
</style>
</head>
<body>
<div class="opt-preview-toolbar" style="font:14px system-ui;margin:0 0 1rem;display:flex;gap:.5rem;align-items:center;flex-wrap:wrap">
  <strong>Hydrate</strong>
  <label><input type="radio" name="opt-hydrate" value="off" ${mode === "off" ? "checked" : ""}> Off</label>
  <label><input type="radio" name="opt-hydrate" value="all" ${mode === "all" ? "checked" : ""}> All fields</label>
  <label><input type="radio" name="opt-hydrate" value="focus" ${mode === "focus" ? "checked" : ""}> Focus only</label>
</div>
${markup}
<script type="module">
${INLINE_HYDRATE_BOOTSTRAP}
</script>
</body>
</html>`;
}

/** Minimal inline bootstrap so preview iframes work without bundling. */
const INLINE_HYDRATE_BOOTSTRAP = `
const STYLE_ID = "opt-html5-hydrate-style";
function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = \`.opt-hydrated [data-opt-field]{position:relative;transition:max-height 220ms ease,padding 220ms ease,background-color 180ms ease,box-shadow 180ms ease,opacity 180ms ease;max-height:3.2rem;overflow:hidden}
.opt-hydrated[data-opt-mode="focus"] [data-opt-field]:not(.opt-field-active) .opt-editor{opacity:0;pointer-events:none;max-height:0;margin:0;padding:0;border:0}
.opt-hydrated[data-opt-mode="focus"] [data-opt-field].opt-field-active{max-height:24rem;overflow:visible;background:color-mix(in srgb, Canvas 88%, Highlight 12%);box-shadow:0 0 0 1px color-mix(in srgb, Highlight 35%, transparent);border-radius:.35rem;padding:.35rem .45rem}
.opt-hydrated [data-opt-field] .opt-editor{display:block;width:100%;margin-top:.35rem;transition:opacity 200ms ease,max-height 220ms ease;max-height:16rem;opacity:1;font:inherit;box-sizing:border-box}
.opt-hydrated [data-opt-field] select.opt-editor,.opt-hydrated [data-opt-field] input.opt-editor{border:1px solid #9aa8b8;border-radius:.3rem;padding:.35rem .5rem;background:Canvas;color:CanvasText}
.opt-hydrated [data-opt-optional]::before{content:"(optional) ";font-size:.75em;opacity:.65}\`;
  document.head.appendChild(style);
}
let dispose = () => {};
function buildEditor(field) {
  const choices = [...field.querySelectorAll(":scope > ch")];
  if (choices.length) {
    const select = document.createElement("select");
    select.className = "opt-editor";
    const empty = document.createElement("option");
    empty.value = "";
    empty.textContent = field.hasAttribute("data-opt-optional") ? "— optional —" : "— select —";
    select.appendChild(empty);
    for (const ch of choices) {
      const opt = document.createElement("option");
      const dc = ch.getAttribute("dc") || ch.getAttribute("defining-code") || ch.getAttribute("🏷️") || "";
      opt.value = dc || (ch.textContent || "").trim();
      opt.textContent = (ch.textContent || "").trim() || dc;
      select.appendChild(opt);
    }
    return select;
  }
  const input = document.createElement("input");
  input.type = "text";
  input.className = "opt-editor";
  return input;
}
function hydrate(mode) {
  dispose();
  const host = document.body;
  host.classList.remove("opt-hydrated");
  host.removeAttribute("data-opt-mode");
  for (const field of host.querySelectorAll("[data-opt-field]")) {
    field.classList.remove("opt-field-active");
    field.removeAttribute("tabindex");
    field.querySelectorAll(":scope > .opt-editor").forEach((e) => e.remove());
  }
  if (mode === "off") { dispose = () => {}; return; }
  ensureStyles();
  host.classList.add("opt-hydrated");
  host.setAttribute("data-opt-mode", mode);
  const cleanups = [];
  for (const field of host.querySelectorAll("[data-opt-field]")) {
    const editor = buildEditor(field);
    field.appendChild(editor);
    if (mode === "focus") {
      const activate = () => {
        host.querySelectorAll("[data-opt-field]").forEach((f) => f.classList.remove("opt-field-active"));
        field.classList.add("opt-field-active");
        requestAnimationFrame(() => editor.focus({ preventScroll: true }));
      };
      field.tabIndex = 0;
      field.addEventListener("click", activate);
      field.addEventListener("focusin", activate);
      cleanups.push(() => { field.removeEventListener("click", activate); field.removeEventListener("focusin", activate); });
    } else {
      field.classList.add("opt-field-active");
    }
  }
  if (mode === "focus") {
    const onDoc = (ev) => {
      const t = ev.target;
      if (t && host.contains(t) && t.closest && t.closest("[data-opt-field]")) return;
      host.querySelectorAll("[data-opt-field]").forEach((f) => f.classList.remove("opt-field-active"));
    };
    document.addEventListener("pointerdown", onDoc, true);
    cleanups.push(() => document.removeEventListener("pointerdown", onDoc, true));
  }
  dispose = () => { cleanups.forEach((c) => c()); };
}
document.querySelectorAll('input[name="opt-hydrate"]').forEach((r) => {
  r.addEventListener("change", () => hydrate(r.value));
});
hydrate(document.querySelector('input[name="opt-hydrate"]:checked')?.value || "off");
`;
