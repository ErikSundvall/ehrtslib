# Regenerating RM attribute meta

Used by maintainers when BMM sources or `tasks/bmm_versions.json` change.
Library users only need the public API in [../RM_ATTRIBUTES.md](../RM_ATTRIBUTES.md).

Uses the same URLs as class codegen (`tasks/bmm_versions.json` for
`openehr_base` + `openehr_rm`):

```bash
deno run --allow-read --allow-net --allow-write tasks/generate_rm_meta.ts
```

Writes:

- `generated/rm_attribute_meta.ts` (baseline next to class stubs)
- `enhanced/meta/rm_attribute_meta.generated.ts` (imported by the facade)

Do not hand-edit the generated files.

Full maintenance tooling: [../../README-FOR-LIB-MAINTENANCE.md](../../README-FOR-LIB-MAINTENANCE.md).
