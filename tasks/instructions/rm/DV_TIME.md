# Instruction: Implementing the `DV_TIME` Class

## 1. Description

The `DV_TIME` class represents time values in ISO 8601 format.

- **Reference:**
  [openEHR RM - DV_TIME](https://specifications.openehr.org/releases/RM/latest/data_types.html#_dv_time_class)

## 2. Behavior

### 2.1. Properties

- `value: String` - ISO 8601 time (hh:mm:ss[.sss][Z|±hh:mm])

### 2.2. Factory Methods

```typescript
static from(isoString: string): DV_TIME {
  const dv = new DV_TIME();
  dv.value = isoString;
  return dv;
}

static now(): DV_TIME {
  const time = new Date().toISOString().split('T')[1];
  return DV_TIME.from(time);
}
```

## 3. Example Usage

```typescript
const appointmentTime = DV_TIME.from("14:30:00");
const preciseTime = DV_TIME.from("14:30:45.123");
const currentTime = DV_TIME.now();
```

## 4. References

- **Official Specification:**
  [openEHR RM - DV_TIME](https://specifications.openehr.org/releases/RM/latest/data_types.html#_dv_time_class)
