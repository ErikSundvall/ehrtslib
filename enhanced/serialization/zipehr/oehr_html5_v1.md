# ZipEHR HTML5 — compact custom-element formats

**Status:** implemented (`html5_serialize.ts` / `html5_deserialize.ts`)  
**Related:** [`README.md`](README.md), [`symbol_table.yaml`](symbol_table.yaml), [`ROADMAP.md`](../../../ROADMAP.md) (Contribution builder)

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
| `<` | `⋖` (U+2A7B) |
| `>` | `⋗` (U+2A7C) |
| `<=` | `⩽` (U+2A7D) |
| `>=` | `⩾` (U+2A7E) |
| `~` | `~` |

```html
<o-🌡️ 🎛="⋖">
  <№>0.05</№>
  <◌>mg/L</◌>
</o-🌡️>
```

Possible future inline stream (non-HTML) varaints: `№5.6±0.2◌µmol/L⋯1`; `🎛⋖№0.05◌mg/L⋯2`.

## Attribute vocabulary (summary)

**Short:** `fmt`, `n`, `a`, `tp`, `rm`, `p`, `t`, `c`, `u`  
**Full:** kebab RM names (`archetype-node-id`, …)  
**Emoji:** `🆔`, `Ⓐ`, `Ⓣ`, `⚙️`, terminology shortcuts, quantity tokens above

Root `fmt` tokens: `s1` / `f1` / `e1` (or full URIs).

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
<o-ob fmt="s1" a="openEHR-EHR-OBSERVATION.body_weight.v2">Body weight<o-hi><o-pe n="at0003"><o-tr n="at0001"><o-e n="at0004">Weight<o-q><mag>85</mag><unit>kg</unit></o-q></o-e></o-tr></o-pe></o-hi></o-ob>
```
