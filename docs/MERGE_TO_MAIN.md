# Merging `ui-restoration-2026-02-18` → `main`

Checklist before opening the PR and after merge.

## Pre-merge verification

Run on the feature branch:

```bash
deno test tests/parser/ tests/validation/ tests/am/ --allow-read --no-check
deno check enhanced/openehr_rm.ts enhanced/openehr_am.ts
```

Optional consumer check (if `../consumer-issue52-repro` exists):

```bash
deno check ../consumer-issue52-repro/main.ts
```

## What this branch adds (AM / ADL)

- (AI)"Hand"-written **ADL 2** parser + serializer (cADL, ODIN, rules, annotations, rm_overlay).
- **ADL 1.4** → ADL2 syntactic conversion + `parseAdl()` unified entry ([`enhanced/parser/mod.ts`](../enhanced/parser/mod.ts)).
- **Invariant evaluation** (`InvariantEvaluator`, `TemplateValidator.validateInvariants`).
- **Archetype AOM validation** (`ArchetypeValidator`) for structural checks on parsed artefacts.
- Template flattening MVP (`enhanced/am/`).
- Post-deserialize `validateAgainstTemplate` on JSON / YAML / XML.
- Docs: [ADL2_SUPPORT.md](ADL2_SUPPORT.md), [ADL2_ROUNDTRIP.md](ADL2_ROUNDTRIP.md), [phase5b-deferred.md](../tasks/phase5b-deferred.md).

**Still not in scope:** full Archie JVM semantic validator; complete ADL 1.4↔2 AOM code migration (ac-code/value_sets reshaping).

## Suggested PR steps

```bash
git fetch origin
git checkout ui-restoration-2026-02-18
git pull origin ui-restoration-2026-02-18

# Rebase or merge latest main if needed
git merge origin/main
# resolve conflicts, re-run tests

git push origin ui-restoration-2026-02-18
gh pr create --base main --head ui-restoration-2026-02-18 \
  --title "Phase 5b: ADL 1.4/2 parser, validation, AM flattening" \
  --body-file docs/MERGE_TO_MAIN.md
```

## Post-merge on `main`

1. Tag or note release in CHANGELOG if you maintain one.
2. Publish [ADL2_SUPPORT.md](ADL2_SUPPORT.md) link from README (already referenced).
3. Track follow-ups in [phase5b-deferred.md](../tasks/phase5b-deferred.md) (expression AST edge cases, deeper 1.4 semantic migration).

## Conflict hotspots

Likely overlap with `main` if others touched:

- `README.md`, `ROADMAP.md`
- `enhanced/openehr_am.ts` / `enhanced/openehr_rm.ts` (prefer keeping enhanced copies; re-run `deno check` after merge)
- `deno.json` dependencies

## Release notes (short)

- Parse and validate openEHR archetypes in **ADL 2** and legacy **ADL 1.4** (converted automatically).
- Validate clinical data against templates including **rules/invariants**.
- Optional validation when deserializing JSON/YAML/XML RM instances.
