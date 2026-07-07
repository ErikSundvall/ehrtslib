/** Regenerate table3_text.ts from table3.yaml (first symbol per type only). */
const yamlPath = new URL("./table3.yaml", import.meta.url);
const outPath = new URL("./table3_text.ts", import.meta.url);

const TOP_SECTIONS = new Set([
  "data_types",
  "data_structures",
  "ehr_components",
  "foundation_types",
]);

const text = await Deno.readTextFile(yamlPath);
const lines = text.split(/\r?\n/).filter((l) => !/^\s*#/.test(l));
const cleaned = lines.join("\n");
const entryRe = /([A-Za-z0-9_]+)\s*:\s*\[\s*["']([^"']+)["']/g;

type Section = { name: string; entries: { key: string; symbol: string }[] };
const sections: Section[] = [];
let current: Section | null = null;

for (const line of lines) {
  for (const sec of line.matchAll(/(\w+):\s*\{/g)) {
    if (!TOP_SECTIONS.has(sec[1])) continue;
    current = { name: sec[1], entries: [] };
    sections.push(current);
  }
  const entry = line.match(/^\s*([A-Za-z0-9_]+)\s*:\s*\[\s*["']([^"']+)["']/);
  if (entry && current) {
    current.entries.push({ key: entry[1], symbol: entry[2] });
  }
}

const body: string[] = ["{"];
for (let i = 0; i < sections.length; i++) {
  const sec = sections[i];
  const prefix = i === 0 ? "" : "}, ";
  body.push(`${prefix}${sec.name}: {`);
  for (const { key, symbol } of sec.entries) {
    body.push(`  ${key}: ["${symbol}"],`);
  }
}
body.push("} }");

const output = [
  "/** Embedded copy of table3.yaml (first symbol per type) for Deno tests and browser bundle. */",
  "/** Regenerate: deno run --allow-read --allow-write gen_table3_text.ts */",
  "export default `",
  ...body,
  "` as string;",
  "",
].join("\n");

await Deno.writeTextFile(outPath, output);
console.log(`Wrote ${outPath.pathname}`);

const firstSymbols = new Map<string, string>();
const duplicates: string[] = [];
let m: RegExpExecArray | null;
while ((m = entryRe.exec(cleaned)) !== null) {
  const [, key, symbol] = m;
  if (firstSymbols.has(symbol)) {
    duplicates.push(`${symbol}: ${firstSymbols.get(symbol)} vs ${key}`);
  } else {
    firstSymbols.set(symbol, key);
  }
}
if (duplicates.length > 0) {
  console.error("Duplicate first symbols:", duplicates);
  Deno.exit(1);
}
console.log(`Verified ${firstSymbols.size} unique first symbols.`);
