# Instruction: Implementing the `CODE_PHRASE` Class

## 1. Description

The `CODE_PHRASE` class represents a coded term from a terminology service. It consists of a terminology identifier and a code string. This is one of the most commonly used classes in openEHR as coded terms are used throughout clinical data (diagnoses, procedures, observations, etc.).

-   **Reference:** [openEHR BASE - Terminology Package - CODE_PHRASE](https://specifications.openehr.org/releases/BASE/latest/base_types.html#_code_phrase_class)

## 2. Behavior

### 2.1. Properties

-   **`terminology_id: TERMINOLOGY_ID`**: Identifier of the distinct terminology from which the code_string is taken.
-   **`code_string: String`**: The key used by the terminology service to identify a concept or coordination of concepts.

### 2.2. Constructor

-   **Purpose:** Create a CODE_PHRASE with terminology ID and code.
-   **Pseudo-code:**
    ```typescript
    constructor() {
      super();
    }
    
    static from(terminologyId: string, codeString: string): CODE_PHRASE {
      const codePhrase = new CODE_PHRASE();
      
      const termId = new TERMINOLOGY_ID();
      termId.value = terminologyId;
      codePhrase.terminology_id = termId;
      
      codePhrase.code_string = String.from(codeString);
      
      return codePhrase;
    }
    ```

### 2.3. `is_equal(other: Any): Boolean`

-   **Purpose:** Compare two CODE_PHRASE objects for equality.
-   **Pseudo-code:**
    ```typescript
    is_equal(other: Any): Boolean {
      if (!(other instanceof CODE_PHRASE)) {
        return new Boolean(false);
      }
      
      // Compare terminology IDs
      if (!this.terminology_id || !other.terminology_id) {
        return new Boolean(false);
      }
      if (!this.terminology_id.is_equal(other.terminology_id).value) {
        return new Boolean(false);
      }
      
      // Compare code strings
      if (!this.code_string || !other.code_string) {
        return new Boolean(false);
      }
      if (!this.code_string.is_equal(other.code_string).value) {
        return new Boolean(false);
      }
      
      return new Boolean(true);
    }
    ```

## 3. Invariants

-   **Terminology_id_exists:** `terminology_id /= Void`
-   **Code_string_exists:** `code_string /= Void and then not code_string.is_empty()`

## 4. Pre-conditions

-   Both terminology_id and code_string must be set for a valid CODE_PHRASE.

## 5. Post-conditions

-   CODE_PHRASE objects are immutable once created (best practice).

## 6. Example Usage

```typescript
// Using SNOMED CT
const snomedCode = CODE_PHRASE.from("SNOMED-CT", "38341003");
console.log(snomedCode.terminology_id.value); // "SNOMED-CT"
console.log(snomedCode.code_string.value);    // "38341003" (hypertension)

// Using LOINC
const loincCode = CODE_PHRASE.from("LOINC", "718-7");
console.log(loincCode.terminology_id.value);  // "LOINC"
console.log(loincCode.code_string.value);     // "718-7" (hemoglobin)

// Using local terminology
const localCode = CODE_PHRASE.from("local", "at0001");
console.log(localCode.terminology_id.value);  // "local"
console.log(localCode.code_string.value);     // "at0001"

// Comparison
const code1 = CODE_PHRASE.from("SNOMED-CT", "38341003");
const code2 = CODE_PHRASE.from("SNOMED-CT", "38341003");
const code3 = CODE_PHRASE.from("SNOMED-CT", "73211009");

console.log(code1.is_equal(code2));  // true (same terminology and code)
console.log(code1.is_equal(code3));  // false (different code)
```

## 7. Common Use Cases in openEHR

CODE_PHRASE is used extensively in openEHR:

1. **DV_CODED_TEXT**: For coded clinical concepts
   ```typescript
   const codedText = new DV_CODED_TEXT();
   codedText.value = "Hypertension";
   codedText.defining_code = CODE_PHRASE.from("SNOMED-CT", "38341003");
   ```

2. **ELEMENT.name**: Archetype node identifiers
   ```typescript
   const element = new ELEMENT();
   element.name = new DV_TEXT();
   element.name.defining_code = CODE_PHRASE.from("local", "at0001");
   ```

3. **Terminology bindings**: Linking concepts to external terminologies
   ```typescript
   const binding = CODE_PHRASE.from("ICD-10", "I10");
   ```

4. **Language and encoding**: Specifying languages
   ```typescript
   const languageCode = CODE_PHRASE.from("ISO_639-1", "en");
   const encodingCode = CODE_PHRASE.from("IANA_character-sets", "UTF-8");
   ```

## 8. Terminology ID Format

The terminology_id can be:
- **External terminology**: `"SNOMED-CT"`, `"LOINC"`, `"ICD-10"`, `"ICD-11"`
- **Local archetype terminology**: `"local"` (for archetype-internal codes like `at0001`)
- **openEHR terminology**: `"openehr"` (for openEHR-defined vocabularies)
- **ISO standards**: `"ISO_639-1"` (languages), `"ISO_3166-1"` (countries)

## 9. Test Cases

Key test cases to implement:
1. Test creation with common terminologies (SNOMED-CT, LOINC, ICD)
2. Test creation with local terminology
3. Test is_equal with identical CODE_PHRASEs
4. Test is_equal with different terminologies
5. Test is_equal with different codes
6. Test is_equal with same terminology but different codes
7. Test validation - both fields must be set
8. Test validation - code_string must not be empty
9. Test serialization/deserialization to JSON
10. Test with various terminology formats

## 10. References

-   [openEHR BASE Specification - CODE_PHRASE](https://specifications.openehr.org/releases/BASE/latest/base_types.html#_code_phrase_class)
-   [openEHR BASE Specification - TERMINOLOGY_ID](https://specifications.openehr.org/releases/BASE/latest/base_types.html#_terminology_id_class)
-   [Archie CodePhrase Implementation](https://github.com/openEHR/archie/blob/master/openehr-rm/src/main/java/com/nedap/archie/rm/datatypes/CodePhrase.java)
-   [openEHR Terminology Usage](https://specifications.openehr.org/releases/TERM/latest/SupportTerminology.html)
