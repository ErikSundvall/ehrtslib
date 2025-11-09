# Product Requirements Document (PRD) for ehrtslib - Phase 2: TypeScript Library Generation from Latest BMM JSON

## 1. Introduction
This document outlines the requirements for Phase 2 of the `ehrtslib` project, focusing on generating TypeScript libraries from the latest openEHR Basic Meta-Model (BMM) JSON specifications. This phase aims to improve the accuracy and completeness of the generated libraries by utilizing more information-rich BMM variants and incorporating comprehensive documentation.

## 2. Goals
*   To generate accurate and up-to-date TypeScript libraries for openEHR (RM, TERM, AM) based on the latest BMM JSON specifications.
*   To enhance the usability of the generated libraries by including comprehensive JSDoc documentation derived from the BMMs.
*   To establish a clear separation between the output of Phase 1 and Phase 2, allowing for comparison and historical context.

## 3. Scope

### 3.1. In-Scope
*   **BMM Source:** Utilize openEHR BMM JSON files from `https://github.com/sebastian-iancu/code-generator/tree/master/code/BMM-JSON/`.
*   **Version Selection:** For each library, only the latest SemVer version of the BMM JSON file will be used (e.g., `openehr_base_1.3.0.bmm.json` over older versions).
*   **TypeScript Generation:** Generate TypeScript classes and interfaces corresponding to the BMM specifications.
*   **Documentation Integration:** Extract and integrate all available documentation from the BMM JSON files into the generated TypeScript code using JSDoc comments.
*   **Output Structure:**
    *   The output of Phase 1 will be moved to a dedicated subdirectory.
    *   A `README.md` file will be added to this subdirectory, explaining how the Phase 1 output was generated.
    *   The new Phase 2 TypeScript libraries will reside in a separate, clearly defined location.
*   **Naming Conventions:** Maintain exact snake_case class and method names and capitalization as specified in the BMM.
*   **File Structure:** Keep classes of the same package in the same TypeScript file (one file per package).

### 3.2. Out-of-Scope
*   Migration of existing code to use the new Phase 2 libraries.
*   Backward compatibility with Phase 1 generated libraries (beyond keeping them for comparison).
*   Generation of code for BMM versions older than the latest SemVer.
*   Any manual modifications to the generated TypeScript code.

## 4. Functional Requirements

*   **FR1: BMM Parsing:** The system shall be able to parse openEHR BMM JSON files from the specified GitHub repository.
*   **FR2: Latest Version Selection:** The system shall automatically identify and select the latest SemVer version of each BMM library for code generation.
*   **FR3: TypeScript Code Generation:** The system shall generate valid TypeScript code (classes, interfaces, enums, etc.) that accurately reflects the structure and types defined in the selected BMM JSON files.
*   **FR4: JSDoc Integration:** The system shall extract documentation strings from the BMM JSON files and embed them as JSDoc comments within the corresponding generated TypeScript code.
*   **FR5: Naming Convention Adherence:** The generated TypeScript code shall strictly adhere to the snake_case naming conventions and capitalization found in the BMM specifications.
*   **FR6: Package-based File Organization:** The generated TypeScript code shall organize classes and interfaces such that all elements belonging to the same BMM package reside within a single TypeScript file.
*   **FR7: Phase 1 Output Archiving:** The system shall move the previously generated Phase 1 TypeScript libraries into a designated subdirectory.
*   **FR8: Phase 1 README Generation:** The system shall create a `README.md` file within the Phase 1 archive subdirectory, detailing the generation process of its contents.

## 5. Non-Functional Requirements

*   **NFR1: Performance:** The code generation process should be reasonably efficient, capable of processing all required BMM JSON files within an acceptable timeframe.
*   **NFR2: Maintainability:** The code generation logic should be modular and easy to update as BMM specifications evolve.
*   **NFR3: Testability:** The generated TypeScript libraries should be easily testable.
*   **NFR4: Traceability:** It should be clear which parts of the generated TypeScript code correspond to which elements in the original BMM JSON.

## 6. Dependencies

### 6.1. Deepwiki MCP Server
For information and clarification regarding the openEHR BMM files, the Deepwiki MCP server should be utilized. All interactions with this server must be conducted using the official clients, as specified in the `AGENTS.md` file:
*   **TypeScript:** `@modelcontextprotocol/sdk`
*   **Python:** `fastmcp`

Direct HTTP calls or unofficial scripts are not to be used.

## 7. Open Questions

*   Are there any specific tools or libraries preferred for parsing the BMM JSON files?
*   What is the desired subdirectory name for archiving Phase 1 output?
*   What is the desired output directory for the new Phase 2 libraries?
*   Are there any specific formatting or linting rules to apply to the generated TypeScript code?
