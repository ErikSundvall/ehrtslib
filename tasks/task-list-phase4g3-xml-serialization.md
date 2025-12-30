# Task List: Phase 4g.3 - XML Serialization Implementation

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps. 

Example:
- `- [ ] 1.1 Read file` → `- [x] 1.1 Read file` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task. If implementation steps happen to fulfil several things at once then ticking off several boxes is OK.

If running in interactive mode (e.g. Gemini CLI) then stop after each parent task and let user review. If running in autonomous batch mode e.g. dispatched to Jules, then just stop if user input is crucial in order to understand further steps.

## Overview

This task list implements XML serialization and deserialization for openEHR RM objects according to the PRD in `/tasks/prd-phase4g1-serialization-deserialization.md`.

**Technology Choice:** fast-xml-parser v4.x (lightweight, performant, sufficient features for openEHR XML)

**References:**
- PRD: `/tasks/prd-phase4g1-serialization-deserialization.md`
- openEHR ITS-XML: https://specifications.openehr.org/releases/ITS-XML/
- Archie XML implementation: https://github.com/openEHR/archie (Java reference)

## 1. Project Setup and Dependencies

- [ ] 1.1 Create directory structure `enhanced/serialization/xml/`
- [ ] 1.2 Create directory structure `enhanced/serialization/common/`
- [ ] 1.3 Add `fast-xml-parser` dependency to `deno.json` (v4.x, MIT licensed, ~50KB minified)
- [ ] 1.4 Create `enhanced/serialization/xml/mod.ts` as the main export file
- [ ] 1.5 Verify dependency installation and imports work correctly

## 2. Common Infrastructure (Shared Utilities)

### 2.1 Type Registry

- [ ] 2.1.1 Create `enhanced/serialization/common/type_registry.ts`
- [ ] 2.1.2 Implement `TypeRegistry` class with methods:
  - [ ] `register(typeName: string, constructor: new () => any): void`
  - [ ] `getConstructor(typeName: string): (new () => any) | undefined`
  - [ ] `getTypeName(constructor: new () => any): string | undefined`
  - [ ] `hasType(typeName: string): boolean`
  - [ ] `getTypeName(obj: any): string | undefined` (get type from object instance)
- [ ] 2.1.3 Add auto-registration support (scan and register all RM classes)
- [ ] 2.1.4 Create unit tests for `TypeRegistry`
- [ ] 2.1.5 Test with BASE, RM, LANG, TERM, and AM package classes

### 2.2 Error Classes

- [ ] 2.2.1 Create `enhanced/serialization/common/errors.ts`
- [ ] 2.2.2 Implement `SerializationError` class
- [ ] 2.2.3 Implement `DeserializationError` class
- [ ] 2.2.4 Implement `TypeNotFoundError` class
- [ ] 2.2.5 Add comprehensive error context (object/data, cause)
- [ ] 2.2.6 Create unit tests for error classes

## 3. XML Configuration

- [ ] 3.1 Create `enhanced/serialization/xml/xml_config.ts`
- [ ] 3.2 Implement `XmlSerializationConfig` interface with options:
  - [ ] `rootElement?: string` - Root element name (defaults to type name)
  - [ ] `includeDeclaration?: boolean` - Include XML declaration (default: true)
  - [ ] `version?: string` - XML version (default: "1.0")
  - [ ] `encoding?: string` - Character encoding (default: "UTF-8")
  - [ ] `useNamespaces?: boolean` - Use XML namespaces (default: true)
  - [ ] `namespace?: string` - openEHR XML namespace (default: "http://schemas.openehr.org/v1")
  - [ ] `prettyPrint?: boolean` - Prettify output XML (default: false)
  - [ ] `indent?: string` - Indentation string (default: "  ")
- [ ] 3.3 Implement `XmlDeserializationConfig` interface with options:
  - [ ] `strict?: boolean` - Strict parsing (default: true)
  - [ ] `preserveOrder?: boolean` - Preserve attribute order (default: false)
  - [ ] `ignoreAttributes?: boolean` - Ignore attributes (default: false)
- [ ] 3.4 Create default configuration constants
- [ ] 3.5 Add JSDoc documentation for all config options

## 4. XML Serializer Implementation

### 4.1 Core Serializer

- [ ] 4.1.1 Create `enhanced/serialization/xml/xml_serializer.ts`
- [ ] 4.1.2 Implement `XmlSerializer` class with constructor accepting config
- [ ] 4.1.3 Implement `serialize(obj: any): string` method
- [ ] 4.1.4 Implement `serializeWith(obj: any, config: XmlSerializationConfig): string` method
- [ ] 4.1.5 Add support for XML declaration generation
- [ ] 4.1.6 Add support for namespace handling

### 4.2 Object to XML Conversion

- [ ] 4.2.1 Implement object traversal logic
- [ ] 4.2.2 Map openEHR RM properties to XML elements
- [ ] 4.2.3 Handle primitive types (string, number, boolean)
- [ ] 4.2.4 Handle complex objects (nested RM objects)
- [ ] 4.2.5 Handle arrays and collections
- [ ] 4.2.6 Add `xsi:type` attribute for polymorphic types
- [ ] 4.2.7 Handle null/undefined values (omit elements)
- [ ] 4.2.8 Handle empty collections based on configuration

### 4.3 XML Formatting

- [ ] 4.3.1 Integrate fast-xml-parser's XMLBuilder
- [ ] 4.3.2 Configure pretty printing options
- [ ] 4.3.3 Configure indentation settings
- [ ] 4.3.4 Test output formatting with various indent settings

### 4.4 Special Cases

- [ ] 4.4.1 Handle archetype_node_id as XML attribute
- [ ] 4.4.2 Handle uid and other identifier properties correctly
- [ ] 4.4.3 Handle terminology_id and code_string elements
- [ ] 4.4.4 Handle DV_* data value types with proper xsi:type
- [ ] 4.4.5 Handle COMPOSITION and ENTRY structures

## 5. XML Deserializer Implementation

### 5.1 Core Deserializer

- [ ] 5.1.1 Create `enhanced/serialization/xml/xml_deserializer.ts`
- [ ] 5.1.2 Implement `XmlDeserializer` class with constructor accepting config
- [ ] 5.1.3 Implement `deserialize<T = any>(xml: string): T` method
- [ ] 5.1.4 Implement `deserializeAs<T>(xml: string, type: new () => T): T` method

### 5.2 XML to Object Conversion

- [ ] 5.2.1 Integrate fast-xml-parser's XMLParser
- [ ] 5.2.2 Configure parser options for openEHR XML
- [ ] 5.2.3 Implement XML element to property mapping
- [ ] 5.2.4 Handle primitive types reconstruction
- [ ] 5.2.5 Handle complex object reconstruction
- [ ] 5.2.6 Handle array reconstruction from repeated elements
- [ ] 5.2.7 Use TypeRegistry to instantiate correct classes
- [ ] 5.2.8 Extract type information from xsi:type attributes
- [ ] 5.2.9 Handle root element type determination

### 5.3 Type Resolution

- [ ] 5.3.1 Implement xsi:type attribute parsing
- [ ] 5.3.2 Implement fallback to root element name for type
- [ ] 5.3.3 Handle missing type information (strict vs lenient mode)
- [ ] 5.3.4 Validate type names against TypeRegistry

### 5.4 Error Handling

- [ ] 5.4.1 Handle invalid XML (malformed)
- [ ] 5.4.2 Handle unknown types (TypeNotFoundError)
- [ ] 5.4.3 Handle missing required properties
- [ ] 5.4.4 Provide detailed error messages with context
- [ ] 5.4.5 Test error conditions thoroughly

## 6. Testing

### 6.1 Test Infrastructure

- [ ] 6.1.1 Create `enhanced/serialization/xml/xml_serializer.test.ts`
- [ ] 6.1.2 Create `enhanced/serialization/xml/xml_deserializer.test.ts`
- [ ] 6.1.3 Set up test fixtures directory `tests/xml_fixtures/`
- [ ] 6.1.4 Create helper functions for test assertions

### 6.2 Serialization Tests

- [ ] 6.2.1 Test simple object serialization (DV_TEXT, CODE_PHRASE)
- [ ] 6.2.2 Test complex object serialization (COMPOSITION)
- [ ] 6.2.3 Test nested object serialization (COMPOSITION with OBSERVATION)
- [ ] 6.2.4 Test array serialization (content, items)
- [ ] 6.2.5 Test null/undefined handling
- [ ] 6.2.6 Test empty collections
- [ ] 6.2.7 Test pretty printing
- [ ] 6.2.8 Test namespace generation
- [ ] 6.2.9 Test XML declaration generation
- [ ] 6.2.10 Test polymorphic types (xsi:type attributes)

### 6.3 Deserialization Tests

- [ ] 6.3.1 Test simple object deserialization
- [ ] 6.3.2 Test complex object deserialization
- [ ] 6.3.3 Test nested object deserialization
- [ ] 6.3.4 Test array deserialization
- [ ] 6.3.5 Test type resolution from xsi:type
- [ ] 6.3.6 Test type resolution from root element
- [ ] 6.3.7 Test missing type handling
- [ ] 6.3.8 Test unknown type handling
- [ ] 6.3.9 Test malformed XML handling

### 6.4 Round-Trip Tests

- [ ] 6.4.1 Test DV_TEXT round-trip
- [ ] 6.4.2 Test CODE_PHRASE round-trip
- [ ] 6.4.3 Test DV_CODED_TEXT round-trip
- [ ] 6.4.4 Test COMPOSITION round-trip
- [ ] 6.4.5 Test OBSERVATION round-trip
- [ ] 6.4.6 Test complex object tree round-trip
- [ ] 6.4.7 Verify object equality after round-trip

### 6.5 Integration Tests

- [ ] 6.5.1 Test with canonical openEHR XML examples (if available)
- [ ] 6.5.2 Test with Archie-generated XML (if available)
- [ ] 6.5.3 Test with manually created RM objects
- [ ] 6.5.4 Test configuration options
- [ ] 6.5.5 Test error scenarios

### 6.6 Performance Tests

- [ ] 6.6.1 Test serialization performance with large COMPOSITION
- [ ] 6.6.2 Test deserialization performance with large XML
- [ ] 6.6.3 Test memory usage
- [ ] 6.6.4 Document performance characteristics

## 7. Documentation

### 7.1 API Documentation

- [ ] 7.1.1 Add comprehensive JSDoc to `XmlSerializer` class
- [ ] 7.1.2 Add comprehensive JSDoc to `XmlDeserializer` class
- [ ] 7.1.3 Add JSDoc examples for common use cases
- [ ] 7.1.4 Document configuration options thoroughly
- [ ] 7.1.5 Document error types and handling

### 7.2 User Guide

- [ ] 7.2.1 Create `enhanced/serialization/xml/README.md`
- [ ] 7.2.2 Add "Getting Started" section with basic examples
- [ ] 7.2.3 Add "Configuration" section explaining all options
- [ ] 7.2.4 Add "Advanced Usage" section with complex scenarios
- [ ] 7.2.5 Add "Error Handling" section
- [ ] 7.2.6 Add "Performance Tips" section
- [ ] 7.2.7 Add "openEHR Compliance" section

### 7.3 Examples

- [ ] 7.3.1 Create `examples/xml_serialization_basic.ts`
- [ ] 7.3.2 Create `examples/xml_serialization_advanced.ts`
- [ ] 7.3.3 Add example: Serialize simple DV_TEXT
- [ ] 7.3.4 Add example: Serialize CODE_PHRASE with terminology
- [ ] 7.3.5 Add example: Serialize complete COMPOSITION
- [ ] 7.3.6 Add example: Deserialize XML from external system
- [ ] 7.3.7 Add example: Round-trip serialization
- [ ] 7.3.8 Add example: Custom configuration

## 8. Module Exports

- [ ] 8.1 Update `enhanced/serialization/xml/mod.ts` to export:
  - [ ] `XmlSerializer`
  - [ ] `XmlDeserializer`
  - [ ] `XmlSerializationConfig`
  - [ ] `XmlDeserializationConfig`
  - [ ] Error classes (re-exported from common)
- [ ] 8.2 Update main project exports if needed
- [ ] 8.3 Ensure tree-shaking works correctly (test bundle size)

## 9. Integration and Validation

- [ ] 9.1 Run all XML serialization tests
- [ ] 9.2 Run full project test suite to ensure no regressions
- [ ] 9.3 Test imports from different contexts
- [ ] 9.4 Verify no circular dependencies
- [ ] 9.5 Check bundle size impact
- [ ] 9.6 Test with real-world openEHR data (if available)
- [ ] 9.7 Validate XML output against openEHR schemas (if available)

## 10. Final Review

- [ ] 10.1 Review all code for consistency with project style
- [ ] 10.2 Review all documentation for completeness
- [ ] 10.3 Ensure all tests pass
- [ ] 10.4 Check code coverage (aim for >90%)
- [ ] 10.5 Update ROADMAP.md to mark Phase 4g.3 as complete
- [ ] 10.6 Create completion summary document

## Success Criteria

✅ All openEHR RM objects can be serialized to canonical XML
✅ XML can be deserialized back to ehrtslib objects
✅ Round-trip tests pass (original → XML → restored)
✅ Proper xsi:type attributes for polymorphic types
✅ Configurable XML formatting (pretty print, namespaces)
✅ Comprehensive error handling with clear messages
✅ All tests pass with >90% code coverage
✅ Complete documentation with examples
✅ No regressions in existing functionality

## Notes

- Coordinate with JSON/YAML implementation for common code (TypeRegistry, errors)
- Reference Archie's JAXB implementation for XML structure guidance
- Ensure compatibility with openEHR ITS-XML specification
- Consider performance for large object trees
- Keep module tree-shakeable (don't force-load XML if not needed)
