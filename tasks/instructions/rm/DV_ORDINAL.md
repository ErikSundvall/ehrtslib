# Instruction: Implementing the `DV_ORDINAL` Class

## 1. Description

The `DV_ORDINAL` class represents ordinal values - ordered categories with both a numeric value and textual meaning, like pain scales or Apgar scores.

-   **Reference:** [openEHR RM - DV_ORDINAL](https://specifications.openehr.org/releases/RM/latest/data_types.html#_dv_ordinal_class)

## 2. Behavior

### 2.1. Properties

#### `value: Integer`

-   **Purpose:** The numeric ordinal value.
-   **Mandatory:** Yes

#### `symbol: DV_CODED_TEXT`

-   **Purpose:** The coded textual meaning.
-   **Mandatory:** Yes

## 3. Example Usage

```typescript
// Pain scale: 0=None, 1=Mild, 2=Moderate, 3=Severe
const pain = new DV_ORDINAL();
pain.value = 2;
pain.symbol = DV_CODED_TEXT.from("Moderate pain", CODE_PHRASE.from("at0002", "local"));

// Apgar score component
const apgar = new DV_ORDINAL();
apgar.value = 2;
apgar.symbol = DV_CODED_TEXT.from("Good", CODE_PHRASE.from("at0005", "local"));
```

## 4. Test Cases

1. Test creation with value and symbol
2. Test pain scale values
3. Test Apgar score
4. Test comparison by numeric value
5. Test validation requires both value and symbol

## 5. References

-   **Official Specification:** [openEHR RM - DV_ORDINAL](https://specifications.openehr.org/releases/RM/latest/data_types.html#_dv_ordinal_class)
