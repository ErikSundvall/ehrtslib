/**
 * Pages assembly: freeze a webapp under a sibling URL and keep it when the
 * bleeding-edge tree is rebuilt (intEHRgrator model).
 */
import { assert, assertEquals, assertRejects } from "@std/assert";
import { dirname, join } from "@std/path";
import {
  assembleMainPagesSite,
  assembleReleasePagesSite,
  copyDirContents,
  resolveCliPath,
  VERSIONS_MANIFEST,
} from "./pages_site.ts";

const tmpRoot = await Deno.makeTempDir({ prefix: "ehrtslib-pages-" });
const liveRoot = join(tmpRoot, "live");
const ehrtslibLive = join(liveRoot, "ehrtslib");
const docsDir = join(tmpRoot, "docs");
const outDir = join(tmpRoot, "out");

async function writeFile(path: string, text: string): Promise<void> {
  await Deno.mkdir(dirname(path), { recursive: true });
  await Deno.writeTextFile(path, text);
}

function startServer(root: string): { url: string; abort: () => void } {
  const server = Deno.serve({ hostname: "127.0.0.1", port: 0 }, async (req) => {
    const path = new URL(req.url).pathname;
    const file = join(root, path.replace(/^\/+/, ""));
    try {
      const st = await Deno.stat(file);
      if (st.isDirectory) {
        const index = join(file, "index.html");
        return new Response(await Deno.readTextFile(index), {
          headers: { "content-type": "text/html" },
        });
      }
      const body = await Deno.readFile(file);
      const type = file.endsWith(".json")
        ? "application/json"
        : file.endsWith(".html")
        ? "text/html"
        : "application/octet-stream";
      return new Response(body, { headers: { "content-type": type } });
    } catch {
      return new Response("missing", { status: 404 });
    }
  });
  const addr = server.addr as Deno.NetAddr;
  return {
    url: `http://127.0.0.1:${addr.port}/ehrtslib`,
    abort: () => {
      void server.shutdown();
    },
  };
}

Deno.test("resolveCliPath keeps absolute destinations outside the repo", () => {
  assertEquals(
    resolveCliPath("/workspace", "/tmp/ehrtslib-pages"),
    "/tmp/ehrtslib-pages",
  );
  assertEquals(
    resolveCliPath("/workspace", "dist-pages"),
    "/workspace/dist-pages",
  );
  assertEquals(resolveCliPath("/workspace", "docs"), "/workspace/docs");
});

Deno.test({
  name: "frozen demo-v0.1 and taaat-v0.1 stay put when bleeding-edge rebuilds",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await Deno.mkdir(join(ehrtslibLive, "demo"), { recursive: true });
    await Deno.mkdir(join(ehrtslibLive, "taaat"), { recursive: true });
    await writeFile(join(ehrtslibLive, "index.html"), "<h1>root-live</h1>");
    await writeFile(
      join(ehrtslibLive, "demo/index.html"),
      "<h1>demo-bleeding</h1>",
    );
    await writeFile(
      join(ehrtslibLive, "taaat/index.html"),
      "<h1>taaat-bleeding</h1>",
    );
    await writeFile(
      join(ehrtslibLive, VERSIONS_MANIFEST),
      JSON.stringify({
        library: { current: "0.0.0", versions: [] },
        demo: { versions: [] },
        taaat: { versions: [] },
      }),
    );

    await Deno.mkdir(join(docsDir, "demo"), { recursive: true });
    await Deno.mkdir(join(docsDir, "taaat"), { recursive: true });
    await writeFile(join(docsDir, "index.html"), "<h1>root-docs</h1>");
    await writeFile(
      join(docsDir, "demo/index.html"),
      "<h1>demo-release-0.1</h1>",
    );
    await writeFile(
      join(docsDir, "taaat/index.html"),
      "<h1>taaat-release-0.1</h1>",
    );

    const live = startServer(liveRoot);
    try {
      const demoRel = await assembleReleasePagesSite({
        baseUrl: live.url,
        pkg: "demo",
        versionTag: "demo-v0.1",
        appDist: join(docsDir, "demo"),
        outDir,
        docsDir,
      });
      assert(demoRel.demo.versions.includes("demo-v0.1"));
      assertEquals(
        await Deno.readTextFile(join(outDir, "demo-v0.1/index.html")),
        "<h1>demo-release-0.1</h1>",
      );

      await Deno.remove(ehrtslibLive, { recursive: true });
      await Deno.mkdir(ehrtslibLive, { recursive: true });
      await copyDirContents(outDir, ehrtslibLive);

      const taaatOut = join(tmpRoot, "out-taaat");
      const taaatRel = await assembleReleasePagesSite({
        baseUrl: live.url,
        pkg: "taaat",
        versionTag: "taaat-v0.1",
        appDist: join(docsDir, "taaat"),
        outDir: taaatOut,
        docsDir,
      });
      assert(taaatRel.demo.versions.includes("demo-v0.1"));
      assert(taaatRel.taaat.versions.includes("taaat-v0.1"));
      assertEquals(
        await Deno.readTextFile(join(taaatOut, "demo-v0.1/index.html")),
        "<h1>demo-release-0.1</h1>",
      );
      assertEquals(
        await Deno.readTextFile(join(taaatOut, "taaat-v0.1/index.html")),
        "<h1>taaat-release-0.1</h1>",
      );

      await Deno.remove(ehrtslibLive, { recursive: true });
      await Deno.mkdir(ehrtslibLive, { recursive: true });
      await copyDirContents(taaatOut, ehrtslibLive);

      await writeFile(
        join(docsDir, "demo/index.html"),
        "<h1>demo-bleeding-new</h1>",
      );
      await writeFile(
        join(docsDir, "taaat/index.html"),
        "<h1>taaat-bleeding-new</h1>",
      );
      const mainOut = join(tmpRoot, "out-main");
      const second = await assembleMainPagesSite({
        baseUrl: live.url,
        docsDir,
        outDir: mainOut,
      });
      assert(second.demo.versions.includes("demo-v0.1"));
      assert(second.taaat.versions.includes("taaat-v0.1"));
      assertEquals(
        await Deno.readTextFile(join(mainOut, "demo/index.html")),
        "<h1>demo-bleeding-new</h1>",
      );
      assertEquals(
        await Deno.readTextFile(join(mainOut, "taaat/index.html")),
        "<h1>taaat-bleeding-new</h1>",
      );
      assertEquals(
        await Deno.readTextFile(join(mainOut, "demo-v0.1/index.html")),
        "<h1>demo-release-0.1</h1>",
      );
      assertEquals(
        await Deno.readTextFile(join(mainOut, "taaat-v0.1/index.html")),
        "<h1>taaat-release-0.1</h1>",
      );

      await assertRejects(
        () =>
          assembleReleasePagesSite({
            baseUrl: live.url,
            pkg: "demo",
            versionTag: "demo-v0.1",
            appDist: join(docsDir, "demo"),
            outDir: join(tmpRoot, "out-dup"),
            docsDir,
          }),
        Error,
        "already exists",
      );

      await assertRejects(
        () =>
          assembleReleasePagesSite({
            baseUrl: "http://127.0.0.1:1/ehrtslib",
            pkg: "library",
            versionTag: "v0.1",
            outDir: join(tmpRoot, "out-lib"),
            docsDir,
          }),
        Error,
        "Refusing to seed",
      );
    } finally {
      live.abort();
    }
  },
});
