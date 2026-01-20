
import { join, fromFileUrl, dirname } from "https://deno.land/std@0.210.0/path/mod.ts";
import { serveDir } from "https://deno.land/std@0.210.0/http/file_server.ts";

const __dirname = dirname(fromFileUrl(import.meta.url));
const rootDir = join(__dirname, "..");
// Docs dir is where build.ts outputs files: "docs/demo" relative to project root (2 levels up)
// join(rootDir, "..", "..", "docs", "demo")
// Let's match build.ts logic:
// const projectRoot = join(rootDir, "..", "..");
// const outDir = join(projectRoot, "docs", "demo");
const projectRoot = join(rootDir, "..", "..");
const outDir = join(projectRoot, "docs", "demo");

console.log("🚀 Starting ehrtslib demo app dev server...");
console.log(`📂 Serving: ${outDir}`);

// Start the build process in watch mode
const buildCommand = new Deno.Command("deno", {
    args: ["run", "-A", "--watch=src/", "scripts/build.ts"],
    stdout: "inherit",
    stderr: "inherit",
});

const buildProcess = buildCommand.spawn();

// Start the static file server
Deno.serve({ port: 8000 }, (req) => {
    return serveDir(req, {
        fsRoot: outDir,
        showDirListing: true,
    });
});

// Note: Ensure we clean up the subprocess if this script exits
// Deno does not automatically kill subprocesses strictly on exit in all cases,
// but Ctrl+C usually propagates.
