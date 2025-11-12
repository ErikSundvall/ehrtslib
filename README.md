
# ehrtslib (Electronic Health Record TypeScript Library)
TypeScript library for (to begin with) openEHR. Intended for (partial) use both in clients like web browsers or and in servers based on e.g. Deno or Node.js
The library is big an detailed, so developers using it are assumed to be importing just needed parts and to have build tools/processes that use e.g. "tree shaking" to reduce the amount of code shipped to end users.

## TypeScript EHR Library Generation

This section describes how to generate TypeScript libraries from the latest openEHR BMM JSON specifications.

### Prerequisites

- [Deno](https://deno.land/) runtime installed (installation instructions at https://docs.deno.com/runtime/getting_started/installation/) If you have node/npm installed then deno is installed by running `npm install -g deno`
- Internet connection (to download BMM JSON files from GitHub)

### Quick Start

To generate the TypeScript library stubs for all openEHR BMM packages, run:

```bash
deno run --allow-read --allow-net --allow-write tasks/generate_ts_libs.ts
```
BUT BE WARNED! This currently overwrites any existing possibly more fully implemented library files (that might have been generated in Phase 4 of ROADMAP.md)

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

### Discovering Latest BMM Versions

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

## Updating to a New Version of a Previously Used BMM

When a new version of an openEHR BMM specification is released (e.g., `openehr_base` 1.4.0 after you've been using 1.3.0), you need to update the library carefully to incorporate the changes without losing any custom implementations or enhancements you've made.

### Step 1: Check for New BMM Versions

First, discover if new versions are available:

```bash
deno run --allow-net --allow-write tasks/extract_dependencies.ts
```

This command will:
- Query the BMM repository for the latest versions
- Update `tasks/bmm_versions.json` with any new version numbers
- Update `tasks/bmm_dependencies.json` if dependencies have changed

After running this, check the git diff to see which versions changed:

```bash
git diff tasks/bmm_versions.json
```

### Step 2: Review What Changed

Before regenerating code, you should understand what changed in the new BMM version. Compare the current and new BMM files to identify:

- **New classes** added to the specification
- **Removed classes** (rare, but possible)
- **New properties or methods** in existing classes
- **Changed signatures** for existing methods
- **Updated documentation** in the BMM

You can manually download and compare the BMM JSON files, or use a comparison tool. For example:

```bash
# Download both versions and compare
curl -o old_version.json https://raw.githubusercontent.com/sebastian-iancu/code-generator/master/code/BMM-JSON/openehr_base_1.3.0.bmm.json
curl -o new_version.json https://raw.githubusercontent.com/sebastian-iancu/code-generator/master/code/BMM-JSON/openehr_base_1.4.0.bmm.json

# Use a diff tool to compare
diff old_version.json new_version.json
```

### Step 3: Back Up Your Current Implementation

Before making any changes, create a backup of your current working library files:

```bash
# Create a backup directory
mkdir -p backup_$(date +%Y%m%d)

# Copy current library files
cp openehr_*.ts backup_$(date +%Y%m%d)/
```

### Step 4: Regenerate the Library Stubs

**⚠️ WARNING**: The current generation process will overwrite your existing files. Once the Phase 4c restructuring (see ROADMAP.md) is complete, this step will be safer as generated stubs and enhanced implementations will be separated.

For now, proceed with caution:

```bash
# Regenerate all libraries from updated BMM files
deno run --allow-read --allow-net --allow-write tasks/generate_ts_libs.ts
```

### Step 5: Merge Your Enhancements Back In

After regeneration, you'll need to merge back any custom implementations:

1. **Compare the regenerated files with your backup**:
   ```bash
   # Use a diff tool to see what changed
   git diff backup_$(date +%Y%m%d)/openehr_base.ts openehr_base.ts
   ```

2. **Identify your custom code**:
   - Method implementations you added (vs. empty stub methods)
   - Helper methods or properties not in the BMM
   - Comments and documentation you added
   - Test fixtures and utilities

3. **Manually merge**:
   - Copy your implementations into the new generated stubs
   - Update any method signatures that changed
   - Adapt to new properties or classes
   - Update imports if package dependencies changed

### Step 6: Update Tests

After merging implementations:

1. **Run existing tests**:
   ```bash
   deno test
   ```

2. **Fix any broken tests** caused by:
   - Changed method signatures
   - Renamed properties
   - Removed classes or methods

3. **Add tests for new functionality** introduced in the BMM update

### Step 7: Verify and Document

Before committing your changes:

1. **Verify all tests pass**:
   ```bash
   deno test
   ```

2. **Run linting**:
   ```bash
   deno lint
   ```

3. **Format code**:
   ```bash
   deno fmt
   ```

4. **Document the update**:
   - Note the BMM version in commit messages
   - Update any changelogs or version documentation
   - Document any breaking changes from the BMM update

### Rollback Procedure

If something goes wrong during the update:

```bash
# Restore from backup
cp backup_$(date +%Y%m%d)/*.ts .

# Or use git to reset
git checkout -- openehr_*.ts
```

### Future Improvements

The Phase 4c work described in ROADMAP.md will improve this process by:
- Separating generated stubs (`/generated`) from enhanced implementations (`/enhanced`)
- Providing automated comparison tools to identify BMM changes
- Offering merge assistance utilities to help integrate updates
- Preserving your enhancements automatically during regeneration

## Adding a New BMM File

If you want to add a new openEHR BMM package that wasn't previously included in this library (e.g., adding support for a new openEHR specification component), follow these steps.

### Prerequisites

Before adding a new BMM file, ensure:

1. **The BMM file exists** in the source repository:
   - Check https://github.com/sebastian-iancu/code-generator/tree/master/code/BMM-JSON
   - Identify the exact filename (e.g., `openehr_proc_1.0.0.bmm.json`)

2. **Understand dependencies**:
   - Review the BMM file to see which other packages it imports
   - Ensure all dependent packages are already in your library or will be added
   - Check the `includes` section in the BMM JSON

3. **No naming conflicts**:
   - Verify that the new package doesn't define classes with the same names as existing packages
   - If conflicts exist, you may need to use namespacing strategies

### Step 1: Update Configuration Files

#### Add to `tasks/bmm_versions.json`

Add an entry for the new package with its BMM file URL:

```json
{
  "openehr_base": "https://raw.githubusercontent.com/sebastian-iancu/code-generator/master/code/BMM-JSON/openehr_base_1.3.0.bmm.json",
  "openehr_rm": "https://raw.githubusercontent.com/sebastian-iancu/code-generator/master/code/BMM-JSON/openehr_rm_1.3.0.bmm.json",
  "openehr_proc": "https://raw.githubusercontent.com/sebastian-iancu/code-generator/master/code/BMM-JSON/openehr_proc_1.0.0.bmm.json"
}
```

#### Add to `tasks/bmm_dependencies.json`

Specify the package's dependencies (packages it imports from):

```json
{
  "openehr_base": [],
  "openehr_rm": ["openehr_base"],
  "openehr_proc": ["openehr_base", "openehr_rm"]
}
```

If the new package has no dependencies, use an empty array `[]`.

### Step 2: Generate the TypeScript Library

Run the generator to create the TypeScript library for all packages (including the new one):

```bash
deno run --allow-read --allow-net --allow-write tasks/generate_ts_libs.ts
```

The generator will:
- Download the new BMM file
- Parse its contents
- Generate TypeScript classes, interfaces, and types
- Add proper import statements for dependencies
- Create `openehr_proc.ts` (or whatever your package name is)

### Step 3: Verify the Generated Code

After generation, check the new file:

1. **Review the generated file**:
   ```bash
   cat openehr_proc.ts
   ```

2. **Check imports**:
   - Verify that imports reference the correct dependent packages
   - Ensure import paths are correct (e.g., `./openehr_base.ts`)

3. **Check for TypeScript errors**:
   ```bash
   deno check openehr_proc.ts
   ```

### Step 4: Handle Inter-Package References

If the new package is referenced by existing packages, you may need to update them:

1. **Check which packages depend on the new one**:
   - Search for references to classes from the new package in existing code
   - If you're adding a foundational package, other packages might need to import it

2. **Update imports if necessary**:
   - Add import statements in dependent packages
   - Regenerate dependent packages if their BMM files already reference the new package

### Step 5: Add Tests

Create tests for the new package:

1. **Create a test file**:
   ```bash
   touch tests/openehr_proc_test.ts
   ```

2. **Write basic tests**:
   ```typescript
   import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
   import { SomeClassFromNewPackage } from "../openehr_proc.ts";

   Deno.test("New package basic functionality", () => {
     // Test instantiation
     const instance = new SomeClassFromNewPackage();
     assertEquals(typeof instance, "object");
   });
   ```

3. **Run tests**:
   ```bash
   deno test tests/openehr_proc_test.ts
   ```

### Step 6: Update Documentation

If the new package is significant, update documentation:

1. **Update README.md**:
   - Add the new package to the list of supported packages
   - Mention any special considerations

2. **Add usage examples**:
   ```typescript
   import { SomeClass } from "./openehr_proc.ts";
   import { LOCATABLE } from "./openehr_rm.ts";

   // Example showing how to use the new package
   const proc = new SomeClass();
   ```

3. **Update dependency documentation**:
   - If other packages now depend on this one, document that relationship

### Step 7: Verify Integration

Final verification steps:

1. **Build/check all files**:
   ```bash
   deno check openehr_*.ts
   ```

2. **Run full test suite**:
   ```bash
   deno test
   ```

3. **Verify no circular dependencies**:
   - Deno will error if circular imports exist
   - Adjust imports or package structure if needed

4. **Test tree-shaking** (if building for web):
   ```bash
   # If using a bundler, verify the new package doesn't bloat bundles unnecessarily
   ```

### Common Issues and Solutions

#### Issue: TypeScript Cannot Find Imported Types

**Solution**: 
- Verify the imported package is listed in dependencies
- Check that import paths are correct
- Ensure dependent packages were generated before this one

#### Issue: Class Name Conflicts

**Solution**:
- Use qualified imports: `import * as proc from "./openehr_proc.ts"`
- Reference with namespace: `proc.ClassName`
- Consider renaming during import: `import { ClassName as ProcClassName }`

#### Issue: Generator Doesn't Process New Package

**Solution**:
- Verify the BMM file URL is correct and accessible
- Check JSON syntax in configuration files
- Ensure package name matches BMM file naming convention

#### Issue: Dependencies Not Resolved

**Solution**:
- Review the `includes` section in the BMM JSON
- Add all included packages to `bmm_dependencies.json`
- Regenerate in dependency order (generator handles this automatically)

### Referencing vs Importing BMM Packages

**Referencing**: One BMM package mentions classes from another but doesn't formally import it.
- The generator will use qualified type names (e.g., `openehr_base.UID`)
- You may need to add import statements manually if you reference them directly

**Importing**: One BMM package formally includes another in its `includes` section.
- The generator automatically adds import statements
- Types are available without qualification within that package

If your new package references but doesn't import another package:
1. Check if it should formally import (update the BMM if you control it)
2. Or manually manage the TypeScript imports as needed

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
