# RM attribute introspection (`enhanced/meta`)

BMM-backed **Reference Model** schema metadata for editors, validators, and
codegen. Complements `TypeRegistry` (construct / deserialize) with answers to:

- What attributes does RM type `T` have?
- What is each attribute’s type name and multiplicity?
- Is it mandatory?
- Which types are subtypes of `DATA_VALUE` (or another ancestor)?

## Quick use

```typescript
import {
  attributesFor,
  isDataValueType,
  subtypesOf,
} from "./enhanced/meta/mod.ts";

const attrs = attributesFor("DV_QUANTITY");
const visible = attrs.filter((a) => a.mandatory);
const more = attrs.filter((a) => !a.mandatory);

const valueCandidates = subtypesOf("DATA_VALUE"); // concrete DV_* leaves
isDataValueType("DV_CODED_TEXT"); // true
```

API: `attributesFor`, `ownAttributesFor`, `ancestorsOf`, `isSubtypeOf`,
`isDataValueType`, `subtypesOf`, `hasRmType`, `isAbstractType`.

`ancestorsOf` returns most-specific first, root (`Any`) last.

## Regenerate from BMM

Uses the same URLs as class codegen (`tasks/bmm_versions.json` for
`openehr_base` + `openehr_rm`):

```bash
deno run --allow-read --allow-net --allow-write tasks/generate_rm_meta.ts
```

Writes:

- `generated/rm_attribute_meta.ts` (baseline next to class stubs)
- `enhanced/meta/rm_attribute_meta.generated.ts` (imported by the facade)

Do not hand-edit the generated files.

## RM meta vs AM / OPT tooling

| Layer | Module(s) | Answers |
| ----- | --------- | ------- |
| **RM (this API)** | `enhanced/meta` | What the Reference Model *allows* for type `T` (BMM attributes, multiplicities, inheritance) |
| **AM / OPT** | `enhanced/am/*`, web-template builder, clinical definition trees | What a *specific archetype or template* constrains (paths, occurrences, value sets, exclusions) |

They are complementary:

- RM meta is the encyclopedia of the openEHR class model (e.g. `ELEMENT.value` is
  optional `DATA_VALUE`).
- AM tooling walks `C_ATTRIBUTE` / OPT nodes for a clinical model (e.g. blood
  pressure template makes systolic mandatory and restricts units).

Progressive-disclosure UIs typically: `attributesFor(parent)` → filter by what
is already present → further filter by template constraints → for polymorphic
types call `subtypesOf(...)`. OPT attachment policy stays in the consumer, not
in this library API.

Also distinct from:

- **`TypeRegistry`** — name ↔ constructor for (de)serialization
- **`TypeInferenceEngine` / ZipEHR maps** — incomplete hand tables for serde;
  not a public schema API
- **`MANDATORY_RM_ATTRIBUTES`** — partial lists for generators; prefer
  `attributesFor(t).filter(a => a.mandatory)` going forward
