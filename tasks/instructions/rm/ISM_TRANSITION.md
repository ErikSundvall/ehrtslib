# Instruction: Implementing the `ISM_TRANSITION` Class

## 1. Description

ISM_TRANSITION represents a workflow step in the Instruction State Machine.

-   **Reference:** [openEHR RM - ISM_TRANSITION](https://specifications.openehr.org/releases/RM/latest/ehr.html#_ism_transition_class)

## 2. Behavior

- `current_state: DV_CODED_TEXT` - Current ISM state
- `transition: DV_CODED_TEXT` - Transition performed
- `careflow_step: DV_CODED_TEXT` - Application-specific step

### 2.2. ISM States

Standard states: planned, scheduled, active, suspended, cancelled, completed, aborted

## 3. Example Usage

```typescript
const transition = new ISM_TRANSITION();
transition.current_state = DV_CODED_TEXT.from("completed", CODE_PHRASE.from("532", "openehr"));
```

## 4. References

-   **Official Specification:** [openEHR RM - ISM_TRANSITION](https://specifications.openehr.org/releases/RM/latest/ehr.html#_ism_transition_class)
