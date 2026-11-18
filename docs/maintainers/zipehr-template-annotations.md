# ZipEHR HTML5: template UI metadata

ZipEHR html5 can forward **template** metadata onto composition markup. The
HTML5 deserializer ignores `data-antn-*`, `data-opt-*`, and `data-rm-*`
presentation attrs (`isZipEhrTemplatePresentationHtmlAttr`); canonical JSON
round-trip stays lossless.

There is **no agreed openEHR UI-hint vocabulary**. ehrtslib keeps **three
separate attribute namespaces** — sources are never mixed:

| Namespace | Source | Future-proof? |
|-----------|--------|----------------|
| `data-antn-{slug}` | Template / archetype **path annotations** (OPT XML, ADL2 `annotations.documentation`, etc.) | Annotations may be stripped in OPT2 profiles (§4.1); ADL2 defines only the `documentation` group (§7.14). |
| `data-opt-visibility`, `data-opt-alias` | **OPT 1.4 only**: `<view><constraints>` (`pass_through`, `VisibleInView`) and hide-on-form conventions (`a.hide_on_form`, `hide_on_form`, Ferro `hide-on-form`) | **No** — Ocean / EHRbase tool practice; ITS-XML 1.4 `T_VIEW` ids not spec-defined. No ADL2 / OPT2 equivalent. |
| `data-rm-visibility`, `data-rm-alias` | **ADL2 / AOM2 only**: `rm_overlay.rm_visibility` (`show` \| `hide`) and `alias` (at-code → terminology text) | **Yes (within scope)** — ADL2 §7.12; AOM2 `VISIBILITY_TYPE`. Limited to **non-archetyped RM** overlay paths; tool-oriented. |

ehrtslib does **not** map ADL2 `rm_visibility` into `data-opt-*`, or OPT `<view>`
into `data-rm-*`.

Hide-on-form keys are **not** duplicated as `data-antn-*`; they drive
`data-opt-visibility` only.

## `data-antn-*` (path annotations)

When serializing with **Web Template + OPT**, every **non–hide-on-form** path
annotation for the matched node becomes one or two HTML attributes:

| Output | Meaning |
|--------|---------|
| `data-antn-{slug}="value"` | Annotation value |
| `data-antn-{slug}-key="original"` | Present when the slug is **lossy** or **collides** |

**Slug normalization:** lowercase; chars outside `[a-z0-9-]` → `-`; collapse
runs; trim ends.

Example: `L10n.en` → `data-antn-l10n-en="…"` plus `data-antn-l10n-en-key="L10n.en"`.

The serializer does **not** interpret annotation names (no hide/class/title
registry). Viewers choose CSS/JS against `data-antn-*`.

## `data-opt-*` (OPT 1.4 view / hide-on-form)

| Attribute | Values |
|-----------|--------|
| `data-opt-visibility` | `hide` \| `show` \| `pass-through` |
| `data-opt-alias` | Reserved for OPT-only alias conventions (uncommon today) |

Sources: `<view>` constraints attached from OPT XML; path annotation keys
`a.hide_on_form`, `hide_on_form`, `hide-on-form`.

## `data-rm-*` (ADL2 rm_overlay)

| Attribute | Values |
|-----------|--------|
| `data-rm-visibility` | `hide` \| `show` |
| `data-rm-alias` | Resolved terminology text for `rm_visibility.alias` at-code |

Implemented in `generation/opt_view.ts` / `applyPresentationAttrs` when the
operational template carries parsed `rm_overlay.rm_visibility`.

## Quiet-structure CSS (example viewer)

Shipped overrides are **not** part of round-trip:

- `[data-opt-visibility="hide"]` — Ferro Clinergy (`hide-on-form`) and view hide
- `[data-rm-visibility="hide"]` — ADL2 overlay hide
- `[data-opt-visibility="pass-through"]` — `display: contents`; hide `.zs-structural-label`

## Serializer API

`Html5SerializeOptions`: `operationalTemplate`, `webTemplate`, `templateRenderLang`.

## Ferro / workbench

`thumb-pain-encounter.v2-coded.opt` uses annotation key `hide-on-form` on
Clinergy descriptor paths (→ `data-opt-visibility="hide"` in html5, not
`data-antn-*`).

## Parser

OPT XML: path annotations and `attachOptViewConstraints` in `opt_xml_parser.ts`.

## Future-proofing (AM Release 2.3.0 review)

This ZIP emitter is a **viewer convenience**. Treat all `data-*` presentation
attrs as **non-normative** for clinical interchange.

- **OPT 1.4 `<view>`** and hide-on-form → `data-opt-*` only; not ADL2/OPT2.
- **`rm_overlay.rm_visibility`** → `data-rm-*` only; do not fold into
  `data-opt-*` or `data-antn-*`.
- Path annotations → `data-antn-*`; UI/technical annotation group still open as
  [SPECPR-469](https://specifications.openehr.org/tickets/SPECPR-469).

### Follow-up

- Explicit `template` serializer option and annotation `RegExp` filter.
- Demo: pass template metadata into `serializeToHtml5Variant`.
- Precedence when OPT `<view>` and ADL2 `rm_visibility` disagree on one path.