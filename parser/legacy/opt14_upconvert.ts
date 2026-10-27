/**
 * Up-convert a legacy OPT 1.4 (parsed by {@link parseOptXml}, still carrying
 * ADL 1.4 at-codes) into an ADL2 operational template (at-coded by default).
 *
 * The input is never modified: the result is a prototype-preserving deep copy.
 * The conversion is deterministic, so converting the same OPT twice gives the
 * same codes. The code rule lives in `opt14_code_mapping.ts`.
 */

import { XMLParser } from "fast-xml-parser";
import * as openehr_am from "../../am/openehr_am.ts";
import * as openehr_base from "../../base/openehr_base.ts";
import { clonePreservingPrototype } from "../../generation/opt2_trim.ts";
import {
  COMPONENT_TERM_DEFINITIONS_KEY,
  TERM_ARCHETYPE_SCOPE_KEY,
  TERM_NAME_FALLBACK_NODE_ID_KEY,
} from "../../generation/term_scope.ts";
import {
  type Adl2CodingOptions,
  isAdl14AtCode,
  Opt14CodeMinter,
  opt14CodeMapper,
  resolveAdl2CodingSystem,
} from "./opt14_code_mapping.ts";

/** Template-level metadata read straight from OPT 1.4 XML (not mapped by `parseOptXml`). */
export interface Opt14Header {
  templateId?: string;
  uid?: string;
  concept?: string;
  /** `description/other_details` as id → text, exactly as in the XML (strings, never numbers). */
  otherDetails: Record<string, string>;
  /** Description mapped to the same shape the ADL2 parser produces. */
  description?: openehr_base.RESOURCE_DESCRIPTION;
}

/** A value set minted or carried over during up-conversion. */
export interface Opt14ValueSet {
  id: string;
  members: string[];
}

export interface Opt14UpconversionOptions extends Adl2CodingOptions {}

export interface Opt14UpconversionResult {
  operationalTemplate: openehr_am.OPERATIONAL_TEMPLATE;
  /** ADL2 node codes minted for nodes that had no node id in ADL 1.4. */
  mintedIdCodes: number;
  /** Coding system used for this conversion. */
  adl2CodingSystem: ReturnType<typeof resolveAdl2CodingSystem>;
  /** Value-set ac-codes minted for local code lists. */
  mintedValueSets: number;
  warnings: string[];
}

/** Key for minted value sets per archetype scope on the converted template. */
export const ARCHETYPE_VALUE_SETS_KEY = "archetype_value_sets";

function textOf(node: unknown): string | undefined {
  if (node === undefined || node === null) return undefined;
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (typeof node === "object") {
    const rec = node as Record<string, unknown>;
    if (rec["#text"] !== undefined) return textOf(rec["#text"]);
    if (rec.value !== undefined) return textOf(rec.value);
    if (rec.code_string !== undefined) return textOf(rec.code_string);
  }
  return undefined;
}

function asList<T>(v: T | T[] | undefined): T[] {
  if (v === undefined || v === null) return [];
  return Array.isArray(v) ? v : [v];
}

/**
 * Read template id, uid, concept and the top-level description (including
 * `other_details` such as `sem_ver`, `build_uid`, `MD5-CAM-1.0.1`) from OPT
 * 1.4 XML. Values are kept as strings (an all-digit MD5 must not become a number).
 */
export function readOpt14Header(xml: string): Opt14Header {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    removeNSPrefix: true,
    parseTagValue: false,
    parseAttributeValue: false,
    trimValues: true,
    stopNodes: [
      "*.definition",
      "*.annotations",
      "*.component_ontologies",
      "*.ontology",
    ],
  });
  const doc = parser.parse(xml) as Record<string, unknown>;
  const root = (doc.template ?? doc.operational_template ?? {}) as Record<
    string,
    unknown
  >;
  const header: Opt14Header = { otherDetails: {} };
  header.templateId = textOf(root.template_id);
  header.uid = textOf(root.uid);
  header.concept = textOf(root.concept);

  const d = root.description as Record<string, unknown> | undefined;
  if (d && typeof d === "object") {
    const desc = new openehr_base.RESOURCE_DESCRIPTION();
    const bag = desc as unknown as Record<string, unknown>;
    const authors: Record<string, string> = {};
    for (const a of asList(d.original_author as unknown)) {
      const rec = a as Record<string, unknown>;
      const id = rec?.["@_id"];
      if (typeof id === "string") authors[id] = textOf(rec) ?? "";
    }
    if (Object.keys(authors).length) bag.original_author = authors;
    const lifecycle = textOf(d.lifecycle_state);
    if (lifecycle) {
      const tc = new openehr_base.Terminology_code();
      tc.code_string = openehr_base.String.from(lifecycle);
      desc.lifecycle_state = tc;
    }
    for (const o of asList(d.other_details as unknown)) {
      const rec = o as Record<string, unknown>;
      const id = rec?.["@_id"];
      if (typeof id === "string") header.otherDetails[id] = textOf(rec) ?? "";
    }
    if (Object.keys(header.otherDetails).length) {
      bag.other_details = { ...header.otherDetails };
    }
    const details: Record<string, Record<string, unknown>> = {};
    for (const raw of asList(d.details as unknown)) {
      const rec = raw as Record<string, unknown>;
      const lang = textOf(
        (rec?.language as Record<string, unknown>)?.code_string,
      );
      if (!lang) continue;
      const item: Record<string, unknown> = { language: `ISO_639-1::${lang}` };
      for (const k of ["purpose", "use", "misuse", "copyright"]) {
        const v = textOf(rec[k]);
        if (v !== undefined) item[k] = v;
      }
      const kws = asList(rec.keywords as unknown).map(textOf).filter((
        x,
      ): x is string => !!x);
      if (kws.length) item.keywords = kws;
      details[lang] = item;
    }
    if (Object.keys(details).length) bag.details = details;
    header.description = desc;
  }
  return header;
}

/** True when the template's node ids are ADL 1.4 at-codes (root `at0000`). */
export function hasAdl14NodeIds(opt: openehr_am.OPERATIONAL_TEMPLATE): boolean {
  const rootId = opt.definition?.node_id;
  if (isAdl14AtCode(rootId)) return true;
  if (rootId && /^id\d/.test(rootId)) return false;
  return opt.adl_version === "1.4";
}

type Meta = Record<string, unknown>;

interface ScopeCodes {
  nodeIds: Set<string>;
  valueCodes: Set<string>;
}

function isLocalTerminology(tid: string | undefined): boolean {
  return !tid || tid === "local";
}

function terminologyIdOf(node: unknown): string | undefined {
  const t = (node as Meta).terminology_id;
  if (typeof t === "string") return t;
  if (t && typeof t === "object") return textOf(t);
  return undefined;
}

function isPrimitive(node: unknown): boolean {
  return node instanceof openehr_am.C_PRIMITIVE_OBJECT;
}

function childrenOf(node: unknown): unknown[] {
  const out: unknown[] = [];
  const rec = node as Meta;
  for (const attr of (rec.attributes as unknown[] | undefined) ?? []) {
    for (const c of ((attr as Meta).children as unknown[] | undefined) ?? []) {
      out.push(c);
    }
  }
  return out;
}

function ordinalSymbols(node: unknown): openehr_am.ORDINAL[] {
  if (!(node instanceof openehr_am.C_ORDINAL)) return [];
  const rec = node as unknown as Meta;
  const list = (rec.list as openehr_am.ORDINAL[] | undefined) ?? [];
  const assumed = rec.assumed_value as openehr_am.ORDINAL | undefined;
  return assumed && typeof assumed === "object" ? [...list, assumed] : list;
}

function symbolParts(ord: openehr_am.ORDINAL): { tid?: string; code?: string } {
  const s = (ord as unknown as Meta).symbol as Meta | undefined;
  if (!s) return {};
  return { tid: textOf(s.terminology_id), code: textOf(s.code_string) };
}

/**
 * Convert one parsed OPT 1.4 into an ADL2 operational template.
 * Pass the {@link Opt14Header} from {@link readOpt14Header} to carry over the
 * template id and top-level description, which `parseOptXml` does not map.
 */
export function upconvertOpt14ToAdl2(
  source: openehr_am.OPERATIONAL_TEMPLATE,
  header?: Opt14Header,
  options?: Opt14UpconversionOptions,
): Opt14UpconversionResult {
  const warnings: string[] = [];
  const adl2CodingSystem = resolveAdl2CodingSystem(options);
  const mapper = opt14CodeMapper(options);
  const opt = clonePreservingPrototype(source);
  const root = opt.definition;
  if (!root) {
    throw new Error("OPT 1.4 up-conversion: template has no definition");
  }
  const rootScope =
    (root as unknown as Meta)[TERM_ARCHETYPE_SCOPE_KEY] as string | undefined ??
      (root as openehr_am.C_ARCHETYPE_ROOT).archetype_ref ?? "";

  const scopeOf = (node: unknown, inherited: string): string =>
    ((node as Meta)[TERM_ARCHETYPE_SCOPE_KEY] as string | undefined) ??
      inherited;

  // Pass 1: which at-codes are node ids and which are values, per archetype scope.
  const scopes = new Map<string, ScopeCodes>();
  const scopeCodes = (s: string): ScopeCodes => {
    let c = scopes.get(s);
    if (!c) {
      c = { nodeIds: new Set(), valueCodes: new Set() };
      scopes.set(s, c);
    }
    return c;
  };
  const collect = (node: unknown, inherited: string) => {
    if (!node || typeof node !== "object") return;
    const scope = scopeOf(node, inherited);
    const codes = scopeCodes(scope);
    const id = (node as openehr_am.C_OBJECT).node_id;
    if (!isPrimitive(node) && isAdl14AtCode(id)) codes.nodeIds.add(id);
    if (
      node instanceof openehr_am.C_TERMINOLOGY_CODE &&
      isLocalTerminology(terminologyIdOf(node))
    ) {
      const tc = node as unknown as Meta;
      for (const c of [tc.constraint, ...((tc.code_list as unknown[]) ?? [])]) {
        if (typeof c === "string" && isAdl14AtCode(c)) codes.valueCodes.add(c);
      }
    }
    for (const ord of ordinalSymbols(node)) {
      const { tid, code } = symbolParts(ord);
      if (isLocalTerminology(tid) && isAdl14AtCode(code)) {
        codes.valueCodes.add(code);
      }
    }
    for (const c of childrenOf(node)) collect(c, scope);
  };
  collect(root, rootScope);

  const mapTermCode = (
    code: string,
    codes: ScopeCodes | undefined,
  ): string[] => {
    if (/^ac\d/i.test(code)) return [mapper.valueSetCodeToAdl2(code)];
    if (!isAdl14AtCode(code)) return [code];
    const out: string[] = [];
    const isValue = codes?.valueCodes.has(code) ?? false;
    const isNode = codes?.nodeIds.has(code) ?? false;
    if (isNode || !isValue) out.push(mapper.nodeIdToAdl2(code));
    if (isValue) out.push(mapper.valueCodeToAdl2(code));
    if (adl2CodingSystem === "at-coded" && out.length > 1 && out[0] === out[1]) {
      return [out[0]];
    }
    return out;
  };
  const remapBag = <T>(
    bag: Record<string, T> | undefined,
    codes: ScopeCodes | undefined,
  ) => {
    if (!bag || typeof bag !== "object") return bag;
    const out: Record<string, T> = {};
    for (const [code, entry] of Object.entries(bag)) {
      for (const k of mapTermCode(code, codes)) {
        if (!(k in out)) {
          out[k] = (entry && typeof entry === "object") ? { ...entry } : entry;
        }
      }
    }
    return out;
  };
  const remapByLang = (
    table: Record<string, Record<string, unknown>> | undefined,
    codes: ScopeCodes | undefined,
  ) => {
    if (!table || typeof table !== "object") return table;
    const out: Record<string, Record<string, unknown>> = {};
    for (const [lang, bag] of Object.entries(table)) {
      out[lang] = remapBag(bag, codes)!;
    }
    return out;
  };

  // Terminologies (needed before minting, to seed the minters).
  const termIndex = (opt as unknown as Meta).archetype_term_definitions as
    | Record<string, Record<string, Record<string, unknown>>>
    | undefined;
  if (termIndex) {
    const out: typeof termIndex = {};
    for (const [archId, byLang] of Object.entries(termIndex)) {
      out[archId] = remapByLang(byLang, scopes.get(archId))!;
    }
    (opt as unknown as Meta).archetype_term_definitions = out;
  }
  const ontology = opt.ontology as unknown as Meta | undefined;
  const rootCodes = scopes.get(rootScope);
  if (ontology) {
    ontology.term_definitions = remapByLang(
      ontology.term_definitions as
        | Record<string, Record<string, unknown>>
        | undefined,
      rootCodes,
    );
    const tb = ontology.term_bindings as
      | Record<string, Record<string, unknown>>
      | undefined;
    if (tb && typeof tb === "object") {
      const out: Record<string, Record<string, unknown>> = {};
      for (const [term, byKey] of Object.entries(tb)) {
        const mapped: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(byKey ?? {})) {
          const keys = k.startsWith("/")
            ? [mapper.pathToAdl2(k)]
            : mapTermCode(k, rootCodes);
          for (const nk of keys) mapped[nk] = v;
        }
        out[term] = mapped;
      }
      ontology.term_bindings = out;
    }
    const cb = ontology.constraint_bindings as
      | Record<string, Record<string, unknown>>
      | undefined;
    if (cb && typeof cb === "object") {
      const out: Record<string, Record<string, unknown>> = {};
      for (const [term, byKey] of Object.entries(cb)) {
        const mapped: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(byKey ?? {})) {
          mapped[mapper.valueSetCodeToAdl2(k)] = v;
        }
        out[term] = mapped;
      }
      ontology.constraint_bindings = out;
    }
  }

  // Seed one minter per scope with every ADL2 code already in that scope.
  const minters = new Map<string, Opt14CodeMinter>();
  const minterFor = (scope: string): Opt14CodeMinter => {
    let m = minters.get(scope);
    if (m) return m;
    m = new Opt14CodeMinter(adl2CodingSystem);
    const codes = scopes.get(scope);
    for (const c of codes?.nodeIds ?? []) m.seen(mapper.nodeIdToAdl2(c));
    for (const c of codes?.valueCodes ?? []) m.seen(mapper.valueCodeToAdl2(c));
    const bags = scope === rootScope
      ? [termIndex?.[scope], ontology?.term_definitions]
      : [termIndex?.[scope]];
    for (const table of bags) {
      for (
        const bag of Object.values(
          (table ?? {}) as Record<string, Record<string, unknown>>,
        )
      ) {
        for (const code of Object.keys(bag ?? {})) {
          for (const k of mapTermCode(code, codes)) m.seen(k);
        }
      }
    }
    minters.set(scope, m);
    return m;
  };
  for (const scope of scopes.keys()) minterFor(scope);

  // Pass 2: rewrite the definition in depth-first document order.
  let mintedIdCodes = 0;
  let mintedValueSets = 0;
  const valueSets: Record<string, Record<string, Opt14ValueSet>> = {};
  const rewrite = (
    node: unknown,
    inherited: string,
    underAttribute: boolean,
  ) => {
    if (!node || typeof node !== "object") return;
    const scope = scopeOf(node, inherited);
    const codes = scopes.get(scope);
    const obj = node as openehr_am.C_OBJECT;
    const meta = node as Meta;
    if (!isPrimitive(node)) {
      const id = obj.node_id;
      if (isAdl14AtCode(id)) obj.node_id = mapper.nodeIdToAdl2(id);
      else if (!id && underAttribute) {
        obj.node_id = minterFor(scope).nextNodeId();
        mintedIdCodes++;
      }
      const fallback = meta[TERM_NAME_FALLBACK_NODE_ID_KEY];
      if (typeof fallback === "string" && isAdl14AtCode(fallback)) {
        meta[TERM_NAME_FALLBACK_NODE_ID_KEY] = mapper.nodeIdToAdl2(fallback);
      }
      if (
        node instanceof openehr_am.ARCHETYPE_INTERNAL_REF && node.target_path
      ) {
        node.target_path = mapper.pathToAdl2(node.target_path);
      }
      const local = meta[COMPONENT_TERM_DEFINITIONS_KEY];
      if (local && typeof local === "object") {
        meta[COMPONENT_TERM_DEFINITIONS_KEY] = remapByLang(
          local as Record<string, Record<string, unknown>>,
          codes,
        );
      }
    }
    if (
      node instanceof openehr_am.C_TERMINOLOGY_CODE &&
      isLocalTerminology(terminologyIdOf(node))
    ) {
      const tc = node as unknown as Meta;
      const list = ((tc.code_list as unknown[]) ?? []).map((c) =>
        typeof c === "string" ? mapper.valueCodeToAdl2(c) : c
      ) as string[];
      if (Array.isArray(tc.code_list)) tc.code_list = list;
      if (typeof tc.constraint === "string") {
        tc.constraint = /^ac\d/i.test(tc.constraint)
          ? mapper.valueSetCodeToAdl2(tc.constraint)
          : mapper.valueCodeToAdl2(tc.constraint);
      } else if (list.length > 1) {
        const ac = minterFor(scope).nextAc();
        tc.constraint = ac;
        (valueSets[scope] ??= {})[ac] = { id: ac, members: [...list] };
        mintedValueSets++;
      }
    }
    for (const ord of ordinalSymbols(node)) {
      const { tid, code } = symbolParts(ord);
      if (isLocalTerminology(tid) && isAdl14AtCode(code)) {
        (ord as unknown as Meta).symbol = openehr_base.CODE_PHRASE.from(
          tid ?? "local",
          mapper.valueCodeToAdl2(code),
        );
      }
    }
    for (const c of childrenOf(node)) rewrite(c, scope, true);
  };
  rewrite(root, rootScope, false);

  if (Object.keys(valueSets).length) {
    (opt as unknown as Meta)[ARCHETYPE_VALUE_SETS_KEY] = valueSets;
    if (ontology && valueSets[rootScope]) {
      ontology.value_sets = {
        ...((ontology.value_sets as Record<string, unknown> | undefined) ?? {}),
        ...valueSets[rootScope],
      };
    }
  }

  // Path-keyed annotations.
  const ann = (opt as unknown as Meta).annotations as Meta | undefined;
  const doc = ann?.documentation as
    | Record<string, Record<string, unknown>>
    | undefined;
  if (ann && doc && typeof doc === "object") {
    const out: Record<string, Record<string, unknown>> = {};
    for (const [lang, byPath] of Object.entries(doc)) {
      const mapped: Record<string, unknown> = {};
      for (const [p, v] of Object.entries(byPath ?? {})) {
        mapped[mapper.pathToAdl2(p)] = v;
      }
      out[lang] = mapped;
    }
    ann.documentation = out;
  }

  opt.adl_version = "2.0.5";
  if (header?.templateId) opt.template_id = header.templateId;
  if (header?.description) opt.description = header.description;

  return {
    operationalTemplate: opt,
    mintedIdCodes,
    mintedValueSets,
    warnings,
    adl2CodingSystem,
  };
}
