# Document presets and RM simplification

Markdown and AsciiDoc share **four preset ids** for openEHR **RM instances** (not archetype/template ADL). RM **content** decisions for each preset are defined once in code as [`DOCUMENT_PRESET_RM_POLICIES`](documents_common/document_preset_rules.ts); only **syntax** (GFM vs pipe tables, `key: value` vs `key:: value`) differs between codecs.

Import entry point: [`documents-codecs.md`](documents-codecs.md).

---

## structural

- **Round-trip:** yes, with operational template (`STRUCTURAL_*_CONFIG`, Markdown dialect `structural`).
- **Role:** Canonical human-readable view with hidden machine metadata (`oe:v1`, `oe:meta`, node-id comments, YAML front matter / AsciiDoc header attrs).
- **Config:** `STRUCTURAL_MARKDOWN_CONFIG` · `STRUCTURAL_ASCIIDOC_CONFIG`

### Formatting snapshot (same observation)

| Markdown (structural) | AsciiDoc (structural) |
| --- | --- |
| `---` YAML front matter | `:composer:` header attributes |
| `## Observation` + `<!-- at… -->` | `== Observation` + `// at…` |
| `- _origin:_ 2026-08-02T10:00:00Z` | `* _origin:_ 2026-08-02T10:00:00Z` |
| `**Any event**` | `*Any event*` |
| `- _time:_ …` per event | `* _time:_ …` per event |
| `- **SpO₂:** 98%` list items | `* **SpO₂:** 98%` list items |

---

## compact

- **Round-trip:** no (output-only).
- **Role:** Human-readable charts: **Item \| Value \| Time** tables, terminology wikilinks, optional front matter / header.
- **Config:** `COMPACT_MARKDOWN_CONFIG` · `COMPACT_ASCIIDOC_CONFIG`

### Formatting snapshot

| Markdown (compact) | AsciiDoc (compact) |
| --- | --- |
| GFM pipe table | AsciiDoc `\|===` pipe table (implicit header) |
| `\| Item \| Value \| Time \|` | `\| Item \| Value \| Time` then blank line |
| No per-event `**Any event**` when HISTORY has one event | No `*Any event*` / `.Any event` for single event |
| No `origin:` when origin equals event time | No `origin::` when redundant |
| Term codes as `[[term]]` wikilinks in tables | Codes hidden in table cells (rubrics only) |

**Markdown example:**

```markdown
| Item | Value | Time |
| --- | --- | --- |
| SpO₂ | 98% | 2026-08-02T10:10:00Z |
```

**AsciiDoc example:**

```asciidoc
|===
| Item | Value | Time

| SpO₂ | 98% | 2026-08-02T10:10:00Z
|===
```

---

## embedding

- **Round-trip:** no.
- **Role:** Minimum tokens for RAG / embeddings: no front matter, no list bullets on metadata, no tables.
- **Config:** `EMBEDDING_MARKDOWN_CONFIG` · `EMBEDDING_ASCIIDOC_CONFIG`

### Formatting snapshot

| Markdown (embedding) | AsciiDoc (embedding) |
| --- | --- |
| `origin: …` / `time: …` plain lines (when not redundant) | `origin:: …` / `time:: …` definition-list lines |
| `SpO₂: 98%` inline | `SpO₂:: 98%` |
| Multi-event: `**Event name**` or block context | Multi-event: `.Event name` block title |
| Single-event HISTORY: no event title line | Single-event: no `.Any event` |

---

## wikilink

- **Round-trip:** no.
- **Role:** openEHR AOM **URN** links on headings (and related display paths); list layout, not IVT tables.
- **Config:** `WIKILINK_MARKDOWN_CONFIG` · `WIKILINK_ASCIIDOC_CONFIG`

### Formatting snapshot

| Markdown (wikilink) | AsciiDoc (wikilink) |
| --- | --- |
| `## [[urn:openehr:aom:…\|Pulse oximetry]]` | `== link:urn:…[Pulse oximetry]` |
| Terse codes + optional URN wikilinks on headings | `link:` macros; node ids in `//` comments when enabled |
| Same HISTORY / ENTRY simplification as other lossy presets | Same RM omissions as compact/embedding |

---

## RM simplification rules

Rules apply per preset as below. **Lossy** presets (`compact`, `embedding`, `wikilink`) share HISTORY behaviour implemented in [`history_lossy_emit.ts`](documents_common/history_lossy_emit.ts).

### Rule × preset matrix

| Rule | structural | compact | embedding | wikilink |
| --- | :---: | :---: | :---: | :---: |
| Round-trip with template | ✓ | — | — | — |
| ENTRY `language` / `encoding` / `subject` at composition level; repeat only if different | ✓ | ✓ | ✓ | ✓ |
| Omit HISTORY event title when exactly **one** event | — | ✓ | ✓ | ✓ |
| Omit HISTORY `origin` when equal to sole / earliest event time | — | ✓ | ✓ | ✓ |
| Archetype node ids in output | ✓ | — | — | ✓ (for URN paths) |
| RM type annotations (`Quantity`, etc.) | ✓ | — | — | — |
| Hidden `oe:meta` / `_structure:` round-trip markers | emit | omit | omit | omit |
| Sparse `oe:v1` value annotations | ✓ | — | — | — |
| Null flavours | ✓ | — | ✓ | — |
| Empty ELEMENT fields | omit | omit | omit | omit |
| Composition category / composer block | ✓ | — | — | — |
| Terminology codes | `[term::code]` | wikilink rubrics | hidden | URN / brackets |
| Event time in body | list metadata | table **Time** column | inline / `time::` when kept | list metadata |
| Document envelope (front matter / header) | ✓ | ✓ (toggle in demo) | — | ✓ |
| openEHR URN on headings | — | — | — | ✓ |
| Terse CODE_PHRASE / DV_CODED_TEXT | ✓ | ✓ | — | ✓ |

Heading depth caps differ slightly by codec (Markdown 3–4, AsciiDoc 4–5); that is **formatting only**, not RM content.

### RM value rendering

All presets use [`document_rm_render.ts`](documents_common/document_rm_render.ts) for ELEMENT values and nested RM fragments (PARTY, DV_IDENTIFIER, PARTICIPATION, OBJECT_REF, generic RM walk). Output must never contain `(complex value)`, `[object Object]`, or `undefined` — see [`document_rm_render.test.ts`](../test_data/tests/serialization/document_rm_render.test.ts).

**Lossy layout:** AsciiDoc `embedding` and non-table `compact` use definition lists; nested CLUSTERs use block titles (`.Name`) and nested dlist terms (`::term::`). Markdown embedding/compact clusters use `**Name:**` sections with plain `key: value` lines.

### Intentional omissions (lossy presets)

These RM paths are **not** written in `compact` / `embedding` / `wikilink` output (by design today; structural round-trip retains them where parsed):

| Area | Omitted in lossy |
| --- | --- |
| COMPOSITION | `feeder_audit`, `links`, `work_flow_id`, `guideline_id`, `version_uid`, `version_tree` |
| ENTRY | `feeder_audit`, `workflow_id`, `guideline_id`, `other_participations` (unless present in authored tree under `data`) |
| ACTION | Full `ism_transition` / `instruction_details` prose unless archetype tree includes them |
| ACTIVITY | Detailed `timing` / `action_archetype_id` metadata |
| Any | `archetype_details` on lossy envelopes; hidden `oe:meta` / `oe:v1` machine carriers |

Participations, facility identifiers, and extension clusters **inside** `EVENT_CONTEXT.other_context` (or clinical content) are rendered when present in the instance tree.

### Structural lossless encoding (#296)

Structural presets serialize:

- **Visible:** EVENT_CONTEXT as `_*field:*_` list items (participations, facility, `other_context` tree); ENTRY/COMPOSITION `feeder_audit` and `links`; per-item `oe:rm:v1` / `oe:v1` tails for PARTY, PARTICIPATION, CLUSTER metadata, ELEMENT values.
- **Hidden tail:** full `COMPOSITION` snapshot in a trailing `oe:rm:v1:b64:` comment (MD `<!-- … -->`, AD `// …`) so deserializers recover every audited path; block parse remains for incremental parity.

`document_serialization_audit.test.ts` fails on any structural dropped/altered path across **40** templated fixtures.

### Code reference

- Shared policies: [`document_preset_rules.ts`](documents_common/document_preset_rules.ts) — `DOCUMENT_PRESET_RM_POLICIES`
- HISTORY trimming: [`history_lossy_emit.ts`](documents_common/history_lossy_emit.ts)
- ENTRY defaults: [`document_entry_defaults.ts`](documents_common/document_entry_defaults.ts)
- RM display: [`document_rm_render.ts`](documents_common/document_rm_render.ts)

Tests: [`document_preset_rules.test.ts`](../test_data/tests/serialization/document_preset_rules.test.ts), [`history_lossy_presets.test.ts`](../test_data/tests/serialization/history_lossy_presets.test.ts), [`document_serialization_audit.test.ts`](../test_data/tests/serialization/document_serialization_audit.test.ts).
