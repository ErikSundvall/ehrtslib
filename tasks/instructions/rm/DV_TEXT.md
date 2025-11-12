# Instruction: Implementing the `DV_TEXT` Class

## 1. Description

The `DV_TEXT` class represents plain text values. It is one of the most commonly used data value types in openEHR for representing textual clinical data.

-   **Reference:** [openEHR RM - DV_TEXT](https://specifications.openehr.org/releases/RM/latest/data_types.html#_dv_text_class)

## 2. Behavior

### 2.1. Properties

#### `value: String`

-   **Purpose:** The text value.
-   **Mandatory:** Yes

#### `hyperlink: DV_URI`

-   **Purpose:** Optional link to external resource.
-   **Optional:** Yes

#### `formatting: String`

-   **Purpose:** Format markup (HTML, RTF, etc.).
-   **Optional:** Yes

#### `mappings: List<TERM_MAPPING>`

-   **Purpose:** Terminology mappings.
-   **Optional:** Yes

#### `language: CODE_PHRASE`

-   **Purpose:** Language of the text.
-   **Optional:** Yes (but recommended)

#### `encoding: CODE_PHRASE`

-   **Purpose:** Character encoding.
-   **Optional:** Yes (but recommended)

### 2.2. Factory Methods

-   **Pseudo-code:**
    ```typescript
    static from(value: string): DV_TEXT {
      const dv = new DV_TEXT();
      dv.value = value;
      return dv;
    }
    ```

### 2.3. Comparison

-   **`is_equal(other: Any): Boolean`** - Compare text values

## 3. Invariants

-   **Value_exists:** `value /= Void and then not value.is_empty()`

## 4. Example Usage

```typescript
const text = DV_TEXT.from("Patient is well");

// With language
const textWithLang = new DV_TEXT();
textWithLang.value = "Patient is well";
textWithLang.language = CODE_PHRASE.from("en", "ISO_639-1");
textWithLang.encoding = CODE_PHRASE.from("UTF-8", "IANA_character-sets");
```

## 5. Test Cases

1. Test creation with simple string
2. Test creation with language and encoding
3. Test with hyperlink
4. Test with formatting
5. Test is_equal comparison
6. Test empty value throws error

## 6. References

-   [openEHR RM - DV_TEXT](https://specifications.openehr.org/releases/RM/latest/data_types.html#_dv_text_class)
-   [Archie DV_TEXT](https://github.com/openEHR/archie/blob/master/openehr-rm/src/main/java/com/nedap/archie/rm/datavalues/quantity/DvText.java)
