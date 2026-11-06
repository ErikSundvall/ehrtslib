
import * as esbuild from "https://deno.land/x/esbuild@v0.20.0/mod.js";
import { join, fromFileUrl, dirname, toFileUrl } from "https://deno.land/std@0.210.0/path/mod.ts";
import { ensureDir, copy } from "https://deno.land/std@0.210.0/fs/mod.ts";
import { denoPlugins } from "https://deno.land/x/esbuild_deno_loader@0.9.0/mod.ts";

const __dirname = dirname(fromFileUrl(import.meta.url));
const rootDir = join(__dirname, "..");
const srcDir = join(rootDir, "src");
const publicDir = join(rootDir, "public");
// Project root is two levels up from examples/demo-app
const projectRoot = join(rootDir, "..", "..");
const outDir = join(projectRoot, "docs", "demo");

// Use the workspace root deno.json for import resolution
const configPath = join(projectRoot, "deno.json");

console.log("🚀 Building demo app...");
console.log(`📂 Config: ${configPath}`);
console.log(`📂 Source: ${srcDir}`);
console.log(`📂 Public: ${publicDir}`);
console.log(`📂 Output: ${outDir}`);

/** Let esbuild handle both ESM imports and CommonJS requires of npm JSON data. */
const jsonAsModulePlugin = {
    name: "json-as-module",
    setup(build: esbuild.PluginBuild) {
        build.onLoad({ filter: /\.json$/ }, async (args) => ({
            contents: await Deno.readTextFile(args.path),
            loader: "json",
        }));
    },
};

// The pinned Automerge package's self-contained browser entry embeds its WASM.
// Deno resolves the default export to the Node entry; do not ship node:fs or
// rely on a bundler-specific .wasm import / a CDN at runtime.
const automergeBrowserPlugin: esbuild.Plugin = {
  name: "automerge-browser",
  setup(build) {
    const namespace = "automerge-browser";
    build.onResolve({ filter: /^@automerge\/automerge$/ }, () => ({
      path: join(
        dirname(fromFileUrl(import.meta.resolve("@automerge/automerge"))),
        "fullfat_base64.js",
      ),
      namespace,
    }));
    build.onResolve({ filter: /^\./, namespace }, (args) => ({
      path: join(args.resolveDir, args.path),
      namespace,
    }));
    build.onLoad({ filter: /\.js$/, namespace }, async (args) => ({
      contents: await Deno.readTextFile(args.path),
      loader: "js",
      resolveDir: dirname(args.path),
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
    // Ensure output directory exists
    await ensureDir(outDir);

    // Build TypeScript bundle
    await esbuild.build({
        plugins: [
            automergeBrowserPlugin,
            jsonAsModulePlugin,
            ...denoPlugins({
                configPath: configPath,
            }),
        ],
        entryPoints: {
            bundle: toFileUrl(join(srcDir, "main.ts")).href,
            "contribution-builder": toFileUrl(join(srcDir, "contribution-builder.ts")).href,
        },
        bundle: true,
        outdir: outDir,
        format: "esm",
        target: "es2022",
        platform: "browser",
        sourcemap: true,
        minify: false, // Set to true for production if desired
        define: {
            "process.env.NODE_ENV": '"production"',
            "__BUILD_INFO__": buildInfo
        },
    });

    console.log("✅ Build complete: converter + Contribution Builder");

    // Copy static assets
    console.log("📋 Copying static assets...");
    await copy(join(publicDir, "index.html"), join(outDir, "index.html"), { overwrite: true });
    await copy(join(publicDir, "styles.css"), join(outDir, "styles.css"), { overwrite: true });
    await copy(
        join(publicDir, "zipehr-css"),
        join(outDir, "zipehr-css"),
        { overwrite: true },
    );

    for (const name of ["contribution-builder.html", "contribution-builder.css", "contribution-builder"]) {
        await copy(join(publicDir, name), join(outDir, name), { overwrite: true });
    }
    console.log("✅ Assets copied to docs/demo/");

} catch (error) {
    console.error("❌ Build failed:", error);
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
