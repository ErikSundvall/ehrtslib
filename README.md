
# ehrtslib (Electronic Health Record TypeScript Library)
TypeScript library for (to begin with) openEHR. Intended for (partial) use both in clients like web browsers or and in servers based on e.g. Deno or Node.js
The library is big an ddaetailed, so developers using it are assumed to be importing just needed parts and to have build tools/processes that use e.g. "tree shaking" to reduce the amount of code shipped to end users.

## TypeScript EHR Library Generation

This section describes how to generate TypeScript libraries from the latest openEHR BMM JSON specifications.

### Prerequisites

- [Deno](https://deno.land/) runtime installed (installatio instructions at https://docs.deno.com/runtime/getting_started/installation/) If you have node/npm installed then deno is installed by running `npm install -g deno`
- Internet connection (to download BMM JSON files from GitHub)

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
## Architecture / Code Structure: Orchestrator & Generator

The TypeScript library generation process is split into two main scripts for clarity and maintainability:

- **`tasks/generate_ts_libs.ts`** (Orchestrator):
    - Handles the overall workflow: reads config, sorts packages by dependency, downloads BMM files, builds context, and writes output files.
    - Adds traceability headers and ensures correct import order.
    - Calls the generator logic in `ts_generator.ts` for each package.

- **`tasks/ts_generator.ts`** (Generator Logic):
    - Contains all reusable logic for mapping BMM JSON to TypeScript code.
    - Handles type resolution, class/interface generation, documentation extraction, and type validation.
    - Used as a library by the orchestrator script.

This separation ensures that the orchestration logic (batch processing, dependency handling, file output) is kept distinct from the code generation logic (type mapping, documentation, class creation), making the codebase easier to maintain and extend.
