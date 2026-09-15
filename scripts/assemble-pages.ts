#!/usr/bin/env -S deno run -A
/**
 * CLI for GitHub Actions Pages deploy assembly.
 *
 *   deno run -A scripts/assemble-pages.ts main <docs-dir> <out-dir>
 *   deno run -A scripts/assemble-pages.ts release <package> <version-tag> <app-dist-or-dash> <out-dir>
 */
import { dirname, fromFileUrl, join } from "@std/path";
import { parseReleaseTag, type ReleasePackage } from "./release_version.ts";
import {
  assembleMainPagesSite,
  assembleReleasePagesSite,
  PAGES_SITE_URL,
  type RecommendedOverrides,
  resolveCliPath,
} from "./pages_site.ts";

const root = join(dirname(fromFileUrl(import.meta.url)), "..");
const baseUrl = Deno.env.get("PAGES_SITE_URL") ?? PAGES_SITE_URL;

/**
 * Optional repo-committed override: `RECOMMENDED_VERSIONS.json`
 * `{ "demo": "demo-v0.2", "taaat": "taaat-v0.1" }` pins recommended
 * end-user versions even when a newer release has shipped.
 */
async function readRecommendedOverrides(): Promise<RecommendedOverrides> {
  const fromEnv: RecommendedOverrides = {
    demo: Deno.env.get("RECOMMENDED_VERSION_DEMO") ?? undefined,
    taaat: Deno.env.get("RECOMMENDED_VERSION_TAAAT") ?? undefined,
    library: Deno.env.get("RECOMMENDED_VERSION_LIBRARY") ?? undefined,
  };
  try {
    const text = await Deno.readTextFile(
      join(root, "RECOMMENDED_VERSIONS.json"),
    );
    const parsed = JSON.parse(text) as RecommendedOverrides;
    return {
      demo: fromEnv.demo ?? parsed.demo,
      taaat: fromEnv.taaat ?? parsed.taaat,
      library: fromEnv.library ?? parsed.library,
    };
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return fromEnv;
    throw error;
  }
}

function usage(): void {
  console.error("Usage: assemble-pages.ts main <docs-dir> <out-dir>");
  console.error(
    "       assemble-pages.ts release <library|demo|taaat> <version-tag> <app-dist|-> <out-dir>",
  );
}

async function main(args: string[]): Promise<void> {
  const recommended = await readRecommendedOverrides();
  const [mode, ...rest] = args;
  if (!mode || (mode !== "main" && mode !== "release")) {
    usage();
    Deno.exit(1);
  }

  if (mode === "main") {
    const [docsDir, outDir] = rest;
    if (!docsDir || !outDir) {
      usage();
      Deno.exit(1);
    }
    const dest = resolveCliPath(root, outDir);
    const manifest = await assembleMainPagesSite({
      baseUrl,
      docsDir: resolveCliPath(root, docsDir),
      outDir: dest,
      recommended,
    });
    const n = manifest.demo.versions.length + manifest.taaat.versions.length;
    console.log(
      `Assembled main Pages site at ${dest} (${n} frozen webapp versions)`,
    );
    return;
  }

  const [pkgArg, versionTag, appDist, outDir] = rest;
  if (!pkgArg || !versionTag || !appDist || !outDir) {
    usage();
    Deno.exit(1);
  }
  let pkg: ReleasePackage;
  if (pkgArg === "library" || pkgArg === "demo" || pkgArg === "taaat") {
    pkg = pkgArg;
  } else {
    console.error(`Unknown package: ${pkgArg}`);
    Deno.exit(1);
  }
  const parsed = parseReleaseTag(versionTag);
  if (parsed.pkg !== pkg) {
    console.error(
      `Tag ${versionTag} belongs to ${parsed.pkg}, not ${pkg}`,
    );
    Deno.exit(1);
  }
  const dest = resolveCliPath(root, outDir);
  const manifest = await assembleReleasePagesSite({
    baseUrl,
    pkg,
    versionTag,
    appDist: appDist === "-" ? undefined : resolveCliPath(root, appDist),
    outDir: dest,
    docsDir: join(root, "docs"),
    recommended,
  });
  console.log(
    `Assembled release Pages site at ${dest} (added ${versionTag}; demo ${manifest.demo.versions.length}, taaat ${manifest.taaat.versions.length} frozen)`,
  );
}

if (import.meta.main) {
  await main(Deno.args);
}
