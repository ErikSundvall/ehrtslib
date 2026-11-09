# AsciiDoc Serialization for openEHR

AsciiDoc serializers for openEHR RM instances with a **lossless** dialect (`AsciidocDeserializer`) and several output-only presets.

See [`../documents-codecs.md`](../documents-codecs.md).

## Preset overview

| Preset | Config | Parser accepts? | Emits / omits | Intended use |
| :--- | :--- | :--- | :--- | :--- |
| **Lossless** (default) | `LOSSLESS_ASCIIDOC_CONFIG` | **Yes** | Header attributes, `//` node/URN comments, type brackets, sparse `// oe:v1:b64:…`, `_structure:` markers | Template-validated round-trip |
| **Compact** | `COMPACT_ASCIIDOC_CONFIG` | **No** | AsciiDoc tables, readable text; hides ids/types/codes | Reports and display |
| **Embedding** | `EMBEDDING_ASCIIDOC_CONFIG` | **No** | Clinical hierarchy, no header machine attrs, no `oe:v1` | RAG / minimal clinical text |

Clinical/compact/**embedding**/wikilink-class presets are listed in `ASCIIDOC_CODEC_MATRIX.outputOnlyPresets`.

## Variants

### 1. Compact AsciiDoc (`COMPACT_ASCIIDOC_CONFIG`)

Human-readable documents with tables. Hides archetype node IDs and type annotations.

### 2. Lossless AsciiDoc (`LOSSLESS_ASCIIDOC_CONFIG`) - Default

Preserves structural information for round-tripping with the operational template. Archetype references use **AOM** URNs: `urn:openehr:aom:org.openehr::openEHR-EHR-…`.

### 3. Embedding AsciiDoc (`EMBEDDING_ASCIIDOC_CONFIG`)

Annotation-free clinical text for embeddings; parsers reject it as lossless input.

## Usage

```typescript
import {
  AsciidocSerializer,
  AsciidocDeserializer,
  LOSSLESS_ASCIIDOC_CONFIG,
  EMBEDDING_ASCIIDOC_CONFIG,
} from "ehrtslib/serialization-asciidoc";

const adoc = new AsciidocSerializer(LOSSLESS_ASCIIDOC_CONFIG).serialize(composition);
const back = new AsciidocDeserializer({ validateAgainstTemplate: opt }).deserialize(adoc);
```

## Round-Trip Guarantees (Lossless Mode)

When combined with the original template, `AsciiidocDeserializer`:

- Reconstructs RM paths from comments/attributes and headings
- Honors sparse `// oe:v1:b64:…` value typing when present
- Validates against the operational template when configured

Tests: `asciidoc_roundtrip.test.ts`, `documents_codec_matrix.test.ts`, `opt_template_roundtrip.test.ts`.

Same **template-valid** caveat as Markdown: not always canonical JSON bitwise equality on large OPT fixtures when optional branches differ.

## Comparison with Markdown Variants

| Feature | AsciiDoc Compact | AsciiDoc Lossless | Markdown Clinical | Markdown Structural |
|---------|-----------------|-------------------|-------------------|---------------------|
| Human readable | ✓✓✓ | ✓✓ | ✓✓✓ | ✓✓ |
| Round-trip (library) | ✗ | ✓ (lossless dialect) | ✗ | ✓ (structural dialect) |
| Tables | Native AsciiDoc | Lists | GFM tables | Lists |
| Node IDs | Hidden | Comments + URN | Hidden | HTML comments |
| Type info | Hidden | Italic brackets | Hidden | Italic brackets |
| Cross-refs | N/A | URN comments | Wikilinks (opt) | HTML comments |
