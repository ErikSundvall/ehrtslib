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
| Concurrent `set-value` on same path | Between replicas merged in the CRDT (native path): **both apply** in sort order (last writer wins on that field); surface optional UI hint, not a CDR-style conflict. A `set-value` sent with a stale base `rev` is **not** applied; see text sync levels in the amendment. |
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

### Text sync levels

Free-text leaves (`DV_TEXT.value`, `DV_PARSABLE.value`) sync at one of
three levels. Only levels 1 and 2 are candidates for normative spec text.

1. **Baseline (required): whole value with a base `rev`.** A `set-value`
   carries the opaque log position (`rev`) the client last saw. If someone
   else changed the field since that `rev`, the change is **not** applied
   as last writer wins: the response returns the current value with a
   `changed-by-someone-else` status so the client can show it. Silently
   overwriting a free-text clinical note is data loss. Last writer wins
   remains only for concurrent operations that replicas merge inside the
   CRDT (level 3) per the apply policy above.
2. **Neutral text op (optional standard fallback).** A text op (name
   provisional, `edit-text`) targets the leaf by node uid ([ADR
   0003](0003-cb-identity-and-uids.md)) and carries plain splices
   `{at, delete, insert, rev}`. Positions count Unicode code points and
   never split a surrogate pair; JavaScript and Automerge count UTF-16
   code units, so implementations convert. The node holding the build
   orders splices and transforms them onto the current text (central-server
   OT), so simple clients need no CRDT library.
3. **Native profiles (optional, registered names only),** for example
   `automerge-3`. Replicas that announce the same engine sync that field
   with the engine's own protocol. In ehrtslib each free-text leaf is
   backed by an Automerge 3 text object: a CRDT island inside one leaf,
   not a CRDT of the whole tree.

- **Announced up front.** Each member announces the levels and native
  profiles it supports when it joins, like `data-cb-api` in [ADR
  0014](0014-cb-htmx-add-on-and-editable-zipehr-html5.md).
- **Chosen per connection, not per session.** Same-engine peers keep
  native sync. The hub bridges: it translates their changes into neutral
  splices or whole values for clients that speak only level 1 or 2, so one
  simple client does not degrade the session.
- **Same result on every path.** Whichever level carried an edit, the
  compacted log and the committed RM content come out identical.

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

### Validation state during editing

- A build is often invalid while it is being edited; that is normal.
  Edits are never rejected for template reasons. Template validation only
  gates commit to the CDR, in the complete or incomplete mode of [ADR
  0008](0008-cb-validation-and-lifecycle.md).
- **Derived, not synced.** Validation status follows from the log plus
  the bound template. It is not sent over the presence channel and is
  never logged. Validation is always done by a Contribution Builder
  instance, never by the app or form UI on top; the UI only reads the
  builder's status (per-node status plus build summary) and shows markers.
  In `zipehr.html5-hx`
  ([ADR 0014](0014-cb-htmx-add-on-and-editable-zipehr-html5.md)) these are
  the existing quick-check fragments plus a build-level summary.
- **Hub topology.** A node that runs a Contribution Builder locally
  (offline work or instant feedback) validates after each merge, but its
  status is a **preview**. The hub's Contribution Builder is authoritative
  for the session, and its answer replaces the local one on sync. Nodes
  without a local builder (htmx, sync levels 1 and 2) get the hub
  builder's status as a derived view tagged with the `rev` it was computed
  at and the validator id and version. Local and hub builders agree only
  when they run the same validator version, which is why the version tag
  matters; on disagreement the hub's status wins.
- **Peer-to-peer topology** (for example Automerge without a hub). All or
  most peers run a Contribution Builder and validate the same log against
  the same template, so peers with the same validator version agree with
  no validation traffic. The build metadata records the expected validator
  id and version; a peer running a different version marks its status as
  a preview. Without a hub, the committing peer's builder gives the
  authoritative answer at commit time.
- **Per-node status:**
  - `unfinished`: a mandatory node is missing or empty (ADR 0008 `kind:
    missing`). Expected while editing; shown as a quiet marker.
  - `invalid`: a value is present but violates a constraint such as a
    range, pattern or code list.

  `changed-by-someone-else` (text sync level 1) is a separate field, not
  a validation status.
- **Build summary.** It states whether the build can commit now as
  complete or as incomplete, so a commit button can say why it is
  disabled. Incomplete mode follows the RM rule for `553|incomplete|`
  (RM Common: data may be missing, but it may not be wrong): `unfinished`
  nodes are allowed, `invalid` ones are not, and RM-level required content
  (composer, `ENTRY.subject`) still fails as in ADR 0008. CDRs differ
  today, so the summary reports the target CDR's own behaviour separately
  when it is stricter or looser.
- **Advisory only.** In every topology the status is advice; the CDR
  decides at commit.

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
  0010](0010-cb-commit-envelope-and-provenance.md)), text edits at any level are compacted
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

1. **Text sync details** (wire shape resolved above: code-point splices,
   central-server OT): exact payload of the `changed-by-someone-else`
   response, how a level 2 client rebases pending splices after a
   transform, and who keeps the registry of native profile names.
2. **Compaction granularity:** per author and field only, or also per
   author turn when several authors interleave in one field? Which
   compacted op carries the merged final value?
3. **Membership operation names and payload** (`join-build`,
   `leave-build`, `set-role`?), and whether `committer` implies `editor`.
4. **Presence and access logging:** should the builder emit a hook when a
   member first receives presence or content for a build, so deployments
   can log it as EHR access?
5. **Validation message codes:** a standard code set in the openEHR support
   terminology for validation messages (`unfinished` and `invalid`, with
   severity, mappable to FHIR `OperationOutcome` severities), so thin
   clients from different vendors show the same markers?
