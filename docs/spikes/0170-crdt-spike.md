# Spike: CRDT library for Contribution Builder multi-user sync (#170)

Status: **research complete** (2026-10-27). Prototypes live under
[`spike/crdt/`](../../spike/crdt/). Decision draft:
[ADR 0013](../adr/0013-cb-crdt-library-and-apply-policy.md).

## Goal

[Issue #170](https://github.com/ErikSundvall/ehrtslib/issues/170) asks for a
spike before the multi-user CB flavour: carry `CbOperation` records (format
`ehrtslib-cb-oplog` v1, [ADR 0004](../adr/0004-cb-operation-log-and-sync.md))
through a CRDT, compare **Automerge** and **Loro**, and define an **apply
policy** when concurrent operations do not all replay cleanly (today the
single-app core throws `CbOperationError`).

Related context (not implemented here): [#171](https://github.com/ErikSundvall/ehrtslib/issues/171)
(remaining ops), [#173](https://github.com/ErikSundvall/ehrtslib/issues/173)
(per-op constraint check), [#177](https://github.com/ErikSundvall/ehrtslib/issues/177)
(commit locking).

## Architecture choice: sync the log, not the tree

The CB core already defines deterministic state as **replay of the operation
log** onto canonical RM JSON ([`ContributionBuild`](../../contribution_builder/contribution_build.ts),
[`OperationLogAdapter`](../../contribution_builder/contribution_build.ts)).
Multi-user should keep that invariant:

1. CRDT replicas merge **the same `CbOperation` payloads** keyed by
   `replica` + `seq` ([ADR 0003](../adr/0003-cb-identity-and-uids.md)).
2. UI / playback derives a **total order** for replay (see below).
3. `ContributionBuild` replay stays library-independent; only the
   `OperationLogAdapter` implementation changes.

Storing the full composition tree inside the CRDT (Yjs-style shared doc) was
not prototyped: it duplicates the RM model, fights template constraints, and
makes audit playback harder.
Co-editing of free text and presence still work on top of the log; see the
[ADR 0013 amendment](../adr/0013-cb-crdt-library-and-apply-policy.md#amendment-shared-editing-presence-and-group-builds).

### Prototype data model (both libraries)

| Piece | Purpose |
| --- | --- |
| Map `replica:seq → CbOperation` | Idempotent merge of ops from all peers |
| List of ids | CRDT merge order (concurrent inserts) |

Code: [`spike/crdt/automerge_oplog.ts`](../../spike/crdt/automerge_oplog.ts),
[`spike/crdt/loro_oplog.ts`](../../spike/crdt/loro_oplog.ts).

**Total order for replay** (proposed): sort by `timestamp`, then `replica`,
then `seq`. The log format already carries timestamps and replica ids; this
order is deterministic and does not require a central server. CRDT list order
is useful for sync but should not be the sole replay order when duplicates or
interleaving appear after merge (Automerge lists can repeat ids until deduped;
see `dedupeOps` in [`spike/crdt/shared.ts`](../../spike/crdt/shared.ts)).

Template: `test_data/opt14/ehrbase_blood_pressure_simple.de.v0.opt` via
`bindTemplate` (same as CB tests).

## Library comparison

Versions exercised in prototypes: `@automerge/automerge@3.0.0`,
`loro-crdt@1.5.3` (npm imports from `spike/` only — **not** added to root
`deno.json`).

### Runtime: Deno and browser

| | Automerge 3 | Loro 1.5 |
| --- | --- | --- |
| Deno | Works via `npm:@automerge/automerge` (spike scripts run on Deno 2.x) | Works via `npm:loro-crdt` |
| Browser | ESM + WASM ([docs](https://automerge.org/docs/)) | ESM + WASM ([docs](https://www.loro.dev/docs)) |
| WASM required | Yes (`automerge_wasm_bg.wasm`) | Yes (`loro_wasm_bg.wasm`) |
| TypeScript | First-class types in package | Types included; some `any` at container edges |

### Licence and maintenance

| | Automerge | Loro |
| --- | --- | --- |
| Licence | [MIT](https://github.com/automerge/automerge/blob/main/LICENSE) | [MIT](https://github.com/loro-dev/loro/blob/main/LICENSE) |
| Activity | Long-running local-first project; 3.x release line (2024–2026) | Active development; frequent releases ([repo](https://github.com/loro-dev/loro)) |

### WASM and bundle impact (lean-bundle policy)

Per [#201](https://github.com/ErikSundvall/ehrtslib/issues/201), the
contribution builder ships as a **separate** runtime bundle, not in
`ehrtslib-*-core.min.js`. CRDT code must stay in a **further optional**
add-on ([ADR 0012](../adr/0012-cb-add-on-packages-and-patch-formats.md)), not
in `contribution_builder/mod.ts`.

**ehrtslib bundles** (`deno task pack:library`, 0.7.0):

| Bundle | Minified size |
| --- | ---: |
| `ehrtslib-0.7.0-core.min.js` (`mod.ts`) | 1 461 779 bytes (~1.39 MiB) |
| `ehrtslib-0.7.0-contribution.min.js` | 927 838 bytes (~0.89 MiB) |

**CRDT add-on weight** (WASM + JS, bundler artefacts in npm package):

| Package | WASM (bundler) | Notes |
| --- | ---: | --- |
| `@automerge/automerge@3.0.0` | ~2.45 MiB | Plus ~100 KiB JS glue (mjs entry) |
| `loro-crdt@1.5.3` | ~3.10 MiB | Larger WASM; TS API includes movable tree/list |

esbuild single-file browser bundles of the raw npm entry points hit WASM
loader limits in this repo’s pack script; treat WASM sizes above as the
dominant network cost. Either library roughly **doubles the download** of the
CB bundle if shipped in one file.

### Persistence / sync format

| | Automerge | Loro |
| --- | --- | --- |
| On wire / disk | Binary `Automerge.save` / `load` ([storage](https://automerge.org/docs/reference/storage/)) | `doc.export` / `import` snapshot or updates ([export](https://www.loro.dev/docs/api/js#export)) |
| Full history | Yes (design goal) | Yes; configurable [versioning](https://www.loro.dev/docs/concepts/versioning) |
| vs `ehrtslib-cb-oplog` | Canonical JCS log remains source of truth for audit; CRDT bytes are transport | Same |

**Synthetic session** (41 ops: `create-draft` + 40× `set-value` on blood-pressure
template, single replica), from [`spike/crdt/measure_session.ts`](../../spike/crdt/measure_session.ts):

| Encoding | Bytes |
| --- | ---: |
| `ehrtslib-cb-oplog` JCS UTF-8 | 11 495 |
| Automerge snapshot (ops map + list) | 6 780 |
| Loro snapshot | 5 710 |

Binary CRDT snapshots are smaller than canonical JSON for this session because
repeated operation shapes compress; audit and CDR commit still use the
library-independent JCS log.

### Data model fit (composition tree, moves, lists)

| Concern | Assessment |
| --- | --- |
| Operation log | Both libraries handle JSON-like op payloads in a map. |
| List ordering (`add-instance` anchors) | Anchors are **short keys**, not array indices ([ADR 0004](../adr/0004-cb-operation-log-and-sync.md)); CRDT list order does not replace anchor semantics. |
| `move-instance` (#171) | Not in core yet. Loro **MovableList** / tree APIs are a better long-term fit if the team ever mirrors order in the CRDT; for log-sync, `move-instance` remains an op with sibling anchor. |
| Performance at realistic size | Not benchmarked to clinical scale in this spike; Loro publishes [benchmarks](https://www.loro.dev/docs/performance); Automerge documents [performance](https://automerge.org/docs/reference/performance/) for large docs. Replay cost is dominated by CB `ContributionBuild` apply, not CRDT merge. |

### Yjs (brief)

[ADR 0004](../adr/0004-cb-operation-log-and-sync.md) already ranks Yjs below
Automerge/Loro: default [history retention](https://docs.yjs.dev/api/document#gc)
and licensing ([AGPL / commercial](https://github.com/yjs/yjs/blob/main/LICENSE))
are poor fits for full session replay and ehrtslib’s MIT library.

## Concurrent scenario results (prototypes)

Run: `deno run -A spike/crdt/run_scenarios.ts`

| Scenario | Expected policy behaviour |
| --- | --- |
| **conflicting-set-value** | Both ops apply in sort order; second wins on the field (no skip). |
| **remove-vs-edit** | Remove wins if first; edit skipped with `target-removed`. |
| **anchor-removed-during-insert** | `add-instance` with missing anchor → retry without anchor (append) or skip; spike shows key-count validation failures when instance payload is incomplete (needs real `add-instance` keys like production). |
| **move-vs-edit** (simulated remove + set-value) | Order-dependent; policy skips impossible ops. |

Automerge and Loro agree on skip counts when ops are deduped to the same set.

## Apply policy (summary)

Full rules: [ADR 0013](../adr/0013-cb-crdt-library-and-apply-policy.md).
Prototype implementation: `replayWithPolicy` in
[`spike/crdt/shared.ts`](../../spike/crdt/shared.ts).

## Recommendation (for Erik)

**Adopt Automerge 3 for the first `OperationLogAdapter` CRDT implementation**,
as an **optional add-on package** (not a dependency of `contribution_builder`
or core bundles).

Rationale:

- **Smaller WASM** (~2.45 MiB vs ~3.1 MiB) for the same “sync the op map” model.
- **Mature** local-first sync story and MIT licence align with ADR 0004.
- CB replay already owns tree semantics; Loro’s movable tree is valuable but
  not required for log replication.

**Keep Loro as the documented alternative** if profiling shows merge/replay
bottlenecks or if `move-instance` work (#171) moves to CRDT-backed ordering.

**Open questions**

1. Should total order use **wall-clock `timestamp`** (clock skew) or a Lamport
   counter stored in each op?
2. Should skipped concurrent ops surface as **ephemeral UI conflicts** only, or
   also append `conflict-record` ops to the log?
3. Export path if the CRDT library changes: re-export sorted `ehrtslib-cb-oplog`
   from `byId` map (already library-independent).

## Primary sources

- [Automerge documentation](https://automerge.org/docs/)
- [Automerge GitHub](https://github.com/automerge/automerge)
- [Loro documentation](https://www.loro.dev/docs)
- [Loro GitHub](https://github.com/loro-dev/loro)
- [Yjs documentation](https://docs.yjs.dev/)
- ehrtslib [Contribution Builder design](../maintainers/contribution-builder-design.md),
  ADRs [0004](../adr/0004-cb-operation-log-and-sync.md),
  [0007](../adr/0007-cb-template-binding.md),
  [0008](../adr/0008-cb-validation-and-lifecycle.md),
  [0009](../adr/0009-cb-conflicts-and-rebase.md)
