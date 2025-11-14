# Instruction: Implementing the `TERMINOLOGY_ID` Class

## 1. Description

The `TERMINOLOGY_ID` class represents an identifier for a terminology or coding
system.

- **Format:** `name[([version])]`
- **Examples:** `"SNOMED-CT"`, `"ICD-10"`, `"LOINC(2.71)"`, `"local"`
- **Reference:**
  [openEHR BASE - TERMINOLOGY_ID](https://specifications.openehr.org/releases/BASE/latest/base_types.html#_terminology_id_class)

## 2. Behavior

### 2.1. Constructor and Parsing

- **Pseudo-code:**
  ```typescript
  static from(termIdStr: string): TERMINOLOGY_ID {
    const id = new TERMINOLOGY_ID();
    id.value = termIdStr;
    id.parse(termIdStr);
    return id;
  }

  private parse(termIdStr: string): void {
    // Pattern: name or name(version)
    const pattern = /^([^(]+)(?:\(([^)]+)\))?$/;
    const match = termIdStr.match(pattern);
    
    if (!match) {
      throw new Error("Invalid TERMINOLOGY_ID format");
    }
    
    this._name = match[1].trim();
    this._version = match[2] || undefined;
  }
  ```

### 2.2. Component Accessors

#### `name(): String`

- **Purpose:** Return the terminology name.
- **Pseudo-code:**
  ```typescript
  name(): String {
    return String.from(this._name);
  }
  ```

#### `version_id(): String | undefined`

- **Purpose:** Return the optional version.
- **Pseudo-code:**
  ```typescript
  version_id(): String | undefined {
    return this._version ? String.from(this._version) : undefined;
  }
  ```

### 2.3. `is_equal(other: Any): Boolean`

- **Purpose:** Compare TERMINOLOGY_ID objects.
- **Note:** Should consider if version is significant for equality.
- **Pseudo-code:**
  ```typescript
  is_equal(other: Any): Boolean {
    if (!(other instanceof TERMINOLOGY_ID)) {
      return new Boolean(false);
    }
    
    // Compare names (case-sensitive by default)
    if (this._name !== other._name) {
      return new Boolean(false);
    }
    
    // Compare versions if both are set
    if (this._version && other._version) {
      return new Boolean(this._version === other._version);
    }
    
    // If one has version and other doesn't, they're not equal
    if (this._version || other._version) {
      return new Boolean(false);
    }
    
    return new Boolean(true);
  }
  ```

## 3. Invariants

- **Name_exists:** `name /= Void and then not name.is_empty()`

## 4. Pre-conditions

- Terminology string must be well-formed.

## 5. Post-conditions

- Name and version (if present) are correctly parsed.

## 6. Example Usage

```typescript
// Simple terminology without version
const snomedId = TERMINOLOGY_ID.from("SNOMED-CT");
console.log(snomedId.name().value); // "SNOMED-CT"
console.log(snomedId.version_id()); // undefined

// Terminology with version
const loincId = TERMINOLOGY_ID.from("LOINC(2.71)");
console.log(loincId.name().value); // "LOINC"
console.log(loincId.version_id().value); // "2.71"

// ICD with version
const icd10Id = TERMINOLOGY_ID.from("ICD-10(2019)");
console.log(icd10Id.name().value); // "ICD-10"
console.log(icd10Id.version_id().value); // "2019"

// Local terminology
const localId = TERMINOLOGY_ID.from("local");
console.log(localId.name().value); // "local"

// Comparison
const term1 = TERMINOLOGY_ID.from("SNOMED-CT");
const term2 = TERMINOLOGY_ID.from("SNOMED-CT");
const term3 = TERMINOLOGY_ID.from("LOINC");
const term4 = TERMINOLOGY_ID.from("LOINC(2.71)");
const term5 = TERMINOLOGY_ID.from("LOINC(2.72)");

console.log(term1.is_equal(term2)); // true
console.log(term1.is_equal(term3)); // false
console.log(term3.is_equal(term4)); // false (version difference)
console.log(term4.is_equal(term5)); // false (different versions)
```

## 7. Common Terminology Systems

- **SNOMED-CT** - Systematized Nomenclature of Medicine
- **LOINC** - Logical Observation Identifiers Names and Codes
- **ICD-10** / **ICD-11** - International Classification of Diseases
- **UCUM** - Unified Code for Units of Measure
- **local** - Archetype-local terminology
- **openehr** - openEHR terminology
- **ISO_639-1** - Language codes
- **ISO_3166-1** - Country codes

## 8. Test Cases

Key test cases to implement:

1. Test parsing name without version
2. Test parsing name with version
3. Test name() returns correct value
4. Test version_id() returns correct value or undefined
5. Test is_equal() with identical IDs
6. Test is_equal() with different names
7. Test is_equal() with same name but different versions
8. Test is_equal() with version vs no version
9. Test with common terminology systems
10. Test with whitespace handling
11. Test invalid formats throw errors

## 9. References

- [openEHR BASE - TERMINOLOGY_ID](https://specifications.openehr.org/releases/BASE/latest/base_types.html#_terminology_id_class)
- [openEHR Terminology](https://specifications.openehr.org/releases/TERM/latest/SupportTerminology.html)
- [Archie TerminologyId Implementation](https://github.com/openEHR/archie/blob/master/openehr-rm/src/main/java/com/nedap/archie/rm/support/identification/TerminologyId.java)
