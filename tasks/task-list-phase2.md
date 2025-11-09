# Task List for Phase 2: TypeScript Library Generation from Latest BMM JSON

This document outlines the tasks required to implement Phase 2 of the `ehrtslib` project, as defined in `tasks/prd-typescript-library-generation-phase2.md`.

## High-Level Tasks:

*   **Setup & Archiving:**
    *   Archive Phase 1 output to a dedicated subdirectory.
    *   Create a `README.md` in the Phase 1 archive subdirectory explaining its generation.
*   **BMM Acquisition & Selection:**
    *   Develop a mechanism to parse openEHR BMM JSON files from the specified GitHub repository.
    *   Implement logic to identify and select the latest SemVer version of each BMM library.
*   **TypeScript Code Generation:**
    *   Implement core logic for generating TypeScript classes and interfaces from BMM specifications.
    *   Integrate JSDoc generation from BMM documentation strings.
    *   Ensure strict adherence to snake_case naming conventions and capitalization.
    *   Implement package-based file organization (one TS file per BMM package).
*   **Testing & Quality:**
    *   Develop unit tests for the generated TypeScript libraries.
    *   Ensure traceability between generated code and BMM elements.
*   **Research & Clarification:**
    *   Utilize the Deepwiki MCP server for any questions or clarifications needed about the openEHR BMM files. This should be done using the official clients (`@modelcontextprotocol/sdk` or `fastmcp`) as outlined in `AGENTS.md`.

## Detailed Tasks (derived from FRs and NFRs):

### Functional Requirements (FRs):

*   **FR1: BMM Parsing:**
    *   Task: Implement a BMM JSON parser capable of reading and interpreting the structure of openEHR BMM JSON files.
    *   Task: Handle potential variations or complexities within the BMM JSON structure.
*   **FR2: Latest Version Selection:**
    *   Task: Develop a function to list all BMM JSON files for a given library (e.g., `openehr_base`) from the source repository.
    *   Task: Implement SemVer comparison logic to determine the latest version among multiple BMM files for the same library.
    *   Task: Filter out older BMM versions, ensuring only the latest is processed.
*   **FR3: TypeScript Code Generation:**
    *   Task: Design a mapping strategy from BMM concepts (classes, attributes, types) to TypeScript constructs (classes, interfaces, properties, types).
    *   Task: Implement code generation templates or logic for creating TypeScript class definitions.
    *   Task: Implement code generation for TypeScript interface definitions.
    *   Task: Implement code generation for TypeScript enum definitions (if applicable in BMM).
    *   Task: Ensure correct TypeScript type mapping for BMM primitive and complex types.
*   **FR4: JSDoc Integration:**
    *   Task: Identify and extract documentation fields from the BMM JSON for classes, attributes, and other relevant elements.
    *   Task: Format extracted documentation into valid JSDoc comments.
    *   Task: Embed JSDoc comments into the generated TypeScript code at appropriate locations.
*   **FR5: Naming Convention Adherence:**
    *   Task: Implement strict snake_case conversion for BMM element names to TypeScript identifiers.
    *   Task: Ensure capitalization rules from BMM are preserved in generated TypeScript.
*   **FR6: Package-based File Organization:**
    *   Task: Develop a strategy to group BMM elements by their package.
    *   Task: Implement logic to write all TypeScript code for a single BMM package into a single `.ts` file.
    *   Task: Define a clear output directory structure for the generated package files.
*   **FR7: Phase 1 Output Archiving:**
    *   Task: Create a new subdirectory (e.g., `phase1_archive`) in the project root.
    *   Task: Move all generated files from the previous Phase 1 into this `phase1_archive` directory.
*   **FR8: Phase 1 README Generation:**
    *   Task: Create a `README.md` file within the `phase1_archive` directory.
    *   Task: Document the generation process of the Phase 1 output within this `README.md`.

### Non-Functional Requirements (NFRs):

*   **NFR1: Performance:**
    *   Task: Optimize BMM parsing and TypeScript generation for efficiency.
    *   Task: Profile the generation process to identify and address performance bottlenecks.
*   **NFR2: Maintainability:**
    *   Task: Design the code generation system with modular components for easy updates.
    *   Task: Document the code generation logic for future maintenance.
*   **NFR3: Testability:**
    *   Task: Ensure the generated TypeScript code is structured in a way that facilitates unit testing.
*   **NFR4: Traceability:**
    *   Task: Implement mechanisms (e.g., comments, metadata) in the generated code to link back to original BMM elements.
