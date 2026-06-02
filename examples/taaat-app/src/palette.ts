/**
 * Favourite annotation palette — persisted in localStorage with import/export.
 */

export interface PaletteEntry {
  key: string;
  /** Optional default value when applying from palette. */
  value?: string;
}

export const PALETTE_STORAGE_KEY = "ehrtslib-taaat-palette-v1";

export function loadPalette(storage: Storage = localStorage): PaletteEntry[] {
  try {
    const raw = storage.getItem(PALETTE_STORAGE_KEY);
    if (!raw) return defaultPalette();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return defaultPalette();
    return parsed
      .filter((e): e is PaletteEntry =>
        typeof e === "object" && e !== null && typeof (e as PaletteEntry).key === "string"
      )
      .map((e) => ({
        key: e.key.trim(),
        value: e.value?.trim() || undefined,
      }))
      .filter((e) => e.key.length > 0);
  } catch {
    return defaultPalette();
  }
}

export function savePalette(
  entries: PaletteEntry[],
  storage: Storage = localStorage,
): void {
  storage.setItem(PALETTE_STORAGE_KEY, JSON.stringify(entries));
}

export function defaultPalette(): PaletteEntry[] {
  return [
    { key: "comment" },
    { key: "design note" },
    { key: "requirements note" },
    { key: "ui", value: "passthrough" },
    { key: "medline ref" },
  ];
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
      key: String(e.key).trim(),
      value: e.value != null ? String(e.value).trim() : undefined,
    }))
    .filter((e) => e.key.length > 0);
  if (!entries.length) throw new Error("No valid palette entries");
  return entries;
}

export function exportPaletteJson(entries: PaletteEntry[]): string {
  return JSON.stringify(entries, null, 2);
}
