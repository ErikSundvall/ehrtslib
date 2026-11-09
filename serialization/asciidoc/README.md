# AsciiDoc serialization (openEHR RM → AsciiDoc)

Optional codec: import `ehrtslib/serialization-asciidoc` or `serialization/asciidoc/mod.ts`.

## Presets

**structural**, **compact**, **embedding**, and **wikilink** match Markdown preset ids and RM simplification rules. Full reference:

**[Document presets and RM simplification rules](../documents-presets.md)**

Quick map:

| Preset | Config | Round-trip |
|--------|--------|------------|
| structural | `STRUCTURAL_ASCIIDOC_CONFIG` | Yes (with template) |
| compact | `COMPACT_ASCIIDOC_CONFIG` | No |
| embedding | `EMBEDDING_ASCIIDOC_CONFIG` | No |
| wikilink | `WIKILINK_ASCIIDOC_CONFIG` | No |

`ASCIIDOC_CODEC_MATRIX.outputOnlyPresets`: `compact`, `embedding`, `wikilink`.

```typescript
import { AsciidocSerializer, STRUCTURAL_ASCIIDOC_CONFIG } from "./mod.ts";
const adoc = new AsciidocSerializer(STRUCTURAL_ASCIIDOC_CONFIG).serialize(composition);
```

See also [`documents-codecs.md`](../documents-codecs.md).
