/**
 * Regenerate symbol_table.ts from symbol_table.yaml.
 *
 * `SYMBOL_TABLE_LETTER_SYMBOLS`: uses array[0] as the symbol (Ehrbase short code).
 * `SYMBOL_TABLE_EMOJI_SYMBOLS`: uses array[1] when array[0] looks like a letter code,
 * otherwise uses array[0] (backward compatible for any entries not updated).
 */
const yamlPath = new URL("./symbol_table.yaml", import.meta.url);
const outPath = new URL("./symbol_table.ts", import.meta.url);

const TOP_SECTIONS = new Set([
  "data_types",
  "data_structures",
  "ehr_components",
  "terminology_shortcuts",
  "field_promotions",
  "foundation_types",
]);

const RM_SYMBOL_SECTIONS = new Set([
  "data_types",
  "data_structures",
  "ehr_components",
]);

/** symbol_table.yaml terminology_shortcuts keys → terse-string prefixes. */
const TERMINOLOGY_KEY_TO_PREFIX: Record<string, string> = {
  openehr: "openehr::",
  local: "local::",
  language: "ISO_639-1::",
  territory: "ISO_3166-1::",
  encoding: "IANA_character-sets::",
};

const text = await Deno.readTextFile(yamlPath);
const lines = text.split(/\r?\n/).filter((l) => !/^\s*#/.test(l));

type Entry = { key: string; letterSymbol: string; emojiSymbol: string };
type Section = { name: string; entries: Entry[] };

const sections: Section[] = [];
let current: Section | null = null;

for (const line of lines) {
  for (const sec of line.matchAll(/(\w+):\s*\{/g)) {
    if (!TOP_SECTIONS.has(sec[1])) continue;
    current = { name: sec[1], entries: [] };
    sections.push(current);
  }
  const entry = line.match(/^\s*([A-Za-z0-9_.]+)\s*:\s*\[\s*([^\]]+)\]/);
  if (entry && current) {
    const key = entry[1];
    const inner = entry[2];
    const symbols = [...inner.matchAll(/["']([^"']+)["']/g)].map((m) => m[1]);
    if (symbols.length === 0) continue;

    const first = symbols[0];
    const second = symbols[1];

    // Letter codes are 1-2 ASCII alphanumerics; emojis are non-ASCII.
    const looksLikeLetterCode = /^[A-Za-z0-9]{1,2}$/.test(first);
    const letterSymbol = first;
    const emojiSymbol = looksLikeLetterCode && second != null ? second : first;

    current.entries.push({ key, letterSymbol, emojiSymbol });
  }
}

const letterLines: string[] = [];
const emojiLines: string[] = [];
const terminologyShortcutLines: string[] = [];
const fieldPromotionLines: string[] = [];
const seenKeys = new Set<string>();

for (const sec of sections) {
  if (sec.name === "terminology_shortcuts") {
    for (const { key, emojiSymbol } of sec.entries) {
      const prefix = TERMINOLOGY_KEY_TO_PREFIX[key];
      if (!prefix) {
        throw new Error(`Unknown terminology_shortcuts key in symbol_table.yaml: ${key}`);
      }
      terminologyShortcutLines.push(
        `  { prefix: "${prefix}", emoji: "${emojiSymbol}" },`,
      );
    }
    continue;
  }
  if (sec.name === "field_promotions") {
    for (const { key, emojiSymbol } of sec.entries) {
      const prefix = TERMINOLOGY_KEY_TO_PREFIX[key];
      if (!prefix) {
        throw new Error(`Unknown field_promotions key in symbol_table.yaml: ${key}`);
      }
      fieldPromotionLines.push(
        `  { field: "${key}", prefix: "${prefix}", emoji: "${emojiSymbol}" },`,
      );
    }
    continue;
  }
  if (!RM_SYMBOL_SECTIONS.has(sec.name)) continue;
  for (const { key, letterSymbol, emojiSymbol } of sec.entries) {
    // RM class rows are UPPERCASE; attribute rows use dotted keys (e.g. LOCATABLE.name).
    if (key !== key.toUpperCase() && !key.includes(".")) continue;
    if (seenKeys.has(key)) {
      throw new Error(`Duplicate symbol key in symbol_table.yaml: ${key}`);
    }
    seenKeys.add(key);
    const keyLiteral = key.includes(".") ? `"${key}"` : key;
    letterLines.push(`  ${keyLiteral}: "${letterSymbol}",`);
    emojiLines.push(`  ${keyLiteral}: "${emojiSymbol}",`);
  }
}

const output = [
  "/** Embedded symbol maps derived from symbol_table.yaml for browser + tests. */",
  "/** Regenerate: deno run --allow-read --allow-write gen_symbol_table.ts */",
  "",
  "export const SYMBOL_TABLE_LETTER_SYMBOLS = {",
  ...letterLines,
  "} as const;",
  "",
  "export const SYMBOL_TABLE_EMOJI_SYMBOLS = {",
  ...emojiLines,
  "} as const;",
  "",
  "export type TerminologyShortcut = { readonly prefix: string; readonly emoji: string };",
  "export const TERMINOLOGY_SHORTCUTS: readonly TerminologyShortcut[] = [",
  ...terminologyShortcutLines,
  "] as const;",
  "",
  "export type TerminologyFieldPromotion = {",
  "  readonly field: string;",
  "  readonly prefix: string;",
  "  readonly emoji: string;",
  "};",
  "export const TERMINOLOGY_FIELD_PROMOTIONS: readonly TerminologyFieldPromotion[] = [",
  ...fieldPromotionLines,
  "] as const;",
  "",
].join("\n");

await Deno.writeTextFile(outPath, output);
console.log(`Wrote ${outPath.pathname}`);

// Basic sanity check: symbols should map uniquely back to a type marker.
// (This is relied on by reverse-symbol expansion.)
const letterReverse = new Map<string, string>();
const emojiReverse = new Map<string, string>();
const dupLetter: string[] = [];
const dupEmoji: string[] = [];

for (const line of letterLines) {
  const m = line.match(/^\s*([A-Z0-9_.]+):\s*"([^"]+)"\s*,?$/);
  if (!m) continue;
  const type = m[1];
  if (type.includes(".")) continue;
  const sym = m[2];
  if (letterReverse.has(sym)) dupLetter.push(`${sym}: ${letterReverse.get(sym)} vs ${type}`);
  else letterReverse.set(sym, type);
}
for (const line of emojiLines) {
  const m = line.match(/^\s*([A-Z0-9_]+):\s*"([^"]+)"\s*,?$/);
  if (!m) continue;
  const type = m[1];
  const sym = m[2];
  if (emojiReverse.has(sym)) dupEmoji.push(`${sym}: ${emojiReverse.get(sym)} vs ${type}`);
  else emojiReverse.set(sym, type);
}

if (dupLetter.length > 0) {
  console.error("Duplicate letter symbols:", dupLetter);
  Deno.exit(1);
}
if (dupEmoji.length > 0) {
  console.error("Duplicate emoji symbols:", dupEmoji);
  Deno.exit(1);
}

console.log(`Verified ${letterReverse.size} unique letter symbols.`);
