/**
 * In-memory ADL2 artefact set for template export (#123): archetypes,
 * templates and their `template_overlay` sections, plus a spec-conformant
 * ADL2 specialisation flattener and `use_archetype` expander.
 */

import * as openehr_am from "../../am/openehr_am.ts";
import { parseAdl } from "../../parser/parse_adl.ts";
import { mergeAttributeTupleSets } from "./attribute_tuple_p_model.ts";
import {
  type PAttribute,
  pClone,
  pFromAom,
  type PObject,
} from "./p_model.ts";

export type TermEntry = { text?: string; description?: string; comment?: string };
/** language → code → entry */
export type TermTable = Record<string, Record<string, TermEntry>>;
/** terminology → code → binding (URI or `[term::code]`) */
export type BindingTable = Record<string, Record<string, string>>;

export interface Adl2Artefact {
  id: string;
  aom: openehr_am.ARCHETYPE;
  def: PObject;
  terms: TermTable;
  valueSets: Record<string, string[]>;
  bindings: BindingTable;
  parentId?: string;
  /** Template or template overlay (not a published archetype). */
  isTemplateLevel: boolean;
  isTemplate: boolean;
  originalLanguage: string;
  languages: string[];
}

export interface FlatArtefact {
  art: Adl2Artefact;
  /** Root → self specialisation chain. */
  chain: Adl2Artefact[];
  def: PObject;
  terms: TermTable;
  valueSets: Record<string, string[]>;
  bindings: BindingTable;
}

function str(v: unknown): string | undefined {
  if (v === undefined || v === null) return undefined;
  if (typeof v === "string") return v;
  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    if ("value" in o) return str(o.value);
    if ("_value" in o) return str(o._value);
    if ("_code_string" in o) return str(o._code_string);
    if ("code_string" in o) return str(o.code_string);
  }
  return String(v);
}

function languageCode(v: unknown): string | undefined {
  const s = str(v);
  if (!s) return undefined;
  return s.includes("::") ? s.split("::").pop() : s;
}

function versionKey(id: string): number[] {
  const m = /\.v(\d+)(?:\.(\d+))?(?:\.(\d+))?/.exec(id);
  return m ? [+(m[1] ?? 0), +(m[2] ?? 0), +(m[3] ?? 0)] : [0, 0, 0];
}

/** `openEHR-EHR-CLUSTER.x.v1.2.3` → `openEHR-EHR-CLUSTER.x.v1` */
export function majorArchetypeId(id: string): string {
  return id.replace(/(\.v\d+)(?:\.\d+)*(?:-[A-Za-z0-9.]+)?$/, "$1");
}

/**
 * Split an ADL2 template file into its template and `template_overlay`
 * sections (separated by dashed lines, as written by ADL2 tools).
 */
export function splitAdl2TemplateSource(text: string): {
  template: string;
  overlays: string[];
} {
  const parts = text.replace(/\r\n/g, "\n").split(/\n-{5,}[ \t]*\n/);
  return {
    template: parts[0],
    overlays: parts.slice(1).filter((p) => /^\s*template_overlay\b/.test(p)),
  };
}

export class Adl2TemplateLibrary {
  private byId = new Map<string, Adl2Artefact>();
  private flatCache = new Map<string, FlatArtefact>();
  readonly warnings: string[] = [];

  /** Add ADL2 source text: an archetype, or a template file with overlays. */
  addSource(text: string, label = "source"): string[] {
    const trimmed = text.replace(/^\uFEFF/, "");
    if (/^\s*template\b/.test(trimmed)) {
      const { template, overlays } = splitAdl2TemplateSource(trimmed);
      const ids = [this.addParsed(template, label, true, true)];
      for (const [i, ov] of overlays.entries()) {
        ids.push(
          this.addParsed(
            ov.replace(/^\s*template_overlay\b/, "archetype"),
            `${label}#overlay${i + 1}`,
            true,
            false,
          ),
        );
      }
      return ids.filter((x): x is string => !!x);
    }
    const id = this.addParsed(trimmed, label, false, false);
    return id ? [id] : [];
  }

  private addParsed(
    text: string,
    label: string,
    templateLevel: boolean,
    isTemplate: boolean,
  ): string | undefined {
    try {
      const r = parseAdl(text) as {
        archetype?: openehr_am.ARCHETYPE;
        template?: openehr_am.ARCHETYPE;
        warnings?: string[];
      };
      const aom = r.template ?? r.archetype;
      if (!aom) {
        this.warnings.push(`${label}: no archetype/template parsed`);
        return undefined;
      }
      for (const w of r.warnings ?? []) this.warnings.push(`${label}: ${w}`);
      return this.addAom(aom, { isTemplateLevel: templateLevel, isTemplate });
    } catch (e) {
      this.warnings.push(
        `${label}: ${e instanceof Error ? e.message : String(e)}`,
      );
      return undefined;
    }
  }

  addAom(
    aom: openehr_am.ARCHETYPE,
    opts: { isTemplateLevel?: boolean; isTemplate?: boolean } = {},
  ): string {
    const id = str(aom.archetype_id) ?? "";
    const ont = (aom as { ontology?: Record<string, unknown> }).ontology ?? {};
    const terms = (ont.term_definitions ?? {}) as TermTable;
    const rawVs = (ont.value_sets ?? {}) as Record<
      string,
      { members?: string[] | string }
    >;
    const valueSets: Record<string, string[]> = {};
    for (const [k, v] of Object.entries(rawVs)) {
      const m = v?.members;
      valueSets[k] = Array.isArray(m)
        ? m.map(String)
        : typeof m === "string"
        ? m.split(",").map((s) => s.trim())
        : [];
    }
    const bindings = (ont.term_bindings ?? {}) as BindingTable;
    const originalLanguage =
      languageCode((aom as { original_language?: unknown }).original_language) ??
        "en";
    const translations = Object.keys(
      ((aom as { translations?: Record<string, unknown> }).translations) ?? {},
    );
    const art: Adl2Artefact = {
      id,
      aom,
      def: aom.definition ? pFromAom(aom.definition) : {
        kind: "complex",
        rmType: "",
      },
      terms,
      valueSets,
      bindings,
      parentId: str(aom.parent_archetype_id),
      isTemplateLevel: !!opts.isTemplateLevel,
      isTemplate: !!opts.isTemplate,
      originalLanguage,
      languages: [originalLanguage, ...translations.filter((l) =>
        l !== originalLanguage
      )],
    };
    this.byId.set(id, art);
    this.flatCache.clear();
    return id;
  }

  list(): Adl2Artefact[] {
    return [...this.byId.values()];
  }

  /** Exact id, else highest version with the same major id (`…v1`). */
  resolve(ref: string): Adl2Artefact | undefined {
    const exact = this.byId.get(ref);
    if (exact) return exact;
    const major = majorArchetypeId(ref);
    let best: Adl2Artefact | undefined;
    for (const a of this.byId.values()) {
      if (majorArchetypeId(a.id) !== major) continue;
      if (!best) best = a;
      else {
        const [x, y] = [versionKey(a.id), versionKey(best.id)];
        if (x[0] > y[0] || (x[0] === y[0] && (x[1] > y[1] ||
          (x[1] === y[1] && x[2] > y[2])))) best = a;
      }
    }
    return best;
  }

  /** ADL2 flattening along the specialisation chain (memoised). */
  flatten(art: Adl2Artefact): FlatArtefact {
    const cached = this.flatCache.get(art.id);
    if (cached) return cached;
    let result: FlatArtefact;
    const parent = art.parentId ? this.resolve(art.parentId) : undefined;
    if (art.parentId && !parent) {
      this.warnings.push(`${art.id}: parent ${art.parentId} not found`);
    }
    if (!parent) {
      result = {
        art,
        chain: [art],
        def: pClone(art.def),
        terms: pClone(art.terms),
        valueSets: pClone(art.valueSets),
        bindings: pClone(art.bindings),
      };
    } else {
      const pf = this.flatten(parent);
      result = {
        art,
        chain: [...pf.chain, art],
        def: specialiseObject(pf.def, art.def, (m) =>
          this.warnings.push(`${art.id}: ${m}`)),
        terms: mergeTerms(pf.terms, art.terms),
        valueSets: { ...pf.valueSets, ...art.valueSets },
        bindings: mergeBindings(pf.bindings, art.bindings),
      };
    }
    this.flatCache.set(art.id, result);
    return result;
  }
}

function mergeTerms(a: TermTable, b: TermTable): TermTable {
  const out = pClone(a);
  for (const [lang, bag] of Object.entries(b ?? {})) {
    out[lang] = { ...(out[lang] ?? {}), ...pClone(bag) };
  }
  return out;
}

function mergeBindings(a: BindingTable, b: BindingTable): BindingTable {
  const out = pClone(a);
  for (const [t, bag] of Object.entries(b ?? {})) {
    out[t] = { ...(out[t] ?? {}), ...bag };
  }
  return out;
}

/** Parent code of a specialised code (`id98.2` → `id98`); undefined at depth 0. */
export function parentCode(code: string | undefined): string | undefined {
  const m = /^([a-z]{2})(\d+(?:\.\d+)+)$/i.exec(code ?? "");
  if (!m) return undefined;
  const segs = m[2].split(".");
  segs.pop();
  return m[1] + segs.join(".");
}

function excluded(o: PObject): boolean {
  return o.occ?.upper === 0;
}

function splitSegment(seg: string): { attr: string; nodeId?: string } {
  const m = /^([^[]+)(?:\[([^\]]+)\])?$/.exec(seg);
  return { attr: m?.[1] ?? seg, nodeId: m?.[2]?.split(",")[0]?.trim() };
}

function findChildForPath(
  attr: PAttribute,
  nodeId: string,
): PObject | undefined {
  const exact = attr.children.find((c) => c.nodeId === nodeId);
  if (exact) return exact;
  const specialised = attr.children.find((c) =>
    c.nodeId?.startsWith(nodeId + ".")
  );
  if (specialised) return specialised;
  // The path names the specialised code (`id122.1`) of a node that still has
  // the parent code (`id122`) on the flat parent. Adopt the specialised code
  // so the rest of the path, and later segments, address that redefinition.
  let code: string | undefined = nodeId;
  while (code) {
    code = parentCode(code);
    if (!code) break;
    const ancestor = attr.children.find((c) => c.nodeId === code);
    if (ancestor) {
      ancestor.nodeId = nodeId;
      return ancestor;
    }
  }
  return undefined;
}

/**
 * Apply an ADL2 differential object onto a flat parent object (returns a new
 * tree). Implements the subset of ADL2 flattening used by templates and
 * specialised archetypes: path-addressed attributes, node redefinition by
 * specialised codes (`idN.M`), slot filling by `use_archetype`, new nodes
 * (`id0.N`), occurrence/existence/cardinality narrowing and exclusion
 * (`occurrences matches {0}`).
 */
export function specialiseObject(
  parentFlat: PObject,
  diff: PObject,
  warn: (m: string) => void,
): PObject {
  const result = pClone(parentFlat);
  if (diff.nodeId) result.nodeId = diff.nodeId;
  if (diff.occ) result.occ = diff.occ;
  if (diff.kind === "root") {
    result.kind = "root";
    result.archetypeRef = diff.archetypeRef;
  } else if (diff.rmType && diff.rmType !== result.rmType) {
    result.rmType = diff.rmType;
  }
  for (const da of diff.attrs ?? []) {
    let target: PObject | undefined = result;
    let attrName = da.name;
    if (da.name.startsWith("/")) {
      const segs = da.name.split("/").filter(Boolean);
      attrName = segs.pop() ?? "";
      for (const seg of segs) {
        const { attr, nodeId } = splitSegment(seg);
        const a: PAttribute | undefined = target?.attrs?.find((x) =>
          x.name === attr
        );
        target = a && nodeId ? findChildForPath(a, nodeId) : undefined;
        if (!target) break;
      }
      if (!target) {
        warn(`differential path ${da.name} not found in parent`);
        continue;
      }
      attrName = splitSegment(attrName).attr;
    }
    target.attrs ??= [];
    const ta = target.attrs.find((a) => a.name === attrName);
    if (!ta) {
      target.attrs.push({ ...pClone(da), name: attrName });
      continue;
    }
    mergeAttribute(ta, da, warn);
  }
  result.attributeTuples = mergeAttributeTupleSets(
    parentFlat.attributeTuples,
    diff.attributeTuples,
  );
  return result;
}

function mergeChild(p: PObject, d: PObject, warn: (m: string) => void): PObject {
  if (d.kind === "root" || d.kind === "term" || d.kind === "prim") {
    return pClone(d);
  }
  if (p.kind === "slot") return pClone(d);
  if (d.kind === "slot") return pClone(d);
  return specialiseObject(p, d, warn);
}

function mergeAttribute(
  ta: PAttribute,
  da: PAttribute,
  warn: (m: string) => void,
): void {
  if (da.existence) ta.existence = da.existence;
  if (da.cardinality) ta.cardinality = da.cardinality;
  if (da.multiple) ta.multiple = true;
  const uncoded = da.children.filter((c) => !c.nodeId);
  const coded = da.children.filter((c) => c.nodeId);
  let out = [...ta.children];
  if (uncoded.length) {
    out = out.filter((c) => c.nodeId).concat(uncoded.map((c) => pClone(c)));
  }
  const original = new Map(ta.children.map((c) => [c.nodeId, c] as const));
  const redefinitions = new Map<PObject, PObject[]>();
  for (const dc of coded) {
    const same = original.get(dc.nodeId);
    if (same && !(same.kind === "slot" && dc.kind !== "slot")) {
      const idx = out.indexOf(same);
      if (idx >= 0) out[idx] = mergeChild(same, dc, warn);
      continue;
    }
    // Specialised redefinition (idN.M) or slot fill of an existing slot.
    let pc = same ? dc.nodeId : parentCode(dc.nodeId);
    let parent = pc ? original.get(pc) : undefined;
    while (!parent && pc) {
      pc = parentCode(pc);
      parent = pc ? original.get(pc) : undefined;
    }
    if (parent) {
      const list = redefinitions.get(parent) ?? [];
      list.push(mergeChild(parent, dc, warn));
      redefinitions.set(parent, list);
    } else {
      out.push(pClone(dc));
    }
  }
  for (const [parent, list] of redefinitions) {
    const idx = out.indexOf(parent);
    if (idx >= 0) out.splice(idx, 1, ...list);
    else out.push(...list);
  }
  ta.children = out.filter((c) => !excluded(c));
}
