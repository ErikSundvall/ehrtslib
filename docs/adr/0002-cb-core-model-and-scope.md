# Contribution Builder: one core model, generic scope, canonical RM JSON

Status: proposed (draft for review). Part of the
[Contribution Builder design](../maintainers/contribution-builder-design.md).

## Context

The Contribution Builder (CB) is needed in two flavours: a single caller
(one web app or server process), and collaborative multi-caller editing. A
caller is one app instance or device writing to the build; one person on two
devices is multi-caller. It must
also cover every openEHR versioned type, not only compositions. Two separate
code bases would drift, and a composition-only design would need a new
format when `EHR_STATUS`, `FOLDER` or demographic `PARTY` versions are added.

## Decision

- One core model, `ContributionBuild`, holds the drafts (`VersionDraft<T>`),
  the operation log, template bindings and validation results. Single-caller
  and CRDT (multi-caller) use are adapters over the same core.
- The core is generic over `VERSION<T>`: `COMPOSITION`, `EHR_STATUS`,
  `EHR_ACCESS`, `FOLDER`, demographic `PARTY` subtypes and later versioned
  types. The implementation ships `COMPOSITION` first.
- The commit follows the openEHR REST ITS request shape for
  `POST /ehr/{ehr_id}/contribution`: a `NewContribution` body holding
  `UPDATE_VERSION` items and `UPDATE_AUDIT` audits. Version `data` is always real RM
  objects (ehrtslib RM classes).
- The internal format is canonical RM JSON. FLAT, STRUCTURED and other
  simplified formats are import/export adapters only.
- Builder-only working state (temporary ids, edit leases, presence,
  attribution history, validation results) is non-normative and never
  written into RM data unless another ADR says so.

## Consequences

- Adding a versioned type means adding type-specific validation and
  defaults, not a new log or envelope format.
- Any CDR that accepts the REST ITS contribution shape accepts Contribution Builder output.
- Simplified formats can change without touching stored drafts or logs.
- Working state needs its own (non-RM) serialisation for storage and sync.

## Alternatives considered

- **Separate single-caller and multi-caller builders.** Rejected: duplicated
  logic and diverging behaviour.
- **FLAT or Web Template paths as the internal format.** Rejected: lossy
  for some RM content and tied to one template rendering.
- **Composition-only design.** Rejected by the maintainer: the design must
  cover the whole Contribution Builder; only the delivery order starts with compositions.
