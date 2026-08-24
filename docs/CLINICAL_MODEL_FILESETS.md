# Clinical model file sets

Library support for working with archetypes and templates from ZIP uploads, local folders, or **read-only** GitHub branches.

**Recommended demo / example source:** [Ehrlibs/openEHR-model-examples](https://github.com/Ehrlibs/openEHR-model-examples) (mirrors a CKM-style `/local` layout; includes the Accident report + vital signs theme pack). Larger mirrors such as [Region Stockholm CKM-mirror](https://github.com/regionstockholm/CKM-mirror-via-modellbibliotek) remain supported.

## Formats

| Extension | Kind | Notes |
|-----------|------|--------|
| `.adl` / `.adls` | archetype / template | ADL2 (ADL 1.4 converted on load) |
| `.opt` | opt_xml | Operational template XML |
| `.oet` | oet_xml | Ocean Template Editor XML |
| `.t.json` | template_json | Better **Archetype Designer** JSON (AOM `TEMPLATE` + overlays) |

`.t.json` is **not** ITS-REST Web Template JSON (that is produced from an operational template via `buildWebTemplate()`). Glossary: [CONTEXT.md](../CONTEXT.md).

### Snapshot vs differential overlays

Better Archetype Designer can store **TEMPLATE_OVERLAY** objects two ways:

| Overlay form | `differential` | `termDefinitions` | AD@git closure |
|--------------|----------------|-------------------|----------------|
| **Snapshot** | `false` | Full (tens of codes) | Node names resolve from the overlay itself. Overlay parent ADLs are unused for labels. The demo featured Accident report model is this form. |
| **Differential** | `true` | Empty / almost empty | Flatten specialises each overlay against `parentArchetypeId`. Closure **must** fetch those parent `.adl` files (e.g. `openEHR-EHR-EVALUATION.problem_diagnosis.v1`) or Web Template names fall back to at-codes (`at0002.1`). `simple-diagnose-and-vitals.t.json` is this form. |

`collectTemplateJsonExternalRefs` therefore enqueues overlay `parentArchetypeId` values (while still skipping inlined overlay ids such as `ovl-…`). ADL `parent_archetype_id` chains are followed after a parent file is fetched.

## API

```typescript
import { ClinicalModelWorkspace, parseGitHubRepoSpec } from "./parser/mod.ts";

const ws = new ClinicalModelWorkspace();

// ZIP entries (same filter as GitHub)
ws.loadFromZipEntries([{ path: "local/foo.t.json", content: "..." }]);

// Read-only GitHub branch (whole tree under a path prefix)
await ws.loadFromGitHub(
  "Ehrlibs/openEHR-model-examples@main:local",
);

// Single `.t.json` URL — recursive dependencies (nested templates + archetypes)
await ws.loadFromGitHubTemplateUrl(
  "https://github.com/Ehrlibs/openEHR-model-examples/blob/main/local/theme-packs/sport-event-details/templates/Accident%20report%20including%20vital%20signs.t.json",
  {
    onProgress: (e) => console.log(e.phase, e.message),
  },
);

// Edit + export (annotation editor / download flows)
ws.updateFileContent("local/Care unit v2.t.json", newText);
const blob = ws.exportFile("local/Care unit v2.t.json");
const all = ws.exportEntries();

const opt = ws.resolveOperational().operationalTemplate;
```

### GitHub spec syntax

- `owner/repo@branch`
- `owner/repo@branch:pathPrefix` — only files under that folder
- Full URL: `https://github.com/owner/repo/tree/branch/...`

Uses the public GitHub API and `raw.githubusercontent.com` (no git binary).

## Demo app

On **Template (schema)**:

1. **Upload** — ZIP or individual files (includes `.t.json`)

On **Template from AD@git**:

1. Choose a curated example (Ehrlibs first) or paste a GitHub **blob** / **raw** `.t.json` URL
2. Click **Load** — progress log shows fetch/parse steps; file set opens on **Template (schema)**

Select the **generation root** radio on a template file to drive example / FLAT / Web Template output.

Instance preset **Accident report + vitals (Ehrlibs FLAT)** matches the Accident report Web Template root id `accident_report_including_vital_signs`. On load the demo fetches the published `.wt.json` into the simplified-schema workspace so FLAT → canonical conversion works. AD@git still defaults to the `.t.json` for **Generate example from Template** (dependency closure). For the richest operational template, also upload the theme-pack `.opt` from the same folder.
