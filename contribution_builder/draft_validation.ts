/**
 * CB draft validation (ADR 0008): check a draft against its bound template
 * in `complete` or `incomplete` mode, and report every problem on the node
 * it belongs to.
 *
 * - **complete** (lifecycle state 532): every template and RM constraint
 *   applies.
 * - **incomplete** (lifecycle state 553): RM Common section 6 — incomplete
 *   data "may be missing, but it may not be wrong". Missing template content
 *   (existence, occurrences and cardinality lower bounds) is listed but does
 *   not fail. Content that is present must still be valid. Attributes the RM
 *   itself requires (language, territory, category, composer, subject) still
 *   fail, since no CDR can store a COMPOSITION without them.
 *
 * The checks are ehrtslib's {@link TemplateValidator} (template constraints)
 * and its built-in {@link RMSpecificationValidator} (RM-level rules). This
 * module runs them on the draft's canonical JSON, removes duplicates, sorts
 * each message into missing or invalid, and maps its path to the nearest
 * LOCATABLE node with a uid.
 */

import * as openehr_am from "../am/openehr_am.ts";
import { RMInstanceGenerator } from "../generation/rm_instance_generator.ts";
import { toCanonicalRmJson } from "./contribution_build.ts";
import {
  TemplateValidator,
  type ValidationConfig,
  type ValidationMessage,
} from "../validation/template_validator.ts";
import type { ContributionBuild } from "./contribution_build.ts";
import { type RmJson, ROOT_TARGET } from "./operation_log.ts";
import {
  assertTemplateBindingUnchanged,
  type BoundTemplate,
  compareTemplateBindings,
} from "./template_binding.ts";

export type DraftValidationMode = "complete" | "incomplete";

/** openEHR `version lifecycle state` codes (terminology `openehr`). */
export const LIFECYCLE_STATE_COMPLETE = {
  code: "532",
  value: "complete",
} as const;
export const LIFECYCLE_STATE_INCOMPLETE = {
  code: "553",
  value: "incomplete",
} as const;

/** The `lifecycle_state` DV_CODED_TEXT a version validated in `mode` gets at commit. */
export function lifecycleStateFor(mode: DraftValidationMode): RmJson {
  const s = mode === "complete"
    ? LIFECYCLE_STATE_COMPLETE
    : LIFECYCLE_STATE_INCOMPLETE;
  return {
    _type: "DV_CODED_TEXT",
    value: s.value,
    defining_code: {
      _type: "CODE_PHRASE",
      terminology_id: { _type: "TERMINOLOGY_ID", value: "openehr" },
      code_string: s.code,
    },
  };
}

/** `missing`: required content is absent. `invalid`: present content is wrong. */
export type DraftProblemKind = "missing" | "invalid";

/** Where the requirement comes from. */
export type DraftProblemSource = "template" | "rm";

export interface DraftProblem {
  /**
   * Short key of the nearest LOCATABLE node at or above the problem, or
   * `"root"` for the COMPOSITION (whose uid is fixed only at commit).
   */
  node: string;
  /** Full node uid `<uuid>::<short key>`; absent for the root. */
  uid?: string;
  /** Instance path from the COMPOSITION, e.g. `/content[0]/data/events[0]/data/items[1]/value`. */
  path: string;
  /** Archetype path with node ids, e.g. `/content[openEHR-EHR-OBSERVATION.x.v1]/data[id2]/…`. */
  archetypePath: string;
  /** Path below {@link node} (`value/magnitude`), usable with `setValue`; `""` for the node itself. */
  relativePath: string;
  kind: DraftProblemKind;
  source: DraftProblemSource;
  severity: "error" | "warning";
  /** The underlying validator's constraint type (`existence`, `occurrence`, `type`, `code_list`, …). */
  constraintType: string;
  /** Node id of the missing constraint node, when the validator knows it. */
  constraintNodeId?: string;
  message: string;
}

export interface DraftValidationResult {
  draftId: string;
  mode: DraftValidationMode;
  /** The lifecycle state a commit in this mode records (532 or 553). */
  lifecycleState: { code: "532" | "553"; value: "complete" | "incomplete" };
  /** No errors in this mode. */
  valid: boolean;
  /** Problems that fail this mode. */
  errors: DraftProblem[];
  warnings: DraftProblem[];
  /**
   * All missing required content, in both modes. In incomplete mode only the
   * RM-required entries here are also errors.
   */
  missing: DraftProblem[];
}

export interface DraftValidateOptions {
  mode?: DraftValidationMode;
}

const MISSING_TYPES = new Set([
  "existence",
  "occurrence",
  "cardinality",
  "rm_specification",
]);

/**
 * Validates CB drafts. Create once with {@link DraftValidator.create} (loads
 * UCUM) and reuse.
 */
export class DraftValidator {
  private constructor(private readonly validator: TemplateValidator) {}

  static async create(config?: ValidationConfig): Promise<DraftValidator> {
    const v = new TemplateValidator(config);
    await v.initialize();
    return new DraftValidator(v);
  }

  /**
   * Validate `draftId` against `template`, which must be the template the
   * draft is bound to (same hash); otherwise throws
   * `TemplateBindingMismatchError`.
   */
  validate(
    build: ContributionBuild,
    draftId: string,
    template: BoundTemplate,
    options: DraftValidateOptions = {},
  ): DraftValidationResult {
    const mode = options.mode ?? "complete";
    const draft = build.getDraft(draftId);
    assertTemplateBindingUnchanged(
      compareTemplateBindings(draft.templateBinding, template.binding),
    );
    const root = build.toCanonicalJson(draftId);
    fillEventOffsets(root);
    const raw = this.validator.validate(root, template.operationalTemplate);
    const minimalRef = minimalSkeletonReference(template.operationalTemplate);
    const optionalAbsent = optionalAbsentAttributeMessages(
      root,
      template.operationalTemplate.definition,
      "/",
      minimalRef,
    );

    const seen = new Set<string>();
    const errors: DraftProblem[] = [];
    const warnings: DraftProblem[] = [];
    const missing: DraftProblem[] = [];
    for (const m of [...raw.errors, ...raw.warnings, ...optionalAbsent]) {
      const p = toProblem(root, m);
      const id = `${p.severity}|${p.path}|${p.constraintType}|${p.message}`;
      if (seen.has(id)) continue;
      seen.add(id);
      if (p.kind === "missing") missing.push(p);
      if (p.severity === "warning") {
        warnings.push(p);
        if (p.kind === "missing" && mode === "complete") errors.push(p);
        continue;
      }
      if (mode === "complete" || p.kind === "invalid" || p.source === "rm") {
        errors.push(p);
      }
    }
    const order = (a: DraftProblem, b: DraftProblem) =>
      a.path < b.path ? -1 : a.path > b.path ? 1 : 0;
    errors.sort(order);
    warnings.sort(order);
    missing.sort(order);
    return {
      draftId,
      mode,
      lifecycleState: mode === "complete"
        ? { ...LIFECYCLE_STATE_COMPLETE }
        : { ...LIFECYCLE_STATE_INCOMPLETE },
      valid: errors.length === 0,
      errors,
      warnings,
      missing,
    };
  }
}

/** One-off validation; prefer a reused {@link DraftValidator} in editors. */
export async function validateDraft(
  build: ContributionBuild,
  draftId: string,
  template: BoundTemplate,
  options: DraftValidateOptions = {},
): Promise<DraftValidationResult> {
  return (await DraftValidator.create()).validate(
    build,
    draftId,
    template,
    options,
  );
}

/** Problems that belong to `node` (short key, full uid or `"root"`). */
export function problemsForNode(
  result: DraftValidationResult,
  node: string,
): DraftProblem[] {
  const all = [...result.errors, ...result.warnings, ...result.missing];
  const out: DraftProblem[] = [];
  const seen = new Set<DraftProblem>();
  for (const p of all) {
    if (seen.has(p)) continue;
    seen.add(p);
    if (p.node === node || p.uid === node) out.push(p);
  }
  return out;
}

// ------------------------------------------------------------- internals

interface Step {
  attr: string;
  index?: number;
}

/**
 * Parse a validator path. The validators mix `/items/[2]/`, `/items/2/` and
 * `/items[2]/`; all mean member 2 of `items`.
 */
export function parseInstancePath(path: string): Step[] {
  const steps: Step[] = [];
  for (const seg of path.split("/")) {
    if (!seg) continue;
    const bare = /^\[(\d+)\]$/.exec(seg) ?? /^(\d+)$/.exec(seg);
    if (bare) {
      const last = steps[steps.length - 1];
      if (last && last.index === undefined) last.index = Number(bare[1]);
      else steps.push({ attr: "", index: Number(bare[1]) });
      continue;
    }
    const named = /^([^[\]]+)\[(\d+)\]$/.exec(seg);
    if (named) steps.push({ attr: named[1], index: Number(named[2]) });
    else steps.push({ attr: seg });
  }
  return steps;
}

function formatSteps(steps: Step[]): string {
  return "/" +
    steps.map((s) => s.index === undefined ? s.attr : `${s.attr}[${s.index}]`)
      .join("/");
}

type Obj = Record<string, RmJson>;
const isObj = (v: unknown): v is Obj =>
  !!v && typeof v === "object" && !Array.isArray(v);

function toProblem(root: RmJson, m: ValidationMessage): DraftProblem {
  const steps = parseInstancePath(m.path);
  let cur: RmJson | undefined = root;
  let node = ROOT_TARGET;
  let uid: string | undefined;
  let nodeDepth = 0;
  let archetypePath = "";
  steps.forEach((s, i) => {
    let next: RmJson | undefined = isObj(cur) ? cur[s.attr] : undefined;
    if (s.index !== undefined) {
      next = Array.isArray(next) ? next[s.index] : undefined;
    }
    cur = next;
    if (isObj(cur) && typeof cur.archetype_node_id === "string") {
      archetypePath += `/${s.attr}[${cur.archetype_node_id}]`;
      const u = cur.uid;
      if (isObj(u) && typeof u.value === "string") {
        uid = u.value;
        const at = uid.indexOf("::");
        node = at < 0 ? uid : uid.slice(at + 2);
        nodeDepth = i + 1;
      }
    } else {
      archetypePath += `/${s.attr}`;
    }
  });
  const absent = cur === undefined || cur === null ||
    (Array.isArray(cur) && cur.length === 0);
  const missing = (MISSING_TYPES.has(m.constraintType) &&
    (absent || /below minimum/.test(m.message))) ||
    (m.constraintType === "rm_invariant" && invariantFailsOnAbsence(cur, m));
  const p: DraftProblem = {
    node,
    path: steps.length ? formatSteps(steps) : "/",
    archetypePath: archetypePath || "/",
    relativePath: steps.slice(nodeDepth).map((s) =>
      s.index === undefined ? s.attr : `${s.attr}[${s.index}]`
    ).join("/"),
    kind: missing ? "missing" : "invalid",
    source: m.constraintType.startsWith("rm_") ? "rm" : "template",
    severity: m.severity === "error" ? "error" : "warning",
    constraintType: m.constraintType,
    message: m.message,
  };
  if (uid) p.uid = uid;
  if (m.constraintNodeId) p.constraintNodeId = m.constraintNodeId;
  return p;
}

/**
 * An RM invariant such as `HISTORY.Events_valid: (events /= Void and then not
 * events.is_empty) or summary /= Void` that fails only because content is not
 * there yet: every attribute it tests for presence is absent on the node.
 */
function invariantFailsOnAbsence(
  node: RmJson | undefined,
  m: ValidationMessage,
): boolean {
  if (!isObj(node)) return false;
  const expr = m.message.slice(m.message.indexOf(":") + 1);
  const attrs = new Set<string>();
  for (const re of [/(\w+)\s*\/=\s*Void/g, /(\w+)\.is_empty/g]) {
    for (const hit of expr.matchAll(re)) attrs.add(hit[1]);
  }
  if (!attrs.size) return false;
  for (const a of attrs) {
    const v = node[a];
    const present = v !== undefined && v !== null &&
      !(Array.isArray(v) && v.length === 0);
    if (present) return false;
  }
  return true;
}

/**
 * `EVENT.offset` is an RM function (`time - parent.origin`). Commits do not
 * store it, so a version read back has none; compute it for validation so
 * template constraints and the RM invariant on it see the real value.
 */
function isPresentRmValue(rmValue: unknown): boolean {
  if (rmValue === null || rmValue === undefined) return false;
  if (typeof rmValue === "function") return false;
  if (Array.isArray(rmValue) && rmValue.length === 0) return false;
  return true;
}

function minimalSkeletonReference(
  opt: openehr_am.OPERATIONAL_TEMPLATE,
): RmJson {
  const skeleton = toCanonicalRmJson(
    new RMInstanceGenerator({ mode: "minimal" }).generate(opt),
  ) as Record<string, unknown>;
  delete skeleton.composer;
  delete skeleton.uid;
  return skeleton as RmJson;
}

/** Optional template attributes removed from the instance (not unfilled placeholders). */
function optionalAbsentAttributeMessages(
  rmNode: unknown,
  cObject: openehr_am.C_OBJECT | undefined,
  path: string,
  minimalNode: unknown,
): ValidationMessage[] {
  const out: ValidationMessage[] = [];
  if (!cObject || !(cObject instanceof openehr_am.C_COMPLEX_OBJECT)) {
    return out;
  }
  if (!isObj(rmNode) && !Array.isArray(rmNode)) return out;
  const skipAbsentHere = cObject.rm_type_name === "ITEM_TREE" ||
    cObject.rm_type_name === "ITEM_LIST";
  for (const attr of cObject.attributes ?? []) {
    const attrName = attr.rm_attribute_name;
    if (!attrName) continue;
    const rawValue = isObj(rmNode) ? rmNode[attrName] : undefined;
    const attrPath = `${path}${attrName}/`;
    const existence = (attr as { existence?: { lower?: number } }).existence;
    const children = attr.children ?? [];
    const keyMissing = isObj(rmNode) &&
      !Object.prototype.hasOwnProperty.call(rmNode, attrName);
    const minimalHadKey = isObj(minimalNode) &&
      Object.prototype.hasOwnProperty.call(minimalNode, attrName);
    if (
      !skipAbsentHere &&
      (existence?.lower ?? 0) === 0 &&
      keyMissing &&
      minimalHadKey &&
      children.length
    ) {
      const child = children[0];
      out.push({
        path: attrPath,
        archetypePath: attrPath,
        message: `Optional attribute absent: ${attrName}`,
        severity: "warning",
        constraintType: "existence",
        constraintNodeId: child instanceof openehr_am.C_OBJECT
          ? child.node_id
          : undefined,
      });
      continue;
    }
    const rmValue = rawValue;
    const minValue = isObj(minimalNode) ? minimalNode[attrName] : undefined;
    if (Array.isArray(rmValue)) {
      const minArr = Array.isArray(minValue) ? minValue : [];
      rmValue.forEach((item, i) => {
        const child = children[0];
        if (child) {
          out.push(...optionalAbsentAttributeMessages(
            item,
            child,
            `${attrPath.replace(/\/$/, "")}[${i}]/`,
            minArr[i],
          ));
        }
      });
    } else if (isPresentRmValue(rmValue)) {
      const child = children[0];
      if (child) {
        out.push(...optionalAbsentAttributeMessages(
          rmValue,
          child,
          attrPath,
          minValue,
        ));
      }
    }
  }
  return out;
}

function fillEventOffsets(v: RmJson, origin?: string): void {
  if (Array.isArray(v)) return v.forEach((x) => fillEventOffsets(x, origin));
  if (!isObj(v)) return;
  let o = origin;
  if (v._type === "HISTORY" && isObj(v.origin)) o = String(v.origin.value);
  if (
    typeof v._type === "string" && /_EVENT$/.test(v._type) &&
    v.offset === undefined && isObj(v.time) && o
  ) {
    const ms = Date.parse(String(v.time.value)) - Date.parse(o);
    if (Number.isFinite(ms)) {
      v.offset = { _type: "DV_DURATION", value: isoSeconds(ms) };
    }
  }
  for (const x of Object.values(v)) fillEventOffsets(x, o);
}

function isoSeconds(ms: number): string {
  const sign = ms < 0 ? "-" : "";
  const s = Math.abs(ms) / 1000;
  return `${sign}PT${Number.isInteger(s) ? s : s.toFixed(3)}S`;
}
