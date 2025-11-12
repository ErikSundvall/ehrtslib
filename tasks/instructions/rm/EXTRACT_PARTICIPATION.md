# EXTRACT_PARTICIPATION

## Description

Participation information within an extract context.

**Specification Reference:** [openEHR RM Extract](https://specifications.openehr.org/releases/RM/latest/integration.html)

## Behavior

### Properties

- Similar to PARTICIPATION but adapted for extract context
- `performer`: PARTY_PROXY - Who participated
- `function`: DV_TEXT - Function performed
- `mode`: DV_CODED_TEXT (optional) - Mode of participation

## Example Usage

\`\`\`typescript
const participation = new EXTRACT_PARTICIPATION();
participation.performer = partyProxy;
participation.function = new DV_TEXT();
participation.function.value = "author";
\`\`\`

## Test Cases

1. **Performer required**: Must have performer
2. **Function**: Describes participation function
3. **Mode optional**: Participation mode
4. **Extract context**: Used in extract content

## References

- [openEHR RM Integration](https://specifications.openehr.org/releases/RM/latest/integration.html)
