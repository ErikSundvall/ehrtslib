# ehrtslib Examples

This directory contains examples demonstrating how to use ehrtslib to create openEHR COMPOSITION objects.

## Available Examples

### basic-composition.ts
A complete example showing how to create a blood pressure recording COMPOSITION.

**Demonstrates:**
- Creating a COMPOSITION with all required properties
- Adding an OBSERVATION with HISTORY and POINT_EVENT
- Using ITEM_TREE and ELEMENT to structure data
- Working with DV_QUANTITY for measurements
- Proper setup of language, territory, category, composer, and context

**To run:**
```bash
deno run examples/basic-composition.ts
```

**Output:**
Prints a summary of the created COMPOSITION including the blood pressure measurements (systolic: 120 mm[Hg], diastolic: 80 mm[Hg]).

### simple-observation.ts
A simpler variation showing a temperature recording.

**Demonstrates:**
- Same COMPOSITION structure as basic-composition but with different values
- Using DV_QUANTITY for temperature (°C)
- A single measurement instead of multiple values

**To run:**
```bash
deno run examples/simple-observation.ts
```

**Output:**
Prints a summary showing the temperature measurement (37.2°C).

## Key Concepts Illustrated

Both examples demonstrate the manual construction approach required at this stage:

1. **COMPOSITION Setup**: Creating the root container with required properties
2. **OBSERVATION Creation**: Building an observation entry with proper metadata
3. **HISTORY Structure**: Using HISTORY > POINT_EVENT > ITEM_TREE > ELEMENT hierarchy
4. **Data Types**: Working with DV_TEXT, DV_QUANTITY, DV_CODED_TEXT, DV_DATE_TIME
5. **Identifiers**: Using CODE_PHRASE, TERMINOLOGY_ID, ARCHETYPE_ID, OBJECT_VERSION_ID

## Current Limitations

These examples use manual construction because:
- Template validation is not yet implemented (Phase 5b)
- Archetype Model (AM) package is not yet available (Phase 5a)
- Simplified creation APIs have not been added yet (Phase 4f)

Future phases will add:
- Template-based creation that ensures valid structures
- Automatic validation against archetypes
- Builder patterns or fluent APIs for easier construction

## Using These Examples

### As Learning Material
Study the examples to understand:
- Which properties are required vs. optional
- How to structure nested objects
- Proper use of openEHR data types
- The relationship between COMPOSITION, OBSERVATION, HISTORY, EVENT, and data structures

### As Templates
Copy and modify these examples for your own COMPOSITION structures:
1. Start with one of the examples
2. Change the archetype IDs to match your needs
3. Modify the data elements and values
4. Adjust the metadata (language, territory, composer, etc.)

### As Reference
Use these examples to:
- Look up the syntax for creating specific objects
- Understand property naming conventions
- See working examples of data type usage

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
