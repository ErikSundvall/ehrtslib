# ZipEHR

ZipEHR is a reversible “skin” over canonical openEHR JSON. It compresses data so it’s easier
to skim with limited screen space or limited LLM context windows:

- RM type information (`_type`) becomes emoji keys
- selected values become “terse” strings/scalars
- LOCATABLE names are folded into a compact `name[bracket]` form

Crucially, ZipEHR is designed to round-trip back to canonical JSON with `_type` fields.

## Newcomer mental model

### 1) Start from canonical JSON
Canonical JSON is plain objects that still carry openEHR RM typing via an `_type` field.
Example (one RM leaf):

```json
{ "_type": "DV_TEXT", "value": "Vital Signs" }
```

### 2) ZipEHR replaces “noise” with emojis
Instead of writing long RM type names everywhere, ZipEHR substitutes them with emojis via a
symbol table (`table3.yaml`). On the wire/storage side, this keeps the clinical payload
structure while hiding technical naming that tends to be irrelevant to clinicians and
hurts readability for people skimming.

### 3) Some forms become terser (by design)
ZipEHR formats “coded” and “wrapped” values into compact string representations, and in the
`zipehr.yaml` variant it may omit redundant `_type` wrappers where the parent property implies
the type.

## Variants

| | **zipehr.json** (JSON) | **zipehr.yaml** (YAML) |
|---|---|---|
| **Target runtime** | Any language; string replace + JSON parse | Libraries with RM type inference (e.g. ehrtslib) |
| **Type marking** | Emoji key on **every** typed node | Emoji on structural / LOCATABLE nodes only |
| **Leaf values** | Terse string inside a type emoji wrapper | Bare terse scalar when type is inferable from the parent property |
| **Layout** | Flow-style JSON | Hybrid block/flow YAML |

**zipehr.json**: straightforward and deterministic. It only needs the symbol table and the
substitution rules; it does not need parent-type inference. This makes it usable even in
“stringly typed” environments.

**zipehr.yaml**: more compact. It drops redundant type wrappers where the parent RM property
fixes the type (for example `EVENT_CONTEXT.setting` → `DV_CODED_TEXT`). This requires
`PROPERTY_TYPE_MAP` plus polymorphic-type handling (`shared.ts`).

## Symbol lookup table (`table3.yaml`)

RM class → emoji is defined in [`table3.yaml`](table3.yaml). Each row lists alternatives, but
**only the first symbol is used at runtime**. Alternatives exist to let you experiment with
icons without changing the wire format.

That “first symbol only” rule has two implications newcomers should care about:

1. **Round-tripping depends on stability.** If the first symbol changes for a type, older
   ZipEHR payloads may not decode the same way.
2. **First symbols must be unique across RM type rows** (`data_types`, `data_structures`,
   `ehr_components`). (Symbol pairs like `📅⌚` count as one unit.)

Extra rows in the same file:

- **`terminology_shortcuts`** — terse-string prefix replacements (`openehr::` → `🌬️`, etc.)
- **`field_promotions`** — COMPOSITION `language` / `territory` / `encoding` promoted to emoji keys

### Editing workflow (required)
`table3_text.ts` is an embedded first-symbol copy used by the test suite and the browser demo.
After editing `table3.yaml`, regenerate the embedded table:

```bash
deno run --allow-read --allow-write enhanced/serialization/zipehr/gen_table3_text.ts
```

If you also publish the browser demo (GitHub Pages), rebuild its bundle so it picks up the
embedded table:

```bash
deno task build:demo
```

Reverse lookup (emoji → RM class) uses the same first-symbol uniqueness rule
(`buildReverseSymbolMap` in `symbol_map.ts`).

Foundation and abstract rows are commented out in `table3.yaml` because they never appear as
runtime `_type` values in instance data.

## What ZipEHR does (pipeline)

```
Canonical JSON (_type) ─┬─ zipehr.json: convertObjectDirect → flow JSON
                        └─ zipehr.yaml: jsonToCompactPlain → applyEmojiToCompact → hybrid YAML
```

Deserialization uses `expandZipehrToCanonical` for both variants. Input is auto-detected via
`detectInputFormat`.

### zipehr.json substitution (serialize)

1. Walk the `_type`-annotated tree.
2. Replace `_type` with an emoji from the symbol table (fallback: the type name string).
3. Format `CODE_PHRASE` / `DV_CODED_TEXT` as a single emoji key wrapping a terse string.
4. Format `DV_*` leaves with only `value` as “emoji wraps scalar directly”.
5. If `DV_*` has extra fields, keep them but still anchor the leaf under its emoji key.
6. Fold LOCATABLE nodes (`name` + `archetype_node_id` and/or `archetype_details`) into
   `name[bracket]` and store that folded string under the LOCATABLE’s emoji key.
7. Other nodes become `{ "_": "…", …properties }` (COMPOSITION uses `🖂` instead of `_`).
8. Apply shorthands: terminology field promotion, archetype-detail compaction.

No step requires knowing the parent type.

### zipehr.yaml substitution (serialize)

1. **Compact** (`jsonToCompactPlain`): strip `_type` where inferrable; emit terse scalars;
   omit nulls/empty collections; inline/fold archetype details.
2. **Emoji pass** (`applyEmojiToCompact`): add emoji only where the type is *not* inferable from
   the parent property or structure; wrap remaining DV leaves when needed.
3. Apply the same shorthands as `zipehr.json` (terminology promotion, composition name fold).
4. Emit hybrid YAML (block maps for depth, flow for shallow objects).

Type inference order:

`PROPERTY_TYPE_MAP[parent][property]` → structure heuristic (`inferFromStructure`)
→ `_type` on the object → polymorphic fallback.

## Terse data values (what strings mean)

| Type | Terse form | Example |
|------|------------|---------|
| **CODE_PHRASE** | `terminology::code` | `openehr::433` |
| **DV_CODED_TEXT** | `term::code\|value\|` | `openehr::433\|event\|` |
| **DV_TEXT** etc. | plain `value` | `Vital Signs` |

Terminology shortcuts (applied on serialize, expanded on deserialize):

| Prefix | Emoji | table3 key |
|--------|-------|------------|
| `openehr::` | `🌬️` | `openehr` |
| `local::` | `📍` | `local` |
| `ISO_639-1::` | `💬` | `language` |
| `ISO_3166-1::` | `🌐` | `territory` |
| `IANA_character-sets::` | `🔤` | `encoding` |

Canonical listing: `terminology_shortcuts` and `field_promotions` in [`table3.yaml`](table3.yaml).
Runtime constants: `TERMINOLOGY_SHORTCUTS` and `TERMINOLOGY_FIELD_PROMOTIONS` in `shared.ts`.

**COMPOSITION** promotes `language` / `territory` / `encoding` CODE_PHRASE children to
top-level `💬` / `🌐` / `🔤` keys with bare code strings.

### Variant examples (same clinical meaning, different representation)

| Property | zipehr.json | zipehr.yaml |
|----------|----------|----------|
| `EVENT_CONTEXT.setting` (`DV_CODED_TEXT`) | `{ "🗈": "🌬️238\|other care\|" }` | `🌬️238\|other care\|` |
| `EVENT_CONTEXT.start_time` (`DV_DATE_TIME`) | `{ "📅⌚": "2023-08-31T18:31:16+02:00" }` | `"2023-08-31T18:31:16+02:00"` |

## Folded LOCATABLE names (`name[bracket]`)

LOCATABLE nodes (COMPOSITION, OBSERVATION, CLUSTER, ITEM_TREE, …) merge:

- `name`
- `archetype_node_id`
- `archetype_details` (when present)

into one quoted string:

```yaml
🖂: "ChemoForm-MBA.v7[Ⓣ ChemoForm-MBA.v7 Ⓐ openEHR-EHR-COMPOSITION.self_reported_data.v1 ⚙️1.1.0]"
📁: "Vårdenhet[Ⓐ openEHR-EHR-CLUSTER.organisation.v1 ⚙️1.1.0]"
🌳: "Item tree[at0003]"
```

Archetype-detail inline symbols (`ARCHETYPE_DETAIL_SYMBOLS` in `shared.ts`):

| Field | Symbol |
|-------|--------|
| `template_id` | `Ⓣ` |
| `archetype_id` | `Ⓐ` |
| `rm_version` | `⚙️` |

### Bracket algorithm (serialize)

1. Start with `name.value`.
2. Build bracket (space-separated), in order:
   - `Ⓣ {template_id}` if present
   - `Ⓐ {archetype_id}` if present **and** differs from `name.value` (omit when equal)
   - `⚙️{rm_version}` if present (no space after symbol)
   - plain `archetype_node_id` when it differs from `archetype_id`
3. If no detail symbols apply, bracket is just `archetype_node_id` (`name[node_id]` form).
4. Drop separate `archetype_details` from output when folded.

COMPOSITION uses emoji key `🖂` (not `_` + `name`).

### Bracket algorithm (deserialize)

1. Split `name[bracket]` when brackets are present.
2. Tokenize bracket on `Ⓣ`, `Ⓐ`, `⚙️`.
3. Plain text without symbols → `archetype_node_id`.
4. `Ⓐ` absent but `Ⓣ` or `⚙️` present → restore `archetype_id` from `name.value`.
5. `Ⓐ` present, no separate node id → `archetype_node_id` = archetype id.

## Module map

| File | Role |
|------|------|
| `table3.yaml` / `table3_text.ts` | Symbol lookup table |
| `shared.ts` | Terse parse/format, bracket fold, type inference maps |
| `convert.ts` | `zipehr.json` direct substitution; `zipehr.yaml` compact + emoji pass |
| `compact.ts` | `zipehr.yaml` compaction (terse values, strip inferrable types) |
| `deserialize.ts` | Expand ZipEHR → canonical JSON |
| `serializer.ts` | High-level serialize/deserialize API |
| `detect.ts` | `zipehr.json` vs `zipehr.yaml` auto-detection |

## API

```ts
import { serializeToJZipehr, serializeToYZipehr, zipehrTextToCanonical } from "./mod.ts";

const j = await serializeToJZipehr(composition);   // JSON
const y = await serializeToYZipehr(composition);   // YAML
const back = zipehrTextToCanonical(j);               // canonical plain JSON
```

## Appendix: End-to-end roundtrip (canonical JSON → ZipEHR → canonical)

ZipEHR works best when you start from canonical openEHR JSON (objects with `_type` fields).
The example below uses the exported “plain conversion” functions so you don’t need any
type registry here.

```ts
import {
  loadDefaultSymbolMap,
  convertObjectDirect,
  convertObjectEhrtslib,
  serializeZipehrPlainToJson,
  serializeZipehrPlainToYaml,
  zipehrTextToCanonical,
} from "./mod.ts";

const canonical = {
  _type: "COMPOSITION",
  name: { _type: "DV_TEXT", value: "Vital Signs" },
  archetype_node_id: "openEHR-EHR-COMPOSITION.encounter.v1",
  archetype_details: {
    _type: "ARCHETYPED",
    template_id: { _type: "TEMPLATE_ID", value: "Vital Signs" },
    archetype_id: {
      _type: "ARCHETYPE_ID",
      value: "openEHR-EHR-COMPOSITION.encounter.v1",
    },
    rm_version: "1.0.4",
  },
  context: {
    _type: "EVENT_CONTEXT",
    start_time: {
      _type: "DV_DATE_TIME",
      value: "2024-01-15T10:30:00Z",
    },
  },
};

const symbolMap = await loadDefaultSymbolMap();

// zipehr.json (JSON)
const jPlain = convertObjectDirect(canonical, symbolMap);
const jText = serializeZipehrPlainToJson(jPlain);
const backFromJ = zipehrTextToCanonical(jText);

// zipehr.yaml (YAML)
const yPlain = convertObjectEhrtslib(canonical, symbolMap);
const yText = serializeZipehrPlainToYaml(yPlain);
const backFromY = zipehrTextToCanonical(yText);

// Both backFromJ and backFromY should be canonical JSON (with `_type` fields).
```
