# Instruction: Implementing the `Character` Class

## 1. Description

The `Character` class represents a single character. It extends `Ordered` to provide comparison capabilities.

-   **Reference:** [openEHR BASE - Foundation Types - Character](https://specifications.openehr.org/releases/BASE/latest/foundation_types.html#_character_class)

## 2. Behavior

### 2.1. Constructor and Factory Methods

-   **Purpose:** Create Character instances from string (single char).
-   **Pseudo-code:**
    ```typescript
    constructor() {
      super();
      this._value = '';
    }
    
    static from(val: string): Character {
      if (val.length !== 1) {
        throw new Error("Character must be exactly one character");
      }
      const char = new Character();
      char._value = val;
      return char;
    }
    ```

### 2.2. `value` Property

-   **Purpose:** Access the underlying character.
-   **Pseudo-code:**
    ```typescript
    private _value: string = '';
    
    get value(): string {
      return this._value;
    }
    
    set value(val: string) {
      if (val.length !== 1) {
        throw new Error("Character must be exactly one character");
      }
      this._value = val;
    }
    ```

### 2.3. `is_equal(other: Any): Boolean`

-   **Purpose:** Compare two Character objects.
-   **Pseudo-code:**
    ```typescript
    is_equal(other: Any): Boolean {
      if (!(other instanceof Character)) {
        return new Boolean(false);
      }
      return new Boolean(this.value === other.value);
    }
    ```

### 2.4. `less_than(other: Ordered): Boolean`

-   **Purpose:** Compare characters lexicographically.
-   **Pseudo-code:**
    ```typescript
    less_than(other: Ordered): Boolean {
      if (!(other instanceof Character)) {
        throw new Error("Cannot compare Character with non-Character");
      }
      return new Boolean(this.value < other.value);
    }
    ```

### 2.5. `code(): Integer`

-   **Purpose:** Return the Unicode code point of the character.
-   **Pseudo-code:**
    ```typescript
    code(): Integer {
      return Integer.from(this.value.charCodeAt(0));
    }
    ```

### 2.6. `is_digit(): Boolean`

-   **Purpose:** Check if character is a digit (0-9).
-   **Pseudo-code:**
    ```typescript
    is_digit(): Boolean {
      return new Boolean(/^[0-9]$/.test(this.value));
    }
    ```

### 2.7. `is_letter(): Boolean`

-   **Purpose:** Check if character is a letter.
-   **Pseudo-code:**
    ```typescript
    is_letter(): Boolean {
      return new Boolean(/^[a-zA-Z]$/.test(this.value));
    }
    ```

### 2.8. `is_whitespace(): Boolean`

-   **Purpose:** Check if character is whitespace.
-   **Pseudo-code:**
    ```typescript
    is_whitespace(): Boolean {
      return new Boolean(/^\s$/.test(this.value));
    }
    ```

## 3. Invariants

-   **Single_character:** Value must be exactly one character.

## 4. Pre-conditions

-   Value must be set to a single character.

## 5. Post-conditions

-   Character remains a single character after any operation.

## 6. Example Usage

```typescript
const a = Character.from('A');
const b = Character.from('B');
const digit = Character.from('5');
const space = Character.from(' ');

console.log(a.less_than(b));           // true
console.log(a.is_equal(Character.from('A'))); // true

console.log(a.code().value);           // 65
console.log(a.is_letter());            // true
console.log(a.is_digit());             // false

console.log(digit.is_digit());         // true
console.log(space.is_whitespace());    // true
```

## 7. Test Cases

Key test cases to implement:
1. Test creation with single character
2. Test creation throws error for empty string
3. Test creation throws error for multi-character string
4. Test comparison operations
5. Test code() returns correct Unicode value
6. Test is_digit with digits and non-digits
7. Test is_letter with letters and non-letters
8. Test is_whitespace with various whitespace characters
9. Test with Unicode characters
10. Test value equality vs reference equality

## 8. References

-   [openEHR BASE Specification - Character](https://specifications.openehr.org/releases/BASE/latest/foundation_types.html#_character_class)
-   [Unicode character codes](https://unicode-table.com/)
