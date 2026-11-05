# Optional serializer subpaths: simplified formats and ZipEHR

Status: proposed (investigation outcome for [#276](https://github.com/ErikSundvall/ehrtslib/issues/276); not implemented here).

Related: [ADR 0012](0012-cb-add-on-packages-and-patch-formats.md) (Contribution Builder simplified-formats **add-on**),
[ADR 0014](0014-cb-htmx-add-on-and-editable-zipehr-html5.md) (Contribution Builder htmx / editable ZipEHR HTML5 **add-on**),
[ADR 0002](0002-cb-core-model-and-scope.md) (CB core is canonical RM JSON).

## Context

`serialization/simplified/` (Web Template, FLAT, STRUCTURED) and
`serialization/zipehr/` are each on the order of half the rest of
`serialization/`. Today `serialization/mod.ts` statically re-exports both,
so `import { serialization } from "ehrtslib/mod.ts"` loads the full codec
graphs even when the caller only needs canonical JSON, ADL, or validation.

Maintainer direction (issue #276, 2026-11-02): Contribution Builder **core**
should run on ADL2/AOM2 + RM; FLAT/STRUCTURED and similar formats are
optional (like the planned GraphQL add-on). Web Template belongs in the **same
optional package** as FLAT/STRUCTURED, not in core.

Before 1.0, old import paths must not be kept as TypeScript aliases; callers
update in the same change ([`api-changes.md`](../maintainers/api-changes.md)).

## Decision (recommended)

### 1. Default serialization barrel stays canonical + general-purpose

**Keep on `serialization/mod.ts` (and therefore on `mod.ts` → `serialization`):**

- JSON (canonical and configurable), YAML, Markdown, AsciiDoc, XML
- `serialization/common/` (type registry, errors, JSON source index)

**Remove static re-exports from `serialization/mod.ts`:**

- Everything under `serialization/simplified/` (Web Template + FLAT + STRUCTURED)
- Everything under `serialization/zipehr/`

Published openEHR artefact loading (ADL, OPT, OET, compositions, canonical
JSON, BMM, archetype rules) remains on the default barrel via `parser/`,
`validation/`, and canonical JSON/XML serializers.

### 2. New Deno subpath exports (same pattern as #201)

Add to root `deno.json` `exports`:

| Export | Entry |
| --- | --- |
| `ehrtslib/serialization-simplified` | `serialization/simplified/mod.ts` |
| `ehrtslib/serialization-zipehr` | `serialization/zipehr/mod.ts` |

No compatibility re-export on the default `serialization` namespace (breaking
before 1.0 is acceptable with demo/TAAAT/api-changes updates).

### 3. Web Template travels with simplified formats

Web Template build/parse/`webTemplateToOpt` stays in `serialization/simplified/`
and is loaded only via `ehrtslib/serialization-simplified`. It is **not** split
into core: FLAT/STRUCTURED codecs and Web Template share the same tree and
demo/generation usage pattern.

### 4. Stop non-serializer core modules from importing simplified codecs

| Edge | Recommendation |
| --- | --- |
| `generation/term_codes.ts` → `serialization/simplified/normalize.ts` | Import `nodeIdToAtCode` from `generation/id_to_at_code.ts` instead (`normalize.ts` already re-exports that symbol). |
| `generation/opt_xml_serializer.ts` → `WebTemplate` type | Keep `import type` from `serialization/simplified/types.ts` **or** move the type to a tiny shared module under `generation/` if type-checking still pulls unwanted runtime; prefer type-only import first. |
| `contribution_builder/contribution_build.ts` → `buildWebTemplate`, FLAT/STRUCTURED deserialisers | **Remove from CB core.** Canonical RM JSON import stays on core ([ADR 0002](0002-cb-core-model-and-scope.md)). FLAT/STRUCTURED draft import and patch belong on the [ADR 0012](0012-cb-add-on-packages-and-patch-formats.md) simplified-formats **add-on**, which depends on `ehrtslib/serialization-simplified` + `ehrtslib/contribution-builder`. Do not satisfy this with a long-lived dynamic `import()` inside core (bundles would still ship the codecs for `contribution.min.js`). |

After (4), `relativeImportClosure` from `contribution_builder/mod.ts` should
include **zero** `serialization/simplified/` files (today: 18 files via
`contribution_build.ts` and `term_codes.ts`).

### 5. Runtime bundles (`scripts/library_package.ts`)

| Bundle | Change |
| --- | --- |
| `mod.ts` (core) | Smaller: no simplified/ZipEHR via serialization barrel or fixed generation/CB edges. |
| `mod_full.ts` | Same as today structurally; core portion shrinks. |
| `contribution_builder/mod.ts` | Smaller once CB core drops simplified imports. |
| `serialization/mod.ts` | **Slim entry:** canonical + YAML/Markdown/AsciiDoc/XML/common only. |
| **New** | `serialization/simplified/mod.ts` → `ehrtslib-<version>-serialization-simplified.min.js` |
| **New** | `serialization/zipehr/mod.ts` → `ehrtslib-<version>-serialization-zipehr.min.js` |

ADR 0012 / 0014 **add-on** bundles (`cb-simplified`, `cb-htmx`, …) are separate
release assets that **import** these serializer subpaths; they are not the same
as the serializer-only minified files above.

### 6. Two layers: serializer subpath vs Contribution Builder add-on

| Layer | What it is | Issue / ADR |
| --- | --- | --- |
| **Serializer optional load** | Where FLAT/STRUCTURED/ZipEHR **code** sits in the module graph | This ADR / #276 |
| **CB access-style add-on** | How apps **talk to** `ContributionBuild` in that format (import draft, patch, HTML forms) | ADR 0012 (simplified, XML, …), ADR 0014 (htmx + editable ZipEHR HTML5) |

Implement serializer subpaths first (or in the same release PR as CB core
decoupling). ADR 0012 simplified add-on **depends on**
`ehrtslib/serialization-simplified`; ADR 0014 htmx add-on **depends on**
`ehrtslib/serialization-zipehr` (HTML5 serialiser), not on bundling copies.

## Consequences

- Callers that need FLAT/STRUCTURED or ZipEHR add one explicit import; tree
  shaking and Deno subpaths match actual use.
- Demo (`examples/demo-app/src/converter.ts`) already imports
  `serialization/simplified/mod.ts` and `serialization/zipehr/mod.ts` directly;
  after the split it should use `ehrtslib/serialization-simplified` /
  `ehrtslib/serialization-zipehr` (or unchanged relative paths) and must **not**
  rely on `serialization.*` barrel exports for those formats.
- Containment does **not** require rewriting dialect logic; only barrel edges,
  export map, bundle entries, and the three cross-module imports above.

## Alternatives considered

- **Web Template in core, FLAT/STRUCTURED optional.** Rejected per maintainer:
  ADL2/AOM2 + RM is core; Web Template is a simplified-formats artefact.
- **Dynamic `import()` in `contribution_build.ts` for FLAT/STRUCTURED.**
  Rejected as the long-term shape: keeps simplified codecs on the
  contribution-only bundle and blurs core vs add-on; ADR 0012 add-on is the
  right home ([ADR 0002](0002-cb-core-model-and-scope.md)).
- **Single combined optional package for simplified + ZipEHR.** Rejected:
  ZipEHR is independent (~8k lines, separate consumers); two subpaths match
  two add-on families (ADR 0012 simplified vs ADR 0014 ZipEHR HTML5).

## Open questions (narrowing)

1. Exact export names: `serialization-simplified` / `serialization-zipehr` vs
   `serialization/simplified` nested export keys (either works; match #201 style).
2. Whether `OptXmlSerializer` `l10nFromWebTemplate` stays type-only from
   simplified or moves to an optional generation helper used only by demo/tests.
