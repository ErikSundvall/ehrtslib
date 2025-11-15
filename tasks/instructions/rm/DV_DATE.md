# Instruction: Implementing the `DV_DATE` Class

## 1. Description

The `DV_DATE` class represents date values in ISO 8601 format, supporting
partial dates.

- **Reference:**
  [openEHR RM - DV_DATE](https://specifications.openehr.org/releases/RM/latest/data_types.html#_dv_date_class)

## 2. Behavior

### 2.1. Properties

- `value: String` - ISO 8601 date (YYYY-MM-DD, YYYY-MM, or YYYY)

### 2.2. Factory Methods

```typescript
static from(isoString: string): DV_DATE {
  const dv = new DV_DATE();
  dv.value = isoString;
  return dv;
}

static today(): DV_DATE {
  const today = new Date().toISOString().split('T')[0];
  return DV_DATE.from(today);
}
```

### 2.3. Accessor Methods

- `year(): Integer`
- `month(): Integer | undefined` (for partial dates)
- `day(): Integer | undefined` (for partial dates)

## 3. Example Usage

```typescript
const birthDate = DV_DATE.from("1990-05-15");
const yearOnly = DV_DATE.from("1990");
const today = DV_DATE.today();
```

## 4. References

- **Official Specification:**
  [openEHR RM - DV_DATE](https://specifications.openehr.org/releases/RM/latest/data_types.html#_dv_date_class)
