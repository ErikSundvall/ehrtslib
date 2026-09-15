import {
  assertEquals,
  assertThrows,
} from "https://deno.land/std@0.220.0/assert/mod.ts";
import {
  addExtraFamily,
  defaultAutomationFavourites,
  defaultFamilyStore,
  exportFamilyStoreJson,
  FAMILY_STORE_KEY,
  favouritesForFamily,
  LEGACY_PALETTE_KEY,
  loadFamilyStore,
  parseFamilyStoreJson,
  removeFavourite,
  saveFamilyStore,
  upsertFavourite,
} from "./family_store.ts";
import {
  L10N_FAMILY,
  UNPREFIXED_FAMILY,
} from "../../../parser/annotation_families.ts";

class MemoryStorage implements Storage {
  private data = new Map<string, string>();
  get length() {
    return this.data.size;
  }
  clear() {
    this.data.clear();
  }
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  key(index: number) {
    return [...this.data.keys()][index] ?? null;
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
  setItem(key: string, value: string) {
    this.data.set(key, value);
  }
}

Deno.test("defaultFamilyStore seeds a. automation examples from discourse #2406/19", () => {
  const store = defaultFamilyStore();
  const a = store.palettes["a."] ?? [];
  assertEquals(a.some((e) => e.key === "a.id"), true);
  assertEquals(
    a.find((e) => e.key === "a.id")?.values.includes("tobacco_user"),
    true,
  );
  assertEquals(
    a.find((e) => e.key === "a.rule.adl2")?.values[0]?.includes("defined"),
    true,
  );
  assertEquals(
    a.find((e) => e.key === "a.rule.better-style")?.values[0]?.includes(
      "THEN",
    ),
    true,
  );
  assertEquals(store.palettes[L10N_FAMILY], undefined);
  assertEquals(defaultAutomationFavourites().length >= 6, true);
});

Deno.test("defaultFamilyStore has unprefixed favourites", () => {
  const p = defaultFamilyStore().palettes[UNPREFIXED_FAMILY] ?? [];
  assertEquals(p.some((e) => e.key === "comment"), true);
  assertEquals(
    p.find((e) => e.key === "ui")?.values.includes("passthrough"),
    true,
  );
});

Deno.test("saveFamilyStore and loadFamilyStore round-trip", () => {
  const storage = new MemoryStorage();
  const store = {
    extraFamilies: ["fhir."],
    palettes: { "fhir.": [{ key: "fhir.mapping", values: ["Patient"] }] },
  };
  saveFamilyStore(store, storage);
  assertEquals(storage.getItem(FAMILY_STORE_KEY)?.includes("fhir."), true);
  const loaded = loadFamilyStore(storage);
  assertEquals(loaded.extraFamilies.includes("fhir."), true);
  assertEquals(loaded.palettes["fhir."][0].key, "fhir.mapping");
  assertEquals(loaded.palettes["a."].some((e) => e.key === "a.id"), true);
});

Deno.test("loadFamilyStore migrates legacy palette v1", () => {
  const storage = new MemoryStorage();
  storage.setItem(
    LEGACY_PALETTE_KEY,
    JSON.stringify([
      { key: "comment" },
      { key: "ui", value: "passthrough" },
      { key: "a.id" },
      { key: "L10n.sv" },
    ]),
  );
  const loaded = loadFamilyStore(storage);
  assertEquals(
    loaded.palettes[UNPREFIXED_FAMILY].some((e) => e.key === "comment"),
    true,
  );
  assertEquals(
    loaded.palettes[UNPREFIXED_FAMILY].find((e) => e.key === "ui")?.values,
    ["passthrough"],
  );
  assertEquals(loaded.palettes["a."].some((e) => e.key === "a.id"), true);
  assertEquals(favouritesForFamily(loaded, L10N_FAMILY).length, 0);
});

Deno.test("parseFamilyStoreJson accepts object and legacy array", () => {
  const fromObj = parseFamilyStoreJson(
    JSON.stringify({
      extraFamilies: ["ui."],
      palettes: { "ui.": [{ key: "ui.hide", values: ["true"] }] },
    }),
  );
  assertEquals(fromObj.extraFamilies, ["ui."]);
  const fromArr = parseFamilyStoreJson('[{"key":"comment","value":"x"}]');
  assertEquals(fromArr.palettes[UNPREFIXED_FAMILY][0].key, "comment");
  assertThrows(() => parseFamilyStoreJson("[]"));
  assertThrows(() => parseFamilyStoreJson("null"));
});

Deno.test("exportFamilyStoreJson is valid JSON", () => {
  const json = exportFamilyStoreJson(defaultFamilyStore());
  assertEquals(JSON.parse(json).palettes["a."][0].key, "a.id");
});

Deno.test("upsertFavourite appends values for an existing key", () => {
  let store = defaultFamilyStore();
  store = upsertFavourite(store, "a.", "a.id", "smoking_status");
  const ids = store.palettes["a."].find((e) => e.key === "a.id")!;
  assertEquals(ids.values.includes("tobacco_user"), true);
  assertEquals(ids.values.includes("smoking_status"), true);
  store = removeFavourite(store, "a.", "a.rule");
  assertEquals(store.palettes["a."].some((e) => e.key === "a.rule"), false);
});

Deno.test("addExtraFamily skips known families", () => {
  const store = addExtraFamily(defaultFamilyStore(), "a.");
  assertEquals(store.extraFamilies.includes("a."), false);
  const next = addExtraFamily(store, "fhir.");
  assertEquals(next.extraFamilies, ["fhir."]);
});
