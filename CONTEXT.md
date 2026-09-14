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

## TAAAT

Template and Archetype Annotation Tool — the ehrtslib browser UI for viewing and editing **path annotations** on archetypes and templates.

_Avoid_: TAAT, annotation designer, Archetype Designer

## Definition tree

The constraint tree of an archetype or template (`definition` and its children). It is the authored model, not a runtime composition instance.

_Avoid_: composition tree, form tree, web template tree (a derived projection)

## Path annotation

A free-form key/value pair stored under `annotations.documentation[language][path][key]` on an archetype, template, overlay, or operational template. Keys are not part of the constraint tree.

_Avoid_: comment, metadata, term definition

## Annotation language bag

One language compartment of **path annotations** (`documentation[language]`). Better Archetype Designer exports annotations as language-specific, so a key present only in `sv` can disappear when OPT export uses another primary language.

_Avoid_: translation, terminology, ontology

## L10n annotation

A **path annotation** whose key is `L10n.{language}` and whose value is the translated occurrence name for that node. Workaround for ADL 1.4 OPT storing one ontology block per archetype id, which cannot hold independent translations for repeated/renamed occurrences of the same archetype.

_Avoid_: term definition, name constraint, localizedNames (web-template projection of the same idea)

## Example dialogue

> **Modeller:** The template uses `SECTION.adhoc` twice — “Medical equipment at home” and “Social situation”. Swedish labels vanish in the OPT.
>
> **Dev:** That’s the OPT ontology limit. We don’t rewrite the **definition tree**. We add **L10n annotations** (`L10n.sv`, `L10n.fr`, …) on each occurrence path, and copy those keys into every **annotation language bag** so any primary-language export keeps them.
>
> **Modeller:** Will that overwrite my `design note` on the same node?
>
> **Dev:** No. Generation only writes `L10n.*` keys. Other **path annotations** and the whole constraint tree stay put.

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
