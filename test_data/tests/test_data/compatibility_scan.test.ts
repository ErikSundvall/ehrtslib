/**
 * Scan test_data corpora for parse compatibility; report cross-source issues.
 */

import { assert } from "https://deno.land/std@0.220.0/assert/mod.ts";
import { parseAdl } from "../../enhanced/parser/mod.ts";
import { parseOptXml } from "../../enhanced/parser/legacy/opt_xml_parser.ts";

const ROOT = new URL("../../test_data/", import.meta.url);

interface ScanResult {
  path: string;
  corpus: string;
  ok: boolean;
  message: string;
}

const ADL_CORPORA = [
  "adl2",
  "adl14",
  "archie-tests",
];

Deno.test("test_data compatibility scan", async () => {
  const results: ScanResult[] = [];

  for (const corpus of ADL_CORPORA) {
    const dir = new URL(`${corpus}/`, ROOT);
    try {
      for await (const entry of Deno.readDir(dir)) {
        if (!entry.isFile || !/\.(adl|adls)$/i.test(entry.name)) continue;
        const path = `${corpus}/${entry.name}`;
        const url = new URL(entry.name, dir);
        try {
          const parsed = parseAdl(await Deno.readTextFile(url));
          results.push({ path, corpus, ok: true, message: `parsed ${parsed.kind}` });
        } catch (e) {
          results.push({ path, corpus, ok: false, message: (e as Error).message });
        }
      }
    } catch {
      // corpus dir may be missing until download_fixtures runs
    }
  }

  // Optional heavier corpora (may be slow)
  for (const corpus of ["archie-tests/flattening", "archie-tests/validity-templates", "adl2/templates"]) {
    const dir = new URL(`${corpus}/`, ROOT);
    try {
      for await (const entry of Deno.readDir(dir)) {
        if (!entry.isFile || !/\.(adl|adls)$/i.test(entry.name)) continue;
        const path = `${corpus}/${entry.name}`;
        try {
          const parsed = parseAdl(await Deno.readTextFile(new URL(entry.name, dir)));
          results.push({ path, corpus, ok: true, message: `parsed ${parsed.kind}` });
        } catch (e) {
          results.push({ path, corpus, ok: false, message: (e as Error).message });
        }
      }
    } catch { /* optional */ }
  }

  for (const sub of ["primitives", "basics", "structures", "terminology"]) {
    const corpus = `archie-tests/${sub}`;
    const dir = new URL(`${corpus}/`, ROOT);
    try {
      for await (const entry of Deno.readDir(dir)) {
        if (!entry.isFile || !entry.name.endsWith(".adls")) continue;
        const path = `${corpus}/${entry.name}`;
        try {
          const parsed = parseAdl(await Deno.readTextFile(new URL(entry.name, dir)));
          results.push({ path, corpus, ok: true, message: `parsed ${parsed.kind}` });
        } catch (e) {
          results.push({ path, corpus, ok: false, message: (e as Error).message });
        }
      }
    } catch { /* optional */ }
  }

  const optDir = new URL("opt14/", ROOT);
  for await (const entry of Deno.readDir(optDir)) {
    if (!entry.isFile || !entry.name.endsWith(".opt")) continue;
    const path = `opt14/${entry.name}`;
    try {
      parseOptXml(await Deno.readTextFile(new URL(entry.name, optDir)));
      results.push({ path, corpus: "opt14", ok: true, message: "ok" });
    } catch (e) {
      results.push({ path, corpus: "opt14", ok: false, message: (e as Error).message });
    }
  }

  const failed = results.filter((r) => !r.ok);
  if (failed.length) {
    console.warn(`test_data scan: ${failed.length}/${results.length} parse failures`);
    for (const f of failed.slice(0, 20)) {
      console.warn(`  [${f.corpus}] ${f.path}: ${f.message}`);
    }
  }

  assert(failed.filter((f) => f.corpus === "opt14").length === 0, "All opt14 must parse");
  assert(results.length >= 30, `expected >=30 fixtures scanned, got ${results.length}`);
});
