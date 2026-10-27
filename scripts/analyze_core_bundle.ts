/**
 * Summarise esbuild metafile input bytes for mod.ts vs mod_full.ts bundles.
 * Run: deno run -A scripts/analyze_core_bundle.ts
 */
import * as esbuild from "https://deno.land/x/esbuild@v0.20.0/mod.js";
import { denoPlugins } from "https://deno.land/x/esbuild_deno_loader@0.9.0/mod.ts";
import { fromFileUrl, join, resolve } from "https://deno.land/std@0.210.0/path/mod.ts";
import { libraryLocations } from "./library_package.ts";

const jsonAsModulePlugin: esbuild.Plugin = {
  name: "json-as-module",
  setup(build) {
    build.onLoad({ filter: /\.json$/ }, async (args) => ({
      contents: `export default ${await Deno.readTextFile(args.path)}`,
      loader: "js",
    }));
  },
};

const repoRoot = resolve(fromFileUrl(new URL(".", import.meta.url)), "..");
const configPath = join(repoRoot, "deno.json");
const version = (JSON.parse(await Deno.readTextFile(configPath)) as { version: string })
  .version;
const loc = libraryLocations(version);

function bucket(path: string): string {
  const rel = path.replace(repoRoot + "/", "").replace(/^file:\/\//, "");
  const m = rel.match(/(?:^|\/)((?:am|base|rm|lang|term|parser|serialization|validation|generation|meta|spec|contribution_builder|terminology_data|node_modules)[/]|node_modules\/@[^/]+)/);
  if (m) return m[1].replace(/\/$/, "");
  const top = rel.split("/")[0];
  return top || "other";
}

async function analyzeEntry(entry: string): Promise<Map<string, number>> {
  const result = await esbuild.build({
    plugins: [jsonAsModulePlugin, ...denoPlugins({ configPath })],
    entryPoints: [join(repoRoot, entry)],
    bundle: true,
    write: false,
    format: "esm",
    platform: "browser",
    metafile: true,
    logLevel: "silent",
  });
  const totals = new Map<string, number>();
  for (const [input, meta] of Object.entries(result.metafile!.inputs)) {
    const b = bucket(input);
    totals.set(b, (totals.get(b) ?? 0) + meta.bytesIn);
  }
  esbuild.stop();
  return totals;
}

function print(label: string, totals: Map<string, number>, outfileBytes: number) {
  const sorted = [...totals.entries()].sort((a, b) => b[1] - a[1]);
  const sum = sorted.reduce((s, [, n]) => s + n, 0);
  console.log(`\n=== ${label} (minified out: ${outfileBytes} bytes, meta inputs: ${sum}) ===`);
  for (const [k, n] of sorted.slice(0, 20)) {
    const pct = ((100 * n) / sum).toFixed(1);
    console.log(`  ${pct}%  ${n.toLocaleString()}  ${k}`);
  }
}

for (const bundle of loc.assets.bundles.filter((b) =>
  b.id === "core" || b.id === "full" || b.id === "contribution"
)) {
  const totals = await analyzeEntry(bundle.entry);
  const out = await esbuild.build({
    plugins: [jsonAsModulePlugin, ...denoPlugins({ configPath })],
    entryPoints: [join(repoRoot, bundle.entry)],
    bundle: true,
    write: false,
    format: "esm",
    platform: "browser",
    minifyWhitespace: true,
    minifySyntax: true,
    minifyIdentifiers: false,
    logLevel: "silent",
  });
  const bytes = out.outputFiles[0].bytes.byteLength;
  esbuild.stop();
  print(`${bundle.id} (${bundle.entry})`, totals, bytes);
}
