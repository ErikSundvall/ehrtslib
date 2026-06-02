import * as esbuild from "https://deno.land/x/esbuild@v0.20.0/mod.js";
import {
  dirname,
  fromFileUrl,
  join,
  toFileUrl,
} from "https://deno.land/std@0.210.0/path/mod.ts";
import { copy, ensureDir } from "https://deno.land/std@0.210.0/fs/mod.ts";
import { denoPlugins } from "https://deno.land/x/esbuild_deno_loader@0.9.0/mod.ts";

const __dirname = dirname(fromFileUrl(import.meta.url));
const rootDir = join(__dirname, "..");
const srcDir = join(rootDir, "src");
const publicDir = join(rootDir, "public");
const projectRoot = join(rootDir, "..", "..");
const outDir = join(projectRoot, "docs", "taaat");
const configPath = join(projectRoot, "deno.json");

const jsonAsModulePlugin = {
  name: "json-as-module",
  setup(build: esbuild.PluginBuild) {
    build.onLoad({ filter: /\.json$/ }, async (args) => ({
      contents: `export default ${await Deno.readTextFile(args.path)}`,
      loader: "js",
    }));
  },
};

try {
  console.log("Building TAAAT app...");
  await ensureDir(outDir);
  await esbuild.build({
    plugins: [
      jsonAsModulePlugin,
      ...denoPlugins({ configPath }),
    ],
    entryPoints: [toFileUrl(join(srcDir, "main.ts")).href],
    bundle: true,
    outfile: join(outDir, "bundle.js"),
    format: "esm",
    target: "es2022",
    platform: "browser",
    sourcemap: true,
    minify: false,
    define: {
      "process.env.NODE_ENV": '"production"',
      "__BUILD_INFO__": JSON.stringify({
        timestamp: new Date().toISOString(),
        buildId: Math.random().toString(36).substring(2, 10).toUpperCase(),
      }),
    },
  });

  await copy(join(publicDir, "index.html"), join(outDir, "index.html"), {
    overwrite: true,
  });
  await copy(join(publicDir, "styles.css"), join(outDir, "styles.css"), {
    overwrite: true,
  });
  console.log("TAAAT build complete.");
} catch (error) {
  console.error("TAAAT build failed:", error);
  Deno.exit(1);
} finally {
  esbuild.stop();
}
