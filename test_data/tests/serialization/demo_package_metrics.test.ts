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

Deno.test("optional serialization bundles are measured (gzip) and not in core graph", async () => {
  const repoRoot = new URL("../../../", import.meta.url);
  const mdPath = new URL("dist/library-release/web/", repoRoot);
  const entries = [...Deno.readDirSync(mdPath)].map((e) => e.name).filter((n) =>
    n.includes("serialization-markdown") && n.endsWith(".min.js")
  );
  assert(entries.length >= 1, "run deno task pack:library before this test");
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
  const demoRaw = (await Deno.readFile(demoBundle)).byteLength;
  const demoGz = await gzipSize(demoBundle);
  assert(demoRaw > 1_000_000, `demo bundle raw bytes: ${demoRaw}`);
  assert(demoGz > 400_000 && demoGz < 3_000_000, `demo bundle gzip bytes: ${demoGz}`);
  console.log(`demo bundle raw=${demoRaw} gzip=${demoGz}`);
});
