# ADL2 round-trip fidelity

## Supported

- Archetype header metadata (`adl_version`, `rm_release`, HRID)
- `language.original_language` → `AUTHORED_RESOURCE.original_language`
- `description` ODIN → `RESOURCE_DESCRIPTION` (stored on dynamic fields)
- `terminology.term_definitions` → `ARCHETYPE_ONTOLOGY.term_definitions` table
- `definition` cADL → `C_COMPLEX_OBJECT` tree (existence, cardinality, primitives, slots)
- Serializer emits language, description, terminology, and definition from parsed AOM

## Known non-lossless areas

- **Comments** (`--` in cADL/ADL) are not preserved
- **Formatting** (indentation, blank lines) may differ
- **Rules / invariants** — parsed into `ARCHETYPE.invariants`, serialized, and evaluated via `TemplateValidator` / `InvariantEvaluator` (see [ADL_SUPPORT.md](ADL_SUPPORT.md))
- **Annotations / rm_overlay** — ODIN trees stored on AOM and round-tripped
- **Annotations / RM overlay** sections — not fully mapped
- **Sibling order** (`before`/`after` in cADL) — not implemented
- **Full primitive constraint detail** — list patterns, assumed values, terminology constraints on primitives are partial
- **ADL paths** on attributes — not implemented

## Tests

```bash
deno test tests/parser/adl2_parser.test.ts --allow-read --no-check
```
