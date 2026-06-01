# ADL syntax cheatsheet

**Purpose:** Minimal offline reminder of ADL 1.4 structure. For full syntax and constraint patterns, use `guide_get("archetypes/adl-syntax")` or see AGENTS.md for spec and grammar links.

---

## ADL 1.4 section order

Aligned with the canonical structure in the openEHR ADL 1.4 specification (archetype as a whole):

1. **`archetype`** — `archetype (adl_version=1.4)` and archetype identifier line
2. **`specialise` / `specialize`** (optional) — parent archetype id
3. **`concept`** — coded concept (terminology code)
4. **`language`** — dADL language section
5. **`description`** (optional) — dADL metadata
6. **`definition`** — cADL constraint tree (slot assertions live here, not in a separate top-level `rules` keyword)
7. **`invariant`** (optional) — top-level first-order assertions (not to be confused with slot rules inside `definition`)
8. **`ontology`** — dADL: `term_definitions`, `constraint_definitions`, `term_bindings` (external terminology bindings are expressed here; ADL 1.4 has no separate top-level `terminology` section)
9. **`revision_history`** (optional) — dADL; expected when the archetype is marked `controlled`

Sections must appear in this order. Every node in the definition must have a corresponding at-code in the ontology.

---

For full syntax use `guide_get("archetypes/adl-syntax")` or see AGENTS.md for spec/grammar links.
