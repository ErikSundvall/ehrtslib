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
import {
  type Adl2CodingSystem,
  DEFAULT_ADL2_CODING_SYSTEM,
  opt14CodeMappingVersion,
  resolveAdl2CodingSystem,
  type Adl2CodingOptions,
} from "../parser/legacy/opt14_code_mapping.ts";
import type { Opt14ExportBindingMetadata } from "./adl14_downconvert.ts";
import { JsonCanonicalSerializer } from "../serialization/json/json_canonical_serializer.ts";
import { canonicalizeJson, sha256Hex } from "./jcs.ts";

/**
 * Label for the canonical serialisation the hash is computed over. The prefix
 * `ehrtslib-cb-opt-json/1` is fixed until ehrtslib 1.0 (no backward-compat
 * guarantees for stored bindings before then). Semicolon parameters record
 * JCS profile, OPT 1.4 code mapping, and ADL2 coding when they affect the hash.
 */
/** Serialisation version for a template binding hash (includes coding system). */
export function templateBindingSerialisationVersion(
  coding: Adl2CodingSystem = DEFAULT_ADL2_CODING_SYSTEM,
): string {
  return `ehrtslib-cb-opt-json/1;jcs=rfc8785;opt14-codes=${
    opt14CodeMappingVersion(coding)
  };adl2-coding=${coding}`;
}

/**
 * Latest serialisation version for the default at-coded binding (exported for
 * callers comparing against {@link TemplateBinding.hash.serialisationVersion}).
 */
export const TEMPLATE_BINDING_SERIALISATION_VERSION =
  templateBindingSerialisationVersion();

/** `description/other_details` keys that are tool identifiers, not template content. */
export const MD5_CAM_KEY = "MD5-CAM-1.0.1";
export const PARENT_MD5_CAM_KEY = "PARENT:MD5-CAM-1.0.1";

/**
 * The template identity included in the hash, so a new release with the same
 * content still gets a new hash.
 *
 * - ADL2: `{ hrid }`, the full HRID with namespace (if any),
 *   major.minor.patch and any lifecycle suffix (`-rc.2`, `-alpha`), without
 *   the build count (semver build metadata `+…`).
 * - OPT 1.4: `{ template_id, sem_ver }` (`sem_ver` with any lifecycle
 *   suffix; `null` when absent).
 *
 * Never `build_uid`, `uid` or MD5-CAM.
 */
export type TemplateHashIdentity =
  | { hrid: string }
  | { template_id: string; sem_ver: string | null };

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
  /**
   * ADL2: version from the HRID (`1.0.0`, `1.0.0-rc.2`; build count dropped).
   * OPT 1.4: `sem_ver` from `other_details`, if any.
   */
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
  /** ADL2 coding system used when the binding was created (OPT 1.4 up-convert). */
  adl2CodingSystem: Adl2CodingSystem;
  sourceIdentifiers: TemplateSourceIdentifiers;
  /**
   * OPT 1.4 export code maps for ADL2-native templates (commit down-conversion,
   * #178). Not part of the template content hash.
   */
  opt14Export?: Opt14ExportBindingMetadata;
}

/** Input accepted by {@link bindTemplate}. */
export type TemplateInput = string | openehr_am.OPERATIONAL_TEMPLATE;

export interface BindTemplateOptions extends Adl2CodingOptions {
  /**
   * Header of the OPT 1.4 XML, when `input` is an already parsed OPT 1.4
   * object (gives template id, `sem_ver`, description and source identifiers).
   */
  opt14Header?: Opt14Header;
  /**
   * From {@link exportAdl2TemplateToOpt14} on the OPT 1.4 uploaded to the CDR.
   * Caller-supplied only; bind never runs export for ADL2-native templates.
   * Not part of the template content hash.
   */
  opt14Export?: Opt14ExportBindingMetadata;
}

export interface BoundTemplate {
  binding: TemplateBinding;
  /** The ADL2 operational template the binding refers to. */
  operationalTemplate: openehr_am.OPERATIONAL_TEMPLATE;
  warnings: string[];
}

/** Severity `error` means the draft cannot continue without `migrate-template`. */
export type TemplateBindingIssueCode =
  | "hash-changed"
  | "template-id-changed"
  | "version-changed"
  | "content-changed"
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

/**
 * Why the hash changed. The hash covers identity and content together;
 * `content` is found by hashing the candidate's content under the bound
 * identity (`null` when the candidate template is not available).
 */
export interface TemplateBindingDiagnosis {
  templateIdChanged: boolean;
  versionChanged: boolean;
  contentChanged: boolean | null;
}

export interface TemplateBindingComparison {
  /** True when no `error` issue was found (warnings may still be present). */
  unchanged: boolean;
  /** True when moving the draft needs an explicit `migrate-template` step. */
  migrationRequired: boolean;
  issues: TemplateBindingIssue[];
  diagnosis: TemplateBindingDiagnosis;
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
  adl2CodingSystem: Adl2CodingSystem;
  opt14Header?: Opt14Header;
  adl2HeaderIds: TemplateSourceIdentifiers;
  warnings: string[];
}

function inferAdl2CodingSystem(
  opt: openehr_am.OPERATIONAL_TEMPLATE,
): Adl2CodingSystem {
  const rootId = opt.definition?.node_id;
  if (rootId && /^id\d/i.test(rootId)) return "id-coded";
  return DEFAULT_ADL2_CODING_SYSTEM;
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
      const up = upconvertOpt14ToAdl2(
        parsed.operationalTemplate,
        header,
        options,
      );
      warnings.push(...up.warnings);
      return {
        opt: up.operationalTemplate,
        sourceFormat: "opt14-xml",
        adl2CodingSystem: up.adl2CodingSystem,
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
        adl2CodingSystem: inferAdl2CodingSystem(opt),
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
    const up = upconvertOpt14ToAdl2(input, options.opt14Header, options);
    return {
      opt: up.operationalTemplate,
      sourceFormat: "opt14-xml",
      adl2CodingSystem: up.adl2CodingSystem,
      opt14Header: options.opt14Header,
      adl2HeaderIds: {},
      warnings: up.warnings,
    };
  }
  return {
    opt: input,
    sourceFormat: "adl2-opt",
    adl2CodingSystem: inferAdl2CodingSystem(input),
    adl2HeaderIds: {},
    warnings,
  };
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

/** `<id>.v<major.minor.patch>[-<lifecycle>][+<build>]`; groups: id, version. */
const ADL2_VERSION_RE =
  /^(.*)\.v(\d+(?:\.\d+){0,2}(?:-[0-9A-Za-z.-]+)?)(?:\+[0-9A-Za-z.-]+)?$/;

/** The HRID without the build count (`+…`). */
function hridWithoutBuild(hrid: string): string {
  const m = ADL2_VERSION_RE.exec(hrid);
  return m ? `${m[1]}.v${m[2]}` : hrid;
}

/** The identity a binding's hash covers (see {@link TemplateHashIdentity}). */
export function templateHashIdentity(
  binding: Pick<
    TemplateBinding,
    "sourceFormat" | "templateId" | "version" | "hrid"
  >,
): TemplateHashIdentity {
  return binding.sourceFormat === "opt14-xml"
    ? { template_id: binding.templateId, sem_ver: binding.version ?? null }
    : { hrid: hridWithoutBuild(binding.hrid) };
}

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
 * The template content part of the hashed form: ehrtslib's canonical
 * JSON for the ADL2 operational template (`_type` on every object), with
 *
 * - identity and tool identifiers removed, since the binding records them
 *   separately: top-level `uid`, `build_uid`, `archetype_id`, `template_id`,
 *   `adl_version` (syntax version), and `description.other_details` keys
 *   `MD5-CAM-1.0.1`, `PARENT:MD5-CAM-1.0.1`, `build_uid`, `sem_ver`;
 * - the template's own HRID, where ehrtslib uses it to scope terms
 *   (`term_archetype_scope` values and `archetype_term_definitions` keys),
 *   replaced by `#template`. An ADL2 template scopes its own nodes to
 *   itself; this keeps the identity only in the `identity` member, so a
 *   release with the same content has the same content form;
 * - a fixed array order where order carries no meaning: `attributes` of each
 *   object node sorted by `rm_attribute_name` (then `differential_path`).
 *   Other arrays keep document order: sibling `children` order and code-list
 *   order are part of template content (display order).
 *
 * Object member order does not matter: RFC 8785 sorts members.
 */
export function templateContentForm(
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
  const self = opt.archetype_id?.value;
  if (self) replaceSelfScope(plain, new Set([self, hridWithoutBuild(self)]));
  sortAttributeArrays(plain);
  return plain;
}

/** Replaces the template's own HRID in term scopes and term-map keys (see templateContentForm). */
export const SELF_TERM_SCOPE = "#template";

function replaceSelfScope(value: unknown, self: Set<string>): void {
  if (Array.isArray(value)) {
    for (const v of value) replaceSelfScope(v, self);
    return;
  }
  if (!value || typeof value !== "object") return;
  const rec = value as Record<string, unknown>;
  if (
    typeof rec.term_archetype_scope === "string" &&
    self.has(rec.term_archetype_scope)
  ) {
    rec.term_archetype_scope = SELF_TERM_SCOPE;
  }
  for (const k of Object.keys(rec)) {
    // Term maps keyed by archetype id (`archetype_term_definitions`).
    if (self.has(k) && !(SELF_TERM_SCOPE in rec)) {
      rec[SELF_TERM_SCOPE] = rec[k];
      delete rec[k];
    }
  }
  for (const v of Object.values(rec)) replaceSelfScope(v, self);
}

/**
 * The JSON value the template hash is computed over:
 * `{ identity, content }`, where `identity` is the template identity
 * ({@link TemplateHashIdentity}) and `content` is
 * {@link templateContentForm}. There is no content-only hash.
 */
export function templateCanonicalForm(
  opt: openehr_am.OPERATIONAL_TEMPLATE,
  identity: TemplateHashIdentity,
): { identity: TemplateHashIdentity; content: unknown } {
  return { identity, content: templateContentForm(opt) };
}

/** RFC 8785 string of {@link templateCanonicalForm}. */
export function canonicalTemplateJson(
  opt: openehr_am.OPERATIONAL_TEMPLATE,
  identity: TemplateHashIdentity,
): string {
  return canonicalizeJson(templateCanonicalForm(opt, identity));
}

/** sha256 (hex) of {@link canonicalTemplateJson}. */
export function templateHash(
  opt: openehr_am.OPERATIONAL_TEMPLATE,
  identity: TemplateHashIdentity,
): Promise<string> {
  return sha256Hex(canonicalTemplateJson(opt, identity));
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
  const hashIdentity = templateHashIdentity({
    ...identity,
    sourceFormat: src.sourceFormat,
  });
  const serialisationVersion = templateBindingSerialisationVersion(
    src.adl2CodingSystem,
  );
  const binding: TemplateBinding = {
    ...identity,
    hash: {
      algorithm: "sha256",
      value: await templateHash(src.opt, hashIdentity),
      serialisationVersion,
    },
    sourceFormat: src.sourceFormat,
    adl2CodingSystem: src.adl2CodingSystem,
    sourceIdentifiers: sourceIdentifiersOf(src),
    ...(options.opt14Export ? { opt14Export: options.opt14Export } : {}),
  };
  return { binding, operationalTemplate: src.opt, warnings: src.warnings };
}

/**
 * Compare the binding a draft holds with a freshly computed one. A changed
 * hash or serialisation version is an error (the draft needs
 * `migrate-template`). The hash covers template id, version and content
 * together; the diagnosis issues `template-id-changed`, `version-changed`
 * and `content-changed` say which of them changed. From the bindings alone,
 * content is known only when id and version are unchanged (otherwise
 * `diagnosis.contentChanged` is `null`); {@link checkTemplateBinding} also
 * hashes the candidate's content under the bound identity to tell. Differences
 * in source identifiers are warnings only, and only when both sides have a
 * value.
 */
export function compareTemplateBindings(
  bound: TemplateBinding,
  candidate: TemplateBinding,
): TemplateBindingComparison {
  return compareWith(bound, candidate, undefined);
}

function compareWith(
  bound: TemplateBinding,
  candidate: TemplateBinding,
  /** From hashing the candidate content under the bound identity. */
  contentHint: boolean | undefined,
): TemplateBindingComparison {
  const issues: TemplateBindingIssue[] = [];
  const err = (
    code: TemplateBindingIssueCode,
    message: string,
    b?: string | null,
    c?: string | null,
  ) =>
    issues.push({ code, severity: "error", message, bound: b, candidate: c });
  const templateIdChanged = bound.templateId !== candidate.templateId;
  const versionChanged = (bound.version ?? null) !==
    (candidate.version ?? null);
  let contentChanged: boolean | null = null;
  if (bound.hash.serialisationVersion !== candidate.hash.serialisationVersion) {
    err(
      "serialisation-version-changed",
      "Hashes use different serialisation versions and cannot be compared",
      bound.hash.serialisationVersion,
      candidate.hash.serialisationVersion,
    );
  } else if (bound.hash.value === candidate.hash.value) {
    contentChanged = false;
  } else {
    err(
      "hash-changed",
      "Template hash (identity and content) differs",
      bound.hash.value,
      candidate.hash.value,
    );
    if (!templateIdChanged && !versionChanged) contentChanged = true;
    else if (contentHint !== undefined) contentChanged = contentHint;
  }
  if (templateIdChanged) {
    err(
      "template-id-changed",
      "Template id differs",
      bound.templateId,
      candidate.templateId,
    );
  }
  if (versionChanged) {
    err(
      "version-changed",
      "Template version differs",
      bound.version,
      candidate.version,
    );
  }
  if (contentChanged) {
    err("content-changed", "Template content differs");
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
    diagnosis: { templateIdChanged, versionChanged, contentChanged },
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
  const c = template.binding;
  let contentHint: boolean | undefined;
  if (
    bound.hash.serialisationVersion === c.hash.serialisationVersion &&
    bound.hash.value !== c.hash.value
  ) {
    // Same content under the bound identity gives the bound hash.
    contentHint = await templateHash(
      template.operationalTemplate,
      templateHashIdentity(bound),
    ) !== bound.hash.value;
  }
  return { ...compareWith(bound, c, contentHint), template };
}

/** Throw {@link TemplateBindingMismatchError} when the comparison needs a migration. */
export function assertTemplateBindingUnchanged(
  comparison: TemplateBindingComparison,
): void {
  if (comparison.migrationRequired) {
    throw new TemplateBindingMismatchError(comparison);
  }
}
