/**
 * Contribution builder core (ADRs 0002–0004, 0006; issue #164).
 *
 * `ContributionBuild` holds drafts as canonical RM JSON and changes them only
 * by appending operations to the log. Replaying a log gives the same drafts,
 * including node uids. The log goes through an {@link OperationLogAdapter}:
 * {@link SingleAppLogAdapter} is the one-replica adapter; a CRDT adapter for
 * multi-caller editing can implement the same interface later without changing
 * the operation format (ADR 0004 leaves the CRDT library to a spike).
 */

import { JsonCanonicalDeserializer } from "../serialization/json/json_canonical_deserializer.ts";
import { JsonCanonicalSerializer } from "../serialization/json/json_canonical_serializer.ts";
import { JsonConfigurableDeserializer } from "../serialization/json/json_configurable_deserializer.ts";
import { RMInstanceGenerator } from "../generation/rm_instance_generator.ts";
import type * as openehr_rm from "../openehr_rm.ts";
import { isSubtypeOf } from "../meta/mod.ts";
import { upConvertFromAdl14, usesAdl14Codes } from "./adl14_downconvert.ts";
import type { BoundTemplate, TemplateBinding } from "./template_binding.ts";
import { buildWebTemplate } from "../serialization/simplified/web_template_builder.ts";
import { deserializeFromFlat } from "../serialization/simplified/flat_deserializer.ts";
import { deserializeFromStructured } from "../serialization/simplified/structured_deserializer.ts";
import type { FlatPayload } from "../serialization/simplified/types.ts";
import {
  type AddInstanceOperation,
  type AssignUidOperation,
  type CbOperation,
  type CreateDraftOperation,
  type DiscardOperation,
  type EditTextOperation,
  type ImportOperation,
  type JoinBuildOperation,
  type MemberRole,
  type MigrateTemplateOperation,
  type MoveInstanceOperation,
  type OpenVersionOperation,
  OPERATION_LOG_FORMAT,
  OPERATION_LOG_FORMAT_VERSION,
  type OperationAuthor,
  operationLogBytes,
  type OperationLogDocument,
  operationRef,
  readOperationLog,
  type RecordCommitOperation,
  type RemoveInstanceOperation,
  REPLICA_RE,
  type ResolveOperation,
  type RmJson,
  ROOT_TARGET,
  type SetComposerOperation,
  type SetLifecycleOperation,
  type SetParticipationOperation,
  type SetRoleOperation,
  type SetValueOperation,
  SHORT_KEY_RE,
  sortOperations,
} from "./operation_log.ts";
import { type ConflictResolution, detectConflicts } from "./conflicts.ts";
import { canonicalizeJson } from "./jcs.ts";
import {
  fieldChangedSince,
  isTextEdit,
  spliceCodePoints,
  textFieldOf,
  textGroupKey,
} from "./text_sync.ts";

/** Caller context: who is editing, on which replica, and the clock / uuid source. */
export interface BuildContext {
  author: OperationAuthor;
  /** Replica prefix for minted keys. Single-caller default: `a`. */
  replica?: string;
  /** ISO 8601 timestamp source. Default: `new Date().toISOString()`. */
  now?: () => string;
  /** UUID source. Default: `crypto.randomUUID()`. */
  uuid?: () => string;
}

/**
 * Per-call override. `rev` is the log position the caller last saw
 * (`replica:seq`, or `"0"`). It applies to `set-value` and `edit-text`.
 */
export interface OperationOptions {
  author?: OperationAuthor;
  rev?: string;
}

/**
 * Where operations go. The core appends local operations and replays
 * {@link operations} in order. A CRDT adapter merges remote operations
 * into that order; the operation format stays the same.
 */
export interface OperationLogAdapter {
  append(op: CbOperation): void;
  operations(): readonly CbOperation[];
  /** Replace the log (text compaction before the commit hash). */
  replaceAll?(ops: readonly CbOperation[]): void;
  /**
   * When true, `set-value` and `edit-text` must carry `rev`. Multi-caller
   * adapters set this; the single-caller adapter does not (#243).
   */
  requireRev?: boolean;
}

/** One replica, operations in local order. */
export class SingleAppLogAdapter implements OperationLogAdapter {
  private readonly ops: CbOperation[] = [];
  constructor(initial: readonly CbOperation[] = []) {
    this.ops.push(...initial);
  }
  append(op: CbOperation): void {
    this.ops.push(op);
  }
  operations(): readonly CbOperation[] {
    return this.ops;
  }
  replaceAll(ops: readonly CbOperation[]): void {
    this.ops.splice(0, this.ops.length, ...ops);
  }
}

export type CbOperationErrorCode =
  | "apply"
  | "changed-by-someone-else"
  | "rev-required"
  | "already-committed"
  | "discarded"
  | "not-a-member"
  | "viewer"
  | "role";

/** An operation that cannot be applied. Nothing is appended to the log. */
export class CbOperationError extends Error {
  readonly operation?: Partial<CbOperation>;
  readonly code: CbOperationErrorCode;
  /** Current field value when `code` is `changed-by-someone-else`. */
  readonly currentValue?: RmJson;
  constructor(
    message: string,
    operation?: Partial<CbOperation>,
    code: CbOperationErrorCode = "apply",
    currentValue?: RmJson,
  ) {
    super(message);
    this.name = "CbOperationError";
    this.operation = operation;
    this.code = code;
    if (currentValue !== undefined) this.currentValue = currentValue;
  }
}

/** Read-only view of a draft. */
export interface VersionDraftInfo {
  draftId: string;
  /** `create`: new versioned object (new build or copy-version); `modify`: update-version. */
  kind: "create" | "modify";
  rmType: "COMPOSITION";
  templateBinding: TemplateBinding;
  /**
   * Uuid that inner node uids start with: provisional for `create`, the
   * versioned object's uuid for `modify`.
   */
  provisionalObjectUuid: string;
  /** `modify`: the version the draft started from (`preceding_version_uid`). */
  baseVersionUid?: string;
  /** copy-version: the version the content was copied from. */
  copiedFrom?: string;
  /** Set once the draft is committed (`record-commit`). */
  committed?: {
    versionUid: string;
    contributionUid?: string;
    changeType: string;
    lifecycleState: string;
    logSha256: string;
    /**
     * Object uuid the server stored, when it differs from the provisional
     * one. Inner uids keep the provisional prefix (#176).
     */
    storedObjectUuid?: string;
  };
  /** `set-lifecycle`. Absent until the caller chooses. */
  lifecycle?: "complete" | "incomplete";
  /** `discard` of the whole draft. */
  discarded?: boolean;
}

/** A build member (ADR 0013). `committer` may also edit. */
export interface BuildMember {
  id: string;
  name?: string;
  role: MemberRole;
  replica: string;
}

/**
 * Optional per-operation check. Implemented by `trackValidation` (#173).
 * The core does not import the validator, so a build without a tracker
 * behaves as before.
 */
export interface ValidationTracker {
  note(build: ContributionBuild, op: CbOperation): void;
  state(build: ContributionBuild, draftId: string): unknown;
}

/** One operation skipped while replaying a merged multi-caller log (ADR 0013). */
export interface ConcurrentSkip {
  kind: "concurrent-replay";
  operation: CbOperation;
  reason:
    | "target-removed"
    | "parent-removed"
    | "anchor-missing-appended"
    | "already-committed"
    | "changed-by-someone-else"
    | "changed-by-peer";
  match: "none" | "uid";
  message: string;
}

/** Options for {@link ContributionBuild.openVersion} and {@link ContributionBuild.copyVersion}. */
export interface LoadVersionOptions {
  /**
   * Codes in the stored data. Default: detected (zero-padded at-code node ids
   * mean ADL 1.4, which is converted to ADL2 codes).
   */
  codes?: "adl14" | "adl2";
  draftId?: string;
  /** update-version: base version uid when the data has no `uid`. */
  versionUid?: string;
  /** copy-version: provisional uuid for the new versioned object. */
  provisionalObjectUuid?: string;
}

export interface NewCompositionOptions {
  /** ISO 639-1 code for `COMPOSITION.language`. Default: the template's original language. */
  language?: string;
  /** ISO 3166-1 code for `COMPOSITION.territory`. Default: the generator default. */
  territory?: string;
  /** Provisional versioned-object uuid; default from the context's uuid source. */
  provisionalObjectUuid?: string;
  /** Draft id; default from the context's uuid source. */
  draftId?: string;
}

interface NodeEntry {
  node: Record<string, RmJson>;
  parent?: Record<string, RmJson>;
}

interface DraftState extends VersionDraftInfo {
  root: Record<string, RmJson>;
  /** `modify`: the base version with keys assigned (for conflict data). */
  base?: Record<string, RmJson>;
  /** short key or full uid → node */
  nodes: Map<string, NodeEntry>;
}

type JsonObject = Record<string, RmJson>;

function isObject(v: unknown): v is JsonObject {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

/** LOCATABLE in canonical JSON: has `archetype_node_id`. */
/**
 * A LOCATABLE node. `archetype_node_id` alone is not enough: generators and
 * other tools sometimes put one on PATHABLE-only types such as EVENT_CONTEXT.
 */
function isLocatable(v: unknown): v is JsonObject {
  if (!isObject(v) || typeof v.archetype_node_id !== "string") return false;
  return typeof v._type !== "string" || v._type === "LOCATABLE" ||
    isSubtypeOf(v._type, "LOCATABLE");
}

function clone<T extends RmJson>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

const canonicalSerializer = new JsonCanonicalSerializer();
const lenientDeserializer = new JsonConfigurableDeserializer({
  allowIncomplete: true,
});

/**
 * Bring a caller value to canonical RM JSON (`_type` everywhere). Accepts RM
 * class instances, JSON with a top-level `_type`, or primitives.
 */
export function toCanonicalRmJson(value: unknown): RmJson {
  if (value === undefined || value === null) return null;
  if (typeof value !== "object") return value as RmJson;
  if (Array.isArray(value)) return value.map(toCanonicalRmJson);
  const proto = Object.getPrototypeOf(value);
  const plain = proto === Object.prototype || proto === null;
  if (!plain) {
    return JSON.parse(
      canonicalSerializer.serialize(value, { prettyPrint: false }),
    ) as RmJson;
  }
  const rec = value as Record<string, unknown>;
  if (typeof rec._type !== "string") {
    throw new CbOperationError(
      "Object values need a _type (canonical RM JSON)",
    );
  }
  const rm = lenientDeserializer.deserialize(JSON.stringify(rec));
  return JSON.parse(
    canonicalSerializer.serialize(rm, { prettyPrint: false }),
  ) as RmJson;
}

/**
 * Member order for traversals that hand out keys. Sorted (UTF-16, as RFC 8785)
 * so the order does not depend on how the JSON was serialised or parsed.
 */
function memberOrder(v: JsonObject): string[] {
  return Object.keys(v).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

/** LOCATABLE nodes without a uid, depth-first in {@link memberOrder}, excluding `skipRoot` itself. */
function locatablesNeedingKeys(tree: RmJson, skipRoot: boolean): JsonObject[] {
  const out: JsonObject[] = [];
  const walk = (v: RmJson, isRoot: boolean) => {
    if (Array.isArray(v)) {
      for (const x of v) walk(x, false);
      return;
    }
    if (!isObject(v)) return;
    if (isLocatable(v) && !(isRoot && skipRoot) && !isObject(v.uid)) {
      out.push(v);
    }
    for (const k of memberOrder(v)) {
      if (k === "uid") continue;
      walk(v[k], false);
    }
  };
  walk(tree, true);
  return out;
}

function uidValue(node: JsonObject): string | undefined {
  const uid = node.uid;
  return isObject(uid) && typeof uid.value === "string" ? uid.value : undefined;
}

function keyOfUid(uid: string): string | undefined {
  const i = uid.indexOf("::");
  return i < 0 ? undefined : uid.slice(i + 2);
}

/**
 * A contribution build: drafts plus the shared operation log. All changes go
 * through operations; {@link fromLog} replays an exported log.
 */
export class ContributionBuild {
  readonly buildId: string;
  private readonly adapter: OperationLogAdapter;
  private readonly context: Required<Omit<BuildContext, "author">> & {
    author: OperationAuthor;
  };
  private readonly drafts = new Map<string, DraftState>();
  private readonly members = new Map<string, BuildMember>();
  /** Operations applied to the current state, in replay order. */
  private applied: CbOperation[] = [];
  private seq = 0;
  private keyCounter = 0;
  private requireRev: boolean;
  /**
   * Concurrent replay (ADR 0013): a failed operation is skipped, not thrown.
   * The single-caller path leaves this false.
   */
  private lenient = false;
  private skipped: ConcurrentSkip[] = [];
  private validation?: ValidationTracker;

  private constructor(
    buildId: string,
    context: BuildContext,
    adapter: OperationLogAdapter,
  ) {
    const replica = context.replica ?? "a";
    if (!REPLICA_RE.test(replica)) {
      throw new CbOperationError(`Invalid replica prefix ${replica}`);
    }
    if (!context.author?.id) {
      throw new CbOperationError("BuildContext.author.id is required");
    }
    this.buildId = buildId;
    this.adapter = adapter;
    this.requireRev = adapter.requireRev === true;
    this.context = {
      author: context.author,
      replica,
      now: context.now ?? (() => new Date().toISOString()),
      uuid: context.uuid ?? (() => crypto.randomUUID()),
    };
  }

  /**
   * Start a build. `buildId` continues an existing build (a fork of its log).
   * `lenient` replays with the concurrent apply policy (ADR 0013).
   */
  static create(
    context: BuildContext,
    adapter: OperationLogAdapter = new SingleAppLogAdapter(),
    options: { buildId?: string; lenient?: boolean } = {},
  ): ContributionBuild {
    const uuid = context.uuid ?? (() => crypto.randomUUID());
    const build = new ContributionBuild(
      options.buildId ?? uuid(),
      context,
      adapter,
    );
    if (options.lenient) build.lenient = true;
    if (adapter.operations().length) build.replayAll(adapter.operations());
    return build;
  }

  /**
   * Rebuild from an exported log. `context` is who continues editing; new
   * operations continue the replica's sequence and key counters.
   */
  static fromLog(
    log: OperationLogDocument | string,
    context: BuildContext,
  ): ContributionBuild {
    const doc = readOperationLog(log);
    const adapter = new SingleAppLogAdapter(
      clone(doc.operations as unknown as RmJson) as unknown as CbOperation[],
    );
    const build = new ContributionBuild(doc.buildId, context, adapter);
    build.replayAll(adapter.operations());
    return build;
  }

  // ---------------------------------------------------------------- queries

  listDrafts(): VersionDraftInfo[] {
    return [...this.drafts.values()].map((d) => this.info(d));
  }

  getDraft(draftId: string): VersionDraftInfo {
    return this.info(this.state(draftId));
  }

  /** Canonical RM JSON of the draft (a copy). */
  toCanonicalJson(draftId: string): RmJson {
    return clone(this.state(draftId).root);
  }

  /** The draft as an ehrtslib RM `COMPOSITION`. */
  toComposition(draftId: string): openehr_rm.COMPOSITION {
    const json = JSON.stringify(this.state(draftId).root);
    return new JsonCanonicalDeserializer().deserialize(
      json,
    ) as openehr_rm.COMPOSITION;
  }

  /** Full uid of a node: `<provisional object uuid>::<short key>`. */
  nodeUid(draftId: string, key: string): string {
    const d = this.state(draftId);
    const entry = d.nodes.get(key);
    if (!entry) {
      throw new CbOperationError(`No node ${key} in draft ${draftId}`);
    }
    return uidValue(entry.node) ?? key;
  }

  /** Short keys of the draft's LOCATABLE nodes, depth-first with members in sorted order. */
  listNodeKeys(draftId: string): string[] {
    const d = this.state(draftId);
    const keys: string[] = [];
    const walk = (v: RmJson) => {
      if (Array.isArray(v)) return v.forEach(walk);
      if (!isObject(v)) return;
      if (v !== d.root && isLocatable(v)) {
        const uid = uidValue(v);
        if (uid) keys.push(keyOfUid(uid) ?? uid);
      }
      for (const k of memberOrder(v)) if (k !== "uid") walk(v[k]);
    };
    walk(d.root);
    return keys;
  }

  /** Find the first node with `archetype_node_id` (in {@link listNodeKeys} order); returns its short key. */
  findNodeKey(draftId: string, archetypeNodeId: string): string | undefined {
    const d = this.state(draftId);
    for (const key of this.listNodeKeys(draftId)) {
      if (d.nodes.get(key)?.node.archetype_node_id === archetypeNodeId) {
        return key;
      }
    }
    return undefined;
  }

  // ---------------------------------------------------------------- log

  /** The log as a plain JSON document (a copy). */
  exportLog(): OperationLogDocument {
    return {
      format: OPERATION_LOG_FORMAT,
      formatVersion: OPERATION_LOG_FORMAT_VERSION,
      buildId: this.buildId,
      operations: clone(
        this.adapter.operations() as unknown as RmJson,
      ) as unknown as CbOperation[],
    };
  }

  /** Canonical log bytes (RFC 8785) and their sha256. */
  exportLogBytes(): Promise<{ bytes: Uint8Array; sha256: string }> {
    return operationLogBytes(this.exportLog());
  }

  // ---------------------------------------------------------------- operations

  /**
   * Start a new COMPOSITION draft from a bound template (#163). The skeleton
   * is ehrtslib's minimal instance for the template, without a composer
   * (ADR 0006: the composer is set explicitly with {@link setComposer}).
   */
  newComposition(
    template: BoundTemplate,
    options: NewCompositionOptions = {},
    opOptions: OperationOptions = {},
  ): string {
    const opt = template.operationalTemplate;
    if (opt.definition?.rm_type_name !== "COMPOSITION") {
      throw new CbOperationError(
        `Template root is ${opt.definition?.rm_type_name}, not COMPOSITION`,
      );
    }
    const generated = new RMInstanceGenerator({ mode: "minimal" }).generate(
      opt,
    );
    const skeleton = toCanonicalRmJson(generated) as JsonObject;
    delete skeleton.composer;
    delete skeleton.uid;
    if (options.language) {
      skeleton.language = codePhrase("ISO_639-1", options.language);
    }
    if (options.territory) {
      skeleton.territory = codePhrase("ISO_3166-1", options.territory);
    }
    const rootArchetype = typeof skeleton.archetype_node_id === "string"
      ? skeleton.archetype_node_id
      : "";
    skeleton.archetype_details = {
      _type: "ARCHETYPED",
      archetype_id: { _type: "ARCHETYPE_ID", value: rootArchetype },
      template_id: { _type: "TEMPLATE_ID", value: template.binding.templateId },
      rm_version: opt.rm_release ?? "1.1.0",
    };
    const draftId = options.draftId ?? this.context.uuid();
    if (this.drafts.has(draftId)) {
      throw new CbOperationError(`Draft ${draftId} exists`);
    }
    const keys = locatablesNeedingKeys(skeleton, true).map(() =>
      this.mintKey()
    );
    return this.commitOp<CreateDraftOperation>({
      type: "create-draft",
      draft: draftId,
      rmType: "COMPOSITION",
      kind: "create",
      template: clone(
        template.binding as unknown as RmJson,
      ) as unknown as TemplateBinding,
      provisionalObjectUuid: options.provisionalObjectUuid ??
        this.context.uuid(),
      initial: skeleton,
      keys,
    }, opOptions).draft;
  }

  /**
   * update-version: start a draft for the next version of a stored
   * COMPOSITION (as read from the CDR). Existing inner uids are kept, so
   * operations address the same nodes as before; LOCATABLE nodes without a
   * uid get short keys, recorded in the operation (ADR 0003). Inner uids
   * whose uuid part differs from the versioned object's (a server that
   * assigned its own uuid, #176) are kept as they are.
   */
  openVersion(
    template: BoundTemplate,
    stored: unknown,
    options: LoadVersionOptions = {},
    opOptions: OperationOptions = {},
  ): string {
    const data = this.loadStored(template, stored, options);
    const rootUid = uidValue(data);
    const baseVersionUid = options.versionUid ?? rootUid;
    if (!baseVersionUid || baseVersionUid.split("::").length < 3) {
      throw new CbOperationError(
        "update-version needs the stored version uid (OBJECT_VERSION_ID)",
      );
    }
    delete data.uid;
    const versionedObjectUuid = baseVersionUid.split("::")[0];
    const draftId = options.draftId ?? this.context.uuid();
    if (this.drafts.has(draftId)) {
      throw new CbOperationError(`Draft ${draftId} exists`);
    }
    this.bumpKeyCounter(data);
    const keys = locatablesNeedingKeys(data, true).map(() => this.mintKey());
    return this.commitOp<OpenVersionOperation>({
      type: "open-version",
      draft: draftId,
      rmType: "COMPOSITION",
      kind: "modify",
      template: clone(
        template.binding as unknown as RmJson,
      ) as unknown as TemplateBinding,
      versionedObjectUuid,
      baseVersionUid,
      initial: data,
      keys,
    }, opOptions).draft;
  }

  /**
   * copy-version: start a new versioned object from a stored COMPOSITION's
   * content. All uids are dropped and every LOCATABLE gets a fresh key.
   */
  copyVersion(
    template: BoundTemplate,
    stored: unknown,
    options: LoadVersionOptions = {},
    opOptions: OperationOptions = {},
  ): string {
    const data = this.loadStored(template, stored, options);
    const from = options.versionUid ?? uidValue(data);
    stripUids(data);
    const draftId = options.draftId ?? this.context.uuid();
    if (this.drafts.has(draftId)) {
      throw new CbOperationError(`Draft ${draftId} exists`);
    }
    const keys = locatablesNeedingKeys(data, true).map(() => this.mintKey());
    const op: Omit<
      CreateDraftOperation,
      "replica" | "seq" | "author" | "timestamp"
    > = {
      type: "create-draft",
      draft: draftId,
      rmType: "COMPOSITION",
      kind: "create",
      template: clone(
        template.binding as unknown as RmJson,
      ) as unknown as TemplateBinding,
      provisionalObjectUuid: options.provisionalObjectUuid ??
        this.context.uuid(),
      initial: data,
      keys,
    };
    if (from) op.copiedFrom = from;
    return this.commitOp(op, opOptions).draft;
  }

  /**
   * Record that a draft was committed (the REST adapter calls this after the
   * server accepted it). Afterwards the draft takes no further operations.
   */
  recordCommit(
    draftId: string,
    result: {
      versionUid: string;
      contributionUid?: string;
      changeType: string;
      lifecycleState: string;
      logSha256: string;
      /** Set when the server assigned a different versioned-object uuid (#176). */
      storedObjectUuid?: string;
    },
    opOptions: OperationOptions = {},
  ): void {
    const body: Omit<
      RecordCommitOperation,
      "replica" | "seq" | "author" | "timestamp"
    > = {
      type: "record-commit",
      draft: draftId,
      versionUid: result.versionUid,
      changeType: result.changeType,
      lifecycleState: result.lifecycleState,
      logSha256: result.logSha256,
    };
    if (result.contributionUid) body.contributionUid = result.contributionUid;
    if (result.storedObjectUuid) {
      body.storedObjectUuid = result.storedObjectUuid;
    }
    this.commitOp(body, opOptions);
  }

  /**
   * Replay this modify draft onto `latestStored` (ADR 0009, #177).
   * Clean operations are applied again. Each conflict needs a resolution,
   * recorded as a `resolve` operation. The returned draft's base version is
   * the latest one, so the next commit sends that `preceding_version_uid`.
   * The previous draft stays in the log.
   */
  rebase(
    template: BoundTemplate,
    draftId: string,
    latestStored: unknown,
    resolutions: readonly ConflictResolution[],
    options: { draftId?: string } = {},
  ): string {
    const info = this.getDraft(draftId);
    if (info.kind !== "modify") {
      throw new CbOperationError(
        `Draft ${draftId} is not an update-version draft`,
      );
    }
    const report = detectConflicts(this, draftId, latestStored);
    if (!report) {
      throw new CbOperationError(
        `Draft ${draftId} is still based on the latest version`,
      );
    }
    const byRef = new Map(resolutions.map((r) => [r.conflict, r]));
    for (const conflict of report.conflicts) {
      const ref = operationRef(conflict.operation);
      if (!byRef.has(ref)) {
        throw new CbOperationError(`No resolution for ${ref}`);
      }
    }
    const next = this.openVersion(template, latestStored, {
      draftId: options.draftId,
    });
    const conflictRefs = new Set(
      report.conflicts.map((c) => operationRef(c.operation)),
    );
    const cleanRefs = new Set(
      report.clean.map((c) => operationRef(c.operation)),
    );
    for (const op of [...this.applied]) {
      if (op.draft !== draftId) continue;
      if (op.type === "open-version" || op.type === "record-commit") continue;
      const ref = operationRef(op);
      if (conflictRefs.has(ref)) {
        this.applyResolution(next, draftId, op, byRef.get(ref)!);
      } else if (cleanRefs.has(ref)) {
        this.reapply(next, draftId, op);
      }
    }
    return next;
  }

  /** update-version: the base version as loaded (ADL2 codes, keys assigned), a copy. */
  baseData(draftId: string): RmJson | undefined {
    const b = this.state(draftId).base;
    return b ? clone(b) : undefined;
  }

  /**
   * Set a value under a node. `path` is relative to the node (`value`,
   * `value/magnitude`, `name`). `value: null` clears it. LOCATABLE content
   * goes through {@link addInstance}; the composer through {@link setComposer}.
   */
  setValue(
    draftId: string,
    target: string,
    path: string,
    value: unknown,
    opOptions: OperationOptions = {},
  ): void {
    const body: Omit<
      SetValueOperation,
      "replica" | "seq" | "author" | "timestamp"
    > = {
      type: "set-value",
      draft: draftId,
      target: this.resolveTarget(draftId, target),
      path,
      value: toCanonicalRmJson(value),
    };
    if (opOptions.rev !== undefined) body.rev = opOptions.rev;
    this.commitOp<SetValueOperation>(body, opOptions);
  }

  /**
   * Splice a string by Unicode code point (ADR 0013 text sync level 2).
   * `path` is the string under the node, usually `value`.
   */
  editText(
    draftId: string,
    target: string,
    path: string,
    splice: { at: number; delete: number; insert: string },
    opOptions: OperationOptions = {},
  ): void {
    const body: Omit<
      EditTextOperation,
      "replica" | "seq" | "author" | "timestamp"
    > = {
      type: "edit-text",
      draft: draftId,
      target: this.resolveTarget(draftId, target),
      path,
      at: splice.at,
      delete: splice.delete,
      insert: splice.insert,
    };
    if (opOptions.rev !== undefined) body.rev = opOptions.rev;
    this.commitOp(body, opOptions);
  }

  /** Move a node under `parent.attribute`, optionally anchored on a sibling. */
  moveInstance(
    draftId: string,
    target: string,
    parent: string,
    attribute: string,
    options: { before?: string; after?: string } & OperationOptions = {},
  ): void {
    if (options.before !== undefined && options.after !== undefined) {
      throw new CbOperationError(
        "move-instance takes before or after, not both",
      );
    }
    const body: Omit<
      MoveInstanceOperation,
      "replica" | "seq" | "author" | "timestamp"
    > = {
      type: "move-instance",
      draft: draftId,
      target: this.resolveTarget(draftId, target),
      parent: this.resolveTarget(draftId, parent),
      attribute,
    };
    if (options.before !== undefined) {
      body.before = this.resolveTarget(draftId, options.before);
    }
    if (options.after !== undefined) {
      body.after = this.resolveTarget(draftId, options.after);
    }
    this.commitOp(body, options);
  }

  /**
   * Mint a short key for the LOCATABLE at `path` that has no uid.
   * `path` is an instance path from the draft root (`/content[0]`).
   */
  assignUid(
    draftId: string,
    path: string,
    opOptions: OperationOptions = {},
  ): string {
    const key = this.mintKey();
    this.commitOp<AssignUidOperation>({
      type: "assign-uid",
      draft: draftId,
      path,
      key,
    }, opOptions);
    return key;
  }

  /** Record one participation (ADR 0006). Replaces the same performer and function. */
  setParticipation(
    draftId: string,
    target: string,
    participation: unknown,
    options: {
      list?: "other_participations" | "participations";
    } & OperationOptions = {},
  ): void {
    const json = toCanonicalRmJson(participation);
    if (!isObject(json) || json._type !== "PARTICIPATION") {
      throw new CbOperationError("set-participation needs a PARTICIPATION");
    }
    const list = options.list ??
      (target === ROOT_TARGET ? "participations" : "other_participations");
    this.commitOp<SetParticipationOperation>({
      type: "set-participation",
      draft: draftId,
      target: this.resolveTarget(draftId, target),
      list,
      participation: json,
    }, options);
  }

  /** Choose complete (532) or incomplete (553) for this draft. */
  setLifecycle(
    draftId: string,
    mode: "complete" | "incomplete",
    opOptions: OperationOptions = {},
  ): void {
    this.commitOp<SetLifecycleOperation>({
      type: "set-lifecycle",
      draft: draftId,
      mode,
    }, opOptions);
  }

  /** Rebind the draft to another template. Data is not rewritten. */
  migrateTemplate(
    draftId: string,
    template: BoundTemplate,
    opOptions: OperationOptions = {},
  ): void {
    this.commitOp<MigrateTemplateOperation>({
      type: "migrate-template",
      draft: draftId,
      template: clone(
        template.binding as unknown as RmJson,
      ) as unknown as TemplateBinding,
    }, opOptions);
  }

  /**
   * Replace the draft content from canonical JSON, FLAT or STRUCTURED.
   * FLAT and STRUCTURED need `template` (the draft's bound template).
   * Replay stores the canonical document, not the source text.
   */
  importDocument(
    draftId: string,
    document: unknown,
    options: {
      format: "canonical" | "flat" | "structured";
      template?: BoundTemplate;
      lang?: string;
      /** Leave locatables that have no uid for a later `assign-uid`. */
      deferUids?: boolean;
    } & OperationOptions,
  ): void {
    const canonical = this.importedCanonical(document, options);
    const keys = options.deferUids
      ? []
      : locatablesNeedingKeys(canonical, true).map(() => this.mintKey());
    const body: Omit<
      ImportOperation,
      "replica" | "seq" | "author" | "timestamp"
    > = {
      type: "import",
      draft: draftId,
      format: options.format,
      document: canonical,
      keys,
    };
    if (options.deferUids) body.deferUids = true;
    this.commitOp(body, options);
  }

  /** Discard the whole draft, or one node. The log is kept. */
  discard(
    draftId: string,
    target?: string,
    opOptions: OperationOptions = {},
  ): void {
    const body: Omit<
      DiscardOperation,
      "replica" | "seq" | "author" | "timestamp"
    > = { type: "discard", draft: draftId };
    if (target !== undefined) body.target = this.resolveTarget(draftId, target);
    this.commitOp(body, opOptions);
  }

  /** Current members, in join order. */
  memberList(): BuildMember[] {
    return [...this.members.values()].map((m) => ({ ...m }));
  }

  /**
   * Add a member and assign their replica prefix. The first join bootstraps
   * the build; later joins require a `committer`.
   */
  joinBuild(
    memberId: string,
    role: MemberRole,
    memberReplica: string,
    options: { name?: string } & OperationOptions = {},
  ): void {
    const body: Omit<
      JoinBuildOperation,
      "replica" | "seq" | "author" | "timestamp"
    > = {
      type: "join-build",
      draft: "*",
      memberId,
      role,
      memberReplica,
    };
    if (options.name) body.memberName = options.name;
    this.commitOp(body, options);
  }

  leaveBuild(memberId: string, opOptions: OperationOptions = {}): void {
    this.commitOp<LeaveBuildOperation>({
      type: "leave-build",
      draft: "*",
      memberId,
    }, opOptions);
  }

  setRole(
    memberId: string,
    role: MemberRole,
    opOptions: OperationOptions = {},
  ): void {
    this.commitOp<SetRoleOperation>({
      type: "set-role",
      draft: "*",
      memberId,
      role,
    }, opOptions);
  }

  /**
   * Log position the caller can send back as `rev`: `replica:seq` of the
   * last applied operation, or `"0"` when the log is empty.
   */
  logRev(): string {
    const last = this.applied[this.applied.length - 1];
    return last ? operationRef(last) : "0";
  }

  /** Require `rev` on text writes. The multi-caller adapter turns this on. */
  setRequireTextRev(require: boolean): void {
    this.requireRev = require;
  }

  /** Operations skipped by the last concurrent replay. Empty for a single caller. */
  concurrentSkips(): readonly ConcurrentSkip[] {
    return this.skipped;
  }

  /**
   * Quick checks and the build summary (ADR 0008). The tracker is not part of
   * the log. `note` runs after each successful operation.
   */
  trackValidation(tracker: ValidationTracker): void {
    this.validation = tracker;
  }

  /** Latest summary for `draftId`, or undefined when nothing is tracking. */
  validationState<T = unknown>(draftId: string): T | undefined {
    return this.validation?.state(this, draftId) as T | undefined;
  }

  /** Add a LOCATABLE subtree under `parent.attribute`. Returns the new node's short key. */
  addInstance(
    draftId: string,
    parent: string,
    attribute: string,
    instance: unknown,
    options: { before?: string; after?: string } & OperationOptions = {},
  ): string {
    const json = toCanonicalRmJson(instance);
    if (!isLocatable(json)) {
      throw new CbOperationError(
        "add-instance needs a LOCATABLE (archetype_node_id)",
      );
    }
    const keys = locatablesNeedingKeys(json, false).map(() => this.mintKey());
    const op: Omit<
      AddInstanceOperation,
      "replica" | "seq" | "author" | "timestamp"
    > = {
      type: "add-instance",
      draft: draftId,
      parent: this.resolveTarget(draftId, parent),
      attribute,
      instance: json,
      keys,
    };
    if (options.before !== undefined && options.after !== undefined) {
      throw new CbOperationError(
        "add-instance takes before or after, not both",
      );
    }
    if (options.before !== undefined) {
      op.before = this.resolveTarget(draftId, options.before);
    }
    if (options.after !== undefined) {
      op.after = this.resolveTarget(draftId, options.after);
    }
    this.commitOp(op, options);
    const own = uidValue(json);
    return own ? (keyOfUid(own) ?? own) : keys[0];
  }

  /** Remove a LOCATABLE node and its subtree. */
  removeInstance(
    draftId: string,
    target: string,
    opOptions: OperationOptions = {},
  ): void {
    this.commitOp<RemoveInstanceOperation>({
      type: "remove-instance",
      draft: draftId,
      target: this.resolveTarget(draftId, target),
    }, opOptions);
  }

  /** Set `COMPOSITION.composer` (a `PARTY_PROXY`), ADR 0006. */
  setComposer(
    draftId: string,
    composer: unknown,
    opOptions: OperationOptions = {},
  ): void {
    const json = toCanonicalRmJson(composer);
    if (
      !isObject(json) || typeof json._type !== "string" ||
      !/^PARTY_(IDENTIFIED|SELF|RELATED)$/.test(json._type)
    ) {
      throw new CbOperationError(
        "Composer must be a PARTY_PROXY (PARTY_IDENTIFIED, PARTY_SELF, PARTY_RELATED)",
      );
    }
    this.commitOp<SetComposerOperation>({
      type: "set-composer",
      draft: draftId,
      composer: json,
    }, opOptions);
  }

  // ---------------------------------------------------------------- internals

  /** Canonical, ADL2-coded copy of a stored COMPOSITION, checked against the template. */
  private loadStored(
    template: BoundTemplate,
    stored: unknown,
    options: LoadVersionOptions,
  ): JsonObject {
    let data = toCanonicalRmJson(stored) as JsonObject;
    if (!isObject(data) || data._type !== "COMPOSITION") {
      throw new CbOperationError("Expected a stored COMPOSITION");
    }
    const codes = options.codes ?? (usesAdl14Codes(data) ? "adl14" : "adl2");
    if (codes === "adl14") {
      data = upConvertFromAdl14(data, {
        adl2CodingSystem: template.binding.adl2CodingSystem ?? "id-coded",
      }) as JsonObject;
    }
    const details = data.archetype_details;
    const tid = isObject(details) && isObject(details.template_id)
      ? details.template_id.value
      : undefined;
    if (tid !== template.binding.templateId) {
      throw new CbOperationError(
        `Stored COMPOSITION uses template ${tid}, not ${template.binding.templateId}`,
      );
    }
    // Provenance of the stored version; the commit writes a new one.
    delete data.feeder_audit;
    return data;
  }

  /** Never mint a key this replica already used in loaded content. */
  private bumpKeyCounter(tree: RmJson): void {
    for (const n of locatablesWithUid(tree)) {
      const key = keyOfUid(uidValue(n)!);
      const m = key ? /^([a-z][a-z0-9]*)\.(\d+)$/.exec(key) : null;
      if (m && m[1] === this.context.replica) {
        this.keyCounter = Math.max(this.keyCounter, Number(m[2]));
      }
    }
  }

  private info(d: DraftState): VersionDraftInfo {
    return {
      draftId: d.draftId,
      kind: d.kind,
      rmType: d.rmType,
      templateBinding: clone(
        d.templateBinding as unknown as RmJson,
      ) as unknown as TemplateBinding,
      provisionalObjectUuid: d.provisionalObjectUuid,
      ...(d.baseVersionUid ? { baseVersionUid: d.baseVersionUid } : {}),
      ...(d.copiedFrom ? { copiedFrom: d.copiedFrom } : {}),
      ...(d.committed ? { committed: { ...d.committed } } : {}),
      ...(d.lifecycle ? { lifecycle: d.lifecycle } : {}),
      ...(d.discarded ? { discarded: true } : {}),
    };
  }

  private state(draftId: string): DraftState {
    const d = this.drafts.get(draftId);
    if (!d) throw new CbOperationError(`No draft ${draftId}`);
    return d;
  }

  /** Accept a short key, a full uid, or {@link ROOT_TARGET}; store the short key. */
  private resolveTarget(draftId: string, target: string): string {
    if (target === ROOT_TARGET) return target;
    const d = this.state(draftId);
    if (d.nodes.has(target)) {
      const key = keyOfUid(target);
      return key && d.nodes.has(key) ? key : target;
    }
    throw new CbOperationError(`No node ${target} in draft ${draftId}`);
  }

  private mintKey(): string {
    this.keyCounter += 1;
    return `${this.context.replica}.${this.keyCounter}`;
  }

  private commitOp<T extends CbOperation>(
    body: Omit<T, "replica" | "seq" | "author" | "timestamp">,
    opOptions: OperationOptions,
  ): T {
    const author = opOptions.author ?? this.context.author;
    if (!author?.id) {
      throw new CbOperationError("Operation author id is required");
    }
    this.assertMay(author, body.type);
    const op = {
      ...body,
      replica: this.context.replica,
      seq: this.seq + 1,
      author: { ...author },
      timestamp: this.context.now(),
    } as unknown as T;
    try {
      this.apply(op);
    } catch (e) {
      this.restore();
      throw e;
    }
    this.seq += 1;
    this.applied.push(op);
    this.adapter.append(op);
    try {
      this.validation?.note(this, op);
    } catch {
      // A check that fails must not roll back an edit that already applied.
    }
    return op;
  }

  /** Replay the log after a failed apply so state matches the adapter. */
  private restore(): void {
    this.drafts.clear();
    this.members.clear();
    this.applied = [];
    this.seq = 0;
    this.keyCounter = 0;
    this.skipped = [];
    this.replayAll(this.adapter.operations());
  }

  /**
   * Fold text edits to one `set-value` per author and field (ADR 0013).
   * The value is the field as it stood after that author's last text edit.
   * Returns true when the log changed. Final RM JSON is unchanged.
   */
  compactTextEdits(): boolean {
    const ops = [...this.adapter.operations()];
    const scratch = new ContributionBuild(
      this.buildId,
      {
        author: this.context.author,
        replica: this.context.replica,
        now: this.context.now,
        uuid: this.context.uuid,
      },
      new SingleAppLogAdapter(),
    );
    const groups = new Map<
      string,
      { index: number; value: RmJson; op: CbOperation }
    >();
    ops.forEach((op, index) => {
      scratch.apply(op);
      scratch.applied.push(op);
      const key = textGroupKey(op);
      if (!key) return;
      const field = textFieldOf(op)!;
      groups.set(key, {
        index,
        value: scratch.readField(field.draft, field.target, field.path),
        op,
      });
    });
    const emitAt = new Map<number, CbOperation[]>();
    for (const group of groups.values()) {
      const field = textFieldOf(group.op)!;
      const compacted: SetValueOperation = {
        type: "set-value",
        replica: group.op.replica,
        seq: group.op.seq,
        author: { ...group.op.author },
        timestamp: group.op.timestamp,
        draft: field.draft,
        target: field.target,
        path: field.path,
        value: group.value,
      };
      const list = emitAt.get(group.index) ?? [];
      list.push(compacted);
      emitAt.set(group.index, list);
    }
    const next: CbOperation[] = [];
    ops.forEach((op, index) => {
      if (isTextEdit(op)) {
        const extra = emitAt.get(index);
        if (extra) next.push(...extra);
        return;
      }
      next.push(op);
    });
    if (canonicalizeJson(next) === canonicalizeJson(ops)) return false;
    if (!this.adapter.replaceAll) {
      throw new CbOperationError(
        "This log adapter cannot compact text edits",
      );
    }
    this.adapter.replaceAll(next);
    this.restore();
    return true;
  }

  /**
   * One `data entry` participation per author and entry they changed
   * (ADR 0006). Idempotent. Context is used when the edit is not under an ENTRY
   * and `context` exists.
   */
  ensureDataEntryParticipations(): void {
    const content = new Set<CbOperation["type"]>([
      "set-value",
      "edit-text",
      "add-instance",
      "remove-instance",
      "move-instance",
      "import",
      "assign-uid",
    ]);
    for (const [draftId, d] of this.drafts) {
      if (d.discarded || d.committed) continue;
      const authors = new Map<
        string,
        {
          author: OperationAuthor;
          places: Map<string, "other_participations" | "participations">;
        }
      >();
      for (const op of this.applied) {
        if (op.draft !== draftId || !content.has(op.type)) continue;
        const place = this.participationPlace(d, op);
        if (!place) continue;
        let row = authors.get(op.author.id);
        if (!row) {
          row = { author: op.author, places: new Map() };
          authors.set(op.author.id, row);
        }
        row.places.set(place.target, place.list);
      }
      for (const row of authors.values()) {
        for (const [target, list] of row.places) {
          if (hasDataEntry(d, target, list, row.author.id)) continue;
          this.setParticipation(
            draftId,
            target,
            participationFor(row.author),
            { list, author: row.author },
          );
        }
      }
    }
  }

  private replayAll(ops: readonly CbOperation[]): void {
    const ordered = this.lenient ? sortOperations(ops) : ops;
    for (const op of ordered) {
      if (!this.lenient) {
        this.applyHistorical(op);
        continue;
      }
      try {
        this.applyHistorical(op);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (
          op.type === "add-instance" &&
          err instanceof CbOperationError &&
          message.includes("Anchor")
        ) {
          const relaxed: AddInstanceOperation = {
            ...op,
            before: undefined,
            after: undefined,
          };
          try {
            this.applyHistorical(relaxed);
            this.skipped.push({
              kind: "concurrent-replay",
              operation: op,
              reason: "anchor-missing-appended",
              match: "none",
              message,
            });
            continue;
          } catch (err2) {
            const msg2 = err2 instanceof Error ? err2.message : String(err2);
            this.skipped.push({
              kind: "concurrent-replay",
              operation: op,
              reason: "parent-removed",
              match: "none",
              message: msg2,
            });
            continue;
          }
        }
        this.skipped.push({
          kind: "concurrent-replay",
          operation: op,
          reason: skipReason(err, op),
          match: "none",
          message,
        });
      }
    }
  }

  private applyHistorical(op: CbOperation): void {
    this.apply(op);
    this.applied.push(op);
    if (op.replica === this.context.replica) {
      this.seq = Math.max(this.seq, op.seq);
    }
    for (const k of keysOf(op)) {
      const [prefix, n] = k.split(".");
      if (prefix === this.context.replica) {
        this.keyCounter = Math.max(this.keyCounter, Number(n));
      }
    }
  }

  /**
   * Rebuild from a merged log without aborting on one bad operation (ADR 0013).
   * The adapter must already hold the merged operations.
   */
  replayConcurrent(): readonly ConcurrentSkip[] {
    this.lenient = true;
    this.restore();
    return this.skipped;
  }

  private reindex(d: DraftState): void {
    d.nodes.clear();
    const walk = (v: RmJson, parent?: JsonObject) => {
      if (Array.isArray(v)) return v.forEach((x) => walk(x, parent));
      if (!isObject(v)) return;
      if (v !== d.root && isLocatable(v)) {
        const uid = uidValue(v);
        if (uid) {
          const entry = { node: v, parent };
          d.nodes.set(uid, entry);
          const key = keyOfUid(uid);
          if (key) d.nodes.set(key, entry);
        }
      }
      const nextParent = isLocatable(v) ? v : parent;
      for (const [k, x] of Object.entries(v)) {
        if (k !== "uid") walk(x, nextParent);
      }
    };
    walk(d.root);
  }

  private assignKeys(
    d: DraftState,
    tree: RmJson,
    keys: string[],
    skipRoot: boolean,
    op: CbOperation,
  ): void {
    const targets = locatablesNeedingKeys(tree, skipRoot);
    if (targets.length !== keys.length) {
      throw new CbOperationError(
        `Expected ${targets.length} keys, got ${keys.length}`,
        op,
      );
    }
    targets.forEach((node, i) => {
      const key = keys[i];
      if (!SHORT_KEY_RE.test(key)) {
        throw new CbOperationError(`Invalid short key ${key}`, op);
      }
      if (d.nodes.has(key)) {
        throw new CbOperationError(`Short key ${key} already used`, op);
      }
      node.uid = {
        _type: "HIER_OBJECT_ID",
        value: `${d.provisionalObjectUuid}::${key}`,
      };
    });
  }

  private nodeFor(d: DraftState, target: string, op: CbOperation): JsonObject {
    if (target === ROOT_TARGET) return d.root;
    const entry = d.nodes.get(target);
    if (!entry) {
      throw new CbOperationError(`No node ${target} in draft ${d.draftId}`, op);
    }
    return entry.node;
  }

  /** Apply one operation to the state. Pure function of state + op (replay). */
  private apply(op: CbOperation): void {
    if (
      op.type === "join-build" || op.type === "leave-build" ||
      op.type === "set-role"
    ) {
      this.applyMembership(op);
      return;
    }
    if (op.type === "create-draft") {
      if (this.drafts.has(op.draft)) {
        throw new CbOperationError(`Draft ${op.draft} exists`, op);
      }
      const root = clone(op.initial) as JsonObject;
      if (!isLocatable(root)) {
        throw new CbOperationError("Draft root must be LOCATABLE", op);
      }
      const d: DraftState = {
        draftId: op.draft,
        kind: op.kind,
        rmType: op.rmType,
        templateBinding: op.template,
        provisionalObjectUuid: op.provisionalObjectUuid,
        ...(op.copiedFrom ? { copiedFrom: op.copiedFrom } : {}),
        root,
        nodes: new Map(),
      };
      this.assignKeys(d, root, op.keys, true, op);
      this.drafts.set(op.draft, d);
      this.reindex(d);
      return;
    }
    if (op.type === "open-version") {
      if (this.drafts.has(op.draft)) {
        throw new CbOperationError(`Draft ${op.draft} exists`, op);
      }
      const root = clone(op.initial) as JsonObject;
      if (!isLocatable(root)) {
        throw new CbOperationError("Draft root must be LOCATABLE", op);
      }
      const d: DraftState = {
        draftId: op.draft,
        kind: op.kind,
        rmType: op.rmType,
        templateBinding: op.template,
        provisionalObjectUuid: op.versionedObjectUuid,
        baseVersionUid: op.baseVersionUid,
        root,
        nodes: new Map(),
      };
      this.reindex(d);
      this.assignKeys(d, root, op.keys, true, op);
      d.base = clone(root);
      this.drafts.set(op.draft, d);
      this.reindex(d);
      return;
    }
    const d = this.drafts.get(op.draft);
    if (!d) throw new CbOperationError(`No draft ${op.draft}`, op);
    if (d.committed && op.type !== "record-commit") {
      throw new CbOperationError(
        `Draft ${op.draft} is committed (${d.committed.versionUid}); start a new draft with update-version`,
        op,
        "already-committed",
      );
    }
    if (d.discarded && op.type !== "record-commit") {
      throw new CbOperationError(
        `Draft ${op.draft} is discarded`,
        op,
        "discarded",
      );
    }
    switch (op.type) {
      case "record-commit": {
        if (d.committed) {
          throw new CbOperationError(
            `Draft ${op.draft} is already committed as ${d.committed.versionUid}`,
            op,
            "already-committed",
          );
        }
        d.committed = {
          versionUid: op.versionUid,
          changeType: op.changeType,
          lifecycleState: op.lifecycleState,
          logSha256: op.logSha256,
          ...(op.contributionUid
            ? { contributionUid: op.contributionUid }
            : {}),
          ...(op.storedObjectUuid
            ? { storedObjectUuid: op.storedObjectUuid }
            : {}),
        };
        return;
      }
      case "set-value": {
        const node = this.nodeFor(d, op.target, op);
        this.assertRev(op, d);
        const segments = op.path.split("/").filter((s) => s.length);
        if (!segments.length) {
          throw new CbOperationError("set-value needs a path", op);
        }
        if (segments[0] === "uid" || segments[0] === "archetype_node_id") {
          throw new CbOperationError(
            `set-value cannot change ${segments[0]}`,
            op,
          );
        }
        if (node === d.root && segments[0] === "composer") {
          throw new CbOperationError(
            "Use set-composer for COMPOSITION.composer",
            op,
          );
        }
        if (containsLocatable(op.value)) {
          throw new CbOperationError(
            "set-value cannot add LOCATABLE content; use add-instance",
            op,
          );
        }
        let cur: RmJson = node;
        for (let i = 0; i < segments.length - 1; i++) {
          const next: RmJson | undefined = step(cur, segments[i]);
          if (next === undefined || next === null || typeof next !== "object") {
            throw new CbOperationError(
              `Path ${op.path}: ${segments[i]} is not set`,
              op,
            );
          }
          if (isLocatable(next)) {
            throw new CbOperationError(
              `Path ${op.path} enters another LOCATABLE`,
              op,
            );
          }
          cur = next;
        }
        const last = segments[segments.length - 1];
        const existing = step(cur, last);
        if (isLocatable(existing) || containsLocatable(existing ?? null)) {
          throw new CbOperationError(
            `Path ${op.path} holds LOCATABLE content; use add/remove-instance`,
            op,
          );
        }
        setStep(cur, last, op.value === null ? undefined : clone(op.value), op);
        return;
      }
      case "edit-text": {
        const node = this.nodeFor(d, op.target, op);
        this.assertRev(op, d);
        const current = readRelative(node, op.path);
        if (typeof current !== "string") {
          throw new CbOperationError(
            `edit-text path ${op.path} is not a string`,
            op,
          );
        }
        const next = spliceCodePoints(current, op.at, op.delete, op.insert);
        if (next === undefined) {
          throw new CbOperationError(
            `edit-text range at ${op.at} delete ${op.delete} is outside the text`,
            op,
          );
        }
        writeRelative(node, op.path, next, op);
        return;
      }
      case "move-instance": {
        if (op.target === ROOT_TARGET) {
          throw new CbOperationError("Cannot move the draft root", op);
        }
        const entry = d.nodes.get(op.target);
        if (!entry?.parent) {
          throw new CbOperationError(`No node ${op.target}`, op);
        }
        const parent = this.nodeFor(d, op.parent, op);
        if (parent === entry.node || containsNode(entry.node, parent)) {
          throw new CbOperationError(
            "Cannot move a node under itself",
            op,
          );
        }
        const anchor = op.before ?? op.after;
        if (anchor) {
          const sibling = d.nodes.get(anchor)?.node;
          if (!sibling || containsNode(entry.node, sibling)) {
            throw new CbOperationError(
              `Anchor ${anchor} is not in ${op.attribute}`,
              op,
            );
          }
        }
        if (!detach(entry.parent, entry.node)) {
          throw new CbOperationError(
            `Node ${op.target} not found under its parent`,
            op,
          );
        }
        insertLocatable(d, parent, op.attribute, entry.node, op);
        this.reindex(d);
        return;
      }
      case "assign-uid": {
        const node = nodeAtPath(d.root, op.path);
        if (!node || !isLocatable(node)) {
          throw new CbOperationError(
            `assign-uid: no LOCATABLE at ${op.path}`,
            op,
          );
        }
        if (uidValue(node)) {
          throw new CbOperationError(
            `assign-uid: ${op.path} already has a uid`,
            op,
          );
        }
        if (!SHORT_KEY_RE.test(op.key)) {
          throw new CbOperationError(`Invalid short key ${op.key}`, op);
        }
        if (d.nodes.has(op.key)) {
          throw new CbOperationError(`Short key ${op.key} already used`, op);
        }
        node.uid = {
          _type: "HIER_OBJECT_ID",
          value: `${d.provisionalObjectUuid}::${op.key}`,
        };
        this.reindex(d);
        return;
      }
      case "set-participation": {
        const list = participationList(d, op);
        const next = clone(op.participation);
        const id = performerId(next);
        const fn = participationFunction(next);
        const i = list.findIndex((p) =>
          isObject(p) && performerId(p) === id &&
          participationFunction(p) === fn
        );
        if (i >= 0) list[i] = next;
        else list.push(next);
        return;
      }
      case "set-lifecycle": {
        d.lifecycle = op.mode;
        return;
      }
      case "migrate-template": {
        d.templateBinding = clone(
          op.template as unknown as RmJson,
        ) as unknown as TemplateBinding;
        return;
      }
      case "import": {
        const root = clone(op.document) as JsonObject;
        if (!isLocatable(root) || root._type !== "COMPOSITION") {
          throw new CbOperationError("import needs a COMPOSITION", op);
        }
        delete root.uid;
        delete root.feeder_audit;
        d.root = root;
        d.nodes = new Map();
        this.reindex(d);
        if (!op.deferUids) this.assignKeys(d, root, op.keys, true, op);
        this.reindex(d);
        return;
      }
      case "discard": {
        if (!op.target) {
          d.discarded = true;
          return;
        }
        if (op.target === ROOT_TARGET) {
          throw new CbOperationError(
            "Cannot discard the draft root; discard the draft",
            op,
          );
        }
        const entry = d.nodes.get(op.target);
        if (!entry?.parent) {
          throw new CbOperationError(`No node ${op.target}`, op);
        }
        if (!detach(entry.parent, entry.node)) {
          throw new CbOperationError(
            `Node ${op.target} not found under its parent`,
            op,
          );
        }
        this.reindex(d);
        return;
      }
      case "resolve": {
        this.applyResolve(d, op);
        return;
      }
      case "add-instance": {
        const parent = this.nodeFor(d, op.parent, op);
        const instance = clone(op.instance);
        if (!isLocatable(instance)) {
          throw new CbOperationError("add-instance needs a LOCATABLE", op);
        }
        this.assignKeys(d, instance, op.keys, false, op);
        for (const n of locatablesWithUid(instance)) {
          const uid = uidValue(n)!;
          if (d.nodes.has(uid)) {
            throw new CbOperationError(`uid ${uid} already in draft`, op);
          }
        }
        const current = parent[op.attribute];
        const anchor = op.before ?? op.after;
        if (Array.isArray(current)) {
          let at = current.length;
          if (anchor !== undefined) {
            const sibling = d.nodes.get(anchor)?.node;
            const i = sibling ? current.indexOf(sibling) : -1;
            if (i < 0) {
              throw new CbOperationError(
                `Anchor ${anchor} is not in ${op.attribute}`,
                op,
              );
            }
            at = op.before !== undefined ? i : i + 1;
          }
          current.splice(at, 0, instance);
        } else if (anchor !== undefined) {
          throw new CbOperationError(
            `Anchor ${anchor} is not in ${op.attribute}`,
            op,
          );
        } else if (current === undefined || current === null) {
          parent[op.attribute] = MULTI_VALUED.has(op.attribute)
            ? [instance]
            : instance;
        } else {
          throw new CbOperationError(
            `${op.attribute} already holds a value; remove it first`,
            op,
          );
        }
        this.reindex(d);
        return;
      }
      case "remove-instance": {
        if (op.target === ROOT_TARGET) {
          throw new CbOperationError("Cannot remove the draft root", op);
        }
        const entry = d.nodes.get(op.target);
        if (!entry || !entry.parent) {
          throw new CbOperationError(`No node ${op.target}`, op);
        }
        if (!detach(entry.parent, entry.node)) {
          throw new CbOperationError(
            `Node ${op.target} not found under its parent`,
            op,
          );
        }
        this.reindex(d);
        return;
      }
      case "set-composer": {
        d.root.composer = clone(op.composer);
        return;
      }
      default: {
        const unexpected: never = op;
        throw new CbOperationError(
          `Unknown operation ${(unexpected as CbOperation).type}`,
          op,
        );
      }
    }
  }

  private mapKey(fromId: string, toId: string, key: string): string {
    if (key === ROOT_TARGET) return ROOT_TARGET;
    const to = this.drafts.get(toId);
    if (!to) throw new CbOperationError(`No draft ${toId}`);
    if (to.nodes.has(key)) return key;
    const from = this.drafts.get(fromId);
    const node = from?.nodes.get(key)?.node;
    if (!node) throw new CbOperationError(`No node ${key} to retarget`);
    const id = node.archetype_node_id;
    const same = (draft: string, state: DraftState) =>
      this.listNodeKeys(draft).filter((k) =>
        state.nodes.get(k)?.node.archetype_node_id === id
      );
    const ordinal = same(fromId, from!).indexOf(key);
    const hit = same(toId, to)[ordinal];
    if (!hit) {
      throw new CbOperationError(
        `Cannot retarget ${key} onto the latest version`,
      );
    }
    return hit;
  }

  private reapply(newDraft: string, oldDraft: string, op: CbOperation): void {
    const author = { author: op.author };
    const map = (key: string) => this.mapKey(oldDraft, newDraft, key);
    switch (op.type) {
      case "set-value":
        this.setValue(newDraft, map(op.target), op.path, op.value, author);
        return;
      case "edit-text":
        this.editText(newDraft, map(op.target), op.path, {
          at: op.at,
          delete: op.delete,
          insert: op.insert,
        }, author);
        return;
      case "set-composer":
        this.setComposer(newDraft, op.composer, author);
        return;
      case "add-instance":
        this.addInstance(newDraft, map(op.parent), op.attribute, op.instance, {
          ...author,
          ...(op.before ? { before: map(op.before) } : {}),
          ...(op.after ? { after: map(op.after) } : {}),
        });
        return;
      case "remove-instance":
        this.removeInstance(newDraft, map(op.target), author);
        return;
      case "move-instance":
        this.moveInstance(
          newDraft,
          map(op.target),
          map(op.parent),
          op.attribute,
          {
            ...author,
            ...(op.before ? { before: map(op.before) } : {}),
            ...(op.after ? { after: map(op.after) } : {}),
          },
        );
        return;
      case "set-participation":
        this.setParticipation(newDraft, map(op.target), op.participation, {
          list: op.list,
          ...author,
        });
        return;
      case "set-lifecycle":
        this.setLifecycle(newDraft, op.mode, author);
        return;
      case "import":
        this.importDocument(newDraft, op.document, {
          format: "canonical",
          deferUids: op.deferUids === true,
          ...author,
        });
        return;
      default:
        return;
    }
  }

  private applyResolution(
    newDraft: string,
    oldDraft: string,
    op: CbOperation,
    resolution: ConflictResolution,
  ): void {
    const author = { author: op.author };
    const conflict = operationRef(op);
    const marker = (
      extra: Omit<
        ResolveOperation,
        | "replica"
        | "seq"
        | "author"
        | "timestamp"
        | "type"
        | "draft"
        | "conflict"
        | "action"
      >,
    ) => {
      this.commitOp<ResolveOperation>({
        type: "resolve",
        draft: newDraft,
        conflict,
        action: resolution.action,
        ...extra,
      }, author);
    };
    if (resolution.action === "keep-theirs" || resolution.action === "drop") {
      marker({});
      return;
    }
    if (op.type === "set-composer") {
      marker({
        composer: resolution.action === "custom"
          ? toCanonicalRmJson(resolution.value)
          : clone(op.composer),
      });
      return;
    }
    if (op.type === "remove-instance") {
      marker({
        target: this.mapKey(oldDraft, newDraft, op.target),
        remove: true,
      });
      return;
    }
    if (op.type === "add-instance") {
      const instance = clone(op.instance) as JsonObject;
      const keys = locatablesNeedingKeys(instance, false).map(() =>
        this.mintKey()
      );
      marker({
        target: this.mapKey(oldDraft, newDraft, op.parent),
        attribute: op.attribute,
        instance,
        keys,
        ...(op.before
          ? { before: this.mapKey(oldDraft, newDraft, op.before) }
          : {}),
        ...(op.after
          ? { after: this.mapKey(oldDraft, newDraft, op.after) }
          : {}),
      });
      return;
    }
    if (op.type === "edit-text" && resolution.action === "keep-ours") {
      this.editText(
        newDraft,
        this.mapKey(oldDraft, newDraft, op.target),
        op.path,
        {
          at: op.at,
          delete: op.delete,
          insert: op.insert,
        },
        author,
      );
      marker({});
      return;
    }
    if (op.type === "set-value" || op.type === "edit-text") {
      const value = resolution.action === "custom"
        ? toCanonicalRmJson(resolution.value)
        : op.type === "set-value"
        ? clone(op.value)
        : null;
      marker({
        target: this.mapKey(oldDraft, newDraft, op.target),
        path: op.path,
        value,
      });
      return;
    }
    marker({});
  }

  private assertMay(author: OperationAuthor, type: CbOperation["type"]): void {
    if (
      type === "join-build" || type === "leave-build" || type === "set-role" ||
      type === "record-commit"
    ) {
      return;
    }
    if (this.members.size === 0) return;
    const member = this.members.get(author.id);
    if (!member) {
      throw new CbOperationError(
        `Author ${author.id} is not a member of this build`,
        undefined,
        "not-a-member",
      );
    }
    if (member.role === "viewer") {
      throw new CbOperationError(
        `Member ${author.id} is a viewer and cannot edit`,
        undefined,
        "viewer",
      );
    }
  }

  private applyMembership(
    op: JoinBuildOperation | CbOperation,
  ): void {
    if (op.type === "join-build") {
      if (this.members.has(op.memberId)) {
        throw new CbOperationError(
          `Member ${op.memberId} is already in the build`,
          op,
          "role",
        );
      }
      if (!REPLICA_RE.test(op.memberReplica)) {
        throw new CbOperationError(
          `Invalid replica prefix ${op.memberReplica}`,
          op,
        );
      }
      for (const m of this.members.values()) {
        if (m.replica === op.memberReplica) {
          throw new CbOperationError(
            `Replica prefix ${op.memberReplica} is already used`,
            op,
            "role",
          );
        }
      }
      if (this.members.size > 0) {
        const actor = this.members.get(op.author.id);
        if (!actor || actor.role !== "committer") {
          throw new CbOperationError(
            "Only a committer can add a member",
            op,
            "role",
          );
        }
      }
      const member: BuildMember = {
        id: op.memberId,
        role: op.role,
        replica: op.memberReplica,
      };
      if (op.memberName) member.name = op.memberName;
      this.members.set(op.memberId, member);
      return;
    }
    if (op.type === "leave-build") {
      const actor = this.members.get(op.author.id);
      if (op.author.id !== op.memberId && actor?.role !== "committer") {
        throw new CbOperationError(
          "Only the member or a committer can remove a member",
          op,
          "role",
        );
      }
      if (!this.members.has(op.memberId)) {
        throw new CbOperationError(`No member ${op.memberId}`, op, "role");
      }
      if (
        this.members.get(op.memberId)?.role === "committer" &&
        committerCount(this.members) === 1
      ) {
        throw new CbOperationError(
          "Cannot remove the last committer",
          op,
          "role",
        );
      }
      this.members.delete(op.memberId);
      return;
    }
    if (op.type === "set-role") {
      const actor = this.members.get(op.author.id);
      if (!actor || actor.role !== "committer") {
        throw new CbOperationError(
          "Only a committer can change roles",
          op,
          "role",
        );
      }
      const member = this.members.get(op.memberId);
      if (!member) {
        throw new CbOperationError(`No member ${op.memberId}`, op, "role");
      }
      if (
        member.role === "committer" && op.role !== "committer" &&
        committerCount(this.members) === 1
      ) {
        throw new CbOperationError(
          "Cannot demote the last committer",
          op,
          "role",
        );
      }
      member.role = op.role;
      return;
    }
    throw new CbOperationError("Not a membership operation", op);
  }

  private assertRev(
    op: SetValueOperation | EditTextOperation,
    d: DraftState,
  ): void {
    if (!op.rev) {
      if (this.requireRev) {
        throw new CbOperationError(
          "This build requires rev on set-value and edit-text",
          op,
          "rev-required",
        );
      }
      return;
    }
    const field = { draft: op.draft, target: op.target, path: op.path };
    if (!fieldChangedSince(this.applied, op.rev, field)) return;
    let current: RmJson | undefined;
    try {
      current = this.readField(d.draftId, field.target, field.path);
    } catch {
      current = undefined;
    }
    throw new CbOperationError(
      `Field ${field.target} ${field.path} changed since rev ${op.rev}`,
      op,
      "changed-by-someone-else",
      current,
    );
  }

  private readField(draftId: string, target: string, path: string): RmJson {
    const d = this.state(draftId);
    const node = this.nodeFor(d, target, {
      type: "set-value",
      draft: draftId,
    } as CbOperation);
    const value = readRelative(node, path);
    return value === undefined ? null : clone(value);
  }

  private participationPlace(
    d: DraftState,
    op: CbOperation,
  ):
    | { target: string; list: "other_participations" | "participations" }
    | undefined {
    const key = contentNodeKey(d, op);
    if (!key) return undefined;
    return entryPlace(d, key);
  }

  private importedCanonical(
    document: unknown,
    options: {
      format: "canonical" | "flat" | "structured";
      template?: BoundTemplate;
      lang?: string;
    },
  ): JsonObject {
    if (options.format === "canonical") {
      const json = toCanonicalRmJson(document);
      if (!isObject(json) || json._type !== "COMPOSITION") {
        throw new CbOperationError("import needs a COMPOSITION");
      }
      return json;
    }
    if (!options.template) {
      throw new CbOperationError(
        "FLAT and STRUCTURED import need the bound template",
      );
    }
    const web = buildWebTemplate(options.template.operationalTemplate, {
      languages: options.lang ? [options.lang] : undefined,
    });
    const rm = options.format === "flat"
      ? deserializeFromFlat(document as FlatPayload, web)
      : deserializeFromStructured(
        document as Record<string, unknown>,
        web,
      );
    return toCanonicalRmJson(rm) as JsonObject;
  }

  private applyResolve(d: DraftState, op: ResolveOperation): void {
    if (op.action === "keep-theirs" || op.action === "drop") return;
    if (op.composer) {
      d.root.composer = clone(op.composer);
      return;
    }
    if (op.remove) {
      if (!op.target) {
        throw new CbOperationError("resolve removal needs a target", op);
      }
      const entry = d.nodes.get(op.target);
      if (!entry?.parent) {
        throw new CbOperationError(`No node ${op.target}`, op);
      }
      if (!detach(entry.parent, entry.node)) {
        throw new CbOperationError(`Node ${op.target} not found`, op);
      }
      this.reindex(d);
      return;
    }
    if (op.instance && op.attribute) {
      const parent = this.nodeFor(d, op.target ?? ROOT_TARGET, op);
      const instance = clone(op.instance);
      if (!isLocatable(instance)) {
        throw new CbOperationError("resolve add needs a LOCATABLE", op);
      }
      this.assignKeys(d, instance, op.keys ?? [], false, op);
      insertLocatable(d, parent, op.attribute, instance, op);
      this.reindex(d);
      return;
    }
    if (op.path && op.target) {
      const node = this.nodeFor(d, op.target, op);
      writeRelative(
        node,
        op.path,
        op.value === null || op.value === undefined
          ? undefined
          : clone(op.value),
        op,
      );
    }
  }
}

/** RM attributes that hold a list of LOCATABLEs (ITS-JSON arrays). */
const MULTI_VALUED = new Set([
  "content",
  "items",
  "events",
  "activities",
  "other_participations",
  "participations",
  "links",
]);

function codePhrase(terminology: string, code: string): JsonObject {
  return {
    _type: "CODE_PHRASE",
    terminology_id: { _type: "TERMINOLOGY_ID", value: terminology },
    code_string: code,
  };
}

function keysOf(op: CbOperation): string[] {
  if (op.type === "open-version") {
    // Loaded keys count too, so replay never re-mints one of them.
    return [
      ...op.keys,
      ...locatablesWithUid(op.initial).map((n) => keyOfUid(uidValue(n)!) ?? "")
        .filter((k) => SHORT_KEY_RE.test(k)),
    ];
  }
  if (op.type === "assign-uid") return [op.key];
  if (op.type === "resolve") return op.keys ?? [];
  if (op.type === "import") return op.deferUids ? [] : op.keys;
  return op.type === "create-draft" || op.type === "add-instance"
    ? op.keys
    : [];
}

function committerCount(members: ReadonlyMap<string, BuildMember>): number {
  let n = 0;
  for (const m of members.values()) if (m.role === "committer") n += 1;
  return n;
}

function participationFor(author: OperationAuthor): JsonObject {
  return {
    _type: "PARTICIPATION",
    function: { _type: "DV_TEXT", value: "data entry" },
    performer: {
      _type: "PARTY_IDENTIFIED",
      name: author.name ?? author.id,
      external_ref: {
        _type: "PARTY_REF",
        namespace: "local",
        type: "PERSON",
        id: {
          _type: "GENERIC_ID",
          scheme: "ehrtslib-cb-author",
          value: author.id,
        },
      },
    },
  };
}

function performerId(p: RmJson): string | undefined {
  if (!isObject(p) || !isObject(p.performer)) return undefined;
  const ref = p.performer.external_ref;
  if (!isObject(ref) || !isObject(ref.id)) return undefined;
  return typeof ref.id.value === "string" ? ref.id.value : undefined;
}

function participationFunction(p: RmJson): string | undefined {
  if (!isObject(p) || !isObject(p.function)) return undefined;
  return typeof p.function.value === "string" ? p.function.value : undefined;
}

function participationList(
  d: DraftState,
  op: SetParticipationOperation,
): RmJson[] {
  if (op.list === "participations") {
    const ctx = d.root.context;
    if (!isObject(ctx)) {
      throw new CbOperationError(
        "Draft has no context for participations",
        op,
      );
    }
    if (!Array.isArray(ctx.participations)) ctx.participations = [];
    return ctx.participations;
  }
  const node = op.target === ROOT_TARGET
    ? d.root
    : d.nodes.get(op.target)?.node;
  if (!node) throw new CbOperationError(`No node ${op.target}`, op);
  if (!Array.isArray(node.other_participations)) node.other_participations = [];
  return node.other_participations;
}

function hasDataEntry(
  d: DraftState,
  target: string,
  list: "other_participations" | "participations",
  authorId: string,
): boolean {
  const node = target === ROOT_TARGET ? d.root : d.nodes.get(target)?.node;
  if (!node) return false;
  const raw = list === "participations"
    ? (isObject(node.context) ? node.context.participations : undefined)
    : node.other_participations;
  if (!Array.isArray(raw)) return false;
  return raw.some((p) =>
    performerId(p) === authorId && participationFunction(p) === "data entry"
  );
}

function contentNodeKey(d: DraftState, op: CbOperation): string | undefined {
  switch (op.type) {
    case "set-value":
    case "edit-text":
    case "remove-instance":
    case "move-instance":
      return op.target;
    case "add-instance": {
      if (isLocatable(op.instance)) {
        const uid = uidValue(op.instance);
        if (uid) return keyOfUid(uid) ?? uid;
      }
      return op.keys[0] ?? op.parent;
    }
    case "assign-uid": {
      const node = nodeAtPath(d.root, op.path);
      const uid = node ? uidValue(node) : undefined;
      return uid ? (keyOfUid(uid) ?? uid) : undefined;
    }
    case "import":
      return ROOT_TARGET;
    default:
      return undefined;
  }
}

function entryPlace(
  d: DraftState,
  key: string,
):
  | { target: string; list: "other_participations" | "participations" }
  | undefined {
  if (key === ROOT_TARGET) {
    return isObject(d.root.context)
      ? { target: ROOT_TARGET, list: "participations" }
      : undefined;
  }
  let current: string | undefined = key;
  const seen = new Set<string>();
  while (current && !seen.has(current)) {
    seen.add(current);
    const entry = d.nodes.get(current);
    if (!entry) break;
    const rmType = entry.node._type;
    if (typeof rmType === "string" && isSubtypeOf(rmType, "ENTRY")) {
      return { target: current, list: "other_participations" };
    }
    const parent = entry.parent;
    if (!parent || parent === d.root) {
      return isObject(d.root.context)
        ? { target: ROOT_TARGET, list: "participations" }
        : undefined;
    }
    const uid = uidValue(parent);
    current = uid ? (keyOfUid(uid) ?? uid) : undefined;
  }
  return undefined;
}

function nodeAtPath(root: JsonObject, path: string): JsonObject | undefined {
  let cur: RmJson = root;
  for (const raw of path.split("/")) {
    if (!raw) continue;
    const indexed = /^([^[\]]+)\[(\d+)\]$/.exec(raw);
    const attr = indexed ? indexed[1] : raw;
    const index = indexed ? Number(indexed[2]) : undefined;
    if (!isObject(cur)) return undefined;
    let next: RmJson | undefined = cur[attr];
    if (index !== undefined) {
      next = Array.isArray(next) ? next[index] : undefined;
    }
    if (next === undefined) return undefined;
    cur = next;
  }
  return isObject(cur) ? cur : undefined;
}

function readRelative(node: JsonObject, path: string): RmJson | undefined {
  let cur: RmJson = node;
  for (const seg of path.split("/").filter((s) => s.length)) {
    const next = step(cur, seg);
    if (next === undefined) return undefined;
    cur = next;
  }
  return cur;
}

function writeRelative(
  node: JsonObject,
  path: string,
  value: RmJson | undefined,
  op: CbOperation,
): void {
  const segments = path.split("/").filter((s) => s.length);
  if (!segments.length) {
    throw new CbOperationError("Path is empty", op);
  }
  let cur: RmJson = node;
  for (let i = 0; i < segments.length - 1; i++) {
    const next = step(cur, segments[i]);
    if (next === undefined || next === null || typeof next !== "object") {
      throw new CbOperationError(
        `Path ${path}: ${segments[i]} is not set`,
        op,
      );
    }
    cur = next;
  }
  setStep(cur, segments[segments.length - 1], value, op);
}

function containsNode(tree: RmJson, node: JsonObject): boolean {
  if (tree === node) return true;
  if (Array.isArray(tree)) return tree.some((x) => containsNode(x, node));
  if (!isObject(tree)) return false;
  return Object.values(tree).some((x) => containsNode(x as RmJson, node));
}

function insertLocatable(
  d: DraftState,
  parent: JsonObject,
  attribute: string,
  instance: JsonObject,
  op: CbOperation,
): void {
  const before = "before" in op && typeof op.before === "string"
    ? op.before
    : undefined;
  const after = "after" in op && typeof op.after === "string"
    ? op.after
    : undefined;
  const current = parent[attribute];
  const anchor = before ?? after;
  if (Array.isArray(current)) {
    let at = current.length;
    if (anchor !== undefined) {
      const sibling = d.nodes.get(anchor)?.node;
      const i = sibling ? current.indexOf(sibling) : -1;
      if (i < 0) {
        throw new CbOperationError(
          `Anchor ${anchor} is not in ${attribute}`,
          op,
        );
      }
      at = before !== undefined ? i : i + 1;
    }
    current.splice(at, 0, instance);
    return;
  }
  if (anchor !== undefined) {
    throw new CbOperationError(`Anchor ${anchor} is not in ${attribute}`, op);
  }
  if (current === undefined || current === null) {
    parent[attribute] = MULTI_VALUED.has(attribute) ? [instance] : instance;
    return;
  }
  throw new CbOperationError(
    `${attribute} already holds a value; remove it first`,
    op,
  );
}

function skipReason(err: unknown, op: CbOperation): ConcurrentSkip["reason"] {
  if (err instanceof CbOperationError) {
    if (err.code === "changed-by-someone-else") {
      return "changed-by-someone-else";
    }
    if (err.code === "already-committed") return "already-committed";
  }
  const message = err instanceof Error ? err.message : "";
  if (message.includes("committed")) return "already-committed";
  if (
    message.includes("No node") || message.includes("not found") ||
    message.includes("Cannot move")
  ) {
    return "target-removed";
  }
  if (op.type === "set-value" || op.type === "edit-text") {
    return "changed-by-peer";
  }
  return "target-removed";
}

/** Drop every `uid` (copy-version: the copy is a new versioned object). */
function stripUids(v: RmJson): void {
  if (Array.isArray(v)) return v.forEach(stripUids);
  if (!isObject(v)) return;
  if (isLocatable(v)) delete v.uid;
  for (const x of Object.values(v)) stripUids(x);
}

function containsLocatable(v: RmJson): boolean {
  if (Array.isArray(v)) return v.some(containsLocatable);
  if (!isObject(v)) return false;
  if (isLocatable(v)) return true;
  return Object.values(v).some((x) => containsLocatable(x as RmJson));
}

function locatablesWithUid(tree: RmJson): JsonObject[] {
  const out: JsonObject[] = [];
  const walk = (v: RmJson) => {
    if (Array.isArray(v)) return v.forEach(walk);
    if (!isObject(v)) return;
    if (isLocatable(v) && uidValue(v)) out.push(v);
    for (const [k, x] of Object.entries(v)) if (k !== "uid") walk(x);
  };
  walk(tree);
  return out;
}

function step(cur: RmJson, seg: string): RmJson | undefined {
  if (Array.isArray(cur)) {
    if (!/^\d+$/.test(seg)) return undefined;
    return cur[Number(seg)];
  }
  return isObject(cur) ? cur[seg] : undefined;
}

function setStep(
  cur: RmJson,
  seg: string,
  value: RmJson | undefined,
  op: CbOperation,
): void {
  if (Array.isArray(cur)) {
    if (!/^\d+$/.test(seg) || Number(seg) > cur.length) {
      throw new CbOperationError(`Invalid index ${seg}`, op);
    }
    if (value === undefined) cur.splice(Number(seg), 1);
    else cur[Number(seg)] = value;
    return;
  }
  if (!isObject(cur)) {
    throw new CbOperationError(`Cannot set ${seg} on a primitive`, op);
  }
  if (seg === "_type") throw new CbOperationError("Cannot set _type", op);
  if (value === undefined) delete cur[seg];
  else cur[seg] = value;
}

/** Remove `node` from wherever it sits directly under `parent` (possibly through non-LOCATABLE objects). */
function detach(parent: JsonObject, node: JsonObject): boolean {
  const visit = (v: RmJson): boolean => {
    if (Array.isArray(v)) {
      const i = v.indexOf(node);
      if (i >= 0) {
        v.splice(i, 1);
        return true;
      }
      return v.some((x) => !isLocatable(x) && visit(x));
    }
    if (!isObject(v)) return false;
    for (const [k, x] of Object.entries(v)) {
      if (x === node) {
        delete v[k];
        return true;
      }
      // Removing the last member drops the attribute: RM invariants such as
      // ITEM_TREE / HISTORY ones reject an empty list but allow a Void one.
      if (Array.isArray(x) && x.includes(node)) {
        x.splice(x.indexOf(node), 1);
        if (x.length === 0) delete v[k];
        return true;
      }
      if (k !== "uid" && !isLocatable(x) && visit(x)) return true;
    }
    return false;
  };
  return visit(parent);
}
