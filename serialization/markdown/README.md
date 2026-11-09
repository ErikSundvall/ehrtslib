# Markdown serialization (openEHR RM → GFM)

Optional codec: import `ehrtslib/serialization-markdown` or `serialization/markdown/mod.ts`.

## Presets

**structural**, **compact**, **embedding**, and **wikilink** share the same names and RM simplification rules as AsciiDoc. Full preset reference, rule matrix, and Markdown vs AsciiDoc examples:

**[Document presets and RM simplification rules](../documents-presets.md)**

Quick map:

| Preset | Config | Round-trip |
|--------|--------|------------|
| structural | `STRUCTURAL_MARKDOWN_CONFIG` | Yes (with template) |
| compact | `COMPACT_MARKDOWN_CONFIG` | No |
| embedding | `EMBEDDING_MARKDOWN_CONFIG` | No |
| wikilink | `WIKILINK_MARKDOWN_CONFIG` | No |

`MARKDOWN_CODEC_MATRIX.outputOnlyPresets`: `compact`, `embedding`, `wikilink`.

```typescript
import { MarkdownSerializer, COMPACT_MARKDOWN_CONFIG } from "./mod.ts";
const md = new MarkdownSerializer(COMPACT_MARKDOWN_CONFIG).serialize(composition);
```

See also [`documents-codecs.md`](../documents-codecs.md).
