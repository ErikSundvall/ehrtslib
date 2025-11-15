# Instruction: Implementing the `PARTICIPATION` Class

## 1. Description

PARTICIPATION records participation of a party in an activity.

- **Reference:**
  [openEHR RM - PARTICIPATION](https://specifications.openehr.org/releases/RM/latest/common.html#_participation_class)

## 2. Behavior

- `performer: PARTY_PROXY` - Who participated
- `function: DV_TEXT` - Role in the activity
- `mode: DV_CODED_TEXT` - How they participated
- `time: DV_INTERVAL<DV_DATE_TIME>` - When

## 3. Example Usage

```typescript
const participation = new PARTICIPATION();
participation.performer = new PARTY_IDENTIFIED();
participation.performer.name = "Nurse Smith";
participation.function = DV_TEXT.from("Assistant");
```

## 4. References

- **Official Specification:**
  [openEHR RM - PARTICIPATION](https://specifications.openehr.org/releases/RM/latest/common.html#_participation_class)
