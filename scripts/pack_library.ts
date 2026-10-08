#!/usr/bin/env -S deno run -A
/**
 * Build the library release directory.
 *
 *   deno task pack:library
 *   deno run -A scripts/pack_library.ts dist/library-release
 *
 * Writes:
 *   source/   TypeScript library tree
 *   dev/      source plus docs
 *   web/      Pages directory (`index.html`, minified ESM, import map)
 *   upload/   files attached to the GitHub Release
 */
import * as esbuild from "https://deno.land/x/esbuild@v0.20.0/mod.js";
import {
  dirname,
  fromFileUrl,
  join,
  resolve,
  toFileUrl,
} from "https://deno.land/std@0.210.0/path/mod.ts";
import { ensureDir } from "https://deno.land/std@0.210.0/fs/mod.ts";
import { denoPlugins } from "https://deno.land/x/esbuild_deno_loader@0.9.0/mod.ts";
import {
  cdnImportMap,
  importsMissingFromPack,
  isExcludedSourcePath,
  LIBRARY_CLOSURE_ROOTS,
  libraryDenoJson,
  libraryLocations,
  listLibraryDevFiles,
  listLibrarySourceFiles,
  PACKAGE_GUIDE_PATH,
  relativeImportClosure,
  renderLibraryWebIndex,
  runtimeBundleBanner,
  stageLibraryTree,
  zipTree,
} from "./library_package.ts";

const root = join(dirname(fromFileUrl(import.meta.url)), "..");

/** Import .json from npm packages as ESM default exports. */
const jsonAsModulePlugin: esbuild.Plugin = {
  name: "json-as-module",
  setup(build) {
    build.onLoad({ filter: /\.json$/ }, async (args) => ({
      contents: `export default ${await Deno.readTextFile(args.path)}`,
      loader: "js",
    }));
  },
};

async function buildRuntimeBundles(
  repoRoot: string,
  webDir: string,
  version: string,
): Promise<void> {
  const loc = libraryLocations(version);
  await ensureDir(webDir);
  const configPath = join(repoRoot, "deno.json");
  const plugins = [
    jsonAsModulePlugin,
    ...denoPlugins({ configPath }),
  ];
  const banner = runtimeBundleBanner(version);
  try {
    for (const bundle of loc.assets.bundles) {
      const outfile = join(webDir, bundle.file);
      console.log(`Bundling ${bundle.entry} → ${bundle.file}`);
      await esbuild.build({
        plugins,
        entryPoints: [toFileUrl(join(repoRoot, bundle.entry)).href],
        bundle: true,
        outfile,
        format: "esm",
        target: "es2022",
        platform: "browser",
        minifyWhitespace: true,
        minifySyntax: true,
        minifyIdentifiers: false,
        legalComments: "eof",
        banner: { js: banner },
        logLevel: "warning",
      });
    }
  } finally {
    esbuild.stop();
  }
}

export async function packLibrary(
  repoRoot: string,
  outDir: string,
): Promise<void> {
  const repoDeno = await Deno.readTextFile(join(repoRoot, "deno.json"));
  const version = (JSON.parse(repoDeno) as { version?: string }).version;
  if (!version) throw new Error("deno.json is missing version");
  const loc = libraryLocations(version);
  const guide = await Deno.readTextFile(join(repoRoot, PACKAGE_GUIDE_PATH));
  const denoJson = libraryDenoJson(repoDeno);
  const importMap = cdnImportMap(version, repoDeno);

  const sourceFiles = await listLibrarySourceFiles(repoRoot);
  const closure = await relativeImportClosure(repoRoot, LIBRARY_CLOSURE_ROOTS);
  const missing = importsMissingFromPack(closure, sourceFiles);
  if (missing.length > 0) {
    throw new Error(
      "Library source pack is missing imported files:\n" + missing.join("\n"),
    );
  }
  for (const rel of sourceFiles) {
    if (isExcludedSourcePath(rel)) {
      throw new Error(`Source pack includes excluded path ${rel}`);
    }
  }

  const sourceDir = join(outDir, "source");
  const devDir = join(outDir, "dev");
  const webDir = join(outDir, "web");
  const uploadDir = join(outDir, "upload");

  console.log(
    `Staging ehrtslib ${version} source (${sourceFiles.length} files)`,
  );
  await stageLibraryTree(repoRoot, sourceDir, sourceFiles, {
    "deno.json": denoJson,
    "import-map.json": importMap,
    "LIBRARY_PACKAGE.md": guide,
  });

  const devFiles = await listLibraryDevFiles(repoRoot);
  console.log(`Staging development tree (${devFiles.length} files)`);
  await stageLibraryTree(repoRoot, devDir, devFiles, {
    "deno.json": denoJson,
    "import-map.json": importMap,
  });

  await ensureDir(uploadDir);
  const sourceZip = await zipTree(sourceDir);
  const devZip = await zipTree(devDir);
  await Deno.writeFile(join(uploadDir, loc.assets.sourceZip), sourceZip);
  await Deno.writeFile(join(uploadDir, loc.assets.devZip), devZip);
  await Deno.writeTextFile(join(uploadDir, loc.assets.importMap), importMap);
  console.log(
    `Wrote ${loc.assets.sourceZip} (${sourceZip.byteLength} bytes) and ${loc.assets.devZip} (${devZip.byteLength} bytes)`,
  );

  await buildRuntimeBundles(repoRoot, webDir, version);
  await Deno.writeTextFile(
    join(webDir, "index.html"),
    renderLibraryWebIndex(version),
  );
  await Deno.writeTextFile(join(webDir, loc.assets.importMap), importMap);
  for (const bundle of loc.assets.bundles) {
    const bytes = await Deno.readFile(join(webDir, bundle.file));
    await Deno.writeFile(join(uploadDir, bundle.file), bytes);
    console.log(`Wrote ${bundle.file} (${bytes.byteLength} bytes)`);
  }
  console.log(`Library release assets ready in ${outDir}`);
}

if (import.meta.main) {
  const outArg = Deno.args[0] ?? "dist/library-release";
  const outDir = outArg.startsWith("/") ? outArg : resolve(root, outArg);
  await packLibrary(root, outDir);
}
