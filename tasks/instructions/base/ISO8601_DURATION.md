# Instruction: Implementing the `Iso8601_duration` Class

## 1. Description

The `Iso8601_duration` class represents time durations in ISO 8601 format.

-   **Format:** `P[nY][nM][nD][T[nH][nM][nS]]` or `P[n]W`
-   **Examples:** `"P1Y2M3D"`, `"PT4H30M"`, `"P3W"`, `"P1Y2M3DT4H30M15S"`
-   **Reference:** [openEHR BASE - Iso8601_duration](https://specifications.openehr.org/releases/BASE/latest/foundation_types.html#_iso8601_duration_class)

## 2. Behavior

### 2.1. Constructor and Parsing

-   **Pseudo-code:**
    ```typescript
    static from(durationStr: string): Iso8601_duration {
      const dur = new Iso8601_duration();
      dur.value = durationStr;
      dur.parse(durationStr);
      return dur;
    }
    
    private parse(durationStr: string): void {
      if (!durationStr.startsWith('P')) {
        throw new Error("Duration must start with 'P'");
      }
      
      // Week format: P[n]W
      const weekMatch = durationStr.match(/^P(\d+)W$/);
      if (weekMatch) {
        this._weeks = parseInt(weekMatch[1]);
        return;
      }
      
      // Full format: P[nY][nM][nD][T[nH][nM][nS]]
      const pattern = /^P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/;
      const match = durationStr.match(pattern);
      
      if (!match) {
        throw new Error("Invalid ISO 8601 duration format");
      }
      
      this._years = match[1] ? parseInt(match[1]) : 0;
      this._months = match[2] ? parseInt(match[2]) : 0;
      this._days = match[3] ? parseInt(match[3]) : 0;
      this._hours = match[4] ? parseInt(match[4]) : 0;
      this._minutes = match[5] ? parseInt(match[5]) : 0;
      this._seconds = match[6] ? parseFloat(match[6]) : 0;
    }
    ```

### 2.2. Component Accessors

-   **`years(): Integer`** - Returns years component
-   **`months(): Integer`** - Returns months component
-   **`days(): Integer`** - Returns days component (or days from weeks)
-   **`hours(): Integer`** - Returns hours component
-   **`minutes(): Integer`** - Returns minutes component
-   **`seconds(): Real`** - Returns seconds (may be fractional)
-   **`weeks(): Integer`** - Returns weeks component (if week format)

### 2.3. Conversion

#### `to_seconds(): Real`

-   **Purpose:** Convert duration to total seconds (approximate for years/months).
-   **Note:** Years and months have variable lengths, so conversion is approximate.
-   **Pseudo-code:**
    ```typescript
    to_seconds(): Real {
      let seconds = 0;
      
      // Approximate conversions
      seconds += this._years * 365.25 * 24 * 3600;  // Account for leap years
      seconds += this._months * 30.44 * 24 * 3600;  // Average month length
      seconds += this._days * 24 * 3600;
      seconds += this._weeks * 7 * 24 * 3600;
      seconds += this._hours * 3600;
      seconds += this._minutes * 60;
      seconds += this._seconds;
      
      return Real.from(seconds);
    }
    ```

### 2.4. Arithmetic

#### `add(other: Iso8601_duration): Iso8601_duration`

-   **Purpose:** Add two durations.
-   **Pseudo-code:**
    ```typescript
    add(other: Iso8601_duration): Iso8601_duration {
      // Create new duration with sum of components
      const result = new Iso8601_duration();
      result._years = this._years + other._years;
      result._months = this._months + other._months;
      result._days = this._days + other._days;
      result._hours = this._hours + other._hours;
      result._minutes = this._minutes + other._minutes;
      result._seconds = this._seconds + other._seconds;
      
      // Rebuild value string
      result.value = result.to_string();
      return result;
    }
    ```

#### `subtract(other: Iso8601_duration): Iso8601_duration`

-   **Purpose:** Subtract one duration from another.

### 2.5. Comparison

-   **`less_than(other: Ordered): Boolean`**
-   **Note:** Compare by converting to seconds (approximate for Y/M).

### 2.6. Validation

-   **`is_valid(): Boolean`** - Check all components are non-negative

## 3. Invariants

-   **Positive_values:** All components >= 0
-   **Weeks_exclusive:** Week format exclusive of Y/M/D/H/M/S format

## 4. Pre-conditions

-   Duration string must follow ISO 8601 format.

## 5. Post-conditions

-   Components sum correctly.
-   to_seconds() provides reasonable approximation.

## 6. Example Usage

```typescript
const dur1 = Iso8601_duration.from("P1Y2M3D");
console.log(dur1.years().value);   // 1
console.log(dur1.months().value);  // 2
console.log(dur1.days().value);    // 3

const dur2 = Iso8601_duration.from("PT4H30M15S");
console.log(dur2.hours().value);   // 4
console.log(dur2.minutes().value); // 30
console.log(dur2.seconds().value); // 15

const dur3 = Iso8601_duration.from("P3W");
console.log(dur3.weeks().value);   // 3
console.log(dur3.days().value);    // 21

// Arithmetic
const dur4 = dur1.add(dur2);
console.log(dur4.to_seconds().value); // Total seconds

// Comparison
console.log(dur2.less_than(dur1)); // Depends on conversion
```

## 7. Test Cases

1. Test parsing date-only duration (P1Y2M3D)
2. Test parsing time-only duration (PT4H30M15S)
3. Test parsing combined duration
4. Test parsing week format (P3W)
5. Test parsing with fractional seconds
6. Test component accessors
7. Test to_seconds() conversion
8. Test add operation
9. Test subtract operation
10. Test comparison
11. Test validation with negative values
12. Test invalid formats throw errors

## 8. References

-   [openEHR BASE - Iso8601_duration](https://specifications.openehr.org/releases/BASE/latest/foundation_types.html#_iso8601_duration_class)
-   [ISO 8601 Duration](https://en.wikipedia.org/wiki/ISO_8601#Durations)
