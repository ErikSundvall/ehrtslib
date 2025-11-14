# Product Requirements Document: Code Separation and Version Management (Phase 4c)

## Introduction/Overview

The ehrtslib project currently has a potentially destructive architecture where deterministically generated TypeScript library stubs (from BMM JSON files) are subsequently enhanced by LLM-based tools that add functional implementations. This creates a critical problem: re-running generators to incorporate new BMM versions would overwrite all the LLM-enhanced implementations.

This PRD addresses the need to restructure the project to separate:
1. **Generated code** - Deterministically created class stubs from BMM files
2. **Enhanced code** - LLM-augmented implementations with full functionality
3. **Version management** - Ability to update to new BMM versions without losing enhancements

The goal is to make the project "future-proof" so that BMM updates only modify the delta between versions, preserving unchanged functionality.

## Goals

1. **Preserve Manual/LLM Enhancements**: Ensure that functional implementations added to generated stubs are never lost when regenerating from updated BMM files
2. **Enable Incremental Updates**: Support updating to new BMM versions by only modifying/adding changed elements
3. **Clear Separation of Concerns**: Maintain distinct boundaries between generated stubs and enhanced implementations
4. **Maintain Existing Functionality**: Ensure all currently working code continues to function after restructuring
5. **Developer Guidance**: Provide clear documentation for handling BMM version updates and adding new BMM files

## User Stories

### As a Library Maintainer
- I want to update to a new version of an existing BMM file so that the library reflects the latest openEHR specifications without losing existing implementations
- I want to add a new BMM file that doesn't overlap with existing ones so that the library can support additional openEHR packages
- I want a clear directory structure that separates generated code from enhanced code so that I understand what will be overwritten on regeneration

### As a Developer Contributor
- I want to know which files contain generated stubs versus enhanced implementations so that I know where to add new functionality
- I want the build and test processes to work seamlessly regardless of the code organization so that I can focus on implementation
- I want clear instructions on how to handle BMM updates so that I don't accidentally destroy existing work

### As a Library User
- I want the library API to remain stable even when internal restructuring occurs so that my code doesn't break
- I want access to the latest openEHR specifications without disrupting existing functionality

## Functional Requirements

### 1. Directory Structure Reorganization

1.1. Create a `/generated` directory to contain all deterministically generated TypeScript stub files

1.2. Create an `/enhanced` directory to contain all LLM-augmented implementation files

1.3. Move existing fully-implemented library files (e.g., `openehr_base.ts`, `openehr_rm.ts`) to the `/enhanced` directory

1.4. Maintain root-level export files that provide a stable API by re-exporting from the appropriate directories

1.5. Update all import statements across the codebase to reflect the new directory structure

### 2. Generation Process Updates

2.1. Modify `tasks/generate_ts_libs.ts` to output generated files to the `/generated` directory

2.2. Ensure the generator creates traceability headers indicating BMM source file and version

2.3. Add logic to detect which classes/methods have been added, removed, or changed between BMM versions

2.4. Implement a "diff detection" mechanism that identifies deltas between old and new BMM versions

2.5. Create a migration/update script that can merge BMM changes into enhanced files

### 3. Version Management

3.1. Track the BMM version used to generate each enhanced file (via comments or metadata)

3.2. When updating to a new BMM version, generate a report showing:
   - New classes/methods added
   - Classes/methods removed
   - Classes/methods with changed signatures
   - Classes/methods unchanged

3.3. Provide tooling to semi-automatically merge new BMM elements into enhanced files

3.4. Support adding entirely new BMM files without affecting existing packages

### 4. Build and Test Integration

4.1. Update build configuration to work with the new directory structure

4.2. Ensure all existing tests continue to pass after reorganization

4.3. Update test imports to reference the correct file locations

4.4. Maintain backward compatibility for external consumers through root-level exports

4.5. Split tests files to a separate subdirectory structures (under `/tests`) so that 
* one test suite is intended for files in /generated (that are expected to have corect signatures but expected to be missing a lot of behaviour in functions)
* one test suite is intended for files in /enhanced (that are expected to oass the tests in /generated but also have correct behaviour in functions

### 5. Documentation Updates

5.1. Add a (or modify anay existing related) chapter in README.md titled "Updating to a New BMM Version" that explains:
   - How to identify when a new BMM version is available
   - Steps to run the update process
   - How to review and merge changes
   - How to verify nothing was broken

5.2. Add (or modify anay existing related) a section to README.md titled "Adding a New BMM File" that explains:
   - How to add a BMM file for a package not previously included
   - How to handle dependencies and imports
   - How to verify the new package integrates correctly

5.3. Update .md documentation files if necessary to guide on the new structure

5.4. Add comments in generator scripts etc. explaining the separation strategy

## Non-Goals (Out of Scope)

- Automatically resolving conflicts in enhanced code when BMM signatures change (this will require manual review)
- Supporting multiple versions of the same BMM package simultaneously
- Creating a visual diff tool for comparing BMM versions (command-line reporting is sufficient)
- Refactoring the internal implementation of existing classes (only organizational changes)

## Design Considerations

### Directory Structure
```
/ehrtslib
├── /generated          # Pure deterministic generation output
│   ├── openehr_base.ts
│   ├── openehr_rm.ts
│   └── ...
├── /enhanced           # LLM-augmented implementations
│   ├── openehr_base.ts
│   ├── openehr_rm.ts
│   └── ...
├── /tasks              # Generation scripts and metadata
│   ├── generate_ts_libs.ts
│   ├── bmm_versions.json
│   ├── bmm_dependencies.json
│   └── ...
├── /tests              # Test files (with subdirectoried as explained in 4.5 above)
├── openehr_base.ts     # Root export (re-exports from /enhanced)
├── openehr_rm.ts       # Root export
└── ...
```

### Backward Compatibility Strategy
- Root-level `.ts` files become thin re-export wrappers
- External consumers continue importing from root level
- Internal code can import from `/enhanced` or `/generated` as needed

### Update Workflow
1. Run `extract_dependencies.ts` to get latest BMM versions
2. Run `generate_ts_libs.ts` to generate new stubs to `/generated`
3. Run new `compare_versions.ts` script to identify changes
4. Review change report
5. Manually or semi-automatically merge changes into `/enhanced` files
6. Run tests to verify nothing broke
7. Commit changes with clear version notes

## Technical Considerations

### Generator Script Modifications
- `tasks/generate_ts_libs.ts` needs output path parameter
- Need to preserve generation metadata (BMM version, timestamp) in headers
- Should generate to `/generated` by default boilerplat in generated files should refer to documentation of the multistep procces rather than possibly tricking the user into re-runnig destructive stub generation

### Import Path Updates
- Many files currently import from root (e.g., `import { X } from "./openehr_base.ts"`)
- After restructuring, enhanced files should import from each other in `/enhanced`
- Root-level files become simple re-exporters

### Testing Strategy
- All existing tests should pass without unnecessary modification to test logic
- Only import paths in tests may need updating
- Add new tests for version comparison and migration utilities

### Build Tool Compatibility
- Deno should handle nested imports naturally
- Verify that tree-shaking still works effectively
- Ensure no circular dependencies are introduced

## Success Metrics

1. **Zero Data Loss**: All existing implemented functionality is preserved after restructuring
2. **Successful Update**: Ability to update to a new BMM version and correctly identify all changes
3. **Test Pass Rate**: All existing tests that Passed before the restructuring Should still pass after restructuring
4. **Build Success**: All existing build tasks complete successfully
5. **Documentation Completeness**: README.md contains clear, actionable instructions for both update scenarios
6. **Generator Accuracy**: Generated stubs in `/generated` are identical to current generation output

## Open Questions

1. Should enhanced files in `/enhanced` include the full class implementation or just the enhancements?
   - Response: Full implementation for simplicity
2. How should we handle the transition period? Should we:
   - A. Do a "big bang" restructuring all at once
   - B. Gradually migrate package by package
   - Response: Big bang for consistency
3. Should we create automated tests that verify generator output hasn't unexpectedly changed?
   - Response: Yes, snapshot testing for generators
4. How should version metadata be stored in enhanced files?
   - Response: Yes JSDoc comment at file top with BMM version info
5. Should the root-level export files be generated or manually maintained?
   - Response: Generated for consistency - might be changed to /dist struvture in later Phase


## References

- ROADMAP.md Phase 4c requirements
- AGENTS.md development guidance
- Existing generator scripts: `tasks/generate_ts_libs.ts`, `tasks/ts_generator.ts`
- Existing version management: `tasks/bmm_versions.json`, `tasks/bmm_dependencies.json`
