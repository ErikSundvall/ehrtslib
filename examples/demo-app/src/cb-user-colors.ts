/** Fixed categorical colours for demo presence chips and narrative highlights (#306). */
import { parseDemoUsername, USERNAMES } from "./cb-username-allocator.ts";

export const COLORBREWER_SET3 = [
  "#8dd3c7",
  "#ffffb3",
  "#bebada",
  "#fb8072",
  "#80b1d3",
  "#fdb462",
  "#b3de69",
  "#fccde5",
  "#d9d9d9",
  "#bc80bd",
  "#ccebc5",
  "#ffed6f",
] as const;

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/** Stable roster index (0–11) from a demo username or arbitrary label. */
export function rosterColorIndex(displayName: string): number {
  const parsed = parseDemoUsername(displayName);
  const base = parsed?.base ?? displayName;
  const generation = parsed?.generation ?? 1;
  const roster = USERNAMES.indexOf(base as (typeof USERNAMES)[number]);
  const baseIdx = roster >= 0 ? roster : hashString(base) % COLORBREWER_SET3.length;
  return (baseIdx + generation - 1) % COLORBREWER_SET3.length;
}

export function userAccentColor(displayName: string): string {
  return COLORBREWER_SET3[rosterColorIndex(displayName)]!;
}

/** Dark label colour readable on ColorBrewer Set3 fills. */
export function presenceChipForeground(_accent: string): string {
  return "#0e2f44";
}
