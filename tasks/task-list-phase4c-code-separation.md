# Task List: Code Separation and Version Management (Phase 4c)

This task list is based on the requirements in `prd-phase4c-code-separation.md`.

## Relevant Files

### Generation Scripts

- `tasks/generate_ts_libs.ts` - Main orchestrator for library generation; needs
  modification to output to `/generated` directory
- `tasks/ts_generator.ts` - Core generation logic; may need updates for metadata
  tracking
- `tasks/extract_dependencies.ts` - Dependency extraction script; should remain
  unchanged but verified
- `tasks/bmm_versions.json` - Tracks BMM versions; will be used for version
  comparison
- `tasks/bmm_dependencies.json` - Tracks package dependencies; should remain
  unchanged

### New Scripts to Create

- `tasks/compare_bmm_versions.ts` - New utility to compare old vs new BMM
  versions and report changes
- `tasks/merge_bmm_updates.ts` - Helper script to assist in merging BMM changes
  into enhanced files

### Library Files (to be moved)

- `openehr_base.ts` - Main library file to be moved to `/enhanced/`
- `openehr_rm.ts` - Main library file to be moved to `/enhanced/`
- `openehr_am.ts` - Main library file to be moved to `/enhanced/`
- `openehr_term.ts` - Main library file to be moved to `/enhanced/`
- `openehr_lang.ts` - Main library file to be moved to `/enhanced/`

### Root Export Files (to be created)

- `openehr_base.ts` (root level) - Re-export wrapper for
  enhanced/openehr_base.ts
- `openehr_rm.ts` (root level) - Re-export wrapper
- `openehr_am.ts` (root level) - Re-export wrapper
- `openehr_term.ts` (root level) - Re-export wrapper
- `openehr_lang.ts` (root level) - Re-export wrapper

### Test Files

- `tests/*.ts` - All test files may need import path updates and reorganization

### Documentation Files

- `README.md` - Already has two sections: "Updating to a New BMM Version" and
  "Adding a New BMM File" that need to be reviewed and possibly updated to match
  new structure
- Other `.md` files - May need updates referencing file structure

### Notes

- The Deno test runner will automatically find test files, but import paths in
  tests may need updating
- Use `deno test` to run all tests after changes
- Use `deno fmt` to format all TypeScript files consistently
- Back up current working files before major restructuring

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown
file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you
don't skip any steps.

Example:

- `- [ ] 1.1 Read file` → `- [x] 1.1 Read file` (after completing)

Update (and save) the file after completing each sub-task, not just after
completing an entire parent task. If implementation steps happen to fulfil
several things at once then ticking off several boxes is OK.

If running in interactive mode (e.g. Gemini CLI) then stop after each parent
task and let user review. If running in autonomous batch mode e.g. dispatched to
Google Jules or Github Copilot, then just stop if user input is required.

## Tasks

- [x] 0.0 Prepare and analyze current state
  - [x] 0.1 Run existing tests to establish baseline (`deno test`)
  - [x] 0.2 Document current test results and any known issues
  - [x] 0.3 Review all current library files (openehr_*.ts) to understand
        implementation status
  - [x] 0.4 Create backup of current enhanced files (copy to /enhanced-backup/
        temporarily since they will get overwritten in next step)
  - [x] 0.5 Run existing generator to verify current output
        (`deno run --allow-read --allow-net --allow-write tasks/generate_ts_libs.ts`)

- [x] 1.0 Create new directory structure
  - [x] 1.1 Create `/generated` directory in repository root
  - [x] 1.2 Create `/enhanced` directory in repository root
  - [x] 1.3 Add README.md files in both directories explaining their purpose

- [x] 2.0 Modify generator to output to `/generated` directory
  - [x] 2.1 Update `tasks/generate_ts_libs.ts` to accept output directory
        parameter
  - [x] 2.2 Modify default output path to `./generated/`
  - [x] 2.3 Enhance file headers with BMM version and generation timestamp
        metadata
  - [x] 2.4 Test generator outputs correctly to new location
  - [x] 2.5 Verify generated files are identical to previous output in root dir
        (except for path references)
  - [x] 2.6 Update boilerplate/comments in generated files to refer to
        documentation about the multistep process rather than suggesting
        re-running destructive generation

- [x] 3.0 Move enhanced implementations to `/enhanced` directory from
      /enhanced-backup/
  - [x] 3.1 Move `openehr_base.ts` to `enhanced/openehr_base.ts`
  - [x] 3.2 Move `openehr_rm.ts` to `enhanced/openehr_rm.ts`
  - [x] 3.3 Move `openehr_am.ts` to `enhanced/openehr_am.ts`
  - [x] 3.4 Move `openehr_term.ts` to `enhanced/openehr_term.ts`
  - [x] 3.5 Move `openehr_lang.ts` to `enhanced/openehr_lang.ts`
  - [x] 3.6 Update internal import statements in enhanced files to reference
        `../enhanced/` or `./` as appropriate
  - [x] 3.7 Add BMM version metadata comments to each enhanced file if missing

- [x] 4.0 Create root-level re-export files
  - [x] 4.1 Create `openehr_base.ts` at root that re-exports all from
        `./enhanced/openehr_base.ts`
  - [x] 4.2 Create `openehr_rm.ts` at root that re-exports all from
        `./enhanced/openehr_rm.ts`
  - [x] 4.3 Create `openehr_am.ts` at root that re-exports all from
        `./enhanced/openehr_am.ts`
  - [x] 4.4 Create `openehr_term.ts` at root that re-exports all from
        `./enhanced/openehr_term.ts`
  - [x] 4.5 Create `openehr_lang.ts` at root that re-exports all from
        `./enhanced/openehr_lang.ts`
  - [x] 4.6 Add comments explaining these are re-export wrappers for backward
        compatibility including a note about that this may later be changed to
        using a /dist directory with various targeted exports

- [x] 5.0 Update test files
  - [x] 5.1 Identify all test files that import from library files
  - [x] 5.2 Update import paths in test files to use root-level exports (should
        not need changes if using root imports)
  - [x] 5.3 Run tests to verify all pass with new structure (`deno test`)
  - [x] 5.4 Fix any broken tests due to import issues
  - [x] 5.5 Verify test coverage and results remains the same as baseline
        established in 0.1
  - [x] 5.6 Split test directory structure under `/tests` with subdirectories
        for `/tests/generated` (for tests expecting correct signatures but
        possibly missing behavior) and `/tests/enhanced` (for tests expecting
        full correct behavior)

- [x] 6.0 Create version comparison utility
  - [x] 6.1 Create `tasks/compare_bmm_versions.ts` script
  - [x] 6.2 Implement logic to load old and new BMM JSON files
  - [x] 6.3 Implement comparison logic for classes (added, removed, unchanged)
  - [x] 6.4 Implement comparison logic for properties (added, removed, changed
        types)
  - [x] 6.5 Implement comparison logic for methods (added, removed, changed
        signatures)
  - [x] 6.6 Generate human-readable and computer parsable comparison report
        (perhaps YAML would cover both needs in same file)
  - [x] 6.7 Test comparison utility with two versions of a BMM file
  - [x] 6.8 Document usage in script comments and README.md

- [x] 7.0 Create merge assistance utility
  - [x] 7.1 Create `tasks/merge_bmm_updates.ts` script
  - [x] 7.2 Implement logic to read comparison report (se 6.6. above)
  - [x] 7.3 Implement logic to generate TODO comments for manual merging
  - [x] 7.4 Create helper to insert new class/method stubs and TODO-comments
        into enhanced files
  - [x] 7.5 Test merge utility with sample changes
  - [x] 7.6 Document usage in script comments

- [x] 8.0 Update README.md with BMM version management instructions (note:
      README already has detailed sections that may need updating to reflect new
      directory structure)
  - [x] 8.1 Add or modify any existing related chapter "Updating to a New BMM
        Version" with sections:
    - [x] 8.1.1 "Checking for New BMM Versions" - how to identify updates
          (verify/update existing content)
    - [x] 8.1.2 "Running the Update Process" - step-by-step commands
          (verify/update existing content)
    - [x] 8.1.3 "Reviewing Changes" - how to use compare_bmm_versions.ts (add
          reference to new utility)
    - [x] 8.1.4 "Merging Updates" - how to integrate changes into enhanced files
          (update for new /enhanced directory)
    - [x] 8.1.5 "Verification" - running tests and validating changes
          (verify/update existing content)
    - [x] 8.1.6 "Rollback" - what to do if something goes wrong (verify/update
          existing content)
  - [x] 8.2 Add or modify any existing related section "Adding a New BMM File"
        with subsections:
    - [x] 8.2.1 "Prerequisites" - understanding dependencies (verify/update
          existing content)
    - [x] 8.2.2 "Configuration" - updating bmm_versions.json and
          bmm_dependencies.json (verify/update existing content)
    - [x] 8.2.3 "Generation" - running generator for new package (update for
          /generated directory)
    - [x] 8.2.4 "Integration" - handling imports and references (verify/update
          existing content)
    - [x] 8.2.5 "Testing" - verifying the new package works correctly
          (verify/update existing content)
  - [x] 8.3 Update existing "Quick Start" section to reference new directory
        structure
  - [x] 8.4 Update "Output Structure" section to explain /generated vs /enhanced

- [x] 9.0 Update documentation files
  - [x] 9.1 Review all .md documentation files for references to old structure
  - [x] 9.4 Add comments in generator scripts explaining the separation strategy

- [x] 10.0 Final verification and cleanup
  - [x] 10.1 Run full test suite and verify all tests that previously passed
        still pass (`deno test`)
  - [x] 10.2 Run linter if available (`deno lint`)
  - [x] 10.3 Run formatter to ensure consistent style (`deno fmt`)
  - [x] 10.4 Verify generator still works correctly with new structure
  - [x] 10.5 Test backward compatibility: verify root-level imports work
  - [x] 10.6 Remove temporary backup directory (/enhanced-backup/)
  - [x] 10.7 Review all documentation changes for clarity and brevity (try to
        reduce repeated content)
  - [x] 10.8 Create summary of changes made
  - [x] 10.9 Verify no temporary files or artifacts are committed

- [x] 11.0 Documentation finalization
  - [x] 11.1 Add example commands to README.md showing the update workflow
        (verify/update existing examples)
  - [x] 11.2 Add troubleshooting section for common issues (verify/update
        existing troubleshooting content)
  - [x] 11.3 Update any inline code comments referring to old structure
  - [x] 11.4 Create CHANGELOG entry if project maintains one

## Success Criteria

- All existing tests that passed before still pass without modification to test
  logic
- Generator outputs to `/generated` directory successfully
- Enhanced files reside in `/enhanced` directory with proper imports
- Root-level exports provide transparent backward compatibility
- Documentation clearly explains both update scenarios (verify existing sections
  are accurate)
- Version comparison utility successfully identifies BMM changes
- Test directory properly split between /generated and /enhanced test suites
- No loss of existing functionality

## Risk Mitigation

- **Risk**: Breaking existing tests during restructuring
  - **Mitigation**: Run tests after each major step, maintain backup of working
    files
- **Risk**: Import path confusion after moving files
  - **Mitigation**: Use Deno's built-in dependency analyzer, test incrementally
- **Risk**: Circular dependencies from new structure
  - **Mitigation**: Enhanced files should not import from root, only from other
    enhanced files
- **Risk**: Missing updates in documentation
  - **Mitigation**: Review all mentions of file paths and structure across all
    docs (including existing README sections)
