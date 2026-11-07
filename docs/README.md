# ehrtslib documentation

**Primary audience:** developers building applications with ehrtslib.

**Maintainers / agents:** see [maintainers/](maintainers/) — keep that path out of the user journey.

## Start here

| Goal | Doc |
| ---- | --- |
| Hello world / packages | [getting-started.md](getting-started.md) |
| Contribution Builder (draft, validate, commit) | [contribution-builder.md](contribution-builder.md) |
| Contribution Builder split-pane demo | [contribution-builder-demo.md](contribution-builder-demo.md) |
| Pinned release: source zip, CDN import, runtime bundles | [library-package.md](library-package.md) |
| Brief property styles (constructors + terse codes) | [user/brief-property-styles.md](user/brief-property-styles.md) |
| Dual getters (`name` vs `$name`) | [user/dual-accessors.md](user/dual-accessors.md) |
| FLAT / STRUCTURED / Web Template | [SIMPLIFIED_FORMATS.md](SIMPLIFIED_FORMATS.md) |
| Load archetype/template file sets | [CLINICAL_MODEL_FILESETS.md](CLINICAL_MODEL_FILESETS.md) |
| ADL 1.4 / 2 + OPT/OET | [ADL_SUPPORT.md](ADL_SUPPORT.md) |
| Release notes | [../CHANGELOG.md](../CHANGELOG.md) |
| Terminology lookup (scoped at-codes) | [ADL_SUPPORT.md](ADL_SUPPORT.md#terminology-lookup-at0001-is-not-global) |
| ADL2 round-trip fidelity | [ADL2_ROUNDTRIP.md](ADL2_ROUNDTRIP.md) |
| RM attribute introspection API | [RM_ATTRIBUTES.md](RM_ATTRIBUTES.md) |
| Validation gaps | [VALIDATION_LIMITATIONS.md](VALIDATION_LIMITATIONS.md) |
| Pre-1.0 API removals and renames | [maintainers/api-changes.md](maintainers/api-changes.md) |

## Contribution Builder

The Contribution Builder assembles an openEHR `CONTRIBUTION` in the client or on a server before a CDR commit. It holds drafts, validates them against the bound operational template, and builds a REST ITS `NewContribution` for one caller or several. Verbs, the canonical RM JSON model, and two worked sketches are in [contribution-builder.md](contribution-builder.md).

- Overview, verbs, and examples: [contribution-builder.md](contribution-builder.md)
- Split-pane demo: [contribution-builder-demo.md](contribution-builder-demo.md)
- Design / ADRs: [maintainers/contribution-builder-design.md](maintainers/contribution-builder-design.md), [ADR 0002](adr/0002-cb-core-model-and-scope.md) through [0014](adr/0014-cb-htmx-add-on-and-editable-zipehr-html5.md), and [0016](adr/0016-optional-serializer-subpaths-simplified-and-zipehr.md)

## Serialization formats

| Format | Guide |
| ------ | ----- |
| Format matrix | [serialization/README.md](../serialization/README.md) |
| JSON | [json/README.md](../serialization/json/README.md) |
| XML | [xml/README.md](../serialization/xml/README.md) |
| YAML | [yaml/README.md](../serialization/yaml/README.md) |
| ZipEHR | [zipehr/README.md](../serialization/zipehr/README.md) |

Also: [examples/](../examples/README.md), the [demo app](../examples/demo-app/README.md), and curated models in [Ehrlibs/openEHR-model-examples](https://github.com/Ehrlibs/openEHR-model-examples).

## Offline openEHR language specs

[vendor/](vendor/) summarizes relevant parts of official specs for offline/LLM use. Prefer live specs or the openehr-assistant MCP when available.

## Background research

[research/](research/) holds dated, non-normative research notes linked from issues and forum posts.
