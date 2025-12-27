# ehrtslib Examples

This directory contains examples demonstrating how to use ehrtslib to create openEHR COMPOSITION objects.

## Available Examples

### basic-composition.ts
A complete example showing how to create a blood pressure recording COMPOSITION.

**Demonstrates:**
- Creating a COMPOSITION with all required properties using **both simplified and manual approaches**
- Simplified creation with constructor initialization and terse format
- Adding an OBSERVATION with HISTORY and POINT_EVENT
- Using ITEM_TREE and ELEMENT to structure data
- Working with DV_QUANTITY for measurements
- Proper setup of language, territory, category, composer, and context

**To run:**
```bash
deno run examples/basic-composition.ts
```

**Output:**
Prints summaries of two equivalent COMPOSITIONs created using different approaches, including the blood pressure measurements (systolic: 120 mm[Hg], diastolic: 80 mm[Hg]).

### simple-observation.ts
A simpler variation showing a temperature recording with **both simplified and manual approaches**.

**Demonstrates:**
- Same COMPOSITION structure as basic-composition but with different values
- Using DV_QUANTITY for temperature (Cel)
- A single measurement instead of multiple values
- Comparison between simplified and manual creation patterns

**To run:**
```bash
deno run examples/simple-observation.ts
```

**Output:**
Prints summaries of two equivalent COMPOSITIONs showing the temperature measurement (37.2 Cel).

## Key Concepts Illustrated

Both examples demonstrate **two approaches** for creating openEHR objects:

### 1. Simplified Approach - **Recommended for most code**

- **Constructor initialization** with nested objects
- **Terse format** for CODE_PHRASE and DV_CODED_TEXT
- **~70% code reduction** compared to manual approach
- Full type safety with TypeScript inference
- Backward compatible

Example:
```typescript
const composition = new COMPOSITION({
  archetype_node_id: "openEHR-EHR-COMPOSITION.encounter.v1",
  name: "Blood Pressure Recording",
  language: "ISO_639-1::en",           // Terse format
  territory: "ISO_3166-1::GB",         // Terse format
  category: "openehr::433|event|",     // Terse format
  composer: { name: "Dr. Smith" }      // Nested initialization
});
```

### 2. Manual Approach (Traditional) - **Still fully supported**

- Explicit object instantiation and property assignment
- Fine-grained control over object creation
- Useful for complex scenarios and debugging
- Traditional approach that continues to work

Example:
```typescript
const composition = new COMPOSITION();
const language = new CODE_PHRASE();
const languageTermId = new TERMINOLOGY_ID();
languageTermId.value = "ISO_639-1";
language.terminology_id = languageTermId;
language.code_string = "en";
composition.language = language;
```

## Core Concepts

1. **COMPOSITION Setup**: Creating the root container with required properties
2. **OBSERVATION Creation**: Building an observation entry with proper metadata
3. **HISTORY Structure**: Using HISTORY > POINT_EVENT > ITEM_TREE > ELEMENT hierarchy
4. **Data Types**: Working with DV_TEXT, DV_QUANTITY, DV_CODED_TEXT, DV_DATE_TIME
5. **Identifiers**: Using CODE_PHRASE, TERMINOLOGY_ID, ARCHETYPE_ID, OBJECT_VERSION_ID
6. **Terse Format**: Compact string representation for coded terms
7. **Constructor Initialization**: Creating objects with all properties upfront

## Current Status & Future Development

**Available Now:**
- Simplified object creation with constructor initialization
- Terse format parsing for CODE_PHRASE and DV_CODED_TEXT
- Type-safe nested object initialization
- ~70% code reduction for typical use cases

**Coming Soon:**
- Template validation (Phase 5b)
- Archetype Model (AM) package (Phase 5a)
- Serialization/deserialization (Phase 4g)
- Template-based creation that ensures valid structures
- Automatic validation against archetypes

## Using These Examples

### As Learning Material
Study the examples to understand:
- Which properties are required vs. optional
- How to structure nested objects
- Proper use of openEHR data types
- The relationship between COMPOSITION, OBSERVATION, HISTORY, EVENT, and data structures
- **How simplified creation patterns reduce boilerplate**
- **When to use terse format vs. object initialization**

### As Starting Points
Copy and modify these examples for your own COMPOSITION structures:
1. Start with one of the examples
2. Choose simplified or manual approach (or mix both!)
3. Change the archetype IDs to match your needs
4. Modify the data elements and values
5. Adjust the metadata (language, territory, composer, etc.)

### As Reference
Use these examples to:
- Look up the syntax for creating specific objects
- Understand property naming conventions
- See working examples of data type usage
- **Learn terse format syntax** (e.g., `"ISO_639-1::en"`, `"openehr::433|event|"`)
- **Compare simplified vs. manual approaches** side-by-side

## Documentation References

- **SIMPLIFIED-CREATION-GUIDE.md** - Comprehensive guide to simplified object creation
- **DUAL-APPROACH-GUIDE.md** - Explains the dual getter/setter pattern that enables simplified creation
- **docs/getting-started.md** - Introduction to ehrtslib
- **ROADMAP.md** - Project roadmap and upcoming features

## Template Information

The examples are based on common openEHR archetypes:
- `openEHR-EHR-COMPOSITION.encounter.v1` - General encounter composition
- `openEHR-EHR-OBSERVATION.blood_pressure.v2` - Blood pressure observation
- `openEHR-EHR-OBSERVATION.body_temperature.v2` - Body temperature observation

See `templates/README.md` for more information about the archetypes and their structure.

## Next Steps

1. Read `docs/getting-started.md` for an introduction to ehrtslib
2. Run the examples to see them in action
3. Try modifying the examples to create your own COMPOSITION structures
4. Refer to the openEHR specifications for detailed archetype definitions
5. Check the ROADMAP.md for upcoming features

## Need Help?

- Review the getting started guide: `docs/getting-started.md`
- Check the openEHR specifications: https://specifications.openehr.org/
- Look at test files in `tests/enhanced/rm.test.ts` for more examples
- Refer to Archie (Java implementation) for comparison: https://github.com/openEHR/archie
