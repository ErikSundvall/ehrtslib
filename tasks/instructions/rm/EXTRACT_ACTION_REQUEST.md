# EXTRACT_ACTION_REQUEST

## Description

Request for action related to an extract (e.g., update, delete).

**Specification Reference:** [openEHR RM Extract](https://specifications.openehr.org/releases/RM/latest/integration.html)

## Behavior

### Properties

- `action`: DV_CODED_TEXT - The requested action
- `target`: OBJECT_REF - Target of the action

## Invariants

- `Action_valid`: action /= Void
- `Target_valid`: target /= Void

## Example Usage

\`\`\`typescript
const actionRequest = new EXTRACT_ACTION_REQUEST();
actionRequest.action = new DV_CODED_TEXT();
actionRequest.action.value = "update";
actionRequest.target = objectRef;
\`\`\`

## Test Cases

1. **Action required**: Must specify action
2. **Target required**: Must have target
3. **Action types**: Support various actions
4. **Extract workflow**: Used in extract processing

## References

- [openEHR RM Integration](https://specifications.openehr.org/releases/RM/latest/integration.html)
