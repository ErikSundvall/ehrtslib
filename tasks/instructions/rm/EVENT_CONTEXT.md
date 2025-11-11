# Instruction: Implementing the `EVENT_CONTEXT` Class

## 1. Description

EVENT_CONTEXT provides clinical session context for event COMPOSITIONS.

-   **Reference:** [openEHR RM - EVENT_CONTEXT](https://specifications.openehr.org/releases/RM/latest/ehr.html#_event_context_class)

## 2. Behavior

- `start_time: DV_DATE_TIME` - Start of clinical session
- `end_time: DV_DATE_TIME` - End of session
- `location: String` - Where session occurred
- `setting: DV_CODED_TEXT` - Care setting (primary care, hospital, etc.)
- `participations: List<PARTICIPATION>` - Other participants
- `health_care_facility: PARTY_IDENTIFIED` - Institution
- `other_context: ITEM_STRUCTURE` - Other context data

## 3. Example Usage

```typescript
const context = new EVENT_CONTEXT();
context.start_time = DV_DATE_TIME.from("2024-03-15T09:00:00");
context.setting = DV_CODED_TEXT.from("emergency care", CODE_PHRASE.from("227", "openehr"));
context.location = "Emergency Department";
```

## 4. References

-   **Official Specification:** [openEHR RM - EVENT_CONTEXT](https://specifications.openehr.org/releases/RM/latest/ehr.html#_event_context_class)
