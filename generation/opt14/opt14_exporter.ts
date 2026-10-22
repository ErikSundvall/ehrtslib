/**
 * ADL2 template (with `use_archetype` / template overlays) → ADL 1.4
 * operational template (OPT) XML. See issue #123 and docs/ADL_SUPPORT.md.
 *
 * Pipeline: ADL2 flatten (specialisation chain + overlays) → expand
 * `use_archetype` roots → map ADL2 codes to ADL 1.4 at-codes per component
 * archetype → write OPT 1.4 XML (Template.xsd shape as written by ADL 1.4
 * template tools, including `component_ontologies` for translations).
 *
 * Multilingual repeated-parts workaround (discourse.openehr.org/t/2760):
 * OPT 1.4 keeps ONE `component_ontologies` block per archetype id, so when the
 * same archetype occurs several times with different names/texts, only one
 * occurrence keeps its translations. With `multilingualRepeatWorkaround`
 * (default true) the exporter adds `L10n.{lang}` path annotations for the
 * affected nodes; with it off, a warning lists what is dropped.
 */

import { buildAdl14CodeMap, idToAtCode } from "../id_to_at_code.ts";
import { bindingKeyKind, parseTermBinding } from "../term_binding.ts";
import { attributesFor } from "../../meta/rm_attributes.ts";
import {
  type Adl2Artefact,
  Adl2TemplateLibrary,
  type BindingTable,
  type FlatArtefact,
  majorArchetypeId,
  specialiseObject,
  type TermEntry,
  type TermTable,
} from "./adl2_template_library.ts";
import {
  type PAttribute,
  pClone,
  type PInterval,
  type PObject,
  type PPrimitive,
} from "./p_model.ts";

export interface Opt14ExportOptions {
  /**
   * Emit `L10n.{lang}` path annotations for nodes of repeated archetypes
   * whose texts differ between occurrences (default true). When false, a
   * warning names the archetype ids, paths and languages that are dropped.
   */
  multilingualRepeatWorkaround?: boolean;
  /** OPT `template_id`; defaults to the template's root term (original language). */
  templateId?: string;
  /** Languages to export; defaults to the template's original + translations. */
  languages?: string[];
  /**
   * Add a `name` constraint on renamed or repeated archetype roots so the
   * occurrences can be told apart in data and paths (default true).
   */
  nameConstraints?: boolean;
}

export interface LostTranslation {
  archetypeId: string;
  path: string;
  language: string;
  text: string;
  keptText?: string;
}

export interface Opt14ExportResult {
  xml: string;
  templateId: string;
  warnings: string[];
  /** Translations that OPT 1.4 cannot hold without the workaround. */
  repeatedTranslationConflicts: LostTranslation[];
  /** True when conflicts exist and were NOT covered by L10n annotations. */
  translationsDropped: boolean;
  annotations: Array<{ path: string; items: Record<string, string> }>;
  componentArchetypeIds: string[];
}

interface Component {
  flat: FlatArtefact;
  base: Adl2Artefact;
  baseDepth: number;
  id14: string;
  terms14: TermTable;
  rootCode14: string;
  /** code14 → AQL path for every coded node in this occurrence. */
  codePaths: Map<string, string>;
  path: string;
  renamed: boolean;
  /** ADL2 code → ADL 1.4 code (collision-free within the component). */
  codeMap: Map<string, string>;
}

const CODE_RE = /^(id|at|ac)(\d+(?:\.\d+)*)$/i;

/** Collapse codes introduced by template overlays onto the base archetype depth. */
export function collapseCode(code: string, baseDepth: number): string {
  const m = CODE_RE.exec(code);
  if (!m) return code;
  const segs = m[2].split(".");
  while (
    segs.length > baseDepth + 1 && segs.slice(0, -1).some((s) => s !== "0")
  ) segs.pop();
  return m[1] + segs.join(".");
}

/** ADL2 → ADL 1.4 code; shared spec mapping from `generation/id_to_at_code.ts`. */
export function adl2CodeToAdl14(code: string): string {
  return idToAtCode(code);
}

/**
 * ADL2 keeps node ids (idN) and value codes (atN) in separate code spaces;
 * ADL 1.4 has one at-code space. Map every code of a component and renumber
 * value codes that would collide with a node code.
 */
export function buildCodeMap(
  flat: FlatArtefact,
  baseDepth: number,
  warn?: (m: string) => void,
): Map<string, string> {
  const codes = new Set<string>();
  const add = (c?: string) => {
    if (c) codes.add(c);
  };
  for (const bag of Object.values(flat.terms)) Object.keys(bag ?? {}).forEach(add);
  for (const members of Object.values(flat.valueSets)) members.forEach(add);
  const walk = (o: PObject) => {
    add(o.nodeId);
    if (o.termConstraint) add(o.termConstraint.replace(/^\[|\]$/g, ""));
    for (const a of o.attrs ?? []) a.children.forEach(walk);
  };
  walk(flat.def);
  return buildAdl14CodeMap(codes, {
    normalise: (c) => collapseCode(c, baseDepth),
    terms: flat.terms,
    warn,
  });
}

export function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export class Xml {
  private lines: string[] = [];
  private depth = 0;
  open(tag: string, attrs = ""): void {
    this.lines.push(`${"  ".repeat(this.depth)}<${tag}${attrs}>`);
    this.depth++;
  }
  close(tag: string): void {
    this.depth--;
    this.lines.push(`${"  ".repeat(this.depth)}</${tag}>`);
  }
  leaf(tag: string, text: string | number | boolean, attrs = ""): void {
    this.lines.push(
      `${"  ".repeat(this.depth)}<${tag}${attrs}>${esc(String(text))}</${tag}>`,
    );
  }
  empty(tag: string): void {
    this.lines.push(`${"  ".repeat(this.depth)}<${tag}/>`);
  }
  toString(): string {
    return this.lines.join("\n");
  }
}

const XSI = ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"';

function writeInterval(
  x: Xml,
  tag: string,
  iv: PInterval,
  attrs = "",
): void {
  x.open(tag, attrs);
  x.leaf("lower_included", iv.lower !== undefined);
  x.leaf("upper_included", iv.upper !== undefined);
  x.leaf("lower_unbounded", iv.lower === undefined);
  x.leaf("upper_unbounded", iv.upper === undefined);
  if (iv.lower !== undefined) x.leaf("lower", iv.lower);
  if (iv.upper !== undefined) x.leaf("upper", iv.upper);
  x.close(tag);
}

interface NumRange {
  lower?: number;
  upper?: number;
  lowerIncl: boolean;
  upperIncl: boolean;
}

export function parseRange(expr: string): NumRange | undefined {
  const e = expr.replace(/\s+/g, "");
  let m = /^(>=|>|<=|<)(-?[\d.]+)$/.exec(e);
  if (m) {
    const v = +m[2];
    if (m[1].startsWith(">")) {
      return { lower: v, lowerIncl: m[1] === ">=", upperIncl: false };
    }
    return { upper: v, upperIncl: m[1] === "<=", lowerIncl: false };
  }
  m = /^(>)?(-?[\d.]+|\*)\.\.(<)?(-?[\d.]+|\*)$/.exec(e);
  if (m) {
    return {
      lower: m[2] === "*" ? undefined : +m[2],
      upper: m[4] === "*" ? undefined : +m[4],
      lowerIncl: !m[1] && m[2] !== "*",
      upperIncl: !m[3] && m[4] !== "*",
    };
  }
  m = /^(-?[\d.]+)$/.exec(e);
  if (m) return { lower: +m[1], upper: +m[1], lowerIncl: true, upperIncl: true };
  return undefined;
}

function writeRange(x: Xml, tag: string, r: NumRange): void {
  x.open(tag);
  x.leaf("lower_included", r.lower !== undefined && r.lowerIncl);
  x.leaf("upper_included", r.upper !== undefined && r.upperIncl);
  x.leaf("lower_unbounded", r.lower === undefined);
  x.leaf("upper_unbounded", r.upper === undefined);
  if (r.lower !== undefined) x.leaf("lower", r.lower);
  if (r.upper !== undefined) x.leaf("upper", r.upper);
  x.close(tag);
}

function isDataValueish(rm: string): boolean {
  return /^(DV_|CODE_PHRASE|TERMINOLOGY_ID|PARTY_|DV_INTERVAL)/.test(rm) ||
    /^[A-Z][a-z]/.test(rm);
}

function rmBase(rm: string): string {
  return rm.replace(/<.*$/, "");
}

function rmAttr(rm: string, name: string) {
  try {
    return attributesFor(rmBase(rm)).find((a) => a.name === name);
  } catch {
    return undefined;
  }
}

export function isContainer(rm: string, a: PAttribute): boolean {
  if (a.multiple || a.cardinality) return true;
  const meta = rmAttr(rm, a.name);
  return !!meta && (meta.multiplicity.max === null ||
    /^(List|Set|Array|Hash)</.test(meta.typeName ?? ""));
}

function bindingFor(
  bindings: BindingTable,
  code: string,
): { terminology: string; code: string } | undefined {
  for (const [t, bag] of Object.entries(bindings)) {
    const v = bag?.[code];
    if (typeof v === "string") {
      const b = parseTermBinding(t, v).binding;
      if (b) return b;
    }
  }
  return undefined;
}

export class Opt14Exporter {
  private warnings: string[] = [];
  private comps = new WeakMap<PObject, Component>();
  private occurrences: Component[] = [];
  private languages: string[] = [];
  private origLang = "en";
  private opts: Required<
    Pick<Opt14ExportOptions, "multilingualRepeatWorkaround" | "nameConstraints">
  > & Opt14ExportOptions;

  constructor(
    private library: Adl2TemplateLibrary,
    options: Opt14ExportOptions = {},
  ) {
    this.opts = {
      ...options,
      multilingualRepeatWorkaround: options.multilingualRepeatWorkaround ?? true,
      nameConstraints: options.nameConstraints ?? true,
    };
  }

  private warn(m: string): void {
    if (!this.warnings.includes(m)) this.warnings.push(m);
  }

  private makeComponent(
    flat: FlatArtefact,
    rootNodeId: string | undefined,
    useSite?: { code: string; terms: TermTable },
  ): Component {
    const chain = flat.chain;
    let baseIdx = chain.length - 1;
    while (baseIdx > 0 && chain[baseIdx].isTemplateLevel) baseIdx--;
    const base = chain[baseIdx];
    if (base.isTemplateLevel) {
      this.warn(`${flat.art.id}: no published base archetype in chain`);
    }
    const baseDepth = chain.slice(0, baseIdx + 1).filter((a) =>
      !a.isTemplateLevel
    ).length - 1;
    // Map codes from the base archetype first so every occurrence of the same
    // 1.4 archetype id gets identical at-codes; overlay-only codes extend it.
    const codeMap = buildCodeMap(
      this.library.flatten(base),
      baseDepth,
      (m) => this.warn(`${base.id}: ${m}`),
    );
    for (const [k, v] of buildCodeMap(flat, baseDepth)) {
      if (!codeMap.has(k)) {
        const collapsed = collapseCode(k, baseDepth);
        codeMap.set(k, codeMap.get(collapsed) ?? v);
      }
    }
    const map = (c: string) => {
      const m = codeMap.get(c);
      return m !== undefined ? m : adl2CodeToAdl14(collapseCode(c, baseDepth));
    };
    const terms14: TermTable = {};
    for (const lang of this.languages) {
      const src = flat.terms[lang];
      const out: Record<string, TermEntry> = {};
      if (!src) {
        if (flat.terms[this.origLang]) {
          this.warn(
            `${base.id}: no '${lang}' translation; using '${this.origLang}' texts`,
          );
        }
      }
      const bag = src ?? flat.terms[this.origLang] ?? {};
      const codes = Object.keys(bag).sort((a, b) =>
        a.split(".").length - b.split(".").length
      );
      for (const c of codes) {
        if (!/^(id|at)\d/i.test(c)) continue;
        out[map(c)] = { ...out[map(c)], ...pClone(bag[c]) };
      }
      terms14[lang] = out;
    }
    const rootCode14 = map(rootNodeId ?? flat.def.nodeId ?? "id1");
    let renamed = false;
    if (useSite?.code) {
      for (const lang of this.languages) {
        const u = useSite.terms[lang]?.[useSite.code] ??
          useSite.terms[this.origLang]?.[useSite.code];
        if (!u?.text) continue;
        const prev = terms14[lang][rootCode14];
        if (lang === this.origLang && prev?.text !== u.text) renamed = true;
        terms14[lang][rootCode14] = {
          ...prev,
          text: u.text,
          description: u.description ?? prev?.description,
        };
      }
    }
    return {
      flat,
      base,
      baseDepth,
      id14: majorArchetypeId(base.id),
      terms14,
      rootCode14,
      codePaths: new Map(),
      path: "",
      renamed,
      codeMap,
    };
  }

  private code14(comp: Component, code: string): string {
    const m = comp.codeMap.get(code);
    return m !== undefined ? m : adl2CodeToAdl14(collapseCode(code, comp.baseDepth));
  }

  /** Replace `use_archetype` roots by their flattened archetypes (recursive). */
  private expand(obj: PObject, comp: Component, depth: number): void {
    if (depth > 40) {
      this.warn(`expansion depth exceeded under ${comp.flat.art.id}`);
      return;
    }
    for (const a of obj.attrs ?? []) {
      a.children = a.children.map((child) => {
        if (child.kind === "root" && child.archetypeRef) {
          const art = this.library.resolve(child.archetypeRef);
          if (!art) {
            this.warn(
              `use_archetype ${child.archetypeRef} not found; left as slot`,
            );
            return {
              kind: "slot",
              rmType: child.rmType,
              nodeId: child.nodeId,
              occ: child.occ,
              includes: [child.archetypeRef.replace(/\./g, "\\.") + ".*"],
            } as PObject;
          }
          const flat = this.library.flatten(art);
          let e = pClone(flat.def);
          if (child.attrs?.length) {
            e = specialiseObject(
              e,
              { ...child, kind: "complex", nodeId: e.nodeId },
              (m) => this.warn(`${art.id}: ${m}`),
            );
          }
          e.kind = "root";
          e.archetypeRef = art.id;
          if (child.occ) e.occ = child.occ;
          const c = this.makeComponent(flat, e.nodeId, {
            code: child.nodeId ?? "",
            terms: comp.flat.terms,
          });
          this.comps.set(e, c);
          this.expand(e, c, depth + 1);
          return e;
        }
        this.expand(child, comp, depth);
        return child;
      });
    }
  }

  export(templateId: string): Opt14ExportResult {
    const art = this.library.resolve(templateId);
    if (!art) throw new Error(`Template ${templateId} not in library`);
    this.origLang = art.originalLanguage;
    this.languages = this.opts.languages ?? art.languages;
    const flat = this.library.flatten(art);
    const root = pClone(flat.def);
    root.kind = "root";
    const rootComp = this.makeComponent(flat, root.nodeId);
    this.comps.set(root, rootComp);
    this.expand(root, rootComp, 0);

    const tid = this.opts.templateId ??
      rootComp.terms14[this.origLang]?.[rootComp.rootCode14]?.text ??
      art.id;

    const def = new Xml();
    this.writeObject(def, root, "definition", "", undefined, true, tid);

    // Group occurrences per 1.4 archetype id (first = kept in component_ontologies).
    const groups = new Map<string, Component[]>();
    for (const c of this.occurrences) {
      const list = groups.get(c.id14) ?? [];
      list.push(c);
      groups.set(c.id14, list);
    }

    const conflicts: LostTranslation[] = [];
    const annotationMap = new Map<string, Record<string, string>>();
    for (const [id14, list] of groups) {
      if (list.length < 2) continue;
      const kept = list[0];
      for (const occ of list.slice(1)) {
        for (const [code, path] of occ.codePaths) {
          let differs = false;
          for (const lang of this.languages) {
            const t = occ.terms14[lang]?.[code]?.text;
            const k = kept.terms14[lang]?.[code]?.text;
            if (t === undefined || t === k) continue;
            differs = true;
            if (lang !== this.origLang) {
              conflicts.push({
                archetypeId: id14,
                path,
                language: lang,
                text: t,
                keptText: k,
              });
            }
          }
          if (differs && this.opts.multilingualRepeatWorkaround) {
            // Annotate both the differing occurrence and the kept one, so
            // readers that match annotations without name predicates cannot
            // pick up a sibling's text.
            for (const [o, p] of [[occ, path], [kept, kept.codePaths.get(code)]] as const) {
              if (!p) continue;
              const items: Record<string, string> = {};
              for (const lang of this.languages) {
                const t = o.terms14[lang]?.[code]?.text;
                if (t) items[`L10n.${lang}`] = t;
              }
              annotationMap.set(p, { ...annotationMap.get(p), ...items });
            }
          }
        }
      }
    }
    const dropped = conflicts.length > 0 &&
      !this.opts.multilingualRepeatWorkaround;
    if (dropped) {
      const byArch = new Map<string, LostTranslation[]>();
      for (const c of conflicts) {
        byArch.set(c.archetypeId, [...(byArch.get(c.archetypeId) ?? []), c]);
      }
      for (const [id, list] of byArch) {
        const langs = [...new Set(list.map((l) => l.language))].join(", ");
        const paths = [...new Set(list.map((l) => l.path))];
        this.warn(
          `OPT 1.4 keeps one translation set per archetype id: repeated ` +
            `${id} has differing texts, so ${langs} translations will be ` +
            `dropped at ${paths.length} path(s): ${paths.slice(0, 8).join("; ")}` +
            `${paths.length > 8 ? "; …" : ""}. Enable ` +
            `multilingualRepeatWorkaround to emit L10n.{lang} annotations ` +
            `(discourse.openehr.org/t/2760).`,
        );
      }
    }

    const out: string[] = [];
    out.push('<?xml version="1.0" encoding="UTF-8"?>');
    out.push(
      '<template xmlns="http://schemas.openehr.org/v1"' + XSI + ">",
    );
    const head = new Xml();
    head.open("language");
    head.open("terminology_id");
    head.leaf("value", "ISO_639-1");
    head.close("terminology_id");
    head.leaf("code_string", this.origLang);
    head.close("language");
    this.writeDescription(head, art);
    const uid = String(
      (art.aom as { uid?: unknown }).uid &&
        ((art.aom as { uid?: { value?: string } }).uid?.value ??
          (art.aom as { uid?: unknown }).uid),
    );
    if (uid && uid !== "undefined" && uid !== "[object Object]") {
      head.open("uid");
      head.leaf("value", uid);
      head.close("uid");
    }
    head.open("template_id");
    head.leaf("value", tid);
    head.close("template_id");
    head.leaf("concept", tid);
    out.push(indent(head.toString(), 1));
    out.push(indent(def.toString(), 1));

    const ont = new Xml();
    const seen = new Set<string>();
    for (const c of this.occurrences) {
      if (seen.has(c.id14)) continue;
      seen.add(c.id14);
      ont.open("component_ontologies", ` archetype_id="${esc(c.id14)}"`);
      for (const lang of this.languages) {
        ont.open("term_definitions", ` language="${esc(lang)}"`);
        for (const [code, e] of Object.entries(c.terms14[lang] ?? {})) {
          writeTerm(ont, "items", code, e);
        }
        ont.close("term_definitions");
      }
      this.writeBindings(ont, c);
      ont.close("component_ontologies");
    }
    out.push(indent(ont.toString(), 1));

    const annotations = [...annotationMap.entries()].map(([path, items]) => ({
      path,
      items,
    }));
    if (annotations.length) {
      const an = new Xml();
      for (const a of annotations) {
        an.open("annotations", ` path="${esc(a.path)}"`);
        for (const [k, v] of Object.entries(a.items)) {
          an.leaf("items", v, ` id="${esc(k)}"`);
        }
        an.close("annotations");
      }
      out.push(indent(an.toString(), 1));
    }
    out.push("</template>");

    return {
      xml: out.filter((l) => l.trim()).join("\n") + "\n",
      templateId: tid,
      warnings: [...this.library.warnings, ...this.warnings],
      repeatedTranslationConflicts: conflicts,
      translationsDropped: dropped,
      annotations,
      componentArchetypeIds: [...seen],
    };
  }

  private writeBindings(x: Xml, c: Component): void {
    const byTerm = new Map<string, Array<[string, string]>>();
    for (const [t, bag] of Object.entries(c.flat.bindings ?? {})) {
      for (const [code, v] of Object.entries(bag ?? {})) {
        if (typeof v !== "string") {
          this.warn(
            `Cannot export term binding ${t}[${code}]: target is not a string`,
          );
          continue;
        }
        const kind = bindingKeyKind(code);
        if (kind === "path") {
          this.warn(
            `Skipped path term binding ${t}[${code}]: OPT 1.4 item codes must be at-codes`,
          );
          continue;
        }
        if (kind === "constraint") {
          this.warn(
            `Skipped constraint binding ${t}[${code}]: OPT 1.4 has no constraint_bindings section`,
          );
          continue;
        }
        if (kind !== "code") {
          this.warn(
            `Cannot export term binding ${t}[${code}]: unsupported key`,
          );
          continue;
        }
        const parsed = parseTermBinding(t, v);
        if (!parsed.binding) {
          this.warn(
            `Cannot export term binding ${t}[${code}]: ${
              parsed.warning ?? "unrecognized target"
            }`,
          );
          continue;
        }
        const at = this.code14(c, code);
        if (!at) continue;
        const list = byTerm.get(parsed.binding.terminology) ?? [];
        list.push([at, parsed.binding.code]);
        byTerm.set(parsed.binding.terminology, list);
      }
    }
    for (const [t, list] of byTerm) {
      x.open("term_bindings", ` terminology="${esc(t)}"`);
      for (const [code, value] of list) {
        x.open("items", ` code="${esc(code)}"`);
        x.open("value");
        x.open("terminology_id");
        x.leaf("value", t);
        x.close("terminology_id");
        x.leaf("code_string", value);
        x.close("value");
        x.close("items");
      }
      x.close("term_bindings");
    }
  }

  private writeDescription(x: Xml, art: Adl2Artefact): void {
    const d = ((art.aom as { description?: unknown }).description ?? {}) as
      Record<string, unknown>;
    const plain = (v: unknown): string | undefined => {
      if (v === undefined || v === null) return undefined;
      if (typeof v === "string") return v;
      if (Array.isArray(v)) return v.map(plain).join(", ");
      if (typeof v === "object") {
        const o = v as Record<string, unknown>;
        for (const k of ["value", "_value", "_code_string", "code_string"]) {
          if (k in o) return plain(o[k]);
        }
      }
      return String(v);
    };
    x.open("description");
    const authors = (d.original_author ?? {}) as Record<string, unknown>;
    const authorEntries = Object.entries(authors);
    if (!authorEntries.length) authorEntries.push(["name", "unknown"]);
    for (const [k, v] of authorEntries) {
      x.leaf("original_author", plain(v) ?? "", ` id="${esc(k)}"`);
    }
    x.leaf("lifecycle_state", plain(d.lifecycle_state) ?? "unmanaged");
    const other = { ...(d.other_details ?? {}) as Record<string, unknown> };
    for (const k of ["licence", "custodian_namespace", "custodian_organisation"]) {
      if (d[k] !== undefined) other[k] = d[k];
    }
    other["Generated By"] = "Ehrtslib ADL2 template → OPT 1.4 exporter";
    for (const [k, v] of Object.entries(other)) {
      x.leaf("other_details", plain(v) ?? "", ` id="${esc(k)}"`);
    }
    const details = (d.details ?? {}) as Record<string, Record<string, unknown>>;
    const langs = this.languages.filter((l) => details[l]);
    if (!langs.length) langs.push(this.origLang);
    for (const lang of langs) {
      const it = details[lang] ?? {};
      x.open("details");
      x.open("language");
      x.open("terminology_id");
      x.leaf("value", "ISO_639-1");
      x.close("terminology_id");
      x.leaf("code_string", lang);
      x.close("language");
      x.leaf("purpose", plain(it.purpose) ?? "Not Specified");
      const kw = it.keywords;
      for (const k of Array.isArray(kw) ? kw : kw ? [kw] : []) {
        x.leaf("keywords", plain(k) ?? "");
      }
      if (it.use) x.leaf("use", plain(it.use) ?? "");
      if (it.misuse) x.leaf("misuse", plain(it.misuse) ?? "");
      if (it.copyright) x.leaf("copyright", plain(it.copyright) ?? "");
      x.close("details");
    }
    x.close("description");
  }

  private writeObject(
    x: Xml,
    o: PObject,
    tag: string,
    parentPath: string,
    parent: { rm: string; attr: PAttribute; siblings: PObject[] } | undefined,
    isDefinition: boolean,
    templateId?: string,
    compIn?: Component,
  ): void {
    const ownComp = this.comps.get(o);
    const comp = ownComp ?? compIn!;
    const isRoot = !!ownComp;
    const multiple = parent ? isContainer(parent.rm, parent.attr) : false;
    const occ: PInterval = o.occ ??
      (isDefinition ? { lower: 1, upper: 1 } : multiple ? { lower: 0 } : {
        lower: 1,
        upper: 1,
      });

    // DV_QUANTITY → C_DV_QUANTITY
    if (o.kind === "complex" && o.rmType === "DV_QUANTITY") {
      this.writeQuantity(x, o, tag, occ, comp);
      return;
    }

    let xsiType = "C_COMPLEX_OBJECT";
    if (isRoot) xsiType = "C_ARCHETYPE_ROOT";
    else if (o.kind === "slot") xsiType = "ARCHETYPE_SLOT";
    else if (o.kind === "term") xsiType = "C_CODE_PHRASE";
    else if (o.kind === "prim") xsiType = "C_PRIMITIVE_OBJECT";

    let nodeId = "";
    let path = parentPath;
    const attrName = parent?.attr.name;
    if (isRoot) {
      nodeId = comp.rootCode14;
      comp.path = isDefinition ? "/" : "";
      const repeatedSibling = (parent?.siblings ?? []).filter((s) =>
        this.comps.get(s)?.id14 === comp.id14
      ).length > 1;
      const name = comp.terms14[this.origLang]?.[comp.rootCode14]?.text;
      let pred = comp.id14;
      if ((repeatedSibling || comp.renamed) && name && !isDefinition) {
        pred += ` and name/value='${name.replace(/'/g, "\\'")}'`;
      }
      path = isDefinition ? "" : `${parentPath}/${attrName}[${pred}]`;
      comp.path = path || "/";
      comp.codePaths.set(nodeId, path || "/");
      this.occurrences.push(comp);
      if (
        this.opts.nameConstraints && !isDefinition && name &&
        (repeatedSibling || comp.renamed) &&
        !(o.attrs ?? []).some((a) => a.name === "name")
      ) {
        o.attrs = [nameConstraint(name), ...(o.attrs ?? [])];
      }
    } else if (o.kind === "complex" || o.kind === "slot") {
      const c14 = o.nodeId ? this.code14(comp, o.nodeId) : "";
      const synthetic = /^at(9\d{3}|\d{5,})/.test(c14) &&
        !comp.terms14[this.origLang]?.[c14];
      if (c14 && !synthetic && !isDataValueish(o.rmType)) {
        nodeId = c14;
        path = `${parentPath}/${attrName}[${nodeId}]`;
        comp.codePaths.set(nodeId, path);
      } else {
        path = `${parentPath}/${attrName}`;
      }
    }

    x.open(tag, isDefinition ? "" : ` xsi:type="${xsiType}"`);
    let rmType = o.rmType;
    if (o.kind === "prim") rmType = primRmType(o.prim, parent);
    if (o.kind === "term") rmType = "CODE_PHRASE";
    x.leaf("rm_type_name", rmType);
    writeInterval(x, "occurrences", occ);
    x.leaf("node_id", nodeId);

    if (o.kind === "slot") {
      for (const p of o.includes ?? []) writeAssertion(x, "includes", p);
      for (const p of o.excludes ?? []) writeAssertion(x, "excludes", p);
    } else if (o.kind === "term") {
      this.writeCodePhrase(x, o, comp);
    } else if (o.kind === "prim") {
      writePrimitive(x, o.prim, parent);
    } else {
      for (const a of o.attrs ?? []) {
        if (!a.children.length && !a.existence) continue;
        const container = isContainer(o.rmType, a);
        const meta = rmAttr(o.rmType, a.name);
        x.open(
          "attributes",
          ` xsi:type="${container ? "C_MULTIPLE_ATTRIBUTE" : "C_SINGLE_ATTRIBUTE"}"`,
        );
        x.leaf("rm_attribute_name", a.name);
        writeInterval(
          x,
          "existence",
          a.existence ??
            (meta?.mandatory ? { lower: 1, upper: 1 } : { lower: 0, upper: 1 }),
        );
        x.leaf("match_negated", false);
        for (const c of a.children) {
          this.writeObject(
            x,
            c,
            "children",
            path,
            { rm: o.rmType, attr: a, siblings: a.children },
            false,
            undefined,
            comp,
          );
        }
        if (container) {
          const card = a.cardinality ??
            { interval: { lower: 0 }, ordered: false, unique: false };
          x.open("cardinality");
          x.leaf("is_ordered", card.ordered);
          x.leaf("is_unique", card.unique);
          writeInterval(x, "interval", card.interval);
          x.close("cardinality");
        }
        x.close("attributes");
      }
    }

    if (isRoot) {
      x.open("archetype_id");
      x.leaf("value", comp.id14);
      x.close("archetype_id");
      if (isDefinition && templateId) {
        x.open("template_id");
        x.leaf("value", templateId);
        x.close("template_id");
      }
      for (
        const [code, e] of Object.entries(comp.terms14[this.origLang] ?? {})
      ) {
        writeTerm(x, "term_definitions", code, e);
      }
    }
    x.close(tag);
  }

  private resolveTerm(
    constraint: string,
    comp: Component,
  ): { terminology: string; codes: string[] } {
    const c = constraint.trim().replace(/^\[|\]$/g, "");
    const ext = /^([\w.\-]+)::(.*)$/.exec(c);
    if (ext) {
      return {
        terminology: ext[1],
        codes: ext[2].split(/[,;]/).map((s) => s.trim()).filter(Boolean),
      };
    }
    const local = (code: string) => this.code14(comp, code);
    if (/^ac/i.test(c)) {
      const members = comp.flat.valueSets[c];
      if (members?.length) {
        const bound = members.map((m) => bindingFor(comp.flat.bindings, m));
        const terms = new Set(bound.map((b) => b?.terminology));
        if (bound.every((b) => b) && terms.size === 1) {
          return {
            terminology: bound[0]!.terminology,
            codes: bound.map((b) => b!.code),
          };
        }
        return { terminology: "local", codes: members.map(local) };
      }
      const b = bindingFor(comp.flat.bindings, c);
      if (b) {
        this.warn(
          `${comp.base.id}: ${c} is an external value set (${b.terminology}); exported as open ${b.terminology} constraint`,
        );
        return { terminology: b.terminology, codes: [] };
      }
      this.warn(`${comp.base.id}: value set ${c} has no members`);
      return { terminology: "local", codes: [] };
    }
    const b = bindingFor(comp.flat.bindings, c);
    if (b && /^at9\d{3}/.test(c)) return { terminology: b.terminology, codes: [b.code] };
    return { terminology: "local", codes: [local(c)] };
  }

  private writeCodePhrase(x: Xml, o: PObject, comp: Component): void {
    const r = this.resolveTerm(o.termConstraint ?? "", comp);
    x.open("terminology_id");
    x.leaf("value", r.terminology);
    x.close("terminology_id");
    for (const code of r.codes) x.leaf("code_list", code);
  }

  private writeQuantity(
    x: Xml,
    o: PObject,
    tag: string,
    occ: PInterval,
    comp: Component,
  ): void {
    x.open(tag, ' xsi:type="C_DV_QUANTITY"');
    x.leaf("rm_type_name", "DV_QUANTITY");
    writeInterval(x, "occurrences", occ);
    x.leaf("node_id", "");
    const attr = (n: string) => o.attrs?.find((a) => a.name === n)?.children;
    const prop = attr("property")?.find((c) => c.kind === "term");
    if (prop) {
      const r = this.resolveTerm(prop.termConstraint ?? "", comp);
      if (r.codes[0]) {
        x.open("property");
        x.open("terminology_id");
        x.leaf("value", r.terminology);
        x.close("terminology_id");
        x.leaf("code_string", r.codes[0]);
        x.close("property");
      }
    }
    const units = attr("units")?.flatMap((c) =>
      c.prim?.type === "string" ? c.prim.list ?? [] : []
    ) ?? [];
    const mag = attr("magnitude")?.find((c) => c.prim?.type === "interval");
    const range = mag?.prim?.type === "interval"
      ? parseRange(mag.prim.expr)
      : undefined;
    const prec = attr("precision")?.find((c) => c.prim?.type === "interval");
    const precRange = prec?.prim?.type === "interval"
      ? parseRange(prec.prim.expr)
      : undefined;
    for (const u of units) {
      x.open("list");
      if (range) writeRange(x, "magnitude", range);
      if (precRange) writeRange(x, "precision", precRange);
      x.leaf("units", u);
      x.close("list");
    }
    if (!units.length && range) {
      this.warn(`${comp.base.id}: DV_QUANTITY magnitude without units dropped`);
    }
    x.close(tag);
  }
}

function nameConstraint(text: string): PAttribute {
  return {
    name: "name",
    multiple: false,
    existence: { lower: 1, upper: 1 },
    children: [{
      kind: "complex",
      rmType: "DV_TEXT",
      occ: { lower: 1, upper: 1 },
      attrs: [{
        name: "value",
        multiple: false,
        existence: { lower: 1, upper: 1 },
        children: [{
          kind: "prim",
          rmType: "STRING",
          occ: { lower: 1, upper: 1 },
          prim: { type: "string", list: [text] },
        }],
      }],
    }],
  };
}

function isRealContext(
  parent: { rm: string; attr: PAttribute } | undefined,
  expr: string,
): boolean {
  if (/\d\.\d/.test(expr)) return true;
  if (!parent) return false;
  if (/^(DV_QUANTITY|DV_PROPORTION)$/.test(rmBase(parent.rm))) return true;
  const meta = rmAttr(parent.rm, parent.attr.name);
  return /^(Real|Double)$/.test(meta?.typeName ?? "");
}

function primRmType(
  p: PPrimitive | undefined,
  parent: { rm: string; attr: PAttribute } | undefined,
): string {
  if (!p) return "STRING";
  if (p.type === "boolean") return "BOOLEAN";
  if (p.type === "interval") {
    return isRealContext(parent, p.expr) ? "REAL" : "INTEGER";
  }
  return "STRING";
}

function writePrimitive(
  x: Xml,
  p: PPrimitive | undefined,
  parent: { rm: string; attr: PAttribute } | undefined,
): void {
  if (!p) return;
  if (p.type === "boolean") {
    x.open("item", ' xsi:type="C_BOOLEAN"');
    x.leaf("true_valid", p.trueValid);
    x.leaf("false_valid", p.falseValid);
    x.close("item");
    return;
  }
  if (p.type === "interval") {
    const real = isRealContext(parent, p.expr);
    const r = parseRange(p.expr);
    x.open("item", ` xsi:type="${real ? "C_REAL" : "C_INTEGER"}"`);
    if (r) writeRange(x, "range", r);
    x.close("item");
    return;
  }
  x.open("item", ' xsi:type="C_STRING"');
  if (p.pattern !== undefined) x.leaf("pattern", p.pattern);
  for (const v of p.list ?? []) x.leaf("list", v);
  x.close("item");
}

function writeTerm(x: Xml, tag: string, code: string, e: TermEntry): void {
  x.open(tag, ` code="${esc(code)}"`);
  x.leaf("items", e.text ?? "", ' id="text"');
  x.leaf("items", e.description ?? e.text ?? "", ' id="description"');
  if (e.comment) x.leaf("items", e.comment, ' id="comment"');
  x.close(tag);
}

function writeAssertion(x: Xml, tag: string, pattern: string): void {
  x.open(tag);
  x.leaf("string_expression", `archetype_id/value matches {/${pattern}/}`);
  x.open("expression", ' xsi:type="EXPR_BINARY_OPERATOR"');
  x.leaf("type", "Boolean");
  x.leaf("operator", "2007");
  x.leaf("precedence_overridden", false);
  x.open("left_operand", ' xsi:type="EXPR_LEAF"');
  x.leaf("type", "String");
  x.leaf("item", "archetype_id/value", ' xsi:type="xs:string" xmlns:xs="http://www.w3.org/2001/XMLSchema"');
  x.leaf("reference_type", "attribute");
  x.close("left_operand");
  x.open("right_operand", ' xsi:type="EXPR_LEAF"');
  x.leaf("type", "C_STRING");
  x.open("item", ' xsi:type="C_STRING"');
  x.leaf("pattern", pattern);
  x.close("item");
  x.leaf("reference_type", "constraint");
  x.close("right_operand");
  x.close("expression");
  x.close(tag);
}

function indent(s: string, n: number): string {
  const pad = "  ".repeat(n);
  return s.split("\n").map((l) => (l ? pad + l : l)).join("\n");
}

/**
 * Export an ADL2 template (already loaded into `library`) to OPT 1.4 XML.
 */
export function exportAdl2TemplateToOpt14(
  library: Adl2TemplateLibrary,
  templateId: string,
  options?: Opt14ExportOptions,
): Opt14ExportResult {
  return new Opt14Exporter(library, options).export(templateId);
}
