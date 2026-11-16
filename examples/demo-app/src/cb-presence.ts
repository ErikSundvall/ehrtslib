/** Ephemeral multi-user presence for the Contribution Builder demo (UI layer only). */
import type { Field } from "./contribution-demo.ts";
import {
  presenceChipForeground,
  userAccentColor,
} from "./cb-user-colors.ts";

export { userAccentColor } from "./cb-user-colors.ts";

export type LivePresenceState = "focused" | "editing";

export interface PresenceConfig {
  /** Drop live focus/edit badges after this idle period (ms). */
  staleMs: number;
  /** Fade edit badges toward {@link recentEditMinOpacity} over this period (ms). */
  recentEditFadeMs: number;
  /** Floor opacity for aged edit badges (never removed). */
  recentEditMinOpacity: number;
  /** Badges shown before a “+N” overflow chip. */
  maxVisibleBadges: number;
}

export const DEFAULT_PRESENCE_CONFIG: PresenceConfig = {
  staleMs: 12_000,
  recentEditFadeMs: 120_000,
  recentEditMinOpacity: 0.12,
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
  foreground: string;
  kind: LivePresenceState | "recent-edit";
  /** When the badge’s activity happened (for sort order). */
  activityAtMs: number;
  opacity: number;
  /** True when faded to the minimum grey floor (still hoverable). */
  heavilyFaded: boolean;
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

  constructor(
    selfId: string,
    config: PresenceConfig = DEFAULT_PRESENCE_CONFIG,
  ) {
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
    const { staleMs } = this.#config;
    for (const [id, live] of this.#live) {
      if (atMs - live.atMs > staleMs) this.#live.delete(id);
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
      ranked.push(this.#recentBadge(edit, atMs, age));
    }

    ranked.sort((a, b) =>
      b.activityAtMs - a.activityAtMs ||
      a.displayName.localeCompare(b.displayName)
    );

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
      accent: userAccentColor(live.peer.displayName),
      foreground: presenceChipForeground(
        userAccentColor(live.peer.displayName),
      ),
      kind: live.state,
      activityAtMs: live.atMs,
      opacity: 1,
      heavilyFaded: false,
      relative: formatRelative(live.atMs, atMs),
      absolute: formatAbsolute(live.atMs),
      changeSummary: edit ? summarizeChange(edit.from, edit.to) : undefined,
    };
  }

  #recentBadge(
    edit: FieldEditRecord,
    atMs: number,
    age: number,
  ): PresenceBadge {
    const { recentEditFadeMs, recentEditMinOpacity } = this.#config;
    const fadeStart = recentEditFadeMs * 0.45;
    const opacity = age <= fadeStart ? 1 : Math.max(
      recentEditMinOpacity,
      1 - (age - fadeStart) / (recentEditFadeMs * 3),
    );
    return {
      userId: edit.peer.userId,
      displayName: edit.peer.displayName,
      initials: userInitials(edit.peer.displayName),
      accent: userAccentColor(edit.peer.displayName),
      foreground: presenceChipForeground(
        userAccentColor(edit.peer.displayName),
      ),
      kind: "recent-edit",
      activityAtMs: edit.atMs,
      opacity,
      heavilyFaded: opacity <= recentEditMinOpacity + 0.02,
      relative: formatRelative(edit.atMs, atMs),
      absolute: formatAbsolute(edit.atMs),
      changeSummary: summarizeChange(edit.from, edit.to),
    };
  }
}

export function userInitials(name: string): string {
  const parts = name.split(/[.\s_@+-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0))
      .toUpperCase();
  }
  const compact = name.replace(/[^a-zA-Z0-9\u00C0-\u024F]/g, "");
  if (compact.length >= 2) return compact.slice(0, 2).toUpperCase();
  return (compact.charAt(0) || "?").toUpperCase();
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
  return new Date(atMs).toISOString().replace("T", " ").replace(
    /\.\d{3}Z$/,
    " UTC",
  );
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

export function applyWireMessage(
  view: PresenceView,
  msg: PresenceWireMessage,
): void {
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
