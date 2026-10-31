# Contribution Builder: one operation log, CRDT sync, session playback

Status: proposed (draft for review). Part of the
[Contribution Builder design](../maintainers/contribution-builder-design.md).

## Context

Multi-caller editing needs a change log that merges. (A caller is one app
instance or device writing to the build; one person on two devices is
multi-caller.) Auditors want to see how
a commit was produced. Conflict handling needs to re-apply local changes to
a newer base. If single-caller editing mutated the tree directly, these
features would only exist in the multi-caller flavour and the two would
behave differently.

## Decision

- Every change, also in the single-caller flavour, is an operation in one
  append-only log. Initial operation set: `set-value`, `add-instance`,
  `remove-instance`, `move-instance`, `assign-uid`, `set-composer`,
  `set-participation`, `set-lifecycle`, `bind-template`, `migrate-template`,
  `import` (adapter input such as FLAT, recorded as operations) and
  `discard`.
- Discarding a draft, or removing a composition or other item from a build
  before commit, is a `discard` operation. Discarded drafts are not
  committed to the CDR; the log is their record. The builder never deletes
  the log.
- Each operation records author, timestamp and replica, and targets a node
  uid ([ADR 0003](0003-cb-identity-and-uids.md)), not a path.
- A single caller applies operations directly. Multi-caller synchronises the same
  operations through a CRDT; presence (who edits where) is ephemeral and not
  logged.
- Session playback is replay of the log. Replay is deterministic: the same
  log and template give the same canonical RM JSON.
- The design does not bind to a CRDT library. A library must offer a
  replayable full history, a compact binary log format, Deno and browser
  support, and an acceptable licence. Automerge and Loro are preferred over
  Yjs (Yjs garbage-collects history by default and is weaker on full
  replay). A spike compares Automerge and Loro on a real template; its
  result becomes its own ADR.
- Any implementation must be able to recreate the session from the log.
  The log format is versioned so a later reader knows how to replay it.

## Implementation (phase 1, #164)

Code: `contribution_builder/operation_log.ts` (format, reader, canonical
bytes) and `contribution_builder/contribution_build.ts` (`ContributionBuild`,
`SingleAppLogAdapter`).

- Log document: `{ format: "ehrtslib-cb-oplog", formatVersion: 1, buildId,
  operations }`. Readers reject unknown formats and newer versions. Export as
  RFC 8785 bytes plus sha256 (`exportLogBytes`), so the same log always gives
  the same bytes.
- Phase 1 operations: `create-draft` (carries the template binding, the
  provisional versioned-object uuid and the initial canonical RM JSON, so
  replay does not depend on the instance generator), `set-value`,
  `add-instance`, `remove-instance`, `set-composer`. #167 adds
  `open-version` (a `modify` draft: binding, base version uid, the stored
  data and the short keys given to nodes without a uid), `copiedFrom` on
  `create-draft`, and `record-commit` (version uid, contribution uid,
  change type, lifecycle state and log hash of a successful commit). These
  are additions, so the format version stays 1. The others in the list
  above come with the phases that need them.
- Every operation has `replica`, per-replica `seq`, `author` (from the
  caller's context, overridable per call), `timestamp` and `draft`.
  `replica` + `seq` identifies an operation across replicas.
- Operations target nodes by short key; `root` addresses the draft root.
  `add-instance` positions by sibling anchor (`before` / `after` a short key),
  not by index, so concurrent inserts do not shift each other.
- New keys are recorded in the operation (`keys`, depth-first with object
  members in sorted order), never re-minted on replay.
- No CRDT library is chosen: the single-caller adapter needs none, and the core
  sees only the `OperationLogAdapter` interface (`append`, `operations`).
  The Automerge / Loro spike stays open.

## Consequences

- Undo, playback, per-value author colouring and conflict replay all come
  from one source.
- The log grows with editing activity; compaction must not drop what
  playback and audit need (retention is the caller's policy, see
  [ADR 0005](0005-cb-storage-encryption-policy-neutrality.md)).
- Changing CRDT library later needs a log export/import path; the
  library-independent operation schema makes that possible.

## Alternatives considered

- **Commit discarded drafts to the CDR** as `incomplete` and then
  `abandoned` (`801`), the RM-conformant two-version path (a single first
  commit as `abandoned` is not covered by the RM Common section 6 lifecycle;
  see design section 11.8). Rejected by the maintainer as overkill; the
  log is sufficient.

- **Direct tree mutation in single-caller mode.** Rejected: no playback, and
  two behaviours to test.
- **Operational transformation (OT) with a central server.** Rejected:
  needs a server for every edit and does not suit offline or peer-to-peer
  use.
- **Yjs** (named in the old roadmap). Not excluded, but ranked below
  Automerge and Loro because of history retention.
