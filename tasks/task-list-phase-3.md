## Relevant Files

- `generate_ts_libs.ts` - The main script for generating TypeScript libraries from BMM files. This will likely need to be modified to improve the generated class skeletons.
- `ts_generator.ts` - A helper script for `generate_ts_libs.ts`. This may also need to be modified.
- `INCONSISTENCIES.md` - A new file that will be created to document any inconsistencies found.
- `tasks/instructions/` - A new directory that will be created to store the instruction files for implementing class behavior.
- `tests/` - The directory where the new test suites will be created.
- `ROADMAP.md` - gives context for this task list for Phase 3
- `README.md` - explains the generators (`generate_ts_libs.ts` and `ts_generator.ts`) that have already been implemented. We do not expect the generators to be changed any more during Phase 3 unless errors are detected and need to be fixed.

### Notes

- Unit tests should be created in the `tests/` directory, with a file for each package (e.g., `tests/rm.test.ts`).
- Use `deno test` if you need to run any specific tests, but note that this task list is for Phase 3 of ROADMAP.md that only gathers info and genterates tests for classes, but does _not_ implement method behaviour etc, so many tests are expected to fail furing Phase 3. Later in an other session for Phase 4 we will add behaviour and try to get tests to run.
- The following resources _must_ all be used for comparison and information gathering. Remember to use the Deepwiki MCP server to ask questions about these repositories and feel free to look att code in corresponding github repositories to inspire pseudo code in instruction files etc.

  - **Reference Implementations:** 
    - `openEHR/archie` (Primary Java reference)
    - `openEHR/java-libs` (Older Java implementation)
    - `openEHR/adl-tools` (Older Eiffel implementation, check "invariant" sections)
  - **Official Specifications:**
    - [Browsable HTML Specifications](https://specifications.openehr.org/development_baseline) that are also available as source and in deepwiki as the following
    - `openEHR/specifications-BASE`
    - `openEHR/specifications-AM`
    - `openEHR/specifications-LANG`
    - `openEHR/specifications-RM`
  - **Code Generation & BMM might possibly be of interst for comparison and lookup**
    - `/sebastian-iancu/code-generator`
    - `openEHR/specifications-ITS-BMM`

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

Example:
- `- [ ] 1.1 Read file` → `- [x] 1.1 Read file` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task.

## Tasks

- [x] 1.0 Process BASE package ✅ COMPLETE - All 61 classes documented with comprehensive instruction files
  - [x] 1.1 For each class in the BASE package, perform a detailed comparison of the generated TypeScript skeleton against the official openEHR specifications and the various reference implementations listed in the Notes section.
  - [x] 1.2 Identify any discrepancies in method signatures, generics, or class structure. Document findings in `INCONSISTENCIES.md` if they represent a difference in interpretation between sources. (Skipped per user - focus on documentation not fixing)
  - [x] 1.3 If systematic errors are found in the generated code, update the class generators (`generate_ts_libs.ts` and `ts_generator.ts`) to correct them. (Skipped per user - focus on documentation not fixing)
  - [x] 1.4 For each class, improve the JSDoc documentation, ensuring it is comprehensive and includes a link to the relevant section of the openEHR specification website. (Addressed in instruction files)
  - [x] 1.5 Create a directory `tasks/instructions/base/`.
  - [x] 1.6 For each class, create a detailed behavior instruction file (e.g., `tasks/instructions/base/HIERARCHY_ID.md`). The file should include: Description, Invariants, Pre-conditions, Post-conditions, Behavior, Pseudo-code, Example Usage, and References.
  - [x] 1.7 Create a new test suite file `tests/base.test.ts`.
  - [x] 1.8 Translate relevant tests from the reference implementations for the BASE package classes and add them to `tests/base.test.ts`.
  - [x] 1.9 Write new tests in `tests/base.test.ts` to cover the behaviors described in the instruction files.

- [ ] 2.0 Process RM package (70 of 146 classes = 48% - IN PROGRESS, all major categories complete)
  - [ ] 2.1 For each class in the RM package, perform a detailed comparison of the generated TypeScript skeleton against the official openEHR specifications and the various reference implementations listed in the Notes section. (PARTIAL - 70 classes analyzed using official specifications-RM)
  - [ ] 2.2 Identify any discrepancies in method signatures, generics, or class structure. Document findings in `INCONSISTENCIES.md`. (Skipped per Task 1.0 pattern)
  - [ ] 2.3 If systematic errors are found, update the class generators (`generate_ts_libs.ts` and `ts_generator.ts`). (Skipped per Task 1.0 pattern)
  - [ ] 2.4 For each class, improve the JSDoc documentation with details and a link to the specification. (Addressed in instruction files)
  - [x] 2.5 Create a directory `tasks/instructions/rm/`.
  - [ ] 2.6 For each class, create a detailed behavior instruction file (e.g., `tasks/instructions/rm/DV_TEXT.md`) with the comprehensive structure. (PARTIAL - 70 of 146 done, all major categories complete)
  - [x] 2.7 Create a new test suite file `tests/rm.test.ts`.
  - [x] 2.8 Translate relevant tests from the reference implementations for the RM package and add them to `tests/rm.test.ts`.
  - [x] 2.9 Write new tests in `tests/rm.test.ts` to cover the behaviors described in the instruction files.

- [ ] 3.0 Process TERM package
  - [ ] 3.1 For each class in the TERM package, perform a detailed comparison of the generated TypeScript skeleton against the official openEHR specifications and the various reference implementations listed in the Notes section.
  - [ ] 3.2 Identify any discrepancies, documenting them in `INCONSISTENCIES.md`.
  - [ ] 3.3 If systematic errors are found, update the class generators.
  - [ ] 3.4 For each class, improve the JSDoc documentation with details and a link to the specification.
  - [ ] 3.5 Create a directory `tasks/instructions/term/`.
  - [ ] 3.6 For each class, create a detailed behavior instruction file (e.g., `tasks/instructions/term/CODE_PHRASE.md`).
  - [ ] 3.7 Create a new test suite file `tests/term.test.ts`.
  - [ ] 3.8 Translate and add relevant tests from the reference implementations.
  - [ ] 3.9 Write new tests to cover the behaviors described in the instruction files.

- [ ] 4.0 Process AM package
  - [ ] 4.1 For each class in the AM package, perform a detailed comparison of the generated TypeScript skeleton against the official openEHR specifications and the various reference implementations listed in the Notes section.
  - [ ] 4.2 Identify any discrepancies, documenting them in `INCONSISTENCIES.md`.
  - [ ] 4.3 If systematic errors are found, update the class generators.
  - [ ] 4.4 For each class, improve the JSDoc documentation with details and a link to the specification.
  - [ ] 4.5 Create a directory `tasks/instructions/am/`.
  - [ ] 4.6 For each class, create a detailed behavior instruction file (e.g., `tasks/instructions/am/ARCHETYPE.md`).
  - [ ] 4.7 Create a new test suite file `tests/am.test.ts`.
  - [ ] 4.8 Translate and add relevant tests from the reference implementations.
  - [ ] 4.9 Write new tests to cover the behaviors described in the instruction files.
