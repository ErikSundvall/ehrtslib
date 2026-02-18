# Remote `origin/main` vs Local Baseline (2026-02-18)

## Scope
- **Local baseline compared:** branch `ui-restoration-2026-02-18` (created from local `main` state on this machine)
- **Remote target compared:** `origin/main`
- **Remote ahead count:** 14 commits

## High-level conclusion
There are **no core library/runtime feature additions** on `origin/main` compared to the local baseline.  
Changes are concentrated in demo/documentation web assets and styling.

## Files changed on `origin/main`
- `README.md`
- `docs/demo/converter.html` (new)
- `docs/demo/index.html`
- `docs/demo/styles.css`
- `examples/demo-app/mockup/README.md` (deleted)
- `examples/demo-app/mockup/archetype-demo.html` → `examples/demo-app/public/archetype-demo.html` (renamed/modified)
- `examples/demo-app/public/converter.html` (new)
- `examples/demo-app/public/index.html`
- `examples/demo-app/public/styles.css`
- `examples/demo-app/scripts/build.ts`

## Potentially useful non-UI changes
These are the only changes with practical value beyond appearance:

1. **Standalone converter page split-out**
   - `examples/demo-app/public/converter.html` was added and converter functionality moved there.
   - `examples/demo-app/public/archetype-demo.html` now embeds converter via iframe (`converter.html`).
   - Value: clearer separation of demo concerns and easier future maintenance of converter logic.

2. **Build pipeline now copies all required demo assets**
   - `examples/demo-app/scripts/build.ts` now copies:
     - `converter.html`
     - `shared-medical.css`
     - `archetype-demo.html`
   - Value: reduces risk of incomplete `docs/demo` output when publishing demo artifacts.

3. **README link to experimental website**
   - `README.md` includes an extra experimental-site reference.
   - Value: small discoverability/documentation improvement.

## What is mostly UI/presentation only
- Border/shadow/visibility tweaks
- Icon system swaps (emoji/material icons/inline SVG)
- Theme/aesthetic updates
- CSS consolidation and CSS property conflict fixes
- Demo-page tab/navigation presentation restructuring

## Recommendation
If you want only meaningful non-UI improvements while keeping your current local UX baseline:
- Consider selectively porting only:
  - `examples/demo-app/scripts/build.ts` asset-copy additions
  - optional README link update
- Treat the demo HTML/CSS changes as optional, since they are primarily presentation restructuring.

## Branch safety checkpoint
Your local safety baseline now exists as branch:
- `ui-restoration-2026-02-18`