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

## HTML attributes

| Attribute | Meaning |
|-----------|---------|
| `data-opt-visibility` | `hide` \| `show` \| `pass-through` (vendor-neutral summary). |
| `data-opt-annotations` | Escaped JSON of **all** path annotation items for the chosen language. |
| `data-opt-{slug}` | One attribute per annotation key (`slug` = lowercase, non `[a-z0-9]` → `-`). |
| `data-opt-alias` | `rm_visibility.alias` when present. |

Visibility mapping (first match wins):

1. `view.pass_through === true` → `pass-through`
2. `view.pass_through === false` → `hide` (fixture/inverse; Ocean only documents `true`)
3. `rm_overlay.rm_visibility` → `hide` / `show`
4. `VisibleInView` item present → `show`
5. Experimental `a.hide_on_form` / `hide_on_form`: `presentation` or `true` → `hide`; `input` → `show`

Metadata is attached only on nodes matched by Web Template `aqlPath` (not copied
to descendants; CSS cascades where applicable).

## Quiet-structure CSS

- `data-opt-visibility="hide"` — `display: none`
- `data-opt-visibility="pass-through"` — `display: contents`; hide `.zs-structural-label` children
- `data-opt-visibility="show"` — no default quiet override

## Serializer API

`Html5SerializeOptions`:

- `operationalTemplate` — parsed OPT (view constraints, rm_overlay, annotations)
- `webTemplate` — index nodes by `aqlPath`
- `templateRenderLang` — annotation language preference (`render` → `""` → original)

## Ferro / workbench

Add Ocean-style **view** constraints on helper clusters (e.g. Clinergy
descriptor). `thumb-pain-encounter.v2-coded.opt` uses `pass_through` `false` on
those paths (mapped to `hide` in html5). Prefer production `pass_through true`
on structural wrappers and `rm_visibility` / experimental `a.hide_on_form` where
tools emit them.

## Parser

OPT XML: `parser/legacy/opt_xml_parser.ts` calls `attachOptViewConstraints`.
ADL2 `rm_overlay` is already parsed via `applyRmOverlayOdin`.