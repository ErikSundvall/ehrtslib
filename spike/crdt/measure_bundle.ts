#!/usr/bin/env -S deno run -A
/**
 * Measure minified ESM bundle sizes (same esbuild setup as pack:library).
 * CRDT libraries are spike-only; they must not ship in core or CB bundles.
 */
import * as esbuild from "https://deno.land/x/esbuild@v0.20.0/mod.js";
import { denoPlugins } from "https://deno.land/x/esbuild_deno_loader@0.9.0/mod.ts";
import { dirname, fromFileUrl, join, toFileUrl } from "@std/path";
import { ensureDir } from "@std/fs";

const root = join(dirname(fromFileUrl(import.meta.url)), "../..");
const outDir = join(root, "spike/crdt/.bundle-out");
const configPath = join(root, "deno.json");

const jsonAsModulePlugin: esbuild.Plugin = {
  name: "json-as-module",
  setup(build) {
    build.onLoad({ filter: /\.json$/ }, async (args) => ({
      contents: `export default ${await Deno.readTextFile(args.path)}`,
      loader: "js",
    }));
  },
};

interface Entry {
  label: string;
  entry: string;
}

const entries: Entry[] = [
  { label: "core (mod.ts)", entry: "mod.ts" },
  {
    label: "contribution-builder",
    entry: "contribution_builder/mod.ts",
  },
  {
    label: "npm @automerge/automerge (sync only)",
    entry: "spike/crdt/bundle_entry_automerge.ts",
  },
  {
    label: "npm loro-crdt (sync only)",
    entry: "spike/crdt/bundle_entry_loro.ts",
  },
];

async function bundleSize(entry: Entry): Promise<number> {
  const outfile = join(outDir, entry.label.replace(/\W+/g, "_") + ".min.js");
  const plugins = [jsonAsModulePlugin, ...denoPlugins({ configPath })];
  await esbuild.build({
    plugins,
    entryPoints: [toFileUrl(join(root, entry.entry)).href],
    bundle: true,
    outfile,
    format: "esm",
    target: "es2022",
    platform: "browser",
    minifyWhitespace: true,
    minifySyntax: true,
    minifyIdentifiers: false,
    logLevel: "silent",
  });
  const stat = await Deno.stat(outfile);
  return stat.size;
}

await ensureDir(outDir);
const rows: Array<{ label: string; bytes: number; kb: string }> = [];
try {
  for (const e of entries) {
    const bytes = await bundleSize(e);
    rows.push({
      label: e.label,
      bytes,
      kb: (bytes / 1024).toFixed(1),
    });
    console.log(`${e.label}: ${bytes} bytes (${(bytes / 1024).toFixed(1)} KiB)`);
  }
} finally {
  esbuild.stop();
}

const core = rows.find((r) => r.label.startsWith("core"))!;
const cb = rows.find((r) => r.label.startsWith("contribution"))!;
const am = rows.find((r) => r.label.includes("automerge"))!;
const loro = rows.find((r) => r.label.includes("loro"))!;
console.log("\nDelta vs core+CB (if CRDT were added to CB bundle):");
console.log(
  `  automerge spike entry: +${am.bytes - cb.bytes} vs CB alone, +${
    core.bytes + am.bytes
  } if bundled with core`,
);
console.log(
  `  loro spike entry: +${loro.bytes - cb.bytes} vs CB alone`,
);

await Deno.writeTextFile(
  join(outDir, "sizes.json"),
  JSON.stringify({ measuredAt: new Date().toISOString(), rows }, null, 2),
);
