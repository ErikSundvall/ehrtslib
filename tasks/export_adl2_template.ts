/**
 * Export an ADL2 template (.adlt/.adls with overlays) to ADL 1.4 OPT XML.
 *
 *   deno task export:opt14 --lib <dir> [--lib <dir>...] --template <file> \
 *     [--out <file.opt>] [--no-multilingual-repeat-workaround] [--lang en,sv]
 *
 * All .adls/.adlt/.adl files under each --lib directory are loaded as the
 * archetype library. Warnings go to stderr.
 */
import { Adl2TemplateLibrary } from "../generation/opt14/adl2_template_library.ts";
import { exportAdl2TemplateToOpt14 } from "../generation/opt14/opt14_exporter.ts";

const args = [...Deno.args];
const libs: string[] = [];
let template = "", out = "", workaround = true;
let languages: string[] | undefined;
while (args.length) {
  const a = args.shift()!;
  if (a === "--lib") libs.push(args.shift()!);
  else if (a === "--template") template = args.shift()!;
  else if (a === "--out") out = args.shift()!;
  else if (a === "--lang") languages = args.shift()!.split(",");
  else if (a === "--no-multilingual-repeat-workaround") workaround = false;
  else if (a === "--multilingual-repeat-workaround") workaround = true;
  else {
    console.error(`Unknown argument ${a}`);
    Deno.exit(2);
  }
}
if (!template) {
  console.error("Missing --template <file>");
  Deno.exit(2);
}

const lib = new Adl2TemplateLibrary();
function load(dir: string) {
  for (const e of Deno.readDirSync(dir)) {
    const p = `${dir}/${e.name}`;
    if (e.isDirectory) load(p);
    else if (/\.(adls|adlt|adl)$/.test(e.name) && p !== template) {
      try {
        lib.addSource(Deno.readTextFileSync(p), p);
      } catch (err) {
        console.error(`skip ${p}: ${(err as Error).message}`);
      }
    }
  }
}
libs.forEach(load);
const [tid] = lib.addSource(Deno.readTextFileSync(template), template);
const r = exportAdl2TemplateToOpt14(lib, tid, {
  multilingualRepeatWorkaround: workaround,
  languages,
});
for (const w of r.warnings) console.error("WARN " + w);
if (out) Deno.writeTextFileSync(out, r.xml);
else console.log(r.xml);
console.error(
  `${r.templateId}: ${r.componentArchetypeIds.length} archetypes, ` +
    `${r.annotations.length} L10n annotations, ` +
    `${r.repeatedTranslationConflicts.length} repeated-translation conflicts` +
    (r.translationsDropped ? " (TRANSLATIONS DROPPED)" : ""),
);
