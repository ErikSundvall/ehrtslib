# Domain glossary (ehrtslib)

Terms used when discussing clinical modelling integrations. Implementation details belong in ADRs and code, not here.

## Better Archetype Designer template (`.t.json`)

JSON serialisation of an AOM **`TEMPLATE`** (and embedded **`TEMPLATE_OVERLAY`** objects) produced by Better’s **Archetype Designer** (openEHR tools at [tools.openehr.org/designer](https://tools.openehr.org/designer/)). Uses `@type` discriminators (e.g. `"TEMPLATE"`, `"C_COMPLEX_OBJECT"`). May declare `adlVersion` **1.4** or **2.x**; content is a **differential** template with optional overlays, not an operational template.

*Not the same as* **Web Template** (ITS-REST simplified schema used for FLAT/STRUCTURED).

## Web Template

JSON tree derived from an **operational template** for simplified composition serialisation (FLAT/STRUCTURED). Built in ehrtslib by `buildWebTemplate()` from OPT/AOM operational templates.

## CKM mirror repository

Git-hosted copy of archetypes and templates (e.g. [regionstockholm/CKM-mirror-via-modellbibliotek](https://github.com/regionstockholm/CKM-mirror-via-modellbibliotek)), often organised with `/local`, `/local/archetypes`, `/local/templates`, and project-specific branches (e.g. `MultiDiciplinery_Tumor_meetings`).

## Template file set

In-memory workspace of related archetype/template/OPT/OET/`.t.json` files used to resolve references and flatten to an operational template (`TemplateWorkspace`, `ClinicalModelWorkspace`).

## Clinical model workspace

Library type `ClinicalModelWorkspace` — editable file set with `updateFileContent`, `exportFile` / `exportEntries` (for future annotation tools and download), `loadFromZipEntries`, read-only `loadFromGitHub(spec)` (whole branch tree), and `loadFromGitHubTemplateUrl(url)` (single `.t.json` + recursive dependencies).
