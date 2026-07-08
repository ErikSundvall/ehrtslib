# ZipEHR

Compact openEHR instance serialization: RM types become emoji keys, values become terse
strings. Input/output is canonical JSON with `_type` fields; ZipEHR is a reversible
skin on top.

## Variants

| | **j-zipehr** (JSON) | **y-zipehr** (YAML) |
|---|---|---|
| **Target runtime** | Any language; string replace + JSON parse | Libraries with RM type inference (e.g. ehrtslib) |
| **Type marking** | Emoji key on **every** typed node | Emoji on structural / LOCATABLE nodes only |
| **Leaf values** | Terse string inside type emoji wrapper | Bare terse scalar when type is inferrable from parent property |
| **Layout** | Flow-style JSON | Hybrid block/flow YAML |

**j-zipehr** needs only the symbol table and substitution rules — no parent-type map, no
property inference. A ~50-line script can round-trip clinical data.

**y-zipehr** drops redundant type wrappers where the parent RM property fixes the type
(`EVENT_CONTEXT.setting` → `DV_CODED_TEXT`, etc.). Requires `PROPERTY_TYPE_MAP` and
polymorphic-type handling (`shared.ts`).

## Symbol lookup table

RM class → emoji is defined in [`table3.yaml`](table3.yaml). Each row lists alternatives;
**only the first symbol is used** at runtime. First symbols must be unique across RM type
rows (`data_types`, `data_structures`, `ehr_components`; symbol pairs like `📅⌚` count as one).

Additional sections in the same file:

- **`terminology_shortcuts`** — terse-string prefix replacements (`openehr::` → `🌬️`, etc.)
- **`field_promotions`** — COMPOSITION `language` / `territory` / `encoding` promoted to emoji keys

Embedded copy for bundles/tests: [`table3_text.ts`](table3_text.ts) (first symbol per row
only). Regenerate after editing the YAML:

```bash
deno run --allow-read --allow-write enhanced/serialization/zipehr/gen_table3_text.ts
```

Reverse lookup (emoji → RM class) uses the same first-symbol rule for uppercase type names
(`buildReverseSymbolMap` in `symbol_map.ts`).

Foundation types are commented out in `table3.yaml` — they never appear in instance data.

## Pipeline

```
Canonical JSON (_type) ─┬─ j-zipehr: convertObjectDirect → flow JSON
                        └─ y-zipehr: jsonToCompactPlain → applyEmojiToCompact → hybrid YAML
```

Deserialize: `expandZipehrToCanonical` (both variants). Auto-detect via `detectInputFormat`.

### j-zipehr substitution (serialize)

1. Walk the `_type`-annotated tree.
2. Replace `_type` with emoji from the symbol table (fallback: type name string).
3. **CODE_PHRASE** / **DV_CODED_TEXT** → single emoji key wrapping a terse string.
4. **DV_*** with only `value` → `{ "🗈": "…" }` (emoji wraps scalar directly).
5. **DV_*** with extra fields → `{ "🌡️": { magnitude: …, units: … } }`.
6. **LOCATABLE** (has `name` + `archetype_node_id` or `archetype_details`) → fold name
   (see below); emoji key holds the folded string, not `_` + separate `name`.
7. Other types → `{ "_": "👀", …properties }` (COMPOSITION uses `🖂` key instead of `_`).
8. Apply shorthands: terminology field promotion, archetype-detail compaction.

No step requires knowing the parent's type.

### y-zipehr substitution (serialize)

1. **Compact** (`jsonToCompactPlain`): strip `_type` where inferrable; emit terse scalars;
   omit nulls/empty collections; fold archetype details to inline symbols.
2. **Emoji pass** (`applyEmojiToCompact`): add emoji only where type is not inferrable from
   parent property or structure; wrap remaining DV leaves when needed.
3. **Shorthands** (same as j-zipehr): terminology promotion, composition name fold.
4. Emit hybrid YAML (block maps for depth, flow for shallow objects).

Type inference order: `PROPERTY_TYPE_MAP[parent][property]` → structure heuristic
(`inferFromStructure`) → `_type` on object → polymorphic fallback.

## Terse data values

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

### Variant examples

| Property | j-zipehr | y-zipehr |
|----------|----------|----------|
| `EVENT_CONTEXT.setting` (`DV_CODED_TEXT`) | `{ "🗈": "🌬️238\|other care\|" }` | `🌬️238\|other care\|` |
| `EVENT_CONTEXT.start_time` (`DV_DATE_TIME`) | `{ "📅⌚": "2023-08-31T18:31:16+02:00" }` | `"2023-08-31T18:31:16+02:00"` |

## Folded LOCATABLE names

LOCATABLE nodes (COMPOSITION, OBSERVATION, CLUSTER, ITEM_TREE, …) merge `name`,
`archetype_node_id`, and `archetype_details` into one quoted string:

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

1. Split `name[bracket]` when brackets present.
2. Tokenize bracket on `Ⓣ`, `Ⓐ`, `⚙️`.
3. Plain text without symbols → `archetype_node_id`.
4. `Ⓐ` absent but `Ⓣ` or `⚙️` present → restore `archetype_id` from `name.value`.
5. `Ⓐ` present, no separate node id → `archetype_node_id` = archetype id.

## Module map

| File | Role |
|------|------|
| `table3.yaml` / `table3_text.ts` | Symbol lookup table |
| `shared.ts` | Terse parse/format, bracket fold, type inference maps |
| `convert.ts` | j-zipehr direct substitution; y-zipehr compact + emoji pass |
| `compact.ts` | y-zipehr compaction (terse values, strip inferrable types) |
| `deserialize.ts` | Expand ZipEHR → canonical JSON |
| `serializer.ts` | High-level serialize/deserialize API |
| `detect.ts` | j- vs y-zipehr auto-detection |

## API

```ts
import { serializeToJZipehr, serializeToYZipehr, zipehrTextToCanonical } from "./mod.ts";

const j = await serializeToJZipehr(composition);   // JSON
const y = await serializeToYZipehr(composition);   // YAML
const back = zipehrTextToCanonical(j);               // canonical plain JSON
```
