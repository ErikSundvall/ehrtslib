# Markdown and AsciiDoc document codecs

Optional codecs for openEHR RM instances (not archetype/template ADL). Import explicitly:

```ts
import {
  MarkdownSerializer,
  MarkdownDeserializer,
  EMBEDDING_MARKDOWN_CONFIG,
  STRUCTURAL_MARKDOWN_CONFIG,
} from "ehrtslib/serialization-markdown";

import {
  AsciidocSerializer,
  AsciidocDeserializer,
  EMBEDDING_ASCIIDOC_CONFIG,
  LOSSLESS_ASCIIDOC_CONFIG,
} from "ehrtslib/serialization-asciidoc";
```

## Supported round-trip matrix

| Representation | Markdown dialect | AsciiDoc dialect |
| --- | --- | --- |
| RM `COMPOSITION` / `SECTION` / core `ENTRY` types (with template for path validation) | `structural` | `lossless` |
| Clinical / compact / **embedding** / wikilink presets | Output-only | Output-only |

**Embedding** presets (`EMBEDDING_MARKDOWN_CONFIG`, `EMBEDDING_ASCIIDOC_CONFIG`) strip archetype node ids, headers, terse codes, and URN links while keeping clinical hierarchy and display text. Parsers reject them as lossless inputs.

Archetype references in cross-links use **AOM** URNs: `urn:openehr:aom:org.openehr::openEHR-EHR-…` (project convention; not `urn:openehr:am:`).

## Same-input comparison

Use one clinical instance (for example the demo blood-pressure composition) and compare:

- `STRUCTURAL_MARKDOWN_CONFIG` / `LOSSLESS_ASCIIDOC_CONFIG` — round-trip capable
- `EMBEDDING_*` — smaller, human-readable text for RAG; not reversible

Measure sizes with the demo’s `gpt-tokenizer` `o200k_base` counter (exact for that encoding only). The demo passes `{ disallowedSpecial: new Set() }` so strings such as `<|endoftext|>` are BPE tokenized as literal clinical text, not as chat special tokens (contrast `allowedSpecial: "all"`, which counts a lone `<|endoftext|>` as one special token).

Structural Markdown / lossless AsciiDoc emit `- _structure:_ ITEM_LIST` (etc.) when the RM type is not `ITEM_TREE`, so nested item structures round-trip with the correct RM class.

**Limits:** Document codecs round-trip **RM instances** with template-assisted validation; they do not claim full reversibility of archetypes, operational templates, or ADL/OPT authoring artefacts.
