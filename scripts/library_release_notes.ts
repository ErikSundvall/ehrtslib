#!/usr/bin/env -S deno run -A
/**
 * Print GitHub Release notes for a library tag.
 *
 *   deno run -A scripts/library_release_notes.ts v0.3.1
 */
import {
  parseReleaseTag,
  readPackageVersion,
  releaseTagForVersion,
} from "./release_version.ts";
import { renderLibraryReleaseNotes } from "./library_package.ts";

const tag = Deno.args[0];
if (!tag) {
  console.error("Usage: library_release_notes.ts <vX.Y tag>");
  Deno.exit(1);
}

const parsed = parseReleaseTag(tag);
if (parsed.pkg !== "library") {
  console.error(`Tag ${tag} is a ${parsed.pkg} release, not a library release`);
  Deno.exit(1);
}

const version = await readPackageVersion("library");
const expected = releaseTagForVersion("library", version);
if (tag !== expected) {
  console.error(
    `Tag ${tag} does not match deno.json version ${version} (${expected})`,
  );
  Deno.exit(1);
}

console.log(renderLibraryReleaseNotes(version));
