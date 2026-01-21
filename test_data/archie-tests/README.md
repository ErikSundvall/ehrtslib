# Archie Test Data

## Source and Attribution

This directory contains test data and test cases adapted from the **openEHR Archie project**.

**Original Source:** https://github.com/openEHR/archie  
**License:** Apache License 2.0  
**Copyright:** © 2017-2024 openEHR Foundation and contributors

### About Archie

Archie is the official Java-based openEHR library that implements:
- ADL2 parsing and validation
- Archetype Object Model (AOM)
- Reference Model (RM) implementations
- Archetype and template validation

### Test Data Attribution

The ADL2 test files in this directory (*.adls files) are sourced from:
- `archie/tools/src/test/resources/adl2-tests/`

These files serve as reference test data to ensure ehrtslib's ADL2 parser and validation framework are compatible with the official openEHR specifications and behave consistently with Archie.

### Test Approach Inspiration

The test patterns and validation algorithms in ehrtslib's test suite are inspired by Archie's comprehensive test methodology, including:
- Primitive constraint validation (from `PrimitivesConstraintParserTest.java`)
- Occurrence validation
- Terminology validation
- Basic structure parsing
- Error handling patterns

### Modifications

Test files are used as-is from Archie where possible. Test cases in ehrtslib are:
- Adapted to TypeScript/Deno syntax
- Modified to work with ehrtslib's API
- Extended with additional ehrtslib-specific features
- Documented with references to original Archie test patterns

### License Compliance

Both Archie and ehrtslib use the Apache License 2.0, ensuring compatibility. All test data includes proper attribution to the original openEHR project and Archie contributors.

### References

- **Archie Repository:** https://github.com/openEHR/archie
- **openEHR Specifications:** https://specifications.openehr.org/
- **ADL2 Specification:** https://specifications.openehr.org/releases/AM/latest/ADL2.html
- **AOM2 Specification:** https://specifications.openehr.org/releases/AM/latest/AOM2.html

## Test Data Organization

- `primitives/` - Primitive constraint tests (strings, integers, reals, booleans, dates, times)
- `basics/` - Basic ADL2 structure and minimal archetype tests
- `structures/` - Complex nested structures and cardinality tests
- `terminology/` - Terminology binding and code validation tests

## Usage in Tests

These test files are used in:
- `tests/parser/archie_compatibility.test.ts` - Parser compatibility tests
- `tests/validation/archie_validation.test.ts` - Validation compatibility tests

This ensures ehrtslib implements the ADL2 and AOM2 specifications correctly and maintains compatibility with the wider openEHR ecosystem.
