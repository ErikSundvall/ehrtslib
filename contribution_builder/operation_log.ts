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
}

/** Set (or with `value: null`, clear) a value under a node. */
export interface SetValueOperation extends OperationBase {
  type: "set-value";
  /** Short key of the LOCATABLE node, or {@link ROOT_TARGET}. */
  target: string;
  /** Attribute path relative to the node, `/`-separated (`value`, `value/magnitude`). */
  path: string;
  value: RmJson;
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
  | SetValueOperation
  | AddInstanceOperation
  | RemoveInstanceOperation
  | SetComposerOperation;

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
  "set-value",
  "add-instance",
  "remove-instance",
  "set-composer",
]);

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
