# ehrtslib Examples

Runnable Deno scripts and the browser demo. Domain patterns (constructors, terse codes, dual accessors) are documented under [docs/](../docs/README.md) — this folder focuses on **how to run** examples.

## Deno scripts

| Script | Run | Shows |
|--------|-----|--------|
| `basic-composition.ts` | `deno run examples/basic-composition.ts` | Blood pressure COMPOSITION (brief + manual styles) |
| `simple-observation.ts` | `deno run examples/simple-observation.ts` | Temperature COMPOSITION |
| `archetype_template_usage.ts` | `deno run --allow-read examples/archetype_template_usage.ts` | Parse / validate / generate from templates |

## Browser demo

[demo-app/](demo-app/) — format converter with instance presets, template upload, and AD@git load.

Primary clinical models: [Ehrlibs/openEHR-model-examples](https://github.com/Ehrlibs/openEHR-model-examples) (Accident report + vital signs). Region Stockholm CKM mirror remains available as a secondary curated source.

```bash
deno task build:demo    # → docs/demo/
deno task dev:demo      # http://127.0.0.1:8000
```

## Documentation

- [docs/getting-started.md](../docs/getting-started.md)
- [docs/user/brief-property-styles.md](../docs/user/brief-property-styles.md)
- [docs/user/dual-accessors.md](../docs/user/dual-accessors.md)
- [docs/ADL_SUPPORT.md](../docs/ADL_SUPPORT.md) — AM, ADL, `TemplateValidator`
- [docs/maintainers/roadmap.md](../docs/maintainers/roadmap.md)
- Archetypes referenced by scripts: [templates/README.md](templates/README.md)
- More RM fixtures: `test_data/tests/enhanced/rm.test.ts` (run from the repo root)
