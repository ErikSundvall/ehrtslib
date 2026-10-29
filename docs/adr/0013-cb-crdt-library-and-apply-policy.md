# Contribution Builder: CRDT library and concurrent apply policy

Status: **proposed** (spike #170, 2026-10-27; amended 2026-10-29 with
shared editing, presence and group builds, see the
[amendment](#amendment-shared-editing-presence-and-group-builds)). Research:
[docs/spikes/0170-crdt-spike.md](../spikes/0170-crdt-spike.md).

## Context

[ADR 0004](0004-cb-operation-log-and-sync.md) requires a multi-user flavour that
syncs the same `CbOperation` log through a CRDT, without choosing a library in
phase 1. The single-app core applies operations strictly: failures throw
`CbOperationError` and nothing is appended. Concurrent replicas must merge
without aborting the whole session.

Related: [ADR 0009](0009-cb-conflicts-and-rebase.md) (CDR rebase conflicts),
[ADR 0008](0008-cb-validation-and-lifecycle.md) (validation timing, #173),
commit locking ([#177](https://github.com/ErikSundvall/ehrtslib/issues/177)).

## Decision (spike outcome)

### CRDT library

- **Recommend Automerge 3** (`@automerge/automerge`) for the first CRDT-backed
  `OperationLogAdapter`, shipped only in an **optional add-on** ([ADR
  0012](0012-cb-add-on-packages-and-patch-formats.md)), not as a dependency of
  `contribution_builder` or `mod.ts`.
- **Loro** remains the fallback candidate (movable list/tree, performance); see
  the spike comparison.
- **Do not use Yjs** as the default (history retention and licence; ADR 0004).

### What the CRDT stores

- A map of operations keyed by `replica:seq` (see [ADR
  0003](0003-cb-identity-and-uids.md)).
- Optional CRDT list of ids for merge; **replay order** is defined separately
  (below).

The canonical audit format stays **`ehrtslib-cb-oplog` v1** (JCS); CRDT binary
is transport between replicas.

### Total order for replay

After merge, sort operations by:

1. `timestamp` (ISO 8601 string, lexicographic),
2. `replica` (lexicographic),
3. `seq` (numeric).

Dedupe by `replica:seq` before sorting. Document clock skew as a known
limitation; a future op field may add a Lamport or hybrid logical clock.

### Concurrent apply policy

When replaying the merged log, the multi-user adapter **does not throw** on a
single bad operation. It:

| Case | Behaviour |
| --- | --- |
| `set-value` / `set-composer` on removed node | **Skip**; record conflict (`target-removed`, match `none`). |
| `remove-instance` on missing node | **Skip**; `target-removed`. |
| `add-instance` with missing sibling anchor | **Retry once** without `before`/`after` (append to parent attribute); record `anchor-missing-appended` with the original op. If still failing, **skip** (`parent-removed`). |
| Concurrent `set-value` on same path | **Both apply** in sort order (last writer wins on that field); surface optional UI hint, not a CDR-style conflict. Free-text leaves use the text op instead (see the amendment). |
| `remove-instance` vs edit on same node | Order-dependent; loser **skipped** with `target-removed` or `changed-by-peer`. |
| `move-instance` (#171) | Same as remove/reparent vs edit: if target not attached when op runs, **skip** and record conflict. |
| Ops after `record-commit` on that draft | **Skip** (`already-committed`); aligns with [#177](https://github.com/ErikSundvall/ehrtslib/issues/177). |
| Template constraint violation (#173) | **Do not** block merge. Run quick/full validation after apply; problems attach to node uids per ADR 0008. Invalid state may persist until the user fixes or discards. |

Skipped operations are exposed as structured data modelled on [ADR
0009](0009-cb-conflicts-and-rebase.md) `DraftConflict` (`operation`, `reason`,
`match`, optional values), but tagged as **concurrent-replay** (not CDR
rebase). Resolutions are new operations appended on a single replica (future
work).

### Interaction with CDR conflicts (ADR 0009)

- **Concurrent replica replay** (this ADR): merged op log, skip-on-fail.
- **Stale base at commit**: unchanged — `detectConflicts` after failed POST,
  resolver UI, new ops, retry with new `preceding_version_uid`.

## Consequences

- Multi-user sessions can diverge in tree state until skips are resolved; the
  log remains complete for audit.
- Automerge WASM (~2.5 MiB) is an explicit opt-in download.
- Changing CRDT vendor later: export `operations` from the map + sort; JCS log
  unchanged.

## Alternatives considered

- **CRDT mirrors the RM tree** — rejected in spike (duplicate model, harder
  validation).
- **Fail entire replay on first `CbOperationError`** — rejected (#170).
- **Loro as first ship** — viable; deferred due to larger WASM and equivalent
  log-sync prototype.

## Implementation

Not in scope for #170. Prototypes only: [`spike/crdt/`](../../spike/crdt/).

## Amendment: shared editing, presence and group builds

Added 2026-10-29. Syncing the operation log instead of the RM tree still
allows Google Docs-style co-editing: who edits where, and several people
typing in one free-text field. The tree stays derived from the log, so
template validation and audit replay are unchanged.

### Text op for free-text leaves

- The default stays **last writer wins per field** for concurrent
  `set-value`, as in the apply policy above.
- Free-text leaves (`DV_TEXT.value`, `DV_PARSABLE.value`) also accept a
  **text op** (name provisional, `edit-text`) that targets the leaf by
  node uid ([ADR 0003](0003-cb-identity-and-uids.md)) and carries
  character-level inserts and deletes. Concurrent typing merges character
  by character instead of one edit replacing the other.
- In ehrtslib each such leaf is backed by an **Automerge 3 text object**:
  a CRDT island inside one leaf, not a CRDT of the whole tree. Replay
  writes the merged text into the leaf like any other value.
- Other implementations may use OT or another CRDT for the same field.
  Only the **shape of the text op** has to interoperate; the merge
  engine does not.

### Presence

- Presence (cursor and selection, focused node, who) is an **ephemeral
  channel** over the same sync link, as [ADR
  0004](0004-cb-operation-log-and-sync.md) already states. It is never
  written to the operation log or the commit. ehrtslib uses Automerge
  ephemeral messages for it.
- Presence still shows who is looking at which patient. It is sent **only
  to build members**, over the access-controlled channel. Whether presence
  counts as EHR access for access logging is deployment policy.
- The `zipehr.html5-hx` view ([ADR 0014](0014-cb-htmx-add-on-and-editable-zipehr-html5.md),
  [#212](https://github.com/ErikSundvall/ehrtslib/pull/212)) may render it,
  for example as markers on each field.

### Group builds

- **Build identity.** A shared build has its own id under the EHR (the
  log's `buildId`) with **members and roles**: `editor`, `viewer`,
  `committer`. The 2013 design ([BMC Med Inform Decis Mak
  13:57](https://doi.org/10.1186/1472-6947-13-57)) keyed builds per
  committer (`/cb/{committer_id}/{ehr_id}/{cb-id}`). A build is no longer
  personal, but it can be restricted to a group of collaborating users,
  for example the emergency-ward team treating one patient.
- **Membership is logged.** Joining, leaving and role changes are
  operations in the log, and a member's replica prefix is assigned when
  it joins. A shift handover is a membership change, not a copy of the
  build.
- **Narrowing only.** Build membership can only narrow what the
  deployment's EHR access policy allows. It never grants EHR access.

### Compaction and attribution at commit

- **Compaction before hashing.** A keystroke-level log keeps text that was
  typed and then deleted, which can be sensitive. Before the commit audit
  links to and hashes the log ([ADR
  0010](0010-cb-commit-envelope-and-provenance.md)), text ops are compacted
  to **one `set-value` per author and field**, and the compacted log still
  replays to the same canonical RM JSON. Keeping a finer-grained log needs
  its own retention rule ([ADR
  0005](0005-cb-storage-encryption-policy-neutrality.md)).
- **Attribution.** One member commits, with the composer chosen explicitly
  (`set-composer`, [ADR 0006](0006-cb-attribution-and-composer.md)). Every
  member who changed content goes into `other_participations`. The RM
  cannot attribute individual text spans; that detail lives only in the
  compacted log.

### Open questions (amendment)

1. **Text-op wire shape:** index-based splices, or positions anchored to
   character ids so that the op is engine-independent? Which form must
   interoperate?
2. **Compaction granularity:** per author and field only, or also per
   author turn when several authors interleave in one field? Which
   compacted op carries the merged final value?
3. **Membership operation names and payload** (`join-build`,
   `leave-build`, `set-role`?), and whether `committer` implies `editor`.
4. **Presence and access logging:** should the builder emit a hook when a
   member first receives presence or content for a build, so deployments
   can log it as EHR access?
