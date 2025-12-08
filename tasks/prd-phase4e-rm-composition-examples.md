# Product Requirements Document: RM Composition Examples and Documentation (Phase 4e)

## Introduction/Overview

With Phase 4d complete (all BASE, RM, and LANG functions implemented), the ehrtslib project now has a fully functional Reference Model (RM) implementation. However, potential users need concrete examples and documentation showing how to use the RM to build openEHR COMPOSITION object trees from scratch.

This PRD addresses the need to create comprehensive documentation and runnable example code that demonstrates building an openEHR COMPOSITION from the ground up, based on a simple flattened template. This is pedagogical in nature - showing that the RM is usable on its own, even though template-supported object creation and validation will come in later phases (Phase 5).

## Context from ROADMAP.md

> Create documentation and runnable example code That shows how to build an RM
> object tree for an openEHR COMPOSITION from scratch based on manually looking
> at a very simple/minimal flattened template (...provide filename here...). Do
> point out that at this stage we do not yet have support from the AM and helper
> code to validate that the tree structure is actually valid and following a
> specific template. Template supported object creation will be implemented in later
> phases, but it could be pedagogical to show that the RM is usable (albeit in a
> cumbersome way) on its own.

## Goals

1. **Create Runnable Examples**: Develop working TypeScript/Deno code that demonstrates building a complete COMPOSITION object tree
2. **Pedagogical Documentation**: Write clear, step-by-step documentation explaining the RM structure and how to construct instances
3. **Template-Based Approach**: Base examples on a real, simple flattened openEHR template
4. **Show Current Limitations**: Clearly document that validation and template support are not yet available
5. **Enable Early Adoption**: Give users enough information to start using ehrtslib for real projects

## Current State

### Completed
- ✅ BASE package: Fully implemented (98% - 3 intentionally deferred)
- ✅ RM package: Fully implemented (100%)
- ✅ LANG package: Fully implemented (100%)
- ✅ All core functionality working
- ✅ 126 tests passing

### Not Yet Available
- ❌ AM (Archetype Model) package - deferred to later phases
- ❌ Template validation support - Phase 5b
- ❌ Simplified template-based creation - Phase 5b
- ❌ Serialization/deserialization - Phase 4g

## User Stories

### As a Developer New to openEHR
- I want to see a complete working example of building a COMPOSITION so that I understand how the RM classes fit together
- I want step-by-step explanations of each class and its role so that I can learn the openEHR architecture
- I want to understand which properties are required vs. optional so that I can build valid instances
- I want to see how to create nested structures (COMPOSITION > SECTION > OBSERVATION > ELEMENT) so that I can model real clinical data

### As an Experienced openEHR Developer
- I want to see how ehrtslib's API compares to other implementations (Archie, openEHR-SDK) so that I can migrate existing code
- I want examples showing the manual approach so that I appreciate the value of template support in later phases
- I want reference documentation for all RM classes so that I can look up details as needed
- I want to understand the dual getter/setter approach so that I can use the library idiomatically

### As a Project Evaluator
- I want runnable examples that I can execute immediately so that I can verify the library works
- I want to see realistic use cases so that I can judge if ehrtslib fits my project needs
- I want clear documentation of current limitations so that I can plan around them

## Functional Requirements

### 1. Template Selection

1.1. **Choose a Simple Template**
- Select an existing, minimal openEHR template (flattened format)
- Template should be simple enough to understand but realistic enough to be useful
- Suggested options:
  - Basic vital signs template (blood pressure, pulse)
  - Simple questionnaire/form
  - Minimal medication order
- Template should be included in the repository under `examples/templates/`

1.2. **Template Documentation**
- Include the flattened template file (JSON or ADL format)
- Add README explaining what the template represents
- Document the structure (COMPOSITION > SECTION > OBSERVATION/etc.)
- List all archetypes used in the template

### 2. Example Code

2.1. **Basic COMPOSITION Example**

Create `examples/basic-composition.ts` that demonstrates:
- Creating a new COMPOSITION instance
- Setting required properties (name, uid, archetype_details, language, category, composer, context)
- Creating supporting objects (PARTY_PROXY, EVENT_CONTEXT, etc.)
- Adding content (at least one SECTION and one ENTRY)
- Console output showing the constructed object tree

Requirements:
- Must be runnable with `deno run examples/basic-composition.ts`
- Must include extensive comments explaining each step
- Must produce valid RM object instances (even if not yet validated against template)
- Must demonstrate best practices (error handling, required vs. optional properties)

2.2. **Detailed Step-by-Step Example**

Create `examples/detailed-composition-example.ts` that shows:
- Step 1: Create COMPOSITION with minimal required properties
- Step 2: Add EVENT_CONTEXT (setting, start_time, health_care_facility)
- Step 3: Create SECTION and add to COMPOSITION
- Step 4: Create OBSERVATION with data (HISTORY > EVENT > ITEM_TREE > ELEMENT > DV_QUANTITY)
- Step 5: Add OBSERVATION to SECTION
- Step 6: Demonstrate navigation (accessing nested elements)
- Step 7: Show modification (changing values)
- Step 8: Print summary of the constructed tree

Requirements:
- Each step should be a separate function with clear naming
- Include assertions or checks to verify construction
- Use realistic clinical data (e.g., blood pressure measurement)
- Show both successful creation and error cases

2.3. **Class-by-Class Examples**

Create `examples/rm-classes/` directory with individual examples:
- `composition-example.ts` - COMPOSITION creation patterns
- `section-example.ts` - SECTION usage
- `observation-example.ts` - OBSERVATION with HISTORY and EVENTs
- `evaluation-example.ts` - EVALUATION for assessments
- `instruction-example.ts` - INSTRUCTION for orders
- `action-example.ts` - ACTION for performed activities
- `data-types-example.ts` - DV_TEXT, DV_QUANTITY, DV_CODED_TEXT, DV_DATE_TIME
- `data-structures-example.ts` - ITEM_TREE, ITEM_LIST, ITEM_TABLE, CLUSTER, ELEMENT

Requirements:
- Each file demonstrates one main class
- Include JSDoc comments
- Show common patterns and gotchas
- Reference relevant openEHR specification sections

### 3. Documentation

3.1. **Getting Started Guide**

Create `docs/getting-started.md` covering:
- Introduction to openEHR RM concepts
- Overview of ehrtslib architecture
- Installation and setup (importing from enhanced/)
- "Hello World" - simplest possible COMPOSITION
- Link to detailed examples
- Common patterns and idioms
- Troubleshooting section

3.2. **RM Usage Guide**

Create `docs/rm-usage-guide.md` covering:
- RM package structure and organization
- Class hierarchy overview (LOCATABLE > ENTRY > OBSERVATION, etc.)
- Required vs. optional properties for key classes
- The dual getter/setter approach
- Working with generic types
- Creating instances: constructors vs. factory methods
- Navigation and path-based access (when available)
- Limitations and future enhancements

3.3. **Example-Based Tutorial**

Create `docs/tutorial-building-composition.md` as a walkthrough:
- Introduction: What we're building and why
- Prerequisites and setup
- Part 1: Understanding the template structure
- Part 2: Creating the COMPOSITION shell
- Part 3: Adding metadata (context, composer, etc.)
- Part 4: Building the content structure
- Part 5: Adding clinical data
- Part 6: Verification and next steps
- Appendix: Full code listing

3.4. **API Reference**

Create or generate `docs/api-reference.md`:
- Overview of main packages (BASE, RM, LANG)
- Key classes with brief descriptions
- Link to inline JSDoc for detailed info
- Common type definitions
- Helper utilities (if any)

Note: This could be auto-generated from JSDoc comments if appropriate tooling is available.

3.5. **Current Limitations Document**

Create `docs/limitations.md` explaining:
- What's implemented (BASE, RM, LANG functions)
- What's NOT implemented:
  - Template validation
  - Archetype validation
  - Simplified/fluent API for construction
  - Serialization to openEHR JSON/XML
  - AM package support
- Workarounds for common needs
- Roadmap for future enhancements (reference to ROADMAP.md)

### 4. Testing and Validation

4.1. **Example Tests**

Create `examples/examples.test.ts`:
- Tests that verify each example runs without errors
- Tests that check key properties are set correctly
- Tests that demonstrate expected usage patterns
- Can serve as additional documentation through test code

Requirements:
- Use Deno test framework
- Should run with `deno test examples/`
- Should pass as part of CI/CD

4.2. **Example Data**

Create `examples/data/` directory:
- Sample clinical data (anonymized/synthetic)
- Template files being demonstrated
- Expected output structures (for comparison)

### 5. Template Selection Details

5.1. **Find or Create Template**

Options:
- Use existing template from openEHR Clinical Knowledge Manager (CKM)
- Use template from Archie test resources
- Create a minimal custom template for demonstration

Recommended template characteristics:
- Flattened (not operational template)
- Uses common archetypes (observation, evaluation)
- Includes common data types (DV_TEXT, DV_QUANTITY, DV_CODED_TEXT)
- Contains 1-2 levels of SECTION nesting
- Has 2-3 ENTRY objects (OBSERVATION and/or EVALUATION)
- Total ~50-100 nodes (comprehensive but not overwhelming)

5.2. **Template Documentation**

In `examples/templates/README.md`:
- Template name and version
- Source/origin (CKM link if applicable)
- Purpose (what clinical scenario it addresses)
- Structure diagram (visual representation)
- Archetype list with descriptions
- Notes on simplifications made for example purposes

## Non-Functional Requirements

### 1. Code Quality
- All example code must pass `deno fmt`
- All example code must pass `deno lint`
- Examples should follow TypeScript best practices
- Clear, descriptive variable and function names
- Extensive comments explaining non-obvious steps

### 2. Documentation Quality
- Written for developers with varying openEHR experience levels
- Use clear, jargon-free language where possible
- Define technical terms when first used
- Include diagrams where helpful
- Maintain consistent formatting and style

### 3. Maintainability
- Examples should be easy to update when RM changes
- Documentation should reference specific RM versions
- Code should be modular and reusable
- Include version information in examples

### 4. Usability
- Examples must run without modification
- Clear error messages if prerequisites are missing
- Progressive complexity (simple examples first)
- Links between related documentation sections

## Out of Scope

The following are explicitly OUT OF SCOPE for Phase 4e:

- ❌ Template validation (Phase 5b)
- ❌ Archetype validation (Phase 5a)
- ❌ AM package implementation (Phase 5a)
- ❌ Serialization to openEHR JSON/XML formats (Phase 4g)
- ❌ Deserialization from openEHR formats (Phase 4g)
- ❌ Fluent/chaining API for object construction (Phase 4f)
- ❌ Simplified template-based creation (Phase 5b)
- ❌ Web components or UI examples
- ❌ Integration with external systems (EHR servers, etc.)
- ❌ Performance optimization or benchmarking
- ❌ Complex clinical templates (keep examples simple)

## Dependencies

### Internal
- Fully implemented BASE package (Phase 4d ✅)
- Fully implemented RM package (Phase 4d ✅)
- Fully implemented LANG package (Phase 4d ✅)
- Existing test infrastructure

### External
- Deno runtime (already required)
- Simple openEHR template (flattened format)
- openEHR specifications documentation (online)
- Reference implementations (Archie) for comparison (optional)

### Optional/Nice-to-Have
- Deepwiki MCP access for researching templates and examples
- Diagram generation tools (Mermaid, PlantUML) for documentation
- Access to openEHR CKM for template selection

## Success Criteria

1. ✅ **Runnable Examples**
   - At least 2 complete example files that execute without errors
   - Examples demonstrate creating a COMPOSITION from a real template
   - Output shows a properly constructed RM object tree

2. ✅ **Comprehensive Documentation**
   - Getting started guide completed
   - RM usage guide completed
   - Tutorial walkthrough completed
   - Current limitations clearly documented

3. ✅ **Template Selection**
   - Simple, realistic template selected and included
   - Template structure documented
   - Template used as basis for all examples

4. ✅ **Tests Pass**
   - Example tests execute successfully
   - Existing test suite still passes (no regressions)
   - Examples demonstrate best practices

5. ✅ **Code Quality**
   - All code formatted with `deno fmt`
   - All code passes `deno lint`
   - Code includes extensive comments

6. ✅ **Usability Validation**
   - Someone unfamiliar with the codebase can follow the tutorial
   - Examples clearly show current limitations
   - Documentation answers common questions

## Implementation Approach

### Phase 1: Template Selection (Estimated: 1-2 hours)
1. Research available simple templates
2. Select appropriate template
3. Document template structure
4. Add template files to `examples/templates/`

### Phase 2: Basic Example (Estimated: 2-3 hours)
1. Create `examples/basic-composition.ts`
2. Implement minimal COMPOSITION creation
3. Add extensive comments
4. Test execution
5. Refine based on testing

### Phase 3: Detailed Example (Estimated: 3-4 hours)
1. Create `examples/detailed-composition-example.ts`
2. Implement step-by-step construction
3. Add error handling and validation
4. Include realistic clinical data
5. Test and refine

### Phase 4: Class Examples (Estimated: 3-4 hours)
1. Create `examples/rm-classes/` directory
2. Implement individual class examples
3. Focus on most commonly used classes
4. Cross-reference between examples

### Phase 5: Core Documentation (Estimated: 4-5 hours)
1. Write `docs/getting-started.md`
2. Write `docs/rm-usage-guide.md`
3. Write `docs/tutorial-building-composition.md`
4. Write `docs/limitations.md`
5. Review and edit for clarity

### Phase 6: Testing and Polish (Estimated: 2-3 hours)
1. Create `examples/examples.test.ts`
2. Run all examples and tests
3. Fix any issues found
4. Format and lint all code
5. Final documentation review

### Phase 7: Validation (Estimated: 1-2 hours)
1. Have fresh eyes review documentation
2. Verify examples run on clean environment
3. Check that success criteria are met
4. Make final adjustments

**Total Estimated Time: 16-23 hours**

## Deliverables

### Code
1. `examples/basic-composition.ts` - Simple COMPOSITION creation example
2. `examples/detailed-composition-example.ts` - Step-by-step tutorial code
3. `examples/rm-classes/*.ts` - Individual class examples (8-10 files)
4. `examples/examples.test.ts` - Test suite for examples

### Documentation
1. `docs/getting-started.md` - Introduction and quickstart
2. `docs/rm-usage-guide.md` - Comprehensive usage documentation
3. `docs/tutorial-building-composition.md` - Walkthrough tutorial
4. `docs/limitations.md` - Current state and limitations
5. `examples/templates/README.md` - Template documentation

### Supporting Files
1. `examples/templates/[template-name].json` - Flattened template
2. `examples/data/*.json` - Sample data files (if needed)
3. `examples/README.md` - Overview of examples directory

## Open Questions

1. **Template Selection**: Should we use an existing template from CKM or create a custom minimal one?
   - Recommendation: Use existing from CKM for authenticity, but keep it simple

2. **Code Organization**: Should examples be in `/examples` or `/docs/examples`?
   - Recommendation: `/examples` at root level, with `/docs` for documentation

3. **Level of Detail**: How much explanation is too much in code comments?
   - Recommendation: Err on the side of more explanation for Phase 4e

4. **Testing**: Should examples have assertions or just demonstrate construction?
   - Recommendation: Include basic assertions to verify correct construction

5. **Template Format**: JSON flattened template or ADL2 operational template?
   - Recommendation: Start with JSON flattened (simpler to read)

## References

- ROADMAP.md - Phase 4e description
- https://specifications.openehr.org/ - Official openEHR specifications
- https://github.com/openEHR/archie - Reference implementation
- openEHR Clinical Knowledge Manager - Template repository
- Phase 4d completion summary - Current state documentation
