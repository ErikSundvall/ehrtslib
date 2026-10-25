# Contribution Builder: one operational template per draft, ADL2 inside

Status: proposed (draft for review). Part of the
[Contribution Builder design](../maintainers/contribution-builder-design.md).

## Context

Validation, form rendering and replay all depend on the operational
template a draft was started with. In practice templates are often
re-uploaded to a CDR under the same template id with changed content, and
ADL 1.4 OPTs carry only a template id string with no real version. A draft
replayed against a silently changed template may become invalid or change
meaning.

The maintainer's templates are authored in ADL2 (original language English,
Swedish translation). Some CDRs still expect ADL 1.4 at-codes in committed
data.

## Decision

- Each draft is bound to exactly one operational template, held internally
  as ADL2.
- The binding records the template HRID with full version and a `sha256`
  hash of a **canonical serialisation** of the operational template
  (ehrtslib's own deterministic serialisation), not of the uploaded bytes.
  Re-serialising the same template on upload therefore does not change the
  hash.
- When the hash or version differs from what the draft was bound to, the CB
  reports it. Moving to another template is an explicit `migrate-template`
  operation in the log, never a silent rebind.
- At commit, for CDRs that need ADL 1.4 codes, the CB down-converts with
  ehrtslib's existing converter (`generation/id_to_at_code.ts`, and
  `exportAdl2TemplateToOpt14` for the matching OPT 1.4).
- Third-party templates that exist only as ADL 1.4 need up-conversion.
  ehrtslib converts ADL 1.4 archetype text to ADL2
  (`parser/adl14_to_adl2_converter.ts`, applied automatically by the
  parser). Full up-conversion of a legacy OPT 1.4 XML into an ADL2
  operational template with id-codes is not verified yet; the OPT XML parser
  currently keeps at-codes. This is an open implementation item.
- ADL2 id-codes remove the ADL 1.4 need for sibling name predicates, but not
  the need to tell runtime instances apart; that is what
  [ADR 0003](0003-cb-identity-and-uids.md) uids are for.

## Consequences

- Silent template drift is detected before replay or commit.
- The canonical serialisation must be stable across ehrtslib versions, or
  its version must be recorded with the hash.
- Migration between template versions is a visible, reviewable step and can
  be replayed.

## Alternatives considered

- **Template id only.** Rejected: cannot detect changed content.
- **Hash of uploaded bytes.** Rejected: changes when a CDR or tool only
  re-serialises the same template, causing needless migrations.
- **ADL 1.4 internally.** Rejected: the maintainer's templates are ADL2 and
  ehrtslib's model is AOM2-based.
