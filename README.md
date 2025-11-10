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

## Prerequisites

- [Deno](https://deno.land/) runtime installed
- Internet connection (to download BMM JSON files from GitHub)

## Generating TypeScript Libraries

### Quick Start

To generate the TypeScript libraries for all openEHR BMM packages, run:

```bash
deno run --allow-read --allow-net --allow-write tasks/generate_ts_libs.ts
```

### What the Generator Does

The generator script performs the following steps:

1.  **Reads package versions**: Loads `tasks/bmm_versions.json` to identify the latest SemVer version of each BMM package
2.  **Reads dependencies**: Loads `tasks/bmm_dependencies.json` to understand inter-package dependencies
3.  **Topological sorting**: Orders packages so dependencies are generated before packages that depend on them (e.g., `openehr_base` before `openehr_rm`)
4.  **Downloads BMM files**: Fetches the corresponding BMM JSON files from the `sebastian-iancu/code-generator` GitHub repository
5.  **Generates TypeScript code**: 
    - Creates TypeScript classes and interfaces for each BMM package
    - Includes comprehensive JSDoc comments extracted from BMM documentation
    - Adds proper `import` statements for inter-package dependencies
    - Resolves type references across packages (e.g., `openehr_base.UID_BASED_ID`)
6.  **Saves output**: Writes generated TypeScript files to the root directory (e.g., `openehr_am.ts`, `openehr_base.ts`, `openehr_rm.ts`, `openehr_term.ts`, `openehr_lang.ts`)

### Updating to Latest BMM Versions

If new versions of BMM files are published, update the versions by running:

```bash
deno run --allow-net --allow-write tasks/extract_dependencies.ts
```

This will:
- Discover the latest versions of all BMM packages
- Update `tasks/bmm_versions.json`
- Extract and update inter-package dependencies in `tasks/bmm_dependencies.json`

Then regenerate the TypeScript libraries using the generation command above.

### Manual Configuration

The generation process is controlled by two JSON configuration files in the `tasks/` directory:

- **`tasks/bmm_versions.json`**: Maps package names to their BMM JSON file URLs
- **`tasks/bmm_dependencies.json`**: Maps package names to arrays of their dependencies

You can manually edit these files if needed, though the automated discovery scripts should handle most cases.

### Output Structure

Generated files follow these conventions:
- One TypeScript file per BMM package (e.g., `openehr_base.ts`)
- All classes from the same BMM package are in the same file
- Snake_case naming is preserved from BMM specifications
- Classes are exported and can be imported individually or as a namespace

Example usage of generated libraries:

```typescript
import { LOCATABLE } from "./openehr_rm.ts";
import * as base from "./openehr_base.ts";

// Use the classes...
const id: base.UID_BASED_ID = ...;
```

# Phase 3

Guidance and helpers to construct RM instance hierarchies programatically based om the generated TS library.

# Phase 4

Serialisation and deserialisation of RM object instance trees to and from openEHRs canonical JSON and XML formats

# Phase 5

Simplified openEHR template specific forms of instance tree creation and validation. (Take inspiration from Archie and openEHR's simplified formats and "web template" but also allow ADL2 flattened templates as validation source). 
* One version of this code needs to be small so that it can fit and be run eficiently inside form engines etc. 
* Also make a (less lightweight) version that can be synchronously multiuser updated using Y.js or 
* Create build step to genenrate minivfed and web component versions

# Phase 6

Serialisation and deserialisation of RM object instance trees to and from openEHRs simplified JSON formats (likely using other already existing library if it can be made fairly dependency free)

-----

# Old refence perhaps covered above already:

## Regenerate TypeScript libraries
deno run --allow-read --allow-net --allow-write tasks/generate_ts_libs.ts

## Update BMM versions and dependencies
deno run --allow-net --allow-write tasks/extract_dependencies.ts

## Run tests
deno test --allow-read tests/generated_libs_test.ts

