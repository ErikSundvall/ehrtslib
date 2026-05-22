# ADL2 support status (ehrtslib)

This document describes what the hand-written ADL2 stack supports in the current release. **ADL 1.4** is not supported yet.

## Supported (ADL2)

| Area | Status |
|------|--------|
| Archetype / template / operational_template header | Parse + serialize |
| `language`, `description` (ODIN) | Mapped to AOM |
| `definition` (cADL) | Primitives, slots, existence, cardinality, occurrences |
| `terminology` (ODIN) | Term definitions (+ partial bindings) |
| `rules` | Parse + serialize → `ARCHETYPE.invariants`; **evaluate** via `TemplateValidator` / `InvariantEvaluator` |
| `annotations` | Parse + serialize (`documentation` ODIN tree on `RESOURCE_ANNOTATIONS`) |
| `rm_overlay` | Parse + serialize (`rm_visibility` ODIN tree on `RM_OVERLAY`) |
| Template flattening (`enhanced/am/`) | MVP bidirectional |
| External `TemplateValidator` | Structural + optional invariant evaluation |
| Deserializer `validateAgainstTemplate` | JSON / YAML / XML config option |
| Archie fixture parse benchmark | 8/8 curated `test_data/archie-tests/` |

## Not supported yet

| Area | Notes |
|------|--------|
| **ADL 1.4** | No lexer/parser or 1.4↔2.x converter; use ADL2 from editors |
| **Full expression AST** | Common operators/paths work; exotic expression forms may store as text only |
| **Archie semantic validation parity** | Parse benchmark only; not full Archie validator |

## Invariant evaluation

Enable or disable on `TemplateValidator`:

```typescript
const validator = new TemplateValidator({
  validateInvariants: true, // default
});
```

Supported expression features (MVP): paths (`/data[id2]/...`), `$variables`, comparisons, `and` / `or` / `xor` / `implies`, `exists`, `for_all` / `there_exists` (simple forms).

## Post-deserialize validation

```typescript
import { JsonConfigurableDeserializer } from "./enhanced/serialization/json/mod.ts";

const deserializer = new JsonConfigurableDeserializer({
  validateAgainstTemplate: operationalTemplate,
});
const instance = deserializer.deserialize(json); // throws if invalid
```

Same option exists on `YamlDeserializer` and `XmlDeserializer`.

## Verify

```bash
deno test tests/parser/ tests/validation/ tests/am/ --allow-read --no-check
deno check enhanced/openehr_rm.ts enhanced/openehr_am.ts
```

Focused tests:

```bash
deno test tests/parser/rules_section.test.ts tests/parser/annotations_overlay.test.ts --allow-read --no-check
deno test tests/validation/invariant_evaluator.test.ts --allow-read --no-check
```
