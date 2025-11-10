# Task List for Phase 2: TypeScript Library Generation from Latest BMM JSON

This document breaks down the work for Phase 2 into a logical sequence of tasks, designed to be easy to follow for a junior developer.

## Milestone 1: Project Setup and Housekeeping

The goal of this milestone is to prepare the project for the new Phase 2 work and archive the results of Phase 1.

*   [ ] **Task 1.1: Archive Phase 1 Output**
    *   **Goal:** Move the existing TypeScript files from Phase 1 into a separate directory to keep them for reference.
    *   **Steps:**
        1.  [ ] Create a new directory named `from_old_bmm` in the root of the project.
        2.  [ ] Move all the TypeScript files generated during Phase 1 into this new directory.
*   [ ] **Task 1.2: Create README for Phase 1 Archive**
    *   **Goal:** Add a `README.md` file inside the `from_old_bmm` directory to explain what the code is and how it was generated.
    *   **Steps:**
        1.  [ ] Create a new file named `README.md` inside the `from_old_bmm` directory.
        2.  [ ] Write a brief explanation in the `README.md` file, stating that the code in this directory was generated from an older BMM variant and is kept for comparison purposes. The branch describing Jule's generation of these files using PHP is at https://github.com/ErikSundvall/code-generator/tree/feature-deno-library-generator (link to it)

## Milestone 2: BMM JSON Data Acquisition and Processing

The goal of this milestone is to fetch the BMM JSON files from the remote repository and process them to extract the necessary information for code generation.

*   [ ] **Task 2.1: Identify Latest BMM Versions**
    *   **Goal:** Create a script that identifies the latest version of each BMM package from the `sebastian-iancu/code-generator` GitHub repository.
    *   **Steps:**
        1.  [ ] Write a script (e.g., a Deno task) to fetch the list of all files in the `BMM-JSON` directory of the `sebastian-iancu/code-generator` repository. The library is in https://github.com/sebastian-iancu/code-generator/tree/master/code/BMM-JSON
        2.  [ ] For each file name, extract the library name (e.g., `openehr_base`) and the version number (e.g., `1.3.0`). You can use regular expressions for this.
        3.  [ ] Group the file names by library name.
        4.  [ ] For each group, use a semantic versioning (SemVer) comparison library to find the file with the highest version number.
        5.  [ ] Create a configuration file (e.g., `bmm_versions.json`) that stores the latest version for each BMM package. This file will be used to download the correct files in later steps.
*   [ ] **Task 2.2: Download and Read BMM JSON Files**
    *   **Goal:** Create a script or function to download the latest version of each BMM JSON file (as defined in above generated configuration file) and read its content.
    *   **Steps:**
        1.  [ ] Read the `bmm_versions.json` configuration file to get the list of latest BMM files to download from .
        2.  [ ] For each file in the configuration, construct the download URL from the `sebastian-iancu/code-generator` repository. 
        3.  [ ] Download each such selected `.bmm.json` file and save it locally in a temporary directory (e.g., `tasks/bmm_json`).
        4.  [ ] Write a function that takes a file path to a BMM JSON file as input.
        5.  [ ] Inside the function, use a standard JSON reader to parse the file content into a JavaScript object.
        6.  [ ] Write logic to traverse the JSON tree and extract the necessary information (classes, properties, documentation, etc.).
        7.  [ ] Define TypeScript interfaces that represent the structure of the BMM JSON data to ensure type safety during traversal.

## Milestone 3: TypeScript Code Generation

The goal of this milestone is to take the processed BMM data and generate the corresponding TypeScript library files.

*   [ ] **Task 3.1: Design Code Generation Strategy**
    *   **Goal:** Plan how to map the different parts of the BMM data (classes, properties, etc.) to TypeScript code.
    *   **Steps:**
        1.  [ ] Create a mapping document that shows how each BMM element will be represented in TypeScript. For example:
            *   BMM `class` -> TypeScript `class`
            *   BMM `property` -> TypeScript `property`
            *   BMM `type` -> TypeScript `type`
        2.  [ ] Decide how to handle BMM inheritance in TypeScript (e.g., using `extends`).
*   [ ] **Task 3.2: Implement TypeScript Class Generation**
    *   **Goal:** Write a function that takes the parsed BMM data for a single class and generates a TypeScript class definition as a string.
    *   **Steps:**
        1.  [ ] Create a function that accepts a BMM class object.
        2.  [ ] Inside the function, build a string that represents the TypeScript class, including its name, properties, and any methods.
        3.  [ ] Pay close attention to the naming conventions (snake_case) and capitalization from the BMM.
*   [ ] **Task 3.3: Implement JSDoc Integration**
    *   **Goal:** Enhance the generated TypeScript code with JSDoc comments from the BMM data.
    *   **Steps:**
        1.  [ ] Modify the class generation function from the previous task.
        2.  [ ] For each class and property, check if there is a `documentation` field in the BMM data.
        3.  [ ] If there is, format it as a JSDoc comment and add it above the class or property in the generated TypeScript string.
*   [ ] **Task 3.4: Implement Package-based File Organization**
    *   **Goal:** Group the generated TypeScript classes into files based on their BMM package.
    *   **Steps:**
        1.  [ ] Create a function that takes all the parsed BMM data.
        2.  [ ] Group the BMM classes by their `package` property.
        3.  [ ] For each package, create a single TypeScript file.
        4.  [ ] Write all the generated TypeScript classes for that package into the file.
        5.  [ ] Define a clear output directory for these new TypeScript library files.

## Milestone 4: Deterministic Conversion Task

The goal of this milestone is to create a Deno task that can be run to perform the entire BMM-to-TypeScript conversion process without any AI involvement.

*   [ ] **Task 4.1: Create Deno Task for Conversion**
    *   **Goal:** Combine all the functions from the previous milestones into a single, runnable Deno task.
    *   **Steps:**
        1.  [ ] Create a new Deno script (e.g., `tasks/generate_ts_libs.ts`).
        2.  [ ] In this script, import and call the functions you created for:
            *   [ ] Fetching the BMM JSON files.
            *   [ ] Selecting the latest versions.
            *   [ ] Parsing the BMM data.
            *   [ ] Generating the TypeScript code.
            *   [ ] Writing the code to files.
        3.  [ ] Add command-line arguments to the Deno task to allow for customization (e.g., specifying the output directory).
*   [ ] **Task 4.2: Document the Deno Task**
    *   **Goal:** Add clear instructions on how to run the Deno task.
    *   **Steps:**
        1.  [ ] Update the main `README.md` file with a new section that explains how to run the Deno task.
        2.  [ ] Include examples of how to run the task with different options.

## Milestone 5: Testing and Quality Assurance

The goal of this milestone is to ensure that the generated TypeScript libraries are correct and of high quality.

*   [ ] **Task 5.1: Develop Unit Tests**
    *   **Goal:** Write unit tests for the generated TypeScript libraries to verify their functionality.
    *   **Steps:**
        1.  [ ] Choose a testing framework for Deno (e.g., the built-in `Deno.test`).
        2.  [ ] For each generated TypeScript class, write tests that:
            *   [ ] Verify that the class can be instantiated.
            *   [ ] Verify that the properties have the correct types.
*   [ ] **Task 5.2: Implement Traceability**
    *   **Goal:** Add comments or other metadata to the generated code to make it easy to trace back to the original BMM file.
    *   **Steps:**
        1.  [ ] In the code generation logic, add a comment at the top of each generated file that indicates which BMM file it was generated from.
        2.  [ ] Consider adding a special tag (e.g., `@bmm_source`) in the JSDoc comments to link to the specific BMM element.
