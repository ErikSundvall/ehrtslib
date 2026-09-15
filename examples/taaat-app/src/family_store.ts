/**
 * Per-family favourite keys (and optional value lists), plus user-added
 * annotation prefixes. Persisted in localStorage with import/export.
 *
 * L10n is excluded: that family has its own generate panel.
 */

import {
  annotationFamily,
  KNOWN_FAMILIES,
  L10N_FAMILY,
  UNPREFIXED_FAMILY,
} from "../../../parser/annotation_families.ts";

export interface FavouriteEntry {
  key: string;
  /** Suggested values the user can pick from when applying this key. */
  values: string[];
}

export interface FamilyStore {
  extraFamilies: string[];
  palettes: Record<string, FavouriteEntry[]>;
}

export const FAMILY_STORE_KEY = "ehrtslib-taaat-families-v2";
export const LEGACY_PALETTE_KEY = "ehrtslib-taaat-palette-v1";

/**
 * Automation / UI-hint keys from
 * https://discourse.openehr.org/t/agreeing-on-optional-user-interface-hints-in-templates/2406/19
 */
export function defaultAutomationFavourites(): FavouriteEntry[] {
  return [
    {
      key: "a.id",
      values: ["tobacco_user", "tobacco_details"],
    },
    {
      key: "a.rule",
      values: ["tobacco_user = 'Y' implies exists THIS"],
    },
    {
      key: "a.rule.adl",
      values: ["tobacco_user = 'Y' implies exists tobacco_details"],
    },
    {
      key: "a.rule.adl2",
      values: [
        "check tobacco_user = 'Y' implies defined (tobacco_details)",
      ],
    },
    {
      key: "a.rule.cambio-style",
      values: [
        "tobacco_user == 'Y' ASSIGN tobacco_details.hidden = false OTHERWISE tobacco_details.hidden = true",
      ],
    },
    {
      key: "a.rule.better-style",
      values: [
        "tobacco_user = 'Y' THEN tobacco_details show OTHERWISE tobacco_details hide",
      ],
    },
  ];
}

export function defaultUnprefixedFavourites(): FavouriteEntry[] {
  return [
    { key: "comment", values: [] },
    { key: "design note", values: [] },
    { key: "requirements note", values: [] },
    { key: "ui", values: ["passthrough"] },
    { key: "medline ref", values: [] },
  ];
}

export function defaultFamilyStore(): FamilyStore {
  return {
    extraFamilies: [],
    palettes: {
      [UNPREFIXED_FAMILY]: defaultUnprefixedFavourites(),
      "a.": defaultAutomationFavourites(),
    },
  };
}

function asFavouriteEntry(raw: unknown): FavouriteEntry | undefined {
  if (typeof raw !== "object" || raw === null) return undefined;
  const rec = raw as Record<string, unknown>;
  const key = typeof rec.key === "string" ? rec.key.trim() : "";
  if (!key) return undefined;
  const values: string[] = [];
  if (Array.isArray(rec.values)) {
    for (const v of rec.values) {
      if (v == null) continue;
      const s = String(v).trim();
      if (s && !values.includes(s)) values.push(s);
    }
  } else if (typeof rec.value === "string" && rec.value.trim()) {
    values.push(rec.value.trim());
  }
  return { key, values };
}

function normalizeStore(raw: FamilyStore): FamilyStore {
  const extra = [
    ...new Set(
      raw.extraFamilies.map((f) => f.trim()).filter((f) => f.length > 0),
    ),
  ];
  const palettes: Record<string, FavouriteEntry[]> = {};
  for (const [family, entries] of Object.entries(raw.palettes ?? {})) {
    if (family === L10N_FAMILY) continue;
    const seen = new Set<string>();
    const list: FavouriteEntry[] = [];
    for (const e of entries ?? []) {
      if (seen.has(e.key)) continue;
      seen.add(e.key);
      list.push({ key: e.key, values: [...e.values] });
    }
    palettes[family] = list;
  }
  return { extraFamilies: extra, palettes };
}

function withDefaultPalettes(store: FamilyStore): FamilyStore {
  const palettes = { ...store.palettes };
  if (!palettes[UNPREFIXED_FAMILY]?.length) {
    palettes[UNPREFIXED_FAMILY] = defaultUnprefixedFavourites();
  }
  if (!palettes["a."]?.length) {
    palettes["a."] = defaultAutomationFavourites();
  }
  return { extraFamilies: store.extraFamilies, palettes };
}

function migrateLegacyPalette(raw: string): FamilyStore | undefined {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return undefined;
    const palettes: Record<string, FavouriteEntry[]> = {};
    for (const item of parsed) {
      const entry = asFavouriteEntry(item);
      if (!entry) continue;
      const family = annotationFamily(entry.key);
      if (family === L10N_FAMILY) continue;
      palettes[family] ??= [];
      const existing = palettes[family].find((e) => e.key === entry.key);
      if (existing) {
        for (const v of entry.values) {
          if (!existing.values.includes(v)) existing.values.push(v);
        }
      } else {
        palettes[family].push(entry);
      }
    }
    return { extraFamilies: [], palettes };
  } catch {
    return undefined;
  }
}

export function loadFamilyStore(storage: Storage = localStorage): FamilyStore {
  try {
    const v2 = storage.getItem(FAMILY_STORE_KEY);
    if (v2) {
      const parsed = JSON.parse(v2) as unknown;
      return withDefaultPalettes(normalizeStore(coerceStore(parsed)));
    }
    const v1 = storage.getItem(LEGACY_PALETTE_KEY);
    if (v1) {
      const migrated = migrateLegacyPalette(v1);
      if (migrated) return withDefaultPalettes(normalizeStore(migrated));
    }
  } catch {
    // fall through to defaults
  }
  return defaultFamilyStore();
}

function coerceStore(parsed: unknown): FamilyStore {
  if (Array.isArray(parsed)) {
    return migrateLegacyPalette(JSON.stringify(parsed)) ?? defaultFamilyStore();
  }
  if (typeof parsed !== "object" || parsed === null) {
    return defaultFamilyStore();
  }
  const rec = parsed as Record<string, unknown>;
  const extraFamilies = Array.isArray(rec.extraFamilies)
    ? rec.extraFamilies.filter((f): f is string => typeof f === "string")
    : [];
  const palettes: Record<string, FavouriteEntry[]> = {};
  const rawPalettes = rec.palettes;
  if (rawPalettes && typeof rawPalettes === "object") {
    for (
      const [family, entries] of Object.entries(
        rawPalettes as Record<string, unknown>,
      )
    ) {
      if (!Array.isArray(entries)) continue;
      palettes[family] = entries
        .map(asFavouriteEntry)
        .filter((e): e is FavouriteEntry => !!e);
    }
  }
  return { extraFamilies, palettes };
}

export function saveFamilyStore(
  store: FamilyStore,
  storage: Storage = localStorage,
): void {
  storage.setItem(FAMILY_STORE_KEY, JSON.stringify(normalizeStore(store)));
}

export function parseFamilyStoreJson(text: string): FamilyStore {
  const parsed = JSON.parse(text) as unknown;
  if (parsed == null || typeof parsed !== "object") {
    throw new Error("Families file must be a JSON object or array");
  }
  if (Array.isArray(parsed) && parsed.length === 0) {
    throw new Error("No valid family favourites");
  }
  const store = withDefaultPalettes(normalizeStore(coerceStore(parsed)));
  const hasEntries = Object.values(store.palettes).some((e) => e.length > 0) ||
    store.extraFamilies.length > 0;
  if (!hasEntries) throw new Error("No valid family favourites");
  return store;
}

export function exportFamilyStoreJson(store: FamilyStore): string {
  return JSON.stringify(normalizeStore(store), null, 2);
}

export function favouritesForFamily(
  store: FamilyStore,
  family: string,
): FavouriteEntry[] {
  if (family === L10N_FAMILY) return [];
  return store.palettes[family] ?? [];
}

export function upsertFavourite(
  store: FamilyStore,
  family: string,
  key: string,
  value?: string,
): FamilyStore {
  if (family === L10N_FAMILY) return store;
  const palettes = { ...store.palettes };
  const entries = [...(palettes[family] ?? [])];
  const i = entries.findIndex((e) => e.key === key);
  const nextValue = value?.trim() || undefined;
  if (i >= 0) {
    const values = [...entries[i].values];
    if (nextValue && !values.includes(nextValue)) values.push(nextValue);
    entries[i] = { key, values };
  } else {
    entries.push({ key, values: nextValue ? [nextValue] : [] });
  }
  palettes[family] = entries;
  return { ...store, palettes };
}

export function removeFavourite(
  store: FamilyStore,
  family: string,
  key: string,
): FamilyStore {
  const palettes = { ...store.palettes };
  palettes[family] = (palettes[family] ?? []).filter((e) => e.key !== key);
  return { ...store, palettes };
}

export function addExtraFamily(
  store: FamilyStore,
  family: string,
): FamilyStore {
  if (
    family === L10N_FAMILY ||
    family === UNPREFIXED_FAMILY ||
    (KNOWN_FAMILIES as readonly string[]).includes(family)
  ) {
    return store;
  }
  if (store.extraFamilies.includes(family)) return store;
  return {
    ...store,
    extraFamilies: [...store.extraFamilies, family],
  };
}

export function removeExtraFamily(
  store: FamilyStore,
  family: string,
): FamilyStore {
  const palettes = { ...store.palettes };
  delete palettes[family];
  return {
    extraFamilies: store.extraFamilies.filter((f) => f !== family),
    palettes,
  };
}
