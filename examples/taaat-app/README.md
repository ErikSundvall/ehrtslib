# TAAAT — Template and Archetype Annotation Tool

Browser demo for viewing and editing openEHR `annotations.documentation` on
archetypes and templates. Choose **Local files** or **GitHub**, then only the
controls for that workflow are shown.

- **Local files** — pick `.adl` / `.adls` / `.t.json` from disk and **Download**
  the annotated file.
- **GitHub** — pick a curated example (Ehrlibs Accident report, Simple diagnose
  and vitals, Region Stockholm MDT) or paste a blob/raw URL, optionally sign in
  with a
  [GitHub personal access token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)
  (Contents: Read and write to commit), and **Commit to GitHub**.

Annotation **families** (dotted key prefixes such as `L10n.` and `a.`) can be
added from the legend. Favourites — including a list of suggested values per key
— live inside each family except **L10n**, which keeps its generate panel. The
`a.` family is pre-filled from the
[UI-hint / automation examples](https://discourse.openehr.org/t/agreeing-on-optional-user-interface-hints-in-templates/2406/19).

## Tutorial

The live page is
[https://eriksundvall.github.io/ehrtslib/taaat/](https://eriksundvall.github.io/ehrtslib/taaat/)
(bleeding edge). Frozen releases stay at `/taaat-vX.Y/`. The lower-left footer
shows the package version and build id. On GitHub Pages, a build that is not
the recommended stable release offers a link to switch to it, and also links
here. Add `?version-warning=preview` on any host to review that notice.

### Open a model

**Local files.** Choose **Local files**, then **Choose local files**, and pick
one or more `.adl`, `.adls`, or `.t.json` files. The file menu selects which
model is on screen. **Download** saves the annotated file.

**GitHub.** Choose **GitHub**. Pick a curated example (Ehrlibs Accident report,
Simple diagnose and vitals, Region Stockholm MDT) or paste a blob or raw URL,
then **Load from GitHub**. A
[personal access token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)
with Contents read and write is optional until you **Commit to GitHub**.

### Read the outline

Every definition-tree node stays visible. **Filter outline** narrows the list.
Pills on a node show annotation values from the language bags and families that
are switched on. Click a language chip or a family chip to show or hide that
bag or family. The original language uses a thicker outline.

### Edit annotations

Select a node. The right pane is one section per family.

- Add a dotted prefix (for example `fhir.`) with **Add family**.
- Inside a family other than L10n, favourite keys can carry a list of suggested
  values. **Export families** / **Import families** saves that legend as JSON.
- Keys without a prefix (`comment`, `design note`, `ui`) stay in their own
  family.
- Language bags come from the loaded model (original language, translations,
  description details, terminology). There is no control to add a bag.
- Logic and UI keys (`a.*`) are kept in the original language. Use **Copy
  original to…** when an export will treat another bag as primary.

### L10n is a workaround for older OPT export

The **L10n** family is partly a workaround for older openEHR ADL operational
template (OPT) formats, not a general design for localisation.

ADL 1.4 OPT cannot carry multilingual names for repeated, renamed parts of the
same archetype. That limit, and the case for language-neutral annotations, is
described in
[Limitation preventing multilingual repeated parts in the OPT operational template export format](https://discourse.openehr.org/t/limitation-preventing-multilingual-repeated-parts-in-the-opt-operational-template-export-format/2760).
Better Archetype Designer stores those occurrence names as language-specific
`annotations.documentation` keys of the form `L10n.{lang}`.

**Generate L10n annotations** writes only `L10n.*` keys, can copy them into
every language bag (AD treats annotations as language-specific), and does not
change the constraint tree or any other family. Existing `L10n.*` values are
left alone unless you opt into overwrite. A language-neutral annotation type
is what that discussion asks for; current AD and OPT tooling still consume the
`L10n.*` keys. See
[ADR 0001](../../docs/adr/0001-l10n-annotation-generation.md).

## Build

```bash
deno task build:taaat
```

Output: `docs/taaat/` (linked from the main
[docs index](../../docs/index.html)).

## Dev server

```bash
cd examples/taaat-app
deno task dev
```

Serves `docs/taaat/` at http://localhost:8001 with watch rebuild.

The live TAAAT page is an outline explorer: every definition-tree node stays
visible, with annotation pills from all language bags. Family sections in the
right pane use
[Shoelace `sl-details`](https://shoelace.style/components/details) (CDN
autoloader 2.20.1); load controls, filters, legend chips, and the workspace
split also use Shoelace.

Language bags come from the loaded openEHR template or archetype (original
language, translations, description details, terminology). There is no “add
language bag” control.

Earlier throwaway variants: http://localhost:8001/prototype.html — see
[`prototype/NOTES.md`](prototype/NOTES.md).

## Tests

```bash
cd examples/taaat-app
deno task test          # family store + example picker unit tests
deno test -A --no-check ../..   # from repo root: parser + UI smoke (needs static server on :8765 for UI)
```

UI smoke test: build first, serve `docs/taaat/` (e.g.
`python3 -m http.server 8765`), then:

```bash
TAAAT_BASE_URL=http://127.0.0.1:8765 deno test -A --no-check examples/taaat-app/src/ui_smoke_test.ts
```

## Library API

See `parser/clinical_model_annotations.ts` and
`ClinicalModelWorkspace.loadFromGitHubClinicalModelUrl()`.
