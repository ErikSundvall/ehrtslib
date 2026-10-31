# Contribution Builder: attribution, composer and committer

Status: proposed (draft for review). Part of the
[Contribution Builder design](../maintainers/contribution-builder-design.md).

## Context

Several people may contribute to one draft. openEHR has several places for
people: `COMPOSITION.composer`, `ENTRY.provider`,
`ENTRY.other_participations`,
`EVENT_CONTEXT.participations`, and the committer in `AUDIT_DETAILS`. The
old roadmap suggested converting editor colouring into `ENTRY.provider`,
but `provider` means the source of the information (for example the
patient or a relative), not the person who typed it.

## Decision

- People who entered or edited data are recorded in `other_participations`
  (on the entry, or in the event context when the change is not
  entry-specific) with a function such as `data entry`.
- `ENTRY.provider` is set only when the user explicitly records who
  provided the information.
- `COMPOSITION.composer` is an explicit build field. The caller sets it
  before or at commit (`set-composer`); the Contribution Builder does not infer it from the
  editors.
- The committer (in the contribution and version audits) is separate and
  may differ from the composer.
- Per-value author colouring comes only from the operation log. It is
  never written into RM data.

## Consequences

- RM semantics stay intact: queries on `provider` still find information
  sources, not typists.
- A UI can show fine-grained authorship from the log, while the committed
  record holds summary participations.
- Callers must set the composer explicitly; commit fails if it is missing
  for a type that requires it.

## Alternatives considered

- **Map editors to `ENTRY.provider`.** Rejected: wrong meaning.
- **Use the first or last editor as composer.** Rejected: composer is a
  clinical-responsibility statement, not an edit statistic.
- **Store per-value authorship in RM data** (for example in
  `FEEDER_AUDIT` per element). Rejected: bloats records and is not what
  those attributes are for.
