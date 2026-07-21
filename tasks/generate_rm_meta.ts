/**
 * Fetch BASE + RM BMM JSON (same sources as class codegen) and emit
 * attribute metadata for the runtime introspection API.
 *
 * Usage:
 *   deno run --allow-read --allow-net --allow-write tasks/generate_rm_meta.ts
 *   deno run --allow-read --allow-net --allow-write tasks/generate_rm_meta.ts ./generated
 */
import { buildRmMetaTables, emitRmMetaTypeScript } from "./rm_meta_generator.ts";

const outputDir = Deno.args[0] || "./generated";
const enhancedOut = "./enhanced/meta/rm_attribute_meta.generated.ts";

const bmmVersions = JSON.parse(
  await Deno.readTextFile("./tasks/bmm_versions.json"),
) as Record<string, string>;

const packages = ["openehr_base", "openehr_rm"] as const;

const models: Array<{ model: Record<string, unknown>; source: string }> = [];

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
  const model = JSON.parse(await response.text());
  models.push({ model, source: url });
}

const tables = buildRmMetaTables(
  // deno-lint-ignore no-explicit-any
  models as any,
);
const content = emitRmMetaTypeScript(tables);

await Deno.mkdir(outputDir, { recursive: true });
await Deno.mkdir("./enhanced/meta", { recursive: true });

const generatedPath = `${outputDir}/rm_attribute_meta.ts`;
await Deno.writeTextFile(generatedPath, content);
await Deno.writeTextFile(enhancedOut, content);

console.log(`Wrote ${generatedPath}`);
console.log(`Wrote ${enhancedOut}`);
console.log(
  `Classes: ${Object.keys(tables.classes).length}, types with attributes: ${
    Object.keys(tables.ownAttributes).length
  }`,
);
