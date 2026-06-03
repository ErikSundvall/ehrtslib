import { assertEquals, assertThrows } from "https://deno.land/std@0.220.0/assert/mod.ts";
import {
  createPaletteEntry,
  defaultPalette,
  ensurePaletteIds,
  exportPaletteJson,
  parsePaletteJson,
  savePalette,
  loadPalette,
  PALETTE_STORAGE_KEY,
} from "./palette.ts";
import { truncateLabelEnd } from "./tree-view.ts";

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

Deno.test("defaultPalette has common openEHR keys", () => {
  const p = defaultPalette();
  assertEquals(p.some((e) => e.key === "comment"), true);
  assertEquals(p.some((e) => e.key === "ui"), true);
  assertEquals(p.every((e) => e.id.length > 0), true);
});

Deno.test("savePalette and loadPalette round-trip", () => {
  const storage = new MemoryStorage();
  const entries = [createPaletteEntry("foo", "bar")];
  savePalette(entries, storage);
  assertEquals(storage.getItem(PALETTE_STORAGE_KEY)?.includes("foo"), true);
  const loaded = loadPalette(storage);
  assertEquals(loaded[0].key, "foo");
  assertEquals(loaded[0].value, "bar");
});

Deno.test("palette allows duplicate keys with different values", () => {
  const entries = ensurePaletteIds([
    createPaletteEntry("ui", "passthrough"),
    createPaletteEntry("ui", "hidden"),
  ]);
  assertEquals(entries.length, 2);
  assertEquals(entries[0].key, entries[1].key);
  assertEquals(entries[0].id !== entries[1].id, true);
  assertEquals(entries[0].value, "passthrough");
  assertEquals(entries[1].value, "hidden");
});

Deno.test("parsePaletteJson validates array", () => {
  assertThrows(() => parsePaletteJson("{}"));
  const entries = parsePaletteJson('[{"key":"a"},{"key":"a","value":"b"}]');
  assertEquals(entries.length, 2);
  assertEquals(entries[0].id.length > 0, true);
});

Deno.test("exportPaletteJson is valid JSON", () => {
  const json = exportPaletteJson([createPaletteEntry("x")]);
  assertEquals(JSON.parse(json)[0].key, "x");
});

Deno.test("truncateLabelEnd keeps suffix of long labels", () => {
  const truncated = truncateLabelEnd("OBSERVATION[at0001]/data[at0002]", 12);
  assertEquals(truncated.endsWith("[at0002]"), true);
  assertEquals(truncated.startsWith("\u2026"), true);
  assertEquals(truncateLabelEnd("short", 20), "short");
});
