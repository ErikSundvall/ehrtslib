# Contribution Builder CRDT spike (#170)

Throwaway prototypes comparing [Automerge](https://automerge.org/) and
[Loro](https://loro.dev/) for syncing `ehrtslib-cb-oplog` operations. **Not**
published, not imported by `mod.ts` or `contribution_builder/`.

## Run

From repo root:

```bash
deno run -A spike/crdt/run_scenarios.ts
deno run -A spike/crdt/measure_bundle.ts
```

The first command prints merge + apply-policy outcomes for concurrent scenarios.
The second writes minified bundle sizes under `spike/crdt/.bundle-out/` (gitignored).

## Model

Both prototypes store:

- a map `replica:seq → CbOperation`
- a list of ids for CRDT merge order

Replay for the contribution builder still uses a **deterministic total order**
(`timestamp`, then `replica`, then `seq`) before applying with the proposed
skip-on-error policy in `shared.ts`.

See `docs/spikes/0170-crdt-spike.md` and draft ADR `docs/adr/0013-cb-crdt-library-and-apply-policy.md`.
