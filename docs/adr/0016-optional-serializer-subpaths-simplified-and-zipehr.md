# Optional serializer subpaths: simplified formats and ZipEHR

Status: accepted (maintainer, 2026-11-05, on [#276](https://github.com/ErikSundvall/ehrtslib/issues/276)).
Not implemented here. A follow-up change removes the re-exports and the
Contribution Builder core imports. This ADR does not move or rewrite codec code.

Related: [ADR 0012](0012-cb-add-on-packages-and-patch-formats.md) (Contribution Builder simplified-formats **add-on**),
[ADR 0014](0014-cb-htmx-add-on-and-editable-zipehr-html5.md) (Contribution Builder htmx / editable ZipEHR HTML5 **add-on**),
[ADR 0002](0002-cb-core-model-and-scope.md) (Contribution Builder core is canonical RM JSON).

## Context

`serialization/simplified/` (Web Template, FLAT, STRUCTURED; 24 TypeScript
files, about 9.3k lines) and `serialization/zipehr/` (21 TypeScript files,
about 8.4k lines, of which 20 are on the runtime graph) are each about as
large as the rest of `serialization/` (about 8.2k lines).
`serialization/mod.ts` statically re-exports both, and `mod.ts` does
`export * as serialization from "./serialization/mod.ts"`. A static
re-export is not a lazy load.

Maintainer direction ([#276](https://github.com/ErikSundvall/ehrtslib/issues/276),
2026-11-02, accepted 2026-11-05): Contribution Builder core runs on ADL2/AOM2
+ RM. FLAT, STRUCTURED, and similar formats are optional, in the same way
the planned GraphQL add-on is optional. Web Template belongs in the same
optional package as FLAT/STRUCTURED, not in core.

Before 1.0, do not keep a TypeScript alias so an old import path still
compiles. Drop the old name in the same change, update Demo and TAAAT, and
record it in [`api-changes.md`](../maintainers/api-changes.md).

### Import graph (measured)

Static `import` / `export … from` only, via `relativeImportClosure` in
`scripts/library_package.ts`. `import type` is counted by that walker even
when a bundler would erase it.

| Entry | Closure | `serialization/simplified/` | `serialization/zipehr/` |
| --- | ---: | ---: | ---: |
| `mod.ts` | 269 | 24 | 20 |
| `mod_full.ts` | 283 | 24 | 20 |
| `contribution_builder/mod.ts` | 200 | 18 | 0 |
| `serialization/mod.ts` | 212 | 24 | 20 |
| `generation/mod.ts` | 110 | 2 | 0 |
| `parser/mod.ts` | 119 | 1 | 0 |
| `validation/mod.ts` | 88 | 1 | 0 |

Edges from outside those trees:

```
mod.ts
└── export * as serialization → serialization/mod.ts
        ├── export … from './simplified/mod.ts'     SIMPLIFIED (whole tree)
        └── export … from './zipehr/mod.ts'         ZIPEHR (whole tree)
└── export * as generation → generation/mod.ts
        ├── term_codes.ts → simplified/normalize.ts          SIMPLIFIED (value)
        └── opt_xml_serializer.ts → simplified/types.ts      SIMPLIFIED (import type)

parser/mod.ts and validation/mod.ts
└── (no direct edge) → generation/term_codes.ts → simplified/normalize.ts

contribution_builder/mod.ts
└── contribution_build.ts
        ├── buildWebTemplate          ← simplified/web_template_builder.ts
        ├── deserializeFromFlat       ← simplified/flat_deserializer.ts
        ├── deserializeFromStructured ← simplified/structured_deserializer.ts
        └── FlatPayload               ← simplified/types.ts (import type)
└── (transitive) term_codes.ts → simplified/normalize.ts
```

No ZipEHR edge from Contribution Builder, parser, validation, or generation.
`serialization/zipehr/gen_symbol_table.ts` is a dev script (`deno task
generate:symbol-table`); it is the one ZipEHR TypeScript file not in the
20-file closure.

`serialization/xml/` and `serialization/typescript/` are not re-exported by
`serialization/mod.ts` and are not in the `mod.ts` closure. Callers already
import them by path (the demo imports `serialization/xml/mod.ts` directly).

Stopping the two barrel re-exports, and leaving the generation edges in
place, drops 43 modules from the `mod.ts` closure: 22 simplified files, all
20 ZipEHR files, and `generation/adl14_code_map_cache.ts` (only reached from
`web_template_builder.ts` on this graph). Two simplified files stay:
`normalize.ts` (value import from `term_codes.ts`; parser and validation
reach it the same way) and `types.ts` (`import type` from
`opt_xml_serializer.ts`; the file has no imports of its own).

Contribution Builder reaches 18 of the 24 simplified files. The six it does
not reach are `simplified/mod.ts`, `flat_validator.ts`,
`structured_serializer.ts`, `typed_rm.ts`, `web_template_parser.ts`, and
`web_template_to_opt.ts`. Web Template parse and `webTemplateToOpt` are on
the simplified barrel, not on a separate core path.

## Decision

### 1. Default serialization barrel stays canonical JSON and the general-purpose formats it already re-exports

Keep on `serialization/mod.ts`, and therefore on `mod.ts` → `serialization`:

- JSON (canonical and configurable), YAML
- `serialization/common/`

Markdown and AsciiDoc are **not** on the default barrel (see #284): optional subpaths
`ehrtslib/serialization-markdown` and `ehrtslib/serialization-asciidoc`, with
`ehrtslib-<version>-serialization-markdown.min.js` and
`ehrtslib-<version>-serialization-asciidoc.min.js` runtime bundles.

Remove the static re-exports of `serialization/simplified/` and
`serialization/zipehr/` from `serialization/mod.ts`.

Leave `serialization/xml/` and `serialization/typescript/` as they are:
direct modules, not part of this split, and not added to the default barrel.
Published openEHR artefact loading (ADL, OPT, OET, compositions, canonical
JSON, BMM, archetype rules) stays on the default barrel via `parser/`,
`validation/`, and canonical JSON.

### 2. New Deno subpath exports (same pattern as #201)

Add to root `deno.json` `exports`:

| Export | Entry |
| --- | --- |
| `ehrtslib/serialization-simplified` | `serialization/simplified/mod.ts` |
| `ehrtslib/serialization-zipehr` | `serialization/zipehr/mod.ts` |

No compatibility re-export on the default `serialization` namespace.

### 3. Web Template travels with simplified formats

Web Template build, parse, and `webTemplateToOpt` stay in
`serialization/simplified/` and load only through
`ehrtslib/serialization-simplified`. They are not split into core.
Callers that only need Web Template still take that optional import.

### 4. Contribution Builder core does not import simplified codecs

| Edge | What to do |
| --- | --- |
| `generation/term_codes.ts` → `serialization/simplified/normalize.ts` | Import `nodeIdToAtCode` from `generation/id_to_at_code.ts`. `normalize.ts` already re-exports that function from there. This also drops `normalize.ts` from parser and validation. |
| `generation/opt_xml_serializer.ts` → `WebTemplate` | Keep `import type` from `serialization/simplified/types.ts`. That file has no further imports, so it does not pull FLAT/STRUCTURED codecs. Move the type only if a measured bundle still contains `types.ts` after the type import is erased. |
| `contribution_builder/contribution_build.ts` → `buildWebTemplate`, `deserializeFromFlat`, `deserializeFromStructured` | Remove from Contribution Builder core. `importDocument` on core accepts canonical RM JSON only ([ADR 0002](0002-cb-core-model-and-scope.md)). FLAT/STRUCTURED draft create, read, and patch belong on the [ADR 0012](0012-cb-add-on-packages-and-patch-formats.md) simplified-formats add-on, which depends on `ehrtslib/serialization-simplified` and `ehrtslib/contribution-builder`. |

Do not leave a dynamic `import()` inside `contribution_build.ts`. The
contribution runtime bundle is built from `contribution_builder/mod.ts`, so
a dynamic import there still ships the codecs and keeps format knowledge in
core.

`ImportOperation.document` is already canonical RM JSON. Replay does not
re-parse FLAT or STRUCTURED. When the write path is narrowed, still accept
stored log entries whose `format` is `flat` or `structured`: the stored
`document` is what replay applies. Do not add a TypeScript alias for the
old `importDocument` union.

After this, `relativeImportClosure` from `contribution_builder/mod.ts`
includes no `serialization/simplified/` files (18 today).

`generation/adl14_code_map_cache.ts` stays. Contribution Builder core
imports it for ADL 1.4 down-conversion. It leaves the `mod.ts` closure only
because the Web Template builder is the sole `mod.ts` path to it today.

### 5. Runtime bundles (`scripts/library_package.ts`)

| Bundle | Change |
| --- | --- |
| `mod.ts` (`ehrtslib-<version>-core.min.js`) | Drops the 22 simplified codec files and all 20 ZipEHR files once the barrel re-exports go. Drops `normalize.ts` once `term_codes.ts` is retargeted. |
| `mod_full.ts` | Same barrel shrink. Simplified codecs leave the full bundle only when Contribution Builder core drops its imports (section 4). |
| `contribution_builder/mod.ts` (`-contribution.min.js`) | Drops the 18 simplified files when core no longer imports them. |
| `serialization/mod.ts` (`-serialization.min.js`) | Slim entry: JSON, YAML, and `common/` only. |
| New | `serialization/markdown/mod.ts` → `ehrtslib-<version>-serialization-markdown.min.js` |
| New | `serialization/asciidoc/mod.ts` → `ehrtslib-<version>-serialization-asciidoc.min.js` |
| New | `serialization/simplified/mod.ts` → `ehrtslib-<version>-serialization-simplified.min.js` |
| New | `serialization/zipehr/mod.ts` → `ehrtslib-<version>-serialization-zipehr.min.js` |

[ADR 0012](0012-cb-add-on-packages-and-patch-formats.md) `cb-simplified` and
[ADR 0014](0014-cb-htmx-add-on-and-editable-zipehr-html5.md) `cb-htmx` stay
separate Contribution Builder add-on assets. They import the serializer
subpaths. They are not the serializer bundles above.

### 6. Two layers

| Layer | What it is | Where |
| --- | --- | --- |
| Serializer optional load | Where FLAT, STRUCTURED, Web Template, and ZipEHR **code** sits in the module graph | This ADR / #276 |
| Contribution Builder access-style add-on | How an app **talks to** a Contribution Builder build in that format (import a draft, patch, HTML forms) | ADR 0012 (simplified formats, canonical XML, …), ADR 0014 (htmx and editable ZipEHR HTML5) |

One package is not enough for both layers. Implement the serializer
subpaths in the same change as the Contribution Builder core decoupling, or
the subpaths first. The ADR 0012 simplified-formats add-on depends on
`ehrtslib/serialization-simplified`. The ADR 0014 htmx add-on depends on
`ehrtslib/serialization-zipehr` (the HTML5 serialiser). Neither add-on
copies those codecs into itself.

Canonical XML in ADR 0012 is an access style over `serialization/xml/`,
which is already outside the default barrel. It is not part of the
simplified or ZipEHR subpath.

### 7. Demo and TAAAT

`examples/demo-app/src/converter.ts` already imports
`serialization/simplified/mod.ts` and `serialization/zipehr/mod.ts`
directly. `opt-html5-preview.ts` imports ZipEHR hydrate directly. Neither
imports `serialization/mod.ts`. Those relative imports stay valid because
this decision does not move files. The demo must not start using
`serialization.serializeToFlat` (or the ZipEHR names) from the default
barrel.

`examples/taaat-app` does not import `serialization/` today. The
implementation change still checks it, per `api-changes.md`, and records
the removed barrel names there. External callers of
`serialization.serializeToFlat`, `serialization.buildWebTemplate`,
`serialization.serializeToJZipehr`, and the other names currently
re-exported from `serialization/mod.ts` switch to the new subpaths. No
alias.

## Consequences

- Callers that need FLAT, STRUCTURED, Web Template, or ZipEHR add one
  explicit import.
- Containment does not require a dialect rewrite. The seams to edit are
  the `serialization/mod.ts` re-exports, `deno.json` `exports`, the two new
  rows in `libraryAssetNames`, `generation/term_codes.ts`, and
  `ContributionBuild.importDocument` / `importedCanonical`.
- The ADR 0012 add-on is the only Contribution Builder entry for simplified
  document import and patch.

## Alternatives considered

- **Web Template in core, FLAT/STRUCTURED optional.** Rejected. ADL2/AOM2 +
  RM is core. Web Template is a simplified-formats artefact and shares the
  simplified tree.
- **Dynamic `import()` inside `contribution_build.ts`.** Rejected. It keeps
  the codecs on the contribution bundle and leaves format handling in core.
  The ADR 0012 add-on is the home for that, as ADR 0002 already treats
  simplified formats as adapters.
- **One optional package for simplified formats and ZipEHR.** Rejected.
  ZipEHR has no edge into the simplified tree (closure of
  `serialization/zipehr/mod.ts` includes 0 simplified files, and the
  simplified closure includes 0 ZipEHR files). Two subpaths match the two
  add-on families.
- **Compatibility re-exports on `serialization/mod.ts`.** Rejected before
  1.0. Update callers in the same change.

## Narrowing still available

These do not need another graph pass:

1. Export key spelling. Accepted spelling matches #201:
   `serialization-simplified` and `serialization-zipehr`. A nested key such
   as `serialization/simplified` is the alternative.
2. Whether `OptXmlSerializer`'s `l10nFromWebTemplate` stays a type-only
   import or moves behind an optional generation helper. Default: keep the
   type-only import.
