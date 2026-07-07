# ZipEHR format

Compact openEHR instance serialization using emoji type symbols. Two variants:

- **j-zipehr** — flow-style JSON with emoji keys on every typed node (no type
  inference). Leaf `DV_*` values use terse notation inside their emoji wrapper.
- **y-zipehr** — YAML with terse values, type inference from parent property
  names, emoji keys on structural/LOCATABLE nodes only, hybrid layout

## Terse data values

| Variant | `EVENT_CONTEXT.setting` (`DV_CODED_TEXT`) | `EVENT_CONTEXT.start_time` (`DV_DATE_TIME`) |
|---------|---------------------------------------------|---------------------------------------------|
| **j-zipehr** | `{ "🗈": "🪟238\|other care\|" }` | `{ "📅⏰": "2023-08-31T18:31:16+02:00" }` |
| **y-zipehr** | `🪟238\|other care\|` (inferred type, no emoji wrapper) | `{ value: "2023-08-31T18:31:16+02:00" }` |

`DV_CODED_TEXT` terse form is `term::code|value|` with terminology shortcuts
(`openehr::` → `🪟`, `local::` → `📍`, etc.). j-zipehr always wraps in the type
emoji; y-zipehr keeps inferrable leaf properties as bare terse scalars or
`{ value: … }` objects.

## Folded LOCATABLE names
LOCATABLE nodes (COMPOSITION, OBSERVATION, CLUSTER, ITEM_TREE, etc.) fold
`name`, `archetype_node_id`, and `archetype_details` into a single quoted string:

```yaml
🖂: "ChemoForm-MBA.v7[Ⓣ ChemoForm-MBA.v7 Ⓐ openEHR-EHR-COMPOSITION.self_reported_data.v1 ⚙️1.1.0]"
📁: "Vårdenhet[Ⓐ openEHR-EHR-CLUSTER.organisation.v1 ⚙️1.1.0]"
🌳: "Item tree[at0003]"
```

### Bracket algorithm (serialize)

1. Start with `name.value`.
2. Build bracket content (space-separated), in order:
   - `Ⓣ {template_id}` when `archetype_details.template_id` is present
   - `Ⓐ {archetype_id}` when `archetype_details.archetype_id` is present **and**
     differs from `name.value` (omitted when equal — saves space)
   - `⚙️{rm_version}` when `archetype_details.rm_version` is present
   - plain `archetype_node_id` when it differs from `archetype_id` (e.g. `at0003`)
3. When no archetype-detail symbols apply, the bracket is just `archetype_node_id`
   (legacy `name[node_id]` form).
4. Omit the separate `archetype_details` property from output when folded.

COMPOSITION uses the `🖂` key instead of `_` + `name`.
### Bracket algorithm (deserialize)

1. Parse `name[bracket]` when brackets are present.
2. Tokenize bracket on `Ⓣ`, `Ⓐ`, and `⚙️` symbols.
3. Plain text without symbols becomes `archetype_node_id`.
4. When `Ⓐ` is absent but `Ⓣ` or `⚙️` is present, restore
   `archetype_id` from `name.value` (inverse of the omit-when-equal rule).
5. When `Ⓐ` is present and no separate node id was parsed, set
   `archetype_node_id` to the archetype id value.

Symbols are defined in `ARCHETYPE_DETAIL_SYMBOLS` (`shared.ts`).
