# Task List for Phase 2: TypeScript Library Generation from Latest BMM JSON

This document breaks down the work for Phase 2 into a logical sequence of tasks, designed to be easy to follow for a junior developer. The approach is to first develop and test the conversion logic using a single BMM package ('BASE') and then apply this logic to all BMM packages.

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps. 
Example:
- `- [ ] 1.1 Read file` → `- [x] 1.1 Read file` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task. If implementation steps happen to fulfil several things at once then ticking off several boxes is OK.

If running in interactive mode (e.g. Gemini CLI) then stop after each parent task (milestone) and let user review. If running in autonomus batch mode e.g. dispatched to Jules, then just stop if user input is crucial in order to understand further steps.

## Milestone 1: Project Setup and Housekeeping

The goal of this milestone is to prepare the project for the new Phase 2 work and archive the results of Phase 1.

*   [x] **Task 1.1: Archive Phase 1 Output**
    *   **Goal:** Move the existing TypeScript files from Phase 1 into a separate directory to keep them for reference.
    *   **Steps:**
        1.  [x] Create a new directory named `from_old_bmm` in the root of the project.
        2.  [x] Move all the TypeScript files generated during Phase 1 into this new directory.
*   [x] **Task 1.2: Create README for Phase 1 Archive**
    *   **Goal:** Add a `README.md` file inside the `from_old_bmm` directory to explain what the code is and how it was generated.
    *   **Steps:**
        1.  [x] Create a new file named `README.md` inside the `from_old_bmm` directory.
        2.  [x] Write a brief explanation in the `README.md` file, stating that the code in this directory was generated from an older BMM variant and is kept for comparison purposes. The branch describing Jule's generation of these files using PHP is at https://github.com/ErikSundvall/code-generator/tree/feature-deno-library-generator (link to it)

## Milestone 2: Initial BMM Processing for 'BASE' Package

The goal of this milestone is to download and parse the BMM file for the 'BASE' package, which will serve as our test case for the initial development.

*   [x] **Task 2.1: Download 'BASE' BMM File**
    *   **Goal:** Download the latest version of the `openehr_base` BMM JSON file.
    *   **Steps:**
        1.  [x] Manually identify the URL for the latest version of the `openehr_base_*.bmm.json` file from the `sebastian-iancu/code-generator` GitHub repository.
        2.  [x] Write a simple script to download this single file and save it as `tasks/test_bmm.json`.
*   [x] **Task 2.2: Implement BMM JSON Reading and Traversal**
    *   **Goal:** Create a function that can read the `tasks/test_bmm.json` file and traverse its content.
    *   **Steps:**
        1.  [x] Write a function that takes a file path as input.
        2.  [x] Inside the function, use a standard JSON reader to parse the file content into a JavaScript object.
        3.  [x] Define TypeScript interfaces that represent the structure of the BMM JSON data to ensure type safety.
        4.  [x] Write a simple test to verify that the file can be read and parsed correctly.

## Milestone 3: Test-Driven Code Generation for 'BASE' Package

The goal of this milestone is to develop the TypeScript code generation logic, using the 'BASE' package as the test case.

*   [x] **Task 3.1: Generate a Single 'BASE' Class**
    *   **Goal:** Write a function that can generate a TypeScript class for a single, simple class from the 'BASE' BMM data.
    *   **Steps:**
        1.  [x] Choose a simple class from the `tasks/test_bmm.json` data.
        2.  [x] Write a function that takes the BMM data for this single class and generates a TypeScript class as a string.
        3.  [x] Write a test that calls this function and verifies that the generated string is a valid TypeScript class.
*   [x] **Task 3.2: Implement JSDoc Integration**
    *   **Goal:** Enhance the generated class with JSDoc comments.
    *   **Steps:**
        1.  [x] Modify the function from the previous task to extract the `documentation` field from the BMM data.
        2.  [x] Add the documentation as a JSDoc comment to the generated class.
        3.  [x] Update the test to verify that the JSDoc comment is present and correct.
*   [x] **Task 3.3: Implement Full 'BASE' Package Generation**
    *   **Goal:** Extend the logic to generate a complete TypeScript file for the entire 'BASE' package.
    *   **Steps:**
        1.  [x] Write a function that iterates over all the classes in the `tasks/test_bmm.json` data.
        2.  [x] For each class, call the generation function you created in the previous tasks.
        3.  [x] Concatenate the generated classes into a single string.
        4.  [x] Write the string to a file named `base.ts`.
        5.  [x] Write a test that verifies the `base.ts` file is created and contains the expected number of classes.

## Milestone 4: Batch Processing and Deterministic Conversion

The goal of this milestone is to generalize the logic developed for the 'BASE' package and create a deterministic Deno task that can process all BMM files.

*   [x] **Task 4.1: Identify Latest Versions of All BMM Packages**
    *   **Goal:** Create a script that identifies the latest version of all BMM packages.
    *   **Steps:**
        1.  [x] Write a script to fetch the list of all files from the `BMM-JSON` directory of the `sebastian-iancu/code-generator` repository.
        2.  [x] For each package, identify the latest version using SemVer comparison.
        3.  [x] Create a configuration file (e.g., `bmm_versions.json`) that stores the latest version for each BMM package.
*   [x] **Task 4.2: Create Deno Task for Batch Conversion**
    *   **Goal:** Create a Deno task that reads the `bmm_versions.json` file and runs the conversion process for each BMM package.
    *   **Steps:**
        1.  [x] Create a new Deno script (e.g., `tasks/generate_ts_libs.ts`).
        2.  [x] In this script, read the `bmm_versions.json` file.
        3.  [x] For each entry in the file, download the corresponding BMM JSON file.
        4.  [x] Call the code generation logic from Milestone 3 to generate the TypeScript library file for that package.
*   [x] **Task 4.3: Implement Inter-Package Dependency Handling**
    *   **Goal:** Modify the TypeScript generator to correctly handle dependencies between BMM packages by adding `import` statements to the generated files.
    *   **Steps:**
        1.  [x] **Create a Dependency Configuration File:**
            *   Create a new file named `tasks/bmm_dependencies.json`.
            *   Populate this file by analyzing the `includes` section of the BMM JSON files to determine the dependency graph. The script from Task 4.1 can be extended to automate this. The file should map each package to an array of packages it depends on.
            *   Example structure for `tasks/bmm_dependencies.json`:
                ```json
                {
                  "openehr_rm_1.0.4": ["openehr_base_1.3.0"],
                  "openehr_am_2.3.0": ["openehr_base_1.3.0", "openehr_rm_1.0.4"]
                }
                ```
        2.  [x] **Update the Generator to Use Dependencies:**
            *   Modify `tasks/generate_ts_libs.ts` to read `tasks/bmm_dependencies.json`.
            *   Update the code generation logic to process packages in the correct order, ensuring dependencies are generated before the packages that need them.
            *   For each generated file, add the necessary TypeScript `import` statements at the top, based on the dependencies. For example, `openehr_rm.ts` should import from `openehr_base.ts`.
        3.  [x] **Handle Type References:**
            *   Modify the generator to correctly resolve type references. When a class property refers to a type from another package (e.g., a `RM_ATTRIBUTE` in an `AM` package referring to a `DATA_VALUE` in the `RM` package), the generated code should prefix the type with the correct import alias (e.g., `rm.DATA_VALUE`).
*   [x] **Task 4.4: Document the Deno Task**
    *   **Goal:** Add clear instructions on how to run the Deno task.
    *   **Steps:**
        1.  [x] Update the main `README.md` file with a new section that explains how to run the Deno task.
        2.  [x] Include examples of how to run the task with different options.

## Milestone 5: Final Testing and Quality Assurance

The goal of this milestone is to ensure that all the generated TypeScript libraries are correct and of high quality.

*   [x] **Task 5.1: Develop Unit Tests for All Generated Libraries**
    *   **Goal:** Write unit tests for all the generated TypeScript libraries.
    *   **Steps:**
        1.  [x] Create a separate test file for each generated library.
        2.  [x] For each class in the library, write a test that verifies it can be instantiated and its properties have the correct types.
*   [x] **Task 5.2: Implement Traceability and compare to specifications**
    *   **Goal:** Add comments or other metadata to the generated code to make it easy to trace back to the original BMM file and to related openEHR specifications.
    *   **Steps:**
        1.  [x] In the code generation logic, add a comment at the top of each generated file that indicates which BMM file it was generated from.
        2.  [x] Consider adding a special tag (e.g., `@bmm_source`) in the JSDoc comments to link to the specific BMM element. (Was implemented as header comment with BMM version, revision, and source URL)
       