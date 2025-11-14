# Instruction: Implementing the `DV_GENERAL_TIME_SPECIFICATION` Class

## 1. Description

DV_GENERAL_TIME_SPECIFICATION represents a general specification of timing.

- **Reference:**
  [openEHR RM - DV_GENERAL_TIME_SPECIFICATION](https://specifications.openehr.org/releases/RM/latest/data_types.html#_dv_general_time_specification_class)

## 2. Behavior

### 2.1. Properties

- `value: DV_PARSABLE` - Time specification in formal notation

## 3. Example Usage

```typescript
const timeSpec = new DV_GENERAL_TIME_SPECIFICATION();
timeSpec.value = new DV_PARSABLE();
timeSpec.value.value = "daily at 08:00";
timeSpec.value.formalism = "HL7:GTS";
```

## 4. References

- **Official Specification:**
  [openEHR RM - DV_GENERAL_TIME_SPECIFICATION](https://specifications.openehr.org/releases/RM/latest/data_types.html#_dv_general_time_specification_class)
