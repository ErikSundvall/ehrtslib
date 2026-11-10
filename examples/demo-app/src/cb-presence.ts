/** Ephemeral multi-user presence for the Contribution Builder demo (UI layer only). */
import type { Field } from "./contribution-demo.ts";

export type LivePresenceState = "focused" | "editing";

export interface PresenceConfig {
  /** Drop live focus/edit badges after this idle period (ms). */
  staleMs: number;
  /** Fade and remove “recently edited” badges after this period (ms). */
  recentEditFadeMs: number;
  /** Badges shown before a “+N” overflow chip. */
  maxVisibleBadges: number;
}

export const DEFAULT_PRESENCE_CONFIG: PresenceConfig = {
  staleMs: 12_000,
  recentEditFadeMs: 120_000,
  maxVisibleBadges: 3,
};

export interface RemotePeer {
  userId: string;
  displayName: string;
}

interface LiveRecord {
  peer: RemotePeer;
  field: Field;
  state: LivePresenceState;
  atMs: number;
}

export interface FieldEditRecord {
  peer: RemotePeer;
  field: Field;
  atMs: number;
  from: string;
  to: string;
}

export interface PresenceBadge {
  userId: string;
  displayName: string;
  initials: string;
  accent: string;
  kind: LivePresenceState | "recent-edit";
  opacity: number;
  relative: string;
  absolute: string;
  changeSummary?: string;
}

export interface FieldBadgeView {
  badges: PresenceBadge[];
  overflow: number;
}

/** One clone’s view of other users’ presence (never shows self). */
export class PresenceView {
  readonly #selfId: string;
  readonly #config: PresenceConfig;
  readonly #live = new Map<string, LiveRecord>();
  readonly #edits = new Map<string, FieldEditRecord>();

  constructor(selfId: string, config: PresenceConfig = DEFAULT_PRESENCE_CONFIG) {
    this.#selfId = selfId;
    this.#config = config;
  }

  join(peer: RemotePeer, atMs: number): void {
    if (peer.userId === this.#selfId) return;
    this.#live.set(peer.userId, {
      peer,
      field: "diagnosisName",
      state: "focused",
      atMs,
    });
  }

  heartbeat(
    peer: RemotePeer,
    field: Field | null,
    state: LivePresenceState,
    atMs: number,
  ): void {
    if (peer.userId === this.#selfId) return;
    if (field === null) {
      this.#live.delete(peer.userId);
      return;
    }
    this.#live.set(peer.userId, { peer, field, state, atMs });
  }

  recordEdit(
    peer: RemotePeer,
    field: Field,
    from: string,
    to: string,
    atMs: number,
  ): void {
    if (peer.userId === this.#selfId) return;
    this.#edits.set(`${peer.userId}:${field}`, {
      peer,
      field,
      atMs,
      from,
      to,
    });
    this.#live.set(peer.userId, {
      peer,
      field,
      state: "editing",
      atMs,
    });
  }

  expire(atMs: number): void {
    const { staleMs, recentEditFadeMs } = this.#config;
    for (const [id, live] of this.#live) {
      if (atMs - live.atMs > staleMs) this.#live.delete(id);
    }
    for (const [key, edit] of this.#edits) {
      if (atMs - edit.atMs > recentEditFadeMs) this.#edits.delete(key);
    }
  }

  badgesForField(field: Field, atMs: number): FieldBadgeView {
    this.expire(atMs);
    const { recentEditFadeMs, maxVisibleBadges } = this.#config;
    const ranked: PresenceBadge[] = [];
    const liveOnField = new Set<string>();

    for (const live of this.#live.values()) {
      if (live.field !== field) continue;
      liveOnField.add(live.peer.userId);
      ranked.push(this.#liveBadge(live, atMs));
    }

    for (const edit of this.#edits.values()) {
      if (edit.field !== field) continue;
      if (liveOnField.has(edit.peer.userId)) continue;
      const age = atMs - edit.atMs;
      if (age > recentEditFadeMs) continue;
      ranked.push(this.#recentBadge(edit, atMs, age));
    }

    ranked.sort((a, b) => priority(b.kind) - priority(a.kind) ||
      a.displayName.localeCompare(b.displayName));

    const visible = ranked.slice(0, maxVisibleBadges);
    const overflow = Math.max(0, ranked.length - visible.length);
    return { badges: visible, overflow };
  }

  #liveBadge(live: LiveRecord, atMs: number): PresenceBadge {
    const edit = this.#edits.get(`${live.peer.userId}:${live.field}`);
    return {
      userId: live.peer.userId,
      displayName: live.peer.displayName,
      initials: userInitials(live.peer.displayName),
      accent: userAccentColor(live.peer.userId),
      kind: live.state,
      opacity: 1,
      relative: formatRelative(live.atMs, atMs),
      absolute: formatAbsolute(live.atMs),
      changeSummary: edit ? summarizeChange(edit.from, edit.to) : undefined,
    };
  }

  #recentBadge(edit: FieldEditRecord, atMs: number, age: number): PresenceBadge {
    const fadeStart = this.#config.recentEditFadeMs * 0.75;
    const opacity = age <= fadeStart
      ? 1
      : Math.max(0.35, 1 - (age - fadeStart) / (this.#config.recentEditFadeMs - fadeStart));
    return {
      userId: edit.peer.userId,
      displayName: edit.peer.displayName,
      initials: userInitials(edit.peer.displayName),
      accent: userAccentColor(edit.peer.userId),
      kind: "recent-edit",
      opacity,
      relative: formatRelative(edit.atMs, atMs),
      absolute: formatAbsolute(edit.atMs),
      changeSummary: summarizeChange(edit.from, edit.to),
    };
  }
}

function priority(kind: PresenceBadge["kind"]): number {
  if (kind === "editing") return 3;
  if (kind === "focused") return 2;
  return 1;
}

export function userInitials(name: string): string {
  const parts = name.split(/[.\s_@+-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).toUpperCase();
  }
  const compact = name.replace(/[^a-zA-Z0-9\u00C0-\u024F]/g, "");
  if (compact.length >= 2) return compact.slice(0, 2).toUpperCase();
  return (compact.charAt(0) || "?").toUpperCase();
}

export function userAccentColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
  }
  return `hsl(${hash % 360} 52% 40%)`;
}

export function formatRelative(atMs: number, nowMs: number): string {
  const sec = Math.max(0, Math.round((nowMs - atMs) / 1000));
  if (sec < 5) return "just now";
  if (sec < 60) return `${sec} s ago`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.round(min / 60);
  return `${hr} h ago`;
}

export function formatAbsolute(atMs: number): string {
  return new Date(atMs).toISOString().replace("T", " ").replace(/\.\d{3}Z$/, " UTC");
}

export function summarizeChange(from: string, to: string): string {
  const clip = (s: string) => (s.length > 48 ? `${s.slice(0, 45)}…` : s);
  if (from === to) return clip(to);
  return `${clip(from)} → ${clip(to)}`;
}

export function presenceStateLabel(kind: PresenceBadge["kind"]): string {
  if (kind === "editing") return "Editing";
  if (kind === "focused") return "Focused";
  return "Edited recently";
}

export type PresenceWireMessage =
  | {
    t: "join";
    userId: string;
    name: string;
    atMs: number;
  }
  | {
    t: "heartbeat";
    userId: string;
    name: string;
    field: Field | null;
    state: LivePresenceState;
    atMs: number;
  }
  | {
    t: "edit";
    userId: string;
    name: string;
    field: Field;
    from: string;
    to: string;
    atMs: number;
  };

export function applyWireMessage(view: PresenceView, msg: PresenceWireMessage): void {
  const peer = { userId: msg.userId, displayName: msg.name };
  switch (msg.t) {
    case "join":
      view.join(peer, msg.atMs);
      break;
    case "heartbeat":
      view.heartbeat(peer, msg.field, msg.state, msg.atMs);
      break;
    case "edit":
      view.recordEdit(peer, msg.field, msg.from, msg.to, msg.atMs);
      break;
  }
}
