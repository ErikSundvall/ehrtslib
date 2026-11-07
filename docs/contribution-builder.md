# Contribution Builder

The Contribution Builder assembles an openEHR `CONTRIBUTION` before it is
committed to a clinical data repository (CDR). It runs in a browser or mobile
app, or on a server. It holds uncommitted versions, checks them against their
operational templates while they are edited, and produces a commit body that a
conforming openEHR REST server accepts.

The idea and the public verbs come from Sundvall et al., _Applying
representational state transfer (REST) architecture to archetype-based
electronic health record systems_, BMC Medical Informatics and Decision Making
13:57 (2013),
[article](https://link.springer.com/article/10.1186/1472-6947-13-57),
[Table 2](https://link.springer.com/article/10.1186/1472-6947-13-57/tables/2).

This page is the user overview. The longer model, and the reasons for it, are in
the [design](maintainers/contribution-builder-design.md) and the ADRs linked
below. What ships today is the COMPOSITION path in `contribution_builder/`, plus
the optional Automerge add-on.

## Import

The package is `contribution_builder/mod.ts`. From this repository:

```typescript
import {
  bindTemplate,
  ContributionBuild,
  DraftValidator,
  prepareContribution,
} from "./contribution_builder/mod.ts";
```

`deno.json` exports the same module as `ehrtslib/contribution-builder`. The full
barrel `mod_full.ts` (`ehrtslib/full`) re-exports it as `contributionBuilder`.
The default barrel `mod.ts` leaves the package out; the lean
`ehrtslib-<version>-core.min.js` bundle does the same. The separate runtime file
is `ehrtslib-<version>-contribution.min.js`. Release URLs are in
[library-package.md](library-package.md).

The Automerge multi-caller adapter is a separate entry,
`addons/cb_automerge/mod.ts` (`ehrtslib/contribution-builder-automerge`). It is
not re-exported from `contribution_builder/mod.ts`.

## What a build holds

`ContributionBuild` is the core. One build is for one EHR (or, in the design,
one demographic store) and holds:

- one or more drafts (`VersionDraft<T>` in the design; the code’s
  `VersionDraftInfo.rmType` is `COMPOSITION`)
- an append-only operation log (`ehrtslib-cb-oplog` version 1)
- a template binding per draft (template id, version, sha256 of the canonical
  template JSON)
- validation results by node uid (derived; they are not written into the log)

A draft’s `kind` is `create` (new versioned object, including copy-version) or
`modify` (update-version, with `baseVersionUid` used later as
`preceding_version_uid`). `setLifecycle` chooses `complete` (lifecycle
state 532) or `incomplete` (553).

The design covers every `VERSION<T>`: `COMPOSITION`, `EHR_STATUS`, `EHR_ACCESS`,
`FOLDER`, demographic `PARTY` subtypes, and later versioned types. The log
format and the commit envelope are generic. The implementation ships
**COMPOSITION first**. Adding another type is additional validation and
defaults, with the same log and envelope
([ADR 0002](adr/0002-cb-core-model-and-scope.md)).

### Canonical RM JSON

The internal format is canonical RM JSON from ehrtslib’s canonical JSON
serialiser. `toCanonicalJson(draftId)` returns that tree.
`toComposition(draftId)` reads it back as an `openehr_rm.COMPOSITION`.
`toCanonicalRmJson` is the same conversion for a value you pass into an
operation.

FLAT, STRUCTURED, and other simplified formats are adapters. `importDocument`
accepts `format: "canonical" | "flat" | "structured"`. FLAT and STRUCTURED need
the draft’s bound template. Replay stores the canonical document, not the source
text. That method still lives on the core and still imports
`serialization/simplified/`.
[ADR 0016](adr/0016-optional-serializer-subpaths-simplified-and-zipehr.md)
(accepted) moves those codecs to optional serializer subpaths, and
[ADR 0012](adr/0012-cb-add-on-packages-and-patch-formats.md) places
FLAT/STRUCTURED create, read, and patch on a simplified-formats add-on. That
add-on package is not in the tree yet; the move out of the core is still
outstanding.

Working state that belongs only to the builder (temporary ids, presence,
validation marks) stays out of committed RM data, except where an ADR writes
something on purpose: composer, participations, the contribution audit
description, and `FEEDER_AUDIT` provenance.

## Verbs

Table 2 of the 2013 paper is the public verb list. The methods below are the
ones the library exposes.

| Paper verb             | In the library                                                                                                                                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| new build              | `ContributionBuild.create`, then `newComposition(template, { language, territory })`. The skeleton is the template’s minimal RM instance. Composer is left unset until `setComposer`.                                |
| update-version         | `openVersion(template, storedComposition)`. The stored version uid becomes `baseVersionUid`. `continueCommitted(template, draftId)` opens the next modify draft after `record-commit`, using the stored version uid. |
| copy-version           | `copyVersion(template, storedComposition)`. New versioned-object identity; content is copied and uids are reminted.                                                                                                  |
| from-form              | `importDocument(draftId, payload, { format: "flat" \| "structured", template })`. There is no method named `fromForm`.                                                                                               |
| from-ehr-path          | No method yet. The paper’s “copy a sub-tree from existing EHR content” is not implemented.                                                                                                                           |
| from-instance-template | No separate method. `newComposition` starts from the minimal instance of the bound template. A stored COMPOSITION is `openVersion` or `copyVersion`.                                                                 |
| validate               | `DraftValidator.validate` (or `validateDraft`). Full check also runs inside `prepareContribution` before any request.                                                                                                |
| commit                 | `prepareContribution` builds the REST ITS `NewContribution` body. `ItsRestContributionAdapter.commit` validates, POSTs to `/ehr/{ehr_id}/contribution`, and records the commit.                                      |

Edits go through logged operations, addressed by node uid (short key `a.3` or
full uid `<uuid>::a.3`; the composition root is `ROOT_TARGET`, `"root"`):

| Method                                            | Operation                                                                       |
| ------------------------------------------------- | ------------------------------------------------------------------------------- |
| `setValue`                                        | `set-value` (relative path such as `value` or `value/magnitude`; `null` clears) |
| `editText`                                        | `edit-text` (Unicode code-point splice)                                         |
| `addInstance` / `removeInstance` / `moveInstance` | structure changes                                                               |
| `assignUid`                                       | mint a short key for a LOCATABLE that has none                                  |
| `setComposer`                                     | `COMPOSITION.composer` (`PARTY_IDENTIFIED`, `PARTY_SELF`, or `PARTY_RELATED`)   |
| `setParticipation`                                | one participation, replaced when performer and function match                   |
| `setLifecycle`                                    | `complete` or `incomplete`                                                      |
| `migrateTemplate`                                 | rebind; data is not rewritten                                                   |
| `importDocument`                                  | replace draft content from canonical JSON, FLAT, or STRUCTURED                  |
| `discard`                                         | drop the draft or one node; the log is kept; commit then refuses the draft      |
| `joinBuild` / `leaveBuild` / `setRole`            | build membership (`committer` may edit and commit; `viewer` may not)            |

`exportLog` / `fromLog` round-trip the log. The same log and template replay to
the same canonical RM JSON.

`rev` on `setValue` and `editText` is optional for a single caller. When it is
present, a field changed since that `rev` is refused with
`changed-by-someone-else`. A multi-caller build requires `rev`.

## Validation and commit

After each successful operation, a tracker from `trackValidation` can mark
changed nodes when a present value breaks a constraint. The edit is kept.
`validationState(draftId)` reports `unfinished` and `invalid`, whether the draft
can commit as complete or incomplete, and per-CDR advice. Some CDRs reject an
incomplete version that is missing mandatory template content; others accept it.
Which servers do which stays in the built-in profiles in code. This status is
derived and is not written to the log
([ADR 0008](adr/0008-cb-validation-and-lifecycle.md)).

`DraftValidator.create` loads UCUM once; reuse the instance.
`validate(build, draftId, template, { mode })` runs the template validator and
the RM specification validator on the draft’s canonical JSON. The template must
be the one the draft is bound to (same hash). In `complete` mode every problem
fails the draft. In `incomplete` mode, missing template content is listed and
does not fail; invalid values and missing RM-required attributes (composer,
`ENTRY.subject`) still fail.

`prepareContribution` refuses to build a body when the committer is missing, the
composer is missing, validation fails in the chosen mode, or the draft is
already committed or discarded. The body is a REST ITS `NewContribution`:
`versions` (`UPDATE_VERSION` items with `lifecycle_state`, `data`,
`commit_audit`, and `preceding_version_uid` on an update) and `audit`
(`UPDATE_AUDIT`). `AUDIT_DETAILS.description` contains `oplog sha256:<hex>` and,
when you pass `logUri`, a hyperlink to the log. Each committed COMPOSITION gets
a `FEEDER_AUDIT`: you supply `originatingSystemAudit` for the system that
created the content; the builder always sets `feeder_system_audit` with the
deployment `systemId`, builder name `ehrtslib-contribution-builder`, and the
ehrtslib version ([ADR 0010](adr/0010-cb-commit-envelope-and-provenance.md)).

`ItsRestContributionAdapter` takes a `baseUrl`, optional `fetch`, and optional
headers. `commit` reads the CDR’s `EHR.system_id` unless you pass
`creatingSystemId`. On a failed POST of an update it re-reads the latest version
and, when the draft’s base is no longer latest, throws `CommitConflictError`
with a `ConflictReport`. The HTTP status is only a hint
([ADR 0009](adr/0009-cb-conflicts-and-rebase.md)).
`rebase(template, draftId, latestStored, resolutions)` replays the modify draft
onto that latest version. Each conflict is a `resolve` operation (`keep-ours`,
`keep-theirs`, `custom`, or `drop`). The new draft’s base is that latest
version.

Before the commit hash, `prepareContribution` compacts text edits to one
`set-value` per author and field and records authors who changed an entry in
`other_participations` with function `data entry`.

## Single caller and multi-caller

A **caller** is one app instance or device writing to the build. One person on
two devices is multi-caller. There is one `ContributionBuild` and one operation
format. The sync layer is what changes
([ADR 0002](adr/0002-cb-core-model-and-scope.md)).

A single caller uses `ContributionBuild.create(context)` with the default
`SingleAppLogAdapter`. `context.author.id` is required. `replica` defaults to
`a`. Operations apply directly.

Several callers edit the same draft by syncing one operation log through the
optional Automerge 3 adapter (`createMultiCaller`, `adapter.save()`,
`mergeCaller`). `rev` is required. Concurrent replay skips an operation it
cannot apply and reports it (`concurrentSkips`); a `set-value` or `edit-text`
with a stale `rev` is not applied. Presence (who is editing where) and per-value
author colour in a UI are described in the design and are not part of this
adapter. The log does record `author` on every operation, so a UI can colour
from that. Authors are whatever the caller passes in; operations are not signed.

## Example: one web app commits vital signs

One caller fills a vital-signs composition, validates it, and commits. The
sketch follows `test_data/tests/contribution_builder/contribution_build.test.ts`
and `commit.test.ts`. `observation` is an RM observation your form already built
(the tests generate one with `RMInstanceGenerator` in `example` mode from the
bound template). `optText` is ADL2 operational-template text or OPT 1.4 XML;
`bindTemplate` up-converts OPT 1.4.

```typescript
import {
  bindTemplate,
  ContributionBuild,
  DraftValidator,
  ItsRestContributionAdapter,
  prepareContribution,
  ROOT_TARGET,
} from "./contribution_builder/mod.ts";

const template = await bindTemplate(optText);
const build = ContributionBuild.create({
  author: { id: "nurse-1", name: "Nurse A" },
});
const draftId = build.newComposition(template, {
  language: "en",
  territory: "SE",
});

const obsKey = build.addInstance(draftId, ROOT_TARGET, "content", observation);
build.setValue(draftId, obsKey, "name/value", "Blood pressure");
// A nested ELEMENT is the same call once you have its short key from
// listNodeKeys or nodeUid: setValue(draftId, elementKey, "value/magnitude", 128).

build.setComposer(draftId, {
  _type: "PARTY_IDENTIFIED",
  name: "Nurse A",
});

const validator = await DraftValidator.create();
const check = validator.validate(build, draftId, template);
if (!check.valid) {
  // check.errors[].path, .node, .uid, .message
}

const config = { systemId: "org.example.deployment" };
const committer = { _type: "PARTY_IDENTIFIED", name: "Nurse A" };
const prepared = await prepareContribution(build, validator, config, {
  drafts: [{ draftId, template }],
  committer,
  creatingSystemId: "cdr.example.org",
});
// prepared.body is the REST ITS NewContribution.

const rest = new ItsRestContributionAdapter({
  baseUrl: "https://cdr.example.org/rest/openehr/v1",
});
await rest.commit(build, validator, config, ehrId, {
  drafts: [{ draftId, template }],
  committer,
});
```

Passing `creatingSystemId` skips the EHR lookup. Omitting it makes `commit` read
`system_id` from `GET /ehr/{ehr_id}`.

An unfinished note uses `build.setLifecycle(draftId, "incomplete")` and
`validate(..., { mode: "incomplete" })` (lifecycle 553). Commit still fails when
present values are wrong or RM-required attributes are missing. Whether a given
CDR stores that incomplete version is what `validationState` reports per
profile.

## Example: nurse and physician, one draft

The design’s shared-draft scenario: a nurse starts a note on a tablet and a
physician continues it on a desktop. Both edit the same uncommitted build. The
code path is the Automerge add-on, as in
`test_data/tests/contribution_builder/automerge_170.test.ts`. Each side has its
own `ContributionBuild`; they share the log by saving and merging Automerge
bytes.

```typescript
import { bindTemplate } from "./contribution_builder/mod.ts";
import { createMultiCaller, mergeCaller } from "./addons/cb_automerge/mod.ts";

const template = await bindTemplate(optText);
const nurse = createMultiCaller({
  author: { id: "nurse-1", name: "Nurse A" },
  replica: "n",
});
const draftId = nurse.build.newComposition(template, {
  language: "en",
  territory: "SE",
});
const nodeKey = nurse.build.listNodeKeys(draftId)[0];
nurse.build.setValue(draftId, nodeKey, "name/value", "Ward note", {
  rev: nurse.build.logRev(),
});

const physician = createMultiCaller(
  { author: { id: "physician-1", name: "Dr B" }, replica: "p" },
  { bytes: nurse.adapter.save(), buildId: nurse.build.buildId },
);
physician.build.setValue(
  draftId,
  nodeKey,
  "name/value",
  "Ward note, reviewed",
  { rev: physician.build.logRev() },
);
const skips = mergeCaller(nurse, physician.adapter);
// skips lists operations the concurrent policy did not apply.
```

`setValue` and `editText` on this adapter throw `CbOperationError` with code
`rev-required` when `rev` is omitted. A second write that still carries the old
`rev` is skipped as `changed-by-someone-else` when the logs merge, so one caller
does not silently replace the other’s free text.

When the note is ready, a member whose role is `committer` calls
`prepareContribution` / `ItsRestContributionAdapter.commit` with that
`memberId`. The nurse-and-physician colouring of each value, and live presence,
are UI concerns on top of `author` in the log; the adapter does not draw them.

## Demo

The Contribution Builder page is a separate HTML page in the existing demo
app, `examples/demo-app`, opened from the format-converter navigation. It is
not a new app under `examples/`. How to use it, what the hand-coded form does,
and where the pinned template comes from are in
[contribution-builder-demo.md](contribution-builder-demo.md). The live page is
[contribution-builder.html](https://eriksundvall.github.io/ehrtslib/demo/contribution-builder.html).

The page keeps two or more independent Automerge clones, delayed in-page sync,
hand-coded vital signs and diagnosis text, an operation log, and commit-output
tabs. The default commit destination is a local preview tab. POST to a test
CDR is optional and asks for confirmation before anything is sent. It
implements
[#281](https://github.com/ErikSundvall/ehrtslib/issues/281).

The [format-converter demo](https://eriksundvall.github.io/ehrtslib/demo)
([README](../examples/demo-app/README.md)) converts RM instances and simplified
formats. It shares this app's package and build, and it is not the
Contribution Builder page.

## Further reading

| Topic                                                     | Where                                                                                                                                                                                                           |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Split-pane demo                                           | [contribution-builder-demo.md](contribution-builder-demo.md)                                                                                                                                                    |
| Design (model, scenarios, single caller and multi-caller) | [maintainers/contribution-builder-design.md](maintainers/contribution-builder-design.md)                                                                                                                        |
| Delivery order                                            | [maintainers/roadmap.md](maintainers/roadmap.md) (Contribution Builder and multi-caller sections)                                                                                                               |
| Core model, `VERSION<T>`, canonical RM JSON               | [ADR 0002](adr/0002-cb-core-model-and-scope.md)                                                                                                                                                                 |
| Identity and uids                                         | [ADR 0003](adr/0003-cb-identity-and-uids.md)                                                                                                                                                                    |
| Operation log                                             | [ADR 0004](adr/0004-cb-operation-log-and-sync.md)                                                                                                                                                               |
| Composer and participations                               | [ADR 0006](adr/0006-cb-attribution-and-composer.md)                                                                                                                                                             |
| Template binding                                          | [ADR 0007](adr/0007-cb-template-binding.md)                                                                                                                                                                     |
| Validation and lifecycle                                  | [ADR 0008](adr/0008-cb-validation-and-lifecycle.md)                                                                                                                                                             |
| Conflicts and rebase                                      | [ADR 0009](adr/0009-cb-conflicts-and-rebase.md)                                                                                                                                                                 |
| Commit envelope and `FEEDER_AUDIT`                        | [ADR 0010](adr/0010-cb-commit-envelope-and-provenance.md)                                                                                                                                                       |
| Optional GraphQL API (proposed; not in the code)          | [ADR 0011](adr/0011-cb-optional-graphql-api.md)                                                                                                                                                                 |
| Add-on packages and patch formats (proposed)              | [ADR 0012](adr/0012-cb-add-on-packages-and-patch-formats.md)                                                                                                                                                    |
| Automerge adapter and concurrent apply                    | [ADR 0013](adr/0013-cb-crdt-library-and-apply-policy.md)                                                                                                                                                        |
| htmx add-on and editable ZipEHR HTML5 (proposed)          | [ADR 0014](adr/0014-cb-htmx-add-on-and-editable-zipehr-html5.md)                                                                                                                                                |
| Where FLAT, STRUCTURED, and ZipEHR load                   | [ADR 0016](adr/0016-optional-serializer-subpaths-simplified-and-zipehr.md)                                                                                                                                      |
| REST paper, Table 2                                       | [Sundvall et al. 2013](https://link.springer.com/article/10.1186/1472-6947-13-57)                                                                                                                               |
| Discourse thread cited by the design                      | [CONTRIBUTION builder supporting collaborative editing?](https://discourse.openehr.org/t/contribution-builder-supporting-collaborative-multi-user-multi-device-editing-graphql-operational-transformation/2071) |

ADR 0011 cites further Discourse threads about GraphQL, template symbols, and
naming. Those belong with that ADR, not with day-to-day use of the builder.
