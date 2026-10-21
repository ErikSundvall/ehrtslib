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
  updated using Y.js or
- Create build step to genenrate minified and web component versions


Create /dist directory and subdirectories with different distributions for
targeted purposes for example
- compact code for browser use
- simultaneous multi-user editing
- complete release e.g. for making advanced tooling

create/update end user docs 

## Phase X - Contribution builder
Implement "contribution builder" suggestion in https://link.springer.com/article/10.1186/1472-6947-13-57 including the table https://link.springer.com/article/10.1186/1472-6947-13-57/tables/2 Ît should be possible to run a variant of this on the client side in web/mobile apps so that they can send valid entire contributions to backend openEHR REST servers. Also a variant should be runanble on server side.

## Phaze X - multiuser contribution builder
CRDT or OT enabled multiuser contribution builder enabling collaborative editing of uncomitted contribution in a style similar to "google docs" collaboration. (Preferably P2P with continous server persistence possiblility) Include indicators of what users are editing where currently and possibility to switch on source/user coloring of enteresd inf in a way similar to https://etherpad.org/. Also allow conversion of this info to openEHR's ENTRY.provider attribute

## Phase X - CDR proxy
Make a Deno based ehrtslib openEHR CDR proxy 
- that includes conversion of all ehrtslib added formats and externally is exposed as a normal openEHR CDR but that accepts more media types
- that adds a (multiuser?) contribution builder to a standard CDR
- Make sure to do releases that export the proxy via Deno's export as single executable files for various operating systems
- Possibly add features mising in the official spec but suggested in https://link.springer.com/article/10.1186/1472-6947-13-57 - for example 
  - bookmarking and 
  - automatic hashing and storage of ad hoc queries so that they become easier to audit and efficient to reuse