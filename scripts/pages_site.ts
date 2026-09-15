/**
 * Assemble GitHub Pages deploy trees with immutable version subdirectories.
 *
 * Modelled on intEHRgrator `scripts/pages_site.ts`: the site root (`/demo/`,
 * `/taaat/`) is bleeding-edge; each `deno task release` freezes that webapp
 * under a sibling path (`/demo-v0.2/`, `/taaat-v0.1/`) that later deploys
 * wget-mirror and never overwrite.
 */
import { copy, emptyDir, ensureDir, walk } from "@std/fs";
import { dirname, isAbsolute, join } from "@std/path";
import { readPackageVersion, type ReleasePackage } from "./release_version.ts";

export const PAGES_SITE_URL = "https://eriksundvall.github.io/ehrtslib";
export const VERSIONS_MANIFEST = "versions.json";

export interface PackageManifest {
  versions: string[];
  recommended?: string;
}

export interface VersionsManifest {
  library: { current: string } & PackageManifest;
  demo: PackageManifest;
  taaat: PackageManifest;
}

export function emptyManifest(libraryCurrent = "0.0.0"): VersionsManifest {
  return {
    library: { current: libraryCurrent, versions: [] },
    demo: { versions: [] },
    taaat: { versions: [] },
  };
}

export function pickRecommendedVersion(
  versions: string[],
  opts: { override?: string; previous?: string } = {},
): string | undefined {
  if (opts.override && versions.includes(opts.override)) return opts.override;
  if (opts.previous && versions.includes(opts.previous)) return opts.previous;
  return versions[0];
}

function normalizePackage(
  raw: unknown,
  tagPrefix: string,
): PackageManifest {
  if (!raw || typeof raw !== "object") return { versions: [] };
  const versionsIn = (raw as PackageManifest).versions;
  if (!Array.isArray(versionsIn)) return { versions: [] };
  const prefixRe = new RegExp(`^${tagPrefix}\\d`);
  const versions = [
    ...new Set(
      versionsIn.filter((v) => typeof v === "string" && prefixRe.test(v)),
    ),
  ].sort().reverse();
  const rawRecommended = (raw as PackageManifest).recommended;
  const recommended =
    typeof rawRecommended === "string" && versions.includes(rawRecommended)
      ? rawRecommended
      : undefined;
  return recommended ? { versions, recommended } : { versions };
}

export function normalizeManifest(
  raw: unknown,
  libraryCurrent = "0.0.0",
): VersionsManifest {
  const base = emptyManifest(libraryCurrent);
  if (!raw || typeof raw !== "object") return base;
  const rec = raw as Record<string, unknown>;
  const libRaw = rec.library;
  let current = libraryCurrent;
  if (libRaw && typeof libRaw === "object") {
    const c = (libRaw as { current?: unknown }).current;
    if (typeof c === "string" && c.trim()) current = c.trim();
  }
  const libraryPkg = normalizePackage(rec.library, "v");
  return {
    library: { current, ...libraryPkg },
    demo: normalizePackage(rec.demo, "demo-v"),
    taaat: normalizePackage(rec.taaat, "taaat-v"),
  };
}

export async function readVersionsManifest(
  path: string,
  libraryCurrent?: string,
): Promise<VersionsManifest> {
  try {
    const text = await Deno.readTextFile(path);
    return normalizeManifest(JSON.parse(text), libraryCurrent);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return emptyManifest(libraryCurrent);
    }
    throw error;
  }
}

export async function writeVersionsManifest(
  path: string,
  manifest: VersionsManifest,
): Promise<void> {
  const normalized = normalizeManifest(manifest, manifest.library.current);
  await ensureDir(dirname(path));
  await Deno.writeTextFile(path, `${JSON.stringify(normalized, null, 2)}\n`);
}

export async function fetchVersionsManifest(
  baseUrl: string,
  libraryCurrent?: string,
): Promise<VersionsManifest> {
  try {
    const res = await fetch(`${baseUrl}/${VERSIONS_MANIFEST}`);
    if (!res.ok) return emptyManifest(libraryCurrent);
    return normalizeManifest(await res.json(), libraryCurrent);
  } catch {
    return emptyManifest(libraryCurrent);
  }
}

/** Path segments under the host in `baseUrl` (ehrtslib → 1; user site → 0). */
export function pagesRepoPathDepth(baseUrl: string): number {
  const path = new URL(baseUrl).pathname.replace(/^\/+|\/+$/g, "");
  if (!path) return 0;
  return path.split("/").filter(Boolean).length;
}

async function runWget(args: string[]): Promise<void> {
  const status = await new Deno.Command("wget", {
    args,
    stdout: "inherit",
    stderr: "inherit",
  }).output();
  // 8 = some files missing on partial mirrors; acceptable for Pages trees.
  if (!status.success && status.code !== 8) {
    throw new Error(`wget failed (exit ${status.code})`);
  }
}

/** Flatten wget output when it nests under the final URL path segment. */
export async function flattenWgetNest(
  dest: string,
  nestedName: string,
): Promise<void> {
  const nested = join(dest, nestedName);
  try {
    await Deno.stat(nested);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return;
    throw error;
  }
  for await (const entry of walk(nested, { includeDirs: false })) {
    const rel = entry.path.slice(nested.length + 1);
    const target = join(dest, rel);
    await ensureDir(dirname(target));
    await Deno.rename(entry.path, target);
  }
  await Deno.remove(nested, { recursive: true });
}

export async function versionHasIndex(
  root: string,
  tag: string,
): Promise<boolean> {
  try {
    const st = await Deno.stat(join(root, tag, "index.html"));
    return st.isFile;
  } catch {
    return false;
  }
}

export async function copyDirContents(
  src: string,
  dest: string,
): Promise<void> {
  await ensureDir(dest);
  for await (const entry of Deno.readDir(src)) {
    await copy(join(src, entry.name), join(dest, entry.name), {
      overwrite: true,
    });
  }
}

/** Mirror the live Pages site (root + frozen versions) into dest. */
export async function mirrorLiveSite(
  baseUrl: string,
  dest: string,
): Promise<void> {
  await emptyDir(dest);
  await ensureDir(dest);
  const cut = pagesRepoPathDepth(baseUrl);
  const args = ["-q", "-r", "-np", "-nH"];
  if (cut > 0) args.push(`--cut-dirs=${cut}`);
  args.push("-P", dest, `${baseUrl}/`);
  await runWget(args);
  const repoSeg = new URL(baseUrl).pathname.replace(/^\/+|\/+$/g, "")
    .split("/").filter(Boolean).pop();
  if (repoSeg) await flattenWgetNest(dest, repoSeg);
}

/**
 * Mirror a single frozen version subdirectory from the live Pages site.
 * Fails if `index.html` is missing so we never publish empty version dirs.
 */
export async function mirrorVersionSubdir(
  baseUrl: string,
  tag: string,
  destRoot: string,
): Promise<void> {
  const dest = join(destRoot, tag);
  await emptyDir(dest);
  await ensureDir(dest);
  const cut = pagesRepoPathDepth(baseUrl) + 1;
  const args = [
    "-q",
    "-r",
    "-np",
    "-nH",
    `--cut-dirs=${cut}`,
    "-P",
    dest,
    `${baseUrl}/${tag}/`,
  ];
  await runWget(args);
  const repoSeg = new URL(baseUrl).pathname.replace(/^\/+|\/+$/g, "")
    .split("/").filter(Boolean).pop();
  if (repoSeg) await flattenWgetNest(dest, repoSeg);
  await flattenWgetNest(dest, tag);

  if (!(await versionHasIndex(destRoot, tag))) {
    throw new Error(
      `Failed to mirror frozen Pages version /${tag}/ — index.html missing after wget`,
    );
  }
}

async function preserveFrozenTags(
  baseUrl: string,
  outDir: string,
  tags: string[],
): Promise<string[]> {
  const preserved: string[] = [];
  for (const tag of tags) {
    try {
      if (await versionHasIndex(outDir, tag)) {
        preserved.push(tag);
        continue;
      }
      await mirrorVersionSubdir(baseUrl, tag, outDir);
      preserved.push(tag);
    } catch (error) {
      console.warn(
        `Dropping frozen Pages version ${tag}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      try {
        await Deno.remove(join(outDir, tag), { recursive: true });
      } catch {
        // ignore cleanup errors
      }
    }
  }
  return preserved;
}

export interface RecommendedOverrides {
  demo?: string;
  taaat?: string;
  library?: string;
}

function withRecommended(
  pkg: PackageManifest,
  override: string | undefined,
  previous: string | undefined,
): PackageManifest {
  const recommended = pickRecommendedVersion(pkg.versions, {
    override,
    previous,
  });
  return recommended ? { versions: pkg.versions, recommended } : pkg;
}

/**
 * Main-branch deploy: publish bleeding-edge `docs/` and keep frozen version
 * sibling directories (`demo-v…`, `taaat-v…`).
 */
export async function assembleMainPagesSite(opts: {
  baseUrl: string;
  docsDir: string;
  outDir: string;
  recommended?: RecommendedOverrides;
}): Promise<VersionsManifest> {
  const libraryCurrent = await readPackageVersion("library");
  await emptyDir(opts.outDir);
  await copyDirContents(opts.docsDir, opts.outDir);

  const listed = await fetchVersionsManifest(opts.baseUrl, libraryCurrent);
  const demoKept = await preserveFrozenTags(
    opts.baseUrl,
    opts.outDir,
    listed.demo.versions,
  );
  const taaatKept = await preserveFrozenTags(
    opts.baseUrl,
    opts.outDir,
    listed.taaat.versions,
  );

  const manifest = normalizeManifest({
    library: {
      current: libraryCurrent,
      versions: listed.library.versions,
      recommended: pickRecommendedVersion(listed.library.versions, {
        override: opts.recommended?.library,
        previous: listed.library.recommended,
      }),
    },
    demo: withRecommended(
      { versions: demoKept },
      opts.recommended?.demo,
      listed.demo.recommended,
    ),
    taaat: withRecommended(
      { versions: taaatKept },
      opts.recommended?.taaat,
      listed.taaat.recommended,
    ),
  }, libraryCurrent);
  await writeVersionsManifest(join(opts.outDir, VERSIONS_MANIFEST), manifest);
  return manifest;
}

/**
 * Release deploy: add an immutable version subdirectory without replacing
 * other frozen copies. Library releases only update the manifest.
 */
export async function assembleReleasePagesSite(opts: {
  baseUrl: string;
  pkg: ReleasePackage;
  versionTag: string;
  /** Built webapp dir (`docs/demo` or `docs/taaat`); unused for library. */
  appDist?: string;
  outDir: string;
  docsDir: string;
  recommended?: RecommendedOverrides;
}): Promise<VersionsManifest> {
  const libraryCurrent = await readPackageVersion("library");
  const listed = await fetchVersionsManifest(opts.baseUrl, libraryCurrent);
  const key = opts.pkg;
  if (key !== "library" && listed[key].versions.includes(opts.versionTag)) {
    throw new Error(
      `GitHub Pages version ${opts.versionTag} already exists — release web builds are immutable`,
    );
  }

  try {
    await mirrorLiveSite(opts.baseUrl, opts.outDir);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    if (key === "library") {
      throw new Error(
        `Live Pages mirror failed during a library release (${reason}). ` +
          "Refusing to seed from docs/ so /demo/ and /taaat/ are not wiped.",
      );
    }
    console.warn(
      `Live Pages mirror failed (${reason}); seeding from docs/`,
    );
    await emptyDir(opts.outDir);
    await copyDirContents(opts.docsDir, opts.outDir);
  }

  if (!(await fileExists(join(opts.outDir, "index.html")))) {
    await copyDirContents(opts.docsDir, opts.outDir);
  }

  const demoKept = await preserveFrozenTags(
    opts.baseUrl,
    opts.outDir,
    listed.demo.versions,
  );
  const taaatKept = await preserveFrozenTags(
    opts.baseUrl,
    opts.outDir,
    listed.taaat.versions,
  );

  if (key !== "library") {
    if (await versionHasIndex(opts.outDir, opts.versionTag)) {
      throw new Error(
        `GitHub Pages path /${opts.versionTag}/ already exists — release web builds are immutable`,
      );
    }
    const dist = opts.appDist;
    if (!dist) throw new Error(`appDist is required for ${key} releases`);
    await copyDirContents(dist, join(opts.outDir, opts.versionTag));
    if (!(await versionHasIndex(opts.outDir, opts.versionTag))) {
      throw new Error(
        `Release dist for ${opts.versionTag} is missing index.html`,
      );
    }
  }

  const demoVersions = key === "demo"
    ? [...demoKept, opts.versionTag]
    : demoKept;
  const taaatVersions = key === "taaat"
    ? [...taaatKept, opts.versionTag]
    : taaatKept;
  const libraryVersions = key === "library"
    ? [...listed.library.versions, opts.versionTag]
    : listed.library.versions;

  const next = normalizeManifest({
    library: {
      current: libraryCurrent,
      versions: libraryVersions,
      recommended: pickRecommendedVersion(libraryVersions, {
        override: opts.recommended?.library,
        previous: listed.library.recommended,
      }),
    },
    demo: withRecommended(
      { versions: demoVersions },
      opts.recommended?.demo,
      listed.demo.recommended,
    ),
    taaat: withRecommended(
      { versions: taaatVersions },
      opts.recommended?.taaat,
      listed.taaat.recommended,
    ),
  }, libraryCurrent);
  await writeVersionsManifest(join(opts.outDir, VERSIONS_MANIFEST), next);
  return next;
}

async function fileExists(path: string): Promise<boolean> {
  try {
    const st = await Deno.stat(path);
    return st.isFile;
  } catch {
    return false;
  }
}

export function frozenPagesPath(pkg: ReleasePackage, tag: string): string {
  if (pkg === "library") return "";
  return `${tag}/`;
}

/** Join a CLI path to the repo root unless the caller already passed an absolute path. */
export function resolveCliPath(root: string, path: string): string {
  return isAbsolute(path) ? path : join(root, path);
}
