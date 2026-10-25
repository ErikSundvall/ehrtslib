# Contribution Builder design

Status: **draft for review.** Design only; nothing here is implemented yet.
Delivery order is in the [roadmap](roadmap.md). Decisions and their reasons
are recorded as ADRs [0002](../adr/0002-cb-core-model-and-scope.md) to
[0010](../adr/0010-cb-commit-envelope-and-provenance.md).

## 1. Product

### 1.1 What it is

The Contribution Builder (CB) is the part of ehrtslib that assembles an
openEHR `CONTRIBUTION` on the client (browser, mobile app) or on a server
before it is committed to a CDR. It holds the uncommitted versions, keeps
them valid against their operational templates while they are edited, and
produces a commit that any conforming openEHR REST server accepts.

The idea comes from Sundvall et al., *Applying representational state
transfer (REST) architecture to archetype-based electronic health record
systems*, BMC Medical Informatics and Decision Making 13:57 (2013),
<https://link.springer.com/article/10.1186/1472-6947-13-57>. Table 2 of that
paper lists contribution-build operations. The CB keeps them as its public
verbs:

| Paper verb | CB meaning |
| --- | --- |
| new build | Start an empty contribution build for one EHR (or demographic store). |
| update-version | Add a new version of an existing versioned object, starting from its latest committed version. |
| copy-version | Start a new versioned object from a copy of an existing version (new identity, same content). |
| from-form | Fill a version from a form engine payload (for example FLAT or STRUCTURED). |
| from-ehr-path | Copy a sub-tree from existing EHR content (by path or uid) into a draft. |
| from-instance-template | Start from a pre-filled instance (a template instance or a stored example). |
| validate | Run the full check and return problems per node. |
| commit | Build the `CONTRIBUTION` and send it to the CDR. |

### 1.2 Who uses it

- **App developers** who build openEHR forms or clinical apps and want to
  send whole, valid contributions instead of hand-assembling JSON.
- **Clinicians** who use those apps, indirectly: they get drafts that
  survive reloads, live validation next to the field, and (in the
  multi-user flavour) shared editing of one note by several people or
  devices.
- **Integrators and server-side services** (including the planned ehrtslib
  CDR proxy) that need to batch several versions into one atomic commit.

### 1.3 Scenarios

1. A single web app fills a vital-signs composition, validates it as the
   user types, and commits it.
2. A nurse starts a note on a tablet, a physician finishes it on a desktop,
   and both edit the same draft at the same time. Each value can be shown
   with the colour of who entered it.
3. A user saves an unfinished note as `incomplete` (lifecycle 553) and
   another user completes it later.
4. Between opening and committing, someone else commits a newer version.
   The CB detects the conflict and returns it as data for a resolver UI
   instead of overwriting.
5. One contribution changes a composition, a folder and the `EHR_STATUS`
   together, or a demographic `PARTY` and its relationships.
6. An auditor replays the editing session that led to a commit.

### 1.4 Why

openEHR REST lets clients send whole contributions, but today every app
re-implements draft handling, uid assignment, validation, attribution and
conflict handling, usually partly. A shared builder makes these consistent
and makes the editing history auditable.

## 2. Scope

The design covers **every versioned type** (`VERSION<T>` with `T` =
`COMPOSITION`, `EHR_STATUS`, `EHR_ACCESS`, `FOLDER`, the demographic `PARTY`
subtypes such as `PERSON`, `ORGANISATION` and `ROLE`, and any later
versioned type). The operation log, the uid scheme and the commit envelope are generic
over `VERSION<T>`. The implementation ships **COMPOSITION first**; the other
types follow without format changes ([ADR 0002](../adr/0002-cb-core-model-and-scope.md)).

Two flavours share one core:

- **Single-app**: one process (for example one web app or one server
  request) edits the draft. Operations are applied directly.
- **Multi-user / multi-device**: operations are synchronised through a CRDT
  so several users or devices edit the same draft, with presence, per-value
  author colouring and session playback.

Out of scope here: the merge-conflict resolver UI (separate project, see
roadmap) and formal openEHR specification proposals (see section 11).

## 3. Architecture overview

```
           from-form / from-ehr-path / FLAT import ...
                          │ (adapters produce operations)
                          ▼
  ┌───────────────────────────────────────────────────────┐
  │ ContributionBuild (core)                              │
  │  ├─ drafts: VersionDraft<T>[]  (real RM objects)      │
  │  ├─ operation log (append-only, author + time per op) │
  │  ├─ template binding per draft (HRID + hash)          │
  │  ├─ validation results by node uid                    │
  │  └─ working state (temp ids, leases, attribution)     │
  └───────────────────────────────────────────────────────┘
        │ apply ops                     │ build
        ▼                               ▼
  single-app adapter        UPDATE_CONTRIBUTION → CDR (REST)
  CRDT sync adapter  ◄──►   other replicas (ops as CRDT changes)
  storage adapter    ──►    caller-chosen storage (drafts, log bytes)
```

- **One core model**, `ContributionBuild`, with adapters for single-app
  and CRDT use.
- **Commit shapes follow the REST ITS** `UPDATE_CONTRIBUTION`,
  `UPDATE_VERSION` and `UPDATE_AUDIT`. Version `data` is always real RM
  objects from ehrtslib's RM classes.
- **Internal format is canonical RM JSON** (ehrtslib's canonical JSON
  serialiser). FLAT, STRUCTURED and other simplified formats are import and
  export adapters only.
- **Working state is non-normative**: temporary ids, edit leases,
  attribution history, presence and validation results belong to the
  builder and never appear in committed RM data, except where a decision
  below explicitly writes something (composer, participations, audit
  description).

## 4. Draft model

A `VersionDraft<T>` holds:

- `kind`: `create` (new versioned object), `modify` (new version of an
  existing one, with `preceding_version_uid`) or `delete`.
- `data`: the RM object of type `T` being built.
- `lifecycleTarget`: `complete` (532) or `incomplete` (553).
- `templateBinding`: see section 7.
- `base`: for `modify`, the committed version the draft started from, kept
  for conflict handling.

A `ContributionBuild` holds one or more drafts for one EHR (or one
demographic store), the shared operation log, and contribution-level audit
input (committer, change type, description).

## 5. Identity and uids

Summary of [ADR 0003](../adr/0003-cb-identity-and-uids.md):

- Every `LOCATABLE` node the builder creates gets a stable instance id in
  `LOCATABLE.uid` of the form `<versioned-object-uuid>::<short key>`, for
  example `8d2c…e1::a3.17`.
- The short key is a **replica prefix plus a counter** (`a3` = replica,
  `17` = 17th id minted by it), so devices offline mint unique ids without
  coordination.
- This fits `UID_BASED_ID`: the root must be a UUID, ISO OID or internet
  id; the extension may be any string.
- Content loaded without inner uids (from another client or a CDR that
  drops them) gets uids assigned by an explicit `assign-uid` operation, so
  the assignment is itself in the log.
- Checked on the dev CDRs (section 10): EHRbase 2.36.0 and FerroEHR 5.4.1
  both preserve inner uids, and AQL can filter on them.

## 6. Operation log and sync

Summary of [ADR 0004](../adr/0004-cb-operation-log-and-sync.md):

- **Every change goes through one append-only operation log**, also in the
  single-app flavour. Initial operations: `set-value`, `add-instance`,
  `remove-instance`, `move-instance`, `assign-uid`, `set-composer`,
  `set-participation`, `set-lifecycle`, `bind-template`,
  `migrate-template`, `import` (adapter input recorded as operations) and
  `discard` (a draft or item removed from the build before commit; see
  section 9.2).
- The builder never deletes the log. An optional, deployment-configured
  append-only log sink can stream it to a server as work happens.
- Each operation records author, timestamp and replica, and **targets a
  node uid, not a path**. Paths are derived for display and for fallback
  matching only.
- Single-app applies operations directly. Multi-user sends the same
  operations through a CRDT.
- **Session playback is replay of the log.** Any implementation must be
  able to recreate the session from the log alone (plus the bound
  template).
- The design does **not bind to a CRDT library.** Requirements: replayable
  full history, compact binary log, Deno and browser support, acceptable
  licence. Automerge and Loro are preferred over Yjs; a spike picks one and
  records it in its own ADR.

## 7. Template binding

Summary of [ADR 0007](../adr/0007-cb-template-binding.md):

- Each draft is bound to **exactly one operational template**, used
  internally as ADL2.
- The binding records the template HRID with full version **and a sha256
  hash of a canonical serialisation** of the operational template (not of
  uploaded bytes). This detects templates re-uploaded under the same id with
  changed content, and ADL 1.4 OPTs that have only an id string and no
  version.
- Changing template is an explicit `migrate-template` operation, never a
  silent rebind.
- For CDRs that need ADL 1.4 at-codes, the commit is down-converted with
  ehrtslib's existing ADL2 → 1.4 code mapping (`generation/id_to_at_code.ts`)
  and OPT 1.4 exporter (`exportAdl2TemplateToOpt14`).
- ADL 1.4 sources: ehrtslib already converts ADL 1.4 **archetype** text to
  ADL2 (`parser/adl14_to_adl2_converter.ts`). Whether a legacy OPT 1.4 XML
  can be brought fully to an ADL2 operational template with id-codes is not
  yet verified (the OPT XML parser keeps at-codes). This is only needed for
  third-party templates that exist only as 1.4.

## 8. Validation and lifecycle

Summary of [ADR 0008](../adr/0008-cb-validation-and-lifecycle.md):

- After each operation: a quick constraint check on the changed nodes.
- On `validate` and always before `commit`: the full check (cardinalities,
  existence, invariants, lifecycle rules).
- Results are attached to nodes by uid so a UI can show them by the field.
- Two modes: **complete** (532), and **incomplete** (553), where existence
  and cardinality lower bounds count as zero but content that is present
  must be valid. Incomplete mode lists the missing required fields.
- CDR behaviour differs today: EHRbase 2.36 rejects an incomplete version
  that misses mandatory content (ehrbase#1630); FerroEHR accepts it.

## 9. Attribution, conflicts, storage and commit

- **Attribution** ([ADR 0006](../adr/0006-cb-attribution-and-composer.md)):
  editors go in `other_participations` (function such as `data entry`);
  `ENTRY.provider` only when the user explicitly records the information
  source; `COMPOSITION.composer` is an explicit build field set before or at
  commit; the committer is separate. Per-value author colouring comes only
  from the log, never from RM data.
- **Conflicts** ([ADR 0009](../adr/0009-cb-conflicts-and-rebase.md)): on
  HTTP 412 (`preceding_version_uid` is no longer the latest) the CB never
  overwrites. It fetches the new version, replays the log by uid, falls back
  to path matching where uids are missing, and returns conflicts as
  structured data. The caller sends back a list of resolutions.
- **Storage** ([ADR 0005](../adr/0005-cb-storage-encryption-policy-neutrality.md)):
  ehrtslib is policy-neutral. Storage is pluggable; local draft persistence
  is off by default and encrypted at rest when on. An optional append-only
  log sink streams the log to durable storage while editing.
- **Commit envelope and provenance**
  ([ADR 0010](../adr/0010-cb-commit-envelope-and-provenance.md)): every
  commit links the log from the contribution's `AUDIT_DETAILS.description`
  (`oplog sha256:<hex>`, plus a `DV_URI` hyperlink when a log URI is given).
  Each committed top-level item carries a `FEEDER_AUDIT`:
  `originating_system_audit` (supplied by the caller) describes what created
  the content, with form name and version and renderer in `other_details`;
  `feeder_system_audit` (always set by the builder) has `system_id`
  `ehrtslib-contribution-builder` and the builder version, log format and
  CRDT library version in `other_details`. A missing
  `originating_system_audit` gives a warning that can be silenced.

### 9.1 Commit sequence

1. Run full validation for every draft; stop on errors (complete mode) or
   on invalid present content (incomplete mode).
2. Set any missing build fields that the caller supplies at commit
   (composer, committer).
   Set `FEEDER_AUDIT` on each top-level item: the caller's
   `originating_system_audit` (warn if missing) and the builder's
   `feeder_system_audit`.
3. Down-convert codes if the target CDR needs ADL 1.4.
4. Serialise the log, compute `sha256`, hand the bytes to the storage
   adapter, and (if a URI comes back or is given) write the audit
   description.
5. Build `UPDATE_CONTRIBUTION` with one `UPDATE_VERSION` per draft and send
   it.
6. On 412, enter the conflict flow; on success, record the new version ids
   as the new base and close or reset the build.

Drafts marked `discard` are left out of step 5 (see 9.2).

### 9.2 Discarded drafts

Discarded drafts are **not committed to the CDR**.

- Discarding a whole draft, or removing a composition or other item from a
  build before commit, is a `discard` operation in the replayable log. The
  builder never deletes the log.
- When the build still commits other drafts, the commit links the log from
  `AUDIT_DETAILS.description` (hyperlink and `oplog sha256:<hex>`), so the
  discarded items are visible in that linked log.
- A build in which everything is discarded never commits, so there is no
  contribution audit to carry the link. The optional append-only log sink
  (configured by the deployment, see ADR 0005) is how such logs reach
  durable storage. In the multi-user flavour the log is synchronised to the
  other replicas anyway.
- Rejected alternative: committing discarded drafts to the CDR as
  `incomplete` and then `abandoned` (`801`), the RM-conformant two-version
  path. A single first commit as `abandoned` is not covered by the RM Common
  section 6 lifecycle (see 11.8). The maintainer judged the CDR route
  overkill; the log is sufficient (ADR 0004, 0005, 0010).

## 10. Testing

Development setup on the maintainer box (not needed for unit tests):

| CDR | Version | Base URL |
| --- | --- | --- |
| EHRbase | 2.36.0 | `http://127.0.0.1:8080/ehrbase/rest/openehr/v1` |
| FerroEHR | 5.4.1 | `http://127.0.0.1:8090/ferroehr/rest/openehr/v1` |

Both run with their development default credentials. Planned test layers:

- Unit tests: operations, replay determinism (same log ⇒ same RM JSON),
  uid minting across replicas, canonical template hash stability,
  validation in both modes.
- CRDT tests: two or more replicas editing offline then merging; playback.
- Integration tests against both CDRs (opt-in, skipped when the CDR is not
  reachable): inner uid preservation, AQL on inner uids, 412 handling,
  incomplete commits, ADL 1.4 down-conversion.

## 11. Spec observations (informative)

These are observations, not change proposals. They record where the builder
design touches wording in the openEHR specifications that is unclear,
narrower than practice, or in conflict with other parts. Formal proposals
will only be written once the builder has been implemented and tested,
since details are likely to change with experience. References are to the
openEHR specification sources (RM = Reference Model, CNF = Conformance).

### 11.1 `uid` on inner `LOCATABLE` nodes (ADR 0003)

- RM Common, archetyped package (section 3): `LOCATABLE` descendants *may*
  have a `uid`; paths are the normal way to reference inner nodes and "the
  `uid` attribute will usually be empty in most EHR data". For Extracts it
  allows `uid` on "some or all nodes".
- The `LOCATABLE.uid` class text says "Optional globally unique object
  identifier for root points of archetyped structures", which reads
  narrower than the narrative.
- The builder sets `uid` on every node it creates, because paths are not
  stable while several authors add, remove and move repeated items.
- Possible later clarification: align the class text with the narrative,
  and describe the stable-instance-id use alongside the Extract use.

### 11.2 Preservation of inner uids (ADR 0003, ADR 0009)

- Nothing in the specifications requires a CDR or a client to keep
  inner-node `uid` values when content is read, modified and committed
  again. A client posting FLAT or STRUCTURED data without uid fields drops
  them.
- Both development CDRs keep them today (section 10), which the builder
  relies on for replay; path fallback covers the rest.
- Possible later clarification: a statement (normative or conformance
  test) that a CDR returns `uid` values as committed.

### 11.3 Incomplete lifecycle: RM versus CNF (ADR 0008)

- RM Common, change control package (section 6, *Incomplete Content*): in
  the `553|incomplete|` state mandatory content may be absent ("existence
  and cardinality lower limits set to zero"), but what is present must be
  valid: "data may be missing, but it may not be wrong".
- CNF platform test schedule, EHR/contribution tests
  (`master08-func_tc_ehr_contribution.adoc`): "the incomplete cases should
  be equal to the complete, because the flag is just adding semantics
  about the content, not setting how the content should be processed".
- CDR behaviour follows the two texts differently: EHRbase 2.36.0 rejects
  an incomplete composition that misses mandatory content (ehrbase#1630);
  FerroEHR 5.4.1 accepts it and rejects the same content committed as
  complete.
- This one is independent of the builder and is already drafted as a
  SPECCNF issue for the maintainer to file.

### 11.4 Unfinished content on the client (ADR 0005)

- RM Common, section 6, *Incomplete Content*: "Unfinished content items
  (EHR Compositions, Demographic Parties etc) cannot be saved locally on
  the client machine, as this represents a security risk". They must be
  persisted on the server, in the EHR or in a secure "holding area".
- Offline and multi-device drafting needs local persistence. The builder
  keeps it pluggable, off by default and encrypted at rest when on; the
  optional server log sink matches the "holding area" idea.
- Possible later clarification: phrase the sentence as a security
  consideration subject to local policy (for example, permitted when
  encrypted and access-controlled) instead of a blanket rule.

### 11.5 `ENTRY.provider` versus data-entry editors (ADR 0006)

- `ENTRY.provider` identifies the source of the information (patient,
  relative, clinician who observed). It is not the person who typed it.
- The builder records editors in `other_participations` with a function
  such as "data entry", and leaves `provider` to an explicit choice.
- Possible later clarification: informative guidance on recording
  data-entry and multi-author participation, and a coded participation
  function for it.

### 11.6 Builder provenance in `FEEDER_AUDIT` (ADR 0010)

- `FEEDER_AUDIT` is an attribute of `LOCATABLE` (so of the COMPOSITION, not
  the `CONTRIBUTION`). The RM describes it for content received from feeder
  systems (RM EHR package, imported versions).
- The design uses it for natively authored content as well:
  `originating_system_audit` describes what created the content (form and
  version, renderer), supplied by the caller; `feeder_system_audit` records
  that the content passed through the builder. `FEEDER_AUDIT_DETAILS.system_id`
  identifies an organisation's IT system, so software names and versions go
  in `other_details` (`ITEM_STRUCTURE`, may be archetyped).
- Accepted consequence: queries that look for imported data via
  `feeder_audit` also find builder commits.
- Possible later clarification: informative guidance that `FEEDER_AUDIT`
  may describe the authoring chain of native content, and a published
  archetype for the software details in `other_details`, so the pattern is
  queryable across systems.

### 11.7 Operation-log link and hash (ADR 0010)

- `AUDIT_DETAILS` has no structured place for a link to an editing-session
  log or its hash. The builder uses the `DV_TEXT` description with a
  `hyperlink` (`DV_URI`) and a fixed text form `oplog sha256:<hex>`.
- Possible later proposal: an optional structured attribute (or an
  `other_details`-style extension) on `AUDIT_DETAILS` for session or
  provenance references.

### 11.8 Discarded drafts and the `abandoned` state (section 9)

- The design records discarded drafts only in the operation log (a
  `discard` operation), not in the CDR. When the build still commits other
  drafts, the contribution audit links to that log as usual. A build in
  which everything is discarded never commits, so only the optional server
  log sink keeps a trace of it.
- For reference, should a deployment later want the CDR to show discarded
  drafts: RM Common, section 6, reaches `801|abandoned|` only from
  `incomplete` by the `abandon` transition, and "any transition requires
  the commit of a new version". A first commit directly in the `abandoned`
  state is not described.
