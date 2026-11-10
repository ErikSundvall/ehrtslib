/// <reference lib="dom" />
import type { NarrativeCollabView } from "./cb-narrative-collab.ts";

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
  const text = textarea.value;
  const style = getComputedStyle(textarea);
  backdrop.style.padding = style.padding;
  backdrop.style.font = style.font;
  backdrop.style.lineHeight = style.lineHeight;
  const highlights = view.highlights(atMs);
  backdrop.replaceChildren(renderHighlightLayer(text, highlights));
  const carets = view.carets(atMs);
  const metrics = measureLines(textarea, text);
  caretLayer.replaceChildren(
    ...carets.map((c) => caretMarker(c, metrics, textarea)),
  );
}

function renderHighlightLayer(
  text: string,
  highlights: ReturnType<NarrativeCollabView["highlights"]>,
): DocumentFragment {
  const frag = document.createDocumentFragment();
  if (!highlights.length) {
    frag.append(document.createElement("span"));
    return frag;
  }
  const points = new Set<number>([0, text.length]);
  for (const hl of highlights) {
    points.add(hl.start);
    points.add(hl.end);
  }
  const sorted = [...points].sort((a, b) => a - b);
  for (let i = 0; i < sorted.length - 1; i++) {
    const start = sorted[i]!;
    const end = sorted[i + 1]!;
    if (start === end) continue;
    const active = highlights.filter((hl) => hl.start < end && hl.end > start);
    const span = document.createElement("span");
    span.textContent = text.slice(start, end);
    if (active.length) {
      const top = active[active.length - 1]!;
      span.className = "narrative-hl";
      span.style.setProperty("--hl-accent", top.accent);
      span.style.opacity = String(top.opacity);
    }
    frag.append(span);
  }
  return frag;
}

interface LineMetrics {
  lineHeight: number;
  charWidth: number;
  paddingTop: number;
  paddingLeft: number;
}

function measureLines(
  textarea: HTMLTextAreaElement,
  text: string,
): LineMetrics {
  const style = getComputedStyle(textarea);
  const lineHeight = parseFloat(style.lineHeight) ||
    parseFloat(style.fontSize) * 1.5;
  const paddingTop = parseFloat(style.paddingTop);
  const paddingLeft = parseFloat(style.paddingLeft);
  const probe = document.createElement("span");
  probe.textContent = "M";
  probe.style.visibility = "hidden";
  probe.style.position = "absolute";
  probe.style.font = style.font;
  document.body.append(probe);
  const charWidth = probe.getBoundingClientRect().width || 8;
  probe.remove();
  if (!text) {
    return { lineHeight, charWidth, paddingTop, paddingLeft };
  }
  return { lineHeight, charWidth, paddingTop, paddingLeft };
}

function caretMarker(
  caret: ReturnType<NarrativeCollabView["carets"]>[number],
  metrics: LineMetrics,
  textarea: HTMLTextAreaElement,
): HTMLElement {
  const before = textarea.value.slice(0, caret.offset);
  const lines = before.split("\n");
  const line = Math.max(0, lines.length - 1);
  const col = lines[lines.length - 1]?.length ?? 0;
  const el = document.createElement("span");
  el.className = "narrative-remote-caret";
  el.textContent = caret.initials;
  el.style.setProperty("--caret-accent", caret.accent);
  el.style.left = `${metrics.paddingLeft + col * metrics.charWidth}px`;
  el.style.top = `${metrics.paddingTop + line * metrics.lineHeight}px`;
  el.title = `${caret.displayName} is editing here`;
  return el;
}
