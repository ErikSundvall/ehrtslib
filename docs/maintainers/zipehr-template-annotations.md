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
| Path annotations on constraints (`annotations { … }`) | `data-antn-{slug}` | ADL2 standardises only a `documentation` group; no standard UI-hint vocabulary yet ([SPECPR-469](https://specifications.openehr.org/tickets/SPECPR-469) proposes a `technical` group, open) | Opaque hints (`hide-on-form`, `L10n.*`, …); filter keys you trust |
| OPT 1.4 `<view>` items (`pass_through`, `VisibleInView`, …) | `data-opt-visibility`, `data-opt-alias` | Tool conventions (Ocean Template Designer) in the OPT 1.4 XML schema — not in normative spec prose; no ADL2/OPT2 equivalent | Import-only from OPT 1.4 XML |
| ADL2 `rm_overlay.rm_visibility` (AOM2 RM overlay) | `data-rm-visibility`, `data-rm-alias` | Normative ADL2/AOM2, but narrow scope (see below) | Authoring-tool visibility hints, not end-user form rules |

**`data-antn-*`** comes from whatever string keys authors attach at a template
path. They are useful for rendering but are not validated as RM. Use
`templateAnnotationFilter` to emit only keys you rely on. OPT2 can let profiled
OPTs strip annotations, so hints may disappear on conversion — do not treat them
as permanent RM facts.

**`data-opt-*`** is read only from OPT 1.4 XML `<view><constraints path="…">`.
Item ids such as `pass_through` and `VisibleInView` are defined in the legacy
OPT schema, not as first-class AM semantics. New ADL2/OPT2 pipelines should not
rely on them; ehrtslib emits them when given an OPT 1.4 `template`. Reference:
[Operational Template (OPT 1.4)](https://specifications.openehr.org/releases/AM/latest/docs/openehr_template/op_template.html).

**`data-rm-*`** mirrors ADL2 `rm_overlay` visibility and alias on **non-archetyped
RM attributes** only; archetyped and constrained nodes are visible by default in
the overlay model. `hide` / `show` there **indicates to a tool** (modelling /
authoring), not an end-user form engine — and it does **not** hide an archetyped
node the way a path annotation such as `hide-on-form` can. Reference:
[AOM2 — RM overlay](https://specifications.openehr.org/releases/AM/latest/AOM2.html).

## Parser

OPT XML: `opt_xml_parser.ts` — path annotations + `attachOptViewConstraints`.