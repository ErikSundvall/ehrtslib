# ehrtslib (Electronic Health Record TypeScript Library)

TypeScript library for (to begin with) openEHR. Intended for (partial) use both
in clients like web browsers or and in servers based on e.g. Deno or Node.js The
library is big an detailed, so developers using it are assumed to be importing
just needed parts and to have build tools/processes that use e.g. "tree shaking"
to reduce the amount of code shipped to end users.

## For library users: Using the library in your own projects

This library uses a **dual getter/setter pattern** for working with openEHR primitive types (String, Integer, Boolean, etc.), providing both convenience and type safety.

### Quick Start: Two Ways to Access Properties

**1. Default Access (Primitives)** - Use property names directly for simple operations:
```typescript
// Setting values - accepts JavaScript primitives (auto-wrapped with validation)
person.name = "John";
dateTime.value = "2025-11-19T10:30:00Z";

// Getting values - returns JavaScript primitives
const name: string = person.name;  // Returns primitive string
const date: string = dateTime.value;  // Returns primitive string
```

**2. Typed Access (Wrappers)** - Use `$` prefix to access openEHR wrapper objects and their methods:
```typescript
// Getting wrapper - access wrapper methods for advanced operations
const nameWrapper: String = person.$name;
if (nameWrapper.is_empty()) {
  console.log("Name is empty");
}
```

**When to use which:** Use default primitive access (~95% of cases) for simple value operations. Use `$` prefix wrapper access when you need openEHR-specific methods like `is_empty()`, `as_upper()`, or type-specific validation.

For detailed information about the dual approach pattern, see [DUAL-APPROACH-GUIDE.md](DUAL-APPROACH-GUIDE.md).

## For library maintainers: TypeScript EHR Library Generation

This section describes how to generate TypeScript libraries from the latest
openEHR BMM JSON specifications. Most developers do not need to bother about this part.

### Prerequisites

- [Deno](https://deno.land/) runtime installed (installation instructions at
  https://docs.deno.com/runtime/getting_started/installation/) If you have
  node/npm installed then deno is installed by running `npm install -g deno`
- Internet connection (to download e.g. BMM JSON and terminology files from GitHub)

### Quick Start

To generate the TypeScript library stubs for all openEHR BMM packages, run:

```bash
deno run --allow-read --allow-net --allow-write tasks/generate_ts_libs.ts
```

This generates stub files in the `/generated` directory. These stubs are safe to
regenerate at any time - they won't overwrite your enhanced implementations in
`/enhanced`.

**Note:** The root-level `openehr_*.ts` files are thin re-export wrappers that
provide backward compatibility by re-exporting from `/enhanced`.

### What the Generator Does

The generator script performs the following steps:

1. **Reads package versions**: Loads `tasks/bmm_versions.json` to identify the
   latest SemVer version of each BMM package
2. **Reads dependencies**: Loads `tasks/bmm_dependencies.json` to understand
   inter-package dependencies
3. **Topological sorting**: Orders packages so dependencies are generated before
   packages that depend on them (e.g., `openehr_base` before `openehr_rm`)
4. **Downloads BMM files**: Fetches the corresponding BMM JSON files from the
   `sebastian-iancu/code-generator` GitHub repository
5. **Generates TypeScript code**:
   - Creates TypeScript classes and interfaces for each BMM package
   - Includes comprehensive JSDoc comments extracted from BMM documentation
   - Adds proper `import` statements for inter-package dependencies
   - Resolves type references across packages (e.g.,
     `openehr_base.UID_BASED_ID`)
6. **Saves output**: Writes generated TypeScript files to the `/generated`
   directory (e.g., `generated/openehr_am.ts`, `generated/openehr_base.ts`,
   etc.)

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

The generation process is controlled by two JSON configuration files in the
`tasks/` directory:

- **`tasks/bmm_versions.json`**: Maps package names to their BMM JSON file URLs
- **`tasks/bmm_dependencies.json`**: Maps package names to arrays of their
  dependencies

You can manually edit these files if needed, though the automated discovery
scripts should handle most cases.

### Output Structure

The library uses a three-tier structure to separate generated stubs from
enhanced implementations:

```
/ehrtslib
├── /generated          # ⚠️ DO NOT EDIT - Regenerated from BMM
│   ├── README.md       # Explains generated code
│   ├── openehr_base.ts # Generated stubs
│   ├── openehr_rm.ts
│   └── ...
├── /enhanced           # ✅ SAFE TO EDIT - Your implementations
│   ├── README.md       # Explains enhanced code
│   ├── openehr_base.ts # Full implementations
│   ├── openehr_rm.ts
│   └── ...
├── openehr_base.ts     # 🔄 Re-export wrapper (backward compatibility)
├── openehr_rm.ts       # Re-exports from /enhanced
└── ...
```

**Key Points:**

- `/generated` - Contains pure BMM-derived stubs. Safe to regenerate anytime.
- `/enhanced` - Contains fully implemented classes with your enhancements. Never
  overwritten by generator.
- Root level - Thin re-export wrappers for backward compatibility. External code
  imports from here.

## Updating to a New Version of a Previously Used BMM

When a new version of an openEHR BMM specification is released (e.g.,
`openehr_base` 1.4.0 after you've been using 1.3.0), you need to update the
library carefully to incorporate the changes without losing any custom
implementations or enhancements you've made.

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

Before updating your enhanced implementations, understand what changed in the
new BMM version using the comparison utility:

```bash
# Compare two specific versions (openehr_base used as an example)
deno run --allow-read --allow-net --allow-write tasks/compare_bmm_versions.ts openehr_base \
  https://raw.githubusercontent.com/sebastian-iancu/code-generator/master/code/BMM-JSON/openehr_base_1.3.0.bmm.json \
  https://raw.githubusercontent.com/sebastian-iancu/code-generator/master/code/BMM-JSON/openehr_base_1.4.0.bmm.json
```

This generates a detailed comparison report showing:

- **New classes** added to the specification
- **Removed classes** (rare, but possible)
- **New properties or methods** in existing classes
- **Changed signatures** for existing methods
- **Unchanged classes** (safe to ignore)

The report is saved as a markdown file (e.g.,
`bmm_comparison_openehr_base_1.3.0_to_1.4.0.md`) for easy reference.

### Step 3: Regenerate Stubs to `/generated`

Generate new stubs from the updated BMM files:

```bash
# Regenerate all libraries from updated BMM files
deno run --allow-read --allow-net --allow-write tasks/generate_ts_libs.ts
```

This updates files in `/generated` with the new BMM structure. Your `/enhanced`
implementations remain untouched.

### Step 4: Get Merge Assistance

Use the merge utility to insert TODO comments into your enhanced files:

```bash
# Generate TODO comments based on the comparison report (openehr_base used as an example)
deno run --allow-read --allow-write tasks/merge_bmm_updates.ts \
  bmm_comparison_openehr_base_1.3.0_to_1.4.0.md \
  enhanced/openehr_base.ts
```

This creates a backup and inserts TODO comments at the top of the enhanced file,
listing all changes that need to be made.

### Step 5: Update Enhanced Files (Manually or AI assisted)

Work through the TODO comments in your enhanced file:

1. **For new classes**: Copy the class stub from `/generated` to `/enhanced` and
   implement methods

2. **For new methods**: Add the method to the appropriate class in `/enhanced`
   - Copy the signature from `/generated`
   - Implement the behavior
   - Add tests

3. **For modified signatures**: Update the method in `/enhanced`
   - Compare old vs new signature in `/generated`
   - Update your implementation to match
   - Verify tests still pass

4. **For removed items**: Consider backward compatibility
   - Deprecate rather than remove if possible
   - Update documentation to warn users

5. **Remove TODO comments** once each change is complete

### Step 5b (Optional): Create/Update Instruction Files with AI Assistance

For complex new features or significantly changed classes, you may want to
create or update instruction files (as described in Phase 3 of
[ROADMAP.md](ROADMAP.md)). These files help guide implementation of missing
behaviors:

1. **Analyze specifications**: Use the openEHR specifications at
   https://specifications.openehr.org/ and other implementations (Archie,
   java-libs) to understand the expected behavior

2. **Create instruction files**: Generate markdown files in `/tasks/instructions`
   (one per class) that describe:
   - Expected behavior and algorithms
   - Edge cases and invariants
   - Test cases
   - References to specifications

3. **Use AI to create/update instructions**: Prompt an AI assistant with:
   ```
   Analyze the [ClassName] in the openEHR specifications and create a detailed
   instruction file following Phase 3 guidelines in ROADMAP.md. Include
   behavior descriptions, pseudocode, test cases, and specification references.
   ```

4. **Use instructions when coding**: When implementing in `/enhanced`, refer to
   the instruction files to ensure correct behavior:
   ```
   Implement the [ClassName] class in enhanced/[package].ts following the
   instructions in tasks/instructions/[ClassName].md
   ```

This approach is especially useful for complex classes with intricate behavior
or when multiple developers/AI agents need consistent implementation guidance.

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
   - Update the header comment in enhanced files with new BMM version
   - Note the BMM version in commit messages
   - Update any changelogs or version documentation
   - Document any breaking changes from the BMM update

### Rollback Procedure

If something goes wrong during the update:

```bash
# The merge utility creates automatic backups that can be restored (openehr_base used as an example)
cp enhanced/openehr_base.ts.backup.1234567890 enhanced/openehr_base.ts

# Or use git to reset
git checkout -- enhanced/openehr_base.ts
```

**Note**: Since `/generated` can always be regenerated, you only need to protect
`/enhanced` files.

## Adding a New BMM File

If you want to add a new openEHR BMM package that wasn't previously included in
this library (e.g., adding support for a new openEHR specification component),
follow these steps.

**Note:** This section uses `openehr_proc` as a hypothetical example package
name throughout. This package does not currently exist in the library and is
used purely for illustration purposes.

### Prerequisites

Before adding a new BMM file, ensure:

1. **The BMM file exists** in the source repository:
   - Check
     https://github.com/sebastian-iancu/code-generator/tree/master/code/BMM-JSON
   - Identify the exact filename (e.g., `openehr_proc_1.0.0.bmm.json` - used as
     example only)

2. **Understand dependencies**:
   - Review the BMM file to see which other packages it imports
   - Ensure all dependent packages are already in your library or will be added
   - Check the `includes` section in the BMM JSON

3. **No naming conflicts**:
   - Verify that the new package doesn't define classes with the same names as
     existing packages
   - If conflicts exist, you may need to use namespacing strategies

### Step 1: Update Configuration Files

#### Add to `tasks/bmm_versions.json`

Add an entry for the new package with its BMM file URL (example using
hypothetical `openehr_proc` package):

```json
{
  "openehr_base": "https://raw.githubusercontent.com/sebastian-iancu/code-generator/master/code/BMM-JSON/openehr_base_1.3.0.bmm.json",
  "openehr_rm": "https://raw.githubusercontent.com/sebastian-iancu/code-generator/master/code/BMM-JSON/openehr_rm_1.3.0.bmm.json",
  "openehr_proc": "https://raw.githubusercontent.com/sebastian-iancu/code-generator/master/code/BMM-JSON/openehr_proc_1.0.0.bmm.json"
}
```

#### Add to `tasks/bmm_dependencies.json`

Specify the package's dependencies (packages it imports from, example using
hypothetical `openehr_proc` package):

```json
{
  "openehr_base": [],
  "openehr_rm": ["openehr_base"],
  "openehr_proc": ["openehr_base", "openehr_rm"]
}
```

If the new package has no dependencies, use an empty array `[]`.

### Step 2: Generate the TypeScript Stubs

Run the generator to create TypeScript stubs in `/generated` for all packages
(including the new one):

```bash
deno run --allow-read --allow-net --allow-write tasks/generate_ts_libs.ts
```

The generator will:

- Download the new BMM file
- Parse its contents
- Generate TypeScript classes, interfaces, and types
- Add proper import statements for dependencies
- Create `generated/openehr_proc.ts` (or whatever your package name is)

### Step 3: Create Enhanced Implementation

After generation, create the enhanced version:

1. **Copy the generated stub to enhanced**:
   ```bash
   cp generated/openehr_proc.ts enhanced/openehr_proc.ts
   ```

2. **Update the header** in `enhanced/openehr_proc.ts`:
   - Change "Generated" to "Enhanced implementation based on"
   - Add "Last synced with BMM" date
   - Update warnings to indicate this is safe to edit

3. **Implement the methods**:
   - Replace `throw new Error("not yet implemented")` with actual
     implementations
   - Add helper methods as needed
   - Ensure all behavior is correct

4. **Check for TypeScript errors**:
   ```bash
   deno check enhanced/openehr_proc.ts
   ```

### Step 4: Create Root Re-export Wrapper

Create a thin re-export wrapper at the root level:

```bash
cat > openehr_proc.ts << 'EOF'
// Re-export wrapper for openehr_proc
// 
// This file provides backward compatibility by re-exporting all symbols from the enhanced implementation.
// External code can continue to import from the root level without changes.
// 
// ✅ Backward Compatibility Layer
// This is a thin re-export wrapper that maintains API stability.
// The actual implementation is in ./enhanced/openehr_proc.ts

export * from "./enhanced/openehr_proc.ts";
EOF
```

### Step 5: Handle Inter-Package References

If the new package is referenced by existing packages:

1. **Update imports in enhanced files** that need the new package:
   ```typescript
   import * as openehr_proc from "./openehr_proc.ts";
   ```

2. **Regenerate if BMM dependencies changed**:
   - If other BMM files now reference the new package, regenerate them
   - Update their enhanced versions with any new references

### Step 6: Add Tests

Create tests for the new package in both test directories:

1. **Create structural test** in `tests/generated/`:
   ```bash
   touch tests/generated/openehr_proc_test.ts
   ```

   Write tests that verify structure but accept "not implemented" errors.

2. **Create behavioral test** in `tests/enhanced/`:
   ```bash
   touch tests/enhanced/openehr_proc_test.ts
   ```

   Write tests that verify full behavior:
   ```typescript
   import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
   import { SomeClassFromNewPackage } from "../../openehr_proc.ts";

   Deno.test("New package basic functionality", () => {
     // Test instantiation
     const instance = new SomeClassFromNewPackage();
     assertEquals(typeof instance, "object");
   });
   ```

3. **Run tests**:
   ```bash
   deno test
   ```

### Step 7: Update Documentation

If the new package is significant, update documentation:

1. **Update README.md**:
   - Add the new package to the list of supported packages
   - Mention any special considerations
   - Update the directory structure diagram if needed

2. **Add usage examples** (using `openehr_proc` as hypothetical example):
   ```typescript
   import { SomeClass } from "./openehr_proc.ts";
   import { LOCATABLE } from "./openehr_rm.ts";

   // Example showing how to use the new package
   const proc = new SomeClass();
   ```

3. **Document in enhanced file**:
   - Add header comments explaining the package purpose
   - Document any custom additions beyond the BMM

### Step 8: Verify Integration

Final verification steps:

1. **Check all generated files**:
   ```bash
   deno check generated/*.ts
   ```

2. **Check all enhanced files**:
   ```bash
   deno check enhanced/*.ts
   ```

3. **Check root re-exports**:
   ```bash
   deno check openehr_*.ts
   ```

4. **Run full test suite**:
   ```bash
   deno test
   ```

5. **Verify no circular dependencies**:
   - Deno will error if circular imports exist
   - Adjust imports if needed (enhanced files should only import other enhanced
     files)

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

**Referencing**: One BMM package mentions classes from another but doesn't
formally import it.

- The generator will use qualified type names (e.g., `openehr_base.UID`)
- You may need to add import statements manually if you reference them directly

**Importing**: One BMM package formally includes another in its `includes`
section.

- The generator automatically adds import statements
- Types are available without qualification within that package

If your new package references but doesn't import another package:

1. Check if it should formally import (update the BMM if you control it)
2. Or manually manage the TypeScript imports as needed

### File Conventions

The library follows these conventions:

- One TypeScript file per BMM package in each directory
- All classes from the same BMM package are in the same file
- Snake_case naming is preserved from BMM specifications
- Classes are exported and can be imported individually or as a namespace

Example usage:

```typescript
// Import from root (recommended for external code)
import { LOCATABLE } from "./openehr_rm.ts";
import * as base from "./openehr_base.ts";

// Import from enhanced (for internal development)
import { LOCATABLE } from "./enhanced/openehr_rm.ts";
import * as base from "./enhanced/openehr_base.ts";

// Use the classes
const id: base.UID_BASED_ID = ...;
```

## Architecture / Code Structure: Orchestrator & Generator

The TypeScript library generation process is split into two main scripts for
clarity and maintainability:

- **`tasks/generate_ts_libs.ts`** (Orchestrator):
  - Handles the overall workflow: reads config, sorts packages by dependency,
    downloads BMM files, builds context, and writes output files.
  - Adds traceability headers and ensures correct import order.
  - Calls the generator logic in `ts_generator.ts` for each package.

- **`tasks/ts_generator.ts`** (Generator Logic):
  - Contains all reusable logic for mapping BMM JSON to TypeScript code.
  - Handles type resolution, class/interface generation, documentation
    extraction, and type validation.
  - Used as a library by the orchestrator script.

This separation ensures that the orchestration logic (batch processing,
dependency handling, file output) is kept distinct from the code generation
logic (type mapping, documentation, class creation), making the codebase easier
to maintain and extend.

## Maintaining External Dependencies

This library depends on external data sources that are updated periodically. This
section describes how to keep these dependencies up to date.

### Overview of External Dependencies

| Dependency | Source | Purpose | Update Frequency |
|------------|--------|---------|------------------|
| `@lhncbc/ucum-lhc` | npm | UCUM validation/conversion | Quarterly/As needed |
| `fast-xml-parser` | npm | XML serialization/deserialization | Quarterly/As needed |
| `yaml` | npm | YAML serialization/deserialization | Quarterly/As needed |
| `PropertyUnitData.xml` | openEHR GitHub | Property/unit groupings | As needed |
| `ucum-essence.xml` | Bundled in ucum-lhc | Base unit definitions | With ucum-lhc updates |

### Updating @lhncbc/ucum-lhc

The ucum-lhc library provides UCUM validation and unit conversion functionality.

**Check for updates:**

```bash
# Check current version
npm list @lhncbc/ucum-lhc

# Check for available updates
npm outdated @lhncbc/ucum-lhc

# Or check GitHub releases
# https://github.com/lhncbc/ucum-lhc/releases
```

**Update process:**

1. Check the [ucum-lhc changelog](https://github.com/lhncbc/ucum-lhc/blob/master/CHANGELOG.md) for breaking changes
2. Update the dependency:
   ```bash
   npm update @lhncbc/ucum-lhc
   # or for major version update
   npm install @lhncbc/ucum-lhc@latest
   ```
3. Run tests to verify compatibility:
   ```bash
   deno test tests/enhanced/measurement_service_test.ts
   ```
4. Update `package.json` version if needed
5. Document the update in commit message

**Important Notes:**
- The ucum-lhc library bundles `ucum-essence.xml` internally
- Updates may include new units or fix conversion issues
- The library handles special conversions (e.g., Celsius↔Fahrenheit) correctly

### Updating fast-xml-parser

The fast-xml-parser library provides XML serialization and deserialization for openEHR RM objects according to the [openEHR ITS-XML specification](https://specifications.openehr.org/releases/ITS-XML/).

**Check for updates:**

```bash
# Check current version in deno.json
cat deno.json | grep fast-xml-parser

# Check for available updates
# Visit https://github.com/NaturalIntelligence/fast-xml-parser/releases
```

**Update process:**

1. Check the [fast-xml-parser releases](https://github.com/NaturalIntelligence/fast-xml-parser/releases) for breaking changes
2. Update the dependency in `deno.json`:
   ```json
   {
     "imports": {
       "fast-xml-parser": "npm:fast-xml-parser@^4.5.0"
     }
   }
   ```
3. Also update in `package.json` if needed (some tooling like Model Context Protocol integrations use npm):
   ```bash
   npm update fast-xml-parser
   # or for major version update
   npm install fast-xml-parser@latest
   ```
4. Run tests to verify compatibility:
   ```bash
   deno test tests/enhanced/xml_serializer.test.ts
   deno test tests/enhanced/xml_deserializer.test.ts
   deno test tests/enhanced/serialization_common.test.ts
   ```
5. Document the update in commit message

**Important Notes:**
- Used for XML serialization in `enhanced/serialization/xml/`
- Supports openEHR ITS-XML compliance with xsi:type attributes
- Lightweight and performant
- MIT licensed

### Updating yaml

The yaml library (by eemeli) provides YAML serialization and deserialization for openEHR RM objects. YAML is not an official openEHR standard format, but provides excellent human readability.

**Check for updates:**

```bash
# Check current version in deno.json
cat deno.json | grep yaml

# Check for available updates
# Visit https://github.com/eemeli/yaml/releases
```

**Update process:**

1. Check the [yaml releases](https://github.com/eemeli/yaml/releases) for breaking changes
2. Update the dependency in `deno.json`:
   ```json
   {
     "imports": {
       "yaml": "npm:yaml@^2.4.0"
     }
   }
   ```
3. Run tests to verify compatibility:
   ```bash
   deno test tests/enhanced/yaml_serializer_basic.test.ts
   deno test tests/enhanced/yaml_hybrid_test.ts
   deno test tests/enhanced/roundtrip.test.ts
   ```
4. Document the update in commit message

**Important Notes:**
- Used for YAML serialization in `enhanced/serialization/yaml/`
- Supports multiple formatting styles (block, flow, hybrid)
- ISC licensed (library size varies by version)

### Updating PropertyUnitData.xml

The PropertyUnitData.xml file provides openEHR property and unit grouping data.
We only use property names, IDs, and unit groupings from this file - NOT the
conversion factors (which are known to be erroneous).

**Check for updates:**

Visit the source file:
https://github.com/openEHR/specifications-TERM/blob/master/computable/XML/PropertyUnitData.xml

**Update process:**

1. Download the latest version:
   ```bash
   # Using the built-in download function
   deno run --allow-net --allow-write tasks/update_property_unit_data.ts
   
   # Or manually
   curl -o terminology_data/PropertyUnitData.xml \
     https://raw.githubusercontent.com/openEHR/specifications-TERM/master/computable/XML/PropertyUnitData.xml
   ```

2. Review changes:
   ```bash
   git diff terminology_data/PropertyUnitData.xml
   ```

3. Run tests:
   ```bash
   deno test tests/enhanced/property_unit_service_test.ts
   ```

4. Commit with a clear message noting what changed

**Important Notes:**
- Do NOT use conversion factors from PropertyUnitData.xml - they are erroneous
- Only use: property names, openEHR IDs, unit groupings, UCUM codes
- Use ucum-lhc for all actual unit conversions

### Why We Use This Approach

Based on the openEHR community discussion
([Discourse Thread](https://discourse.openehr.org/t/propertyunitdata-xml-and-conversion-information/4968)):

1. **PropertyUnitData.xml conversion factors are problematic:**
   - Contains "erroneous and/or imprecise" conversion factors (Silje Ljosland Bakke)
   - Some conversions like °F↔°C require special handling that simple factors cannot provide (Sebastian Garde)
   - Was created before good UCUM libraries existed

2. **ucum-lhc is the recommended solution:**
   - Actively maintained by the Lister Hill National Center for Biomedical Communications
   - Handles all UCUM operations correctly, including special cases
   - Uses the official ucum-essence.xml for definitions
   - Provides validation, conversion, and dimension checking

3. **What we keep from PropertyUnitData.xml:**
   - Property names (e.g., "Mass", "Length")
   - openEHR property IDs (e.g., 124 for Mass)
   - Unit groupings (which units belong to which properties)
   - NOT: conversion factors, coefficients

### Quarterly Maintenance Checklist

Perform these checks quarterly or when major updates are available:

- [ ] Check for ucum-lhc updates on npm/GitHub
- [ ] Check for fast-xml-parser updates on npm/GitHub
- [ ] Check for yaml library updates on npm/GitHub
- [ ] Check for PropertyUnitData.xml changes in specifications-TERM repo
- [ ] Review any openEHR Discourse discussions about units/measurements
- [ ] Run full test suite after updates
- [ ] Update this documentation if processes change

### References

- [ucum-lhc GitHub](https://github.com/lhncbc/ucum-lhc)
- [ucum-lhc Documentation](https://lhncbc.github.io/ucum-lhc/)
- [fast-xml-parser GitHub](https://github.com/NaturalIntelligence/fast-xml-parser)
- [yaml GitHub](https://github.com/eemeli/yaml)
- [PropertyUnitData.xml](https://github.com/openEHR/specifications-TERM/blob/master/computable/XML/PropertyUnitData.xml)
- [openEHR Discourse Discussion](https://discourse.openehr.org/t/propertyunitdata-xml-and-conversion-information/4968)
- [UCUM Specification](https://ucum.org/ucum.html)
- [openEHR ITS-XML Specification](https://specifications.openehr.org/releases/ITS-XML/)
- [openEHR ITS-JSON Specification](https://specifications.openehr.org/releases/ITS-JSON/)
