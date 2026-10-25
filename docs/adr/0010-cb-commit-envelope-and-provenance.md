# Contribution Builder: commit envelope, log link and builder provenance

Status: proposed (draft for review). The provenance placement is
recommended pending the maintainer's review. Part of the
[Contribution Builder design](../maintainers/contribution-builder-design.md).

## Context

A commit should point to the operation log that produced it, so the session
can be replayed and checked. Because ehrtslib does not bind to one CRDT
library and other implementations may exist, the record should also say
which builder, builder version, log format and CRDT library version
produced it. The RM has no dedicated attribute for either. Candidate places
are `AUDIT_DETAILS.description` (a `DV_TEXT`) and
`FEEDER_AUDIT.originating_system_audit` (`FEEDER_AUDIT_DETAILS`, with
`system_id` and `version_id`).

## Decision

- The commit uses the REST ITS `UPDATE_CONTRIBUTION` with one
  `UPDATE_VERSION` per draft and `UPDATE_AUDIT` audits.
- When the caller provides a log URI, the CB writes it into
  `AUDIT_DETAILS.description` as a `DV_TEXT` whose `hyperlink` (`DV_URI`)
  points to the log, and whose text contains a fixed form
  `oplog sha256:<hex>`.
- **Recommended:** the same description text also records the builder name
  and version, the log format version and the CRDT library name and
  version, in a fixed, parseable form, for example:

  ```
  oplog sha256:9f2c…; builder ehrtslib-cb/0.1.0; log-format cb-oplog/1; crdt loro/1.x
  ```

  Without a log URI the hash and provenance are still written, so the
  commit can be matched to a log stored elsewhere.
- Every commit links the builder log this way. Drafts or items discarded
  before commit are not in the contribution; they appear as `discard`
  operations in the linked log ([ADR 0004](0004-cb-operation-log-and-sync.md)).
  A build where everything is discarded has no commit and no audit; its log
  reaches durable storage only through the optional log sink
  ([ADR 0005](0005-cb-storage-encryption-policy-neutrality.md)).

## Consequences

- Commits stay RM-conformant; no new attributes are needed.
- Tools can find the log, check its hash and choose a compatible replayer.
- Free text is weaker than a structured field; the spec observations
  section notes that a structured field would be cleaner.

## Alternatives considered

- **`FEEDER_AUDIT.originating_system_audit`** (`system_id` = builder,
  `version_id` = builder version). Proposed by the maintainer originally;
  **rejected in this draft, pending review.** In the RM, `FEEDER_AUDIT`
  means the content came from a feeder system, and
  `FEEDER_AUDIT_DETAILS.version_id` is the version of the source
  information item (for example "interim" or "final"), not a software
  version. Builder commits would look like imported data in queries that
  look for feeder content.
- **Commit discarded drafts so the CDR records them** (`incomplete`, then
  `abandoned` (`801`) as a second version; a single first commit as
  `abandoned` is not covered by RM Common section 6, see design section
  11.8). Rejected by the maintainer as overkill; the linked log is
  sufficient.
- **A new attribute or extension.** Rejected for now: needs a spec change,
  which waits until the builder has been implemented and tested.
