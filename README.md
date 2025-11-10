# ehrtslib
TypeScript library for (to begin with) openEHR. Intended for (partial) use both in clients like web browsers or and in servers based on e.g. Deno or Node.js 

TODO:
# Phase 1
Use deepwiki MCP connection for info about openEHR's BMM files. Following the dependency graph of openEHR packages/libraries (starting with BASE package and its dependencies and then move upwards), build typescript libraries for all of openEHR (RM first, then TERM and AM). Keep classes of the same package in same typescript file (ine fil per package). Keep the exact snake_case class and method names and capitalization as in the BMM specification.  Start jules on this task in this github repository (ehrtslib). Take your time Jules and do a thorough job, no hurry i will turn off my computer and check in tomorrow. 

# Phase 2
* Previous phase was a good experient based on a not so information rich BMM variant. Keep it in a subdirectory (called from_old_bmm) for comparison and add a readme in that directory explaining how it was generated.
* The latest versions of openEHR BMM are in JSON format and contain updated (and more) information about each class and can be found in https://github.com/sebastian-iancu/code-generator/tree/master/code/BMM-JSON (raw files are of course in https://raw.githubusercontent.com/sebastian-iancu/code-generator/refs/heads/master/code/BMM-JSON/ ). That repository is also available in Deepwiki. 
* Make a brand new set of TS libraries from these. Use JsDoc to include _all_ extra documentation for the classes etc found in the BMMs. There are many version of BMMs in the sebastian-iancu/code-generator only use the latest Semver version of each library, example, only use openehr_base_1.3.0.bmm.json among these:
```openehr_base_1.0.4.bmm.json
openehr_base_1.1.0.bmm.json
openehr_base_1.2.0.bmm.json
openehr_base_1.3.0.bmm.json
```
* There will be new versions of these bmm files published later so we want to create a deterministic way to convert from *.bmm.json files to Typescript libraries that can be run later using a Deno task without involving AI.

# Phase 2: TypeScript Library Generation

This section describes how to generate TypeScript libraries from the latest openEHR BMM JSON specifications.

## Generating TypeScript Libraries

To generate the TypeScript libraries for all openEHR BMM packages, run the following Deno script:

```bash
deno run --allow-read --allow-net --allow-write tasks/generate_ts_libs.ts
```

This script will perform the following actions:
1.  Read the `tasks/bmm_versions.json` file to identify the latest versions of all BMM packages.
2.  Download the corresponding BMM JSON files from the `sebastian-iancu/code-generator` GitHub repository.
3.  Generate TypeScript classes and interfaces for each BMM package, including JSDoc comments based on the BMM documentation.
4.  Save the generated TypeScript code to individual files (e.g., `openehr_am.ts`, `openehr_base.ts`) in the root directory.

**Note:** The generated TypeScript files will be placed in the root directory of the project.

# Phase 3

Guidance and helpers to construct RM instance hierarchies programatically based om the generated TS library.

# Phase 4

Serialisation and deserialisation of RM object instance trees to and from openEHRs canonical JSON and XML formats

# Phase 5

Simplified openEHR template specific forms of instance tree creation and validation. (Take inspiration from Archie and openEHR's simplified formats and "web template" but also allow ADL2 flattened templates as validation source). 
* One version of this code needs to be small so that it can fit and be run eficiently inside form engines etc. 
* Also make a (less lightweight) version that can be synchronously multiuser updated using Y.js or 
* Create build step to genenrate minivfed and web component versions

# Phase 4

Serialisation and deserialisation of RM object instance trees to and from openEHRs simplified JSON formats (likely using other already existing library if it can be made fairly dependency free)
