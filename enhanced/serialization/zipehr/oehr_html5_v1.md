# ZipEHR HTML5 — compact custom-element formats

**Status:** implemented (`html5_serialize.ts` / `html5_deserialize.ts`)  
**Related:** [`README.md`](README.md), [`symbol_table.yaml`](symbol_table.yaml), [`roadmap.md`](../../../docs/maintainers/roadmap.md) (Contribution builder)

## Purpose

Three ZipEHR HTML5 wire formats serialise openEHR RM instance trees as **custom elements** (`o-*`) for:

- compact storage / LLM context
- **browser-readable clinical text without CSS** (names and values as element text)
- CSS / XPath / XQuery / DOM tree walk
- optional upgrade to web components for in-browser edit → contribution builder

Not constrained by FHIR Narrative. Prefer **attributes** for codes, ids, and machine fields; put **clinically relevant display strings in element text** so a bare HTML document is human-readable.

| Format URI | Tag dialect | Example tags |
|------------|-------------|--------------|
| `http://purl.org/ehrtslib/zipehr/html5/short/v1` | Ehrbase / `symbol_table` letter codes | `o-co`, `o-ob`, `o-e`, `o-q`, `o-c` |
| `http://purl.org/ehrtslib/zipehr/html5/full/v1` | RM class names, kebab-case | `o-composition`, `o-observation`, `o-element`, `o-dv-quantity` |
| `http://purl.org/ehrtslib/zipehr/html5/emoji/v1` | ZipEHR emoji symbols | `o-👀`, `o-🔹`, `o-🌡️`, `o-🗈` |

Same tree shape across dialects; tag local name after `o-` differs. Round-trip all ↔ canonical JSON via the shared ZipEHR symbol maps.

## Design goals

| Goal | Rule |
|------|------|
| Compress | Short dialect: compact wire by default; pretty-print optional |
| Readable | LOCATABLE **names** and DV **values** render as **text** in the browser without CSS |
| Semantics | Every typed node is an `o-*` element; LOCATABLE + DV fields recoverable |
| Traversable | Parent/child = RM containment; siblings under multi-valued props use document order |
| No path strings | No FLAT/`data-oe-p`; paths inferred by walk + template/AOM if needed |
| Text-first clinical | Display names, rubrics, magnitudes, units, booleans → text (or nested text children) |
| Machine attrs | Archetype ids, codes, terminology ids, precision metadata → attributes |
| Hydrate later | Tags alone are storage; web components upgrade the same tags in apps |
| HTML-safe operators | `magnitude_status` never uses raw `<`/`>` (see `magnitude_status_operators`) |

## Non-goals

- FHIR `Narrative.div` compliance (use `zipehr.xhtml/v1` for that)
- Emitting FLAT paths or editor-kind hints in the stored document

## Pretty-print vs compact (layout)

**All three dialects** accept `layout` (user-selectable tristate):

| Layout | Behaviour |
|--------|-----------|
| `oneliner` | Fully compact — no insignificant whitespace |
| `linesaving` | Hybrid (like `zipehr.json`): keep small related clusters on one line; break larger structure |
| `fluffy` | Standard indented HTML — open/close tags and children on separate lines |

| Dialect | Default `layout` |
|---------|------------------|
| short | `oneliner` |
| full | `linesaving` |
| emoji | `linesaving` |

## Relationship to other ZipEHR skins

```
Canonical JSON (_type)
  ├─ zipehr.json / zipehr.yaml
  ├─ zipehr.xhtml/v1          … FHIR-safe (class + title)
  ├─ zipehr.html5/short/v1    … o-{letter}   (this doc)
  ├─ zipehr.html5/full/v1     … o-{rm-kebab} (this doc)
  └─ zipehr.html5/emoji/v1    … o-{emoji}    (this doc)
```

## Tag names

Custom elements require a hyphen → always `o-…`. HTML parsers fold ASCII tag names to lowercase; emoji suffixes are case-stable.

### Short dialect (`html5/short`)

Letter codes from [`symbol_table.yaml`](symbol_table.yaml), lowercased, with **HTML5 collision overrides** from `html5_short_tags`:

| RM type | Tag | Notes |
|---------|-----|-------|
| COMPOSITION | `o-co` | |
| OBSERVATION | `o-ob` | |
| ELEMENT | `o-e` | |
| DV_QUANTITY | `o-q` | |
| DV_CODED_TEXT | `o-c` | |
| DV_COUNT | `o-cnt` | override |
| CODE_PHRASE | `o-cph` | override |
| DV_INTERVAL | `o-ivl` | override |
| DV_PARSABLE | `o-prs` | override |
| DV_PROPORTION | `o-prp` | override |
| DV_URI | `o-uri` | override |

Serializer: `SYMBOL_TABLE_HTML5_SHORT_TAGS[type] ?? letterCode.toLowerCase()`.

### Full dialect (`html5/full`)

`o-` + RM class lowercased with `_` → `-` (e.g. `o-dv-quantity`).

### Emoji dialect (`html5/emoji`)

`o-` + primary emoji from `SYMBOL_TABLE_EMOJI_SYMBOLS` (e.g. `o-🌡️`). Attribute names use ZipEHR emoji keys where defined.

## Browser-readable text

Emit `LOCATABLE.name.value` as the **leading text** of the element (before child elements).

### `DV_QUANTITY`

| Dialect | Magnitude child | Units child | Status / precision / accuracy attrs |
|---------|-----------------|-------------|-------------------------------------|
| short | `<mag>` | `<unit>` | `mst`, `prc`, `acc` |
| full | `<magnitude>` | `<units>` | `magnitude-status`, `precision`, `accuracy` |
| emoji | `<№>` | `<◌>` | `🎛`, `⋯`, `±` |

### HTML-safe `magnitude_status` operators

From `magnitude_status_operators` in `symbol_table.yaml` (letter **and** emoji columns are identical — also used by lettercode XHTML / html5 short so `<`/`>` need no `&lt;`/`&gt;`):

| RM | Wire |
|----|------|
| `=` | omitted |
| `<` | `⩻` (U+2A7B LESS-THAN WITH QUESTION MARK ABOVE) |
| `>` | `⩼` (U+2A7C GREATER-THAN WITH QUESTION MARK ABOVE) |
| `<=` | `⩽` (U+2A7D) |
| `>=` | `⩾` (U+2A7E) |
| `~` | `~` |

```html
<o-🌡️ 🎛="⩻">
  <№>0.05</№>
  <◌>mg/L</◌>
</o-🌡️>
```

Possible future inline stream (non-HTML) varaints: `№5.6±0.2◌µmol/L⋯1`; `🎛⩻№0.05◌mg/L⋯2`.

## Attribute vocabulary (summary)

**Short:** `fmt`, `n`, `a` (valueless = same-as-`n` flag), `tp`, `rm`, `p`, `dc` (terse CODE_PHRASE), `tm`, `xf`, `u`, `enc`  
**Full:** kebab RM names (`archetype-node-id`, `defining-code`, …)  
**Emoji:** `🆔`, `Ⓐ` (valueless flag or string), `Ⓣ`, `⚙️`, `🏷️` (terse defining_code; also accepts `≝🏷️`), `⇄`, `🖹`, `🔗`, `🔤`, quantity tokens above

### DV_TEXT / DV_CODED_TEXT machine fields

Prefer **attributes** for technical CODE_PHRASE fields; keep the clinical rubric as element text.

| RM field | Short | Full | Emoji | Value form |
|----------|-------|------|-------|------------|
| `defining_code` | `dc` | `defining-code` | `🏷️` (alt: `≝🏷️`) | terse `terminology::code` (emoji may shorten known prefixes, e.g. `🌬️433`) |
| `language` | `lang` | `lang` | `lang` | bare ISO 639 code (native HTML) |
| `encoding` | `enc` | `encoding` | `🔤` | bare IANA charset code |
| `formatting` | `xf` | `formatting` | `🖹` | `markdown` / `plain` / … |
| `hyperlink` | `u` | `hyperlink` | `🔗` | URI string |
| `mappings` | `tm` | `mappings` | `⇄` | `match\|target_terse` joined by `;` (optional purpose: `\|purpose_dv_coded_terse`) |

```html
<o-🗈 🏷️="SNOMED-CT::44054006">Diabetes mellitus type 2</o-🗈>
<o-c dc="openehr::433">event</o-c>
<o-🗈 🏷️="🌬️433" lang="en">event</o-🗈>
<o-🗉 ⇄="=|LOINC::1234-5;>|ICD10::E11.9">Ross River infection</o-🗉>
```

(`>` / `<` in `match` are HTML-escaped in attribute values, e.g. `&gt;|ICD10::E11.9`.)

No per-terminology emoji shortcuts for SNOMED/LOINC/ICD yet — use full `terminology::code` (existing `local` / `openehr` / ISO shortcuts still apply inside terse strings).

Technical identifier types (`OBJECT_VERSION_ID`, `ARCHETYPE_ID`, `TEMPLATE_ID`,
`TERMINOLOGY_ID`, `HIER_OBJECT_ID`, `GENERIC_ID`, `INTERNET_ID`, `UUID`) are
leaf elements: the id string is stored in the HTML `title` attribute (machine
field), with **empty** element text — not clinician-visible in a bare document.

When `archetype_node_id` equals `archetype_id`, always emit the node-id attr (`n` / `archetype-node-id` / `🆔`) and a **valueless** ARCHETYPED flag (`a` / `archetype-id` / `Ⓐ`) — same compression as zipehr.json / zipehr.yaml (`"Ⓐ": true`).

Root `fmt` tokens: `s1` / `f1` / `e1` (or full URIs).

openEHR `language` on COMPOSITION and ENTRY is emitted as the native HTML `lang` attribute
(not `🗪` / `language=`). Territory/encoding remain promoted attrs where applicable.

### RM property names (`propertyMode`)

| Mode | Behaviour |
|------|-----------|
| `omit` (default) | Emit `p` / `property` only when the parent slot is ambiguous |
| `attribute` | Always emit `p` (short/emoji) or `property` (full) |
| `comment` | Always emit `<!--prop-->` before the element; still emit the attribute when ambiguous |

```ts
await serializeToZipehrHtml5(obj, {
  dialect: "full",
  propertyMode: "attribute", // or "omit" | "comment"
});
```

## API

```ts
import {
  serializeToZipehrHtml5,
  serializeToHtml5Variant,
  zipehrHtml5ToCanonical,
} from "./mod.ts";

await serializeToZipehrHtml5(canonicalOrRm, {
  dialect: "short" | "full" | "emoji",
  layout?: "oneliner" | "linesaving" | "fluffy",
  lang?: string,
  omitLocatableNames?: boolean,
});

await serializeToHtml5Variant(obj, "zipehr.html5.short", { layout: "fluffy" });

zipehrHtml5ToCanonical(html); // dialect from fmt / tags
```

## Worked example (body weight, short compact)

```html
<o-ob fmt="s1" n="openEHR-EHR-OBSERVATION.body_weight.v2" a>Body weight<o-hi><o-pe n="at0003"><o-tr n="at0001"><o-e n="at0004">Weight<o-q><mag>85</mag><unit>kg</unit></o-q></o-e></o-tr></o-pe></o-hi></o-ob>
```
