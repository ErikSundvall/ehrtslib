/** Long-text remote carets and fading edit highlights (demo UI layer). */
import type { LongTextField } from "./contribution-demo.ts";
import { userAccentColor, userInitials } from "./cb-presence.ts";

export interface NarrativeCollabConfig {
  highlightTtlMs: number;
  caretStaleMs: number;
}

export const DEFAULT_NARRATIVE_COLLAB_CONFIG: NarrativeCollabConfig = {
  highlightTtlMs: 45_000,
  caretStaleMs: 8_000,
};

export interface TextCaret {
  userId: string;
  displayName: string;
  /** Automerge stable cursor token (serializable string). */
  cursor: string;
  atMs: number;
}

export interface TextHighlight {
  id: string;
  userId: string;
  displayName: string;
  start: number;
  end: number;
  snippet: string;
  atMs: number;
}

export interface TextHighlightView extends TextHighlight {
  accent: string;
  initials: string;
  opacity: number;
  expired: boolean;
}

export interface TextCaretView extends TextCaret {
  accent: string;
  initials: string;
}

export type NarrativeCollabWireMessage =
  | {
    t: "caret";
    userId: string;
    name: string;
    field: LongTextField;
    cursor: string;
    atMs: number;
  }
  | {
    t: "text-hl";
    userId: string;
    name: string;
    field: LongTextField;
    start: number;
    end: number;
    snippet: string;
    atMs: number;
  };

export function diffRange(
  before: string,
  after: string,
): { start: number; end: number } {
  let start = 0;
  while (
    start < before.length && start < after.length &&
    before[start] === after[start]
  ) {
    start++;
  }
  let tail = 0;
  while (
    tail < before.length - start && tail < after.length - start &&
    before[before.length - 1 - tail] === after[after.length - 1 - tail]
  ) {
    tail++;
  }
  return { start, end: after.length - tail };
}

export function highlightOpacity(
  ageMs: number,
  ttlMs: number,
): number {
  if (ageMs <= 0) return 0.72;
  if (ageMs >= ttlMs) return 0;
  const fadeStart = ttlMs * 0.35;
  if (ageMs <= fadeStart) return 0.72;
  return Math.max(0, 0.72 * (1 - (ageMs - fadeStart) / (ttlMs - fadeStart)));
}

/** Per-clone view of other users’ narrative carets and highlights. */
export class NarrativeCollabView {
  readonly #selfId: string;
  readonly #config: NarrativeCollabConfig;
  readonly #carets = new Map<string, TextCaret>();
  readonly #highlights = new Map<string, TextHighlight>();

  constructor(
    selfId: string,
    config: NarrativeCollabConfig = DEFAULT_NARRATIVE_COLLAB_CONFIG,
  ) {
    this.#selfId = selfId;
    this.#config = config;
  }

  apply(msg: NarrativeCollabWireMessage): void {
    if (msg.userId === this.#selfId) return;
    if (msg.t === "caret") {
      if (!msg.cursor) return;
      const key = `${msg.userId}:${msg.field}`;
      const prev = this.#carets.get(key);
      if (prev && msg.atMs < prev.atMs) return;
      this.#carets.set(key, {
        userId: msg.userId,
        displayName: msg.name,
        cursor: msg.cursor,
        atMs: msg.atMs,
      });
      return;
    }
    const id = `${msg.field}:${msg.userId}:${msg.start}:${msg.end}:${msg.atMs}`;
    this.#highlights.set(id, {
      id,
      userId: msg.userId,
      displayName: msg.name,
      start: msg.start,
      end: Math.max(msg.start, msg.end),
      snippet: msg.snippet,
      atMs: msg.atMs,
    });
  }

  expire(atMs: number): void {
    const { caretStaleMs, highlightTtlMs } = this.#config;
    for (const [id, caret] of this.#carets) {
      if (atMs - caret.atMs > caretStaleMs) this.#carets.delete(id);
    }
    for (const [id, hl] of this.#highlights) {
      if (atMs - hl.atMs > highlightTtlMs) this.#highlights.delete(id);
    }
  }

  carets(atMs: number): TextCaretView[] {
    this.expire(atMs);
    return [...this.#carets.values()]
      .sort((a, b) => a.atMs - b.atMs)
      .map((c) => ({
        ...c,
        initials: userInitials(c.displayName),
        accent: userAccentColor(c.userId),
      }));
  }

  highlights(atMs: number): TextHighlightView[] {
    this.expire(atMs);
    const { highlightTtlMs } = this.#config;
    return [...this.#highlights.values()]
      .map((hl) => {
        const age = atMs - hl.atMs;
        const opacity = highlightOpacity(age, highlightTtlMs);
        return {
          ...hl,
          initials: userInitials(hl.displayName),
          accent: userAccentColor(hl.userId),
          opacity,
          expired: opacity <= 0,
        };
      })
      .filter((hl) => !hl.expired)
      .sort((a, b) => a.start - b.start);
  }
}
