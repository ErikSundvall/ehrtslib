# Markdown serialization (openEHR RM → GFM)

Optional codec: import `ehrtslib/serialization-markdown` or `serialization/markdown/mod.ts`.

## Presets (Markdown and AsciiDoc share the same names)

| Preset | Config | Round-trip | Role |
|--------|--------|------------|------|
| **structural** | `STRUCTURAL_MARKDOWN_CONFIG` | Yes (with template) | YAML front matter, node-id comments, type annotations, terse codes, sparse `oe:v1` where needed |
| **compact** | `COMPACT_MARKDOWN_CONFIG` | No | GFM tables `\| Item \| Value \| Time \|`, terminology **wikilinks**, optional front matter (demo toggle) |
| **embedding** | `EMBEDDING_MARKDOWN_CONFIG` | No | Minimal prose: plain `key: value` lines, no codes/URIs, tuned for RAG token count |
| **wikilink** | `WIKILINK_MARKDOWN_CONFIG` | No | openEHR AOM URN wikilinks on headings and coded text |

`MARKDOWN_CODEC_MATRIX.losslessDialects` is `["structural"]`. Output-only presets: `compact`, `embedding`, `wikilink`.

### Compact vs embedding

**Compact** is for human-readable charts and notes: tables carry event times, codes appear as wikilinks. **Embedding** drops bullets, codes, and front matter for the smallest token-efficient clinical surface (definition-list style is used in the AsciiDoc twin).

### Example

```typescript
import { MarkdownSerializer, COMPACT_MARKDOWN_CONFIG } from "./mod.ts";
const md = new MarkdownSerializer(COMPACT_MARKDOWN_CONFIG).serialize(composition);
```

Parsers reject output-only presets with `InvalidFormatError`. Round-trip is template-validated RM reconstruction, not guaranteed canonical JSON equality.
