# Attribution to openEHR Archie Project

## Overview

This document provides attribution and acknowledgment to the **openEHR Archie project** for test data, test patterns, and validation algorithms that have been adapted for use in ehrtslib.

## Archie Project Information

- **Project Name:** Archie - openEHR Java Reference Implementation
- **Repository:** https://github.com/openEHR/archie
- **License:** Apache License 2.0
- **Copyright:** © 2017-2024 openEHR Foundation and contributors
- **Description:** Archie is the official Java-based openEHR library implementing ADL2 parsing, AOM2, and RM validation

## What We've Adapted

### 1. Test Data Files

Test data files from Archie's comprehensive ADL2 test suite have been copied to:
- `test_data/archie-tests/`

**Source Location in Archie:**
- `archie/tools/src/test/resources/adl2-tests/`

**Files Included:**
- Primitive constraint tests (strings, integers, reals, booleans, dates, times)
- Basic structure tests (minimal archetypes, whitespace handling)
- Complex nested structure tests
- Terminology binding tests (including SNOMED CT)

**Purpose:** These test files serve as reference data to ensure ehrtslib's ADL2 parser correctly implements the ADL2 specification and maintains compatibility with the wider openEHR ecosystem.

### 2. Test Patterns and Algorithms

Test patterns and validation approaches from Archie's test suite have inspired ehrtslib's tests:

**Parser Tests** (`tests/parser/archie_compatibility.test.ts`)
- Inspired by Archie's parser tests:
  - `PrimitivesConstraintParserTest.java`
  - `NumberConstraintParserTest.java`
  - `CStringParserTest.java`
  - `TemporalConstraintParserTest.java`
  
**Validation Tests** (`tests/validation/archie_validation.test.ts`)
- Inspired by Archie's validation framework:
  - `MultiplicityRMObjectValidationTest.java` - Occurrence and cardinality validation
  - `PrimitivesRMObjectValidationTest.java` - Primitive constraint validation
  - `RMInvariantValidationTest.java` - RM specification constraint validation
  - `DataValuesInvariantTest.java` - DV_* data type validation

### 3. Validation Algorithms

The validation framework in ehrtslib implements validation patterns inspired by Archie's RMObjectValidator:

- **Occurrence Validation:** Min/max occurrence constraints on attributes
- **Cardinality Validation:** Collection size constraints
- **Primitive Validation:** String patterns, integer/real ranges, boolean constraints
- **Interval Validation:** DV_INTERVAL bounds and ordering
- **RM Specification Validation:** RM-mandated constraints (e.g., COMPOSITION.category)
- **UCUM Unit Validation:** Unit validation for DV_QUANTITY
- **Terminology Validation:** DV_CODED_TEXT structure validation

## Differences and Extensions

While inspired by Archie, ehrtslib includes:

1. **TypeScript/Deno Implementation:** Native TypeScript with Deno runtime (vs. Java)
2. **Zero Runtime Dependencies:** Hand-written parsers guided by ANTLR grammars
3. **Additional Validators:** Extended validation capabilities beyond Archie's scope
4. **Integration with ehrtslib:** Designed to work with ehrtslib's existing type system and serialization

## Honesty in Attribution

We acknowledge that:

1. **Archie is the reference implementation:** Archie is the official Java-based openEHR library maintained by the openEHR Foundation
2. **Test data is sourced from Archie:** The ADL2 test files are copied directly from Archie's test suite
3. **Test patterns are inspired by Archie:** Our test structure and validation patterns follow Archie's proven approach
4. **We aim for compatibility:** ehrtslib strives to be compatible with Archie and the broader openEHR ecosystem

## License Compliance

Both Archie and ehrtslib use the **Apache License 2.0**, ensuring full compatibility. All adapted code and test data includes proper attribution to the original openEHR project and Archie contributors.

## References

- **Archie Repository:** https://github.com/openEHR/archie
- **openEHR Foundation:** https://www.openehr.org/
- **openEHR Specifications:** https://specifications.openehr.org/
- **ADL2 Specification:** https://specifications.openehr.org/releases/AM/latest/ADL2.html
- **AOM2 Specification:** https://specifications.openehr.org/releases/AM/latest/AOM2.html

## Acknowledgments

We thank the openEHR Foundation and all Archie contributors for:
- Maintaining the official Java reference implementation
- Providing comprehensive test data and test suites
- Documenting validation patterns and algorithms
- Supporting the openEHR ecosystem

**Special thanks to:**
- Pieter Bos (Lead Archie Developer)
- Thomas Beale (openEHR Foundation)
- All Archie contributors

## Contact

For questions about attribution or compatibility between ehrtslib and Archie:
- **ehrtslib:** https://github.com/ErikSundvall/ehrtslib
- **Archie:** https://github.com/openEHR/archie
- **openEHR:** https://www.openehr.org/contact

## Updates

This attribution will be kept up-to-date as more test data or patterns are adapted from Archie.

**Last Updated:** 2026-01-21
