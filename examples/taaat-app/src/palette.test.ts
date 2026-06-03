import { assertEquals, assertThrows } from "https://deno.land/std@0.220.0/assert/mod.ts";
import {
  defaultPalette,
  exportPaletteJson,
  parsePaletteJson,
  savePalette,
  loadPalette,
  PALETTE_STORAGE_KEY,
} from "./palette.ts";

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
});

Deno.test("savePalette and loadPalette round-trip", () => {
  const storage = new MemoryStorage();
  const entries = [{ key: "foo", value: "bar" }];
  savePalette(entries, storage);
  assertEquals(storage.getItem(PALETTE_STORAGE_KEY)?.includes("foo"), true);
  const loaded = loadPalette(storage);
  assertEquals(loaded[0].key, "foo");
  assertEquals(loaded[0].value, "bar");
});

Deno.test("parsePaletteJson validates array", () => {
  assertThrows(() => parsePaletteJson("{}"));
  const entries = parsePaletteJson('[{"key":"a"}]');
  assertEquals(entries.length, 1);
});

Deno.test("exportPaletteJson is valid JSON", () => {
  const json = exportPaletteJson([{ key: "x" }]);
  assertEquals(JSON.parse(json)[0].key, "x");
});
