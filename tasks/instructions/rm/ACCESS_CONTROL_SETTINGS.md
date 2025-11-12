# ACCESS_CONTROL_SETTINGS

## Description

Class containing access control settings for EHR information.

**Specification Reference:** [openEHR RM EHR](https://specifications.openehr.org/releases/RM/latest/ehr.html)

## Behavior

### Properties

- `property`: DV_CODED_TEXT - The property being controlled
- `value`: DV_TEXT - The access control value/rule

## Invariants

- `Property_valid`: property /= Void
- `Value_valid`: value /= Void

## Example Usage

\`\`\`typescript
const setting = new ACCESS_CONTROL_SETTINGS();
setting.property = new DV_CODED_TEXT();
setting.property.value = "read_access";
setting.value = new DV_TEXT();
setting.value.value = "restricted";
\`\`\`

## Test Cases

1. **Property required**: Must have property
2. **Value required**: Must have value
3. **Multiple settings**: Can have multiple access settings
4. **EHR integration**: Used in EHR_ACCESS

## References

- [openEHR RM EHR Specification](https://specifications.openehr.org/releases/RM/latest/ehr.html)
