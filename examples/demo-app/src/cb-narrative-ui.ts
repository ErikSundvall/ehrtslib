/// <reference lib="dom" />
import type { NarrativeCollabView } from "./cb-narrative-collab.ts";
import {
  caretLogicalLineRange,
  caretOffsetToCoords,
  resolveHighlightRange,
} from "./cb-narrative-layout.ts";
import type { TextCaretView } from "./cb-narrative-collab.ts";

const mirrorByTextarea = new WeakMap<HTMLTextAreaElement, HTMLDivElement>();

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

export type NarrativeHighlightPaint = {
  start: number;
  end: number;
  snippet: string;
  accent: string;
  opacity: number;
};

export type NarrativeCaretOffsetResolver = (
  caret: TextCaretView,
) => number | null;

export function paintNarrativeHighlights(
  textarea: HTMLTextAreaElement,
  text: string,
  highlights: NarrativeHighlightPaint[],
  carets: ReturnType<NarrativeCollabView["carets"]> = [],
  resolveCaretOffset: NarrativeCaretOffsetResolver = () => null,
): void {
  const { backdrop, caretLayer } = ensureNarrativeShell(textarea);
  syncMirrorGeometry(textarea, backdrop);
  const views = highlights.map((hl, i) => ({
    ...hl,
    id: `paint-${i}`,
    userId: "",
    displayName: "",
    atMs: 0,
    initials: "",
    expired: false,
  }));
  backdrop.replaceChildren(renderHighlightLayer(text, views));
  syncCaretLayerScroll(textarea, caretLayer);
  const caretViews = carets.map((c) =>
    caretMarker(c, textarea, caretLayer, resolveCaretOffset)
  ).filter(Boolean);
  caretLayer.replaceChildren(...caretViews);
}

function syncCaretLayerScroll(
  textarea: HTMLTextAreaElement,
  caretLayer: HTMLElement,
): void {
  caretLayer.scrollTop = textarea.scrollTop;
  caretLayer.scrollLeft = textarea.scrollLeft;
}

export function paintNarrativeCollab(
  textarea: HTMLTextAreaElement,
  view: NarrativeCollabView,
  atMs: number,
  resolveCaretOffset: NarrativeCaretOffsetResolver,
): void {
  const text = textarea.value;
  paintNarrativeHighlights(
    textarea,
    text,
    view.highlights(atMs),
    view.carets(atMs),
    resolveCaretOffset,
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
    const range = resolveHighlightRange(text, hl.start, hl.snippet, hl.end);
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
      span.style.opacity = String(Math.max(0.45, top.opacity));
    }
    frag.append(span);
  }
  return frag;
}

function layoutMirror(
  textarea: HTMLTextAreaElement,
  caretLayer: HTMLElement,
): HTMLDivElement {
  let mirror = mirrorByTextarea.get(textarea);
  if (!mirror) {
    mirror = document.createElement("div");
    mirror.className = "narrative-layout-mirror";
    mirror.setAttribute("aria-hidden", "true");
    mirrorByTextarea.set(textarea, mirror);
    caretLayer.append(mirror);
  } else if (mirror.parentElement !== caretLayer) {
    caretLayer.append(mirror);
  }
  const style = getComputedStyle(textarea);
  mirror.style.boxSizing = style.boxSizing;
  mirror.style.padding = style.padding;
  mirror.style.border = style.border;
  mirror.style.borderRadius = style.borderRadius;
  mirror.style.font = style.font;
  mirror.style.lineHeight = style.lineHeight;
  mirror.style.letterSpacing = style.letterSpacing;
  mirror.style.whiteSpace = "pre-wrap";
  mirror.style.wordWrap = "break-word";
  mirror.style.overflowWrap = "break-word";
  mirror.style.overflow = "visible";
  mirror.style.height = "auto";
  mirror.style.minHeight = "100%";
  mirror.scrollTop = 0;
  mirror.scrollLeft = 0;
  return mirror;
}

export function mirrorCaretCoords(
  textarea: HTMLTextAreaElement,
  offset: number,
  caretLayer?: HTMLElement,
): { left: number; top: number } {
  const text = textarea.value;
  const layer = caretLayer ??
    textarea.closest<HTMLElement>(".narrative-carets");
  if (!layer) {
    return caretOffsetToCoords(textarea, text, offset);
  }
  const mirror = layoutMirror(textarea, layer);
  const at = Math.max(0, Math.min(offset, text.length));
  const probe = document.createElement("span");
  probe.className = "narrative-caret-probe";
  probe.append(document.createTextNode("\u200b"));
  mirror.replaceChildren(
    document.createTextNode(text.slice(0, at)),
    probe,
    document.createTextNode(text.slice(at)),
  );
  if (probe.offsetParent === mirror || mirror.contains(probe)) {
    return { left: probe.offsetLeft, top: probe.offsetTop };
  }
  const layerRect = layer.getBoundingClientRect();
  const probeRect = probe.getBoundingClientRect();
  if (probeRect.width || probeRect.height) {
    return {
      left: probeRect.left - layerRect.left + layer.scrollLeft,
      top: probeRect.top - layerRect.top + layer.scrollTop,
    };
  }
  return caretOffsetToCoords(textarea, text, at);
}

/** Vertical band (px in caret layer) for the logical line holding `at`. */
export function verticalLineBand(
  textarea: HTMLTextAreaElement,
  text: string,
  at: number,
  caretLayer: HTMLElement,
): { lineTop: number; lineBottom: number; caretTop: number } {
  const { start, end } = caretLogicalLineRange(text, at);
  const lineHeight = parseFloat(getComputedStyle(textarea).lineHeight) ||
    parseFloat(getComputedStyle(textarea).fontSize) * 1.2 || 16;
  const lineTop = mirrorCaretCoords(textarea, start, caretLayer).top;
  const lineTail = mirrorCaretCoords(
    textarea,
    Math.max(start, end - 1),
    caretLayer,
  ).top;
  const caretTop = mirrorCaretCoords(textarea, at, caretLayer).top;
  const lineBottom = Math.max(lineTop, lineTail, caretTop) + lineHeight;
  return { lineTop, lineBottom, caretTop };
}

function caretMarker(
  caret: TextCaretView,
  textarea: HTMLTextAreaElement,
  caretLayer: HTMLElement,
  resolveCaretOffset: NarrativeCaretOffsetResolver,
): HTMLElement | null {
  const at = resolveCaretOffset(caret);
  if (at === null) return null;
  const { left, top } = mirrorCaretCoords(textarea, at, caretLayer);
  const el = document.createElement("span");
  el.className = "narrative-remote-caret";
  el.style.setProperty("--caret-accent", caret.accent);
  el.style.left = `${left}px`;
  el.style.top = `${top}px`;
  const stem = document.createElement("span");
  stem.className = "narrative-remote-caret__stem";
  const tag = document.createElement("span");
  tag.className = "narrative-remote-caret__tag";
  tag.textContent = caret.initials;
  el.append(stem, tag);
  el.title = `${caret.displayName} is editing here`;
  el.dataset.resolvedCaret = String(at);
  return el;
}
