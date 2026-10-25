# Contribution Builder: conflict detection and rebase by replay

Status: proposed (draft for review). Part of the
[Contribution Builder design](../maintainers/contribution-builder-design.md).

## Context

A `modify` draft starts from a committed version. If another client commits
a newer version first, the CDR answers the commit with HTTP 412 because
`preceding_version_uid` is no longer the latest. Silently overwriting would
lose clinical data. Other clients may also drop inner uids
([ADR 0003](0003-cb-identity-and-uids.md)), so the newer version may not
carry the ids the local log refers to.

## Decision

- The CB never overwrites silently.
- On 412 it fetches the latest version and replays the local log onto it,
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
