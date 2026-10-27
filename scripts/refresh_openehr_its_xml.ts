#!/usr/bin/env -S deno run -A
/**
 * Refresh test_data/xsd/openehr-its-xml from openEHR/specifications-ITS-XML (master).
 */
import { emptyDir, ensureDir } from "https://deno.land/std@0.210.0/fs/mod.ts";
import { fromFileUrl, join } from "https://deno.land/std@0.210.0/path/mod.ts";

const REPO = "https://github.com/openEHR/specifications-ITS-XML.git";
const root = join(fromFileUrl(new URL(".", import.meta.url)), "..");
const dest = join(root, "test_data/xsd/openehr-its-xml");
const tmp = await Deno.makeTempDir({ prefix: "openehr-its-xml-" });

const clone = new Deno.Command("git", {
  args: ["clone", "--depth", "1", REPO, tmp],
});
const cr = await clone.output();
if (!cr.success) {
  throw new Error(new TextDecoder().decode(cr.stderr));
}

const rev = new Deno.Command("git", {
  args: ["-C", tmp, "rev-parse", "HEAD"],
  stdout: "piped",
});
const rr = await rev.output();
const commit = new TextDecoder().decode(rr.stdout).trim();

await emptyDir(join(dest, "components"));
await ensureDir(join(dest, "components/AM"));
await ensureDir(join(dest, "components/RM"));
await ensureDir(join(dest, "components/BASE"));

async function copyTree(from: string, to: string) {
  await ensureDir(to);
  for await (const entry of Deno.readDir(from)) {
    const src = join(from, entry.name);
    const dst = join(to, entry.name);
    if (entry.isDirectory) await copyTree(src, dst);
    else await Deno.copyFile(src, dst);
  }
}

await copyTree(
  join(tmp, "components/AM/Release-1.4"),
  join(dest, "components/AM/Release-1.4"),
);
await copyTree(
  join(tmp, "components/RM/Release-1.1.0"),
  join(dest, "components/RM/Release-1.1.0"),
);
await copyTree(
  join(tmp, "components/BASE/latest"),
  join(dest, "components/BASE/latest"),
);
await Deno.copyFile(join(tmp, "LICENSE"), join(dest, "UPSTREAM-LICENSE"));

await Deno.remove(tmp, { recursive: true });
console.log(`Refreshed ${dest} from ${REPO} @ ${commit}`);
console.log("Update the pinned commit in test_data/xsd/openehr-its-xml/README.md");
