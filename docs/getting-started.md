# Getting Started with ehrtslib

## Introduction

ehrtslib is a TypeScript/Deno implementation of the openEHR specifications, providing a complete set of classes for working with openEHR Reference Model (RM), Base Model (BASE), and Language Model (LANG) packages.

This guide will help you get started with creating openEHR COMPOSITION objects manually using ehrtslib.

## What is openEHR?

openEHR is an open standard specification for electronic health records (EHR). The key concepts include:

- **COMPOSITION**: The root container for clinical data, representing a clinical encounter or document
- **OBSERVATION**: Records observations made about a patient (e.g., blood pressure, temperature)
- **EVALUATION**: Records clinical assessments or evaluations
- **INSTRUCTION**: Records instructions for procedures or treatments
- **ACTION**: Records actions that have been performed
- **Data Types**: Specialized types for representing clinical values (DV_QUANTITY, DV_TEXT, DV_CODED_TEXT, etc.)

## ehrtslib Architecture

ehrtslib is organized into several packages:

- **openehr_base**: Foundation types (identifiers, date/time, primitives)
- **openehr_rm**: Reference Model classes (COMPOSITION, OBSERVATION, data types)
- **openehr_lang**: Language model and BMM (Basic Meta-Model) classes
- **openehr_term**: Terminology support
- **openehr_am**: Archetype Model (ADL parsing, templates, validation)

All classes are generated from BMM specifications and then enhanced with functional implementations.

## Installation and Setup

ehrtslib is designed to run with Deno. To use it in your project:

1. Import the packages you need:

```typescript
import * as openehr_rm from "./openehr_rm.ts";
import * as openehr_base from "./openehr_base.ts";
```

2. Or import from the enhanced versions for full functionality:

```typescript
import * as openehr_rm from "./enhanced/openehr_rm.ts";
import * as openehr_base from "./enhanced/openehr_base.ts";
```

## "Hello World" - Simplest Possible COMPOSITION

Here's the minimal code to create a COMPOSITION using [constructor initialization with nested objects](user/brief-property-styles.md#constructor-initialization) (see [Brief property styles](user/brief-property-styles.md) for terse formats and more patterns):

```typescript
import * as openehr_rm from "./openehr_rm.ts";

const composition = new openehr_rm.COMPOSITION({
  archetype_node_id: "openEHR-EHR-COMPOSITION.encounter.v1",
  name: "My First Composition",
  uid: "12345678-1234-1234-1234-123456789012::uk.nhs.example::1",
  language: "ISO_639-1::en",
  territory: "ISO_3166-1::GB",
  category: "openehr::433|event|",
  composer: { name: "Dr. Example" },
  archetype_details: {
    archetype_id: "openEHR-EHR-COMPOSITION.encounter.v1",
    rm_version: "1.1.0"
  }
});

console.log("Created COMPOSITION:", composition.name?.value);
```

## Key Concepts

### Required vs. Optional Properties

When creating COMPOSITION objects, certain properties are required by the openEHR specification:

**COMPOSITION Required Properties:**
- `archetype_node_id`: The archetype identifier
- `name`: Human-readable name (DV_TEXT)
- `uid`: Unique identifier (OBJECT_VERSION_ID)
- `language`: Language code (CODE_PHRASE with ISO_639-1)
- `territory`: Territory code (CODE_PHRASE with ISO_3166-1)
- `category`: Category of composition (DV_CODED_TEXT)
- `composer`: Who created it (PARTY_PROXY subtype)
- `archetype_details`: Archetype metadata (ARCHETYPED)

**COMPOSITION Optional Properties:**
- `context`: Clinical context information (EVENT_CONTEXT)
- `content`: The actual clinical content (array of CONTENT_ITEM)

### The Dual Getter/Setter Approach

ehrtslib uses a dual approach for properties: assign primitives for everyday use, or use `$`-prefixed getters when you need the underlying BASE wrapper (see [dual-accessors.md](user/dual-accessors.md)). Both patterns below set the same clinical text on a `DV_TEXT`:

```typescript
import * as openehr_base from "./openehr_base.ts";
import * as openehr_rm from "./openehr_rm.ts";

// Typed path: BASE String wrapper assigned to DV_TEXT
const textWrapper = new openehr_base.String("Patient is well");
const dvText = new openehr_rm.DV_TEXT();
dvText.value = textWrapper;       // Setter accepts wrapper or primitive
console.log(dvText.value);        // "Patient is well" (getter returns primitive)

// Primitive path: assign a string, read wrapper via $ when needed
const dvText2 = new openehr_rm.DV_TEXT();
dvText2.value = "Patient is well"; // Auto-wrapped internally
const wrapper = dvText2.$value;    // Underlying openehr_base.String
if (wrapper && !wrapper.is_empty()) {
  console.log(wrapper.value);      // "Patient is well"
}
```

Most RM classes use direct property access for simplicity; use `$property` when you need wrapper methods such as `is_empty()`.

### Working with Data Types

ehrtslib includes specialized data types for clinical information. Several support [constructor initialization](user/brief-property-styles.md#constructor-initialization) (string, terse format, or nested object); others rely on direct primitive assignment via the dual pattern.

**DV_TEXT** — Plain text:

Brief property style (constructor):
```typescript
const text = new openehr_rm.DV_TEXT("Patient is well");
// or: new openehr_rm.DV_TEXT({ value: "Patient is well", language: "ISO_639-1::en" })
```

Manual (property assignment):
```typescript
const text = new openehr_rm.DV_TEXT();
text.value = "Patient is well";
```

**DV_CODED_TEXT** — Coded terminology:

Brief property style (terse or nested object):
```typescript
const coded = new openehr_rm.DV_CODED_TEXT("local::at0005|Male|");
// or:
const coded2 = new openehr_rm.DV_CODED_TEXT({
  value: "Male",
  defining_code: { code_string: "at0005", terminology_id: "local" }
});
```

Manual (explicit wrapper objects):
```typescript
const coded = new openehr_rm.DV_CODED_TEXT();
coded.value = "Male";
const code = new openehr_base.CODE_PHRASE();
const termId = new openehr_base.TERMINOLOGY_ID();
termId.value = "local";
code.terminology_id = termId;
code.code_string = "at0005";
coded.defining_code = code;
```

**DV_QUANTITY** — Numerical measurements (no constructor init yet; use direct primitives):

Brief property style (dual pattern):
```typescript
const quantity = new openehr_rm.DV_QUANTITY();
quantity.magnitude = 120.0;
quantity.units = "mm[Hg]";
```

Manual (explicit `String` wrapper for units):
```typescript
const quantity = new openehr_rm.DV_QUANTITY();
quantity.magnitude = 120.0;
quantity.units = openehr_base.String.from("mm[Hg]");
```

**DV_DATE_TIME** — Date and time (direct primitive assignment):

Brief property style:
```typescript
const datetime = new openehr_rm.DV_DATE_TIME();
datetime.value = "2024-12-08T14:30:00";
```

Manual (explicit `String` wrapper):
```typescript
const datetime = new openehr_rm.DV_DATE_TIME();
datetime.value = openehr_base.String.from("2024-12-08T14:30:00");
```

### Creating Clinical Content

Clinical content is added through OBSERVATION, EVALUATION, INSTRUCTION, or ACTION objects:

```typescript
// Create an OBSERVATION
const observation = new openehr_rm.OBSERVATION();
observation.archetype_node_id = "openEHR-EHR-OBSERVATION.blood_pressure.v2";

const obsName = new openehr_rm.DV_TEXT();
obsName.value = "Blood Pressure";
observation.name = obsName;

// Set required OBSERVATION properties
observation.language = language; // Same language as composition
observation.encoding = encoding; // UTF-8 encoding

const subject = new openehr_rm.PARTY_SELF();
observation.subject = subject;

// Create HISTORY to hold events
const history = new openehr_rm.HISTORY();
// ... add events and data ...

observation.data = history;

// Add to COMPOSITION
composition.content = [observation];
```

## Link to Example Code

For complete working examples, see:
- `examples/basic-composition.ts` - Blood pressure recording with detailed comments
- `examples/simple-observation.ts` - Temperature recording (simpler variation)

These examples demonstrate:
- Creating a complete COMPOSITION from scratch
- Adding OBSERVATION entries with clinical data
- Working with data structures (HISTORY, POINT_EVENT, ITEM_TREE, ELEMENT)
- Using different data types (DV_QUANTITY, DV_TEXT, DV_CODED_TEXT, DV_DATE_TIME)

## Current Limitations

See the full project status in [roadmap.md](maintainers/roadmap.md) ([GitHub](https://github.com/ErikSundvall/ehrtslib/blob/main/docs/maintainers/roadmap.md)).

**What's Available:**
- Complete BASE, RM, LANG, and AM package implementations
- ADL2/ADL 1.4 parsing, template flattening, and file-based archetype repository
- Template and archetype validation (`TemplateValidator`, `ArchetypeValidator`, `InvariantEvaluator`)
- Brief property styles with constructor initialization and terse formats ([Brief property styles](user/brief-property-styles.md))
- Canonical JSON serialization plus FLAT/STRUCTURED simplified formats ([SIMPLIFIED_FORMATS.md](SIMPLIFIED_FORMATS.md))
- Demo app: template upload, conversion, RM instance / TypeScript stub generation, and **bidirectional** FLAT/STRUCTURED (see [SIMPLIFIED_FORMATS.md](SIMPLIFIED_FORMATS.md#demo-app))

**What's Not Yet Available (or still maturing):**
- Packaged `/dist` builds (minified browser bundles, web components) — Phase X
- Full ADL 1.4 AOM round-trip parity and OPT2 round-trip — Phases 6b / 8b+
- Constructor initialization on every RM class (e.g. `DV_QUANTITY`, `DV_DATE_TIME` still use manual property assignment)
- Turnkey “fill a form, get a valid composition” API — complex trees still need manual assembly or template tooling

**Current Approach:**
You can build COMPOSITION trees manually (verbose or brief property styles), generate instances from operational templates (`RMInstanceGenerator`), validate against templates, and serialize to canonical JSON or simplified FLAT/STRUCTURED formats. For the interactive workflow, use the demo app under `examples/demo-app/`.

## Next Steps

1. Review the example files in `examples/`
2. Understand the openEHR specifications at https://specifications.openehr.org/
3. Start with simple COMPOSITION structures
4. Refer to [roadmap.md](maintainers/roadmap.md) for upcoming features
5. Check the openEHR specification documentation for detailed class definitions

## Running Examples

To run an example with Deno:

```bash
deno run examples/basic-composition.ts
```

The examples will:
- Create a COMPOSITION object tree
- Print a summary of the structure
- Demonstrate the manual construction process

## Getting Help

- openEHR Specifications: https://specifications.openehr.org/
- openEHR Community: https://discourse.openehr.org/
- Project Issues: Submit issues on the GitHub repository
- Reference Implementation: Check Archie (Java) for comparison: https://github.com/openEHR/archie

## Summary

ehrtslib provides complete implementations of openEHR RM, BASE, LANG, and AM packages, with template validation, brief property styles, and FLAT/STRUCTURED serialization. Complex clinical trees can still be verbose to assemble by hand; see [roadmap.md](maintainers/roadmap.md) for distribution builds and remaining ADL/OPT round-trip work.
