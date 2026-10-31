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
import {
  type AddInstanceOperation,
  type CbOperation,
  type CreateDraftOperation,
  type OpenVersionOperation,
  OPERATION_LOG_FORMAT,
  OPERATION_LOG_FORMAT_VERSION,
  type OperationAuthor,
  operationLogBytes,
  type OperationLogDocument,
  readOperationLog,
  type RecordCommitOperation,
  type RemoveInstanceOperation,
  REPLICA_RE,
  type RmJson,
  ROOT_TARGET,
  type SetComposerOperation,
  type SetValueOperation,
  SHORT_KEY_RE,
} from "./operation_log.ts";

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

/** Per-call override of the author (one caller, such as a server process, acting for several users). */
export interface OperationOptions {
  author?: OperationAuthor;
}

/**
 * Where operations go. The core appends local operations and replays
 * {@link operations} in order. A CRDT adapter would merge remote operations
 * into that order; the operation format stays the same.
 */
export interface OperationLogAdapter {
  append(op: CbOperation): void;
  operations(): readonly CbOperation[];
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
}

/** An operation that cannot be applied. Nothing is appended to the log. */
export class CbOperationError extends Error {
  readonly operation?: Partial<CbOperation>;
  constructor(message: string, operation?: Partial<CbOperation>) {
    super(message);
    this.name = "CbOperationError";
    this.operation = operation;
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
  };
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
  private seq = 0;
  private keyCounter = 0;

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
    this.context = {
      author: context.author,
      replica,
      now: context.now ?? (() => new Date().toISOString()),
      uuid: context.uuid ?? (() => crypto.randomUUID()),
    };
  }

  /** Start an empty build with a single-caller adapter (or the given one). */
  static create(
    context: BuildContext,
    adapter: OperationLogAdapter = new SingleAppLogAdapter(),
  ): ContributionBuild {
    const uuid = context.uuid ?? (() => crypto.randomUUID());
    const build = new ContributionBuild(uuid(), context, adapter);
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
    this.commitOp(body, opOptions);
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
    this.commitOp<SetValueOperation>({
      type: "set-value",
      draft: draftId,
      target: this.resolveTarget(draftId, target),
      path,
      value: toCanonicalRmJson(value),
    }, opOptions);
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
    const op = {
      ...body,
      replica: this.context.replica,
      seq: this.seq + 1,
      author: { ...author },
      timestamp: this.context.now(),
    } as unknown as T;
    // Apply to a scratch copy first so a failing op leaves state and log unchanged.
    const snapshot = this.snapshot();
    try {
      this.apply(op);
    } catch (e) {
      this.restore(snapshot);
      throw e;
    }
    this.seq += 1;
    this.adapter.append(op);
    return op;
  }

  private snapshot(): Map<string, RmJson> {
    const s = new Map<string, RmJson>();
    for (const [id, d] of this.drafts) s.set(id, clone(d.root));
    return s;
  }

  private restore(s: Map<string, RmJson>): void {
    for (const [id, d] of [...this.drafts]) {
      const root = s.get(id);
      if (!root) {
        this.drafts.delete(id);
        continue;
      }
      d.root = root as JsonObject;
      this.reindex(d);
    }
  }

  private replayAll(ops: readonly CbOperation[]): void {
    for (const op of ops) {
      this.apply(op);
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
    if (d.committed) {
      throw new CbOperationError(
        `Draft ${op.draft} is committed (${d.committed.versionUid}); start a new draft with update-version`,
        op,
      );
    }
    switch (op.type) {
      case "record-commit": {
        d.committed = {
          versionUid: op.versionUid,
          changeType: op.changeType,
          lifecycleState: op.lifecycleState,
          logSha256: op.logSha256,
          ...(op.contributionUid
            ? { contributionUid: op.contributionUid }
            : {}),
        };
        return;
      }
      case "set-value": {
        const node = this.nodeFor(d, op.target, op);
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
  return op.type === "create-draft" || op.type === "add-instance"
    ? op.keys
    : [];
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
