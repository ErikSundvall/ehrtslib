# Serialization formats

Format-specific guides live next to each module. Pick a format, open its README,
import from that module’s `mod.ts`.

| Format | Module | Audience notes |
| ------ | ------ | -------------- |
| **JSON** | [`json/`](json/README.md) | ITS-JSON + configurable (compact / type-inferred) |
| **XML** | [`xml/`](xml/README.md) | ITS-XML |
| **YAML** | [`yaml/`](yaml/README.md) | Human-readable; shares type inference with JSON |
| **ZipEHR** | [`zipehr/`](zipehr/README.md) | Experimental compact JSON/YAML/XHTML/HTML5 |
| **FLAT / STRUCTURED** | see [docs/SIMPLIFIED_FORMATS.md](../../docs/SIMPLIFIED_FORMATS.md) | Web Template–based simplified formats |
| **Markdown** | [`markdown/`](markdown/README.md) | Experimental clinical / LLM-oriented |
| **AsciiDoc** | [`asciidoc/`](asciidoc/README.md) | Experimental |
| **TypeScript emit** | [`typescript/`](typescript/README.md) | Constructor source generation |

Shared infrastructure (`TypeRegistry`, `TypeInferenceEngine`) lives in
[`common/`](common/). Type inference for omitting/recovering `_type` is
BMM-backed via [`enhanced/meta`](../../docs/RM_ATTRIBUTES.md).
