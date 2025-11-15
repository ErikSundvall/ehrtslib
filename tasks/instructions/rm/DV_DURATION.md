# Instruction: Implementing the `DV_DURATION` Class

## 1. Description

The `DV_DURATION` class represents time durations in ISO 8601 format.

- **Reference:**
  [openEHR RM - DV_DURATION](https://specifications.openehr.org/releases/RM/latest/data_types.html#_dv_duration_class)

## 2. Behavior

### 2.1. Properties

- `value: String` - ISO 8601 duration (P[n]Y[n]M[n]DT[n]H[n]M[n]S)

### 2.2. Factory Methods

```typescript
static from(isoString: string): DV_DURATION {
  const dv = new DV_DURATION();
  dv.value = isoString;
  return dv;
}
```

## 3. Example Usage

```typescript
const threeMonths = DV_DURATION.from("P3M");
const twoHours = DV_DURATION.from("PT2H");
const complex = DV_DURATION.from("P1Y2M3DT4H30M15S");
```

## 4. References

- **Official Specification:**
  [openEHR RM - DV_DURATION](https://specifications.openehr.org/releases/RM/latest/data_types.html#_dv_duration_class)
