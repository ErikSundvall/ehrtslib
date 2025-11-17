# Instruction: Implementing the `DV_STATE` Class

## 1. Description

DV_STATE represents a state value from a state machine.

- **Reference:**
  [openEHR RM - DV_STATE](https://specifications.openehr.org/releases/RM/latest/data_types.html#_dv_state_class)

## 2. Behavior

### 2.1. Properties

- `value: DV_CODED_TEXT` - Current state
- `is_terminal: Boolean` - Whether this is a terminal state

## 3. Example Usage

```typescript
const state = new DV_STATE();
state.value = new DV_CODED_TEXT("completed", "instruction_states::532");
state.is_terminal = Boolean.from(true);
```

## 4. References

- **Official Specification:**
  [openEHR RM - DV_STATE](https://specifications.openehr.org/releases/RM/latest/data_types.html#_dv_state_class)
