## Relevant Files

- `generate_ts_libs.ts` - The main script for generating TypeScript libraries from BMM files. This will likely need to be modified to improve the generated class skeletons.
- `ts_generator.ts` - A helper script for `generate_ts_libs.ts`. This may also need to be modified.
- `INCONSISTENCIES.md` - A new file that will be created to document any inconsistencies found.
- `tasks/instructions/` - A new directory that will be created to store the instruction files for implementing class behavior.
- `tests/` - The directory where the new test suites will be created.

### Notes

- Unit tests should be created in the `tests/` directory, with a file for each package (e.g., `tests/rm.test.ts`).
- Use `deno test` to run the tests.
- The following resources should be used for comparison and information gathering. Remember to use the Deepwiki MCP server to ask questions about these repositories.
  - **Code Generation & BMM:**
    - `/sebastian-iancu/code-generator`
    - `openEHR/specifications-ITS-BMM`
  - **Reference Implementations:**
    - `openEHR/archie` (Primary Java reference)
    - `openEHR/java-libs` (Older Java implementation)
    - `openEHR/adl-tools` (Older Eiffel implementation, check "invariant" sections)
  - **Official Specifications:**
    - [Browsable HTML Specifications](https://specifications.openehr.org/development_baseline)
    - `openEHR/specifications-BASE`
    - `openEHR/specifications-AM`
    - `openEHR/specifications-LANG`
    - `openEHR/specifications-RM`

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

Example:
- `- [ ] 1.1 Read file` → `- [x] 1.1 Read file` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task.

## Tasks

- [ ] 1.0 Process BASE package
  - [ ] 1.1 For each class in the BASE package, perform a detailed comparison of the generated TypeScript skeleton against the official openEHR specifications and the various reference implementations listed in the Notes section.
  - [ ] 1.2 Identify any discrepancies in method signatures, generics, or class structure. Document findings in `INCONSISTENCIES.md` if they represent a difference in interpretation between sources.
  - [ ] 1.3 If systematic errors are found in the generated code, update the class generators (`generate_ts_libs.ts` and `ts_generator.ts`) to correct them.
  - [ ] 1.4 For each class, improve the JSDoc documentation, ensuring it is comprehensive and includes a link to the relevant section of the openEHR specification website.
  - [ ] 1.5 Create a directory `tasks/instructions/base/`.
  - [ ] 1.6 For each class, create a detailed behavior instruction file (e.g., `tasks/instructions/base/HIERARCHY_ID.md`). The file should include: Description, Invariants, Pre-conditions, Post-conditions, Behavior, Pseudo-code, Example Usage, and References.
  - [ ] 1.7 Create a new test suite file `tests/base.test.ts`.
  - [ ] 1.8 Translate relevant tests from the reference implementations for the BASE package classes and add them to `tests/base.test.ts`.
  - [ ] 1.9 Write new tests in `tests/base.test.ts` to cover the behaviors described in the instruction files.

- [ ] 2.0 Process RM package
  - [ ] 2.1 For each class in the RM package, perform a detailed comparison of the generated TypeScript skeleton against the official openEHR specifications and the various reference implementations listed in the Notes section.
  - [ ] 2.2 Identify any discrepancies in method signatures, generics, or class structure. Document findings in `INCONSISTENCIES.md`.
  - [ ] 2.3 If systematic errors are found, update the class generators (`generate_ts_libs.ts` and `ts_generator.ts`).
  - [ ] 2.4 For each class, improve the JSDoc documentation with details and a link to the specification.
  - [ ] 2.5 Create a directory `tasks/instructions/rm/`.
  - [ ] 2.6 For each class, create a detailed behavior instruction file (e.g., `tasks/instructions/rm/DV_TEXT.md`) with the comprehensive structure.
  - [ ] 2.7 Create a new test suite file `tests/rm.test.ts`.
  - [ ] 2.8 Translate relevant tests from the reference implementations for the RM package and add them to `tests/rm.test.ts`.
  - [ ] 2.9 Write new tests in `tests/rm.test.ts` to cover the behaviors described in the instruction files.

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
