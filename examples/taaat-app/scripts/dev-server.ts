
import { join, fromFileUrl, dirname } from "https://deno.land/std@0.210.0/path/mod.ts";
import { serveDir } from "https://deno.land/std@0.210.0/http/file_server.ts";

const __dirname = dirname(fromFileUrl(import.meta.url));
const rootDir = join(__dirname, "..");
const projectRoot = join(rootDir, "..", "..");
const outDir = join(projectRoot, "docs", "taaat");

console.log("TAAAT dev server → http://localhost:8001");
console.log(`Serving: ${outDir}`);

new Deno.Command("deno", {
  args: ["run", "-A", "--watch=src/,public/", "scripts/build.ts"],
  cwd: rootDir,
  stdout: "inherit",
  stderr: "inherit",
}).spawn();

Deno.serve({ port: 8001 }, (req) =>
  serveDir(req, { fsRoot: outDir, showDirListing: true })
);
