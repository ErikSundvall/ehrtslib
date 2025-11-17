# Instruction: Implementing the `Iso8601_time` Class

## 1. Description

The `Iso8601_time` class represents times in ISO 8601 format. It supports
partial times and optional timezone.

- **Format:** `hh[:mm[:ss[.sss]]][Z|±hh[:mm]]`
- **Examples:** `"14:30"`, `"14:30:45"`, `"14:30:45.123"`, `"14:30:45Z"`,
  `"14:30:45+01:00"`
- **Reference:**
  [openEHR BASE - Iso8601_time](https://specifications.openehr.org/releases/BASE/latest/foundation_types.html#_iso8601_time_class)

## 2. Behavior

### 2.1. Constructor and Parsing

- **Pseudo-code:**
  ```typescript
  static from(timeStr: string): Iso8601_time {
    const time = new Iso8601_time();
    time.value = timeStr;
    time.parse(timeStr);
    return time;
  }

  private parse(timeStr: string): void {
    // Regex for hh:mm:ss.sss with optional timezone
    const pattern = /^(\d{2})(?::(\d{2})(?::(\d{2})(?:\.(\d+))?)?)?([Z]|[+-]\d{2}(?::\d{2})?)?$/;
    const match = timeStr.match(pattern);
    
    if (!match) {
      throw new Error("Invalid ISO 8601 time format");
    }
    
    this._hour = parseInt(match[1]);
    this._minute = match[2] ? parseInt(match[2]) : undefined;
    this._second = match[3] ? parseInt(match[3]) : undefined;
    this._fractional_second = match[4] ? parseFloat("0." + match[4]) : undefined;
    this._timezone = match[5] || undefined;
  }
  ```

### 2.2. Component Accessors

- **`hour(): Integer`** - Returns hour (0-23)
- **`minute(): Integer | undefined`** - Returns minute (0-59)
- **`second(): Integer | undefined`** - Returns second (0-59)
- **`fractional_second(): Real | undefined`** - Returns fractional part
- **`timezone(): String | undefined`** - Returns timezone string

### 2.3. Precision Queries

- **`is_partial(): Boolean`** - True if components are missing
- **`has_fractional_second(): Boolean`** - True if fractional seconds present
- **`is_extended(): Boolean`** - True if uses colon separators

### 2.4. Validation

- **`is_valid(): Boolean`** - Validates time components
  - Hour: 0-23
  - Minute: 0-59
  - Second: 0-59 (or 60 for leap seconds)
  - Fractional second: 0.0 <= fs < 1.0
  - Timezone format valid

### 2.5. Comparison

- **Purpose:** Compare times considering timezone
- **Note:** Must normalize to UTC for accurate comparison
- **Pseudo-code:**
  ```typescript
  less_than(other: Ordered): Boolean {
    if (!(other instanceof Iso8601_time)) {
      throw new Error("Cannot compare with non-time");
    }
    
    // Convert both to total seconds (normalized to UTC if timezone present)
    const thisSeconds = this.to_seconds();
    const otherSeconds = other.to_seconds();
    
    return new Boolean(thisSeconds < otherSeconds);
  }

  private to_seconds(): number {
    let seconds = this._hour * 3600;
    seconds += (this._minute ?? 0) * 60;
    seconds += (this._second ?? 0);
    seconds += (this._fractional_second ?? 0);
    
    // Adjust for timezone
    if (this._timezone && this._timezone !== 'Z') {
      seconds -= this.timezone_offset_seconds();
    }
    
    return seconds;
  }
  ```

## 3. Invariants

- **Hour_valid:** `0 <= hour <= 23`
- **Minute_valid:** `minute = Void or (0 <= minute <= 59)`
- **Second_valid:** `second = Void or (0 <= second <= 60)` (60 for leap second)
- **Fractional_valid:**
  `fractional_second = Void or (0.0 <= fractional_second < 1.0)`

## 4. Pre-conditions

- Time string must follow ISO 8601 format.

## 5. Post-conditions

- Parsed components match input string.
- is_valid() returns true for well-formed times.

## 6. Example Usage

```typescript
const time1 = Iso8601_time.from("14:30:45");
console.log(time1.hour().value); // 14
console.log(time1.minute().value); // 30
console.log(time1.second().value); // 45

const time2 = Iso8601_time.from("14:30:45.123");
console.log(time2.fractional_second().value); // 0.123

const time3 = Iso8601_time.from("14:30:45Z");
console.log(time3.timezone().value); // "Z"

const time4 = Iso8601_time.from("14:30:45+01:00");
console.log(time4.timezone().value); // "+01:00"
```

## 7. Test Cases

1. Test parsing full time (hh:mm:ss)
2. Test parsing with fractional seconds
3. Test parsing with timezone (Z and ±hh:mm)
4. Test parsing partial times (hh, hh:mm)
5. Test component accessors
6. Test is_partial()
7. Test has_fractional_second()
8. Test comparison with and without timezones
9. Test validation with invalid values
10. Test leap second (second = 60)

## 8. References

- [openEHR BASE - Iso8601_time](https://specifications.openehr.org/releases/BASE/latest/foundation_types.html#_iso8601_time_class)
- [ISO 8601 Time Format](https://en.wikipedia.org/wiki/ISO_8601#Times)
