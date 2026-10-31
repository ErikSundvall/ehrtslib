/**
 * Fill RM-mandatory attributes after FLAT/STRUCTURED deserialization.
 *
 * Fill order for every attribute: explicit path (already set by the
 * deserializer) → `ctx/` value → template or RM default. `ctx/` values are
 * always used; template/RM defaults and the clock only with
 * `contextDefaults: "apply"` (the default). With `"none"` missing mandatory
 * values are reported as issues and left empty.
 *
 * @see docs/SIMPLIFIED_FORMATS.md "Input and output flavours"
 */

import { hasRmType, isSubtypeOf } from "../../meta/mod.ts";
import {
  COMPOSITION_CATEGORY_GROUP,
  openEhrGroupCode,
  openEhrGroupRubric,
  SETTING_GROUP,
} from "../../term/openehr_group_rubrics.ts";
import type { WebTemplate, WebTemplateNode } from "./types.ts";
import type { FlatRmDefaultIssue } from "./flat_rm_defaults.ts";
import { fixedCategoryCode } from "./flavor.ts";

type RmObject = Record<string, unknown>;
type Primitive = string | number | boolean;
/** ctx field id → suffix ("" = bare) → value */
export type CtxFields = Map<string, Record<string, Primitive>>;

/**
 * `"apply"` (default): fill missing RM-mandatory attributes from the template
 * and RM defaults (names, language, encoding, subject, times from the clock,
 * setting "other care", …). `"none"`: only report them as issues.
 */
export type ContextDefaults = "apply" | "none";

export interface FlatContextOptions {
  /** Default `"apply"`. See {@link ContextDefaults}. */
  contextDefaults?: ContextDefaults;
  /**
   * Current time as an ISO 8601 string, used for `context/start_time`, event
   * and action times that are neither in the payload nor in `ctx/`. Default
   * `() => new Date().toISOString()`. `null` disables it: such times are
   * reported as errors instead.
   */
  clock?: (() => string) | null;
}

/** ctx keys this module (or the ISM_TRANSITION defaults) understands. */
export const KNOWN_CTX_FIELDS = new Set([
  "language",
  "territory",
  "composer_name",
  "composer_id",
  "composer_self",
  "id_scheme",
  "id_namespace",
  "time",
  "end_time",
  "location",
  "setting",
  "category",
  "health_care_facility",
  "history_origin",
  "action_time",
  "action_ism_transition_current_state",
  "instruction_narrative",
  "activity_timing",
  "provider_name",
  "provider_id",
  "work_flow_id",
]);

/** ctx keys that set EVENT_CONTEXT attributes (they never create one). */
const CONTEXT_CTX_FIELDS = [
  "time",
  "end_time",
  "location",
  "setting",
  "health_care_facility",
];

const COLLAPSED_NAMES: Record<string, string> = {
  HISTORY: "History",
  EVENT: "Event",
  POINT_EVENT: "Event",
  INTERVAL_EVENT: "Event",
  ITEM_TREE: "Tree",
  ITEM_LIST: "List",
  ITEM_SINGLE: "Single",
  ITEM_TABLE: "Table",
};

const ENTRY_TYPES = new Set([
  "OBSERVATION",
  "EVALUATION",
  "INSTRUCTION",
  "ACTION",
  "ADMIN_ENTRY",
]);

function bare(fields?: Record<string, Primitive>): Primitive | undefined {
  return fields?.[""] ?? fields?.value;
}

function codePhrase(terminology: string, code: string): RmObject {
  return {
    _type: "CODE_PHRASE",
    terminology_id: { _type: "TERMINOLOGY_ID", value: terminology },
    code_string: code,
  };
}

function dvText(value: string): RmObject {
  return { _type: "DV_TEXT", value };
}

function dateTime(value: string): RmObject {
  return { _type: "DV_DATE_TIME", value };
}

function timeValue(dv: unknown): string | undefined {
  const v = (dv as RmObject | undefined)?.value;
  return v == null ? undefined : String(v);
}

function isLocatable(obj: RmObject): boolean {
  const type = typeof obj._type === "string" ? obj._type : "";
  if (type && hasRmType(type)) return isSubtypeOf(type, "LOCATABLE");
  return "archetype_node_id" in obj;
}

function partyRef(id: Primitive, f: Record<string, Primitive>): RmObject {
  const ref: RmObject = {
    _type: "PARTY_REF",
    id: {
      _type: "GENERIC_ID",
      value: String(id),
      ...(f.id_scheme != null ? { scheme: String(f.id_scheme) } : {}),
    },
    type: "PARTY",
  };
  if (f.id_namespace != null) ref.namespace = String(f.id_namespace);
  return ref;
}

function nodeIdsMatch(a: unknown, b: string): boolean {
  if (a == null) return false;
  const sa = String(a);
  if (sa === b) return true;
  const norm = (s: string) =>
    /^id\d/i.test(s)
      ? `at${s.replace(/^id/i, "").replace(/\./g, "").padStart(4, "0")}`
      : s;
  return norm(sa) === norm(b);
}

interface RawHit {
  value: RmObject;
  /** Objects passed on the way (excluding the start, excluding `value`). */
  via: RmObject[];
  /** Relative AQL path of each `via` object. */
  viaPaths: string[];
}

/** Resolve a relative AQL path without unwrapping ELEMENT values. */
function resolveRaw(start: RmObject, relPath: string): RawHit[] {
  const segments = relPath.replace(/\/+/g, "/").match(/\/[^/]+/g) ?? [];
  let hits: RawHit[] = [{ value: start, via: [], viaPaths: [] }];
  let prefix = "";
  for (const raw of segments) {
    const m = /^\/([^[]+)(?:\[([^\]]+)\])?$/.exec(raw);
    if (!m) return [];
    const [, attr, nodeId] = m;
    const next: RawHit[] = [];
    for (const hit of hits) {
      const v = hit.value[attr];
      const via = hit.value === start ? [] : [...hit.via, hit.value];
      const viaPaths = hit.value === start ? [] : [...hit.viaPaths, prefix];
      const items = Array.isArray(v) ? v : v != null ? [v] : [];
      for (const item of items) {
        if (!item || typeof item !== "object") continue;
        const rec = item as RmObject;
        if (
          nodeId && rec.archetype_node_id != null &&
          !nodeIdsMatch(rec.archetype_node_id, nodeId)
        ) continue;
        next.push({ value: rec, via, viaPaths });
      }
    }
    prefix += raw;
    hits = next;
    if (!hits.length) return [];
  }
  return hits;
}

function relativePath(parent: WebTemplateNode, child: WebTemplateNode): string {
  const p = parent.aqlPath === "/" ? "" : parent.aqlPath;
  return child.aqlPath.startsWith(p) ? child.aqlPath.slice(p.length) : child.aqlPath;
}

class ContextDefaulter {
  private apply: boolean;
  private clock: (() => string) | null;
  private language: string;
  private ctxTime?: string;

  constructor(
    private comp: RmObject,
    private wt: WebTemplate,
    private ctx: CtxFields,
    private issues: FlatRmDefaultIssue[],
    options: FlatContextOptions,
  ) {
    this.apply = (options.contextDefaults ?? "apply") === "apply";
    this.clock = options.clock === undefined
      ? () => new Date().toISOString()
      : options.clock;
    this.language = wt.defaultLanguage ?? "en";
  }

  run(): void {
    this.applyCompositionCtx();
    this.applyCompositionDefaults();
    this.language = String(
      (this.comp.language as RmObject | undefined)?.code_string ?? this.language,
    );
    this.ctxTime = timeValue((this.comp.context as RmObject | undefined)?.start_time);
    this.walk(this.wt.tree, this.comp);
  }

  private issue(path: string, message: string, severity: "error" | "warning" = "error") {
    this.issues.push({ path, message, severity, kind: "missing-mandatory" });
  }

  private now(path: string, what: string): string | undefined {
    if (!this.apply) {
      this.issue(path, `${what} is missing (contextDefaults: "none")`);
      return undefined;
    }
    if (this.clock) return this.clock();
    this.issue(path, `${what} is missing and no clock is set`);
    return undefined;
  }

  private ensureContext(): RmObject {
    if (!this.comp.context || typeof this.comp.context !== "object") {
      this.comp.context = { _type: "EVENT_CONTEXT" };
    }
    return this.comp.context as RmObject;
  }

  /** ctx/ composition-level values; explicit paths win. */
  private applyCompositionCtx(): void {
    const c = this.comp;
    const get = (id: string) => this.ctx.get(id);
    const lang = bare(get("language")) ?? get("language")?.code;
    if (lang != null && !c.language) c.language = codePhrase("ISO_639-1", String(lang));
    const terr = bare(get("territory")) ?? get("territory")?.code;
    if (terr != null && !c.territory) c.territory = codePhrase("ISO_3166-1", String(terr));

    if (!c.composer) {
      const name = bare(get("composer_name"));
      const id = bare(get("composer_id"));
      const self = bare(get("composer_self"));
      const f: Record<string, Primitive> = {};
      const scheme = bare(get("id_scheme"));
      const ns = bare(get("id_namespace"));
      if (scheme != null) f.id_scheme = scheme;
      if (ns != null) f.id_namespace = ns;
      if (self === true || self === "true") {
        c.composer = { _type: "PARTY_SELF", ...(id != null ? { external_ref: partyRef(id, f) } : {}) };
      } else if (name != null || id != null) {
        c.composer = {
          _type: "PARTY_IDENTIFIED",
          ...(name != null ? { name: String(name) } : {}),
          ...(id != null ? { external_ref: partyRef(id, f) } : {}),
        };
      }
    }

    const category = get("category");
    if (category && !c.category) {
      const code = category.code ?? bare(category);
      if (code != null) c.category = this.category(String(code));
    }
  }

  /** ctx/ keys that set EVENT_CONTEXT attributes. */
  private contextCtxKeys(): string[] {
    return CONTEXT_CTX_FIELDS.filter((id) => this.ctx.has(id));
  }

  /** ctx/ values for an existing EVENT_CONTEXT; explicit paths win. */
  private applyContextCtx(ctx: RmObject): void {
    const get = (id: string) => this.ctx.get(id);
    const time = bare(get("time"));
    const end = bare(get("end_time"));
    const location = bare(get("location"));
    const setting = get("setting");
    const hcf = get("health_care_facility");
    if (time != null && !ctx.start_time) ctx.start_time = dateTime(String(time));
    if (end != null && !ctx.end_time) ctx.end_time = dateTime(String(end));
    if (location != null && ctx.location == null) ctx.location = String(location);
    if (setting && !ctx.setting) ctx.setting = this.settingFromCtx(setting);
    if (hcf && !ctx.health_care_facility) {
      const name = hcf.name ?? bare(hcf);
      const facility: RmObject = { _type: "PARTY_IDENTIFIED" };
      if (name != null) facility.name = String(name);
      if (hcf.id != null) {
        facility.external_ref = { ...partyRef(hcf.id, hcf), type: "ORGANISATION" };
      }
      ctx.health_care_facility = facility;
    }
  }

  /**
   * EVENT_CONTEXT by category, as Better does: an event (non-persistent)
   * composition gets one (with contextDefaults "none" only when ctx/ context
   * keys are given); a persistent one (431) only from explicit `context/…`
   * paths, and its ctx/ context keys are then ignored with a warning.
   */
  private decideContext(): void {
    const c = this.comp;
    const categoryCode = String(
      ((c.category as RmObject | undefined)?.defining_code as RmObject | undefined)?.code_string ??
        fixedCategoryCode(this.wt) ?? "",
    );
    const persistent = categoryCode === "431";
    const ctxKeys = this.contextCtxKeys();
    if (persistent) {
      if (!c.context) {
        if (ctxKeys.length) {
          this.issues.push({
            path: "/context",
            severity: "warning",
            kind: "context-rule",
            message: `ctx/${ctxKeys.join(", ctx/")} ignored: a persistent composition (category 431) has no EVENT_CONTEXT unless context/… paths are given`,
          });
        }
        return;
      }
      this.issues.push({
        path: "/context",
        severity: "warning",
        kind: "context-rule",
        message: "context/… paths given for a persistent composition (category 431); kept, but the RM invariant Is_persistent_validity requires no context",
      });
    } else if (!c.context) {
      // ctx/ values are always used, so they fill the event context even
      // with contextDefaults "none".
      if (this.apply || ctxKeys.length) this.ensureContext();
      else {
        this.issue("/context", "EVENT_CONTEXT is missing for an event composition (contextDefaults: \"none\")", "warning");
        return;
      }
    }
    const ctx = c.context as RmObject;
    this.applyContextCtx(ctx);
    if (!ctx.start_time) {
      const t = this.now("/context/start_time", "EVENT_CONTEXT.start_time");
      if (t) ctx.start_time = dateTime(t);
    }
    if (!ctx.setting) {
      if (this.apply) ctx.setting = this.settingFromCtx({ code: "238" });
      else this.issue("/context/setting", "EVENT_CONTEXT.setting is missing (contextDefaults: \"none\")");
    }
  }

  /** `ctx/setting` as code ("238"), rubric ("other care") or both. */
  private settingFromCtx(f: Record<string, Primitive>): RmObject {
    const b = bare(f);
    let code = f.code != null ? String(f.code) : undefined;
    let value = f.value != null ? String(f.value) : undefined;
    if (b != null && f.value == null) {
      if (/^\d+$/.test(String(b)) && code == null) code = String(b);
      else value = String(b);
    }
    const terminology = String(f.terminology ?? "openehr");
    if (terminology === "openehr") {
      code ??= value != null ? openEhrGroupCode(SETTING_GROUP, value) : undefined;
      value ??= code != null ? openEhrGroupRubric(SETTING_GROUP, code) : undefined;
    }
    return {
      _type: "DV_CODED_TEXT",
      value: value ?? code ?? "",
      defining_code: codePhrase(terminology, code ?? value ?? ""),
    };
  }

  private category(code: string): RmObject {
    return {
      _type: "DV_CODED_TEXT",
      value: openEhrGroupRubric(COMPOSITION_CATEGORY_GROUP, code) ?? code,
      defining_code: codePhrase("openehr", code),
    };
  }

  private applyCompositionDefaults(): void {
    const c = this.comp;
    if (this.apply) {
      if (!c.language && this.wt.defaultLanguage) {
        c.language = codePhrase("ISO_639-1", this.wt.defaultLanguage);
      }
      const fixed = fixedCategoryCode(this.wt);
      if (!c.category && fixed) c.category = this.category(fixed);
      const archetypeId = this.wt.tree.nodeId;
      if (!c.archetype_details && archetypeId) {
        c.archetype_details = {
          _type: "ARCHETYPED",
          archetype_id: { _type: "ARCHETYPE_ID", value: archetypeId },
          template_id: { _type: "TEMPLATE_ID", value: this.wt.templateId },
          rm_version: "1.1.0",
        };
      }
    }
    for (const attr of ["language", "territory", "composer", "category"]) {
      if (!c[attr]) {
        this.issue(`/${attr}`, `COMPOSITION.${attr} is required: send it at its path or as ctx/${attr === "composer" ? "composer_name" : attr}`);
      }
    }
    this.decideContext();
  }

  private name(node: WebTemplateNode): string {
    return node.localizedNames?.[this.language] ?? node.name ?? node.localizedName ?? node.id;
  }

  private fillLocatable(obj: RmObject, node?: WebTemplateNode): void {
    if (!this.apply || !isLocatable(obj)) return;
    if (!obj.name) {
      const type = String(obj._type ?? "");
      obj.name = dvText(node ? this.name(node) : COLLAPSED_NAMES[type] ?? type);
    }
    const nodeId = node?.nodeId ?? String(obj.archetype_node_id ?? "");
    if (obj.archetype_node_id == null && node?.nodeId) obj.archetype_node_id = node.nodeId;
    if (nodeId.startsWith("openEHR-") && !obj.archetype_details) {
      obj.archetype_details = {
        _type: "ARCHETYPED",
        archetype_id: { _type: "ARCHETYPE_ID", value: nodeId },
        rm_version: "1.1.0",
      };
    }
  }

  private walk(node: WebTemplateNode, obj: RmObject): void {
    this.fillLocatable(obj, node);
    this.fillRmAttributes(node, obj);
    for (const child of node.children ?? []) {
      if (child.inContext) continue;
      const rel = relativePath(node, child);
      for (const hit of resolveRaw(obj, rel)) {
        const base = node.aqlPath === "/" ? "" : node.aqlPath;
        hit.via.forEach((v, i) => {
          // A leaf pointing at ELEMENT/value names the ELEMENT.
          const isElementOfLeaf = i === hit.via.length - 1 &&
            v._type === "ELEMENT" && /\/value$/.test(rel);
          if (isElementOfLeaf) this.fillLocatable(v, child);
          else this.fillCollapsed(v, base + hit.viaPaths[i]);
        });
        this.walk(child, hit.value);
      }
    }
    if (obj._type === "OBSERVATION") {
      // Collapsed HISTORY / EVENT have no Web Template node of their own.
      const history = obj.data as RmObject | undefined;
      if (history) {
        const hPath = `${node.aqlPath}/data[${history.archetype_node_id}]`;
        this.fillCollapsed(history, hPath);
        for (const ev of (history.events as RmObject[] | undefined) ?? []) {
          this.fillCollapsed(ev, `${hPath}/events[${ev.archetype_node_id}]`);
        }
      }
    }
  }

  /** RM type and name of an object without a Web Template node. */
  private fillCollapsed(obj: RmObject, aqlPath: string): void {
    const entry = this.wt.tree.collapsed?.[aqlPath];
    if (entry && (obj._type == null || obj._type === "ITEM_TREE" || obj._type === "EVENT" || obj._type === "CLUSTER")) {
      obj._type = entry.rmType;
    }
    if (entry && this.apply && !obj.name) {
      const name = entry.localizedNames?.[this.language] ?? entry.name;
      if (name) obj.name = dvText(name);
    }
    this.fillLocatable(obj);
  }

  /** Entry, event, action, instruction and activity attributes. */
  private fillRmAttributes(node: WebTemplateNode | undefined, obj: RmObject): void {
    const type = String(obj._type ?? "");
    const path = node?.aqlPath ?? type;
    if (ENTRY_TYPES.has(type)) this.fillEntry(obj, path);
    if (type === "OBSERVATION") this.fillObservation(obj, path, node);
    if (type === "ACTION" && !obj.time) {
      const t = bare(this.ctx.get("action_time")) ?? this.ctxTime ??
        this.now(`${path}/time`, "ACTION.time");
      if (t != null) obj.time = dateTime(String(t));
    }
    if (type === "INSTRUCTION" && !obj.narrative) {
      const n = bare(this.ctx.get("instruction_narrative"));
      if (n != null) obj.narrative = dvText(String(n));
      else {
        this.issue(`${path}/narrative`, "INSTRUCTION.narrative is required: send it at its path or as ctx/instruction_narrative");
      }
    }
    if (type === "ACTIVITY") {
      const timing = bare(this.ctx.get("activity_timing"));
      if (!obj.timing && timing != null) {
        obj.timing = { _type: "DV_PARSABLE", value: String(timing), formalism: "timing" };
      }
      if (obj.action_archetype_id == null && this.apply) obj.action_archetype_id = "/.*/";
    }
  }

  private fillEntry(obj: RmObject, path: string): void {
    if (!obj.language) {
      if (this.apply) obj.language = codePhrase("ISO_639-1", this.language);
      else this.issue(`${path}/language`, "ENTRY.language is missing (contextDefaults: \"none\")");
    }
    if (!obj.encoding) {
      if (this.apply) obj.encoding = codePhrase("IANA_character-sets", "UTF-8");
      else this.issue(`${path}/encoding`, "ENTRY.encoding is missing (contextDefaults: \"none\")");
    }
    if (!obj.subject) {
      if (this.apply) obj.subject = { _type: "PARTY_SELF" };
      else this.issue(`${path}/subject`, "ENTRY.subject is missing (contextDefaults: \"none\")");
    } else {
      // A subject sent without a name refers to the record subject.
      const s = obj.subject as RmObject;
      if (s._type === "PARTY_IDENTIFIED" && s.name == null) s._type = "PARTY_SELF";
    }
    const providerName = bare(this.ctx.get("provider_name"));
    const providerId = bare(this.ctx.get("provider_id"));
    if (!obj.provider && (providerName != null || providerId != null)) {
      obj.provider = {
        _type: "PARTY_IDENTIFIED",
        ...(providerName != null ? { name: String(providerName) } : {}),
        ...(providerId != null ? { external_ref: partyRef(providerId, {}) } : {}),
      };
    }
  }

  /**
   * HISTORY.origin ← path ← ctx/history_origin ← earliest event time ←
   * ctx/time ← clock; EVENT.time ← path ← HISTORY.origin.
   */
  private fillObservation(obj: RmObject, path: string, node?: WebTemplateNode): void {
    let history = obj.data as RmObject | undefined;
    if (!history || typeof history !== "object") {
      if (!this.apply) {
        this.issue(`${path}/data`, "OBSERVATION.data is missing (contextDefaults: \"none\")");
        return;
      }
      const originNode = node?.children?.find((c) => c.id === "history_origin");
      const m = originNode ? /\/data\[([^\]]+)\]\/origin$/.exec(originNode.aqlPath) : null;
      history = { _type: "HISTORY", archetype_node_id: m?.[1] ?? "at0001" };
      obj.data = history;
    }
    if (history._type === "ITEM_TREE" || !history._type) history._type = "HISTORY";
    const events = Array.isArray(history.events) ? history.events as RmObject[] : [];
    if (!history.origin) {
      const times = events.map((e) => timeValue(e.time)).filter((t): t is string => !!t).sort();
      const origin = bare(this.ctx.get("history_origin")) ?? times[0] ?? this.ctxTime ??
        this.now(`${path}/data/origin`, "HISTORY.origin");
      if (origin != null) history.origin = dateTime(String(origin));
    }
    for (const ev of events) {
      if (ev._type === "EVENT") ev._type = "POINT_EVENT";
      if (!ev.time && history.origin) ev.time = { ...(history.origin as RmObject) };
    }
  }
}

/** Apply `ctx/` values and RM-mandatory defaults to a deserialized composition. */
export function applyFlatContextDefaults(
  comp: RmObject,
  wt: WebTemplate,
  ctx: CtxFields,
  issues: FlatRmDefaultIssue[],
  options: FlatContextOptions = {},
): void {
  new ContextDefaulter(comp, wt, ctx, issues, options).run();
}

/** Report ACTIONs whose ISM_TRANSITION.current_state no default could fill. */
export function reportMissingActionState(
  comp: RmObject,
  issues: FlatRmDefaultIssue[],
): void {
  const visit = (obj: unknown, path: string): void => {
    if (!obj || typeof obj !== "object") return;
    if (Array.isArray(obj)) {
      obj.forEach((item, i) => visit(item, `${path}[${i}]`));
      return;
    }
    const rec = obj as RmObject;
    if (rec._type === "ACTION") {
      const ism = rec.ism_transition as RmObject | undefined;
      if (!ism?.current_state) {
        issues.push({
          path: `${path}/ism_transition/current_state`,
          severity: "error",
          kind: "missing-mandatory",
          message:
            "ISM_TRANSITION.current_state is required: send …/ism_transition/current_state|code or ctx/action_ism_transition_current_state",
        });
      }
      return;
    }
    for (const key of ["content", "items", "activities"]) {
      if (rec[key]) visit(rec[key], `${path}/${key}`);
    }
  };
  visit(comp.content, "/content");
}
