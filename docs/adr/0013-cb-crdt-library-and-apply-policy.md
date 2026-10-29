# Contribution Builder: CRDT library and concurrent apply policy

Status: **proposed** (spike #170, 2026-10-27). Research:
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
| Concurrent `set-value` on same path | **Both apply** in sort order (last writer wins on that field); surface optional UI hint, not a CDR-style conflict. |
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
