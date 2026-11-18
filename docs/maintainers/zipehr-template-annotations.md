# ZipEHR HTML5: template UI metadata

ZipEHR html5 can forward **template** metadata onto composition markup. The
HTML5 deserializer ignores `data-antn-*`, `data-opt-*`, and `data-rm-*`
(`isZipEhrTemplatePresentationHtmlAttr`); canonical JSON round-trip stays
lossless.

**Three separate namespaces** (never mix sources):

| Namespace | Source |
|-----------|--------|
| `data-antn-{slug}` | Path annotations from the template or archetype (any key, e.g. `hide-on-form`, `L10n.en`) |
| `data-opt-visibility`, `data-opt-alias` | OPT 1.4 `<view>` only (`pass_through`, `VisibleInView`) |
| `data-rm-visibility`, `data-rm-alias` | ADL2 `rm_overlay.rm_visibility` (`show` / `hide`; optional alias at-code → term text) |

Annotation keys are **not** promoted to `data-opt-*`. A path annotation
`hide-on-form=true` becomes `data-antn-hide-on-form="true"` unless the OPT
also defines a `<view>` constraint on that same path (that would add `data-opt-*`
separately).

## Serializer API

```ts
await serializeToHtml5Variant(composition, "zipehr.html5.short", {
  layout: "linesaving",
  template: optXmlString, // or { operationalTemplate, webTemplate? }
  templateAnnotationFilter: /^L10n/, // optional RegExp | RegExp[]
  templateRenderLang: "en",
  archetypeRepository, // when template input is OET XML
});
```

- **`template`**: OPT 1.4 XML, ADL 1.4/ADL2 template text, Web Template JSON
  (paired OPT only — WT JSON alone yields no presentation), or
  `{ operationalTemplate, webTemplate?, renderLang?, pathAnnotations? }`.
- **No `template`** ⇒ no presentation attributes.
- **`templateAnnotationFilter`**: applied to **original** annotation keys before
  `data-antn-*` emission; `data-opt-*` / `data-rm-*` are unaffected.

<a id="template-annotation-filter-regexp"></a>

### `templateAnnotationFilter` (RegExp)

Include-only filter on **original** annotation keys before emitting
`data-antn-*`. Multiple patterns are OR’d. Unmatched keys are omitted.

When two included keys normalize to the same slug, the lexicographically first
key wins. The serializer emits `console.warn` with both keys, the resulting
`data-antn-*` name, the node path, and which key was dropped, and inserts an
HTML comment immediately before the affected element (ignored by ZipEHR
deserialize; canonical RM unchanged). Narrow keys with `templateAnnotationFilter`
to avoid silent data loss.

Exports: `serialization/zipehr/mod.ts` — `resolveZipEhrTemplatePresentation`,
`ZipEhrTemplatePresentationSource`, `isZipEhrTemplatePresentationHtmlAttr`, …

## `data-antn-*`

Slug rule: lowercase; chars outside `[a-z0-9-]` → `-`; collapse runs; trim.
**Colliding slugs:** sorted keys, **first wins** (no `-key` companions, no
`--N` suffixes). See [templateAnnotationFilter](#template-annotation-filter-regexp)
for warnings and HTML comments.

Example cluster with two annotations:

```html
<o-cl n="openEHR-EHR-CLUSTER.ui_hint.v0" a rm="1.1.0"
  data-antn-hide-on-form="true" data-antn-l10n-en="Descriptor">
```

## Quiet-structure CSS

`serialization/zipehr/css/zipehr-html5-quiet-structure.css` (and the demo copy)
can hide nodes marked for UI without changing RM data:

- `[data-antn-hide-on-form="true"]` — common tool convention for “do not show on
  the data-entry form” (stored as a path annotation, not as RM)
- `[data-opt-visibility="hide"]`, `[data-rm-visibility="hide"]`
- `[data-opt-visibility="pass-through"]` — `display: contents`; hide
  `.zs-structural-label`

Repository tests use real templates and compositions under `test_data/fixtures/`;
those paths are kept for regression cost, not as API examples.

## Future-proofing

ZipEHR copies template **authoring** hints onto HTML for previews and CSS. None
of these attributes are part of canonical openEHR RM; html5→canonical strips
them so stored data stays standard.

| Source in authoring | On HTML | In openEHR standards | How to treat in apps |
|---------------------|---------|----------------------|----------------------|
| Path annotations on constraints (`annotations { … }`) | `data-antn-{slug}` | Informal / vendor keys; AM is grouping documentation-style metadata in ADL2 | Opaque UI hints; filter or namespace keys you trust |
| OPT 1.4 `<view>` items (`pass_through`, `VisibleInView`, …) | `data-opt-visibility`, `data-opt-alias` | Legacy OPT XML (Ocean / EHRbase era) | Import-only; no ADL2 equivalent |
| ADL2 `rm_overlay.rm_visibility` | `data-rm-visibility`, `data-rm-alias` | Normative ADL2 template overlay | Stable for ADL2-authored templates |

**`data-antn-*`** comes from whatever string keys authors attach at a template
path (localization `L10n.*`, form layout `hide-on-form`, internal codes, etc.).
They are useful for rendering but are not validated as RM. Prefer explicit
`templateAnnotationFilter` if you only want a subset. Evolution of first-class
“documentation” metadata in AM is tracked in the community process (e.g.
[SPECPR-469](https://specifications.openehr.org/tickets/SPECPR-469)); until
that settles, treat `data-antn-*` as presentation-only.

**`data-opt-*`** is read only from OPT 1.4 XML `<view><constraints path="…">`.
It reflected early operational-template UI tooling. New ADL2/OPT2 pipelines should
not rely on it; ehrtslib maps it for compatibility when you serialize with an
OPT 1.4 `template`. Reference: [Operational Template (OPT 1.4)](https://specifications.openehr.org/releases/AM/latest/docs/openehr_template/op_template.html).

**`data-rm-*`** mirrors ADL2 template `rm_overlay` visibility and alias overlays
on RM nodes. That is the standards-backed place for “show/hide this RM slot in
this template.” Reference: [ADL 2 — templates and overlays](https://specifications.openehr.org/releases/AM/latest/docs/ADL2/ADL2.html).

## Parser

OPT XML: `opt_xml_parser.ts` — path annotations + `attachOptViewConstraints`.