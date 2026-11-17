# ZipEHR HTML5 template annotations

ZipEHR html5 can forward **template** UI annotations onto composition markup as
`data-zs-annot-{key}` attributes. They are presentation hints only: the HTML5
deserializer ignores them, so canonical JSON round-trip stays lossless.

## Sources

| Source | Typical keys | Notes |
|--------|--------------|--------|
| **OET overlay** (`<Rule … hide_on_form="true"/>`) | `hide_on_form` | UI metadata; not stored on the RM composition. Export to OPT path annotations or Web Template `node.annotations` for ZipEHR to see them. |
| **OPT XML** (`<annotations path="…"><items id="hide-on-form">true</items>`) | `hide-on-form`, `L10n.*`, … | Parsed into `RESOURCE_ANNOTATIONS`. `L10n.*` is **not** forwarded (handled as i18n). |
| **Web Template** (`node.annotations`) | Same item ids as OPT | `buildWebTemplate` copies OPT path items onto nodes. |
| **Archetype Designer / Better** | `hide-on-form`, `hide_on_form`, custom `a.*` keys | De-facto; no single normative registry. hide-on-form hides structural/helper nodes in forms and read-only views. |

## HTML attribute mapping

- Prefix: `data-zs-annot-`
- Key normalisation: `a.` stripped; `_` → `-`; lowercased (e.g. `hide_on_form` → `data-zs-annot-hide-on-form`).
- Value `true` is emitted as a boolean attribute (no value).
- Denylist: `L10n.*`, `synthetic_node_id`.

## Serializer API

`Html5SerializeOptions`:

- `webTemplate` — index annotations by `aqlPath` via `resolveAllValuesAtPath`.
- `pathAnnotations` — `OptPathAnnotationMap` from `flattenOptPathAnnotations(opt)` (optional without Web Template if you only use path map + manual indexing later).

Quiet-structure CSS (`zipehr-html5-quiet-structure.css`) hides clusters marked
`hide-on-form` / `hide_on_form`, e.g. Clinergy descriptor helper clusters.

## Workbench / Ferro template

Do **not** hard-code Clinergy ids in ehrtslib. On the operational template,
add path annotations for each `clinergy_descriptor` occurrence, for example:

```xml
<annotations path="/content[…]/items[openEHR-EHR-CLUSTER.clinergy_descriptor.v0]">
  <items id="hide-on-form">true</items>
</annotations>
```

(or equivalent Web Template `annotations` when generating WT). Regenerate the Web
Template when exporting from OPT so html5 serialization can attach attributes.

## References

- OET `hide_on_form`: `.cursor/skills/openehr-assistant/reference/oet-syntax-reference.md`
- OPT L10n / path annotations: `docs/ADL_SUPPORT.md` (L10n annotations section)
- Web Template `node.annotations`: openehr://guides/templates/web-template