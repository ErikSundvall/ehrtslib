# TAAAT UI prototype — NOTES

**Question:** Which layout makes the whole template definition tree discoverable (the live D3 view collapses children, so repeated sections vanish) while still supporting manual path-annotation editing and automated `L10n.*` generation that cannot rewrite the constraint tree?

**Sample:** in-memory “home care encounter” with two renamed `SECTION.adhoc` occurrences (the [discourse #2760](https://discourse.openehr.org/t/2760) case) plus a unique blood-pressure observation. Starting annotations include a `design note` that generation must leave intact.

## Variants

| Key | Name | Structure |
|-----|------|-----------|
| A | Outline explorer | Teaching rail + fully expanded outline + inspector. Primary affordance: browse every node. |
| B | Annotation matrix | Spreadsheet of all nodes × languages. Primary affordance: scan/edit L10n in place. |
| C | Map + review queue | Nested tiles of the whole tree + L10n coverage queue and generate/diff. Primary affordance: review then apply. |

Switcher: `?variant=A|B|C`, ← → keys, floating bar. Run: `deno task proto:taaat` → http://127.0.0.1:8001/prototype.html

## L10n generation (not throwaway)

`parser/l10n_annotation_generate.ts` only writes `L10n.*` keys into `annotations.documentation`, optionally copies them into every language bag, and never deletes other keys. See `docs/adr/0001-l10n-annotation-generation.md`.

## Verdict

_Awaiting review: pick a variant (or mix, e.g. “outline from A, generate/diff from C”) then delete `examples/taaat-app/src/prototype/` and fold the winner into the live TAAAT page._
