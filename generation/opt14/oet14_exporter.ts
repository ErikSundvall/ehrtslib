/**
 * ADL2 template (with `use_archetype` overlays) → OET 1.4 XML (#123).
 *
 * OET (`openEHR/v1/Template`, ITS-XML `CompositionTemplate.xsd`) is a delta
 * format: each used archetype is an element (`definition`, `Content`,
 * `Items`, `Item`) carrying the 1.4 `archetype_id` and the slot `path` in
 * its parent, and `Rule` elements narrow nodes of that archetype by path
 * (`max`/`min`, `name`, value constraints). The exporter therefore diffs each
 * flattened overlay against its published base archetype and writes the
 * differences as rules. Codes use the same spec-aligned id → at mapping as
 * the OPT 1.4 exporter (`buildCodeMap`, #126/#127).
 *
 * OET carries texts in ONE language (the template's original language).
 * Translations of renamed nodes and of repeated archetypes are written as
 * `L10n.{lang}` path annotations when `multilingualRepeatWorkaround` is on
 * (default), consistent with the OPT exporter; when off, a warning lists
 * what is lost.
 */

import {
  type Adl2Artefact,
  Adl2TemplateLibrary,
  type FlatArtefact,
  majorArchetypeId,
  specialiseObject,
  type TermTable,
} from "./adl2_template_library.ts";
import {
  buildCodeMap,
  collapseCode,
  esc,
  exportAdl2TemplateToOpt14,
  parseRange,
} from "./opt14_exporter.ts";
import { idToAtCode } from "../id_to_at_code.ts";
import { pClone, type PInterval, type PObject } from "./p_model.ts";

export interface Oet14ExportOptions {
  /** Emit `L10n.{lang}` annotations for translations OET cannot hold (default true). */
  multilingualRepeatWorkaround?: boolean;
  /** OET `<name>`; defaults to the template's root term (original language). */
  templateName?: string;
  /** OET `<id>`; defaults to the template uid, else a random UUID. */
  id?: string;
  /** Languages considered for translations; defaults to the template's. */
  languages?: string[];
}

export interface Oet14ExportResult {
  xml: string;
  templateName: string;
  warnings: string[];
  annotations: Array<{ path: string; items: Record<string, string> }>;
  /** Translations OET cannot hold natively (renamed nodes, repeated archetypes). */
  lostTranslations: Array<{ path: string; language: string; text: string }>;
  /** True when lostTranslations exist and were NOT written as L10n annotations. */
  translationsDropped: boolean;
  archetypeIds: string[];
  /**
   * ADL 1.4 paths whose value constraint has no OET equivalent (for example a
   * template-local coded-text value set). The same constraint is in the OPT
   * 1.4 export. Each path is also named in `warnings`.
   */
  optOnlyValuePaths: string[];
}

interface Comp {
  flat: FlatArtefact;
  base: Adl2Artefact;
  baseFlat: FlatArtefact;
  baseDepth: number;
  id14: string;
  codeMap: Map<string, string>;
  def: PObject;
}

interface Rule {
  path: string;
  max?: number;
  min?: number;
  name?: string;
  constraint?: string; // pre-rendered XML
}

interface Node {
  tag: string;
  comp: Comp;
  rmType: string;
  path?: string;
  occ?: PInterval;
  name?: string;
  aqlPath: string;
  rules: Rule[];
  children: Node[];
}

const DV_TYPE_NAMES: Record<string, string> = {
  DV_BOOLEAN: "Boolean",
  DV_IDENTIFIER: "Identifier",
  DV_MULTIMEDIA: "MultiMedia",
  DV_QUANTITY: "Quantity",
  DV_COUNT: "Count",
  DV_DATE_TIME: "Date_Time",
  DV_DATE: "Date",
  DV_TIME: "Time",
  DV_DURATION: "Duration",
  DV_ORDINAL: "Ordinal",
  DV_PROPORTION: "Proportion",
  DV_URI: "URI",
  DV_EHR_URI: "URI",
  DV_TEXT: "Text",
  DV_CODED_TEXT: "Coded_text",
  DV_PARSABLE: "Parsable",
  DV_STATE: "State",
  DV_SCALE: "Scale",
};

const ITEM_STRUCTURES = new Set([
  "ITEM_TREE",
  "ITEM_LIST",
  "ITEM_SINGLE",
  "ITEM_TABLE",
]);

function dvName(rm: string): string {
  if (rm.startsWith("DV_INTERVAL")) return "Interval";
  return DV_TYPE_NAMES[rm] ?? rm;
}

function sameOcc(a?: PInterval, b?: PInterval): boolean {
  return (a?.lower ?? 0) === (b?.lower ?? 0) && a?.upper === b?.upper;
}

export class Oet14Exporter {
  private warnings: string[] = [];
  private origLang = "en";
  private languages: string[] = [];
  private lost: Oet14ExportResult["lostTranslations"] = [];
  private renameAnn = new Map<string, Record<string, string>>();
  private archetypeIds = new Set<string>();
  private optOnlyValuePaths: string[] = [];
  private opts:
    & Required<Pick<Oet14ExportOptions, "multilingualRepeatWorkaround">>
    & Oet14ExportOptions;

  constructor(
    private library: Adl2TemplateLibrary,
    options: Oet14ExportOptions = {},
  ) {
    this.opts = {
      ...options,
      multilingualRepeatWorkaround: options.multilingualRepeatWorkaround ??
        true,
    };
  }

  private warn(m: string): void {
    if (!this.warnings.includes(m)) this.warnings.push(m);
  }

  /** Value constraint that OET cannot express; the OPT export still has it. */
  private noteOptOnly(c: Comp, path: string): void {
    if (!this.optOnlyValuePaths.includes(path)) {
      this.optOnlyValuePaths.push(path);
    }
    this.warn(
      `${c.base.id}: value constraint at ${path} has no OET equivalent; kept only in the OPT export`,
    );
  }

  private comp(art: Adl2Artefact, useSite?: PObject): Comp {
    const flat = this.library.flatten(art);
    let baseIdx = flat.chain.length - 1;
    while (baseIdx > 0 && flat.chain[baseIdx].isTemplateLevel) baseIdx--;
    const base = flat.chain[baseIdx];
    const baseFlat = this.library.flatten(base);
    const baseDepth = flat.chain.slice(0, baseIdx + 1).length - 1;
    const codeMap = buildCodeMap(baseFlat, baseDepth);
    for (const [k, v] of buildCodeMap(flat, baseDepth)) {
      if (!codeMap.has(k)) {
        codeMap.set(k, codeMap.get(collapseCode(k, baseDepth)) ?? v);
      }
    }
    let def = pClone(flat.def);
    if (useSite?.attrs?.length) {
      def = specialiseObject(def, {
        ...useSite,
        kind: "complex",
        nodeId: def.nodeId,
      }, (m) => this.warn(`${art.id}: ${m}`));
    }
    const id14 = majorArchetypeId(base.id);
    this.archetypeIds.add(id14);
    return { flat, base, baseFlat, baseDepth, id14, codeMap, def };
  }

  private code14(c: Comp, code?: string): string {
    if (!code) return "";
    const m = c.codeMap.get(code);
    return m !== undefined ? m : idToAtCode(collapseCode(code, c.baseDepth));
  }

  private text(
    terms: TermTable,
    lang: string,
    code?: string,
  ): string | undefined {
    return code ? terms[lang]?.[code]?.text : undefined;
  }

  /** Name override (original language) + translations for a node of `c`. */
  private rename(
    c: Comp,
    o: PObject,
    b: PObject | undefined,
    aqlPath: string,
  ): string | undefined {
    const code = o.nodeId;
    const baseCode = b?.nodeId;
    let name: string | undefined;
    const nameAttr = o.attrs?.find((a) => a.name === "name");
    const fixed =
      nameAttr?.children.flatMap((ch) =>
        ch.attrs?.find((a) => a.name === "value")?.children.flatMap((v) =>
          v.prim?.type === "string" ? v.prim.list ?? [] : []
        ) ?? []
      ) ?? [];
    if (fixed.length === 1) name = fixed[0];
    const t = this.text(c.flat.terms, this.origLang, code);
    const bt = this.text(c.baseFlat.terms, this.origLang, baseCode);
    if (!name && t && bt && t !== bt) name = t;
    if (!name) return undefined;
    const items: Record<string, string> = {};
    for (const lang of this.languages) {
      if (lang === this.origLang) continue;
      const tl = this.text(c.flat.terms, lang, code);
      const bl = this.text(c.baseFlat.terms, lang, baseCode);
      if (tl && tl !== bl) {
        items[`L10n.${lang}`] = tl;
        this.lost.push({ path: aqlPath, language: lang, text: tl });
      }
    }
    if (Object.keys(items).length) {
      this.renameAnn.set(aqlPath, {
        [`L10n.${this.origLang}`]: name,
        ...this.renameAnn.get(aqlPath),
        ...items,
      });
    }
    return name;
  }

  private valueRule(
    c: Comp,
    o: PObject,
    b: PObject,
    path: string,
  ): string | undefined {
    const vals = o.attrs?.find((a) => a.name === "value")?.children ?? [];
    const bvals = b.attrs?.find((a) => a.name === "value")?.children ?? [];
    if (JSON.stringify(vals) === JSON.stringify(bvals)) return undefined;
    const types = [...new Set(vals.map((v) => v.rmType))];
    const btypes = [...new Set(bvals.map((v) => v.rmType))];
    if (
      types.length < btypes.length && types.every((t) => btypes.includes(t))
    ) {
      const inner = types.map((t) =>
        `<includedTypes>${esc(dvName(t))}</includedTypes>`
      ).join("");
      // Narrowed type choice; a single remaining type may carry its own constraint below.
      if (types.length > 1) {
        return `<constraint xsi:type="tem:multipleConstraint">${inner}</constraint>`;
      }
      const single = this.singleValue(
        c,
        vals[0],
        bvals.find((v) => v.rmType === types[0]),
        path,
      );
      return single ??
        `<constraint xsi:type="tem:multipleConstraint">${inner}</constraint>`;
    }
    if (vals.length === 1) {
      const r = this.singleValue(
        c,
        vals[0],
        bvals.find((v) => v.rmType === vals[0].rmType),
        path,
      );
      if (r) return r;
    }
    this.noteOptOnly(c, path);
    return undefined;
  }

  private singleValue(
    c: Comp,
    v: PObject,
    bv: PObject | undefined,
    path: string,
  ): string | undefined {
    if (bv && JSON.stringify(v) === JSON.stringify(bv)) return undefined;
    const attr = (o: PObject | undefined, n: string) =>
      o?.attrs?.find((a) => a.name === n)?.children ?? [];
    if (v.rmType === "DV_TEXT") {
      const list = attr(v, "value").flatMap((p) =>
        p.prim?.type === "string" ? p.prim.list ?? [] : []
      );
      if (list.length) {
        return `<constraint xsi:type="tem:textConstraint">${
          list.map((s) => `<includedValues>${esc(s)}</includedValues>`).join("")
        }</constraint>`;
      }
    }
    if (v.rmType === "DV_CODED_TEXT") {
      const codes = (o: PObject | undefined, fl: FlatArtefact) =>
        attr(o, "defining_code").flatMap((t) => {
          const tc = (t.termConstraint ?? "").replace(/^\[|\]$/g, "");
          if (/^ac/i.test(tc)) return fl.valueSets[tc] ?? [];
          if (/^at/i.test(tc)) return [tc];
          return [];
        });
      const now = codes(v, c.flat);
      const before = codes(bv, c.baseFlat);
      if (now.length && before.length) {
        const removed = before.filter((x) =>
          !now.map((n) => collapseCode(n, c.baseDepth)).includes(x)
        );
        if (removed.length) {
          return `<constraint xsi:type="tem:textConstraint">${
            removed.map((x) =>
              `<excludedValues>local::${
                esc(this.code14(c, x))
              }</excludedValues>`
            ).join("")
          }</constraint>`;
        }
      }
    }
    if (v.rmType === "DV_QUANTITY") {
      const units = attr(v, "units").flatMap((p) =>
        p.prim?.type === "string" ? p.prim.list ?? [] : []
      );
      const mag = attr(v, "magnitude").find((p) => p.prim?.type === "interval");
      const r = mag?.prim?.type === "interval"
        ? parseRange(mag.prim.expr)
        : undefined;
      if (units.length) {
        let x = `<constraint xsi:type="tem:quantityConstraint">`;
        x += units.map((u) => `<includedUnits>${esc(u)}</includedUnits>`).join(
          "",
        );
        for (const u of units) {
          x += `<unitMagnitude><unit>${esc(u)}</unit>`;
          if (r?.upper !== undefined) {
            x += `<maxMagnitude>${r.upper}</maxMagnitude>`;
          }
          if (r?.lower !== undefined) {
            x += `<minMagnitude>${r.lower}</minMagnitude>`;
          }
          x += `<includesMaximum>${!!r
            ?.upperIncl}</includesMaximum><includesMinimum>${!!r
            ?.lowerIncl}</includesMinimum></unitMagnitude>`;
        }
        return x + `</constraint>`;
      }
    }
    if (v.rmType === "DV_COUNT") {
      const mag = attr(v, "magnitude").find((p) => p.prim?.type === "interval");
      const r = mag?.prim?.type === "interval"
        ? parseRange(mag.prim.expr)
        : undefined;
      if (r) {
        let x = `<constraint xsi:type="tem:countConstraint">`;
        if (r.upper !== undefined) {
          x += `<maxMagnitude>${r.upper}</maxMagnitude>`;
        }
        if (r.lower !== undefined) {
          x += `<minMagnitude>${r.lower}</minMagnitude>`;
        }
        return x +
          `<includesMaximum>${!!r
            .upperIncl}</includesMaximum><includesMinimum>${!!r
            .lowerIncl}</includesMinimum></constraint>`;
      }
    }
    return undefined;
  }

  /** Diff `o` (overlay, flattened) against `b` (base archetype) below `path`. */
  private diff(
    c: Comp,
    o: PObject,
    b: PObject | undefined,
    path: string,
    aql: string,
    node: Node,
  ): void {
    for (const a of o.attrs ?? []) {
      if (a.name === "name") continue;
      const ba = b?.attrs?.find((x) => x.name === a.name);
      const matched = new Set<string>();
      for (const ch of a.children) {
        if (ch.kind === "root" && ch.archetypeRef) {
          this.child(
            c,
            node,
            o,
            a.name,
            ch,
            path,
            aql,
            a.children,
            ba?.children ?? [],
          );
          continue;
        }
        if (ch.kind !== "complex" && ch.kind !== "slot") continue;
        matched.add(
          ch.nodeId ? collapseCode(ch.nodeId, c.baseDepth) : ch.rmType,
        );
        const baseCode = ch.nodeId
          ? collapseCode(ch.nodeId, c.baseDepth)
          : undefined;
        const bc = ba?.children.find((x) =>
          ch.nodeId
            ? x.nodeId === ch.nodeId || x.nodeId === baseCode
            : x.rmType === ch.rmType
        );
        const code = this.code14(c, ch.nodeId);
        const seg = `/${a.name}${code ? `[${code}]` : ""}`;
        const cpath = path + seg;
        const caql = aql + seg;
        if (ch.occ?.upper === 0) {
          if (!bc || bc.occ?.upper !== 0) {
            node.rules.push({ path: cpath, max: 0 });
          }
          continue;
        }
        if (!bc) {
          if (ch.nodeId && !/^id9\d{3}/.test(ch.nodeId)) {
            this.warn(
              `${c.flat.art.id}: node ${ch.rmType}[${ch.nodeId}] at ${cpath} is new in the template; OET cannot add nodes`,
            );
          }
          continue;
        }
        const rule: Rule = { path: cpath };
        if (!sameOcc(ch.occ, bc.occ) && ch.occ) {
          if (ch.occ.upper !== undefined) rule.max = ch.occ.upper;
          if ((ch.occ.lower ?? 0) !== (bc.occ?.lower ?? 0)) {
            rule.min = ch.occ.lower ?? 0;
          }
        }
        const name = this.rename(c, ch, bc, caql);
        if (name) rule.name = name;
        if (ch.rmType === "ELEMENT") {
          const cons = this.valueRule(c, ch, bc, cpath);
          if (cons) rule.constraint = cons;
        }
        if (
          rule.max !== undefined || rule.min !== undefined || rule.name ||
          rule.constraint
        ) {
          node.rules.push(rule);
        }
        if (ch.rmType !== "ELEMENT") this.diff(c, ch, bc, cpath, caql, node);
      }
      // Base nodes removed by the overlay (occurrences {0} is flattened away).
      for (const bc of ba?.children ?? []) {
        if (
          !bc.nodeId || (bc.kind !== "complex" && bc.kind !== "slot") ||
          bc.occ?.upper === 0
        ) continue;
        if (matched.has(bc.nodeId)) continue;
        if (
          a.children.some((x) =>
            x.nodeId &&
            (x.nodeId === bc.nodeId || x.nodeId.startsWith(bc.nodeId + "."))
          )
        ) continue;
        node.rules.push({
          path: `${path}/${a.name}[${this.code14(c, bc.nodeId)}]`,
          max: 0,
        });
      }
    }
  }

  private child(
    parent: Comp,
    node: Node,
    owner: PObject,
    attr: string,
    ch: PObject,
    path: string,
    aql: string,
    siblings: PObject[],
    baseChildren: PObject[],
  ): void {
    const art = this.library.resolve(ch.archetypeRef!);
    if (!art) {
      this.warn(`use_archetype ${ch.archetypeRef} not found; omitted`);
      return;
    }
    const c = this.comp(art, ch);
    // Path to the slot in the parent's published base archetype: the longest
    // base node id that the use_archetype node id specialises.
    const id = ch.nodeId ?? "";
    const slot = baseChildren
      .filter((x) =>
        x.nodeId && (id === x.nodeId || id.startsWith(x.nodeId + "."))
      )
      .sort((x, y) => y.nodeId!.length - x.nodeId!.length)[0];
    const slotCode = slot
      ? this.code14(parent, slot.nodeId)
      : this.code14(parent, ch.nodeId);
    const slotPath =
      node.tag === "definition" && attr === "content" && owner === node.comp.def
        ? `${path}/content`
        : `${path}/${attr}${slotCode ? `[${slotCode}]` : ""}`;
    let tag = "Items";
    const ownerRm = owner.rmType;
    if (ownerRm === "COMPOSITION" && attr === "content") tag = "Content";
    else if (ownerRm === "SECTION" && attr === "items") tag = "Item";
    else if (ITEM_STRUCTURES.has(c.def.rmType) && ownerRm === "INSTRUCTION") {
      tag = "activityDescription";
    } else if (
      ITEM_STRUCTURES.has(c.def.rmType) && ownerRm === "ACTION" &&
      attr === "description"
    ) tag = "description";
    const rootText = this.text(c.flat.terms, this.origLang, c.def.nodeId);
    const baseText = this.text(
      c.baseFlat.terms,
      this.origLang,
      c.baseFlat.def.nodeId,
    );
    const renamed = !!rootText && rootText !== baseText;
    const repeated = siblings.filter((x) => {
      const xa = x.archetypeRef
        ? this.library.resolve(x.archetypeRef)
        : undefined;
      return xa && this.comp0Id(xa) === c.id14;
    }).length > 1;
    const pred = renamed && repeated
      ? `${c.id14} and name/value='${rootText!.replace(/'/g, "\\'")}'`
      : c.id14;
    const caql = `${aql}/${attr}[${pred}]`;
    const n: Node = {
      tag,
      comp: c,
      rmType: c.def.rmType,
      path: slotPath,
      occ: ch.occ,
      name: renamed ? rootText : undefined,
      aqlPath: caql,
      rules: [],
      children: [],
    };
    if (renamed) {
      const items: Record<string, string> = {};
      for (const lang of this.languages) {
        if (lang === this.origLang) continue;
        const tl = this.text(c.flat.terms, lang, c.def.nodeId);
        if (
          tl && tl !== this.text(c.baseFlat.terms, lang, c.baseFlat.def.nodeId)
        ) {
          items[`L10n.${lang}`] = tl;
          this.lost.push({ path: caql, language: lang, text: tl });
        }
      }
      if (Object.keys(items).length) {
        this.renameAnn.set(caql, {
          [`L10n.${this.origLang}`]: rootText!,
          ...items,
        });
      }
    }
    node.children.push(n);
    this.diff(c, c.def, c.baseFlat.def, "", caql, n);
  }

  private comp0Id(art: Adl2Artefact): string {
    const chain = this.library.flatten(art).chain;
    let i = chain.length - 1;
    while (i > 0 && chain[i].isTemplateLevel) i--;
    return majorArchetypeId(chain[i].id);
  }

  export(templateId: string): Oet14ExportResult {
    const art = this.library.resolve(templateId);
    if (!art) throw new Error(`Template ${templateId} not in library`);
    this.origLang = art.originalLanguage;
    this.languages = this.opts.languages ?? art.languages;

    // Same option, same annotations / conflicts as the OPT export (repeated archetypes).
    const opt = exportAdl2TemplateToOpt14(this.library, templateId, {
      multilingualRepeatWorkaround: this.opts.multilingualRepeatWorkaround,
      languages: this.languages,
    });
    for (const w of opt.warnings) {
      if (!/^OPT 1\.4 keeps one translation set/.test(w)) this.warn(w);
    }

    const root = this.comp(art);
    const rootName = this.opts.templateName ??
      this.text(root.flat.terms, this.origLang, root.def.nodeId) ?? art.id;
    const rootAql = `[${root.id14}]`;
    const top: Node = {
      tag: "definition",
      comp: root,
      rmType: root.def.rmType,
      aqlPath: rootAql,
      rules: [],
      children: [],
    };
    this.diff(root, root.def, root.baseFlat.def, "", rootAql, top);

    for (const c of opt.repeatedTranslationConflicts) {
      this.lost.push({ path: c.path, language: c.language, text: c.text });
    }
    const annotations: Oet14ExportResult["annotations"] = [];
    if (this.opts.multilingualRepeatWorkaround) {
      const merged = new Map<string, Record<string, string>>();
      for (const a of opt.annotations) {
        merged.set(`${rootAql}${a.path}`, { ...a.items });
      }
      for (const [p, items] of this.renameAnn) {
        merged.set(p, { ...merged.get(p), ...items });
      }
      for (const [path, items] of merged) annotations.push({ path, items });
    } else if (this.lost.length) {
      const langs = [...new Set(this.lost.map((l) => l.language))].join(", ");
      const paths = [...new Set(this.lost.map((l) => l.path))];
      this.warn(
        `OET 1.4 holds names in one language (${this.origLang}): ${langs} ` +
          `translations of ${paths.length} renamed/repeated node(s) will be dropped: ` +
          `${paths.slice(0, 8).join("; ")}${
            paths.length > 8 ? "; …" : ""
          }. Enable ` +
          `multilingualRepeatWorkaround to emit L10n.{lang} annotations (discourse.openehr.org/t/2760).`,
      );
    }

    const out: string[] = [];
    out.push('<?xml version="1.0" encoding="UTF-8"?>');
    out.push('<template xmlns="openEHR/v1/Template">');
    const uid = String(
      (art.aom as { uid?: { value?: string } }).uid?.value ?? "",
    );
    out.push(`  <id>${esc(this.opts.id ?? (uid || crypto.randomUUID()))}</id>`);
    out.push(`  <name>${esc(rootName)}</name>`);
    out.push(...this.description(art).map((l) => "  " + l));
    for (const a of annotations) {
      out.push(`  <annotations path="${esc(a.path)}">`);
      out.push("    <items>");
      for (const [k, v] of Object.entries(a.items)) {
        out.push(
          `      <item><key>${esc(k)}</key><value>${esc(v)}</value></item>`,
        );
      }
      out.push("    </items>");
      out.push("  </annotations>");
    }
    this.writeNode(out, top, 1, rootName);
    out.push("</template>");
    return {
      xml: out.join("\n") + "\n",
      templateName: rootName,
      warnings: this.warnings,
      annotations,
      lostTranslations: this.lost,
      translationsDropped: this.lost.length > 0 &&
        !this.opts.multilingualRepeatWorkaround,
      archetypeIds: [...this.archetypeIds],
      optOnlyValuePaths: this.optOnlyValuePaths,
    };
  }

  private description(art: Adl2Artefact): string[] {
    const d =
      (art.aom as { description?: Record<string, unknown> }).description ?? {};
    const lines = ["<description>"];
    const authors = d.original_author as Record<string, string> | undefined;
    if (authors && Object.keys(authors).length) {
      lines.push("  <original_author>");
      for (const [k, v] of Object.entries(authors)) {
        lines.push(
          `    <item><key>${esc(k)}</key><value>${
            esc(String(v))
          }</value></item>`,
        );
      }
      lines.push("  </original_author>");
    }
    const state = d.lifecycle_state as
      | { code_string?: string; value?: string }
      | string
      | undefined;
    const st = typeof state === "string"
      ? state
      : state?.code_string ?? state?.value;
    lines.push(
      `  <lifecycle_state>${esc(st ?? "unmanaged")}</lifecycle_state>`,
    );
    const det =
      (d.details as Record<string, Record<string, unknown>> | undefined)
        ?.[this.origLang];
    if (det) {
      lines.push("  <details>");
      lines.push(`    <purpose>${esc(String(det.purpose ?? ""))}</purpose>`);
      lines.push(`    <use>${esc(String(det.use ?? ""))}</use>`);
      lines.push(`    <misuse>${esc(String(det.misuse ?? ""))}</misuse>`);
      lines.push("  </details>");
    }
    lines.push("</description>");
    return lines;
  }

  private writeNode(
    out: string[],
    n: Node,
    depth: number,
    templateName: string,
  ): void {
    const ind = "  ".repeat(depth);
    const attrs: string[] = [`archetype_id="${esc(n.comp.id14)}"`];
    const concept = this.text(
      n.comp.baseFlat.terms,
      this.origLang,
      n.comp.baseFlat.def.nodeId,
    );
    if (concept) attrs.push(`concept_name="${esc(concept)}"`);
    if (n.tag === "definition") attrs.push(`name="${esc(templateName)}"`);
    else if (n.name) attrs.push(`name="${esc(n.name)}"`);
    if (n.occ?.upper !== undefined && n.tag !== "definition") {
      attrs.push(`max="${n.occ.upper}"`);
    }
    if (n.occ?.lower && n.tag !== "definition") {
      attrs.push(`min="${n.occ.lower}"`);
    }
    if (n.path !== undefined) attrs.push(`path="${esc(n.path)}"`);
    if (n.tag === "definition") {
      attrs.push(
        'xmlns:tem="openEHR/v1/Template"',
        'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"',
      );
    }
    attrs.push(`xsi:type="tem:${esc(n.rmType)}"`);
    const rules = n.rules.map((r) => {
      const ra: string[] = [];
      if (r.max !== undefined) ra.push(`max="${r.max}"`);
      if (r.min !== undefined) ra.push(`min="${r.min}"`);
      if (r.name) ra.push(`name="${esc(r.name)}"`);
      ra.push(`path="${esc(r.path)}"`);
      return r.constraint
        ? `${ind}  <Rule ${ra.join(" ")}>${r.constraint}</Rule>`
        : `${ind}  <Rule ${ra.join(" ")}/>`;
    });
    if (!rules.length && !n.children.length) {
      out.push(`${ind}<${n.tag} ${attrs.join(" ")}/>`);
      return;
    }
    out.push(`${ind}<${n.tag} ${attrs.join(" ")}>`);
    const kids = (tags: string[]) =>
      n.children.filter((c) => tags.includes(c.tag)).forEach((c) =>
        this.writeNode(out, c, depth + 1, templateName)
      );
    if (n.rmType === "COMPOSITION") {
      // XSD order: Content*, Context?, Rule*
      kids(["Content"]);
      const other = n.children.filter((c) => c.tag !== "Content");
      if (other.length) {
        this.warn(
          `${n.comp.id14}: archetypes used outside /content (e.g. context) are not written to OET`,
        );
      }
      out.push(...rules);
    } else {
      // content_item / ITEM: Rule*, then children (Items / Item / description / activityDescription)
      out.push(...rules);
      if (n.rmType === "ACTION") kids(["Items"]), kids(["description"]);
      else if (n.rmType === "INSTRUCTION") {
        kids(["Items"]), kids(["activityDescription"]);
      } else kids(["Items", "Item"]);
      const rest = n.children.filter((c) =>
        !["Items", "Item", "description", "activityDescription"].includes(c.tag)
      );
      if (rest.length && n.rmType !== "COMPOSITION") {
        rest.forEach((c) => this.writeNode(out, c, depth + 1, templateName));
      }
    }
    out.push(`${ind}</${n.tag}>`);
  }
}

/** Export an ADL2 template from `library` to OET 1.4 XML. */
export function exportAdl2TemplateToOet14(
  library: Adl2TemplateLibrary,
  templateId: string,
  options: Oet14ExportOptions = {},
): Oet14ExportResult {
  return new Oet14Exporter(library, options).export(templateId);
}
