/// <reference lib="dom" />
import type { NarrativeCollabView } from "./cb-narrative-collab.ts";
import {
  clampCaretOffset,
  escapeMirrorText,
  resolveHighlightRange,
} from "./cb-narrative-layout.ts";

const mirrorByTextarea = new WeakMap<
  HTMLTextAreaElement,
  HTMLDivElement
>();

export function ensureNarrativeShell(textarea: HTMLTextAreaElement): {
  shell: HTMLElement;
  backdrop: HTMLElement;
  caretLayer: HTMLElement;
} {
  const existing = textarea.closest(".narrative-shell");
  if (existing) {
    return {
      shell: existing as HTMLElement,
      backdrop: existing.querySelector(".narrative-backdrop")!,
      caretLayer: existing.querySelector(".narrative-carets")!,
    };
  }
  const shell = document.createElement("div");
  shell.className = "narrative-shell";
  const backdrop = document.createElement("div");
  backdrop.className = "narrative-backdrop";
  backdrop.setAttribute("aria-hidden", "true");
  const caretLayer = document.createElement("div");
  caretLayer.className = "narrative-carets";
  caretLayer.setAttribute("aria-hidden", "true");
  textarea.parentElement?.insertBefore(shell, textarea);
  shell.append(backdrop, caretLayer, textarea);
  textarea.classList.add("narrative-input");
  return { shell, backdrop, caretLayer };
}

export function paintNarrativeCollab(
  textarea: HTMLTextAreaElement,
  view: NarrativeCollabView,
  atMs: number,
): void {
  const { backdrop, caretLayer } = ensureNarrativeShell(textarea);
  syncMirrorGeometry(textarea, backdrop);
  const text = textarea.value;
  const highlights = view.highlights(atMs);
  backdrop.replaceChildren(renderHighlightLayer(text, highlights));
  const carets = view.carets(atMs);
  caretLayer.replaceChildren(
    ...carets.map((c) => caretMarker(c, textarea)),
  );
}

function syncMirrorGeometry(
  textarea: HTMLTextAreaElement,
  backdrop: HTMLElement,
): void {
  const style = getComputedStyle(textarea);
  backdrop.style.boxSizing = style.boxSizing;
  backdrop.style.padding = style.padding;
  backdrop.style.font = style.font;
  backdrop.style.lineHeight = style.lineHeight;
  backdrop.style.letterSpacing = style.letterSpacing;
  backdrop.style.width = `${textarea.clientWidth}px`;
  backdrop.style.height = `${textarea.clientHeight}px`;
  backdrop.scrollTop = textarea.scrollTop;
}

function renderHighlightLayer(
  text: string,
  highlights: ReturnType<NarrativeCollabView["highlights"]>,
): DocumentFragment {
  const frag = document.createDocumentFragment();
  const resolved = highlights.map((hl) => {
    const range = resolveHighlightRange(text, hl.start, hl.snippet);
    return range ? { ...hl, start: range.start, end: range.end } : null;
  }).filter(Boolean) as Array<
    ReturnType<NarrativeCollabView["highlights"]>[number]
  >;
  if (!resolved.length) {
    frag.append(document.createTextNode(text));
    return frag;
  }
  const points = new Set<number>([0, text.length]);
  for (const hl of resolved) {
    points.add(hl.start);
    points.add(hl.end);
  }
  const sorted = [...points].sort((a, b) => a - b);
  for (let i = 0; i < sorted.length - 1; i++) {
    const start = sorted[i]!;
    const end = sorted[i + 1]!;
    if (start === end) continue;
    const active = resolved.filter((hl) => hl.start < end && hl.end > start);
    const span = document.createElement("span");
    span.textContent = text.slice(start, end);
    if (active.length) {
      const top = active[active.length - 1]!;
      span.className = "narrative-hl";
      span.style.setProperty("--hl-accent", top.accent);
      span.style.opacity = String(Math.max(0.25, top.opacity));
    }
    frag.append(span);
  }
  return frag;
}

function layoutMirror(textarea: HTMLTextAreaElement): HTMLDivElement {
  let mirror = mirrorByTextarea.get(textarea);
  if (!mirror) {
    mirror = document.createElement("div");
    mirror.className = "narrative-layout-mirror";
    mirror.setAttribute("aria-hidden", "true");
    mirrorByTextarea.set(textarea, mirror);
    textarea.parentElement?.append(mirror);
  }
  const style = getComputedStyle(textarea);
  mirror.style.boxSizing = style.boxSizing;
  mirror.style.padding = style.padding;
  mirror.style.border = style.border;
  mirror.style.font = style.font;
  mirror.style.lineHeight = style.lineHeight;
  mirror.style.letterSpacing = style.letterSpacing;
  mirror.style.whiteSpace = "pre-wrap";
  mirror.style.wordWrap = "break-word";
  mirror.style.overflowWrap = "break-word";
  mirror.style.width = `${textarea.clientWidth}px`;
  mirror.style.height = `${textarea.clientHeight}px`;
  mirror.scrollTop = textarea.scrollTop;
  return mirror;
}

export function mirrorCaretCoords(
  textarea: HTMLTextAreaElement,
  offset: number,
): { left: number; top: number } {
  const mirror = layoutMirror(textarea);
  const text = textarea.value;
  const at = clampCaretOffset(text, offset);
  const before = escapeMirrorText(text.slice(0, at));
  const after = escapeMirrorText(text.slice(at));
  mirror.innerHTML =
    `${before}<span class="narrative-caret-probe">\u200b</span>${after}`;
  const probe = mirror.querySelector(".narrative-caret-probe")!;
  const mirrorRect = mirror.getBoundingClientRect();
  const probeRect = probe.getBoundingClientRect();
  return {
    left: probeRect.left - mirrorRect.left,
    top: probeRect.top - mirrorRect.top,
  };
}

function caretMarker(
  caret: ReturnType<NarrativeCollabView["carets"]>[number],
  textarea: HTMLTextAreaElement,
): HTMLElement {
  const at = clampCaretOffset(textarea.value, caret.offset);
  const { left, top } = mirrorCaretCoords(textarea, at);
  const el = document.createElement("span");
  el.className = "narrative-remote-caret";
  el.textContent = caret.initials;
  el.style.setProperty("--caret-accent", caret.accent);
  el.style.left = `${left}px`;
  el.style.top = `${top}px`;
  el.title = `${caret.displayName} is editing here`;
  return el;
}
