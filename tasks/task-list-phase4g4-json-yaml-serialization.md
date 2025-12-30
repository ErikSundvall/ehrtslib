# Task List: Phase 4g.4 - JSON and YAML Serialization Implementation

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps. 

Example:
- `- [ ] 1.1 Read file` → `- [x] 1.1 Read file` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task. If implementation steps happen to fulfil several things at once then ticking off several boxes is OK.

If running in interactive mode (e.g. Gemini CLI) then stop after each parent task and let user review. If running in autonomous batch mode e.g. dispatched to Jules, then just stop if user input is crucial in order to understand further steps.

## Overview

This task list implements JSON and YAML serialization and deserialization for openEHR RM objects according to the PRD in `/tasks/prd-phase4g1-serialization-deserialization.md`.

**Key Design Principles:**
- JSON and YAML share common infrastructure (type inference, terse format, hybrid formatting)
- JSON uses native JSON.parse/stringify with custom reviver/replacer
- YAML uses `yaml` by eemeli (v2.x) for better style control
- Modular design allows importing only what you need

**References:**
- PRD: `/tasks/prd-phase4g1-serialization-deserialization.md`
- openEHR ITS-JSON: https://github.com/openEHR/specifications-ITS-JSON
- Archie JSON implementation: https://github.com/openEHR/archie
- Terse format spec: https://openehr.atlassian.net/wiki/spaces/spec/pages/624361477/
- Existing terse format: `enhanced/terse_format.ts`

## 1. Project Setup and Dependencies

- [ ] 1.1 Create directory structure `enhanced/serialization/json/`
- [ ] 1.2 Create directory structure `enhanced/serialization/yaml/`
- [ ] 1.3 Create directory structure `enhanced/serialization/common/` (shared with XML)
- [ ] 1.4 Add `yaml` dependency to `deno.json` (v2.x by eemeli, ISC licensed, ~80KB minified)
- [ ] 1.5 Create `enhanced/serialization/json/mod.ts` as main JSON export
- [ ] 1.6 Create `enhanced/serialization/yaml/mod.ts` as main YAML export
- [ ] 1.7 Verify dependency installation and imports work correctly

## 2. Common Infrastructure (Shared Between JSON and YAML)

### 2.1 Type Registry (if not already created for XML)

- [ ] 2.1.1 Create/verify `enhanced/serialization/common/type_registry.ts`
- [ ] 2.1.2 Implement `TypeRegistry` class with methods:
  - [ ] `register(typeName: string, constructor: new () => any): void`
  - [ ] `getConstructor(typeName: string): (new () => any) | undefined`
  - [ ] `getTypeName(constructor: new () => any): string | undefined`
  - [ ] `hasType(typeName: string): boolean`
  - [ ] `getTypeName(obj: any): string | undefined` (from instance)
  - [ ] `getAllTypes(): string[]` (list all registered types)
- [ ] 2.1.3 Add auto-registration for all RM classes
- [ ] 2.1.4 Create/verify unit tests for `TypeRegistry`

### 2.2 Type Inference Engine

- [ ] 2.2.1 Create `enhanced/serialization/common/type_inference.ts`
- [ ] 2.2.2 Implement `TypeInferenceEngine` class with static methods:
  - [ ] `canOmitType(propertyName: string, parentType: string, value: any): boolean`
  - [ ] `inferType(propertyName: string, parentType: string, data: any): string | undefined`
  - [ ] `getPropertyType(parentType: string, propertyName: string): string | undefined`
  - [ ] `isPolymorphic(typeName: string): boolean`
  - [ ] `getDefaultTypeForProperty(parentType: string, propertyName: string): string | undefined`
  - [ ] `inferFromStructure(data: any, expectedType?: string): string | undefined`
- [ ] 2.2.3 Build property type map from BMM metadata (consult RM classes)
- [ ] 2.2.4 Implement polymorphic type detection logic
- [ ] 2.2.5 Implement structure-based type inference (detect from properties)
- [ ] 2.2.6 Create comprehensive unit tests for type inference
- [ ] 2.2.7 Test with all major RM types (COMPOSITION, OBSERVATION, DV_*, etc.)

### 2.3 Terse Format Handler

- [ ] 2.3.1 Create `enhanced/serialization/common/terse_format.ts`
- [ ] 2.3.2 Review existing `enhanced/terse_format.ts` for reuse
- [ ] 2.3.3 Implement `TerseFormatHandler` class with static methods:
  - [ ] `serializeCodePhrase(obj: CODE_PHRASE): string` - returns "terminology::code"
  - [ ] `parseCodePhrase(str: string): CODE_PHRASE | null`
  - [ ] `serializeDvCodedText(obj: DV_CODED_TEXT): string` - returns "terminology::code|value|"
  - [ ] `parseDvCodedText(str: string): DV_CODED_TEXT | null`
  - [ ] `isTerseCodePhrase(str: string): boolean` - detection
  - [ ] `isTerseDvCodedText(str: string): boolean` - detection
- [ ] 2.3.4 Reuse or adapt existing functions from `enhanced/terse_format.ts`
- [ ] 2.3.5 Handle edge cases (empty strings, special characters, malformed)
- [ ] 2.3.6 Create comprehensive unit tests for terse format
- [ ] 2.3.7 Test with examples from openEHR simplified format spec

### 2.4 Hybrid Style Formatter

- [ ] 2.4.1 Create `enhanced/serialization/common/hybrid_formatter.ts`
- [ ] 2.4.2 Implement `HybridStyleFormatter` class with static methods:
  - [ ] `shouldFormatInline(obj: any, maxInlineProperties?: number): boolean`
  - [ ] `isComplexValue(value: any): boolean`
  - [ ] `applyHybridFormattingToJson(jsonString: string): string` - post-process
  - [ ] `applyHybridFormattingToYaml(obj: any): any` - pre-process for yaml lib
  - [ ] `getComplexityScore(obj: any): number` - determine nesting level
- [ ] 2.4.3 Implement intelligent line breaking logic (zipehr-style)
- [ ] 2.4.4 Handle nested objects vs. leaf objects
- [ ] 2.4.5 Make configurable (max properties for inline, etc.)
- [ ] 2.4.6 Create unit tests for hybrid formatting
- [ ] 2.4.7 Test with COMPOSITION examples

### 2.5 Error Classes (if not already created for XML)

- [ ] 2.5.1 Create/verify `enhanced/serialization/common/errors.ts`
- [ ] 2.5.2 Implement error classes:
  - [ ] `SerializationError`
  - [ ] `DeserializationError`
  - [ ] `TypeNotFoundError`
  - [ ] `InvalidFormatError` (for terse format parsing)
- [ ] 2.5.3 Add comprehensive error context
- [ ] 2.5.4 Create/verify unit tests for errors

## 3. JSON Configuration

- [ ] 3.1 Create `enhanced/serialization/json/json_config.ts`
- [ ] 3.2 Implement `JsonSerializationConfig` interface with options:
  - [ ] `typePropertyName?: string` - default "_type"
  - [ ] `alwaysIncludeType?: boolean` - default false
  - [ ] `includeNullValues?: boolean` - default false
  - [ ] `includeEmptyCollections?: boolean` - default true
  - [ ] `prettyPrint?: boolean` - default false
  - [ ] `indent?: number` - default 2
  - [ ] `useTerseFormat?: boolean` - default false (WARNING: breaks canonical JSON)
  - [ ] `useHybridStyle?: boolean` - default false (zipehr-like)
- [ ] 3.3 Implement `JsonDeserializationConfig` interface with options:
  - [ ] `typePropertyName?: string` - default "_type"
  - [ ] `strict?: boolean` - default false
  - [ ] `allowIncomplete?: boolean` - default false
  - [ ] `parseTerseFormat?: boolean` - default false
- [ ] 3.4 Create default configuration constants
- [ ] 3.5 Add comprehensive JSDoc with warnings (terse breaks standard)

## 4. JSON Serializer Implementation

### 4.1 Core Serializer

- [ ] 4.1.1 Create `enhanced/serialization/json/json_serializer.ts`
- [ ] 4.1.2 Implement `JsonSerializer` class with constructor accepting config
- [ ] 4.1.3 Implement `serialize(obj: any): string` method
- [ ] 4.1.4 Implement `toJsonObject(obj: any): Record<string, any>` method
- [ ] 4.1.5 Implement `serializeWith(obj: any, config: JsonSerializationConfig): string` method

### 4.2 Object to JSON Conversion

- [ ] 4.2.1 Implement object traversal with custom replacer
- [ ] 4.2.2 Add `_type` field based on configuration
- [ ] 4.2.3 Use `TypeInferenceEngine` to determine when to omit `_type`
- [ ] 4.2.4 Handle primitive types (string, number, boolean, null)
- [ ] 4.2.5 Handle complex objects (nested RM objects)
- [ ] 4.2.6 Handle arrays and collections
- [ ] 4.2.7 Handle null/undefined based on config
- [ ] 4.2.8 Handle empty collections based on config

### 4.3 Terse Format Integration

- [ ] 4.3.1 Detect CODE_PHRASE and DV_CODED_TEXT instances
- [ ] 4.3.2 Serialize to terse format when `useTerseFormat: true`
- [ ] 4.3.3 Handle terse format for nested objects
- [ ] 4.3.4 Add clear warnings in documentation about non-standard usage

### 4.4 Hybrid Style Integration

- [ ] 4.4.1 Serialize to JSON with pretty print first
- [ ] 4.4.2 Apply `HybridStyleFormatter.applyHybridFormattingToJson()` as post-process
- [ ] 4.4.3 Test hybrid style with various object depths
- [ ] 4.4.4 Ensure simple objects stay inline, complex ones break

### 4.5 Type Property Handling

- [ ] 4.5.1 Use configurable type property name (default "_type")
- [ ] 4.5.2 Get type name from `TypeRegistry`
- [ ] 4.5.3 Handle objects without registered types (fallback to constructor name)
- [ ] 4.5.4 Place `_type` as first property (for readability)

## 5. JSON Deserializer Implementation

### 5.1 Core Deserializer

- [ ] 5.1.1 Create `enhanced/serialization/json/json_deserializer.ts`
- [ ] 5.1.2 Implement `JsonDeserializer` class with constructor accepting config
- [ ] 5.1.3 Implement `deserialize<T = any>(json: string): T` method
- [ ] 5.1.4 Implement `fromJsonObject<T = any>(obj: Record<string, any>): T` method
- [ ] 5.1.5 Implement `deserializeAs<T>(json: string, type: new () => T): T` method

### 5.2 JSON to Object Conversion

- [ ] 5.2.1 Implement custom reviver for JSON.parse
- [ ] 5.2.2 Extract type from `_type` field (or configured property name)
- [ ] 5.2.3 Use `TypeInferenceEngine.inferType()` when `_type` is missing
- [ ] 5.2.4 Use `TypeRegistry` to instantiate correct class
- [ ] 5.2.5 Handle primitive types
- [ ] 5.2.6 Handle complex object reconstruction
- [ ] 5.2.7 Handle array reconstruction
- [ ] 5.2.8 Recursively deserialize nested objects

### 5.3 Terse Format Parsing

- [ ] 5.3.1 Detect terse format strings when `parseTerseFormat: true`
- [ ] 5.3.2 Use `TerseFormatHandler` to parse CODE_PHRASE
- [ ] 5.3.3 Use `TerseFormatHandler` to parse DV_CODED_TEXT
- [ ] 5.3.4 Handle mixed format (some terse, some object)
- [ ] 5.3.5 Validate parsed objects

### 5.4 Type Resolution Strategy

- [ ] 5.4.1 Priority 1: Explicit `_type` field
- [ ] 5.4.2 Priority 2: Type inference from property name and parent type
- [ ] 5.4.3 Priority 3: Type inference from structure
- [ ] 5.4.4 Priority 4: Explicit type parameter (deserializeAs)
- [ ] 5.4.5 Handle unknown types in strict vs lenient mode

### 5.5 Error Handling

- [ ] 5.5.1 Handle invalid JSON syntax
- [ ] 5.5.2 Handle unknown types (TypeNotFoundError)
- [ ] 5.5.3 Handle missing required properties (strict mode)
- [ ] 5.5.4 Handle invalid terse format strings
- [ ] 5.5.5 Provide detailed error messages with context

## 6. YAML Configuration

- [ ] 6.1 Create `enhanced/serialization/yaml/yaml_config.ts`
- [ ] 6.2 Implement `YamlSerializationConfig` interface with options:
  - [ ] `includeType?: boolean` - default true
  - [ ] `useTypeInference?: boolean` - default false (compact mode)
  - [ ] `flowStyleValues?: boolean` - default false (inline style)
  - [ ] `blockStyleObjects?: boolean` - default true (multi-line)
  - [ ] `hybridStyle?: boolean` - default false (zipehr-style)
  - [ ] `indent?: number` - default 2
  - [ ] `lineWidth?: number` - default 80
  - [ ] `useTerseFormat?: boolean` - default false (recommended for YAML)
- [ ] 6.3 Implement `YamlDeserializationConfig` interface with options:
  - [ ] `strict?: boolean` - default true
  - [ ] `allowDuplicateKeys?: boolean` - default false
  - [ ] `parseTerseFormat?: boolean` - default false
- [ ] 6.4 Create default configuration constants
- [ ] 6.5 Add comprehensive JSDoc noting YAML has no official openEHR standard

## 7. YAML Serializer Implementation

### 7.1 Core Serializer

- [ ] 7.1.1 Create `enhanced/serialization/yaml/yaml_serializer.ts`
- [ ] 7.1.2 Implement `YamlSerializer` class with constructor accepting config
- [ ] 7.1.3 Implement `serialize(obj: any): string` method
- [ ] 7.1.4 Implement `serializeWith(obj: any, config: YamlSerializationConfig): string` method
- [ ] 7.1.5 Integrate `yaml` library (eemeli)

### 7.2 Object to YAML Conversion

- [ ] 7.2.1 Convert RM object to plain object (remove methods)
- [ ] 7.2.2 Add `_type` fields based on configuration
- [ ] 7.2.3 Use `TypeInferenceEngine` for type omission (compact mode)
- [ ] 7.2.4 Handle primitive types
- [ ] 7.2.5 Handle complex objects
- [ ] 7.2.6 Handle arrays and collections
- [ ] 7.2.7 Configure yaml library for flow vs block style

### 7.3 Terse Format Integration

- [ ] 7.3.1 Detect CODE_PHRASE and DV_CODED_TEXT
- [ ] 7.3.2 Serialize to terse format when `useTerseFormat: true`
- [ ] 7.3.3 Works well with YAML (no official standard, recommended)

### 7.4 Hybrid Style Integration

- [ ] 7.4.1 Use `HybridStyleFormatter.applyHybridFormattingToYaml()`
- [ ] 7.4.2 Configure yaml library for flow style on simple objects
- [ ] 7.4.3 Configure yaml library for block style on complex objects
- [ ] 7.4.4 Test zipehr-style output (siblings separate, values inline)

### 7.5 Style Configuration

- [ ] 7.5.1 Support pure block style (all multi-line)
- [ ] 7.5.2 Support pure flow style (all inline)
- [ ] 7.5.3 Support hybrid style (intelligent mixing)
- [ ] 7.5.4 Configure indentation
- [ ] 7.5.5 Configure line width for wrapping

## 8. YAML Deserializer Implementation

### 8.1 Core Deserializer

- [ ] 8.1.1 Create `enhanced/serialization/yaml/yaml_deserializer.ts`
- [ ] 8.1.2 Implement `YamlDeserializer` class with constructor accepting config
- [ ] 8.1.3 Implement `deserialize<T = any>(yaml: string): T` method
- [ ] 8.1.4 Implement `deserializeAs<T>(yaml: string, type: new () => T): T` method
- [ ] 8.1.5 Integrate `yaml` library for parsing

### 8.2 YAML to Object Conversion

- [ ] 8.2.1 Parse YAML to plain object using yaml library
- [ ] 8.2.2 Reuse JSON deserializer logic (convert through intermediate object)
- [ ] 8.2.3 Extract type from `_type` field
- [ ] 8.2.4 Use `TypeInferenceEngine` when `_type` is missing
- [ ] 8.2.5 Use `TypeRegistry` to instantiate classes
- [ ] 8.2.6 Handle all YAML-specific features (anchors, aliases, etc.)

### 8.3 Terse Format Parsing

- [ ] 8.3.1 Detect terse format strings (same as JSON)
- [ ] 8.3.2 Use `TerseFormatHandler` to parse
- [ ] 8.3.3 Handle mixed format

### 8.4 Type Resolution

- [ ] 8.4.1 Use same strategy as JSON deserializer
- [ ] 8.4.2 Share type resolution code with JSON (extract to common)

### 8.5 Error Handling

- [ ] 8.5.1 Handle invalid YAML syntax
- [ ] 8.5.2 Handle unknown types
- [ ] 8.5.3 Handle duplicate keys (strict mode)
- [ ] 8.5.4 Provide detailed error messages

## 9. Testing

### 9.1 Test Infrastructure

- [ ] 9.1.1 Create `enhanced/serialization/json/json_serializer.test.ts`
- [ ] 9.1.2 Create `enhanced/serialization/json/json_deserializer.test.ts`
- [ ] 9.1.3 Create `enhanced/serialization/yaml/yaml_serializer.test.ts`
- [ ] 9.1.4 Create `enhanced/serialization/yaml/yaml_deserializer.test.ts`
- [ ] 9.1.5 Create `enhanced/serialization/common/type_inference.test.ts`
- [ ] 9.1.6 Create `enhanced/serialization/common/terse_format.test.ts`
- [ ] 9.1.7 Create `enhanced/serialization/common/hybrid_formatter.test.ts`
- [ ] 9.1.8 Set up test fixtures: `tests/json_fixtures/`, `tests/yaml_fixtures/`
- [ ] 9.1.9 Create helper functions for assertions

### 9.2 JSON Serialization Tests

- [ ] 9.2.1 Test simple objects (DV_TEXT, CODE_PHRASE)
- [ ] 9.2.2 Test complex objects (COMPOSITION)
- [ ] 9.2.3 Test nested objects
- [ ] 9.2.4 Test arrays
- [ ] 9.2.5 Test null/undefined handling
- [ ] 9.2.6 Test empty collections
- [ ] 9.2.7 Test `_type` field inclusion (always vs inference)
- [ ] 9.2.8 Test pretty printing
- [ ] 9.2.9 Test terse format (with warnings)
- [ ] 9.2.10 Test hybrid style
- [ ] 9.2.11 Test polymorphic types

### 9.3 JSON Deserialization Tests

- [ ] 9.3.1 Test simple object deserialization
- [ ] 9.3.2 Test complex object deserialization
- [ ] 9.3.3 Test with `_type` field present
- [ ] 9.3.4 Test with `_type` field missing (type inference)
- [ ] 9.3.5 Test terse format parsing
- [ ] 9.3.6 Test unknown type handling
- [ ] 9.3.7 Test invalid JSON handling
- [ ] 9.3.8 Test strict vs lenient mode

### 9.4 YAML Serialization Tests

- [ ] 9.4.1 Test simple objects
- [ ] 9.4.2 Test complex objects
- [ ] 9.4.3 Test block style
- [ ] 9.4.4 Test flow style
- [ ] 9.4.5 Test hybrid style (zipehr-like)
- [ ] 9.4.6 Test compact mode (type inference)
- [ ] 9.4.7 Test terse format
- [ ] 9.4.8 Test combined terse + hybrid + compact

### 9.5 YAML Deserialization Tests

- [ ] 9.5.1 Test simple object deserialization
- [ ] 9.5.2 Test complex object deserialization
- [ ] 9.5.3 Test with `_type` field
- [ ] 9.5.4 Test with type inference
- [ ] 9.5.5 Test terse format parsing
- [ ] 9.5.6 Test invalid YAML handling
- [ ] 9.5.7 Test YAML-specific features (anchors, aliases)

### 9.6 Round-Trip Tests

- [ ] 9.6.1 JSON: DV_TEXT round-trip
- [ ] 9.6.2 JSON: CODE_PHRASE round-trip
- [ ] 9.6.3 JSON: DV_CODED_TEXT round-trip
- [ ] 9.6.4 JSON: COMPOSITION round-trip
- [ ] 9.6.5 JSON: Complex object tree round-trip
- [ ] 9.6.6 YAML: DV_TEXT round-trip
- [ ] 9.6.7 YAML: CODE_PHRASE round-trip
- [ ] 9.6.8 YAML: COMPOSITION round-trip
- [ ] 9.6.9 YAML: Complex tree round-trip with hybrid style

### 9.7 Cross-Format Tests

- [ ] 9.7.1 Test JSON → object → YAML conversion
- [ ] 9.7.2 Test YAML → object → JSON conversion
- [ ] 9.7.3 Verify semantic equivalence across formats

### 9.8 Integration Tests

- [ ] 9.8.1 Test with canonical openEHR JSON examples
- [ ] 9.8.2 Test with Archie-generated JSON
- [ ] 9.8.3 Test with zipehr YAML examples
- [ ] 9.8.4 Test configuration combinations
- [ ] 9.8.5 Test error scenarios

### 9.9 Performance Tests

- [ ] 9.9.1 JSON serialization performance (large COMPOSITION)
- [ ] 9.9.2 JSON deserialization performance
- [ ] 9.9.3 YAML serialization performance
- [ ] 9.9.4 YAML deserialization performance
- [ ] 9.9.5 Memory usage profiling
- [ ] 9.9.6 Compare with/without type inference
- [ ] 9.9.7 Document performance characteristics

## 10. Documentation

### 10.1 JSON API Documentation

- [ ] 10.1.1 Add comprehensive JSDoc to all JSON classes
- [ ] 10.1.2 Add JSDoc examples for common use cases
- [ ] 10.1.3 Document configuration options thoroughly
- [ ] 10.1.4 Add warnings about terse format breaking canonical JSON

### 10.2 YAML API Documentation

- [ ] 10.2.1 Add comprehensive JSDoc to all YAML classes
- [ ] 10.2.2 Add JSDoc examples
- [ ] 10.2.3 Document configuration options
- [ ] 10.2.4 Note that YAML has no official openEHR standard

### 10.3 Common Infrastructure Documentation

- [ ] 10.3.1 Document `TypeInferenceEngine` usage
- [ ] 10.3.2 Document `TerseFormatHandler` usage
- [ ] 10.3.3 Document `HybridStyleFormatter` usage
- [ ] 10.3.4 Document `TypeRegistry` usage

### 10.4 User Guides

- [ ] 10.4.1 Create `enhanced/serialization/json/README.md`
- [ ] 10.4.2 Create `enhanced/serialization/yaml/README.md`
- [ ] 10.4.3 Add "Getting Started" sections
- [ ] 10.4.4 Add "Configuration" sections
- [ ] 10.4.5 Add "Advanced Usage" sections
- [ ] 10.4.6 Add "Terse Format" sections with warnings/recommendations
- [ ] 10.4.7 Add "Hybrid Style" sections
- [ ] 10.4.8 Add "Type Inference" sections
- [ ] 10.4.9 Add "Performance Tips" sections
- [ ] 10.4.10 Add "openEHR Compliance" sections

### 10.5 Examples

- [ ] 10.5.1 Create `examples/json_serialization_basic.ts`
- [ ] 10.5.2 Create `examples/json_serialization_advanced.ts`
- [ ] 10.5.3 Create `examples/yaml_serialization_basic.ts`
- [ ] 10.5.4 Create `examples/yaml_serialization_advanced.ts`
- [ ] 10.5.5 Add example: Canonical JSON (standard)
- [ ] 10.5.6 Add example: Compact JSON (type inference)
- [ ] 10.5.7 Add example: Hybrid JSON (zipehr-like)
- [ ] 10.5.8 Add example: JSON with terse format (non-standard)
- [ ] 10.5.9 Add example: YAML block style
- [ ] 10.5.10 Add example: YAML hybrid style
- [ ] 10.5.11 Add example: YAML compact with terse (recommended)
- [ ] 10.5.12 Add example: Round-trip serialization
- [ ] 10.5.13 Add example: Cross-format conversion

## 11. Module Exports

- [ ] 11.1 Update `enhanced/serialization/json/mod.ts` to export:
  - [ ] `JsonSerializer`
  - [ ] `JsonDeserializer`
  - [ ] `JsonSerializationConfig`
  - [ ] `JsonDeserializationConfig`
- [ ] 11.2 Update `enhanced/serialization/yaml/mod.ts` to export:
  - [ ] `YamlSerializer`
  - [ ] `YamlDeserializer`
  - [ ] `YamlSerializationConfig`
  - [ ] `YamlDeserializationConfig`
- [ ] 11.3 Update `enhanced/serialization/common/mod.ts` to export shared utilities
- [ ] 11.4 Create `enhanced/serialization/mod.ts` to re-export all serializers
- [ ] 11.5 Update main project exports if needed
- [ ] 11.6 Ensure tree-shaking works (test bundle sizes)

## 12. Integration and Validation

- [ ] 12.1 Run all JSON tests
- [ ] 12.2 Run all YAML tests
- [ ] 12.3 Run all common infrastructure tests
- [ ] 12.4 Run full project test suite (no regressions)
- [ ] 12.5 Test imports from different contexts
- [ ] 12.6 Verify no circular dependencies
- [ ] 12.7 Check bundle size impact
- [ ] 12.8 Test with real-world openEHR data
- [ ] 12.9 Validate JSON against openEHR JSON schemas (if available)
- [ ] 12.10 Cross-validate with Archie output (where possible)

## 13. Final Review

- [ ] 13.1 Review all code for consistency with project style
- [ ] 13.2 Review all documentation for completeness
- [ ] 13.3 Ensure all tests pass
- [ ] 13.4 Check code coverage (aim for >90%)
- [ ] 13.5 Verify shared code reuse between JSON and YAML
- [ ] 13.6 Confirm terse format warnings are clear
- [ ] 13.7 Update ROADMAP.md to mark Phase 4g.4 as complete
- [ ] 13.8 Create completion summary document

## Success Criteria

✅ All openEHR RM objects can be serialized to canonical JSON
✅ All openEHR RM objects can be serialized to YAML (multiple styles)
✅ JSON and YAML can be deserialized back to ehrtslib objects
✅ Type inference works correctly (omit `_type` when safe)
✅ Terse format support for CODE_PHRASE and DV_CODED_TEXT
✅ Hybrid style formatting (zipehr-like) for both JSON and YAML
✅ Round-trip tests pass (original → JSON → restored, original → YAML → restored)
✅ Cross-format conversion works (JSON ↔ YAML)
✅ Comprehensive error handling with clear messages
✅ All tests pass with >90% code coverage
✅ Complete documentation with examples and warnings
✅ Shared infrastructure reduces code duplication
✅ No regressions in existing functionality
✅ Modular design allows tree-shaking

## Notes

- JSON and YAML share type inference, terse format, and hybrid formatting code
- Terse format breaks canonical JSON standard - document clearly with warnings
- YAML has no official openEHR standard - terse format is recommended
- Hybrid style inspired by zipehr project
- Coordinate with XML implementation for shared TypeRegistry and error classes
- Consider performance implications of type inference (cache lookups)
- Test with actual openEHR examples from specifications and reference implementations
