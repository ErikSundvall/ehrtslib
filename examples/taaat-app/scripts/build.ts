
import * as esbuild from "https://deno.land/x/esbuild@v0.20.0/mod.js";
import { join, fromFileUrl, dirname, toFileUrl } from "https://deno.land/std@0.210.0/path/mod.ts";
import { ensureDir, copy } from "https://deno.land/std@0.210.0/fs/mod.ts";
import { denoPlugins } from "https://deno.land/x/esbuild_deno_loader@0.9.0/mod.ts";

const __dirname = dirname(fromFileUrl(import.meta.url));
const rootDir = join(__dirname, "..");
const srcDir = join(rootDir, "src");
const publicDir = join(rootDir, "public");
const projectRoot = join(rootDir, "..", "..");
const outDir = join(projectRoot, "docs", "taaat");
const configPath = join(projectRoot, "deno.json");

console.log("Building TAAAT app...");
console.log(`Output: ${outDir}`);

const jsonAsModulePlugin = {
  name: "json-as-module",
  setup(build: esbuild.PluginBuild) {
    build.onLoad({ filter: /\.json$/ }, async (args) => ({
      contents: `export default ${await Deno.readTextFile(args.path)}`,
      loader: "js",
    }));
  },
};

const appVersion = await readAppVersion(rootDir);
const buildInfo = JSON.stringify({
  timestamp: new Date().toISOString(),
  buildId: Math.random().toString(36).substring(2, 10).toUpperCase(),
  version: appVersion,
});

try {
  await ensureDir(outDir);

  const sharedBuild = {
    plugins: [
      jsonAsModulePlugin,
      ...denoPlugins({ configPath }),
    ],
    bundle: true,
    format: "esm" as const,
    target: "es2022",
    platform: "browser" as const,
    sourcemap: false,
    minify: false,
    define: {
      "process.env.NODE_ENV": '"production"',
      "__BUILD_INFO__": buildInfo,
    },
  };

  await esbuild.build({
    ...sharedBuild,
    entryPoints: [toFileUrl(join(srcDir, "main.ts")).href],
    outfile: join(outDir, "bundle.js"),
  });

  await esbuild.build({
    ...sharedBuild,
    entryPoints: [toFileUrl(join(srcDir, "prototype", "main.ts")).href],
    outfile: join(outDir, "prototype.js"),
  });

  await copy(join(publicDir, "index.html"), join(outDir, "index.html"), { overwrite: true });
  await copy(join(publicDir, "styles.css"), join(outDir, "styles.css"), { overwrite: true });
  await copy(join(publicDir, "prototype.html"), join(outDir, "prototype.html"), { overwrite: true });
  await copy(join(publicDir, "prototype.css"), join(outDir, "prototype.css"), { overwrite: true });

  console.log("TAAAT build complete → docs/taaat/");
} catch (error) {
  console.error("Build failed:", error);
  Deno.exit(1);
} finally {
  esbuild.stop();
}

async function readAppVersion(appRoot: string): Promise<string> {
  try {
    const raw = JSON.parse(await Deno.readTextFile(join(appRoot, "deno.json")));
    return typeof raw.version === "string" && raw.version.trim()
      ? raw.version.trim()
      : "0.0.0";
  } catch {
    return "0.0.0";
  }
}
