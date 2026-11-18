/**
 * OPT 1.4 `<view><constraints path="…">` UI constraints (Ocean / EHRbase).
 */

import * as openehr_am from "../am/openehr_am.ts";
import {
  annotationsForAqlPath,
  normalizeAnnotationPath,
  stripLeadingArchetypeId,
  type OptPathAnnotationMap,
} from "./opt_l10n.ts";
import {
  getAnnotationsDocumentation,
  getRmOverlayVisibility,
} from "../parser/aom_odin_sections.ts";
import { asArray, textValue } from "../parser/legacy/xml_aom_mapper.ts";
import { languageCode } from "./term_codes.ts";
import {
  archetypeTermBagsForLanguage,
  lookupTermEntryInBag,
  selectTermBag,
  type TermBag,
} from "./term_scope.ts";

export type OptVisibilityToken = "hide" | "show" | "pass-through";

export type OptViewConstraint = {
  path: string;
  passThrough?: boolean;
  visibleInView?: string;
};

const OPT_VIEW_CONSTRAINTS = Symbol.for("ehrtslib.optViewConstraints");

export type OptPresentationByPath = {
  visibility?: OptVisibilityToken;
  alias?: string;
  /** All annotation items for the chosen language (lossless forward). */
  annotations: Record<string, string>;
};

export function parseOptViewConstraints(
  root: Record<string, unknown>,
): OptViewConstraint[] {
  const out: OptViewConstraint[] = [];
  const view = root.view;
  if (!view || typeof view !== "object") return out;
  const viewRec = view as Record<string, unknown>;
  for (const raw of asArray(viewRec.constraints)) {
    if (!raw || typeof raw !== "object") continue;
    const rec = raw as Record<string, unknown>;
    const path = String(rec["@_path"] ?? rec.path ?? "").trim();
    if (!path) continue;
    const entry: OptViewConstraint = { path };
    for (const it of asArray(rec.items)) {
      if (!it || typeof it !== "object") continue;
      const item = it as Record<string, unknown>;
      const id = String(item["@_id"] ?? item.id ?? "").trim();
      const rawVal = item.value ?? textValue(item);
      if (!id || rawVal === undefined || rawVal === null) continue;
      const val = typeof rawVal === "boolean"
        ? (rawVal ? "true" : "false")
        : String(rawVal).trim();
      if (id === "pass_through") {
        entry.passThrough = val === "true" || val === "1";
      } else if (id === "VisibleInView") {
        entry.visibleInView = val;
      }
    }
    if (
      entry.passThrough !== undefined || entry.visibleInView !== undefined
    ) {
      out.push(entry);
    }
  }
  return out;
}

export function attachOptViewConstraints(
  opt: openehr_am.OPERATIONAL_TEMPLATE,
  root: Record<string, unknown>,
): OptViewConstraint[] {
  const list = parseOptViewConstraints(root);
  (opt as Record<symbol, OptViewConstraint[]>)[OPT_VIEW_CONSTRAINTS] = list;
  return list;
}

export function getOptViewConstraints(
  opt: openehr_am.OPERATIONAL_TEMPLATE,
): OptViewConstraint[] {
  return (opt as Record<symbol, OptViewConstraint[]>)[OPT_VIEW_CONSTRAINTS] ?? [];
}

function lookupView(
  constraints: OptViewConstraint[],
  aqlPath: string,
): OptViewConstraint | undefined {
  const normTarget = normalizeAnnotationPath(stripLeadingArchetypeId(aqlPath));
  for (const c of constraints) {
    const normC = normalizeAnnotationPath(stripLeadingArchetypeId(c.path));
    if (normC !== normTarget) continue;
    return c;
  }
  return undefined;
}

function rmVisibilityMap(
  opt: openehr_am.OPERATIONAL_TEMPLATE,
): Map<string, Record<string, string>> {
  const m = new Map<string, Record<string, string>>();
  const vis = getRmOverlayVisibility(opt);
  if (!vis) return m;
  for (const [path, entry] of Object.entries(vis)) {
    if (!entry || typeof entry !== "object") continue;
    const rec = entry as Record<string, string>;
    m.set(path, rec);
    m.set(stripLeadingArchetypeId(path), rec);
    m.set(normalizeAnnotationPath(path), rec);
  }
  return m;
}

function pickVisibility(
  view?: OptViewConstraint,
  rmVis?: Record<string, string>,
  annot?: Record<string, string>,
): OptVisibilityToken | undefined {
  if (view?.passThrough === true) return "pass-through";
  if (view?.passThrough === false) return "hide";

  const rmTok = rmVis?.visibility?.toLowerCase();
  if (rmTok === "hide" || rmTok === "hiding") return "hide";
  if (rmTok === "show" || rmTok === "visible") return "show";

  if (view?.visibleInView) return "show";

  const hof = annot?.["a.hide_on_form"] ?? annot?.hide_on_form;
  if (hof === "presentation" || hof === "true" || hof === "input") {
    return hof === "input" ? "show" : "hide";
  }

  return undefined;
}

/** `rm_visibility.alias` is an at-code; emit terminology text when resolvable. */
function pickAlias(
  opt: openehr_am.OPERATIONAL_TEMPLATE,
  rmVis: Record<string, string> | undefined,
  renderLang: string,
): string | undefined {
  const a = rmVis?.alias;
  if (typeof a !== "string" || !a.trim()) return undefined;
  const code = a.trim();
  const orig = languageCode(opt.original_language) ?? "en";
  const lang = renderLang || orig;
  const termTables = (opt.ontology as { term_definitions?: Record<string, TermBag> })
    ?.term_definitions;
  const templateTerms = selectTermBag(termTables, lang, orig);
  const fromTemplate = lookupTermEntryInBag(templateTerms, code)?.text;
  if (fromTemplate) return fromTemplate;
  for (const bag of Object.values(
    archetypeTermBagsForLanguage(opt, lang, orig),
  )) {
    const text = lookupTermEntryInBag(bag, code)?.text;
    if (text) return text;
  }
  return code;
}

/** Pick merged path annotation items (render lang → `""` → original). */
export function pickPathAnnotationItems(
  opt: openehr_am.OPERATIONAL_TEMPLATE,
  pathAnnotations: OptPathAnnotationMap,
  aqlPath: string,
  nodeName: string | undefined,
  renderLang: string,
): Record<string, string> {
  const items = annotationsForAqlPath(pathAnnotations, aqlPath, nodeName) ?? {};
  const orig =
    (opt.original_language as unknown as { code_string?: string })?.code_string ??
    (typeof opt.original_language === "string" ? opt.original_language : "en");

  const doc = getAnnotationsDocumentation(opt);
  if (doc && typeof doc === "object") {
    const pathKeys = [
      aqlPath,
      stripLeadingArchetypeId(aqlPath),
      normalizeAnnotationPath(aqlPath),
    ];
    const langs = [renderLang, "", orig, ...Object.keys(doc)];
    for (const lang of langs) {
      const bag = doc[lang];
      if (!bag) continue;
      for (const pk of pathKeys) {
        if (bag[pk] && Object.keys(bag[pk]).length) {
          return { ...bag[pk], ...items };
        }
      }
    }
  }
  return { ...items };
}

export function presentationForPath(
  opt: openehr_am.OPERATIONAL_TEMPLATE,
  pathAnnotations: OptPathAnnotationMap,
  aqlPath: string,
  nodeName: string | undefined,
  renderLang: string,
): OptPresentationByPath {
  const constraints = getOptViewConstraints(opt);
  const rmVisM = rmVisibilityMap(opt);
  const lookupPath = stripLeadingArchetypeId(aqlPath);
  const view = lookupView(constraints, lookupPath);
  const rmVis = rmVisM.get(lookupPath) ?? rmVisM.get(normalizeAnnotationPath(lookupPath));
  const annotations = pickPathAnnotationItems(
    opt,
    pathAnnotations,
    lookupPath,
    nodeName,
    renderLang,
  );
  const visibility = pickVisibility(view, rmVis, annotations);
  const alias = pickAlias(opt, rmVis, renderLang);
  return { visibility, alias, annotations };
}