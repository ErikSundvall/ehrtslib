import { assert, assertEquals } from "@std/assert";
import { dirname, fromFileUrl, join } from "@std/path";
import { unzipSync } from "fflate";
import {
  cdnImportMap,
  importsMissingFromPack,
  isExcludedSourcePath,
  LIBRARY_CLOSURE_ROOTS,
  libraryDenoJson,
  libraryLocations,
  listLibraryDevFiles,
  listLibrarySourceFiles,
  relativeImportClosure,
  renderLibraryReleaseNotes,
  renderLibraryWebIndex,
  stageLibraryTree,
  zipTree,
} from "./library_package.ts";
import { readPackageVersion, releaseTagForVersion } from "./release_version.ts";

const root = join(dirname(fromFileUrl(import.meta.url)), "..");

Deno.test("source pack covers the import closure and leaves the rest of the repo out", async () => {
  const sourceFiles = await listLibrarySourceFiles(root);
  const closure = await relativeImportClosure(root, LIBRARY_CLOSURE_ROOTS);
  assertEquals(importsMissingFromPack(closure, sourceFiles), []);

  for (const rel of sourceFiles) {
    assert(
      !isExcludedSourcePath(rel),
      `source pack should omit ${rel}`,
    );
  }

  const packed = new Set(sourceFiles);
  for (
    const required of [
      "mod.ts",
      "openehr_rm.ts",
      "parser/mod.ts",
      "serialization/mod.ts",
      "generation/mod.ts",
      "validation/mod.ts",
      "meta/mod.ts",
      "spec/mod.ts",
      "terminology_data/openehr_terminology_en.xml",
      "terminology_data/PropertyUnitData.xml",
      "LICENSE",
    ]
  ) {
    assert(packed.has(required), `missing ${required}`);
  }

  assert(!packed.has("examples/README.md"));
  assert(!packed.has("docs/getting-started.md"));
  assert(!sourceFiles.some((rel) => rel.startsWith("scripts/")));
  assert(!sourceFiles.some((rel) => rel.startsWith("scratch")));
});

Deno.test("development pack adds docs and still omits built webapps", async () => {
  const devFiles = new Set(await listLibraryDevFiles(root));
  assert(devFiles.has("docs/getting-started.md"));
  assert(devFiles.has("docs/library-package.md"));
  assert(devFiles.has("README.md"));
  assert(devFiles.has("mod.ts"));
  assert(![...devFiles].some((rel) => rel.startsWith("docs/demo/")));
  assert(![...devFiles].some((rel) => rel.startsWith("docs/taaat/")));
  assert(![...devFiles].some((rel) => rel.startsWith("examples/")));
  assert(!devFiles.has("scripts/release.ts"));
});

Deno.test("staged source zip ships deno.json, the guide, and no examples", async () => {
  const temp = await Deno.makeTempDir({ prefix: "ehrtslib-pack-" });
  const repoDeno = await Deno.readTextFile(join(root, "deno.json"));
  const version = (JSON.parse(repoDeno) as { version: string }).version;
  const sourceFiles = await listLibrarySourceFiles(root);
  const dest = join(temp, "source");
  await stageLibraryTree(root, dest, sourceFiles, {
    "deno.json": libraryDenoJson(repoDeno),
    "import-map.json": cdnImportMap(version, repoDeno),
    "LIBRARY_PACKAGE.md": await Deno.readTextFile(
      join(root, "docs/library-package.md"),
    ),
  });
  const names = Object.keys(unzipSync(await zipTree(dest))).map((name) =>
    name.replace(/^ehrtslib\//, "")
  );
  assert(names.includes("deno.json"));
  assert(names.includes("LIBRARY_PACKAGE.md"));
  assert(names.includes("parser/mod.ts"));
  assert(names.includes("spec/mod.ts"));
  assert(!names.some((name) => name.startsWith("examples/")));
  assert(!names.some((name) => name.startsWith("docs/")));
  assert(!names.some((name) => name.startsWith(".cursor/")));

  const denoJson = JSON.parse(
    new TextDecoder().decode(
      unzipSync(await zipTree(dest))["ehrtslib/deno.json"],
    ),
  );
  assertEquals(denoJson.version, version);
  assertEquals(typeof denoJson.imports.yaml, "string");
  assertEquals(typeof denoJson.imports["fast-xml-parser"], "string");
  assertEquals(denoJson.tasks, undefined);

  const importMap = JSON.parse(cdnImportMap(version, repoDeno)) as {
    imports: Record<string, string>;
  };
  const tag = releaseTagForVersion("library", version);
  assertEquals(
    importMap.imports["ehrtslib/"],
    `https://cdn.jsdelivr.net/gh/ErikSundvall/ehrtslib@${tag}/`,
  );
  assert(importMap.imports.yaml.startsWith("npm:yaml@"));
});

Deno.test("release notes and Pages index name the archives and import URLs", async () => {
  const version = await readPackageVersion("library");
  const loc = libraryLocations(version);
  const notes = renderLibraryReleaseNotes(version);
  assert(notes.includes(loc.assets.sourceZip));
  assert(notes.includes(loc.assets.devZip));
  assert(notes.includes(`${loc.cdnDir}/mod.ts`));
  assert(notes.includes(`${loc.cdnDir}/openehr_am.ts`));
  assert(notes.includes(`${loc.cdnDir}/meta/mod.ts`));
  assert(notes.includes(`${loc.cdnDir}/spec/mod.ts`));
  assert(notes.includes(`${loc.pagesDir}/`));
  assert(notes.includes(`${loc.rawDir}/mod.ts`));
  assert(notes.includes("tree-shake"));
  assert(
    notes.includes("| Bundle | GitHub Pages | Release download | jsDelivr |"),
  );
  for (const bundle of loc.assets.bundles) {
    assert(notes.includes(`[${bundle.file}](${loc.pagesDir}/${bundle.file})`));
    assert(
      notes.includes(`[\`${bundle.entry}\`](${loc.cdnDir}/${bundle.entry})`),
    );
  }

  const html = renderLibraryWebIndex(version);
  assert(html.includes(loc.assets.bundles[0].file));
  assert(html.includes(loc.assets.importMap));
  assert(html.includes("tree-shake"));
  assert(html.includes(`<a href="${loc.assets.bundles[2].file}">`));
  assert(html.includes(`${loc.cdnDir}/parser/mod.ts`));
  assert(html.includes(`${loc.cdnDir}/openehr_am.ts`));
  assert(html.includes("jsDelivr (TypeScript on the git tag)"));
});
