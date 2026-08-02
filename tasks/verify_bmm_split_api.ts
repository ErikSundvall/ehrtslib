/**
 * Verify that splitting a model monolith into BMM package modules preserved its public API.
 *
 * Compares the exported symbol names of `tasks/_monolith_backup/openehr_<comp>.ts`
 * (the pre-split file) with those reachable from `<comp>/mod.ts` and `openehr_<comp>.ts`.
 *
 *   deno run -A tasks/verify_bmm_split_api.ts [comp...]
 */
import ts from "npm:typescript@5";

const COMPONENTS = ["base", "lang", "term", "rm", "am"];

function monolithExports(path: string, text: string): Set<string> {
  const sf = ts.createSourceFile(path, text, ts.ScriptTarget.ESNext, true, ts.ScriptKind.TS);
  const names = new Set<string>();
  for (const st of sf.statements) {
    if (!(ts.getCombinedModifierFlags(st as ts.Declaration) & ts.ModifierFlags.Export)) continue;
    if (ts.isVariableStatement(st)) {
      for (const d of st.declarationList.declarations) names.add(d.name.getText(sf));
    } else {
      const n = (st as ts.DeclarationStatement).name?.getText(sf);
      if (n) names.add(n);
    }
  }
  return names;
}

async function barrelExports(entry: string): Promise<Set<string>> {
  const cmd = new Deno.Command(Deno.execPath(), {
    args: ["doc", "--json", "--no-lock", entry],
    stdout: "piped",
    stderr: "piped",
  });
  const { code, stdout, stderr } = await cmd.output();
  if (code !== 0) throw new Error(`deno doc failed for ${entry}: ${new TextDecoder().decode(stderr)}`);
  const doc = JSON.parse(new TextDecoder().decode(stdout));
  const names = new Set<string>();
  for (const node of Object.values(doc.nodes ?? {}) as { symbols?: { name: string }[] }[]) {
    for (const s of node.symbols ?? []) names.add(s.name);
  }
  return names;
}

let failures = 0;
const selected = Deno.args.length ? Deno.args : COMPONENTS;

for (const comp of selected) {
  const backup = `tasks/_monolith_backup/openehr_${comp}.ts`;
  const before = monolithExports(backup, await Deno.readTextFile(backup));

  for (const entry of [`${comp}/mod.ts`, `openehr_${comp}.ts`]) {
    const after = await barrelExports(entry);
    const missing = [...before].filter((n) => !after.has(n)).sort();
    const added = [...after].filter((n) => !before.has(n)).sort();
    const status = missing.length ? "FAIL" : "ok";
    if (missing.length) failures++;
    console.log(`${status}  ${entry}: ${before.size} exported before, ${after.size} now`);
    if (missing.length) console.log(`      missing: ${missing.join(", ")}`);
    if (added.length) console.log(`      added:   ${added.join(", ")}`);
  }
}

console.log(failures ? `\n${failures} entry point(s) lost exports` : "\nno exports lost");
Deno.exit(failures ? 1 : 0);
