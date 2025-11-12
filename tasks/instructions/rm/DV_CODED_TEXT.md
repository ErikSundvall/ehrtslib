# Instruction: Implementing the `DV_CODED_TEXT` Class

## 1. Description

The `DV_CODED_TEXT` class extends `DV_TEXT` to add terminology coding. It is used for coded clinical terms from terminologies like SNOMED CT, LOINC, ICD-10, etc.

-   **Reference:** [openEHR RM - DV_CODED_TEXT](https://specifications.openehr.org/releases/RM/latest/data_types.html#_dv_coded_text_class)

## 2. Behavior

### 2.1. Properties

Inherits from DV_TEXT:
- `value: String` - The text representation
- `language`, `encoding`, `mappings`, etc.

Additional property:
#### `defining_code: CODE_PHRASE`

-   **Purpose:** The coded term from a terminology.
-   **Mandatory:** Yes
-   **Contains:** terminology_id and code_string

### 2.2. Factory Methods

```typescript
static from(value: string, defining_code: CODE_PHRASE): DV_CODED_TEXT {
  const dv = new DV_CODED_TEXT();
  dv.value = value;
  dv.defining_code = defining_code;
  return dv;
}
```

### 2.3. Comparison

```typescript
is_equal(other: Any): Boolean {
  if (!(other instanceof DV_CODED_TEXT)) {
    return new Boolean(false);
  }
  
  // Compare both text value and code
  return new Boolean(
    this.value === other.value &&
    this.defining_code.is_equal(other.defining_code).value
  );
}
```

## 3. Invariants

-   **Defining_code_exists:** `defining_code /= Void`
-   Inherits all invariants from DV_TEXT

## 4. Pre-conditions

-   Both `value` and `defining_code` must be set

## 5. Example Usage

```typescript
// Gender coded text
const gender = DV_CODED_TEXT.from(
  "Male",
  CODE_PHRASE.from("at0005", "local")
);

// SNOMED CT coded text
const diagnosis = new DV_CODED_TEXT();
diagnosis.value = "Hypertension";
diagnosis.defining_code = CODE_PHRASE.from(
  "38341003",
  "SNOMED-CT"
);

// LOINC coded text
const labTest = DV_CODED_TEXT.from(
  "Glucose [Mass/volume] in Blood",
  CODE_PHRASE.from("2339-0", "LOINC")
);

// Comparison
const gender2 = DV_CODED_TEXT.from("Male", CODE_PHRASE.from("at0005", "local"));
console.log(gender.is_equal(gender2));  // true
```

## 6. Use Cases

DV_CODED_TEXT is extensively used for:
- Coded clinical terms
- Archetype internal codes (at0001, at0002, etc.)
- Standard terminology codes (SNOMED CT, LOINC, ICD-10)
- Null flavours in ELEMENT
- Event category in COMPOSITION
- Any field requiring both human-readable text and machine-processable code

## 7. Test Cases

1. Test creation with value and code
2. Test with SNOMED CT code
3. Test with LOINC code
4. Test with ICD-10 code
5. Test with archetype internal code
6. Test is_equal compares both value and code
7. Test different values same code are not equal
8. Test same value different codes are not equal
9. Test language and encoding properties
10. Test validation requires defining_code

## 8. References

-   [openEHR RM - DV_CODED_TEXT](https://specifications.openehr.org/releases/RM/latest/data_types.html#_dv_coded_text_class)
-   [Archie DV_CODED_TEXT](https://github.com/openEHR/archie/blob/master/openehr-rm/src/main/java/com/nedap/archie/rm/datavalues/DvCodedText.java)
-   [SNOMED CT](https://www.snomed.org/)
-   [LOINC](https://loinc.org/)
