/**
 * Contribution builder: template binding (ADR 0007, issue #163).
 *
 * A draft is bound to one operational template, held internally as ADL2. The
 * binding records the template id with full version, a sha256 over the
 * RFC 8785 (JCS) form of ehrtslib's JSON for the ADL2 operational template,
 * and the serialisation version used. Tool-supplied identifiers from the
 * source (`MD5-CAM-1.0.1`, `PARENT:MD5-CAM-1.0.1`, `build_uid`) are recorded
 * for information only: a mismatch warns, a missing value is fine.
 *
 * Changing template is an explicit `migrate-template` step (operation log,
 * issue #164). Here a rebind only reports what changed, via
 * {@link compareTemplateBindings} / {@link checkTemplateBinding}, and
 * {@link assertTemplateBindingUnchanged} throws a typed error.
 */

import type * as openehr_am from "../am/openehr_am.ts";
import { ADL2Parser } from "../parser/adl2_parser.ts";
import { ADL2Tokenizer } from "../parser/adl2_tokenizer.ts";
import { isOptXml, parseOptXml } from "../parser/legacy/opt_xml_parser.ts";
import {
  hasAdl14NodeIds,
  type Opt14Header,
  readOpt14Header,
  upconvertOpt14ToAdl2,
} from "../parser/legacy/opt14_upconvert.ts";
import { OPT14_CODE_MAPPING_VERSION } from "../parser/legacy/opt14_code_mapping.ts";
import { JsonCanonicalSerializer } from "../serialization/json/json_canonical_serializer.ts";
import { canonicalizeJson, sha256Hex } from "./jcs.ts";

/**
 * Version of the canonical serialisation the hash is computed over. Bump it
 * whenever {@link templateCanonicalForm}, ehrtslib's AOM JSON shape, or the
 * OPT 1.4 code mapping changes in a way that changes hashes.
 */
export const TEMPLATE_BINDING_SERIALISATION_VERSION =
  `ehrtslib-cb-opt-json/1;jcs=rfc8785;opt14-codes=${OPT14_CODE_MAPPING_VERSION}`;

/** `description/other_details` keys that are tool identifiers, not template content. */
export const MD5_CAM_KEY = "MD5-CAM-1.0.1";
export const PARENT_MD5_CAM_KEY = "PARENT:MD5-CAM-1.0.1";

/** Where the bound template came from. */
export type TemplateSourceFormat = "adl2-opt" | "opt14-xml";

/** Tool-supplied identifiers from the source template. Informative only. */
export interface TemplateSourceIdentifiers {
  md5Cam?: string;
  parentMd5Cam?: string;
  buildUid?: string;
  uid?: string;
}

/** What a draft records about its template. Plain JSON, safe to persist. */
export interface TemplateBinding {
  /** ADL2: archetype id without the version part. OPT 1.4: `template_id`. */
  templateId: string;
  /** ADL2: version from the HRID (`1.0.0`). OPT 1.4: `sem_ver` from `other_details`, if any. */
  version: string | null;
  /** ADL2: full archetype id with version. OPT 1.4: `template_id` (there is no HRID). */
  hrid: string;
  hash: {
    algorithm: "sha256";
    /** Lower-case hex. */
    value: string;
    serialisationVersion: string;
  };
  sourceFormat: TemplateSourceFormat;
  sourceIdentifiers: TemplateSourceIdentifiers;
}

/** Input accepted by {@link bindTemplate}. */
export type TemplateInput = string | openehr_am.OPERATIONAL_TEMPLATE;

export interface BindTemplateOptions {
  /**
   * Header of the OPT 1.4 XML, when `input` is an already parsed OPT 1.4
   * object (gives template id, `sem_ver`, description and source identifiers).
   */
  opt14Header?: Opt14Header;
}

export interface BoundTemplate {
  binding: TemplateBinding;
  /** The ADL2 operational template (id-codes) the binding refers to. */
  operationalTemplate: openehr_am.OPERATIONAL_TEMPLATE;
  warnings: string[];
}

/** Severity `error` means the draft cannot continue without `migrate-template`. */
export type TemplateBindingIssueCode =
  | "template-id-changed"
  | "version-changed"
  | "hash-changed"
  | "serialisation-version-changed"
  | "source-md5-cam-changed"
  | "source-parent-md5-cam-changed"
  | "source-build-uid-changed";

export interface TemplateBindingIssue {
  code: TemplateBindingIssueCode;
  severity: "error" | "warning";
  message: string;
  bound?: string | null;
  candidate?: string | null;
}

export interface TemplateBindingComparison {
  /** True when no `error` issue was found (warnings may still be present). */
  unchanged: boolean;
  /** True when moving the draft needs an explicit `migrate-template` step. */
  migrationRequired: boolean;
  issues: TemplateBindingIssue[];
  bound: TemplateBinding;
  candidate: TemplateBinding;
}

/** Thrown by {@link assertTemplateBindingUnchanged}. */
export class TemplateBindingMismatchError extends Error {
  readonly comparison: TemplateBindingComparison;
  constructor(comparison: TemplateBindingComparison) {
    const errors = comparison.issues.filter((i) => i.severity === "error");
    super(
      `Template binding changed (${errors.map((e) => e.code).join(", ")}); ` +
        "use an explicit migrate-template step instead of rebinding",
    );
    this.name = "TemplateBindingMismatchError";
    this.comparison = comparison;
  }
}

interface LoadedSource {
  opt: openehr_am.OPERATIONAL_TEMPLATE;
  sourceFormat: TemplateSourceFormat;
  opt14Header?: Opt14Header;
  adl2HeaderIds: TemplateSourceIdentifiers;
  warnings: string[];
}

function adl2HeaderIdentifiers(text: string): TemplateSourceIdentifiers {
  const m = /^\s*(?:operational_template|template|archetype)\s*\(([^)]*)\)/
    .exec(text);
  const out: TemplateSourceIdentifiers = {};
  if (!m) return out;
  for (const part of m[1].split(";")) {
    const [k, v] = part.split("=").map((s) => s.trim());
    if (k === "uid" && v) out.uid = v;
    if (k === "build_uid" && v) out.buildUid = v;
  }
  return out;
}

function loadSource(
  input: TemplateInput,
  options: BindTemplateOptions,
): LoadedSource {
  const warnings: string[] = [];
  if (typeof input === "string") {
    if (isOptXml(input)) {
      const parsed = parseOptXml(input);
      warnings.push(...parsed.warnings);
      const header = readOpt14Header(input);
      const up = upconvertOpt14ToAdl2(parsed.operationalTemplate, header);
      warnings.push(...up.warnings);
      return {
        opt: up.operationalTemplate,
        sourceFormat: "opt14-xml",
        opt14Header: header,
        adl2HeaderIds: {},
        warnings,
      };
    }
    if (/^\s*operational_template\b/.test(input)) {
      const result = new ADL2Parser(new ADL2Tokenizer(input).tokenize())
        .parse();
      const opt = result.operationalTemplate;
      if (!opt) {
        throw new Error(
          "bindTemplate: ADL2 text did not parse to an operational template",
        );
      }
      return {
        opt,
        sourceFormat: "adl2-opt",
        adl2HeaderIds: adl2HeaderIdentifiers(input),
        warnings,
      };
    }
    throw new Error(
      "bindTemplate: expected OPT 1.4 XML or ADL2 operational_template text. " +
        "Flatten an ADL2 source template first (TemplateWorkspace.resolveOperational).",
    );
  }
  if (hasAdl14NodeIds(input)) {
    const up = upconvertOpt14ToAdl2(input, options.opt14Header);
    return {
      opt: up.operationalTemplate,
      sourceFormat: "opt14-xml",
      opt14Header: options.opt14Header,
      adl2HeaderIds: {},
      warnings: up.warnings,
    };
  }
  return { opt: input, sourceFormat: "adl2-opt", adl2HeaderIds: {}, warnings };
}

function otherDetailsOf(
  opt: openehr_am.OPERATIONAL_TEMPLATE,
): Record<string, unknown> {
  const desc = opt.description as unknown as
    | Record<string, unknown>
    | undefined;
  const od = desc?.other_details;
  return od && typeof od === "object" ? od as Record<string, unknown> : {};
}

function str(v: unknown): string | undefined {
  if (v === undefined || v === null) return undefined;
  if (typeof v === "string") return v.trim() || undefined;
  if (typeof v === "number") return String(v);
  if (typeof v === "object" && "value" in (v as object)) {
    return str((v as { value: unknown }).value);
  }
  return undefined;
}

const ADL2_VERSION_RE = /^(.*)\.v(\d+(?:\.\d+){0,2}(?:-[0-9A-Za-z.+-]+)?)$/;

function identityOf(
  src: LoadedSource,
): Pick<TemplateBinding, "templateId" | "version" | "hrid"> {
  const od = otherDetailsOf(src.opt);
  if (src.sourceFormat === "opt14-xml") {
    const templateId = src.opt14Header?.templateId ?? src.opt.template_id ??
      src.opt.archetype_id?.value ?? "";
    const version = src.opt14Header?.otherDetails.sem_ver?.trim() ||
      str(od.sem_ver) || null;
    return { templateId, version, hrid: templateId };
  }
  const hrid = src.opt.archetype_id?.value ?? src.opt.template_id ?? "";
  const m = ADL2_VERSION_RE.exec(hrid);
  return m
    ? { templateId: m[1], version: m[2], hrid }
    : { templateId: hrid, version: str(od.sem_ver) ?? null, hrid };
}

function sourceIdentifiersOf(src: LoadedSource): TemplateSourceIdentifiers {
  const od = {
    ...otherDetailsOf(src.opt),
    ...(src.opt14Header?.otherDetails ?? {}),
  };
  const out: TemplateSourceIdentifiers = {};
  const md5 = str(od[MD5_CAM_KEY]);
  const parent = str(od[PARENT_MD5_CAM_KEY]);
  const buildUid = str(od.build_uid) ?? src.adl2HeaderIds.buildUid ??
    str(src.opt.build_uid);
  const uid = src.opt14Header?.uid ?? src.adl2HeaderIds.uid ?? str(src.opt.uid);
  if (md5) out.md5Cam = md5;
  if (parent) out.parentMd5Cam = parent;
  if (buildUid) out.buildUid = buildUid;
  if (uid) out.uid = uid;
  return out;
}

const EXCLUDED_TOP_LEVEL = [
  "uid",
  "build_uid",
  "archetype_id",
  "template_id",
  "adl_version",
];
const EXCLUDED_OTHER_DETAILS = [
  MD5_CAM_KEY,
  PARENT_MD5_CAM_KEY,
  "build_uid",
  "sem_ver",
];

function sortAttributeArrays(value: unknown): void {
  if (Array.isArray(value)) {
    for (const v of value) sortAttributeArrays(v);
    return;
  }
  if (!value || typeof value !== "object") return;
  const rec = value as Record<string, unknown>;
  for (const v of Object.values(rec)) sortAttributeArrays(v);
  const attrs = rec.attributes;
  if (Array.isArray(attrs) && attrs.every((a) => a && typeof a === "object")) {
    const key = (a: Record<string, unknown>) =>
      `${a.rm_attribute_name ?? ""}\u0000${a.differential_path ?? ""}`;
    attrs.sort((a, b) => {
      const ka = key(a as Record<string, unknown>);
      const kb = key(b as Record<string, unknown>);
      return ka < kb ? -1 : ka > kb ? 1 : 0;
    });
  }
}

/**
 * The JSON value the template hash is computed over: ehrtslib's canonical
 * JSON for the ADL2 operational template (`_type` on every object), with
 *
 * - identity and tool identifiers removed, since the binding records them
 *   separately: top-level `uid`, `build_uid`, `archetype_id`, `template_id`,
 *   `adl_version` (syntax version), and `description.other_details` keys
 *   `MD5-CAM-1.0.1`, `PARENT:MD5-CAM-1.0.1`, `build_uid`, `sem_ver`;
 * - a fixed array order where order carries no meaning: `attributes` of each
 *   object node sorted by `rm_attribute_name` (then `differential_path`).
 *   Other arrays keep document order: sibling `children` order and code-list
 *   order are part of template content (display order).
 *
 * Object member order does not matter: RFC 8785 sorts members.
 */
export function templateCanonicalForm(
  opt: openehr_am.OPERATIONAL_TEMPLATE,
): unknown {
  const json = new JsonCanonicalSerializer().serialize(opt, {
    prettyPrint: false,
  });
  const plain = JSON.parse(json) as Record<string, unknown>;
  for (const k of EXCLUDED_TOP_LEVEL) delete plain[k];
  const desc = plain.description as Record<string, unknown> | undefined;
  const od = desc?.other_details as Record<string, unknown> | undefined;
  if (od && typeof od === "object") {
    for (const k of EXCLUDED_OTHER_DETAILS) delete od[k];
    if (!Object.keys(od).length) delete desc!.other_details;
  }
  sortAttributeArrays(plain);
  return plain;
}

/** RFC 8785 string of {@link templateCanonicalForm}. */
export function canonicalTemplateJson(
  opt: openehr_am.OPERATIONAL_TEMPLATE,
): string {
  return canonicalizeJson(templateCanonicalForm(opt));
}

/** sha256 (hex) of {@link canonicalTemplateJson}. */
export function templateHash(
  opt: openehr_am.OPERATIONAL_TEMPLATE,
): Promise<string> {
  return sha256Hex(canonicalTemplateJson(opt));
}

/**
 * Bind to an operational template: ADL2 `operational_template` text, OPT 1.4
 * XML, or a parsed `OPERATIONAL_TEMPLATE` (ADL2, or OPT 1.4 with at-codes,
 * which is up-converted). Returns the binding and the ADL2 template it refers to.
 */
export async function bindTemplate(
  input: TemplateInput,
  options: BindTemplateOptions = {},
): Promise<BoundTemplate> {
  const src = loadSource(input, options);
  const identity = identityOf(src);
  if (!identity.templateId) {
    src.warnings.push("Template has no template id or archetype id");
  }
  const binding: TemplateBinding = {
    ...identity,
    hash: {
      algorithm: "sha256",
      value: await templateHash(src.opt),
      serialisationVersion: TEMPLATE_BINDING_SERIALISATION_VERSION,
    },
    sourceFormat: src.sourceFormat,
    sourceIdentifiers: sourceIdentifiersOf(src),
  };
  return { binding, operationalTemplate: src.opt, warnings: src.warnings };
}

/**
 * Compare the binding a draft holds with a freshly computed one. Template id,
 * version, hash or serialisation-version changes are errors (the draft needs
 * `migrate-template`). Differences in source identifiers are warnings only,
 * and only when both sides have a value.
 */
export function compareTemplateBindings(
  bound: TemplateBinding,
  candidate: TemplateBinding,
): TemplateBindingComparison {
  const issues: TemplateBindingIssue[] = [];
  const err = (
    code: TemplateBindingIssueCode,
    message: string,
    b?: string | null,
    c?: string | null,
  ) =>
    issues.push({ code, severity: "error", message, bound: b, candidate: c });
  if (bound.templateId !== candidate.templateId) {
    err(
      "template-id-changed",
      "Template id differs",
      bound.templateId,
      candidate.templateId,
    );
  }
  if ((bound.version ?? null) !== (candidate.version ?? null)) {
    err(
      "version-changed",
      "Template version differs",
      bound.version,
      candidate.version,
    );
  }
  if (bound.hash.serialisationVersion !== candidate.hash.serialisationVersion) {
    err(
      "serialisation-version-changed",
      "Hashes use different serialisation versions and cannot be compared",
      bound.hash.serialisationVersion,
      candidate.hash.serialisationVersion,
    );
  } else if (bound.hash.value !== candidate.hash.value) {
    err(
      "hash-changed",
      "Template content hash differs",
      bound.hash.value,
      candidate.hash.value,
    );
  }
  const warnIf = (
    code: TemplateBindingIssueCode,
    label: string,
    b: string | undefined,
    c: string | undefined,
  ) => {
    if (b && c && b !== c) {
      issues.push({
        code,
        severity: "warning",
        message: `${label} differs (informative only)`,
        bound: b,
        candidate: c,
      });
    }
  };
  const bi = bound.sourceIdentifiers ?? {};
  const ci = candidate.sourceIdentifiers ?? {};
  warnIf("source-md5-cam-changed", MD5_CAM_KEY, bi.md5Cam, ci.md5Cam);
  warnIf(
    "source-parent-md5-cam-changed",
    PARENT_MD5_CAM_KEY,
    bi.parentMd5Cam,
    ci.parentMd5Cam,
  );
  warnIf("source-build-uid-changed", "build_uid", bi.buildUid, ci.buildUid);
  const migrationRequired = issues.some((i) => i.severity === "error");
  return {
    unchanged: !migrationRequired,
    migrationRequired,
    issues,
    bound,
    candidate,
  };
}

/** Bind `input` and compare it with `bound`. */
export async function checkTemplateBinding(
  bound: TemplateBinding,
  input: TemplateInput,
  options: BindTemplateOptions = {},
): Promise<TemplateBindingComparison & { template: BoundTemplate }> {
  const template = await bindTemplate(input, options);
  return { ...compareTemplateBindings(bound, template.binding), template };
}

/** Throw {@link TemplateBindingMismatchError} when the comparison needs a migration. */
export function assertTemplateBindingUnchanged(
  comparison: TemplateBindingComparison,
): void {
  if (comparison.migrationRequired) {
    throw new TemplateBindingMismatchError(comparison);
  }
}
