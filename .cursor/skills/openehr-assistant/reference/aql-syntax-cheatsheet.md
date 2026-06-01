# AQL syntax cheatsheet

**Purpose:** Minimal offline reminder of AQL structure. For full syntax and path rules, use `guide_get("aql/syntax")` or see AGENTS.md for spec and grammar links.

---

## AQL clause structure

- **SELECT** — list of projection items (e.g. path aliases, `c/content[...]`, `e` for composition)
- **FROM** — top-level composition variable and **CONTAINS** hierarchy (archetype and path constraints)
- **WHERE** — optional predicates (node-id, time, value filters)
- **ORDER BY** — optional sort (e.g. `e/time_created DESC`)

Containment defines the candidate set; archetype paths in SELECT define what is projected. Validate paths against the deployed template (OPT).

---

For full syntax use `guide_get("aql/syntax")` or see AGENTS.md for spec/grammar links.
