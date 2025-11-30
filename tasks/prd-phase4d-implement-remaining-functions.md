# Product Requirements Document: Implement Remaining Functions (Phase 4d)

## Introduction/Overview

The ehrtslib project has successfully completed code separation (Phase 4c), where
generated stubs and enhanced implementations are now properly separated. However,
there are still many functions in the BASE, RM, and LANG packages that throw
"not yet implemented" errors. Phase 4d focuses on completing these implementations
to provide full functionality for these core packages.

## Context from ROADMAP.md

> Add function behaviour for not yet implemented functions in BASE, RM & LANG (if
> any) and create and run associated tests. (Hint: many of the unimplemented pars
> throw errors saying that they are not yet implemented)

## Current State (Updated 2025-11-30)

Analysis shows the following unimplemented functions:
- **openehr_base.ts**: 3 unimplemented functions (instance_of, matching, select - intentionally deferred as they require runtime type factories or are abstract)
- **openehr_rm.ts**: 0 unimplemented functions ✅ COMPLETE
- **openehr_lang.ts**: 84 unimplemented functions (primarily BMM schema operations)
- **openehr_am.ts**: ~91 unimplemented functions (not in scope for Phase 4d)
- **openehr_term.ts**: 0 unimplemented functions ✅ COMPLETE

**Remaining for Phase 4d: ~84 functions in LANG package**

### Progress Summary
- BASE package: ✅ Substantially complete (143 of 146 implemented, 98%)
- RM package: ✅ Complete (all functions implemented)
- LANG package: 🔄 In progress (0 of 84 implemented, 0%)

## Goals

1. **Complete BASE Package**: Implement all remaining functions in openehr_base.ts
   that throw "not yet implemented" errors
2. **Complete RM Package**: Implement all remaining functions in openehr_rm.ts
3. **Complete LANG Package**: Implement all remaining functions in openehr_lang.ts
4. **Test Coverage**: Create or update tests for all newly implemented functions
5. **Maintain Quality**: Ensure implementations follow openEHR specifications and
   are consistent with existing code patterns

## User Stories

### As a Library User
- I want all BASE, RM, and LANG functions to work so that I can build complete
  openEHR applications without encountering "not yet implemented" errors
- I want reliable implementations that follow the openEHR specifications so that
  my applications behave correctly

### As a Developer Contributor
- I want comprehensive tests for all functions so that I can verify correctness
  and prevent regressions
- I want clear documentation and instruction files to guide implementation so
  that I understand expected behavior

### As a Maintainer
- I want all basic functionality complete before moving to advanced features
  (serialization, templates, etc.) so that the library has a solid foundation
- I want test coverage to ensure implementations are correct and maintainable

## Functional Requirements

### 1. Function Identification and Analysis

1.1. Create a comprehensive list of all "not yet implemented" functions in:
- enhanced/openehr_base.ts
- enhanced/openehr_rm.ts
- enhanced/openehr_lang.ts

1.2. For each unimplemented function, identify:
- Function name and class
- Parameters and return type
- Related instruction file in tasks/instructions/
- Existing test coverage (if any)

1.3. Prioritize functions based on:
- Dependency order (implement foundation classes first)
- Test requirements (functions with existing failing tests)
- Complexity (start with simpler functions)

### 2. Implementation Approach

2.1. For each function:
- Review the instruction file in tasks/instructions/[package]/[ClassName].md
   - tasks/instructions/base/ - for BASE package classes
   - tasks/instructions/rm/ - for RM package classes
   - tasks/instructions/lang/ - for LANG package classes (if exists)
- Review openEHR specifications at https://specifications.openehr.org/ (e.g. by using your MCP client for deepwiki)
- Check other implementations (Archie, java-libs, adl-tools) for reference  (e.g. by using your MCP client for deepwiki)
- update corresponding tasks/instructions/[package]/[ClassName].md file if it lacks detail for the function
- Implement teh function behavious in the typescript file following existing code patterns in the codebase

2.2. Follow implementation patterns:
- Use existing TypeScript/Deno idioms
- Handle edge cases and null/undefined appropriately
- Include JSDoc comments where helpful,at least heading each function
- Throw meaningful errors for truly unsupported operations


### 3. Test Coverage

3.1. For each implemented function:
- Create test cases in tests/enhanced/[package].test.ts
- Test normal operation
- Test edge cases
- Test error conditions

3.2. Leverage existing test infrastructure:
- tests/enhanced/base.test.ts - BASE package tests
- tests/enhanced/rm.test.ts - RM package tests
- tests/enhanced/term.test.ts - TERM package tests

3.3. Run tests frequently:
- After implementing each function or small batch
- Before committing changes
- Use `deno test` to run all tests

### 4. Quality Assurance

4.1. Code quality:
- Run `deno fmt` to format code
- Run `deno lint` to check for issues
- Review implementations for consistency with existing code

4.2. Documentation:
- Update JSDoc comments where needed
- Document any deviations from specifications in INCONSISTENCIES.md
- Update /instructions files if behavior differs from initial understanding

4.3. Validation:
- Compare behavior with Archie implementation where possible
- Verify against openEHR specifications
- Check that tests pass

## Non-Functional Requirements

1. **Performance**: Implementations should be reasonably efficient
2. **Maintainability**: Code should be clear and follow existing patterns
3. **Testability**: All functions should be testable
4. **Compatibility**: Maintain backward compatibility with existing code

## Out of Scope

- Archetype Model (AM) package functions - deferred to later phase
- Serialization/deserialization - Phase 5a
- Template support - Phase 5b
- Advanced features - later phases

## Dependencies

- Existing instruction files in tasks/instructions/
- openEHR specifications at https://specifications.openehr.org/
- Reference implementations (Archie, java-libs, adl-tools)
- Existing test infrastructure

## Success Criteria

1. All "not yet implemented" errors eliminated from BASE, RM, and LANG packages
2. Test coverage for all newly implemented functions
3. All tests passing (`deno test` succeeds)
4. Code quality checks passing (`deno fmt`, `deno lint`)
5. Documentation updated where needed

## Implementation Strategy

Suggested approach:
1. Start with BASE package (foundation for others)
2. Implement by class, completing all methods in a class before moving on
3. Follow dependency order within classes
4. Move to RM package after BASE is complete
5. Complete LANG package last
6. Iterate: implement → test → verify → commit

## References

- ROADMAP.md - Phase 4d description
- tasks/instructions/ - Implementation guidance for each class
- https://specifications.openehr.org/ - Official openEHR specifications
- https://github.com/openEHR/archie - Reference implementation (Java)
