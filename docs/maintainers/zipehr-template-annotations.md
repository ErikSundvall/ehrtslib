# ZipEHR HTML5: template UI metadata

ZipEHR html5 can forward **template** metadata onto composition markup. The
HTML5 deserializer ignores `data-antn-*` and `data-opt-*` presentation attrs;
canonical JSON round-trip stays lossless.

There is **no agreed openEHR UI-hint vocabulary**. Real-world sources differ:

| Source | Practice |
|--------|-----------|
| **Ocean OET** | `<Rule hide_on_form="true"/>` on overlay paths (UI metadata, not AOM). |
| **OPT 1.4 XML** | `<view><constraints path="…"><items id="pass_through"><value>true</value>` (Ocean → EHRbase; seen in many production OPTs). Optional `<items id="VisibleInView">`. |
| **ADL2 / AOM2** | Normative `rm_overlay.rm_visibility` (`show` \| `hide`) with optional `alias` (SPECAM-63). |
| **OPT `<annotations>`** | Project-local, often set-prefixed (`Notes.Comment`, `fhir_mapping`, `L10n.en`). Not a shared UI-hint registry. |
| **Experimental** | Discourse [#2406](https://discourse.openehr.org/t/agreeing-on-optional-user-interface-hints-in-templates/2406): `a.hide_on_form` with values `input` \| `presentation` — **not standard**. |

ehrtslib does **not** treat invented `<items id="hide-on-form">` as practice
(Ocean uses view rules / overlay metadata instead).

## `data-antn-*` (all path annotations)

When serializing with **Web Template + OPT**, **every** path annotation for the
matched node becomes one or two HTML attributes:

| Output | Meaning |
|--------|---------|
| `data-antn-{slug}="value"` | Annotation value |
| `data-antn-{slug}-key="original"` | Present when the slug is **lossy** or **collides** |

**Slug normalization** (from the template annotation key):

1. Trim whitespace.
2. Lowercase.
3. Replace every character outside `[a-z0-9-]` (dots, underscores, colons, slashes, spaces, …) with a single `-`.
4. Collapse repeated `-`.
5. Trim leading/trailing `-`.

Example: `hide-on-form` → `data-antn-hide-on-form="true"`; `L10n.en` →
`data-antn-l10n-en="…"` plus `data-antn-l10n-en-key="L10n.en"`.

**Collision:** two keys that normalize to the same slug (e.g. `note.a` and
`note-a`) use disambiguators `data-antn-note-a--1`, `data-antn-note-a--2`, each
with a `-key` companion holding the original key.

The serializer does **not** interpret annotation names (no hide/class/title
registry). Viewers choose CSS/JS against `data-antn-*`. Native `lang` on nodes
stays the existing ZipEHR language-carrier behaviour.

**Annotation round-trip:** `annotationsFromDataAntnAttrs()` in
`serialization/zipehr/template_annotations.ts` rebuilds the exact key/value map
from `data-antn-*` attrs (used in tests; html5 canonical deserialize still
strips them).

## View constraints (separate, unchanged for now)

| Attribute | Meaning |
|-----------|---------|
| `data-opt-visibility` | `hide` \| `show` \| `pass-through` from `<view>`, `rm_visibility`, experimental `a.hide_on_form`. |
| `data-opt-alias` | `rm_visibility.alias` when present. |

Not folded into `data-antn-*`.

## Quiet-structure CSS (example viewer)

Shipped overrides are **not** part of round-trip:

- `[data-antn-hide-on-form="true"]` — Ferro Clinergy fixture
- `[data-opt-visibility="hide"]` — view summary
- `[data-opt-visibility="pass-through"]` — `display: contents`; hide `.zs-structural-label`

## Serializer API

`Html5SerializeOptions`: `operationalTemplate`, `webTemplate`, `templateRenderLang`.

## Ferro / workbench

`thumb-pain-encounter.v2-coded.opt` uses annotation key `hide-on-form` on
Clinergy descriptor paths (→ `data-antn-hide-on-form` in html5).

## Parser

OPT XML: path annotations and `attachOptViewConstraints` in `opt_xml_parser.ts`.