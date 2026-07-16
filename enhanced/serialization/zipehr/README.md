# ZipEHR

ZipEHR is a reversible “skin” over canonical openEHR JSON. It compresses data to a more compact
(JSON or YAML) format so it’s easier to skim with limited scrolling/screen space or limited LLM
context windows

- RM type information (`_type`) becomes emoji keys
- selected values become “terse” strings/scalars
- LOCATABLE names are emitted as structured objects with attribute emoji keys (`🪧`, `🆔`, `Ⓣ`, `Ⓐ`, `Ⓐ🆔`, `⚙️`)

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

**zipehr.html5** (`html5/short`, `html5/full`, `html5/emoji`): compact `o-*` custom
elements (not FHIR Narrative). Layout is a tristate — `oneliner` / `linesaving` / `fluffy`
(default: oneliner for short, linesaving for full/emoji). See [`oehr_html5_v1.md`](oehr_html5_v1.md).

**zipehr.json** (same clinical content as above, after `convertObjectDirect`):

```json
{
  "$schema": "http://purl.org/ehrtslib/zipehr/v1",
  "👀": { "🪧": "Body weight", "Ⓐ🆔": "openEHR-EHR-OBSERVATION.body_weight.v2" },
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
👀: { 🪧: "Body weight", Ⓐ🆔: "openEHR-EHR-OBSERVATION.body_weight.v2" }
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

**zipehr.xhtml** (same clinical tree — FHIR Narrative–safe; Ehrbase letter `class`, LOCATABLE ids in `title`):

```html
<div xmlns="http://www.w3.org/1999/xhtml" lang="en">
  <div class="OB" title="ar: openEHR-EHR-OBSERVATION.body_weight.v2">
    <h4>Body weight</h4>
    <div class="HI">
      <div class="PE" title="id: at0003">
        <div class="TR" title="id: at0001">
          <div class="E" title="id: at0004">
            <span>Weight</span>
            <span class="q" title="85|kg|">85 kg</span>
          </div>
        </div>
        <div class="TR" title="id: at0008">
          <div class="E" title="id: at0009">
            <span>State of dress</span>
            <span class="c" title="local::at0028|Fully clothed, without shoes|">Fully clothed, without shoes</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
```

Root uses `ar:` (archetype id) when it also stands for the node id; nested at-codes use `id:`. See [Selecting by node id](#selecting-by-node-id-css--xpath).

**zipehr.html5/short** (`layout: oneliner` — combined root attr `an`):

```html
<o-ob fmt="s1" an="openEHR-EHR-OBSERVATION.body_weight.v2">Body weight<o-hi><o-pe n="at0003"><o-tr n="at0001"><o-e n="at0004">Weight<o-q><mag>85</mag><unit>kg</unit></o-q></o-e></o-tr><o-tr n="at0008"><o-e n="at0009">State of dress<o-c t="local" c="at0028">Fully clothed, without shoes</o-c></o-e></o-tr></o-pe></o-hi></o-ob>
```

**zipehr.html5/full** (`layout: linesaving` — combined root attr `archetype-id-node-id`):

```html
<o-observation fmt="f1" archetype-id-node-id="openEHR-EHR-OBSERVATION.body_weight.v2">Body weight
  <o-history>
    <o-point-event archetype-node-id="at0003">
      <o-item-tree archetype-node-id="at0001">
        <o-element archetype-node-id="at0004">Weight
          <o-dv-quantity><magnitude>85</magnitude><units>kg</units></o-dv-quantity>
        </o-element>
      </o-item-tree>
      <o-item-tree archetype-node-id="at0008">
        <o-element archetype-node-id="at0009">State of dress
          <o-dv-coded-text terminology-id="local" code-string="at0028">Fully clothed, without shoes</o-dv-coded-text>
        </o-element>
      </o-item-tree>
    </o-point-event>
  </o-history>
</o-observation>
```

**zipehr.html5/emoji** (`layout: linesaving` — combined root attr `Ⓐ🆔`):

```html
<o-👀 fmt="e1" Ⓐ🆔="openEHR-EHR-OBSERVATION.body_weight.v2">Body weight
  <o-📉>
    <o-🞋 🆔="at0003">
      <o-🌳 🆔="at0001">
        <o-🔹 🆔="at0004">Weight<o-🌡️><№>85</№><◌>kg</◌></o-🌡️></o-🔹>
      </o-🌳>
      <o-🌳 🆔="at0008">
        <o-🔹 🆔="at0009">State of dress
          <o-🗈 📍="at0028">Fully clothed, without shoes</o-🗈>
        </o-🔹>
      </o-🌳>
    </o-🞋>
  </o-📉>
</o-👀>
```

### Selecting by node id (CSS / XPath)

openEHR paths are sequences of `archetype_node_id` values. In the (X)HTML skins those ids are attributes (or `title` pairs), so you can walk the same path with CSS or XPath.

| Dialect | Node id alone | Archetype id alone | Combined (`node id` = `archetype id`) |
|---------|---------------|--------------------|----------------------------------------|
| **html5/emoji** | `🆔` | `Ⓐ` | `Ⓐ🆔` |
| **html5/short** | `n` | `a` | `an` |
| **html5/full** | `archetype-node-id` | `archetype-id` | `archetype-id-node-id` |
| **xhtml** | `title` contains `id: …` | `title` contains `ar: …` | only `ar:` is emitted (id omitted) |

To select a node **by its node id**, match either the dedicated node-id attribute **or** the combined attribute (roots often use the combined form):

```css
/* html5/emoji — Weight ELEMENT (at0004) */
[🆔="at0004"], [Ⓐ🆔="at0004"]

/* html5/short */
[n="at0004"], [an="at0004"]

/* html5/full */
[archetype-node-id="at0004"], [archetype-id-node-id="at0004"]
```

```xpath
(: html5/emoji :)
//*[@🆔='at0004' or @Ⓐ🆔='at0004']

(: html5/short :)
//*[@n='at0004' or @an='at0004']

(: html5/full :)
//*[@archetype-node-id='at0004' or @archetype-id-node-id='at0004']

(: xhtml — match title pair id: or ar: (combined roots emit ar: only) :)
//*[@title='id: at0004' or starts-with(@title, 'id: at0004;')
    or @title='ar: at0004' or starts-with(@title, 'ar: at0004;')]
```

Path-shaped queries (observation → event `at0003` → tree `at0001` → weight `at0004`), emoji dialect:

```css
[Ⓐ🆔="openEHR-EHR-OBSERVATION.body_weight.v2"] [🆔="at0003"] [🆔="at0001"] [🆔="at0004"]
```

```xpath
//*[@Ⓐ🆔='openEHR-EHR-OBSERVATION.body_weight.v2']
  //*[@🆔='at0003']//*[@🆔='at0001']//*[@🆔='at0004']
```

Same path, short dialect (`an` / `n`) and full dialect (`archetype-id-node-id` / `archetype-node-id`) — substitute the attribute names from the table. XHTML equivalent:

```xpath
//*[@class='OB' and starts-with(@title, 'ar: openEHR-EHR-OBSERVATION.body_weight.v2')]
  //*[@class='PE' and (@title='id: at0003' or starts-with(@title, 'id: at0003;'))]
  //*[@class='TR' and (@title='id: at0001' or starts-with(@title, 'id: at0001;'))]
  //*[@class='E' and (@title='id: at0004' or starts-with(@title, 'id: at0004;'))]
```

Notes:

- Prefer the **or-combined** form (`🆔` **or** `Ⓐ🆔`, etc.) whenever the path step might be an archetyped root.
- CSS cannot express “attribute A or B equals X” as one simple attribute selector without a comma group; use the two-selector list above (or XPath).
- XHTML packs several fields into one `title`; prefer exact / `starts-with` matches on `id:` / `ar:` pairs rather than bare `contains(., 'at0004')`, which can false-positive inside longer ids.

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
(`emoji` vs `lettercode`). Sme extra codes fro special Zipehr needs (mostly attributes) not present
in ehrbase have been added.

That “first symbol only” rule has two implications developers that fiddle with symbols should care about:

1. **Round-tripping depends on stability.** If the first symbol changes for a type, older
   ZipEHR payloads may not decode the same way.
2. **First symbols must be unique across RM type rows** (`data_types`, `data_structures`,
   `ehr_components`). (Symbol pairs like `📅⌚` (DV_DATE_TIME) count as one unit.)

Extra rows in the same file:

- **`terminology_shortcuts`** — terse-string prefix replacements (`openehr::` → `🌬️`, etc.)
- **`field_promotions`** — COMPOSITION `language` / `territory` / `encoding` promoted to emoji keys
- **`html5_short_tags`** — `o-{suffix}` overrides when Ehrbase letter codes collide under HTML
  ASCII lowercasing (e.g. `DV_COUNT` → `cnt` because `co` = `COMPOSITION`). Used by
  `zipehr.html5/short` only; see [`oehr_html5_v1.md`](oehr_html5_v1.md).

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
🖂: { "🪧": "ChemoForm-MBA.v7", "Ⓣ": "ChemoForm-MBA.v7", "Ⓐ🆔": "openEHR-EHR-COMPOSITION.self_reported_data.v1", "⚙️": "1.1.0" }
📁: { "🪧": "Vårdenhet", "Ⓐ🆔": "openEHR-EHR-CLUSTER.organisation.v1", "⚙️": "1.1.0" }
🌳: { "🪧": "Item tree", "🆔": "at0003" }
```

Attribute emoji keys are defined in `symbol_table.yaml` (`data_types.attributes`):

| RM attribute | symbol_table key | Emoji |
|--------------|------------|-------|
| `LOCATABLE.name` | `LOCATABLE.name` | `🪧` |
| `LOCATABLE.archetype_node_id` | `LOCATABLE.archetype_node_id` | `🆔` |
| `ARCHETYPED.template_id` | `ARCHETYPED.template_id` | `Ⓣ` |
| `ARCHETYPED.archetype_id` | `ARCHETYPED.archetype_id` | `Ⓐ` |
| *(combined)* | when `archetype_node_id` = `archetype_id` | `Ⓐ🆔` |
| `ARCHETYPED.rm_version` | `ARCHETYPED.rm_version` | `⚙️` |
| `DV_QUANTITY.magnitude_status` | `DV_QUANTITY.magnitude_status` | `🎛` |
| `DV_QUANTITY.magnitude` | `DV_QUANTITY.magnitude` | `№` |
| `DV_QUANTITY.units` | `DV_QUANTITY.units` | `◌` |
| `DV_QUANTITY.precision` | `DV_QUANTITY.precision` | `⋯` |
| `DV_QUANTITY.accuracy` | `DV_QUANTITY.accuracy` | `±` |

`magnitude_status` operator mapping (`magnitude_status_operators` in yaml): exact `=` omitted on the wire; letter **and** emoji columns use the same HTML-safe symbols (`⩻` / `⩼` / `⩽` / `⩾` / `~`) so lettercode XHTML and html5/short never need `&lt;`/`&gt;` HTML escaping. Status tag `🎛` (setting/adjustment knobs symbol) precedes the operator in some serialisation formats; use generated `MAGNITUDE_STATUS_OPERATORS` from `symbol_table.ts`.

  "<": ["⩻","⩻"],
  ">": ["⩼","⩼"],

### Serialize rules

1. Always emit `🪧` with `name.value`.
2. Emit `Ⓣ`, `Ⓐ` / `Ⓐ🆔`, `⚙️` when present in `archetype_details`.
3. Omit `Ⓐ` / `Ⓐ🆔` when `archetype_id` equals `name.value`.
4. When `archetype_node_id` equals `archetype_id` (or node id is absent and will be restored from the archetype id), emit combined key `Ⓐ🆔` instead of separate `Ⓐ` + `🆔` so path-building still shows a node-id marker.
5. Emit separate `🆔` when no detail symbols apply, or when `archetype_node_id` differs from `archetype_id`.
6. Drop separate `archetype_details` / `name` / `archetype_node_id` from the parent row when structured.

COMPOSITION uses emoji key `🖂` (not `_` + `name`).

### Deserialize rules

1. Read `🪧` → `name.value`.
2. Read `🆔` → `archetype_node_id` when present.
3. Read `Ⓐ🆔` → both `archetype_id` and `archetype_node_id` (same value).
4. Read `Ⓣ` / `Ⓐ` / `⚙️` → `archetype_details` (restore omitted `Ⓐ` from name when `Ⓣ` or `⚙️` present).
5. Legacy: when `🆔` absent but `Ⓐ` present → `archetype_node_id` = archetype id.

For walking these ids in the HTML skins, see [Selecting by node id (CSS / XPath)](#selecting-by-node-id-css--xpath).

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
