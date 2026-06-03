/**
 * Favourite annotation palette — persisted in localStorage with import/export.
 * Entries are identified by `id` so the same key may appear with different values.
 */

export interface PaletteEntry {
  /** Stable id for list identity (duplicate keys allowed). */
  id: string;
  key: string;
  /** Optional default value when applying from palette. */
  value?: string;
}

export const PALETTE_STORAGE_KEY = "ehrtslib-taaat-palette-v1";

export function createPaletteEntry(
  key: string,
  value?: string,
): PaletteEntry {
  return {
    id: crypto.randomUUID(),
    key: key.trim(),
    value: value?.trim() || undefined,
  };
}

export function ensurePaletteIds(entries: PaletteEntry[]): PaletteEntry[] {
  return entries.map((e) => ({
    ...e,
    id: e.id?.trim() || crypto.randomUUID(),
    key: e.key.trim(),
    value: e.value?.trim() || undefined,
  })).filter((e) => e.key.length > 0);
}

export function loadPalette(storage: Storage = localStorage): PaletteEntry[] {
  try {
    const raw = storage.getItem(PALETTE_STORAGE_KEY);
    if (!raw) return defaultPalette();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return defaultPalette();
    const entries = parsed
      .filter((e): e is PaletteEntry =>
        typeof e === "object" && e !== null && typeof (e as PaletteEntry).key === "string"
      )
      .map((e) => ({
        id: typeof e.id === "string" ? e.id : "",
        key: String(e.key).trim(),
        value: e.value != null ? String(e.value).trim() : undefined,
      }));
    const withIds = ensurePaletteIds(entries);
    return withIds.length ? withIds : defaultPalette();
  } catch {
    return defaultPalette();
  }
}

export function savePalette(
  entries: PaletteEntry[],
  storage: Storage = localStorage,
): void {
  storage.setItem(PALETTE_STORAGE_KEY, JSON.stringify(ensurePaletteIds(entries)));
}

export function defaultPalette(): PaletteEntry[] {
  return ensurePaletteIds([
    { id: "", key: "comment" },
    { id: "", key: "design note" },
    { id: "", key: "requirements note" },
    { id: "", key: "ui", value: "passthrough" },
    { id: "", key: "medline ref" },
  ]);
}

export function parsePaletteJson(text: string): PaletteEntry[] {
  const parsed = JSON.parse(text) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error("Palette file must be a JSON array");
  }
  const entries = parsed
    .filter((e): e is PaletteEntry =>
      typeof e === "object" && e !== null && typeof (e as PaletteEntry).key === "string"
    )
    .map((e) => ({
      id: typeof e.id === "string" ? e.id : "",
      key: String(e.key).trim(),
      value: e.value != null ? String(e.value).trim() : undefined,
    }));
  const withIds = ensurePaletteIds(entries);
  if (!withIds.length) throw new Error("No valid palette entries");
  return withIds;
}

export function exportPaletteJson(entries: PaletteEntry[]): string {
  return JSON.stringify(ensurePaletteIds(entries), null, 2);
}
