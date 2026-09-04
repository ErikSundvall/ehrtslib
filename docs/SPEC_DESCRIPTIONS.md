# Specification descriptions (`spec`)

Optional package of **BMM documentation text** for openEHR classes and attributes, plus links to the corresponding class section in the specification HTML (development stream, as listed from [development_baseline](https://specifications.openehr.org/development_baseline)) and the Markdown twins advertised by [llms.txt](https://specifications.openehr.org/llms.txt).

Import this module **directly**. It is not re-exported from the root `mod.ts` barrel so compact / form-engine bundles do not pull the generated tables.

```typescript
import { attributeSpec, classSpec, specUrls } from "./spec/mod.ts";

const qty = classSpec("DV_QUANTITY");
qty?.documentation;
qty?.specHtmlUrl;
qty?.specMarkdownUrl;

attributeSpec("DV_QUANTITY", "magnitude")?.documentation;
specUrls("COMPOSITION");
```

When a class name exists in more than one component, pass `{ component: "AM" }` (or `RM`, `BASE`, `LANG`, `TERM`).

`specHtmlUrl` / `specMarkdownUrl` come from `/api/classes.json` when that index has a `link`. For AOM 1.4 rows with an empty `link`, the generator synthesises `/releases/AM/development/AOM1.4.html#…` from the fragment. Markdown omits UML class tables — use HTML for attribute/function/invariant grids.

AM 2.4 BMM does not include every AOM 1.4 domain type (`C_QUANTITY`, `C_CODED_TEXT`, …). Those still appear when listed in `classes.json`, with URLs and empty `attributes` until a matching BMM `documentation` field exists.

Distinct from [`meta`](RM_ATTRIBUTES.md), which answers *what attributes exist and their types*, not *what the spec says in prose*.

## Regenerating (maintainers)

```bash
deno task generate:spec-docs
```

Uses the same BMM URLs as class codegen (`tasks/bmm_versions.json`) plus `https://specifications.openehr.org/api/classes.json`. Writes `spec/spec_docs.generated.ts` and `generated/spec_docs.ts`. Do not hand-edit those files.
