# Markdown and AsciiDoc document codecs

Optional codecs for openEHR RM instances (not archetype/template ADL). Import explicitly:

```ts
import {
  MarkdownSerializer,
  MarkdownDeserializer,
  COMPACT_MARKDOWN_CONFIG,
  EMBEDDING_MARKDOWN_CONFIG,
  STRUCTURAL_MARKDOWN_CONFIG,
} from "ehrtslib/serialization-markdown";

import {
  AsciidocSerializer,
  AsciidocDeserializer,
  COMPACT_ASCIIDOC_CONFIG,
  EMBEDDING_ASCIIDOC_CONFIG,
  STRUCTURAL_ASCIIDOC_CONFIG,
} from "ehrtslib/serialization-asciidoc";
```

## Shared preset names

Both codecs expose the same four preset ids: `structural`, `compact`, `embedding`, `wikilink`.

| Representation | Markdown | AsciiDoc |
| --- | --- | --- |
| RM `COMPOSITION` / `SECTION` / core `ENTRY` types (with template for path validation) | `structural` | `structural` |
| Human-readable output (tables, wikilinks, optional front matter / header) | `compact` | `compact` |
| Token-minimal prose (output-only) | `embedding` | `embedding` |
| URN wikilinks on headings (output-only) | `wikilink` | `wikilink` |

`compact`, `embedding`, and `wikilink` are **output-only** — deserializers reject them.

## Compact vs embedding

**Compact** (`COMPACT_*_CONFIG`) is the merged human-readable preset: GFM or pipe tables with **Item | Value | Time**, terminology wikilinks, and optional YAML/front-matter style metadata (Markdown) or header attributes (AsciiDoc).

**Embedding** (`EMBEDDING_*_CONFIG`) strips codes, URIs, front matter, and list bullets for the smallest token footprint (Markdown inline `key: value`; AsciiDoc definition lists).

Archetype references in cross-links use **AOM** URNs: `urn:openehr:aom:org.openehr::openEHR-EHR-…` (project convention; not `urn:openehr:am:`).

## Same-input comparison

Use one clinical instance (for example the demo blood-pressure composition) and compare:

- `STRUCTURAL_*_CONFIG` — round-trip capable
- `COMPACT_*` — readable charts with event times
- `EMBEDDING_*` — smaller text for RAG; not reversible
- `WIKILINK_*` — URN-linked headings

Measure sizes with the demo’s `gpt-tokenizer` `o200k_base` counter (exact for that encoding only). The demo passes `{ disallowedSpecial: new Set() }` so strings such as `<|endoftext|>` are BPE tokenized as literal clinical text, not as chat special tokens (contrast `allowedSpecial: "all"`, which counts a lone `<|endoftext|>` as one special token).

Structural Markdown / structural AsciiDoc emit `- _structure:_ ITEM_LIST` (etc.) when the RM type is not `ITEM_TREE`, so nested item structures round-trip with the correct RM class.

### Sparse machine annotations (`oe:v1`)

Structural serializers add **hidden value typing only when display text is ambiguous** — not on every field.

| Dialect | Carrier |
| --- | --- |
| Markdown `structural` | `<!-- oe:v1:b64:… -->` after the list item |
| AsciiDoc `structural` | `// oe:v1:b64:…` at end of line |

Payload: base64url-encoded UTF-8 JSON (`_type` + minimal value fields). Parsers treat it as authoritative; bad payloads → `InvalidFormatError`. Embedding output includes **no** `oe:v1` markers.

Typically **no** annotation: clear quantities (`145 mm[Hg]`), terse coded values with `[term::code]` in the line. Typically **yes**: coded rubrics without visible codes, `DV_COUNT`, `DV_ORDINAL`, `DV_TEXT` that looks like a date/quantity, extra fields such as `precision`.

**Limits:** Document codecs round-trip **RM instances** with template-assisted validation; they do not claim full reversibility of archetypes, operational templates, or ADL/OPT authoring artefacts. Large OPT example instances may be template-valid after round-trip without full canonical JSON equality when optional document branches are elided.
