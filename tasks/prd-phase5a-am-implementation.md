# Product Requirements Document: Phase 5a - Archetyping/Templating Layer Implementation

**Version:** 1.0  
**Date:** 2026-01-14  
**Status:** Draft for Review  
**Project:** ehrtslib - TypeScript/Deno openEHR Implementation

---

## Executive Summary

This PRD defines the architecture and implementation strategy for adding the Archetyping and Templating layer (AM - Archetype Model) to the ehrtslib project. The goal is to enable ADL2 archetype/template parsing, validation of RM instances against templates, and template-based code generation while maintaining the project's philosophy of minimal dependencies, clean TypeScript integration, and non-destructive evolution.

**Key Deliverables:**
1. ADL2 parser that generates AOM (Archetype Object Model) instances
2. Validation framework for RM instances against operational templates
3. Template-based RM instance generation
4. TypeScript scaffolding code generator from templates
5. ADL2 serialization capability
6. Integration with existing type registry and serialization infrastructure

---

## Table of Contents

1. [Background and Context](#1-background-and-context)
2. [Current State Assessment](#2-current-state-assessment)
3. [Goals and Non-Goals](#3-goals-and-non-goals)
4. [Core Requirements](#4-core-requirements)
5. [ADL2 Parser Architecture (Multiple Alternatives)](#5-adl2-parser-architecture-multiple-alternatives)
6. [Validation Framework Design](#6-validation-framework-design)
7. [Template-Based Code Generation](#7-template-based-code-generation)
8. [Integration Strategy](#8-integration-strategy)
9. [Implementation Phases](#9-implementation-phases)
10. [Decision Matrices](#10-decision-matrices)
11. [Technical Risks and Mitigations](#11-technical-risks-and-mitigations)
12. [Success Criteria](#12-success-criteria)

---

## 1. Background and Context

### 1.1 Project Evolution

The ehrtslib project has progressed through multiple phases:

- **Phase 1-2:** BMM-based deterministic TS library generation for BASE, RM, LANG, TERM packages
- **Phase 3:** Knowledge bank creation (/tasks/instructions) with implementation guidance per class
- **Phase 4:** Full implementation of RM classes with methods, simplified creation patterns, and comprehensive serialization (XML, JSON, YAML, TypeScript constructor format)
- **Phase 5a (This Phase):** Adding the Archetyping/Templating layer

### 1.2 The openEHR Archetype Model

**Key Concepts:**

- **ADL (Archetype Definition Language):** Human-readable DSL for defining archetypes and templates
- **AOM (Archetype Object Model):** Object-oriented metamodel representing parsed archetypes
- **BMM (Basic Meta-Model):** Formal definition of the AOM structure
- **Archetypes:** Reusable clinical content definitions with slots for specialization
- **Templates:** Application-specific compositions that fill archetype slots and add constraints
- **Operational Templates (OPTs):** Fully flattened, executable templates with all constraints resolved

**Relationship:**
```
ADL2 File → [Parser] → AOM Instance Tree → [Validator] → Validates RM Instances
                                       ↓
                                  [Generator] → RM Instances / TS Code
```

### 1.3 Reference Implementations

The project can reference these mature implementations:

- **openEHR/archie (Java):** Uses ANTLR4 for ADL2 parsing, comprehensive validation
- **openEHR/adl-tools (Eiffel):** Original reference implementation
- **openEHR/java-libs (Java):** Earlier Java implementation

### 1.4 Official Resources

- ADL2 Specification: https://specifications.openehr.org/releases/AM/latest/ADL2.html
- AOM2 Specification: https://specifications.openehr.org/releases/AM/latest/AOM2.html
- ANTLR Grammars (from Archie): `Adl.g4`, `cadl.g4`, `odin.g4`

---

## 2. Current State Assessment

### 2.1 What Exists

✅ **AM Classes Generated:**
- Location: `/enhanced/openehr_am.ts` (5,593 lines)
- Key classes: `ARCHETYPE`, `AUTHORED_ARCHETYPE`, `TEMPLATE`, `OPERATIONAL_TEMPLATE`
- Constraint classes: `C_COMPLEX_OBJECT`, `C_ATTRIBUTE`, `C_PRIMITIVE_OBJECT` hierarchy
- Terminology: `ARCHETYPE_ONTOLOGY`, `ARCHETYPE_TERM`
- All 30+ AM classes with properties and basic structure

✅ **AM Instruction Files:**
- Location: `/tasks/instructions/am/`
- 20+ markdown files with implementation guidance
- Examples: `ARCHETYPE.md`, `OPERATIONAL_TEMPLATE.md`, `C_COMPLEX_OBJECT.md`

✅ **Test Structure:**
- Location: `/tests/enhanced/am.test.ts`
- Basic test scaffolding (most tests commented out pending implementation)

✅ **Type Registry:**
- Location: `/enhanced/serialization/common/type_registry.ts`
- Bidirectional mapping between type names and constructors
- Supports module-level registration
- Used by all serializers/deserializers

✅ **Serialization Infrastructure:**
- XML, JSON, YAML serialization/deserialization
- TypeScript constructor format serialization
- Terse format support for CODE_PHRASE and DV_CODED_TEXT
- Configurable output formats

✅ **Simplified Creation Patterns:**
- Constructor-based initialization with nested objects
- Automatic type inference for DATA_VALUE descendants
- 69-76% code reduction compared to manual instantiation

### 2.2 What's Missing

❌ **ADL2 Parser:** No parser exists to read ADL2 files
❌ **Validation Engine:** No validation of RM instances against templates
❌ **Template-based Generation:** No code to generate RM instances from templates
❌ **Code Generator:** No scaffolding generator for TypeScript from templates
❌ **ADL Serialization:** Can't write AOM instances back to ADL2
❌ **Complete AM Method Implementation:** Many AM class methods are stubs

---

## 3. Goals and Non-Goals

### 3.1 Goals

**Primary Goals:**

1. ✅ Parse ADL2 archetypes and templates into AOM instances
2. ✅ Validate RM object instances against operational templates
3. ✅ Generate example RM instances from templates
4. ✅ Generate TypeScript scaffolding code from templates
5. ✅ Serialize AOM instances back to ADL2 format
6. ✅ Integrate validation into existing RM classes non-intrusively
7. ✅ Support both ADL2 and ADL 1.4 (conversion to ADL2)
8. ✅ Enable archetype editing and round-trip ADL ↔ AOM ↔ ADL
9. ✅ Support archetype slots and includes/excludes
10. ✅ Handle archetype specialization and flattening
11. ✅ Provide clear error messages for validation failures

**Secondary Goals:**

- ✅ Maintain zero or minimal new dependencies

### 3.2 Non-Goals

**Out of Scope for Phase 5a:**

- ❌ Visual archetype editor UI (potential future phase)
- ❌ Archetype repository implementation (potential future phase)
- ❌ Web template / Simplified data template/format (SDT) support (Phase 6?)
- ❌ Multi-user collaborative editing (Phase 7)
- ❌ Client-side form generation from templates (Phase 7)

---

## 4. Core Requirements

### 4.1 ADL2 Parser Requirements

**Functional Requirements:**

| Req ID | Requirement | Priority |
|--------|-------------|----------|
| P-1.1 | Parse ADL2 archetype files into ARCHETYPE instances | MUST |
| P-1.2 | Parse ADL2 template files into TEMPLATE instances | MUST |
| P-1.3 | Parse operational templates into OPERATIONAL_TEMPLATE instances | MUST |
| P-1.4 | Support all ADL2 constraint types (C_COMPLEX_OBJECT, C_ATTRIBUTE, primitives) | MUST |
| P-1.5 | Parse ODIN notation for metadata sections | MUST |
| P-1.6 | Parse archetype terminology sections | MUST |
| P-1.7 | Handle archetype slots with includes/excludes | MUST |
| P-1.8 | Parse rules/invariants section | SHOULD |
| P-1.9 | Support ADL 1.4 with conversion to ADL2 | MUST |
| P-1.10 | Provide detailed error messages with line/column numbers | MUST |

**Non-Functional Requirements:**

| Req ID | Requirement | Priority |
|--------|-------------|----------|
| P-2.1 | Parse typical archetype (< 500 lines) in < 100ms | SHOULD |
| P-2.2 | Handle large operational templates (> 5000 lines) | MUST |
| P-2.3 | Minimal memory footprint for parsed AOM | SHOULD |
| P-2.4 | Full TypeScript type safety where possible | MUST |
| P-2.5 | Zero or minimal dependencies if possible and not overcomplicating own code| SHOULD |

### 4.2 Validation Framework Requirements

**Functional Requirements:**

| Req ID | Requirement | Priority |
|--------|-------------|----------|
| V-1.1 | Validate RM instance existence constraints | MUST |
| V-1.2 | Validate RM instance cardinality constraints | MUST |
| V-1.3 | Validate RM instance occurrences constraints | MUST |
| V-1.4 | Validate primitive value constraints (ranges, patterns, lists) | MUST |
| V-1.5 | Validate terminology code constraints | MUST |
| V-1.6 | Validate archetype slot matches | MUST |
| V-1.7 | Validate attribute tuple constraints | SHOULD |
| V-1.8 | Evaluate rules/invariants | COULD |
| V-1.9 | Provide detailed validation error messages with paths | MUST |
| V-1.10 | Support partial validation (validate subtree) | SHOULD |

**Integration Requirements:**

| Req ID | Requirement | Priority |
|--------|-------------|----------|
| V-2.1 | Non-intrusive integration with existing RM classes | MUST |
| V-2.2 | Work with any RM version/extension | MUST |
| V-2.3 | Use existing TypeRegistry for type resolution | MUST |
| V-2.4 | Support validation during deserialization | SHOULD |
| V-2.5 | Make validation optional (can be manually disabled for performance) | SHOULD |

### 4.3 Generation Requirements

**RM Instance Generation:**

| Req ID | Requirement | Priority |
|--------|-------------|----------|
| G-1.1 | Generate valid RM instances from operational templates | MUST |
| G-1.2 | Generate example data for required attributes | MUST |
| G-1.3 | Support min/max example generation (minimal vs. full) | SHOULD |
| G-1.4 | Respect cardinality and occurrence constraints | MUST |

**TypeScript Code Generation:**

| Req ID | Requirement | Priority |
|--------|-------------|----------|
| G-2.1 | Configurable ability to generate TypeScript class/interface tree per template where both the root instance and its contained object instances are named after the natural language names in the corresponding template structures. A parameter selects wich natural language to use, otherwise defaults to the template's original/main language. The instance tree should have validation logic attached/included. Multiple choice options should be listed in jsdoc if the selection is under N (configurable) options | SHOULD |
| G-2.2 | Use simplified creation patterns and terse style to reduce code length | MUST |
| G-2.3 | Include JSDoc with archetype metadata | SHOULD |
| G-2.4 | Generate type-safe builders for complex structures | COULD |

### 4.4 Serialization Requirements

**ADL2 Serialization:**

| Req ID | Requirement | Priority |
|--------|-------------|----------|
| S-1.1 | Serialize AOM instances back to ADL2 format | MUST |
| S-1.2 | Preserve original formatting/comments | COULD |
| S-1.3 | Pretty-print with configurable indentation | SHOULD |
| S-1.4 | Round-trip: ADL2 → AOM → ADL2 (lossless) | MUST |

---

## 5. ADL2 Parser Architecture (Multiple Alternatives)

This section presents **four alternative approaches** for implementing the ADL2 parser, with detailed trade-offs to facilitate decision-making.

### 5.1 Alternative A: Hand-Written Recursive Descent Parser (RECOMMENDED)

**Description:**

A traditional recursive descent parser written directly in TypeScript, with manual tokenization and parsing logic.

**Architecture:**

```typescript
// Tokenizer
interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}

class ADL2Tokenizer {
  tokenize(input: string): Token[] { ... }
}

// Parser
class ADL2Parser {
  private tokens: Token[];
  private current = 0;

  parse(input: string): ARCHETYPE {
    this.tokens = new ADL2Tokenizer().tokenize(input);
    return this.parseArchetype();
  }

  private parseArchetype(): ARCHETYPE { ... }
  private parseHeader(): void { ... }
  private parseDefinition(): C_COMPLEX_OBJECT { ... }
  private parseTerminology(): ARCHETYPE_ONTOLOGY { ... }
  // ... more parsing methods
}
```

**Pros:**

- ✅ **Zero dependencies** - fits project philosophy
- ✅ **Full TypeScript type safety** - native integration
- ✅ **Easy to debug** - standard TypeScript debugging tools
- ✅ **Precise error messages** - custom error handling
- ✅ **Excellent IDE support** - autocomplete, refactoring
- ✅ **Complete control** - can optimize for specific use cases
- ✅ **Matches existing patterns** - similar to terse format parsing
- ✅ **Minimal bundle size** - no parser runtime
- ✅ **Incremental parsing possible** - can parse sections on demand

**Cons:**

- ❌ **More code to maintain** - ~2000-3000 lines of parser code
- ❌ **Manual grammar evolution** - must update parser code for ADL changes
- ❌ **Initial development time** - ~2-3 weeks for full implementation
- ❌ **Testing burden** - need extensive test coverage

**Implementation Complexity:** Medium-High

**Estimated LOC:** 2000-3000 lines (parser + tokenizer + error handling)

**Dependencies:** Zero

**Performance:** Excellent (fastest option, ~50-100ms for typical archetype)

**Maintainability:** Good (TypeScript native, clear code structure)

**Best For:**
- Projects prioritizing zero dependencies
- Teams comfortable with compiler theory
- Long-term maintainability over quick implementation

---

### 5.2 Alternative B: PEG Parser using Peggy

**Description:**

Use Peggy (formerly PEG.js) to generate a parser from a PEG grammar definition.

**Architecture:**

```
// Grammar file: adl2.peggy
archetype = header definition terminology rules?

header = "archetype" ... (PEG rules)
definition = "definition" ... (PEG rules)
// ... more grammar rules

// Usage:
import { parse } from "./generated-adl2-parser.js";
const archetype = parse(adlContent);
```

**Pros:**

- ✅ **Grammar as single source of truth** - easier to understand intent
- ✅ **Declarative syntax** - readable and maintainable grammar
- ✅ **Moderate dependencies** - only Peggy (~50KB runtime)
- ✅ **Faster initial development** - grammar is more concise than hand-written code
- ✅ **Good error recovery** - Peggy has built-in error handling
- ✅ **Can generate TypeScript** - type-safe output
- ✅ **Easier to validate against spec** - grammar closely mirrors ADL2 BNF

**Cons:**

- ❌ **New dependency** - adds `peggy` package (~50KB + build-time tool)
- ❌ **PEG limitations** - can be slower for complex backtracking
- ❌ **Less familiar** - team needs to learn PEG syntax
- ❌ **Build step required** - must generate parser from grammar
- ❌ **Debug complexity** - harder to debug generated code
- ❌ **Less IDE support** - grammar files have limited tooling

**Implementation Complexity:** Medium

**Estimated LOC:** ~500 lines (grammar) + integration code

**Dependencies:** `peggy` (~50KB runtime + build-time tool)

**Performance:** Good (~100-200ms for typical archetype)

**Maintainability:** Good (grammar-based, but requires PEG knowledge)

**Best For:**
- Teams familiar with parser generators
- Projects where grammar should be explicit
- When ADL2 spec changes frequently

---

### 5.3 Alternative C: ANTLR4 for TypeScript

**Description:**

Port the official ANTLR4 grammars from Archie to TypeScript target.

**Architecture:**

```
// Use Archie's grammars:
// - Adl.g4
// - cadl.g4
// - odin.g4

// ANTLR generates:
// - AdlLexer.ts
// - AdlParser.ts
// - AdlListener.ts

// Custom listener:
class AOMBuilder extends AdlBaseListener {
  enterArchetype(ctx) { ... }
  enterDefinition(ctx) { ... }
  // ... build AOM during tree walk
}
```

**Pros:**

- ✅ **Official grammars** - can reuse Archie's proven grammars directly
- ✅ **Industry standard** - ANTLR is mature and well-documented
- ✅ **Powerful** - handles complex grammars with ease
- ✅ **Large community** - extensive resources and examples
- ✅ **Best error recovery** - sophisticated error handling
- ✅ **Multiple backends** - same grammar for multiple languages

**Cons:**

- ❌ **Heavy dependency** - ANTLR4 runtime is ~300KB+
- ❌ **Verbose generated code** - thousands of lines
- ❌ **Large bundle size** - not suitable for browser use without tree-shaking
- ❌ **Steep learning curve** - ANTLR concepts are complex
- ❌ **Overkill for ADL2** - ADL2 is simpler than most ANTLR use cases
- ❌ **Build complexity** - requires ANTLR tool in build pipeline
- ❌ **TypeScript integration** - generated code is sometimes awkward

**Implementation Complexity:** Medium (grammar exists, but integration is complex)

**Estimated LOC:** ~300 lines (listener implementation) + generated code

**Dependencies:** `antlr4ts` (~300KB runtime + build-time tool)

**Performance:** Good (~150-250ms for typical archetype)

**Maintainability:** Medium (ANTLR expertise required)

**Best For:**
- Enterprise projects with complex grammar needs
- When bundle size is not a concern
- Teams already using ANTLR

#### 5.3.1 Deterministic Grammar-to-Parser Generation

**Question:** Can we create a deterministic translation process from ANTLR grammar to TypeScript parser, similar to how we generate TypeScript class stubs from BMM files?

**Answer:** Yes, with important caveats.

**What's Deterministic:**

The ANTLR4 toolchain provides deterministic generation:
1. **Grammar → Parser Code:** ANTLR4 generates consistent lexer/parser from `.g4` files
2. **Same grammar = Same output:** Running ANTLR4 twice produces identical code
3. **Version controlled:** Grammar files can be tracked and reviewed like BMM files

**Process:**

```bash
# Similar to BMM → TypeScript generation pipeline:
# Input: Official ANTLR4 grammars
grammars/Adl.g4
grammars/cadl.g4
grammars/odin.g4

# Generation step (deterministic):
antlr4 -Dlanguage=TypeScript -visitor -no-listener Adl.g4

# Output: Generated TypeScript parser
generated/AdlLexer.ts
generated/AdlParser.ts
generated/AdlVisitor.ts
```

**What's NOT Deterministic (requires manual work):**

1. **Visitor/Listener Implementation:**
   - The generated visitor/listener is just an interface
   - **Manual code required:** Transform parse tree → AOM instances
   - Similar to: Manual method implementation after BMM class generation

2. **Error Handling:**
   - ANTLR provides generic error listeners
   - **Manual code required:** Meaningful error messages for users

3. **Optimization:**
   - Generated parser works but may need performance tuning
   - **Manual code required:** Caching, incremental parsing

**Comparison to BMM Generation:**

| Aspect | BMM → TypeScript | ANTLR → TypeScript |
|--------|------------------|---------------------|
| **Input Format** | BMM JSON files | ANTLR4 .g4 grammars |
| **Generation Tool** | Custom TypeScript generator | ANTLR4 official tool |
| **Generated Output** | Class stubs with properties | Lexer/Parser/Visitor |
| **Manual Enhancement** | Method implementation | Visitor implementation + AOM construction |
| **Re-generation Safety** | Use /generated vs /enhanced split | Same pattern applicable |
| **Deterministic?** | ✅ Fully | ✅ Parser generation only |

**Recommended Approach if Using ANTLR:**

Follow the same pattern as BMM generation:

1. **Keep grammars in `/grammars`** - version controlled
2. **Generate to `/generated/parser`** - ANTLR output, regenerated on grammar updates
3. **Implement in `/enhanced/parser`** - hand-written visitor that builds AOM
4. **Comparison tool** - detect grammar changes, manually merge visitor updates

**Code Example:**

```typescript
// /generated/parser/AdlVisitor.ts (generated by ANTLR - DO NOT EDIT)
export class AdlVisitorBase<T> {
  visitArchetype(ctx: ArchetypeContext): T { ... }
  visitDefinition(ctx: DefinitionContext): T { ... }
}

// /enhanced/parser/AOMBuilder.ts (manual implementation)
export class AOMBuilder extends AdlVisitorBase<any> {
  visitArchetype(ctx: ArchetypeContext): ARCHETYPE {
    const archetype = new ARCHETYPE();
    archetype.archetype_id = this.parseArchetypeId(ctx.archetype_id());
    archetype.definition = this.visitDefinition(ctx.definition());
    // ... manual AOM construction
    return archetype;
  }
}
```

**Conclusion:**

While ANTLR provides deterministic parser generation, the **AOM construction logic still requires manual implementation**, similar to how BMM class stubs need manual method implementation. The key advantage is that grammar updates automatically propagate to parser code, but the visitor/listener must be manually maintained.

**Trade-off:** ANTLR's deterministic generation is valuable IF the ADL2 grammar changes frequently. However, ADL2 is relatively stable (version 2.x since ~2014), so the benefit may not justify the 300KB dependency.

---

#### 5.3.2 Using ANTLR Grammar to Accelerate Alternative Parser Implementations

**Question:** Can we use the official ANTLR grammar as input to generate stubs/scaffolding for OTHER parser strategies (hand-written, PEG), similar to how we generate class stubs from BMM files?

**Answer:** Yes! This is a powerful approach that combines the benefits of having an official, proven grammar with the flexibility to choose your implementation strategy.

**Concept: Grammar as Specification, Multiple Implementations**

```
┌──────────────────────────────────────────────────────────────┐
│ Input: Official ANTLR Grammar (Single Source of Truth)       │
│   grammars/Adl.g4, cadl.g4, odin.g4                          │
└──────────────────────────────────────────────────────────────┘
                           ↓
          ┌────────────────┼────────────────┐
          ↓                ↓                ↓
  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
  │ ANTLR Parser │  │ Hand-Written │  │ PEG Grammar  │
  │ (Alternative │  │ Parser Stubs │  │ (Peggy)      │
  │      C)      │  │ (Alternative │  │ (Alternative │
  │              │  │      A)      │  │      B)      │
  └──────────────┘  └──────────────┘  └──────────────┘
```

### Approach 1: ANTLR Grammar → Hand-Written Parser Stubs

**Goal:** Use ANTLR grammar to generate skeleton code for a hand-written recursive descent parser.

**Process:**

1. **Parse the ANTLR grammar** to extract rules and structure
2. **Generate TypeScript parser class stubs** with method signatures
3. **Developer fills in parsing logic** manually

**Example Transformation:**

```antlr
// Input: ANTLR grammar rule (Adl.g4)
archetype:
    'archetype' archetype_id
    specialize_section?
    language_section
    description_section
    definition_section
    terminology_section
    ;

definition_section:
    'definition' NEWLINE
    c_complex_object
    ;
```

**Generated Hand-Written Parser Stub:**

```typescript
// Generated: /generated/parser/ADL2ParserStubs.ts
// Based on ANTLR grammar Adl.g4

export class ADL2Parser {
  private tokens: Token[];
  private current = 0;

  // Generated from 'archetype' rule
  private parseArchetype(): ARCHETYPE {
    this.expect('archetype');
    const archetypeId = this.parseArchetypeId();
    const specialize = this.maybeParseSpecializeSection();
    const language = this.parseLanguageSection();
    const description = this.parseDescriptionSection();
    const definition = this.parseDefinitionSection();
    const terminology = this.parseTerminologySection();
    
    // TODO: Construct and return ARCHETYPE instance
    throw new Error("Not implemented");
  }

  // Generated from 'definition_section' rule
  private parseDefinitionSection(): C_COMPLEX_OBJECT {
    this.expect('definition');
    this.expect('NEWLINE');
    const cObject = this.parseCComplexObject();
    
    // TODO: Return parsed object
    throw new Error("Not implemented");
  }

  // Utility methods (also generated)
  private expect(keyword: string): void { /* TODO */ }
  private maybeParseSpecializeSection(): string | undefined { /* TODO */ }
  // ... more stubs
}
```

**Generation Script:**

```typescript
// tools/generate_parser_stubs_from_antlr.ts
import { ANTLRGrammarParser } from "./antlr_grammar_parser.ts";

const grammar = ANTLRGrammarParser.parseFile("grammars/Adl.g4");

for (const rule of grammar.rules) {
  const methodName = `parse${capitalize(rule.name)}`;
  const returnType = inferReturnType(rule);
  
  output += `
  private ${methodName}(): ${returnType} {
    ${generateRuleStub(rule)}
    throw new Error("Not implemented: ${rule.name}");
  }
  `;
}
```

**Benefits:**

- ✅ **Official grammar as source of truth** - ensures correctness
- ✅ **Hand-written implementation** - zero runtime dependencies
- ✅ **Accelerated development** - 70% of boilerplate generated
- ✅ **Type-safe signatures** - methods have correct return types
- ✅ **Grammar updates propagate** - re-run generator when grammar changes

**Manual Work Required:**

- Implement token recognition and consumption logic
- Add error handling and recovery
- Construct AOM instances from parsed data
- Performance optimization

### Approach 2: ANTLR Grammar → PEG Grammar

**Goal:** Transform ANTLR4 grammar to Peggy (PEG) grammar format.

**Process:**

1. **Parse ANTLR grammar** to extract rules
2. **Transform ANTLR syntax → PEG syntax**
3. **Generate .peggy file**
4. **Use Peggy to generate parser**

**Example Transformation:**

```antlr
// Input: ANTLR rule (Adl.g4)
archetype_id:
    ARCHETYPE_HRID
    | ARCHETYPE_REF
    ;

ARCHETYPE_HRID:
    (namespace '::')? rm_publisher '-' rm_package '-' rm_class '.' concept_id '.v' version
    ;
```

**Generated PEG Grammar:**

```peggy
// Generated: grammars/adl.peggy
// Transformed from ANTLR Adl.g4

archetype_id
  = ARCHETYPE_HRID
  / ARCHETYPE_REF

ARCHETYPE_HRID
  = namespace:((identifier "::"))? 
    publisher:identifier "-" 
    package:identifier "-" 
    rmclass:identifier "." 
    concept:identifier ".v" 
    version:version_id
    {
      return {
        namespace: namespace?.[0],
        rm_publisher: publisher,
        rm_package: package,
        rm_class: rmclass,
        concept_id: concept,
        version: version
      };
    }

identifier = [a-zA-Z_][a-zA-Z0-9_]*
```

**Transformation Rules:**

| ANTLR Syntax | PEG Equivalent | Notes |
|--------------|----------------|-------|
| `rule1 \| rule2` | `rule1 / rule2` | Choice operator |
| `rule?` | `rule?` | Optional (same) |
| `rule*` | `rule*` | Zero or more (same) |
| `rule+` | `rule+` | One or more (same) |
| `'keyword'` | `"keyword"` | String literals (quotes) |
| `~rule` | `!rule` | Negation |
| `fragment` | Helper rule | Both have helpers |

**Generation Script:**

```typescript
// tools/antlr_to_peg_converter.ts
import { ANTLRGrammarParser } from "./antlr_grammar_parser.ts";

const antlrGrammar = ANTLRGrammarParser.parseFile("grammars/Adl.g4");
const pegGrammar = convertToPEG(antlrGrammar);

Deno.writeTextFileSync("grammars/adl.peggy", pegGrammar);

function convertToPEG(grammar: ANTLRGrammar): string {
  return grammar.rules.map(rule => {
    const alternatives = rule.alternatives.map(alt => {
      return convertAlternative(alt);
    }).join("\n  / ");
    
    return `${rule.name}\n  = ${alternatives}\n`;
  }).join("\n");
}
```

**Benefits:**

- ✅ **Leverage official grammar** - proven correct
- ✅ **Get PEG advantages** - readable, maintainable
- ✅ **Smaller runtime** - ~50KB vs 300KB
- ✅ **Automatic updates** - grammar changes flow through

**Challenges:**

- ⚠️ **Semantic actions** - need manual translation
- ⚠️ **Left recursion** - ANTLR handles it, PEG doesn't (requires transformation)
- ⚠️ **Lexer vs. parser** - ANTLR separates them, PEG combines

### Approach 3: ANTLR Grammar → Test Cases

**Goal:** Use ANTLR grammar to generate comprehensive test suite for ANY parser implementation.

**Process:**

1. **Extract grammar rules** and create test cases for each
2. **Generate positive tests** (valid inputs)
3. **Generate negative tests** (invalid inputs)
4. **Use ANTLR parser** as reference implementation for expected results

**Example:**

```typescript
// Generated: tests/parser/grammar_derived_tests.ts
// Auto-generated from ANTLR grammar rules

Deno.test("archetype_id - valid HRID format", () => {
  const input = "openEHR-EHR-OBSERVATION.blood_pressure.v1";
  const result = parser.parseArchetypeId(input);
  
  assertEquals(result.rm_publisher, "openEHR");
  assertEquals(result.rm_package, "EHR");
  assertEquals(result.rm_class, "OBSERVATION");
  assertEquals(result.concept_id, "blood_pressure");
  assertEquals(result.version, "1");
});

Deno.test("archetype_id - with namespace", () => {
  const input = "org.example::openEHR-EHR-OBSERVATION.test.v1";
  const result = parser.parseArchetypeId(input);
  
  assertEquals(result.namespace, "org.example");
});

Deno.test("archetype_id - invalid format", () => {
  const input = "INVALID-FORMAT";
  assertThrows(() => parser.parseArchetypeId(input));
});
```

**Benefits:**

- ✅ **Comprehensive test coverage** - every grammar rule tested
- ✅ **Reference implementation** - ANTLR parser validates expected behavior
- ✅ **Any parser can use** - tests work for hand-written, PEG, or ANTLR
- ✅ **Regression detection** - grammar changes → new tests

### Practical Implementation Strategy

**Recommended Workflow:**

```bash
# 1. Use ANTLR grammar as specification
cd /home/runner/work/ehrtslib/ehrtslib
mkdir -p grammars
# Copy official ANTLR grammars from Archie
cp path/to/archie/Adl.g4 grammars/
cp path/to/archie/cadl.g4 grammars/
cp path/to/archie/odin.g4 grammars/

# 2. Generate multiple artifacts from grammar
deno run --allow-read --allow-write tools/generate_from_antlr.ts

# Outputs:
# - /generated/parser/hand_written_stubs.ts (Alternative A scaffold)
# - /generated/grammars/adl.peggy (Alternative B input)
# - /tests/parser/grammar_tests.ts (Test suite for any implementation)

# 3. Choose implementation approach and fill in logic
# - Hand-written: Implement stubs in /enhanced/parser
# - PEG: Use generated .peggy with Peggy tool
# - ANTLR: Use grammars directly with ANTLR

# 4. Run grammar-derived tests against your parser
deno test tests/parser/grammar_tests.ts
```

**Example Tool Structure:**

```typescript
// tools/generate_from_antlr.ts
import { ANTLRGrammarParser } from "./antlr_grammar_parser.ts";

const grammar = ANTLRGrammarParser.parseFile("grammars/Adl.g4");

// Generate hand-written parser stubs
const stubs = generateHandWrittenStubs(grammar);
Deno.writeTextFileSync("generated/parser/hand_written_stubs.ts", stubs);

// Generate PEG grammar
const pegGrammar = convertToPEG(grammar);
Deno.writeTextFileSync("generated/grammars/adl.peggy", pegGrammar);

// Generate test cases
const tests = generateTests(grammar);
Deno.writeTextFileSync("tests/parser/grammar_tests.ts", tests);

console.log("✅ Generated parser artifacts from ANTLR grammar");
console.log("   - Hand-written stubs: generated/parser/hand_written_stubs.ts");
console.log("   - PEG grammar: generated/grammars/adl.peggy");
console.log("   - Test suite: tests/parser/grammar_tests.ts");
```

### Comparison: Direct Implementation vs. Grammar-Assisted

| Aspect | Direct Hand-Written | Grammar-Assisted |
|--------|-------------------|------------------|
| **Development Time** | 2-3 weeks | 1-2 weeks (30-40% faster) |
| **Initial Learning** | Study ADL2 spec | Study ANTLR grammar |
| **Correctness** | Risk of interpretation errors | Grammar is proven correct |
| **Maintenance** | Manual updates | Regenerate from grammar |
| **Test Coverage** | Manual test writing | Auto-generated tests |
| **Dependencies** | Zero | ANTLR tooling (dev-only) |

### Recommendation: Hybrid Approach

**Best of Both Worlds:**

1. ✅ **Use ANTLR grammar** as specification and to generate:
   - Parser method stubs (70% of boilerplate)
   - Comprehensive test suite
   - Documentation of grammar structure

2. ✅ **Implement hand-written parser** in generated stubs:
   - Zero runtime dependencies
   - Full control over performance
   - TypeScript-native implementation

3. ✅ **Optional: Generate PEG grammar** for complex sub-sections if needed

**Process:**

```bash
# One-time setup
deno run tools/generate_from_antlr.ts

# Implement parser (manual work)
# Edit: /enhanced/parser/adl2_parser.ts (based on generated stubs)

# Validate against grammar-derived tests
deno test tests/parser/grammar_tests.ts

# When ANTLR grammar updates:
deno run tools/generate_from_antlr.ts
# Review diffs in generated stubs, manually merge changes
```

**Result:** 
- ✅ Benefits of official, proven grammar
- ✅ Zero runtime dependencies (hand-written implementation)
- ✅ 30-40% faster development (generated stubs + tests)
- ✅ High confidence in correctness (grammar-derived tests)

---

### 5.4 Alternative D: Hybrid Hand-Written + Peggy

**Description:**

Combine hand-written parsing for top-level structure with Peggy for complex sub-grammars.

**Architecture:**

```typescript
// Hand-written top-level parser
class ADL2Parser {
  parse(input: string): ARCHETYPE {
    const sections = this.splitIntoSections(input);
    
    return {
      header: this.parseHeaderManually(sections.header),
      definition: PeggyDefinitionParser.parse(sections.definition),
      terminology: this.parseTerminologyManually(sections.terminology),
      rules: PeggyRulesParser.parse(sections.rules)
    };
  }
  
  // Simple, line-oriented parsing by hand
  private parseHeaderManually(header: string): HeaderData { ... }
  
  // Complex constraint expressions use Peggy
  private parseConstraints = ConstraintPeggyParser.parse;
}
```

**Pros:**

- ✅ **Best of both worlds** - simple parts by hand, complex parts with Peggy
- ✅ **Minimal dependencies** - only Peggy, and only for complex parts
- ✅ **Optimized performance** - hand-written parts are fastest
- ✅ **Flexible** - can choose best tool for each part
- ✅ **Gradual adoption** - start hand-written, add Peggy as needed

**Cons:**

- ❌ **Mixed approach** - requires understanding both techniques
- ❌ **Coordination complexity** - need to carefully split responsibilities
- ❌ **Potential inconsistency** - different error handling styles

**Implementation Complexity:** Medium

**Estimated LOC:** ~1500 lines (hand-written) + ~300 lines (grammars)

**Dependencies:** `peggy` (~50KB runtime, only for complex sub-parsers)

**Performance:** Excellent (hand-written fast path, Peggy for complex cases)

**Maintainability:** Good (pragmatic approach)

**Best For:**
- Projects wanting to minimize dependencies while leveraging tools where beneficial
- When 80% of parsing is straightforward, 20% is complex

---

## 5.5 Runtime Deployment Scenarios: Impact on Clinical Applications

### 5.5.1 Overview: Where Parsers Live vs. Where Templates Work

**Critical Distinction:**

In production clinical data entry applications and EHR systems, **the ADL2 parser is typically NOT deployed at runtime**. Instead, it runs during **configuration/setup phases**, and the runtime uses pre-processed artifacts.

**Typical Deployment Architecture:**

```
┌─────────────────────────────────────────────────────────────┐
│ Configuration Phase (Development/Setup)                      │
│ - Runs on development machines or configuration servers     │
│ - May run infrequently (monthly, per template update)       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ADL2 Files                                                   │
│     ↓                                                         │
│  [ADL2 Parser] ← Parser choice matters HERE                  │
│     ↓                                                         │
│  AOM Instance                                                 │
│     ↓                                                         │
│  [Code Generator / OPT Serializer]                           │
│     ↓                                                         │
│  Runtime Artifacts:                                           │
│    • Operational Templates (OPT) as JSON/XML                 │
│    • Generated TypeScript validation code                     │
│    • Pre-computed selection lists                            │
│    • Constraint metadata for UI                              │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                          ↓ (Deploy to production)
┌─────────────────────────────────────────────────────────────┐
│ Runtime Phase (Clinical Data Entry)                          │
│ - Runs on end-user devices (browser, mobile, desktop)       │
│ - Must be fast, lightweight, zero latency                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Runtime Bundle (NO PARSER INCLUDED):                        │
│    • RM classes (COMPOSITION, OBSERVATION, etc.)             │
│    • Template Validator (uses OPT JSON, not ADL2)           │
│    • Generated form code / builders                          │
│    • UI components                                           │
│                                                               │
│  User enters data → Validates against OPT → Saves RM JSON   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 5.5.2 Impact of Parser Choice on Different Deployment Scenarios

#### Scenario 1: Server-Side Template Management System

**Use Case:** Central template repository, administrative template editor

**Where Parser Runs:** Backend server (Node.js/Deno)

**Parser Impact:**

| Parser Choice | Impact | Rationale |
|---------------|--------|-----------|
| **Hand-Written** | ✅ Excellent | Zero dependencies, fast server-side parsing, easy to debug |
| **Peggy** | ✅ Good | Small footprint acceptable on server, grammar readability helpful |
| **ANTLR4** | ⚠️ Acceptable | 300KB not critical on server, but overkill; slow cold-start |
| **Hybrid** | ✅ Excellent | Flexibility useful for complex template editor features |

**Deployment:** Parser is part of template management service, never sent to clients.

#### Scenario 2: Build-Time Code Generation

**Use Case:** Generate TypeScript code from templates during application build

**Where Parser Runs:** CI/CD pipeline, developer machines

**Parser Impact:**

| Parser Choice | Impact | Rationale |
|---------------|--------|-----------|
| **Hand-Written** | ✅ Excellent | Fast build times, no external tools needed |
| **Peggy** | ✅ Excellent | Grammar as documentation, easy to maintain in team |
| **ANTLR4** | ⚠️ Acceptable | Build-time dependency okay; slower builds |
| **Hybrid** | ✅ Excellent | Best of both worlds for complex generation logic |

**Deployment:** Parser only in dev dependencies, **NEVER in production bundle**.

#### Scenario 3: Browser-Based Form Builder / Template Editor

**Use Case:** Clinical informaticians design forms in browser

**Where Parser Runs:** Client-side (browser)

**Parser Impact:**

| Parser Choice | Impact | Rationale |
|---------------|--------|-----------|
| **Hand-Written** | ✅ **CRITICAL ADVANTAGE** | Zero runtime, <10KB code, no external libs |
| **Peggy** | ⚠️ Acceptable | +50KB runtime, acceptable for admin tool but not ideal |
| **ANTLR4** | ❌ **Poor** | +300KB runtime, huge bundle size, page load impact |
| **Hybrid** | ✅ Good | Hand-written for core, Peggy only if needed |

**Critical Metric:** Initial page load time and bundle size directly impact user experience.

#### Scenario 4: Mobile Clinical Data Entry App

**Use Case:** Nurse records vitals on tablet, constrained bandwidth/storage

**Where Parser Runs:** **NOT AT ALL** - uses pre-compiled OPTs

**Parser Impact:**

| Parser Choice | Impact on Runtime | Rationale |
|---------------|-------------------|-----------|
| **Any** | ✅ **Zero impact** | Parser not deployed; only validation code (~20-50KB) |

**Runtime Bundle:**
```typescript
// What ships to mobile app:
import { TemplateValidator } from "./validator.ts";        // ~20KB
import { BloodPressureTemplate } from "./templates.ts";   // ~5KB OPT JSON

// NO PARSER CODE INCLUDED

const validator = new TemplateValidator();
const result = validator.validate(patientData, BloodPressureTemplate);
```

#### Scenario 5: Desktop EHR System (Electron/Native)

**Use Case:** Hospital workstation running native EHR application

**Where Parser Runs:** **Hybrid** - may parse at startup if dynamic templates

**Parser Impact:**

| Parser Choice | Impact | Rationale |
|---------------|--------|-----------|
| **Hand-Written** | ✅ Excellent | Fast startup, no DLL dependencies |
| **Peggy** | ✅ Good | Desktop has resources, 50KB acceptable |
| **ANTLR4** | ⚠️ Acceptable | Desktop can handle 300KB, but slower startup |
| **Hybrid** | ✅ Excellent | Can parse common templates fast, complex ones with Peggy |

**Consideration:** If templates are updated frequently (e.g., hospital policy changes), having lightweight parser in app enables hot-reloading without app update.

### 5.5.3 What Actually Runs at Clinical Data Entry Time

**Runtime Validator (Small, Always Present):**

```typescript
// ~20-50KB depending on features
class TemplateValidator {
  validate(rmInstance: any, opt: OPERATIONAL_TEMPLATE): ValidationResult {
    // Uses pre-flattened OPT (JSON format)
    // NO parsing of ADL2 required
    // Validates occurrences, cardinality, primitives, terminology
  }
}
```

**Generated Template-Specific Code (Optional, Recommended):**

```typescript
// Generated at build time from OPT using parser
// ~2-5KB per template
export class BloodPressureForm {
  // Pre-computed selection lists
  static POSITIONS = ["Sitting", "Standing", "Lying"];
  static LOCATIONS = ["Left arm", "Right arm"];
  
  // Type-safe builder with embedded validation
  static create(data: BloodPressureData): COMPOSITION {
    // No parser needed - just TypeScript code
    return new COMPOSITION({
      archetype_node_id: "openEHR-EHR-OBSERVATION.blood_pressure.v1",
      // ... pre-generated structure
    });
  }
}
```

**Operational Template (Pre-Compiled Artifact):**

```json
// ~5-50KB per template (JSON format)
{
  "_type": "OPERATIONAL_TEMPLATE",
  "archetype_id": "openEHR-EHR-OBSERVATION.blood_pressure.v1",
  "definition": {
    "_type": "C_COMPLEX_OBJECT",
    "rm_type_name": "OBSERVATION",
    "attributes": [/* flattened constraints */]
  },
  "terminology": {/* pre-compiled terminology */}
}
```

### 5.5.4 Decision Impact Summary

**If your primary deployment is:**

1. **Mobile/Browser Clinical Apps (Most Common):**
   - **Parser choice doesn't affect runtime** ✅
   - Use ANY parser - it only runs at build time
   - Focus on: Validation code size (<50KB) and OPT efficiency

2. **Browser-Based Template Editor:**
   - **Parser choice CRITICAL** ⚠️
   - **STRONGLY prefer:** Hand-Written (Alternative A) or Hybrid (Alternative D)
   - **Avoid:** ANTLR4 (Alternative C) - too heavy for browser

3. **Server-Side Template Management:**
   - **Parser choice low impact** ✅
   - Any option acceptable
   - Consider: Team familiarity, maintainability

4. **Build-Time Code Generation:**
   - **Parser choice medium impact** ⚠️
   - Affects: Build speed, developer experience
   - **Prefer:** Hand-Written or Peggy for faster builds

### 5.5.5 Bundle Size Analysis for Clinical Apps

**Typical Runtime Bundle Composition:**

```
Clinical Data Entry App Bundle:
├─ RM Classes (COMPOSITION, OBSERVATION, etc.)    ~80KB
├─ Template Validator                              ~30KB
├─ Operational Templates (5-10 templates)          ~50KB
├─ Generated Form Helpers                          ~20KB
├─ UI Framework (React/Vue/Svelte)               ~100KB
├─ Application Code                               ~50KB
└─ TOTAL                                         ~330KB

❌ DO NOT ADD: ADL2 Parser (0KB if using build-time generation)
⚠️ IF ADDED: 
   - Hand-Written: +0KB (build-time only)
   - Peggy: +50KB (if runtime parsing needed)
   - ANTLR4: +300KB (❌ NOT RECOMMENDED for clinical apps)
```

**Key Insight:** By using **build-time parsing**, even ANTLR4's 300KB dependency never reaches clinical users. The choice affects developer experience and build time, NOT end-user experience.

### 5.5.6 Recommendation by Deployment Model

| Deployment Model | Recommended Parser | Reason |
|------------------|-------------------|---------|
| **Mobile Clinical App** | Any (build-time) | Parser not deployed |
| **Web Clinical App** | Any (build-time) | Parser not deployed |
| **Browser Template Editor** | Hand-Written or Hybrid | Bundle size critical |
| **Server Template API** | Any | Resources available |
| **Desktop EHR** | Hand-Written or Hybrid | Fast startup important |
| **Build Pipeline** | Hand-Written or Peggy | Fast builds preferred |

**Overall Recommendation Unchanged:** **Alternative A (Hand-Written)** provides best developer experience across ALL scenarios, with zero runtime cost and fastest build times.

---

## 6. Validation Framework Design

### 6.1 Architecture Overview

**Core Components:**

```typescript
// Main validator
class TemplateValidator {
  validate(
    rmInstance: any,
    template: OPERATIONAL_TEMPLATE,
    config?: ValidationConfig
  ): ValidationResult;
}

// Specialized validators
class OccurrenceValidator {
  validateOccurrences(rmValue: any, constraint: C_OBJECT): ValidationMessage[];
}

class CardinalityValidator {
  validateCardinality(collection: any[], constraint: C_ATTRIBUTE): ValidationMessage[];
}

class PrimitiveValidator {
  validatePrimitive(value: any, constraint: C_PRIMITIVE_OBJECT): ValidationMessage[];
}

class TerminologyValidator {
  validateCode(code: CODE_PHRASE, constraint: C_TERMINOLOGY_CODE): ValidationMessage[];
}

// Validation result
interface ValidationResult {
  valid: boolean;
  errors: ValidationMessage[];
  warnings: ValidationMessage[];
}

interface ValidationMessage {
  path: string;           // RM path: /content[0]/data/events[0]/data
  archetypePath: string;  // Archetype path: /data/events[at0001]/data
  message: string;
  severity: 'error' | 'warning' | 'info';
  constraintType: string; // 'occurrence' | 'cardinality' | 'primitive' | etc.
}
```

### 6.2 Validation Strategy

**Path-Based Matching:**

1. Traverse RM instance tree
2. For each node, find matching C_OBJECT in template definition
3. Apply all constraints at that node
4. Recurse into children

**Example:**

```typescript
function validateNode(
  rmNode: any,
  cObject: C_OBJECT,
  path: string
): ValidationMessage[] {
  const messages: ValidationMessage[] = [];
  
  // Validate occurrences
  messages.push(...occurrenceValidator.validate(rmNode, cObject));
  
  // Validate primitive constraints
  if (cObject instanceof C_PRIMITIVE_OBJECT) {
    messages.push(...primitiveValidator.validate(rmNode, cObject));
  }
  
  // Validate complex object attributes
  if (cObject instanceof C_COMPLEX_OBJECT) {
    for (const cAttribute of cObject.attributes || []) {
      const rmValue = rmNode[cAttribute.rm_attribute_name];
      messages.push(...validateAttribute(rmValue, cAttribute, path));
    }
  }
  
  return messages;
}
```

### 6.3 Integration with RM Classes

**Option 1: External Validator (RECOMMENDED)**

```typescript
// No changes to RM classes
// Validation is external service

const validator = new TemplateValidator();
const result = validator.validate(composition, template);

if (!result.valid) {
  console.error("Validation failed:", result.errors);
}
```

**Pros:**
- ✅ Non-intrusive - no changes to existing RM classes
- ✅ Separation of concerns
- ✅ Can validate any RM version
- ✅ Optional - doesn't impact performance when not used

**Option 2: Mixin Pattern**

```typescript
// Add validation methods to instances via mixin

interface Validatable {
  validate(template: OPERATIONAL_TEMPLATE): ValidationResult;
}

function makeValidatable<T>(instance: T): T & Validatable {
  return Object.assign(instance, {
    validate(template) {
      return new TemplateValidator().validate(this, template);
    }
  });
}

// Usage:
const validatableComp = makeValidatable(composition);
const result = validatableComp.validate(template);
```

**Pros:**
- ✅ Convenient API - validate() on instances
- ✅ Still non-intrusive - opt-in per instance

**Cons:**
- ❌ Runtime overhead - adds methods to instances

**Option 3: Decorator Pattern**

```typescript
// Wrap RM instances in validation-aware wrapper

class ValidatedRM<T> {
  constructor(
    private instance: T,
    private template: OPERATIONAL_TEMPLATE
  ) {}
  
  get value(): T {
    return this.instance;
  }
  
  validate(): ValidationResult {
    return new TemplateValidator().validate(this.instance, this.template);
  }
  
  // Proxy all property access with validation
  set(path: string, value: any): void {
    // Set value
    (this.instance as any)[path] = value;
    // Validate immediately
    const result = this.validate();
    if (!result.valid) {
      throw new ValidationError(result);
    }
  }
}
```

**Pros:**
- ✅ Automatic validation on mutation
- ✅ Type-safe wrapper

**Cons:**
- ❌ Complex - requires proxy pattern
- ❌ Performance overhead

**RECOMMENDATION:** Use **Option 1 (External Validator)** for simplicity and non-intrusiveness.

### 6.4 Type Registry Integration

The validation framework will use the existing TypeRegistry to resolve type names:

```typescript
class TemplateValidator {
  constructor(private typeRegistry: TypeRegistry) {}
  
  private getInstanceType(instance: any): string | undefined {
    return this.typeRegistry.getTypeNameFromInstance(instance);
  }
  
  private matchesType(instance: any, rmTypeName: string): boolean {
    const instanceType = this.getInstanceType(instance);
    // Check exact match or inheritance
    return instanceType === rmTypeName || this.isSubtype(instanceType, rmTypeName);
  }
}
```

---

## 7. Template-Based Code Generation

### 7.1 RM Instance Generation

**Goal:** Generate example RM instances from an operational template.

**Approach:**

```typescript
class RMInstanceGenerator {
  generate(
    template: OPERATIONAL_TEMPLATE,
    mode: 'minimal' | 'example' | 'maximal' = 'example'
  ): any {
    return this.generateFromCObject(template.definition, mode);
  }
  
  private generateFromCObject(cObject: C_OBJECT, mode: string): any {
    // Get RM class from type registry
    const RMClass = TypeRegistry.getConstructor(cObject.rm_type_name);
    if (!RMClass) {
      throw new Error(`Unknown RM type: ${cObject.rm_type_name}`);
    }
    
    const instance = new RMClass();
    
    // Set archetype_node_id if present
    if (cObject.node_id) {
      instance.archetype_node_id = cObject.node_id;
    }
    
    // Generate attributes
    if (cObject instanceof C_COMPLEX_OBJECT) {
      for (const cAttribute of cObject.attributes || []) {
        this.generateAttribute(instance, cAttribute, mode);
      }
    }
    
    return instance;
  }
  
  private generateAttribute(instance: any, cAttribute: C_ATTRIBUTE, mode: string): void {
    const attrName = cAttribute.rm_attribute_name;
    
    // Check cardinality
    const isMultiple = cAttribute.cardinality !== undefined;
    
    if (isMultiple) {
      // Generate array
      const min = mode === 'minimal' ? (cAttribute.cardinality?.interval?.lower || 0) : 1;
      const max = mode === 'maximal' ? (cAttribute.cardinality?.interval?.upper || 2) : 1;
      const count = Math.min(max, Math.max(min, 1));
      
      instance[attrName] = [];
      for (let i = 0; i < count; i++) {
        const child = this.generateFromCObject(cAttribute.children[0], mode);
        instance[attrName].push(child);
      }
    } else {
      // Generate single value
      if (cAttribute.children && cAttribute.children.length > 0) {
        instance[attrName] = this.generateFromCObject(cAttribute.children[0], mode);
      }
    }
  }
  
  // Generate primitive values
  private generatePrimitive(cPrimitive: C_PRIMITIVE_OBJECT): any {
    if (cPrimitive instanceof C_STRING) {
      return cPrimitive.list?.[0] || cPrimitive.pattern || "example text";
    }
    if (cPrimitive instanceof C_INTEGER) {
      return cPrimitive.list?.[0] || cPrimitive.range?.lower || 0;
    }
    // ... more primitive types
  }
}
```

**Usage:**

```typescript
const generator = new RMInstanceGenerator();

// Generate minimal valid instance
const minimal = generator.generate(template, 'minimal');

// Generate example with reasonable data
const example = generator.generate(template, 'example');

// Generate maximal instance (all optional fields)
const maximal = generator.generate(template, 'maximal');
```

### 7.2 TypeScript Scaffolding Generation

**Goal:** Generate TypeScript code that creates template-specific helpers/scaffolds as described in Req ID G-2.1 above

Note that the approaches below and their examples were written before Req ID G-2.1 was considerably updated in the PRD, so let the requirement have precedence, not the examples

**Approach 1: Helper Functions**

```typescript
class TypeScriptScaffoldingGenerator {
  generate(template: OPERATIONAL_TEMPLATE): string {
    const templateName = this.getTemplateName(template);
    
    return `
// Generated from: ${template.archetype_id?.value}
// Template: ${templateName}

import * as rm from "./openehr_rm.ts";
import * as base from "./openehr_base.ts";

/**
 * Create a ${templateName} composition
 */
export function create${templateName}(data: ${templateName}Data): rm.COMPOSITION {
  return new rm.COMPOSITION({
    archetype_node_id: "${template.archetype_id?.value}",
    name: data.name,
    // ... more fields from template
  });
}

/**
 * Data structure for ${templateName}
 */
export interface ${templateName}Data {
  name: string;
  // ... fields derived from template constraints
}

/**
 * Validate a ${templateName} composition
 */
export function validate${templateName}(comp: rm.COMPOSITION): ValidationResult {
  const validator = new TemplateValidator();
  return validator.validate(comp, ${templateName}Template);
}

// Template definition (embedded)
const ${templateName}Template: OPERATIONAL_TEMPLATE = ${this.serializeTemplate(template)};
`;
  }
}
```

**Approach 2: Type-Safe Builder**

```typescript
class BuilderGenerator {
  generate(template: OPERATIONAL_TEMPLATE): string {
    return `
export class ${templateName}Builder {
  private composition: rm.COMPOSITION;
  
  constructor() {
    this.composition = new rm.COMPOSITION({
      archetype_node_id: "${template.archetype_id?.value}",
    });
  }
  
  setName(name: string): this {
    this.composition.name = name;
    return this;
  }
  
  // ... more fluent setters
  
  build(): rm.COMPOSITION {
    // Validate before returning
    const result = new TemplateValidator().validate(this.composition, template);
    if (!result.valid) {
      throw new Error(\`Invalid composition: \${result.errors}\`);
    }
    return this.composition;
  }
}

// Usage:
const comp = new ${templateName}Builder()
  .setName("Blood Pressure")
  .addEvent({ time: "2024-01-01", ... })
  .build();
`;
  }
}
```

**Output Format Options:**

Users can choose:
1. **Helper functions** (simple, functional style)
2. **Builder classes** (fluent, chainable API)
3. **Both** (full toolkit)

---

## 8. Integration Strategy

### 8.1 Non-Intrusive Integration

**Principle:** AM validation should not require changes to existing RM classes.

**Strategy:**

1. **External Validation Service**
   - TemplateValidator operates on RM instances
   - No RM class modifications required
   - Optional usage

2. **Type Registry Extension**
   - Already exists and is used by serializers
   - Validation will reuse it for type lookups
   - No breaking changes

3. **Serialization Integration**
   - Add optional validation during deserialization
   - New config option: `validateAgainstTemplate?: OPERATIONAL_TEMPLATE`
   - Backward compatible

**Example:**

```typescript
// Deserialize with validation
const deserializer = new JsonCanonicalDeserializer({
  validateAgainstTemplate: myTemplate  // Optional
});

const composition = deserializer.deserialize(jsonString);
// Throws if validation fails (if template provided)
```

### 8.2 Versioning Strategy

**Challenge:** BMM updates may change RM/AM classes.

**Solution:**

1. **Keep generated and enhanced separate** (already done)
   - `/generated/openehr_am.ts` - regenerated from BMM
   - `/enhanced/openehr_am.ts` - hand-edited with implementations

2. **Comparison tool** (already exists)
   - `tasks/compare_bmm_versions.ts`
   - Shows diffs between BMM versions
   - Helps manual merge

3. **Validation logic external**
   - Validator doesn't depend on specific RM version
   - Uses TypeRegistry for runtime type info

### 8.3 Future RM Extensions

The validation framework must support:

1. **Custom RM extensions** (e.g., hospital-specific classes)
2. **Multiple RM versions** (RM 1.0.4 vs 1.1.0)
3. **Alternative RMs** (e.g., non-openEHR models)

**Approach:**

```typescript
interface RMInfo {
  isSubtypeOf(type: string, parentType: string): boolean;
  getProperties(type: string): PropertyInfo[];
  instantiate(type: string): any;
}

class TemplateValidator {
  constructor(
    private rmInfo: RMInfo,  // Pluggable RM metadata
    private typeRegistry: TypeRegistry
  ) {}
}

// Default implementation for openEHR RM
class OpenEHRRMInfo implements RMInfo {
  isSubtypeOf(type: string, parentType: string): boolean {
    // Use BMM hierarchy
  }
  
  getProperties(type: string): PropertyInfo[] {
    // Use BMM property definitions
  }
}
```

---

## 9. Implementation Phases

### 9.1 Phase 5b.1: Foundation (Weeks 1-2)

**Goal:** Basic infrastructure and parser choice.

**Tasks:**

1. ✅ Complete this PRD and get stakeholder approval
2. ✅ Choose parser approach (recommend Alternative A or D)
3. ✅ Set up parser structure and tokenizer
4. ✅ Implement AM class methods per `/tasks/instructions/am/` files
5. ✅ Create parser test suite with example ADL2 files

**Deliverables:**

- Parser skeleton
- Tokenizer with basic token types
- AM class methods implemented
- Test suite structure

### 9.2 Phase 5b.2: Parser Implementation (Weeks 3-5)

**Goal:** Complete ADL2 parser.

**Tasks:**

1. ✅ Implement header section parsing
2. ✅ Implement definition section parsing (C_COMPLEX_OBJECT tree)
3. ✅ Implement terminology section parsing
4. ✅ Implement ODIN notation parser
5. ✅ Implement error handling and recovery
6. ✅ Test with Archie's test archetypes

**Deliverables:**

- Working ADL2 parser
- Comprehensive test coverage
- Error message system

### 9.3 Phase 5b.3: Validation Framework (Weeks 6-8)

**Goal:** Implement template validation.

**Tasks:**

1. ✅ Implement occurrence validator
2. ✅ Implement cardinality validator
3. ✅ Implement primitive constraint validators
4. ✅ Implement terminology validator
5. ✅ Implement main TemplateValidator orchestrator
6. ✅ Test with real RM instances and templates

**Deliverables:**

- Working validation framework
- Validation test suite
- Integration with type registry

### 9.4 Phase 5b.4: Generation (Weeks 9-10)

**Goal:** Generate RM instances and TypeScript code.

**Tasks:**

1. ✅ Implement RM instance generator
2. ✅ Implement TypeScript scaffolding generator
3. ✅ Add generation examples to documentation
4. ✅ Test generated code

**Deliverables:**

- RM instance generator
- TypeScript code generator
- Examples and documentation

### 9.5 Phase 5b.5: Serialization & Polish (Weeks 11-12)

**Goal:** ADL2 serialization and refinement.

**Tasks:**

1. ✅ Implement ADL2 serializer (AOM → ADL2)
2. ✅ Test round-trip: ADL2 → AOM → ADL2
3. ✅ Integration with existing serializers
4. ✅ Documentation and examples
5. ✅ Performance optimization

**Deliverables:**

- ADL2 serializer
- Complete documentation
- Example workflows

### 9.6 Phase 5b.6: ADL 1.4 Support & Archetype Specialization (Weeks 13-14)

**Goal:** Support legacy ADL 1.4 and implement archetype specialization/flattening.

**Tasks:**

1. ✅ Implement ADL 1.4 parser (or converter)
2. ✅ Conversion: ADL 1.4 → ADL2 (+ roundtrip testing → ADL 1.4)
3. ✅ Test with realistic archetypes/templates from openEHR
4. ✅ Implement archetype specialization rules
5. ✅ Implement template flattening engine
6. ✅ Test specialization and flattening with real archetypes

**Deliverables:**

- ADL 1.4 support
- Conversion utility
- Archetype specialization implementation
- Template flattening capability

---

## 10. Decision Matrices

### 10.1 Parser Approach Decision Matrix

| Criterion | Weight | Alt A: Hand-Written | Alt B: Peggy | Alt C: ANTLR4 | Alt D: Hybrid |
|-----------|--------|---------------------|--------------|---------------|---------------|
| **Zero Dependencies** | 25% | 10 | 6 | 0 | 7 |
| **TypeScript Integration** | 20% | 10 | 8 | 5 | 9 |
| **Maintainability** | 15% | 8 | 9 | 6 | 8 |
| **Performance** | 15% | 10 | 7 | 7 | 9 |
| **Development Speed** | 10% | 4 | 8 | 7 | 6 |
| **Debugging Ease** | 10% | 10 | 6 | 4 | 8 |
| **Bundle Size** | 5% | 10 | 8 | 2 | 9 |
| **TOTAL** | 100% | **8.65** | **7.35** | **4.70** | **8.05** |

**Scoring:** 0 (worst) to 10 (best)

**Analysis:**

- **Alternative A (Hand-Written)** scores highest due to zero dependencies and excellent TypeScript integration
- **Alternative D (Hybrid)** is close second, offering pragmatic balance
- **Alternative C (ANTLR4)** scores lowest due to heavy dependencies and complexity
- **Alternative B (Peggy)** is middle-ground option

**Note on Grammar-Assisted Development (Section 5.3.2):**

All alternatives can benefit from using the official ANTLR grammar as input to generate scaffolding:
- **Alternative A:** Generate hand-written parser stubs (30-40% faster development)
- **Alternative B:** Transform ANTLR → PEG grammar (ensures correctness)
- **Alternative D:** Generate stubs for hand-written part, use grammar for complex parts
- **All alternatives:** Generate comprehensive test suites from grammar

This approach provides the best of both worlds: official proven grammar as specification + chosen implementation strategy.

**RECOMMENDATION:** Choose **Alternative A (Hand-Written)** for Phase 5a, using ANTLR grammar to generate parser stubs and tests (Section 5.3.2). Option to add Peggy for complex sub-grammars (Alternative D) if needed during implementation.

### 10.2 Validation Integration Decision Matrix

| Criterion | Weight | External Validator | Mixin Pattern | Decorator Pattern |
|-----------|--------|-------------------|---------------|-------------------|
| **Non-Intrusive** | 30% | 10 | 8 | 7 |
| **Performance** | 20% | 9 | 7 | 5 |
| **Ease of Use** | 20% | 8 | 9 | 7 |
| **TypeScript Integration** | 15% | 10 | 8 | 9 |
| **Flexibility** | 15% | 10 | 7 | 6 |
| **TOTAL** | 100% | **9.15** | **7.90** | **6.65** |

**RECOMMENDATION:** Use **External Validator** approach.

---

## 11. Technical Risks and Mitigations

### 11.1 Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **ADL2 grammar complexity underestimated** | Medium | High | Start with parser for subset, expand iteratively. Use Archie test suite for validation. **Use ANTLR grammar to generate stubs (Section 5.3.2) - reduces development time by 30-40%.** |
| **Parser performance issues** | Low | Medium | Profile early, optimize hot paths, consider incremental parsing. |
| **Validation too strict/loose** | Medium | High | Extensive testing with real archetypes. Reference Archie behavior. Allow configurable strictness. **Use grammar-derived tests for comprehensive coverage.** |
| **Integration breaks existing code** | Low | High | Comprehensive regression testing. Make validation opt-in. Use external validator pattern. |
| **Template flattening complexity** | Medium | Medium | Start with operational templates (already flattened). Add flattening in later phase. |
| **Type system limitations** | Low | Medium | Use TypeRegistry for runtime type info. Document limitations clearly. |
| **Grammar updates require parser changes** | Low | Low | **Use ANTLR grammar as source to regenerate stubs and tests (Section 5.3.2) - grammar changes automatically propagate.** |

### 11.2 Open Questions

**For Decision Before Implementation:**

1. **Parser Approach:** Which alternative (A, B, C, or D)? → Recommended: A with grammar-assisted stub generation
2. **Archetype Repository:** File-based or in-memory? → File-based initially, abstract later
3. **Performance Targets:** What's acceptable for parsing/validation? → <100ms parse, <50ms validation typical archetype
4. **Template Flattening Implementation Strategy:** Build flattening engine or start with pre-flattened OPTs and add later? → Requires decision given it's now a Primary Goal
5. **ADL 1.4 Conversion Strategy:** Full bidirectional conversion or ADL 1.4→ADL2 only? → Requires decision given it's now a Primary Goal

---

## 12. Success Criteria

### 12.1 Functional Success Criteria

- ✅ Parse valid ADL2 archetypes and templates into AOM instances
- ✅ Parse and convert ADL 1.4 archetypes to ADL2 format
- ✅ Validate RM instances against operational templates with >95% accuracy vs. Archie
- ✅ Validate archetype slot matches and constraints
- ✅ Generate valid RM instances from templates
- ✅ Generate TypeScript scaffolding code that compiles without errors
- ✅ Serialize AOM instances back to ADL2 format with round-trip capability
- ✅ Support archetype specialization and template flattening
- ✅ Pass all tests from Archie's test suite (adapted to TypeScript)

### 12.2 Non-Functional Success Criteria

- ✅ Parser: < 100ms for typical archetype (< 500 lines)
- ✅ Validator: < 50ms for typical RM instance
- ✅ Dependencies: Zero new dependencies (or only Peggy if hybrid approach)
- ✅ Bundle size: < 50KB additional for AM layer (excluding AOM instances)
- ✅ Test coverage: > 80% line coverage for parser and validator
- ✅ Documentation: Complete guide with examples for all features

### 12.3 Acceptance Criteria

**Minimum Viable Product (MVP):**

1. Parse ADL2 operational templates
2. Validate COMPOSITION instances against templates
3. Generate minimal RM instances from templates
4. Basic error messages for validation failures

**Full Phase 5a Completion:**

1. Parse archetypes, templates, and operational templates (ADL2 and ADL 1.4)
2. Validate any RM instance type against templates
3. Validate archetype slots with includes/excludes
4. Generate RM instances (minimal/example/maximal modes)
5. Generate TypeScript scaffolding with builders
6. Serialize AOM to ADL2 with round-trip capability
7. Support archetype specialization and template flattening
8. Comprehensive error messages with paths
9. Integration with existing serializers
10. Complete documentation and examples

---

## Appendices

### Appendix A: ADL2 Grammar Summary

**High-Level Structure:**

```
archetype := header definition terminology [rules] [annotations] [rm_overlay]

header := 
  archetype_id
  specialize <parent_archetype_id>?
  language
  description
  ...

definition := 
  C_COMPLEX_OBJECT

terminology :=
  term_definitions
  term_bindings?
  value_sets?

rules :=
  ASSERTION*
```

**Key Sub-Grammars:**

- **cADL:** Constraint definitions (C_OBJECT tree)
- **ODIN:** Object data notation (for metadata)
- **Expressions:** Rules and invariants (openEHR Expression Language)

### Appendix B: Key AOM Classes

**Hierarchy:**

```
ARCHETYPE
├── AUTHORED_ARCHETYPE
│   ├── TEMPLATE
│   └── OPERATIONAL_TEMPLATE
└── TEMPLATE_OVERLAY

C_OBJECT (abstract)
├── C_DEFINED_OBJECT (abstract)
│   ├── C_COMPLEX_OBJECT
│   │   └── C_ARCHETYPE_ROOT
│   └── C_PRIMITIVE_OBJECT
└── C_REFERENCE_OBJECT (abstract)
    └── ARCHETYPE_SLOT

C_ATTRIBUTE
└── C_ATTRIBUTE_TUPLE

C_PRIMITIVE (abstract)
├── C_STRING
├── C_INTEGER
├── C_REAL
├── C_BOOLEAN
├── C_DATE
├── C_TIME
├── C_DATE_TIME
├── C_DURATION
└── C_TERMINOLOGY_CODE
```

### Appendix C: Example ADL2 Snippet

```adl
archetype (adl_version=2.0.6; rm_release=1.0.4)
    openEHR-EHR-OBSERVATION.blood_pressure.v1.0.0

language
    original_language = <[ISO_639-1::en]>

description
    original_author = <...>
    lifecycle_state = <"published">

definition
    OBSERVATION[id1] matches {
        data matches {
            HISTORY[id2] matches {
                events cardinality matches {1..*} matches {
                    EVENT[id3] occurrences matches {0..*} matches {
                        data matches {
                            ITEM_TREE[id4] matches {
                                items cardinality matches {0..*} matches {
                                    ELEMENT[id5] occurrences matches {0..1} matches {
                                        value matches {
                                            DV_QUANTITY[id6] matches {
                                                magnitude matches {|0..1000|}
                                                units matches {"mm[Hg]"}
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

terminology
    term_definitions = <
        ["en"] = <
            ["id1"] = <
                text = <"Blood pressure">
                description = <"Measurement of blood pressure">
            >
            ...
        >
    >
```

### Appendix D: References

**Official Specifications:**
- ADL2: https://specifications.openehr.org/releases/AM/latest/ADL2.html
- AOM2: https://specifications.openehr.org/releases/AM/latest/AOM2.html
- BMM: https://specifications.openehr.org/releases/LANG/latest/bmm.html

**Reference Implementations:**
- Archie (Java): https://github.com/openEHR/archie
- ADL Tools (Eiffel): https://github.com/openEHR/adl-tools

**ANTLR Grammars:**
- https://github.com/openEHR/archie/tree/master/grammars/src/main/antlr

**Parser Generators:**
- Peggy: https://peggyjs.org/
- ANTLR4: https://www.antlr.org/

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-14 | AI Agent | Initial draft with full analysis and alternatives |

---

**END OF DOCUMENT**
