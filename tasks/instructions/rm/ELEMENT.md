# Instruction: Implementing the `ELEMENT` Class

## 1. Description

The `ELEMENT` class represents a single data point within clinical data structures in openEHR. It inherits from `ITEM` (which inherits from `LOCATABLE`) and is a fundamental building block for recording observable clinical facts.

-   **Reference:** [openEHR RM - ELEMENT](https://specifications.openehr.org/releases/RM/latest/data_structures.html#_element_class)

## 2. Behavior

### 2.1. Properties

#### `value: DATA_VALUE`

-   **Purpose:** The actual clinical data value.
-   **Type:** Any concrete subclass of DATA_VALUE (DV_TEXT, DV_QUANTITY, DV_CODED_TEXT, etc.)
-   **Optional:** Yes (but must be present if null_flavour is absent)

#### `null_flavour: DV_CODED_TEXT`

-   **Purpose:** Coded reason why value is absent.
-   **Optional:** Yes (but must be present if value is absent)
-   **Terminology:** Must be from "null flavours" terminology group
-   **Examples:** "no information", "not applicable", "masked", "not asked"

#### `null_reason: DV_TEXT`

-   **Purpose:** Textual explanation for absence of value.
-   **Optional:** Yes
-   **Valid only when:** value is null

### 2.2. Methods

#### `is_null(): Boolean`

-   **Purpose:** Check if the element has no value (is null).
-   **Pseudo-code:**
    ```typescript
    is_null(): Boolean {
      return new Boolean(this.value === undefined || this.value === null);
    }
    ```

#### `is_simple(): Boolean`

-   **Purpose:** ELEMENT is always considered simple (leaf node).
-   **Returns:** True
-   **Pseudo-code:**
    ```typescript
    is_simple(): Boolean {
      return new Boolean(true);
    }
    ```

## 3. Invariants

-   **Null_flavour_indicated:** `(value = Void) xor (null_flavour = Void)`
  - Either value is null and null_flavour is set, OR value is set and null_flavour is null
  - Cannot have both, cannot have neither

-   **Null_flavour_valid:** `null_flavour /= Void implies terminology("null flavours").has_code(null_flavour.defining_code)`
  - If null_flavour is present, it must be from the correct terminology

-   **Null_reason_valid:** `null_reason /= Void implies value = Void`
  - null_reason can only be present when value is absent

## 4. Pre-conditions

-   Either `value` or `null_flavour` must be set
-   If `null_flavour` is set, it must use a valid code from null flavours terminology

## 5. Post-conditions

-   `is_null()` accurately reflects presence/absence of value
-   Invariants are maintained

## 6. Example Usage

```typescript
// Element with a value
const systolicElement = new ELEMENT();
systolicElement.archetype_node_id = "at0004";

const nameText = new DV_TEXT();
nameText.value = "Systolic pressure";
systolicElement.name = nameText;

const quantity = new DV_QUANTITY();
quantity.magnitude = 120;
quantity.units = "mm[Hg]";
systolicElement.value = quantity;

console.log(systolicElement.is_null());  // false

// Element with null flavour (value absent)
const refusedElement = new ELEMENT();
refusedElement.archetype_node_id = "at0005";

const refusedName = new DV_TEXT();
refusedName.value = "Smoking status";
refusedElement.name = refusedName;

const nullFlavour = new DV_CODED_TEXT();
nullFlavour.value = "not asked";
nullFlavour.defining_code = CODE_PHRASE.from("253", "openehr");  // "not asked" code
refusedElement.null_flavour = nullFlavour;

const nullReason = new DV_TEXT();
nullReason.value = "Patient declined to answer";
refusedElement.null_reason = nullReason;

console.log(refusedElement.is_null());  // true
console.log(refusedElement.is_simple());  // true
```

## 7. Common Data Value Types

ELEMENT can hold various DATA_VALUE subtypes:
- **DV_TEXT** - Plain text
- **DV_CODED_TEXT** - Coded terminology terms
- **DV_QUANTITY** - Numerical measurements with units
- **DV_COUNT** - Integer counts
- **DV_DATE_TIME** - Date and time values
- **DV_BOOLEAN** - Boolean values
- **DV_ORDINAL** - Ordinal values (numeric with meaning)
- **DV_PROPORTION** - Ratios and percentages

## 8. Test Cases

Key test cases to implement:
1. Test creation with value (various DATA_VALUE types)
2. Test creation with null_flavour (no value)
3. Test is_null() returns false when value present
4. Test is_null() returns true when value absent
5. Test is_simple() always returns true
6. Test invariant: cannot have both value and null_flavour
7. Test invariant: must have either value or null_flavour
8. Test null_flavour must be from correct terminology
9. Test null_reason only valid when value is null
10. Test null_reason throws error if value is present
11. Test with DV_TEXT value
12. Test with DV_QUANTITY value
13. Test with DV_CODED_TEXT value
14. Test serialization/deserialization

## 9. References

-   [openEHR RM - ELEMENT](https://specifications.openehr.org/releases/RM/latest/data_structures.html#_element_class)
-   [openEHR RM - ITEM](https://specifications.openehr.org/releases/RM/latest/data_structures.html#_item_class)
-   [Archie ELEMENT Implementation](https://github.com/openEHR/archie/blob/master/openehr-rm/src/main/java/com/nedap/archie/rm/datastructures/Element.java)
-   [Null Flavours Terminology](https://specifications.openehr.org/releases/TERM/latest/SupportTerminology.html#_null_flavours)
