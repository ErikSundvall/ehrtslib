/**
 * Contribution builder operation log (ADR 0004): versioned, append-only,
 * library-independent. Every change to a draft is one operation; replaying the
 * log rebuilds the drafts.
 *
 * Operations target nodes by **short key** (the extension part of the node uid
 * `<versioned-object-uuid>::<short key>`, ADR 0003), so the log does not change
 * when the versioned-object uuid is fixed at commit. The draft root is
 * addressed by {@link ROOT_TARGET}; its own uid is the version's
 * `OBJECT_VERSION_ID`, set at commit, never a short-key uid.
 */

import type { TemplateBinding } from "./template_binding.ts";
import { canonicalizeJson, sha256Hex } from "./jcs.ts";

/** Value of {@link OperationLogDocument.format}. */
export const OPERATION_LOG_FORMAT = "ehrtslib-cb-oplog";
/** Log format version. Readers reject a log with a higher major version. */
export const OPERATION_LOG_FORMAT_VERSION = 1;

/** Target for the draft's root object (the COMPOSITION itself). */
export const ROOT_TARGET = "root";

/** Canonical RM JSON (ITS-JSON with `_type`), as stored in the log. */
export type RmJson = null | boolean | number | string | RmJson[] | {
  [key: string]: RmJson;
};

/** Who made a change. Taken from the caller's context, per operation. */
export interface OperationAuthor {
  /** Stable id of the user (for example a login or HSA id). */
  id: string;
  name?: string;
  /** Free extra fields (role, organisation). Recorded as given. */
  [key: string]: string | undefined;
}

interface OperationBase {
  /** Replica (device / session) that created the operation. */
  replica: string;
  /** Per-replica sequence number, starting at 1. */
  seq: number;
  author: OperationAuthor;
  /** RFC 3339 / ISO 8601 timestamp from the caller's clock. */
  timestamp: string;
  /** Draft the operation applies to. */
  draft: string;
}

/** Start a new draft (a new versioned object, ADR 0002 `kind: create`). */
export interface CreateDraftOperation extends OperationBase {
  type: "create-draft";
  rmType: "COMPOSITION";
  kind: "create";
  /** Template binding (#163). The skeleton below was built from this template. */
  template: TemplateBinding;
  /**
   * Root for inner node uids until commit. The CDR may assign another
   * versioned-object uuid at commit; ops address nodes by short key, so the
   * log does not depend on it.
   */
  provisionalObjectUuid: string;
  /** Initial canonical RM JSON (recorded so replay does not depend on the generator). */
  initial: RmJson;
  /** Short keys for the LOCATABLE nodes in `initial` that have no uid, depth-first. */
  keys: string[];
  /** copy-version: the version the content was copied from (informative). */
  copiedFrom?: string;
}

/**
 * update-version: start a draft for a new version of an existing versioned
 * object (ADR 0002 `kind: modify`). `initial` is the stored version (ADL2
 * codes, root uid and `feeder_audit` removed). Existing inner uids are kept;
 * LOCATABLE nodes without a uid get the recorded `keys` (ADR 0003).
 */
export interface OpenVersionOperation extends OperationBase {
  type: "open-version";
  rmType: "COMPOSITION";
  kind: "modify";
  template: TemplateBinding;
  /** The versioned object's uuid (object id of the base version uid). */
  versionedObjectUuid: string;
  /** `OBJECT_VERSION_ID` the draft starts from: the commit's `preceding_version_uid`. */
  baseVersionUid: string;
  initial: RmJson;
  keys: string[];
}

/**
 * The draft was committed (#177 in part). Recorded after the server accepted
 * it; a committed draft takes no further operations and cannot be committed
 * again.
 */
export interface RecordCommitOperation extends OperationBase {
  type: "record-commit";
  /** Version uid as stored by the server. */
  versionUid: string;
  contributionUid?: string;
  /** openEHR audit change type code (249 creation, 251 modification). */
  changeType: string;
  /** openEHR lifecycle state code (532, 553). */
  lifecycleState: string;
  /** sha256 of the log bytes cited in the contribution audit. */
  logSha256: string;
  /**
   * Object uuid the server stored, when it replaced the provisional one.
   * Inner node uids keep the provisional prefix (#176).
   */
  storedObjectUuid?: string;
}

/**
 * Log position a caller last saw: `replica:seq` of an operation, or `"0"`
 * before any operation. Optional on text writes (ADR 0013, #243).
 */
export type LogRev = string;

/** Set (or with `value: null`, clear) a value under a node. */
export interface SetValueOperation extends OperationBase {
  type: "set-value";
  /** Short key of the LOCATABLE node, or {@link ROOT_TARGET}. */
  target: string;
  /** Attribute path relative to the node, `/`-separated (`value`, `value/magnitude`). */
  path: string;
  value: RmJson;
  /**
   * Base log position. Omitted: apply directly (single caller). Present: refuse
   * with `changed-by-someone-else` when this field changed after `rev`.
   */
  rev?: LogRev;
}

/**
 * Neutral text splice for a `DV_TEXT` / `DV_PARSABLE` string (ADR 0013 level 2).
 * `at` and `delete` count Unicode code points and never split a surrogate pair.
 */
export interface EditTextOperation extends OperationBase {
  type: "edit-text";
  target: string;
  /** Path of the string, relative to the node (`value`). */
  path: string;
  at: number;
  delete: number;
  insert: string;
  rev?: LogRev;
}

/** Reorder or reparent a LOCATABLE. Position is a sibling anchor, as in add-instance. */
export interface MoveInstanceOperation extends OperationBase {
  type: "move-instance";
  target: string;
  parent: string;
  attribute: string;
  before?: string;
  after?: string;
}

/**
 * Give one loaded LOCATABLE that has no uid a short key (ADR 0003). `path` is
 * the instance path from the draft root (`/content[0]/data`).
 */
export interface AssignUidOperation extends OperationBase {
  type: "assign-uid";
  path: string;
  key: string;
}

/** Set one `PARTICIPATION` on an ENTRY (`other_participations`) or on context. */
export interface SetParticipationOperation extends OperationBase {
  type: "set-participation";
  /** ENTRY short key, or {@link ROOT_TARGET} for `context.participations`. */
  target: string;
  list: "other_participations" | "participations";
  participation: RmJson;
}

/** Choose complete (532) or incomplete (553) for this draft. */
export interface SetLifecycleOperation extends OperationBase {
  type: "set-lifecycle";
  mode: "complete" | "incomplete";
}

/** Move the draft to another template binding. Never implicit (ADR 0007). */
export interface MigrateTemplateOperation extends OperationBase {
  type: "migrate-template";
  template: TemplateBinding;
}

/**
 * Replace the draft's content with an imported document. Replay uses
 * `document` (canonical RM JSON), whatever `format` the caller sent.
 * `keys` are short keys for LOCATABLEs in `document` that have no uid.
 * When `deferUids` is set, those nodes stay without a uid for `assign-uid`.
 */
export interface ImportOperation extends OperationBase {
  type: "import";
  format: "canonical" | "flat" | "structured";
  document: RmJson;
  keys: string[];
  deferUids?: boolean;
}

/**
 * Drop a draft, or one node, before commit. The log stays (ADR 0004).
 * No `target`: the whole draft is discarded and cannot be committed.
 */
export interface DiscardOperation extends OperationBase {
  type: "discard";
  target?: string;
}

export type MemberRole = "editor" | "viewer" | "committer";

/** A member joins. Their replica prefix is assigned here. */
export interface JoinBuildOperation extends OperationBase {
  type: "join-build";
  memberId: string;
  memberName?: string;
  role: MemberRole;
  memberReplica: string;
}

export interface LeaveBuildOperation extends OperationBase {
  type: "leave-build";
  memberId: string;
}

export interface SetRoleOperation extends OperationBase {
  type: "set-role";
  memberId: string;
  role: MemberRole;
}

/**
 * A caller's choice for one CDR conflict (ADR 0009, #177). `keep-theirs` and
 * `drop` change nothing; `keep-ours` and `custom` write `value` at `path`
 * when `path` is set, or apply the removal / insertion described beside it.
 */
export interface ResolveOperation extends OperationBase {
  type: "resolve";
  /** `replica:seq` of the conflicting operation. */
  conflict: string;
  action: "keep-ours" | "keep-theirs" | "custom" | "drop";
  target?: string;
  path?: string;
  value?: RmJson;
  /** keep-ours of remove-instance. */
  remove?: boolean;
  /** keep-ours of add-instance. */
  attribute?: string;
  instance?: RmJson;
  keys?: string[];
  before?: string;
  after?: string;
  composer?: RmJson;
}

/** Add a LOCATABLE subtree under a node's attribute. */
export interface AddInstanceOperation extends OperationBase {
  type: "add-instance";
  parent: string;
  attribute: string;
  /**
   * Position in a multi-valued attribute, anchored on a sibling's short key so
   * concurrent inserts from other replicas do not shift it. Appended when absent.
   */
  before?: string;
  after?: string;
  instance: RmJson;
  /** Short keys for the LOCATABLE nodes in `instance` that have no uid, depth-first. */
  keys: string[];
}

/** Remove a LOCATABLE node and its subtree. */
export interface RemoveInstanceOperation extends OperationBase {
  type: "remove-instance";
  target: string;
}

/** Set `COMPOSITION.composer` explicitly (ADR 0006). */
export interface SetComposerOperation extends OperationBase {
  type: "set-composer";
  composer: RmJson;
}

export type CbOperation =
  | CreateDraftOperation
  | OpenVersionOperation
  | RecordCommitOperation
  | SetValueOperation
  | EditTextOperation
  | AddInstanceOperation
  | RemoveInstanceOperation
  | MoveInstanceOperation
  | AssignUidOperation
  | SetComposerOperation
  | SetParticipationOperation
  | SetLifecycleOperation
  | MigrateTemplateOperation
  | ImportOperation
  | DiscardOperation
  | JoinBuildOperation
  | LeaveBuildOperation
  | SetRoleOperation
  | ResolveOperation;

export type CbOperationType = CbOperation["type"];

/** The exported log. Plain JSON. */
export interface OperationLogDocument {
  format: typeof OPERATION_LOG_FORMAT;
  formatVersion: number;
  buildId: string;
  operations: CbOperation[];
}

export class OperationLogFormatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OperationLogFormatError";
  }
}

const OP_TYPES: ReadonlySet<string> = new Set<CbOperationType>([
  "create-draft",
  "open-version",
  "record-commit",
  "set-value",
  "edit-text",
  "add-instance",
  "remove-instance",
  "move-instance",
  "assign-uid",
  "set-composer",
  "set-participation",
  "set-lifecycle",
  "migrate-template",
  "import",
  "discard",
  "join-build",
  "leave-build",
  "set-role",
  "resolve",
]);

/** `replica:seq`, the id of an operation across replicas. */
export function operationRef(op: { replica: string; seq: number }): string {
  return `${op.replica}:${op.seq}`;
}

/** Total order for a merged log: timestamp, then replica, then seq (ADR 0013). */
export function compareOperations(a: CbOperation, b: CbOperation): number {
  const byTime = a.timestamp.localeCompare(b.timestamp);
  if (byTime !== 0) return byTime;
  const byReplica = a.replica.localeCompare(b.replica);
  if (byReplica !== 0) return byReplica;
  return a.seq - b.seq;
}

/** Dedupe by `replica:seq`, then {@link compareOperations}. */
export function sortOperations(ops: readonly CbOperation[]): CbOperation[] {
  const seen = new Set<string>();
  const out: CbOperation[] = [];
  for (const op of ops) {
    const id = operationRef(op);
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(op);
  }
  out.sort(compareOperations);
  return out;
}

/** Short keys: replica prefix, a dot, a counter. Never contain `::`. */
export const SHORT_KEY_RE = /^[a-z][a-z0-9]*\.[1-9][0-9]*$/;
/** Replica prefixes: lower-case letters and digits, starting with a letter. */
export const REPLICA_RE = /^[a-z][a-z0-9]*$/;

/** Parse and check an exported log (object or JSON text). */
export function readOperationLog(
  input: OperationLogDocument | string,
): OperationLogDocument {
  const doc =
    (typeof input === "string" ? JSON.parse(input) : input) as Partial<
      OperationLogDocument
    >;
  if (!doc || typeof doc !== "object") {
    throw new OperationLogFormatError("Log is not an object");
  }
  if (doc.format !== OPERATION_LOG_FORMAT) {
    throw new OperationLogFormatError(
      `Unknown log format ${JSON.stringify(doc.format)}`,
    );
  }
  if (
    typeof doc.formatVersion !== "number" ||
    !Number.isInteger(doc.formatVersion)
  ) {
    throw new OperationLogFormatError("Log has no integer formatVersion");
  }
  if (
    doc.formatVersion > OPERATION_LOG_FORMAT_VERSION || doc.formatVersion < 1
  ) {
    throw new OperationLogFormatError(
      `Log format version ${doc.formatVersion} is not supported (this reader: ${OPERATION_LOG_FORMAT_VERSION})`,
    );
  }
  if (typeof doc.buildId !== "string" || !doc.buildId) {
    throw new OperationLogFormatError("Log has no buildId");
  }
  if (!Array.isArray(doc.operations)) {
    throw new OperationLogFormatError("Log has no operations array");
  }
  doc.operations.forEach((op, i) => {
    if (
      !op || typeof op !== "object" || !OP_TYPES.has((op as CbOperation).type)
    ) {
      throw new OperationLogFormatError(`Operation ${i} has an unknown type`);
    }
    const o = op as CbOperation;
    if (typeof o.replica !== "string" || !REPLICA_RE.test(o.replica)) {
      throw new OperationLogFormatError(
        `Operation ${i} has an invalid replica`,
      );
    }
    if (!Number.isInteger(o.seq) || o.seq < 1) {
      throw new OperationLogFormatError(`Operation ${i} has an invalid seq`);
    }
    if (!o.author || typeof o.author.id !== "string" || !o.author.id) {
      throw new OperationLogFormatError(`Operation ${i} has no author id`);
    }
    if (typeof o.timestamp !== "string" || typeof o.draft !== "string") {
      throw new OperationLogFormatError(
        `Operation ${i} has no timestamp or draft`,
      );
    }
  });
  return doc as OperationLogDocument;
}

/** RFC 8785 text of a log: the same log always gives the same bytes. */
export function canonicalLogText(doc: OperationLogDocument): string {
  return canonicalizeJson(doc);
}

/** UTF-8 bytes of {@link canonicalLogText} and their sha256 (for storage and audit, ADR 0005/0010). */
export async function operationLogBytes(
  doc: OperationLogDocument,
): Promise<{ bytes: Uint8Array; sha256: string }> {
  const text = canonicalLogText(doc);
  return {
    bytes: new TextEncoder().encode(text),
    sha256: await sha256Hex(text),
  };
}
