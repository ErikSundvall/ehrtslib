/**
 * Shared release version helpers for the ehrtslib library, demo app, and TAAAT.
 *
 * Tag shapes follow intEHRgrator (`v0.6` when patch is 0, else `v0.6.1`), with a
 * package prefix for the two GitHub Pages webapps:
 *   library  → v0.1 / v0.1.1
 *   demo     → demo-v0.1 / demo-v0.1.1
 *   taaat    → taaat-v0.1 / taaat-v0.1.1
 */
import { dirname, fromFileUrl, join } from "@std/path";

const root = join(dirname(fromFileUrl(import.meta.url)), "..");

export type ReleasePackage = "library" | "demo" | "taaat";

export interface PackageConfig {
  id: ReleasePackage;
  /** Human label for logs and GitHub Release titles. */
  label: string;
  /** deno.json that stores this package's `"version"`. */
  versionFile: string;
  /** Git tag prefix; library uses `v`, apps use `demo-v` / `taaat-v`. */
  tagPrefix: string;
  /**
   * Live GitHub Pages directory for this webapp (`demo`, `taaat`), or null
   * for the library (no frozen web subtree of its own).
   */
  pagesDir: string | null;
  /** Repo `deno.json` task that builds the webapp, or null. */
  buildTask: string | null;
}

export const PACKAGES: Record<ReleasePackage, PackageConfig> = {
  library: {
    id: "library",
    label: "ehrtslib",
    versionFile: join(root, "deno.json"),
    tagPrefix: "v",
    pagesDir: null,
    buildTask: null,
  },
  demo: {
    id: "demo",
    label: "format converter demo",
    versionFile: join(root, "examples/demo-app/deno.json"),
    tagPrefix: "demo-v",
    pagesDir: "demo",
    buildTask: "build:demo",
  },
  taaat: {
    id: "taaat",
    label: "TAAAT",
    versionFile: join(root, "examples/taaat-app/deno.json"),
    tagPrefix: "taaat-v",
    pagesDir: "taaat",
    buildTask: "build:taaat",
  },
};

export const REPO_ROOT = root;

const SEMVER = /^(\d+)\.(\d+)(?:\.(\d+))?$/;

export function parseSemver(version: string): {
  major: string;
  minor: string;
  patch: string;
} {
  const m = SEMVER.exec(version);
  if (!m) throw new Error(`Invalid semver version: ${version}`);
  return { major: m[1], minor: m[2], patch: m[3] ?? "0" };
}

/** Map package version to release tag (patch 0 drops the `.0`, like intEHRgrator). */
export function releaseTagForVersion(
  pkg: ReleasePackage,
  version: string,
): string {
  const { major, minor, patch } = parseSemver(version);
  const prefix = PACKAGES[pkg].tagPrefix;
  if (patch === "0") return `${prefix}${major}.${minor}`;
  return `${prefix}${major}.${minor}.${patch}`;
}

export function parseReleaseTag(
  tag: string,
): { pkg: ReleasePackage; version: string } {
  const specs: Array<{ pkg: ReleasePackage; re: RegExp }> = [
    { pkg: "demo", re: /^demo-v(\d+\.\d+(?:\.\d+)?)$/ },
    { pkg: "taaat", re: /^taaat-v(\d+\.\d+(?:\.\d+)?)$/ },
    { pkg: "library", re: /^v(\d+\.\d+(?:\.\d+)?)$/ },
  ];
  for (const spec of specs) {
    const m = spec.re.exec(tag);
    if (m) {
      parseSemver(m[1]);
      return { pkg: spec.pkg, version: m[1] };
    }
  }
  throw new Error(
    `Unknown release tag "${tag}" (expected vX.Y, demo-vX.Y, or taaat-vX.Y)`,
  );
}

export function readVersionFromDenoJson(text: string): string {
  const parsed = JSON.parse(text) as { version?: string };
  if (!parsed.version) throw new Error("deno.json is missing version");
  return parsed.version;
}

export async function readPackageVersion(pkg: ReleasePackage): Promise<string> {
  const text = await Deno.readTextFile(PACKAGES[pkg].versionFile);
  return readVersionFromDenoJson(text);
}

export function bumpVersionInText(text: string, version: string): string {
  parseSemver(version);
  if (!/"version"\s*:/.test(text)) {
    throw new Error(`no "version" field to bump`);
  }
  return text.replace(/"version"\s*:\s*"[^"]+"/, `"version": "${version}"`);
}

export async function bumpPackageVersion(
  pkg: ReleasePackage,
  version: string,
): Promise<void> {
  const path = PACKAGES[pkg].versionFile;
  const text = await Deno.readTextFile(path);
  await Deno.writeTextFile(path, bumpVersionInText(text, version));
}

export async function run(cmd: string, args: string[]): Promise<void> {
  const status = await new Deno.Command(cmd, {
    args,
    cwd: root,
    stdout: "inherit",
    stderr: "inherit",
  }).output();
  if (!status.success) {
    throw new Error(`${cmd} ${args.join(" ")} failed (exit ${status.code})`);
  }
}

export async function assertReleasePrerequisites(): Promise<void> {
  for (const cmd of ["git", "gh"]) {
    const status = await new Deno.Command(cmd, {
      args: ["--version"],
      stdout: "null",
      stderr: "null",
    }).output();
    if (!status.success) {
      throw new Error(`${cmd} is required for deno task release`);
    }
  }
}

export async function assertCleanGitTree(): Promise<void> {
  const status = await new Deno.Command("git", {
    args: ["status", "--porcelain"],
    cwd: root,
    stdout: "piped",
  }).output();
  const dirty = new TextDecoder().decode(status.stdout).trim();
  if (dirty) {
    throw new Error(
      "Working tree is not clean — commit or stash changes before releasing",
    );
  }
}

export async function assertGhAuth(): Promise<void> {
  const status = await new Deno.Command("gh", {
    args: ["auth", "status"],
    cwd: root,
    stdout: "inherit",
    stderr: "inherit",
  }).output();
  if (!status.success) throw new Error("gh is not authenticated");
}

export function relativeVersionFile(pkg: ReleasePackage): string {
  return PACKAGES[pkg].versionFile.slice(root.length + 1).replaceAll("\\", "/");
}
