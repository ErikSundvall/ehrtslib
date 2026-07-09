# Product Requirements Document: ZipEHR XHTML (FHIR Narrative) Variant

**Version:** 1.0  
**Date:** 2026-07-09  
**Status:** Draft — `ready-for-agent`  
**Project:** ehrtslib — TypeScript/Deno openEHR implementation  
**Related:** [enhanced/serialization/zipehr/README.md](../enhanced/serialization/zipehr/README.md), [zipehr_v1.schema.json](../enhanced/serialization/zipehr/zipehr_v1.schema.json), [table3.yaml](../enhanced/serialization/zipehr/table3.yaml), [FHIR R4 Narrative](https://hl7.org/fhir/R4/narrative.html)

---

## Problem Statement

ZipEHR today compresses canonical openEHR JSON into `zipehr.json` and `zipehr.yaml` using emoji (or Ehrbase letter-code) type symbols. These formats are excellent for LLM context and programmatic round-trip, but they are **not natively renderable** in web browsers or embeddable in **FHIR `Narrative.div`** XHTML fragments without a custom viewer.

Clinical interoperability increasingly requires human-readable summaries inside FHIR resources (`Composition.text`, `Observation.text`, etc.). FHIR narrative has strict constraints: valid XHTML subset, no external stylesheets, no scripts, discouraged use of emojis in attributes, and content that must remain clinically intelligible when custom styling is absent.

Users need a **lossless ZipEHR variant** that:

- Round-trips to canonical openEHR JSON (with `_type` fields) like existing ZipEHR variants
- Embeds directly in FHIR `Narrative.div` fragments
- Reuses ZipEHR symbol tables, terse value encoding, structured LOCATABLE rules, and type inference
- Separates **human-visible clinical text** (element content, headings) from **machine metadata** (`class`, `title`)
- Avoids `id` attributes for openEHR `at` codes (which repeat within templates and collide under FHIR uniqueness rules)

---

## Solution

Add a third ZipEHR output variant — **`zipehr.xhtml`** — that serializes canonical openEHR JSON to an **FHIR-safe XHTML fragment** and deserializes it back.

### Wire format summary

| Aspect | Rule |
|--------|------|
| Root | `<div xmlns="http://www.w3.org/1999/xhtml" lang="…">` (FHIR narrative fragment) |
| RM type | `class` = **first Ehrbase letter code** from `table3.yaml` (e.g. `CO`, `OB`, `E`, `q`, `c`) — no prefix |
| LOCATABLE / ARCHETYPED metadata | `title` = semicolon-separated `code: value` pairs using **attribute letter codes** from `table3.yaml` (`id`, `ar`, `te`, `rm`) — **no emojis** |
| `archetype_node_id` | Always `id: at…` in `title`, never XML `id` attribute |
| Archetype root (`ARCHETYPED`) | `ar:`, `te:`, `rm:` in `title`; omit `ar` when equal to visible name (same rule as ZipEHR structured LOCATABLE) |
| ELEMENT name | Plain `<span>` text **before** value `<span>` — **not** in `title` |
| SECTION / entry roots | Optional `<h2>`–`<h4>` for human headings (duplicate of name is intentional) |
| DV leaf values | Human text in span content; machine payload in value span `title` using existing ZipEHR terse forms |
| Terminology in `title` | Full terse strings (`local::at0028\|Fully clothed, without shoes\|`) — no emoji shortcuts in attributes |

### Reference fragment (body weight excerpt)

```html
<div xmlns="http://www.w3.org/1999/xhtml" lang="en">
  <div class="SE" title="id: at0000">
    <h3>Measurements</h3>
    <div class="OB" title="ar: openEHR-EHR-OBSERVATION.body_weight.v2">
      <h4>Body weight</h4>
      <div class="HI">
        <div class="PE" title="id: at0003">
          <div class="TR" title="id: at0001">
            <div class="E" title="id: at0004">
              <span>Weight</span>
              <span class="q" title="85|kg|">85 kg</span>
            </div>
          </div>
          <div class="TR" title="id: at0008">
            <div class="E" title="id: at0009">
              <span>State of dress</span>
              <span class="c" title="local::at0028|Fully clothed, without shoes|">Fully clothed, without shoes</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
```

### Title micro-grammar (normative for v1)

```
title     := pair (";" WS pair)*
pair      := attrCode ":" WS value
attrCode  := "id" | "ar" | "te" | "rm"   # from table3.yaml attributes first symbol
value     := quotedString | unquotedValue
unquotedValue := char+ excluding ";" unless quoted
```

- **Pair separator:** semicolon (`;`) — avoids commas inside clinical text values.
- **Emojis forbidden** in `title` (FHIR guidance).
- **`na` (name) excluded** from `title`; name lives in first child `<span>` or heading text.

### Value span `title` terse forms (reuse ZipEHR)

| class | RM type | title format |
|-------|---------|--------------|
| `q` | DV_QUANTITY | `magnitude\|units\|` or `magnitude: N; units: U` (pick one; prefer pipe form for parity with coded text) |
| `c` | DV_CODED_TEXT | `terminology::code\|value\|` |
| `C` | CODE_PHRASE | `terminology::code` |
| `x` | DV_TEXT | omit title when identical to text content |
| `dt` | DV_DATE_TIME | ISO-8601 string |

---

## User Stories

1. As a library maintainer, I want to serialize canonical openEHR JSON to an FHIR-safe XHTML fragment, so that compositions can be embedded in `Narrative.div` without a separate viewer.
2. As a library maintainer, I want to deserialize that XHTML fragment back to canonical JSON with `_type` fields, so that the format is lossless for supported RM subsets.
3. As a clinician viewing a FHIR resource, I want the narrative to read naturally (headings, labels, values) even when the consuming app ignores ZipEHR `class`/`title` metadata, so that clinical safety is preserved per FHIR rules.
4. As an integrator mapping openEHR to FHIR, I want a deterministic XHTML representation aligned with ZipEHR conventions, so that the same clinical content can move between `zipehr.yaml`, `zipehr.json`, and `zipehr.xhtml`.
5. As a developer, I want RM types expressed as Ehrbase letter codes in `class`, so that attributes stay ASCII-only and FHIR-sanitizer-friendly.
6. As a developer, I want LOCATABLE metadata in `title` using `id`/`ar`/`te`/`rm` letter codes, so that archetype identity is machine-readable without XML `id` collisions.
7. As a developer, I want `at` codes in `title` as `id: at0004` rather than HTML `id`, so that reused at-codes within a template do not violate FHIR uniqueness constraints.
8. As a developer, I want ELEMENT names rendered as a `<span>` immediately before the value `<span>`, so that layout is predictable and parseable.
9. As a developer, I want SECTION and CARE_ENTRY roots to optionally emit headings (`h2`–`h4`), so that document structure is visible to humans without parsing `title`.
10. As a developer, I want archetype roots with `ARCHETYPED` to emit `ar:` (not `id:`) for archetype id in `title`, matching existing ZipEHR structured LOCATABLE serialize rules.
11. As a developer, I want DV_CODED_TEXT values to use the same terse string format as ZipEHR YAML/JSON, so that terminology round-trips through shared parsers.
12. As a developer, I want DV_QUANTITY values to round-trip magnitude and units via value span `title`, so that coded units are not lost when display text is formatted.
13. As a developer, I want `detectInputFormat` to recognize `zipehr.xhtml` alongside existing variants, so that the demo converter can auto-detect input.
14. As a developer, I want high-level APIs `serializeToXZipehr` and `zipehrXhtmlToCanonical`, mirroring existing J/Y serializers, so that adoption is consistent.
15. As a tester, I want round-trip tests for the body-weight and ChemoForm fixtures, so that regressions are caught early.
16. As a tester, I want tests that verify emitted XHTML contains no emoji in attributes and no forbidden FHIR elements (`script`, `link`, `iframe`), so that narrative constraints are enforced.
17. As a demo-app user, I want to preview zipehr.xhtml with optional external CSS supplied by the host page (not embedded in the fragment), so that browser beautification works in the static demo.
18. As an LLM pipeline author, I want to convert zipehr.xhtml → canonical → zipehr.yaml, so that I can normalize FHIR narrative payloads into the most compact ZipEHR variant.
19. As a maintainer, I want title parsing/formatting isolated in a small module, so that grammar evolution does not ripple through the DOM walker.
20. As a maintainer, I want letter-code maps derived from `table3.yaml` (first symbol per row), reusing `loadSymbolMap("lettercode")`, so that symbol table edits stay single-sourced.
21. As a developer, I want PROPERTY_TYPE_MAP and child-property ordering conventions from ZipEHR YAML to drive nesting of child `div` elements, so that array order is stable.
22. As a developer, I want polymorphic slots (ELEMENT.value, etc.) handled via the same inference paths as `zipehr.yaml`, so that behavior stays consistent across variants.
23. As an integrator, I want an optional helper that wraps a fragment as FHIR `Narrative` JSON (`status: generated`, escaped `div` string), so that FHIR serialization is one call away.
24. As a developer, I want deserialization to warn (not fail) when human-visible name text disagrees with machine metadata, so that minor authoring drift is visible.
25. As a maintainer, I want README documentation for the XHTML variant alongside JSON/YAML, so that newcomers understand when to use each format.
26. As a developer, I want out-of-scope RM types to fail with a clear error during serialization, so that partial support is explicit rather than silent data loss.
27. As a security reviewer, I want the serializer to never emit script, external links, or event handler attributes, so that FHIR narrative safety rules are met by construction.
28. As a developer, I want whitespace-only narrative fragments rejected on deserialize, per FHIR non-whitespace rule, so that invalid payloads surface early.
29. As a developer, I want COMPOSITION terminology promotions (`language`, `territory`, `encoding`) represented consistently in XHTML (visible or `title` on COMPOSITION root), so that composition metadata is not dropped.
30. As a future author, I want the title grammar extensible for additional attribute codes without breaking v1 parsers, so that new LOCATABLE facets can be added later.

---

## Implementation Decisions

### Modules to build or extend

#### 1. Title grammar module (new — deep module)

**Responsibility:** Parse and format semicolon-separated `code: value` metadata for `title` attributes.

**Interface (conceptual):**

- `formatLocatableTitle(metadata: LocatableTitleFields): string`
- `parseLocatableTitle(title: string): LocatableTitleFields`
- `formatValueTitle(typeCode: string, tersePayload: string): string`
- `parseValueTitle(typeCode: string, title: string): unknown`

**Encapsulates:** quoting rules, semicolon splitting, validation of known attribute codes (`id`, `ar`, `te`, `rm`), omission rules matching `buildLocatableStructuredObject` (e.g. omit `ar` when equal to name).

#### 2. Letter-code registry (extend existing symbol map)

**Responsibility:** Bidirectional map between RM class names and first `table3.yaml` letter symbol.

**Reuse:** `loadSymbolMap("lettercode")`, `buildReverseSymbolMap`.

**New surface:** `loadLetterCodeMap()`, `rmTypeFromClass(className: string)`, `classFromRmType(rmType: string)`.

#### 3. XHTML serializer (new)

**Responsibility:** Walk canonical plain JSON tree; emit FHIR-safe XHTML fragment string.

**Pipeline:**

```
canonical JSON
  → (optional) jsonToCompactPlain  # same stripping as zipehr.yaml where inferrable
  → dom-like tree builder
  → XHTML string emitter
```

**Rules:**

- Map LOCATABLE nodes to `<div class="…" title="…">` with child structure.
- Emit heading for `SECTION`, `OBSERVATION`, `EVALUATION`, `INSTRUCTION`, `ACTION`, `COMPOSITION` (configurable heading level).
- Map `ELEMENT` to inner pattern: label span + value span.
- Map DV leaves to `<span class="lettercode" title="terse">display</span>`.
- Apply `TERMINOLOGY_FIELD_PROMOTIONS` on COMPOSITION same as other ZipEHR paths.
- Root wrapper: XHTML namespace + `lang` from composition language when available (default `en`).

#### 4. XHTML deserializer (new)

**Responsibility:** Parse restricted XHTML subset back to canonical JSON.

**Approach:** Use a lightweight HTML parser (e.g. `deno_dom` or `linkedom` if already acceptable dependency; otherwise implement minimal tag parser for allowed subset only). Walk DOM depth-first; use sibling order and `class`/`title` to reconstruct RM tree.

**Reuse:** `expandTerseScalar` / terse DV expansion logic from existing deserialize path; `PROPERTY_TYPE_MAP` for parent-child property assignment; `parseLocatableStructuredObject` equivalence via title parser.

**Child property resolution:** Maintain explicit stack of `(parentRmType, propertyName)` while descending — mirror `applyEmojiToCompact` inference order.

#### 5. Format detection (extend)

Add `zipehr.xhtml` to `InputDetectionResult` / `ZipehrVariant` when:

- Input is XML/HTML with `xmlns="http://www.w3.org/1999/xhtml"`, or
- Heuristic: root `div` children use known letter-code `class` tokens from table3.

#### 6. High-level API (extend serializer module)

- `serializeToXZipehr(obj, options?) → string` (full fragment)
- `serializeZipehrPlainToXhtml(plainObj, options?) → string`
- `zipehrXhtmlToCanonical(text, symbolVariant?) → Promise<canonical>`
- `wrapFhirNarrative(xhtmlFragment, status?) → { status, div }` (optional convenience)

#### 7. Schema / version declaration

- Format version URI: extend ZipEHR schema family (e.g. `http://purl.org/ehrtslib/zipehr/xhtml/v1`) documented in README.
- XHTML variant does **not** use JSON `$schema` or YAML language-server directive; optional `data-zipehr-version` is **out of scope** (FHIR discourages nonstandard attributes). Version identified by namespace convention + documentation.

### Architectural decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Emoji in attributes | Forbidden in v1 XHTML | FHIR narrative guidance |
| `id` XML attribute for at-codes | Not used | FHIR uniqueness + at-code reuse |
| Name placement | First `<span>` before value span | Human-readable + parseable |
| Title pair separator | Semicolon | Commas appear in clinical text |
| Class tokens | Bare letter codes | Compact; generated-only output |
| Lossless scope v1 | COMPOSITION subtree: SECTION, entries, HISTORY/EVENT, ITEM_TREE, ELEMENT, common DV types | Matches existing ZipEHR test fixtures; expand incrementally |
| Compact pass before emit | Use `jsonToCompactPlain` like zipehr.yaml | Consistent omission of redundant `_type` |
| Headings | Emit for major LOCATABLE entries | FHIR human-readable requirement |
| External CSS | Host-provided only | FHIR forbids `<link>` in narrative |
| HTML parser dependency | Evaluate `deno_dom`; prefer zero-dep minimal parser if dependency weight is high | Align with Deno-first repo policy |

### Title / LOCATABLE equivalence to ZipEHR structured object

Prototype decision — structured LOCATABLE in ZipEHR YAML:

```
{ "🪧": "Body weight", "Ⓐ": "openEHR-EHR-OBSERVATION.body_weight.v2" }
```

XHTML equivalent:

```html
<div class="OB" title="ar: openEHR-EHR-OBSERVATION.body_weight.v2">
  <h4>Body weight</h4>
  …
</div>
```

ChemoForm composition:

```html
<div class="CO" title="te: ChemoForm-MBA.v7; ar: openEHR-EHR-COMPOSITION.self_reported_data.v1; rm: 1.1.0">
  <h2>ChemoForm-MBA.v7</h2>
  …
</div>
```

### API contract with existing ZipEHR

```
canonical JSON
  ├─► zipehr.json   (convertObjectDirect)
  ├─► zipehr.yaml   (convertObjectEhrtslib)
  └─► zipehr.xhtml  (convertObjectToXhtml)   # new

zipehr.* ──► expand*ToCanonical ──► canonical JSON   # shared destination
```

All three variants SHOULD round-trip the same canonical subset within floating-point and formatting tolerances for display strings.

---

## Testing Decisions

### What makes a good test

- Test **observable behavior**: HTML output structure, round-trip equality to canonical fixture, FHIR constraint compliance.
- Do **not** test private DOM walker step order or internal helper names.
- Prefer golden-string tests for XHTML fragments (normalized whitespace) plus deep equality on parsed canonical JSON.

### Modules to test

| Module | Priority |
|--------|----------|
| Title grammar parse/format | High — isolated unit tests |
| XHTML serializer | High — golden fragments |
| XHTML deserializer | High — round-trip |
| Letter-code map | Medium — reuse existing symbol map tests |
| detectInputFormat | Medium — variant classification |
| End-to-end API | High — mirror `zipehr_roundtrip.test.ts` |

### Prior art

- `test_data/tests/enhanced/zipehr_roundtrip.test.ts` — round-trip patterns, CHEMO_FIXTURE, body-weight patterns
- `buildLocatableStructuredObject` / `parseLocatableStructuredObject` tests — LOCATABLE title equivalence
- Schema declaration tests in serializer — warn-on-missing patterns (XHTML may omit schema)

### Required test cases (minimum)

1. Body weight OBSERVATION fragment round-trip (85 kg, at0028 state of dress)
2. ChemoForm COMPOSITION header `te`/`ar`/`rm` title round-trip
3. ELEMENT label span + value span ordering preserved
4. No emoji in any attribute (regex assertion)
5. No forbidden tags/attributes (`script`, `onload`, `link`)
6. `detectInputFormat` identifies xhtml variant
7. Cross-variant: canonical → xhtml → canonical → yaml produces equivalent clinical content
8. Reused at-code under different parents disambiguated by tree position
9. `ar` omitted from title when archetype id equals visible name (ZipEHR parity)
10. FHIR `wrapFhirNarrative` produces valid JSON `div` string escaping

---

## Out of Scope

- Full FHIR resource generation (Observation, Composition bundles) beyond optional `Narrative` wrapper helper
- Embedded CSS or `<link>` inside the XHTML fragment
- Emoji symbol variant in XHTML attributes
- XML `id` / `idref` linking to FHIR structured fields (`originalText` extensions) — future work
- Browser-side JavaScript viewer in demo (optional follow-up; host CSS only in scope for documentation)
- Complete RM coverage in v1 (PARTY, FEEDER_AUDIT, VERSIONED_OBJECT, etc.) — incremental after core clinical entries
- Publishing `zipehr.xhtml` JSON Schema (may document grammar in README first)
- Sanitizer compatibility testing against specific vendor FHIR servers
- bidirectional sync with hand-edited narrative (`Narrative.status = additional`)
- Base64 embedding of ZipEHR JSON inside narrative

---

## Further Notes

### FHIR narrative compliance checklist (serializer MUST enforce)

- Root `div` has `xmlns="http://www.w3.org/1999/xhtml"`
- No `head`, `body`, `script`, `link`, `iframe`, `object`, `form`
- No event attributes (`onclick`, etc.)
- Non-whitespace content present
- `lang` on root when composition language known
- Custom `class` values allowed but not required to be styled by FHIR clients

### Relationship to demo app

The static demo may add an output format `zipehr.xhtml` and a preview pane rendering the fragment with `public/zipehr-xhtml.css` loaded by the host page — CSS is **not** part of the serialized artifact.

### Issue tracker

`gh` CLI was unavailable in the authoring environment. This PRD is filed under `tasks/` per repository convention. When GitHub issues are available, open an issue from this document and apply label **`ready-for-agent`**.

### Suggested implementation order

1. Title grammar module + tests  
2. Letter-code helpers (thin wrapper over symbol map)  
3. Serializer for OBSERVATION/COMPOSITION fixtures  
4. Deserializer + round-trip tests  
5. detect + public API + README  
6. Demo integration (optional stretch)

### Open questions for implementer (defaults provided)

| Question | Default |
|----------|---------|
| DV_QUANTITY title: pipe or key-value? | Pipe: `85\|kg\|` |
| Heading tags per RM type | `COMPOSITION→h2`, `SECTION→h3`, entries→h4 |
| HTML parser dependency | Try zero-dep restricted parser first; document if `deno_dom` added |
| Warn on name/title mismatch | `console.warn`, prefer span text for name |
