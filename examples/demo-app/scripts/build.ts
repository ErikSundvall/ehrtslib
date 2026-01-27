
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

try {
    // Ensure output directory exists
    await ensureDir(outDir);

    // Build TypeScript bundle
    await esbuild.build({
        plugins: [...denoPlugins({
            configPath: configPath
        })],
        entryPoints: [toFileUrl(join(srcDir, "main.ts")).href],
        bundle: true,
        outfile: join(outDir, "bundle.js"),
        format: "esm",
        target: "es2022",
        platform: "browser",
        sourcemap: true,
        minify: false, // Set to true for production if desired
        define: {
            "process.env.NODE_ENV": '"production"',
            "__BUILD_INFO__": JSON.stringify({
                timestamp: new Date().toISOString(),
                buildId: Math.random().toString(36).substring(2, 10).toUpperCase()
            })
        },
    });

    console.log("✅ Build complete: bundle.js");

    // Copy static assets
    console.log("📋 Copying static assets...");
    await copy(join(publicDir, "index.html"), join(outDir, "index.html"), { overwrite: true });
    await copy(join(publicDir, "converter.html"), join(outDir, "converter.html"), { overwrite: true });
    await copy(join(publicDir, "styles.css"), join(outDir, "styles.css"), { overwrite: true });
    await copy(join(publicDir, "shared-medical.css"), join(outDir, "shared-medical.css"), { overwrite: true });
    await copy(join(publicDir, "archetype-demo.html"), join(outDir, "archetype-demo.html"), { overwrite: true });

    console.log("✅ Assets copied to docs/demo/");

} catch (error) {
    console.error("❌ Build failed:", error);
    Deno.exit(1);
} finally {
    esbuild.stop();
}
