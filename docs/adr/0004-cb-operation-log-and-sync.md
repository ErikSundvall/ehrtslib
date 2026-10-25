# Contribution Builder: one operation log, CRDT sync, session playback

Status: proposed (draft for review). Part of the
[Contribution Builder design](../maintainers/contribution-builder-design.md).

## Context

Multi-user editing needs a change log that merges. Auditors want to see how
a commit was produced. Conflict handling needs to re-apply local changes to
a newer base. If single-app editing mutated the tree directly, these
features would only exist in the multi-user flavour and the two would
behave differently.

## Decision

- Every change, also in the single-app flavour, is an operation in one
  append-only log. Initial operation set: `set-value`, `add-instance`,
  `remove-instance`, `move-instance`, `assign-uid`, `set-composer`,
  `set-participation`, `set-lifecycle`, `bind-template`, `migrate-template`
  and `import` (adapter input such as FLAT, recorded as operations).
- Each operation records author, timestamp and replica, and targets a node
  uid ([ADR 0003](0003-cb-identity-and-uids.md)), not a path.
- Single-app applies operations directly. Multi-user synchronises the same
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

## Consequences

- Undo, playback, per-value author colouring and conflict replay all come
  from one source.
- The log grows with editing activity; compaction must not drop what
  playback and audit need (retention is the caller's policy, see
  [ADR 0005](0005-cb-storage-encryption-policy-neutrality.md)).
- Changing CRDT library later needs a log export/import path; the
  library-independent operation schema makes that possible.

## Alternatives considered

- **Direct tree mutation in single-app mode.** Rejected: no playback, and
  two behaviours to test.
- **Operational transformation (OT) with a central server.** Rejected:
  needs a server for every edit and does not suit offline or peer-to-peer
  use.
- **Yjs** (named in the old roadmap). Not excluded, but ranked below
  Automerge and Loro because of history retention.
