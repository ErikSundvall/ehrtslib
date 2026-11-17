# ZipEHR HTML5: template UI metadata

ZipEHR html5 can forward **template** metadata onto composition markup. The
HTML5 deserializer ignores these attributes; canonical JSON round-trip stays
lossless.

There is **no agreed openEHR UI-hint vocabulary**. Real-world sources differ:

| Source | Practice |
|--------|-----------|
| **Ocean OET** | `<Rule hide_on_form="true"/>` on overlay paths (UI metadata, not AOM). |
| **OPT 1.4 XML** | `<view><constraints path="…"><items id="pass_through"><value>true</value>` (Ocean → EHRbase; seen in many production OPTs). Optional `<items id="VisibleInView">`. |
| **ADL2 / AOM2** | Normative `rm_overlay.rm_visibility` (`show` \| `hide`) with optional `alias` (SPECAM-63). |
| **OPT `<annotations>`** | Project-local, often set-prefixed (`Notes.Comment`, `fhir_mapping`, `L10n.en`). Not a shared UI-hint registry. |
| **Experimental** | Discourse [#2406](https://discourse.openehr.org/t/agreeing-on-optional-user-interface-hints-in-templates/2406): `a.hide_on_form` with values `input` \| `presentation` — **not standard**. |

ehrtslib does **not** treat invented `<items id="hide-on-form">` as practice.

## Pass-through prefix: `html:`

Template annotation keys that start with **`html:`** are copied verbatim onto the
matched composition element: the part after the prefix becomes the HTML
attribute name; the annotation value becomes the attribute value (with `class`
merged when both serializer and template supply it).

Examples:

| OPT / Web Template annotation key | Html5 output |
|-----------------------------------|--------------|
| `html:data-hide-on-form` = `true` | `data-hide-on-form="true"` |
| `html:class` = `quiet` | `class="quiet"` (merged with existing `class`) |

### Why `html:` (not `html.`)

- Matches the experimental Discourse shape (`html:…` as a pseudo-namespace) and
  keeps the suffix **exactly** the DOM attribute name (including `data-*` and
  hyphenated names).
- Survives **OPT 1.4** path `<items id="…">` (XML allows `:` in `id` values;
  same storage as `L10n.en`, `Notes.Comment`, etc.).
- Survives **ADL2** / documentation bags (arbitrary string keys).
- Does not collide with established dotted families (`L10n.`, `a.`) used by
  `annotationFamily()` — `html:data-foo` stays unprefixed-family, distinct
  from `html.data-foo` which would parse as family `html.`.

The serializer has **no** registry of viewer-specific keys — only:

- Reject `on*` attribute names (event handlers).
- Reject `javascript:` in values.
- Reject invalid HTML attribute names.
- Reject pass-through that would overwrite serializer round-trip attributes
  (`data-zs-*`, `data-opt-*`, short `n`/`a`/`tp`/`rm`/`fmt`, …).

Non-`html:` annotations remain in the OPT only; they are **not** emitted on html5
(no lossless JSON blob on markup).

## View constraints (separate)

When `operationalTemplate` + `webTemplate` are supplied, the serializer still
summarises normative / de-facto **view** metadata:

| Attribute | Meaning |
|-----------|---------|
| `data-opt-visibility` | `hide` \| `show` \| `pass-through` from `<view>` `pass_through`, `rm_visibility`, `VisibleInView`, experimental `a.hide_on_form`. |
| `data-opt-alias` | `rm_visibility.alias` when present. |

This is independent of `html:` pass-through; viewers may use either or both.

Visibility mapping (first match wins):

1. `view.pass_through === true` → `pass-through`
2. `view.pass_through === false` → `hide`
3. `rm_overlay.rm_visibility` → `hide` / `show`
4. `VisibleInView` item present → `show`
5. Experimental `a.hide_on_form` / `hide_on_form`: `presentation` or `true` → `hide`; `input` → `show`

Metadata is attached only on nodes matched by Web Template `aqlPath` (not copied
to descendants).

## Quiet-structure CSS

Shipped overrides (viewer-owned; not part of round-trip):

- `[data-hide-on-form="true"]` — example pass-through hide (Ferro Clinergy fixture)
- `[data-opt-visibility="hide"]` — view / `rm_visibility` summary hide
- `[data-opt-visibility="pass-through"]` — `display: contents`; hide `.zs-structural-label` children

## Serializer API

`Html5SerializeOptions`:

- `operationalTemplate` — parsed OPT (view constraints, rm_overlay, annotations)
- `webTemplate` — index nodes by `aqlPath`
- `templateRenderLang` — annotation language preference (`render` → `""` → original)

## Ferro / workbench

Clinergy descriptor hiding in `thumb-pain-encounter.v2-coded.opt` uses
`html:data-hide-on-form` on the cluster path (not invented annotation ids).
Production Ocean OPTs may still use `<view>` `pass_through` (mapped to
`data-opt-visibility`) or project-specific `html:*` keys.

## Parser

OPT XML: `parser/legacy/opt_xml_parser.ts` calls `attachOptViewConstraints`.
ADL2 `rm_overlay` is already parsed via `applyRmOverlayOdin`.