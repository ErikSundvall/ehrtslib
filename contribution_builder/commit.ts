/**
 * CB commit (ADR 0010): turn validated drafts into an ITS-REST
 * `NewContribution` body, with the operation-log link in the contribution
 * audit and provenance in each COMPOSITION's `feeder_audit`.
 *
 * {@link prepareContribution} builds the request without network access;
 * `rest_adapter.ts` sends it. Nothing reaches a server unless every check
 * here passes.
 */

import { EHRTSLIB_VERSION } from "../version.ts";
import {
  type Adl14DownconversionOptions,
  downConvertToAdl14,
} from "./adl14_downconvert.ts";
import {
  type ContributionBuild,
  toCanonicalRmJson,
} from "./contribution_build.ts";
import {
  type DraftValidationMode,
  type DraftValidationResult,
  type DraftValidator,
  lifecycleStateFor,
} from "./draft_validation.ts";
import {
  OPERATION_LOG_FORMAT,
  OPERATION_LOG_FORMAT_VERSION,
  type RmJson,
} from "./operation_log.ts";
import type { BoundTemplate } from "./template_binding.ts";

/** Name recorded in `feeder_system_audit.other_details`. */
export const BUILDER_NAME = "ehrtslib-contribution-builder";

/** openEHR `audit change type` codes. */
export const CHANGE_TYPE = {
  creation: { code: "249", value: "creation" },
  amendment: { code: "250", value: "amendment" },
  modification: { code: "251", value: "modification" },
  deleted: { code: "523", value: "deleted" },
} as const;
export type ChangeType = keyof typeof CHANGE_TYPE;

/** Deployment settings, set once per installation. */
export interface CommitConfig {
  /**
   * The deploying organisation's IT system id: `feeder_system_audit.system_id`
   * (RM: the system owned by the organisation legally responsible for the
   * data), and the placeholder `originating_system_audit.system_id`.
   */
  systemId: string;
  /** Set `UPDATE_AUDIT.system_id` on the contribution audit. Unset by default. */
  auditSystemId?: string;
  /** Builder name; default {@link BUILDER_NAME}. For other builder implementations. */
  builderName?: string;
  /** Builder version; default the ehrtslib release. */
  builderVersion?: string;
  /** CRDT library behind the log adapter; default none (single-app adapter). */
  crdtLibrary?: { name: string; version: string };
  /** Do not warn when the caller gives no `originatingSystemAudit`. */
  silenceMissingOriginatingAudit?: boolean;
  /** Codes the target CDR expects. Default `adl14` (OPT 1.4 CDRs). */
  codes?: "adl14" | "adl2";
}

export interface CommitDraftOptions {
  draftId: string;
  /** The template the draft is bound to. */
  template: BoundTemplate;
  /** Default `creation` for a new COMPOSITION. */
  changeType?: ChangeType;
  /** ADL 1.4 down-conversion settings (template id, exporter code map). */
  adl14?: Adl14DownconversionOptions;
}

export interface PrepareContributionOptions {
  /** Drafts to commit, in order. */
  drafts: CommitDraftOptions[];
  /** `PARTY_PROXY` of who commits. Required. */
  committer: unknown;
  /**
   * `creating_system_id` for the new OBJECT_VERSION_IDs: the CDR's system id
   * (the REST adapter reads it from the EHR).
   */
  creatingSystemId: string;
  /** `complete` (532, default) or `incomplete` (553). */
  mode?: DraftValidationMode;
  /**
   * `FEEDER_AUDIT_DETAILS` for what created the content (form, renderer),
   * from the caller. Missing: placeholder plus a warning.
   */
  originatingSystemAudit?: unknown;
  /** Where the exported log is stored; becomes the description's hyperlink. */
  logUri?: string;
  /** Extra text after the log hash in the contribution description. */
  description?: string;
}

export interface PreparedVersion {
  draftId: string;
  /** `<object uuid>::<creating system id>::1` */
  versionUid: string;
  lifecycleState: "532" | "553";
}

export interface PreparedContribution {
  /** ITS-REST `NewContribution` request body. */
  body: Record<string, RmJson>;
  versions: PreparedVersion[];
  /** sha256 of the exported log bytes (RFC 8785), as in the audit description. */
  logSha256: string;
  logBytes: Uint8Array;
  validation: DraftValidationResult[];
  warnings: string[];
}

export type CommitErrorCode =
  | "missing-committer"
  | "missing-composer"
  | "invalid-draft"
  | "bad-config"
  | "unsupported-draft";

export class CommitError extends Error {
  constructor(
    readonly code: CommitErrorCode,
    message: string,
    readonly validation?: DraftValidationResult,
  ) {
    super(message);
    this.name = "CommitError";
  }
}

type Obj = Record<string, RmJson>;
const isObj = (v: unknown): v is Obj =>
  !!v && typeof v === "object" && !Array.isArray(v);
const PARTY_PROXY_RE = /^PARTY_(IDENTIFIED|SELF|RELATED)$/;

/**
 * Check and assemble a contribution. Throws {@link CommitError} for a missing
 * committer or composer, or a draft that fails validation in `mode`.
 */
export async function prepareContribution(
  build: ContributionBuild,
  validator: DraftValidator,
  config: CommitConfig,
  options: PrepareContributionOptions,
): Promise<PreparedContribution> {
  if (!config.systemId) {
    throw new CommitError("bad-config", "CommitConfig.systemId is required");
  }
  if (!options.creatingSystemId) {
    throw new CommitError("bad-config", "creatingSystemId is required");
  }
  if (!options.drafts.length) {
    throw new CommitError("bad-config", "No drafts to commit");
  }
  const committer = plain(options.committer);
  if (
    !isObj(committer) || typeof committer._type !== "string" ||
    !PARTY_PROXY_RE.test(committer._type)
  ) {
    throw new CommitError(
      "missing-committer",
      "A committer (PARTY_PROXY) is required",
    );
  }
  const mode = options.mode ?? "complete";
  const warnings: string[] = [];
  const originating = options.originatingSystemAudit === undefined
    ? undefined
    : plain(options.originatingSystemAudit);
  if (
    options.originatingSystemAudit !== undefined &&
    (!isObj(originating) || typeof originating.system_id !== "string")
  ) {
    throw new CommitError(
      "bad-config",
      "originatingSystemAudit must be a FEEDER_AUDIT_DETAILS with system_id",
    );
  }
  if (!originating && !config.silenceMissingOriginatingAudit) {
    warnings.push(
      "No originatingSystemAudit given: FEEDER_AUDIT.originating_system_audit is a placeholder with the configured system id",
    );
  }

  // Composer first: a missing composer is a hard error in either mode.
  for (const d of options.drafts) {
    const root = build.toCanonicalJson(d.draftId) as Obj;
    if (!isObj(root.composer)) {
      throw new CommitError(
        "missing-composer",
        `Draft ${d.draftId} has no composer; call setComposer before commit`,
      );
    }
    if (build.getDraft(d.draftId).kind !== "create") {
      throw new CommitError(
        "unsupported-draft",
        `Draft ${d.draftId}: only new COMPOSITIONs can be committed in phase 1`,
      );
    }
  }

  const validation = options.drafts.map((d) =>
    validator.validate(build, d.draftId, d.template, { mode })
  );
  for (const r of validation) {
    if (!r.valid) {
      const first = r.errors[0];
      throw new CommitError(
        "invalid-draft",
        `Draft ${r.draftId} fails ${mode} validation (${r.errors.length} errors; first: ${first.path} ${first.message})`,
        r,
      );
    }
  }

  const { bytes: logBytes, sha256: logSha256 } = await build.exportLogBytes();
  const feederAudit = feederAuditFor(config, originating);
  const versions: PreparedVersion[] = [];
  const updateVersions: RmJson[] = [];
  const changeTypes = new Set<ChangeType>();
  for (const d of options.drafts) {
    const info = build.getDraft(d.draftId);
    const changeType = d.changeType ?? "creation";
    changeTypes.add(changeType);
    let data = build.toCanonicalJson(d.draftId) as Obj;
    if ((config.codes ?? "adl14") === "adl14") {
      const down = downConvertToAdl14(data, info.templateBinding, d.adl14);
      warnings.push(...down.warnings.map((w) => `${d.draftId}: ${w}`));
      data = down.data as Obj;
    }
    stripFunctions(data);
    addArchetypeDetails(data);
    const versionUid =
      `${info.provisionalObjectUuid}::${options.creatingSystemId}::1`;
    data.uid = { _type: "OBJECT_VERSION_ID", value: versionUid };
    data.feeder_audit = structuredClone(feederAudit);
    versions.push({
      draftId: d.draftId,
      versionUid,
      lifecycleState: mode === "complete" ? "532" : "553",
    });
    // UPDATE_VERSION is a REST ITS request object, not an RM type: no
    // `_type` (servers built on RM type registries reject an unknown one).
    updateVersions.push({
      lifecycle_state: lifecycleStateFor(mode),
      commit_audit: updateAudit(changeType, committer, config.auditSystemId),
      data: orderRoot(data),
    });
  }

  const contributionChange: ChangeType = changeTypes.size === 1
    ? [...changeTypes][0]
    : "modification";
  const audit = updateAudit(
    contributionChange,
    committer,
    config.auditSystemId,
  ) as Obj;
  const text = `oplog sha256:${logSha256}` +
    (options.description ? ` ${options.description}` : "");
  audit.description = options.logUri
    ? {
      _type: "DV_TEXT",
      value: text,
      hyperlink: { _type: "DV_URI", value: options.logUri },
    }
    : { _type: "DV_TEXT", value: text };

  return {
    body: { versions: updateVersions, audit },
    versions,
    logSha256,
    logBytes,
    validation,
    warnings,
  };
}

/** The `FEEDER_AUDIT` set on each committed COMPOSITION. */
export function feederAuditFor(
  config: CommitConfig,
  originatingSystemAudit?: RmJson,
): Obj {
  const crdt = config.crdtLibrary;
  const items: Array<[string, string]> = [
    ["builder name", config.builderName ?? BUILDER_NAME],
    ["builder version", config.builderVersion ?? EHRTSLIB_VERSION],
    ["log format", OPERATION_LOG_FORMAT],
    ["log format version", String(OPERATION_LOG_FORMAT_VERSION)],
    ["CRDT library", crdt ? `${crdt.name} ${crdt.version}` : "none"],
  ];
  const adl14 = (config.codes ?? "adl14") === "adl14";
  const code = (n: number) =>
    adl14 ? `at${String(n).padStart(4, "0")}` : `id${n + 1}`;
  return {
    _type: "FEEDER_AUDIT",
    originating_system_audit: originatingSystemAudit ??
      { _type: "FEEDER_AUDIT_DETAILS", system_id: config.systemId },
    feeder_system_audit: {
      _type: "FEEDER_AUDIT_DETAILS",
      system_id: config.systemId,
      other_details: {
        _type: "ITEM_TREE",
        archetype_node_id: code(0),
        name: { _type: "DV_TEXT", value: "contribution builder" },
        items: items.map(([name, value], i) => ({
          _type: "ELEMENT",
          archetype_node_id: code(i + 1),
          name: { _type: "DV_TEXT", value: name },
          value: { _type: "DV_TEXT", value },
        })),
      },
    },
  };
}

/** Read the builder name and version back from a committed COMPOSITION. */
export function builderProvenance(
  composition: unknown,
): Record<string, string> | undefined {
  const c = composition as {
    feeder_audit?: {
      feeder_system_audit?: {
        other_details?: {
          items?: Array<
            { name?: { value?: string }; value?: { value?: string } }
          >;
        };
      };
    };
  };
  const items = c?.feeder_audit?.feeder_system_audit?.other_details?.items;
  if (!Array.isArray(items)) return undefined;
  const out: Record<string, string> = {};
  for (const it of items) {
    if (it?.name?.value && typeof it.value?.value === "string") {
      out[it.name.value] = it.value.value;
    }
  }
  return out;
}

/**
 * Drop values of RM functions that templates constrain but the RM does not
 * store (`EVENT.offset` = time − origin). The REST ITS JSON schema has no
 * such member, and strict servers reject it.
 */
function stripFunctions(v: RmJson): void {
  if (Array.isArray(v)) return v.forEach(stripFunctions);
  if (!isObj(v)) return;
  if (v._type === "POINT_EVENT" || v._type === "INTERVAL_EVENT") {
    delete v.offset;
  }
  for (const x of Object.values(v)) stripFunctions(x);
}

const ARCHETYPE_ID_RE = /^[A-Za-z][\w-]*-[A-Za-z]+-[A-Za-z_]+\.[\w-]+\.v\d/;

/**
 * Inner archetype roots (an OBSERVATION inside the COMPOSITION) need
 * `archetype_details` (RM invariant `Is_archetype_root`). Fill any that are
 * missing from the node's archetype id and the root's `rm_version`.
 */
function addArchetypeDetails(root: Obj): void {
  const rootDetails = root.archetype_details;
  const rmVersion =
    isObj(rootDetails) && typeof rootDetails.rm_version === "string"
      ? rootDetails.rm_version
      : "1.0.4";
  const walk = (v: RmJson, isRoot: boolean) => {
    if (Array.isArray(v)) return v.forEach((x) => walk(x, false));
    if (!isObj(v)) return;
    const id = v.archetype_node_id;
    if (
      !isRoot && typeof id === "string" && ARCHETYPE_ID_RE.test(id) &&
      !isObj(v.archetype_details)
    ) {
      v.archetype_details = {
        _type: "ARCHETYPED",
        archetype_id: { _type: "ARCHETYPE_ID", value: id },
        rm_version: rmVersion,
      };
    }
    for (const [k, x] of Object.entries(v)) {
      if (k !== "archetype_details" && k !== "feeder_audit") walk(x, false);
    }
  };
  walk(root, true);
}

function updateAudit(
  changeType: ChangeType,
  committer: RmJson,
  systemId?: string,
): RmJson {
  const ct = CHANGE_TYPE[changeType];
  const audit: Obj = {
    change_type: {
      _type: "DV_CODED_TEXT",
      value: ct.value,
      defining_code: {
        _type: "CODE_PHRASE",
        terminology_id: { _type: "TERMINOLOGY_ID", value: "openehr" },
        code_string: ct.code,
      },
    },
    committer: structuredClone(committer),
  };
  if (systemId) audit.system_id = systemId;
  return audit;
}

/** `_type` and `uid` first, for readable requests (servers do not care). */
function orderRoot(data: Obj): Obj {
  const { _type, uid, ...rest } = data;
  return { _type, uid, ...rest };
}

function plain(v: unknown): RmJson {
  try {
    return toCanonicalRmJson(v);
  } catch {
    return null;
  }
}
