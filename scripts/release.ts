#!/usr/bin/env -S deno run -A
/**
 * Cut an ehrtslib library, demo, or TAAAT release.
 *
 * Bumps the package version (unless --current), runs the matching build, commits,
 * tags, and pushes. GitHub Actions (`release.yml`) publishes a GitHub Release and,
 * for the webapps, a frozen Pages subdirectory that later deploys never overwrite.
 *
 * Usage:
 *   deno task release -- --package library --version 0.1.0
 *   deno task release -- --package demo --version 0.2.0
 *   deno task release -- --package taaat --current
 *   deno task release -- --package demo --version 0.2.0 --dry-run
 */
import {
  assertCleanGitTree,
  assertGhAuth,
  assertReleasePrerequisites,
  bumpPackageVersion,
  PACKAGES,
  parseSemver,
  readPackageVersion,
  relativeVersionFile,
  type ReleasePackage,
  releaseTagForVersion,
  run,
} from "./release_version.ts";

function usage(): void {
  console.log(`Usage:
  deno task release -- --package <library|demo|taaat> --version <semver> [--message <tag message>] [--dry-run]
  deno task release -- --package <library|demo|taaat> --current [--message <tag message>] [--dry-run]

Packages:
  library   ehrtslib TypeScript library (GitHub Release; tag vX.Y)
  demo      format converter webapp (frozen at /demo-vX.Y/ on GitHub Pages)
  taaat     TAAAT annotation webapp (frozen at /taaat-vX.Y/ on GitHub Pages)

Options:
  --package   Which artefact to release
  --version   New package version to write before releasing
  --current   Release the version already in that package's deno.json (no bump)
  --message   Annotated tag message
  --dry-run   Validate and build, but do not commit, tag, or push
`);
}

function parseArgs(argv: string[]) {
  let pkg: ReleasePackage | undefined;
  let version: string | undefined;
  let useCurrent = false;
  let dryRun = false;
  let message: string | undefined;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--package") {
      const raw = argv[++i];
      if (raw !== "library" && raw !== "demo" && raw !== "taaat") {
        throw new Error(`Unknown --package ${raw}`);
      }
      pkg = raw;
      continue;
    }
    if (arg === "--version") {
      version = argv[++i];
      continue;
    }
    if (arg === "--current") {
      useCurrent = true;
      continue;
    }
    if (arg === "--message") {
      message = argv[++i];
      continue;
    }
    if (arg === "--dry-run") {
      dryRun = true;
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      usage();
      Deno.exit(0);
    }
    if (arg === "--") continue;
    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!pkg) throw new Error("Pass --package library|demo|taaat");
  if (version && useCurrent) {
    throw new Error("Use either --version or --current, not both");
  }
  if (!version && !useCurrent) {
    throw new Error("Pass --version <semver> or --current");
  }
  if (version) parseSemver(version);

  return { pkg, version, useCurrent, dryRun, message };
}

const args = parseArgs(Deno.args);
const cfg = PACKAGES[args.pkg];

await assertReleasePrerequisites();
if (!args.dryRun) {
  await assertGhAuth();
  await assertCleanGitTree();
}

let releaseVersion = args.version;
if (args.useCurrent) {
  releaseVersion = await readPackageVersion(args.pkg);
}
if (!releaseVersion) throw new Error("Release version is required");

const releaseTag = releaseTagForVersion(args.pkg, releaseVersion);
const tagMessage = args.message ?? `${cfg.label} ${releaseVersion}`;

console.log(`Preparing ${cfg.label} release ${releaseVersion} (${releaseTag})`);

if (args.version && !args.dryRun) {
  console.log(`Bumping ${relativeVersionFile(args.pkg)} to ${args.version}`);
  await bumpPackageVersion(args.pkg, args.version);
  releaseVersion = args.version;
} else if (args.version) {
  console.log(
    `Dry run: would bump ${relativeVersionFile(args.pkg)} to ${args.version}`,
  );
}

if (cfg.buildTask) {
  await run("deno", ["task", cfg.buildTask]);
}

if (args.dryRun) {
  const pages = cfg.pagesDir
    ? `https://eriksundvall.github.io/ehrtslib/${releaseTag}/`
    : "(library — GitHub Release only)";
  console.log("Dry run complete — no commit, tag, or push performed.");
  console.log(
    `Would tag ${releaseTag} and push to origin; Actions publishes ${pages}`,
  );
  Deno.exit(0);
}

if (args.version) {
  await run("git", ["add", relativeVersionFile(args.pkg)]);
  if (cfg.buildTask === "build:taaat") {
    await run("git", ["add", "docs/taaat"]);
  }
  await run("git", [
    "commit",
    "-m",
    `chore: release ${args.pkg} ${releaseVersion}`,
  ]);
}

await run("git", ["tag", "-a", releaseTag, "-m", tagMessage]);
await run("git", ["push", "origin", "HEAD"]);
await run("git", ["push", "origin", releaseTag]);

console.log(`Pushed ${releaseTag}.`);
if (cfg.pagesDir) {
  console.log(
    `GitHub Actions will freeze https://eriksundvall.github.io/ehrtslib/${releaseTag}/`,
  );
} else {
  console.log("GitHub Actions will create the library GitHub Release.");
}
