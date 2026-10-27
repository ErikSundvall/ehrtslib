#!/usr/bin/env -S deno run -A
/**
 * Fetch unmodified openEHR ITS-XML XSDs for OPT Template.xsd tests.
 * Idempotent: no-op when `.stamp` matches `test_data/xsd/openehr-its-xml/PIN`
 * and required files are present.
 */
import { ensureDir } from "https://deno.land/std@0.210.0/fs/mod.ts";
import { fromFileUrl, join } from "https://deno.land/std@0.210.0/path/mod.ts";

const REPO = "https://github.com/openEHR/specifications-ITS-XML.git";
const root = join(fromFileUrl(new URL(".", import.meta.url)), "..");
const dest = join(root, "test_data/xsd/openehr-its-xml");
const pinPath = join(dest, "PIN");
const stampPath = join(dest, ".stamp");
const templateXsd = join(dest, "components/AM/Release-1.4/Template.xsd");

async function readPin(): Promise<string> {
  const raw = await Deno.readTextFile(pinPath);
  const line = raw.split("\n").find((l) => l.trim() && !l.trim().startsWith("#"));
  if (!line?.trim()) throw new Error(`Missing commit in ${pinPath}`);
  return line.trim();
}

async function fixturesReady(pin: string): Promise<boolean> {
  try {
    const stamp = (await Deno.readTextFile(stampPath)).trim();
    if (stamp !== pin) return false;
    await Deno.stat(templateXsd);
    return true;
  } catch {
    return false;
  }
}

async function copyTree(from: string, to: string) {
  await ensureDir(to);
  for await (const entry of Deno.readDir(from)) {
    const src = join(from, entry.name);
    const dst = join(to, entry.name);
    if (entry.isDirectory) await copyTree(src, dst);
    else await Deno.copyFile(src, dst);
  }
}

async function fetchAtPin(pin: string): Promise<void> {
  const tmp = await Deno.makeTempDir({ prefix: "openehr-its-xml-" });
  try {
    let cr = await new Deno.Command("git", {
      args: ["clone", "--filter=blob:none", "--no-checkout", REPO, tmp],
    }).output();
    if (!cr.success) {
      throw new Error(new TextDecoder().decode(cr.stderr));
    }
    cr = await new Deno.Command("git", {
      args: ["-C", tmp, "fetch", "--depth", "1", "origin", pin],
    }).output();
    if (!cr.success) {
      throw new Error(new TextDecoder().decode(cr.stderr));
    }
    cr = await new Deno.Command("git", {
      args: ["-C", tmp, "checkout", "FETCH_HEAD"],
    }).output();
    if (!cr.success) {
      throw new Error(new TextDecoder().decode(cr.stderr));
    }

    const components = join(dest, "components");
    await Deno.remove(components, { recursive: true }).catch(() => {});
    await ensureDir(join(dest, "components/AM"));
    await ensureDir(join(dest, "components/RM"));
    await ensureDir(join(dest, "components/BASE"));

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
    await Deno.writeTextFile(stampPath, pin + "\n");
  } finally {
    await Deno.remove(tmp, { recursive: true });
  }
}

const pin = await readPin();
if (await fixturesReady(pin)) {
  console.log(`openEHR ITS-XML fixtures already present @ ${pin}`);
} else {
  console.log(`Fetching openEHR ITS-XML @ ${pin} …`);
  await fetchAtPin(pin);
  console.log(`Wrote fixtures under ${dest}`);
}
