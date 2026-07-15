# ZipEHR

ZipEHR is a reversible “skin” over canonical openEHR JSON. It compresses data to a more compact
(JSON or YAML) format so it’s easier to skim with limited scrolling/screen space or limited LLM
context windows

- RM type information (`_type`) becomes emoji keys
- selected values become “terse” strings/scalars
- LOCATABLE names are emitted as structured objects with attribute emoji keys (`🪧`, `🆔`, `Ⓣ`, `Ⓐ`, `⚙️`)

ZipEHR is designed to round-trip back to canonical JSON with `_type` fields.
It is an opinionated losless compression and decompression algorithm where the compressed
format aims for high human & LLM readability of clinical facts. it is also opiniated about
line breaking strategy in output format where it tries to fit things that belong together
onto the same line when possible and tries to balance readabilty with number of lines.
Many humans (and likely LLMs) seem to  have a built in capabilty to focus on text and 
disregard  emojis as "noise" if they want to read fast.

## Newcomer mental model

### 1) Start from canonical JSON
Canonical JSON is plain objects that still carry openEHR RM typing via an `_type` field.
Example excerpt from [`openEHR-EHR-OBSERVATION.body_weight.v2`](https://ckm.openehr.org/ckm/archetypes/openEHR-EHR-OBSERVATION.body_weight.v2) — weight **85 kg** with clothing state **at0028** (*Fully clothed, without shoes*):

```json
{
  "_type": "OBSERVATION",
  "name": { "_type": "DV_TEXT", "value": "Body weight" },
  "archetype_node_id": "openEHR-EHR-OBSERVATION.body_weight.v2",
  "archetype_details": {
    "_type": "ARCHETYPED",
    "archetype_id": {
      "_type": "ARCHETYPE_ID",
      "value": "openEHR-EHR-OBSERVATION.body_weight.v2"
    }
  },
  "data": {
    "_type": "HISTORY",
    "events": [
      {
        "_type": "EVENT",
        "archetype_node_id": "at0003",
        "data": {
          "_type": "ITEM_TREE",
          "archetype_node_id": "at0001",
          "items": [
            {
              "_type": "ELEMENT",
              "name": { "_type": "DV_TEXT", "value": "Weight" },
              "archetype_node_id": "at0004",
              "value": {
                "_type": "DV_QUANTITY",
                "magnitude": 85,
                "units": "kg"
              }
            }
          ]
        },
        "state": {
          "_type": "ITEM_TREE",
          "archetype_node_id": "at0008",
          "items": [
            {
              "_type": "ELEMENT",
              "name": { "_type": "DV_TEXT", "value": "State of dress" },
              "archetype_node_id": "at0009",
              "value": {
                "_type": "DV_CODED_TEXT",
                "value": "Fully clothed, without shoes",
                "defining_code": {
                  "_type": "CODE_PHRASE",
                  "terminology_id": { "_type": "TERMINOLOGY_ID", "value": "local" },
                  "code_string": "at0028"
                }
              }
            }
          ]
        }
      }
    ]
  }
}
```

### 2) ZipEHR replaces “noise” with emojis (or abbreviations)
Instead of writing long RM type names everywhere, ZipEHR substitutes them with emojis via a
symbol table (`symbol_table.yaml`). On the wire/storage side, this keeps the clinical payload
structure while hiding technical naming that tends to be irrelevant to clinicians and
hurts readability for people/LLMs skimming.

### 3) Some forms become terser (by design)
ZipEHR formats “coded” and “wrapped” values into compact string representations, and in the
`zipehr.yaml` variant it will omit redundant `_type` wrappers where the parent property implies
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

**zipehr.xhtml**: FHIR `Narrative.div`-safe XHTML snippets. RM types appear as Ehrbase letter codes in
`class` (from `symbol_table.yaml`). LOCATABLE metadata uses semicolon-separated `code: value` pairs
in `title` (`id`, `te`, `ar`, `rm` — semicolons inside values are escaped as `\;` or quoted).
Human-visible names live in headings (`h2`–`h4` for composition/section/entries) or leading
`<span>` labels. DV values use terse strings in value-span `title` attributes without emoji
shortcuts. Format URI: `http://purl.org/ehrtslib/zipehr/xhtml/v1`.

API: `serializeToXZipehr`, `zipehrXhtmlToCanonical`, `wrapFhirNarrative`.

**zipehr.html5** (proposed): compact `oe-*` custom elements (not FHIR Narrative). Two dialects —
`html5/short` (`oe-ob`, `oe-q`, …) and `html5/full` (`oe-observation`, `oe-dv-quantity`, …).
Semantics in tags + short attributes; no FLAT paths (inferred by traversal). See
[`oehr_html5_v1.md`](oehr_html5_v1.md).

**zipehr.json** (same clinical content as above, after `convertObjectDirect`):

```json
{
  "$schema": "http://purl.org/ehrtslib/zipehr/v1",
  "👀": { "🪧": "Body weight", "Ⓐ": "openEHR-EHR-OBSERVATION.body_weight.v2" },
  "data": {
    "_": "📉",
    "events": [
      {
        "_": "EVENT",
        "archetype_node_id": "at0003",
        "data": {
          "_": "🌳",
          "archetype_node_id": "at0001",
          "items": [{ "🔹": { "🪧": "Weight", "🆔": "at0004" }, "🌡️": { "magnitude": 85, "units": "kg" } }]
        },
        "state": {
          "_": "🌳",
          "archetype_node_id": "at0008",
          "items": [{ "🔹": { "🪧": "State of dress", "🆔": "at0009" }, "🗈": "📍at0028|Fully clothed, without shoes|" }]
        }
      }
    ]
  }
}
```

**zipehr.yaml** (same clinical content, after `convertObjectEhrtslib` — more compact; type inference drops redundant wrappers):

```yaml
# yaml-language-server: $schema=http://purl.org/ehrtslib/zipehr/v1
👀: { 🪧: "Body weight", Ⓐ: "openEHR-EHR-OBSERVATION.body_weight.v2" }
data:
  events:
    - _: "EVENT"
      archetype_node_id: "at0003"
      data:
        🌳:
          archetype_node_id: "at0001"
          items:
            - { 🔹: { 🪧: "Weight", 🆔: "at0004" }, 🌡️: { magnitude: 85, units: "kg" } }
      state:
        🌳:
          archetype_node_id: "at0008"
          items:
            - { 🔹: { 🪧: "State of dress", 🆔: "at0009" }, 🗈: "📍at0028|Fully clothed, without shoes|" }
```

### Schema declaration

Serialized ZipEHR files carry a format schema for editor validation:

| Variant | Declaration |
|---------|-------------|
| **zipehr.json** | `"$schema": "http://purl.org/ehrtslib/zipehr/v1"` as the **first** root property |
| **zipehr.yaml** | `# yaml-language-server: $schema=http://purl.org/ehrtslib/zipehr/v1` as the first line |

The machine-readable schema lives at [`zipehr_v1.schema.json`](zipehr_v1.schema.json) (`$id` =
`http://purl.org/ehrtslib/zipehr/v1`). Deserialization accepts files without these
declarations but logs a `console.warn` when they are missing.

## Symbol lookup table (`symbol_table.yaml`)

RM class → emoji is defined in [`symbol_table.yaml`](symbol_table.yaml). Each row lists alternatives, but
**only the first symbol is used at runtime**. Alternatives exist to let you experiment with
icons without changing the wire format.

### Emoji vs Ehrbase letter codes

ZipEHR can emit either:
- the primary **emoji** symbol (default), or
- the corresponding **Ehrbase 2-letter/short codes** as ASCII `lettercode` symbols.

The mapping for those letter codes is defined in [`ehrbase-short-codes.md`](ehrbase-short-codes.md).
In `symbol_table.yaml` entries follow the convention 
`[letterCode, emoji, ...posibly other alternative emojis during experimentation]`, and the 
runtime selects the symbol variant form first or second position via `symbolVariant` 
(`emoji` vs `lettercode`).

That “first symbol only” rule has two implications newcomers should care about:

1. **Round-tripping depends on stability.** If the first symbol changes for a type, older
   ZipEHR payloads may not decode the same way.
2. **First symbols must be unique across RM type rows** (`data_types`, `data_structures`,
   `ehr_components`). (Symbol pairs like `📅⌚` (DV_DATE_TIME) count as one unit.)

Extra rows in the same file:

- **`terminology_shortcuts`** — terse-string prefix replacements (`openehr::` → `🌬️`, etc.)
- **`field_promotions`** — COMPOSITION `language` / `territory` / `encoding` promoted to emoji keys

### Editing workflow (required)
`symbol_table.ts` is an embedded first-symbol copy used by the test suite and the browser demo.
After editing `symbol_table.yaml`, regenerate the embedded table:

```bash
deno run --allow-read --allow-write enhanced/serialization/zipehr/gen_symbol_table.ts
```

If you also publish the browser demo (GitHub Pages), rebuild its bundle so it picks up the
embedded table:

```bash
deno task build:demo
```

Reverse lookup (emoji → RM class) uses the same first-symbol uniqueness rule
(`buildReverseSymbolMap` in `symbol_map.ts`).

Foundation and abstract rows are commented out in `symbol_table.yaml` because they never appear as
runtime `_type` values in instance data.

## Details of what ZipEHR does (pipeline) 

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
6. Emit LOCATABLE nodes (`name` + `archetype_node_id` and/or `archetype_details`) as a
   structured object under the LOCATABLE’s emoji key (see [Structured LOCATABLE objects](#structured-locatable-objects)).
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

| Prefix | Emoji | symbol_table key |
|--------|-------|------------|
| `openehr::` | `🌬️` | `openehr` |
| `local::` | `📍` | `local` |
| `ISO_639-1::` | `🗪` | `language` |
| `ISO_3166-1::` | `🌐` | `territory` |
| `IANA_character-sets::` | `🔤` | `encoding` |

Canonical listing: `terminology_shortcuts` and `field_promotions` in [`symbol_table.yaml`](symbol_table.yaml).
Runtime constants: `TERMINOLOGY_SHORTCUTS` and `TERMINOLOGY_FIELD_PROMOTIONS` in `symbol_table.ts` (generated from yaml).

**COMPOSITION** promotes `language` / `territory` / `encoding` CODE_PHRASE children to
top-level `🗪` / `🌐` / `🔤` keys with bare code strings.

### Variant examples (same clinical meaning, different representation)

| Property | zipehr.json | zipehr.yaml |
|----------|----------|----------|
| `EVENT_CONTEXT.setting` (`DV_CODED_TEXT`) | `{ "🗈": "🌬️238\|other care\|" }` | `🌬️238\|other care\|` |
| `EVENT_CONTEXT.start_time` (`DV_DATE_TIME`) | `{ "📅⌚": "2023-08-31T18:31:16+02:00" }` | `"2023-08-31T18:31:16+02:00"` |

## Structured LOCATABLE objects

LOCATABLE nodes (COMPOSITION, OBSERVATION, CLUSTER, ITEM_TREE, …) merge:

- `name`
- `archetype_node_id`
- `archetype_details` (when present)

into one JSON/YAML object (valid for standard parsers, including on a single flow line):

```yaml
🖂: { "🪧": "ChemoForm-MBA.v7", "Ⓣ": "ChemoForm-MBA.v7", "Ⓐ": "openEHR-EHR-COMPOSITION.self_reported_data.v1", "⚙️": "1.1.0" }
📁: { "🪧": "Vårdenhet", "Ⓐ": "openEHR-EHR-CLUSTER.organisation.v1", "⚙️": "1.1.0" }
🌳: { "🪧": "Item tree", "🆔": "at0003" }
```

Attribute emoji keys are defined in `symbol_table.yaml` (`data_types.attributes`):

| RM attribute | symbol_table key | Emoji |
|--------------|------------|-------|
| `LOCATABLE.name` | `LOCATABLE.name` | `🪧` |
| `LOCATABLE.archetype_node_id` | `LOCATABLE.archetype_node_id` | `🆔` |
| `ARCHETYPED.template_id` | `ARCHETYPED.template_id` | `Ⓣ` |
| `ARCHETYPED.archetype_id` | `ARCHETYPED.archetype_id` | `Ⓐ` |
| `ARCHETYPED.rm_version` | `ARCHETYPED.rm_version` | `⚙️` |

### Serialize rules

1. Always emit `🪧` with `name.value`.
2. Emit `Ⓣ`, `Ⓐ`, `⚙️` when present in `archetype_details`.
3. Omit `Ⓐ` when `archetype_id` equals `name.value`.
4. Emit `🆔` for `archetype_node_id` when no detail symbols apply, or when it differs from `archetype_id`.
5. Drop separate `archetype_details` / `name` / `archetype_node_id` from the parent row when structured.

COMPOSITION uses emoji key `🖂` (not `_` + `name`).

### Deserialize rules

1. Read `🪧` → `name.value`.
2. Read `🆔` → `archetype_node_id` when present.
3. Read `Ⓣ` / `Ⓐ` / `⚙️` → `archetype_details` (restore omitted `Ⓐ` from name when `Ⓣ` or `⚙️` present).
4. When `🆔` absent but `Ⓐ` present → `archetype_node_id` = archetype id.

## Module map

| File | Role |
|------|------|
| `symbol_table.yaml` / `symbol_table.ts` | Symbol lookup table |
| `shared.ts` | Terse parse/format, structured LOCATABLE, type inference maps |
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
