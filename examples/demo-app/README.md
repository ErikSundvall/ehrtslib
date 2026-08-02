# Ehrtslib Format Converter Demo

Browser demo that converts openEHR RM instances and generates examples from templates.

**Live:** https://eriksundvall.github.io/ehrtslib/demo

## Features

- Convert among JSON, XML, YAML, Markdown, AsciiDoc, ZipEHR, and TypeScript constructor source
- FLAT / STRUCTURED simplified I/O (needs a loaded template / Web Template) — [docs/SIMPLIFIED_FORMATS.md](../../docs/SIMPLIFIED_FORMATS.md)
- Template file sets: upload `.adl` / `.opt` / `.oet` / `.t.json` / ZIP; generation modes `minimal` / `example` / `maximal`
- **Template from AD@git** — load Better `.t.json` + dependencies from GitHub ([docs/CLINICAL_MODEL_FILESETS.md](../../docs/CLINICAL_MODEL_FILESETS.md))
- Curated model catalog — **[Ehrlibs/openEHR-model-examples](https://github.com/Ehrlibs/openEHR-model-examples) first**, then Region Stockholm MDT and others
- Instance preset **Accident report + vitals (Ehrlibs FLAT)** matching that template’s Web Template paths

## Build / run

From repo root:

```bash
deno task build:demo   # → docs/demo/
deno task dev:demo     # http://127.0.0.1:8000
```

Or: `cd examples/demo-app && deno task dev`.

## Layout

| Path | Role |
|------|------|
| `src/main.ts` | UI / workspace orchestration |
| `src/converter.ts` | Format conversion adapter |
| `src/examples.ts` | Instance presets (incl. Ehrlibs FLAT) |
| `src/model-examples-catalog.ts` | Curated AD@git template URLs |
| `public/` | HTML / CSS template for the bundle |
| `scripts/` | esbuild → `docs/demo/` |
| `mockup/` | Historical design mockup only |

## Configuration

JSON, YAML, XML, TypeScript, and ZipEHR options live in the demo’s config panels (presets, terse format, type inference, hybrid YAML, etc.). Details: [serialization/](../../serialization/README.md).
