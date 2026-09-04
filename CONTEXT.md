# Domain glossary (ehrtslib)

Terms used when discussing clinical modelling integrations. Implementation details belong in ADRs and code, not here.

## Specification description

BMM `documentation` text for an openEHR class or one of its attributes, used as help copy in applications. Looked up by class name (and optional component) from the optional `spec` package.

_Avoid_: JSDoc, Javadoc, “spec blob”

## Specification HTML URL

Canonical HTML class-section URL on the openEHR **development** stream (the documents linked from [development_baseline](https://specifications.openehr.org/development_baseline)), including the class fragment.

## Specification Markdown URL

Markdown twin of a **Specification HTML URL**, as advertised by [llms.txt](https://specifications.openehr.org/llms.txt) (same path with `.md` instead of `.html`). Contains prose, not the HTML class attribute tables.

## Better Archetype Designer template (`.t.json`)

JSON serialisation of an AOM **`TEMPLATE`** (and embedded **`TEMPLATE_OVERLAY`** objects) produced by Better’s **Archetype Designer** (openEHR tools at [tools.openehr.org/designer](https://tools.openehr.org/designer/)). Uses `@type` discriminators (e.g. `"TEMPLATE"`, `"C_COMPLEX_OBJECT"`). May declare `adlVersion` **1.4** or **2.x**; content is a **differential** template with optional overlays, not an operational template.

*Not the same as* **Web Template** (ITS-REST simplified schema used for FLAT/STRUCTURED).

## Web Template

JSON tree derived from an **operational template** for simplified composition serialisation (FLAT/STRUCTURED). Built in ehrtslib by `buildWebTemplate()` from OPT/AOM operational templates.

## CKM mirror repository

Git-hosted copy of archetypes and templates (e.g. [regionstockholm/CKM-mirror-via-modellbibliotek](https://github.com/regionstockholm/CKM-mirror-via-modellbibliotek)), often organised with `/local`, `/local/archetypes`, `/local/templates`, and project-specific branches (e.g. `MultiDiciplinery_Tumor_meetings`).

## openEHR model examples repository

Curated subset for demos and tests: [Ehrlibs/openEHR-model-examples](https://github.com/Ehrlibs/openEHR-model-examples). Same `/local` layout as a CKM mirror, but only the models needed for examples (including the Accident report + vital signs theme pack). Preferred first source for the ehrtslib demo AD@git catalog.

## Template file set

In-memory workspace of related archetype/template/OPT/OET/`.t.json` files used to resolve references and flatten to an operational template (`TemplateWorkspace`, `ClinicalModelWorkspace`).

## Clinical model workspace

Library type `ClinicalModelWorkspace` — editable file set with `updateFileContent`, `exportFile` / `exportEntries` (for future annotation tools and download), `loadFromZipEntries`, read-only `loadFromGitHub(spec)` (whole branch tree), and `loadFromGitHubTemplateUrl(url)` (single `.t.json` + recursive dependencies).

## Library layout (hand-written vs generated)

| Path | Meaning |
|------|---------|
| `base/`, `rm/`, `am/`, `lang/`, `term/` | Hand-written openEHR model implementations, split by BMM package |
| `parser/`, `serialization/`, `validation/`, `generation/`, `meta/` | Tooling layers over the model |
| `spec/` | Optional BMM class/attribute descriptions and specification URLs |
| `generated/` | BMM-emitted stubs — never hand-edit |
| `mod.ts` | Public namespaced barrel |
| `openehr_*.ts` | Stable single-component re-exports |

See [docs/maintainers/hand-written-vs-generated.md](docs/maintainers/hand-written-vs-generated.md).
