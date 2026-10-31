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

- After each operation the Contribution Builder runs a quick constraint check on the changed
  nodes (value types, ranges, code lists, patterns).
- The full check (existence, cardinality, occurrences, invariants and
  lifecycle rules) runs on an explicit `validate` call and always just
  before `commit`.
- Results are attached to nodes by uid so a UI can show each one next to
  the right field.
  In multi-caller builds this status is a derived view, never synced or
  logged ([ADR 0013 amendment](0013-cb-crdt-library-and-apply-policy.md#validation-state-during-editing)).
- Two modes:
  - **complete**: all template constraints apply.
  - **incomplete**: existence and cardinality lower bounds count as zero,
    but content that is present must be valid. The result also lists the
    missing required fields.
- The Contribution Builder reports, per target CDR profile, when that CDR is known to reject
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

## Implementation (phase 1, #165)

Code: `contribution_builder/draft_validation.ts` (`DraftValidator`,
`validateDraft`, `problemsForNode`, `lifecycleStateFor`).

- The checks are ehrtslib's existing `TemplateValidator` (template
  constraints) and its `RMSpecificationValidator` (RM rules and BMM
  invariants), run on the draft's canonical JSON. The draft must be validated
  against the template it is bound to (same hash); otherwise
  `TemplateBindingMismatchError`.
- Lifecycle: `complete` = openEHR code 532, `incomplete` = 553.
  `lifecycleStateFor(mode)` gives the `DV_CODED_TEXT` that commit (#166)
  records.
- Every problem has `kind`: `missing` (required content is absent: existence,
  occurrences or cardinality lower bound, an RM-required attribute, or an RM
  invariant that only tests for presence, such as `HISTORY.Events_valid`) or
  `invalid` (present content is wrong). `source` is `template` or `rm`.
- **incomplete**: template `missing` problems are listed in `missing` but do
  not fail. `invalid` problems fail ("may be missing, but it may not be
  wrong", RM Common section 6). RM-level `missing` problems (no composer, no
  `ENTRY.subject`, …) also fail, because no CDR can store a COMPOSITION
  without them.
- **complete**: everything fails.
- RM-level checks come from the RM validator: language (ISO 639-1),
  territory (ISO 3166-1), category (openEHR 431 / 433 / 451), composer
  (required, `PARTY_PROXY` invariants) and `ENTRY.subject` (required).
- Each problem names the nearest LOCATABLE node at or above it: `node` (short
  key, or `root` for the COMPOSITION) and `uid` (`<uuid>::<short key>`; none
  for the root, whose uid is fixed at commit). Paths: `path` (instance path,
  `/content[0]/data/events[0]/…`), `archetypePath` (node ids,
  `/content[openEHR-EHR-OBSERVATION.x.v1]/data[id2]/…`) and `relativePath`
  (below `node`, usable with `setValue`). For a missing node,
  `constraintNodeId` names the template node.
- Removing the last member of a list now drops the attribute
  (`events: []` → no `events`); RM invariants reject an empty list.

Not yet: the quick check after each operation, and the per-CDR capability
profile (follow-ups).
