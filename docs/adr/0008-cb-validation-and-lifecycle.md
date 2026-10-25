# Contribution Builder: when validation runs; complete and incomplete modes

Status: proposed (draft for review). Part of the
[Contribution Builder design](../maintainers/contribution-builder-design.md).

## Context

Users need feedback while they type, but a full validation of a large
composition after every keystroke is too slow. openEHR versions have a
lifecycle state: `complete` (532) and `incomplete` (553). How far an
incomplete version may break template constraints is not stated
consistently: the RM versioning text and the Conformance specification
(CNF) section 8 differ. CDRs differ too: EHRbase 2.36 rejects an incomplete
version that is missing mandatory content (ehrbase#1630), while FerroEHR
5.4.1 accepts it.

## Decision

- After each operation the CB runs a quick constraint check on the changed
  nodes (value types, ranges, code lists, patterns).
- The full check (existence, cardinality, occurrences, invariants and
  lifecycle rules) runs on an explicit `validate` call and always just
  before `commit`.
- Results are attached to nodes by uid so a UI can show each one next to
  the right field.
- Two modes:
  - **complete**: all template constraints apply.
  - **incomplete**: existence and cardinality lower bounds count as zero,
    but content that is present must be valid. The result also lists the
    missing required fields.
- The CB reports, per target CDR profile, when that CDR is known to reject
  incomplete versions with missing mandatory content.

## Consequences

- Fast feedback during editing, and no commit without a full check.
- Incomplete drafts can be committed for hand-over where the CDR allows it.
- Behaviour that depends on the CDR needs a small capability profile per
  target server.

## Alternatives considered

- **Full validation after every operation.** Rejected: too slow for large
  templates.
- **Validation only at commit.** Rejected: poor user feedback.
- **Treat incomplete as unvalidated.** Rejected: present content must still
  be correct.
