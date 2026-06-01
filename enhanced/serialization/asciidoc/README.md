# AsciiDoc Serialization for openEHR

AsciiDoc serializers for openEHR Reference Model objects, providing both human-readable and lossless round-trip capable output.

## Variants

### 1. Compact AsciiDoc (`COMPACT_ASCIIDOC_CONFIG`)

Maximum human readability. Renders compositions as readable clinical documents with tables for structured data. Hides archetype node IDs and type annotations.

**Use case:** Documentation, clinical display, reports

**Example output:**
```asciidoc
// openEHR Composition
:template-id: Blood Pressure Template v1
:composer: Dr. Smith

= Emergency Consultation

== Vital Signs

=== Blood pressure

[cols="1,2", options="header"]
|===
| Item | Value

| Systolic | 145 mm[Hg]
| Diastolic | 90 mm[Hg]
|===
```

### 2. Lossless AsciiDoc (`LOSSLESS_ASCIIDOC_CONFIG`) - Default

Preserves all structural information needed for round-tripping when combined with the template. Uses AsciiDoc comments for archetype_node_ids, type annotations, and openEHR URN-based references.

**Use case:** Round-trip conversion (AsciiDoc → openEHR JSON/XML), template-aware editing

**Example output:**
```asciidoc
// openEHR Composition
:uid: 907a3c-...
:template-id: Blood Pressure Template v1
:archetype-id: openEHR-EHR-COMPOSITION.encounter.v1
:composer: Dr. Smith
:language: ISO_639-1::en
:territory: ISO_3166-1::GB
:category: openehr::433|event|

// urn:openehr:am:org.openehr::openEHR-EHR-COMPOSITION.encounter.v1
= Blood Pressure Recording

// urn:openehr:am:org.openehr::openEHR-EHR-OBSERVATION.blood_pressure.v2
== Blood pressure _[OBSERVATION]_

* _origin:_ 2026-04-13T10:30:00Z

// at0006
*Any event*

* _time:_ 2026-04-13T10:30:00Z
* *Systolic:* 145 mm[Hg] // at0004
* *Diastolic:* 90 mm[Hg] // at0005
```

## openEHR URN Format

In lossless mode, archetype identifiers are expressed as URNs:

```
urn:openehr:am:org.openehr::openEHR-EHR-OBSERVATION.blood_pressure.v2
```

The URN implicitly contains the RM class marker (OBSERVATION, EVALUATION, etc.) within the archetype ID segment, as discussed in the [DV_EHR_URI related issues](https://openehr.atlassian.net/wiki/spaces/spec/pages/786956289/DV_EHR_URI+related+issues) specification page.

## Usage

```typescript
import { AsciidocSerializer, COMPACT_ASCIIDOC_CONFIG, LOSSLESS_ASCIIDOC_CONFIG } from './enhanced/serialization/asciidoc/mod.ts';

// Compact style (human readable, lossy)
const compact = new AsciidocSerializer(COMPACT_ASCIIDOC_CONFIG);
console.log(compact.serialize(composition));

// Lossless style (round-trip capable)
const lossless = new AsciidocSerializer(LOSSLESS_ASCIIDOC_CONFIG);
console.log(lossless.serialize(composition));

// Default (same as lossless)
const defaultSerializer = new AsciidocSerializer();
console.log(defaultSerializer.serialize(composition));
```

## Round-Trip Guarantees (Lossless Mode)

The lossless format guarantees that when combined with the original template:
- All archetype_node_ids are preserved (as AsciiDoc comments with URNs)
- All data values with their types are preserved
- Deterministic ordering is maintained
- The original canonical JSON/XML can be reconstructed

## Comparison with Markdown Variants

| Feature | AsciiDoc Compact | AsciiDoc Lossless | Markdown Clinical | Markdown Structural |
|---------|-----------------|-------------------|-------------------|---------------------|
| Human readable | ✓✓✓ | ✓✓ | ✓✓✓ | ✓✓ |
| Round-trip | ✗ | ✓ | ✗ | ✓ |
| Tables | Native AsciiDoc | Lists | GFM tables | Lists |
| Node IDs | Hidden | Comments + URN | Hidden | HTML comments |
| Type info | Hidden | Italic brackets | Hidden | Italic brackets |
| Cross-refs | N/A | URN comments | Wikilinks (opt) | HTML comments |
