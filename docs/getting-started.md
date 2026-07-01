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
- **openehr_am**: Archetype Model (future phases)

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

Here's the minimal code to create a COMPOSITION using [constructor initialization with nested objects](../SIMPLIFIED-CREATION-GUIDE.md#constructor-initialization) (see the [Simplified Object Creation Guide](../SIMPLIFIED-CREATION-GUIDE.md) for terse formats and more patterns):

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

ehrtslib uses a dual approach for properties:

```typescript
// Direct value access (for primitive wrappers like String, Integer)
const myString = new openehr_base.String();
myString.value = "hello";

// Getter/setter methods (for complex properties)
const dvText = new openehr_rm.DV_TEXT();
dvText.value = "some text";  // Direct property access
```

Most RM classes use direct property access for simplicity.

### Working with Data Types

ehrtslib includes specialized data types for clinical information:

**DV_TEXT** - Plain text:
```typescript
const text = new openehr_rm.DV_TEXT();
text.value = "Patient is well";
```

**DV_CODED_TEXT** - Coded terminology:
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

**DV_QUANTITY** - Numerical measurements:
```typescript
const quantity = new openehr_rm.DV_QUANTITY();
quantity.magnitude = 120.0;
quantity.units = "mm[Hg]";
```

**DV_DATE_TIME** - Date and time:
```typescript
const datetime = new openehr_rm.DV_DATE_TIME();
datetime.value = "2024-12-08T14:30:00";
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

**What's Available:**
- Complete BASE, RM, and LANG package implementations
- All core functionality for manual COMPOSITION creation
- Support for all openEHR data types and structures

**What's Not Yet Available:**
- Template validation - No automatic validation against openEHR templates yet
- Archetype validation - No validation that structures match archetype definitions
- AM package - Archetype Model support coming in future phases
- Simplified creation methods - Future phases will add template-based creation helpers
- Serialization - JSON/XML serialization/deserialization coming in Phase 4g

**Current Approach:**
You must manually construct COMPOSITION trees by creating each object and setting properties. While this works, it's verbose and error-prone. Future phases will add:
- Template-based creation that guides valid structure
- Automatic validation against templates and archetypes
- Simplified APIs for common patterns

## Next Steps

1. Review the example files in `examples/`
2. Understand the openEHR specifications at https://specifications.openehr.org/
3. Start with simple COMPOSITION structures
4. Refer to the ROADMAP.md for upcoming features
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

ehrtslib provides complete implementations of openEHR RM, BASE, and LANG packages. While currently requiring manual construction of COMPOSITION trees, it offers a solid foundation for working with openEHR data in TypeScript/Deno. Future phases will add template support, validation, and simplified creation methods.
