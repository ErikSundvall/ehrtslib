# Task List: Phase 4g.5 - Demo Web Application (Format Converter)

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps. 

Example:
- `- [ ] 1.1 Read file` → `- [x] 1.1 Read file` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task. If implementation steps happen to fulfil several things at once then ticking off several boxes is OK.

If running in interactive mode (e.g. Gemini CLI) then stop after each parent task and let user review. If running in autonomous batch mode e.g. dispatched to Jules, then just stop if user input is crucial in order to understand further steps.

## Overview

This task list implements a demo static-site web application that demonstrates serialization/deserialization capabilities with format conversion between XML, JSON, and YAML, plus generation of TypeScript initialization code.

**Key Features:**
- Convert between XML ↔ JSON ↔ YAML ↔ XML formats
- Option to generate ehrtslib TypeScript initialization code based on chosen input example (configurable to use terse format and compact constructors, and advanced option to include call to a serializer of choice)
- Configurable format options suitable for each format (terse format, hybrid style, type inference)
- Static site (no server required) - runs entirely in browser
- Deployed as part of the ehrtslib documentation (on github pages)

**Technology Stack:**
- Vanilla TypeScript/JavaScript (no framework dependencies other than the ones in ehrtslib)
- Deno for building
- Modern CSS (no framework)
- Responsive design

**References:**
- PRD: `/tasks/prd-phase4g1-serialization-deserialization.md`
- Serialization modules: `enhanced/serialization/`
- SIMPLIFIED-CREATION-GUIDE.md for TypeScript code generation examples
- README.md

## 0. Create Initial Static Mockup

**IMPORTANT:** Before proceeding with implementation, create a static HTML/CSS mockup that can be reviewed by the developer.

- [x] 0.1 Create `examples/demo-app/mockup/` directory for initial design
- [x] 0.2 Create `examples/demo-app/mockup/index.html` with complete UI structure:
  - [x] Header with title and description
  - [x] Three-panel layout (input, options, output)
  - [x] All form controls (dropdowns, checkboxes, textareas, buttons)
  - [x] Example data pre-filled to show functionality
  - [x] Option to upload example (in any of the formats)
  - [x] Footer with links
- [x] 0.3 Create `examples/demo-app/mockup/styles.css` with complete styling:
  - [x] Layout (grid/flexbox for panels)
  - [x] Typography and colors
  - [x] Form styling
  - [x] Button styles
  - [x] Responsive design (mobile breakpoints)
  - [x] Loading/error states
- [x] 0.4 Ensure mockup is viewable by opening HTML file directly in browser
- [x] 0.5 Add `examples/demo-app/mockup/README.md` explaining:
  - [x] How to view the mockup
  - [x] Design decisions made
  - [x] What functionality will be added in implementation phase
- [x] 0.6 **STOP HERE** - Present mockup to developer for review and approval before proceeding with sections 1-11

### 0.7 Mockup Updates Based on Review

- [x] 0.7.1 Change convert button icon to play arrow (►)
- [x] 0.7.2 Add configuration preset dropdowns for each format:
  - [x] JSON: Canonical, Compact, Hybrid, Very Compact, Custom
  - [x] YAML: Default, Verbose, Hybrid, Flow Style, Custom
  - [x] XML: Default, Custom
- [x] 0.7.3 Add JSON serializer type selection (Canonical vs Configurable)
- [x] 0.7.4 Add input deserializer options section:
  - [x] Deserializer preset dropdown (Default, Canonical, Compact, Hybrid, Custom)
  - [x] Strict mode checkbox
  - [x] Parse terse format checkbox
  - [x] Allow incomplete objects checkbox
- [x] 0.7.5 Disable individual checkboxes when preset is selected (enable on "Custom")
- [x] 0.7.6 Add numeric input fields for indent/depth settings:
  - [x] JSON indent (spaces)
  - [x] YAML indent (spaces)
  - [x] XML indent (spaces)
  - [x] TypeScript indent (spaces)
- [x] 0.7.7 Add additional configuration options:
  - [x] JSON: Include null values, Include empty collections
  - [x] YAML: Block style, Hybrid style checkboxes
  - [x] XML: Include declaration checkbox


## 1. Project Setup

### 1.1 Directory Structure

- [x] 1.1.1 Create `examples/demo-app/` directory
- [x] 1.1.2 Create `examples/demo-app/src/` for source code
- [x] 1.1.3 Create `examples/demo-app/public/` for static assets
- [x] 1.1.4 Create `examples/demo-app/dist/` for built output (add to .gitignore)
- [x] 1.1.5 Create `examples/demo-app/tests/` for tests

### 1.2 Build Configuration

- [x] 1.2.1 Create `examples/demo-app/package.json` with esbuild configuration (using Node.js instead of Deno since Deno not available)
- [x] 1.2.2 Add build script to bundle TypeScript to single JS file
- [x] 1.2.3 Add dev server script for local development
- [ ] 1.2.4 Add watch mode for auto-rebuild during development
- [x] 1.2.5 Configure import maps for serialization modules (using relative paths in TypeScript)
- [x] 1.2.6 Test build process

### 1.3 HTML Structure

- [x] 1.3.1 Create `examples/demo-app/public/index.html` (copied from mockup)
- [x] 1.3.2 Add meta tags (charset, viewport, description)
- [x] 1.3.3 Add title: "ehrtslib Format Converter - Demo"
- [x] 1.3.4 Add link to CSS file
- [x] 1.3.5 Add script tag for bundled JavaScript (defer)
- [x] 1.3.6 Include basic semantic HTML structure

## 2. User Interface Design

### 2.1 Layout Structure

- [ ] 2.1.1 Create header section with title and description
- [ ] 2.1.2 Create main content area with three panels:
  - [ ] Input panel (left)
  - [ ] Options panel (center)
  - [ ] Output panel (right)
- [ ] 2.1.3 Create footer with links (GitHub, docs, about)
- [ ] 2.1.4 Make responsive (stack panels on mobile)
- [ ] 2.1.5 Add loading/error states

### 2.2 Input Panel

- [ ] 2.2.1 Add format selector dropdown (XML, JSON, YAML)
- [ ] 2.2.2 Add large textarea for input (syntax highlighting if possible)
- [ ] 2.2.3 Add "Load Example" button with dropdown menu:
  - [ ] Simple DV_TEXT example
  - [ ] CODE_PHRASE example
  - [ ] DV_CODED_TEXT example
  - [ ] Basic COMPOSITION example
  - [ ] Complex COMPOSITION with OBSERVATION
- [ ] 2.2.4 Add "Clear" button
- [ ] 2.2.5 Add character/line count display
- [ ] 2.2.6 Add validation indicator (green check / red X)

### 2.3 Options Panel

- [ ] 2.3.1 Add "Output Formats" section with checkboxes:
  - [ ] XML
  - [ ] JSON
  - [ ] YAML
  - [ ] TypeScript Code
- [ ] 2.3.2 Add "JSON Options" section:
  - [ ] Pretty print checkbox
  - [ ] Terse format checkbox (with warning icon/tooltip)
  - [ ] Hybrid style (zipehr-like) checkbox
  - [ ] Type inference checkbox
- [ ] 2.3.3 Add "YAML Options" section:
  - [ ] Block style radio
  - [ ] Hybrid style radio
  - [ ] Terse format checkbox (recommended)
  - [ ] Type inference checkbox (compact mode)
- [ ] 2.3.4 Add "XML Options" section:
  - [ ] Pretty print checkbox
  - [ ] Include namespaces checkbox
- [ ] 2.3.5 Add "TypeScript Options" section:
  - [ ] Use terse format checkbox
  - [ ] Use compact constructors checkbox
  - [ ] Include comments checkbox
- [ ] 2.3.6 Add "Convert" button (large, primary action)
- [ ] 2.3.7 Add tooltips/help icons explaining each option

### 2.4 Output Panel

- [ ] 2.4.1 Add tabbed interface for multiple outputs:
  - [ ] XML tab
  - [ ] JSON tab
  - [ ] YAML tab
  - [ ] TypeScript tab
- [ ] 2.4.2 Add readonly textarea/pre element per tab
- [ ] 2.4.3 Add "Copy to Clipboard" button per tab
- [ ] 2.4.4 Add "Download" button per tab
- [ ] 2.4.5 Add syntax highlighting for each format
- [ ] 2.4.6 Add line numbers
- [ ] 2.4.7 Show success message after copy/download

### 2.5 Styling

- [ ] 2.5.1 Create `examples/demo-app/public/styles.css`
- [ ] 2.5.2 Use modern CSS (CSS Grid, Flexbox)
- [ ] 2.5.3 Define color scheme (light/dark mode support optional)
- [ ] 2.5.4 Style form controls consistently
- [ ] 2.5.5 Add hover/focus states
- [ ] 2.5.6 Style error/warning messages
- [ ] 2.5.7 Add subtle animations (transitions)
- [ ] 2.5.8 Ensure accessibility (WCAG AA)
- [ ] 2.5.9 Test responsive design on various screen sizes

## 3. Application Logic

### 3.1 Module Setup

- [ ] 3.1.1 Create `examples/demo-app/src/main.ts` as entry point
- [ ] 3.1.2 Import serialization modules:
  - [ ] JSON: `JsonCanonicalSerializer`, `JsonCanonicalDeserializer` (simple, canonical only) or `JsonConfigurableSerializer`, `JsonConfigurableDeserializer` (advanced with options) from `enhanced/serialization/json/mod.ts`
  - [ ] YAML: `YamlSerializer`, `YamlDeserializer` from `enhanced/serialization/yaml/mod.ts`
  - [ ] XML: `XmlSerializer`, `XmlDeserializer` from `enhanced/serialization/xml/mod.ts` (note: not exported from main mod.ts)
- [ ] 3.1.3 Import RM classes from `enhanced/openehr_rm.ts`, `enhanced/openehr_base.ts`
- [ ] 3.1.4 Set up TypeRegistry with all RM types from `enhanced/serialization/common/type_registry.ts`
- [ ] 3.1.5 Initialize serializers with appropriate configs (see preset configs in each serialization module)

### 3.2 Input Handling

- [ ] 3.2.1 Create `InputHandler` class/module
- [ ] 3.2.2 Implement format detection (XML, JSON, YAML)
- [ ] 3.2.3 Implement input validation:
  - [ ] Check if input is valid XML/JSON/YAML
  - [ ] Show clear error messages
  - [ ] Highlight error location if possible
- [ ] 3.2.4 Implement example loading:
  - [ ] Store examples as constants
  - [ ] Load into input textarea
  - [ ] Auto-select correct input format
- [ ] 3.2.5 Implement clear functionality
- [ ] 3.2.6 Update character count on input change

### 3.3 Deserialization Logic

- [ ] 3.3.1 Create `Deserializer` class/module
- [ ] 3.3.2 Implement `deserializeFromXml(xml: string): any`
- [ ] 3.3.3 Implement `deserializeFromJson(json: string): any`
- [ ] 3.3.4 Implement `deserializeFromYaml(yaml: string): any`
- [ ] 3.3.5 Handle parse errors gracefully
- [ ] 3.3.6 Return standardized error objects
- [ ] 3.3.7 Test with all example data

### 3.4 Serialization Logic

- [ ] 3.4.1 Create `Serializer` class/module
- [ ] 3.4.2 Implement `serializeToXml(obj: any, options: XmlOptions): string`
- [ ] 3.4.3 Implement `serializeToJson(obj: any, options: JsonOptions): string`
- [ ] 3.4.4 Implement `serializeToYaml(obj: any, options: YamlOptions): string`
- [ ] 3.4.5 Apply user-selected options (terse, hybrid, etc.)
- [ ] 3.4.6 Handle serialization errors gracefully
- [ ] 3.4.7 Test with various option combinations

### 3.5 TypeScript Code Generation

- [ ] 3.5.1 Create `TsCodeGenerator` class/module
- [ ] 3.5.2 Implement object tree traversal
- [ ] 3.5.3 Generate import statements
- [ ] 3.5.4 Generate constructor calls with initialization objects
- [ ] 3.5.5 Support terse format for CODE_PHRASE and DV_CODED_TEXT
- [ ] 3.5.6 Support compact constructor syntax (from Phase 4f.2 - see SIMPLIFIED-CREATION-GUIDE.md)
- [ ] 3.5.7 Add comments explaining generated code (optional)
- [ ] 3.5.8 Format generated code (indentation, line breaks)
- [ ] 3.5.9 Test with all example data

Example generated code:
```typescript
import * as openehr_rm from "./enhanced/openehr_rm.ts";
import * as openehr_base from "./enhanced/openehr_base.ts";

const composition = new openehr_rm.COMPOSITION({
  archetype_node_id: "openEHR-EHR-COMPOSITION.encounter.v1",
  name: "My Composition",
  language: "[ISO_639-1::en]",
  territory: "[ISO_3166-1::GB]",
  category: "[openehr::433|event|]",
  composer: { name: "Dr. Example" }
});
```

### 3.6 Conversion Controller

- [ ] 3.6.1 Create `ConversionController` class
- [ ] 3.6.2 Implement main conversion workflow:
  - [ ] Parse input based on selected format
  - [ ] Deserialize to RM object
  - [ ] Serialize to each selected output format
  - [ ] Generate TypeScript code if selected
  - [ ] Update UI with results
- [ ] 3.6.3 Handle conversion errors
- [ ] 3.6.4 Show progress indicator during conversion
- [ ] 3.6.5 Validate output formats
- [ ] 3.6.6 Test complete conversion pipeline

### 3.7 Output Handling

- [ ] 3.7.1 Create `OutputHandler` class/module
- [ ] 3.7.2 Implement tab switching
- [ ] 3.7.3 Implement copy to clipboard:
  - [ ] Use Clipboard API
  - [ ] Show success feedback
  - [ ] Handle permissions
- [ ] 3.7.4 Implement download functionality:
  - [ ] Create Blob with correct MIME type
  - [ ] Generate appropriate filename
  - [ ] Trigger download
- [ ] 3.7.5 Implement syntax highlighting (use library or simple regex)
- [ ] 3.7.6 Update active tab indicator

## 4. Error Handling

- [ ] 4.1 Create `ErrorHandler` class/module
- [ ] 4.2 Define error types:
  - [ ] ParseError (invalid input format)
  - [ ] DeserializationError (can't convert to object)
  - [ ] SerializationError (can't convert to output)
  - [ ] ValidationError (invalid RM structure)
- [ ] 4.3 Implement user-friendly error messages
- [ ] 4.4 Show error location when possible
- [ ] 4.5 Add "Try Again" or "Clear" action on errors
- [ ] 4.6 Log errors to console for debugging
- [ ] 4.7 Test all error scenarios

## 5. Examples and Test Data

### 5.1 Create Example Data

- [ ] 5.1.1 Create `examples/demo-app/src/examples.ts`
- [ ] 5.1.2 Add simple DV_TEXT example (XML, JSON, YAML)
- [ ] 5.1.3 Add CODE_PHRASE example (all formats)
- [ ] 5.1.4 Add DV_CODED_TEXT example (all formats)
- [ ] 5.1.5 Add basic COMPOSITION example (all formats)
- [ ] 5.1.6 Add complex COMPOSITION with nested OBSERVATION (all formats)
- [ ] 5.1.7 Ensure examples are valid and follow openEHR spec
- [ ] 5.1.8 Add comments explaining each example

### 5.2 Validation Test Cases

- [ ] 5.2.1 Create test suite for conversion logic
- [ ] 5.2.2 Test XML → JSON → YAML round-trip
- [ ] 5.2.3 Test JSON → YAML → XML round-trip
- [ ] 5.2.4 Test YAML → XML → JSON round-trip
- [ ] 5.2.5 Verify TypeScript code generation for all examples
- [ ] 5.2.6 Test option combinations
- [ ] 5.2.7 Test error cases

## 6. Documentation

### 6.1 User Documentation

- [ ] 6.1.1 Create `examples/demo-app/README.md`
- [ ] 6.1.2 Add "Overview" section describing the demo
- [ ] 6.1.3 Add "How to Use" section with step-by-step instructions
- [ ] 6.1.4 Add "Features" section listing capabilities
- [ ] 6.1.5 Add "Format Options" section explaining each option:
  - [ ] Terse format (with warnings for JSON)
  - [ ] Hybrid style (zipehr-like)
  - [ ] Type inference (compact mode)
- [ ] 6.1.6 Add "Examples" section with screenshots
- [ ] 6.1.7 Add "Development" section for contributors
- [ ] 6.1.8 Add "Limitations" section

### 6.2 In-App Help

- [ ] 6.2.1 Add "Help" or "?" button in header
- [ ] 6.2.2 Create modal/overlay with instructions
- [ ] 6.2.3 Add tooltips on all option controls
- [ ] 6.2.4 Add contextual help messages
- [ ] 6.2.5 Link to main ehrtslib documentation

### 6.3 Code Documentation

- [ ] 6.3.1 Add JSDoc comments to all modules
- [ ] 6.3.2 Document class interfaces
- [ ] 6.3.3 Add inline comments for complex logic
- [ ] 6.3.4 Document configuration options

## 7. Build and Deployment

### 7.1 Build Process

- [ ] 7.1.1 Create build script in `examples/demo-app/scripts/build.ts`
- [ ] 7.1.2 Bundle TypeScript to single JavaScript file
- [ ] 7.1.3 Minify JavaScript for production
- [ ] 7.1.4 Copy static assets to dist/
- [ ] 7.1.5 Generate source maps for debugging
- [ ] 7.1.6 Test built application locally
- [ ] 7.1.7 Add build command to main project scripts

### 7.2 Dev Server

- [ ] 7.2.1 Create dev server script
- [ ] 7.2.2 Serve files from public/ and dist/
- [ ] 7.2.3 Enable hot reload on file changes
- [ ] 7.2.4 Add console logging for requests
- [ ] 7.2.5 Test dev workflow

### 7.3 Deployment

- [ ] 7.3.1 Add deployment instructions to README
- [ ] 7.3.2 Create GitHub Pages workflow (optional)
- [ ] 7.3.3 Generate production build
- [ ] 7.3.4 Test deployed application
- [ ] 7.3.5 Update main README with link to demo

## 8. Testing

### 8.1 Unit Tests

- [ ] 8.1.1 Create `examples/demo-app/tests/deserializer.test.ts`
- [ ] 8.1.2 Create `examples/demo-app/tests/serializer.test.ts`
- [ ] 8.1.3 Create `examples/demo-app/tests/ts_generator.test.ts`
- [ ] 8.1.4 Create `examples/demo-app/tests/conversion.test.ts`
- [ ] 8.1.5 Test all core functions
- [ ] 8.1.6 Test error handling
- [ ] 8.1.7 Test edge cases

### 8.2 Integration Tests

- [ ] 8.2.1 Test complete conversion workflows
- [ ] 8.2.2 Test all example data conversions
- [ ] 8.2.3 Test all option combinations
- [ ] 8.2.4 Verify generated TypeScript compiles

### 8.3 Browser Testing

- [ ] 8.3.1 Test in Chrome
- [ ] 8.3.2 Test in Firefox
- [ ] 8.3.3 Test in Safari
- [ ] 8.3.4 Test in Edge
- [ ] 8.3.5 Test on mobile devices (iOS Safari, Android Chrome)
- [ ] 8.3.6 Test responsive layout
- [ ] 8.3.7 Test copy/download functionality

### 8.4 Accessibility Testing

- [ ] 8.4.1 Test keyboard navigation
- [ ] 8.4.2 Test screen reader compatibility
- [ ] 8.4.3 Check color contrast ratios
- [ ] 8.4.4 Verify ARIA labels
- [ ] 8.4.5 Test focus indicators

### 8.5 Performance Testing

- [ ] 8.5.1 Test with large COMPOSITION objects
- [ ] 8.5.2 Measure conversion times
- [ ] 8.5.3 Check memory usage
- [ ] 8.5.4 Test bundle size
- [ ] 8.5.5 Optimize if needed

## 9. Polish and Refinement

### 9.1 UX Improvements

- [ ] 9.1.1 Add loading spinners for conversions
- [ ] 9.1.2 Add success animations
- [ ] 9.1.3 Improve error message styling
- [ ] 9.1.4 Add keyboard shortcuts (e.g., Ctrl+Enter to convert)
- [ ] 9.1.5 Remember user preferences (localStorage)
- [ ] 9.1.6 Add undo/redo for input changes

### 9.2 Visual Polish

- [ ] 9.2.1 Review and refine color scheme
- [ ] 9.2.2 Ensure consistent spacing
- [ ] 9.2.3 Add icons (format icons, action icons)
- [ ] 9.2.4 Improve typography
- [ ] 9.2.5 Add subtle shadows/depth
- [ ] 9.2.6 Test on different screen sizes

### 9.3 Code Quality

- [ ] 9.3.1 Run linter and fix issues
- [ ] 9.3.2 Remove unused code
- [ ] 9.3.3 Optimize imports
- [ ] 9.3.4 Add TODO comments for future improvements
- [ ] 9.3.5 Ensure consistent code style

## 10. Final Integration

- [ ] 10.1 Update main project README with demo link
- [ ] 10.2 Add demo to examples listing
- [ ] 10.3 Link from serialization documentation
- [ ] 10.4 Add to project website/documentation site
- [ ] 10.5 Create announcement/blog post (optional)
- [ ] 10.6 Update ROADMAP.md to mark Phase 4g.5 as complete
- [ ] 10.7 Create completion summary document

## 11. Optional Enhancements (Future)

- [ ] 11.1 Add dark mode toggle
- [ ] 11.2 Add format auto-detection
- [ ] 11.3 Add validation against openEHR schemas
- [ ] 11.4 Add diff view for comparing formats
- [ ] 11.5 Add URL sharing (encode state in URL)
- [ ] 11.6 Add export to various file formats
- [ ] 11.7 Add import from file/URL
- [ ] 11.8 Add syntax error highlighting in input
- [ ] 11.9 Add search/filter in output
- [ ] 11.10 Add full-screen mode for input/output

## Success Criteria

✅ Demo app converts between XML, JSON, and YAML formats
✅ Generates valid TypeScript initialization code
✅ All format options work correctly (terse, hybrid, type inference)
✅ User interface is intuitive and responsive
✅ All examples load and convert successfully
✅ Error handling is comprehensive and user-friendly
✅ Copy and download functionality works in all browsers
✅ Documentation is complete and clear
✅ All tests pass
✅ App is deployed and accessible
✅ No console errors or warnings
✅ Meets accessibility standards (WCAG AA)
✅ Performance is acceptable (conversions < 500ms for typical data)

## Notes

- Keep the UI simple and focused on the core conversion functionality
- Ensure generated TypeScript code is ready to use (copy-paste into project)
- Provide clear warnings about non-standard format options (terse JSON)
- Make it easy to understand which format options are recommended for each output
- Consider adding interactive tutorials or guided tours
- Test thoroughly across browsers and devices
- Keep bundle size reasonable (target < 500KB gzipped)
- Make the app a showcase of ehrtslib's serialization capabilities
