# Clinical model file sets

Library support for working with archetypes and templates from ZIP uploads, local folders, or **read-only** GitHub branches (e.g. [Region Stockholm CKM mirror](https://github.com/regionstockholm/CKM-mirror-via-modellbibliotek)).

## Formats

| Extension | Kind | Notes |
|-----------|------|--------|
| `.adl` / `.adls` | archetype / template | ADL2 (ADL 1.4 converted on load) |
| `.opt` | opt_xml | Legacy operational template XML |
| `.oet` | oet_xml | Ocean Template Editor XML |
| `.t.json` | template_json | Better **Archetype Designer** JSON (AOM `TEMPLATE` + overlays) |

`.t.json` is **not** ITS-REST Web Template JSON (that is produced from an operational template via `buildWebTemplate()`).

## API

```typescript
import { ClinicalModelWorkspace, parseGitHubRepoSpec } from "./enhanced/parser/mod.ts";

const ws = new ClinicalModelWorkspace();

// ZIP entries (same filter as GitHub)
ws.loadFromZipEntries([{ path: "local/foo.t.json", content: "..." }]);

// Read-only GitHub branch (whole tree under a path prefix)
await ws.loadFromGitHub(
  "regionstockholm/CKM-mirror-via-modellbibliotek@MultiDiciplinery_Tumor_meetings:local",
);

// Single `.t.json` URL — recursive dependencies (nested templates + archetypes)
await ws.loadFromGitHubTemplateUrl(
  "https://github.com/regionstockholm/CKM-mirror-via-modellbibliotek/blob/MultiDiciplinery_Tumor_meetings/local/Diagnostic_MDT_Lung_cancer.t.json",
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

1. Paste a GitHub **blob** or **raw** link to a `.t.json` file
2. Click **Load** — progress log shows fetch/parse steps; file set opens on **Template (schema)**

Select the **generation root** radio on a template file to drive example / FLAT / Web Template output.
