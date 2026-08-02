# Templates and archetypes used in examples

Script examples (`basic-composition.ts`, `simple-observation.ts`) reference common openEHR archetypes by ID. They illustrate RM construction; **constraint enforcement** is done with `TemplateValidator` when you supply an operational template — see [docs/ADL_SUPPORT.md](../../docs/ADL_SUPPORT.md).

## Primary clinical model set (demo)

The browser demo loads curated templates from **[Ehrlibs/openEHR-model-examples](https://github.com/Ehrlibs/openEHR-model-examples)** first:

| Asset | Path in Ehrlibs repo |
|-------|----------------------|
| Accident report + vital signs (`.t.json`, `.opt`, Web Template) | `local/theme-packs/sport-event-details/templates/` |
| Supporting archetypes | `local/archetypes/…` and theme-pack `archetypes/` |

Instance preset **Accident report + vitals (Ehrlibs FLAT)** in `demo-app/src/examples.ts` targets template id / root node `accident_report_including_vital_signs`.

## Archetypes referenced by Deno scripts

| Archetype | Used in |
|-----------|---------|
| `openEHR-EHR-COMPOSITION.encounter.v1` | both scripts |
| `openEHR-EHR-OBSERVATION.blood_pressure.v2` | `basic-composition.ts` |
| `openEHR-EHR-OBSERVATION.body_temperature.v2` | `simple-observation.ts` |

Copies of several of these also live under Ehrlibs `local/archetypes/`. For CKM originals, search via the openehr-assistant MCP or [CKM](https://ckm.openehr.org/).

## Related docs

- [docs/user/brief-property-styles.md](../../docs/user/brief-property-styles.md) — constructors / terse codes used in the scripts
- [docs/CLINICAL_MODEL_FILESETS.md](../../docs/CLINICAL_MODEL_FILESETS.md) — loading file sets in code and in the demo
- [docs/SIMPLIFIED_FORMATS.md](../../docs/SIMPLIFIED_FORMATS.md) — FLAT / STRUCTURED against a Web Template
