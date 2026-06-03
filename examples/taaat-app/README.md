# TAAAT — Template and Archetype Annotation Tool

Browser demo for viewing and editing openEHR `annotations.documentation` on archetypes and templates loaded from GitHub (recursive closure) or local files.

## Build

```bash
deno task build:taaat
```

Output: `docs/taaat/` (linked from the main [docs index](../../docs/index.html)).

## Dev server

```bash
cd examples/taaat-app
deno task dev
```

Serves `docs/taaat/` at http://localhost:8001 with watch rebuild.

## Tests

```bash
cd examples/taaat-app
deno task test          # palette unit tests
deno test -A --no-check ../..   # from repo root: parser + UI smoke (needs static server on :8765 for UI)
```

UI smoke test: build first, serve `docs/taaat/` (e.g. `python3 -m http.server 8765`), then:

```bash
TAAAT_BASE_URL=http://127.0.0.1:8765 deno test -A --no-check examples/taaat-app/src/ui_smoke_test.ts
```

## Library API

See `enhanced/parser/clinical_model_annotations.ts` and `ClinicalModelWorkspace.loadFromGitHubClinicalModelUrl()`.
