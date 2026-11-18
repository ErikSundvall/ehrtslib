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

Deno.test({
  name: "library runtime bundles stay at /lib/<tag>/ across a main rebuild",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const dir = await Deno.makeTempDir({ prefix: "ehrtslib-lib-pages-" });
    const liveRoot = join(dir, "live");
    const site = join(liveRoot, "ehrtslib");
    const docs = join(dir, "docs");
    const web = join(dir, "web");
    const out = join(dir, "out");
    await writeFile(join(site, "index.html"), "<h1>root-live</h1>");
    await writeFile(join(docs, "index.html"), "<h1>root-docs</h1>");
    await writeFile(join(docs, "demo/index.html"), "<h1>demo</h1>");
    await writeFile(join(docs, "taaat/index.html"), "<h1>taaat</h1>");
    await writeFile(
      join(site, VERSIONS_MANIFEST),
      JSON.stringify({
        library: { current: "0.9.0", versions: ["v0.1"] },
        demo: { versions: [] },
        taaat: { versions: [] },
      }),
    );
    await writeFile(
      join(web, "index.html"),
      '<h1>lib-v0.9</h1><a href="ehrtslib.min.js">bundle</a>',
    );
    await writeFile(join(web, "ehrtslib.min.js"), "export const rm = {};\n");

    const live = startServer(liveRoot);
    try {
      const released = await assembleReleasePagesSite({
        baseUrl: live.url,
        pkg: "library",
        versionTag: "v0.9",
        appDist: web,
        outDir: out,
        docsDir: docs,
      });
      assert(released.library.versions.includes("v0.9"));
      assert(released.library.versions.includes("v0.1"));
      assertEquals(
        await Deno.readTextFile(join(out, "lib/v0.9/index.html")),
        '<h1>lib-v0.9</h1><a href="ehrtslib.min.js">bundle</a>',
      );
      assertEquals(
        await Deno.readTextFile(join(out, "lib/v0.9/ehrtslib.min.js")),
        "export const rm = {};\n",
      );

      await Deno.remove(site, { recursive: true });
      await Deno.mkdir(site, { recursive: true });
      await copyDirContents(out, site);

      const mainOut = join(dir, "out-main");
      const rebuilt = await assembleMainPagesSite({
        baseUrl: live.url,
        docsDir: docs,
        outDir: mainOut,
      });
      assert(rebuilt.library.versions.includes("v0.9"));
      assertEquals(
        await Deno.readTextFile(join(mainOut, "demo/index.html")),
        "<h1>demo</h1>",
      );
      assertEquals(
        await Deno.readTextFile(join(mainOut, "lib/v0.9/ehrtslib.min.js")),
        "export const rm = {};\n",
      );
    } finally {
      live.abort();
    }
  },
});

const BUILT_DEMO_CHUNK = "export const built = 1;\n";
const BUILT_TAAAT = 'export const taaat = "built";\n';
const LIVE_TAAAT = 'export const taaat = "live";\n';

async function writeReleaseFixture(dir: string): Promise<{
  liveRoot: string;
  docs: string;
  web: string;
}> {
  const liveRoot = join(dir, "live");
  const site = join(liveRoot, "ehrtslib");
  const docs = join(dir, "docs");
  const web = join(dir, "web");
  await writeFile(
    join(site, "index.html"),
    '<a href="demo/">demo</a><a href="taaat/">taaat</a>',
  );
  await writeFile(
    join(site, "demo/index.html"),
    '<h1>live-demo</h1><script type="module" src="bundle.js"></script>',
  );
  await writeFile(
    join(site, "demo/bundle.js"),
    'import "./chunks/chunk-live.js";\n',
  );
  await writeFile(
    join(site, "demo/chunks/chunk-live.js"),
    "export const live = 1;\n",
  );
  await writeFile(
    join(site, "taaat/index.html"),
    '<h1>live-taaat</h1><script type="module" src="bundle.js"></script>',
  );
  await writeFile(join(site, "taaat/bundle.js"), LIVE_TAAAT);
  await writeFile(
    join(site, VERSIONS_MANIFEST),
    JSON.stringify({
      library: { current: "0.12.0", versions: [] },
      demo: { versions: [] },
      taaat: { versions: [] },
    }),
  );
  await writeFile(join(docs, "index.html"), "<h1>docs-root</h1>");
  await writeFile(
    join(docs, "demo/index.html"),
    '<h1>built-demo</h1><script type="module" src="bundle.js"></script>',
  );
  await writeFile(
    join(docs, "demo/bundle.js"),
    'import "./chunks/chunk-built.js";\n',
  );
  await writeFile(join(docs, "demo/chunks/chunk-built.js"), BUILT_DEMO_CHUNK);
  await writeFile(
    join(docs, "taaat/index.html"),
    '<h1>built-taaat</h1><script type="module" src="bundle.js"></script>',
  );
  await writeFile(join(docs, "taaat/bundle.js"), BUILT_TAAAT);
  await writeFile(join(web, "index.html"), "<h1>lib-v0.13</h1>");
  await writeFile(join(web, "ehrtslib.min.js"), "export const rm = {};\n");
  return { liveRoot, docs, web };
}

async function isMissing(path: string): Promise<boolean> {
  try {
    await Deno.stat(path);
    return false;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return true;
    throw error;
  }
}

Deno.test({
  name:
    "library release publishes built demo chunks and TAAAT next to /lib/<tag>/",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const dir = await Deno.makeTempDir({ prefix: "ehrtslib-lib-chunks-" });
    const { liveRoot, docs, web } = await writeReleaseFixture(dir);
    const live = startServer(liveRoot);
    try {
      const out = join(dir, "out");
      const released = await assembleReleasePagesSite({
        baseUrl: live.url,
        pkg: "library",
        versionTag: "v0.13",
        appDist: web,
        outDir: out,
        docsDir: docs,
      });
      assert(released.library.versions.includes("v0.13"));
      assertEquals(
        await Deno.readTextFile(join(out, "demo/index.html")),
        '<h1>built-demo</h1><script type="module" src="bundle.js"></script>',
      );
      assertEquals(
        await Deno.readTextFile(join(out, "demo/chunks/chunk-built.js")),
        BUILT_DEMO_CHUNK,
      );
      assert(
        await isMissing(join(out, "demo/chunks/chunk-live.js")),
        "wget-only demo chunk must not survive the built-tree replace",
      );
      assertEquals(
        await Deno.readTextFile(join(out, "taaat/bundle.js")),
        BUILT_TAAAT,
      );
      assertEquals(
        await Deno.readTextFile(join(out, "lib/v0.13/ehrtslib.min.js")),
        "export const rm = {};\n",
      );

      const offline = join(dir, "out-offline");
      const seeded = await assembleReleasePagesSite({
        baseUrl: "http://127.0.0.1:1/ehrtslib",
        pkg: "library",
        versionTag: "v0.13",
        appDist: web,
        outDir: offline,
        docsDir: docs,
      });
      assert(seeded.library.versions.includes("v0.13"));
      assertEquals(
        await Deno.readTextFile(join(offline, "demo/chunks/chunk-built.js")),
        BUILT_DEMO_CHUNK,
      );
      assertEquals(
        await Deno.readTextFile(join(offline, "taaat/bundle.js")),
        BUILT_TAAAT,
      );
    } finally {
      live.abort();
    }
  },
});

Deno.test({
  name: "demo and taaat releases do not drop the other webapp's built files",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const dir = await Deno.makeTempDir({ prefix: "ehrtslib-webapp-release-" });
    const { liveRoot, docs } = await writeReleaseFixture(dir);
    const live = startServer(liveRoot);
    try {
      const demoOut = join(dir, "out-demo");
      await assembleReleasePagesSite({
        baseUrl: live.url,
        pkg: "demo",
        versionTag: "demo-v0.2",
        appDist: join(docs, "demo"),
        outDir: demoOut,
        docsDir: docs,
      });
      assertEquals(
        await Deno.readTextFile(join(demoOut, "demo/chunks/chunk-built.js")),
        BUILT_DEMO_CHUNK,
      );
      assertEquals(
        await Deno.readTextFile(
          join(demoOut, "demo-v0.2/chunks/chunk-built.js"),
        ),
        BUILT_DEMO_CHUNK,
      );
      assertEquals(
        await Deno.readTextFile(join(demoOut, "taaat/bundle.js")),
        LIVE_TAAAT,
      );

      await writeFile(
        join(docs, "taaat/chunks/chunk-built.js"),
        "export const taaatChunk = 1;\n",
      );
      const demoChunksOut = join(dir, "out-demo-taaat-chunks");
      await assembleReleasePagesSite({
        baseUrl: live.url,
        pkg: "demo",
        versionTag: "demo-v0.3",
        appDist: join(docs, "demo"),
        outDir: demoChunksOut,
        docsDir: docs,
      });
      assertEquals(
        await Deno.readTextFile(
          join(demoChunksOut, "taaat/chunks/chunk-built.js"),
        ),
        "export const taaatChunk = 1;\n",
      );

      await Deno.remove(join(docs, "taaat/chunks"), { recursive: true });
      const taaatOut = join(dir, "out-taaat");
      await assembleReleasePagesSite({
        baseUrl: live.url,
        pkg: "taaat",
        versionTag: "taaat-v0.2",
        appDist: join(docs, "taaat"),
        outDir: taaatOut,
        docsDir: docs,
      });
      assertEquals(
        await Deno.readTextFile(join(taaatOut, "demo/chunks/chunk-built.js")),
        BUILT_DEMO_CHUNK,
      );
      assertEquals(
        await Deno.readTextFile(join(taaatOut, "taaat/bundle.js")),
        LIVE_TAAAT,
      );
      assertEquals(
        await Deno.readTextFile(join(taaatOut, "taaat-v0.2/bundle.js")),
        BUILT_TAAAT,
      );
    } finally {
      live.abort();
    }
  },
});
