# Roadmap

Active work only. Finished phases live in [roadmap-archive.md](roadmap-archive.md).

Phases 5a through 6b, 7a, 7b, 7c and 7e are archived. What follows is still open or only partly done.

## Phase 7d Better `.t.json` + GitHub file sets — partly done (likely not fully tested)
- `parseTemplateJson` / `template_json` repository kind (Archetype Designer JSON AOM)
- `normalizeBetterTemplateJson` — Better/AD export dialect (camelCase AM fields, occurrences, terminology codes, intervals; see [Discourse #4389](https://discourse.openehr.org/t/incompatibility-issues-when-using-archetype-designer-s-export-fileset-t-json-files/4389))
- `ClinicalModelWorkspace`: `updateFileContent` / `exportFile` / `exportEntries` (dirty flag for future annotation editor), ZIP + read-only GitHub (`owner/repo@branch:path`, optional `GITHUB_TOKEN`)
- Docs: `docs/CLINICAL_MODEL_FILESETS.md`; fixture `test_data/tjson/Care unit v2.t.json`
- Demo: `.t.json` in ZIP upload, GitHub toolbar, blue `t.json` tab badge, validation labels for `template_json`


## Remaining (Phase 8b+)
- OPT ↔ ADL2 OPT2 round-trip (no public OPT2 corpus yet)
- More OET tests, compile with CKM archetype bank (needs larger fixture download)

OPT XML constraint closeout (#75 serialize, #76 quantity intervals, #77 `C_DV_CODED_TEXT`, plus `C_DV_ORDINAL.list`) is implemented with the simplified-format range round-trip.

## Phase X - dist and docs

- One version of this code needs to be small so that it can fit and be run
  eficiently inside form engines etc.
- Also make a (less lightweight) version that can be synchronously multiuser
  updated using a CRDT (library chosen in the multi-user contribution builder
  spike below)
- Create build step to genenrate minified and web component versions


Create /dist directory and subdirectories with different distributions for
targeted purposes for example
- compact code for browser use
- simultaneous multi-user editing
- complete release e.g. for making advanced tooling

create/update end user docs 

## Phase X - Contribution builder
Design: [contribution-builder-design.md](contribution-builder-design.md) and
ADRs [0002](../adr/0002-cb-core-model-and-scope.md) to
[0010](../adr/0010-cb-commit-envelope-and-provenance.md), plus
[0011](../adr/0011-cb-optional-graphql-api.md) (optional GraphQL API) and
[0012](../adr/0012-cb-add-on-packages-and-patch-formats.md) (add-on packages).

Implement the "contribution builder" suggested in
https://link.springer.com/article/10.1186/1472-6947-13-57, including the verbs
in [Table 2](https://link.springer.com/article/10.1186/1472-6947-13-57/tables/2)
(new build, update-version, copy-version, from-form, from-ehr-path,
from-instance-template, validate, commit). It must run client side in
web/mobile apps, so they can send valid whole contributions to openEHR REST
servers, and server side.

The design covers every versioned type; delivery is staged:
1. Core `ContributionBuild`, operation log, uid scheme and `UPDATE_*` commit
   envelope (all generic over `VERSION<T>`), single-app adapter, for
   **COMPOSITION** first. Template binding with canonical hash, validation
   (complete and incomplete), conflict data on 412, ADL 1.4 down-conversion
   at commit, and up-conversion of legacy OPT 1.4 XML to an ADL2 operational
   template with id-codes.
2. Other versioned types: `EHR_STATUS`, `EHR_ACCESS`, `FOLDER`, then
   demographic `PARTY` types. No log or envelope format changes.
3. Pluggable storage and optional encrypted local draft persistence.
4. Integration tests against EHRbase and FerroEHR dev instances.
5. Optional GraphQL module over build content
   ([ADR 0011](../adr/0011-cb-optional-graphql-api.md)): addressing by uid,
   ADL2 codes, any template annotation (including `a.id` symbols), node
   names in a chosen language, or mixed paths of these. Every mutation goes
   through the operation log. Shipped as a separate add-on release file,
   not in the main bundles.
6. Add-on packages ([ADR 0012](../adr/0012-cb-add-on-packages-and-patch-formats.md)),
   each a separate release file: Simplified Formats (FLAT and STRUCTURED
   create, read and patch) and canonical XML (create, and patch with RFC
   5261 XML Patch). Later: an htmx add-on for server-rendered forms.


## Phase X - multiuser contribution builder
CRDT-based multi-user / multi-device contribution builder for collaborative
editing of an uncommitted contribution, similar to "Google Docs"
collaboration (preferably P2P, with optional continuous server persistence).
Builds on the same core and operation log as the single-app builder.
1. **Spike first:** compare Automerge and Loro on a real template (full
   replayable history, compact binary log, Deno + browser support, licence).
   Record the choice in its own ADR.
2. CRDT sync adapter, replica uid prefixes, presence indicators showing who
   is editing where.
3. Optional source/user colouring of entered information, similar to
   https://etherpad.org/, taken from the operation log (not stored in RM
   data).
4. Conversion of editor attribution into `other_participations` (function
   such as "data entry"). `ENTRY.provider` stays for an explicitly recorded
   information source only.
5. Session playback (replay of the log).

## Phase X - openEHR merge conflict resolver UI
Separate later project, depends on the contribution builder's structured
conflict output (ADR 0009). A clinician-facing UI, likely AI-assisted, that
shows our change, their change and the base value per conflict and returns a
list of resolutions to the builder.

## Phase X - CDR proxy
Make a Deno based ehrtslib openEHR CDR proxy 
- that includes conversion of all ehrtslib added formats and externally is exposed as a normal openEHR CDR but that accepts more media types
- that adds a (multiuser?) contribution builder to a standard CDR
- Make sure to do releases that export the proxy via Deno's export as single executable files for various operating systems
- Possibly add features mising in the official spec but suggested in https://link.springer.com/article/10.1186/1472-6947-13-57 - for example 
  - bookmarking and 
  - automatic hashing and storage of ad hoc queries so that they become easier to audit and efficient to reuse