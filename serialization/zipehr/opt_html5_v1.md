# ZipEHR OPT HTML5 — compact AOM2 operational template formats

**Status:** implemented (`opt_html5_serialize.ts` / `opt_html5_deserialize.ts` / `opt_html5_hydrate.ts`)  
**Related:** [`oehr_html5_v1.md`](oehr_html5_v1.md) (RM instance twin), [`symbol_table.yaml`](symbol_table.yaml)

## Purpose

Three OPT HTML5 wire formats serialise an ADL2/AOM2 **OPERATIONAL_TEMPLATE** as custom elements (`a-*`) so that:

- the full constraint tree is **browser-readable** with CSS (labels, cardinalities, coded choices)
- the document stays **lossless enough** to round-trip to a plain AOM-like JSON tree (`_type`)
- a small **hydration** script can turn the same markup into an editable form

| Format URI | Tag dialect | Example tags |
|------------|-------------|--------------|
| `http://purl.org/ehrtslib/zipehr/opt-html5/short/v1` | AM letter codes | `a-ot`, `a-cc`, `a-sa`, `a-ma` |
| `http://purl.org/ehrtslib/zipehr/opt-html5/full/v1` | AM kebab names | `a-operational-template`, `a-c-complex-object` |
| `http://purl.org/ehrtslib/zipehr/opt-html5/emoji/v1` | AM (+ optional RM) emoji | `a-🗂`, `a-⬡👀`, `a-◆🌡️` |

Root `fmt` tokens: `os1` / `of1` / `oe1`.

Prefix **`a-`** (archetype model) distinguishes OPT markup from RM-instance **`o-`** ZipEHR HTML5.

## Compound emoji symbols

Two compound patterns (emoji dialect):

### 1. AM constraint + RM type

For compoundable `C_OBJECT` subtypes, combine:

1. AM constraint glyph (from `am_types`)
2. RM type glyph, when `rm_type_name` is known

| AM class | RM type | Tag |
|----------|---------|-----|
| `C_COMPLEX_OBJECT` | `OBSERVATION` | `a-🔐⬡👀` |
| `C_COMPLEX_OBJECT` | `ELEMENT` | `a-🔐⬡🔹` |
| `C_PRIMITIVE_OBJECT` | `DV_QUANTITY` | `a-🔐◆🌡️` |
| `C_ARCHETYPE_ROOT` | `COMPOSITION` | `a-🔐√🖂` |

### 2. Constraint lock + foundation type

Primitive `C_*` constraints use **🔐** (closed lock with key) plus the matching
[`foundation_types`](symbol_table.yaml) primary emoji:

| AM class | Foundation | Tag |
|----------|------------|-----|
| `C_BOOLEAN` | `Boolean` ✓ | `a-🔐✓` |
| `C_INTEGER` | `Integer` 𝕫 | `a-🔐𝕫` |
| `C_REAL` | `Real` 𝕣 | `a-🔐𝕣` |
| `C_STRING` | `String` 📝 | `a-🔐📝` |

Edit foundation glyphs in `symbol_table.yaml`, keep the `🔐…` compounds on the
matching `C_*` rows in `am_types` in sync, then regenerate:
`deno task generate:symbol-table`.

When compounded with RM, the `rt` / `🅁` attribute may be omitted (recoverable from the tag).

## Browser-readable conventions

| Concern | Representation |
|---------|----------------|
| Template / node name | Leading element **text** (from ontology term) |
| Attribute slot name | Leading text on `a-sa` / `a-ma` (= `rm_attribute_name`) |
| Occurrences / existence / cardinality | Attributes (`oc` / `ex` / `cd` or emoji) |
| Coded / string choices | Child `<ch dc="local::at…">Rubric</ch>` |
| Alternatives on singular attrs | Sibling `C_OBJECT`s + `data-opt-choices` |
| Leaf value sites | `data-opt-field` (hydration target) |
| Optional nodes | `data-opt-optional` when occurrences lower bound is 0 |

## Layout

Same tristate as RM HTML5: `oneliner` / `linesaving` / `fluffy`  
Defaults: short → oneliner; full/emoji → linesaving.

## Hydration

[`opt_html5_hydrate.ts`](opt_html5_hydrate.ts):

| Mode | Behaviour |
|------|-----------|
| `off` | Display only |
| `all` | Every `data-opt-field` shows an input/select |
| `focus` | Editors appear only for the focused field; CSS transitions on `max-height` / opacity reduce layout jump |

Preview documents can embed controls via `wrapOptHtml5PreviewDocument`.

## API

```ts
import {
  serializeOperationalTemplateToHtml5,
  serializeToOptHtml5Variant,
  optHtml5ToPlain,
  hydrateOptHtml5,
} from "./mod.ts";

serializeOperationalTemplateToHtml5(opt, {
  dialect: "emoji",
  layout: "fluffy",
});

serializeToOptHtml5Variant(opt, "opt.html5.short");

optHtml5ToPlain(html); // → plain AOM-like JSON

hydrateOptHtml5({ root: document.body, mode: "focus" });
```

## Stylesheets

| Dialect | CSS |
|---------|-----|
| short | [`css/opt-html5-short.css`](css/opt-html5-short.css) |
| full | [`css/opt-html5-full.css`](css/opt-html5-full.css) |
| emoji | [`css/opt-html5-emoji.css`](css/opt-html5-emoji.css) |

## Worked example (emoji, excerpt)

```html
<a-🗂 fmt="oe1" 🆔="openEHR-EHR-COMPOSITION.encounter.v1" lang="en">Encounter
  <a-▣🖂 🆔="at0000" Ⓐ="openEHR-EHR-COMPOSITION.encounter.v1">Encounter
    <a-≡ 📎="content">content
      <a-⬡👀 🆔="at0001" 🔢="0..1">Blood pressure
        …
      </a-⬡👀>
    </a-≡>
  </a-▣🖂>
</a-🗂>
```
