/**
 * Split an openEHR model megaclass file into per-BMM-package modules.
 *
 * Package layout is taken verbatim from `tasks/bmm_package_map.json`; no groupings
 * are invented here. A BMM package `org.openehr.<comp>.s1[.s2...sn]` becomes:
 *   - n == 1 -> `<comp>/s1/s1.ts`      (top-level package = directory under the component)
 *   - n  > 1 -> `<comp>/s1/.../sn.ts`  (nested package = file under that tree)
 *
 * Usage:
 *   deno run -A tasks/split_model_by_bmm_packages.ts base rm am lang term
 *   deno run -A tasks/split_model_by_bmm_packages.ts rm --dry-run
 *
 * Flags:
 *   --dry-run          report the plan, write nothing
 *   --refresh-backup   re-copy the monolith into tasks/_monolith_backup/ before splitting
 *   --keep-monolith    do not rewrite `<comp>/openehr_<comp>.ts` into a re-export shim
 */
import ts from "npm:typescript@5";

// ---------------------------------------------------------------------------
// configuration
// ---------------------------------------------------------------------------

const MAP_PATH = "tasks/bmm_package_map.json";
const BACKUP_DIR = "tasks/_monolith_backup";

/** Dependency order from tasks/bmm_dependencies.json: base has no deps, rm/am depend on it. */
const COMPONENT_ORDER = ["base", "lang", "term", "rm", "am"];

/**
 * Exported symbols that are infrastructure rather than BMM classes and therefore
 * belong next to the shared module state they operate on (`_shared.ts`).
 * They are re-exported by name from the component `mod.ts` so the public API is unchanged.
 */
const SHARED_EXTRAS: Record<string, string[]> = {
  base: ["registerType", "isTypeRegistered", "getRegisteredTypes"],
};

// ---------------------------------------------------------------------------
// tiny posix path helpers (output module specifiers must use "/")
// ---------------------------------------------------------------------------

function normalizePosix(p: string): string {
  const abs = p.startsWith("/");
  const out: string[] = [];
  for (const seg of p.split("/")) {
    if (seg === "" || seg === ".") continue;
    if (seg === ".." && out.length && out[out.length - 1] !== "..") out.pop();
    else out.push(seg);
  }
  return (abs ? "/" : "") + out.join("/");
}

function dirnamePosix(p: string): string {
  const i = p.lastIndexOf("/");
  return i < 0 ? "" : p.slice(0, i);
}

/** Module specifier for `to` as seen from the file `from` (both repo-relative). */
function relativeSpecifier(from: string, to: string): string {
  const fromDir = dirnamePosix(normalizePosix(from)).split("/").filter(Boolean);
  const toParts = normalizePosix(to).split("/").filter(Boolean);
  let i = 0;
  while (i < fromDir.length && i < toParts.length - 1 && fromDir[i] === toParts[i]) i++;
  const up = fromDir.length - i;
  const segs = up > 0 ? Array(up).fill("..") : ["."];
  return [...segs, ...toParts.slice(i)].join("/");
}

// ---------------------------------------------------------------------------
// reference collection
// ---------------------------------------------------------------------------

interface Ref {
  /** referenced in a value position (needs a runtime binding, not just `import type`) */
  value: boolean;
  /** referenced while the module body is evaluated (heritage clause, static block, top-level init) */
  evalTime: boolean;
}

/** Child nodes that are declaration/member names rather than references. */
function isNameChild(parent: ts.Node, child: ts.Node): boolean {
  const p = parent as unknown as Record<string, unknown>;
  if (p.propertyName === child) return true;
  if (p.label === child) return true;
  if (p.name === child) return !ts.isShorthandPropertyAssignment(parent);
  return false;
}

function collectRefs(statements: readonly ts.Node[]): Map<string, Ref> {
  const out = new Map<string, Ref>();
  const add = (name: string, value: boolean, evalTime: boolean) => {
    const cur = out.get(name);
    if (cur) {
      cur.value = cur.value || value;
      cur.evalTime = cur.evalTime || evalTime;
    } else {
      out.set(name, { value, evalTime });
    }
  };

  const visit = (n: ts.Node, inType: boolean, evalTime: boolean): void => {
    if (ts.isIdentifier(n)) {
      add(n.text, !inType, !inType && evalTime);
      return;
    }
    if (ts.isQualifiedName(n)) return visit(n.left, inType, evalTime);
    if (ts.isPropertyAccessExpression(n)) return visit(n.expression, inType, evalTime);

    if (ts.isTypeReferenceNode(n)) {
      visit(n.typeName, true, false);
      n.typeArguments?.forEach((t) => visit(t, true, false));
      return;
    }

    if (ts.isHeritageClause(n)) {
      const onClass = n.parent && (ts.isClassDeclaration(n.parent) || ts.isClassExpression(n.parent));
      // Only `class X extends Y` needs Y as a value at module-evaluation time;
      // `implements` and `interface X extends Y` are type-only.
      const asValue = !!onClass && n.token === ts.SyntaxKind.ExtendsKeyword;
      for (const t of n.types) {
        if (asValue) {
          visit(t.expression, false, true);
          t.typeArguments?.forEach((a) => visit(a, true, false));
        } else {
          visit(t, true, false);
        }
      }
      return;
    }

    if (ts.isPropertyDeclaration(n)) {
      const isStatic = !!(ts.getCombinedModifierFlags(n) & ts.ModifierFlags.Static);
      if (n.type) visit(n.type, true, false);
      // instance field initialisers run at construction time, static ones at class definition time
      if (n.initializer) visit(n.initializer, false, isStatic && evalTime);
      return;
    }

    if (ts.isFunctionLike(n)) {
      n.typeParameters?.forEach((t) => visit(t, true, false));
      for (const param of n.parameters) {
        if (param.type) visit(param.type, true, false);
        if (param.initializer) visit(param.initializer, false, false);
      }
      if (n.type) visit(n.type, true, false);
      const body = (n as ts.FunctionLikeDeclaration).body;
      if (body) visit(body, false, false);
      return;
    }

    const nowType = inType || ts.isTypeNode(n);
    n.forEachChild((c) => {
      if (isNameChild(n, c)) return;
      visit(c, nowType, evalTime);
    });
  };

  for (const st of statements) {
    // top-level class/variable bodies are evaluated when the module is evaluated
    visit(st, false, true);
  }
  return out;
}

// ---------------------------------------------------------------------------
// monolith parsing
// ---------------------------------------------------------------------------

interface Decl {
  name: string;
  kind: string;
  exported: boolean;
  /** leading comments / blank lines that documented the declaration in the monolith */
  leading: string;
  /** the declaration itself, starting at its first modifier or keyword */
  code: string;
  /** unqualified name of the class this one extends, when it is declared in the same monolith */
  baseName?: string;
  node: ts.Node;
}

/** `class X extends Y` where Y is a bare identifier (cross-component bases are qualified). */
function localBaseName(st: ts.Statement): string | undefined {
  if (!ts.isClassDeclaration(st)) return undefined;
  for (const h of st.heritageClauses ?? []) {
    if (h.token !== ts.SyntaxKind.ExtendsKeyword) continue;
    const expr = h.types[0]?.expression;
    if (expr && ts.isIdentifier(expr)) return expr.text;
  }
  return undefined;
}

interface ExternalBinding {
  /** repo-relative path of the imported module */
  target: string;
  /** "ns" | "named" | "default" */
  form: string;
  /** original name in the source module for renamed named imports */
  propertyName?: string;
  typeOnly: boolean;
}

interface Monolith {
  header: string;
  footer: string;
  decls: Decl[];
  externals: Map<string, ExternalBinding>;
}

function parseMonolith(sourcePath: string, text: string): Monolith {
  const sf = ts.createSourceFile(sourcePath, text, ts.ScriptTarget.ESNext, true, ts.ScriptKind.TS);
  const sourceDir = dirnamePosix(sourcePath);
  const decls: Decl[] = [];
  const externals = new Map<string, ExternalBinding>();
  let lastEnd = 0;

  for (const st of sf.statements) {
    lastEnd = st.getEnd();
    if (ts.isImportDeclaration(st)) {
      const spec = (st.moduleSpecifier as ts.StringLiteral).text;
      const target = spec.startsWith(".") ? normalizePosix(`${sourceDir}/${spec}`) : spec;
      const clause = st.importClause;
      if (!clause) continue;
      const typeOnly = clause.isTypeOnly;
      if (clause.name) {
        externals.set(clause.name.text, { target, form: "default", typeOnly });
      }
      const b = clause.namedBindings;
      if (b && ts.isNamespaceImport(b)) {
        externals.set(b.name.text, { target, form: "ns", typeOnly });
      } else if (b && ts.isNamedImports(b)) {
        for (const el of b.elements) {
          externals.set(el.name.text, {
            target,
            form: "named",
            propertyName: el.propertyName?.text,
            typeOnly: typeOnly || el.isTypeOnly,
          });
        }
      }
      continue;
    }

    const kind = ts.SyntaxKind[st.kind];
    const exported = !!(ts.getCombinedModifierFlags(st as ts.Declaration) & ts.ModifierFlags.Export);
    const leading = text.slice(st.getFullStart(), st.getStart(sf)).replace(/^[\r\n]+/, "");
    const code = text.slice(st.getStart(sf), st.getEnd());

    if (ts.isVariableStatement(st)) {
      const names = st.declarationList.declarations.map((d) => d.name.getText(sf));
      decls.push({ name: names[0], kind: "variable", exported, leading, code, node: st });
      if (names.length > 1) {
        console.warn(`  ! multi-declarator variable statement kept as one unit: ${names.join(", ")}`);
      }
      continue;
    }

    const named = st as ts.DeclarationStatement;
    decls.push({
      name: named.name?.getText(sf) ?? `<anonymous_${decls.length}>`,
      kind,
      exported,
      leading,
      code,
      baseName: localBaseName(st),
      node: st,
    });
  }

  // provenance banner at the top of the monolith, kept with the shared internals
  const first = sf.statements[0];
  const header = first ? text.slice(0, first.getStart(sf)).trimEnd() : "";
  const footer = text.slice(lastEnd).trim();
  return { header, footer, decls, externals };
}

// ---------------------------------------------------------------------------
// package map
// ---------------------------------------------------------------------------

function packageToFile(comp: string, pkg: string): string {
  const prefix = `org.openehr.${comp}.`;
  if (!pkg.startsWith(prefix)) {
    throw new Error(`package "${pkg}" does not start with "${prefix}"`);
  }
  const segs = pkg.slice(prefix.length).split(".").filter(Boolean);
  if (segs.length === 0) throw new Error(`package "${pkg}" has no path segments`);
  // top-level package -> directory named after it, holding a file of the same name
  if (segs.length === 1) return `${comp}/${segs[0]}/${segs[0]}.ts`;
  return `${comp}/${segs.join("/")}.ts`;
}

// ---------------------------------------------------------------------------
// emission
// ---------------------------------------------------------------------------

const BANNER = (comp: string, subject: string) =>
  `// openEHR ${comp.toUpperCase()} model — ${subject}\n` +
  `// Generated by tasks/split_model_by_bmm_packages.ts from tasks/bmm_package_map.json.\n` +
  `// Package boundaries follow the BMM package structure; edit the class bodies here,\n` +
  `// but re-run the splitter rather than hand-moving declarations between packages.\n`;

interface PlannedFile {
  path: string;
  decls: Decl[];
  /** BMM package this file represents, if any */
  pkg?: string;
}

interface Emission {
  files: Map<string, string>;
  declCounts: Map<string, number>;
  unassigned: string[];
  emptyPackages: string[];
  evalCycles: string[][];
  /** groups of mutually importing package modules, in required evaluation order */
  cyclicGroups: string[][];
  /** unmapped bridge classes placed in their nearest mapped ancestor's package */
  bridged: Map<string, string>;
}

/** Tarjan strongly-connected components over a runtime (non type-only) import graph. */
function stronglyConnected(graph: Map<string, Set<string>>): string[][] {
  const index = new Map<string, number>();
  const low = new Map<string, number>();
  const onStack = new Set<string>();
  const stack: string[] = [];
  const comps: string[][] = [];
  let counter = 0;

  const strongConnect = (v: string) => {
    index.set(v, counter);
    low.set(v, counter);
    counter++;
    stack.push(v);
    onStack.add(v);
    for (const w of graph.get(v) ?? []) {
      if (!index.has(w)) {
        if (graph.has(w)) strongConnect(w);
        else continue;
        low.set(v, Math.min(low.get(v)!, low.get(w)!));
      } else if (onStack.has(w)) {
        low.set(v, Math.min(low.get(v)!, index.get(w)!));
      }
    }
    if (low.get(v) === index.get(v)) {
      const comp: string[] = [];
      let w: string;
      do {
        w = stack.pop()!;
        onStack.delete(w);
        comp.push(w);
      } while (w !== v);
      comps.push(comp);
    }
  };

  for (const v of graph.keys()) if (!index.has(v)) strongConnect(v);
  return comps;
}

function buildComponent(
  comp: string,
  sourcePath: string,
  mono: Monolith,
  pkgMap: { packages: string[]; class_to_package: Record<string, string> },
): Emission {
  const sharedPath = `${comp}/_shared.ts`;
  const unassignedPath = `${comp}/_unassigned.ts`;

  const sharedExtras = new Set(SHARED_EXTRAS[comp] ?? []);
  const symbolToFile = new Map<string, string>();
  const planned = new Map<string, PlannedFile>();
  const unassigned: string[] = [];

  // A class that the map does not place, but that a mapped class extends, sits in the
  // middle of an inheritance chain that leaves and re-enters a BMM package. Leaving it in
  // _unassigned.ts would make two modules need each other's classes at definition time,
  // which ESM cannot satisfy in either order. Such a bridge class is placed in the package
  // of its nearest mapped ancestor — still a package name taken from the map.
  const baseOf = new Map(mono.decls.filter((d) => d.baseName).map((d) => [d.name, d.baseName!]));
  const bridged = new Map<string, string>();
  const packageOf = (name: string) => pkgMap.class_to_package[name] ?? bridged.get(name);
  for (let changed = true; changed;) {
    changed = false;
    for (const d of mono.decls) {
      if (!d.baseName || !packageOf(d.name)) continue;
      if (packageOf(d.baseName)) continue;
      let ancestor = baseOf.get(d.baseName);
      while (ancestor && !packageOf(ancestor)) ancestor = baseOf.get(ancestor);
      if (!ancestor) continue;
      bridged.set(d.baseName, packageOf(ancestor)!);
      changed = true;
    }
  }

  const fileFor = (path: string, pkg?: string): PlannedFile => {
    let f = planned.get(path);
    if (!f) {
      f = { path, decls: [], pkg };
      planned.set(path, f);
    }
    if (pkg) f.pkg = pkg;
    return f;
  };

  for (const d of mono.decls) {
    let target: string;
    let pkg: string | undefined;
    if (!d.exported || sharedExtras.has(d.name)) {
      target = sharedPath;
    } else {
      pkg = packageOf(d.name);
      if (pkg) {
        target = packageToFile(comp, pkg);
      } else {
        target = unassignedPath;
        unassigned.push(`${d.name} (${d.kind})`);
      }
    }
    fileFor(target, pkg).decls.push(d);
    symbolToFile.set(d.name, target);
  }

  const emptyPackages = pkgMap.packages
    .filter((p) => !planned.has(packageToFile(comp, p)))
    .map((p) => p);

  // ---- imports -----------------------------------------------------------
  interface Edge {
    to: string;
    /** needs the target's bindings while this module's body is evaluated */
    evalTime: boolean;
    /** a runtime import, i.e. one that survives type erasure and can form an ESM cycle */
    value: boolean;
  }
  const edges = new Map<string, Edge[]>();

  const renderFile = (f: PlannedFile, prologue: string[] = []): string => {
    const refs = collectRefs(f.decls.map((d) => d.node));
    const own = new Set(f.decls.map((d) => d.name));

    // module specifier -> { value: Set, type: Set } | namespace/default form
    const named = new Map<string, { value: Set<string>; type: Set<string> }>();
    const plain: string[] = [];
    const fileEdges: Edge[] = [];

    const bucket = (spec: string) => {
      let b = named.get(spec);
      if (!b) {
        b = { value: new Set(), type: new Set() };
        named.set(spec, b);
      }
      return b;
    };

    const sortedRefs = [...refs.entries()].sort((a, b) => a[0].localeCompare(b[0]));

    for (const [name, ref] of sortedRefs) {
      if (own.has(name)) continue;

      const internal = symbolToFile.get(name);
      if (internal) {
        if (internal === f.path) continue;
        const spec = relativeSpecifier(f.path, internal);
        if (ref.value) bucket(spec).value.add(name);
        else bucket(spec).type.add(name);
        fileEdges.push({ to: internal, evalTime: ref.evalTime, value: ref.value });
        continue;
      }

      const ext = mono.externals.get(name);
      if (!ext) continue; // globals / unresolved -> same as in the monolith

      let target = ext.target;
      // point cross-component imports at the split barrel rather than the shim
      const shimMatch = /^([a-z_]+)\/openehr_\1\.ts$/.exec(target);
      if (shimMatch) target = `${shimMatch[1]}/mod.ts`;
      const spec = target.startsWith(".") || target.includes("/")
        ? relativeSpecifier(f.path, target)
        : target;

      if (ext.form === "ns") {
        plain.push(`import * as ${name} from "${spec}";`);
      } else if (ext.form === "default") {
        plain.push(`import ${name} from "${spec}";`);
      } else {
        const local = ext.propertyName ? `${ext.propertyName} as ${name}` : name;
        if (ref.value && !ext.typeOnly) bucket(spec).value.add(local);
        else bucket(spec).type.add(local);
      }
    }

    edges.set(f.path, fileEdges);

    const importLines: string[] = [];
    for (const spec of [...named.keys()].sort()) {
      const b = named.get(spec)!;
      const values = [...b.value].sort();
      const types = [...b.type].filter((t) => !b.value.has(t)).sort();
      if (values.length) importLines.push(`import { ${values.join(", ")} } from "${spec}";`);
      if (types.length) importLines.push(`import type { ${types.join(", ")} } from "${spec}";`);
    }
    importLines.push(...plain.sort());

    const subject = f.pkg
      ? `BMM package ${f.pkg}`
      : f.path.endsWith("_shared.ts")
      ? "shared internals (not part of the public barrel)"
      : "declarations with no BMM package in the map";

    const parts = [BANNER(comp, subject)];
    if (f.path === sharedPath && mono.header) parts.push(`\n${mono.header}\n`);
    if (prologue.length) parts.push("\n" + prologue.join("\n") + "\n");
    if (importLines.length) parts.push("\n" + importLines.join("\n") + "\n");
    // internals hoisted into _shared.ts have to become exports so the packages can import them
    const renderDecl = (d: Decl) =>
      (d.leading + (d.exported || f.path !== sharedPath ? d.code : `export ${d.code}`)).trimEnd();
    parts.push("\n" + f.decls.map(renderDecl).join("\n\n") + "\n");
    if (f.path === sharedPath && mono.footer) parts.push(`\n${mono.footer}\n`);
    return parts.join("");
  };

  const files = new Map<string, string>();
  for (const f of planned.values()) files.set(f.path, renderFile(f));

  // ---- evaluation-order guards for mutually importing packages -----------
  // A BMM package split can leave two modules importing each other at runtime
  // (e.g. `Ordered extends Any` one way, `Any.equal()` returning a `Boolean` the other).
  // ESM only copes if the module that needs a binding while its own body runs is
  // entered first, so every barrel enters such groups in that order up front.
  const runtimeGraph = new Map<string, Set<string>>(
    [...planned.keys()].map((p) => [p, new Set<string>()]),
  );
  for (const [from, list] of edges) {
    const set = runtimeGraph.get(from);
    if (!set) continue;
    for (const e of list) if (e.value && runtimeGraph.has(e.to)) set.add(e.to);
  }

  const evalNeeds = new Map<string, Set<string>>();
  for (const [from, list] of edges) {
    evalNeeds.set(from, new Set(list.filter((e) => e.evalTime).map((e) => e.to)));
  }

  const cyclicGroups: string[][] = [];
  for (const comp of stronglyConnected(runtimeGraph)) {
    if (comp.length < 2) continue;
    const members = new Set(comp);
    // consumers before providers: `X extends Y` means X must be entered before Y
    const ordered: string[] = [];
    const seen = new Set<string>();
    const visit = (p: string) => {
      if (seen.has(p)) return;
      seen.add(p);
      ordered.push(p);
      for (const dep of [...(evalNeeds.get(p) ?? [])].sort()) {
        if (members.has(dep)) visit(dep);
      }
    };
    const consumerFirst = [...comp].sort((a, b) => {
      const an = [...(evalNeeds.get(a) ?? [])].filter((x) => members.has(x)).length;
      const bn = [...(evalNeeds.get(b) ?? [])].filter((x) => members.has(x)).length;
      return bn - an || a.localeCompare(b);
    });
    for (const p of consumerFirst) visit(p);
    cyclicGroups.push(ordered);
  }

  const guardFor = (fromPath: string): string[] => {
    if (!cyclicGroups.length) return [];
    const lines = [
      "// Evaluation-order guard: these BMM packages import each other, so they must be",
      "// entered in this order before anything else pulls one of them in.",
    ];
    for (const group of cyclicGroups) {
      for (const member of group) lines.push(`import "${relativeSpecifier(fromPath, member)}";`);
    }
    return lines;
  };

  // ---- barrels -----------------------------------------------------------
  const packageFiles = [...planned.keys()].filter((p) => p !== sharedPath && p !== unassignedPath);

  /**
   * Dependency-first ordering of barrel entries. `units` are either package files or
   * directories; a file belongs to the unit that is the file itself or a prefix directory.
   */
  const orderByDeps = (units: string[]): string[] => {
    const unitOf = (filePath: string): string | undefined =>
      units.find((u) => u === filePath || filePath.startsWith(`${u}/`));

    const deps = new Map<string, Set<string>>(units.map((u) => [u, new Set<string>()]));
    for (const [from, list] of edges) {
      const fromUnit = unitOf(from);
      if (!fromUnit) continue;
      for (const e of list) {
        const toUnit = unitOf(e.to);
        if (toUnit && toUnit !== fromUnit) deps.get(fromUnit)!.add(toUnit);
      }
    }

    const state = new Map<string, number>();
    const result: string[] = [];
    const visit = (u: string) => {
      if (state.has(u)) return; // done, or on the stack (cycle) — first arrival wins
      state.set(u, 1);
      for (const d of [...deps.get(u)!].sort()) visit(d);
      result.push(u);
    };
    for (const u of [...units].sort()) visit(u);
    return result;
  };

  // directory -> immediate package files and subdirectories
  const dirs = new Set<string>();
  for (const p of packageFiles) dirs.add(dirnamePosix(p));
  for (const d of [...dirs]) {
    let cur = d;
    while (cur !== comp && cur !== "") {
      cur = dirnamePosix(cur);
      if (cur) dirs.add(cur);
    }
  }
  dirs.delete(comp);

  for (const dir of dirs) {
    const own = packageFiles.filter((p) => dirnamePosix(p) === dir);
    const subs = [...dirs].filter((d) => dirnamePosix(d) === dir);
    const entries = [
      ...orderByDeps(own).map((p) => `./${p.slice(dir.length + 1)}`),
      ...subs.sort().map((d) => `./${d.slice(dir.length + 1)}/mod.ts`),
    ];
    const modPath = `${dir}/mod.ts`;
    const guard = guardFor(modPath);
    files.set(
      modPath,
      BANNER(comp, `barrel for ${dir.replace(/\//g, ".")}`) +
        (guard.length ? "\n" + guard.join("\n") + "\n" : "") +
        "\n" + entries.map((e) => `export * from "${e}";`).join("\n") + "\n",
    );
  }

  // component root barrel
  const topDirs = [...dirs].filter((d) => dirnamePosix(d) === comp);
  const rootEntries = orderByDeps(topDirs).map((d) => `export * from "./${d.slice(comp.length + 1)}/mod.ts";`);
  if (planned.has(unassignedPath)) {
    rootEntries.push(`export * from "./_unassigned.ts";`);
  }
  if (sharedExtras.size) {
    rootEntries.push(`export { ${[...sharedExtras].sort().join(", ")} } from "./_shared.ts";`);
  }
  const rootGuard = guardFor(`${comp}/mod.ts`);
  files.set(
    `${comp}/mod.ts`,
    BANNER(comp, "public barrel (BMM packages in dependency order)") +
      (rootGuard.length ? "\n" + rootGuard.join("\n") + "\n" : "") +
      "\n" + rootEntries.join("\n") + "\n",
  );

  // component shim so `<comp>/openehr_<comp>.ts` keeps working
  files.set(
    sourcePath,
    `// Re-export shim: the ${comp.toUpperCase()} model now lives in per-BMM-package modules.\n` +
      `// See ./mod.ts and tasks/split_model_by_bmm_packages.ts.\n\nexport * from "./mod.ts";\n`,
  );

  // ---- eval-time cycle detection ----------------------------------------
  const evalGraph = new Map<string, Set<string>>();
  for (const [from, list] of edges) {
    const set = new Set<string>();
    for (const e of list) if (e.evalTime) set.add(e.to);
    evalGraph.set(from, set);
  }
  const evalCycles: string[][] = [];
  const color = new Map<string, number>();
  const stack: string[] = [];
  const dfs = (p: string) => {
    color.set(p, 1);
    stack.push(p);
    for (const n of evalGraph.get(p) ?? []) {
      if (color.get(n) === 1) {
        evalCycles.push([...stack.slice(stack.indexOf(n)), n]);
      } else if (!color.has(n)) dfs(n);
    }
    stack.pop();
    color.set(p, 2);
  };
  for (const p of evalGraph.keys()) if (!color.has(p)) dfs(p);

  const declCounts = new Map([...planned.values()].map((f) => [f.path, f.decls.length]));
  return { files, declCounts, unassigned, emptyPackages, evalCycles, cyclicGroups, bridged };
}

// ---------------------------------------------------------------------------
// driver
// ---------------------------------------------------------------------------

async function exists(p: string): Promise<boolean> {
  try {
    await Deno.stat(p);
    return true;
  } catch {
    return false;
  }
}

async function resolveSource(comp: string): Promise<string> {
  for (const c of [`${comp}/openehr_${comp}.ts`, `enhanced/openehr_${comp}.ts`, `openehr_${comp}.ts`]) {
    if (await exists(c)) return c;
  }
  throw new Error(`no monolith found for component "${comp}"`);
}

async function main() {
  const args = Deno.args;
  const flags = new Set(args.filter((a) => a.startsWith("--")));
  const comps = args.filter((a) => !a.startsWith("--"));
  const dryRun = flags.has("--dry-run");
  const refreshBackup = flags.has("--refresh-backup");
  const keepMonolith = flags.has("--keep-monolith");

  const selected = comps.length
    ? COMPONENT_ORDER.filter((c) => comps.includes(c)).concat(comps.filter((c) => !COMPONENT_ORDER.includes(c)))
    : COMPONENT_ORDER;

  const pkgMap = JSON.parse(await Deno.readTextFile(MAP_PATH));

  for (const comp of selected) {
    const sourcePath = await resolveSource(comp);
    const backupPath = `${BACKUP_DIR}/openehr_${comp}.ts`;

    let text: string;
    if (!refreshBackup && (await exists(backupPath))) {
      text = await Deno.readTextFile(backupPath);
      console.log(`\n### ${comp}: using backup ${backupPath} (source ${sourcePath})`);
    } else {
      text = await Deno.readTextFile(sourcePath);
      if (!dryRun) {
        await Deno.mkdir(BACKUP_DIR, { recursive: true });
        await Deno.writeTextFile(backupPath, text);
      }
      console.log(`\n### ${comp}: reading ${sourcePath} (backup -> ${backupPath})`);
    }

    if (!/^export\s+(abstract\s+)?(class|interface|enum)/m.test(text)) {
      console.warn(`  ! ${sourcePath} looks like a shim already; skipping ${comp}`);
      continue;
    }

    const mono = parseMonolith(sourcePath, text);
    const emission = buildComponent(comp, sourcePath, mono, pkgMap[comp]);

    const outFiles = [...emission.files.keys()].sort();
    console.log(`  declarations: ${mono.decls.length}, output files: ${outFiles.length}`);
    for (const p of outFiles) {
      const n = emission.declCounts.get(p);
      console.log(`    ${p}${n === undefined ? "" : ` (${n})`}`);
    }
    if (emission.unassigned.length) {
      console.warn(
        `  ! WARNING ${emission.unassigned.length} symbol(s) have no BMM package in the map -> ${comp}/_unassigned.ts:\n      ` +
          emission.unassigned.join("\n      "),
      );
    }
    if (emission.bridged.size) {
      console.log(`  note: ${emission.bridged.size} unmapped bridge class(es) placed in their nearest mapped ancestor's package:`);
      for (const [name, pkg] of emission.bridged) console.log(`      ${name} -> ${pkg}`);
    }
    if (emission.emptyPackages.length) {
      console.log(`  note: ${emission.emptyPackages.length} BMM package(s) have no implementation and were skipped:`);
      for (const p of emission.emptyPackages) console.log(`      ${p}`);
    }
    if (emission.cyclicGroups.length) {
      console.log(`  note: ${emission.cyclicGroups.length} mutually importing package group(s); barrels enter them in this order:`);
      for (const g of emission.cyclicGroups) console.log(`      ${g.join(" -> ")}`);
    }
    if (emission.evalCycles.length) {
      console.warn(`  ! WARNING ${emission.evalCycles.length} module-evaluation-time cycle(s):`);
      for (const c of emission.evalCycles) console.warn(`      ${c.join(" -> ")}`);
    }

    if (dryRun) continue;

    for (const [p, content] of emission.files) {
      if (p === sourcePath && keepMonolith) continue;
      const dir = dirnamePosix(p);
      if (dir) await Deno.mkdir(dir, { recursive: true });
      await Deno.writeTextFile(p, content);
    }

    // root re-export wrapper points at the barrel
    const rootWrapper = `openehr_${comp}.ts`;
    if (await exists(rootWrapper)) {
      await Deno.writeTextFile(
        rootWrapper,
        `// Re-export wrapper for openehr_${comp}\n` +
          `//\n` +
          `// Stable public path: the implementation lives in ./${comp}/, split into one module\n` +
          `// per BMM package (see tasks/bmm_package_map.json).\n\n` +
          `export * from "./${comp}/mod.ts";\n`,
      );
    }
  }
}

if (import.meta.main) await main();
