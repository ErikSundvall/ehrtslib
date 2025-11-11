# Instruction: Implementing the `Iso8601_date_time` Class

## 1. Description

The `Iso8601_date_time` class represents combined date and time in ISO 8601 format.

-   **Format:** `YYYY-MM-DD'T'hh:mm:ss[.sss][Z|±hh:mm]`
-   **Examples:** `"2024-03-15T14:30:45"`, `"2024-03-15T14:30:45.123Z"`, `"2024-03-15T14:30:45+01:00"`
-   **Reference:** [openEHR BASE - Iso8601_date_time](https://specifications.openehr.org/releases/BASE/latest/foundation_types.html#_iso8601_date_time_class)

## 2. Behavior

### 2.1. Constructor and Parsing

-   **Pseudo-code:**
    ```typescript
    static from(dateTimeStr: string): Iso8601_date_time {
      const dt = new Iso8601_date_time();
      dt.value = dateTimeStr;
      dt.parse(dateTimeStr);
      return dt;
    }
    
    private parse(dateTimeStr: string): void {
      // Split on 'T'
      const parts = dateTimeStr.split('T');
      if (parts.length !== 2) {
        throw new Error("Invalid ISO 8601 date-time format");
      }
      
      this._date = Iso8601_date.from(parts[0]);
      this._time = Iso8601_time.from(parts[1]);
    }
    ```

### 2.2. Component Accessors

-   **`year(): Integer`** - From date part
-   **`month(): Integer | undefined`** - From date part
-   **`day(): Integer | undefined`** - From date part
-   **`hour(): Integer`** - From time part
-   **`minute(): Integer | undefined`** - From time part
-   **`second(): Integer | undefined`** - From time part
-   **`fractional_second(): Real | undefined`** - From time part
-   **`timezone(): String | undefined`** - From time part

### 2.3. Derived Accessors

-   **`date(): Iso8601_date`** - Returns the date component
-   **`time(): Iso8601_time`** - Returns the time component

### 2.4. Precision and Format Queries

-   **`is_partial(): Boolean`** - True if date or time is partial
-   **`is_extended(): Boolean`** - True if uses extended format
-   **`has_fractional_second(): Boolean`** - True if fractional seconds present

### 2.5. Validation

-   **`is_valid(): Boolean`** - Validates both date and time components
-   **Pseudo-code:**
    ```typescript
    is_valid(): Boolean {
      return new Boolean(
        this._date.is_valid().value && 
        this._time.is_valid().value
      );
    }
    ```

### 2.6. Comparison

-   **`less_than(other: Ordered): Boolean`**
-   **Pseudo-code:**
    ```typescript
    less_than(other: Ordered): Boolean {
      if (!(other instanceof Iso8601_date_time)) {
        throw new Error("Cannot compare with non-date-time");
      }
      
      // Compare dates first
      if (!this._date.is_equal(other._date).value) {
        return this._date.less_than(other._date);
      }
      
      // If dates equal, compare times
      return this._time.less_than(other._time);
    }
    ```

### 2.7. Conversion

-   **`to_unix_timestamp(): Integer`** - Convert to Unix timestamp (seconds since 1970-01-01T00:00:00Z)
-   **`to_iso_string(): String`** - Convert to full ISO 8601 string

## 3. Invariants

-   **Valid_date:** Date component is valid
-   **Valid_time:** Time component is valid
-   **Format_valid:** String representation matches ISO 8601 format

## 4. Pre-conditions

-   DateTime string must contain both date and time separated by 'T'.

## 5. Post-conditions

-   Date and time components properly parsed.
-   Comparison accounts for timezones.

## 6. Example Usage

```typescript
const dt1 = Iso8601_date_time.from("2024-03-15T14:30:45");
console.log(dt1.year().value);         // 2024
console.log(dt1.month().value);        // 3
console.log(dt1.day().value);          // 15
console.log(dt1.hour().value);         // 14
console.log(dt1.minute().value);       // 30
console.log(dt1.second().value);       // 45

const dt2 = Iso8601_date_time.from("2024-03-15T14:30:45.123Z");
console.log(dt2.fractional_second().value); // 0.123
console.log(dt2.timezone().value);     // "Z"

// Comparison
const dt3 = Iso8601_date_time.from("2024-03-15T10:00:00");
const dt4 = Iso8601_date_time.from("2024-03-15T14:00:00");
console.log(dt3.less_than(dt4));       // true

// With timezone
const dt5 = Iso8601_date_time.from("2024-03-15T14:00:00+01:00");
const dt6 = Iso8601_date_time.from("2024-03-15T13:00:00Z");
console.log(dt5.is_equal(dt6));        // true (same moment in time)
```

## 7. Test Cases

1. Test parsing full date-time
2. Test parsing with fractional seconds
3. Test parsing with timezone
4. Test component accessors (all parts)
5. Test date() and time() return proper objects
6. Test is_partial() with various formats
7. Test comparison without timezone
8. Test comparison with timezones (normalization)
9. Test is_valid() with valid/invalid components
10. Test to_unix_timestamp() conversion
11. Test parsing throws error without 'T' separator
12. Test partial date-times

## 8. References

-   [openEHR BASE - Iso8601_date_time](https://specifications.openehr.org/releases/BASE/latest/foundation_types.html#_iso8601_date_time_class)
-   [ISO 8601 Combined Date-Time](https://en.wikipedia.org/wiki/ISO_8601#Combined_date_and_time_representations)
