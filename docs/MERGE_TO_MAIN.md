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
- Docs: [ADL_SUPPORT.md](ADL_SUPPORT.md), [ADL2_ROUNDTRIP.md](ADL2_ROUNDTRIP.md).

**Still not in scope:** full Archie JVM semantic validator; complete ADL 1.4↔2 AOM code migration (ac-code/value_sets reshaping).

## Demo UI restore

This branch was cut before Copilot demo PRs (#50, #51) on `main` (medical theme, Material Icons, split `converter.html`, mockup → `public`). Branch commits do not touch the demo tree, so a plain merge **does not conflict** but also **does not restore** the older demo UX: Git sees demo as changed only on `main`, so `main`’s demo files win when this branch is merged.

- **Do not** `git merge origin/main` into the feature branch unless you reset `examples/demo-app/` and `docs/demo/` afterward (that merge re-applies `main`’s demo).
- **Do** restore demo **after** the library merge lands on `main` (same PR branch is fine — add a second commit):

```bash
git checkout main
git merge ui-restoration-2026-02-18
git checkout ui-restoration-2026-02-18 -- examples/demo-app/ docs/demo/
deno task build:demo
git add examples/demo-app/ docs/demo/
git commit -m "Restore demo webapp UI baseline (revert Copilot demo aesthetics)"
```

Optional: port only `examples/demo-app/scripts/build.ts` asset-copy fixes from `main` before committing ([`tasks/remote-main-vs-local-feature-report-2026-02-18.md`](../tasks/remote-main-vs-local-feature-report-2026-02-18.md)).

## Suggested PR steps

```bash
git fetch origin
git checkout ui-restoration-2026-02-18
git pull origin ui-restoration-2026-02-18

# Optional: merge latest main (see Demo UI restore — reset demo/ afterward if you do)
# git merge origin/main

git push origin ui-restoration-2026-02-18
gh pr create --base main --head ui-restoration-2026-02-18 \
  --title "Phase 5b: ADL 1.4/2 parser, validation, AM flattening" \
  --body-file docs/MERGE_TO_MAIN.md
```

## Post-merge on `main`

1. **Demo UI restore** — see [Demo UI restore](#demo-ui-restore) (required if you want the pre–PR #50/#51 demo on `main`).
2. Tag or note release in CHANGELOG if you maintain one.
3. Publish [ADL2_SUPPORT.md](ADL2_SUPPORT.md) link from README (already referenced).
4. Track follow-ups in [ROADMAP.md](../ROADMAP.md) Phase 6b.

## Conflict hotspots

Git reports **no merge conflicts** for library files; `README.md` auto-merges (ADL docs + experimental-site link).

Likely overlap with `main` if others touched:

- `README.md`, `ROADMAP.md`
- `enhanced/openehr_am.ts` / `enhanced/openehr_rm.ts` (prefer keeping enhanced copies; re-run `deno check` after merge)
- `deno.json` dependencies

## Release notes (short)

- Parse and validate openEHR archetypes in **ADL 2** and legacy **ADL 1.4** (converted automatically).
- Validate clinical data against templates including **rules/invariants**.
- Optional validation when deserializing JSON/YAML/XML RM instances.
