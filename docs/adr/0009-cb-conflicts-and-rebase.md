# Contribution Builder: conflict detection and rebase by replay

Status: proposed (draft for review). Part of the
[Contribution Builder design](../maintainers/contribution-builder-design.md).

## Context

A `modify` draft starts from a committed version. If another client commits
a newer version first, the draft's `preceding_version_uid` is no longer the
latest and the CDR rejects the commit. The REST ITS contribution endpoint
does not say which status code that gives (it has no `If-Match`), so servers
may answer 412, 409, 400 or 422. Silently overwriting would lose clinical
data. Other clients may also drop inner uids
([ADR 0003](0003-cb-identity-and-uids.md)), so the newer version may not
carry the ids the local log refers to.

## Decision

- The CB never overwrites silently.
- Conflict detection does not depend on the status code. On any failed
  commit (any status other than 201) the CB re-reads the latest version of
  each versioned object the contribution modifies. It is a conflict if that
  version is no longer the draft's base version. The status code is kept
  only as a hint. A failure where every base is still the latest is a plain
  error, not a conflict.
- On a conflict it replays the local log onto the latest version,
  matching targets by uid.
- Where a uid is missing on the newer version, it falls back to matching by
  archetype path (and name or position where needed). Every match found this
  way is marked as guessed and shown for review.
- The CB returns conflicts as structured data. Each conflict has: the local
  operation, their current value, the base value, and how the target was
  matched (`uid`, `path`, `none`).
- The caller sends back a list of resolutions (keep ours, keep theirs,
  custom value, drop operation). The CB applies them as new operations in
  the log, then retries the commit with the new `preceding_version_uid`.
- The resolver user interface is a separate project (see roadmap).

## Consequences

- No lost updates; every resolution is in the log and can be replayed.
- Apps can build their own resolver UI, or use the planned one.
- Path fallback can mismatch repeated instances, which is why guessed
  matches always need review.

## Alternatives considered

- **Last writer wins.** Rejected: loses data.
- **Fail and ask the user to start over.** Rejected: loses work.
- **Three-way tree merge without the log.** Rejected: less precise than
  replaying intent, and loses authorship.

## Implementation (phase 1, #167)

Phase 1 implements detection and conflict data. Resolutions and the retry
come later (#177).

- **Base version.** `ContributionBuild.openVersion(template, stored)`
  (`update-version`) starts a `modify` draft from a stored version. The
  root uid becomes the draft's `baseVersionUid` and is removed from the
  data. Inner uids are kept. LOCATABLE nodes without a uid get new short
  keys, recorded in the `open-version` operation, so replay is
  deterministic. Commit sends `change_type` 251 (modification),
  `preceding_version_uid` = base, and a version uid with the trunk number
  incremented. `copyVersion` (`copy-version`) starts a new versioned object
  with fresh uids (`change_type` 249) and records `copiedFrom`.
- **Detection.** `ItsRestContributionAdapter.commit` catches any failed
  POST. For each `modify` draft it reads
  `GET /ehr/{ehr_id}/composition/{versioned_object_uuid}` (the latest
  version) and calls `detectConflicts`. If any draft's base is no longer
  the latest, it throws `CommitConflictError` with one `ConflictReport` per
  such draft; otherwise it rethrows the original error.
- **Conflict data.** `detectConflicts(build, draftId, latest)` returns
  `undefined` when `latest` is the base. Otherwise it compares base, theirs
  and ours for each local operation: `set-value` and `set-composer` by
  value, `remove-instance` by subtree, `add-instance` by parent. Each
  `DraftConflict` carries the operation, its target, the match (`uid`,
  `path`, `none`), the reason (`changed-by-them`, `target-removed`,
  `parent-removed`), the path, and the base, their and our values.
  Operations that do not touch changed data are listed as `clean`. Nodes
  are matched by uid, then by archetype path plus ordinal among siblings
  (`path`, guessed). Archetype details, feeder audit and `EVENT.offset` are
  ignored when comparing.
- **Commit record.** On success the adapter appends a `record-commit`
  operation (version uid, contribution uid, change type, lifecycle state,
  log hash). A committed draft accepts no further operations, and a second
  commit of it fails with `already-committed`. Further edits start a new
  `update-version` from the committed version.
- Integration tests run a concurrent update against real CDRs and check the
  conflict data.
