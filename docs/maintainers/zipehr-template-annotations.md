# ZipEHR HTML5: template UI metadata

ZipEHR html5 can forward **template** metadata onto composition markup. The
HTML5 deserializer ignores `data-antn-*`, `data-opt-*`, and `data-rm-*`
(`isZipEhrTemplatePresentationHtmlAttr`); canonical JSON round-trip stays
lossless.

**Three separate namespaces** (never mix sources):

| Namespace | Source |
|-----------|--------|
| `data-antn-{slug}` | **All** template / archetype path annotations (including Ferro `hide-on-form`, `L10n.en`, …) |
| `data-opt-visibility`, `data-opt-alias` | **OPT 1.4 `<view>` only** (`pass_through`, `VisibleInView`) — not future-proof |
| `data-rm-visibility`, `data-rm-alias` | **ADL2** `rm_overlay.rm_visibility` only (`show`/`hide`; alias at-code → term text) |

Annotation keys are **not** promoted to `data-opt-*`. `hide-on-form=true` stays
`data-antn-hide-on-form="true"` unless the OPT also has a `<view>` constraint on
that path.

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

## Quiet-structure CSS

- `[data-antn-hide-on-form="true"]` — Ferro Clinergy fixture
- `[data-opt-visibility="hide"]`, `[data-rm-visibility="hide"]`
- `[data-opt-visibility="pass-through"]` — `display: contents`; hide
  `.zs-structural-label`

## Future-proofing (AM Release 2.3.0)

OPT 1.4 `<view>` → `data-opt-*` only (no ADL2/OPT2 equivalent). ADL2
`rm_visibility` → `data-rm-*` only. Path annotations → `data-antn-*` only;
ADL2 §7.14 `documentation` group; [SPECPR-469](https://specifications.openehr.org/tickets/SPECPR-469) open; OPT2 may strip annotations.

## Parser

OPT XML: `opt_xml_parser.ts` — path annotations + `attachOptViewConstraints`.