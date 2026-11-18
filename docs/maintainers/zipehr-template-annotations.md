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

## Future-proofing (AM Release 2.3.0 review)

This ZIP emitter is a **viewer convenience**. Treat the attributes below as
**non-normative** unless and until openEHR standardises UI hints for templates.

### `data-opt-visibility` / OPT 1.4 `<view>` (not ADL2 / OPT2)

Values `hide`, `show`, and `pass-through` on `data-opt-visibility` can come from:

| Source | Future-proof? |
|--------|----------------|
| OPT 1.4 `<view><constraints>` items `pass_through` and `VisibleInView` | **No** — Ocean / EHRbase tool practice; ITS-XML Release 1.4 `Template.xsd` `T_VIEW` (ids not spec-defined). No ADL2 / AOM2 / OPT2 equivalent. |
| Annotation keys such as experimental `a.hide_on_form` / Ferro `hide-on-form` (→ `data-antn-*`) | **No** — community / vendor conventions, not ADL2 annotation groups. |
| ADL2 `rm_overlay.rm_visibility` `visibility` | **Yes (within scope)** — normative ADL2 §7.12 / §7.12.1; AOM2 §6.3.1–§6.3.3 `VISIBILITY_TYPE`. Applies to **non-archetyped RM attributes** on overlay paths; aimed at tools, not clinical semantics. |

`data-opt-alias` from OPT-only sources has the same limitation as `<view>`.

### `data-antn-*` (path annotations)

All path annotations are forwarded with a **lossy slug** (`data-antn-{slug}`).
That is a ZipEHR encoding choice, not an openEHR interchange format.

- ADL2 §7.14 defines only the **`documentation`** annotation group on paths.
  A proposed UI / technical group is tracked as [SPECPR-469](https://specifications.openehr.org/tickets/SPECPR-469) (open).
- **OPT2 §4.1** allows profiled operational templates to **strip annotations**;
  consumers must not rely on annotation keys surviving publication profiles.

### Normative mapping path (ADL2 templates)

When the serializer input is an **ADL2** operational template (or OPT carrying
the same `rm_overlay` / `annotations` parsed by the library):

1. Map `rm_overlay.rm_visibility.visibility` (`show` / `hide` / `hiding` / …) →
   `data-opt-visibility` (`show` / `hide`; `pass-through` only when explicitly
   encoded elsewhere, e.g. documentation / legacy `<view>`).
2. Map `rm_overlay.rm_visibility.alias` → `data-opt-alias`: the alias is an
   **at-code**; ehrtslib resolves it to **terminology text** via template /
   archetype `term_definitions` when possible (`generation/opt_view.ts`).

Do **not** treat OPT 1.4 `<view>` or arbitrary annotation keys as interchangeable
with ADL2 overlay visibility.

### Follow-up

- Prefer ADL2 `rm_visibility` (+ resolved alias) over OPT 1.4 `<view>` when both
  are present on the same path (precedence is implementation-defined today;
  tighten when OPT2 overlay rules land).
- Explicit `template` serializer option and annotation `RegExp` filter (see PR
  follow-ups).
- Demo: pass template metadata into `serializeToHtml5Variant`.