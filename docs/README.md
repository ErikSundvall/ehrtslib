# ehrtslib documentation

**Primary audience:** developers building applications with ehrtslib.

## Start here

| Goal | Doc |
| ---- | --- |
| Hello world / packages | [getting-started.md](getting-started.md) |
| Create compositions (constructors + terse codes) | [../SIMPLIFIED-CREATION-GUIDE.md](../SIMPLIFIED-CREATION-GUIDE.md) |
| Dual getters (`name` vs `$name`) | [../DUAL-APPROACH-GUIDE.md](../DUAL-APPROACH-GUIDE.md) |
| FLAT / STRUCTURED / Web Template | [SIMPLIFIED_FORMATS.md](SIMPLIFIED_FORMATS.md) |
| Load archetype/template file sets | [CLINICAL_MODEL_FILESETS.md](CLINICAL_MODEL_FILESETS.md) |
| ADL 1.4 / 2 + OPT/OET | [ADL_SUPPORT.md](ADL_SUPPORT.md) |
| ADL2 round-trip fidelity | [ADL2_ROUNDTRIP.md](ADL2_ROUNDTRIP.md) |
| RM attribute introspection API | [RM_ATTRIBUTES.md](RM_ATTRIBUTES.md) |
| Validation gaps | [VALIDATION_LIMITATIONS.md](VALIDATION_LIMITATIONS.md) |

## Serialization formats

Guides live next to the code (import the format module, open its README):

| Format | Guide |
| ------ | ----- |
| JSON (ITS + configurable) | [enhanced/serialization/json/README.md](../enhanced/serialization/json/README.md) |
| XML | [enhanced/serialization/xml/README.md](../enhanced/serialization/xml/README.md) |
| YAML | [enhanced/serialization/yaml/README.md](../enhanced/serialization/yaml/README.md) |
| ZipEHR (experimental) | [enhanced/serialization/zipehr/README.md](../enhanced/serialization/zipehr/README.md) |
| Markdown / AsciiDoc (experimental) | [markdown](../enhanced/serialization/markdown/README.md) · [asciidoc](../enhanced/serialization/asciidoc/README.md) |
| TypeScript emit | [typescript](../enhanced/serialization/typescript/README.md) |

Also: [examples/](../examples/README.md) and the [demo app](../examples/demo-app/README.md).

## Name collision: “simplified”

| Phrase | Means | Doc |
| ------ | ----- | --- |
| **Simplified creation** | Easier RM object constructors + terse code strings | `SIMPLIFIED-CREATION-GUIDE.md` |
| **Simplified formats** | openEHR ITS-REST FLAT / STRUCTURED / Web Template | [SIMPLIFIED_FORMATS.md](SIMPLIFIED_FORMATS.md) |

These are unrelated features.

## Offline openEHR language specs

[reference_for_llms/](reference_for_llms/) mirrors official specs for offline/LLM use. Prefer live specs or the openehr-assistant MCP when online. This is **not** ehrtslib API documentation.

(Note to Ehrtslib Maintainers / maintaining agents: see [maintainers/](maintainers/) instead — keep that documenteation out of the newcomer/user journey to reduce confusion.)
