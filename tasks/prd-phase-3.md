# PRD: Phase 3 - Deep Comparison and Behavior Implementation

## 1. Introduction/Overview

This document outlines the requirements for Phase 3 of the `ehrtslib` project. The previous phase focused on generating TypeScript class skeletons from BMM files. This phase aims to verify the correctness of these skeletons, implement the missing behavior within the classes, and create a comprehensive test suite. The goal is to ensure that the generated TypeScript libraries are a correct and robust implementation of the openEHR specification.

## 2. Goals

*   Verify the generated TypeScript class skeletons against the openEHR specification and other existing implementations.
*   Implement the missing business logic and behavior within the generated classes.
*   Create a comprehensive test suite to ensure the correctness of the implementation.
*   Improve the JSDoc documentation for all classes.
*   Identify and document any inconsistencies found between different openEHR implementations and the official specification.

## 3. User Stories

*   As a developer using the `ehrtslib` library, I want to be confident that the classes and methods are a correct implementation of the openEHR specification, so that I can build reliable applications on top of it.
*   As a developer using the `ehrtslib` library, I want to have clear and comprehensive JSDoc documentation, so that I can easily understand how to use the library.
*   As a contributor to the `ehrtslib` project, I want to have a clear set of instructions for implementing the missing behavior in the classes, so that I can contribute effectively.
*   As a contributor to the `ehrtslib` project, I want to have a comprehensive test suite, so that I can verify that my changes are correct and do not introduce any regressions.

## 4. Functional Requirements

1.  **Verification of Class Skeletons:**
    1.1. The existing TypeScript class skeletons must be compared against the official openEHR specification documents.
    1.2. The class skeletons must be compared against other openEHR implementations, such as `openEHR/archie`.
    1.3. Any discrepancies in method signatures, generics, or class structure must be corrected in the class generators (`generate_ts_libs.ts` and `ts_generator.ts`).

2.  **Behavior Implementation:**
    2.1. A systematic way to record missing behavior for each class must be designed.
    2.2. For each class, an instruction file (e.g., `DV_TEXT.md`) must be created in a directory structure that mirrors the package structure.
    2.3. These instruction files must contain detailed information on how to implement the missing behavior, including code snippets and pseudo-code.
    2.4. The instruction files must include references (web links) to the sources used.

3.  **Test Suite Generation:**
    3.1. A corresponding test suite file must be generated for each package.
    3.2. These test suites must be executable by Deno.
    3.3. The tests should verify the implemented behavior.
    3.4. Tests from other openEHR implementations should be translated and included in the test suite.

4.  **JSDoc Documentation:**
    4.1. The JSDoc documentation for each class must be improved.
    4.2. The documentation should include links to the corresponding section in the openEHR specification documents.

5.  **Inconsistency Reporting:**
    5.1. A file named `INCONSISTENCIES.md` must be created.
    5.2. Any inconsistencies found between different openEHR implementations or between an implementation and the specification must be documented in this file.
    5.3. For each inconsistency, the chosen interpretation for the `ehrtslib` implementation and the reasoning behind it must be documented.

## 5. Non-Goals (Out of Scope)

*   This phase will not cover the implementation of serialization or deserialization of RM object instance trees (Phase 4).
*   This phase will not cover the creation of simplified openEHR template specific forms (Phase 5).
*   This phase will not cover the implementation of serialization or deserialization to simplified JSON formats (Phase 6).

## 6. Design Considerations

*   The instruction files for behavior implementation should be clear and detailed enough for a junior developer or an AI agent with a limited context window to understand and implement.
*   The test suite should be well-structured and easy to extend.

## 7. Technical Considerations

*   The project will continue to use Deno for task management and execution.
*   The Deepwiki MCP server should be used to gather information about the openEHR specifications and other implementations.

## 8. Success Metrics

*   All generated TypeScript classes are verified against the openEHR specification and at least one other reference implementation.
*   Instruction files for implementing the missing behavior are created for all major classes in the RM package.
*   A comprehensive test suite is created that covers the implemented behavior.
*   The JSDoc documentation for all classes is updated and includes links to the specification.
*   The `INCONSISTENCIES.md` file is created and populated with any found inconsistencies.

## 9. Open Questions

*   Are there any specific parts of the openEHR specification that should be prioritized for implementation?
*   Are there any preferences for the structure of the instruction files?
