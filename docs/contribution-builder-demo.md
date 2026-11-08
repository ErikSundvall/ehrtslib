# Contribution Builder demo

[Open the Contribution Builder page](https://eriksundvall.github.io/ehrtslib/demo/contribution-builder.html)
from the format converter's **Contribution Builder** navigation link. Both pages
belong to the existing demo app. Library verbs, the canonical model, and worked
sketches are in the [user overview](contribution-builder.md).

## Try it

1. Start with two independent clones of one Automerge-backed build. The initial
   links illustrate office LAN and rural phone. Add more clones as needed; each
   receives a suggested, editable clinical username and its own randomised
   range.
2. Change BP, pulse, SpO₂ or the short diagnosis heading. These whole-value
   edits apply on change, carrying the revision captured on focus. A stale write
   is rejected; blur shows the current value. Try editing the same field in both
   panes before the rural link delivers.
3. Type into the long diagnosis narrative in both panes. Unicode-aware splices
   go to native Automerge text. Sender and receiver each add a random delay from
   their own link range. **Sync all now** explicitly bypasses those delays.
4. Expand the small operation-log pane. Select the clone's view to inspect
   authored operations, revision references and eventual convergence. Per-clone
   diagnostics expose full validation and skipped concurrent operations.
5. **Commit → new tab** opens a unique tab containing the validated REST ITS
   `NewContribution` body, a JSON download link, and the compacted audit-log
   download matching its hash. Keep or close it. Preview makes no POST and does
   not lock or compact the live build. Delayed remote edits may not yet be in
   that clone's preview: sync first for a common view.

## What is hand-coded / reused

The form, selected WT paths, DOM/caret handling, delay scheduler, in-page
`MessageChannel.postMessage` hub and output tab are hand-coded. The real theme
pack OPT/WT are bundled locally with
[provenance](../examples/demo-app/public/contribution-builder/README.md). The
theme pack has no general notes field: the long field is the diagnosis DV_TEXT,
with an editable `EVALUATION.name` heading.

The library supplies template binding, RM generation, stable node keys,
validation, append-only operations, `rev` checks, `createMultiCaller`,
`mergeCaller`, native text reconciliation, compaction, provenance and the REST
commit body/adapter. Output preparation uses a disposable clone: compaction
never replaces the live Automerge history. The page includes a revision-safe
compaction fix for the multi-caller commit path (ADR 0013).

Automerge's pinned browser entry embeds WASM; it is loaded only on this page,
not by the converter. Both pages still use the same package and build command.

## Optional test CDR

Expand **Commit destination**, opt into POST, and supply the REST ITS base URL,
existing EHR ID and CDR system ID. Upload the bundled OPT to the CDR first.
Authentication must be handled by your test reverse proxy; CORS must permit the
browser request. No credentials are stored or collected by this demo.

Sending requires idle links, full validation and an explicit confirmation. The
unique output tab shows the exact body posted. Only a successful POST appends
`record-commit`; a failed request leaves the build editable. A successful CDR
commit locks the demonstration build; reload to start another. There is no
server-free guarantee of distributed commit locking beyond this one page.

## Boundaries

Use synthetic data only. There is no persistence, cross-machine sync/link/QR,
Pencil-in pipeline, HTMX add-on, GraphQL or presence cursors. Reload discards
the session. Text revision/caret transforms are educational, not a production
editor.

Design references: [core model](adr/0002-cb-core-model-and-scope.md),
[operation log](adr/0004-cb-operation-log-and-sync.md),
[validation](adr/0008-cb-validation-and-lifecycle.md),
[commit](adr/0010-cb-commit-envelope-and-provenance.md),
[Automerge policy](adr/0013-cb-crdt-library-and-apply-policy.md). Implements
[#281](https://github.com/ErikSundvall/ehrtslib/issues/281).
