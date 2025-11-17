# Instruction: Implementing the `DV_DATE_TIME` Class

## 1. Description

The `DV_DATE_TIME` class represents date and time values. It extends
`DV_TEMPORAL` and uses ISO 8601 format.

- **Reference:**
  [openEHR RM - DV_DATE_TIME](https://specifications.openehr.org/releases/RM/latest/data_types.html#_dv_date_time_class)

## 2. Behavior

### 2.1. Properties

#### `value: String`

- **Purpose:** ISO 8601 date-time string.
- **Format:** `YYYY-MM-DDThh:mm:ss[.sss][Z|±hh:mm]`
- **Examples:** "2024-03-15T14:30:00", "2024-03-15T14:30:00.123Z",
  "2024-03-15T14:30:00+01:00"

### 2.2. Factory Methods

```typescript
static from(isoString: string): DV_DATE_TIME {
  const dv = new DV_DATE_TIME();
  dv.value = isoString;
  return dv;
}

static now(): DV_DATE_TIME {
  const now = new Date().toISOString();
  return DV_DATE_TIME.from(now);
}
```

### 2.3. Accessor Methods

```typescript
year(): Integer { /* extract year */ }
month(): Integer { /* extract month */ }
day(): Integer { /* extract day */ }
hour(): Integer { /* extract hour */ }
minute(): Integer { /* extract minute */ }
second(): Integer { /* extract second */ }
timezone(): String { /* extract timezone */ }
```

### 2.4. Comparison

```typescript
less_than(other: DV_DATE_TIME): Boolean {
  // Compare normalized to UTC
  const thisMs = this.to_milliseconds();
  const otherMs = other.to_milliseconds();
  return new Boolean(thisMs < otherMs);
}
```

## 3. Invariants

- **Value_valid:** `value /= Void and then valid_iso8601_date_time(value)`

## 4. Example Usage

```typescript
// Current time
const now = DV_DATE_TIME.now();

// Specific date-time
const appointment = DV_DATE_TIME.from("2024-06-15T10:00:00");

// With timezone
const eventTime = DV_DATE_TIME.from("2024-06-15T10:00:00+02:00");

// Comparison
if (appointment.less_than(now)) {
  console.log("Appointment is in the past");
}

// Extract components
console.log(appointment.year().value); // 2024
console.log(appointment.month().value); // 6
console.log(appointment.day().value); // 15
console.log(appointment.hour().value); // 10
```

## 5. Test Cases

1. Test creation with valid ISO string
2. Test now() returns current time
3. Test component extraction (year, month, day, etc.)
4. Test with fractional seconds
5. Test with timezone
6. Test comparison (less_than)
7. Test invalid format throws error
8. Test timezone normalization for comparison

## 6. References

- [openEHR RM - DV_DATE_TIME](https://specifications.openehr.org/releases/RM/latest/data_types.html#_dv_date_time_class)
- [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601)
- [Archie DV_DATE_TIME](https://github.com/openEHR/archie/blob/master/openehr-rm/src/main/java/com/nedap/archie/rm/datavalues/quantity/datetime/DvDateTime.java)
