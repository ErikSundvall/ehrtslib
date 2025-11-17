# Instruction: Implementing the `Iso8601_timezone` Class

## 1. Description

The `Iso8601_timezone` class represents timezone information in ISO 8601 format.

- **Format:** `Z` or `±hh[:mm]`
- **Examples:** `"Z"`, `"+01:00"`, `"-05:30"`
- **Reference:**
  [openEHR BASE - Iso8601_timezone](https://specifications.openehr.org/releases/BASE/latest/foundation_types.html#_iso8601_timezone_class)

## 2. Behavior

### 2.1. Parsing

- **`is_utc(): Boolean`** - Check if "Z" (UTC)
- **`hour(): Integer`** - Returns offset hours
- **`minute(): Integer`** - Returns offset minutes
- **`sign(): Integer`** - Returns +1 or -1

## 3. Example Usage

```typescript
const tz1 = Iso8601_timezone.from("Z");
console.log(tz1.is_utc()); // true

const tz2 = Iso8601_timezone.from("+01:00");
console.log(tz2.hour().value); // 1
console.log(tz2.sign().value); // 1
```

## 4. References

- [openEHR BASE - Iso8601_timezone](https://specifications.openehr.org/releases/BASE/latest/foundation_types.html#_iso8601_timezone_class)
