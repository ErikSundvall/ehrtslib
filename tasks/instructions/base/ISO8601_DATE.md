# Instruction: Implementing the `Iso8601_date` Class

## 1. Description

The `Iso8601_date` class represents dates in ISO 8601 format. It supports
partial dates (year only, year-month, or full date).

- **Format:** `YYYY[-MM[-DD]]`
- **Examples:** `"2024"`, `"2024-03"`, `"2024-03-15"`
- **Reference:**
  [openEHR BASE - Iso8601_date](https://specifications.openehr.org/releases/BASE/latest/foundation_types.html#_iso8601_date_class)

## 2. Behavior

### 2.1. Constructor and Parsing

- **Purpose:** Create and parse ISO 8601 date strings.
- **Pseudo-code:**
  ```typescript
  constructor() {
    super();
  }

  static from(dateStr: string): Iso8601_date {
    const date = new Iso8601_date();
    date.value = dateStr;
    date.parse(dateStr);
    return date;
  }

  private parse(dateStr: string): void {
    // Regex: YYYY or YYYY-MM or YYYY-MM-DD
    const pattern = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/;
    const match = dateStr.match(pattern);
    
    if (!match) {
      throw new Error("Invalid ISO 8601 date format");
    }
    
    this._year = parseInt(match[1]);
    this._month = match[2] ? parseInt(match[2]) : undefined;
    this._day = match[3] ? parseInt(match[3]) : undefined;
  }
  ```

### 2.2. Component Accessors

#### `year(): Integer`

- **Purpose:** Return the year component.
- **Pseudo-code:**
  ```typescript
  year(): Integer {
    return Integer.from(this._year);
  }
  ```

#### `month(): Integer`

- **Purpose:** Return the month component (1-12).
- **Returns:** undefined if not specified.
- **Pseudo-code:**
  ```typescript
  month(): Integer | undefined {
    return this._month ? Integer.from(this._month) : undefined;
  }
  ```

#### `day(): Integer`

- **Purpose:** Return the day component (1-31).
- **Returns:** undefined if not specified.
- **Pseudo-code:**
  ```typescript
  day(): Integer | undefined {
    return this._day ? Integer.from(this._day) : undefined;
  }
  ```

### 2.3. Precision Queries

#### `is_partial(): Boolean`

- **Purpose:** Check if date is partially specified.
- **Pseudo-code:**
  ```typescript
  is_partial(): Boolean {
    return new Boolean(this._month === undefined || this._day === undefined);
  }
  ```

#### `is_extended(): Boolean`

- **Purpose:** Check if date uses extended format (with hyphens).
- **Pseudo-code:**
  ```typescript
  is_extended(): Boolean {
    return new Boolean(this.value.includes('-'));
  }
  ```

### 2.4. Comparison

#### `less_than(other: Ordered): Boolean`

- **Purpose:** Compare dates chronologically.
- **Note:** Partial dates need careful comparison logic.
- **Pseudo-code:**
  ```typescript
  less_than(other: Ordered): Boolean {
    if (!(other instanceof Iso8601_date)) {
      throw new Error("Cannot compare with non-date");
    }
    
    // Compare year first
    if (this._year !== other._year) {
      return new Boolean(this._year < other._year);
    }
    
    // If years equal, compare months (treating undefined as earliest)
    const thisMonth = this._month ?? 0;
    const otherMonth = other._month ?? 0;
    if (thisMonth !== otherMonth) {
      return new Boolean(thisMonth < otherMonth);
    }
    
    // If months equal, compare days
    const thisDay = this._day ?? 0;
    const otherDay = other._day ?? 0;
    return new Boolean(thisDay < otherDay);
  }
  ```

### 2.5. Validation

#### `is_valid(): Boolean`

- **Purpose:** Check if date values are valid.
- **Pseudo-code:**
  ```typescript
  is_valid(): Boolean {
    if (this._year < 1 || this._year > 9999) {
      return new Boolean(false);
    }
    
    if (this._month !== undefined) {
      if (this._month < 1 || this._month > 12) {
        return new Boolean(false);
      }
    }
    
    if (this._day !== undefined) {
      if (this._month === undefined) {
        return new Boolean(false); // Can't have day without month
      }
      // Check day is valid for the month/year
      const daysInMonth = this.days_in_month(this._year, this._month);
      if (this._day < 1 || this._day > daysInMonth) {
        return new Boolean(false);
      }
    }
    
    return new Boolean(true);
  }

  private days_in_month(year: number, month: number): number {
    // Handle leap years and month lengths
    const daysPerMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (month === 2 && this.is_leap_year(year)) {
      return 29;
    }
    return daysPerMonth[month - 1];
  }

  private is_leap_year(year: number): boolean {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  }
  ```

## 3. Invariants

- **Year_valid:** `1 <= year <= 9999`
- **Month_valid:** `month = Void or (1 <= month <= 12)`
- **Day_valid:** `day = Void or valid for the given month/year`
- **Partial_date_valid:** If day is set, month must be set

## 4. Pre-conditions

- Date string must follow ISO 8601 format.
- Values must be within valid ranges.

## 5. Post-conditions

- Parsed components match the input string.
- is_valid() returns true for well-formed dates.

## 6. Example Usage

```typescript
const fullDate = Iso8601_date.from("2024-03-15");
console.log(fullDate.year().value); // 2024
console.log(fullDate.month().value); // 3
console.log(fullDate.day().value); // 15
console.log(fullDate.is_partial()); // false

const partialDate = Iso8601_date.from("2024-03");
console.log(partialDate.year().value); // 2024
console.log(partialDate.month().value); // 3
console.log(partialDate.day()); // undefined
console.log(partialDate.is_partial()); // true

const yearOnly = Iso8601_date.from("2024");
console.log(yearOnly.is_partial()); // true

// Comparison
const date1 = Iso8601_date.from("2024-01-15");
const date2 = Iso8601_date.from("2024-03-15");
console.log(date1.less_than(date2)); // true
```

## 7. Test Cases

Key test cases to implement:

1. Test parsing full date (YYYY-MM-DD)
2. Test parsing year-month date (YYYY-MM)
3. Test parsing year-only date (YYYY)
4. Test invalid format throws error
5. Test component accessors (year, month, day)
6. Test is_partial() for various formats
7. Test is_extended() detection
8. Test comparison of full dates
9. Test comparison of partial dates
10. Test is_valid() with valid and invalid dates
11. Test leap year handling
12. Test month length validation
13. Test invalid day for month (e.g., Feb 30)

## 8. References

- [openEHR BASE Specification - Iso8601_date](https://specifications.openehr.org/releases/BASE/latest/foundation_types.html#_iso8601_date_class)
- [ISO 8601 Date Format](https://en.wikipedia.org/wiki/ISO_8601)
- [Archie Iso8601_date Implementation](https://github.com/openEHR/archie/tree/master/openehr-rm/src/main/java/com/nedap/archie/rm/datavalues/quantity/datetime)
