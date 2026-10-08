/**
 * Library release sets: TypeScript source, development tree, and runtime bundles.
 *
 * The source set is what a Deno consumer imports. The development set adds docs.
 * Runtime bundles are single-file ESM builds for a web page or a one-URL import.
 */
import { emptyDir, ensureDir, walk } from "@std/fs";
import { dirname, join, relative, resolve } from "@std/path";
import { zipSync } from "fflate";
import { releaseTagForVersion } from "./release_version.ts";

export const GITHUB_REPO = "ErikSundvall/ehrtslib";
export const PAGES_ORIGIN = "https://eriksundvall.github.io/ehrtslib";
export const PACKAGE_GUIDE_PATH = "docs/library-package.md";

/** Public entry files a consumer imports from the package root. */
export const LIBRARY_ENTRY_FILES = [
  "mod.ts",
  "openehr_am.ts",
  "openehr_base.ts",
  "openehr_lang.ts",
  "openehr_rm.ts",
  "openehr_term.ts",
] as const;

/** Directories the library loads. `generated/` is not part of this closure. */
export const LIBRARY_PACKAGES = [
  "am",
  "base",
  "generation",
  "lang",
  "meta",
  "parser",
  "rm",
  "serialization",
  "spec",
  "term",
  "terminology_data",
  "validation",
] as const;

/**
 * Modules the packed tree must be able to import without the rest of the repo.
 * `spec/` is a direct import (`spec/mod.ts`); it is not re-exported by `mod.ts`.
 */
export const LIBRARY_CLOSURE_ROOTS = [
  ...LIBRARY_ENTRY_FILES,
  "parser/mod.ts",
  "serialization/mod.ts",
  "generation/mod.ts",
  "validation/mod.ts",
  "meta/mod.ts",
  "spec/mod.ts",
] as const;

/** Top-level paths that belong to the repository, not the published library. */
export const SOURCE_EXCLUDED_PREFIXES = [
  "examples/",
  "scratch",
  "docs/",
  ".cursor/",
  "archive/",
  "grammars/",
  "test_data/",
  "tools/",
  "tasks/",
  "scripts/",
  "generated/",
] as const;

export interface RuntimeBundle {
  id: string;
  entry: string;
  file: string;
  /** Short label for release notes and the Pages index. */
  label: string;
}

export interface LibraryAssetNames {
  sourceZip: string;
  devZip: string;
  importMap: string;
  bundles: RuntimeBundle[];
}

export function libraryAssetNames(version: string): LibraryAssetNames {
  const prefix = `ehrtslib-${version}`;
  return {
    sourceZip: `${prefix}-source.zip`,
    devZip: `${prefix}-dev.zip`,
    importMap: `${prefix}.import-map.json`,
    bundles: [
      {
        id: "full",
        entry: "mod.ts",
        file: `${prefix}.min.js`,
        label: "Full barrel (`mod.ts`)",
      },
      {
        id: "rm",
        entry: "openehr_rm.ts",
        file: `${prefix}-rm.min.js`,
        label: "Reference Model (`openehr_rm.ts`)",
      },
      {
        id: "parser",
        entry: "parser/mod.ts",
        file: `${prefix}-parser.min.js`,
        label: "ADL / OPT parser (`parser/mod.ts`)",
      },
      {
        id: "serialization",
        entry: "serialization/mod.ts",
        file: `${prefix}-serialization.min.js`,
        label: "Serializers (`serialization/mod.ts`)",
      },
    ],
  };
}

export interface LibraryLocations {
  version: string;
  tag: string;
  assets: LibraryAssetNames;
  /** GitHub Pages directory for the runtime bundles. */
  pagesDir: string;
  /** GitHub Release download prefix (redirects to the release asset host). */
  downloadDir: string;
  /** jsDelivr CDN in front of this git tag. */
  cdnDir: string;
  /** GitHub raw file host for this git tag. */
  rawDir: string;
  guideUrl: string;
}

export function libraryLocations(version: string): LibraryLocations {
  const tag = releaseTagForVersion("library", version);
  return {
    version,
    tag,
    assets: libraryAssetNames(version),
    pagesDir: `${PAGES_ORIGIN}/lib/${tag}`,
    downloadDir: `https://github.com/${GITHUB_REPO}/releases/download/${tag}`,
    cdnDir: `https://cdn.jsdelivr.net/gh/${GITHUB_REPO}@${tag}`,
    rawDir: `https://raw.githubusercontent.com/${GITHUB_REPO}/${tag}`,
    guideUrl:
      `https://github.com/${GITHUB_REPO}/blob/${tag}/${PACKAGE_GUIDE_PATH}`,
  };
}

export function isExcludedSourcePath(rel: string): boolean {
  const norm = rel.replaceAll("\\", "/");
  return SOURCE_EXCLUDED_PREFIXES.some((prefix) => {
    if (prefix.endsWith("/")) return norm.startsWith(prefix);
    return norm === prefix || norm.startsWith(`${prefix}/`) ||
      norm.startsWith(prefix);
  });
}

function shouldSkipPackedFile(rel: string): boolean {
  const norm = rel.replaceAll("\\", "/");
  const parts = norm.split("/");
  if (parts.includes("node_modules")) return true;
  if (parts.includes("examples")) return true;
  if (norm.endsWith(".test.ts")) return true;
  if (norm.startsWith("docs/demo/") || norm.startsWith("docs/taaat/")) {
    return true;
  }
  return false;
}

async function listTreeFiles(root: string, relDir: string): Promise<string[]> {
  const abs = join(root, relDir);
  const out: string[] = [];
  for await (const entry of walk(abs, { includeDirs: false })) {
    const rel = relative(root, entry.path).replaceAll("\\", "/");
    if (shouldSkipPackedFile(rel)) continue;
    out.push(rel);
  }
  return out;
}

/** Files copied into the source archive, before generated `deno.json`. */
export async function listLibrarySourceFiles(root: string): Promise<string[]> {
  const files = new Set<string>(LIBRARY_ENTRY_FILES);
  files.add("LICENSE");
  for (const dir of LIBRARY_PACKAGES) {
    for (const rel of await listTreeFiles(root, dir)) files.add(rel);
  }
  return [...files].sort();
}

/** Source files plus repository docs (built demo / TAAAT sites stay out). */
export async function listLibraryDevFiles(root: string): Promise<string[]> {
  const files = new Set(await listLibrarySourceFiles(root));
  for (const extra of ["README.md", "CONTRIBUTING.md"]) {
    try {
      await Deno.stat(join(root, extra));
      files.add(extra);
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) throw error;
    }
  }
  for (const rel of await listTreeFiles(root, "docs")) {
    if (shouldSkipPackedFile(rel)) continue;
    files.add(rel);
  }
  return [...files].sort();
}

const SPECIFIER_RE = /(?:from\s+|import\s*\(\s*|import\s+)["']([^"']+)["']/g;

/** Drop comments so sample snippets in JSDoc are not treated as imports. */
export function stripSourceComments(text: string): string {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:"'])\/\/.*$/gm, "$1");
}

export function specifiersInSource(text: string): string[] {
  const out: string[] = [];
  for (const match of stripSourceComments(text).matchAll(SPECIFIER_RE)) {
    const spec = match[1];
    if (spec) out.push(spec);
  }
  return out;
}

function fileExists(path: string): boolean {
  try {
    return Deno.statSync(path).isFile;
  } catch {
    return false;
  }
}

function directoryExists(path: string): boolean {
  try {
    return Deno.statSync(path).isDirectory;
  } catch {
    return false;
  }
}

/** Resolve a relative specifier from an absolute source file. */
export function resolveRelativeSpecifier(
  fromAbs: string,
  spec: string,
): string {
  const target = resolve(dirname(fromAbs), spec);
  if (directoryExists(target)) return join(target, "mod.ts");
  if (fileExists(target)) return target;
  for (const ext of [".ts", ".tsx", ".js", ".json", ".wasm"]) {
    if (fileExists(target + ext)) return target + ext;
  }
  if (fileExists(join(target, "mod.ts"))) return join(target, "mod.ts");
  return target.endsWith(".ts") ? target : `${target}.ts`;
}

/** Relative module graph reached from `entryRels`, following local specifiers. */
export async function relativeImportClosure(
  root: string,
  entryRels: readonly string[],
): Promise<Set<string>> {
  const seen = new Set<string>();
  const queue = [...entryRels];
  while (queue.length > 0) {
    const rel = queue.pop();
    if (!rel || seen.has(rel)) continue;
    seen.add(rel);
    const abs = join(root, rel);
    let text: string;
    try {
      text = await Deno.readTextFile(abs);
    } catch {
      continue;
    }
    for (const spec of specifiersInSource(text)) {
      if (!spec.startsWith(".")) continue;
      const nextAbs = resolveRelativeSpecifier(abs, spec);
      // Generated snippets and prose name modules that are not files next to
      // the source. A real import always resolves to a file on disk.
      if (!fileExists(nextAbs)) continue;
      const nextRel = relative(root, nextAbs).replaceAll("\\", "/");
      if (!seen.has(nextRel)) queue.push(nextRel);
    }
  }
  return seen;
}

export function importsMissingFromPack(
  closure: Iterable<string>,
  packed: Iterable<string>,
): string[] {
  const have = new Set(packed);
  return [...closure].filter((rel) => !have.has(rel)).sort();
}

/** `deno.json` shipped inside the archives: name, version, exports, import map. */
export function libraryDenoJson(repoDenoText: string): string {
  const parsed = JSON.parse(repoDenoText) as {
    name?: string;
    version?: string;
    exports?: string;
    imports?: Record<string, string>;
  };
  if (!parsed.version) throw new Error("deno.json is missing version");
  return JSON.stringify(
    {
      name: parsed.name ?? "ehrtslib",
      version: parsed.version,
      exports: parsed.exports ?? "./mod.ts",
      imports: parsed.imports ?? {},
    },
    null,
    2,
  ) + "\n";
}

/**
 * Import map for `deno run --import-map=…`.
 * `ehrtslib/` points at the git tag on jsDelivr; `yaml` and `fast-xml-parser`
 * stay on the same pins as the repository import map.
 */
export function cdnImportMap(version: string, repoDenoText: string): string {
  const { cdnDir } = libraryLocations(version);
  const parsed = JSON.parse(repoDenoText) as {
    imports?: Record<string, string>;
  };
  const imports = parsed.imports ?? {};
  const out: Record<string, string> = {
    "ehrtslib/": `${cdnDir}/`,
  };
  for (const key of ["fast-xml-parser", "yaml"]) {
    const value = imports[key];
    if (value) out[key] = value;
  }
  return JSON.stringify({ imports: out }, null, 2) + "\n";
}

export function runtimeBundleBanner(version: string): string {
  const loc = libraryLocations(version);
  return [
    `/*! ehrtslib ${version} (${loc.tag}) | Apache-2.0 | https://github.com/${GITHUB_REPO}`,
    " * Minified runtime bundle (whitespace and syntax). Identifiers are kept readable.",
    " * Applications that bundle their own code should use the source package and tree-shake.",
    ` * ${loc.guideUrl}`,
    " */",
  ].join("\n");
}

export async function stageLibraryTree(
  root: string,
  dest: string,
  files: readonly string[],
  extraText: Record<string, string> = {},
): Promise<void> {
  await emptyDir(dest);
  for (const rel of files) {
    const target = join(dest, rel);
    await ensureDir(dirname(target));
    await Deno.copyFile(join(root, rel), target);
  }
  for (const [rel, text] of Object.entries(extraText)) {
    const target = join(dest, rel);
    await ensureDir(dirname(target));
    await Deno.writeTextFile(target, text);
  }
}

/** Zip `dir` so the archive root is `ehrtslib/`. */
export async function zipTree(
  dir: string,
  archiveRoot = "ehrtslib",
): Promise<Uint8Array> {
  const files: Record<string, Uint8Array> = {};
  for await (const entry of walk(dir, { includeDirs: false })) {
    const rel = relative(dir, entry.path).replaceAll("\\", "/");
    files[`${archiveRoot}/${rel}`] = await Deno.readFile(entry.path);
  }
  if (Object.keys(files).length === 0) {
    throw new Error(`Refusing to zip an empty tree at ${dir}`);
  }
  return zipSync(files, { level: 6 });
}

function esc(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function renderLibraryReleaseNotes(version: string): string {
  const loc = libraryLocations(version);
  const { assets } = loc;
  const bundleRows = assets.bundles.map((bundle) => {
    const pages = `${loc.pagesDir}/${bundle.file}`;
    const download = `${loc.downloadDir}/${bundle.file}`;
    return `| ${bundle.label} | [${bundle.file}](${pages}) | [${bundle.file}](${download}) |`;
  }).join("\n");

  return `# ehrtslib ${version} (\`${loc.tag}\`)

Three release sets are attached to this GitHub Release. A git checkout of \`${loc.tag}\` remains the developer tree (library, demo, TAAAT, tests, and maintainer scripts). Importing the library uses the sets below.

Guide: [${PACKAGE_GUIDE_PATH}](${loc.guideUrl})

## Source package

[\`${assets.sourceZip}\`](${loc.downloadDir}/${assets.sourceZip}) is the TypeScript library: public entries, the runtime packages (\`am/\`, \`base/\`, \`rm/\`, \`lang/\`, \`meta/\`, \`parser/\`, \`generation/\`, \`serialization/\`, \`spec/\`, \`term/\`, \`validation/\`, \`terminology_data/\`), the \`deno.json\` import map, and \`LICENSE\`.

Applications that ship a bundle should unpack this archive and tree-shake it in their own bundler.

\`\`\`json
{
  "imports": {
    "ehrtslib/": "./vendor/ehrtslib/"
  }
}
\`\`\`

\`\`\`ts
import { rm, parser, serialization, generation, validation, meta } from "ehrtslib/mod.ts";
import * as spec from "ehrtslib/spec/mod.ts";
\`\`\`

The same modules are importable from the git tag. [jsDelivr](https://www.jsdelivr.com/github) is a CDN in front of GitHub:

\`\`\`ts
import { rm } from "${loc.cdnDir}/mod.ts";
\`\`\`

[\`${assets.importMap}\`](${loc.downloadDir}/${assets.importMap}) maps \`ehrtslib/\` to that CDN URL and pins \`yaml\` and \`fast-xml-parser\` to the versions in \`deno.json\`.

GitHub raw files (no extra CDN): \`${loc.rawDir}/mod.ts\`

\`terminology_data/\` paths are read from the process working directory (\`terminology_data/openehr_terminology_en.xml\`, and the other terminology XML files in that folder).

## Development package

[\`${assets.devZip}\`](${loc.downloadDir}/${assets.devZip}) is the source package plus \`docs/\`, \`README.md\`, and \`CONTRIBUTING.md\`. Built demo and TAAAT sites are omitted; those ship on their own tags.

## Runtime bundles

Single-file ESM for a web page or a one-URL Deno import. Minified for transfer size (whitespace and syntax). Identifiers stay readable. Prefer the source package when the application has its own bundler.

GitHub Pages serves the files with a JavaScript content type at [\`${loc.pagesDir}/\`](${loc.pagesDir}/). The copies on this Release download from \`${loc.downloadDir}/\` (GitHub redirects those to its release-asset host).

| Bundle | GitHub Pages | Release download |
| --- | --- | --- |
${bundleRows}

\`\`\`html
<script type="module">
  import { rm } from "${loc.pagesDir}/${assets.bundles[0].file}";
</script>
\`\`\`

\`\`\`ts
import { parseAdl } from "${loc.pagesDir}/${assets.bundles[2].file}";
\`\`\`
`;
}

export function renderLibraryWebIndex(version: string): string {
  const loc = libraryLocations(version);
  const { assets } = loc;
  const rows = assets.bundles.map((bundle) => {
    return `<li><a href="${esc(bundle.file)}">${esc(bundle.file)}</a> — ${
      esc(bundle.label)
    }</li>`;
  }).join("\n");
  const full = assets.bundles[0].file;
  const parser = assets.bundles[2].file;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>ehrtslib ${esc(version)} (${esc(loc.tag)})</title>
  <style>
    body { font: 16px/1.5 system-ui, sans-serif; max-width: 72ch; margin: 2rem auto; padding: 0 1rem; color: #1f2328; }
    code, pre { font-family: ui-monospace, SFMono-Regular, Consolas, monospace; }
    pre { background: #f6f8fa; padding: 0.75rem 1rem; overflow: auto; }
    a { color: #0969da; }
  </style>
</head>
<body>
  <h1>ehrtslib ${esc(version)}</h1>
  <p>Runtime bundles for <code>${
    esc(loc.tag)
  }</code>. These files are minified for transfer size. Applications that bundle their own code should use the source package and tree-shake. <a href="${
    esc(loc.guideUrl)
  }">Package guide</a>.</p>
  <ul>
    ${rows}
    <li><a href="${esc(assets.importMap)}">${
    esc(assets.importMap)
  }</a> — Deno import map for the git tag on jsDelivr</li>
  </ul>
  <h2>Web page</h2>
  <pre><code>&lt;script type="module"&gt;
  import { rm } from "${esc(loc.pagesDir)}/${esc(full)}";
&lt;/script&gt;</code></pre>
  <h2>Deno</h2>
  <pre><code>import { parseAdl } from "${esc(loc.pagesDir)}/${
    esc(parser)
  }";</code></pre>
  <h2>Source on the git tag</h2>
  <p>jsDelivr CDN: <a href="${esc(loc.cdnDir)}/mod.ts"><code>${
    esc(loc.cdnDir)
  }/mod.ts</code></a></p>
  <p>GitHub raw: <a href="${esc(loc.rawDir)}/mod.ts"><code>${
    esc(loc.rawDir)
  }/mod.ts</code></a></p>
  <p>Release archives: <a href="${esc(loc.downloadDir)}/${
    esc(assets.sourceZip)
  }">${esc(assets.sourceZip)}</a> · <a href="${esc(loc.downloadDir)}/${
    esc(assets.devZip)
  }">${esc(assets.devZip)}</a></p>
</body>
</html>
`;
}
