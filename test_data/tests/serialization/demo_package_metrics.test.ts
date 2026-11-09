/**
 * Demo/library packaging metrics for #284 (gzip sizes; codecs stay optional subpaths).
 */
import { assert } from "jsr:@std/assert";
import { gzip } from "node:zlib";
import { promisify } from "node:util";

const gzipAsync = promisify(gzip);

async function gzipSize(path: URL): Promise<number> {
  const raw = await Deno.readFile(path);
  const compressed = await gzipAsync(raw);
  return compressed.byteLength;
}

async function runDenoTask(repoRoot: URL, task: string): Promise<void> {
  const cmd = new Deno.Command(Deno.execPath(), {
    args: ["task", task],
    cwd: repoRoot,
    stdout: "inherit",
    stderr: "inherit",
  });
  const status = await cmd.output();
  assert(
    status.success,
    `deno task ${task} failed (exit ${status.code})`,
  );
}

function listMarkdownBundles(webDir: URL): string[] {
  return [...Deno.readDirSync(webDir)].map((e) => e.name).filter((n) =>
    n.includes("serialization-markdown") && n.endsWith(".min.js")
  );
}

Deno.test("optional serialization bundles are measured (gzip) and not in core graph", async () => {
  const repoRoot = new URL("../../../", import.meta.url);
  const mdPath = new URL("dist/library-release/web/", repoRoot);

  let entries = (() => {
    try {
      return listMarkdownBundles(mdPath);
    } catch {
      return [] as string[];
    }
  })();

  if (entries.length < 1) {
    await runDenoTask(repoRoot, "pack:library");
    entries = listMarkdownBundles(mdPath);
  }
  assert(entries.length >= 1, "pack:library did not produce serialization-markdown bundle");

  const mdGz = await gzipSize(new URL(entries[0], mdPath));
  assert(mdGz > 100_000 && mdGz < 2_000_000, `markdown bundle gzip bytes: ${mdGz}`);

  const adEntries = [...Deno.readDirSync(mdPath)].map((e) => e.name).filter((n) =>
    n.includes("serialization-asciidoc") && n.endsWith(".min.js")
  );
  assert(adEntries.length >= 1);
  const adGz = await gzipSize(new URL(adEntries[0], mdPath));
  assert(adGz > 100_000 && adGz < 2_000_000, `asciidoc bundle gzip bytes: ${adGz}`);

  console.log(`gzip bytes: markdown=${mdGz} asciidoc=${adGz}`);

  const demoBundle = new URL("docs/demo/bundle.js", repoRoot);
  try {
    await Deno.stat(demoBundle);
  } catch {
    await runDenoTask(repoRoot, "build:demo");
  }

  const demoRaw = (await Deno.readFile(demoBundle)).byteLength;
  const demoGz = await gzipSize(demoBundle);
  assert(demoRaw > 1_000_000, `demo bundle raw bytes: ${demoRaw}`);
  assert(demoGz > 300_000 && demoGz < 3_000_000, `demo bundle gzip bytes: ${demoGz}`);
  console.log(`demo bundle raw=${demoRaw} gzip=${demoGz}`);
});
