# Hand-written code vs. generated stubs

The library ships two parallel sets of openEHR model classes:

| Location | Status |
|----------|--------|
| `base/`, `rm/`, `am/`, `lang/`, `term/` | Hand-written implementations — the source of truth for runtime behaviour |
| `generated/` | Stubs emitted from the openEHR BMM schemas — **never hand-edit** |

Everything outside `generated/` is safe to edit manually or with LLM
assistance; the generator never overwrites it.

## Repository layout

| Path | Role |
|------|------|
| `base/` | BASE model (`org.openehr.base.*`), plus `init_helpers.ts` and `temporal_polyfill.ts` |
| `rm/` | Reference Model (`org.openehr.rm.*`) |
| `am/` | Archetype Model (`org.openehr.am.*`); AOM utilities (flattening, cloning, path navigation) in `am/util/` |
| `lang/` | LANG / BMM model (`org.openehr.lang.*`) |
| `term/` | Terminology model plus the terminology, UCUM and property/unit services |
| `parser/` | ADL2, cADL, ODIN and template parsers (`parser/legacy/` for ADL 1.4 / OET / OPT XML) |
| `serialization/` | JSON, YAML, XML, Markdown, AsciiDoc, TypeScript, simplified (FLAT/STRUCTURED) and zipEHR formats |
| `validation/` | Archetype, template, interval, invariant and RM specification validators |
| `generation/` | RM instance, ADL, OPT XML and TypeScript generators |
| `meta/` | BMM-backed RM attribute introspection (`attributesFor`, `subtypesOf`, …) — see [../RM_ATTRIBUTES.md](../RM_ATTRIBUTES.md) |
| `spec/` | Optional BMM class/attribute **descriptions** plus specification HTML/Markdown URLs — see [../SPEC_DESCRIPTIONS.md](../SPEC_DESCRIPTIONS.md). Not on the root `mod.ts` barrel. |
| `mod.ts` | Public barrel; re-exports every area as a namespace |
| `openehr_*.ts` | Stable root re-exports for a single component |
| `generated/` | BMM stubs — do not hand-edit |

The model components are split by BMM package under each directory (see
[`../../tasks/bmm_package_map.json`](../../tasks/bmm_package_map.json) and
[`../../tasks/bmm_package_split.md`](../../tasks/bmm_package_split.md)).
`<component>/mod.ts` barrels re-export the full public API; `<component>/openehr_<component>.ts`
shims remain for older import paths.

## Import guidelines

- Inside the library, import the concrete module: `import * as rm from "../rm/openehr_rm.ts";`
- Do **not** import from the root re-export wrappers (`../openehr_rm.ts`) inside library code — they exist for consumers.
- Do **not** import from `generated/`.

## Version tracking

Each model module carries a header comment recording the BMM version it was
synced with, the date, and any known deviations from the specification:

```typescript
// Hand-written implementation based on BMM schema: rm v1.2.0
// Last synced: 2025-11-14
// Custom additions: Helper methods for common operations
```

## Updating to a new BMM version

Follow the workflow in [codegen-and-bmm.md](codegen-and-bmm.md). It preserves
hand-written implementations while pulling new stubs into `generated/`. Never
copy `generated/` over the hand-written modules — you will lose behaviour.

Regenerate RM attribute metadata with:

```bash
deno run --allow-read --allow-net --allow-write tasks/generate_rm_meta.ts
```
