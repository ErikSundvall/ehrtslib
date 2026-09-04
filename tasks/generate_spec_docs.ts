/**
 * Fetch BMM JSON + specifications.openehr.org /api/classes.json and emit
 * the optional `spec` package tables.
 *
 * Usage:
 *   deno run --allow-read --allow-net --allow-write tasks/generate_spec_docs.ts
 */
import {
  buildSpecDocsTables,
  emitSpecDocsTypeScript,
} from "./spec_docs_generator.ts";
import type { BmmModel } from "./bmm_parser.ts";

const CLASSES_JSON = "https://specifications.openehr.org/api/classes.json";
const outputDir = Deno.args[0] || "./generated";
const specOut = "./spec/spec_docs.generated.ts";

const bmmVersions = JSON.parse(
  await Deno.readTextFile("./tasks/bmm_versions.json"),
) as Record<string, string>;

const packages = [
  "openehr_base",
  "openehr_rm",
  "openehr_am",
  "openehr_lang",
  "openehr_term",
] as const;

const models: Array<{ packageKey: string; model: BmmModel; source: string }> =
  [];

for (const pkg of packages) {
  const url = bmmVersions[pkg];
  if (!url) {
    throw new Error(`Missing BMM URL for ${pkg} in tasks/bmm_versions.json`);
  }
  console.log(`Fetching ${pkg} from ${url}...`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${pkg}: HTTP ${response.status}`);
  }
  const model = JSON.parse(await response.text()) as BmmModel;
  models.push({ packageKey: pkg, model, source: url });
}

console.log(`Fetching class index from ${CLASSES_JSON}...`);
const classesRes = await fetch(CLASSES_JSON);
if (!classesRes.ok) {
  throw new Error(`Failed to fetch classes.json: HTTP ${classesRes.status}`);
}
const classesJson = JSON.parse(await classesRes.text());

const tables = buildSpecDocsTables(models, classesJson);
const content = emitSpecDocsTypeScript(tables);

await Deno.mkdir(outputDir, { recursive: true });
await Deno.mkdir("./spec", { recursive: true });

const generatedPath = `${outputDir}/spec_docs.ts`;
await Deno.writeTextFile(generatedPath, content);
await Deno.writeTextFile(specOut, content);

console.log(`Wrote ${generatedPath}`);
console.log(`Wrote ${specOut}`);
console.log(`Classes: ${tables.classes.length}`);
