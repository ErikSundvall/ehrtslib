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
