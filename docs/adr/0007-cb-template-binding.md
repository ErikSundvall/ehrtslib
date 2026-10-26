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
  hash. Decided by Erik (2026-10-25): the canonical serialisation is RFC 8785
  (JSON Canonicalization Scheme) applied to ehrtslib's JSON form of the
  ADL2 operational template (after any OPT 1.4 up-conversion), and the
  binding records the serialisation version next to the hash.
- Tool-supplied identifiers in the source template (`MD5-CAM-1.0.1`,
  `PARENT:MD5-CAM-1.0.1` and `build_uid` from Archetype Designer or CKM
  exports) are recorded with the binding for information only. A mismatch
  gives a warning and never refuses a draft. A survey of 96 OPTs in the
  Region Stockholm CKM mirror showed that `MD5-CAM` follows template
  content, `PARENT:MD5-CAM` is a snapshot of the root archetype's hash at
  build time, `build_uid` is neither always stable nor unique, and the
  MD5-CAM algorithm is unpublished so it cannot be recomputed.
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
  currently keeps at-codes. Decided by Erik (2026-10-25): this up-conversion
  is part of phase 1, so legacy OPT 1.4 templates can be used from the start.
- ADL2 id-codes remove the ADL 1.4 need for sibling name predicates, but not
  the need to tell runtime instances apart; that is what
  [ADR 0003](0003-cb-identity-and-uids.md) uids are for.

## Implementation (phase 1, #163)

Code: `contribution_builder/template_binding.ts` (`bindTemplate`,
`checkTemplateBinding`), `contribution_builder/jcs.ts` (RFC 8785),
`parser/legacy/opt14_upconvert.ts` and `parser/legacy/opt14_code_mapping.ts`.

- **RFC 8785** is done by the `canonicalize` npm package, pinned exactly in
  `deno.json` (Apache-2.0, maintained by an RFC 8785 co-author).
  `jcs.ts` wraps it with ehrtslib's I-JSON checks: lone surrogates,
  non-finite numbers, cycles and values with no JSON form throw `JcsError`
  before the library is called. The switch kept every canonical byte and
  hash unchanged (decided by Erik, 2026-10-26).
- **Serialisation version** `TEMPLATE_BINDING_SERIALISATION_VERSION`, currently
  `ehrtslib-cb-opt-json/1;jcs=rfc8785;opt14-codes=am2-archie-1`.
- **Hashed form**: `JsonCanonicalSerializer` output for the ADL2
  `OPERATIONAL_TEMPLATE` (`_type` on every object), minus identity and tool
  identifiers that the binding records separately (top-level `uid`,
  `build_uid`, `archetype_id`, `template_id`, `adl_version`, and
  `description.other_details` keys `MD5-CAM-1.0.1`, `PARENT:MD5-CAM-1.0.1`,
  `build_uid`, `sem_ver`). A release that only bumps `sem_ver` therefore keeps
  its hash and is reported as a version change.
- **Array order**: RFC 8785 sorts object members, not arrays. `attributes` of
  each object node are sorted by `rm_attribute_name` (then
  `differential_path`). Sibling `children` and code lists keep document order,
  which is template content (display order).
- **OPT 1.4 up-conversion** (AM 2.x rule, as in Archie's converter): node ids
  `at0004` → `id5`; local value codes stay at-codes without zero padding
  (`at0009` → `at10`); value-set codes `ac0001` → `ac2`. Object nodes without
  a node id in ADL 1.4, and local code lists with more than one code (which
  get an ac value set), get minted codes: per archetype scope, numbering
  starts after the highest code used in that scope, in depth-first document
  order, so the result is deterministic. The rule is isolated in
  `opt14_code_mapping.ts` because AM 2.4.0 (SPECAM-90, unreleased) moves ADL2
  node ids back to at-codes; a rule change bumps the serialisation version.
- **Template id and version**: ADL2 uses the archetype id HRID. OPT 1.4 uses
  `template_id` and `sem_ver` from `description/other_details` (null when
  absent).
- **Rebind**: changed template id, version, hash or serialisation version is an
  error-level issue (`migrationRequired`, `TemplateBindingMismatchError`). A
  changed `MD5-CAM-1.0.1`, `PARENT:MD5-CAM-1.0.1` or `build_uid` is a warning.

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
