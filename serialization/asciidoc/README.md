# AsciiDoc serialization (openEHR RM → AsciiDoc)

Optional codec: import `ehrtslib/serialization-asciidoc` or `serialization/asciidoc/mod.ts`.

## Presets (same names as Markdown)

| Preset | Config | Round-trip | Role |
|--------|--------|------------|------|
| **structural** | `STRUCTURAL_ASCIIDOC_CONFIG` | Yes (with template) | Header attributes, `//` node/URN comments, type brackets, sparse `oe:v1`, `_structure:` markers |
| **compact** | `COMPACT_ASCIIDOC_CONFIG` | No | Pipe tables `\| Item \| Value \| Time \|` (implicit header, no `[cols=…]`), optional header attributes |
| **embedding** | `EMBEDDING_ASCIIDOC_CONFIG` | No | Definition lists (`origin::`, `.Event` titles), no header machine attrs |
| **wikilink** | `WIKILINK_ASCIIDOC_CONFIG` | No | URN `link:` on headings, list bodies |

`ASCIIDOC_CODEC_MATRIX.losslessDialects` is `["structural"]`. Output-only: `compact`, `embedding`, `wikilink`.

### Compact vs embedding

**Compact** targets readable documents with per-row event times in tables. **Embedding** uses AsciiDoc definition-list syntax and block titles for fewer tokens in RAG corpora.

### Example

```typescript
import { AsciidocSerializer, STRUCTURAL_ASCIIDOC_CONFIG } from "./mod.ts";
const adoc = new AsciidocSerializer(STRUCTURAL_ASCIIDOC_CONFIG).serialize(composition);
```

`AsciidocDeserializer` accepts only the structural dialect. Compact, embedding, and wikilink output is one-way.
