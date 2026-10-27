# Contribution Builder: commit envelope, log link and provenance in FEEDER_AUDIT

Status: proposed (draft for review). Provenance in `FEEDER_AUDIT` decided by
the maintainer; no `original_content` log reference (decided 2026-10-25). Part of the
[Contribution Builder design](../maintainers/contribution-builder-design.md).

## Context

A commit should point to the operation log that produced it, so the session
can be replayed and checked. Because ehrtslib does not bind to one CRDT
library and other implementations may exist, the record should also say
what created the content (form, renderer) and that it passed through the
builder (builder version, log format, CRDT library version).

The RM (Common, archetyped package) offers:

- `LOCATABLE.feeder_audit: FEEDER_AUDIT` (optional), on every locatable,
  so on each committed top-level item such as a `COMPOSITION`.
- `FEEDER_AUDIT`: `originating_system_audit: FEEDER_AUDIT_DETAILS`
  (mandatory), `feeder_system_audit: FEEDER_AUDIT_DETAILS` (optional),
  `originating_system_item_ids` and `feeder_system_item_ids`
  (`List<DV_IDENTIFIER>`, 0..*), `original_content: DV_ENCAPSULATED`
  (optional).
- `FEEDER_AUDIT_DETAILS`: `system_id: String` (mandatory, the IT system
  owned by the organisation legally responsible for the data), `location:
  PARTY_IDENTIFIED`, `subject: PARTY_PROXY`, `provider: PARTY_IDENTIFIED`,
  `time: DV_DATE_TIME`, `version_id: String` (the item's version in that
  system, for example "interim" or "final"), `other_details:
  ITEM_STRUCTURE` (custom metadata, may be archetyped). All optional except
  `system_id`.

## Decision

- The commit uses the REST ITS `NewContribution` request body with
  one `UPDATE_VERSION` per draft and `UPDATE_AUDIT` audits. Checked against
  the ITS-REST OpenAPI (`ehr-validation.openapi.yaml`, master 2026-10-10):
  `NewContribution` has `versions` and `audit` (required) and optional
  `uid`; `UPDATE_VERSION` has `lifecycle_state`, `data` and `commit_audit`
  (required) and optional `preceding_version_uid`, `signature` and
  `attestations`; `UPDATE_AUDIT` has `change_type` and `committer`
  (required) and optional `description` and `system_id`. The server sets
  `time_committed`.
- **Log link in the contribution audit (unchanged).** Every commit writes
  `AUDIT_DETAILS.description` as a `DV_TEXT` whose text contains
  `oplog sha256:<hex>` and, when the caller provides a log URI, whose
  `hyperlink` (`DV_URI`) points to the log. Drafts or items discarded
  before commit appear as `discard` operations in that linked log
  ([ADR 0004](0004-cb-operation-log-and-sync.md)); a build where everything
  is discarded has no commit and reaches durable storage only through the
  optional log sink ([ADR 0005](0005-cb-storage-encryption-policy-neutrality.md)).
- **Provenance in `FEEDER_AUDIT`** on each committed top-level item (the
  `COMPOSITION`, `EHR_STATUS`, `FOLDER` or `PARTY` that is the version's
  `data`):
  - `originating_system_audit` describes what actually created the
    content. **It is the caller's responsibility** and is passed into the
    builder. `system_id` is the organisation's IT system identifier; form
    name, form version and renderer (name and version) go in
    `other_details`.
  - `feeder_system_audit` records that the content ran through the
    builder. The builder always sets it: `system_id` = the deploying
    organisation's system id from config, following the RM definition
    (decided by Erik, 2026-10-25); `other_details` holds the builder name
    (`ehrtslib-contribution-builder`, or another builder implementation's
    name), the builder version (one value:
    the ehrtslib release, which also fixes the CB version), the log format
    version and the CRDT library name and version. Decided by Erik
    (2026-10-25): the builder version must be readable from the committed
    version or its content; this location satisfies that.
  - If the caller provides no `originating_system_audit`, the builder emits
    a warning (silenced by a config flag) and still sets
    `feeder_system_audit`. Because `originating_system_audit` is mandatory
    in `FEEDER_AUDIT`, the builder then fills it with a minimal placeholder
    (`system_id` from config, or the builder id) so the RM object is valid. Decided
    by Erik (2026-10-25).
- `FEEDER_AUDIT.original_content` is not set by the builder. Decided by
  Erik (2026-10-25): the log link and hash in the contribution audit are
  enough.
- Future work: a small archetype for these `other_details` structures
  (form, renderer, builder, log format, CRDT library) would make the
  pattern clearer and queryable across systems.

## Consequences

- Commits stay RM-conformant; no new attributes are needed.
- Provenance sits on the committed data itself, so it survives export of a
  single composition, and the log is still found via the contribution.
- Tools can find the log, check its hash and choose a compatible replayer
  from the `feeder_system_audit` details.
- **Accepted by the maintainer:** the RM frames `FEEDER_AUDIT` as describing
  content from feeder systems (imported or converted data). Queries that
  filter on the presence of `feeder_audit` to find "imported" data will
  also match builder commits. Such queries should instead test the
  builder name in `feeder_system_audit/other_details`. See design section 11.6.
- Until the `other_details` archetype exists, the structures are
  builder-defined and must be documented with the builder.
- The log link in `AUDIT_DETAILS.description` is still free text; design
  section 11.7 notes that a structured field would be cleaner.

## Alternatives considered

- **Everything in `AUDIT_DETAILS.description`** (log link, hash, builder
  name and version, log format and CRDT library version in one parseable
  text). The previous recommendation of this ADR; now **rejected as the
  primary place** for provenance. The description keeps only the log link
  and hash. Text is not queryable in a structured way and sits on the
  contribution rather than on the content.
- **Builder version in `FEEDER_AUDIT_DETAILS.version_id`.** Not used: in
  the RM `version_id` is the version of the information item in that
  system, not a software version, so software versions go in
  `other_details`.
- **Builder as `originating_system_audit`.** Rejected: the builder does not
  create the content; the form or app the caller uses does.
- **Commit discarded drafts so the CDR records them** (`incomplete`, then
  `abandoned` (`801`) as a second version; a single first commit as
  `abandoned` is not covered by RM Common section 6, see design section
  11.8). Rejected by the maintainer as overkill; the linked log is
  sufficient.
- **A new attribute or extension.** Rejected for now: needs a spec change,
  which waits until the builder has been implemented and tested.

## Implementation (phase 1, #166)

Code: `contribution_builder/commit.ts` (`prepareContribution`,
`feederAuditFor`, `builderProvenance`), `contribution_builder/adl14_downconvert.ts`
(`downConvertToAdl14`) and `contribution_builder/rest_adapter.ts`
(`ItsRestContributionAdapter`).

- **Checks before any request.** A missing committer or composer is a
  `CommitError` (`missing-committer`, `missing-composer`). Each draft is
  validated in the requested mode (ADR 0008) and an invalid one is
  `invalid-draft`. The adapter runs all of these before it sends anything.
- **Envelope.** `{ versions, audit }`. Each version has `lifecycle_state`
  (532 or 553 from the mode), its own `commit_audit` with `change_type`
  (`creation` for a new COMPOSITION) and `data`. The contribution audit's
  `change_type` is the versions' common change type (`modification` when
  they differ). `UPDATE_VERSION` and `UPDATE_AUDIT` are sent without
  `_type`, which the REST ITS says servers should accept; at least one
  server rejects these names as unknown RM types. `UPDATE_AUDIT.system_id`
  is set only when `CommitConfig.auditSystemId` is configured (some servers
  require it, contrary to the REST ITS).
- **Log link.** `audit.description` is a `DV_TEXT` `oplog sha256:<hex>`
  (sha256 of the RFC 8785 log bytes), with `hyperlink` when `logUri` is
  given.
- **FEEDER_AUDIT** on each COMPOSITION:
  `originating_system_audit` from the caller, or the placeholder
  `{ system_id: config.systemId }` and a warning
  (`silenceMissingOriginatingAudit` turns it off);
  `feeder_system_audit.system_id = config.systemId`; `other_details` is an
  `ITEM_TREE` (`archetype_node_id` `at0000`/`id1`, name
  "contribution builder") with `ELEMENT`s *builder name*, *builder version*
  (`EHRTSLIB_VERSION`, kept equal to `deno.json` by the release script),
  *log format*, *log format version* and *CRDT library* (`none` for the
  single-app adapter). No `original_content`.
- **Version uid.** The root gets
  `<provisional object uuid>::<creating system id>::1`; the adapter reads the
  creating system id from `EHR.system_id`. The provisional uuid is the one
  inner node uids already use, so no uid rewrite is needed when the server
  keeps the sent uid. A server that assigns its own uuid is detected
  (`serverAssignedUids`, with a warning): inner uids then keep the
  provisional prefix.
- **ADL 1.4 down-conversion** (default `codes: "adl14"`): node ids
  (`id5` → `at0004`), `local` value codes (`at10` → `at0009`) and
  `archetype_details.template_id`. For a binding from an OPT 1.4 XML this
  is the exact inverse of the up-conversion. For ADL2-native templates,
  pass the OPT 1.4 exporter's code map and template id; otherwise the plain
  shift is used and a warning is returned.
- **Commit-time fixes to the data.** `archetype_details` is added to inner
  archetype roots that lack it (RM `Is_archetype_root`), and `EVENT.offset`
  (an RM function, not stored) is removed.
- **Adapter.** `POST {base}/ehr/{ehr_id}/contribution` with
  `Prefer: return=representation`; `fetch` and extra headers are
  injectable. `getComposition` and `getContribution` read back.
- Integration tests (`commit_cdr.integration.test.ts`) run only when
  `EHRTSLIB_CDR_TARGETS` lists target servers.
