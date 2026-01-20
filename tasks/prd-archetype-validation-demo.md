# PRD: Archetype & Template Validation Demo Integration

**Phase:** Post-5b Enhancement  
**Priority:** Medium  
**Status:** Proposed  
**Created:** 2026-01-20

## Overview

Integrate the completed Phase 5b archetype and validation framework into a fully functional demo application, moving beyond the current mockup to provide real-time ADL2 parsing, validation, and code generation capabilities.

## Background

Phase 5b delivered comprehensive archetype and validation infrastructure:
- ADL2 parser (tokenizer, ODIN, cADL parsers)
- Validation framework with 7 validators (50/50 tests passing)
- Code generation (TypeScript, RM instances, ADL2 serialization)
- Grammar-assisted approach using official openEHR ANTLR grammars

Currently, a mockup demo exists at `examples/demo-app/mockup/archetype-demo.html` that simulates functionality. This PRD proposes converting it to a fully functional implementation.

## Goals

### Primary Goals
1. **Real ADL2 Parsing**: Replace mockup with actual ADL2 parser integration
2. **Live Validation**: Connect to TemplateValidator for real-time validation
3. **Code Generation**: Implement actual TypeScript generation from templates
4. **Interactive Examples**: Provide working examples from openEHR CKM (Clinical Knowledge Manager)

### Secondary Goals
1. **Performance Optimization**: Ensure parsing/validation completes in <100ms (per PRD targets)
2. **Error Visualization**: Rich error display with path highlighting
3. **Educational Value**: Help users learn ADL2 and validation concepts
4. **Export Capabilities**: Download generated code, validation reports

## Success Criteria

1. **Functional**:
   - Parse real ADL2 files from openEHR CKM
   - Validate against all 7 validator types
   - Generate compilable TypeScript code
   - Handle error cases gracefully

2. **Performance**:
   - ADL2 parsing: <100ms for typical archetype
   - Validation: <50ms for typical instance
   - UI responsiveness: No blocking operations

3. **Usability**:
   - Clear error messages with actionable suggestions
   - Inline documentation and tooltips
   - Mobile-responsive design
   - Keyboard navigation support

4. **Test Coverage**:
   - Integration tests for all demo features
   - End-to-end tests for user workflows
   - Error handling test scenarios

## Proposed Solution

### Architecture

```
┌─────────────────────────────────────────┐
│         Demo Web Application            │
├─────────────────────────────────────────┤
│  UI Layer (React/Preact)                │
│  ├─ ADL2 Editor Component               │
│  ├─ Validation Results Component        │
│  ├─ Code Preview Component              │
│  └─ Examples Browser Component          │
├─────────────────────────────────────────┤
│  Integration Layer                      │
│  ├─ Parser Service                      │
│  ├─ Validator Service                   │
│  ├─ Generator Service                   │
│  └─ Example Loader Service              │
├─────────────────────────────────────────┤
│  Core Libraries (Phase 5b)              │
│  ├─ enhanced/parser/                    │
│  ├─ enhanced/validation/                │
│  ├─ enhanced/generation/                │
│  └─ enhanced/openehr_*.ts               │
└─────────────────────────────────────────┘
```

### Components

#### 1. ADL2 Editor Component
**Purpose**: Edit and display ADL2 content with syntax highlighting

**Features**:
- Monaco Editor or CodeMirror integration
- ADL2 syntax highlighting
- Error underlining
- Line numbers and folding
- Search and replace

**Implementation Considerations**:
- Use web worker for parsing to avoid UI blocking
- Debounce parsing on input (300ms delay)
- Cache parsed results
- Provide undo/redo

#### 2. Validation Results Component  
**Purpose**: Display validation results with detailed error information

**Features**:
- Grouped errors by constraint type
- Expandable error details
- Path highlighting (click to jump to location)
- Severity indicators (error/warning/info)
- Export validation report (JSON/Markdown)

**Implementation Considerations**:
- Virtual scrolling for large error lists
- Filter by severity/constraint type
- Statistics dashboard (total errors, by type, etc.)

#### 3. Code Preview Component
**Purpose**: Display generated TypeScript code

**Features**:
- Syntax-highlighted preview
- Copy to clipboard
- Download as .ts file
- Toggle generation options
- Side-by-side comparison (template vs generated)

**Implementation Considerations**:
- Use Prism.js or Highlight.js
- Format code with Prettier
- Show generation statistics

#### 4. Examples Browser Component
**Purpose**: Browse and load example archetypes

**Features**:
- Categorized examples (observations, compositions, etc.)
- Search functionality
- Preview in card view
- Metadata display (author, version, purpose)
- Load from local files or URLs

**Example Categories**:
- Basic archetypes (simple observation, evaluation)
- Complex archetypes (blood pressure, medication order)
- Templates (encounter template, discharge summary)
- Edge cases (specialization, slot filling)

### Services

#### 1. Parser Service
```typescript
interface ParserService {
  parse(adl2: string): Promise<ParseResult>;
  tokenize(adl2: string): Token[];
  validate Syntax(adl2: string): SyntaxError[];
}

interface ParseResult {
  archetype: ARCHETYPE | OPERATIONAL_TEMPLATE;
  warnings: Warning[];
  stats: {
    tokensProcessed: number;
    parseTimeMs: number;
  };
}
```

#### 2. Validator Service
```typescript
interface ValidatorService {
  initialize(): Promise<void>;
  validate(
    rmInstance: any,
    template: ARCHETYPE | OPERATIONAL_TEMPLATE,
    options: ValidationConfig
  ): Promise<ValidationResult>;
  getConstraints(): RMConstraintInfo;
}

interface ValidationResult {
  valid: boolean;
  errors: ValidationMessage[];
  warnings: ValidationMessage[];
  stats: {
    constraintsChecked: number;
    validationTimeMs: number;
  };
}
```

#### 3. Generator Service
```typescript
interface GeneratorService {
  generateTypeScript(
    template: ARCHETYPE | OPERATIONAL_TEMPLATE,
    options: GenerationConfig
  ): string;
  generateRMInstance(
    template: ARCHETYPE | OPERATIONAL_TEMPLATE,
    mode: 'minimal' | 'maximal'
  ): any;
  serializeADL2(archetype: ARCHETYPE): string;
}
```

#### 4. Example Loader Service
```typescript
interface ExampleLoaderService {
  listExamples(): Promise<ExampleMetadata[]>;
  loadExample(id: string): Promise<string>;
  loadFromURL(url: string): Promise<string>;
  loadFromFile(file: File): Promise<string>;
}

interface ExampleMetadata {
  id: string;
  name: string;
  category: string;
  description: string;
  author?: string;
  version?: string;
  tags: string[];
}
```

### Data Flow

```
User Input (ADL2)
  ↓
[Web Worker: Parse ADL2]
  ↓
Parsed Archetype
  ↓
[Main Thread: Update UI]
  ↓
User Triggers Validation
  ↓
[Web Worker: Validate RM Instance]
  ↓
Validation Results
  ↓
[Main Thread: Display Results]
  ↓
User Requests Code Generation
  ↓
[Web Worker: Generate TypeScript]
  ↓
Generated Code
  ↓
[Main Thread: Display Preview]
```

## Implementation Plan

### Phase 1: Foundation (1-2 weeks)
**Goal**: Set up infrastructure and core services

Tasks:
- [ ] Create service layer interfaces
- [ ] Implement ParserService with web worker
- [ ] Add Monaco Editor integration
- [ ] Set up build pipeline (Vite/esbuild)
- [ ] Create basic UI layout with tabs

**Deliverables**:
- Working ADL2 editor with syntax highlighting
- Functional parser service
- Basic error display

### Phase 2: Validation Integration (1-2 weeks)
**Goal**: Connect validation framework to UI

Tasks:
- [ ] Implement ValidatorService
- [ ] Create validation results component
- [ ] Add RM instance editor
- [ ] Implement error path highlighting
- [ ] Add validation configuration UI

**Deliverables**:
- Functional validation with all 7 validators
- Rich error display
- Validation configuration panel

### Phase 3: Code Generation (1 week)
**Goal**: Implement code generation features

Tasks:
- [ ] Implement GeneratorService
- [ ] Create code preview component
- [ ] Add download/copy functionality
- [ ] Implement generation options UI
- [ ] Add RM instance generation

**Deliverables**:
- Working TypeScript generation
- RM instance generation
- ADL2 serialization

### Phase 4: Examples & Polish (1 week)
**Goal**: Add examples and refine UX

Tasks:
- [ ] Implement ExampleLoaderService
- [ ] Create examples browser
- [ ] Add 10+ curated examples from CKM
- [ ] Implement file upload
- [ ] Add URL loading
- [ ] Performance optimization
- [ ] Mobile responsiveness
- [ ] Accessibility improvements

**Deliverables**:
- Complete examples library
- Polished user experience
- Mobile support

### Phase 5: Testing & Documentation (1 week)
**Goal**: Ensure quality and provide documentation

Tasks:
- [ ] Write integration tests
- [ ] End-to-end testing with Playwright
- [ ] Performance testing
- [ ] Create user guide
- [ ] API documentation
- [ ] Video walkthrough

**Deliverables**:
- Comprehensive test coverage
- User documentation
- Demo video

## Technical Considerations

### Performance

**Optimization Strategies**:
1. **Web Workers**: Run parsing/validation/generation in workers
2. **Caching**: Cache parsed archetypes, validation results
3. **Lazy Loading**: Load examples on demand
4. **Virtual Scrolling**: For large validation result lists
5. **Debouncing**: Delay parsing on user input
6. **Incremental Parsing**: Update only changed sections if possible

**Performance Targets** (from Phase 5b PRD):
- ADL2 parsing: <100ms
- Validation: <50ms
- Code generation: <100ms
- UI responsiveness: <16ms (60 FPS)

### Security

**Considerations**:
1. **Sandboxing**: Run all code in isolated web workers
2. **Input Validation**: Sanitize user input before processing
3. **CSP**: Implement Content Security Policy
4. **CORS**: Handle cross-origin example loading
5. **File Size Limits**: Limit uploaded file sizes

### Browser Compatibility

**Target**:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

**Progressive Enhancement**:
- Core functionality works without web workers
- Graceful degradation for older browsers
- Feature detection for optional capabilities

### Dependencies

**Core**:
- Enhanced libraries (Phase 5b output) - already implemented
- Monaco Editor or CodeMirror - syntax highlighting
- React/Preact - UI framework
- Vite - build tool

**Optional**:
- Prettier - code formatting
- Prism.js - code highlighting
- File Saver - download functionality

## Risks & Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Performance issues with large archetypes | High | Medium | Web workers, caching, optimization |
| Complex error scenarios not handled | Medium | Medium | Comprehensive error testing |
| Browser compatibility issues | Medium | Low | Progressive enhancement, feature detection |
| Example loading failures (CORS, etc.) | Low | Medium | Local fallback examples |

## Future Enhancements

**Beyond Initial Implementation**:
1. **Collaborative Editing**: Real-time collaboration on archetypes
2. **Version Control**: Track changes, compare versions
3. **Visual Editor**: Drag-and-drop archetype construction
4. **Template Flattening**: Flatten specialized archetypes
5. **Diff Viewer**: Compare two archetypes/templates
6. **Export Formats**: Export to ADL 1.4, XML, etc.
7. **Integration**: Connect to openEHR CKM API
8. **Custom Validators**: User-defined validation rules

## Success Metrics

**Quantitative**:
- Parse 95%+ of openEHR CKM archetypes successfully
- Validate with 100% accuracy against specification
- Generate compilable TypeScript code 100% of time
- Complete operations within performance targets
- 90%+ test coverage

**Qualitative**:
- Positive user feedback on ease of use
- Educational value for learning ADL2
- Adoption by openEHR community
- Clear, actionable error messages

## Resources

### Examples Sources
- openEHR CKM: https://ckm.openehr.org/
- openEHR/archie test files: https://github.com/openEHR/archie
- Local test data: `test_data/adl2/`

### Documentation
- ADL2 Specification: https://specifications.openehr.org/releases/AM/latest/ADL2.html
- openEHR AOM2: https://specifications.openehr.org/releases/AM/latest/AOM2.html
- Phase 5b Implementation: `enhanced/parser/`, `enhanced/validation/`

### Community
- openEHR Discourse: https://discourse.openehr.org/
- openEHR Slack: https://openehr.slack.com/

## Conclusion

This PRD outlines a comprehensive plan to transform the Phase 5b archetype and validation infrastructure into a fully functional, user-friendly demo application. The implementation would provide significant value to:

1. **Developers**: Learn ADL2 and validation concepts
2. **Modelers**: Validate archetypes interactively
3. **Project**: Showcase capabilities and drive adoption
4. **Community**: Contribute to openEHR ecosystem

**Estimated Effort**: 5-7 weeks (1 developer)  
**Priority**: Medium (enhances completed Phase 5b work)  
**Dependencies**: Phase 5b completion (✅ Complete)

## Appendix A: Example Archetypes

### Priority Examples to Include

1. **Simple Observation** - `test_data/adl2/simple_observation.adl`
2. **Blood Pressure** - From openEHR CKM
3. **Body Temperature** - From openEHR CKM
4. **Medication Order** - From openEHR CKM
5. **Problem/Diagnosis** - From openEHR CKM
6. **Encounter Composition** - Template example
7. **Discharge Summary** - Template example
8. **Lab Result** - Complex archetype
9. **Vital Signs** - Template with multiple observations
10. **Allergy List** - With terminology bindings

### Example Categories

- **Basic** (3-5 examples): Simple single-class archetypes
- **Intermediate** (5-7 examples): Multi-attribute archetypes with constraints
- **Advanced** (3-5 examples): Templates, specializations, slots
- **Edge Cases** (2-3 examples): Test validation edge cases

## Appendix B: UI Mockup Enhancements

### Beyond Current Mockup

Current mockup provides:
- Tab-based navigation
- Text input areas
- Mock outputs

Proposed enhancements:
- **Split-pane Editor**: Side-by-side ADL2 and JSON views
- **Interactive Error Highlights**: Click error to jump to location
- **Validation Progress**: Show progress during validation
- **Example Cards**: Visual cards with previews
- **Settings Panel**: Persist user preferences
- **Export Dialog**: Multiple export format options
- **Help Overlay**: Contextual help and tooltips
- **Keyboard Shortcuts**: Power user features

### Accessibility Features

- ARIA labels on all interactive elements
- Keyboard navigation (Tab, Arrow keys, Enter)
- Screen reader support
- High contrast mode
- Adjustable font sizes
- Focus indicators

## Appendix C: Testing Strategy

### Unit Tests
- Service layer methods
- Parsing edge cases
- Validation rules
- Code generation patterns

### Integration Tests
- Parser → Validator workflow
- Template → Generator workflow
- Example loading → Display
- Error handling paths

### End-to-End Tests
- Complete user workflows
- Example loading and parsing
- Validation with various configs
- Code generation and download
- Error scenarios

### Performance Tests
- Large archetype parsing
- Bulk validation
- Memory usage
- UI responsiveness
